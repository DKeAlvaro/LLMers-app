import { useEffect, useMemo, useState } from 'react';
import { flatLessons, useIndex } from '../lib/course';
import { serverHealth } from '../lib/grade';
import { exportState, importState, resetAll, streak, update, useStore } from '../lib/store';
import { Bar, Icon } from '../ui';

const LEVELS = ['A0', 'A1', 'A2', 'A2+'] as const;

export function Me() {
  const s = useStore((st) => st);
  const idx = useIndex();
  const [server, setServer] = useState<boolean | null>(null);
  useEffect(() => {
    serverHealth().then(setServer);
  }, []);

  const levelProgress = useMemo(() => {
    if (!idx) return [];
    return LEVELS.map((lv) => {
      const ls = idx.units.filter((u) => u.level === lv).flatMap((u) => u.lessons);
      return { lv, done: ls.filter((l) => s.completed[l.id]).length, total: ls.length };
    });
  }, [idx, s.completed]);

  const last7 = useMemo(() => {
    const out: { d: string; xp: number; label: string }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      out.push({ d: k, xp: s.days[k] || 0, label: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'][d.getDay()] });
    }
    return out;
  }, [s.days]);
  const maxXp = Math.max(s.settings.dailyGoal, ...last7.map((x) => x.xp));
  const set = <K extends keyof typeof s.settings>(k: K, v: (typeof s.settings)[K]) => update((st) => void (st.settings[k] = v));

  const download = () => {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `llmers-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  const upload = () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return;
      try {
        importState(await f.text());
        alert('Progress restored.');
      } catch (e) {
        alert(String((e as Error).message));
      }
    };
    inp.click();
  };

  return (
    <div className="screen page">
      <header className="page-head">
        <h1 className="nl">Jij</h1>
        <p>{s.settings.name ? `Doe je best, ${s.settings.name}.` : 'Your progress and settings.'}</p>
      </header>

      <section className="stat-grid">
        <div className="stat-card">
          <Icon name="flame" size={20} style={{ color: 'var(--orange)' }} />
          <b>{streak(s)}</b>
          <span>day streak</span>
        </div>
        <div className="stat-card">
          <Icon name="bolt" size={20} style={{ color: 'var(--blue)' }} />
          <b>{s.xp}</b>
          <span>total XP</span>
        </div>
        <div className="stat-card">
          <Icon name="book" size={20} style={{ color: 'var(--green)' }} />
          <b>{Object.keys(s.cards).length}</b>
          <span>words & phrases</span>
        </div>
        <div className="stat-card">
          <Icon name="map" size={20} style={{ color: 'var(--het)' }} />
          <b>
            {idx ? flatLessons(idx).filter((x) => s.completed[x.lesson.id]).length : 0}
            {idx ? <small>/{flatLessons(idx).length}</small> : null}
          </b>
          <span>lessons</span>
        </div>
      </section>

      <section className="card-section">
        <h2>This week</h2>
        <div className="week">
          {last7.map((x) => (
            <div key={x.d} className="week-day">
              <div className="week-bar">
                <div className={`week-fill ${x.xp >= s.settings.dailyGoal ? 'is-goal' : ''}`} style={{ height: `${(x.xp / maxXp) * 100}%` }} />
              </div>
              <span>{x.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card-section">
        <h2>Levels</h2>
        {levelProgress.map((l) => (
          <div key={l.lv} className="level-row">
            <span className="level-chip">{l.lv}</span>
            <Bar value={l.total ? l.done / l.total : 0} color="var(--blue)" />
            <span className="muted small">
              {l.done}/{l.total}
            </span>
          </div>
        ))}
      </section>

      <section className="card-section settings">
        <h2>Settings</h2>
        <label className="set-row">
          <span>Your name</span>
          <input className="set-input" value={s.settings.name} maxLength={24} placeholder="Optional" onChange={(e) => set('name', e.target.value)} />
        </label>
        <div className="set-row">
          <span>Theme</span>
          <div className="seg small">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button key={t} className={s.settings.theme === t ? 'is-on' : ''} onClick={() => set('theme', t)}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="set-row">
          <span>Daily goal</span>
          <div className="seg small">
            {[20, 30, 50, 80].map((g) => (
              <button key={g} className={s.settings.dailyGoal === g ? 'is-on' : ''} onClick={() => set('dailyGoal', g)}>
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="set-row">
          <span>Audio speed</span>
          <div className="seg small">
            {[0.8, 0.9, 1].map((g) => (
              <button key={g} className={s.settings.speed === g ? 'is-on' : ''} onClick={() => set('speed', g)}>
                {g === 1 ? 'Normal' : `${g}×`}
              </button>
            ))}
          </div>
        </div>
        <label className="set-row">
          <span>Autoplay dialogue audio</span>
          <input type="checkbox" className="switch" checked={s.settings.autoplay} onChange={(e) => set('autoplay', e.target.checked)} />
        </label>
        <label className="set-row">
          <span>
            Unlock all lessons
            <small>For learners who already know some Dutch</small>
          </span>
          <input type="checkbox" className="switch" checked={s.settings.unlockAll} onChange={(e) => set('unlockAll', e.target.checked)} />
        </label>
        <div className="set-row">
          <span>
            Answer checking
            <small>{server === null ? 'Checking…' : server ? 'Online: free answers are checked by Jev' : 'Offline: free answers are compared to model answers'}</small>
          </span>
          <span className={`status-dot ${server ? 'on' : server === false ? 'off' : ''}`} />
        </div>
      </section>

      <section className="card-section">
        <h2>Your data</h2>
        <p className="muted small">Progress lives on this device only. Back it up to move it to another phone.</p>
        <div className="btn-row">
          <button className="btn btn-secondary" onClick={download}>
            <Icon name="download" size={16} /> Export
          </button>
          <button className="btn btn-secondary" onClick={upload}>
            <Icon name="upload" size={16} /> Import
          </button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm('Delete all progress on this device?')) resetAll();
            }}
          >
            <Icon name="trash" size={16} /> Reset
          </button>
        </div>
      </section>

      <footer className="about">
        <p>
          <b>LLMers</b> · Dutch from zero to A2+. 63 lessons in 12 lines, written with DeepSeek and reviewed lesson by lesson. Answers are checked by Jev
          (TypeSafe). Audio: neural nl-NL voices.
        </p>
      </footer>
    </div>
  );
}
