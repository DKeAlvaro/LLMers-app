import { useState, type ReactNode, type CSSProperties } from 'react';
import { play, type Voice } from './lib/audio';

const PATHS: Record<string, ReactNode> = {
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="M20 6 9 17l-5-5" />,
  right: <path d="m9 18 6-6-6-6" />,
  left: <path d="m15 18-6-6 6-6" />,
  volume: (
    <>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
    </>
  ),
  slow: (
    <>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <circle cx="20" cy="12" r="1" />
    </>
  ),
  flame: <path d="M12 2c1 3.5 5 6 5 11a5 5 0 0 1-10 0c0-2.2 1-3.7 2.2-4.8.3 1.6 1.1 2.6 2.3 2.8C11 8.4 11 5 12 2z" />,
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
  map: (
    <>
      <circle cx="6" cy="5" r="2.2" />
      <circle cx="18" cy="19" r="2.2" />
      <path d="M6 7.2V12a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v-1" />
    </>
  ),
  cards: (
    <>
      <rect x="3" y="7" width="14" height="14" rx="2.5" />
      <path d="M7 3h11.5A2.5 2.5 0 0 1 21 5.5V17" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5v-17z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5-12-7.5z" />,
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v4" />
    </>
  ),
  send: <path d="M5 12h14M13 6l6 6-6 6" />,
  retry: <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />,
  pen: <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  download: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />,
  upload: <path d="M12 21V9M7 14l5-5 5 5M4 3h16" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </>
  ),
  shuffle: <path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />,
};

export function Icon({ name, size = 20, stroke = 2, style, className }: { name: string; size?: number; stroke?: number; style?: CSSProperties; className?: string }) {
  const filled = name === 'play' || name === 'bolt' || name === 'flame';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 22c0-8.3 7.6-15 17-15s17 6.7 17 15-7.6 15-17 15c-2 0-3.9-.3-5.7-.9L10 40l2.6-8.3C9.7 29.1 8 25.7 8 22z" fill="var(--orange)" />
      <path d="M56 38c0-8.3-7.6-15-17-15S22 29.7 22 38s7.6 15 17 15c2 0 3.9-.3 5.7-.9L54 56l-2.6-8.3C54.3 45.1 56 41.7 56 38z" fill="var(--blue)" opacity="0.94" />
    </svg>
  );
}

export function AudioBtn({ text, voice = 'F', size = 'md', label }: { text: string; voice?: Voice; size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [slowNext, setSlowNext] = useState(false);
  const go = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setBusy(true);
    await play(text, voice, slowNext);
    setBusy(false);
    setSlowNext((s) => !s);
  };
  const px = size === 'lg' ? 26 : size === 'sm' ? 15 : 19;
  return (
    <button className={`audio-btn audio-${size} ${busy ? 'is-playing' : ''}`} onClick={go} aria-label={label || `Play: ${text}`} title="Tap again for slow">
      <Icon name={slowNext ? 'slow' : 'volume'} size={px} />
    </button>
  );
}

/** Renders **bold** segments (Dutch words in explanations) as highlighted spans. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <strong key={i} className="nl-hl">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\s*\n/).map((p, i) => (
        <p key={i}>
          <Rich text={p} />
        </p>
      ))}
    </>
  );
}

export function ArticleChip({ article }: { article: 'de' | 'het' | null | undefined }) {
  if (!article) return null;
  return <span className={`art art-${article}`}>{article}</span>;
}

export function Bar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="bar">
      <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
    </div>
  );
}

export function Ring({ value, size = 44, stroke = 4, color = 'var(--blue)', children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  );
}

export function dutchGreeting(d = new Date()) {
  const h = d.getHours();
  if (h < 6) return 'Goedenacht';
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}
