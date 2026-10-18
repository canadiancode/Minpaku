import { useEffect, useState } from "react";
import { fetchJpyPerOneCadFromProviders, MANUAL_FALLBACK_JPY_PER_ONE_CAD } from "./calculator";

let ratePromise = null;
let resolvedRate = null;

/** Fetches the CAD→JPY rate once per page load and shares it with every caller. */
function loadRate() {
  if (!ratePromise) {
    ratePromise = fetchJpyPerOneCadFromProviders()
      .catch(() => ({ jpyPerOneCad: MANUAL_FALLBACK_JPY_PER_ONE_CAD, source: "manual" }))
      .then((rate) => {
        resolvedRate = rate;
        return rate;
      });
  }
  return ratePromise;
}

/** `{ status: "loading" }` until the rate arrives, then `{ status: "ready", jpyPerOneCad, source }`. */
export function useExchangeRate() {
  const [rate, setRate] = useState(() => (resolvedRate ? { status: "ready", ...resolvedRate } : { status: "loading" }));

  useEffect(() => {
    if (resolvedRate) return;
    let isActive = true;
    loadRate().then((value) => {
      if (isActive) setRate({ status: "ready", ...value });
    });
    return () => {
      isActive = false;
    };
  }, []);

  return rate;
}
