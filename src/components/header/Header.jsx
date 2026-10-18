import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "../../i18n/localeContext.js";
import { CHAPTERS, readRoutePosition, scrollToChapter } from "./chapters.js";
import LanguageSwitch from "./LanguageSwitch.jsx";
import { MenuIcon, PlaneIcon } from "./icons.jsx";

function Brand({ tagline }) {
  return (
    <a
      href="#hero"
      className="brand"
      onClick={(event) => {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      <span className="brand-mark" aria-hidden="true">
        <PlaneIcon className="h-4 w-4" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="brand-word">MINPAKU</span>
        <span className="brand-tagline">{tagline}</span>
      </span>
    </a>
  );
}

/** Dotted flight route linking the chapters; the plane tracks scroll position. */
function RouteNav({ routeRef, activeChapter, chapters, labels }) {
  return (
    <nav aria-label="Chapters" className="route-nav" style={{ "--stops": chapters.length }}>
      <span className="route-line" aria-hidden="true" />
      <span ref={routeRef} className="route-plane" aria-hidden="true">
        <PlaneIcon className="h-4 w-4" />
      </span>
      {chapters.map((chapterId) => (
        <a
          key={chapterId}
          href={`#${chapterId}`}
          className="route-stop"
          aria-current={activeChapter === chapterId ? "true" : undefined}
          onClick={(event) => {
            event.preventDefault();
            scrollToChapter(chapterId);
          }}
        >
          <span className="route-dot" aria-hidden="true" />
          <span className="route-label">{labels[chapterId]}</span>
        </a>
      ))}
    </nav>
  );
}

function MobileMenu({ panelId, titleId, onClose, closeButtonRef, t, activeChapter }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const panel = panelRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose(true);
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = [...panel.querySelectorAll("a[href], button:not([disabled])")].filter(
        (element) => element.getClientRects().length > 0,
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, closeButtonRef]);

  return createPortal(
    <div className="mobile-menu" role="dialog" aria-modal="true" aria-labelledby={titleId} id={panelId} ref={panelRef}>
      <div className="mobile-menu-ticket">
        <div className="mobile-menu-head">
          <p id={titleId} className="mobile-menu-title">
            {t.nav.menu}
          </p>
          <button ref={closeButtonRef} type="button" className="icon-button" aria-label={t.nav.closeMenu} onClick={() => onClose(true)}>
            <MenuIcon isOpen />
          </button>
        </div>
        <div className="mobile-menu-route" aria-hidden="true">
          <span>{t.hero.badgeFrom}</span>
          <span className="mobile-menu-route-line">
            <PlaneIcon className="h-4 w-4" />
          </span>
          <span>{t.nav.brandTagline}</span>
        </div>
        <nav aria-label="Chapters" className="mobile-menu-list">
          {CHAPTERS.map((chapterId, index) => (
            <a
              key={chapterId}
              href={`#${chapterId}`}
              className="mobile-menu-item"
              aria-current={activeChapter === chapterId ? "true" : undefined}
              onClick={(event) => {
                event.preventDefault();
                onClose(false);
                scrollToChapter(chapterId);
              }}
            >
              <span className="mobile-menu-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="mobile-menu-label">{t.nav.chapters[chapterId]}</span>
              <span className="mobile-menu-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </nav>
        <div className="mobile-menu-foot">
          <LanguageSwitch className="w-full" />
          <p className="mobile-menu-note">{t.nav.menuFooter}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function Header() {
  const { t } = useLocale();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const routePlaneRef = useRef(null);
  const menuToggleRef = useRef(null);
  const closeButtonRef = useRef(null);
  const panelId = useId();
  const titleId = useId();

  useEffect(() => {
    let frameId = 0;
    const update = () => {
      frameId = 0;
      const position = readRoutePosition();
      const stops = CHAPTERS.length;
      // Plane sits on each stop's centre; before the first chapter it taxis in from the left.
      const along = position < 0 ? (0.5 / stops) * (1 + position) : (Math.min(position, stops - 1) + 0.5) / stops;
      routePlaneRef.current?.style.setProperty("--route", String(along));
      setActiveChapter(position < -0.35 ? null : CHAPTERS[Math.min(stops - 1, Math.round(Math.max(0, position)))]);
      setIsScrolled(window.scrollY > 24);
    };
    const request = () => {
      if (!frameId) frameId = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
    };
  }, []);

  const closeMenu = useCallback((restoreFocus) => {
    setIsMenuOpen(false);
    if (restoreFocus) requestAnimationFrame(() => menuToggleRef.current?.focus());
  }, []);

  return (
    <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="site-header-bar">
        <Brand tagline={t.nav.brandTagline} />
        <RouteNav routeRef={routePlaneRef} activeChapter={activeChapter} chapters={CHAPTERS} labels={t.nav.chapters} />
        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitch className="hidden md:inline-grid" />
          <LanguageSwitch compact className="md:hidden" />
          <button type="button" className="header-cta" onClick={() => scrollToChapter("contact")}>
            {t.nav.cta}
          </button>
          <button
            ref={menuToggleRef}
            type="button"
            className="icon-button lg:hidden"
            aria-expanded={isMenuOpen}
            aria-controls={panelId}
            aria-label={isMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <MenuIcon isOpen={isMenuOpen} />
          </button>
        </div>
      </div>
      {isMenuOpen ? (
        <MobileMenu
          panelId={panelId}
          titleId={titleId}
          onClose={closeMenu}
          closeButtonRef={closeButtonRef}
          t={t}
          activeChapter={activeChapter}
        />
      ) : null}
    </header>
  );
}
