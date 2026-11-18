import { useEffect, useRef, useState } from 'react';
import { Icon } from '../ui';

type SR = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  onerror: () => void;
};

function getSR(): (new () => SR) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function MicButton({ onText, disabled }: { onText: (t: string) => void; disabled?: boolean }) {
  const [on, setOn] = useState(false);
  const ref = useRef<SR | null>(null);
  const Ctor = getSR();
  if (!Ctor) return null;
  const toggle = () => {
    if (on) {
      ref.current?.stop();
      return;
    }
    const r = new Ctor();
    r.lang = 'nl-NL';
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      const t = Array.from(e.results)
        .map((x) => x[0].transcript)
        .join(' ');
      onText(t);
    };
    r.onend = () => setOn(false);
    r.onerror = () => setOn(false);
    ref.current = r;
    setOn(true);
    r.start();
  };
  return (
    <button type="button" className={`mic ${on ? 'mic-on' : ''}`} onClick={toggle} disabled={disabled} aria-label={on ? 'Stop listening' : 'Speak your answer in Dutch'}>
      <Icon name="mic" size={20} />
    </button>
  );
}

const ACCENTS = ['é', 'ë', 'è', 'ï', 'ö', 'ü', "'"];

export function DutchInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = 'Type in Dutch…',
  rows = 2,
  autoFocus = true,
  single = false,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
  single?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus && !disabled && window.matchMedia('(pointer: fine)').matches) ref.current?.focus();
  }, [autoFocus, disabled]);
  const insert = (ch: string) => {
    const el = ref.current;
    if (!el) return onChange(value + ch);
    const s = el.selectionStart ?? value.length;
    const e = el.selectionEnd ?? value.length;
    onChange(value.slice(0, s) + ch + value.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + ch.length, s + ch.length);
    });
  };
  const common = {
    ref,
    value,
    disabled,
    placeholder,
    spellCheck: false,
    autoCapitalize: 'off',
    autoCorrect: 'off',
    autoComplete: 'off',
    lang: 'nl',
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement & HTMLInputElement>) => onChange(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }
    },
  };
  return (
    <div className={`dutch-input ${disabled ? 'is-disabled' : ''}`}>
      {single ? <input className="field" {...common} /> : <textarea className="field" rows={rows} {...common} />}
      <div className="input-tools">
        <div className="accents">
          {ACCENTS.map((a) => (
            <button key={a} type="button" tabIndex={-1} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(a)}>
              {a}
            </button>
          ))}
        </div>
        <MicButton disabled={disabled} onText={(t) => onChange((value ? value + ' ' : '') + t)} />
      </div>
    </div>
  );
}
