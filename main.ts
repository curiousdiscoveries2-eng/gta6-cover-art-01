// Vice Panels — entrypoint for make.fun's "Make GTA 6 Cover Art" bounty (Node 22, standard
// library only). The deliverable is the static web app in app/ (it opens offline in a desktop
// browser and never touches the network); this program hands it in: it copies app/ and
// screenshots/ from beside this file into the output directory and writes dossier.json there
// with buildDossier from the vendored make.fun library, byte for byte as the scorer rebuilds it.
//
// Run it the way the grader does, from the repository root:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (MAKEFUN_OUTPUT_DIR stands in for /output outside the grader's container.)
// Try the app itself with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (see the bounty's gate): they keep the hand-in inside the
// limits the scorer enforces — at most 4 screenshots of 256 KiB, at most 993 files and 48 MiB
// under app/, no app path over 1000 bytes — and cap the dossier's source text at 160 KiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`Vice Panels handed in: app/ + screenshots/ + dossier.json -> ${out}`);
