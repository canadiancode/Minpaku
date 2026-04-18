import { useCallback, useLayoutEffect, useRef } from "react";
import japanToCanadaFarSvgRaw from "../../assets/japan-to-canada-far.svg?raw";

const routePathMatch = japanToCanadaFarSvgRaw.match(/\bd="([^"]+)"/);
const routePathD = routePathMatch ? routePathMatch[1] : "";

const routeSvgDecorativeLayerClassName =
  "pointer-events-none absolute inset-0 z-0 lg:inset-y-0 lg:left-1/2 lg:right-0";

export default function HeroSection() {
  const sectionRef = useRef(null);
  const pathRef = useRef(null);
  const pathLengthRef = useRef(0);
  const scrollFrameRef = useRef(0);
  const baselineWindowScrollYRef = useRef(0);

  const applyStrokeProgressFromScroll = useCallback(() => {
    const sectionElement = sectionRef.current;
    const pathElement = pathRef.current;
    if (!sectionElement || !pathElement) return;

    const pathLength = pathLengthRef.current;
    if (pathLength <= 0) return;

    const heroHeightPx = sectionElement.offsetHeight;
    const scrollCompletionRangePx = Math.max(1, heroHeightPx * 0.25);
    const scrollDeltaSinceBaseline = Math.max(
      0,
      window.scrollY - baselineWindowScrollYRef.current,
    );
    const scrollCompletionRatio = Math.min(
      1,
      scrollDeltaSinceBaseline / scrollCompletionRangePx,
    );

    pathElement.style.strokeDashoffset = String(
      pathLength * (1 - scrollCompletionRatio),
    );
  }, []);

  useLayoutEffect(() => {
    const pathElement = pathRef.current;
    if (!pathElement) return;

    const pathLength = pathElement.getTotalLength();
    pathLengthRef.current = pathLength;
    pathElement.style.strokeDasharray = String(pathLength);
    pathElement.style.strokeDashoffset = String(pathLength);

    baselineWindowScrollYRef.current = window.scrollY;

    const runScrollSync = () => {
      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = 0;
        applyStrokeProgressFromScroll();
      });
    };

    applyStrokeProgressFromScroll();

    window.addEventListener("scroll", runScrollSync, { passive: true });
    window.addEventListener("resize", runScrollSync, { passive: true });

    return () => {
      window.removeEventListener("scroll", runScrollSync);
      window.removeEventListener("resize", runScrollSync);
      if (scrollFrameRef.current) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = 0;
      }
    };
  }, [applyStrokeProgressFromScroll]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-labelledby="hero-heading"
      className="relative overflow-hidden scroll-mt-20 border-b border-[var(--border)] bg-[var(--bg-muted)] px-4 py-10 text-center md:px-6 md:py-14 md:text-left"
    >
      <div className={routeSvgDecorativeLayerClassName} aria-hidden="true">
        <svg
          className="h-full w-full"
          viewBox="0 0 3946 2407"
          fill="none"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            ref={pathRef}
            d={routePathD}
            fill="none"
            stroke="var(--color-brand)"
            strokeWidth="15"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col md:mx-0 md:max-w-2xl md:items-start">
        <h1
          id="hero-heading"
          className="mb-3 mt-0 text-2xl font-medium leading-[118%] tracking-[-0.24px] text-[var(--text-heading)] text-balance md:text-3xl"
        >
          Canada is easier when someone's waiting for you.
        </h1>
        <p className="max-w-2xl text-[var(--text-muted)]">
          A real Canadian home. Experience Canada the way Canadians do.
        </p>
      </div>
    </section>
  );
}
