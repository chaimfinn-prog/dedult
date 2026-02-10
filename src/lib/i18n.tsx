'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Lang = 'he' | 'en';

interface LangContextValue {
  lang: Lang;
  toggle: () => void;
}

const LangCtx = createContext<LangContextValue>({ lang: 'he', toggle: () => {} });

export const useLang = () => useContext(LangCtx);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('he');

  useEffect(() => {
    const saved = localStorage.getItem('rc-lang');
    if (saved === 'en') {
      setLang('en');
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }, []);

  const toggle = () => {
    const next: Lang = lang === 'he' ? 'en' : 'he';
    setLang(next);
    localStorage.setItem('rc-lang', next);
    document.documentElement.dir = next === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = next;
  };

  return <LangCtx.Provider value={{ lang, toggle }}>{children}</LangCtx.Provider>;
}
