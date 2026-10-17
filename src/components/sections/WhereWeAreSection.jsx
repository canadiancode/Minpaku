import { useEffect, useRef } from "react";
import { TOUR_STOPS } from "../where3d/tour.js";

const CARD_FADE = 0.03;
const VEIL_COLOR = "#f7fcfe";

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smoothstep = (edge0, edge1, value) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

function cardOpacity(stopIndex, progress) {
  const [holdStart, holdEnd] = TOUR_STOPS[stopIndex].hold;
  const fadeIn = smoothstep(holdStart - CARD_FADE, holdStart, progress);
  const isLast = stopIndex === TOUR_STOPS.length - 1;
  const fadeOut = isLast ? 1 : 1 - smoothstep(holdEnd, holdEnd + CARD_FADE, progress);
  return fadeIn * fadeOut;
}

/** Puffy cloud bank that overlaps the hero's bottom edge and fades into the veil. */
function CloudBank() {
  const backPuffs = [
    [60, 120, 70], [180, 100, 80], [320, 115, 75], [450, 95, 85], [590, 110, 80], [730, 98, 86],
    [870, 112, 78], [1000, 100, 84], [1140, 115, 76],
  ];
  const frontPuffs = [
    [0, 150, 70], [110, 140, 62], [230, 150, 72], [360, 135, 66], [490, 150, 74], [620, 138, 64],
    [750, 150, 72], [880, 136, 66], [1010, 150, 72], [1130, 140, 64], [1220, 150, 70],
  ];
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 -top-14 z-10 h-28 w-full md:-top-20 md:h-40"
      viewBox="0 0 1200 220"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {backPuffs.map(([cx, cy, r]) => (
        <circle key={`back-${cx}`} cx={cx} cy={cy} r={r} fill="#e4f4fb" />
      ))}
      {frontPuffs.map(([cx, cy, r]) => (
        <circle key={`front-${cx}`} cx={cx} cy={cy} r={r} fill={VEIL_COLOR} />
      ))}
      <rect x="0" y="160" width="1200" height="60" fill={VEIL_COLOR} />
    </svg>
  );
}

function TourCard({ stop, index, cardRef }) {
  const isFirst = index === 0;
  const HeadingTag = isFirst ? "h2" : "h3";
  return (
    <article
      ref={cardRef}
      className="pointer-events-none absolute inset-x-4 bottom-4 rounded-3xl bg-white/90 p-5 text-left opacity-0 shadow-[0_18px_40px_-18px_rgba(30,60,90,0.45)] ring-1 ring-white backdrop-blur-md will-change-transform md:inset-x-auto md:bottom-auto md:left-8 md:top-1/2 md:w-[min(24rem,38%)] md:-translate-y-1/2 md:p-7"
    >
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
        {stop.eyebrow}
      </p>
      <HeadingTag
        id={isFirst ? "where-we-are-heading" : undefined}
        className="mb-2 mt-0 font-[family-name:var(--heading)] text-[22px] font-medium leading-[1.15] text-[var(--text-heading)] md:text-[28px]"
      >
        {stop.title}
      </HeadingTag>
      {stop.body && <p className="text-[15px] leading-relaxed text-[var(--text-muted)] md:text-base">{stop.body}</p>}
      {stop.sights && (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
          {stop.sights.map((sight) => (
            <li
              key={sight}
              className="rounded-full bg-[var(--color-brand-subtle)] px-2.5 py-1 text-[13px] font-semibold text-[var(--color-brand-hover)]"
            >
              {sight}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function WhereWeAreSection() {
  const sectionRef = useRef(null);
  const sceneContainerRef = useRef(null);
  const veilRef = useRef(null);
  const progressRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let tourScene = null;
    let isUnmounted = false;
    let frameId = 0;

    const apply = () => {
      frameId = 0;
      const rect = section.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress = scrollable > 0 ? clamp01(-rect.top / scrollable) : 0;
      // 0 when the section top meets the bottom of the viewport, 1 once it reaches the top.
      const entry = clamp01(1 - rect.top / window.innerHeight);
      tourScene?.setProgress(progress, smoothstep(0.15, 0.95, entry));
      if (veilRef.current) veilRef.current.style.opacity = String(1 - smoothstep(0.1, 0.55, entry));
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const opacity = cardOpacity(index, progress) * (index === 0 ? smoothstep(0.7, 1, entry) : 1);
        card.style.opacity = String(opacity);
        card.style.transform = `translateY(${(1 - opacity) * 14}px)`;
        card.style.visibility = opacity > 0.01 ? "visible" : "hidden";
      });
    };

    const requestApply = () => {
      if (!frameId) frameId = requestAnimationFrame(apply);
    };

    import("../where3d/createLowerMainlandScene.js").then(({ createLowerMainlandScene }) => {
      if (isUnmounted || !sceneContainerRef.current) return;
      tourScene = createLowerMainlandScene(sceneContainerRef.current);
      apply();
    });

    apply();
    window.addEventListener("scroll", requestApply, { passive: true });
    window.addEventListener("resize", requestApply, { passive: true });
    return () => {
      isUnmounted = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestApply);
      window.removeEventListener("resize", requestApply);
      tourScene?.dispose();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="where-we-are"
      aria-labelledby="where-we-are-heading"
      data-scroll-anchor-progress="0.05"
      className="relative h-[500svh] border-b border-[var(--border)]"
    >
      <CloudBank />
      <div className="sticky top-0 h-svh overflow-hidden bg-[linear-gradient(180deg,#8fd4f5_0%,#e9f8fc_62%)]">
        <div ref={sceneContainerRef} className="absolute inset-0" aria-hidden="true" />
        <div ref={veilRef} className="pointer-events-none absolute inset-0" style={{ background: VEIL_COLOR }} aria-hidden="true" />
        {TOUR_STOPS.map((stop, index) => (
          <TourCard
            key={stop.id}
            stop={stop}
            index={index}
            cardRef={(element) => {
              cardRefs.current[index] = element;
            }}
          />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-white/40" aria-hidden="true">
          <div ref={progressRef} className="h-full origin-left bg-[var(--color-brand)]" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </section>
  );
}
