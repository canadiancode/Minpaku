import * as THREE from "three";

/** Lets long scene builds hand control back to the browser between steps. */
export function yieldToMain() {
  if (globalThis.scheduler?.yield) return globalThis.scheduler.yield();
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Returns an async checkpoint that yields only once the current slice of work
 * has run longer than `budgetMs`, so tight build loops stay responsive cheaply.
 */
export function createTimeSlicer(budgetMs = 30) {
  let sliceStartedAt = performance.now();
  return async () => {
    if (performance.now() - sliceStartedAt < budgetMs) return;
    await yieldToMain();
    sliceStartedAt = performance.now();
  };
}

function whenIdle() {
  return new Promise((resolve) => {
    if (window.requestIdleCallback) window.requestIdleCallback(() => resolve(), { timeout: 2000 });
    else setTimeout(resolve, 200);
  });
}

/**
 * One WebGL renderer for the whole page. Each section ("view") keeps its own
 * on-page <canvas>; the stage renders the view offscreen and copies the frame
 * into that canvas, so scrolling stays perfectly in sync with the layout while
 * the GPU only holds one context, one set of compiled shaders and one loop.
 */
export function createStage() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const pixelRatio = Math.min(window.devicePixelRatio, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setScissorTest(true);
  const rendererSize = { width: 1, height: 1 };

  const entries = new Set();
  const entriesByHost = new Map();
  let frameId = 0;
  let lastTimestamp = null;

  // Idle-priority views wait until an eager view has painted its first frame.
  let releaseIdleViews;
  const idleGate = new Promise((resolve) => {
    releaseIdleViews = resolve;
    setTimeout(resolve, 3000);
  });

  const context = {
    reducedMotion,
    yieldToMain,
    createTimeSlicer,
    invalidate: () => invalidate(),
  };

  const nearObserver = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        const entry = entriesByHost.get(record.target);
        if (!entry) continue;
        entry.near = record.isIntersecting;
        if (entry.near) load(entry);
      }
      invalidate();
    },
    { rootMargin: "60% 0px" },
  );

  function growRenderer(width, height) {
    if (width <= rendererSize.width && height <= rendererSize.height) return;
    rendererSize.width = Math.max(rendererSize.width, width);
    rendererSize.height = Math.max(rendererSize.height, height);
    renderer.setSize(rendererSize.width, rendererSize.height, false);
  }

  function renderEntry(entry, deltaSeconds) {
    const rect = entry.host.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight || rect.width < 1 || rect.height < 1) return false;

    const width = Math.round(rect.width);
    const height = Math.round(rect.height);
    if (entry.width !== width || entry.height !== height) {
      entry.width = width;
      entry.height = height;
      entry.canvas.width = Math.round(width * pixelRatio);
      entry.canvas.height = Math.round(height * pixelRatio);
      entry.view.resize(width, height);
    }
    growRenderer(width, height);
    renderer.setViewport(0, 0, width, height);
    renderer.setScissor(0, 0, width, height);

    entry.view.update(deltaSeconds);
    renderer.render(entry.view.scene, entry.view.camera);

    // The view sits in the bottom-left of the (possibly larger) offscreen buffer.
    const source = renderer.domElement;
    const copyWidth = entry.canvas.width;
    const copyHeight = entry.canvas.height;
    entry.context2d.clearRect(0, 0, copyWidth, copyHeight);
    entry.context2d.drawImage(source, 0, source.height - copyHeight, copyWidth, copyHeight, 0, 0, copyWidth, copyHeight);

    if (!entry.hasPainted) {
      entry.hasPainted = true;
      if (entry.priority === "eager") releaseIdleViews();
    }
    return true;
  }

  function frame(timestamp) {
    frameId = 0;
    const deltaSeconds = lastTimestamp === null ? 0 : Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;

    let anyActive = false;
    for (const entry of entries) {
      if (!entry.view || !entry.near) continue;
      anyActive = true;
      renderEntry(entry, reducedMotion ? 0 : deltaSeconds);
    }

    if (anyActive && !reducedMotion && !document.hidden) frameId = requestAnimationFrame(frame);
    else lastTimestamp = null;
  }

  function invalidate() {
    if (!frameId && !document.hidden) frameId = requestAnimationFrame(frame);
  }

  function load(entry) {
    if (entry.loading) return entry.loading;
    entry.loading = (async () => {
      const view = await entry.loadView(context);
      if (entry.removed || !view) {
        view?.dispose();
        return null;
      }
      // Compile shaders off the critical path so the first frame doesn't hitch.
      await renderer.compileAsync(view.scene, view.camera).catch(() => {});
      if (entry.removed) {
        view.dispose();
        return null;
      }
      entry.view = view;
      invalidate();
      return view;
    })();
    entry.loading.then(entry.resolveReady, entry.rejectReady);
    return entry.loading;
  }

  function addView(host, loadView, { priority = "eager" } = {}) {
    const canvas = document.createElement("canvas");
    Object.assign(canvas.style, { display: "block", width: "100%", height: "100%" });
    host.appendChild(canvas);

    const entry = {
      host,
      canvas,
      context2d: canvas.getContext("2d"),
      loadView,
      priority,
      view: null,
      loading: null,
      near: false,
      removed: false,
      hasPainted: false,
      width: 0,
      height: 0,
    };
    entry.ready = new Promise((resolve, reject) => {
      entry.resolveReady = resolve;
      entry.rejectReady = reject;
    });
    entries.add(entry);
    entriesByHost.set(host, entry);
    nearObserver.observe(host);

    if (priority === "eager") load(entry);
    else idleGate.then(whenIdle).then(() => !entry.removed && load(entry));

    return {
      ready: entry.ready,
      remove() {
        entry.removed = true;
        entries.delete(entry);
        entriesByHost.delete(host);
        nearObserver.unobserve(host);
        canvas.remove();
        entry.view?.dispose();
        entry.view = null;
      },
    };
  }

  // Views re-measure their hosts each frame; on-demand (reduced-motion) mode still needs a nudge.
  window.addEventListener("resize", invalidate, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      lastTimestamp = null;
    } else {
      invalidate();
    }
  });

  return { addView, invalidate };
}
