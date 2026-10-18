import * as THREE from "three";
import { createToonKit, cylinderBetween, palette as P, roundedBox } from "../hero3d/toonKit.js";
import { createFlag, createPine, createRoundTree, drawCanadaFlag } from "../hero3d/props.js";
import { createMountain } from "../hero3d/cities.js";
import { createHostPair, createPerson } from "../where3d/home.js";
import { diningTable, plant } from "../story3d/furniture.js";
import { createCameraRig, fitShadowToView } from "../stage/cameraRig.js";
import { createOcean, createSkyDome, SKY_HORIZON } from "../stage/environment.js";
import { mergeStaticMeshes } from "../stage/mergeStatic.js";
import { ACTIVITY_STOPS, ISLANDS } from "./activityStops.js";

const TOP = 0.5;
const PERSON_SCALE = 0.8;

function placed(object, x, y, z, rotationY = 0) {
  object.position.set(x, y, z);
  object.rotation.y = rotationY;
  return object;
}

function puck(radius, height, bevel) {
  const profile = [new THREE.Vector2(0, -1.2), new THREE.Vector2(radius, -1.2)];
  for (let index = 0; index <= 8; index += 1) {
    const angle = (index / 8) * (Math.PI / 2);
    profile.push(new THREE.Vector2(radius - bevel + Math.cos(angle) * bevel, height - bevel + Math.sin(angle) * bevel));
  }
  profile.push(new THREE.Vector2(0, height));
  return new THREE.LatheGeometry(profile, 48);
}

function islandBase(kit, x, grass, sand = P.sand) {
  const island = new THREE.Group();
  island.add(placed(kit.mesh(puck(6.6, 0.22, 0.2), sand, { castShadow: false }), x, 0, 0));
  island.add(placed(kit.mesh(puck(6, TOP, 0.32), grass, { castShadow: false }), x, 0, 0));
  island.add(placed(kit.mesh(new THREE.TorusGeometry(7, 0.12, 6, 64).rotateX(Math.PI / 2), P.foam, { castShadow: false }), x, 0.04, 0));
  return island;
}

function coneHeight(dx, dz, radius, height) {
  const distance = Math.hypot(dx, dz);
  return distance >= radius ? 0 : height * (1 - distance / radius);
}

/* ───── Accessories for the hosts and their friends ───── */

function addBackpack(kit, person, color) {
  person.body.add(placed(kit.mesh(roundedBox(0.26, 0.34, 0.15, 0.06), color), 0, 0.46, -0.17));
}

function addBeanie(kit, person, color) {
  const beanie = kit.mesh(new THREE.SphereGeometry(0.225, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), color);
  person.head.add(beanie);
  person.head.add(placed(kit.mesh(new THREE.SphereGeometry(0.06, 10, 8), P.white), 0, 0.24, 0));
}

function addPaddle(kit, person, color) {
  const paddle = new THREE.Group();
  paddle.add(placed(kit.mesh(roundedBox(0.24, 0.3, 0.03, 0.09), color), 0, -0.47, 0.02));
  paddle.add(placed(kit.mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8), "#3b3d4f"), 0, -0.29, 0.02));
  person.hands.front.add(paddle);
}

function addSkis(kit, person) {
  for (const side of [-1, 1]) person.body.add(placed(kit.mesh(roundedBox(0.08, 0.03, 0.7, 0.012), "#e63946"), side * 0.075, 0.0, 0.08));
}

function addSnowboard(kit, person) {
  person.body.add(placed(kit.mesh(roundedBox(0.62, 0.03, 0.22, 0.1), "#4cc9f0"), 0, 0.0, 0.02));
}

function createGuest(kit, { skin, hair, shirt, legs, waveSide, longHair = false }) {
  return createPerson(kit, {
    skin,
    hair,
    topCap: Math.PI * 0.4,
    backCap: longHair ? Math.PI * 0.6 : Math.PI * 0.5,
    faceGap: longHair ? 1.7 : 2.2,
    longHair,
    fringe: longHair,
    shirtMaterial: kit.material(shirt),
    sleeveMaterial: kit.material(shirt),
    legs,
    shoes: P.white,
    waveSide,
    pose: "swing",
  });
}

/* ───── Islands ───── */

function buildHiking(kit, people, updaters) {
  const x0 = ISLANDS.hiking;
  const island = islandBase(kit, x0, P.grassVancouver);
  const peak = { x: x0 - 0.6, z: -1.3, radius: 3.4, height: 4.2 };
  const mountain = createMountain(kit, peak.radius, peak.height, "#7fb38a");
  island.add(placed(mountain, peak.x, TOP - 0.02, peak.z));
  const lake = placed(kit.mesh(new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2), "#55c1de", { castShadow: false }), x0 + 2.8, TOP + 0.02, 2.2);
  lake.scale.set(1.5, 1, 0.9);
  island.add(lake);
  for (const [dx, dz, scale] of [[-4.4, 0.8, 0.9], [-3.6, 2.6, 0.8], [3.6, -2.4, 0.9], [4.4, -0.4, 0.75], [1.8, 3.8, 0.7], [-1.6, 4.2, 0.8], [3.8, 0.8, 0.6]]) {
    island.add(placed(createPine(kit, scale), x0 + dx, TOP, dz));
  }

  // A switchback trail spiralling up the mountain, marked with stepping stones.
  const trail = (s) => {
    const angle = 0.6 + s * Math.PI * 2.4;
    const radius = 4.0 - s * 3.25;
    const dx = Math.cos(angle) * radius;
    const dz = Math.sin(angle) * radius;
    return new THREE.Vector3(peak.x + dx, TOP + coneHeight(dx, dz, peak.radius, peak.height) + 0.02, peak.z + dz);
  };
  const stoneGeometry = roundedBox(0.2, 0.04, 0.2, 0.02);
  for (let s = 0; s <= 1; s += 0.018) {
    const point = trail(s);
    island.add(placed(kit.mesh(stoneGeometry, "#e9c46a", { castShadow: false }), point.x, point.y, point.z));
  }
  const summitFlag = createFlag(kit, drawCanadaFlag);
  summitFlag.object.scale.setScalar(0.45);
  summitFlag.object.position.set(peak.x, TOP + peak.height - 0.1, peak.z);
  island.add(summitFlag.object);
  updaters.push((time) => summitFlag.update(time));

  const { wife, husband } = createHostPair(kit, { wife: { pose: "walk" }, husband: { pose: "walk" } });
  addBackpack(kit, wife, "#f77f00");
  addBackpack(kit, husband, "#2a9d8f");
  const hikers = [
    { person: wife, offset: 0 },
    { person: husband, offset: -0.05 },
  ];
  const heading = new THREE.Vector3();
  for (const { person } of hikers) {
    person.object.scale.setScalar(PERSON_SCALE);
    people.push(person);
    island.add(person.object);
  }
  updaters.push((time) => {
    // Up the trail and back down again, forever.
    const cycle = (time * 0.045) % 2;
    const goingUp = cycle < 1;
    for (const { person, offset } of hikers) {
      const s = THREE.MathUtils.clamp((goingUp ? cycle : 2 - cycle) + offset * (goingUp ? 1 : -1), 0, 1);
      const here = trail(s);
      const ahead = trail(THREE.MathUtils.clamp(s + (goingUp ? 0.01 : -0.01), 0, 1));
      person.object.position.copy(here);
      heading.subVectors(ahead, here);
      person.object.rotation.y = Math.atan2(heading.x, heading.z);
    }
  });
  return island;
}

function buildSnow(kit, people, updaters) {
  const x0 = ISLANDS.snow;
  const island = islandBase(kit, x0, "#f4f8fc", "#d6ecf7");
  const peak = { x: x0, z: -1.0, radius: 4.2, height: 4.4 };
  island.add(placed(kit.mesh(new THREE.ConeGeometry(peak.radius, peak.height, 40), "#eef4fb"), peak.x, TOP + peak.height / 2 - 0.02, peak.z));
  for (const [dx, dz, scale] of [[-4.2, 1.6, 0.8], [-3.2, 3.2, 0.7], [-4.6, -1.6, 0.9], [4.6, -2.2, 0.8], [2.4, 4.0, 0.6], [-1.6, 4.6, 0.7]]) {
    const pine = createPine(kit, scale);
    pine.add(placed(kit.mesh(new THREE.ConeGeometry(0.36, 0.34, 10), P.white, { castShadow: false }), 0, 2.15, 0));
    island.add(placed(pine, x0 + dx, TOP, dz));
  }
  // Lodge with a smoking chimney
  const lodge = new THREE.Group();
  lodge.add(placed(kit.mesh(roundedBox(1.4, 0.8, 1.0, 0.08), "#a8714f"), 0, 0.4, 0));
  const lodgeRoof = kit.mesh(new THREE.ConeGeometry(1.15, 0.7, 4), P.white, { flat: true });
  lodgeRoof.rotation.y = Math.PI / 4;
  lodgeRoof.scale.z = 0.8;
  lodge.add(placed(lodgeRoof, 0, 1.15, 0));
  lodge.add(placed(kit.mesh(roundedBox(0.4, 0.4, 0.05, 0.03), "#ffe9a8", { emissive: "#6b5418", castShadow: false }), 0.3, 0.45, 0.51));
  island.add(placed(lodge, x0 - 3.0, TOP, 2.6, 0.4));

  // Chairlift up the right-hand flank
  const bottom = new THREE.Vector3(x0 + 3.4, TOP + 1.5, 2.3);
  const topX = x0 + 1.0;
  const topZ = -1.4;
  const top = new THREE.Vector3(topX, TOP + coneHeight(topX - peak.x, topZ - peak.z, peak.radius, peak.height) + 1.0, topZ);
  for (const station of [bottom, top]) {
    island.add(cylinderBetween(kit, new THREE.Vector3(station.x, station.y - (station === bottom ? 1.5 : 1.0), station.z), station, 0.06, "#59627a"));
  }
  island.add(cylinderBetween(kit, bottom, top, 0.015, P.ink, { castShadow: false }));
  const chairs = Array.from({ length: 5 }, () => {
    const chair = new THREE.Group();
    chair.userData.dynamic = true;
    chair.add(placed(kit.mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), P.ink, { castShadow: false }), 0, -0.15, 0));
    chair.add(placed(kit.mesh(roundedBox(0.3, 0.06, 0.22, 0.02), "#e63946"), 0, -0.32, 0));
    island.add(chair);
    return chair;
  });
  updaters.push((time) => {
    chairs.forEach((chair, index) => {
      chair.position.lerpVectors(bottom, top, ((time * 0.06 + index / chairs.length) % 1));
    });
  });

  const { wife, husband } = createHostPair(kit, { wife: { pose: "ski" }, husband: { pose: "ski" } });
  addBeanie(kit, wife, "#ff8fab");
  addBeanie(kit, husband, "#264653");
  addSnowboard(kit, wife);
  addSkis(kit, husband);
  const riders = [
    { person: wife, offset: 0, sideways: true, phaseOffset: 0.5 },
    { person: husband, offset: 0, sideways: false, phaseOffset: 0 },
  ];
  for (const { person } of riders) {
    person.object.scale.setScalar(PERSON_SCALE);
    people.push(person);
    island.add(person.object);
  }
  const run = (u, direction) => {
    const dz = 0.5 + u * 3.6;
    const dx = Math.sin(u * Math.PI * 3) * (0.4 + u * 1.0) * direction;
    return new THREE.Vector3(peak.x + dx, TOP + coneHeight(dx, dz, peak.radius, peak.height) + 0.02, peak.z + dz);
  };
  const heading = new THREE.Vector3();
  updaters.push((time) => {
    for (const { person, sideways, phaseOffset } of riders) {
      const phase = (time * 0.07 + phaseOffset) % 1;
      const direction = sideways ? -1 : 1;
      if (phase < 0.62) {
        // Carving down the slope
        const u = phase / 0.62;
        const here = run(u, direction);
        heading.subVectors(run(Math.min(1, u + 0.01), direction), here);
        person.object.position.copy(here);
        person.object.rotation.y = Math.atan2(heading.x, heading.z) + (sideways ? Math.PI / 2 : 0);
        person.setPose("ski");
      } else {
        // Riding the chairlift back up, waving
        const v = (phase - 0.62) / 0.38;
        person.object.position.lerpVectors(bottom, top, v);
        person.object.position.y -= 0.62;
        person.object.rotation.y = 0.3;
        person.setPose("wave");
      }
    }
  });
  return island;
}

function buildPickleball(kit, people, updaters) {
  const x0 = ISLANDS.pickleball;
  const island = islandBase(kit, x0, P.grassTokyo);
  const courtZ = 0.4;
  island.add(placed(kit.mesh(roundedBox(7.0, 0.06, 4.0, 0.03), "#6fbf7f", { castShadow: false }), x0, TOP + 0.03, courtZ));
  island.add(placed(kit.mesh(roundedBox(5.6, 0.06, 2.8, 0.02), "#3f7fbf", { castShadow: false }), x0, TOP + 0.05, courtZ));
  const line = (width, depth, x, z) =>
    island.add(placed(kit.mesh(roundedBox(width, 0.02, depth, 0.008), P.white, { castShadow: false }), x, TOP + 0.085, z));
  line(5.6, 0.05, x0, courtZ - 1.4);
  line(5.6, 0.05, x0, courtZ + 1.4);
  line(0.05, 2.8, x0 - 2.8, courtZ);
  line(0.05, 2.8, x0 + 2.8, courtZ);
  for (const side of [-1, 1]) {
    line(0.05, 2.8, x0 + side * 0.9, courtZ);
    line(1.9, 0.05, x0 + side * 1.85, courtZ);
  }
  // Net
  for (const side of [-1, 1]) island.add(placed(kit.mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), "#3b3d4f"), x0, TOP + 0.3, courtZ + side * 1.6));
  island.add(placed(kit.mesh(roundedBox(0.03, 0.34, 3.1, 0.01), "#f2f4f7"), x0, TOP + 0.3, courtZ));
  island.add(placed(kit.mesh(roundedBox(0.05, 0.05, 3.15, 0.02), P.white), x0, TOP + 0.48, courtZ));
  // Bench and trees
  const bench = new THREE.Group();
  bench.add(placed(kit.mesh(roundedBox(1.4, 0.08, 0.36, 0.03), "#c99566"), 0, 0.42, 0));
  for (const side of [-1, 1]) bench.add(placed(kit.mesh(roundedBox(0.08, 0.42, 0.32, 0.02), "#9a6b45"), side * 0.6, 0.21, 0));
  bench.add(placed(kit.mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.22, 10), "#4cc9f0"), 0.3, 0.57, 0));
  island.add(placed(bench, x0, TOP, -2.6));
  for (const [dx, dz] of [[-4.6, -1.8], [4.7, -1.4], [-3.4, 3.6], [3.6, 3.8]]) island.add(placed(createRoundTree(kit, "#7cc96b", 1.0), x0 + dx, TOP, dz));

  const { wife, husband } = createHostPair(kit, { wife: { pose: "swing" }, husband: { pose: "swing" } });
  const guests = [
    createGuest(kit, { skin: "#e0ac85", hair: "#5a3825", shirt: "#f4a261", legs: "#2e3142", waveSide: 1 }),
    createGuest(kit, { skin: "#f6d3bb", hair: "#8d5b3c", shirt: "#ff8fab", legs: "#3e5c8a", waveSide: -1, longHair: true }),
  ];
  const players = [
    { person: wife, x: x0 - 1.9, z: courtZ - 0.7, facing: Math.PI / 2, paddle: "#2a9d8f" },
    { person: husband, x: x0 - 1.9, z: courtZ + 0.7, facing: Math.PI / 2, paddle: "#f4a261" },
    { person: guests[0], x: x0 + 1.9, z: courtZ - 0.7, facing: -Math.PI / 2, paddle: "#e63946" },
    { person: guests[1], x: x0 + 1.9, z: courtZ + 0.7, facing: -Math.PI / 2, paddle: "#9b5de5" },
  ];
  players.forEach(({ person, x, z, facing, paddle }, index) => {
    addPaddle(kit, person, paddle);
    person.object.scale.setScalar(PERSON_SCALE);
    island.add(placed(person.object, x, TOP + 0.08, z, facing));
    people.push(person);
    person.offset = index * 0.7;
  });

  const ball = kit.mesh(new THREE.SphereGeometry(0.08, 14, 10), "#d8f35a");
  ball.userData.dynamic = true;
  island.add(ball);
  updaters.push((time) => {
    // A friendly rally: the ball crosses the net, alternating players.
    const rate = 0.85;
    const crossing = Math.floor(time * rate);
    const frac = (time * rate) % 1;
    const leftZ = crossing % 4 < 2 ? courtZ - 0.7 : courtZ + 0.7;
    const rightZ = crossing % 4 === 1 || crossing % 4 === 2 ? courtZ + 0.7 : courtZ - 0.7;
    const fromLeft = crossing % 2 === 0;
    const startX = fromLeft ? x0 - 1.6 : x0 + 1.6;
    const endX = fromLeft ? x0 + 1.6 : x0 - 1.6;
    const startZ = fromLeft ? leftZ : rightZ;
    const endZ = fromLeft ? rightZ : leftZ;
    ball.position.set(
      THREE.MathUtils.lerp(startX, endX, frac),
      TOP + 0.75 + Math.sin(Math.PI * frac) * 0.9,
      THREE.MathUtils.lerp(startZ, endZ, frac),
    );
  });
  return island;
}

function buildFood(kit, people, updaters) {
  const x0 = ISLANDS.food;
  const island = islandBase(kit, x0, P.grassVancouver);
  island.add(placed(kit.mesh(new THREE.CylinderGeometry(3.8, 3.8, 0.2, 40), "#d9a86c"), x0, TOP + 0.1, 0.2));
  const tableTop = TOP + 0.2;
  const table = diningTable(kit, 4);
  table.scale.setScalar(1.15);
  island.add(placed(table, x0, tableTop, 0.2));

  // String lights between four poles
  const poles = [
    new THREE.Vector3(x0 - 3.0, tableTop + 2.6, -2.2),
    new THREE.Vector3(x0 + 3.0, tableTop + 2.6, -2.2),
    new THREE.Vector3(x0 + 3.0, tableTop + 2.6, 2.6),
    new THREE.Vector3(x0 - 3.0, tableTop + 2.6, 2.6),
  ];
  const bulbGeometry = new THREE.SphereGeometry(0.08, 10, 8);
  const bulbColors = ["#ffd166", "#ff8fab", "#9fe0f2", "#caffbf"];
  poles.forEach((pole, index) => {
    island.add(cylinderBetween(kit, new THREE.Vector3(pole.x, tableTop, pole.z), pole, 0.05, "#59627a"));
    const next = poles[(index + 1) % poles.length];
    const middle = new THREE.Vector3().lerpVectors(pole, next, 0.5);
    middle.y -= 0.6;
    const strand = new THREE.QuadraticBezierCurve3(pole, middle, next);
    island.add(kit.mesh(new THREE.TubeGeometry(strand, 24, 0.012, 4), P.ink, { castShadow: false }));
    for (let step = 1; step < 8; step += 1) {
      const point = strand.getPoint(step / 8);
      island.add(placed(kit.mesh(bulbGeometry, bulbColors[(step + index) % bulbColors.length], { emissive: "#5a4a10", castShadow: false }), point.x, point.y - 0.08, point.z));
    }
  });
  for (const [dx, dz] of [[-3.4, 2.9], [3.4, 2.9], [3.5, -2.5]]) island.add(placed(plant(kit, 1.1), x0 + dx, tableTop, dz));
  for (const [dx, dz] of [[-4.8, -1.6], [4.8, 1.2], [-1.2, -4.8]]) island.add(placed(createPine(kit, 0.9), x0 + dx, TOP, dz));

  // Steam rising from the hot pot
  const steamGeometry = new THREE.SphereGeometry(0.12, 10, 8);
  const steam = Array.from({ length: 6 }, () => {
    const puff = kit.mesh(steamGeometry, P.white, { castShadow: false });
    puff.userData.dynamic = true;
    island.add(puff);
    return puff;
  });
  const potTop = new THREE.Vector3(x0, tableTop + 1.15, 0.2);
  updaters.push((time) => {
    steam.forEach((puff, index) => {
      const phase = (time * 0.35 + index / steam.length) % 1;
      puff.position.set(potTop.x + Math.sin(phase * 6 + index) * 0.12, potTop.y + phase * 1.1, potTop.z);
      puff.scale.setScalar(0.6 + phase * 0.9 - phase * phase * 0.8);
    });
  });

  const { wife, husband } = createHostPair(kit, { wife: { pose: "cheer" }, husband: { pose: "wave" } });
  for (const [person, dx, dz, facing] of [[wife, -0.8, 1.6, 0.2], [husband, 1.0, 1.7, -0.2]]) {
    person.object.scale.setScalar(PERSON_SCALE * 1.1);
    island.add(placed(person.object, x0 + dx, tableTop, dz, facing));
    people.push(person);
  }
  return island;
}

export async function createActivitiesView({ reducedMotion, createTimeSlicer, invalidate }) {
  const slice = createTimeSlicer();
  const kit = createToonKit();
  const scene = new THREE.Scene();
  const skyDome = createSkyDome(kit);
  scene.add(skyDome);
  scene.fog = new THREE.Fog(SKY_HORIZON, 60, 200);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 1400);

  scene.add(new THREE.HemisphereLight("#fff6e8", "#7fb8c9", 1.7));
  const sunLight = new THREE.DirectionalLight("#ffffff", 2.1);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight, sunLight.target);
  const sunDirection = new THREE.Vector3(-0.45, 1, 0.55).normalize();

  const ocean = createOcean(kit);
  scene.add(ocean.object);

  const people = [];
  const updaters = [];
  const islands = [];
  for (const build of [buildHiking, buildSnow, buildPickleball, buildFood]) {
    const island = build(kit, people, updaters);
    for (const person of people) person.object.userData.dynamic = true;
    scene.add(island);
    islands.push(island);
    await slice();
  }
  for (const island of islands) await mergeStaticMeshes(kit, island, slice);

  const rig = createCameraRig(camera, ACTIVITY_STOPS);
  let progress = 0;
  let elapsed = 0;

  function update(deltaSeconds) {
    elapsed += reducedMotion ? 0 : deltaSeconds;
    const { distance, fitWidth, target } = rig.update(progress, deltaSeconds);
    skyDome.position.copy(camera.position);
    scene.fog.near = distance * 1.3 + 6;
    scene.fog.far = distance * 3.4 + 60;
    fitShadowToView(sunLight, sunDirection, target, fitWidth);
    ocean.update(elapsed);
    for (const updater of updaters) updater(elapsed);
    people.forEach((person, index) => person.update(elapsed, person.offset ?? index * 0.4));
  }

  return {
    scene,
    camera,
    resize: (width, height) => rig.resize(width, height),
    update,
    setProgress(value) {
      progress = THREE.MathUtils.clamp(value, 0, 1);
      invalidate();
    },
    dispose: () => kit.dispose(),
  };
}
