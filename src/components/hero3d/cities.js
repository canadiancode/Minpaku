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
const ISLAND_RADIUS = 9;
const ISLAND_STRETCH_X = 1.12;

function placed(object, x, y, z) {
  object.position.set(x, y, z);
  return object;
}

const ROAD = { u: -2, v: -2.6, radiusU: 4.2, radiusV: 2.6, halfWidth: 0.42 };

function roundedPuck(radius, height, bevel) {
  const profile = [new THREE.Vector2(0, -1.2), new THREE.Vector2(radius, -1.2)];
  const steps = 8;
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * (Math.PI / 2);
    profile.push(
      new THREE.Vector2(
        radius - bevel + Math.cos(angle) * bevel,
        height - bevel + Math.sin(angle) * bevel,
      ),
    );
  }
  profile.push(new THREE.Vector2(0, height));
  return new THREE.LatheGeometry(profile, 56);
}

function ellipseRing(radiusU, radiusV, halfWidth, depth) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, radiusU + halfWidth, radiusV + halfWidth, 0, Math.PI * 2);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, radiusU - halfWidth, radiusV - halfWidth, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 64 }).rotateX(-Math.PI / 2);
}

/**
 * Builds the shared island base. Positions are given in island-local (u, v):
 * u points toward the ocean between the cities, v toward the camera.
 */
function createIslandBase(kit, side, grassColor) {
  const group = new THREE.Group();
  const centerX = side * ISLAND_CENTER_X;
  const inward = -side;
  const at = (u, v, y = ISLAND_TOP) => new THREE.Vector3(centerX + inward * u, y, ISLAND_CENTER_Z + v);
  const put = (object, u, v, y) => {
    object.position.copy(at(u, v, y));
    group.add(object);
    return object;
  };

  const sand = kit.mesh(roundedPuck(ISLAND_RADIUS + 0.7, 0.22, 0.2), P.sand);
  sand.scale.x = ISLAND_STRETCH_X;
  put(sand, 0, 0, 0);
  const grass = kit.mesh(roundedPuck(ISLAND_RADIUS, ISLAND_TOP, 0.32), grassColor);
  grass.scale.x = ISLAND_STRETCH_X;
  put(grass, 0, 0, 0);

  const foam = kit.mesh(new THREE.TorusGeometry(ISLAND_RADIUS + 1.0, 0.12, 6, 72).rotateX(Math.PI / 2), P.foam, {
    castShadow: false,
  });
  foam.scale.x = (ISLAND_RADIUS * ISLAND_STRETCH_X + 1.0) / (ISLAND_RADIUS + 1.0);
  put(foam, 0, 0, 0.04);

  // Airstrip with two taxi lanes that the plane's path follows.
  put(kit.mesh(roundedBox(7.6, 0.14, 3.9, 0.06), P.pad), 4.1, 3.5, PAD_TOP - 0.07);
  const dashGeometry = kit.geometry("runway-dash", () => roundedBox(0.55, 0.04, 0.12, 0.02));
  for (const laneV of [2.6, 4.4]) {
    for (let u = 1.4; u <= 7.4; u += 1.0) {
      put(kit.mesh(dashGeometry, P.white, { castShadow: false }), u, laneV, PAD_TOP);
    }
  }

  put(kit.mesh(ellipseRing(ROAD.radiusU, ROAD.radiusV, ROAD.halfWidth, 0.06), P.road, { castShadow: false }), ROAD.u, ROAD.v);

  const cars = [];
  function addCars(colors) {
    colors.forEach((color, index) => {
      const car = createCar(kit, color);
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
      const radiusU = ROAD.radiusU + laneOffset;
      const radiusV = ROAD.radiusV + laneOffset;
      const u = ROAD.u + Math.cos(angle) * radiusU;
      const v = ROAD.v + Math.sin(angle) * radiusV;
      car.position.copy(at(u, v, ISLAND_TOP + 0.06 + Math.abs(Math.sin(time * 9 + phase)) * 0.035));
      const deltaU = -Math.sin(angle) * radiusU * direction;
      const deltaV = Math.cos(angle) * radiusV * direction;
      car.rotation.y = Math.atan2(inward * deltaU, deltaV);
    }
  }

  return { group, at, put, inward, addCars, updateCars };
}

function addBuilding(kit, island, u, v, width, height, color) {
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
  island.put(building, u, v);
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

function createMountain(kit, radius, height, color) {
  const mountain = new THREE.Group();
  mountain.add(placed(kit.mesh(new THREE.ConeGeometry(radius, height, 28), color, { castShadow: false }), 0, height / 2, 0));
  const capHeight = height * 0.32;
  const capRadius = (radius / height) * capHeight + 0.05;
  mountain.add(placed(kit.mesh(new THREE.ConeGeometry(capRadius, capHeight, 28), P.white, { castShadow: false }), 0, height - capHeight / 2 + 0.03, 0));
  return mountain;
}

export function createTokyo(kit) {
  const island = createIslandBase(kit, -1, P.grassTokyo);

  island.put(createTokyoTower(kit), -2.2, -2.7);
  island.put(createPagoda(kit), -6.4, 2.0);
  island.put(createTorii(kit), -2.6, 5.6);

  addBuilding(kit, island, -4.7, -2.6, 0.85, 1.4, "#ffd6a5");
  addBuilding(kit, island, 0.5, -2.4, 0.85, 1.1, "#cdb4db");
  addBuilding(kit, island, -4.6, -6.7, 1.1, 2.6, "#bde0fe");
  addBuilding(kit, island, -2.7, -7.1, 1.0, 3.4, "#ffc8dd");
  addBuilding(kit, island, -0.8, -7.0, 1.1, 2.2, "#fdffb6");
  addBuilding(kit, island, 1.2, -6.6, 1.0, 2.9, "#caffbf");
  addBuilding(kit, island, 3.1, -5.6, 0.9, 1.8, "#a0c4ff");

  const cherryTrees = [
    [-7.6, -1.0, 1.1], [-7.3, -4.3, 1.0], [-5.2, 4.6, 0.9], [-4.6, 3.0, 0.8], [-0.8, 3.3, 0.9],
    [1.6, 6.8, 1.0], [5.5, -0.6, 1.0], [6.6, 0.7, 0.85], [5.4, -3.6, 1.0], [-6.2, -6.0, 0.8],
  ];
  for (const [u, v, scale] of cherryTrees) island.put(createCherryTree(kit, scale), u, v);

  const flag = createFlag(kit, drawJapanFlag);
  island.put(flag.object, 3, 0.8);
  island.put(createSign(kit, "TOKYO"), 5.2, 6.6);

  island.addCars([P.brand, "#4cc9f0", P.yellow, "#90be6d"]);

  const fuji = createMountain(kit, 9, 7, P.fuji);
  fuji.position.set(-24, 0, -27);
  island.group.add(fuji);

  return {
    group: island.group,
    update(time) {
      island.updateCars(time);
      flag.update(time);
    },
  };
}

function createBCPlace(kit) {
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

function createHarbourCentre(kit) {
  const tower = new THREE.Group();
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.34, 0.4, 4.4, 16), "#d6dce8"), 0, 2.2, 0));
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.95, 0.7, 0.45, 24), "#9aa6bf"), 0, 4.55, 0));
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.97, 0.97, 0.16, 24), P.glass), 0, 4.6, 0));
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.25, 16), "#d6dce8"), 0, 4.9, 0));
  tower.add(placed(kit.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), P.white), 0, 5.4, 0));
  return tower;
}

function createScienceWorld(kit) {
  const dome = new THREE.Group();
  dome.add(placed(kit.mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.45, 16), "#c4ccd8"), 0, 0.22, 0));
  dome.add(placed(kit.mesh(new THREE.IcosahedronGeometry(1.1, 1), "#e8eef6", { flat: true }), 0, 1.35, 0));
  return dome;
}

function createCanadaPlace(kit) {
  const pier = new THREE.Group();
  pier.add(placed(kit.mesh(roundedBox(1.2, 0.5, 3.2, 0.14), "#eef2f8"), 0, 0.25, 0));
  const sailGeometry = kit.geometry("sail", () => new THREE.ConeGeometry(0.4, 1.1, 14));
  for (let index = 0; index < 5; index += 1) {
    pier.add(placed(kit.mesh(sailGeometry, P.white), 0, 1.0, -1.2 + index * 0.6));
  }
  return pier;
}

function createInukshuk(kit) {
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

function addGlassTower(kit, island, u, v, width, height) {
  const tower = new THREE.Group();
  tower.add(placed(kit.mesh(roundedBox(width, height, width, 0.16), "#8fd0e6"), 0, height / 2, 0));
  const bandGeometry = kit.geometry(`glass-band-${width}`, () => roundedBox(width + 0.04, 0.06, width + 0.04, 0.02));
  for (let y = 0.6; y < height - 0.2; y += 0.6) {
    tower.add(placed(kit.mesh(bandGeometry, "#e6f6fb", { castShadow: false }), 0, y, 0));
  }
  island.put(tower, u, v);
}

export function createVancouver(kit) {
  const island = createIslandBase(kit, 1, P.grassVancouver);

  island.put(createBCPlace(kit), -2.0, -2.6);
  island.put(createHarbourCentre(kit), -4.6, -6.6);
  island.put(createScienceWorld(kit), 4.8, -1.6);
  island.put(createCanadaPlace(kit), -6.4, 2.2);
  island.put(createInukshuk(kit), -2.6, 5.6);

  addGlassTower(kit, island, -2.8, -7.2, 1.0, 3.6);
  addGlassTower(kit, island, -1.0, -7.0, 0.9, 2.8);
  addGlassTower(kit, island, 0.8, -6.6, 1.0, 3.2);
  addGlassTower(kit, island, 2.6, -5.6, 0.8, 2.2);
  addGlassTower(kit, island, -6.5, -5.2, 0.8, 2.0);

  const pines = [
    [-8.0, -0.6, 1.1], [-7.4, -3.2, 1.2], [-8.3, 1.2, 0.9], [-4.8, 4.4, 1.0], [-0.8, 3.4, 0.9],
    [1.4, 6.8, 1.0], [-6.6, 5.0, 1.1], [5.8, -0.4, 1.0], [6.8, 0.8, 0.85], [3.8, -4.4, 0.9],
    [-5.4, 6.4, 0.8], [-8.4, -2.0, 0.9],
  ];
  for (const [u, v, scale] of pines) island.put(createPine(kit, scale), u, v);
  island.put(createRoundTree(kit, "#a7d676", 1.0), 3.8, -2.6);

  const flag = createFlag(kit, drawCanadaFlag);
  island.put(flag.object, 3, 0.8);
  island.put(createSign(kit, "VANCOUVER"), 5.2, 6.6);

  island.addCars(["#f94144", P.white, "#577590", "#f8961e"]);

  const mountains = [
    [22, -28, 8, 6.5],
    [31, -24, 7, 5],
    [13, -31, 6.5, 5.2],
  ];
  for (const [x, z, radius, height] of mountains) {
    const mountain = createMountain(kit, radius, height, P.mountain);
    mountain.position.set(x, 0, z);
    island.group.add(mountain);
  }

  return {
    group: island.group,
    update(time) {
      island.updateCars(time);
      flag.update(time);
    },
  };
}
