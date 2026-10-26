'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Text } from './ui';

export type Lang = 'en' | 'ta';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Pick the Tamil text when Tamil is chosen and it exists, otherwise English. */
  tr: (en: string, ta?: string) => string;
  /** Same as tr, for entries from ui.ts. */
  t: (text: Text) => string;
}

const LangContext = createContext<LangContextValue>({
  lang: 'en',
  setLang: () => {},
  tr: (en) => en,
  t: (text) => text.en,
});

const STORAGE_KEY = 'isg-lang';

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'ta' || saved === 'en') setLangState(saved);
    } catch {
      // Storage can be blocked; the site still works in English.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage errors.
    }
  };

  const tr = (en: string, ta?: string) => (lang === 'ta' && ta ? ta : en);
  const t = (text: Text) => tr(text.en, text.ta);

  return <LangContext.Provider value={{ lang, setLang, tr, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
