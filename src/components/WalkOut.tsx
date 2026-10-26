'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurtain } from '@/lib/curtain';
import { Character, Palm, skinTones, type CharacterKind } from './Characters';

export interface WalkStart {
  kind: CharacterKind;
  href: string;
  rect: { left: number; top: number; width: number; height: number };
}

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

/**
 * The exit from the persona screen. The chosen character walks to the middle of the screen,
 * raises a hand, the hand grows over the whole screen and the screen goes black.
 * Then the next screen opens. About 3 seconds in total.
 */
export function WalkOut({ start }: { start: WalkStart }) {
  const router = useRouter();
  const curtain = useCurtain();
  const dim = useRef<HTMLDivElement>(null);
  const walker = useRef<HTMLDivElement>(null);
  const palm = useRef<HTMLDivElement>(null);
  const black = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'walk' | 'raise'>('walk');

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const el = walker.current;
      const pal = palm.current;
      const bl = black.current;
      const dm = dim.current;
      if (!el || !pal || !bl || !dm) return;
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

      setPhase('raise');
      await wait(480);
      if (!alive) return;

      const hand = el.querySelector('.ch-hand')?.getBoundingClientRect();
      const hx = hand ? hand.left + hand.width / 2 : vw / 2;
      const hy = hand ? hand.top + hand.height / 2 : vh * 0.3;
      const big = (2.8 * Math.max(vw, vh)) / 70;
      const grow = pal.animate(
        [
          { transform: `translate(${hx}px, ${hy}px) scale(0.35)`, opacity: 1 },
          { transform: `translate(${vw / 2}px, ${vh / 2}px) scale(${big})`, opacity: 1 },
        ],
        { duration: 1000, easing: 'cubic-bezier(0.55, 0, 0.85, 0.45)', fill: 'forwards' },
      );
      bl.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: 1000, fill: 'forwards' });
      await grow.finished;
      if (!alive) return;

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
      <div className="walkDim" ref={dim} />
      <div className="walker" ref={walker} style={{ left: rect.left, top: rect.top, width: rect.width, height: rect.height }}>
        <Character kind={kind} walking={phase === 'walk'} raised={phase === 'raise'} />
      </div>
      <div className="palm" ref={palm}>
        <Palm skin={skinTones[kind]} />
      </div>
      <div className="walkBlack" ref={black} />
    </div>
  );
}
