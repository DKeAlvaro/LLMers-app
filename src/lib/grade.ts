// Answer checking. Exact items (build, gap, listen) are checked locally.
// Free answers (translate, reply, roleplay) are checked locally first and then by Jev (TypeSafe)
// through the LLMers correction server. Jev also picks which of the lesson's authored mistakes the
// learner made and which word is wrong, so all explanations come from the lesson itself.
import { closest, loose, norm } from './text';
import type { Mistake } from './types';

export const API: string = import.meta.env.VITE_API || 'https://llmers.5.175.211.104.sslip.io';

export type ErrorKind =
  | 'none'
  | 'spelling'
  | 'word_order'
  | 'verb_form'
  | 'article'
  | 'negation'
  | 'auxiliary'
  | 'wrong_word'
  | 'missing'
  | 'not_dutch'
  | 'off_task'
  | 'other';

export interface Verdict {
  ok: boolean;
  level: 'correct' | 'typo' | 'wrong';
  best: string;
  error?: ErrorKind;
  source: 'local' | 'jev' | 'offline';
  confidence?: number;
  mistake?: Mistake;
  word?: number;
}

export const ERROR_TEXT: Record<ErrorKind, { title: string; body: string }> = {
  none: { title: 'Correct', body: '' },
  spelling: { title: 'Spelling', body: 'Almost there: one of the words is spelled differently.' },
  word_order: { title: 'Word order', body: 'The words are right, but some are in the wrong place. Compare with the correct answer.' },
  verb_form: { title: 'Verb form', body: 'Check the form of the verb: it has to match the person (ik, jij, hij...) and the tense.' },
  article: { title: 'Article or noun', body: 'Check de / het / een and the noun form (singular or plural).' },
  negation: { title: 'niet or geen', body: 'Use geen before a noun with een or no article; use niet for everything else.' },
  auxiliary: { title: 'hebben or zijn', body: 'This verb takes the other helper verb: compare hebben and zijn in the correct answer.' },
  wrong_word: { title: 'Word choice', body: 'One of the words does not mean what you want to say here.' },
  missing: { title: 'Something is missing', body: 'Part of the meaning is not in your answer yet.' },
  not_dutch: { title: 'Not Dutch', body: 'Try to answer in Dutch, even if it is not perfect.' },
  off_task: { title: 'Not quite the task', body: 'Your answer is Dutch, but it does not do what the task asks.' },
  other: { title: 'Grammar', body: 'There is a small grammar mistake.' },
};

export function checkExact(answer: string, refs: string[], allowTypo = true): Verdict {
  const a = norm(answer);
  if (refs.some((r) => norm(r) === a)) return { ok: true, level: 'correct', best: refs[0], source: 'local' };
  const { ref, dist } = closest(answer, refs);
  if (dist === 0) return { ok: true, level: 'typo', best: ref, error: 'spelling', source: 'local' }; // accents only
  const len = loose(ref).length;
  if (allowTypo && dist === 1 && len >= 8) return { ok: true, level: 'typo', best: ref, error: 'spelling', source: 'local' };
  return { ok: false, level: 'wrong', best: ref, source: 'local' };
}

export interface FreeCheck {
  kind: 'translate' | 'reply' | 'roleplay';
  task: string;
  refs: string[];
  answer: string;
  context?: string;
  mistakes?: Mistake[];
}

export async function checkFree(c: FreeCheck): Promise<Verdict> {
  const local = checkExact(c.answer, c.refs, false);
  if (local.ok && local.level === 'correct') return local;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
    const r = await fetch(`${API}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: c.kind,
        task: c.task,
        references: c.refs,
        answer: c.answer,
        context: c.context || '',
        mistakes: (c.mistakes || []).map((m) => ({ id: m.id, pattern: m.pattern })),
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(String(r.status));
    const j = await r.json();
    const best = closest(c.answer, c.refs).ref;
    return {
      ok: j.verdict !== 'wrong',
      level: j.verdict,
      error: j.error,
      best,
      source: 'jev',
      confidence: j.confidence,
      mistake: j.mistake ? c.mistakes?.find((m) => m.id === j.mistake) : undefined,
      word: typeof j.word === 'number' ? j.word : undefined,
    };
  } catch {
    // Offline: be lenient with small slips, strict otherwise.
    const { ref, dist } = closest(c.answer, c.refs);
    const len = loose(ref).length;
    if (dist <= Math.max(1, Math.floor(len / 15))) return { ok: true, level: 'typo', best: ref, error: 'spelling', source: 'offline' };
    return { ok: false, level: 'wrong', best: ref, source: 'offline' };
  }
}

export async function serverHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${API}/health`, { cache: 'no-store' });
    return r.ok;
  } catch {
    return false;
  }
}
