'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { states, type StateInfo } from '@/data/config';
import { southStates } from '@/data/southGeo';

/*
 * Screen 1: the Earth seen from space turns to face India and zooms down onto the five
 * southern states. Imagery is NASA Blue Marble (public domain), built by
 * scripts/build-earth-textures.py. The globe is not interactive; the states and their
 * names are the only things to tap.
 */

/** public/earth/south.jpg covers lon 68..90 E, lat 24..4 N. */
const SOUTH_BOX = { lon0: 68, lon1: 90, lat0: 24, lat1: 4 };
const D2R = Math.PI / 180;
/** Where the camera settles, and the area that must fit on screen once it has. */
const CENTER = { lon: 79.4, lat: 13.9 };
const SPAN = { lon: 0.19, lat: 0.208 }; // radians on the sphere
/** Intro timeline, ms. */
const END = 9400;
const FLY = 1300;
/** Where each name sits, [lon, lat], in the same order as `states`. Kerala's sits out at sea with a short line. */
const labelAt: Record<string, { at: [number, number]; end?: boolean; line?: [number, number] }> = {
  'tamil-nadu': { at: [78.3, 11.1] },
  kerala: { at: [75.05, 10.1], end: true, line: [76.45, 10.1] },
  karnataka: { at: [75.9, 14.6] },
  'andhra-pradesh': { at: [79.3, 15.2] },
  telangana: { at: [79.1, 17.9] },
};
const seas = [
  { text: ui.seaArabian, at: [72.6, 13.2] },
  { text: ui.seaBay, at: [85.6, 15.4] },
  { text: ui.seaOcean, at: [76.6, 6.9] },
] as const;

const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes, uC;
uniform float uR, uLam, uPhi, uZoom, uFocus, uTime, uCloud;
uniform sampler2D uEarth, uSouth, uMask, uClouds;
const float PI = 3.14159265;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.03;a*=.5;}return v;}
vec3 S(vec2 uv){return texture2D(uSouth,uv).rgb;}
float isWater(vec3 c){return smoothstep(.02,.09,c.b-max(c.r,c.g));}
void main(){
  vec2 q = (vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) - uC) / uR;
  float rho = length(q);
  if (rho > 1.) { gl_FragColor = vec4(0.); return; }
  float shade = 1. - uZoom;
  float x = q.x, y = -q.y, z = sqrt(max(0., 1. - rho * rho));
  float sp = sin(uPhi), cp = cos(uPhi);
  float lat = asin(clamp(z * sp + y * cp, -1., 1.));
  float lon = uLam + atan(x, z * cp - y * sp);
  float lonD = mod(lon / PI * 180. + 180., 360.) - 180.;
  float latD = lat / PI * 180.;
  vec2 euv = vec2(fract((lon + PI) / (2. * PI)), (PI * .5 - lat) / PI);
  vec3 col = texture2D(uEarth, euv).rgb;

  // Sharp detail over South India; outside the five states it is blurred a little and dimmed.
  vec2 suv = vec2((lonD - 68.) / 22., (24. - latD) / 20.);
  float inS = step(0., suv.x) * step(suv.x, 1.) * step(0., suv.y) * step(suv.y, 1.);
  float edge = smoothstep(0., .05, suv.x) * smoothstep(1., .95, suv.x) * smoothstep(0., .05, suv.y) * smoothstep(1., .95, suv.y);
  float sd = inS * edge * smoothstep(.15, .5, uZoom);
  float m = texture2D(uMask, clamp(suv, 0., 1.)).r * inS;
  if (sd > 0.) {
    vec3 s = S(suv);
    vec2 px = vec2(1. / 1980., 1. / 1800.) * 2.4;
    vec3 b = (S(suv + vec2(px.x, 0.)) + S(suv - vec2(px.x, 0.)) + S(suv + vec2(0., px.y)) + S(suv - vec2(0., px.y))
            + S(suv + px) + S(suv - px) + S(suv + vec2(px.x, -px.y)) + S(suv + vec2(-px.x, px.y)) + s * 2.) / 10.;
    float other = uFocus * (1. - m) * (1. - isWater(s));
    vec3 o = mix(s, b, other);
    float l = dot(o, vec3(.299, .587, .114));
    o = mix(o, vec3(l), .35 * other) * (1. - .32 * other);
    col = mix(col, o, sd);
  }
  float water = isWater(col);
  float sh = fbm(vec2(lonD * 7., latD * 12.) + vec2(uTime * .06, uTime * .025));
  col += water * .1 * uZoom * (sh - .5) * vec3(.6, .8, 1.);

  // A few clouds that turn with the Earth and drift slowly; kept thin over the five states.
  float cu = fract(euv.x + uTime * .00035);
  float det = fbm(vec2(lonD, latD) * 1.7 + vec2(uTime * .012, 0.));
  float c = smoothstep(.42, .9, texture2D(uClouds, vec2(cu, euv.y)).r * (.7 + .6 * det));
  float cs = smoothstep(.42, .9, texture2D(uClouds, vec2(cu + .0015, euv.y + .0015)).r * (.7 + .6 * det));
  float camt = uCloud * (1. - .7 * m * uFocus);
  col *= 1. - .28 * cs * camt;
  col = mix(col, vec3(.96, .97, 1.), c * camt);

  // Sunlight from the upper left while in space; flat light once close.
  vec3 n = vec3(x, y, z);
  vec3 sun = normalize(vec3(-.55, .45, .7));
  float day = smoothstep(-.2, .35, dot(n, sun));
  col *= mix(1., mix(.05, 1.12, day), shade);
  vec3 h = normalize(sun + vec3(0., 0., 1.));
  col += vec3(pow(max(dot(n, h), 0.), 24.) * water * .22 * shade);
  float a = smoothstep(1., 1. - 1.5 / uR, rho);
  gl_FragColor = vec4(col * a, a);
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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface View {
  W: number;
  H: number;
  /** Screen area the five states settle into. */
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface Cam {
  lam: number;
  phi: number;
  R: number;
  cx: number;
  cy: number;
  zoom: number;
  focus: number;
}

/** The camera at time t of the intro, plus the fly-in towards a chosen state (0..1). */
function camAt(t: number, v: View, fly: number, flyTo: [number, number]): Cam {
  const tx = (v.x0 + v.x1) / 2, ty = (v.y0 + v.y1) / 2;
  const R1 = Math.min(((v.y1 - v.y0) * 0.98) / SPAN.lat, ((v.x1 - v.x0) * 0.98) / SPAN.lon);
  const R0 = Math.min(v.W, v.H) * 0.33;
  const turn = ease(clamp01((t - 500) / 4300));
  const zoom = ease(clamp01((t - 4300) / 3900));
  const f = ease(fly);
  return {
    lam: lerp(lerp(-28, CENTER.lon, turn), flyTo[0], f) * D2R,
    phi: lerp(lerp(4, CENTER.lat, turn), flyTo[1], f) * D2R,
    R: R0 * (1 + 0.06 * turn) * Math.pow(R1 / (R0 * 1.06), zoom) * (1 + 2.4 * f),
    cx: lerp(lerp(v.W / 2, tx, zoom), v.W / 2, f),
    cy: lerp(lerp(v.H / 2 + 20, ty, zoom), v.H / 2, f),
    zoom,
    focus: clamp01((t - 7000) / 1200),
  };
}

/** Orthographic projection of [lon, lat] to screen pixels; points behind the globe sit on its rim. */
function projector(c: Cam) {
  const sp0 = Math.sin(c.phi), cp0 = Math.cos(c.phi);
  return (lon: number, lat: number): [number, number] => {
    const l = lon * D2R - c.lam, p = lat * D2R;
    const cp = Math.cos(p), sp = Math.sin(p), cl = Math.cos(l);
    let x = c.R * cp * Math.sin(l), y = c.R * (cp0 * sp - sp0 * cp * cl);
    if (sp0 * sp + cp0 * cp * cl < 0) {
      const k = c.R / (Math.hypot(x, y) || 1);
      x *= k;
      y *= k;
    }
    return [c.cx + x, c.cy - y];
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** White where the five states are, on the same grid as south.jpg (at half size). */
function stateMask(): HTMLCanvasElement {
  const { lon0, lon1, lat0, lat1 } = SOUTH_BOX;
  const w = 990, h = 900;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  for (const rings of Object.values(southStates)) {
    for (const r of rings) {
      for (let i = 0; i < r.length; i += 2) {
        const x = ((r[i] - lon0) / (lon1 - lon0)) * w, y = ((lat0 - r[i + 1]) / (lat0 - lat1)) * h;
        if (i) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.closePath();
    }
  }
  ctx.fill();
  return c;
}

function paintStars(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  let s = 20260914;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const n = Math.round((w * h) / 4000);
  for (let i = 0; i < n; i++) {
    const big = rnd() > 0.94;
    const tint = rnd();
    ctx.globalAlpha = big ? 0.95 : 0.35 + rnd() * 0.5;
    ctx.fillStyle = tint > 0.86 ? '#ffe2b8' : tint > 0.72 ? '#cfe0ff' : '#fff';
    ctx.beginPath();
    ctx.arc(rnd() * w, rnd() * h, big ? 0.9 + rnd() * 0.8 : 0.3 + rnd() * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The intro plays once per visit; coming back to screen 1 shows the settled map straight away. */
let introPlayed = false;

export function EarthIntro({ onFail, onReady, calm = false }: { onFail: () => void; onReady?: () => void; calm?: boolean }) {
  const { t, tr } = useLang();
  const router = useRouter();
  const [soon, setSoon] = useState<StateInfo | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const labelRefs = useRef<(HTMLElement | null)[]>([]);
  const seaRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRef = useRef<SVGLineElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const flyRef = useRef<((slug: string) => void) | null>(null);
  const props = useRef({ onFail, onReady, calm });
  props.current = { onFail, onReady, calm };

  useEffect(() => {
    const box = boxRef.current, canvas = glRef.current, stars = starsRef.current;
    if (!box || !canvas || !stars) return;
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) {
      props.current.onFail();
      return;
    }
    let alive = true;
    let raf = 0;
    let t0 = 0;
    let fly: { start: number; slug: string; to: [number, number] } | null = null;
    let ready = false;
    let view: View = { W: 1, H: 1, x0: 0, x1: 1, y0: 0, y1: 1 };
    const clock0 = performance.now();

    const measure = () => {
      const W = box.clientWidth, H = box.clientHeight;
      const intro = document.querySelector('.welcome .intro')?.getBoundingClientRect();
      const wide = W >= 900;
      view = wide
        ? { W, H, x0: Math.max(intro ? intro.right + 24 : W * 0.42, W * 0.38), x1: W - 40, y0: intro ? intro.top : 110, y1: H - 80 }
        : { W, H, x0: 10, x1: W - 10, y0: Math.max(intro ? intro.bottom + 4 : H * 0.42, H * 0.36), y1: H - 84 };
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      svgRef.current?.setAttribute('viewBox', `0 0 ${W} ${H}`);
      paintStars(stars);
    };
    measure();

    // Program
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      props.current.onFail();
      return;
    }
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const u = (n: string) => gl.getUniformLocation(prog, n);
    const U = { res: u('uRes'), c: u('uC'), r: u('uR'), lam: u('uLam'), phi: u('uPhi'), zoom: u('uZoom'), focus: u('uFocus'), time: u('uTime'), cloud: u('uCloud') };
    const texture = (unit: number, img: TexImageSource, repeat: boolean, mips: boolean) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (mips) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    };
    ['uEarth', 'uSouth', 'uMask', 'uClouds'].forEach((n, i) => gl.uniform1i(u(n), i));

    const rings = states.map((s) => southStates[s.slug] || []);
    const draw = (now: number) => {
      const t = Math.min(now - t0, END);
      const f = fly ? clamp01((now - fly.start) / FLY) : 0;
      const cam = camAt(t, view, f, fly ? fly.to : [CENTER.lon, CENTER.lat]);
      const dpr = canvas.width / view.W;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform2f(U.c, cam.cx * dpr, cam.cy * dpr);
      gl.uniform1f(U.r, cam.R * dpr);
      gl.uniform1f(U.lam, cam.lam);
      gl.uniform1f(U.phi, cam.phi);
      gl.uniform1f(U.zoom, cam.zoom);
      gl.uniform1f(U.focus, cam.focus);
      gl.uniform1f(U.time, (now - clock0) / 1000);
      gl.uniform1f(U.cloud, lerp(0.75, 0.22, cam.zoom));
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Outlines, names and sea names follow the camera.
      const outlines = clamp01((t - 7300) / 900) * (1 - f * 2);
      const names = clamp01((t - 7900) / 800) * (1 - f * 3);
      const proj = projector(cam);
      let keralaRight = 0;
      if (svgRef.current) svgRef.current.style.opacity = String(Math.max(0, outlines));
      if (outlines > 0) {
        rings.forEach((rs, i) => {
          let d = '';
          for (const r of rs) {
            for (let k = 0; k < r.length; k += 2) {
              const [x, y] = proj(r[k], r[k + 1]);
              d += (k ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
            }
            d += 'Z';
          }
          pathRefs.current[i]?.setAttribute('d', d);
        });
      }
      states.forEach((s, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        let [x, y] = proj(...labelAt[s.slug].at);
        // Keep names whole on narrow screens (Kerala's name sits out at sea, left of the coast).
        const w = el.offsetWidth;
        x = labelAt[s.slug].end ? Math.max(x, w + 6) : Math.min(Math.max(x, w / 2 + 6), view.W - w / 2 - 6);
        if (s.slug === 'kerala') keralaRight = x;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(${labelAt[s.slug].end ? '-100%' : '-50%'}, -50%)`;
        el.style.opacity = String(Math.max(0, names));
        el.style.pointerEvents = names > 0.5 ? 'auto' : 'none';
      });
      const k = labelAt.kerala;
      const a = proj(k.at[0] + 0.12, k.at[1]), b = proj(...k.line!);
      a[0] = Math.max(a[0], keralaRight + 4);
      const line = lineRef.current;
      if (line) {
        line.setAttribute('x1', a[0].toFixed(1));
        line.setAttribute('y1', a[1].toFixed(1));
        line.setAttribute('x2', b[0].toFixed(1));
        line.setAttribute('y2', b[1].toFixed(1));
        line.style.opacity = String(Math.max(0, names));
      }
      seas.forEach((s, i) => {
        const el = seaRefs.current[i];
        if (!el) return;
        const [x, y] = proj(s.at[0], s.at[1]);
        const inside = x > 40 && x < view.W - 40 && y > view.y0 && y < view.H - 40;
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        el.style.opacity = inside ? String(Math.max(0, 0.9 * names)) : '0';
      });

      if (!ready && t >= END - 1100) {
        ready = true;
        introPlayed = true;
        setSettled(true);
        props.current.onReady?.();
      }
      if (fly && f >= 1) {
        const slug = fly.slug;
        fly = null;
        router.push(`/${slug}`);
      }
    };

    const loop = (now: number) => {
      if (!alive) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    flyRef.current = (slug: string) => {
      if (fly || !ready) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        router.push(`/${slug}`);
        return;
      }
      fly = { start: performance.now(), slug, to: labelAt[slug].at };
      document.documentElement.classList.add('zooming');
      washRef.current?.animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: FLY, fill: 'forwards' });
    };

    Promise.all([loadImage('/earth/earth.jpg'), loadImage('/earth/south.jpg'), loadImage('/earth/clouds.jpg')])
      .then(([earth, south, clouds]) => {
        if (!alive) return;
        texture(0, earth, true, true);
        texture(1, south, false, false);
        texture(2, stateMask(), false, false);
        texture(3, clouds, true, true);
        if (gl.getError() !== gl.NO_ERROR) throw new Error('texture upload failed');
        t0 = performance.now() - (props.current.calm || introPlayed ? END : 0);
        box.classList.add('on');
        raf = requestAnimationFrame(loop);
      })
      .catch(() => alive && props.current.onFail());

    const ro = new ResizeObserver(() => measure());
    ro.observe(box);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [router]);

  function choose(e: MouseEvent | null, s: StateInfo) {
    e?.preventDefault();
    if (!s.available) {
      setSoon(s);
      return;
    }
    setSoon(null);
    flyRef.current?.(s.slug);
  }

  return (
    <div className="mapStage planetStage earthStage">
      <div className="planetBox" ref={boxRef}>
        <canvas ref={starsRef} className="stars" aria-hidden="true" />
        <canvas ref={glRef} className="earthCanvas" role="img" aria-label={t(ui.mapAria)} />
        <svg ref={svgRef} className="earthLines" aria-hidden="true">
          {states.map((s, i) => (
            <path
              key={s.slug}
              ref={(el) => { pathRefs.current[i] = el; }}
              className={hover === s.slug ? 'on' : ''}
              onClick={() => choose(null, s)}
              onMouseEnter={() => setHover(s.slug)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          <line ref={lineRef} className="earthLeader" />
        </svg>
        {seas.map((s, i) => (
          <span key={s.text.en} ref={(el) => { seaRefs.current[i] = el; }} className="seaName" aria-hidden="true">
            {t(s.text)}
          </span>
        ))}
        <div className="earthNames">
          {states.map((s, i) => {
            const inner = (
              <>
                <b>{s.name}</b>
                <i lang={s.localLang}>{s.local}</i>
                <em className={s.available ? 'open' : ''}>{t(s.available ? ui.openNow : ui.comingSoon)}</em>
              </>
            );
            const common = {
              className: `earthName${labelAt[s.slug].end ? ' end' : ''}${hover === s.slug ? ' on' : ''}`,
              onMouseEnter: () => setHover(s.slug),
              onMouseLeave: () => setHover(null),
              onFocus: () => setHover(s.slug),
              onBlur: () => setHover(null),
            };
            return s.available ? (
              <Link key={s.slug} href={`/${s.slug}`} ref={(el) => { labelRefs.current[i] = el; }} onClick={(e) => choose(e, s)} {...common}>
                {inner}
              </Link>
            ) : (
              <button key={s.slug} type="button" ref={(el) => { labelRefs.current[i] = el; }} onClick={(e) => choose(e, s)} {...common}>
                {inner}
              </button>
            );
          })}
        </div>
      </div>
      <div className="wash earthWash" ref={washRef} aria-hidden="true" />
      <p className="mapNote" role="status" aria-live="polite">
        {soon ? t(ui.soonNote).replace('{state}', tr(soon.name, soon.nameTa)) : settled ? t(ui.planetHint) : ''}
      </p>
    </div>
  );
}
