import { useEffect, useState } from 'react';
import type { CourseIndex, Lesson, LessonMeta, UnitMeta } from './types';

const BASE = `${import.meta.env.BASE_URL}course/nl/`;
let indexPromise: Promise<CourseIndex> | null = null;
const lessonCache = new Map<string, Promise<Lesson>>();

export function loadIndex(): Promise<CourseIndex> {
  if (!indexPromise)
    indexPromise = fetch(BASE + 'index.json').then((r) => {
      if (!r.ok) throw new Error('Could not load the course');
      return r.json();
    });
  return indexPromise;
}

export function loadLesson(id: string): Promise<Lesson> {
  let p = lessonCache.get(id);
  if (!p) {
    p = fetch(`${BASE}lessons/${id}.json`).then((r) => {
      if (!r.ok) throw new Error('Could not load this lesson');
      return r.json();
    });
    p.catch(() => lessonCache.delete(id));
    lessonCache.set(id, p);
  }
  return p;
}

export function useIndex(): CourseIndex | null {
  const [idx, setIdx] = useState<CourseIndex | null>(null);
  useEffect(() => {
    loadIndex().then(setIdx).catch(() => setIdx(null));
  }, []);
  return idx;
}

export function useLesson(id: string | null): { lesson: Lesson | null; error: string | null } {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    setLesson(null);
    setError(null);
    loadLesson(id).then(setLesson).catch((e) => setError(String(e.message || e)));
  }, [id]);
  return { lesson, error };
}

export function flatLessons(idx: CourseIndex): { unit: UnitMeta; lesson: LessonMeta; n: number }[] {
  const out: { unit: UnitMeta; lesson: LessonMeta; n: number }[] = [];
  idx.units.forEach((u) => u.lessons.forEach((l, i) => out.push({ unit: u, lesson: l, n: i + 1 })));
  return out;
}

export const UNIT_COLORS: Record<string, string> = {
  u01: '#E4572E',
  u02: '#2F6FB5',
  u03: '#2E9E5B',
  u04: '#E9A23B',
  u05: '#8E5BD8',
  u06: '#D9467A',
  u07: '#159A8C',
  u08: '#3E5BE0',
  u09: '#A8613A',
  u10: '#0E9CC9',
  u11: '#C2283A',
  u12: '#25324D',
};

export function unitColor(id: string) {
  return UNIT_COLORS[id] || '#2F6FB5';
}

export function unitNumber(id: string) {
  return Number(id.replace(/\D/g, ''));
}
