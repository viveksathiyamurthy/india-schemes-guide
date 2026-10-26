/**
 * The painted globe on the welcome screen. Everything is drawn here with plain canvas
 * 2D calls into textures: sea, land, the five states in soft colours, clouds.
 * Soft watercolour look on purpose: pastel colours, blurred coasts, small painted trees.
 */
import { indiaStates, otherLand, stateCenters } from '@/data/geoData';
import { states } from '@/data/config';
import { norm, type V3 } from './quat';

/** The part of the world that gets a sharper texture, because we zoom into it. */
export const PATCH = { lon0: 64, lon1: 92, lat0: 0, lat1: 28 };
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
  sea: ['#0B2D63', '#15488C', '#0D3470'],
  shallow: '#2F8FB0',
  land: '#5E7F45',
  desert: '#A8905C',
  foam: 'rgba(190,230,240,0.35)',
  tree: '#3F6B3A',
  border: 'rgba(255,255,255,0.55)',
};
/** Land colour by latitude (0 = north pole, 1 = south pole), shared by the globe and the sharper patch so they blend. */
const LAND_STOPS: [number, string][] = [
  [0, '#F2F6FA'],
  [0.1, '#C9D2C4'],
  [0.22, '#6F8A52'],
  [0.36, '#A8905C'],
  [0.5, '#3F7A3C'],
  [0.64, '#A8905C'],
  [0.8, '#5E7F45'],
  [0.92, '#E4EAEE'],
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
  blotches(ctx, w, h, Math.round((w * h) / 60000), rand, w * 0.03, w * 0.09, 'rgba(90,150,215,0.9)', 'rgba(5,25,70,0.9)', 0.16);
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
  blotches(ctx, w, h, 500, rand, w * 0.004, w * 0.016, 'rgba(190,170,110,0.9)', 'rgba(35,85,45,0.9)', 0.3);
  ctx.restore();
  ctx.strokeStyle = PASTEL.foam;
  ctx.lineWidth = Math.max(1, w / 1400);
  trace(ctx, rings, proj);
  ctx.stroke();
  // the five states, in their soft colours
  ctx.globalAlpha = 0.74;
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
  ctx.save();
  ctx.shadowColor = PASTEL.shallow;
  ctx.shadowBlur = ppd * 0.9;
  ctx.fillStyle = PASTEL.shallow;
  trace(ctx, rings.concat(fiveSlugs.flatMap((s) => indiaStates[s])), proj);
  ctx.fill();
  ctx.fill();
  ctx.restore();
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
  blotches(ctx, w, h, 1100, rand, ppd * 0.12, ppd * 0.5, 'rgba(205,180,120,0.9)', 'rgba(60,100,50,0.9)', 0.3);
  ctx.restore();
  ctx.strokeStyle = PASTEL.foam;
  ctx.lineWidth = ppd * 0.05;
  trace(ctx, rings, proj);
  ctx.stroke();
  // the five states
  fiveSlugs.forEach((slug, i) => {
    const rs = indiaStates[slug];
    // base satellite colour first, then a light wash of the state's own colour
    ctx.fillStyle = '#6F8A4C';
    trace(ctx, rs, proj);
    ctx.fill();
    ctx.save();
    trace(ctx, rs, proj);
    ctx.clip();
    blotches(ctx, w, h, 900, rand, ppd * 0.1, ppd * 0.45, 'rgba(190,150,95,0.95)', 'rgba(40,95,45,0.9)', 0.38);
    ctx.globalAlpha = 0.74;
    ctx.fillStyle = statePastels[i];
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    // small painted trees and hills
    const [x0, y0, x1, y1] = boxes[i];
    for (let k = 0; k < 1400; k++) {
      const lon = x0 + rand() * (x1 - x0);
      const lat = y0 + rand() * (y1 - y0);
      if (!inside(rs, lon, lat)) continue;
      const [px, py] = proj(lon, lat);
      const r = ppd * (0.035 + rand() * 0.03);
      ctx.fillStyle = 'rgba(30,85,45,0.28)';
      for (let c = 0; c < 3; c++) {
        ctx.beginPath();
        ctx.arc(px + (c - 1) * r * 0.9, py + (c % 2) * r * 0.5, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  });
  // soft borders between the states, and a light coast line
  ctx.lineJoin = 'round';
  ctx.strokeStyle = PASTEL.border;
  ctx.setLineDash([ppd * 0.06, ppd * 0.05]);
  ctx.lineWidth = ppd * 0.03;
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
  ctx.drawImage(maskOf((deg) => 0.4 * smooth(0.3, 4.5, deg), [4, 10, 28]), 0, 0, w, h);
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

/** Soft white clouds. A gap is left over India so the states stay clear. */
export function paintClouds(canvas: HTMLCanvasElement) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const rand = rng(9);
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < 50; i++) {
    const lon = -180 + rand() * 360;
    const lat = -60 + rand() * 120;
    if (lon > 52 && lon < 104 && lat > -12 && lat < 38) continue;
    const x = ((lon + 180) / 360) * w;
    const y = ((90 - lat) / 180) * h;
    const size = w * (0.012 + rand() * 0.02);
    for (let c = 0; c < 5; c++) {
      const cx = x + (c - 2) * size * 0.7;
      const cy = y + (c % 2 ? -1 : 1) * size * 0.18;
      const r = size * (0.7 + rand() * 0.5);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(255,255,255,0.8)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.5)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.25, r * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
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
