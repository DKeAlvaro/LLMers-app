import { useEffect, useMemo, useState } from 'react';
import { play } from '../lib/audio';
import { checkExact, checkFree, type ErrorKind, type FreeCheck } from '../lib/grade';
import { norm, shuffle, tiles } from '../lib/text';
import type { Exercise } from '../lib/types';
import { AudioBtn, Icon, Rich } from '../ui';
import { DutchInput } from './inputs';

export interface Result {
  ok: boolean;
  level: 'correct' | 'typo' | 'wrong';
  best?: string;
  answer?: string;
  error?: ErrorKind;
  note?: string;
  explain?: string;
  word?: number;
  free?: FreeCheck;
  speak?: string;
  prompt?: string;
}

export interface ExProps<T> {
  ex: T;
  locked: boolean;
  onResult: (r: Result) => void;
}

type Of<K extends Exercise['type']> = Extract<Exercise, { type: K }>;

export function CheckBar({ disabled, busy, onCheck, label = 'Check' }: { disabled?: boolean; busy?: boolean; onCheck: () => void; label?: string }) {
  return (
    <div className="checkbar">
      <button className="btn btn-primary btn-wide" disabled={disabled || busy} onClick={onCheck}>
        {busy ? <span className="dots"><i /><i /><i /></span> : label}
      </button>
    </div>
  );
}

export const EX_LABEL: Record<Exercise['type'], string> = {
  match: 'Match the pairs',
  choice: 'Choose the right answer',
  article: 'De or het?',
  build: 'Build the sentence',
  gap: 'Fill in the gap',
  translate: 'Write it in Dutch',
  listen: 'Type what you hear',
  reply: 'Answer in Dutch',
};

// ---- match -------------------------------------------------------------------

export function Match({ ex, locked, onResult }: ExProps<Of<'match'>>) {
  const left = useMemo(() => shuffle(ex.pairs.map((p) => p[0])), [ex]);
  const right = useMemo(() => shuffle(ex.pairs.map((p) => p[1])), [ex]);
  const [sel, setSel] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [bad, setBad] = useState<string | null>(null);
  const [miss, setMiss] = useState(0);
  const pairOf = (nl: string) => ex.pairs.find((p) => p[0] === nl)?.[1];

  const tapLeft = (nl: string) => {
    if (locked || done.has(nl)) return;
    setSel(nl);
    play(nl.replace(/^(de|het) /, (m) => m), 'F');
  };
  const tapRight = (en: string) => {
    if (locked || !sel || [...done].some((d) => pairOf(d) === en)) return;
    if (pairOf(sel) === en) {
      const next = new Set(done).add(sel);
      setDone(next);
      setSel(null);
      if (next.size === ex.pairs.length) {
        onResult({ ok: true, level: miss ? 'typo' : 'correct', note: miss ? `Done, with ${miss} slip${miss > 1 ? 's' : ''}.` : undefined });
      }
    } else {
      setMiss((m) => m + 1);
      setBad(en);
      setTimeout(() => setBad(null), 500);
    }
  };
  const doneEn = new Set([...done].map((d) => pairOf(d)));
  return (
    <div className="match">
      <div className="match-col">
        {left.map((nl) => (
          <button key={nl} className={`tile tile-lg nl ${sel === nl ? 'is-sel' : ''} ${done.has(nl) ? 'is-done' : ''}`} onClick={() => tapLeft(nl)}>
            {nl}
          </button>
        ))}
      </div>
      <div className="match-col">
        {right.map((en) => (
          <button key={en} className={`tile tile-lg ${doneEn.has(en) ? 'is-done' : ''} ${bad === en ? 'is-bad' : ''}`} onClick={() => tapRight(en)}>
            {en}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- choice ------------------------------------------------------------------

export function Choice({ ex, locked, onResult }: ExProps<Of<'choice'>>) {
  const [pick, setPick] = useState<number | null>(null);
  const order = useMemo(() => shuffle(ex.options.map((_, i) => i)), [ex]);
  useEffect(() => setPick(null), [ex]);
  useEffect(() => {
    if (locked) return;
    const h = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) setPick(order[n - 1]);
      if (e.key === 'Enter' && pick !== null) check();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  const check = () => {
    if (pick === null) return;
    const ok = pick === ex.answer;
    onResult({ ok, level: ok ? 'correct' : 'wrong', best: ex.options[ex.answer], note: ex.explain, answer: ex.options[pick], prompt: ex.prompt });
  };
  return (
    <>
      <div className="ex-body">
        <h2 className="ex-prompt">
          <Rich text={ex.prompt} />
        </h2>
        {ex.nl && (
          <div className="nl-big">
            <span>{ex.nl}</span>
            <AudioBtn text={ex.nl} />
          </div>
        )}
        <div className="options">
          {order.map((i) => {
            const state = locked ? (i === ex.answer ? 'is-right' : i === pick ? 'is-wrong' : 'is-dim') : pick === i ? 'is-sel' : '';
            return (
              <button key={i} className={`option ${state}`} onClick={() => !locked && setPick(i)}>
                <span className="option-key">{order.indexOf(i) + 1}</span>
                <span>{ex.options[i]}</span>
              </button>
            );
          })}
        </div>
      </div>
      {!locked && <CheckBar disabled={pick === null} onCheck={check} />}
    </>
  );
}

// ---- article -----------------------------------------------------------------

export function Article({ ex, locked, onResult }: ExProps<Of<'article'>>) {
  const [pick, setPick] = useState<'de' | 'het' | null>(null);
  useEffect(() => setPick(null), [ex]);
  useEffect(() => {
    if (locked) return;
    const h = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'd') choose('de');
      if (e.key.toLowerCase() === 'h') choose('het');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  const choose = (a: 'de' | 'het') => {
    if (locked) return;
    setPick(a);
    const ok = a === ex.answer;
    onResult({ ok, level: ok ? 'correct' : 'wrong', best: `${ex.answer} ${ex.word}`, speak: `${ex.answer} ${ex.word}`, answer: `${a} ${ex.word}`, prompt: ex.word });
  };
  return (
    <div className="ex-body center">
      <div className="article-word">
        <span className="nl">{ex.word}</span>
        <span className="muted">{ex.en}</span>
      </div>
      <div className="article-btns">
        {(['de', 'het'] as const).map((a) => (
          <button
            key={a}
            className={`article-btn art-${a} ${locked ? (a === ex.answer ? 'is-right' : a === pick ? 'is-wrong' : 'is-dim') : ''}`}
            onClick={() => choose(a)}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---- build -------------------------------------------------------------------

export function Build({ ex, locked, onResult }: ExProps<Of<'build'>>) {
  const bank = useMemo(() => {
    const t = [...tiles(ex.answer), ...(ex.extra || [])];
    return shuffle(t.map((w, i) => ({ w, i })));
  }, [ex]);
  const [chosen, setChosen] = useState<number[]>([]);
  useEffect(() => setChosen([]), [ex]);
  const sentence = chosen.map((i) => bank.find((b) => b.i === i)!.w).join(' ');
  const check = () => {
    const refs = [ex.answer, ...(ex.accept || [])];
    const ok = refs.some((r) => norm(r) === norm(sentence));
    onResult({ ok, level: ok ? 'correct' : 'wrong', best: ex.answer, speak: ex.answer, answer: sentence, prompt: ex.en, explain: ok ? undefined : ex.explain, error: ok ? undefined : 'word_order' });
  };
  return (
    <>
      <div className="ex-body">
        <h2 className="ex-prompt en-sentence">{ex.en}</h2>
        <div className="build-line">
          {chosen.length === 0 && <span className="build-placeholder">Tap the words in order</span>}
          {chosen.map((i) => (
            <button key={i} className="tile nl" disabled={locked} onClick={() => setChosen((c) => c.filter((x) => x !== i))}>
              {bank.find((b) => b.i === i)!.w}
            </button>
          ))}
        </div>
        <div className="build-bank">
          {bank.map((b) => (
            <button key={b.i} className={`tile nl ${chosen.includes(b.i) ? 'is-ghost' : ''}`} disabled={locked || chosen.includes(b.i)} onClick={() => setChosen((c) => [...c, b.i])}>
              {b.w}
            </button>
          ))}
        </div>
      </div>
      {!locked && <CheckBar disabled={!chosen.length} onCheck={check} />}
    </>
  );
}

// ---- gap ---------------------------------------------------------------------

export function Gap({ ex, locked, onResult }: ExProps<Of<'gap'>>) {
  const [val, setVal] = useState('');
  const [hint, setHint] = useState(false);
  useEffect(() => {
    setVal('');
    setHint(false);
  }, [ex]);
  const [before, after] = ex.text.split('___');
  const full = (w: string) => `${before}${w}${after ?? ''}`.replace(/\s+/g, ' ').trim();
  const check = () => {
    const v = checkExact(val, ex.answers, false);
    onResult({ ...v, best: full(ex.answers[0]), speak: full(ex.answers[0]), answer: full(val.trim()), prompt: ex.text, explain: v.ok ? undefined : ex.explain, note: v.ok ? undefined : `The missing word is "${ex.answers[0]}".` });
  };
  return (
    <>
      <div className="ex-body">
        <div className="gap-sentence nl">
          {before}
          <input
            className="gap-input"
            value={val}
            disabled={locked}
            autoFocus={window.matchMedia('(pointer: fine)').matches}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            style={{ width: `${Math.max(4, val.length + 1, (ex.answers[0] || '').length + 1)}ch` }}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && val.trim() && !locked && check()}
          />
          {after}
        </div>
        <p className="en-sub">{ex.en}</p>
        {ex.hint && (
          <button className={`hint ${hint ? 'is-open' : ''}`} onClick={() => setHint(true)}>
            <Icon name="info" size={16} /> {hint ? <Rich text={ex.hint} /> : 'Show hint'}
          </button>
        )}
      </div>
      {!locked && <CheckBar disabled={!val.trim()} onCheck={check} />}
    </>
  );
}

// ---- translate ---------------------------------------------------------------

export function Translate({ ex, locked, onResult }: ExProps<Of<'translate'>>) {
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setVal(''), [ex]);
  const check = async () => {
    setBusy(true);
    const free: FreeCheck = { kind: 'translate', task: `Translate into Dutch: ${ex.en}`, refs: ex.answers, answer: val, mistakes: ex.mistakes };
    const v = await checkFree(free);
    setBusy(false);
    onResult({ ...v, answer: val, free, speak: v.best, prompt: ex.en, explain: v.mistake?.explain, word: v.word });
  };
  return (
    <>
      <div className="ex-body">
        <h2 className="ex-prompt en-sentence">{ex.en}</h2>
        <DutchInput value={val} onChange={setVal} onSubmit={check} disabled={locked || busy} />
      </div>
      {!locked && <CheckBar disabled={!val.trim()} busy={busy} onCheck={check} />}
    </>
  );
}

// ---- listen ------------------------------------------------------------------

export function Listen({ ex, locked, onResult }: ExProps<Of<'listen'>>) {
  const [val, setVal] = useState('');
  useEffect(() => {
    setVal('');
    const t = setTimeout(() => play(ex.nl, 'F'), 350);
    return () => clearTimeout(t);
  }, [ex]);
  const check = () => {
    const v = checkExact(val, [ex.nl], true);
    onResult({ ...v, best: ex.nl, answer: val, note: ex.en, prompt: 'Listening' });
  };
  return (
    <>
      <div className="ex-body">
        <div className="listen-pad">
          <button className="listen-main" onClick={() => play(ex.nl, 'F')} aria-label="Play">
            <Icon name="volume" size={34} />
          </button>
          <button className="listen-slow" onClick={() => play(ex.nl, 'F', true)} aria-label="Play slowly">
            <Icon name="slow" size={20} />
            <span>slow</span>
          </button>
        </div>
        <DutchInput value={val} onChange={setVal} onSubmit={check} disabled={locked} placeholder="Type what you hear…" autoFocus={false} />
      </div>
      {!locked && <CheckBar disabled={!val.trim()} onCheck={check} />}
    </>
  );
}

// ---- reply -------------------------------------------------------------------

export function Reply({ ex, locked, onResult }: ExProps<Of<'reply'>>) {
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [showEn, setShowEn] = useState(false);
  useEffect(() => {
    setVal('');
    setShowEn(false);
    const t = setTimeout(() => play(ex.say.nl, 'C'), 350);
    return () => clearTimeout(t);
  }, [ex]);
  const check = async () => {
    setBusy(true);
    const free: FreeCheck = { kind: 'reply', task: ex.task, refs: ex.examples, answer: val, context: `${ex.context} They say: "${ex.say.nl}"`, mistakes: ex.mistakes };
    const v = await checkFree(free);
    setBusy(false);
    onResult({ ...v, answer: val, free, prompt: ex.task, speak: v.best, explain: v.mistake?.explain, word: v.word });
  };
  return (
    <>
      <div className="ex-body">
        <p className="context">
          <Rich text={ex.context} />
        </p>
        <div className="bubble bubble-them" onClick={() => setShowEn((s) => !s)}>
          <div className="bubble-row">
            <span className="nl">{ex.say.nl}</span>
            <AudioBtn text={ex.say.nl} voice="C" size="sm" />
          </div>
          {showEn ? <div className="bubble-en">{ex.say.en}</div> : <div className="bubble-tap">Tap for translation</div>}
        </div>
        <div className="task">
          <Icon name="pen" size={16} />
          <span>
            <Rich text={ex.task} />
          </span>
        </div>
        <DutchInput value={val} onChange={setVal} onSubmit={check} disabled={locked || busy} placeholder="Your answer in Dutch…" autoFocus={false} />
      </div>
      {!locked && <CheckBar disabled={!val.trim()} busy={busy} onCheck={check} />}
    </>
  );
}

export function ExerciseView(props: ExProps<Exercise>) {
  const { ex } = props;
  switch (ex.type) {
    case 'match':
      return <Match {...(props as ExProps<Of<'match'>>)} />;
    case 'choice':
      return <Choice {...(props as ExProps<Of<'choice'>>)} />;
    case 'article':
      return <Article {...(props as ExProps<Of<'article'>>)} />;
    case 'build':
      return <Build {...(props as ExProps<Of<'build'>>)} />;
    case 'gap':
      return <Gap {...(props as ExProps<Of<'gap'>>)} />;
    case 'translate':
      return <Translate {...(props as ExProps<Of<'translate'>>)} />;
    case 'listen':
      return <Listen {...(props as ExProps<Of<'listen'>>)} />;
    case 'reply':
      return <Reply {...(props as ExProps<Of<'reply'>>)} />;
    default:
      return null;
  }
}
