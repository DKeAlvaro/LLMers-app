// Copy the built course from the LLMers-langs repo into public/course/nl.
// Source: $COURSE_SRC or ../LLMers-langs/course/nl
import { cpSync, existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const src = resolve(process.env.COURSE_SRC || '../LLMers-langs/course/nl');
const dst = resolve('public/course/nl');
if (!existsSync(resolve(src, 'index.json'))) {
  console.error(`sync-course: no index.json in ${src}`);
  process.exit(1);
}
rmSync(dst, { recursive: true, force: true });
mkdirSync(dst, { recursive: true });
cpSync(resolve(src, 'index.json'), resolve(dst, 'index.json'));
cpSync(resolve(src, 'lessons'), resolve(dst, 'lessons'), { recursive: true });
if (existsSync(resolve(src, 'audio'))) cpSync(resolve(src, 'audio'), resolve(dst, 'audio'), { recursive: true });
const n = readdirSync(resolve(dst, 'lessons')).length;
const a = existsSync(resolve(dst, 'audio')) ? readdirSync(resolve(dst, 'audio')).length : 0;
console.log(`sync-course: ${n} lessons, ${a} audio files from ${src}`);
