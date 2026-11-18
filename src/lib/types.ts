export type Level = 'A0' | 'A1' | 'A2' | 'A2+';

export interface CourseIndex {
  language: string;
  name: string;
  version: string;
  units: UnitMeta[];
}

export interface UnitMeta {
  id: string;
  title: string;
  subtitle: string;
  level: Level;
  lessons: LessonMeta[];
}

export interface LessonMeta {
  id: string;
  title: string;
  subtitle: string;
  level: Level;
  words: number;
  exercises: number;
  goals: string[];
}

export interface NlEn {
  nl: string;
  en: string;
}

export interface Word {
  nl: string;
  en: string;
  pos: string;
  article: 'de' | 'het' | null;
  plural: string | null;
  forms: string | null;
  example: NlEn;
  note: string | null;
}

export interface Phrase {
  nl: string;
  en: string;
  note: string | null;
}

export interface Grammar {
  title: string;
  explanation: string;
  table: { headers: string[]; rows: string[][] } | null;
  examples: NlEn[];
  tip: string | null;
}

export interface Speaker {
  name: string;
  gender: 'f' | 'm';
}

export interface Dialogue {
  title: string;
  setting: string;
  speakers: Speaker[];
  lines: { speaker: string; nl: string; en: string }[];
}

export interface Mistake {
  id: string;
  pattern: string;
  explain: string;
}

export type Exercise =
  | { type: 'match'; pairs: [string, string][] }
  | { type: 'choice'; prompt: string; nl: string | null; options: string[]; answer: number; explain: string }
  | { type: 'article'; word: string; en: string; answer: 'de' | 'het' }
  | { type: 'build'; en: string; answer: string; accept: string[]; extra: string[]; explain?: string }
  | { type: 'gap'; text: string; en: string; answers: string[]; hint: string; explain?: string }
  | { type: 'translate'; en: string; answers: string[]; focus: string; mistakes?: Mistake[] }
  | { type: 'listen'; nl: string; en: string }
  | { type: 'reply'; context: string; say: NlEn; task: string; examples: string[]; mistakes?: Mistake[] };

export interface RoleplayTurn {
  say: NlEn;
  task: string;
  examples: string[];
  mistakes?: Mistake[];
}

export interface Roleplay {
  title: string;
  setting: string;
  partner: { name: string; gender: 'f' | 'm'; role: string };
  turns: RoleplayTurn[];
  closing: NlEn;
}

export interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  level: Level;
  intro: string;
  goals?: string[];
  words: Word[];
  phrases: Phrase[];
  grammar: Grammar[];
  dialogue: Dialogue;
  exercises: Exercise[];
  roleplay: Roleplay;
  culture: { title: string; text: string };
  summary: string[];
}
