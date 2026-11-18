import { useEffect, useRef, useState } from 'react';
import { play } from '../lib/audio';
import { ERROR_TEXT } from '../lib/grade';
import { logMistake } from '../lib/store';
import { diffWords, norm } from '../lib/text';
import type { Exercise } from '../lib/types';
import { AudioBtn, Bar, Icon, Rich } from '../ui';
import { EX_LABEL, ExerciseView, type Result } from './exercises';

export interface Item {
  ex: Exercise;
  key?: string;
}

export interface PracticeStats {
  total: number;
  firstTry: number;
  xp: number;
}

const PRAISE = ['Goed zo!', 'Prima!', 'Heel goed!', 'Uitstekend!', 'Top!', 'Lekker bezig!', 'Precies!'];

export function Practice({
  items,
  lessonId,
  color,
  retry = true,
  onItem,
  onDone,
  onExit,
  title,
}: {
  items: Item[];
  lessonId: string;
  color?: string;
  retry?: boolean;
  onItem?: (item: Item, ok: boolean, firstTry: boolean) => void;
  onDone: (s: PracticeStats) => void;
  onExit?: () => void;
  title?: string;
}) {
  const [queue, setQueue] = useState<{ item: Item; retry: boolean; id: number }[]>(() => items.map((item, id) => ({ item, retry: false, id })));
  const [pos, setPos] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const stats = useRef<PracticeStats>({ total: items.length, firstTry: 0, xp: 0 });
  const doneCount = useRef(0);
  const cur = queue[pos];

  const onResult = (r: Result) => {
    setResult(r);
    const first = !cur.retry;
    if (r.ok) {
      doneCount.current++;
      if (first) stats.current.firstTry++;
      stats.current.xp += first ? 10 : 5;
    } else {
      if (retry && first) setQueue((q) => [...q, { item: cur.item, retry: true, id: q.length + 1000 }]);
      else if (!retry || !first) doneCount.current++;
      logMistake({ at: Date.now(), lesson: lessonId, prompt: r.prompt || EX_LABEL[cur.item.ex.type], answer: r.answer || '', best: r.best || '', error: r.error });
    }
    onItem?.(cur.item, r.ok, first);
    if (r.speak && r.ok) play(r.speak, 'F');
  };

  const next = () => {
    setResult(null);
    if (pos + 1 >= queue.length) onDone(stats.current);
    else setPos(pos + 1);
  };

  useEffect(() => {
    if (!result) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        next();
      }
    };
    const t = setTimeout(() => window.addEventListener('keydown', h), 150);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', h);
    };
  });

  if (!cur) return null;
  const progress = doneCount.current / Math.max(1, queue.length);

  return (
    <div className="practice">
      <div className="practice-top">
        {onExit && (
          <button className="icon-btn" onClick={onExit} aria-label="Close">
            <Icon name="x" />
          </button>
        )}
        <Bar value={progress} color={color} />
        <span className="practice-count">
          {Math.min(pos + 1, queue.length)}/{queue.length}
        </span>
      </div>
      <div className="practice-label">
        {cur.retry && <span className="retry-chip">Again</span>}
        {title ? `${title} · ` : ''}
        {EX_LABEL[cur.item.ex.type]}
      </div>
      <div className="practice-stage" key={cur.id}>
        <ExerciseView ex={cur.item.ex} locked={!!result} onResult={onResult} />
      </div>
      {result && <Feedback result={result} onNext={next} />}
    </div>
  );
}

export function Feedback({ result, onNext, nextLabel = 'Continue' }: { result: Result; onNext: () => void; nextLabel?: string }) {
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  const { level, best, answer, error, note, explain, word } = result;
  const differs = best && answer && norm(best) !== norm(answer);
  const tone = level === 'correct' ? 'good' : level === 'typo' ? 'almost' : 'bad';
  const err = error && error !== 'none' ? ERROR_TEXT[error] : null;
  const words = answer ? answer.split(/\s+/).filter(Boolean) : [];
  return (
    <div className={`sheet sheet-${tone}`} role="status">
      <div className="sheet-inner">
        <div className="sheet-head">
          <span className="sheet-icon">
            <Icon name={level === 'wrong' ? 'x' : 'check'} size={20} stroke={3} />
          </span>
          <strong>{level === 'correct' ? praise : level === 'typo' ? 'Bijna goed!' : 'Not quite'}</strong>
          {best && <AudioBtn text={best} size="sm" />}
        </div>
        {level !== 'correct' && typeof word === 'number' && words[word] && (
          <div className="sheet-answer">
            <span className="sheet-label">You wrote</span>
            <div className="nl yours">
              {words.map((w, i) => (
                <span key={i} className={i === word ? 'w-bad' : ''}>
                  {w}{' '}
                </span>
              ))}
            </div>
          </div>
        )}
        {level === 'wrong' && best && (
          <div className="sheet-answer">
            <span className="sheet-label">Correct answer</span>
            <div className="nl diff">
              {answer
                ? diffWords(answer, best).map((p, i) => (
                    <span key={i} className={`d-${p.kind}`}>
                      {p.text}{' '}
                    </span>
                  ))
                : best}
            </div>
          </div>
        )}
        {level === 'typo' && best && differs && (
          <div className="sheet-answer">
            <span className="sheet-label">Watch the spelling</span>
            <div className="nl">{best}</div>
          </div>
        )}
        {level === 'correct' && differs && result.free && (
          <div className="sheet-answer">
            <span className="sheet-label">Another way to say it</span>
            <div className="nl">{best}</div>
          </div>
        )}
        {level !== 'correct' && explain ? (
          <p className="sheet-note">
            <Rich text={explain} />
          </p>
        ) : (
          err && level !== 'correct' && (
            <p className="sheet-note">
              <b>{err.title}.</b> {err.body}
            </p>
          )
        )}
        {note && (level === 'correct' || !explain) && (
          <p className="sheet-note muted-note">
            <Rich text={note} />
          </p>
        )}
        <div className="sheet-actions">
          <button className="btn btn-primary btn-grow" onClick={onNext} autoFocus>
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
