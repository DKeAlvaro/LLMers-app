import { useMemo, useState } from 'react';
import { unitColor, useIndex } from '../lib/course';
import { useStore } from '../lib/store';
import { loose } from '../lib/text';
import { ArticleChip, AudioBtn, Icon } from '../ui';

export function Words() {
  const cards = useStore((s) => s.cards);
  const idx = useIndex();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<'all' | 'word' | 'phrase'>('all');

  const groups = useMemo(() => {
    const list = Object.values(cards).filter(
      (c) => (kind === 'all' || c.kind === kind) && (!q || loose(c.nl).includes(loose(q)) || loose(c.en).includes(loose(q))),
    );
    const byUnit = new Map<string, typeof list>();
    for (const c of list) {
      const u = c.lesson.slice(0, 3);
      if (!byUnit.has(u)) byUnit.set(u, []);
      byUnit.get(u)!.push(c);
    }
    return [...byUnit.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [cards, q, kind]);

  const total = Object.keys(cards).length;
  return (
    <div className="screen page">
      <header className="page-head">
        <h1 className="nl">Woorden</h1>
        <p>{total ? `${total} words and phrases learned.` : 'Words you learn in lessons appear here.'}</p>
      </header>
      <div className="search">
        <Icon name="search" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Dutch or English" />
      </div>
      <div className="seg">
        {(['all', 'word', 'phrase'] as const).map((k) => (
          <button key={k} className={kind === k ? 'is-on' : ''} onClick={() => setKind(k)}>
            {k === 'all' ? 'All' : k === 'word' ? 'Words' : 'Phrases'}
          </button>
        ))}
      </div>
      {groups.map(([u, list]) => {
        const unit = idx?.units.find((x) => x.id === u);
        return (
          <section key={u} className="word-group">
            <h2 style={{ color: unitColor(u) }}>
              <span className="dot" style={{ background: unitColor(u) }} />
              {unit ? unit.title : u}
            </h2>
            <ul className="word-list">
              {list.map((c) => (
                <li key={c.k}>
                  <div className="wl-main">
                    <div className="wl-nl">
                      <ArticleChip article={c.kind === 'word' ? c.article : null} />
                      <span className="nl">{c.nl}</span>
                    </div>
                    <div className="wl-en">{c.en}</div>
                  </div>
                  <span className="strength" title={`Box ${c.box} of 7`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <i key={i} className={c.box >= i + 1 ? 'on' : ''} />
                    ))}
                  </span>
                  <AudioBtn text={c.article && c.kind === 'word' ? `${c.article} ${c.nl}` : c.nl} size="sm" />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {total > 0 && groups.length === 0 && <p className="muted center-text">No match.</p>}
    </div>
  );
}
