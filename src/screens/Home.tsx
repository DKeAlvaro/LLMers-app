import { useEffect, useMemo, useRef } from 'react';
import { go } from '../router';
import { flatLessons, unitColor, unitNumber, useIndex } from '../lib/course';
import { dueCards, streak, useStore } from '../lib/store';
import { today } from '../lib/text';
import type { CourseIndex } from '../lib/types';
import { Bar, Icon, Logo, dutchGreeting } from '../ui';

export function unlockedSet(idx: CourseIndex, completed: Record<string, unknown>, unlockAll: boolean): Set<string> {
  const out = new Set<string>();
  const flat = flatLessons(idx);
  flat.forEach((x, i) => {
    if (unlockAll || i === 0 || completed[x.lesson.id] || completed[flat[i - 1].lesson.id]) out.add(x.lesson.id);
  });
  return out;
}

export function nextLesson(idx: CourseIndex, completed: Record<string, unknown>) {
  return flatLessons(idx).find((x) => !completed[x.lesson.id]) ?? null;
}

export function Home() {
  const idx = useIndex();
  const s = useStore((st) => st);
  const due = useMemo(() => dueCards(s).length, [s]);
  const curRef = useRef<HTMLLIElement>(null);
  const scrolled = useRef(false);

  useEffect(() => {
    if (idx && curRef.current && !scrolled.current) {
      scrolled.current = true;
      const y = curRef.current.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.45;
      if (y > 400) window.scrollTo({ top: y });
    }
  }, [idx]);

  if (!idx)
    return (
      <div className="screen center-screen">
        <div className="loader" />
      </div>
    );

  const unlocked = unlockedSet(idx, s.completed, s.settings.unlockAll);
  const next = nextLesson(idx, s.completed);
  const total = flatLessons(idx).length;
  const done = Object.keys(s.completed).filter((k) => flatLessons(idx).some((x) => x.lesson.id === k)).length;
  const xpToday = s.days[today()] || 0;
  const st = streak(s);
  const resume = next ? s.resume[next.lesson.id] : undefined;

  return (
    <div className="screen home">
      <header className="topbar">
        <div className="brand">
          <Logo size={30} />
          <span className="brand-name">LLMers</span>
          <span className="brand-lang">NL</span>
        </div>
        <div className="top-stats">
          <span className={`stat ${st ? 'stat-fire' : ''}`} title="Day streak">
            <Icon name="flame" size={17} /> {st}
          </span>
          <span className="stat stat-xp" title="Total XP">
            <Icon name="bolt" size={16} /> {s.xp}
          </span>
        </div>
      </header>

      <div className="home-top">
      {next ? (
        <button className="hero-card" style={{ ['--unit' as string]: unitColor(next.unit.id) }} onClick={() => go(`/lesson/${next.lesson.id}`)}>
          <div className="tiles-bg" />
          <div className="hero-top">
            <span className="line-badge on-dark">{unitNumber(next.unit.id)}</span>
            <span className="hero-line">
              {next.unit.title} · stop {next.n}
            </span>
            <span className="level-chip on-dark">{next.lesson.level}</span>
          </div>
          <div className="hero-title nl">{next.lesson.title}</div>
          <div className="hero-sub">{next.lesson.subtitle}</div>
          <div className="hero-cta">
            <span>{resume ? 'Continue lesson' : done === 0 ? 'Start your first lesson' : 'Start lesson'}</span>
            <Icon name="right" size={20} stroke={2.6} />
          </div>
        </button>
      ) : (
        <div className="hero-card hero-done" style={{ ['--unit' as string]: '#25324D' }}>
          <div className="tiles-bg" />
          <div className="hero-title nl">Gefeliciteerd!</div>
          <div className="hero-sub">You finished the whole course. Keep your words fresh in Review.</div>
        </div>
      )}
        <div className="home-side">
      <section className="hello">
        <h1 className="nl">
          {dutchGreeting()}
          {s.settings.name ? `, ${s.settings.name}` : ''}.
        </h1>
        <div className="goal-row">
          <div className="goal-text">
            <span>Today</span>
            <b>
              {Math.min(xpToday, s.settings.dailyGoal)}/{s.settings.dailyGoal} XP
            </b>
          </div>
          <Bar value={xpToday / s.settings.dailyGoal} color="var(--orange)" />
        </div>
      </section>
      <div className="quick">
        <button className="quick-card" onClick={() => go('/review')}>
          <span className="quick-icon" style={{ background: 'var(--blue-soft)', color: 'var(--blue)' }}>
            <Icon name="cards" size={20} />
          </span>
          <span className="quick-text">
            <b>Review</b>
            <span>{due ? `${due} due now` : Object.keys(s.cards).length ? 'All caught up' : 'Unlocks after lesson 1'}</span>
          </span>
          {due > 0 && <span className="badge">{due > 99 ? '99+' : due}</span>}
        </button>
        <button className="quick-card" onClick={() => go('/me')}>
          <span className="quick-icon" style={{ background: 'var(--orange-soft)', color: 'var(--orange)' }}>
            <Icon name="map" size={20} />
          </span>
          <span className="quick-text">
            <b>
              {done}/{total} stops
            </b>
            <span>{levelLabel(idx, s.completed)}</span>
          </span>
        </button>
      </div>

        </div>
      </div>

      <div className="route">
        {idx.units.map((u) => {
          const color = unitColor(u.id);
          const uDone = u.lessons.filter((l) => s.completed[l.id]).length;
          const allDone = uDone === u.lessons.length;
          const cp = s.checkpoints[u.id];
          return (
            <section className="line" key={u.id} style={{ ['--unit' as string]: color }}>
              <header className="line-head">
                <span className="line-badge">{unitNumber(u.id)}</span>
                <div className="line-titles">
                  <h2 className="nl">{u.title}</h2>
                  <span>
                    {u.subtitle} · {uDone}/{u.lessons.length}
                  </span>
                </div>
                <span className="level-chip">{u.level}</span>
              </header>
              <ol className="stops">
                {u.lessons.map((l, i) => {
                  const isDone = !!s.completed[l.id];
                  const isOpen = unlocked.has(l.id);
                  const isCur = next?.lesson.id === l.id;
                  return (
                    <li key={l.id} className={`stop ${isDone ? 'is-done' : ''} ${isCur ? 'is-cur' : ''} ${!isOpen ? 'is-locked' : ''}`} ref={isCur ? curRef : undefined}>
                      <button
                        className="stop-btn"
                        onClick={() => {
                          if (isOpen) go(`/lesson/${l.id}`);
                          else if (confirm('Jump ahead to this lesson? Earlier lessons teach the words it uses.')) go(`/lesson/${l.id}`);
                        }}
                      >
                        <span className="stop-dot">{isDone ? <Icon name="check" size={13} stroke={3.4} /> : !isOpen ? <Icon name="lock" size={11} stroke={2.6} /> : null}</span>
                        <span className="stop-text">
                          <span className="stop-title nl">{l.title}</span>
                          <span className="stop-sub">
                            {i + 1}. {l.subtitle}
                          </span>
                        </span>
                        {isDone && <span className="stop-score">{s.completed[l.id].score}%</span>}
                        {isCur && <span className="stop-now">Now</span>}
                      </button>
                    </li>
                  );
                })}
                <li className={`stop stop-test ${cp !== undefined ? 'is-done' : ''} ${!allDone && !s.settings.unlockAll ? 'is-locked' : ''}`}>
                  <button className="stop-btn" onClick={() => (allDone || s.settings.unlockAll ? go(`/test/${u.id}`) : alert('Finish every lesson on this line to unlock its test.'))}>
                    <span className="stop-dot square">
                      <Icon name="flag" size={12} stroke={2.6} />
                    </span>
                    <span className="stop-text">
                      <span className="stop-title">Line test</span>
                      <span className="stop-sub">{cp !== undefined ? `Best score ${cp}%` : `${u.lessons.length * 3} mixed questions`}</span>
                    </span>
                  </button>
                </li>
              </ol>
            </section>
          );
        })}
        <div className="route-end">
          <span className="nl">Eindstation</span>
          <span>A2+</span>
        </div>
      </div>
    </div>
  );
}

function levelLabel(idx: CourseIndex, completed: Record<string, unknown>) {
  const levels = ['A0', 'A1', 'A2', 'A2+'] as const;
  let reached = 'Beginner';
  for (const lv of levels) {
    const ls = idx.units.filter((u) => u.level === lv).flatMap((u) => u.lessons);
    if (ls.length && ls.every((l) => completed[l.id])) reached = `${lv} reached`;
  }
  return reached;
}
