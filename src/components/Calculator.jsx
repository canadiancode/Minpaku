import { useEffect, useMemo, useState } from "react";
import {
  INITIAL_COUNTS,
  ESTIMATE_DISCLAIMER,
  LINE_ITEMS,
  MANUAL_FALLBACK_JPY_PER_ONE_CAD,
  applyCountChange,
  buildCalculatorEstimate,
  cadFormatter,
  fetchJpyPerOneCadFromProviders,
  formatDisplayedMoney,
} from "../lib/calculator";

const countInputClassName =
  "w-full min-w-[2.75rem] max-w-[4rem] rounded-md border border-[var(--border-strong)] bg-[var(--bg)] px-2 py-2 text-center text-sm font-medium tabular-nums text-[var(--text)] shadow-sm transition " +
  "md:min-w-[4.25rem] md:max-w-[6rem] md:rounded-lg md:px-3 md:py-2.5 md:text-base " +
  "placeholder:text-[var(--text-muted)] " +
  "hover:border-[var(--color-brand-border)] " +
  "focus:border-[var(--color-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/25";

const currencyToggleButtonClass =
  "min-w-[3.25rem] rounded-md px-3 py-1.5 text-xs font-semibold tabular-nums transition md:min-w-[3.5rem] md:px-3.5 md:py-2 md:text-sm";

const currencyToggleButtonInactiveClass =
  "border border-transparent bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]";

const currencyToggleButtonActiveClass =
  "border border-[var(--color-brand-border)] bg-[var(--color-brand)] text-[var(--color-brand-foreground)] shadow-sm";

export default function Calculator() {
  const [countsByLineId, setCountsByLineId] = useState(INITIAL_COUNTS);
  const [displayCurrency, setDisplayCurrency] = useState(
    /** @type {'CAD' | 'JPY'} */ ("CAD"),
  );
  const [exchangeRate, setExchangeRate] = useState(
    /** @type {{ status: 'loading' } | { status: 'ready'; jpyPerOneCad: number; source: 'frankfurter' | 'open-er-api' | 'manual' }} */ ({
      status: "loading",
    }),
  );

  // fetch the exchange rate
  useEffect(() => {
    const abortController = new AbortController();

    (async () => {
      try {
        const { jpyPerOneCad, source } = await fetchJpyPerOneCadFromProviders(
          abortController.signal,
        );
        if (abortController.signal.aborted) return;
        setExchangeRate({
          status: "ready",
          jpyPerOneCad,
          source,
        });
      } catch {
        if (abortController.signal.aborted) return;
        setExchangeRate({
          status: "ready",
          jpyPerOneCad: MANUAL_FALLBACK_JPY_PER_ONE_CAD,
          source: "manual",
        });
      }
    })();

    return () => abortController.abort();
  }, []);

  const jpyPerOneCad =
    exchangeRate.status === "ready" ? exchangeRate.jpyPerOneCad : null;
  const rateIsReady = jpyPerOneCad != null;
  const rateSource =
    exchangeRate.status === "ready" ? exchangeRate.source : null;

  useEffect(() => {
    if (!rateIsReady && displayCurrency === "JPY") {
      setDisplayCurrency("CAD");
    }
  }, [rateIsReady, displayCurrency]);

  const { lineRows, grandTotalDollars } = useMemo(
    () => buildCalculatorEstimate(LINE_ITEMS, countsByLineId),
    [countsByLineId],
  );

  function handleCountChange(lineId, rawValue) {
    setCountsByLineId((previous) =>
      applyCountChange(previous, lineId, rawValue),
    );
  }

  function handleCurrencyChange(nextCurrency) {
    if (nextCurrency === "JPY" && !rateIsReady) return;
    setDisplayCurrency(nextCurrency);
  }

  return (
    <div className="calculator-root w-full max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto md:overflow-x-visible">
          <table className="w-full min-w-0 border-collapse text-left text-xs md:min-w-[36rem] md:text-[0.9375rem]">
            <caption className="border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3 text-left md:px-6 md:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="text-sm font-semibold tracking-tight text-[var(--text-heading)] md:text-lg">
                  Cost estimate
                </span>
                <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                  <div
                    className="flex flex-wrap items-center gap-2 sm:justify-end"
                    role="group"
                    aria-label="Switch estimate currency"
                  >
                    <span className="text-[0.6875rem] font-semibold uppercase tracking-wide text-[var(--text-muted)] md:text-xs">
                      Currency
                    </span>
                    <div className="inline-flex rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] p-0.5 shadow-sm">
                      <button
                        type="button"
                        className={`${currencyToggleButtonClass} ${displayCurrency === "CAD" ? currencyToggleButtonActiveClass : currencyToggleButtonInactiveClass}`}
                        aria-pressed={displayCurrency === "CAD"}
                        onClick={() => handleCurrencyChange("CAD")}
                      >
                        CAD
                      </button>
                      <button
                        type="button"
                        className={`${currencyToggleButtonClass} ${displayCurrency === "JPY" ? currencyToggleButtonActiveClass : currencyToggleButtonInactiveClass} disabled:cursor-not-allowed disabled:opacity-50`}
                        aria-pressed={displayCurrency === "JPY"}
                        disabled={!rateIsReady}
                        onClick={() => handleCurrencyChange("JPY")}
                        title={
                          !rateIsReady
                            ? "Loading exchange rate…"
                            : "Show amounts in Japanese yen"
                        }
                      >
                        JPY
                      </button>
                    </div>
                  </div>
                  {exchangeRate.status === "loading" ? (
                    <p className="text-[0.625rem] text-[var(--text-muted)] md:text-xs">
                      Loading CAD→JPY rate…
                    </p>
                  ) : null}
                  {rateIsReady && displayCurrency === "JPY" ? (
                    <p className="max-w-[20rem] text-[0.625rem] leading-snug text-[var(--text-muted)] md:text-xs">
                      1 CAD ≈ {jpyPerOneCad.toFixed(2)} JPY
                      {rateSource === "frankfurter"
                        ? " (ECB via Frankfurter)"
                        : rateSource === "open-er-api"
                          ? " (open.er-api.com)"
                          : " (backup rate — APIs unavailable; edit MANUAL_FALLBACK_JPY_PER_ONE_CAD in src/lib/calculator.js)"}
                    </p>
                  ) : null}
                </div>
              </div>
            </caption>
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-muted)]/80">
                <th
                  scope="col"
                  className="px-2.5 py-3 pl-4 text-[0.625rem] font-semibold uppercase leading-tight tracking-wider text-[var(--text-muted)] md:px-5 md:pl-6 md:py-3.5 md:text-xs"
                >
                  Service
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 text-center text-[0.625rem] font-semibold uppercase leading-tight tracking-wider text-[var(--text-muted)] md:px-5 md:py-3.5 md:text-xs"
                >
                  Count
                </th>
                <th
                  scope="col"
                  className="hidden px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] md:table-cell md:px-5"
                >
                  Price per count
                </th>
                <th
                  scope="col"
                  className="px-2.5 py-3 pr-4 text-right text-[0.625rem] font-semibold uppercase leading-tight tracking-wider text-[var(--text-muted)] md:px-5 md:py-3.5 md:pr-6 md:text-xs"
                >
                  <span className="md:hidden">Line total</span>
                  <span className="hidden md:inline">Total line price</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {lineRows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-[var(--bg-muted)]/40"
                >
                  <th
                    scope="row"
                    className="max-w-[7.5rem] px-2.5 py-3 pl-4 text-[0.8125rem] font-medium leading-snug text-[var(--text)] md:max-w-xs md:px-5 md:pl-6 md:py-5 md:text-[0.9375rem]"
                  >
                    {row.label}
                  </th>
                  <td className="w-px whitespace-nowrap px-2 py-3 align-middle md:w-auto md:px-5 md:py-5">
                    <div className="flex justify-center">
                      <input
                        id={row.inputId}
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={row.count}
                        onChange={(event) =>
                          handleCountChange(row.id, event.target.value)
                        }
                        aria-label={row.ariaLabel}
                        className={countInputClassName}
                      />
                    </div>
                  </td>
                  <td className="hidden px-4 py-4 text-right align-middle tabular-nums text-[var(--text-muted)] md:table-cell md:px-5 md:py-5">
                    {rateIsReady
                      ? formatDisplayedMoney(
                          row.unitPriceDollars,
                          displayCurrency,
                          jpyPerOneCad,
                        )
                      : cadFormatter.format(row.unitPriceDollars)}
                  </td>
                  <td className="px-2.5 py-3 pr-4 text-right align-middle text-[0.8125rem] font-medium tabular-nums text-[var(--text)] md:px-5 md:py-5 md:pr-6 md:text-[0.9375rem]">
                    {rateIsReady
                      ? formatDisplayedMoney(
                          row.lineTotalDollars,
                          displayCurrency,
                          jpyPerOneCad,
                        )
                      : cadFormatter.format(row.lineTotalDollars)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--color-brand-border)] bg-[var(--color-brand-subtle)]">
                <th
                  scope="row"
                  className="px-2.5 py-3 pl-4 text-left text-sm font-semibold text-[var(--text-heading)] md:px-5 md:pl-6 md:py-5 md:text-base"
                >
                  Total
                </th>
                <td
                  colSpan={2}
                  className="hidden px-4 py-4 align-middle text-center text-sm leading-relaxed text-[var(--text-muted)] md:table-cell md:px-5 md:py-5"
                >
                  <p className="mx-auto max-w-md">{ESTIMATE_DISCLAIMER}</p>
                </td>
                <td className="w-px px-2 py-3 md:hidden" aria-hidden="true" />
                <td className="px-2.5 py-3 pr-4 text-right align-middle text-base font-bold tabular-nums text-[var(--color-brand)] md:px-5 md:py-5 md:pr-6 md:text-xl">
                  {rateIsReady
                    ? formatDisplayedMoney(
                        grandTotalDollars,
                        displayCurrency,
                        jpyPerOneCad,
                      )
                    : cadFormatter.format(grandTotalDollars)}
                </td>
              </tr>
              <tr className="border-t border-[var(--color-brand-border)]/70 bg-[var(--color-brand-subtle)] md:hidden">
                <td
                  colSpan={3}
                  className="px-4 pb-4 pt-2 text-center text-xs leading-relaxed text-[var(--text-muted)]"
                >
                  <p className="mx-auto max-w-[18rem]">{ESTIMATE_DISCLAIMER}</p>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
