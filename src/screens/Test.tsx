import { useEffect, useState } from 'react';
import { go } from '../router';
import { Practice, type Item } from '../components/Practice';
import { loadLesson, unitColor, unitNumber, useIndex } from '../lib/course';
import { addXp, update, useStore } from '../lib/store';
import { shuffle } from '../lib/text';
import { Icon } from '../ui';

const TEST_TYPES = new Set(['translate', 'build', 'gap', 'choice', 'listen', 'reply', 'article']);

export function TestScreen({ unitId }: { unitId: string }) {
  const idx = useIndex();
  const best = useStore((s) => s.checkpoints[unitId]);
  const [items, setItems] = useState<Item[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const unit = idx?.units.find((u) => u.id === unitId);
  const color = unitColor(unitId);

  useEffect(() => {
    if (!unit) return;
    Promise.all(unit.lessons.map((l) => loadLesson(l.id))).then((lessons) => {
      const picked: Item[] = [];
      for (const l of lessons) {
        const pool = shuffle(l.exercises.filter((e) => TEST_TYPES.has(e.type)));
        const hard = pool.filter((e) => ['translate', 'build', 'reply'].includes(e.type));
        const rest = pool.filter((e) => !['translate', 'build', 'reply'].includes(e.type));
        picked.push(...[...hard.slice(0, 2), ...rest].slice(0, 3).map((ex) => ({ ex })));
      }
      setItems(shuffle(picked));
    });
  }, [unit]);

  if (!unit || !items)
    return (
      <div className="screen center-screen">
        <div className="loader" />
      </div>
    );

  if (score !== null) {
    const pass = score >= 80;
    return (
      <div className="screen done" style={{ ['--unit' as string]: color }}>
        <div className="done-hero">
          <div className="done-stamp" style={{ background: pass ? color : 'var(--muted)' }}>
            <Icon name={pass ? 'flag' : 'retry'} size={40} stroke={2.6} />
          </div>
          <div className="done-kicker">Line {unitNumber(unitId)} test</div>
          <h1 className="nl">{pass ? 'Geslaagd!' : score >= 50 ? 'Bijna!' : 'Nog even oefenen'}</h1>
          <div className="done-stats">
            <div>
              <b>{score}%</b>
              <span>score</span>
            </div>
            <div>
              <b>{Math.max(score, best ?? 0)}%</b>
              <span>best</span>
            </div>
          </div>
          <p className="muted center-text">{pass ? 'You master this line. On to the next one.' : 'Go back over the lessons of this line, then try again: 80% passes.'}</p>
        </div>
        <div className="checkbar">
          <button className="btn btn-ghost" onClick={() => go('/')}>
            Route
          </button>
          <button
            className="btn btn-primary btn-grow"
            onClick={() => {
              setScore(null);
              setStarted(false);
              setItems(shuffle(items));
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!started)
    return (
      <div className="screen intro" style={{ ['--unit' as string]: color }}>
        <div className="intro-hero" style={{ background: color }}>
          <div className="tiles-bg" />
          <button className="icon-btn on-dark" onClick={() => go('/')} aria-label="Back">
            <Icon name="left" />
          </button>
          <div className="intro-meta">
            <span className="intro-line">Line {unitNumber(unitId)} · test</span>
            <span className="level-chip on-dark">{unit.level}</span>
          </div>
          <h1 className="intro-title nl">{unit.title}</h1>
          <p className="intro-sub">{unit.subtitle}</p>
        </div>
        <div className="intro-body">
          <p className="intro-text">
            {items.length} questions from every lesson on this line, no second chances. Score 80% or more to pass.
            {best !== undefined && ` Your best so far: ${best}%.`}
          </p>
        </div>
        <div className="checkbar">
          <button className="btn btn-primary btn-wide" onClick={() => setStarted(true)}>
            Start test
          </button>
        </div>
      </div>
    );

  return (
    <div className="screen lesson" style={{ ['--unit' as string]: color }}>
      <Practice
        items={items}
        lessonId={`test-${unitId}`}
        color={color}
        retry={false}
        title="Test"
        onExit={() => go('/')}
        onDone={(st) => {
          const sc = Math.round((st.firstTry / st.total) * 100);
          update((s) => void (s.checkpoints[unitId] = Math.max(sc, s.checkpoints[unitId] ?? 0)));
          addXp(st.firstTry * 5 + (sc >= 80 ? 50 : 0));
          setScore(sc);
        }}
      />
    </div>
  );
}
