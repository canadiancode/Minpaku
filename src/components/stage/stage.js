let stagePromise = null;

/** The page-wide stage, created on first use (three.js loads with it). */
function getStage() {
  if (!stagePromise) {
    stagePromise = import("./createStage.js").then(({ createStage }) => createStage());
  }
  return stagePromise;
}

/**
 * Registers a section's host element with the shared stage.
 * `loadView(context)` builds the view; `priority: "idle"` defers the build until
 * the eager views have painted and the browser is idle (or the section nears the viewport).
 * Returns `ready` (resolves to the view, or null when WebGL is unavailable) and `unregister`.
 */
export function registerStageView(host, loadView, options) {
  let isCancelled = false;
  let removeFromStage = null;

  const ready = getStage().then((stage) => {
    if (isCancelled || !stage) return null;
    const handle = stage.addView(host, loadView, options);
    removeFromStage = handle.remove;
    return handle.ready;
  });

  return {
    ready,
    unregister() {
      isCancelled = true;
      removeFromStage?.();
    },
  };
}
