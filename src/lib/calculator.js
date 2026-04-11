/** JPY per 1 CAD — used only when free APIs fail or return an unusable value. */
export const MANUAL_FALLBACK_JPY_PER_ONE_CAD = 110;

const FRANKFURTER_CAD_TO_JPY_URL =
  "https://api.frankfurter.dev/v1/latest?from=CAD&to=JPY";

const OPEN_ER_API_CAD_LATEST_URL = "https://open.er-api.com/v6/latest/CAD";

export const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const jpyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export const LINE_ITEMS = [
  {
    id: "nights",
    label: "# of nights & breakfasts",
    unitPriceDollars: 300,
    defaultCount: 14,
    inputId: "calculator-count-nights",
    ariaLabel: "Number of nights and breakfasts, count",
  },
  {
    id: "dinners",
    label: "# of dinners",
    unitPriceDollars: 15,
    defaultCount: 10,
    inputId: "calculator-count-dinners",
    ariaLabel: "Number of dinners, count",
  },
  {
    id: "hikes",
    label: "# of hike tours",
    unitPriceDollars: 250,
    defaultCount: 4,
    inputId: "calculator-count-hikes",
    ariaLabel: "Number of hike tours, count",
  },
  {
    id: "pickleball",
    label: "# of pickleball events",
    unitPriceDollars: 200,
    defaultCount: 2,
    inputId: "calculator-count-pickleball",
    ariaLabel: "Number of pickleball events, count",
  },
];

export const INITIAL_COUNTS = Object.fromEntries(
  LINE_ITEMS.map((item) => [item.id, item.defaultCount]),
);

export const ESTIMATE_DISCLAIMER =
  "These are rough estimates. Can't make it due to weather or an injury? We're flexible.";

/**
 * @param {typeof LINE_ITEMS} lineItems
 * @param {Record<string, number>} countsByLineId
 */
export function buildCalculatorEstimate(lineItems, countsByLineId) {
  const lineRows = lineItems.map((item) => {
    const count = countsByLineId[item.id] ?? 0;
    const lineTotalDollars = count * item.unitPriceDollars;
    return {
      ...item,
      count,
      lineTotalDollars,
    };
  });

  const grandTotalDollars = lineRows.reduce(
    (sum, row) => sum + row.lineTotalDollars,
    0,
  );

  return { lineRows, grandTotalDollars };
}

/**
 * @param {Record<string, number>} previousCounts
 * @param {string} lineId
 * @param {string} rawValue
 * @returns {Record<string, number>}
 */
export function applyCountChange(previousCounts, lineId, rawValue) {
  if (rawValue === "") {
    return { ...previousCounts, [lineId]: 0 };
  }
  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed)) {
    return previousCounts;
  }
  return { ...previousCounts, [lineId]: Math.max(0, parsed) };
}

/**
 * @param {unknown} raw
 * @returns {number}
 */
function parseJpyPerOneCadRate(raw) {
  const parsed =
    typeof raw === "number" ? raw : Number.parseFloat(String(raw ?? ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("No usable CAD→JPY rate in payload");
  }
  return parsed;
}

/**
 * @param {AbortSignal} [signal]
 * @returns {Promise<number>}
 */
async function fetchJpyPerOneCadFromFrankfurter(signal) {
  const response = await fetch(FRANKFURTER_CAD_TO_JPY_URL, { signal });
  if (!response.ok) {
    throw new Error(`Frankfurter HTTP ${response.status}`);
  }
  const payload = await response.json();
  return parseJpyPerOneCadRate(payload?.rates?.JPY);
}

/**
 * @param {AbortSignal} [signal]
 * @returns {Promise<number>}
 */
async function fetchJpyPerOneCadFromOpenErApi(signal) {
  const response = await fetch(OPEN_ER_API_CAD_LATEST_URL, { signal });
  if (!response.ok) {
    throw new Error(`open.er-api HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload?.result === "error") {
    throw new Error("open.er-api returned error");
  }
  if (payload?.base_code != null && payload.base_code !== "CAD") {
    throw new Error("open.er-api base was not CAD");
  }
  return parseJpyPerOneCadRate(payload?.rates?.JPY);
}

/**
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ jpyPerOneCad: number; source: 'frankfurter' | 'open-er-api' }>}
 */
export async function fetchJpyPerOneCadFromProviders(signal) {
  try {
    const jpyPerOneCad = await fetchJpyPerOneCadFromFrankfurter(signal);
    return { jpyPerOneCad, source: "frankfurter" };
  } catch {
    /* try secondary provider */
  }
  const jpyPerOneCad = await fetchJpyPerOneCadFromOpenErApi(signal);
  return { jpyPerOneCad, source: "open-er-api" };
}

/**
 * @param {number} amountCad
 * @param {'CAD' | 'JPY'} displayCurrency
 * @param {number} jpyPerOneCad
 */
export function formatDisplayedMoney(amountCad, displayCurrency, jpyPerOneCad) {
  if (displayCurrency === "CAD") {
    return cadFormatter.format(amountCad);
  }
  const yenAmount = Math.round(amountCad * jpyPerOneCad);
  return jpyFormatter.format(yenAmount);
}
