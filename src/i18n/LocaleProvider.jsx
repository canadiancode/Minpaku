import { useCallback, useEffect, useMemo, useState } from "react";
import { content } from "./content.js";
import { DEFAULT_CURRENCY, LANGUAGES, LocaleContext } from "./localeContext.js";

const STORAGE_KEY = "minpaku:language";

function readInitialLanguage() {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (LANGUAGES.includes(fromUrl)) return fromUrl;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES.includes(stored)) return stored;
  } catch {
    /* storage unavailable (private mode, blocked cookies) */
  }
  return window.navigator.language?.toLowerCase().startsWith("ja") ? "ja" : "en";
}

export default function LocaleProvider({ children }) {
  const [state, setState] = useState(() => {
    const language = readInitialLanguage();
    return { language, currency: DEFAULT_CURRENCY[language] };
  });

  const setLanguage = useCallback((language) => {
    setState({ language, currency: DEFAULT_CURRENCY[language] });
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* not critical */
    }
  }, []);

  const setCurrency = useCallback((currency) => {
    setState((previous) => ({ ...previous, currency }));
  }, []);

  useEffect(() => {
    const { meta } = content[state.language];
    document.documentElement.lang = state.language;
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
    // Keep the language in the URL (?lang=ja) so a shared link opens in the same language.
    const url = new URL(window.location.href);
    if (state.language === "en") url.searchParams.delete("lang");
    else url.searchParams.set("lang", state.language);
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [state.language]);

  const value = useMemo(
    () => ({ ...state, setLanguage, setCurrency, t: content[state.language] }),
    [state, setLanguage, setCurrency],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
