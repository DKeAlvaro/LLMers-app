// Native-speaker audio: pre-generated neural TTS clips (see LLMers-langs/pipeline/tts.py),
// falling back to the browser's Dutch speech synthesis when a clip is missing.
import { getState } from './store';
import { fnv64 } from './text';

export type Voice = 'F' | 'M' | 'C'; // Fenna, Maarten, Colette (nl-NL neural voices)

const BASE = `${import.meta.env.BASE_URL}course/nl/audio/`;
let current: HTMLAudioElement | null = null;
const missing = new Set<string>();

export function clipName(text: string, voice: Voice): string {
  return fnv64(`${voice}|${text.trim()}`) + '.mp3';
}

export function stop() {
  current?.pause();
  current = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function speakFallback(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'nl-NL';
    u.rate = rate;
    const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith('nl'));
    if (v) u.voice = v;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function play(text: string, voice: Voice = 'F', slow = false): Promise<void> {
  stop();
  const rate = (slow ? 0.7 : 1) * (getState().settings.speed || 1);
  const name = clipName(text, voice);
  if (missing.has(name)) return speakFallback(text, rate);
  return new Promise((resolve) => {
    const a = new Audio(BASE + name);
    current = a;
    a.playbackRate = rate;
    (a as HTMLAudioElement & { preservesPitch?: boolean }).preservesPitch = true;
    a.onended = () => resolve();
    a.onerror = () => {
      missing.add(name);
      if (current === a) speakFallback(text, rate).then(resolve);
      else resolve();
    };
    a.play().catch(() => {
      // autoplay blocked or file missing
      if (!a.error) resolve();
    });
  });
}

export function preload(texts: [string, Voice][]) {
  for (const [t, v] of texts) {
    const l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = BASE + clipName(t, v);
    document.head.appendChild(l);
  }
}

/** Voice for a dialogue speaker: first woman Fenna, second woman Colette, men Maarten. */
export function speakerVoice(speakers: { name: string; gender: 'f' | 'm' }[], name: string): Voice {
  const sp = speakers.find((s) => s.name === name);
  if (!sp) return 'F';
  if (sp.gender === 'm') return 'M';
  const women = speakers.filter((s) => s.gender === 'f');
  return women.indexOf(sp) % 2 === 1 ? 'C' : 'F';
}
