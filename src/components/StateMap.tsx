'use client';

import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/lang';
import { ui } from '@/lib/ui';
import { states, type StateInfo } from '@/data/config';
import { mapShapes, mapViewBox } from '@/data/southMap';

/** Where each name sits on the map, in map units. Kerala is narrow, so its name sits in the sea. */
const labelAt: Record<string, { x: number; y: number }> = {
  'tamil-nadu': { x: 250, y: 560 },
  kerala: { x: 112, y: 596 },
  karnataka: { x: 140, y: 300 },
  'andhra-pradesh': { x: 400, y: 250 },
  telangana: { x: 292, y: 140 },
};

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/**
 * Screen 1: the map. Tapping Tamil Nadu makes the whole state grow until it fills the screen,
 * then the next screen opens in the same colour. The other states only show a short note.
 */
export function StateMap() {
  const { t, tr } = useLang();
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);
  const [soon, setSoon] = useState<StateInfo | null>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);

  function choose(s: StateInfo) {
    if (picked) return;
    if (!s.available) {
      setSoon(s);
      return;
    }
    setSoon(null);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const zoom = zoomRef.current;
    const wash = washRef.current;
    if (reduce || !zoom || !wash || !zoom.animate) {
      router.push(`/${s.slug}`);
      return;
    }
    setPicked(s.slug);
    const shape = mapShapes[s.slug];
    const box = zoom.getBoundingClientRect();
    const k = box.width / mapViewBox.width;
    const [cx, cy] = shape.centroid;
    const ox = cx * k;
    const oy = cy * k;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const [x0, y0, x1, y1] = shape.bbox;
    // Grow until the middle of the state, the part we see on screen, is larger than the screen.
    const inner = Math.max(0.5 * Math.min((x1 - x0) * k, (y1 - y0) * k), 40);
    const scale = Math.max(vw, vh) / inner;
    zoom.style.transformOrigin = `${ox}px ${oy}px`;
    document.documentElement.classList.add('zooming');
    wash.style.background = s.color;
    wash.animate([{ opacity: 0 }, { opacity: 0, offset: 0.72 }, { opacity: 1 }], { duration: 2500, fill: 'forwards' });
    const grow = zoom.animate(
      [
        { transform: 'translate(0px, 0px) scale(1)' },
        { transform: `translate(${vw / 2 - (box.left + ox)}px, ${vh / 2 - (box.top + oy)}px) scale(${scale})` },
      ],
      { duration: 2500, easing: 'cubic-bezier(0.6, 0.02, 0.3, 1)', fill: 'forwards' },
    );
    grow.finished
      .then(() => router.push(`/${s.slug}`))
      .catch(() => {
        /* animation cancelled, for example when the page closes */
      });
  }

  const onKey = (e: KeyboardEvent, s: StateInfo) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(s);
    }
  };

  return (
    <div className={`mapStage${picked ? ' picking' : ''}`}>
      <div className="mapZoom" ref={zoomRef}>
        <div className="mapBox">
          <svg viewBox={`0 0 ${mapViewBox.width} ${mapViewBox.height}`} className="map" role="group" aria-label={t(ui.mapAria)}>
            <g className="seaText" fill="currentColor">
              <text x="26" y="215" fontSize="15" fontStyle="italic" letterSpacing="2">
                {t(ui.seaArabian)}
              </text>
              <text x="372" y="500" fontSize="15" fontStyle="italic" letterSpacing="2">
                {t(ui.seaBay)}
              </text>
              <text x="190" y={mapViewBox.height - 12} fontSize="15" fontStyle="italic" letterSpacing="2">
                {t(ui.seaOcean)}
              </text>
            </g>
            {states.map((s) => (
              <g
                key={s.slug}
                className={`shape${s.available ? ' open' : ''}${picked === s.slug ? ' chosen' : ''}${soon?.slug === s.slug ? ' nudge' : ''}`}
                data-slug={s.slug}
                role="link"
                tabIndex={picked ? -1 : 0}
                aria-label={`${s.name} ${s.local}${s.available ? '' : `, ${t(ui.comingSoon)}`}`}
                onClick={() => choose(s)}
                onKeyDown={(e) => onKey(e, s)}
              >
                <path d={mapShapes[s.slug].d} fill={s.color} fillRule="evenodd" stroke="#FFFFFF" strokeWidth="2.4" strokeLinejoin="round" />
              </g>
            ))}
          </svg>
          <div className="mapLabels" aria-hidden="true">
            {states.map((s) => (
              <span
                key={s.slug}
                className={`mapLabel${s.available ? ' open' : ''}`}
                style={{ left: pct(labelAt[s.slug].x, mapViewBox.width), top: pct(labelAt[s.slug].y, mapViewBox.height) } as CSSProperties}
              >
                <b>{s.name}</b>
                <i lang={s.localLang}>{s.local}</i>
                {s.available ? <em>{t(ui.openNow)}</em> : null}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="wash" ref={washRef} aria-hidden="true" />
      <p className="mapNote" role="status" aria-live="polite">
        {soon ? t(ui.soonNote).replace('{state}', tr(soon.name, soon.nameTa)) : t(ui.mapPrompt)}
      </p>
    </div>
  );
}
