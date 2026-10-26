'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { states, type StateInfo } from '@/data/config';
import { centers, dirOf, lonLatOf, paintClouds, paintGlobe, paintIds, paintPatch, patchMesh, sphereMesh, stateAtLonLat, type GeoMesh } from '@/lib/globe';
import {
  mat3FromQuat,
  mat4FromQuat,
  norm,
  perspective,
  qAxis,
  qConj,
  qMul,
  qNorm,
  qRotate,
  qSlerp,
  translation,
  type Quat,
  type V3,
} from '@/lib/quat';

const FOV = (36 * Math.PI) / 180;
/** Camera distances, in globe radiuses: far in space, and close over the five states. */
const SPACE = 3.9;
/** Content sits a little low on screen so the top is free for the search once the zoom is over (NDC units). */
const SY = 0.2;
const HOME_DIST = 1.55;
const CLOSE = 1.035;
const HOME = { lon: 79.4, lat: 13.7 };
/** Where each name is painted, [lon, lat]. */
const labelAt: [number, number][] = [
  [78.5, 10.7],
  [74.9, 9.8],
  [75.6, 14.3],
  [80.5, 15.9],
  [79.1, 18.1],
];

const VERT = `
attribute vec3 aPos; attribute vec2 aUv;
uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel; uniform mat3 uRot;
varying vec2 vUv; varying vec3 vN;
void main() {
  vUv = aUv;
  vN = uRot * aPos;
  gl_Position = uProj * uView * uModel * vec4(aPos, 1.0);
}`;
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv; varying vec3 vN;
uniform sampler2D uTex; uniform sampler2D uId;
uniform float uMode; uniform vec3 uLight; uniform float uHoverId; uniform float uHoverT; uniform float uGlow;
void main() {
  vec3 n = normalize(vN);
  float d = dot(n, uLight) * 0.5 + 0.5;
  if (uMode > 2.5) {
    float a = pow(1.0 - abs(n.z), 3.0) * 0.95 * uGlow;
    gl_FragColor = vec4(0.28, 0.55, 1.0, a);
    return;
  }
  vec4 t = texture2D(uTex, vUv);
  if (uMode > 1.5) {
    gl_FragColor = vec4(vec3(1.0) * (0.32 + 0.68 * smoothstep(0.25, 0.7, d)), t.a * 0.85 * (0.1 + 0.9 * uGlow));
    return;
  }
  vec3 col = t.rgb * (0.3 + 0.85 * smoothstep(0.2, 0.75, d));
  float water = smoothstep(0.03, 0.16, t.b - t.r);
  vec3 hv = normalize(uLight + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, hv), 0.0), 38.0);
  col += vec3(0.85, 0.93, 1.0) * spec * 0.55 * water;
  col += vec3(0.1, 0.2, 0.32) * pow(1.0 - max(n.z, 0.0), 2.0) * 0.25 * water;
  col += vec3(0.35, 0.6, 1.0) * pow(1.0 - max(n.z, 0.0), 4.0) * 0.12;
  float a = 1.0;
  if (uMode > 0.5) {
    float id = texture2D(uId, vUv).r * 255.0;
    float hov = abs(id - uHoverId) < 7.0 ? uHoverT : 0.0;
    col = mix(col, vec3(1.0, 0.95, 0.7), hov * 0.28);
    float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
    a = 1.0;
  }
  gl_FragColor = vec4(col, a);
}`;

export function webglWorks(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** The camera looks straight down at this place, north is up. */
const faceTo = (lon: number, lat: number, tilt = 0): Quat =>
  qNorm(qMul(qAxis([1, 0, 0], (lat * Math.PI) / 180 + tilt), qAxis([0, 1, 0], (-lon * Math.PI) / 180)));

/** The intro only plays once per visit; coming back from the next screen is quicker. */
let introPlayed = false;

/**
 * Screen 1 as a painted globe, in the style of a soft storybook. It starts in space, glides
 * down and settles over the five southern states. Drag to look around, tap a state to fly in.
 */
export function PlanetMap({ onFail, onReady, calm = false }: { onFail: () => void; onReady?: () => void; calm?: boolean }) {
  const { t, tr } = useLang();
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);
  const [soon, setSoon] = useState<StateInfo | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const api = useRef<{ choose: (i: number) => void } | null>(null);
  const soonRef = useRef(setSoon);
  soonRef.current = setSoon;
  const failRef = useRef(onFail);
  failRef.current = onFail;
  const calmRef = useRef(calm);
  calmRef.current = calm;
  const readyRef = useRef(onReady);
  readyRef.current = onReady;
  const starsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const gl = (canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      failRef.current();
      return;
    }
    {
      // size the canvas before any GPU uploads (resizing afterwards stalls some software GL drivers)
      const r0 = box.getBoundingClientRect();
      const d0 = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(r0.width * d0));
      canvas.height = Math.max(1, Math.round(r0.height * d0));
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader');
      return sh;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
    } catch {
      failRef.current();
      return;
    }
    gl.useProgram(prog);
    const loc = (n: string) => gl.getUniformLocation(prog, n);
    const U = {
      proj: loc('uProj'), view: loc('uView'), model: loc('uModel'), rot: loc('uRot'), tex: loc('uTex'), id: loc('uId'),
      mode: loc('uMode'), light: loc('uLight'), hoverId: loc('uHoverId'), hoverT: loc('uHoverT'), glow: loc('uGlow'),
    };

    /* painted textures */
    const makeCanvas = (w: number, h: number) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    };
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const patchSize = Math.min(2048, maxTex);
    const globeC = makeCanvas(2048, 1024);
    const patchC = makeCanvas(patchSize, patchSize);
    const idC = makeCanvas(1024, 1024);
    const cloudC = makeCanvas(2048, 1024);
    paintGlobe(globeC);
    paintPatch(patchC);
    paintIds(idC);
    paintClouds(cloudC);
    const texture = (c: HTMLCanvasElement, repeat: boolean, nearest = false, mips = true) => {
      const tx = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      const pot = (c.width & (c.width - 1)) === 0 && (c.height & (c.height - 1)) === 0;
      if (mips && pot && !nearest) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat && pot ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tx;
    };
    const texGlobe = texture(globeC, true);
    const texPatch = texture(patchC, false);
    const texId = texture(idC, false, true, false);
    const texCloud = texture(cloudC, true);

    const upload = (m: GeoMesh) => {
      const vb = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, m.vertices, gl.STATIC_DRAW);
      const ib = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.indices, gl.STATIC_DRAW);
      return { vb, ib, count: m.indices.length };
    };
    const meshGlobe = upload(sphereMesh(1));
    const meshPatch = upload(patchMesh(1.0007));
    const meshCloud = upload(sphereMesh(1.016, 96, 48));
    const aPos = gl.getAttribLocation(prog, 'aPos');
    const aUv = gl.getAttribLocation(prog, 'aUv');
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aUv);
    const draw = (m: { vb: WebGLBuffer; ib: WebGLBuffer; count: number }, tex: WebGLTexture | null, mode: number) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, m.vb);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m.ib);
      gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 20, 0);
      gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 20, 12);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(U.tex, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texId);
      gl.uniform1i(U.id, 1);
      gl.uniform1f(U.mode, mode);
      gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_SHORT, 0);
    };
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform3fv(U.light, new Float32Array(norm([-0.45, 0.55, 0.75])));

    /* camera state */
    const homeQ = faceTo(HOME.lon, HOME.lat, 0);
    let q: Quat = homeQ;
    let dist = HOME_DIST;
    let interacted = false;
    let lastTouch = 0;
    let vel: [number, number] = [0, 0];
    let hover = -1;
    let hoverT = 0;
    let hoverTarget = 0;
    let intro: null | { start: number; dur: number; q0: Quat; d0: number } = null;
    let fly: null | { start: number; q0: Quat; q1: Quat; d0: number; state: number } = null;
    const FLY = 2700;
    let w = 1;
    let h = 1;
    let thY = Math.tan(FOV / 2);
    let raf = 0;
    let visible = true;
    if (calmRef.current) {
      // reduced motion: no flying, just open on the finished view
      intro = { start: -1, dur: 1, q0: homeQ, d0: HOME_DIST };
    } else if (!introPlayed) {
      intro = { start: -1, dur: 7500, q0: faceTo(-35, 12, 0.35), d0: SPACE };
      q = intro.q0;
      dist = SPACE;
    } else {
      intro = { start: -1, dur: 1100, q0: faceTo(HOME.lon - 6, HOME.lat + 3, 0.2), d0: 1.9 };
      q = intro.q0;
      dist = 1.9;
    }

    const resize = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      const cw = Math.round(w * dpr);
      const ch = Math.round(h * dpr);
      if (canvas.width !== cw) canvas.width = cw;
      if (canvas.height !== ch) canvas.height = ch;
      gl.viewport(0, 0, canvas.width, canvas.height);
      // keep the five states the same width on screen, whatever the shape of the screen
      thY = Math.min(Math.tan((70 * Math.PI) / 360), Math.max(Math.tan(FOV / 2), 0.125 / ((HOME_DIST - 1) * (w / h))));
      paintStars(cw, ch, dpr);
    };
    const paintStars = (cw: number, ch: number, dpr: number) => {
      const sc = starsRef.current;
      if (!sc) return;
      if (sc.width !== cw) sc.width = cw;
      if (sc.height !== ch) sc.height = ch;
      const c = sc.getContext('2d');
      if (!c) return;
      c.clearRect(0, 0, cw, ch);
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
      const n = Math.round((cw * ch) / (dpr * dpr) / 700);
      for (let i = 0; i < n; i++) {
        const x = rnd() * cw;
        const y = rnd() * ch;
        const big = Math.pow(rnd(), 4);
        const r = (0.5 + big * 1.7) * dpr;
        const a = 0.55 + rnd() * 0.45;
        const tint = rnd();
        c.fillStyle = tint < 0.15 ? `rgba(190,210,255,${a})` : tint < 0.25 ? `rgba(255,230,200,${a})` : `rgba(255,255,255,${a})`;
        if (big > 0.5) {
          c.shadowColor = 'rgba(200,220,255,0.9)';
          c.shadowBlur = r * 3;
        } else {
          c.shadowBlur = 0;
        }
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    const pick = (clientX: number, clientY: number): number => {
      const r = canvas.getBoundingClientRect();
      const nx = ((clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((clientY - r.top) / r.height) * 2 - 1);
      const th = thY;
      const d = norm([nx * (r.width / r.height) * th, (ny + SY) * th, -1]);
      const b = dist * d[2];
      const c = dist * dist - 1;
      const disc = b * b - c;
      if (disc < 0) return -1;
      const tt = -b - Math.sqrt(disc);
      const p: V3 = [tt * d[0], tt * d[1], dist + tt * d[2]];
      const [lon, lat] = lonLatOf(norm(qRotate(qConj(q), p)));
      return stateAtLonLat(lon, lat);
    };

    /* pointer: drag to look around, tap to choose */
    let down: null | { time: number; moved: number; lx: number; ly: number } = null;
    const onDown = (e: PointerEvent) => {
      if (fly) return;
      if (intro) intro.start = performance.now() - intro.dur; // a touch skips to the end
      canvas.setPointerCapture(e.pointerId);
      down = { time: performance.now(), moved: 0, lx: e.clientX, ly: e.clientY };
      vel = [0, 0];
    };
    const onMove = (e: PointerEvent) => {
      if (fly || intro) return;
      if (down) {
        const dx = e.clientX - down.lx;
        const dy = e.clientY - down.ly;
        down.lx = e.clientX;
        down.ly = e.clientY;
        down.moved += Math.abs(dx) + Math.abs(dy);
        if (down.moved > 6) {
          interacted = true;
          lastTouch = performance.now();
          const k = (2 * thY * (dist - 0.9)) / Math.max(h, 1);
          vel = [dx * k, dy * k];
          q = qNorm(qMul(qMul(qAxis([0, 1, 0], dx * k), qAxis([1, 0, 0], dy * k)), q));
        }
      } else if (e.pointerType === 'mouse') {
        const s = pick(e.clientX, e.clientY);
        hover = s;
        hoverTarget = s >= 0 ? 1 : 0;
        canvas.style.cursor = s >= 0 ? 'pointer' : 'grab';
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      const tap = down.moved <= 6 && performance.now() - down.time < 600;
      down = null;
      if (tap && !intro) {
        const s = pick(e.clientX, e.clientY);
        if (s >= 0) choose(s);
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', () => (down = null));
    canvas.addEventListener('pointerleave', () => {
      if (!down) hoverTarget = 0;
    });

    function choose(s: number) {
      if (fly) return;
      const st = states[s];
      hover = s;
      if (!st.available) {
        hoverTarget = 1;
        soonRef.current(st);
        window.setTimeout(() => (hoverTarget = 0), 800);
        return;
      }
      soonRef.current(null);
      setPicked(st.slug);
      hoverTarget = 1;
      const [lon, lat] = centers[s];
      fly = { start: performance.now(), q0: q, q1: faceTo(lon, lat), d0: dist, state: s };
      const wash = washRef.current;
      if (wash) {
        wash.style.background = st.color;
        wash.animate([{ opacity: 0 }, { opacity: 0, offset: 0.76 }, { opacity: 1 }], { duration: FLY, fill: 'forwards' });
      }
      document.documentElement.classList.add('zooming');
    }
    api.current = { choose };

    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(box);

    const labelDirs = labelAt.map(([lon, lat]) => dirOf(lon, lat));
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible && !fly) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const tsec = now / 1000;

      if (fly) {
        const p = clamp01((now - fly.start) / FLY);
        q = qSlerp(fly.q0, fly.q1, ease(clamp01(p / 0.4)));
        dist = fly.d0 + (CLOSE - fly.d0) * ease(clamp01((p - 0.1) / 0.9));
        if (p >= 1) {
          const slug = states[fly.state].slug;
          fly = null;
          cancelAnimationFrame(raf);
          router.push(`/${slug}`);
          return;
        }
      } else if (intro) {
        // the clock starts with the first picture on screen, not while the textures are still being painted
        if (intro.start < 0) intro.start = now;
        const p = clamp01((now - intro.start) / intro.dur);
        q = qSlerp(intro.q0, homeQ, ease(clamp01(p / 0.92)));
        dist = intro.d0 + (HOME_DIST - intro.d0) * ease(p);
        if (p >= 1) {
          intro = null;
          introPlayed = true;
          readyRef.current?.();
          q = homeQ;
          dist = HOME_DIST;
        }
      } else if (!interacted) {
        const sway = qMul(qAxis([0, 1, 0], Math.sin(tsec * 0.5) * 0.012), qAxis([1, 0, 0], Math.sin(tsec * 0.37) * 0.008));
        q = qNorm(qMul(sway, homeQ));
      } else if (!down) {
        q = qNorm(qMul(qMul(qAxis([0, 1, 0], vel[0]), qAxis([1, 0, 0], vel[1])), q));
        vel = [vel[0] * 0.92, vel[1] * 0.92];
        // after a rest, drift gently back over the five states
        if (now - lastTouch > 3500) {
          q = qSlerp(q, homeQ, Math.min(1, dt * 1.6));
          if (Math.abs(q[0] - homeQ[0]) + Math.abs(q[1] - homeQ[1]) + Math.abs(q[2] - homeQ[2]) < 0.002) interacted = false;
        }
      }
      hoverT += (hoverTarget - hoverT) * Math.min(1, dt * 10);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const pm = perspective(2 * Math.atan(thY), w / h, 0.004, 30);
      pm[9] = SY;
      gl.uniformMatrix4fv(U.proj, false, pm);
      gl.uniformMatrix4fv(U.view, false, translation(0, 0, -dist));
      gl.uniform1f(U.hoverId, hover >= 0 ? 40 * (hover + 1) : -100);
      gl.uniform1f(U.hoverT, hoverT);
      gl.uniform1f(U.glow, clamp01((dist - 1.75) / 1.2));
      gl.uniformMatrix4fv(U.model, false, mat4FromQuat(q));
      gl.uniformMatrix3fv(U.rot, false, mat3FromQuat(q));
      gl.depthMask(true);
      draw(meshGlobe, texGlobe, 0);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-2, -2);
      draw(meshPatch, texPatch, 1);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      /* clouds drift slowly on their own */
      gl.depthMask(false);
      const cq = qNorm(qMul(qAxis([0, 1, 0], tsec * 0.02), q));
      gl.uniformMatrix4fv(U.model, false, mat4FromQuat(cq));
      gl.uniformMatrix3fv(U.rot, false, mat3FromQuat(cq));
      draw(meshCloud, texCloud, 2);
      gl.uniformMatrix4fv(U.model, false, mat4FromQuat(q));
      gl.uniformMatrix3fv(U.rot, false, mat3FromQuat(q));

      /* names are painted on the map: they follow their state and fade in once we are close */
      const th = thY;
      const near = fly ? 0 : clamp01((2.15 - dist) / 0.3);
      labelDirs.forEach((dir, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        const wp = qRotate(q, dir);
        const toCam: V3 = [-wp[0], -wp[1], dist - wp[2]];
        const facing = (wp[0] * toCam[0] + wp[1] * toCam[1] + wp[2] * toCam[2]) / Math.hypot(...toCam);
        const depth = dist - wp[2];
        const sx = (wp[0] / (depth * th * (w / h))) * 0.5 * w + w / 2;
        const sy = (-wp[1] / (depth * th)) * 0.5 * h + h / 2 + SY * 0.5 * h;
        el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
        el.style.opacity = String(near * clamp01((facing - 0.1) * 6));
      });
    };
    let last = performance.now();
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
    // The globe is built once; later changes go through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`mapStage planetStage${picked ? ' picking' : ''}`}>
      <div className="planetBox" ref={boxRef}>
        <canvas ref={starsRef} className="stars" aria-hidden="true" />
        <canvas ref={canvasRef} className="planetCanvas" role="img" aria-label={t(ui.mapAria)} />
        <div className="mapLabels" aria-hidden="true">
          {states.map((s, i) => (
            <span key={s.slug} ref={(el) => { labelRefs.current[i] = el; }} className="geoLabel">
              <b>{s.name}</b>
              <i lang={s.localLang}>{s.local}</i>
              {s.available ? <em>{t(ui.openNow)}</em> : null}
            </span>
          ))}
        </div>
      </div>
      <div className="wash" ref={washRef} aria-hidden="true" />
      <ul className="srOnly" aria-label={t(ui.chooseState)}>
        {states.map((s, i) => (
          <li key={s.slug}>
            <button type="button" onClick={() => api.current?.choose(i)}>
              {s.name} {s.available ? '' : `(${t(ui.comingSoon)})`}
            </button>
          </li>
        ))}
      </ul>
      <p className="mapNote" role="status" aria-live="polite">
        {soon ? t(ui.soonNote).replace('{state}', tr(soon.name, soon.nameTa)) : t(ui.planetHint)}
      </p>
    </div>
  );
}
