// Vice Panels editor: wires the page to the cover engine (./cover.js). Photos are read from the
// maker's own machine with object URLs and drawn on the canvas; nothing is uploaded anywhere.
// A `?shot=` query sets up a fixed scene for screenshots instead (./shots.js).

import { SIZES, LAYOUTS, GRADES, TITLE_STYLES, drawCover, freshPanel, panelAt } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('stage');
const status = document.getElementById('status');

const state = {
  layout: 'collage',
  size: 'square',
  panels: [],
  photos: [],
  photoNames: [],
  grade: 'sunset',
  title: 'Vice Heat',
  subtitle: 'Ocean drive nights',
  titleStyle: 'vice',
  titlePos: 'bottom',
  badge: true,
  chip: true,
  chipText: '18+',
  grain: true,
  vignette: true,
  selected: 0,
};

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Rebuilds the panel states for the current layout, keeping what still fits by index. */
function rebuildPanels(mode) {
  const count = LAYOUTS[state.layout].panels.length;
  const next = [];
  for (let i = 0; i < count; i++) {
    const kept = state.panels[i];
    if (kept && mode === 'keep') next.push(kept);
    else if (mode === 'spread') next.push(freshPanel(state.photos.length ? i % state.photos.length : -1));
    else next.push(freshPanel(state.photos.length ? 0 : -1));
  }
  state.panels = next;
  if (state.selected >= count) state.selected = 0;
}

/** Adds a loaded photo to the photo list and the thumbnail strip. */
function addPhoto(image, name) {
  state.photos.push(image);
  state.photoNames.push(name);
  const figure = document.createElement('figure');
  const img = document.createElement('img');
  img.src = image.src;
  img.alt = name;
  const caption = document.createElement('figcaption');
  caption.textContent = name;
  figure.append(img, caption);
  document.getElementById('thumbs').append(figure);
  if (state.photos.length === 1) rebuildPanels('one');
  syncPanelControls();
  redraw();
}

async function addSample(which) {
  const image = await loadImage(`samples/${which}.jpg`);
  addPhoto(image, which === 'pier' ? 'The pier (sample)' : 'The boulevard (sample)');
}

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const image = await loadImage(URL.createObjectURL(file));
    addPhoto(image, file.name.replace(/\.[^.]+$/, ''));
  }
  if (files.length) setStatus(`${state.photos.length} photo(s) ready — pick a layout and export.`);
}

function setStatus(text) {
  status.textContent = text;
}

/** Builds a row of chip buttons for a metadata object and marks the active one. */
function buildChips(id, entries, current, onPick) {
  const host = document.getElementById(id);
  host.textContent = '';
  for (const [key, meta] of entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = meta.label;
    if (key === current) button.classList.add('active');
    button.addEventListener('click', () => onPick(key));
    host.append(button);
  }
}

function refreshChips() {
  buildChips('layoutChips', Object.entries(LAYOUTS), state.layout, (key) => {
    state.layout = key;
    rebuildPanels('keep');
    refreshChips();
    syncPanelControls();
    redraw();
  });
  buildChips('sizeChips', Object.entries(SIZES), state.size, (key) => {
    state.size = key;
    canvas.width = SIZES[key].w;
    canvas.height = SIZES[key].h;
    refreshChips();
    redraw();
  });
  buildChips('styleChips', Object.entries(TITLE_STYLES), state.titleStyle, (key) => {
    state.titleStyle = key;
    refreshChips();
    redraw();
  });
  buildChips('gradeChips', Object.entries(GRADES), state.grade, (key) => {
    state.grade = key;
    refreshChips();
    redraw();
  });
}

/** Points the panel controls (photo name, grade, zoom) at the selected panel. */
function syncPanelControls() {
  const ps = state.panels[state.selected];
  const name = document.getElementById('panelPhotoName');
  const zoom = document.getElementById('panelZoom');
  const grade = document.getElementById('panelGrade');
  if (!ps) {
    name.textContent = '—';
    return;
  }
  name.textContent = ps.photo >= 0 && state.photoNames[ps.photo]
    ? `Panel ${state.selected + 1}: ${state.photoNames[ps.photo]}`
    : `Panel ${state.selected + 1}: no photo`;
  zoom.value = String(ps.zoom);
  grade.value = ps.grade;
}

function selectedPanel() {
  return state.panels[state.selected];
}

function wireControls() {
  const input = document.getElementById('photoInput');
  input.addEventListener('change', () => addFiles([...input.files]));
  const drop = document.getElementById('dropZone');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dragging'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dragging'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('dragging');
    addFiles([...e.dataTransfer.files]);
  });
  document.getElementById('samplePier').addEventListener('click', () => addSample('pier'));
  document.getElementById('sampleBoulevard').addEventListener('click', () => addSample('boulevard'));
  document.getElementById('fillAll').addEventListener('click', () => { rebuildPanels('one'); syncPanelControls(); redraw(); });
  document.getElementById('fillSpread').addEventListener('click', () => { rebuildPanels('spread'); syncPanelControls(); redraw(); });

  const title = document.getElementById('titleInput');
  const subtitle = document.getElementById('subtitleInput');
  title.addEventListener('input', () => { state.title = title.value; redraw(); });
  subtitle.addEventListener('input', () => { state.subtitle = subtitle.value; redraw(); });
  document.getElementById('titleTop').addEventListener('change', (e) => { state.titlePos = e.target.checked ? 'top' : 'bottom'; redraw(); });
  document.getElementById('badgeToggle').addEventListener('change', (e) => { state.badge = e.target.checked; redraw(); });
  document.getElementById('chipToggle').addEventListener('change', (e) => { state.chip = e.target.checked; redraw(); });
  document.getElementById('chipText').addEventListener('input', (e) => { state.chipText = e.target.value; redraw(); });
  document.getElementById('grainToggle').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
  document.getElementById('vignetteToggle').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });

  const grade = document.getElementById('panelGrade');
  grade.append(new Option('Use cover grade', 'auto'));
  for (const [key, meta] of Object.entries(GRADES)) grade.append(new Option(meta.label, key));
  grade.addEventListener('change', () => { selectedPanel().grade = grade.value; redraw(); });
  document.getElementById('panelZoom').addEventListener('input', (e) => { selectedPanel().zoom = Number(e.target.value); redraw(); });
  document.getElementById('panelReset').addEventListener('click', () => {
    const ps = selectedPanel();
    ps.panX = 0; ps.panY = 0; ps.zoom = 1;
    syncPanelControls();
    redraw();
  });
  const cyclePhoto = (step) => {
    const ps = selectedPanel();
    if (!state.photos.length) return;
    ps.photo = (ps.photo + step + state.photos.length) % state.photos.length;
    syncPanelControls();
    redraw();
  };
  document.getElementById('panelPhotoPrev').addEventListener('click', () => cyclePhoto(-1));
  document.getElementById('panelPhotoNext').addEventListener('click', () => cyclePhoto(1));

  document.getElementById('surprise').addEventListener('click', () => {
    const pick = (obj) => { const keys = Object.keys(obj); return keys[Math.floor(Math.random() * keys.length)]; };
    state.layout = pick(LAYOUTS);
    state.grade = pick(GRADES);
    state.titleStyle = pick(TITLE_STYLES);
    rebuildPanels('spread');
    for (const ps of state.panels) {
      ps.panX = Math.random() * 1.2 - 0.6;
      ps.panY = Math.random() * 1.2 - 0.6;
      ps.zoom = 1 + Math.random() * 0.7;
    }
    refreshChips();
    syncPanelControls();
    redraw();
    setStatus('A new mix — tweak it or export it as it stands.');
  });

  document.getElementById('exportPng').addEventListener('click', () => {
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vice-panels-cover-${canvas.width}x${canvas.height}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus(`Saved vice-panels-cover-${canvas.width}x${canvas.height}.png`);
    }, 'image/png');
  });
}

/** Canvas pointer work: click selects a panel, drag pans its photo, wheel zooms it. */
function wireCanvas() {
  let drag = null;
  const fraction = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      fx: (e.clientX - rect.left) / rect.width,
      fy: (e.clientY - rect.top) / rect.height,
      px: (e.clientX - rect.left) * (canvas.width / rect.width),
      py: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  canvas.addEventListener('pointerdown', (e) => {
    const { fx, fy, px, py } = fraction(e);
    const hit = panelAt(state.layout, fx, fy);
    if (hit < 0) return;
    state.selected = hit;
    syncPanelControls();
    const ps = selectedPanel();
    drag = { x: px, y: py, panX: ps.panX, panY: ps.panY };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { px, py } = fraction(e);
    const ps = selectedPanel();
    const panel = LAYOUTS[state.layout].panels[state.selected].rect;
    const pw = panel[2] * canvas.width;
    const ph = panel[3] * canvas.height;
    if (ps.photo >= 0 && state.photos[ps.photo]) {
      const img = state.photos[ps.photo];
      const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * ps.zoom;
      const overflowX = Math.max(1, img.naturalWidth * scale - pw);
      const overflowY = Math.max(1, img.naturalHeight * scale - ph);
      ps.panX = Math.max(-1, Math.min(1, drag.panX + 2 * (px - drag.x) / overflowX));
      ps.panY = Math.max(-1, Math.min(1, drag.panY + 2 * (py - drag.y) / overflowY));
    }
    redraw();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    const { fx, fy } = fraction(e);
    if (panelAt(state.layout, fx, fy) !== state.selected) return;
    e.preventDefault();
    const ps = selectedPanel();
    ps.zoom = Math.max(1, Math.min(3, ps.zoom * Math.exp(-e.deltaY * 0.0012)));
    document.getElementById('panelZoom').value = String(ps.zoom);
    redraw();
  }, { passive: false });
}

/** Applies a screenshot scene (see ./shots.js): samples in, layout/size/caption set, UI in step. */
async function applyScene(cfg) {
  state.layout = LAYOUTS[cfg.layout] ? cfg.layout : 'collage';
  state.size = SIZES[cfg.size] ? cfg.size : 'square';
  canvas.width = SIZES[state.size].w;
  canvas.height = SIZES[state.size].h;
  state.title = cfg.title;
  state.subtitle = cfg.subtitle;
  state.titleStyle = TITLE_STYLES[cfg.titleStyle] ? cfg.titleStyle : 'vice';
  state.grade = GRADES[cfg.grade] ? cfg.grade : 'sunset';
  document.getElementById('titleInput').value = cfg.title;
  document.getElementById('subtitleInput').value = cfg.subtitle;
  if (cfg.photo === 'both') {
    await addSample('pier');
    await addSample('boulevard');
    rebuildPanels('spread');
  } else {
    await addSample(cfg.photo === 'boulevard' ? 'boulevard' : 'pier');
    rebuildPanels('one');
  }
  if (cfg.panX || cfg.panY) {
    for (const ps of state.panels) {
      ps.panX = Math.max(-1, Math.min(1, cfg.panX || 0));
      ps.panY = Math.max(-1, Math.min(1, cfg.panY || 0));
    }
  }
  state.selected = -1;
  refreshChips();
  syncPanelControls();
  redraw();
}

window.__coverPNG = () => canvas.toDataURL('image/png');

wireControls();
wireCanvas();
refreshChips();
rebuildPanels('one');

await Promise.all([
  document.fonts.load('90px "Vice Display"'),
  document.fonts.load('700 20px "Vice UI"'),
]);

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  await runShot(shot, new URLSearchParams(location.search), applyScene);
} else {
  await addSample('pier');
  state.selected = 0;
  syncPanelControls();
  redraw();
}
