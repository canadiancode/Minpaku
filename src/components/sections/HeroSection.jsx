import { useEffect, useRef } from "react";

export default function HeroSection() {
  const sceneContainerRef = useRef(null);

  useEffect(() => {
    const sceneContainer = sceneContainerRef.current;
    if (!sceneContainer) return;

    let flightScene = null;
    let isUnmounted = false;

    // Load three.js on demand so the rest of the page isn't blocked by it.
    import("../hero3d/createFlightScene.js").then(({ createFlightScene }) => {
      if (isUnmounted) return;
      flightScene = createFlightScene(sceneContainer);
    });

    return () => {
      isUnmounted = true;
      flightScene?.dispose();
    };
  }, []);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative isolate h-[clamp(580px,88svh,820px)] overflow-hidden scroll-mt-20 border-b border-[var(--border)] bg-[linear-gradient(180deg,#8fd4f5_0%,#e9f8fc_62%)]"
    >
      <div ref={sceneContainerRef} className="absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-10 text-center md:mx-0 md:items-start md:px-10 md:pt-14 md:text-left">
        <p className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-sm font-semibold text-[var(--color-brand)] shadow-sm backdrop-blur-sm">
          Tokyo <span aria-hidden="true">✈</span> Vancouver
        </p>
        <h1
          id="hero-heading"
          className="mb-3 mt-4 text-balance leading-[1.08] text-[var(--text-heading)]"
        >
          Canada is easier when someone's waiting for you.
        </h1>
        <p className="max-w-xl text-[var(--text-muted)]">
          A real Canadian home. Experience Canada the way Canadians do.
        </p>
      </div>
    </section>
  );
}
