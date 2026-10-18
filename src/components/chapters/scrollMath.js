export const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const smoothstep = (edge0, edge1, value) => {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const CARD_FADE = 0.03;

/** Card opacity for a stop: fades in just before its hold range and out just after. */
export function cardOpacity(stops, stopIndex, progress) {
  const [holdStart, holdEnd] = stops[stopIndex].hold;
  const fadeIn = holdStart <= 0 ? 1 : smoothstep(holdStart - CARD_FADE, holdStart, progress);
  const isLast = stopIndex === stops.length - 1;
  const fadeOut = isLast ? 1 : 1 - smoothstep(holdEnd, holdEnd + CARD_FADE, progress);
  return fadeIn * fadeOut;
}
