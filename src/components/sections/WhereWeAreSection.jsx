import { useCallback } from "react";
import { TOUR_STOPS } from "../where3d/tour.js";
import { useLocale } from "../../i18n/localeContext.js";
import ScrollChapter from "../chapters/ScrollChapter.jsx";
import { smoothstep } from "../chapters/scrollMath.js";

const loadTourView = (context) =>
  import("../where3d/createLowerMainlandView.js").then(({ createLowerMainlandView }) => createLowerMainlandView(context));

export default function WhereWeAreSection() {
  const { t, language } = useLocale();

  // `arrival` drives the camera's descent through the clouds as the section scrolls in.
  const applyProgress = useCallback((view, progress, entry) => {
    view.setProgress(progress, smoothstep(0.15, 0.95, entry));
  }, []);

  return (
    <ScrollChapter
      id="where-we-are"
      height="500svh"
      stops={TOUR_STOPS}
      copy={t.tour.stops}
      loadView={loadTourView}
      language={language}
      applyProgress={applyProgress}
      stickyClassName="bg-[linear-gradient(180deg,#8fd4f5_0%,#e9f8fc_62%)]"
    />
  );
}
