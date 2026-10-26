'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurtain } from '@/lib/curtain';
import { Character, type CharacterKind } from './Characters';

export interface WalkStart {
  kind: CharacterKind;
  href: string;
  rect: { left: number; top: number; width: number; height: number };
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/**
 * The exit from the persona screen. The chosen character walks to the middle of the screen,
 * then steps up to the viewer until the whole screen is filled and goes black.
 * Then the next screen opens. About 3 seconds in total.
 */
export function WalkOut({ start }: { start: WalkStart }) {
  const router = useRouter();
  const curtain = useCurtain();
  const dim = useRef<HTMLDivElement>(null);
  const walker = useRef<HTMLDivElement>(null);
  const black = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const isHome = start.kind === 'home';
  const [phase, setPhase] = useState<'walk' | 'step'>('walk');

  useEffect(() => {
    let alive = true;
    /** House builder: the film starts at once, on top of the screen, and screen 3 opens when the plan is fully open. */
    const playFilm = async (v: HTMLVideoElement, dm: HTMLDivElement, bl: HTMLDivElement) => {
      v.currentTime = 0;
      let playing = true;
      const started = new Promise<void>((r) => {
        v.addEventListener('playing', () => r(), { once: true });
        window.setTimeout(r, 2500);
      });
      try {
        await v.play();
      } catch {
        v.muted = true; // the browser did not allow sound: play it silently
        playing = await v.play().then(() => true, () => false);
      }
      if (playing) await started;
      if (!alive) return;
      if (playing) {
        // the film and its pale background fade in together over the screen
        dm.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, fill: 'forwards' });
        v.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 350, fill: 'forwards' });
        await new Promise<void>((r) => {
          const t0 = performance.now();
          const tick = () => {
            if (!alive || v.ended || v.error || v.currentTime >= 3.7 || performance.now() - t0 > 7000) return r();
            requestAnimationFrame(tick);
          };
          tick();
        });
        if (!alive) return;
        await wait(350);
      }
      const fade = bl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 550, fill: 'forwards' });
      await fade.finished;
      if (!alive) return;
      v.pause();
      curtain.cover();
      router.push(start.href);
    };
    const run = async () => {
      const el = walker.current;
      const bl = black.current;
      const dm = dim.current;
      if (!el || !bl || !dm) return;
      if (isHome && video.current) {
        await playFilm(video.current, dm, bl);
        return;
      }
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const { rect } = start;
      const targetH = Math.min(vh * 0.58, 560);
      const s = targetH / rect.height;
      const dx = vw / 2 - (rect.left + rect.width / 2);
      const dy = vh * 0.56 - (rect.top + rect.height / 2);
      const at = (f: number) => `translate(${dx * f}px, ${dy * f}px) scale(${1 + (s - 1) * f})`;

      dm.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'forwards', easing: 'ease-out' });
      const walkAnim = el.animate(
        [
          { transform: at(0) },
          { transform: at(0.35), offset: 0.35 },
          { transform: at(0.7), offset: 0.7 },
          { transform: at(1) },
        ],
        { duration: 1500, easing: 'cubic-bezier(0.45, 0.05, 0.35, 1)', fill: 'forwards' },
      );
      await walkAnim.finished;
      if (!alive) return;

      // one more step towards the viewer: the person grows until they fill the screen
      setPhase('step');
      const big = (s * Math.max(vh * 2.6, vw * 3.4)) / targetH;
      const cx = dx;
      const cy = dy - targetH * 0.12; // aim at the face so the head fills the screen
      const grow = el.animate(
        [
          { transform: at(1) },
          { transform: `translate(${cx}px, ${cy + targetH * 0.55}px) scale(${big})` },
        ],
        { duration: 1200, easing: 'cubic-bezier(0.55, 0, 0.9, 0.5)', fill: 'forwards' },
      );
      bl.animate([{ opacity: 0 }, { opacity: 0, offset: 0.35 }, { opacity: 1 }], { duration: 1200, fill: 'forwards' });
      await grow.finished;
      if (!alive) return;
      await wait(60);

      curtain.cover();
      router.push(start.href);
    };
    run().catch(() => {
      if (alive) router.push(start.href);
    });
    return () => {
      alive = false;
    };
    // The walk runs once for the character that was chosen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { rect, kind } = start;
  return (
    <div className="walkout" aria-hidden="true">
      <div className="walkDim" ref={dim} style={isHome ? { background: '#edebe7' } : undefined} />
      {isHome ? <video ref={video} className="walkVideo" src="/videos/home-seeker.mp4" playsInline preload="auto" /> : null}
      <div className="walker" ref={walker} hidden={isHome} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
        <div className={`walkBob${phase === 'walk' ? ' stepping' : ''}`}>
          <Character kind={kind} />
        </div>
      </div>
      <div className="walkBlack" ref={black} />
    </div>
  );
}
