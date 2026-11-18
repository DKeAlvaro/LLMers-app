# LLMers — Dutch

Learn Dutch from zero to A2+ in the browser (installable PWA): **https://dkealvaro.github.io/LLMers-app/**

- **63 lessons on 12 "lines"** (A0 → A2+), each: new words and phrases with native audio, short grammar notes,
  a dialogue, ~20 exercises (match, choice, de/het, build, gap, listening, translation, free replies) and a roleplay.
- **Teach before test**: every Dutch word you read, hear or must write was taught earlier — checked mechanically
  (`LLMers-langs/pipeline/coverage.py`).
- **Answer checking with Jev** (TypeSafe System One): free answers are classified as correct / typo / wrong, Jev picks
  which of the lesson's authored mistakes you made and which word is wrong, so every explanation comes from the lesson.
  No generative model at runtime.
- Spaced review of every word and phrase, line tests, words list, streaks, light/dark theme, offline after first load.

## Layout

| Repo | What |
|---|---|
| `LLMers-app` (this) | React + Vite PWA (`src/`), correction server (`server/proxy.mjs`, runs on the VPS behind Caddy) |
| `LLMers-langs` | Syllabus, generation/review/coverage pipeline, lesson JSON, audio |
| `LLMers-web` | Landing page |

The old Expo app lives on the `legacy-expo` branch.

## Develop

```bash
npm install
npm run sync      # copies ../LLMers-langs/course/nl into public/course/nl
npm run dev
```

`VITE_API` overrides the correction server URL (default `https://llmers.5.175.211.104.sslip.io`).

## Correction server

`server/proxy.mjs` (Node, no dependencies): `POST /check` → Jev, schema-locked, rate-limited per IP and per day.
Deployed as `llmers-proxy.service` (user `llmers`, port 8796, key in `/etc/llmers-proxy.env`), Caddy site
`llmers.5.175.211.104.sslip.io`.
