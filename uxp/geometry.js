function options(value = {}) {
  const alpha = Number(value.alpha ?? 1), padding = Number(value.padding ?? 0);
  if (!Number.isInteger(alpha) || alpha < 0 || alpha > 254) throw new Error('ALPHA_RANGE');
  if (!Number.isInteger(padding) || padding < 0 || padding > 4096) throw new Error('PADDING_RANGE');
  return { alpha, padding, even: value.even !== false };
}

function scanPixels(data, width, height, components, alpha, offset = { left: 0, top: 0 }) {
  if (!width || !height) return null;
  if (![3, 4].includes(components) || data.length !== width * height * components) throw new Error('PIXEL_LAYOUT');
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (components === 3 || data[(y * width + x) * components + 3] > alpha) {
      left = Math.min(left, x); top = Math.min(top, y);
      right = Math.max(right, x); bottom = Math.max(bottom, y);
    }
  }
  return right < 0 ? null : { left: left + offset.left, top: top + offset.top, right: right + offset.left + 1, bottom: bottom + offset.top + 1 };
}

function union(a, b) {
  if (!a) return b; if (!b) return a;
  return { left: Math.min(a.left, b.left), top: Math.min(a.top, b.top), right: Math.max(a.right, b.right), bottom: Math.max(a.bottom, b.bottom) };
}

function canvasPlan(width, height, bounds, settings) {
  const config = options(settings);
  if (!bounds) return [];
  const b = { left: Math.max(0, Math.floor(bounds.left)), top: Math.max(0, Math.floor(bounds.top)), right: Math.min(width, Math.ceil(bounds.right)), bottom: Math.min(height, Math.ceil(bounds.bottom)) };
  if (b.left >= b.right || b.top >= b.bottom) return [];
  const steps = [];
  let w = width, h = height;
  function add(nextW, nextH, anchor) {
    if (nextW !== w || nextH !== h) { steps.push({ width: nextW, height: nextH, anchor }); w = nextW; h = nextH; }
  }
  // Resize the canvas twice to remove asymmetric margins. Never resample artwork.
  add(width - b.left, height - b.top, 'BOTTOMRIGHT');
  add(b.right - b.left, b.bottom - b.top, 'TOPLEFT');
  add(w + 2 * config.padding, h + 2 * config.padding, 'MIDDLECENTER');
  add(w + (config.even ? w % 2 : 0), h + (config.even ? h % 2 : 0), 'TOPLEFT');
  return steps;
}

function findBatchCommand(value) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value.title === 'string' && /^Unity Asset Trim(?:\.jsx|\.{3}|…)?$/i.test(value.title.trim())) {
    const id = value.command ?? value.commandID;
    if (Number.isInteger(id) && id !== 0) return id;
  }
  for (const child of Object.values(value)) {
    const found = findBatchCommand(child);
    if (found !== null) return found;
  }
  return null;
}
module.exports = { options, scanPixels, union, canvasPlan, findBatchCommand };
