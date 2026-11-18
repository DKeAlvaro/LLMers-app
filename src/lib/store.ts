// Persistent learner state in localStorage, exposed to React with useSyncExternalStore.
import { useSyncExternalStore } from 'react';
import { today } from './text';
import type { Lesson } from './types';

export interface Card {
  k: string;
  nl: string;
  en: string;
  article: 'de' | 'het' | null;
  lesson: string;
  kind: 'word' | 'phrase';
  box: number;
  due: number;
  seen: number;
  lapses: number;
}

export interface Settings {
  theme: 'system' | 'light' | 'dark';
  speed: number;
  autoplay: boolean;
  dailyGoal: number;
  unlockAll: boolean;
  name: string;
}

export interface State {
  v: 1;
  completed: Record<string, { at: number; score: number }>;
  resume: Record<string, { stage: number; step: number }>;
  xp: number;
  days: Record<string, number>;
  cards: Record<string, Card>;
  checkpoints: Record<string, number>;
  mistakes: { at: number; lesson: string; prompt: string; answer: string; best: string; error?: string }[];
  settings: Settings;
  onboarded: boolean;
}

const KEY = 'llmers.nl.v1';

const DEFAULT: State = {
  v: 1,
  completed: {},
  resume: {},
  xp: 0,
  days: {},
  cards: {},
  checkpoints: {},
  mistakes: [],
  settings: { theme: 'system', speed: 1, autoplay: true, dailyGoal: 30, unlockAll: false, name: '' },
  onboarded: false,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    const s = JSON.parse(raw);
    return { ...structuredClone(DEFAULT), ...s, settings: { ...DEFAULT.settings, ...(s.settings || {}) } };
  } catch {
    return structuredClone(DEFAULT);
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function emit() {
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function update(fn: (s: State) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  emit();
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => sel(state),
  );
}

export function resetAll() {
  state = structuredClone(DEFAULT);
  emit();
}

export function exportState(): string {
  return JSON.stringify(state);
}

export function importState(json: string) {
  const s = JSON.parse(json);
  if (s?.v !== 1) throw new Error('Not an LLMers backup');
  state = { ...structuredClone(DEFAULT), ...s };
  emit();
}

// ---- XP, streak ------------------------------------------------------------

export function addXp(n: number) {
  update((s) => {
    s.xp += n;
    const d = today();
    s.days[d] = (s.days[d] || 0) + n;
  });
}

export function streak(s: State): number {
  let n = 0;
  const d = new Date();
  const key = (x: Date) =>
    `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  // today counts if practised; otherwise the streak is still alive from yesterday
  if (!s.days[key(d)]) d.setDate(d.getDate() - 1);
  while (s.days[key(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

// ---- Spaced repetition -----------------------------------------------------

const DAY = 86400000;
const INTERVALS = [0, 1, 3, 7, 16, 35, 80, 180];

export function addLessonCards(lesson: Lesson) {
  update((s) => {
    const now = Date.now();
    for (const w of lesson.words) {
      const k = w.nl.toLowerCase();
      if (!s.cards[k])
        s.cards[k] = { k, nl: w.nl, en: w.en, article: w.article, lesson: lesson.id, kind: 'word', box: 1, due: now + DAY, seen: 0, lapses: 0 };
    }
    for (const p of lesson.phrases) {
      const k = p.nl.toLowerCase();
      if (!s.cards[k])
        s.cards[k] = { k, nl: p.nl, en: p.en, article: null, lesson: lesson.id, kind: 'phrase', box: 1, due: now + DAY, seen: 0, lapses: 0 };
    }
  });
}

export function gradeCard(k: string, ok: boolean) {
  update((s) => {
    const c = s.cards[k];
    if (!c) return;
    c.seen++;
    if (ok) c.box = Math.min(c.box + 1, INTERVALS.length - 1);
    else {
      c.box = 1;
      c.lapses++;
    }
    c.due = Date.now() + INTERVALS[c.box] * DAY - 3600000; // an hour of slack so "tomorrow" means tomorrow
  });
}

export function dueCards(s: State): Card[] {
  const now = Date.now();
  return Object.values(s.cards)
    .filter((c) => c.due <= now)
    .sort((a, b) => a.due - b.due);
}

export function logMistake(m: State['mistakes'][number]) {
  update((s) => {
    s.mistakes.unshift(m);
    s.mistakes = s.mistakes.slice(0, 200);
  });
}
