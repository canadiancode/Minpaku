import * as THREE from "three";
import { createToonKit, palette as P, roundedBox } from "../hero3d/toonKit.js";
import { createPine, createRoundTree } from "../hero3d/props.js";
import { createHostPair } from "../where3d/home.js";
import { createCameraRig, fitShadowToView } from "../stage/cameraRig.js";
import { createSkyDome, SKY_HORIZON } from "../stage/environment.js";
import { mergeStaticMeshes } from "../stage/mergeStatic.js";
import { STORY_STOPS } from "./storyStops.js";
import {
  bed,
  bookshelf,
  coffeeTable,
  diningTable,
  dresser,
  gearWall,
  kitchen,
  kitchenIsland,
  nightstand,
  pendantLight,
  plant,
  rug,
  sofa,
  television,
  toilet,
  vanity,
  wallWindow,
  welcomeSet,
} from "./furniture.js";

const WIDTH = 9;
const DEPTH = 7;
const STOREY = 2.6;
const WALL = 0.16;
const GROUND = 0.25; // ground-floor finish
const UPPER = GROUND + STOREY; // upstairs finish
const EAST_WALL_X = 0.8; // partition between the east rooms and the open west side
const HALL_WEST_X = -0.7; // downstairs hallway / TV lounge partition
const INTERIOR = "#fbf3e6";

function placed(object, x, y, z, rotationY = 0) {
  object.position.set(x, y, z);
  object.rotation.y = rotationY;
  return object;
}

/** Wall along z (constant x) from z0 to z1, leaving door gaps `[from, to]`. */
function wallAlongZ(kit, x, z0, z1, y, height, gaps = [], color = INTERIOR) {
  const pieces = [];
  let cursor = z0;
  for (const [from, to] of [...gaps, [z1, z1]]) {
    if (from - cursor > 0.05) {
      pieces.push(placed(kit.mesh(roundedBox(WALL, height, from - cursor, 0.04), color), x, y + height / 2, (cursor + from) / 2));
      if (to > from) pieces.push(placed(kit.mesh(roundedBox(WALL, height - 2.1, to - from, 0.04), color), x, y + 2.1 + (height - 2.1) / 2, (from + to) / 2));
    }
    cursor = to;
  }
  return pieces;
}

function halfWall(kit, x0, x1, z, y) {
  return placed(kit.mesh(roundedBox(x1 - x0, 0.9, WALL, 0.05), INTERIOR), (x0 + x1) / 2, y + 0.45, z);
}

function floorPatch(kit, x0, x1, z0, z1, y, color) {
  return placed(kit.mesh(roundedBox(x1 - x0, 0.04, z1 - z0, 0.015), color, { castShadow: false }), (x0 + x1) / 2, y + 0.02, (z0 + z1) / 2);
}

function gableRoof(kit) {
  const span = DEPTH + 1.0;
  const shape = new THREE.Shape();
  shape.moveTo(-span / 2, 0);
  shape.lineTo(span / 2, 0);
  shape.lineTo(0, 2.3);
  shape.closePath();
  const length = WIDTH + 0.9;
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 2 })
    .translate(0, 0, -length / 2)
    .rotateY(-Math.PI / 2);
  return kit.mesh(geometry, "#59627a");
}

function buildStructure(kit) {
  const structure = new THREE.Group();
  const add = (...objects) => structure.add(...objects);
  const fullHeight = STOREY * 2;

  add(placed(kit.mesh(roundedBox(WIDTH + 0.4, GROUND, DEPTH + 0.4, 0.06), "#d9d3c7"), 0, GROUND / 2, 0));
  // Exterior walls that stay put (north, west, east)
  add(placed(kit.mesh(roundedBox(WIDTH, fullHeight, WALL, 0.05), INTERIOR), 0, GROUND + STOREY, -DEPTH / 2 + WALL / 2));
  add(placed(kit.mesh(roundedBox(WALL, fullHeight, DEPTH, 0.05), INTERIOR), -WIDTH / 2 + WALL / 2, GROUND + STOREY, 0));
  add(placed(kit.mesh(roundedBox(WALL, fullHeight, DEPTH, 0.05), INTERIOR), WIDTH / 2 - WALL / 2, GROUND + STOREY, 0));

  // Upstairs floor slab with an opening over the stairs
  const slabY = UPPER - 0.11;
  add(placed(kit.mesh(roundedBox(HALL_WEST_X + WIDTH / 2, 0.22, DEPTH, 0.04), "#efe3cf"), (-WIDTH / 2 + HALL_WEST_X) / 2, slabY, 0));
  add(placed(kit.mesh(roundedBox(WIDTH / 2 - EAST_WALL_X, 0.22, DEPTH, 0.04), "#efe3cf"), (EAST_WALL_X + WIDTH / 2) / 2, slabY, 0));
  add(placed(kit.mesh(roundedBox(EAST_WALL_X - HALL_WEST_X, 0.22, DEPTH / 2 + 1.6, 0.04), "#efe3cf"), (EAST_WALL_X + HALL_WEST_X) / 2, slabY, (DEPTH / 2 - 1.6) / 2));

  // Floor finishes
  add(floorPatch(kit, -WIDTH / 2, HALL_WEST_X, -DEPTH / 2, DEPTH / 2, GROUND, "#dcb48a")); // TV lounge
  add(floorPatch(kit, HALL_WEST_X, EAST_WALL_X, -DEPTH / 2, DEPTH / 2, GROUND, "#d3a878")); // hallway
  add(floorPatch(kit, EAST_WALL_X, WIDTH / 2, -DEPTH / 2, -0.7, GROUND, "#e8dcf2")); // NE guest room
  add(floorPatch(kit, EAST_WALL_X, WIDTH / 2, -0.7, 0.7, GROUND, "#d6eef6")); // washroom
  add(floorPatch(kit, EAST_WALL_X, WIDTH / 2, 0.7, DEPTH / 2, GROUND, "#fde2e4")); // SE guest room
  add(floorPatch(kit, -WIDTH / 2, EAST_WALL_X, -DEPTH / 2, DEPTH / 2, UPPER, "#e6c49c")); // kitchen + living
  add(floorPatch(kit, EAST_WALL_X, WIDTH / 2, -DEPTH / 2, 0, UPPER, "#e9e1f3")); // our room
  add(floorPatch(kit, EAST_WALL_X, WIDTH / 2, 0, DEPTH / 2, UPPER, "#dff6f3")); // upstairs guest room

  // Downstairs partitions
  add(...wallAlongZ(kit, EAST_WALL_X, -DEPTH / 2, DEPTH / 2, GROUND, STOREY - 0.1, [[-2.2, -1.4], [-0.35, 0.35], [1.5, 2.3]]));
  add(...wallAlongZ(kit, HALL_WEST_X, -DEPTH / 2, DEPTH / 2, GROUND, STOREY - 0.1, [[-0.2, 1.8]]));
  add(halfWall(kit, EAST_WALL_X, WIDTH / 2, -0.7, GROUND), halfWall(kit, EAST_WALL_X, WIDTH / 2, 0.7, GROUND));
  // Upstairs partitions
  add(...wallAlongZ(kit, EAST_WALL_X, -DEPTH / 2, DEPTH / 2, UPPER, STOREY - 0.1, [[-1.4, -0.6], [0.6, 1.4]]));
  add(halfWall(kit, EAST_WALL_X, WIDTH / 2, 0, UPPER));

  // Stairs climbing north from the downstairs hallway
  const steps = 10;
  for (let index = 0; index < steps; index += 1) {
    const rise = STOREY / steps;
    const step = kit.mesh(roundedBox(1.3, rise * (index + 1), 0.2, 0.03), "#c99566");
    add(placed(step, (HALL_WEST_X + EAST_WALL_X) / 2, GROUND + (rise * (index + 1)) / 2, -1.7 - index * 0.18));
  }
  // Railing around the stair opening upstairs
  add(placed(kit.mesh(roundedBox(0.06, 0.9, 1.9, 0.02), "#c99566"), HALL_WEST_X + 0.05, UPPER + 0.45, -2.55));
  add(placed(kit.mesh(roundedBox(1.5, 0.9, 0.06, 0.02), "#c99566"), (HALL_WEST_X + EAST_WALL_X) / 2, UPPER + 0.45, -1.6));

  // Windows
  const windows = [
    [-WIDTH / 2 + 0.05, GROUND + 1.5, -1.8, Math.PI / 2], // lounge
    [WIDTH / 2 - 0.05, GROUND + 1.5, -2.1, -Math.PI / 2], // NE guest room
    [WIDTH / 2 - 0.05, GROUND + 1.5, 2.1, -Math.PI / 2], // SE guest room
    [-WIDTH / 2 + 0.05, UPPER + 1.5, -2.0, Math.PI / 2], // kitchen
    [-WIDTH / 2 + 0.05, UPPER + 1.5, 2.0, Math.PI / 2], // living
    [WIDTH / 2 - 0.05, UPPER + 1.5, -1.8, -Math.PI / 2], // our room
    [WIDTH / 2 - 0.05, UPPER + 1.5, 1.9, -Math.PI / 2], // upstairs guest room
    [2.7, UPPER + 1.5, -DEPTH / 2 + 0.05, 0], // our room, north
  ];
  for (const [x, y, z, rotation] of windows) add(placed(wallWindow(kit), x, y, z, rotation));
  return structure;
}

function buildFurniture(kit) {
  const furniture = new THREE.Group();
  const add = (object, x, y, z, rotation = 0) => furniture.add(placed(object, x, y, z, rotation));

  // Downstairs: NE guest room
  add(rug(kit, 1.8, 1.0, "#cdb4db"), 2.8, GROUND, -1.3);
  add(bed(kit, { duvet: "#ffadc0" }), 2.9, GROUND, -2.35);
  add(welcomeSet(kit), 2.9, GROUND + 0.55, -1.75);
  add(nightstand(kit), 4.05, GROUND, -3.05);
  add(plant(kit), 1.25, GROUND, -3.05);
  // Washroom
  add(toilet(kit), 4.1, GROUND, 0, -Math.PI / 2);
  add(vanity(kit), 2.3, GROUND, -0.4);
  // SE guest room
  add(rug(kit, 1.6, 1.4, "#ffd6a5"), 2.4, GROUND, 2.2);
  add(bed(kit, { duvet: "#a0c4ff" }), 3.4, GROUND, 2.1, -Math.PI / 2);
  add(welcomeSet(kit), 2.85, GROUND + 0.55, 2.1);
  add(nightstand(kit), 4.05, GROUND, 3.15);
  add(plant(kit), 1.25, GROUND, 3.15);
  // TV lounge
  add(rug(kit, 2.6, 2.2, "#bde0fe"), -2.8, GROUND, 0.6);
  add(coffeeTable(kit), -2.95, GROUND, 0.6, Math.PI / 2);
  add(sofa(kit, { width: 2.2 }), -1.75, GROUND, 0.6, -Math.PI / 2);
  add(bookshelf(kit), -3.3, GROUND, -3.2);
  add(plant(kit, 1.2), -1.25, GROUND, -3.05);
  const beanbag = kit.mesh(new THREE.SphereGeometry(0.42, 18, 12), "#f4a261");
  beanbag.scale.y = 0.6;
  add(beanbag, -2.4, GROUND + 0.24, 2.7);

  // Upstairs: kitchen + dining + living (one open space)
  add(kitchen(kit), -2.3, UPPER, -3.1);
  add(kitchenIsland(kit), -2.4, UPPER, -1.65);
  add(pendantLight(kit), -2.9, UPPER + 2.5, -1.65);
  add(pendantLight(kit), -1.9, UPPER + 2.5, -1.65);
  add(diningTable(kit), -2.4, UPPER, 0.35);
  add(rug(kit, 2.6, 2.0, "#ffc8dd"), -3.0, UPPER, 2.35);
  add(sofa(kit, { width: 2.2, color: "#2a9d8f", cushion: "#57c2b6" }), -4.0, UPPER, 2.35, Math.PI / 2);
  add(coffeeTable(kit), -2.85, UPPER, 2.35, Math.PI / 2);
  add(plant(kit, 1.3), 0.2, UPPER, 3.1);
  add(gearWall(kit), 0.62, UPPER, 2.0, -Math.PI / 2);
  // Our room
  add(rug(kit, 2.0, 1.2, "#b8c0ff"), 2.8, UPPER, -1.0);
  add(bed(kit, { width: 1.9, duvet: "#cdb4db" }), 2.8, UPPER, -2.35);
  add(nightstand(kit), 1.45, UPPER, -3.1);
  add(nightstand(kit), 4.15, UPPER, -3.1);
  add(dresser(kit), 4.1, UPPER, -0.6, -Math.PI / 2);
  // Upstairs guest room
  add(rug(kit, 1.6, 1.4, "#caffbf"), 2.4, UPPER, 2.0);
  add(bed(kit, { duvet: "#ffd166" }), 3.4, UPPER, 1.9, -Math.PI / 2);
  add(welcomeSet(kit), 2.85, UPPER + 0.55, 1.9);
  add(nightstand(kit), 4.05, UPPER, 3.15);

  const tv = television(kit);
  add(tv.object, -4.15, GROUND, 0.6, Math.PI / 2);
  return { furniture, tvScreen: tv.screen };
}

/** Front wall + roof: the dollhouse lid that lifts away. */
function buildFacade(kit) {
  const facade = new THREE.Group();
  const add = (object, x, y, z, rotation = 0) => facade.add(placed(object, x, y, z, rotation));
  const front = DEPTH / 2 - WALL / 2;
  add(kit.mesh(roundedBox(WIDTH, STOREY, WALL, 0.05), "#f6e7c8"), 0, GROUND + STOREY / 2, front);
  add(kit.mesh(roundedBox(WIDTH, STOREY, WALL, 0.05), "#9cc9b3"), 0, UPPER + STOREY / 2, front);
  add(kit.mesh(roundedBox(WIDTH + 0.12, 0.12, WALL + 0.12, 0.04), P.white), 0, UPPER, front);
  const roof = gableRoof(kit);
  roof.position.set(0, UPPER + STOREY, 0);
  facade.add(roof);
  add(kit.mesh(roundedBox(0.6, 1.4, 0.6, 0.06), "#b5654a"), -2.8, UPPER + STOREY + 1.4, -1.6);

  const outside = DEPTH / 2 + 0.04;
  add(kit.mesh(roundedBox(0.9, 1.9, 0.1, 0.06), P.brand), 0.05, GROUND + 0.95, outside);
  add(kit.mesh(new THREE.SphereGeometry(0.06, 10, 8), P.yellow), 0.35, GROUND + 0.95, outside + 0.07);
  add(kit.mesh(roundedBox(1.8, 0.12, 1.0, 0.04), "#59627a"), 0.05, GROUND + 2.15, outside + 0.45);
  for (const side of [-1, 1]) add(kit.mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 8), P.white), 0.05 + side * 0.8, GROUND + 1.05, outside + 0.85);
  add(kit.mesh(roundedBox(1.5, 0.2, 0.7, 0.05), "#cfc7ba"), 0.05, 0.1, outside + 0.4);
  for (const [x, y, w] of [[-2.6, GROUND + 1.4, 1.6], [2.6, GROUND + 1.4, 1.6], [-2.6, UPPER + 1.4, 2.2], [2.6, UPPER + 1.4, 1.6]]) {
    add(wallWindow(kit, w, 1.0), x, y, outside);
  }
  add(kit.mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24).rotateX(Math.PI / 2), "#bfe9f5", { emissive: "#2b3b44" }), 0, UPPER + STOREY + 1.05, DEPTH / 2 + 0.42);
  return facade;
}

function buildGarden(kit) {
  const garden = new THREE.Group();
  const add = (object, x, y, z, rotation = 0) => garden.add(placed(object, x, y, z, rotation));
  add(kit.mesh(new THREE.CircleGeometry(60, 48).rotateX(-Math.PI / 2), "#a6e391", { castShadow: false }), 0, -0.01, 0);
  add(kit.mesh(roundedBox(1.4, 0.04, 4.2, 0.02), "#e6dccb", { castShadow: false }), 0.05, 0.02, DEPTH / 2 + 2.4);
  add(kit.mesh(roundedBox(60, 0.04, 2.6, 0.02), P.road, { castShadow: false }), 0, 0.02, DEPTH / 2 + 5.4);
  for (let x = -26; x <= 26; x += 2.2) add(kit.mesh(roundedBox(1.0, 0.05, 0.14, 0.02), P.white, { castShadow: false }), x, 0.05, DEPTH / 2 + 5.4);
  const maple = createRoundTree(kit, "#e4572e", 1.6);
  add(maple, -3.4, 0, DEPTH / 2 + 1.8);
  for (const [x, z, scale] of [[-6.6, -2, 1.6], [-7.4, 1.5, 1.4], [6.8, -1.5, 1.7], [7.2, 2.4, 1.3], [-2, -5.6, 1.6], [3.2, -5.8, 1.8], [8.6, -4.8, 1.5]]) {
    add(createPine(kit, scale), x, 0, z);
  }
  const flowerGeometry = new THREE.SphereGeometry(0.12, 10, 8);
  const flowerColors = ["#ff8fab", "#ffd166", "#ffffff", "#c77dff"];
  for (let index = 0; index < 22; index += 1) {
    const x = -4.2 + index * 0.4;
    if (Math.abs(x - 0.05) < 0.9) continue;
    add(kit.mesh(flowerGeometry, flowerColors[index % flowerColors.length], { castShadow: false }), x, 0.1, DEPTH / 2 + 0.5);
  }
  return garden;
}

/** Host positions per stop: [x, y, z, facing, pose] for wife then husband. */
const HOST_SPOTS = {
  hello: [[-0.45, 0, 4.9, 0, "wave"], [0.45, 0, 4.9, 0, "wave"]],
  upstairs: [[-3.1, UPPER, -2.35, 0.3, "wave"], [-1.3, UPPER, 0.9, -0.3, "cheer"]],
  rooms: [[1.55, UPPER, 2.75, -0.4, "wave"], [1.6, GROUND, 1.6, -0.5, "wave"]],
  downstairs: [[-2.7, GROUND, 2.2, 0.4, "cheer"], [-0.05, GROUND, 1.2, -0.2, "wave"]],
  house: [[-3.2, UPPER, 1.35, 0.5, "wave"], [-2.4, UPPER, 1.5, 0.1, "wave"]],
};

export async function createStoryView({ reducedMotion, createTimeSlicer, invalidate }) {
  const slice = createTimeSlicer();
  const kit = createToonKit();
  const scene = new THREE.Scene();
  const skyDome = createSkyDome(kit);
  scene.add(skyDome);
  scene.fog = new THREE.Fog(SKY_HORIZON, 40, 120);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 1400);

  scene.add(new THREE.HemisphereLight("#fff6e8", "#8fbfa0", 1.9));
  const sunLight = new THREE.DirectionalLight("#ffffff", 2.0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight, sunLight.target);
  // Low, frontal sun so light reaches into the downstairs rooms.
  const sunDirection = new THREE.Vector3(-0.35, 0.75, 1).normalize();

  const structure = buildStructure(kit);
  await slice();
  const { furniture, tvScreen } = buildFurniture(kit);
  await slice();
  const facade = buildFacade(kit);
  const garden = buildGarden(kit);
  scene.add(structure, furniture, facade, garden);
  for (const group of [structure, furniture, facade, garden]) await mergeStaticMeshes(kit, group, slice);

  const { wife, husband } = createHostPair(kit);
  const hosts = [wife, husband];
  for (const host of hosts) {
    host.object.scale.setScalar(1.15);
    scene.add(host.object);
  }

  const rig = createCameraRig(camera, STORY_STOPS);
  let progress = 0;
  let elapsed = 0;
  let activeSpot = null;
  let popTime = 1;
  const tvColor = new THREE.Color();

  function spotFor(value) {
    let best = STORY_STOPS[0].id;
    let bestDistance = Infinity;
    for (const stop of STORY_STOPS) {
      const middle = (stop.hold[0] + stop.hold[1]) / 2;
      const distance = Math.abs(value - middle);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = stop.id;
      }
    }
    return best;
  }

  function placeHosts(deltaSeconds) {
    const spot = spotFor(progress);
    if (spot !== activeSpot) {
      activeSpot = spot;
      popTime = reducedMotion ? 1 : 0;
      HOST_SPOTS[spot].forEach(([x, y, z, facing, pose], index) => {
        hosts[index].object.position.set(x, y, z);
        hosts[index].object.rotation.y = facing;
        hosts[index].setPose(pose);
      });
    }
    popTime = Math.min(1, popTime + deltaSeconds * 2.6);
    // Springy pop-in whenever the hosts appear in a new room.
    const pop = popTime >= 1 ? 1 : 1 - Math.cos(popTime * Math.PI * 2.5) * Math.exp(-popTime * 5) * (1 - popTime);
    for (const host of hosts) host.object.scale.setScalar(1.15 * Math.max(0.05, pop));
  }

  function update(deltaSeconds) {
    elapsed += reducedMotion ? 0 : deltaSeconds;
    const { distance, fitWidth, target } = rig.update(progress, deltaSeconds);
    skyDome.position.copy(camera.position);
    scene.fog.near = distance * 1.4 + 6;
    scene.fog.far = distance * 3.5 + 50;
    fitShadowToView(sunLight, sunDirection, target, Math.max(fitWidth, 12));

    // The lid lifts off as we head inside, and settles back for the hello shot.
    const reveal = THREE.MathUtils.smoothstep(progress, 0.08, 0.2);
    facade.position.y = reveal * 14;
    facade.rotation.x = -reveal * 0.25;
    facade.visible = reveal < 0.995;

    placeHosts(deltaSeconds);
    wife.update(elapsed, 0);
    husband.update(elapsed, 0.35);
    tvColor.setHSL((elapsed * 0.05) % 1, 0.55, 0.62);
    tvScreen.material.color.copy(tvColor);
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
