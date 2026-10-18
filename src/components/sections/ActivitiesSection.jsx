import { useCallback } from "react";
import { useLocale } from "../../i18n/localeContext.js";
import { LINE_ITEMS, formatDisplayedMoney } from "../../lib/calculator";
import { useExchangeRate } from "../../lib/useExchangeRate.js";
import ScrollChapter from "../chapters/ScrollChapter.jsx";
import { ACTIVITY_STOPS } from "../activities3d/activityStops.js";

const loadActivitiesView = (context) =>
  import("../activities3d/createActivitiesView.js").then(({ createActivitiesView }) => createActivitiesView(context));

const UNIT_PRICES = Object.fromEntries(LINE_ITEMS.map((item) => [item.id, item.unitPriceDollars]));

export default function ActivitiesSection() {
  const { t, language, currency } = useLocale();
  const rate = useExchangeRate();
  const applyProgress = useCallback((view, progress) => view.setProgress(progress), []);

  const priceLabel = (lineId) => {
    const displayCurrency = currency === "JPY" && rate.status === "ready" ? "JPY" : "CAD";
    const amount = formatDisplayedMoney(UNIT_PRICES[lineId], displayCurrency, rate.jpyPerOneCad ?? 0);
    return { amount, unit: t.activities.perUnit[lineId] };
  };

  const renderCardExtras = (stop, copy) => {
    const lines = copy.priceLines ?? (copy.priceLine ? [copy.priceLine] : []);
    if (!lines.length && !copy.tag) return null;
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {lines.map((lineId) => {
          const { amount, unit } = priceLabel(lineId);
          return (
            <span key={lineId} className="chapter-price">
              {amount}
              <small>/ {unit}</small>
            </span>
          );
        })}
        {copy.tag ? <span className="chapter-price">{copy.tag}</span> : null}
      </div>
    );
  };

  return (
    <ScrollChapter
      id="activities"
      height="460svh"
      anchorProgress={0.03}
      stops={ACTIVITY_STOPS}
      copy={t.activities.stops}
      loadView={loadActivitiesView}
      language={language}
      applyProgress={applyProgress}
      renderCardExtras={renderCardExtras}
      stickyClassName="bg-[linear-gradient(180deg,#8fd4f5_0%,#e9f8fc_62%)]"
    />
  );
}
