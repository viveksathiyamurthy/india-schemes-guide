'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * A black curtain that lives above every page. The walking character covers the screen,
 * the curtain turns black, the next page opens underneath and the curtain lifts.
 * It sits in the layout, so it survives the move from one page to the next.
 */
interface Curtain {
  cover: () => void;
  reveal: () => void;
}

const Ctx = createContext<Curtain>({ cover: () => {}, reveal: () => {} });
export const useCurtain = () => useContext(Ctx);

export function CurtainProvider({ children }: { children: ReactNode }) {
  const [black, setBlack] = useState(false);
  const [instant, setInstant] = useState(false);

  const cover = useCallback(() => {
    setInstant(true);
    setBlack(true);
  }, []);
  const reveal = useCallback(() => {
    setInstant(false);
    setBlack(false);
  }, []);

  // After a full page load (only used by the browser tests) the curtain starts closed, then lifts.
  useEffect(() => {
    try {
      if (sessionStorage.getItem('isg-curtain')) {
        sessionStorage.removeItem('isg-curtain');
        cover();
        const id = window.setTimeout(reveal, 120);
        return () => window.clearTimeout(id);
      }
    } catch {
      /* storage may be blocked; the page still works */
    }
  }, [cover, reveal]);

  const value = useMemo(() => ({ cover, reveal }), [cover, reveal]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className={`curtain${black ? ' shut' : ''}${instant ? ' instant' : ''}`} aria-hidden="true" />
    </Ctx.Provider>
  );
}
