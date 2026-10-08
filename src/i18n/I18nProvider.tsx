import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LANGUAGES, Lang, translations } from './translations';
import { supabase } from '@/integrations/supabase/client';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  translating: boolean;
  fallback: boolean;
};

const I18nContext = createContext<Ctx | null>(null);
const cacheKey = (l: Lang) => `fw.i18n.${l}`;

// Protect placeholders/IDs/numbers from machine translation.
const protect = (s: string) => s.replace(/\{(\w+)\}/g, '<x$1>');
const unprotect = (s: string) => s.replace(/<x(\w+)>/g, '{$1}');

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = typeof window !== 'undefined' ? (localStorage.getItem('fw.lang') as Lang | null) : null;
    return stored && LANGUAGES.find(l => l.code === stored) ? stored : 'en';
  });
  const [machine, setMachine] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    localStorage.setItem('fw.lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    setFallback(false);
    if (lang === 'en') { setMachine({}); return; }
    const cached: Record<string, string> = JSON.parse(localStorage.getItem(cacheKey(lang)) || '{}');
    setMachine(cached);
    const curated = translations[lang] || {};
    const missing = Object.keys(translations.en).filter(k => !curated[k] && !cached[k]);
    if (!missing.length) return;
    let cancelled = false;
    setTranslating(true);
    (async () => {
      const out = { ...cached };
      try {
        for (let i = 0; i < missing.length; i += 100) {
          const keys = missing.slice(i, i + 100);
          const { data, error } = await supabase.functions.invoke('translate-ui', {
            body: { texts: keys.map(k => protect(translations.en[k])), target: lang },
          });
          if (error || !data?.translations) throw error ?? new Error('no data');
          keys.forEach((k, j) => { out[k] = unprotect(data.translations[j]); });
        }
        localStorage.setItem(cacheKey(lang), JSON.stringify(out));
        if (!cancelled) setMachine(out);
      } catch {
        if (!cancelled) setFallback(true); // English fallback for untranslated strings
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();
    return () => { cancelled = true; };
  }, [lang]);

  const t = (key: string, vars?: Record<string, string | number>) => {
    let str = translations[lang]?.[key] ?? machine[key] ?? translations.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, String(v));
    return str;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang: setLangState, t, translating, fallback }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
