import { useEffect, useRef } from "react";
import { registerStageView } from "../stage/stage.js";
import { cardOpacity, clamp01 } from "./scrollMath.js";
import ChapterCard from "./ChapterCard.jsx";
import CloudBank from "./CloudBank.jsx";

const VEIL_COLOR = "#f7fcfe";

/**
 * A scroll-driven 3D chapter: a tall section whose sticky viewport holds a
 * stage view, with one narrated card per stop. Scroll progress (0 → 1 across
 * the section) drives the view's camera via `applyProgress`.
 */
export default function ScrollChapter({
  id,
  height,
  stops,
  copy,
  loadView,
  priority = "idle",
  language,
  applyProgress,
  onScrollFrame,
  renderCardExtras,
  stickyClassName = "",
  overlays,
  anchorProgress = 0.05,
}) {
  const sectionRef = useRef(null);
  const sceneHostRef = useRef(null);
  const veilRef = useRef(null);
  const cardRefs = useRef([]);
  const viewRef = useRef(null);
  const callbacksRef = useRef({ applyProgress, onScrollFrame, loadView, language });

  useEffect(() => {
    callbacksRef.current = { applyProgress, onScrollFrame, loadView, language };
  });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frameId = 0;

    const apply = () => {
      frameId = 0;
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
      // 0 when the section top meets the bottom of the viewport, 1 once it reaches the top.
      const entry = clamp01(1 - rect.top / window.innerHeight);
      const { applyProgress: applyToView, onScrollFrame: onFrame } = callbacksRef.current;
      if (viewRef.current) applyToView?.(viewRef.current, progress, entry);
      onFrame?.({ progress, entry });
      // Entering from the clouds: the veil clears as the chapter scrolls into view.
      if (veilRef.current) veilRef.current.style.opacity = String(1 - Math.min(1, Math.max(0, (entry - 0.1) / 0.45)));
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const opacity = cardOpacity(stops, index, progress) * (index === 0 ? clamp01((entry - 0.6) / 0.4) : 1);
        card.style.opacity = String(opacity);
        card.style.transform = `translateY(${(1 - opacity) * 14}px)`;
        card.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      });
    };
    const requestApply = () => {
      if (!frameId) frameId = requestAnimationFrame(apply);
    };

    const registration = registerStageView(
      sceneHostRef.current,
      (context) => callbacksRef.current.loadView(context),
      { priority },
    );
    registration.ready.then((view) => {
      viewRef.current = view;
      view?.setLanguage?.(callbacksRef.current.language);
      apply();
    });

    apply();
    window.addEventListener("scroll", requestApply, { passive: true });
    window.addEventListener("resize", requestApply, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestApply);
      window.removeEventListener("resize", requestApply);
      registration.unregister();
      viewRef.current = null;
    };
  }, [stops, priority]);

  useEffect(() => {
    viewRef.current?.setLanguage?.(language);
  }, [language]);

  const headingId = `${id}-heading`;
  return (
    <section
      ref={sectionRef}
      id={id}
      aria-labelledby={headingId}
      data-scroll-anchor-progress={anchorProgress}
      className="chapter relative"
      style={{ height }}
    >
      <CloudBank color={VEIL_COLOR} />
      <div className={`sticky top-0 h-svh overflow-hidden ${stickyClassName}`}>
        <div ref={sceneHostRef} className="absolute inset-0" aria-hidden="true" />
        <div ref={veilRef} className="pointer-events-none absolute inset-0" style={{ background: VEIL_COLOR }} aria-hidden="true" />
        {overlays}
        {stops.map((stop, index) => {
          const stopCopy = copy[stop.id];
          return (
            <ChapterCard
              key={stop.id}
              cardRef={(element) => {
                cardRefs.current[index] = element;
              }}
              headingId={index === 0 ? headingId : undefined}
              headingLevel={index === 0 ? 2 : 3}
              eyebrow={stopCopy.eyebrow}
              title={stopCopy.title}
              body={stopCopy.body}
              chips={stopCopy.sights ?? stopCopy.rooms}
            >
              {renderCardExtras?.(stop, stopCopy)}
            </ChapterCard>
          );
        })}
      </div>
    </section>
  );
}
