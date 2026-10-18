import * as THREE from "three";
import { cylinderBetween, palette as P, roundedBox } from "./toonKit.js";
import {
  createCar,
  createCherryTree,
  createFlag,
  createPine,
  createRoundTree,
  createSign,
  drawCanadaFlag,
  drawJapanFlag,
} from "./props.js";

export const ISLAND_TOP = 0.5;
export const PAD_TOP = 0.6;
export const ISLAND_CENTER_X = 18;
export const ISLAND_CENTER_Z = -2;

function placed(object, x, y, z) {
  object.position.set(x, y, z);
  return object;
}

/*
 * Cartoon country outlines in world (x, z); north is -z. Each island is a
 * smoothed loop, so a handful of points is enough to read as the country.
 */
const HONSHU = [
  [-14.5, -13.6], [-12.6, -13.4], [-10.8, -11.8], [-9.4, -9.6], [-8.7, -6.5], [-8.4, -3.0], [-8.6, 0.0],
  [-9.0, 3.0], [-10.0, 5.2], [-13.0, 5.9], [-16.5, 5.7], [-19.5, 5.1], [-22.5, 4.7], [-25.5, 4.3],
  [-28.0, 3.2], [-29.6, 1.3], [-28.9, -0.6], [-26.0, -1.6], [-22.8, -2.6], [-20.9, -4.2], [-20.7, -6.6],
  [-19.8, -9.4], [-18.5, -10.8], [-16.5, -12.2],
];

const CANADA = [
  [9.6, 5.4], [9.0, 3.0], [8.7, 0.0], [9.2, -2.6], [10.0, -4.6], [11.4, -5.6], [12.6, -7.0], [12.6, -9.5],
  [12.6, -12.0], [14.5, -12.7], [16.5, -12.1], [18.2, -12.9], [20.0, -12.3], [21.6, -12.8], [22.6, -11.4],
  [22.8, -9.0], [23.6, -7.0], [25.0, -6.0], [26.0, -4.6], [26.9, -6.1], [27.9, -7.8], [28.0, -10.0],
  [27.5, -11.9], [29.2, -12.5], [30.8, -11.0], [32.2, -9.4], [33.2, -7.4], [33.6, -5.4], [32.4, -3.9],
  [33.8, -2.6], [32.8, -1.4], [30.8, -1.8], [29.8, 0.4], [27.8, 1.2], [26.4, 2.6], [25.2, 3.6], [24.2, 5.2],
  [23.0, 3.7], [21.6, 3.4], [20.2, 5.0], [18.0, 5.4], [14.0, 5.4],
];

/** Eastern Canada is squeezed so the whole country fits on screen next to Japan. */
const squeezeEast = ([x, z]) => [x < 22 ? x : 22 + (x - 22) * 0.65, z];

/** Organic little island around (x, z). */
function blob(x, z, radiusX, radiusZ, seed) {
  return Array.from({ length: 10 }, (_, index) => {
    const angle = (index / 10) * Math.PI * 2;
    const wobble = 1 + Math.sin(index * 2.3 + seed) * 0.12;
    return [x + Math.cos(angle) * radiusX * wobble, z + Math.sin(angle) * radiusZ * wobble];
  });
}

const JAPAN_ISLANDS = [
  HONSHU,
  blob(-11.5, -16.4, 2.6, 1.8, 1), // Hokkaido
  blob(-22.8, 7.2, 1.8, 0.8, 2),   // Shikoku
  blob(-29.4, 5.8, 1.3, 2.0, 3),   // Kyushu
];

const CANADA_ISLANDS = [
  CANADA.map(squeezeEast),
  blob(7.6, 3.4, 0.8, 2.0, 4),     // Vancouver Island
  blob(31.4, -4.6, 1.4, 1.3, 5),   // Newfoundland
  blob(14.5, -15.4, 1.4, 1.0, 6),  // Banks Island
  blob(19.5, -15.2, 2.2, 1.2, 7),  // Victoria Island
  blob(23.6, -17.4, 2.2, 1.0, 8),  // Ellesmere Island
  blob(27.4, -15.0, 2.6, 1.5, 9),  // Baffin Island
];

function outlineShape(points) {
  const loop = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "centripetal");
  return new THREE.Shape(loop.getSpacedPoints(Math.max(60, points.length * 10)).map((point) => new THREE.Vector2(point.x, -point.z)));
}

/** Extruded slab whose top sits at `top`; bevel rounds the coast into a bubbly edge. */
function slab(shape, top, depth, bevelThickness, bevelSize) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness,
    bevelSize,
    bevelSegments: 4,
    curveSegments: 1,
  }).rotateX(-Math.PI / 2);
  geometry.translate(0, top - depth - bevelThickness, 0);
  return geometry;
}

function ellipseRing(radiusX, radiusZ, halfWidth, depth) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, radiusX + halfWidth, radiusZ + halfWidth, 0, Math.PI * 2);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, radiusX - halfWidth, radiusZ - halfWidth, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 64 }).rotateX(-Math.PI / 2);
}

/**
 * Country-shaped island with the airstrip the plane uses and a ring road.
 * `side` is -1 for Japan (west) and 1 for Canada (east); landmarks use world (x, z).
 */
function createIslandBase(kit, { side, grassColor, outlines, road }) {
  const group = new THREE.Group();
  const put = (object, x, z, y = ISLAND_TOP) => {
    object.position.set(x, y, z);
    group.add(object);
    return object;
  };

  for (const outline of outlines) {
    const shape = outlineShape(outline);
    group.add(kit.mesh(slab(shape, ISLAND_TOP, 1.4, 0.3, 0.35), grassColor, { castShadow: false }));
    group.add(kit.mesh(slab(shape, 0.24, 0.5, 0.12, 0.95), P.sand, { castShadow: false }));
    group.add(kit.mesh(slab(shape, 0.1, 0.2, 0.05, 1.5), P.foam, { castShadow: false }));
  }

  // Airstrip with two taxi lanes that the plane's path follows (lanes at z 0.6 and 2.4).
  const padCenterX = side * (ISLAND_CENTER_X - 4.1);
  put(kit.mesh(roundedBox(7.6, 0.14, 3.9, 0.06), P.pad), padCenterX, ISLAND_CENTER_Z + 3.5, PAD_TOP - 0.07);
  const dashGeometry = kit.geometry("runway-dash", () => roundedBox(0.55, 0.04, 0.12, 0.02));
  for (const laneZ of [0.6, 2.4]) {
    for (let offset = 1.4; offset <= 7.4; offset += 1.0) {
      put(kit.mesh(dashGeometry, P.white, { castShadow: false }), side * (ISLAND_CENTER_X - offset), laneZ, PAD_TOP);
    }
  }

  put(kit.mesh(ellipseRing(road.radiusX, road.radiusZ, 0.42, 0.06), P.road, { castShadow: false }), road.x, road.z);

  const cars = [];
  function addCars(colors) {
    colors.forEach((color, index) => {
      const car = createCar(kit, color);
      car.userData.dynamic = true;
      group.add(car);
      const clockwise = index % 2 === 1;
      cars.push({
        car,
        clockwise,
        laneOffset: clockwise ? -0.2 : 0.2,
        phase: (index / colors.length) * Math.PI * 2,
        speed: 0.32 + (index % 3) * 0.05,
      });
    });
  }

  function updateCars(time) {
    for (const { car, clockwise, laneOffset, phase, speed } of cars) {
      const direction = clockwise ? -1 : 1;
      const angle = phase + direction * time * speed;
      const radiusX = road.radiusX + laneOffset;
      const radiusZ = road.radiusZ + laneOffset;
      car.position.set(
        road.x + Math.cos(angle) * radiusX,
        ISLAND_TOP + 0.06 + Math.abs(Math.sin(time * 9 + phase)) * 0.035,
        road.z + Math.sin(angle) * radiusZ,
      );
      car.rotation.y = Math.atan2(-Math.sin(angle) * radiusX * direction, Math.cos(angle) * radiusZ * direction);
    }
  }

  return { group, put, addCars, updateCars };
}

function addBuilding(kit, island, x, z, width, height, color) {
  const building = new THREE.Group();
  building.add(placed(kit.mesh(roundedBox(width, height, width, 0.14), color), 0, height / 2, 0));
  building.add(
    placed(kit.mesh(roundedBox(width + 0.12, 0.16, width + 0.12, 0.06), P.white), 0, height + 0.02, 0),
  );
  const windowGeometry = kit.geometry("building-window", () => roundedBox(0.2, 0.24, 0.06, 0.03));
  const columns = Math.max(1, Math.round(width / 0.45));
  for (let row = 0; row * 0.5 + 0.55 < height - 0.2; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const windowMesh = kit.mesh(windowGeometry, P.glass, { castShadow: false });
      windowMesh.position.set((column - (columns - 1) / 2) * 0.42, 0.55 + row * 0.5, width / 2 + 0.01);
      building.add(windowMesh);
    }
  }
  island.put(building, x, z);
  return building;
}

function createTokyoTower(kit) {
  const tower = new THREE.Group();
  const legTop = 2.3;
  for (let index = 0; index < 4; index += 1) {
    const angle = Math.PI / 4 + (index * Math.PI) / 2;
    const base = new THREE.Vector3(Math.cos(angle) * 1.15, 0, Math.sin(angle) * 1.15);
    const top = new THREE.Vector3(Math.cos(angle) * 0.38, legTop, Math.sin(angle) * 0.38);
    tower.add(cylinderBetween(kit, base, top, 0.14, P.towerOrange));
  }
  const stripes = [
    [legTop, 0.62, 0.55, 0.32, P.white],
    [legTop + 0.32, 0.5, 0.42, 1.0, P.towerOrange],
    [legTop + 1.32, 0.42, 0.38, 0.28, P.white],
    [legTop + 1.6, 0.36, 0.22, 1.25, P.towerOrange],
    [legTop + 2.85, 0.22, 0.16, 0.3, P.white],
    [legTop + 3.15, 0.16, 0.06, 1.1, P.towerOrange],
  ];
  for (const [y, radiusBottom, radiusTop, height, color] of stripes) {
    const section = kit.mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 4), color, { flat: true });
    section.rotation.y = Math.PI / 4;
    section.position.y = y + height / 2;
    tower.add(section);
  }
  const mainDeck = kit.mesh(roundedBox(1.15, 0.38, 1.15, 0.12), P.white);
  mainDeck.position.y = legTop + 0.05;
  tower.add(mainDeck);
  const topDeck = kit.mesh(roundedBox(0.6, 0.26, 0.6, 0.08), P.white);
  topDeck.position.y = legTop + 2.9;
  tower.add(topDeck);
  const beacon = kit.mesh(new THREE.SphereGeometry(0.09, 10, 8), P.yellow, { emissive: "#7a4d00" });
  beacon.position.y = legTop + 4.3;
  tower.add(beacon);
  return tower;
}

function createPagoda(kit) {
  const pagoda = new THREE.Group();
  for (let level = 0; level < 5; level += 1) {
    const size = 1.35 - level * 0.16;
    const baseY = level * 0.6;
    const story = kit.mesh(roundedBox(size * 0.7, 0.44, size * 0.7, 0.06), P.shrineRed);
    story.position.y = baseY + 0.22;
    pagoda.add(story);
    const roof = kit.mesh(new THREE.ConeGeometry(size * 0.9, 0.32, 4), P.roofSlate, { flat: true });
    roof.rotation.y = Math.PI / 4;
    roof.position.y = baseY + 0.56;
    pagoda.add(roof);
  }
  const spire = kit.mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 8), P.yellow);
  spire.position.y = 3.3;
  pagoda.add(spire);
  return pagoda;
}

function createTorii(kit) {
  const torii = new THREE.Group();
  for (const side of [-1, 1]) {
    const pillar = kit.mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.9, 12), P.shrineRed);
    pillar.position.set(side * 0.78, 0.95, 0);
    torii.add(pillar);
  }
  const beams = [
    [2.4, 0.17, 0.3, 2.02, P.ink],
    [2.05, 0.14, 0.22, 1.86, P.shrineRed],
    [1.75, 0.12, 0.18, 1.45, P.shrineRed],
  ];
  for (const [width, height, depth, y, color] of beams) {
    const beam = kit.mesh(roundedBox(width, height, depth, 0.05), color);
    beam.position.y = y;
    torii.add(beam);
  }
  return torii;
}

export function createMountain(kit, radius, height, color) {
  const mountain = new THREE.Group();
  mountain.add(placed(kit.mesh(new THREE.ConeGeometry(radius, height, 28), color, { castShadow: false }), 0, height / 2, 0));
  const capHeight = height * 0.32;
  const capRadius = (radius / height) * capHeight + 0.05;
  mountain.add(placed(kit.mesh(new THREE.ConeGeometry(capRadius, capHeight, 28), P.white, { castShadow: false }), 0, height - capHeight / 2 + 0.03, 0));
  return mountain;
}

export function createTokyo(kit) {
  const island = createIslandBase(kit, {
    side: -1,
    grassColor: P.grassTokyo,
    outlines: JAPAN_ISLANDS,
    road: { x: -14.5, z: -5.0, radiusX: 3.8, radiusZ: 2.4 },
  });

  island.put(createTokyoTower(kit), -14.6, -5.0);
  island.put(createPagoda(kit), -24.0, 1.2);
  island.put(createTorii(kit), -20.2, 3.2);

  addBuilding(kit, island, -17.2, -5.0, 0.85, 1.4, "#ffd6a5");
  addBuilding(kit, island, -11.9, -4.9, 0.8, 1.1, "#cdb4db");
  addBuilding(kit, island, -18.0, -9.0, 1.1, 2.6, "#bde0fe");
  addBuilding(kit, island, -16.2, -9.4, 1.0, 3.4, "#ffc8dd");
  addBuilding(kit, island, -14.3, -9.3, 1.1, 2.2, "#fdffb6");
  addBuilding(kit, island, -12.4, -9.0, 1.0, 2.9, "#caffbf");
  addBuilding(kit, island, -10.7, -8.4, 0.9, 1.8, "#a0c4ff");

  const cherryTrees = [
    [-26.6, 1.8, 1.0], [-22.0, 2.8, 0.9], [-21.8, -0.6, 1.0], [-19.4, 1.2, 0.8], [-11.6, -1.4, 0.9],
    [-9.9, -1.8, 0.8], [-16.0, 4.7, 0.9], [-27.6, 0.4, 0.8], [-25.0, -0.4, 0.9], [-12.6, -11.2, 0.9],
    [-14.8, -11.4, 0.8], [-11.5, -16.2, 0.9], [-29.4, 5.6, 0.8], [-22.8, 7.1, 0.7],
  ];
  for (const [x, z, scale] of cherryTrees) island.put(createCherryTree(kit, scale), x, z);

  const flag = createFlag(kit, drawJapanFlag);
  island.put(flag.object, -15.4, -1.3);
  const sign = island.put(createSign(kit, "TOKYO"), -12.8, 4.6);

  island.addCars([P.brand, "#4cc9f0", P.yellow, "#90be6d"]);

  const fuji = createMountain(kit, 9, 7, P.fuji);
  fuji.position.set(-24, 0, -27);
  island.group.add(fuji);

  return {
    group: island.group,
    sign,
    update(time) {
      island.updateCars(time);
      flag.update(time);
    },
  };
}

export function createBCPlace(kit) {
  const stadium = new THREE.Group();
  const radius = 1.75;
  stadium.add(placed(kit.mesh(new THREE.CylinderGeometry(radius, radius + 0.12, 0.85, 40), "#e9eef6"), 0, 0.42, 0));
  stadium.add(placed(kit.mesh(new THREE.CylinderGeometry(radius + 0.02, radius + 0.02, 0.22, 40), P.glass), 0, 0.5, 0));
  const roof = kit.mesh(new THREE.SphereGeometry(radius, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), P.white);
  roof.scale.y = 0.38;
  roof.position.y = 0.85;
  stadium.add(roof);
  const mastGeometry = kit.geometry("bc-mast", () => new THREE.CylinderGeometry(0.045, 0.06, 1.7, 8));
  const tipGeometry = kit.geometry("bc-mast-tip", () => new THREE.SphereGeometry(0.08, 10, 8));
  for (let index = 0; index < 12; index += 1) {
    const angle = (index / 12) * Math.PI * 2;
    const x = Math.cos(angle) * (radius + 0.08);
    const z = Math.sin(angle) * (radius + 0.08);
    stadium.add(placed(kit.mesh(mastGeometry, P.white), x, 1.25, z));
    stadium.add(
      placed(kit.mesh(tipGeometry, P.yellow, { emissive: "#6b4a00", castShadow: false }), x, 2.1, z),
    );
    stadium.add(
      cylinderBetween(kit, new THREE.Vector3(x, 2.05, z), new THREE.Vector3(x * 0.55, 1.35, z * 0.55), 0.015, P.white, {
        castShadow: false,
      }),
    );
  }
  return stadium;
}

export function createHarbourCentre(kit) {
  const tower = new THREE.Group();
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.34, 0.4, 4.4, 16), "#d6dce8"), 0, 2.2, 0));
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.95, 0.7, 0.45, 24), "#9aa6bf"), 0, 4.55, 0));
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.97, 0.97, 0.16, 24), P.glass), 0, 4.6, 0));
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.25, 16), "#d6dce8"), 0, 4.9, 0));
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), P.white), 0, 5.4, 0));
  return tower;
}

export function createScienceWorld(kit) {
  const dome = new THREE.Group();
  dome.add(placed(kit.mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.45, 16), "#c4ccd8"), 0, 0.22, 0));
  dome.add(placed(kit.mesh(new THREE.IcosahedronGeometry(1.1, 1), "#e8eef6", { flat: true }), 0, 1.35, 0));
  return dome;
}

export function createCanadaPlace(kit) {
  const pier = new THREE.Group();
  pier.add(placed(kit.mesh(roundedBox(1.2, 0.5, 3.2, 0.14), "#eef2f8"), 0, 0.25, 0));
  const sailGeometry = kit.geometry("sail", () => new THREE.ConeGeometry(0.4, 1.1, 14));
  for (let index = 0; index < 5; index += 1) {
    pier.add(placed(kit.mesh(sailGeometry, P.white), 0, 1.0, -1.2 + index * 0.6));
  }
  return pier;
}

export function createInukshuk(kit) {
  const inukshuk = new THREE.Group();
  const stones = [
    [0.26, 0.6, 0.26, -0.24, 0.3],
    [0.26, 0.6, 0.26, 0.24, 0.3],
    [0.95, 0.26, 0.32, 0, 0.73],
    [0.34, 0.36, 0.28, 0, 1.03],
    [1.25, 0.2, 0.28, 0, 1.3],
    [0.34, 0.32, 0.28, 0, 1.56],
  ];
  for (const [width, height, depth, x, y] of stones) {
    inukshuk.add(placed(kit.mesh(roundedBox(width, height, depth, 0.07), P.stone), x, y, 0));
  }
  return inukshuk;
}

function addGlassTower(kit, island, x, z, width, height) {
  const tower = new THREE.Group();
  tower.add(placed(kit.mesh(roundedBox(width, height, width, 0.16), "#8fd0e6"), 0, height / 2, 0));
  const bandGeometry = kit.geometry(`glass-band-${width}`, () => roundedBox(width + 0.04, 0.06, width + 0.04, 0.02));
  for (let y = 0.6; y < height - 0.2; y += 0.6) {
    tower.add(placed(kit.mesh(bandGeometry, "#e6f6fb", { castShadow: false }), 0, y, 0));
  }
  island.put(tower, x, z);
}

export function createVancouver(kit) {
  const island = createIslandBase(kit, {
    side: 1,
    grassColor: P.grassVancouver,
    outlines: CANADA_ISLANDS,
    road: { x: 17.6, z: -5.0, radiusX: 3.8, radiusZ: 2.4 },
  });

  island.put(createBCPlace(kit), 17.6, -5.0);
  island.put(createHarbourCentre(kit), 19.9, -9.7);
  island.put(createScienceWorld(kit), 11.4, -2.8);
  island.put(createCanadaPlace(kit), 22.4, -0.6);
  island.put(createInukshuk(kit), 19.6, 3.4);

  addGlassTower(kit, island, 14.4, -9.1, 1.0, 3.6);
  addGlassTower(kit, island, 16.2, -9.6, 0.9, 2.8);
  addGlassTower(kit, island, 18.0, -9.3, 1.0, 3.2);
  addGlassTower(kit, island, 21.6, -9.0, 0.8, 2.2);

  const pines = [
    [24.0, -3.0, 1.1], [25.3, -1.8, 1.0], [23.6, -4.8, 0.9], [27.2, -0.4, 1.0], [28.8, -2.6, 1.1],
    [30.3, -4.4, 1.0], [31.4, -6.6, 1.1], [30.0, -8.8, 1.0], [29.4, -10.8, 0.9], [31.8, -9.2, 0.9],
    [24.8, 1.6, 0.9], [26.6, -2.8, 0.9], [19.8, -11.4, 0.9], [15.2, -11.4, 1.0], [17.4, -11.6, 0.9],
    [13.6, -11.2, 0.8], [21.4, 1.6, 0.9], [35.7, -4.6, 0.9], [30.2, -15.0, 0.8], [19.5, -15.2, 0.8],
  ];
  for (const [x, z, scale] of pines) {
    const [squeezedX] = squeezeEast([x, z]);
    island.put(createPine(kit, scale), squeezedX, z);
  }
  island.put(createRoundTree(kit, "#a7d676", 1.0), 12.0, -1.4);

  const flag = createFlag(kit, drawCanadaFlag);
  island.put(flag.object, 15.4, -1.3);
  const sign = island.put(createSign(kit, "VANCOUVER"), 12.8, 4.6);

  island.addCars(["#f94144", P.white, "#577590", "#f8961e"]);

  for (const [x, z, radius, height] of [[22, -28, 8, 6.5], [12, -31, 6.5, 5.2]]) {
    const mountain = createMountain(kit, radius, height, P.mountain);
    mountain.position.set(x, 0, z);
    island.group.add(mountain);
  }

  return {
    group: island.group,
    sign,
    update(time) {
      island.updateCars(time);
      flag.update(time);
    },
  };
}
