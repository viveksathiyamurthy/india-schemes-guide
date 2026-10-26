/**
 * Geometry for the little planet on the welcome screen: a low-poly sphere whose land
 * has the real outlines of the five southern states, plus trees, houses and clouds.
 * No 3D library is needed; the drawing code is in components/PlanetMap.tsx.
 */
import { mapShapes, mapViewBox } from '@/data/southMap';
import { states } from '@/data/config';

export type V3 = [number, number, number];
export type Quat = [number, number, number, number];

export const stateSlugs = states.map((s) => s.slug);

const CX = mapViewBox.width / 2;
const CY = mapViewBox.height / 2;
/** The map covers this angle (from the front pole to the left and right edges). */
const SPAN = (54 * Math.PI) / 180;
const K = CX / SPAN; // map units per radian

/* ---------- map <-> sphere ---------- */

/** Direction on the sphere (front pole = +z) to a point on the flat map. */
export function dirToMap([x, y, z]: V3): [number, number] {
  const theta = Math.acos(Math.max(-1, Math.min(1, z)));
  const phi = Math.atan2(y, x);
  const r = theta * K;
  return [CX + r * Math.cos(phi), CY - r * Math.sin(phi)];
}

export function mapToDir(mx: number, my: number): V3 {
  const dx = mx - CX;
  const dy = -(my - CY);
  const theta = Math.hypot(dx, dy) / K;
  const phi = Math.atan2(dy, dx);
  return [Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi), Math.cos(theta)];
}

/* ---------- which state is a point in ---------- */

type Ring = [number, number][];
const polygons: Ring[][] = stateSlugs.map((slug) =>
  mapShapes[slug].d
    .split('Z')
    .filter((s) => s.length > 1)
    .map((s) =>
      s
        .replace(/^M/, '')
        .split('L')
        .map((pair) => pair.split(' ').map(Number) as [number, number]),
    ),
);

const boxes = stateSlugs.map((slug) => mapShapes[slug].bbox);

function inside(rings: Ring[], x: number, y: number): boolean {
  let hit = false; // even-odd rule, so holes work
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
  }
  return hit;
}

/** Index of the state at this direction, or -1 for sea. */
export function stateAt(dir: V3): number {
  if (dir[2] < 0.05) return -1;
  const [mx, my] = dirToMap(dir);
  for (let i = 0; i < polygons.length; i++) {
    const [x0, y0, x1, y1] = boxes[i];
    if (mx >= x0 && mx <= x1 && my >= y0 && my <= y1 && inside(polygons[i], mx, my)) return i;
  }
  return -1;
}

/* ---------- small vector, quaternion and matrix helpers ---------- */

export const norm = ([x, y, z]: V3): V3 => {
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
};
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const qIdentity = (): Quat => [0, 0, 0, 1];
export function qAxis(axis: V3, angle: number): Quat {
  const [x, y, z] = norm(axis);
  const s = Math.sin(angle / 2);
  return [x * s, y * s, z * s, Math.cos(angle / 2)];
}
export function qMul(a: Quat, b: Quat): Quat {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}
export function qNorm(q: Quat): Quat {
  const l = Math.hypot(...q) || 1;
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}
export function qSlerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb = b;
  if (d < 0) {
    d = -d;
    bb = [-b[0], -b[1], -b[2], -b[3]];
  }
  if (d > 0.9995) return qNorm([a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t, a[2] + (bb[2] - a[2]) * t, a[3] + (bb[3] - a[3]) * t]);
  const th = Math.acos(d);
  const s = Math.sin(th);
  const wa = Math.sin((1 - t) * th) / s;
  const wb = Math.sin(t * th) / s;
  return [a[0] * wa + bb[0] * wb, a[1] * wa + bb[1] * wb, a[2] * wa + bb[2] * wb, a[3] * wa + bb[3] * wb];
}
export const qConj = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]];
export function qRotate(q: Quat, v: V3): V3 {
  const u: V3 = [q[0], q[1], q[2]];
  const t = scale(cross(u, v), 2);
  return add(add(v, scale(t, q[3])), cross(u, t));
}
/** Rotation that turns direction `from` into direction `to`. */
export function qFromTo(from: V3, to: V3): Quat {
  const f = norm(from);
  const t = norm(to);
  const d = dot(f, t);
  if (d > 0.99999) return qIdentity();
  if (d < -0.99999) return qAxis([0, 1, 0], Math.PI);
  const c = cross(f, t);
  return qNorm([c[0], c[1], c[2], 1 + d]);
}
/** Column-major 4x4 matrix for WebGL from a quaternion. */
export function mat4FromQuat([x, y, z, w]: Quat): Float32Array {
  const xx = x * x, yy = y * y, zz = z * z, xy = x * y, xz = x * z, yz = y * z, wx = w * x, wy = w * y, wz = w * z;
  return new Float32Array([
    1 - 2 * (yy + zz), 2 * (xy + wz), 2 * (xz - wy), 0,
    2 * (xy - wz), 1 - 2 * (xx + zz), 2 * (yz + wx), 0,
    2 * (xz + wy), 2 * (yz - wx), 1 - 2 * (xx + yy), 0,
    0, 0, 0, 1,
  ]);
}
export function mat3FromQuat(q: Quat): Float32Array {
  const m = mat4FromQuat(q);
  return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
}
export function perspective(fovY: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}
export function translation(x: number, y: number, z: number): Float32Array {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
}

/* ---------- the mesh ---------- */

export interface Mesh {
  /** Per vertex: position (3), normal (3), colour (3), state index (1). */
  data: Float32Array;
  vertexCount: number;
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hex(c: string): V3 {
  return [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255];
}
const mixC = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c: V3, k: number): V3 => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];

function icosphere(level: number): { verts: V3[]; faces: [number, number, number][] } {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: V3[] = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].map((v) => norm(v as V3));
  let faces: [number, number, number][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let l = 0; l < level; l++) {
    const cache = new Map<string, number>();
    const mid = (a: number, b: number) => {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      verts.push(norm(add(verts[a], verts[b])));
      cache.set(key, verts.length - 1);
      return verts.length - 1;
    };
    const next: [number, number, number][] = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }
  return { verts, faces };
}

class Builder {
  out: number[] = [];
  tri(a: V3, b: V3, c: V3, col: V3, state: number, outward?: V3) {
    let n = norm(cross(sub(b, a), sub(c, a)));
    let [p1, p2] = [b, c];
    if (outward && dot(n, outward) < 0) {
      n = scale(n, -1);
      [p1, p2] = [c, b];
    }
    for (const p of [a, p1, p2]) this.out.push(p[0], p[1], p[2], n[0], n[1], n[2], col[0], col[1], col[2], state);
  }
  mesh(): Mesh {
    return { data: new Float32Array(this.out), vertexCount: this.out.length / 10 };
  }
}

const LAND = 1.035;

export interface PlanetMesh {
  planet: Mesh;
  clouds: Mesh;
  /** Where each state's name is shown, as a direction on the sphere. */
  labelDirs: V3[];
  /** Centre of each state as a direction. */
  centerDirs: V3[];
}

export function buildPlanet(labelAt: Record<string, { x: number; y: number }>, level = 5): PlanetMesh {
  const rand = rng(11);
  const { verts, faces } = icosphere(level);
  const stateColors = states.map((s) => hex(s.color));
  const vState = verts.map((v) => stateAt(v));
  const pos = verts.map((v, i) => scale(v, vState[i] >= 0 ? LAND : 1));
  const b = new Builder();

  const SEA = hex('#4CB5C8');
  const SHALLOW = hex('#7ED3D6');
  const SAND = hex('#F3DDA0');
  const landFaces: { c: V3; tri: number }[] = [];

  faces.forEach(([ia, ib, ic], fi) => {
    const centre = norm(add(add(verts[ia], verts[ib]), verts[ic]));
    const fs = stateAt(centre);
    const lands = [vState[ia], vState[ib], vState[ic]].filter((s) => s >= 0).length;
    let col: V3;
    if (fs >= 0) {
      if (lands === 3) {
        col = shade(stateColors[fs], 0.92 + rand() * 0.16);
        landFaces.push({ c: centre, tri: fi });
      } else col = shade(SAND, 0.96 + rand() * 0.06);
    } else {
      col = lands > 0 ? shade(SHALLOW, 0.96 + rand() * 0.06) : shade(mixC(SEA, hex('#3FA3BD'), rand() * 0.8), 0.96 + rand() * 0.08);
    }
    b.tri(pos[ia], pos[ib], pos[ic], col, fs, centre);
  });

  /* trees and houses on the land */
  const treeColors = [hex('#2F8F5B'), hex('#3FA06A'), hex('#27784E')];
  const addCone = (base: V3, up: V3, radius: number, height: number, col: V3, state: number, sides = 5) => {
    const ref: V3 = Math.abs(up[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const t1 = norm(cross(up, ref));
    const t2 = cross(up, t1);
    const apex = add(base, scale(up, height));
    const ring: V3[] = [];
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      ring.push(add(base, add(scale(t1, Math.cos(a) * radius), scale(t2, Math.sin(a) * radius))));
    }
    for (let i = 0; i < sides; i++) b.tri(ring[i], ring[(i + 1) % sides], apex, shade(col, 0.9 + (i % 2) * 0.18), state, up);
  };
  const addBox = (base: V3, up: V3, w: number, h: number, col: V3, state: number) => {
    const ref: V3 = Math.abs(up[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const t1 = scale(norm(cross(up, ref)), w);
    const t2 = scale(cross(up, norm(cross(up, ref))), w);
    const top = scale(up, h);
    const c = (sx: number, sy: number, lift: V3) => add(add(add(base, scale(t1, sx)), scale(t2, sy)), lift);
    const z: V3 = [0, 0, 0];
    const quads: [V3, V3, V3, V3, number][] = [
      [c(-1, -1, z), c(1, -1, z), c(1, -1, top), c(-1, -1, top), 1],
      [c(1, -1, z), c(1, 1, z), c(1, 1, top), c(1, -1, top), 0.85],
      [c(1, 1, z), c(-1, 1, z), c(-1, 1, top), c(1, 1, top), 1],
      [c(-1, 1, z), c(-1, -1, z), c(-1, -1, top), c(-1, 1, top), 0.85],
    ];
    for (const [p, q, r, s, k] of quads) {
      b.tri(p, q, r, shade(col, k), state, up);
      b.tri(p, r, s, shade(col, k), state, up);
    }
    return add(base, top);
  };

  for (const { c, tri } of landFaces) {
    const s = stateAt(c);
    const r = rand();
    if (r < 0.032) {
      const base = scale(c, LAND);
      addCone(base, c, 0.011 + rand() * 0.006, 0.03 + rand() * 0.02, treeColors[Math.floor(rand() * 3)], s);
    } else if (r < 0.047) {
      const base = scale(c, LAND);
      const roofBase = addBox(base, c, 0.012, 0.018, hex('#FBF0D8'), s);
      addCone(roofBase, c, 0.019, 0.018, hex('#C8553D'), s, 4);
    }
    void tri;
  }

  /* a tall flag on the open state, so it stands out */
  const open = states.findIndex((s) => s.available);
  const centerDirs = stateSlugs.map((slug) => mapToDir(mapShapes[slug].centroid[0], mapShapes[slug].centroid[1]));
  if (open >= 0) {
    const up = centerDirs[open];
    const base = scale(up, LAND);
    addCone(base, up, 0.006, 0.17, hex('#F5E6C8'), open, 4);
    const top = add(base, scale(up, 0.17));
    addCone(top, up, 0.034, 0.05, hex('#FFC531'), open, 4);
    addCone(add(top, scale(up, 0.05)), scale(up, -1), 0.034, 0.05, hex('#FFC531'), open, 4);
  }

  /* clouds */
  const cb = new Builder();
  const white = hex('#FFFFFF');
  const blob = icosphere(1);
  const clouds: V3[] = [[0.9, 0.5, 0.55], [-0.8, 0.6, 0.6], [0.2, -0.75, 0.7], [-0.6, -0.4, -0.7], [0.7, -0.3, -0.7], [0, 0.9, -0.4]];
  clouds.forEach((cd, ci) => {
    const centre = scale(norm(cd), 1.3 + (ci % 2) * 0.05);
    for (let k = 0; k < 3; k++) {
      const off: V3 = [(k - 1) * 0.07, (k % 2) * 0.025, 0];
      const rad = 0.045 + (k === 1 ? 0.02 : 0);
      for (const [ia, ib, ic] of blob.faces) {
        const m = (i: number) => add(add(centre, off), scale(blob.verts[i], rad));
        cb.tri(m(ia), m(ib), m(ic), shade(white, 0.94 + rand() * 0.06), -1, blob.verts[ia]);
      }
    }
  });

  const labelDirs = stateSlugs.map((slug) => {
    const l = labelAt[slug];
    return l ? mapToDir(l.x, l.y) : mapToDir(mapShapes[slug].centroid[0], mapShapes[slug].centroid[1]);
  });
  return { planet: b.mesh(), clouds: cb.mesh(), labelDirs, centerDirs };
}
