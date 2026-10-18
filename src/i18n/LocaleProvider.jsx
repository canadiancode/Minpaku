import { useCallback, useEffect, useMemo, useState } from "react";
import { content } from "./content.js";
import { DEFAULT_CURRENCY, LANGUAGES, LocaleContext } from "./localeContext.js";

const STORAGE_KEY = "minpaku:language";

function readInitialLanguage() {
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
    document.documentElement.lang = state.language;
    document.title = content[state.language].meta.title;
  }, [state.language]);

  const value = useMemo(
    () => ({ ...state, setLanguage, setCurrency, t: content[state.language] }),
    [state, setLanguage, setCurrency],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
