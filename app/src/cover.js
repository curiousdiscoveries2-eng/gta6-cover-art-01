// Vice Panels cover engine: draws a multi-panel, GTA-poster-style cover onto a canvas.
//
// A cover is a set of rectangular panels (some with one chamfered corner for the angled poster
// feel), each filled with one photo that can be panned and zoomed and finished with a colour
// grade, then a big condensed caption with a heavy outline across the top or bottom. Everything
// is drawn with the canvas 2D API from images the page already holds: no network, no library.

/** The export sizes, in pixels: the common post sizes the bounty names. */
export const SIZES = {
  square: { label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
};

/** Panel layouts. Each panel is [x, y, w, h] in cover fractions, plus an optional chamfered corner. */
export const LAYOUTS = {
  collage: {
    label: 'Collage',
    panels: [
      { rect: [0, 0, 0.5, 0.64], chamfer: 'br' },
      { rect: [0.5, 0, 0.5, 0.32] },
      { rect: [0.5, 0.32, 0.25, 0.32] },
      { rect: [0.75, 0.32, 0.25, 0.32] },
      { rect: [0, 0.64, 0.34, 0.36] },
      { rect: [0.34, 0.64, 0.33, 0.36], chamfer: 'tl' },
      { rect: [0.67, 0.64, 0.33, 0.36] },
    ],
  },
  hero: {
    label: 'Hero strip',
    panels: [
      { rect: [0, 0, 1, 0.6], chamfer: 'br' },
      { rect: [0, 0.6, 0.34, 0.4] },
      { rect: [0.34, 0.6, 0.33, 0.4] },
      { rect: [0.67, 0.6, 0.33, 0.4], chamfer: 'tl' },
    ],
  },
  duo: {
    label: 'Duo',
    panels: [
      { rect: [0, 0, 0.56, 1], chamfer: 'br' },
      { rect: [0.56, 0, 0.44, 0.52] },
      { rect: [0.56, 0.52, 0.44, 0.48], chamfer: 'tl' },
    ],
  },
  grid: {
    label: 'Grid four',
    panels: [
      { rect: [0, 0, 0.5, 0.5] },
      { rect: [0.5, 0, 0.5, 0.5], chamfer: 'bl' },
      { rect: [0, 0.5, 0.5, 0.5], chamfer: 'tr' },
      { rect: [0.5, 0.5, 0.5, 0.5] },
    ],
  },
  strips: {
    label: 'Vice strips',
    panels: [
      { rect: [0, 0, 0.3, 1], chamfer: 'br' },
      { rect: [0.3, 0, 0.24, 1] },
      { rect: [0.54, 0, 0.24, 1], chamfer: 'tl' },
      { rect: [0.78, 0, 0.22, 1] },
    ],
  },
};

/** Colour grades: a canvas filter for the photo plus tint washes laid over it. */
export const GRADES = {
  sunset: {
    label: 'Vice sunset',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.03)',
    washes: [
      { mode: 'overlay', alpha: 0.55, from: '#ff9a3c', to: '#ff2e88', vertical: true },
      { mode: 'source-over', alpha: 0.16, from: 'rgba(59,29,94,0)', to: '#3b1d5e', vertical: true },
    ],
  },
  neon: {
    label: 'Neon nights',
    filter: 'saturate(1.5) contrast(1.16) brightness(1.0) hue-rotate(-10deg)',
    washes: [
      { mode: 'soft-light', alpha: 0.85, from: '#00e5ff', to: '#ff2ea6', vertical: false },
      { mode: 'source-over', alpha: 0.14, from: '#12002e', to: 'rgba(18,0,46,0)', vertical: true },
    ],
  },
  teal: {
    label: 'Teal heat',
    filter: 'saturate(1.18) contrast(1.12) brightness(1.01)',
    washes: [
      { mode: 'overlay', alpha: 0.45, from: '#08f7e3', to: '#ff7a18', vertical: true },
    ],
  },
  golden: {
    label: 'Golden hour',
    filter: 'sepia(0.32) saturate(1.45) contrast(1.06) brightness(1.06)',
    washes: [
      { mode: 'soft-light', alpha: 0.7, from: '#ffcf5c', to: '#ff5e3a', vertical: true },
    ],
  },
  noir: {
    label: 'Noir grit',
    filter: 'grayscale(1) contrast(1.28) brightness(0.97)',
    washes: [
      { mode: 'source-over', alpha: 0.2, from: 'rgba(0,0,0,0)', to: '#000000', vertical: true },
    ],
  },
  raw: {
    label: 'Clean',
    filter: 'saturate(1.1) contrast(1.05)',
    washes: [],
  },
};

/** Caption lettering styles: the fill (a colour or a gradient's stops) and its outline. */
export const TITLE_STYLES = {
  vice: { label: 'Vice gradient', stops: ['#fff6a8', '#ffb03a', '#ff2e88'], stroke: '#2a0a2e' },
  chrome: { label: 'Chrome pop', stops: ['#ffffff', '#ffffff'], stroke: '#101014', chromatic: true },
  sunset: { label: 'Sunset block', stops: ['#ffe259', '#ffa751', '#ff416c'], stroke: '#31135e' },
  mono: { label: 'Mono bold', stops: ['#ffffff', '#d9d9e3'], stroke: '#000000' },
};

const DISPLAY_FONT = '"Vice Display", "Arial Narrow", sans-serif';
const UI_FONT = '"Vice UI", "Segoe UI", sans-serif';

/** The default per-panel state: which photo fills it and how that photo sits. */
export function freshPanel(photoIndex) {
  return { photo: photoIndex, panX: 0, panY: 0, zoom: 1, grade: 'auto' };
}

/** Builds the polygon (in pixels) for a panel rect, shrunk by the gutter and chamfered if asked. */
export function panelPolygon(panel, w, h, gutter) {
  const [fx, fy, fw, fh] = panel.rect;
  const x0 = fx * w + gutter / 2;
  const y0 = fy * h + gutter / 2;
  const x1 = (fx + fw) * w - gutter / 2;
  const y1 = (fy + fh) * h - gutter / 2;
  const cut = Math.min(x1 - x0, y1 - y0) * 0.16;
  const c = panel.chamfer;
  const points = [];
  points.push(c === 'tl' ? [x0 + cut, y0] : [x0, y0]);
  points.push(c === 'tr' ? [x1 - cut, y0] : [x1, y0]);
  if (c === 'tr') points.push([x1, y0 + cut]);
  points.push(c === 'br' ? [x1, y1 - cut] : [x1, y1]);
  if (c === 'br') points.push([x1 - cut, y1]);
  points.push(c === 'bl' ? [x0 + cut, y1] : [x0, y1]);
  if (c === 'bl') points.push([x0, y1 - cut]);
  if (c === 'tl') points.push([x0, y0 + cut]);
  return points;
}

/** Which panel of `layoutId` sits under the cover fraction (fx, fy), or -1. */
export function panelAt(layoutId, fx, fy) {
  const panels = LAYOUTS[layoutId].panels;
  for (let i = panels.length - 1; i >= 0; i--) {
    const [x, y, w, h] = panels[i].rect;
    if (fx >= x && fx <= x + w && fy >= y && fy <= y + h) return i;
  }
  return -1;
}

function tracePath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

/** The cover's backdrop: a deep vice sky with a low sun glow, seen through the panel gutters. */
function drawBackdrop(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#160a2e');
  sky.addColorStop(0.55, '#3b1154');
  sky.addColorStop(1, '#8c1d5c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w * 0.5, h * 0.98, 0, w * 0.5, h * 0.98, h * 0.85);
  sun.addColorStop(0, 'rgba(255, 138, 60, 0.55)');
  sun.addColorStop(0.5, 'rgba(255, 46, 136, 0.18)');
  sun.addColorStop(1, 'rgba(255, 46, 136, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
}

/** Draws one photo into its panel: cover-fit, panned and zoomed, with the panel's grade. */
function drawPanelPhoto(ctx, points, image, panelState, gradeName) {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const pw = x1 - x0;
  const ph = y1 - y0;
  const grade = GRADES[gradeName] ?? GRADES.sunset;
  ctx.save();
  tracePath(ctx, points);
  ctx.clip();
  if (image) {
    const scale = Math.max(pw / image.naturalWidth, ph / image.naturalHeight) * panelState.zoom;
    const dw = image.naturalWidth * scale;
    const dh = image.naturalHeight * scale;
    const overflowX = Math.max(0, dw - pw);
    const overflowY = Math.max(0, dh - ph);
    const dx = x0 + (pw - dw) / 2 + panelState.panX * overflowX * 0.5;
    const dy = y0 + (ph - dh) / 2 + panelState.panY * overflowY * 0.5;
    ctx.filter = grade.filter;
    ctx.drawImage(image, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    const empty = ctx.createLinearGradient(x0, y0, x1, y1);
    empty.addColorStop(0, '#472b6e');
    empty.addColorStop(1, '#22123d');
    ctx.fillStyle = empty;
    ctx.fillRect(x0, y0, pw, ph);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = `700 ${Math.max(15, ph * 0.055)}px ${UI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', x0 + pw / 2, y0 + ph / 2);
  }
  for (const wash of grade.washes) {
    const grad = wash.vertical
      ? ctx.createLinearGradient(0, y0, 0, y1)
      : ctx.createLinearGradient(x0, 0, x1, 0);
    grad.addColorStop(0, wash.from);
    grad.addColorStop(1, wash.to);
    ctx.globalCompositeOperation = wash.mode;
    ctx.globalAlpha = wash.alpha;
    ctx.fillStyle = grad;
    ctx.fillRect(x0, y0, pw, ph);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  const sheen = ctx.createLinearGradient(0, y0, 0, y0 + ph * 0.4);
  sheen.addColorStop(0, 'rgba(255,255,255,0.13)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(x0, y0, pw, ph * 0.4);
  ctx.restore();
}

/** The poster's white keyline around a panel, with a hairline of dark inside it. */
function strokePanel(ctx, points, w) {
  tracePath(ctx, points);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, w * 0.007);
  ctx.stroke();
  tracePath(ctx, points);
  ctx.strokeStyle = 'rgba(10, 4, 24, 0.55)';
  ctx.lineWidth = Math.max(1.5, w * 0.0016);
  ctx.stroke();
}

/** A round star badge in a top corner, the maker's own mark (no game's logo, ever). */
function drawStarBadge(ctx, w, h, atTop) {
  const r = w * 0.052;
  const cx = w - r - w * 0.028;
  const cy = atTop ? r + h * 0.028 : h - r - h * 0.028;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ffcf3f';
  ctx.fill();
  ctx.lineWidth = r * 0.14;
  ctx.strokeStyle = '#160a2e';
  ctx.stroke();
  ctx.fillStyle = '#160a2e';
  ctx.font = `${r * 1.15}px ${UI_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', cx, cy + r * 0.06);
  ctx.restore();
}

/** A small age-chip style box in the bottom-left corner, with the maker's own short text. */
function drawCornerChip(ctx, w, h, text) {
  if (!text.trim()) return;
  ctx.save();
  ctx.font = `700 ${h * 0.026}px ${UI_FONT}`;
  const tw = ctx.measureText(text.toUpperCase()).width;
  const bw = tw + w * 0.03;
  const bh = h * 0.048;
  const bx = w * 0.026;
  const by = h - bh - h * 0.026;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, bh * 0.22);
  ctx.fillStyle = 'rgba(8, 4, 18, 0.82)';
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, w * 0.002);
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), bx + bw / 2, by + bh / 2 + 1);
  ctx.restore();
}

let grainPattern = null;
/** A tile of seeded film grain, made once and reused so every render of a cover matches. */
function getGrainPattern(ctx) {
  if (grainPattern) return grainPattern;
  const tile = document.createElement('canvas');
  tile.width = 140;
  tile.height = 140;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(140, 140);
  let seed = 20261119;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const v = 118 + (seed % 120);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  grainPattern = ctx.createPattern(tile, 'repeat');
  return grainPattern;
}

/** Splits the caption into lines at font size `size`: the maker's line breaks first, then a word wrap. */
function captionLines(ctx, text, size, maxWidth) {
  ctx.font = `${size}px ${DISPLAY_FONT}`;
  const wanted = text.toUpperCase().split('\n').map((s) => s.trim()).filter(Boolean);
  const lines = [];
  for (const chunk of wanted) {
    let line = '';
    for (const word of chunk.split(/\s+/)) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !line) line = trial;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines.slice(0, 3);
}

/** The big caption block: gradient-filled condensed capitals with a heavy outline and shadow. */
function drawTitleBlock(ctx, w, h, state) {
  const title = state.title.trim();
  if (!title) return;
  const style = TITLE_STYLES[state.titleStyle] ?? TITLE_STYLES.vice;
  const atTop = state.titlePos === 'top';
  let size = h * 0.148;
  let lines = [];
  const fontFor = (s) => `${s}px ${DISPLAY_FONT}`;
  for (; size > 18; size -= 3) {
    lines = captionLines(ctx, title, size, w * 0.94);
    ctx.font = fontFor(size);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= w * 0.94) break;
  }
  const lineHeight = size * 0.94;
  const blockH = lines.length * lineHeight;
  const baseY = atTop ? h * 0.045 : h - h * 0.045 - blockH;
  ctx.save();
  ctx.translate(w / 2, baseY + blockH / 2);
  ctx.transform(1, 0, -0.045, 1, 0, 0);
  ctx.translate(-w / 2, -(baseY + blockH / 2));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.font = fontFor(size);
  ctx.lineJoin = 'round';
  lines.forEach((line, i) => {
    const y = baseY + i * lineHeight;
    if (style.chromatic) {
      ctx.fillStyle = '#ff2ea6';
      ctx.fillText(line, w / 2 + size * 0.045, y + size * 0.03);
      ctx.fillStyle = '#00e5ff';
      ctx.fillText(line, w / 2 - size * 0.045, y - size * 0.02);
    }
    ctx.shadowColor = 'rgba(5, 0, 16, 0.55)';
    ctx.shadowBlur = size * 0.16;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(line, w / 2, y);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const fill = ctx.createLinearGradient(0, y, 0, y + size);
    style.stops.forEach((stop, j) => fill.addColorStop(j / (style.stops.length - 1), stop));
    ctx.fillStyle = fill;
    ctx.fillText(line, w / 2, y);
  });
  ctx.restore();
  if (state.subtitle.trim()) {
    ctx.save();
    const subSize = Math.max(15, h * 0.027);
    ctx.font = `700 ${subSize}px ${UI_FONT}`;
    const words = state.subtitle.toUpperCase();
    const spaced = words.split('').join('  ');
    const tw = ctx.measureText(spaced).width;
    const subY = atTop ? baseY + blockH + h * 0.018 : baseY - subSize - h * 0.03;
    ctx.beginPath();
    ctx.roundRect(w / 2 - tw / 2 - subSize * 0.9, subY - subSize * 0.42, tw + subSize * 1.8, subSize * 1.66, subSize * 0.8);
    ctx.fillStyle = 'rgba(8, 4, 18, 0.78)';
    ctx.fill();
    ctx.fillStyle = '#ffd9ec';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(spaced, w / 2, subY + subSize * 0.42);
    ctx.restore();
  }
}

/**
 * Draws the whole cover described by `state` onto `canvas` at the canvas's own size.
 * state: { layout, panels, photos, grade, title, subtitle, titleStyle, titlePos,
 *          badge, chip, chipText, grain, vignette, selected }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const gutter = Math.max(6, w * 0.008);
  drawBackdrop(ctx, w, h);
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.collage;
  const polygons = layout.panels.map((p) => panelPolygon(p, w, h, gutter));
  layout.panels.forEach((panel, i) => {
    const ps = state.panels[i] ?? freshPanel(0);
    const image = ps.photo >= 0 ? state.photos[ps.photo] ?? null : null;
    const gradeName = ps.grade === 'auto' ? state.grade : ps.grade;
    drawPanelPhoto(ctx, polygons[i], image, ps, gradeName);
  });
  polygons.forEach((points) => strokePanel(ctx, points, w));
  if (state.selected >= 0 && polygons[state.selected]) {
    tracePath(ctx, polygons[state.selected]);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = Math.max(3, w * 0.004);
    ctx.setLineDash([w * 0.02, w * 0.012]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (state.vignette) {
    const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(5,0,14,0.38)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = getGrainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  drawTitleBlock(ctx, w, h, state);
  if (state.badge) drawStarBadge(ctx, w, h, state.titlePos !== 'top');
  if (state.chip) drawCornerChip(ctx, w, h, state.chipText);
}
