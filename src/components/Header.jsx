import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const primaryNavigationLinks = [
  { label: "Pricing", fragmentId: "calculator" },
  { label: "The Stay", fragmentId: "where-we-are" },
  { label: "Our Story", fragmentId: "who-we-are" },
  { label: "Activities", fragmentId: "what-we-offer" },
  { label: "Contact & Bookings", fragmentId: "contact" },
];

function scrollSectionIntoViewportCenter(fragmentId) {
  const sectionElement = document.getElementById(fragmentId);
  if (!sectionElement) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  sectionElement.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "center",
    inline: "nearest",
  });

  window.history.pushState(null, "", `#${fragmentId}`);
}

const contactSectionFragmentId = "contact";

const headerContactCallToActionClassName =
  "hidden shrink-0 rounded-md border border-[var(--color-brand-border)] bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[var(--color-brand-foreground)] shadow-sm transition hover:bg-[var(--color-brand-hover)] active:bg-[var(--color-brand-active)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] lg:inline-flex lg:items-center lg:justify-center";

const desktopNavLinkClassName =
  "text-[var(--text-muted)] no-underline transition hover:text-[var(--color-brand)] focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]";

const mobileDrawerNavLinkClassName =
  "block w-full border-b border-[var(--border)] py-3.5 text-base font-medium text-[var(--text)] no-underline transition last:border-b-0 hover:text-[var(--color-brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]";

function HamburgerMenuIcon() {
  return (
    <svg
      aria-hidden
      width={24}
      height={24}
      viewBox="0 0 24 24"
      className="block text-[var(--text-heading)]"
    >
      <path
        fill="currentColor"
        d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"
      />
    </svg>
  );
}

function CloseMenuIcon() {
  return (
    <svg
      aria-hidden
      width={24}
      height={24}
      viewBox="0 0 24 24"
      className="block text-[var(--text-heading)]"
    >
      <path
        fill="currentColor"
        d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    </svg>
  );
}

export default function Header() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const mobileNavPanelId = useId();
  const mobileNavTitleId = useId();
  const restoreMenuToggleFocusAfterCloseRef = useRef(false);
  const mobileMenuToggleRef = useRef(null);
  const mobileDrawerCloseRef = useRef(null);

  const dismissMobileNavKeepingFocusElsewhere = useCallback(() => {
    restoreMenuToggleFocusAfterCloseRef.current = false;
    setIsMobileNavOpen(false);
  }, []);

  const dismissMobileNavRestoringToggleFocus = useCallback(() => {
    restoreMenuToggleFocusAfterCloseRef.current = true;
    setIsMobileNavOpen(false);
  }, []);

  useEffect(() => {
    if (!isMobileNavOpen) return;

    const panelElement = document.getElementById(mobileNavPanelId);
    const tabbableSelector =
      "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])";

    function collectTabbableElementsInPanel() {
      if (!panelElement) return [];
      return Array.from(
        panelElement.querySelectorAll(tabbableSelector),
      ).filter((element) => element.getClientRects().length > 0);
    }

    function handleDocumentKeyDown(keyboardEvent) {
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        dismissMobileNavRestoringToggleFocus();
        return;
      }

      if (keyboardEvent.key !== "Tab" || !panelElement) return;

      const tabbableElements = collectTabbableElementsInPanel();
      if (tabbableElements.length === 0) return;

      const firstTabbableElement = tabbableElements[0];
      const lastTabbableElement = tabbableElements[tabbableElements.length - 1];
      const activeElement = document.activeElement;

      if (keyboardEvent.shiftKey) {
        if (activeElement === firstTabbableElement) {
          keyboardEvent.preventDefault();
          lastTabbableElement.focus();
        }
      } else if (activeElement === lastTabbableElement) {
        keyboardEvent.preventDefault();
        firstTabbableElement.focus();
      }
    }

    document.addEventListener("keydown", handleDocumentKeyDown);
    return () =>
      document.removeEventListener("keydown", handleDocumentKeyDown);
  }, [
    isMobileNavOpen,
    mobileNavPanelId,
    dismissMobileNavRestoringToggleFocus,
  ]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (!isMobileNavOpen) {
      if (restoreMenuToggleFocusAfterCloseRef.current) {
        restoreMenuToggleFocusAfterCloseRef.current = false;
        mobileMenuToggleRef.current?.focus();
      }
      return;
    }
    mobileDrawerCloseRef.current?.focus();
  }, [isMobileNavOpen]);

  function handleMobileDrawerNavClick(clickEvent, fragmentId) {
    clickEvent.preventDefault();
    scrollSectionIntoViewportCenter(fragmentId);
    dismissMobileNavKeepingFocusElsewhere();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/95 px-4 py-3 backdrop-blur-sm md:px-6">
      <div className="flex w-full items-center justify-between gap-4 text-left">
        <div className="flex min-w-0 flex-1 items-center gap-x-6 gap-y-2">
          <a
            style={{ fontFamily: "var(--heading)" }}
            className="text-xl font-semibold tracking-tight text-[var(--text-heading)] no-underline transition hover:text-[var(--color-brand)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
            href="#"
          >
            MINPAKU
          </a>
          <nav
            aria-label="Primary"
            className="hidden flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium md:text-base lg:flex"
          >
            {primaryNavigationLinks.map(({ label, fragmentId }) => (
              <a
                key={fragmentId}
                className={desktopNavLinkClassName}
                href={`#${fragmentId}`}
                onClick={(clickEvent) => {
                  clickEvent.preventDefault();
                  scrollSectionIntoViewportCenter(fragmentId);
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            ref={mobileMenuToggleRef}
            type="button"
            className="inline-flex rounded-md p-2 text-[var(--text-heading)] transition hover:bg-[var(--bg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] lg:hidden"
            aria-expanded={isMobileNavOpen}
            aria-controls={mobileNavPanelId}
            onClick={() =>
              setIsMobileNavOpen((previousOpen) => !previousOpen)
            }
          >
            {isMobileNavOpen ? <CloseMenuIcon /> : <HamburgerMenuIcon />}
            <span className="sr-only">
              {isMobileNavOpen ? "Close menu" : "Open menu"}
            </span>
          </button>
          <button
            type="button"
            className={headerContactCallToActionClassName}
            aria-controls={contactSectionFragmentId}
            onClick={() =>
              scrollSectionIntoViewportCenter(contactSectionFragmentId)
            }
          >
            Book Now
          </button>
        </div>
      </div>

      {isMobileNavOpen
        ? createPortal(
            <div className="lg:hidden">
              <div
                className="fixed inset-0 z-[100] bg-black/50"
                aria-hidden="true"
                onClick={dismissMobileNavRestoringToggleFocus}
              />
              <div
                id={mobileNavPanelId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={mobileNavTitleId}
                className="fixed inset-y-0 right-0 z-[110] flex w-[min(20rem,calc(100vw-1rem))] max-w-full flex-col border-l border-[var(--border)] bg-[var(--bg)] shadow-xl"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
                  <p
                    id={mobileNavTitleId}
                    className="text-lg font-semibold text-[var(--text-heading)]"
                  >
                    Menu
                  </p>
                  <button
                    ref={mobileDrawerCloseRef}
                    type="button"
                    className="inline-flex rounded-md p-2 text-[var(--text-heading)] transition hover:bg-[var(--bg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
                    aria-label="Close menu"
                    onClick={dismissMobileNavRestoringToggleFocus}
                  >
                    <CloseMenuIcon />
                  </button>
                </div>
                <nav
                  className="flex flex-col overflow-y-auto px-4 pb-6 pt-2"
                  aria-label="Primary"
                >
                  {primaryNavigationLinks.map(({ label, fragmentId }) => (
                    <a
                      key={fragmentId}
                      className={mobileDrawerNavLinkClassName}
                      href={`#${fragmentId}`}
                      onClick={(clickEvent) =>
                        handleMobileDrawerNavClick(clickEvent, fragmentId)
                      }
                    >
                      {label}
                    </a>
                  ))}
                </nav>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
