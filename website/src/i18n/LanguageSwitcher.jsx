import { useLanguage } from './useLanguage';
import { SUPPORTED_LANGS } from './constants';

const LABELS = { fr: 'Français', ar: 'العربية', en: 'English' };

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang } = useLanguage();

  return (
    <div className={`flex gap-2 ${className}`}>
      {SUPPORTED_LANGS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          className={`font-label-sm text-label-sm border-0 bg-transparent cursor-pointer hover:underline transition-colors ${
            lang === code ? 'text-primary font-bold' : 'text-on-surface-variant'
          }`}
        >
          {LABELS[code]}
        </button>
      ))}
    </div>
  );
}
