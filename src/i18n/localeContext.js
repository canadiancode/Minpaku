import { createContext, useContext } from "react";

export const LANGUAGES = ["en", "ja"];

/** Picking a language also picks its home currency; the calculator can still override it. */
export const DEFAULT_CURRENCY = { en: "CAD", ja: "JPY" };

export const LocaleContext = createContext(null);

/** `{ language, currency, setLanguage, setCurrency, t }` where `t` is the copy for the language. */
export function useLocale() {
  const locale = useContext(LocaleContext);
  if (!locale) throw new Error("useLocale must be used inside <LocaleProvider>");
  return locale;
}
