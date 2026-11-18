// Text helpers: normalisation, distance, word diff, stable hashing.

const PUNCT = /[.,!?¿¡;:"“”„()[\]…–—-]/g;

export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(PUNCT, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function loose(s: string): string {
  return stripAccents(norm(s));
}

export function lev(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

export function closest(answer: string, refs: string[]): { ref: string; dist: number } {
  const a = loose(answer);
  let best = { ref: refs[0] ?? '', dist: Infinity };
  for (const r of refs) {
    const d = lev(a, loose(r));
    if (d < best.dist) best = { ref: r, dist: d };
  }
  return best;
}

export type DiffPart = { text: string; kind: 'same' | 'wrong' | 'missing' };

/** Word diff of the reference against the answer: which reference words the learner got, which they missed. */
export function diffWords(answer: string, ref: string): DiffPart[] {
  const a = loose(answer).split(' ').filter(Boolean);
  const rWords = ref.split(/\s+/).filter(Boolean);
  const r = rWords.map(loose);
  const m = a.length;
  const n = r.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === r[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (j < n) {
    if (i < m && a[i] === r[j]) {
      out.push({ text: rWords[j], kind: 'same' });
      i++;
      j++;
    } else if (i < m && dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      out.push({ text: rWords[j], kind: 'missing' });
      j++;
    }
  }
  return out;
}

/** 64-bit FNV-1a, hex. Mirrored in LLMers-langs/pipeline/tts.py to name audio files. */
export function fnv64(s: string): string {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  const bytes = new TextEncoder().encode(s);
  for (const b of bytes) {
    h ^= BigInt(b);
    h = (h * prime) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
}

export function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = arr.slice();
  let s = seed ?? Math.floor(Math.random() * 1e9);
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Split a sentence into tiles for build exercises (keeps original casing, drops punctuation). */
export function tiles(sentence: string): string[] {
  return sentence
    .replace(/[.,!?;:"“”()…]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
