import { useEffect, useState, useCallback, useMemo } from 'react';
import fr from './fr.json';
import en from './en.json';
import ar from './ar.json';
import { STORAGE_KEY, SUPPORTED_LANGS, DEFAULT_LANG } from './constants';
import { LanguageContext } from './useLanguage';

const TRANSLATIONS = { fr, en, ar };

function detectLanguage() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('lang');
  if (SUPPORTED_LANGS.includes(fromUrl)) return fromUrl;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (SUPPORTED_LANGS.includes(stored)) return stored;
  const browser = navigator.language?.slice(0, 2);
  if (SUPPORTED_LANGS.includes(browser)) return browser;
  return DEFAULT_LANG;
}

function setUrlLang(lang) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', lang);
  window.history.replaceState({}, '', url.toString());
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    setUrlLang(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.');
    let value = TRANSLATIONS[lang];
    for (const k of keys) {
      if (value == null) return key;
      value = value[k];
    }
    if (value == null) return key;
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (_, p) => params[p] != null ? String(params[p]) : `{${p}}`);
    }
    return value;
  }, [lang]);

  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const isRtl = lang === 'ar';
  const ctxValue = useMemo(() => ({ lang, setLang, t, dir, isRtl }), [lang, setLang, t, dir, isRtl]);

  return (
    <LanguageContext.Provider value={ctxValue}>
      {children}
    </LanguageContext.Provider>
  );
}


