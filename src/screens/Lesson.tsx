import { useEffect, useMemo, useRef, useState } from 'react';
import { go } from '../router';
import { flatLessons, unitColor, unitNumber, useIndex, useLesson } from '../lib/course';
import { preload, stop } from '../lib/audio';
import { addLessonCards, addXp, getState, update } from '../lib/store';
import { Practice, type PracticeStats } from '../components/Practice';
import { DialogueView, GrammarCard, PhraseCard, RoleplayView, WordCard, wordSpoken } from '../components/stages';
import { Icon, Rich } from '../ui';
import type { Lesson as L } from '../lib/types';

const STAGES = ['Intro', 'Words', 'Grammar', 'Dialogue', 'Practice', 'Talk', 'Done'];
const PER_PAGE = typeof window !== 'undefined' && window.innerWidth >= 1024 ? 6 : 4;

function chunk<T>(a: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
}

export function LessonScreen({ id }: { id: string }) {
  const { lesson, error } = useLesson(id);
  const idx = useIndex();
  const meta = useMemo(() => (idx ? flatLessons(idx).find((x) => x.lesson.id === id) : undefined), [idx, id]);
  const color = unitColor(id.slice(0, 3));
  const saved = getState().resume[id];
  const [stage, setStage] = useState(0);
  const [step, setStep] = useState(0);
  const stats = useRef({ practice: null as PracticeStats | null, talk: null as { ok: number; total: number } | null });
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stage > 0 && stage < 6) update((s) => void (s.resume[id] = { stage, step }));
    top.current?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [stage, step, id]);

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (!lesson) return;
    preload(lesson.words.slice(0, 8).map((w) => [wordSpoken(w), 'F']));
  }, [lesson]);

  if (error)
    return (
      <div className="screen center-screen">
        <p>{error}</p>
        <button className="btn btn-secondary" onClick={() => go('/')}>
          Back
        </button>
      </div>
    );
  if (!lesson)
    return (
      <div className="screen center-screen">
        <div className="loader" style={{ borderTopColor: color }} />
      </div>
    );

  const wordPages = chunk(lesson.words, PER_PAGE);
  const phrasePages = chunk(lesson.phrases, PER_PAGE);
  const learnPages = [...wordPages.map((p) => ({ kind: 'w' as const, p })), ...phrasePages.map((p) => ({ kind: 'p' as const, p }))];

  const nextStage = () => {
    setStage((s) => s + 1);
    setStep(0);
  };
  const exit = () => {
    stop();
    go('/');
  };

  const finish = () => {
    const p = stats.current.practice;
    const t = stats.current.talk;
    const total = (p?.total || 0) + (t?.total || 0);
    const ok = (p?.firstTry || 0) + (t?.ok || 0);
    const score = total ? Math.round((ok / total) * 100) : 100;
    const first = !getState().completed[id];
    addLessonCards(lesson);
    addXp((p?.xp || 0) + (t?.ok || 0) * 15 + (first ? 30 : 10));
    update((s) => {
      const prev = s.completed[id];
      s.completed[id] = { at: Date.now(), score: Math.max(score, prev?.score || 0) };
      delete s.resume[id];
    });
    setStage(6);
  };

  const header = (
    <div className="lesson-top" ref={top}>
      <button className="icon-btn" onClick={exit} aria-label="Close lesson">
        <Icon name="x" />
      </button>
      <div className="stages">
        {STAGES.slice(1, 6).map((s, i) => (
          <div key={s} className={`stage-seg ${i + 1 < stage ? 'is-done' : i + 1 === stage ? 'is-cur' : ''}`} style={{ ['--c' as string]: color }}>
            <span />
          </div>
        ))}
      </div>
      <span className="stage-name">{STAGES[stage]}</span>
    </div>
  );

  return (
    <div className="screen lesson" style={{ ['--unit' as string]: color }}>
      {stage === 0 && <Intro lesson={lesson} color={color} unitLabel={meta ? `Line ${unitNumber(meta.unit.id)} · Stop ${meta.n}` : ''} goals={meta?.lesson.goals} onStart={() => {
            setStage(saved?.stage || 1);
            setStep(saved?.step || 0);
          }} onExit={exit} resumed={!!saved} />}

      {stage === 1 && (
        <>
          {header}
          <div className="stage-body">
            <div className="page-kicker">
              {learnPages[step]?.kind === 'w' ? 'New words' : 'Useful phrases'} <span className="muted">· {step + 1}/{learnPages.length}</span>
            </div>
            <div className="cards appear" key={step}>
              {learnPages[step]?.kind === 'w'
                ? (learnPages[step].p as L['words']).map((w) => <WordCard key={w.nl} w={w} />)
                : (learnPages[step]?.p as L['phrases'] | undefined)?.map((p) => <PhraseCard key={p.nl} p={p} />)}
            </div>
          </div>
          <NavBar
            onBack={step > 0 ? () => setStep(step - 1) : undefined}
            onNext={() => (step + 1 < learnPages.length ? setStep(step + 1) : nextStage())}
          />
        </>
      )}

      {stage === 2 && (
        <>
          {header}
          <div className="stage-body">
            {lesson.grammar.length ? (
              <div className="appear" key={step}>
                <GrammarCard g={lesson.grammar[step]} color={color} />
              </div>
            ) : (
              <p className="muted">No grammar in this lesson.</p>
            )}
          </div>
          <NavBar
            onBack={step > 0 ? () => setStep(step - 1) : undefined}
            onNext={() => (step + 1 < lesson.grammar.length ? setStep(step + 1) : nextStage())}
            label={`${Math.min(step + 1, lesson.grammar.length)}/${lesson.grammar.length}`}
          />
        </>
      )}

      {stage === 3 && (
        <>
          {header}
          <div className="stage-body">
            <DialogueView d={lesson.dialogue} onDone={nextStage} />
          </div>
        </>
      )}

      {stage === 4 && (
        <Practice
          items={lesson.exercises.map((ex) => ({ ex }))}
          lessonId={id}
          color={color}
          onExit={exit}
          onDone={(s) => {
            stats.current.practice = s;
            nextStage();
          }}
        />
      )}

      {stage === 5 && (
        <>
          {header}
          <div className="stage-body">
            <RoleplayView
              r={lesson.roleplay}
              onDone={(s) => {
                stats.current.talk = s;
                finish();
              }}
            />
          </div>
        </>
      )}

      {stage === 6 && <Done lesson={lesson} color={color} score={getState().completed[id]?.score ?? 100} nextId={idx ? nextLessonId(idx, id) : null} />}
    </div>
  );
}

function nextLessonId(idx: NonNullable<ReturnType<typeof useIndex>>, id: string) {
  const flat = flatLessons(idx);
  const i = flat.findIndex((x) => x.lesson.id === id);
  return flat[i + 1]?.lesson.id ?? null;
}

function NavBar({ onBack, onNext, label }: { onBack?: () => void; onNext: () => void; label?: string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext();
      if (e.key === 'ArrowLeft' && onBack) onBack();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });
  return (
    <div className="checkbar navbar">
      <button className="btn btn-ghost btn-square" onClick={onBack} disabled={!onBack} aria-label="Back">
        <Icon name="left" />
      </button>
      {label && <span className="nav-label">{label}</span>}
      <button className="btn btn-primary btn-grow" onClick={onNext}>
        Continue
      </button>
    </div>
  );
}

function Intro({ lesson, color, unitLabel, onStart, onExit, resumed, goals }: { lesson: L; color: string; unitLabel: string; onStart: () => void; onExit: () => void; resumed: boolean; goals?: string[] }) {
  return (
    <div className="intro">
      <div className="intro-hero" style={{ background: color }}>
        <div className="tiles-bg" />
        <button className="icon-btn on-dark" onClick={onExit} aria-label="Back">
          <Icon name="left" />
        </button>
        <div className="intro-meta">
          <span className="intro-line">{unitLabel}</span>
          <span className="level-chip on-dark">{lesson.level}</span>
        </div>
        <h1 className="intro-title nl">{lesson.title}</h1>
        <p className="intro-sub">{lesson.subtitle}</p>
      </div>
      <div className="intro-body">
        <p className="intro-text">
          <Rich text={lesson.intro} />
        </p>
        {goals && goals.length > 0 && (
          <ul className="goals">
            {goals.map((g) => (
              <li key={g}>
                <Icon name="check" size={16} stroke={2.6} style={{ color }} />
                {g}
              </li>
            ))}
          </ul>
        )}
        <div className="intro-stats">
          <div>
            <b>{lesson.words.length}</b>
            <span>words</span>
          </div>
          <div>
            <b>{lesson.phrases.length}</b>
            <span>phrases</span>
          </div>
          <div>
            <b>{lesson.exercises.length}</b>
            <span>exercises</span>
          </div>
          <div>
            <b>{lesson.roleplay.turns.length}</b>
            <span>turns to talk</span>
          </div>
        </div>
        <ol className="path">
          {[
            ['book', 'Words', 'Meet the new words and phrases, with native audio'],
            ['grid', 'Grammar', `${lesson.grammar.length} short note${lesson.grammar.length === 1 ? '' : 's'} with examples`],
            ['chat', 'Dialogue', lesson.dialogue.title],
            ['pen', 'Practice', `${lesson.exercises.length} exercises, from recognising to writing`],
            ['mic', 'Talk', `${lesson.roleplay.partner.name}: ${lesson.roleplay.title}`],
          ].map(([icon, name, sub], i) => (
            <li key={name}>
              <span className="path-icon" style={{ color }}>
                <Icon name={icon} size={17} />
              </span>
              <span className="path-text">
                <b>
                  {i + 1}. {name}
                </b>
                <span>{sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className="checkbar">
        <button className="btn btn-primary btn-wide" onClick={onStart}>
          {resumed ? 'Continue where you left off' : 'Start lesson'}
        </button>
      </div>
    </div>
  );
}

function Done({ lesson, color, score, nextId }: { lesson: L; color: string; score: number; nextId: string | null }) {
  return (
    <div className="done">
      <div className="done-hero">
        <div className="done-stamp" style={{ background: color }}>
          <Icon name="check" size={44} stroke={3} />
        </div>
        <div className="done-kicker">Halte bereikt</div>
        <h1 className="nl">{lesson.title}</h1>
        <div className="done-stats">
          <div>
            <b>{score}%</b>
            <span>accuracy</span>
          </div>
          <div>
            <b>{lesson.words.length + lesson.phrases.length}</b>
            <span>added to review</span>
          </div>
        </div>
      </div>
      <div className="done-body">
        {lesson.summary?.length > 0 && (
          <section className="summary">
            <h3>Remember</h3>
            <ul>
              {lesson.summary.map((s, i) => (
                <li key={i}>
                  <Rich text={s} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {lesson.culture?.text && (
          <section className="culture">
            <div className="culture-kicker">Culture</div>
            <h3>{lesson.culture.title}</h3>
            <p>
              <Rich text={lesson.culture.text} />
            </p>
          </section>
        )}
      </div>
      <div className="checkbar">
        <button className="btn btn-ghost" onClick={() => go('/')}>
          Route
        </button>
        {nextId ? (
          <button className="btn btn-primary btn-grow" onClick={() => go(`/lesson/${nextId}`)}>
            Next lesson
          </button>
        ) : (
          <button className="btn btn-primary btn-grow" onClick={() => go('/')}>
            Done
          </button>
        )}
      </div>
    </div>
  );
}
