import * as THREE from "three";
import { cylinderBetween, palette as P, roundedBox } from "../hero3d/toonKit.js";
import { createMountain } from "../hero3d/cities.js";
import { LAND_TOP } from "./tour.js";

const WATER = "#55c1de";
const v2 = (x, z) => new THREE.Vector2(x, z);

/** West coast follows the Strait of Georgia; everything else is a rounded slab. */
export const COASTLINE = [
  [33, -20], [33, 18], [-19, 18], [-22.5, 16], [-25.5, 14], [-27, 11], [-26, 7], [-26.5, 4],
  [-28, 1], [-27.5, -2], [-25, -3.4], [-23.4, -4.4], [-24.8, -5.8], [-27.5, -8.5], [-27.5, -13], [-26, -20],
];

export const WATERWAYS = {
  burrardInlet: { width: 1.5, points: [[-29, -6.4], [-22, -6.5], [-16, -7.0], [-8, -6.8], [-3, -6.5], [0.5, -6.3], [2.8, -6.0]] },
  indianArm: { width: 1.0, points: [[-3, -6.6], [-2.4, -10], [-2.8, -14], [-2.2, -19]] },
  falseCreek: { width: 0.6, points: [[-25, -2.6], [-21, -1.8], [-18.6, -1.3], [-16.9, -0.7]] },
  fraser: { width: 1.5, points: [[34, 6.2], [22, 5.6], [14, 5.0], [8, 4.7], [2, 5.2], [-2, 5.6], [-6, 6.6], [-10, 7.2]] },
  fraserNorthArm: { width: 0.9, points: [[-10, 7.2], [-14, 6.6], [-19, 6.3], [-29, 6.0]] },
  fraserMainArm: { width: 1.4, points: [[-10, 7.2], [-13, 9.6], [-17, 12.4], [-22, 13.6], [-30, 14.2]] },
  pittRiver: { width: 0.9, points: [[11, -11], [11.5, -7], [11, -2], [10.8, 4.9]] },
  coquitlamRiver: { width: 0.4, points: [[7.2, -20], [7.6, -10], [7.7, -4], [7.5, 0], [7.8, 4.7]] },
};

export const LAKES = [
  { x: -5.6, z: 0.9, radiusX: 1.4, radiusZ: 0.55, rotation: 0.15 },  // Burnaby Lake
  { x: -9.7, z: 0.1, radiusX: 0.55, radiusZ: 0.38, rotation: 0 },    // Deer Lake
  { x: 4.7, z: -3.3, radiusX: 0.62, radiusZ: 0.4, rotation: 0.2 },   // Lafarge Lake
  { x: 11, z: -14, radiusX: 1.5, radiusZ: 3.2, rotation: 0.05 },     // Pitt Lake
  { x: 21.5, z: -8.6, radiusX: 0.75, radiusZ: 2.3, rotation: -0.3 }, // Alouette Lake
];

export const HILLS = [
  { x: -4.8, z: -4.2, radius: 2.0, height: 1.25 }, // Burnaby Mountain
  { x: 6.4, z: -6.9, radius: 2.3, height: 1.0 },   // Westwood Plateau
];

export const HIGHWAY_1 = [
  [-29, -1.2], [-18, -0.9], [-10, -0.7], [-5, -0.5], [-1, 1.0], [2, 2.5], [5.2, 3.4], [6.6, 4.0],
  [6.9, 5.7], [8.4, 7.2], [12, 8.8], [16, 9.6], [24, 10.2], [34, 10.6],
];

export const SKYTRAIN = [
  [-19.6, -5.0], [-16, -3.4], [-12, -2.6], [-8, -2.5], [-3.2, -1.6], [-0.6, -3.2], [1.4, -4.6], [3.2, -3.9], [3.9, -2.8],
];

export function landHeight(x, z) {
  let height = LAND_TOP;
  for (const hill of HILLS) {
    const distance = Math.hypot(x - hill.x, z - hill.z) / hill.radius;
    if (distance < 1) height = Math.max(height, LAND_TOP + hill.height * Math.sqrt(1 - distance * distance));
  }
  return height;
}

export function curveFromPoints(points, y = 0) {
  return new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, y, z)), false, "centripetal");
}

/** Flat strip that follows a curve on the ground — rivers, roads, paths. */
export function ribbonGeometry(curve, width, y, segments = 120) {
  const positions = [];
  const normals = [];
  const indices = [];
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent);
    const sideX = -tangent.z;
    const sideZ = tangent.x;
    const sideLength = Math.hypot(sideX, sideZ) || 1;
    for (const side of [-1, 1]) {
      positions.push(point.x + (sideX / sideLength) * side * width * 0.5, y, point.z + (sideZ / sideLength) * side * width * 0.5);
      normals.push(0, 1, 0);
    }
    if (index < segments) {
      const base = index * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

function createLand(kit) {
  const shape = new THREE.Shape(COASTLINE.map(([x, z]) => v2(x, -z)));
  const depth = 1.4;
  const bevel = 0.3;
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: 0.45,
    bevelSegments: 4,
    curveSegments: 6,
  }).rotateX(-Math.PI / 2);
  const land = kit.mesh(geometry, "#9bd88a", { castShadow: false });
  land.position.y = LAND_TOP - depth - bevel;

  const beach = kit.mesh(
    new THREE.ExtrudeGeometry(shape, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 1.0, bevelSegments: 3 })
      .rotateX(-Math.PI / 2),
    P.sand,
    { castShadow: false },
  );
  beach.position.y = -0.35;
  return [land, beach];
}

function createHill(kit, { x, z, radius, height }) {
  const hill = kit.mesh(new THREE.SphereGeometry(radius, 36, 14, 0, Math.PI * 2, 0, Math.PI / 2), "#8ccf7e");
  hill.scale.y = height / radius;
  hill.position.set(x, LAND_TOP - 0.02, z);
  return hill;
}

export function createTerrain(kit) {
  const group = new THREE.Group();
  group.add(...createLand(kit));

  Object.values(WATERWAYS).forEach(({ width, points }, index) => {
    const curve = curveFromPoints(points);
    group.add(kit.mesh(ribbonGeometry(curve, width, LAND_TOP + 0.012 + index * 0.0005, 160), WATER, { castShadow: false }));
  });

  for (const lake of LAKES) {
    const water = kit.mesh(new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2), WATER, { castShadow: false });
    water.scale.set(lake.radiusX, 1, lake.radiusZ);
    water.rotation.y = lake.rotation;
    water.position.set(lake.x, LAND_TOP + 0.016, lake.z);
    group.add(water);
  }

  for (const hill of HILLS) group.add(createHill(kit, hill));

  const highwayCurve = curveFromPoints(HIGHWAY_1);
  group.add(kit.mesh(ribbonGeometry(highwayCurve, 0.36, LAND_TOP + 0.02, 220), P.road, { castShadow: false }));

  const mountains = [
    [-24, -15.5, 4.2, 3.8], [-15.5, -13.2, 4.0, 4.6], [-9, -14.8, 3.6, 4.0], [-6.2, -12.4, 2.6, 3.0],
    [1.6, -14.6, 3.6, 4.4], [5.2, -12.4, 2.6, 2.8], [15.4, -14.6, 3.0, 3.6],
    [19.2, -12.8, 3.8, 5.6], [22.6, -12.6, 3.5, 5.2], [26.4, -13.2, 3.6, 4.4], [30, -9, 3.6, 3.6],
  ];
  for (const [x, z, radius, height] of mountains) {
    const mountain = createMountain(kit, radius, height, P.mountain);
    mountain.position.set(x, LAND_TOP - 0.05, z);
    group.add(mountain);
  }

  return { group, highwayCurve };
}

/** Bridge from `start` to `end` ([x, z]); styles: suspension, cablestay, arch, rope. */
export function createBridge(kit, start, end, { style, color = P.white, deckHeight = 0.32 }) {
  const bridge = new THREE.Group();
  const dx = end[0] - start[0];
  const dz = end[1] - start[1];
  const length = Math.hypot(dx, dz);
  bridge.position.set((start[0] + end[0]) / 2, LAND_TOP, (start[1] + end[1]) / 2);
  bridge.rotation.y = Math.atan2(dx, dz);

  const deckWidth = style === "rope" ? 0.14 : 0.42;
  const deck = kit.mesh(roundedBox(deckWidth, 0.07, length + 0.5, 0.03), style === "rope" ? "#c79a6b" : "#e8e4dc");
  deck.position.y = deckHeight;
  bridge.add(deck);
  for (const end of [-1, 1]) {
    const pier = kit.mesh(roundedBox(deckWidth + 0.06, deckHeight, 0.3, 0.05), "#d4cfc6");
    pier.position.set(0, deckHeight / 2, end * (length / 2 + 0.1));
    bridge.add(pier);
  }

  const strut = (a, b, radius = 0.012, strutColor = color) =>
    bridge.add(cylinderBetween(kit, a, b, radius, strutColor, { castShadow: false }));

  if (style === "suspension" || style === "rope") {
    const towerHeight = style === "rope" ? 0.35 : 1.1;
    const towerOffset = length * (style === "rope" ? 0.5 : 0.28);
    for (const towerZ of [-towerOffset, towerOffset]) {
      for (const side of [-1, 1]) {
        const leg = kit.mesh(roundedBox(0.07, towerHeight, 0.07, 0.02), color);
        leg.position.set((side * deckWidth) / 2, deckHeight + towerHeight / 2, towerZ);
        bridge.add(leg);
      }
      if (style === "suspension") {
        const beam = kit.mesh(roundedBox(deckWidth + 0.07, 0.06, 0.07, 0.02), color);
        beam.position.set(0, deckHeight + towerHeight, towerZ);
        bridge.add(beam);
      }
    }
    for (const side of [-1, 1]) {
      const x = (side * deckWidth) / 2;
      const top = deckHeight + towerHeight;
      const points = [
        new THREE.Vector3(x, deckHeight, -length / 2 - 0.2),
        new THREE.Vector3(x, top, -towerOffset),
        new THREE.Vector3(x, deckHeight + 0.08, 0),
        new THREE.Vector3(x, top, towerOffset),
        new THREE.Vector3(x, deckHeight, length / 2 + 0.2),
      ];
      const cable = kit.mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.2), 60, 0.018, 5),
        color,
        { castShadow: false },
      );
      bridge.add(cable);
    }
  } else if (style === "cablestay") {
    const pylonHeight = 1.3;
    for (const pylonZ of [-length * 0.24, length * 0.24]) {
      const pylon = kit.mesh(roundedBox(0.09, pylonHeight, 0.09, 0.03), color);
      pylon.position.set(0, deckHeight + pylonHeight / 2, pylonZ);
      bridge.add(pylon);
      for (let index = 1; index <= 4; index += 1) {
        for (const direction of [-1, 1]) {
          for (const side of [-1, 1]) {
            strut(
              new THREE.Vector3(0, deckHeight + pylonHeight - 0.08, pylonZ),
              new THREE.Vector3((side * deckWidth) / 2, deckHeight + 0.03, pylonZ + direction * index * length * 0.06),
            );
          }
        }
      }
    }
  } else if (style === "arch") {
    for (const side of [-1, 1]) {
      const archPoints = [];
      for (let index = 0; index <= 16; index += 1) {
        const t = index / 16;
        archPoints.push(new THREE.Vector3((side * deckWidth) / 2, deckHeight + Math.sin(Math.PI * t) * 0.6, (t - 0.5) * length));
      }
      const arch = kit.mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPoints), 40, 0.035, 6), color);
      bridge.add(arch);
      for (let index = 2; index <= 14; index += 2) {
        const point = archPoints[index];
        strut(point, new THREE.Vector3(point.x, deckHeight, point.z), 0.01);
      }
    }
  }
  return bridge;
}

/** Elevated guideway on pillars with a little three-car train shuttling along it. */
export function createSkyTrain(kit) {
  const group = new THREE.Group();
  const elevation = 0.42;
  const curve = curveFromPoints(SKYTRAIN, 0);
  const length = curve.getLength();
  const segments = 160;
  const point = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  const guidewayGeometry = ribbonGeometry(curve, 0.26, 0, segments);
  const guideway = kit.mesh(guidewayGeometry, "#e9edf3", { castShadow: true, side: THREE.DoubleSide });
  const positions = guidewayGeometry.attributes.position.array;
  for (let index = 0; index < positions.length; index += 3) {
    positions[index + 1] = landHeight(positions[index], positions[index + 2]) + elevation;
  }
  guidewayGeometry.attributes.position.needsUpdate = true;
  group.add(guideway);

  const pillarGeometry = kit.geometry("skytrain-pillar", () => new THREE.CylinderGeometry(0.05, 0.06, 1, 8));
  for (let distance = 0.6; distance < length; distance += 1.4) {
    curve.getPointAt(distance / length, point);
    const ground = landHeight(point.x, point.z);
    const pillar = kit.mesh(pillarGeometry, "#cfd5df");
    pillar.scale.y = elevation;
    pillar.position.set(point.x, ground + elevation / 2, point.z);
    group.add(pillar);
  }

  const cars = Array.from({ length: 3 }, () => {
    const car = new THREE.Group();
    car.userData.dynamic = true;
    car.add(kit.mesh(roundedBox(0.24, 0.2, 0.58, 0.08), P.white));
    const stripe = kit.mesh(roundedBox(0.25, 0.05, 0.56, 0.02), "#2f6fd6", { castShadow: false });
    stripe.position.y = 0.01;
    car.add(stripe);
    const windows = kit.mesh(roundedBox(0.25, 0.06, 0.46, 0.02), P.windowDark, { castShadow: false });
    windows.position.y = 0.06;
    car.add(windows);
    group.add(car);
    return car;
  });

  function update(time) {
    // Ping-pong between Waterfront and Lafarge Lake–Douglas with a short dwell at each end.
    const cycle = 26;
    const phase = (time % cycle) / cycle;
    const travel = THREE.MathUtils.smoothstep(phase < 0.5 ? phase * 2 : 2 - phase * 2, 0.06, 0.94);
    const usable = length - 1.4;
    cars.forEach((car, index) => {
      const distance = 0.7 + travel * usable + (index - 1) * 0.62 * (phase < 0.5 ? -1 : 1);
      const t = THREE.MathUtils.clamp(distance / length, 0, 1);
      curve.getPointAt(t, point);
      curve.getTangentAt(t, tangent);
      car.position.set(point.x, landHeight(point.x, point.z) + elevation + 0.12, point.z);
      car.rotation.y = Math.atan2(tangent.x, tangent.z);
    });
  }

  return { group, update };
}
