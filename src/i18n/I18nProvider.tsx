import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LANGUAGES, Lang, translations } from './translations';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('fw.lang') as Lang | null) : null;
    return stored && LANGUAGES.find(l => l.code === stored) ? stored : 'en';
  });

  useEffect(() => {
    localStorage.setItem('fw.lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: string, vars?: Record<string, string | number>) => {
    const dict = translations[lang] || translations.en;
    let str = dict[key] ?? translations.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, String(v));
    return str;
  };

  return <I18nContext.Provider value={{ lang, setLang: setLangState, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}