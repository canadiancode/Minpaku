import { LANGUAGES } from "../../i18n/localeContext.js";
import { useLocale } from "../../i18n/localeContext.js";

const COMPACT_LABELS = { en: "EN", ja: "日本" };

/** Segmented switch that flips language and currency together (EN · CAD ⇄ 日本語 · ¥). */
export default function LanguageSwitch({ compact = false, className = "" }) {
  const { language, setLanguage, t } = useLocale();
  return (
    <div role="radiogroup" aria-label={t.nav.languageLabel} className={`language-switch ${className}`}>
      <span
        className="language-switch-thumb"
        style={{ transform: `translateX(${LANGUAGES.indexOf(language) * 100}%)` }}
        aria-hidden="true"
      />
      {LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={language === option}
          lang={option}
          className="language-switch-option"
          onClick={() => setLanguage(option)}
        >
          {compact ? COMPACT_LABELS[option] : t.nav.languages[option]}
        </button>
      ))}
    </div>
  );
}
