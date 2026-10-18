import { useEffect, useRef } from "react";
import { registerStageView } from "../stage/stage.js";
import { useLocale } from "../../i18n/localeContext.js";

export default function HeroSection() {
  const { t, language } = useLocale();
  const sceneContainerRef = useRef(null);
  const viewRef = useRef(null);
  const languageRef = useRef(language);

  useEffect(() => {
    languageRef.current = language;
    viewRef.current?.setLanguage(language);
  }, [language]);

  useEffect(() => {
    const sceneContainer = sceneContainerRef.current;
    if (!sceneContainer) return;
    let frameId = 0;

    const applyExitProgress = () => {
      frameId = 0;
      const heroHeight = sceneContainer.offsetHeight || 1;
      viewRef.current?.setExitProgress(Math.min(1, Math.max(0, window.scrollY / heroHeight)));
    };
    const requestExitProgress = () => {
      if (!frameId) frameId = requestAnimationFrame(applyExitProgress);
    };

    // three.js and the scene load on demand, so the rest of the page isn't blocked by them.
    const flightModule = import("../hero3d/createFlightView.js");
    const registration = registerStageView(sceneContainer, (context) =>
      flightModule.then(({ createFlightView }) => createFlightView(context)),
    );
    registration.ready.then((view) => {
      viewRef.current = view;
      view?.setLanguage(languageRef.current);
      applyExitProgress();
    });
    window.addEventListener("scroll", requestExitProgress, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", requestExitProgress);
      registration.unregister();
      viewRef.current = null;
    };
  }, []);

  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="relative isolate h-[clamp(620px,92svh,860px)] overflow-hidden bg-[linear-gradient(180deg,#8fd4f5_0%,#e9f8fc_62%)]"
    >
      <div ref={sceneContainerRef} className="absolute inset-0 -z-10" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 pt-24 text-center md:mx-0 md:items-start md:px-10 md:pt-28 md:text-left">
        <p className="hero-badge">
          <span>{t.hero.badgeFrom}</span>
          <span className="hero-badge-route" aria-hidden="true">
            <span className="hero-badge-plane">✈</span>
          </span>
          <span>{t.hero.badgeTo}</span>
        </p>
        <h1 id="hero-heading" className="hero-copy-glow mb-3 mt-4 text-balance leading-[1.08] text-[var(--text-heading)]">
          {t.hero.headline}
        </h1>
        <p className="hero-copy-glow max-w-xl text-pretty font-semibold text-[var(--text-muted)]">{t.hero.body}</p>
      </div>
      <a className="hero-scroll-cue" href="#where-we-are">
        <span>{t.hero.scrollCue}</span>
        <span className="hero-scroll-cue-arrow" aria-hidden="true">
          ↓
        </span>
      </a>
    </section>
  );
}
