'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { states, type StateInfo } from '@/data/config';
import {
  buildPlanet,
  mapToDir,
  mat3FromQuat,
  mat4FromQuat,
  norm,
  perspective,
  qAxis,
  qConj,
  qFromTo,
  qMul,
  qNorm,
  qRotate,
  qSlerp,
  stateAt,
  translation,
  type Quat,
  type V3,
} from '@/lib/planet';

/** Where each name sits on the planet, in map units. */
const planetLabels: Record<string, { x: number; y: number }> = {
  'tamil-nadu': { x: 318, y: 610 },
  kerala: { x: 50, y: 618 },
  karnataka: { x: 120, y: 300 },
  'andhra-pradesh': { x: 420, y: 262 },
  telangana: { x: 292, y: 140 },
};

const FOV = (36 * Math.PI) / 180;
const DIST = 3.9;
const VERT = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCol; attribute float aState;
uniform mat4 uProj; uniform mat4 uView; uniform mat4 uModel; uniform mat3 uRot;
uniform float uHover; uniform float uHoverT;
varying vec3 vCol; varying vec3 vNor; varying float vHi;
void main() {
  float hi = abs(aState - uHover) < 0.5 ? uHoverT : 0.0;
  vec3 p = aPos * (1.0 + 0.028 * hi);
  vNor = uRot * aNor;
  vCol = aCol; vHi = hi;
  gl_Position = uProj * uView * uModel * vec4(p, 1.0);
}`;
const FRAG = `
precision mediump float;
varying vec3 vCol; varying vec3 vNor; varying float vHi;
uniform vec3 uLight;
void main() {
  vec3 n = normalize(vNor);
  float d = max(dot(n, uLight), 0.0);
  float rim = pow(1.0 - max(n.z, 0.0), 3.0);
  vec3 c = vCol * (0.5 + 0.62 * d) + vec3(0.85, 0.95, 1.0) * rim * 0.16;
  c = mix(c, vec3(1.0, 0.97, 0.85), vHi * 0.3);
  gl_FragColor = vec4(c, 1.0);
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

/**
 * Screen 1 as a little planet. Spin it, tap a state. When Tamil Nadu is tapped the planet
 * turns it to face you and the camera flies down until the state fills the screen.
 */
export function PlanetMap() {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box) return;
    const gl = (canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const mesh = buildPlanet(planetLabels);
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const loc = (n: string) => gl.getUniformLocation(prog, n);
    const U = { proj: loc('uProj'), view: loc('uView'), model: loc('uModel'), rot: loc('uRot'), hover: loc('uHover'), hoverT: loc('uHoverT'), light: loc('uLight') };
    const upload = (data: Float32Array) => {
      const buf = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return buf;
    };
    const planetBuf = upload(mesh.planet.data);
    const cloudBuf = upload(mesh.clouds.data);
    const bind = (buf: WebGLBuffer) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      const stride = 40;
      [['aPos', 3, 0], ['aNor', 3, 12], ['aCol', 3, 24], ['aState', 1, 36]].forEach(([name, size, off]) => {
        const a = gl.getAttribLocation(prog, name as string);
        gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(a, size as number, gl.FLOAT, false, stride, off as number);
      });
    };
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 0);
    gl.uniform3fv(U.light, new Float32Array(norm([-0.55, 0.65, 0.75])));

    /* planet orientation */
    // The land is turned to face the viewer, then tipped a little so the planet looks round.
    const base: Quat = qNorm(qMul(qAxis([1, 0, 0], 0.16), qFromTo(mapToDir(285, 385), [0, 0, 1])));
    let q: Quat = base;
    let interacted = false;
    let vel: [number, number] = [0, 0];
    let dist = DIST;
    let hover = -1;
    let hoverT = 0;
    let hoverTarget = 0;
    let fly: null | { start: number; q0: Quat; q1: Quat; state: number } = null;
    const TOTAL = 2500;
    let w = 1;
    let h = 1;
    let raf = 0;
    let visible = true;

    const resize = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    const pick = (clientX: number, clientY: number): number => {
      const r = canvas.getBoundingClientRect();
      const nx = ((clientX - r.left) / r.width) * 2 - 1;
      const ny = -(((clientY - r.top) / r.height) * 2 - 1);
      const th = Math.tan(FOV / 2);
      const d = norm([nx * (r.width / r.height) * th, ny * th, -1]);
      const o: V3 = [0, 0, dist];
      const b = o[2] * d[2];
      const c = o[2] * o[2] - 1.04 * 1.04;
      const disc = b * b - c;
      if (disc < 0) return -1;
      const tt = -b - Math.sqrt(disc);
      const p: V3 = [o[0] + tt * d[0], o[1] + tt * d[1], o[2] + tt * d[2]];
      return stateAt(norm(qRotate(qConj(q), p)));
    };

    /* pointer: drag to spin, tap to choose */
    let down: null | { x: number; y: number; time: number; moved: number; lx: number; ly: number } = null;
    const onDown = (e: PointerEvent) => {
      if (fly) return;
      canvas.setPointerCapture(e.pointerId);
      down = { x: e.clientX, y: e.clientY, time: performance.now(), moved: 0, lx: e.clientX, ly: e.clientY };
      vel = [0, 0];
    };
    const onMove = (e: PointerEvent) => {
      if (fly) return;
      if (down) {
        const dx = e.clientX - down.lx;
        const dy = e.clientY - down.ly;
        down.lx = e.clientX;
        down.ly = e.clientY;
        down.moved += Math.abs(dx) + Math.abs(dy);
        if (down.moved > 6) {
          interacted = true;
          const k = 0.0075;
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
      if (tap) {
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
        window.setTimeout(() => (hoverTarget = 0), 700);
        return;
      }
      soonRef.current(null);
      setPicked(st.slug);
      hoverTarget = 1;
      const q1 = qFromTo(mesh.centerDirs[s], [0, 0, 1]);
      fly = { start: performance.now(), q0: q, q1, state: s };
      const wash = washRef.current;
      if (wash) {
        wash.style.background = st.color;
        wash.animate([{ opacity: 0 }, { opacity: 0, offset: 0.74 }, { opacity: 1 }], { duration: TOTAL, fill: 'forwards' });
      }
      document.documentElement.classList.add('zooming');
    }
    api.current = { choose };

    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(box);

    const proj = () => perspective(FOV, w / h, 0.05, 20);
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible && !fly) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const tsec = now / 1000;

      if (fly) {
        const p = clamp01((now - fly.start) / TOTAL);
        q = qSlerp(fly.q0, fly.q1, ease(clamp01(p / 0.45)));
        dist = DIST + (1.12 - DIST) * ease(clamp01((p - 0.2) / 0.8));
        if (p >= 1) {
          const slug = states[fly.state].slug;
          fly = null;
          cancelAnimationFrame(raf);
          router.push(`/${slug}`);
          return;
        }
      } else if (!interacted) {
        q = qNorm(qMul(qMul(qAxis([0, 1, 0], Math.sin(tsec * 0.45) * 0.2), qAxis([1, 0, 0], Math.sin(tsec * 0.33) * 0.05)), base));
      } else if (!down) {
        q = qNorm(qMul(qMul(qAxis([0, 1, 0], vel[0]), qAxis([1, 0, 0], vel[1])), q));
        vel = [vel[0] * 0.94, vel[1] * 0.94];
      }
      hoverT += (hoverTarget - hoverT) * Math.min(1, dt * 10);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.proj, false, proj());
      gl.uniformMatrix4fv(U.view, false, translation(0, 0, -dist));
      gl.uniform1f(U.hover, hover);
      gl.uniform1f(U.hoverT, hoverT);
      gl.uniformMatrix4fv(U.model, false, mat4FromQuat(q));
      gl.uniformMatrix3fv(U.rot, false, mat3FromQuat(q));
      bind(planetBuf);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.planet.vertexCount);
      /* clouds drift slowly on their own */
      const cq = qNorm(qMul(qAxis([0.2, 1, 0.1], tsec * 0.08), q));
      gl.uniform1f(U.hover, -9);
      gl.uniformMatrix4fv(U.model, false, mat4FromQuat(cq));
      gl.uniformMatrix3fv(U.rot, false, mat3FromQuat(cq));
      bind(cloudBuf);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.clouds.vertexCount);

      /* names follow their states around the planet */
      const th = Math.tan(FOV / 2);
      mesh.labelDirs.forEach((dir, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        const wp = qRotate(q, [dir[0] * 1.1, dir[1] * 1.1, dir[2] * 1.1]);
        const facing = qRotate(q, dir)[2];
        const depth = dist - wp[2];
        const sx = (wp[0] / (depth * th * (w / h))) * 0.5 * w + w / 2;
        const sy = (-wp[1] / (depth * th)) * 0.5 * h + h / 2;
        el.style.transform = `translate(${sx}px, ${sy}px) translate(-50%, -50%)`;
        el.style.opacity = fly ? '0' : String(clamp01((facing - 0.15) * 5));
      });
    };
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
    // The planet is built once; later changes go through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`mapStage planetStage${picked ? ' picking' : ''}`}>
      <div className="planetBox" ref={boxRef}>
        <div className="skyClouds" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <canvas ref={canvasRef} className="planetCanvas" role="img" aria-label={t(ui.mapAria)} />
        <div className="mapLabels" aria-hidden="true">
          {states.map((s, i) => (
            <span key={s.slug} ref={(el) => { labelRefs.current[i] = el; }} className={`mapLabel planetLabel${s.available ? ' open' : ''}`}>
              <b>{s.name}</b>
              <i lang={s.localLang}>{s.local}</i>
              {s.available ? <em>{t(ui.openNow)}</em> : null}
            </span>
          ))}
        </div>
      </div>
      <div className="wash" ref={washRef} aria-hidden="true" />
      <ul className="stateButtons" aria-label={t(ui.chooseState)}>
        {states.map((s, i) => (
          <li key={s.slug}>
            <button type="button" onClick={() => api.current?.choose(i)} style={{ borderColor: s.color }}>
              {s.name}
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
