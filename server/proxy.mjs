// LLMers correction server.
//   POST /check    -> Jev (TypeSafe System One) grades a learner's Dutch answer
//   GET  /health
// No generative model at runtime: Jev also picks which of the lesson's authored mistakes the learner made
// and which word is wrong, so every explanation shown comes from the lesson itself.
// Key comes from the environment (TYPESAFE_API_KEY). Requests are schema-locked,
// size-capped and rate-limited per IP and per day, so the endpoint can only grade Dutch answers.
import http from 'node:http';

const PORT = Number(process.env.PORT || 8796);
const JEV_KEY = process.env.TYPESAFE_API_KEY;
const ORIGINS = [/^https:\/\/dkealvaro\.github\.io$/, /^https:\/\/(www\.)?llmers\.es$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];

const LIMITS = {
  check: { perMin: 40, perDay: 1500, global: 40000 },
};

const buckets = new Map(); // ip|route -> { min, minStart, day, dayKey }
const global = { day: '', check: 0 };
const stats = { check: 0, errors: 0, limited: 0 };

function dayKey() {
  return new Date().toISOString().slice(0, 10);
}

function allow(ip, route) {
  const lim = LIMITS[route];
  const dk = dayKey();
  if (global.day !== dk) Object.assign(global, { day: dk, check: 0 });
  if (global[route] >= lim.global) return false;
  const k = `${ip}|${route}`;
  const now = Date.now();
  let b = buckets.get(k);
  if (!b || b.dayKey !== dk) b = { min: 0, minStart: now, day: 0, dayKey: dk };
  if (now - b.minStart > 60000) Object.assign(b, { min: 0, minStart: now });
  if (b.min >= lim.perMin || b.day >= lim.perDay) return false;
  b.min++;
  b.day++;
  buckets.set(k, b);
  global[route]++;
  return true;
}

setInterval(() => {
  const dk = dayKey();
  for (const [k, b] of buckets) if (b.dayKey !== dk) buckets.delete(k);
}, 3600000).unref();

const str = (v, max) => (typeof v === 'string' ? v.slice(0, max).trim() : '');

function parseBody(raw) {
  const b = JSON.parse(raw);
  const kind = ['translate', 'reply', 'roleplay'].includes(b.kind) ? b.kind : 'translate';
  const references = (Array.isArray(b.references) ? b.references : []).slice(0, 6).map((r) => str(r, 300)).filter(Boolean);
  const answer = str(b.answer, 400);
  const task = str(b.task, 500);
  if (!answer || !task) throw new Error('answer and task are required');
  const mistakes = (Array.isArray(b.mistakes) ? b.mistakes : [])
    .slice(0, 6)
    .map((m) => ({ id: str(m?.id, 12).replace(/[^\w-]/g, ''), pattern: str(m?.pattern, 240) }))
    .filter((m) => m.id && m.pattern && m.id !== 'other' && m.id !== 'none');
  return { kind, references, answer, task, context: str(b.context, 500), mistakes };
}

const ERRORS = {
  none: 'No mistake',
  spelling: 'Spelling or typo in a Dutch word',
  word_order: 'Words in the wrong order (verb position, inversion, verbs at the end)',
  verb_form: 'Wrong verb form, conjugation or participle',
  article: 'Wrong or missing article (de/het/een) or wrong noun form or plural',
  negation: 'Wrong negation (niet vs geen, or its position)',
  auxiliary: 'Wrong auxiliary verb (hebben vs zijn)',
  wrong_word: 'Uses a wrong word or a word with the wrong meaning',
  missing: 'Leaves out a required word or part of the meaning',
  not_dutch: 'Not written in Dutch (English or another language)',
  off_task: 'Correct Dutch but does not do what the task asks',
  other: 'Another grammar mistake',
};

async function jev(b) {
  const free = b.kind !== 'translate';
  const context =
    'A beginner (CEFR A1-A2) is learning Dutch. `task` is what they were asked to do. `references` are correct model answers, ' +
    'but other wordings with the same meaning are also correct' +
    (free ? ', and for free replies any natural Dutch answer that does what the task asks is correct' : '') +
    '. `answer` is what the learner typed. Ignore capital letters and final punctuation. Both formal (u) and informal (je) are fine unless the task says otherwise.';
  const questions = {
    correct: {
      type: 'noul',
      instructions: free
        ? 'Is `answer` a correct Dutch reply (grammar and spelling right) that does what `task` asks?'
        : 'Is `answer` a fully correct Dutch response to `task` (grammar, spelling and meaning all right)?',
    },
    meaning: {
      type: 'noul',
      instructions: free
        ? 'Does `answer` do what `task` asks, even if it has small mistakes?'
        : 'Does `answer` express the same meaning as `references`, even if worded differently or with small mistakes?',
    },
    order: {
      type: 'noul',
      instructions:
        'Read `answer` as the same kind of sentence as the references (a statement stays a statement, a question stays a question). Are all its words in an order a native speaker would use for that meaning?',
    },
    typo_only: {
      type: 'noul',
      instructions: 'Are the only problems in `answer` tiny typos (one or two letters, a missing accent) while every word and the grammar are right?',
    },
    error: { type: 'choice', instructions: 'What is the main mistake in `answer`?', criteria: ERRORS },
  };
  // One yes/no question per mistake the lesson predicted for this exercise: far more sensitive than the
  // overall `correct` question (Jev passes 'Ik heb naar huis gegaan' as correct, but flags m1 'hebben with gaan').
  for (const m of b.mistakes) questions[`m_${m.id}`] = { type: 'noul', instructions: `Does \`answer\` make this specific mistake: ${m.pattern}` };
  const words = b.answer.split(/\s+/).filter(Boolean).slice(0, 24);
  if (words.length > 1) {
    const criteria = {};
    words.forEach((w, i) => (criteria[`w${i}`] = `Word ${i + 1}: "${w.replace(/[.,!?;:]+$/, '')}"`));
    criteria.none = 'No single word is wrong (the answer is correct, or the problem is word order or a missing word)';
    questions.word = { type: 'choice', instructions: 'Which word in `answer` is wrong (misspelled, wrong form or wrong word)?', criteria };
  }
  const state = { context, task: b.task, references: b.references.length ? b.references : '(none)', answer: b.answer };
  if (b.context) state.situation = b.context;
  const r = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${JEV_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'jev-latest', state, questions }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`jev ${r.status}`);
  const a = (await r.json()).answers;
  const correct = a.correct.noul;
  const meaning = a.meaning.noul;
  const typo = a.typo_only.noul;
  let error = a.error.choice;
  const order = a.order.noul;
  const hits = b.mistakes.map((m) => ({ id: m.id, p: a[`m_${m.id}`]?.noul ?? 0 })).sort((x, y) => y.p - x.p);
  const fired = hits.find((h) => h.p >= 0.5);
  let verdict;
  if (fired) {
    // The learner made a mistake the lesson predicted. Only a pure spelling slip still counts as "almost".
    verdict = error === 'spelling' && typo >= 0.6 && meaning >= 0.6 ? 'typo' : 'wrong';
  } else if (correct >= 0.5 && order >= 0.5) verdict = 'correct';
  else if (correct >= 0.5) {
    verdict = 'wrong';
    error = 'word_order';
  } else if (typo >= 0.6 && meaning >= 0.6) verdict = 'typo';
  else verdict = 'wrong';
  if (verdict === 'correct') error = 'none';
  else if (verdict === 'typo') error = 'spelling';
  else if (error === 'none') error = 'other';
  const out = { verdict, error, confidence: Math.round(correct * 100) / 100, scores: { correct, meaning, typo, order } };
  if (verdict !== 'correct' && hits[0] && hits[0].p >= 0.35) out.mistake = hits[0].id;
  if (verdict !== 'correct' && a.word && a.word.choice !== 'none' && a.word.confidence >= 0.35) out.word = Number(a.word.choice.slice(1));
  return out;
}

function send(res, code, obj, origin) {
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(code, headers);
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const o = req.headers.origin;
  const origin = o && ORIGINS.some((re) => re.test(o)) ? o : null;
  if (req.method === 'OPTIONS') {
    res.writeHead(origin ? 204 : 403, origin
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, GET', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
      : {});
    return res.end();
  }
  const url = req.url.split('?')[0];
  if (req.method === 'GET' && url === '/health') return send(res, 200, { ok: true, stats }, origin);
  if (req.method !== 'POST' || url !== '/check') return send(res, 404, { error: 'not found' }, origin);
  if (o && !origin) return send(res, 403, { error: 'origin not allowed' }, null);
  const route = url.slice(1);
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  let raw = '';
  req.on('data', (c) => {
    raw += c;
    if (raw.length > 6000) req.destroy();
  });
  req.on('end', async () => {
    let body;
    try {
      body = parseBody(raw);
    } catch (e) {
      return send(res, 400, { error: String(e.message || e) }, origin);
    }
    if (!allow(ip, route)) {
      stats.limited++;
      return send(res, 429, { error: 'Too many requests, slow down a little.' }, origin);
    }
    try {
      const out = await jev(body);
      stats[route]++;
      send(res, 200, out, origin);
    } catch (e) {
      stats.errors++;
      console.error(new Date().toISOString(), route, String(e.message || e));
      send(res, 502, { error: 'upstream error' }, origin);
    }
  });
});

server.listen(PORT, '127.0.0.1', () => console.log(`llmers proxy on 127.0.0.1:${PORT}`));
