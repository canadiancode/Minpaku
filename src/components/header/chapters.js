/** Page chapters in scroll order; ids match the section elements. */
export const CHAPTERS = ["where-we-are", "our-story", "activities", "pricing", "contact"];

/**
 * Scrolls to a chapter. Scroll-driven chapters are taller than the viewport and
 * declare `data-scroll-anchor-progress` so the jump lands on their first stop.
 */
export function scrollToChapter(chapterId) {
  const section = document.getElementById(chapterId);
  if (!section) return;
  const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const anchorProgress = section.dataset.scrollAnchorProgress;
  const sectionTop = section.getBoundingClientRect().top + window.scrollY;

  if (anchorProgress !== undefined) {
    const scrollable = section.offsetHeight - window.innerHeight;
    window.scrollTo({ top: sectionTop + scrollable * Number(anchorProgress), behavior });
  } else {
    window.scrollTo({ top: sectionTop - 84, behavior });
  }
  window.history.replaceState(null, "", `#${chapterId}`);
}

/**
 * Where the reader is along the chapter route: a fractional index where
 * 0 = first chapter reached, CHAPTERS.length - 1 = last chapter reached.
 * Before the first chapter it is negative (down to -1 at the top of the page).
 */
export function readRoutePosition() {
  const probe = window.scrollY + window.innerHeight * 0.45;
  const tops = CHAPTERS.map((id) => {
    const element = document.getElementById(id);
    return element ? element.getBoundingClientRect().top + window.scrollY : Infinity;
  });
  if (probe < tops[0]) return -1 + Math.max(0, probe / Math.max(1, tops[0]));
  for (let index = tops.length - 1; index >= 0; index -= 1) {
    if (probe >= tops[index]) {
      const next = tops[index + 1];
      if (next === undefined || !Number.isFinite(next)) return index;
      return index + Math.min(1, (probe - tops[index]) / Math.max(1, next - tops[index]));
    }
  }
  return -1;
}
