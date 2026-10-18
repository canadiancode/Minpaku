import * as THREE from "three";
import { createToonKit, palette as P } from "./toonKit.js";
import { createTokyo, createVancouver, PAD_TOP } from "./cities.js";
import { createBoat, createCloud, createOrca, createPlane, createPuffPool } from "./props.js";
import { mergeStaticMeshes } from "../stage/mergeStatic.js";
import { SKY_HORIZON, createOcean, createSkyDome } from "../stage/environment.js";
import { content } from "../../i18n/content.js";


const smoothstep = (edge0, edge1, value) => {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};
const damp = THREE.MathUtils.damp;

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/**
 * One closed loop: take off from Tokyo on the front lane, cross the ocean,
 * land in Vancouver, U-turn on the pad, and fly home on the back lane.
 */
function createFlightPath(groundY) {
  const G = groundY;
  const points = [
    [-15.6, G, 2.4], [-12.5, G, 2.4], [-9.5, 1.9 + G * 0.3, 2.7], [-5, 4.8, 3.6], [0, 5.8, 4],
    [5, 4.8, 3.6], [9.5, 1.9 + G * 0.3, 2.7], [12.5, G, 2.4], [15.6, G, 2.4], [17.1, G, 1.5],
    [15.6, G, 0.6], [12.5, G, 0.6], [9.5, 2.2 + G * 0.3, 0], [5, 5.6, -2.6], [0, 6.6, -3.4],
    [-5, 5.6, -2.6], [-9.5, 2.2 + G * 0.3, 0], [-12.5, G, 0.6], [-15.6, G, 0.6], [-17.1, G, 1.5],
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  return new THREE.CatmullRomCurve3(points, true, "centripetal");
}


/**
 * Hero scene as a stage view: builds the world, then the shared stage calls
 * resize/update and renders it. Building yields between big steps.
 */
export async function createFlightView({ reducedMotion, yieldToMain, createTimeSlicer, invalidate }) {
  const slice = createTimeSlicer();
  const kit = createToonKit();
  const scene = new THREE.Scene();
  const skyDome = createSkyDome(kit);
  scene.add(skyDome);
  scene.fog = new THREE.Fog(SKY_HORIZON, 60, 160);

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 400);

  scene.add(new THREE.HemisphereLight("#fff6e8", "#7fb8c9", 1.6));
  const sunLight = new THREE.DirectionalLight("#ffffff", 2.2);
  sunLight.position.set(-14, 26, 16);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunLight.shadow.camera, { left: -32, right: 32, top: 22, bottom: -22, near: 1, far: 80 });
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.03;
  scene.add(sunLight);

  const sun = kit.mesh(new THREE.SphereGeometry(3.2, 32, 20), "#ffe48a", {
    emissive: "#ffcf4a",
    fog: false,
    castShadow: false,
    receiveShadow: false,
  });
  sun.position.set(30, 20, -90);
  scene.add(sun);

  const ocean = createOcean(kit);
  scene.add(ocean.object);

  const tokyo = createTokyo(kit);
  await yieldToMain();
  const vancouver = createVancouver(kit);
  scene.add(tokyo.group, vancouver.group);
  await yieldToMain();
  await mergeStaticMeshes(kit, tokyo.group, slice);
  await mergeStaticMeshes(kit, vancouver.group, slice);

  const random = seededRandom(7);
  const clouds = Array.from({ length: 9 }, (_, index) => {
    const cloud = createCloud(kit, random);
    const inFront = index < 2;
    cloud.position.set(-34 + index * 8.5 + random() * 3, inFront ? 10.5 : 7.5 + random() * 3.5, inFront ? 6 : -6 - random() * 10);
    cloud.scale.setScalar(0.8 + random() * 0.5);
    scene.add(cloud);
    return { cloud, speed: 0.35 + random() * 0.35 };
  });

  const plane = createPlane(kit);
  scene.add(plane.object);
  const groundY = PAD_TOP + plane.wheelDrop;
  const flightPath = createFlightPath(groundY);
  const pathLength = flightPath.getLength();

  const tokyoBoat = createBoat(kit, "#f4a259", "#fff1d6");
  const seaBus = createBoat(kit, "#3d6fb6", P.white);
  scene.add(tokyoBoat, seaBus);

  const orca = createOrca(kit);
  scene.add(orca.object);

  const puffs = createPuffPool(kit, scene, 70);

  const pointer = { x: 0, y: 0 };
  let exitProgress = 0;
  const parallax = { x: 0, y: 0 };
  const view = { width: 1, height: 1, aspect: 1, cameraX: 0 };
  const lookTarget = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3(0, 0.62, 1).normalize();

  const state = {
    progress: reducedMotion ? 0.24 : 0.02,
    roll: 0,
    lastYaw: null,
    trailTimer: 0,
    orcaTimer: 4,
    orcaWasUnder: true,
  };

  const position = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const lookPoint = new THREE.Vector3();
  const trailOffset = new THREE.Vector3();

  function updatePlane(time, deltaSeconds) {
    const airborne = smoothstep(groundY + 0.05, groundY + 1.6, flightPath.getPointAt(state.progress, position).y);
    const speed = THREE.MathUtils.lerp(2.4, 7.2, airborne);
    if (!reducedMotion) state.progress = (state.progress + (speed * deltaSeconds) / pathLength) % 1;

    flightPath.getPointAt(state.progress, position);
    flightPath.getTangentAt(state.progress, tangent);
    plane.object.position.copy(position);
    plane.object.lookAt(lookPoint.copy(position).add(tangent));

    const yaw = Math.atan2(tangent.x, tangent.z);
    let yawRate = 0;
    if (state.lastYaw !== null && deltaSeconds > 0) {
      yawRate = THREE.MathUtils.euclideanModulo(yaw - state.lastYaw + Math.PI, Math.PI * 2) - Math.PI;
      yawRate /= deltaSeconds;
    }
    state.lastYaw = yaw;
    const targetRoll = THREE.MathUtils.clamp(-yawRate * 0.45, -0.7, 0.7) * airborne;
    state.roll = damp(state.roll, targetRoll, 4, deltaSeconds);
    plane.body.rotation.z = state.roll;
    plane.body.position.y = Math.sin(time * 2.2) * 0.08 * airborne + Math.abs(Math.sin(time * 14)) * 0.02 * (1 - airborne);
    plane.propeller.rotation.z += deltaSeconds * (14 + airborne * 16);

    state.trailTimer -= deltaSeconds;
    if (airborne > 0.7 && state.trailTimer <= 0 && !reducedMotion) {
      state.trailTimer = 0.07;
      trailOffset.set((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, -1.3).applyQuaternion(plane.object.quaternion);
      puffs.spawn(trailOffset.add(position), 0.28 + Math.random() * 0.1, 1.5, new THREE.Vector3(0, 0.15, 0));
    }
    return position.x;
  }

  function updateOrca(deltaSeconds) {
    const jumpDuration = 1.9;
    state.orcaTimer -= deltaSeconds;
    if (state.orcaTimer < -jumpDuration) state.orcaTimer = 6 + Math.random() * 3;
    const jump = state.orcaTimer < 0 ? -state.orcaTimer / jumpDuration : -1;
    if (jump < 0) {
      orca.object.visible = false;
      return;
    }
    orca.object.visible = true;
    const height = Math.sin(Math.PI * jump) * 2.3 - 0.55;
    const slope = Math.cos(Math.PI * jump) * Math.PI * 2.3;
    orca.object.position.set(7.5 + jump * 3.6, height, 7.2);
    orca.object.rotation.y = Math.PI / 2;
    orca.body.rotation.x = -Math.atan2(slope, 3.6);

    const isUnder = height < 0.05;
    if (isUnder !== state.orcaWasUnder) {
      for (let index = 0; index < 8; index += 1) {
        const angle = (index / 8) * Math.PI * 2;
        puffs.spawn(
          new THREE.Vector3(orca.object.position.x, 0.1, 7.2),
          0.35,
          0.9,
          new THREE.Vector3(Math.cos(angle) * 1.4, 1.6 + Math.random(), Math.sin(angle) * 1.4),
        );
      }
    }
    state.orcaWasUnder = isUnder;
  }

  function updateBoats(time) {
    const boats = [
      [tokyoBoat, -7.5, 7.5, 2.6, 0.22, 0],
      [seaBus, 7.0, -6.5, 2.8, 0.18, 2],
    ];
    for (const [boat, centerX, z, range, frequency, phase] of boats) {
      const wave = time * frequency + phase;
      boat.position.set(centerX + Math.sin(wave) * range, 0.05 + Math.sin(time * 2 + phase) * 0.06, z);
      boat.rotation.y = Math.cos(wave) >= 0 ? Math.PI / 2 : -Math.PI / 2;
      boat.rotation.z = Math.sin(time * 1.6 + phase) * 0.05;
    }
  }

  function updateCamera(planeX, deltaSeconds) {
    const wideness = smoothstep(0.75, 1.9, view.aspect);
    const visibleWidth = THREE.MathUtils.lerp(26, 72, wideness);
    const followAmount = THREE.MathUtils.lerp(1, 0.12, wideness);
    const maxOffset = THREE.MathUtils.lerp(13, 5, wideness);
    const targetX = THREE.MathUtils.clamp(planeX * followAmount, -maxOffset, maxOffset);
    view.cameraX = deltaSeconds > 0 ? damp(view.cameraX, targetX, 1.6, deltaSeconds) : targetX;

    parallax.x = damp(parallax.x, pointer.x, 3, deltaSeconds || 1);
    parallax.y = damp(parallax.y, pointer.y, 3, deltaSeconds || 1);

    const halfFovY = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfFovX = Math.atan(Math.tan(halfFovY) * view.aspect);
    const distance = visibleWidth / 2 / Math.tan(halfFovX);

    // Scrolling out of the hero lifts the camera up toward the clouds of the next section.
    lookTarget.set(view.cameraX, 2.4 + exitProgress * 7, 0.5);
    camera.position.copy(lookTarget).addScaledVector(cameraDirection, distance * (1 - exitProgress * 0.12));
    camera.position.y += exitProgress * 6;
    camera.position.x += parallax.x * 2.5;
    camera.position.y += parallax.y * 1.5;
    camera.lookAt(lookTarget);

    scene.fog.near = distance + 6;
    scene.fog.far = distance + 110;
    camera.far = 1200;
    skyDome.position.copy(camera.position);
    camera.updateProjectionMatrix();
  }

  function resize(width, height) {
    view.width = width;
    view.height = height;
    view.aspect = width / height;
    camera.aspect = view.aspect;
    // Push the scene toward the bottom so the headline has open sky above it.
    const shift = THREE.MathUtils.lerp(0.2, 0.24, smoothstep(0.75, 1.9, view.aspect));
    camera.setViewOffset(width, height, 0, -height * shift, width, height);
  }

  let elapsed = 0;

  function update(deltaSeconds) {
    elapsed += deltaSeconds;
    const planeX = updatePlane(elapsed, deltaSeconds);
    tokyo.update(elapsed);
    vancouver.update(elapsed);
    ocean.update(elapsed);
    updateBoats(elapsed);
    if (!reducedMotion) updateOrca(deltaSeconds);
    puffs.update(deltaSeconds);
    for (const entry of clouds) {
      entry.cloud.position.x += entry.speed * deltaSeconds;
      if (entry.cloud.position.x > 40) entry.cloud.position.x = -40;
    }
    updateCamera(planeX, deltaSeconds);
  }

  const onPointerMove = (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  function setLanguage(language) {
    const signs = (content[language] ?? content.en).hero.signs;
    tokyo.sign.userData.setLabel(signs.tokyo);
    vancouver.sign.userData.setLabel(signs.vancouver);
    invalidate();
  }

  return {
    scene,
    camera,
    resize,
    update,
    setLanguage,
    setExitProgress(value) {
      exitProgress = THREE.MathUtils.clamp(value, 0, 1);
      invalidate();
    },
    dispose() {
      window.removeEventListener("pointermove", onPointerMove);
      kit.dispose();
    },
  };
}
