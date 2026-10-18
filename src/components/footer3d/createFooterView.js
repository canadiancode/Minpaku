import * as THREE from "three";
import { createToonKit, palette as P } from "../hero3d/toonKit.js";
import { createCloud, createPine, createPlane } from "../hero3d/props.js";
import { createSmallHouse } from "../where3d/landmarks.js";
import { createOcean, createSkyDome } from "../stage/environment.js";
import { mergeStaticMeshes } from "../stage/mergeStatic.js";

const SUNSET_TOP = "#f6a6b9";
const SUNSET_HORIZON = "#ffe0b0";

function islandPuck(radius, height) {
  const profile = [new THREE.Vector2(0, -1), new THREE.Vector2(radius, -1)];
  for (let index = 0; index <= 8; index += 1) {
    const angle = (index / 8) * (Math.PI / 2);
    profile.push(new THREE.Vector2(radius - 0.3 + Math.cos(angle) * 0.3, height - 0.3 + Math.sin(angle) * 0.3));
  }
  profile.push(new THREE.Vector2(0, height));
  return new THREE.LatheGeometry(profile, 40);
}

/** Closing scene: the little plane circles a sleepy island at sunset. */
export async function createFooterView({ reducedMotion, createTimeSlicer }) {
  const slice = createTimeSlicer();
  const kit = createToonKit();
  const scene = new THREE.Scene();
  const skyDome = createSkyDome(kit, { top: SUNSET_TOP, horizon: SUNSET_HORIZON });
  scene.add(skyDome);
  scene.fog = new THREE.Fog(SUNSET_HORIZON, 70, 170);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 600);

  scene.add(new THREE.HemisphereLight("#ffe8d6", "#c9b6e8", 2.0));
  const sunLight = new THREE.DirectionalLight("#ffc48a", 2.2);
  sunLight.position.set(-14, 22, 6);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunLight.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 60 });
  scene.add(sunLight);

  const sun = kit.mesh(new THREE.SphereGeometry(5, 32, 20), "#ffb36b", { emissive: "#ff8a3d", fog: false, castShadow: false, receiveShadow: false });
  sun.position.set(22, 1.5, -70);
  scene.add(sun);

  const ocean = createOcean(kit, "#a7d3ee");
  scene.add(ocean.object);

  const island = new THREE.Group();
  island.add(kit.mesh(islandPuck(5.6, 0.2), P.sand, { castShadow: false }));
  island.add(kit.mesh(islandPuck(5, 0.5), P.grassVancouver, { castShadow: false }));
  const house = createSmallHouse(kit, "#f6e7c8", "#59627a");
  house.scale.setScalar(3);
  house.position.set(0.4, 0.5, -0.6);
  island.add(house);
  const windowGlow = kit.mesh(new THREE.PlaneGeometry(0.5, 0.35), "#ffd98a", { emissive: "#ffb347", castShadow: false });
  windowGlow.position.set(0.4, 1.0, 0.04);
  island.add(windowGlow);
  for (const [x, z, scale] of [[-2.8, -1.2, 1.1], [-3.4, 1.2, 0.9], [3.2, -1.6, 1.0], [2.8, 1.6, 0.8], [-1.2, -3.0, 0.9]]) {
    const pine = createPine(kit, scale);
    pine.position.set(x, 0.5, z);
    island.add(pine);
  }
  scene.add(island);
  await slice();
  await mergeStaticMeshes(kit, island, slice);

  const random = (() => {
    let seed = 3;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })();
  const clouds = Array.from({ length: 5 }, (_, index) => {
    const cloud = createCloud(kit, random);
    cloud.position.set(-24 + index * 12, 6 + random() * 3, -14 - random() * 8);
    cloud.scale.setScalar(1 + random() * 0.6);
    scene.add(cloud);
    return cloud;
  });

  const plane = createPlane(kit);
  plane.object.scale.setScalar(0.9);
  scene.add(plane.object);
  const position = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const loopPoint = (t, out) => out.set(Math.cos(t) * 8.5, 3.4 + Math.sin(t * 2) * 0.6, Math.sin(t) * 4.5 - 1);

  let elapsed = 0;
  let aspect = 1;

  function resize(width, height) {
    aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }

  function update(deltaSeconds) {
    elapsed += reducedMotion ? 0 : deltaSeconds;
    const t = elapsed * 0.35 + 1.2;
    loopPoint(t, position);
    loopPoint(t + 0.05, ahead);
    plane.object.position.copy(position);
    plane.object.lookAt(ahead);
    plane.body.rotation.z = -0.35;
    plane.propeller.rotation.z += deltaSeconds * 30;
    for (const cloud of clouds) {
      cloud.position.x += deltaSeconds * 0.4;
      if (cloud.position.x > 34) cloud.position.x = -34;
    }
    ocean.update(elapsed);

    // Frame the island whatever the footer's shape.
    const halfFovY = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfFovX = Math.atan(Math.tan(halfFovY) * aspect);
    const distance = Math.max(13 / Math.tan(halfFovX), 5.5 / Math.tan(halfFovY));
    camera.position.set(Math.sin(elapsed * 0.05) * 1.5, distance * 0.32 + 1.5, distance);
    camera.lookAt(0, 2.2, 0);
    skyDome.position.copy(camera.position);
  }

  return { scene, camera, resize, update, dispose: () => kit.dispose() };
}
