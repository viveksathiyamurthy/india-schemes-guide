/**
 * The painted globe on the welcome screen. Everything is drawn here with plain canvas
 * 2D calls into textures: sea, land, the five states in soft colours, clouds.
 * Soft watercolour look on purpose: pastel colours, blurred coasts, small painted trees.
 */
import { indiaStates, otherLand, stateCenters } from '@/data/geoData';
import { states } from '@/data/config';
import { norm, type V3 } from './quat';

/** The part of the world that gets a sharper texture, because we zoom into it. */
export const PATCH = { lon0: 56, lon1: 100, lat0: -6, lat1: 38 };
export const fiveSlugs = states.map((s) => s.slug);
/** Where the five states are on the globe, [lon, lat]. */
export const centers = fiveSlugs.map((slug) => stateCenters[slug]);

/* ---------- longitude / latitude <-> direction ---------- */
export function dirOf(lon: number, lat: number): V3 {
  const l = (lon * Math.PI) / 180;
  const p = (lat * Math.PI) / 180;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
}
export function lonLatOf([x, y, z]: V3): [number, number] {
  return [(Math.atan2(x, z) * 180) / Math.PI, (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI];
}

/* ---------- which state is a point in ---------- */
const boxes = fiveSlugs.map((slug) => {
  let x0 = 999, y0 = 999, x1 = -999, y1 = -999;
  for (const r of indiaStates[slug]) {
    for (let i = 0; i < r.length; i += 2) {
      x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]);
      y0 = Math.min(y0, r[i + 1]); y1 = Math.max(y1, r[i + 1]);
    }
  }
  return [x0, y0, x1, y1];
});

function inside(rings: number[][], x: number, y: number): boolean {
  let hit = false; // even-odd rule, so holes work
  for (const r of rings) {
    const n = r.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = r[i * 2], yi = r[i * 2 + 1], xj = r[j * 2], yj = r[j * 2 + 1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  }
  return hit;
}

/** Index of the state at this place, or -1. */
export function stateAtLonLat(lon: number, lat: number): number {
  for (let i = 0; i < fiveSlugs.length; i++) {
    const [x0, y0, x1, y1] = boxes[i];
    if (lon >= x0 && lon <= x1 && lat >= y0 && lat <= y1 && inside(indiaStates[fiveSlugs[i]], lon, lat)) return i;
  }
  return -1;
}

/* ---------- painting ---------- */
type Proj = (lon: number, lat: number) => [number, number];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function trace(ctx: CanvasRenderingContext2D, rings: number[][], proj: Proj) {
  ctx.beginPath();
  for (const r of rings) {
    for (let i = 0; i < r.length; i += 2) {
      const [x, y] = proj(r[i], r[i + 1]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}

const otherIndia = Object.keys(indiaStates).filter((k) => !fiveSlugs.includes(k));
const landRings = (): number[][] => [...otherLand, ...otherIndia.flatMap((k) => indiaStates[k])];

/** Satellite-photo palette: deep blue sea, teal shallows, green and tan land. */
const PASTEL = {
  sea: ['#0C3A6E', '#17598F', '#0F467D'],
  shallow: '#6CC4D0',
  land: '#5E7F45',
  desert: '#A8905C',
  foam: 'rgba(190,230,240,0.35)',
  tree: '#3F6B3A',
  border: 'rgba(255,255,255,0.55)',
};
/** Land colour by latitude (0 = north pole, 1 = south pole), shared by the globe and the sharper patch so they blend. */
const LAND_STOPS: [number, string][] = [
  [0, '#E9EEF2'],
  [0.15, '#D2CDB9'],
  [0.36, '#D8D0B8'],
  [0.5, '#CDC3A6'],
  [0.64, '#D8D0B8'],
  [0.85, '#D2CDB9'],
  [1, '#E9EEF2'],
];
/** Soft colours for the five states, the same ones used on the next screen. */
export const statePastels = states.map((s) => s.color);

function blotches(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, rand: () => number, minR: number, maxR: number, light: string, dark: string, alpha: number) {
  for (let i = 0; i < n; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = minR + rand() * (maxR - minR);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const c = rand() < 0.5 ? light : dark;
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = alpha * (0.4 + rand() * 0.6);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function seaPaint(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number, t0 = 0, t1 = 1) {
  // t0..t1: which slice of the whole-world gradient this canvas shows, so the patch matches the globe at its edge
  const g = ctx.createLinearGradient(0, (-t0 / (t1 - t0)) * h, 0, ((1 - t0) / (t1 - t0)) * h);
  g.addColorStop(0, PASTEL.sea[0]);
  g.addColorStop(0.5, PASTEL.sea[1]);
  g.addColorStop(1, PASTEL.sea[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, Math.round((w * h) / 60000), rand, w * 0.03, w * 0.09, 'rgba(70,140,205,0.9)', 'rgba(5,25,70,0.9)', 0.14);
  // long, faint swell streaks, like light on moving water
  ctx.lineCap = 'round';
  const streaks = Math.round((w * h) / 9000);
  for (let i = 0; i < streaks; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const len = w * (0.004 + rand() * 0.012);
    ctx.strokeStyle = rand() < 0.7 ? 'rgba(190,230,255,0.07)' : 'rgba(0,20,60,0.07)';
    ctx.lineWidth = Math.max(1, w / 1400);
    ctx.beginPath();
    ctx.moveTo(x - len, y);
    ctx.quadraticCurveTo(x, y - len * 0.25, x + len, y + len * 0.05);
    ctx.stroke();
  }
}

/** The whole world, at low detail. */
export function paintGlobe(canvas: HTMLCanvasElement) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const rand = rng(5);
  const proj: Proj = (lon, lat) => [((lon + 180) / 360) * w, ((90 - lat) / 180) * h];
  seaPaint(ctx, w, h, rand);
  const rings = landRings().concat(fiveSlugs.flatMap((s) => indiaStates[s]));
  ctx.save();
  ctx.shadowColor = PASTEL.shallow;
  ctx.shadowBlur = w * 0.006;
  const lg = ctx.createLinearGradient(0, 0, 0, h);
  for (const [t, c] of LAND_STOPS) lg.addColorStop(t, c);
  ctx.fillStyle = lg;
  trace(ctx, rings, proj);
  ctx.fill();
  ctx.restore();
  ctx.save();
  trace(ctx, rings, proj);
  ctx.clip();
  blotches(ctx, w, h, 500, rand, w * 0.004, w * 0.016, 'rgba(255,255,255,0.9)', 'rgba(170,160,130,0.9)', 0.12);
  ctx.restore();
  ctx.strokeStyle = PASTEL.foam;
  ctx.lineWidth = Math.max(1, w / 1400);
  trace(ctx, rings, proj);
  ctx.stroke();
  // the five states, in their soft colours
  ctx.globalAlpha = 1;
  fiveSlugs.forEach((slug, i) => {
    ctx.fillStyle = statePastels[i];
    trace(ctx, indiaStates[slug], proj);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

/** Sharper picture of South Asia, laid over the globe. */
export function paintPatch(canvas: HTMLCanvasElement) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const rand = rng(21);
  const proj: Proj = (lon, lat) => [((lon - PATCH.lon0) / (PATCH.lon1 - PATCH.lon0)) * w, ((PATCH.lat1 - lat) / (PATCH.lat1 - PATCH.lat0)) * h];
  const ppd = w / (PATCH.lon1 - PATCH.lon0); // pixels per degree
  seaPaint(ctx, w, h, rand, (90 - PATCH.lat1) / 180, (90 - PATCH.lat0) / 180);
  // sea gets a little deeper away from the land
  const rings = landRings();
  const everyLand = rings.concat(fiveSlugs.flatMap((s) => indiaStates[s]));
  // water gets deeper away from the coast: wide mid-blue band, then turquoise shallows, then a pale edge
  for (const [blur, col, times] of [[ppd * 2.4, 'rgba(24,110,165,0.55)', 1], [ppd * 1.1, 'rgba(60,165,195,0.6)', 1], [ppd * 0.4, 'rgba(120,205,210,0.6)', 1]] as [number, string, number][]) {
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = blur;
    ctx.fillStyle = '#000';
    trace(ctx, everyLand, proj);
    for (let k = 0; k < times; k++) ctx.fill();
    ctx.restore();
  }
  // other land
  const pt0 = (90 - PATCH.lat1) / 180;
  const pt1 = (90 - PATCH.lat0) / 180;
  const landG = ctx.createLinearGradient(0, (-pt0 / (pt1 - pt0)) * h, 0, ((1 - pt0) / (pt1 - pt0)) * h);
  for (const [t, c] of LAND_STOPS) landG.addColorStop(t, c);
  ctx.fillStyle = landG;
  trace(ctx, rings, proj);
  ctx.fill();
  ctx.save();
  trace(ctx, rings, proj);
  ctx.clip();
  blotches(ctx, w, h, 800, rand, ppd * 0.2, ppd * 0.7, 'rgba(255,255,255,0.9)', 'rgba(170,160,130,0.9)', 0.1);
  ctx.restore();
  ctx.strokeStyle = 'rgba(70,75,85,0.55)';
  ctx.lineWidth = Math.max(1, ppd * 0.012);
  ctx.lineJoin = 'round';
  trace(ctx, rings, proj);
  ctx.stroke();
  // the five states
  fiveSlugs.forEach((slug, i) => {
    const rs = indiaStates[slug];
    // base satellite colour first, then a light wash of the state's own colour
    ctx.fillStyle = '#8A8F95';
    trace(ctx, rs, proj);
    ctx.fill();
    ctx.save();
    trace(ctx, rs, proj);
    ctx.clip();
    // flat palette colour with only a faint soft light/shade, no green spots
    ctx.fillStyle = statePastels[i];
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  });
  // soft borders between the states, and a light coast line
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(28,38,54,0.9)';
  ctx.lineWidth = Math.max(1.2, ppd * 0.02);
  fiveSlugs.forEach((slug) => {
    trace(ctx, indiaStates[slug], proj);
    ctx.stroke();
  });
  ctx.setLineDash([]);
  // fine satellite grain
  for (let i = 0; i < 60000; i++) {
    ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(rand() * w, rand() * h, 2, 2);
  }
  softenOutside(canvas, proj);
}

/**
 * The five states stay sharp. Going away from them the picture gets softer step by step
 * (a few blur levels faded into each other by distance) until it is completely blurred.
 * Shrinking and stretching a copy is used as the blur, because ctx.filter is not on every phone.
 */
function softenOutside(canvas: HTMLCanvasElement, proj: Proj) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const GS = 256; // distance grid, one cell is about 0.11 degrees
  const cellDeg = (PATCH.lon1 - PATCH.lon0) / GS;

  // 1) how far is every cell from the five states (in degrees)
  const g = document.createElement('canvas');
  g.width = GS;
  g.height = GS;
  const gc = g.getContext('2d', { willReadFrequently: true })!;
  gc.fillStyle = '#000';
  gc.fillRect(0, 0, GS, GS);
  gc.fillStyle = '#fff';
  gc.scale(GS / w, GS / h);
  for (const slug of fiveSlugs) {
    trace(gc, indiaStates[slug], proj);
    gc.fill();
  }
  const px = gc.getImageData(0, 0, GS, GS).data;
  const INF = 1e6;
  const d = new Float32Array(GS * GS);
  for (let i = 0; i < d.length; i++) d[i] = px[i * 4] > 127 ? 0 : INF;
  const A = 1, B = 1.4142;
  for (let y = 0; y < GS; y++) {
    for (let x = 0; x < GS; x++) {
      const i = y * GS + x;
      let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + A);
      if (y > 0) {
        v = Math.min(v, d[i - GS] + A);
        if (x > 0) v = Math.min(v, d[i - GS - 1] + B);
        if (x < GS - 1) v = Math.min(v, d[i - GS + 1] + B);
      }
      d[i] = v;
    }
  }
  for (let y = GS - 1; y >= 0; y--) {
    for (let x = GS - 1; x >= 0; x--) {
      const i = y * GS + x;
      let v = d[i];
      if (x < GS - 1) v = Math.min(v, d[i + 1] + A);
      if (y < GS - 1) {
        v = Math.min(v, d[i + GS] + A);
        if (x < GS - 1) v = Math.min(v, d[i + GS + 1] + B);
        if (x > 0) v = Math.min(v, d[i + GS - 1] + B);
      }
      d[i] = v;
    }
  }

  // 2) a mask per blur level: transparent near the states, opaque further away
  const smooth = (a: number, b: number, v: number) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const maskOf = (fn: (deg: number) => number, rgb: [number, number, number]) => {
    const m = document.createElement('canvas');
    m.width = GS;
    m.height = GS;
    const mc = m.getContext('2d', { willReadFrequently: true })!;
    const im = mc.createImageData(GS, GS);
    for (let i = 0; i < d.length; i++) {
      im.data[i * 4] = rgb[0];
      im.data[i * 4 + 1] = rgb[1];
      im.data[i * 4 + 2] = rgb[2];
      im.data[i * 4 + 3] = Math.round(255 * fn(d[i] * cellDeg));
    }
    mc.putImageData(im, 0, 0);
    return m;
  };

  // 3) blurred copies of the picture, from slightly soft to completely blurred
  const original = document.createElement('canvas');
  original.width = w;
  original.height = h;
  original.getContext('2d')!.drawImage(canvas, 0, 0);
  const blurred = (shrink: number) => {
    const sw = Math.max(4, Math.round(w / shrink));
    const small = document.createElement('canvas');
    small.width = sw;
    small.height = sw;
    const sc = small.getContext('2d')!;
    sc.imageSmoothingQuality = 'high';
    sc.drawImage(original, 0, 0, sw, sw);
    const mid = document.createElement('canvas');
    mid.width = sw * 3;
    mid.height = sw * 3;
    const mc = mid.getContext('2d')!;
    mc.imageSmoothingQuality = 'high';
    mc.drawImage(small, 0, 0, mid.width, mid.height);
    return mid;
  };
  const levels: { shrink: number; from: number; to: number }[] = [
    { shrink: 5, from: 0.1, to: 0.9 },
    { shrink: 12, from: 0.7, to: 1.9 },
    { shrink: 28, from: 1.6, to: 3.2 },
    { shrink: 70, from: 2.8, to: 4.8 },
  ];
  const tmp = document.createElement('canvas');
  tmp.width = w;
  tmp.height = h;
  const tc = tmp.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  for (const lv of levels) {
    const mask = maskOf((deg) => smooth(lv.from, lv.to, deg), [0, 0, 0]);
    tc.globalCompositeOperation = 'source-over';
    tc.clearRect(0, 0, w, h);
    tc.imageSmoothingQuality = 'high';
    tc.drawImage(blurred(lv.shrink), 0, 0, w, h);
    tc.globalCompositeOperation = 'destination-in';
    tc.drawImage(mask, 0, 0, w, h);
    ctx.drawImage(tmp, 0, 0);
  }
  // 4) the further from the states, the darker, so the eye stays on them
  ctx.drawImage(maskOf((deg) => 0, [4, 10, 28]), 0, 0, w, h);
}

/** One flat colour per state, so the screen can tell which state a pixel is in. */
export function paintIds(canvas: HTMLCanvasElement) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const proj: Proj = (lon, lat) => [((lon - PATCH.lon0) / (PATCH.lon1 - PATCH.lon0)) * w, ((PATCH.lat1 - lat) / (PATCH.lat1 - PATCH.lat0)) * h];
  fiveSlugs.forEach((slug, i) => {
    ctx.fillStyle = `rgb(${40 * (i + 1)},0,0)`;
    trace(ctx, indiaStates[slug], proj);
    ctx.fill();
  });
}

/**
 * Clouds that look like clouds: layered noise gives lumpy, fluffy shapes with bright tops and
 * grey-blue undersides. A gap is left over India so the states stay clear.
 */
export function paintClouds(canvas: HTMLCanvasElement) {
  const W = 1024;
  const H = 512;
  const hash = (x: number, y: number) => {
    let n = (x * 374761393 + y * 668265263) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  // value noise that repeats around the globe (period px cells in x)
  const noise = (x: number, y: number, px: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const fx = x - xi;
    const fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const x0 = ((xi % px) + px) % px;
    const x1 = (x0 + 1) % px;
    const a = hash(x0, yi), b = hash(x1, yi), c = hash(x0, yi + 1), d = hash(x1, yi + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  const field = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let amp = 0.55, sum = 0, norm = 0;
      let fx = 12, fy = 6;
      for (let o = 0; o < 6; o++) {
        sum += amp * noise((x / W) * fx + o * 3.1, (y / H) * fy + o * 1.7, fx);
        norm += amp;
        amp *= 0.6;
        fx *= 2;
        fy *= 2;
      }
      field[y * W + x] = sum / norm;
    }
  }
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const small = document.createElement('canvas');
  small.width = W;
  small.height = H;
  const sc = small.getContext('2d', { willReadFrequently: true })!;
  const im = sc.createImageData(W, H);
  const smoothstep = (a: number, b: number, v: number) => {
    const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < H; y++) {
    const lat = 90 - (y / H) * 180;
    for (let x = 0; x < W; x++) {
      const lon = (x / W) * 360 - 180;
      const f = field[y * W + x];
      // keep the sky over India clear
      const dx = Math.max(52 - lon, 0, lon - 104);
      const dy = Math.max(-12 - lat, 0, lat - 38);
      const away = smoothstep(0, 14, Math.hypot(dx, dy));
      const cover = smoothstep(0.56, 0.67, f) * away;
      const i = (y * W + x) * 4;
      if (cover <= 0.002) {
        im.data[i + 3] = 0;
        continue;
      }
      // light comes from the upper left: a point brighter than its lower-right neighbour is lit
      const nb = field[Math.min(H - 1, y + 2) * W + ((x + 2) % W)];
      const lit = Math.max(-1, Math.min(1, (f - nb) * 14));
      const body = smoothstep(0.58, 0.75, f); // thick middle is whiter and heavier
      const shade = 0.7 + 0.28 * lit + 0.12 * body;
      const k = Math.max(0.55, Math.min(1.05, shade));
      im.data[i] = Math.min(255, 168 + 90 * k);
      im.data[i + 1] = Math.min(255, 176 + 82 * k);
      im.data[i + 2] = Math.min(255, 196 + 62 * k);
      im.data[i + 3] = Math.round(255 * Math.min(0.92, cover * (0.5 + 0.55 * body)));
    }
  }
  sc.putImageData(im, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(small, 0, 0, canvas.width, canvas.height);
}

/* ---------- meshes: interleaved x, y, z, u, v ---------- */
export interface GeoMesh {
  vertices: Float32Array;
  indices: Uint16Array;
}

function grid(cols: number, rows: number, at: (i: number, j: number) => { dir: V3; u: number; v: number }, radius: number): GeoMesh {
  const vertices = new Float32Array((cols + 1) * (rows + 1) * 5);
  let k = 0;
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      const { dir, u, v } = at(i / cols, j / rows);
      const d = norm(dir);
      vertices.set([d[0] * radius, d[1] * radius, d[2] * radius, u, v], k);
      k += 5;
    }
  }
  const indices = new Uint16Array(cols * rows * 6);
  let n = 0;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      const b = a + 1;
      const c = a + cols + 1;
      const d = c + 1;
      indices.set([a, c, b, b, c, d], n);
      n += 6;
    }
  }
  return { vertices, indices };
}

export const sphereMesh = (radius: number, cols = 160, rows = 80): GeoMesh =>
  grid(cols, rows, (s, t) => ({ dir: dirOf(-180 + 360 * s, 90 - 180 * t), u: s, v: t }), radius);

export const patchMesh = (radius: number, n = 96): GeoMesh =>
  grid(n, n, (s, t) => ({ dir: dirOf(PATCH.lon0 + (PATCH.lon1 - PATCH.lon0) * s, PATCH.lat1 - (PATCH.lat1 - PATCH.lat0) * t), u: s, v: t }), radius);
