import { useCallback } from "react";
import { useLocale } from "../../i18n/localeContext.js";
import ScrollChapter from "../chapters/ScrollChapter.jsx";
import { STORY_STOPS } from "../story3d/storyStops.js";

const loadStoryView = (context) =>
  import("../story3d/createStoryView.js").then(({ createStoryView }) => createStoryView(context));

export default function OurStorySection() {
  const { t, language } = useLocale();
  const applyProgress = useCallback((view, progress) => view.setProgress(progress), []);

  return (
    <ScrollChapter
      id="our-story"
      height="460svh"
      anchorProgress={0.03}
      stops={STORY_STOPS}
      copy={t.story.stops}
      loadView={loadStoryView}
      language={language}
      applyProgress={applyProgress}
      stickyClassName="bg-[linear-gradient(180deg,#8fd4f5_0%,#e9f8fc_62%)]"
    />
  );
}
