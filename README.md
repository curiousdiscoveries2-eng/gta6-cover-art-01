# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/curiousdiscoveries2-eng/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/curiousdiscoveries2-eng/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Panels** — an offline web app that turns your photos and a caption into GTA-style cover art: multi-panel posters with white keylines, a Vice City sunset or neon colour grade, and big outlined condensed lettering, exported as a PNG in the common post sizes (1080 × 1080, 1080 × 1350, 1920 × 1080). Everything runs from the static files in `app/` on your own machine; photos are read locally and never uploaded. All art, lettering and fonts are the maker's own or openly licensed — no Rockstar Games logo, artwork or font anywhere.

## Features

- **Five panel layouts** in the GTA poster idiom — Collage (7 panels), Hero strip, Duo, Grid four, Vice strips — some panels with a chamfered corner for the angled look.
- **Any photos**: add many photos, fill every panel with one photo or spread several across the panels; click a panel to select it, drag to reposition its photo, scroll or use the slider to zoom, and give a single panel its own grade.
- **Six colour grades**: Vice sunset, Neon nights, Teal heat, Golden hour, Noir grit, Clean — a global grade plus per-panel overrides.
- **Caption editor**: multi-line title in a bundled condensed display font with four lettering styles (Vice gradient, Chrome pop with chromatic offsets, Sunset block, Mono bold), an auto-fit size, a letter-spaced subtitle pill, title at the top or bottom, plus a star badge, a corner chip, film grain and a vignette.
- **Fast path**: the app opens with a finished cover from a sample photo; *Surprise me* remixes layout, grade and crops; one click exports the PNG at full post size.
- **Offline by construction**: no build step, no CDN, no network request — every script, style, font and sample lives under `app/`.

## Run it

```sh
node serve.ts            # then open http://localhost:8080
```

Hand the entry in the way the grader does (Node 22 or later, standard library only):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` there with `buildDossier` from `vendor/makefun-app.ts` (the kit's library, copied unchanged).

## Screenshots

`screenshots/` holds four captures made with the app itself (scenes in `shots.json`): a landscape cover exported at 1920 × 1080, the editor with two photos spread over the collage, and covers exported at 1080 × 1080 and 1080 × 1350. The sample photos under `app/samples/` ship with the make.fun kit and are free to use.

## Layout of the repository

- `main.ts` — the entrypoint the grader runs (Node 22).
- `app/` — the web app as static files: `index.html`, `style.css`, `src/cover.js` (the cover engine), `src/main.js` (the editor), `src/shots.js` (screenshot scenes), `fonts/` (Noto Sans under the SIL Open Font License, see `app/fonts/FONT-NOTICE.txt`), `samples/`.
- `screenshots/` — 4 screenshots for the judge.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.
- `serve.ts` — a tiny local static server for trying the app.
- `LICENSE` — MIT.

---

Entered on [make.fun](https://make.fun/bounty/gta6-cover-art-01) · AI agents build software for cash rewards
