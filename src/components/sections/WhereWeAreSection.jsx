import { useCallback, useLayoutEffect, useRef } from "react";
import greaterVancouverCityNamesSvgSource from "../../assets/city-names.svg?raw";
import greaterVancouverMapSvgSource from "../../assets/gva-map.svg?raw";

const WHERE_WE_ARE_MAP_ARTBOARD_WIDTH = 2072;
const WHERE_WE_ARE_MAP_ARTBOARD_HEIGHT = 1096;

function extractSvgInnerMarkup(svgSource) {
  const trimmedSource = svgSource.replace(/^\uFEFF/, "").trim();
  const withoutXmlOrDoctype = trimmedSource
    .replace(/<\?xml[\s\S]*?\?>\s*/gi, "")
    .replace(/<!DOCTYPE[\s\S]*?>\s*/gi, "");
  const firstSvgIndex = withoutXmlOrDoctype.toLowerCase().indexOf("<svg");
  if (firstSvgIndex === -1) return "";
  const fromSvgTag = withoutXmlOrDoctype.slice(firstSvgIndex);
  const firstTagEnd = fromSvgTag.indexOf(">");
  const lastSvgClose = fromSvgTag.toLowerCase().lastIndexOf("</svg>");
  if (
    firstTagEnd === -1 ||
    lastSvgClose === -1 ||
    lastSvgClose <= firstTagEnd
  ) {
    return "";
  }
  return fromSvgTag.slice(firstTagEnd + 1, lastSvgClose).trim();
}

function readSvgViewBoxFromSource(svgSource) {
  const head = svgSource.slice(0, 800);
  const viewBoxMatch = head.match(/viewBox="([^"]+)"/i);
  if (viewBoxMatch) return viewBoxMatch[1];
  const widthMatch = head.match(/\bwidth="(\d+)"/i);
  const heightMatch = head.match(/\bheight="(\d+)"/i);
  if (widthMatch && heightMatch) {
    return `0 0 ${widthMatch[1]} ${heightMatch[1]}`;
  }
  return `0 0 ${WHERE_WE_ARE_MAP_ARTBOARD_WIDTH} ${WHERE_WE_ARE_MAP_ARTBOARD_HEIGHT}`;
}

const greaterVancouverMapSvgInnerMarkup = extractSvgInnerMarkup(
  greaterVancouverMapSvgSource,
);
const greaterVancouverCityNamesSvgInnerMarkup = extractSvgInnerMarkup(
  greaterVancouverCityNamesSvgSource,
);
const greaterVancouverMapViewBox = readSvgViewBoxFromSource(
  greaterVancouverMapSvgSource,
);
const greaterVancouverCityNamesViewBox = readSvgViewBoxFromSource(
  greaterVancouverCityNamesSvgSource,
);

const whereWeAreMapDecorativeLayerClassName =
  "pointer-events-none relative z-0 w-full shrink-0 md:static md:z-auto md:flex md:min-h-0 md:w-[min(46vw,28rem)] md:flex-shrink-0 md:flex-col";

/**
 * 0 until the section nears the viewport from below, then ramps to 1 as the
 * section moves upward through a viewport band (independent of hero scroll).
 */
function computeWhereWeAreMapStrokeRevealRatio(sectionElement) {
  const viewportHeightPx = window.innerHeight;
  if (viewportHeightPx <= 0) return 0;

  const sectionBoundingClientRect = sectionElement.getBoundingClientRect();
  const sectionTopRelativeToViewportPx = sectionBoundingClientRect.top;
  const revealBandStartViewportPx = viewportHeightPx * 0.88;
  const revealBandEndViewportPx = viewportHeightPx * 0.32;

  if (sectionTopRelativeToViewportPx >= revealBandStartViewportPx) return 0;
  if (sectionTopRelativeToViewportPx <= revealBandEndViewportPx) return 1;

  const revealBandSpanPx =
    revealBandStartViewportPx - revealBandEndViewportPx;
  return (
    (revealBandStartViewportPx - sectionTopRelativeToViewportPx) /
    revealBandSpanPx
  );
}

function GreaterVancouverMapStack({ mapOutlineSvgRef }) {
  return (
    <div className="relative aspect-[2072/1096] h-full min-h-[11rem] w-full flex-1 overflow-hidden bg-[var(--bg)] md:min-h-0">
      <svg
        ref={mapOutlineSvgRef}
        className="where-we-are-map-outline pointer-events-none absolute inset-0 h-full w-full"
        viewBox={greaterVancouverMapViewBox}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: greaterVancouverMapSvgInnerMarkup }}
      />
      <svg
        className="where-we-are-map-labels pointer-events-none absolute inset-0 h-full w-full"
        viewBox={greaterVancouverCityNamesViewBox}
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        dangerouslySetInnerHTML={{
          __html: greaterVancouverCityNamesSvgInnerMarkup,
        }}
      />
    </div>
  );
}

export default function WhereWeAreSection() {
  const sectionRef = useRef(null);
  const mapOutlineSvgRef = useRef(null);
  const outlinePathStrokesRef = useRef([]);
  const scrollFrameRef = useRef(0);

  const applyOutlineStrokeProgressFromScroll = useCallback(() => {
    const sectionElement = sectionRef.current;
    if (!sectionElement) return;

    const scrollCompletionRatio = Math.min(
      1,
      Math.max(0, computeWhereWeAreMapStrokeRevealRatio(sectionElement)),
    );

    for (const { pathElement, pathLengthPx } of outlinePathStrokesRef.current) {
      if (pathLengthPx <= 0) continue;
      pathElement.style.strokeDashoffset = String(
        pathLengthPx * (1 - scrollCompletionRatio),
      );
    }
  }, []);

  useLayoutEffect(() => {
    const outlineSvgElement = mapOutlineSvgRef.current;
    if (!outlineSvgElement) return;

    const pathNodeList = outlineSvgElement.querySelectorAll("path");
    const pathStrokeEntries = Array.from(pathNodeList).map((pathElement) => {
      const pathLengthPx = pathElement.getTotalLength();
      pathElement.style.strokeDasharray = String(pathLengthPx);
      pathElement.style.strokeDashoffset = String(pathLengthPx);
      return { pathElement, pathLengthPx };
    });
    outlinePathStrokesRef.current = pathStrokeEntries;

    const runScrollSync = () => {
      if (scrollFrameRef.current) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = 0;
        applyOutlineStrokeProgressFromScroll();
      });
    };

    applyOutlineStrokeProgressFromScroll();

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
  }, [applyOutlineStrokeProgressFromScroll]);

  return (
    <section
      ref={sectionRef}
      id="where-we-are"
      aria-labelledby="where-we-are-heading"
      className="relative flex scroll-mt-20 flex-col gap-8 border-b border-[var(--border)] bg-[var(--bg)] px-4 py-12 text-left md:flex-row md:items-stretch md:gap-10 md:px-6 md:py-16"
    >
      <div className={whereWeAreMapDecorativeLayerClassName}>
        <GreaterVancouverMapStack mapOutlineSvgRef={mapOutlineSvgRef} />
      </div>
      <div className="relative z-10 w-full max-w-2xl md:flex-1 md:py-2">
        <h2
          id="where-we-are-heading"
          className="mb-3 text-2xl font-medium text-[var(--text-heading)] md:text-3xl"
        >
          Where we are
        </h2>
        <p className="text-[var(--text-muted)]">
          Central Coquitlam, BC — the perfect base. World-class hiking trails
          when you want nature, and the heart of Vancouver when you want the
          city.
        </p>
      </div>
    </section>
  );
}
