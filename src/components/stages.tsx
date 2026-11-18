import { useEffect, useRef, useState } from 'react';
import { play, speakerVoice } from '../lib/audio';
import { checkFree, ERROR_TEXT, type Verdict } from '../lib/grade';
import { getState } from '../lib/store';
import type { Dialogue, Grammar, Lesson, Phrase, Roleplay, Word } from '../lib/types';
import { ArticleChip, AudioBtn, Icon, Paragraphs, Rich } from '../ui';
import { DutchInput } from './inputs';

export function wordSpoken(w: Word) {
  return w.article && w.pos === 'noun' ? `${w.article} ${w.nl}` : w.nl;
}

// ---- words -------------------------------------------------------------------

export function WordCard({ w }: { w: Word }) {
  const [showEx, setShowEx] = useState(false);
  return (
    <div className="word-card">
      <div className="word-main">
        <div className="word-nl">
          <ArticleChip article={w.pos === 'noun' ? w.article : null} />
          <span className="nl">{w.nl}</span>
        </div>
        <AudioBtn text={wordSpoken(w)} />
      </div>
      <div className="word-en">{w.en}</div>
      {(w.plural || w.forms) && (
        <div className="word-forms">
          {w.plural && (
            <span>
              plural <b className="nl">{w.plural}</b>
            </span>
          )}
          {w.forms && <span className="nl">{w.forms}</span>}
        </div>
      )}
      {w.example?.nl && (
        <div className="word-example" role="button" tabIndex={0} onClick={() => setShowEx((s) => !s)} onKeyDown={(e) => e.key === 'Enter' && setShowEx((s) => !s)}>
          <span className="nl">{w.example.nl}</span>
          <span className={`ex-en ${showEx ? 'is-open' : ''}`}>{showEx ? w.example.en : 'Tap to translate'}</span>
          <span onClick={(e) => e.stopPropagation()}>
            <AudioBtn text={w.example.nl} voice="M" size="sm" />
          </span>
        </div>
      )}
      {w.note && (
        <div className="word-note">
          <Rich text={w.note} />
        </div>
      )}
    </div>
  );
}

export function PhraseCard({ p }: { p: Phrase }) {
  return (
    <div className="word-card phrase-card">
      <div className="word-main">
        <span className="nl phrase-nl">{p.nl}</span>
        <AudioBtn text={p.nl} />
      </div>
      <div className="word-en">{p.en}</div>
      {p.note && (
        <div className="word-note">
          <Rich text={p.note} />
        </div>
      )}
    </div>
  );
}

// ---- grammar -----------------------------------------------------------------

const EN_COL = /english|meaning|translation|sounds|use|when|rule|note|tip|why|function|example \(en|engels/i;

export function GrammarCard({ g, color }: { g: Grammar; color: string }) {
  const enCols = new Set((g.table?.headers || []).map((h, i) => (EN_COL.test(h) ? i : -1)).filter((i) => i >= 0));
  return (
    <article className="grammar">
      <div className="grammar-kicker" style={{ color }}>
        Grammar
      </div>
      <h2 className="grammar-title">{g.title}</h2>
      <div className="grammar-body">
        <Paragraphs text={g.explanation} />
      </div>
      {g.table && g.table.rows?.length > 0 && (
        <div className="table-wrap">
          <table className="gtable">
            <thead>
              <tr>
                {g.table.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {g.table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className={enCols.has(j) ? 'en-cell' : 'nl-cell'}>
                      <Rich text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {g.examples?.length > 0 && (
        <div className="examples">
          {g.examples.map((e, i) => (
            <div className="example" key={i}>
              <div>
                <div className="nl">
                  <Rich text={e.nl} />
                </div>
                <div className="example-en">{e.en}</div>
              </div>
              <AudioBtn text={e.nl.replace(/\*\*/g, '')} voice="M" size="sm" />
            </div>
          ))}
        </div>
      )}
      {g.tip && (
        <div className="tip">
          <Icon name="spark" size={16} />
          <span>
            <Rich text={g.tip} />
          </span>
        </div>
      )}
    </article>
  );
}

// ---- dialogue ----------------------------------------------------------------

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function DialogueView({ d, onDone }: { d: Dialogue; onDone: () => void }) {
  const [shown, setShown] = useState(1);
  const [trans, setTrans] = useState<Set<number>>(new Set());
  const [allEn, setAllEn] = useState(false);
  const [auto, setAuto] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const first = d.speakers[0]?.name;
  const voiceOf = (name: string) => speakerVoice(d.speakers, name);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    const line = d.lines[shown - 1];
    if (line && getState().settings.autoplay) play(line.nl, voiceOf(line.speaker));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown]);

  useEffect(() => {
    if (!auto) return;
    let cancelled = false;
    (async () => {
      for (let i = shown; i <= d.lines.length && !cancelled; i++) {
        const line = d.lines[i - 1];
        setShown(i);
        await play(line.nl, voiceOf(line.speaker));
        await new Promise((r) => setTimeout(r, 350));
      }
      setAuto(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto]);

  const done = shown >= d.lines.length;
  return (
    <div className="dialogue">
      <div className="scene">
        <div className="scene-kicker">Dialogue</div>
        <h2 className="scene-title nl">{d.title}</h2>
        <p className="scene-setting">{d.setting}</p>
        <div className="scene-tools">
          <button className={`chip-btn ${allEn ? 'is-on' : ''}`} onClick={() => setAllEn((v) => !v)}>
            <Icon name="eye" size={15} /> Translation
          </button>
          <button className="chip-btn" onClick={() => setAuto(true)} disabled={auto}>
            <Icon name="play" size={13} /> Play all
          </button>
        </div>
      </div>
      <div className="chat">
        {d.lines.slice(0, shown).map((l, i) => {
          const mine = l.speaker !== first;
          const open = allEn || trans.has(i);
          return (
            <div key={i} className={`msg ${mine ? 'msg-right' : 'msg-left'} appear`}>
              <div className={`avatar ${mine ? 'avatar-b' : 'avatar-a'}`}>{initials(l.speaker)}</div>
              <div
                className="msg-bubble"
                onClick={() =>
                  setTrans((t) => {
                    const n = new Set(t);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  })
                }
              >
                <div className="msg-name">{l.speaker}</div>
                <div className="bubble-row">
                  <span className="nl">{l.nl}</span>
                  <AudioBtn text={l.nl} voice={voiceOf(l.speaker)} size="sm" />
                </div>
                {open && <div className="bubble-en">{l.en}</div>}
              </div>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <div className="checkbar">
        {done ? (
          <button className="btn btn-primary btn-wide" onClick={onDone}>
            Continue
          </button>
        ) : (
          <button className="btn btn-secondary btn-wide" onClick={() => setShown((s) => s + 1)} disabled={auto}>
            Next line
          </button>
        )}
      </div>
    </div>
  );
}

// ---- roleplay ----------------------------------------------------------------

type ChatMsg =
  | { who: 'them'; nl: string; en: string }
  | { who: 'me'; text: string; verdict?: Verdict }
  | { who: 'task'; text: string }
  | { who: 'fb'; verdict: Verdict; examples: string[]; explain?: string };

export function RoleplayView({ r, onDone }: { r: Roleplay; onDone: (score: { ok: number; total: number }) => void }) {
  const voice = r.partner.gender === 'm' ? 'M' : 'C';
  const [turn, setTurn] = useState(0);
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => [
    { who: 'them', ...r.turns[0].say },
    { who: 'task', text: r.turns[0].task },
  ]);
  const [val, setVal] = useState('');
  const [busy, setBusy] = useState(false);
  const [tries, setTries] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showEn, setShowEn] = useState<Set<number>>(new Set());
  const score = useRef({ ok: 0, total: r.turns.length });
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, busy]);
  useEffect(() => {
    if (getState().settings.autoplay) {
      const t = setTimeout(() => play(r.turns[0].say.nl, voice), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = (fromMsgs: ChatMsg[]) => {
    const n = turn + 1;
    setTries(0);
    if (n >= r.turns.length) {
      setMsgs([...fromMsgs, { who: 'them', ...r.closing }]);
      play(r.closing.nl, voice);
      setFinished(true);
    } else {
      setTurn(n);
      setMsgs([...fromMsgs, { who: 'them', ...r.turns[n].say }, { who: 'task', text: r.turns[n].task }]);
      play(r.turns[n].say.nl, voice);
    }
  };

  const send = async () => {
    const text = val.trim();
    if (!text || busy) return;
    setVal('');
    const t = r.turns[turn];
    const base: ChatMsg[] = [...msgs, { who: 'me', text }];
    setMsgs(base);
    setBusy(true);
    const v = await checkFree({
      kind: 'roleplay',
      task: t.task,
      refs: t.examples,
      answer: text,
      context: `${r.setting} ${r.partner.name} (${r.partner.role}) says: "${t.say.nl}"`,
      mistakes: t.mistakes,
    });
    setBusy(false);
    const withVerdict = base.map((m, i) => (i === base.length - 1 ? { who: 'me' as const, text, verdict: v } : m));
    if (v.ok) {
      if (tries === 0) score.current.ok++;
      const fb: ChatMsg[] = v.level === 'typo' ? [{ who: 'fb', verdict: v, examples: [v.best] }] : [];
      setTimeout(() => advance([...withVerdict, ...fb]), 650);
      setMsgs([...withVerdict, ...fb]);
    } else {
      setTries((x) => x + 1);
      setMsgs([...withVerdict, { who: 'fb', verdict: v, examples: t.examples, explain: v.mistake?.explain }]);
    }
  };

  const skip = () => {
    const t = r.turns[turn];
    advance([...msgs, { who: 'me', text: t.examples[0] }]);
  };

  return (
    <div className="roleplay">
      <div className="scene">
        <div className="scene-kicker">Your turn to talk</div>
        <h2 className="scene-title nl">{r.title}</h2>
        <p className="scene-setting">
          <Rich text={r.setting} />
        </p>
        <div className="partner">
          <div className="avatar avatar-a">{initials(r.partner.name)}</div>
          <div>
            <b>{r.partner.name}</b>
            <span className="muted"> · {r.partner.role}</span>
          </div>
        </div>
      </div>
      <div className="chat">
        {msgs.map((m, i) => {
          if (m.who === 'them')
            return (
              <div key={i} className="msg msg-left appear">
                <div className="avatar avatar-a">{initials(r.partner.name)}</div>
                <div
                  className="msg-bubble"
                  onClick={() =>
                    setShowEn((s) => {
                      const n = new Set(s);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                >
                  <div className="bubble-row">
                    <span className="nl">{m.nl}</span>
                    <AudioBtn text={m.nl} voice={voice} size="sm" />
                  </div>
                  {showEn.has(i) ? <div className="bubble-en">{m.en}</div> : <div className="bubble-tap">Tap for translation</div>}
                </div>
              </div>
            );
          if (m.who === 'task')
            return (
              <div key={i} className="task appear">
                <Icon name="pen" size={16} />
                <span>
                  <Rich text={m.text} />
                </span>
              </div>
            );
          if (m.who === 'me')
            return (
              <div key={i} className="msg msg-right appear">
                <div className={`msg-bubble mine ${m.verdict ? (m.verdict.ok ? 'is-ok' : 'is-bad') : ''}`}>
                  <span className="nl">
                    {m.verdict && !m.verdict.ok && typeof m.verdict.word === 'number'
                      ? m.text.split(/\s+/).map((w, j) => (
                          <span key={j} className={j === m.verdict!.word ? 'w-bad' : ''}>
                            {w}{' '}
                          </span>
                        ))
                      : m.text}
                  </span>
                  {m.verdict && (
                    <span className="mine-mark">
                      <Icon name={m.verdict.ok ? 'check' : 'x'} size={14} stroke={3} />
                    </span>
                  )}
                </div>
              </div>
            );
          const err = m.verdict.error && m.verdict.error !== 'none' ? ERROR_TEXT[m.verdict.error] : null;
          return (
            <div key={i} className={`rp-fb appear ${m.verdict.ok ? 'rp-fb-almost' : 'rp-fb-bad'}`}>
              {m.verdict.ok ? (
                <>
                  <b>Bijna goed!</b> Watch the spelling: <span className="nl">{m.examples[0]}</span>
                </>
              ) : (
                <>
                  {m.explain ? (
                    <p>
                      <Rich text={m.explain} />
                    </p>
                  ) : (
                    err && (
                      <p>
                        <b>{err.title}.</b> {err.body}
                      </p>
                    )
                  )}
                  <div className="rp-examples">
                    <span className="sheet-label">You could say</span>
                    {m.examples.slice(0, 2).map((e, j) => (
                      <div key={j} className="rp-example">
                        <span className="nl">{e}</span>
                        <AudioBtn text={e} size="sm" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
        {busy && (
          <div className="msg msg-right">
            <div className="msg-bubble mine typing">
              <span className="dots">
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>
        )}
        <div ref={end} />
      </div>
      <div className="checkbar rp-input">
        {finished ? (
          <button className="btn btn-primary btn-wide" onClick={() => onDone(score.current)}>
            Finish lesson
          </button>
        ) : (
          <>
            <DutchInput value={val} onChange={setVal} onSubmit={send} disabled={busy} rows={1} placeholder="Answer in Dutch…" autoFocus={false} />
            <div className="rp-actions">
              {tries > 0 && (
                <button className="btn btn-ghost" onClick={skip}>
                  Use example
                </button>
              )}
              <button className="btn btn-primary btn-grow" onClick={send} disabled={!val.trim() || busy}>
                <Icon name="send" size={18} /> Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function lessonAudio(l: Lesson): number {
  return l.words.length + l.phrases.length;
}
