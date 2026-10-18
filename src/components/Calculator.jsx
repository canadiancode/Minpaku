import { useMemo, useState } from "react";
import {
  INITIAL_COUNTS,
  LINE_ITEMS,
  applyCountChange,
  buildCalculatorEstimate,
  formatDisplayedMoney,
} from "../lib/calculator";
import { useExchangeRate } from "../lib/useExchangeRate.js";
import { useLocale } from "../i18n/localeContext.js";
import { PlaneIcon } from "./header/icons.jsx";
import { scrollToChapter } from "./header/chapters.js";
import { TRIP_SUMMARY_EVENT } from "../lib/tripSummary.js";

const LINE_ICONS = { nights: "🌙", dinners: "🍲", hikes: "🥾", pickleball: "🏓" };


export default function Calculator() {
  const { t, currency, setCurrency } = useLocale();
  const copy = t.pricing;
  const rate = useExchangeRate();
  const [countsByLineId, setCountsByLineId] = useState(INITIAL_COUNTS);

  const rateIsReady = rate.status === "ready";
  // Yen needs today's rate; until it arrives, show dollars.
  const displayCurrency = currency === "JPY" && rateIsReady ? "JPY" : "CAD";
  const money = (amountCad) => formatDisplayedMoney(amountCad, displayCurrency, rate.jpyPerOneCad ?? 0);

  const { lineRows, grandTotalDollars } = useMemo(
    () => buildCalculatorEstimate(LINE_ITEMS, countsByLineId),
    [countsByLineId],
  );

  const changeCount = (lineId, rawValue) => setCountsByLineId((previous) => applyCountChange(previous, lineId, rawValue));
  const step = (lineId, delta) => changeCount(lineId, String(Math.max(0, (countsByLineId[lineId] ?? 0) + delta)));

  function askAboutTrip() {
    const summary = lineRows
      .filter((row) => row.count > 0)
      .map((row) => `${copy.lines[row.id].label}: ${row.count}`)
      .join(" · ");
    window.dispatchEvent(new CustomEvent(TRIP_SUMMARY_EVENT, { detail: `${summary} — ${copy.total}: ${money(grandTotalDollars)}` }));
    scrollToChapter("contact");
  }

  return (
    <div className="trip-ticket">
      <div className="trip-ticket-head">
        <div>
          <p className="trip-ticket-title">{copy.ticketTitle}</p>
          <p className="trip-ticket-route">
            <span>{copy.ticketRoute}</span>
            <PlaneIcon className="h-4 w-4" />
          </p>
        </div>
        <div className="trip-currency" role="group" aria-label={copy.currencyLabel}>
          {["CAD", "JPY"].map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={displayCurrency === option}
              disabled={option === "JPY" && !rateIsReady}
              onClick={() => setCurrency(option)}
            >
              {option === "CAD" ? "$ CAD" : "¥ JPY"}
            </button>
          ))}
        </div>
      </div>

      <ul className="trip-lines">
        {lineRows.map((row) => {
          const lineCopy = copy.lines[row.id];
          return (
            <li key={row.id} className="trip-line">
              <span className="trip-line-icon" aria-hidden="true">
                {LINE_ICONS[row.id]}
              </span>
              <div className="trip-line-text">
                <label htmlFor={row.inputId} className="trip-line-label">
                  {lineCopy.label}
                </label>
                <p className="trip-line-detail">
                  {money(row.unitPriceDollars)} / {t.activities.perUnit[row.id]} · {lineCopy.detail}
                </p>
              </div>
              <div className="trip-stepper">
                <button type="button" aria-label={`${copy.decrease}: ${lineCopy.label}`} onClick={() => step(row.id, -1)} disabled={row.count === 0}>
                  −
                </button>
                <input
                  id={row.inputId}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={row.count}
                  onChange={(event) => changeCount(row.id, event.target.value)}
                />
                <button type="button" aria-label={`${copy.increase}: ${lineCopy.label}`} onClick={() => step(row.id, 1)}>
                  +
                </button>
              </div>
              <output className="trip-line-total" htmlFor={row.inputId}>
                {money(row.lineTotalDollars)}
              </output>
            </li>
          );
        })}
      </ul>

      <div className="trip-perforation" aria-hidden="true" />

      <div className="trip-total">
        <div>
          <p className="trip-total-label">{copy.total}</p>
          <p className="trip-rate" aria-live="polite">
            {rate.status === "loading"
              ? copy.rateLoading
              : displayCurrency === "JPY"
                ? copy.rateNote(rate.jpyPerOneCad.toFixed(2), copy.rateSources[rate.source])
                : null}
          </p>
        </div>
        <p className="trip-total-amount" aria-live="polite">
          {money(grandTotalDollars)}
        </p>
      </div>
      <p className="trip-disclaimer">{copy.disclaimer}</p>
      <button type="button" className="trip-cta" onClick={askAboutTrip}>
        {copy.cta} <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
