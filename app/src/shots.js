// Fixed scenes for screenshots: ?shot=cover shows the cover alone filling the window, ?shot=editor
// shows the editor with a sample photo loaded and panels filled. The query picks the sample photo
// (`photo` pier|boulevard|both), `layout`, `size`, `caption`, `sub`, `style` and `grade`.
// window.__shotReady is set once the scene is painted, and window.__coverPNG() hands back the
// cover canvas exactly as the Export button writes it, so a screenshot can be the exported PNG.

export async function runShot(shot, query, applyScene) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await applyScene({
    photo: query.get('photo') ?? 'pier',
    layout: query.get('layout') ?? 'collage',
    size: query.get('size') ?? 'square',
    title: query.get('caption') ?? 'Vice Heat',
    subtitle: query.get('sub') ?? 'Ocean drive nights',
    titleStyle: query.get('style') ?? 'vice',
    grade: query.get('grade') ?? 'sunset',
    panX: Number(query.get('panx') ?? 0),
    panY: Number(query.get('pany') ?? 0),
  });
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
