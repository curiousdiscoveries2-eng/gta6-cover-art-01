# Session notes — building the gta6-cover-art-01 entry ("Vice Panels")

Note on transcripts: this bounty's requirements state it takes **no transcript upload** —
its entry transcripts are built from sealed recordings made by the kit's `record` command
(`recording_ids` is a required form field). This file is the builder's own session log for
the person who submits the entry; it does not replace a kit recording.

## What was done, in order

1. Read the bounty page (make.fun/bounty/gta6-cover-art-01) and the machine requirements
   (GET /api/competitions/gta6-cover-art-01/requirements): deliverables are a public repo
   with `main.ts` (Node 22) at the root, `vendor/makefun-app.ts` copied from the kit
   unchanged, the static web app under `app/`, 3–4 screenshots under `screenshots/`, an
   OSI license, and the kit README badges. Deadline Sat 21 Nov 2026 10:30 UTC.
2. Downloaded the competition kit (`GET /c/gta6-cover-art-01/kit`), read `RULES.txt` and
   the starter. Kept from the kit: `vendor/makefun-app.ts` (byte-identical, sha256
   14e650ad…70e) and the two free-to-use sample photos (`app/samples/pier.jpg`,
   `app/samples/boulevard.jpg`). Everything else was written for this entry.
3. Wrote the cover engine `app/src/cover.js`: five rect-and-chamfer panel layouts, per-panel
   photo state (photo, pan, zoom, grade), six colour grades (canvas filter + tint washes),
   four caption lettering styles with auto-fit multi-line condensed type, star badge,
   corner chip, seeded film grain, vignette. Fixed a text-wrap measurement bug found on
   review of the first draft.
4. Wrote the editor `app/index.html` + `app/style.css` + `app/src/main.js`: photo intake
   (file picker, drag-and-drop, samples), layout/size/style/grade chips, per-panel controls
   (click to select, drag to pan, wheel/slider to zoom, per-panel grade), toggles, a
   "Surprise me" remix, and PNG export at 1080×1080 / 1080×1350 / 1920×1080 via canvas.toBlob.
   Bundled two Noto fonts (SIL OFL 1.1) under `app/fonts/` so lettering is identical offline.
5. Wrote `app/src/shots.js` screenshot scenes (`?shot=cover|editor`, with `panx`/`pany`
   framing params added after the first capture review), plus `main.ts` and `serve.ts`.
6. Captured the four screenshots with headless Chromium (Playwright) against the local
   server: exported covers taken from the app's own canvas (`window.__coverPNG()`), the
   editor as a page capture, all within the gate's limits (≤256 KiB, long side ≤1280,
   short side ≥480). Visually reviewed every capture; fixed the hero-layout crop that cut
   the subject's head (added `pany=0.85` to that scene) and an editor subtitle that did not
   match its scene, then re-captured.
7. Verified: no `http://`/`https://` references anywhere in the app code (all loads are
   files under `app/`); all three JS modules parse as ES modules; `node main.ts` writes
   `out/` with a `dossier.json` produced by the vendored `buildDossier`.

## Still for the submitter

- Create the public GitHub repository (owner must match the make.fun account's GitHub
  login, curiousdiscoveries2-eng) and set its About (homepage = the bounty page, topic
  `makefun`) per the requirements' `repo_about` line.
- The entry itself must be submitted with the kit CLI and a sealed recording
  (`node cli/makefun.mjs record …` / `submit …`) from a recorded harness session.
