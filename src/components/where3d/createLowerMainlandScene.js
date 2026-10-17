import * as THREE from "three";
import { createToonKit, palette as P } from "../hero3d/toonKit.js";
import { createCar, createCloud } from "../hero3d/props.js";
import { createOcean, createSkyDome, SKY_HORIZON } from "../hero3d/createFlightScene.js";
import {
  COASTLINE,
  HIGHWAY_1,
  LAKES,
  SKYTRAIN,
  WATERWAYS,
  createSkyTrain,
  createTerrain,
  curveFromPoints,
} from "./terrain.js";
import { createFiller, createLandmarks } from "./landmarks.js";
import { createHome } from "./home.js";
import { CITY_LABELS, HOME, INTRO_CAMERA, LAND_TOP, TOUR_STOPS } from "./tour.js";

const smoothstep = THREE.MathUtils.smoothstep;
const smootherstep = THREE.MathUtils.smootherstep;
const damp = THREE.MathUtils.damp;
const lerp = THREE.MathUtils.lerp;

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function distanceToSegment(px, pz, ax, az, bx, bz) {
  const abx = bx - ax;
  const abz = bz - az;
  const t = THREE.MathUtils.clamp(((px - ax) * abx + (pz - az) * abz) / (abx * abx + abz * abz || 1), 0, 1);
  return Math.hypot(px - (ax + abx * t), pz - (az + abz * t));
}

function polylineSamples(points) {
  const curve = curveFromPoints(points);
  return curve.getSpacedPoints(Math.ceil(curve.getLength() / 0.3)).map((point) => [point.x, point.z]);
}

function distanceToPolyline(x, z, samples) {
  let best = Infinity;
  for (let index = 0; index < samples.length - 1; index += 1) {
    const [ax, az] = samples[index];
    const [bx, bz] = samples[index + 1];
    best = Math.min(best, distanceToSegment(x, z, ax, az, bx, bz));
  }
  return best;
}

function insidePolygon(x, z, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Keeps filler trees and houses out of water, roads and landmark footprints. */
function createPlacementTest() {
  const water = Object.values(WATERWAYS).map(({ width, points }) => ({ half: width / 2, samples: polylineSamples(points) }));
  const roads = [
    { half: 0.2, samples: polylineSamples(HIGHWAY_1) },
    { half: 0.16, samples: polylineSamples(SKYTRAIN) },
  ];
  const landmarkZones = [
    [-19.5, -3.4, 2.3], [-21.6, -4.8, 1.3], [-22.6, -3.0, 0.5], [-16.4, -7.9, 0.7], [-15.3, -9.7, 0.5], [-19.6, -10, 1.3],
    [-16.6, -1.0, 1.4], [-8.5, 2.3, 1.5], [-4.8, -4.2, 1.0], [-1.6, 3.6, 1.9], [-21.4, 9.3, 2.5], [-19.6, 12.9, 1.1],
    [-13.2, 10.6, 0.9], [2.4, 9.2, 1.1], [16.6, 7.2, 1.0], [19.4, 12.8, 1.6], [1.2, -5.2, 1.0], [4.7, -3.3, 1.3],
    [6.3, -3.6, 1.0], [5.8, -6.0, 1.3], [1.6, 0.6, 1.3], [9.3, -1.0, 1.1], [13.0, 2.8, 1.5], [13.4, -1.6, 1.4],
    [18.6, 1.2, 1.7], [21.5, -8.6, 2.6], [14.6, 5.0, 1.4], [6.8, 4.8, 1.3], [-3.6, 5.6, 1.6], [-22.6, -6.5, 1.4],
  ];
  const mountainZone = (x, z) => z < -10.4 || (x > 17 && z < -9);

  return (x, z, radius) => {
    if (!insidePolygon(x, z, COASTLINE) || mountainZone(x, z)) return false;
    for (let index = 0; index < COASTLINE.length; index += 1) {
      const [ax, az] = COASTLINE[index];
      const [bx, bz] = COASTLINE[(index + 1) % COASTLINE.length];
      if (distanceToSegment(x, z, ax, az, bx, bz) < 0.9 + radius) return false;
    }
    if (x > HOME.x - 4.2 && x < HOME.x + 3.2 && z > HOME.z - 1.4 && z < HOME.z + 3.0) return false;
    for (const [zoneX, zoneZ, zoneRadius] of landmarkZones) {
      if (Math.hypot(x - zoneX, z - zoneZ) < zoneRadius + radius) return false;
    }
    for (const lake of LAKES) {
      const dx = (x - lake.x) / (lake.radiusX + radius + 0.2);
      const dz = (z - lake.z) / (lake.radiusZ + radius + 0.2);
      if (dx * dx + dz * dz < 1) return false;
    }
    for (const { half, samples } of [...water, ...roads]) {
      if (distanceToPolyline(x, z, samples) < half + radius + 0.12) return false;
    }
    return true;
  };
}

function createLabelSprite(kit, text, highlight) {
  const ratio = 2;
  const fontSize = 40 * ratio;
  const font = `700 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const measure = document.createElement("canvas").getContext("2d");
  measure.font = font;
  const paddingX = 30 * ratio;
  const width = Math.ceil(measure.measureText(text).width + paddingX * 2);
  const height = 76 * ratio;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height + 12 * ratio;
  const context = canvas.getContext("2d");
  context.fillStyle = "rgba(51, 54, 74, 0.18)";
  context.beginPath();
  context.roundRect(4, 10 * ratio, width - 8, height, height / 2);
  context.fill();
  context.fillStyle = highlight ? P.brandDeep : "rgba(255, 255, 255, 0.95)";
  context.beginPath();
  context.roundRect(4, 4, width - 8, height - 4, (height - 4) / 2);
  context.fill();
  context.fillStyle = highlight ? "#ffffff" : "#33364a";
  context.font = font;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, width / 2, height / 2 + 2);

  const texture = kit.track(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = kit.track(
    new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true, sizeAttenuation: false }),
  );
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0);
  sprite.renderOrder = 10;
  const screenHeight = highlight ? 0.044 : 0.034;
  sprite.scale.set((screenHeight * canvas.width) / canvas.height, screenHeight, 1);
  return sprite;
}

/** Camera keyframes: intro, then each stop's hold start and (slightly drifted) hold end. */
function buildCameraTimeline(narrow) {
  const pose = (camera) => {
    const { x, z, y = LAND_TOP, fitWidth, pitch, yaw, lift = 0 } = narrow && camera.narrow ? { ...camera, ...camera.narrow } : camera;
    return {
      target: new THREE.Vector3(x, y, z),
      fitWidth,
      pitch,
      yaw,
      lift,
    };
  };
  const keyframes = [{ p: 0, pose: pose(INTRO_CAMERA), stop: null }];
  for (const stop of TOUR_STOPS) {
    const start = pose(stop.camera);
    const end = pose(stop.camera);
    end.fitWidth *= 0.94;
    end.yaw += 0.05;
    keyframes.push({ p: stop.hold[0], pose: start, stop: stop.id });
    keyframes.push({ p: stop.hold[1], pose: end, stop: stop.id });
  }
  return keyframes;
}

function samplePose(keyframes, progress, arrival, out) {
  let index = 0;
  while (index < keyframes.length - 2 && progress > keyframes[index + 1].p) index += 1;
  const from = keyframes[index];
  const to = keyframes[index + 1];
  const raw = THREE.MathUtils.clamp((progress - from.p) / Math.max(1e-6, to.p - from.p), 0, 1);
  const holding = from.stop && from.stop === to.stop;
  // The intro descent is driven by the section scrolling into view, not by tour progress.
  const t = holding ? raw : smootherstep(index === 0 ? Math.max(arrival, raw) : raw, 0, 1);

  out.target.lerpVectors(from.pose.target, to.pose.target, t);
  out.fitWidth = Math.exp(lerp(Math.log(from.pose.fitWidth), Math.log(to.pose.fitWidth), t));
  out.pitch = lerp(from.pose.pitch, to.pose.pitch, t);
  out.yaw = lerp(from.pose.yaw, to.pose.yaw, t);
  out.lift = lerp(from.pose.lift, to.pose.lift, t);
  if (!holding) {
    // Hop: pull back a little mid-flight when travelling between distant stops.
    const travel = from.pose.target.distanceTo(to.pose.target);
    out.fitWidth *= 1 + Math.sin(Math.PI * t) * Math.min(0.7, travel / 22);
  }
  return out;
}

export function createLowerMainlandScene(container) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return { setProgress() {}, dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  Object.assign(renderer.domElement.style, { display: "block", width: "100%", height: "100%" });
  container.appendChild(renderer.domElement);

  const kit = createToonKit();
  const scene = new THREE.Scene();
  const skyDome = createSkyDome(kit);
  scene.add(skyDome);
  scene.fog = new THREE.Fog(SKY_HORIZON, 60, 200);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 1400);

  scene.add(new THREE.HemisphereLight("#fff6e8", "#7fb8c9", 1.6));
  const sunLight = new THREE.DirectionalLight("#ffffff", 2.2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight, sunLight.target);
  const sunDirection = new THREE.Vector3(-0.45, 1, 0.55).normalize();

  const ocean = createOcean(kit);
  scene.add(ocean.object);
  const terrain = createTerrain(kit);
  const skyTrain = createSkyTrain(kit);
  const landmarks = createLandmarks(kit);
  const home = createHome(kit);
  scene.add(terrain.group, skyTrain.group, landmarks.group, home.group);
  const random = seededRandom(11);
  scene.add(createFiller(kit, createPlacementTest(), random));

  const labels = CITY_LABELS.map(({ name, x, z, highlight }) => {
    const sprite = createLabelSprite(kit, name, highlight);
    sprite.position.set(x, LAND_TOP + (highlight ? 1.8 : 1.3), z);
    scene.add(sprite);
    return { sprite, highlight, baseScale: sprite.scale.clone() };
  });
  const homeLabel = createLabelSprite(kit, "Minpaku ♥", true);
  const homeLabelScale = homeLabel.scale.clone();
  scene.add(homeLabel);

  const highwayCurve = terrain.highwayCurve;
  const highwayCars = Array.from({ length: 12 }, (_, index) => {
    const car = createCar(kit, ["#f94144", "#4cc9f0", P.yellow, "#90be6d", P.white, "#f8961e"][index % 6]);
    car.scale.setScalar(0.3);
    scene.add(car);
    return { car, offset: index / 12, eastbound: index % 2 === 0, speed: 0.012 + (index % 3) * 0.002 };
  });
  const portMann = new THREE.Vector3(6.75, 0, 4.85);
  const carPoint = new THREE.Vector3();
  const carTangent = new THREE.Vector3();

  const clouds = new THREE.Group();
  const cloudForward = new THREE.Vector3();
  for (let index = 0; index < 26; index += 1) {
    const cloud = createCloud(kit, random);
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(random()) * 26;
    cloud.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.7, (random() - 0.5) * 16);
    cloud.scale.setScalar(2.2 + random() * 1.8);
    clouds.add(cloud);
  }
  scene.add(clouds);

  let keyframes = buildCameraTimeline(false);
  const desiredPose = { target: new THREE.Vector3(), fitWidth: 1, pitch: 0, yaw: 0, lift: 0 };
  const currentPose = { target: new THREE.Vector3(), fitWidth: 1, pitch: 0, yaw: 0, lift: 0 };
  let hasPose = false;
  let progress = 0;
  let arrival = 0;
  const view = { width: 1, height: 1, aspect: 1, wide: true };
  const direction = new THREE.Vector3();

  function updateCamera(deltaSeconds) {
    samplePose(keyframes, progress, arrival, desiredPose);
    if (!hasPose || deltaSeconds === 0) {
      currentPose.target.copy(desiredPose.target);
      Object.assign(currentPose, { fitWidth: desiredPose.fitWidth, pitch: desiredPose.pitch, yaw: desiredPose.yaw, lift: desiredPose.lift });
      hasPose = true;
    } else {
      const smoothing = 6;
      currentPose.target.x = damp(currentPose.target.x, desiredPose.target.x, smoothing, deltaSeconds);
      currentPose.target.y = damp(currentPose.target.y, desiredPose.target.y, smoothing, deltaSeconds);
      currentPose.target.z = damp(currentPose.target.z, desiredPose.target.z, smoothing, deltaSeconds);
      currentPose.fitWidth = Math.exp(damp(Math.log(currentPose.fitWidth), Math.log(desiredPose.fitWidth), smoothing, deltaSeconds));
      currentPose.pitch = damp(currentPose.pitch, desiredPose.pitch, smoothing, deltaSeconds);
      currentPose.yaw = damp(currentPose.yaw, desiredPose.yaw, smoothing, deltaSeconds);
      currentPose.lift = damp(currentPose.lift, desiredPose.lift, smoothing, deltaSeconds);
    }

    const halfFovY = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfFovX = Math.atan(Math.tan(halfFovY) * view.aspect);
    const fitWidth = currentPose.fitWidth;
    const distance = Math.max(fitWidth / 2 / Math.tan(halfFovX), (fitWidth * 0.62) / 2 / Math.tan(halfFovY));

    direction.set(
      Math.sin(currentPose.yaw) * Math.cos(currentPose.pitch),
      Math.sin(currentPose.pitch),
      Math.cos(currentPose.yaw) * Math.cos(currentPose.pitch),
    );
    camera.position.copy(currentPose.target).addScaledVector(direction, distance);
    camera.position.y += currentPose.lift;
    camera.lookAt(currentPose.target);
    camera.near = THREE.MathUtils.clamp(distance * 0.02, 0.02, 2);
    camera.far = 1400;
    camera.updateProjectionMatrix();
    skyDome.position.copy(camera.position);

    scene.fog.near = distance * 1.3 + 4;
    scene.fog.far = distance * 3.2 + 50;

    // Keep shadows crisp by fitting the shadow camera to what's on screen.
    const extent = THREE.MathUtils.clamp(fitWidth * 0.75, 2.5, 46);
    sunLight.target.position.copy(currentPose.target);
    sunLight.position.copy(currentPose.target).addScaledVector(sunDirection, 70);
    Object.assign(sunLight.shadow.camera, { left: -extent, right: extent, top: extent, bottom: -extent, near: 1, far: 160 });
    sunLight.shadow.camera.updateProjectionMatrix();

    return { distance, fitWidth };
  }

  function updateLabels(fitWidth) {
    const zoomFade = smoothstep(fitWidth, 4.5, 8);
    const introFade = smoothstep(arrival, 0.8, 1);
    for (const { sprite, highlight } of labels) {
      const near = sprite.position.distanceTo(currentPose.target);
      const focus = fitWidth > 40 ? 1 : 1 - smoothstep(near, fitWidth * 0.45, fitWidth * 0.7);
      sprite.material.opacity = zoomFade * introFade * (highlight ? Math.max(focus, 0.85) : focus);
      sprite.visible = sprite.material.opacity > 0.01;
    }
    const pinVisibility = smoothstep(fitWidth, 3.5, 6.5) * introFade;
    const pinScale = THREE.MathUtils.clamp(fitWidth / 18, 0.3, 1);
    homeLabel.position.set(HOME.x, home.pin.position.y + 1.05 * pinVisibility * pinScale, HOME.z);
    homeLabel.material.opacity = pinVisibility * (fitWidth > 40 ? 0 : 1);
    homeLabel.visible = homeLabel.material.opacity > 0.01;
    return { pinVisibility, pinScale };
  }

  function updateHighway(deltaSeconds) {
    for (const entry of highwayCars) {
      entry.offset = (entry.offset + entry.speed * deltaSeconds * (entry.eastbound ? 1 : -1) + 1) % 1;
      highwayCurve.getPointAt(entry.offset, carPoint);
      highwayCurve.getTangentAt(entry.offset, carTangent);
      const lane = entry.eastbound ? 0.08 : -0.08;
      carPoint.x += -carTangent.z * lane;
      carPoint.z += carTangent.x * lane;
      const bridgeLift = 0.36 * smoothstep(1.35 - Math.hypot(carPoint.x - portMann.x, carPoint.z - portMann.z), 0, 0.45);
      entry.car.position.set(carPoint.x, LAND_TOP + 0.02 + bridgeLift, carPoint.z);
      entry.car.rotation.y = Math.atan2(carTangent.x, carTangent.z) + (entry.eastbound ? 0 : Math.PI);
    }
  }

  function updateClouds() {
    // A cloud bank sits in front of the lens and the camera flies through it as the tour begins.
    const rise = arrival;
    clouds.visible = rise < 0.999;
    camera.getWorldDirection(cloudForward);
    clouds.position.copy(camera.position).addScaledVector(cloudForward, lerp(20, -12, rise));
    clouds.quaternion.copy(camera.quaternion);
  }

  function resize() {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    view.width = width;
    view.height = height;
    view.aspect = width / height;
    const wasWide = view.wide;
    view.wide = width >= 768 && view.aspect > 1;
    if (wasWide !== view.wide || !keyframes) keyframes = buildCameraTimeline(!view.wide);
    // Label size is a fraction of screen height, so shrink it on tall phone screens.
    const labelScale = THREE.MathUtils.clamp(view.aspect * 1.15, 0.55, 1);
    for (const label of labels) label.sprite.scale.copy(label.baseScale).multiplyScalar(labelScale);
    homeLabel.scale.copy(homeLabelScale).multiplyScalar(labelScale);
    renderer.setSize(width, height, false);
    camera.aspect = view.aspect;
    // Leave room for the text card: left side on wide screens, bottom on phones.
    if (view.wide) camera.setViewOffset(width, height, -width * 0.17, 0, width, height);
    else camera.setViewOffset(width, height, 0, height * 0.17, width, height);
    if (!running) renderFrame(0);
  }

  let elapsed = 0;
  let lastTimestamp = null;
  let frameId = 0;
  let running = false;
  let isVisible = false;

  function renderFrame(deltaSeconds) {
    const animationDelta = reducedMotion ? 0 : deltaSeconds;
    elapsed += animationDelta;
    const { fitWidth } = updateCamera(deltaSeconds);
    const { pinVisibility, pinScale } = updateLabels(fitWidth);
    home.update(elapsed, pinVisibility, pinScale);
    landmarks.update(elapsed, animationDelta);
    skyTrain.update(elapsed);
    ocean.update(elapsed);
    updateHighway(animationDelta);
    updateClouds();
    renderer.render(scene, camera);
  }

  function tick(timestamp) {
    frameId = requestAnimationFrame(tick);
    const deltaSeconds = lastTimestamp === null ? 0 : Math.min((timestamp - lastTimestamp) / 1000, 0.05);
    lastTimestamp = timestamp;
    renderFrame(deltaSeconds);
  }

  function start() {
    if (running || !isVisible || document.hidden) return;
    running = true;
    lastTimestamp = null;
    frameId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frameId);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) start();
    else stop();
  });
  intersectionObserver.observe(container);
  const onVisibilityChange = () => (document.hidden ? stop() : start());
  document.addEventListener("visibilitychange", onVisibilityChange);

  resize();

  return {
    setProgress(value, arrivalValue = 1) {
      progress = THREE.MathUtils.clamp(value, 0, 1);
      arrival = THREE.MathUtils.clamp(arrivalValue, 0, 1);
      if (!running) renderFrame(0);
    },
    dispose() {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      kit.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
