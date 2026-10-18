import * as THREE from "three";

const { lerp, damp, smootherstep } = THREE.MathUtils;

/**
 * Scroll-driven camera for chapter views. Each stop holds a framing for its
 * `hold` range of progress; between stops the camera glides (and pulls back a
 * little when the hop is long). Framings are described by what should fit on
 * screen (`fitWidth`) rather than by distance, so they work on any aspect ratio.
 * A stop's `narrow` overrides apply on portrait phone screens.
 */
export function createCameraRig(camera, stops) {
  let narrow = false;
  let keyframes = [];
  let aspect = 1;
  const desired = { target: new THREE.Vector3(), fitWidth: 1, pitch: 0, yaw: 0 };
  const current = { target: new THREE.Vector3(), fitWidth: 1, pitch: 0, yaw: 0 };
  let hasPose = false;
  const direction = new THREE.Vector3();

  function pose(cameraStop) {
    const framing = narrow && cameraStop.narrow ? { ...cameraStop, ...cameraStop.narrow } : cameraStop;
    return {
      target: new THREE.Vector3(framing.x, framing.y ?? 0, framing.z),
      fitWidth: framing.fitWidth,
      pitch: framing.pitch,
      yaw: framing.yaw,
    };
  }

  function rebuild() {
    keyframes = [];
    for (const stop of stops) {
      const start = pose(stop.camera);
      const end = pose(stop.camera);
      end.fitWidth *= 0.95;
      end.yaw += 0.04;
      keyframes.push({ p: stop.hold[0], pose: start, stop: stop.id });
      keyframes.push({ p: stop.hold[1], pose: end, stop: stop.id });
    }
  }
  rebuild();

  function sample(progress) {
    let index = 0;
    while (index < keyframes.length - 2 && progress > keyframes[index + 1].p) index += 1;
    const from = keyframes[index];
    const to = keyframes[index + 1];
    const raw = THREE.MathUtils.clamp((progress - from.p) / Math.max(1e-6, to.p - from.p), 0, 1);
    const holding = from.stop === to.stop;
    const t = holding ? raw : smootherstep(raw, 0, 1);
    desired.target.lerpVectors(from.pose.target, to.pose.target, t);
    desired.fitWidth = Math.exp(lerp(Math.log(from.pose.fitWidth), Math.log(to.pose.fitWidth), t));
    desired.pitch = lerp(from.pose.pitch, to.pose.pitch, t);
    desired.yaw = lerp(from.pose.yaw, to.pose.yaw, t);
    if (!holding) {
      const travel = from.pose.target.distanceTo(to.pose.target);
      desired.fitWidth *= 1 + Math.sin(Math.PI * t) * Math.min(0.5, travel / 30);
    }
  }

  /** Sizes the camera for the view and leaves room for the narration card. */
  function resize(width, height) {
    aspect = width / height;
    const isNarrow = !(width >= 768 && aspect > 1);
    if (isNarrow !== narrow) {
      narrow = isNarrow;
      rebuild();
    }
    camera.aspect = aspect;
    if (narrow) camera.setViewOffset(width, height, 0, height * 0.17, width, height);
    else camera.setViewOffset(width, height, -width * 0.17, 0, width, height);
  }

  /** Moves the camera toward the framing for `progress`; returns what's on screen. */
  function update(progress, deltaSeconds) {
    sample(progress);
    if (!hasPose || deltaSeconds === 0) {
      current.target.copy(desired.target);
      Object.assign(current, { fitWidth: desired.fitWidth, pitch: desired.pitch, yaw: desired.yaw });
      hasPose = true;
    } else {
      const smoothing = 6;
      current.target.x = damp(current.target.x, desired.target.x, smoothing, deltaSeconds);
      current.target.y = damp(current.target.y, desired.target.y, smoothing, deltaSeconds);
      current.target.z = damp(current.target.z, desired.target.z, smoothing, deltaSeconds);
      current.fitWidth = Math.exp(damp(Math.log(current.fitWidth), Math.log(desired.fitWidth), smoothing, deltaSeconds));
      current.pitch = damp(current.pitch, desired.pitch, smoothing, deltaSeconds);
      current.yaw = damp(current.yaw, desired.yaw, smoothing, deltaSeconds);
    }

    const halfFovY = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfFovX = Math.atan(Math.tan(halfFovY) * aspect);
    const distance = Math.max(current.fitWidth / 2 / Math.tan(halfFovX), (current.fitWidth * 0.62) / 2 / Math.tan(halfFovY));
    direction.set(
      Math.sin(current.yaw) * Math.cos(current.pitch),
      Math.sin(current.pitch),
      Math.cos(current.yaw) * Math.cos(current.pitch),
    );
    camera.position.copy(current.target).addScaledVector(direction, distance);
    camera.lookAt(current.target);
    camera.near = THREE.MathUtils.clamp(distance * 0.02, 0.02, 2);
    camera.updateProjectionMatrix();
    return { distance, fitWidth: current.fitWidth, target: current.target };
  }

  return { resize, update };
}

/** Points a directional light's shadow camera at what's on screen, so shadows stay crisp. */
export function fitShadowToView(light, direction, target, fitWidth) {
  const extent = THREE.MathUtils.clamp(fitWidth * 0.75, 2.5, 46);
  light.target.position.copy(target);
  light.position.copy(target).addScaledVector(direction, 60);
  Object.assign(light.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 1, far: 140 });
  light.shadow.camera.updateProjectionMatrix();
}
