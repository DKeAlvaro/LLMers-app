import { useMemo, useState } from 'react';
import { go } from '../router';
import { Practice, type Item, type PracticeStats } from '../components/Practice';
import { addXp, dueCards, getState, gradeCard, useStore, type Card } from '../lib/store';
import { shuffle } from '../lib/text';
import type { Exercise } from '../lib/types';
import { ERROR_TEXT } from '../lib/grade';
import { Icon } from '../ui';

const SESSION = 15;

function spoken(c: Card) {
  return c.article && c.kind === 'word' ? `${c.article} ${c.nl}` : c.nl;
}

function cardExercise(c: Card, pool: Card[], i: number): Exercise {
  const others = shuffle(pool.filter((p) => p.k !== c.k && p.kind === c.kind && p.en !== c.en)).slice(0, 3);
  if (c.kind === 'word' && c.article && i % 4 === 3) return { type: 'article', word: c.nl, en: c.en, answer: c.article };
  if (c.box <= 2 || others.length < 2) {
    if (c.kind === 'phrase' && c.box === 2) return { type: 'listen', nl: c.nl, en: c.en };
    return {
      type: 'choice',
      prompt: 'What does this mean?',
      nl: spoken(c),
      options: [c.en, ...others.map((o) => o.en)],
      answer: 0,
      explain: `${spoken(c)} = ${c.en}`,
    };
  }
  return {
    type: 'gap',
    text: c.kind === 'word' && c.article ? `${c.article} ___` : '___',
    en: c.en,
    answers: [c.nl],
    hint: `Starts with "${c.nl.slice(0, Math.max(1, Math.ceil(c.nl.length / 4)))}"`,
  };
}

export function Review() {
  const s = useStore((st) => st);
  const due = useMemo(() => dueCards(s), [s]);
  const [session, setSession] = useState<Item[] | null>(null);
  const [result, setResult] = useState<PracticeStats | null>(null);
  const all = Object.values(s.cards);

  const start = (cards: Card[]) => {
    const pool = Object.values(getState().cards);
    setResult(null);
    setSession(cards.slice(0, SESSION).map((c, i) => ({ ex: cardExercise(c, pool, i), key: c.k })));
  };

  if (session)
    return (
      <div className="screen">
        <Practice
          items={session}
          lessonId="review"
          color="var(--blue)"
          retry={false}
          title="Review"
          onExit={() => setSession(null)}
          onItem={(item, ok) => item.key && gradeCard(item.key, ok)}
          onDone={(st) => {
            addXp(st.firstTry * 5);
            setResult(st);
            setSession(null);
          }}
        />
      </div>
    );

  const weakest = [...all].sort((a, b) => a.box - b.box || b.lapses - a.lapses);

  return (
    <div className="screen page">
      <header className="page-head">
        <h1 className="nl">Herhalen</h1>
        <p>Spaced review of every word and phrase you have learned.</p>
      </header>

      {result && (
        <div className="result-banner">
          <Icon name="check" size={18} stroke={3} />
          <span>
            Session done: {result.firstTry}/{result.total} right, +{result.firstTry * 5} XP
          </span>
        </div>
      )}

      <section className="review-hero">
        <div className="review-count">
          <b>{due.length}</b>
          <span>{due.length === 1 ? 'card due' : 'cards due'}</span>
        </div>
        <div className="review-boxes">
          {[1, 2, 3, 4, 5, 6, 7].map((b) => {
            const n = all.filter((c) => c.box === b).length;
            return (
              <div key={b} className="rbox" title={`Box ${b}: ${n}`}>
                <div className="rbox-bar" style={{ height: `${all.length ? Math.max(4, (n / all.length) * 100) : 4}%` }} />
                <span>{b}</span>
              </div>
            );
          })}
        </div>
        <p className="muted small">Cards move up a box each time you know them and come back less often.</p>
        {due.length > 0 ? (
          <button className="btn btn-primary btn-wide" onClick={() => start(due)}>
            Review {Math.min(due.length, SESSION)} cards
          </button>
        ) : all.length ? (
          <button className="btn btn-secondary btn-wide" onClick={() => start(weakest)}>
            Practise your weakest words
          </button>
        ) : (
          <button className="btn btn-primary btn-wide" onClick={() => go('/')}>
            Finish a lesson to fill your deck
          </button>
        )}
      </section>

      {s.mistakes.length > 0 && (
        <section className="mistakes">
          <h2>Recent mistakes</h2>
          <ul>
            {s.mistakes.slice(0, 25).map((m, i) => (
              <li key={i}>
                <div className="m-prompt">{m.prompt}</div>
                {m.answer && <div className="m-answer">{m.answer}</div>}
                <div className="m-best nl">{m.best}</div>
                {m.error && m.error !== 'none' && ERROR_TEXT[m.error as keyof typeof ERROR_TEXT] && <span className="m-tag">{ERROR_TEXT[m.error as keyof typeof ERROR_TEXT].title}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
