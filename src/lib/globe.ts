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

const PASTEL = {
  sea: ['#CBE9EE', '#A9D9E3', '#B7E0E6'],
  shallow: '#E3F6F1',
  land: '#DCE6C6',
  desert: '#EBE0C0',
  foam: 'rgba(255,255,255,0.85)',
  tree: '#8DBF9D',
  border: 'rgba(255,252,244,0.95)',
};
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

function seaPaint(ctx: CanvasRenderingContext2D, w: number, h: number, rand: () => number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, PASTEL.sea[0]);
  g.addColorStop(0.5, PASTEL.sea[1]);
  g.addColorStop(1, PASTEL.sea[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  blotches(ctx, w, h, Math.round((w * h) / 60000), rand, w * 0.03, w * 0.09, 'rgba(255,255,255,0.9)', 'rgba(120,170,205,0.9)', 0.09);
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
  lg.addColorStop(0, '#EEF2E6');
  lg.addColorStop(0.2, PASTEL.land);
  lg.addColorStop(0.38, PASTEL.desert);
  lg.addColorStop(0.5, '#CFE3BF');
  lg.addColorStop(0.62, PASTEL.desert);
  lg.addColorStop(0.8, PASTEL.land);
  ctx.fillStyle = lg;
  trace(ctx, rings, proj);
  ctx.fill();
  ctx.restore();
  ctx.save();
  trace(ctx, rings, proj);
  ctx.clip();
  blotches(ctx, w, h, 500, rand, w * 0.004, w * 0.016, 'rgba(255,255,255,0.9)', 'rgba(130,170,120,0.9)', 0.16);
  ctx.restore();
  ctx.strokeStyle = PASTEL.foam;
  ctx.lineWidth = Math.max(1, w / 1400);
  trace(ctx, rings, proj);
  ctx.stroke();
  // the five states, in their soft colours
  fiveSlugs.forEach((slug, i) => {
    ctx.fillStyle = statePastels[i];
    trace(ctx, indiaStates[slug], proj);
    ctx.fill();
  });
}

/** Sharper picture of South Asia, laid over the globe. */
export function paintPatch(canvas: HTMLCanvasElement) {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const rand = rng(21);
  const proj: Proj = (lon, lat) => [((lon - PATCH.lon0) / (PATCH.lon1 - PATCH.lon0)) * w, ((PATCH.lat1 - lat) / (PATCH.lat1 - PATCH.lat0)) * h];
  const ppd = w / (PATCH.lon1 - PATCH.lon0); // pixels per degree
  seaPaint(ctx, w, h, rand);
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
  ctx.fillStyle = PASTEL.land;
  trace(ctx, rings, proj);
  ctx.fill();
  ctx.save();
  trace(ctx, rings, proj);
  ctx.clip();
  blotches(ctx, w, h, 900, rand, ppd * 0.12, ppd * 0.5, 'rgba(255,255,255,0.9)', 'rgba(205,190,140,0.9)', 0.16);
  ctx.restore();
  ctx.strokeStyle = PASTEL.foam;
  ctx.lineWidth = ppd * 0.05;
  trace(ctx, rings, proj);
  ctx.stroke();
  // the five states
  fiveSlugs.forEach((slug, i) => {
    const rs = indiaStates[slug];
    ctx.fillStyle = statePastels[i];
    trace(ctx, rs, proj);
    ctx.fill();
    ctx.save();
    trace(ctx, rs, proj);
    ctx.clip();
    blotches(ctx, w, h, 700, rand, ppd * 0.1, ppd * 0.45, 'rgba(255,255,255,0.95)', 'rgba(150,100,90,0.9)', 0.14);
    // small painted trees and hills
    const [x0, y0, x1, y1] = boxes[i];
    for (let k = 0; k < 1400; k++) {
      const lon = x0 + rand() * (x1 - x0);
      const lat = y0 + rand() * (y1 - y0);
      if (!inside(rs, lon, lat)) continue;
      const [px, py] = proj(lon, lat);
      const r = ppd * (0.035 + rand() * 0.03);
      ctx.fillStyle = 'rgba(120,175,135,0.55)';
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
  ctx.lineWidth = ppd * 0.045;
  fiveSlugs.forEach((slug) => {
    trace(ctx, indiaStates[slug], proj);
    ctx.stroke();
  });
  // paper grain
  for (let i = 0; i < 60000; i++) {
    ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(90,70,90,0.04)';
    ctx.fillRect(rand() * w, rand() * h, 2, 2);
  }
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
  for (let i = 0; i < 150; i++) {
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
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.7)');
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
