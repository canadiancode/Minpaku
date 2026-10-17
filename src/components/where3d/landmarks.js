import * as THREE from "three";
import { cylinderBetween, palette as P, roundedBox } from "../hero3d/toonKit.js";
import {
  createBCPlace,
  createCanadaPlace,
  createHarbourCentre,
  createInukshuk,
  createScienceWorld,
} from "../hero3d/cities.js";
import { createBoat, createCherryTree, createPine, createPlane, createRoundTree } from "../hero3d/props.js";
import { createBridge, landHeight } from "./terrain.js";

function put(group, object, x, z, { scale = 1, rotation = 0, lift = 0 } = {}) {
  object.position.set(x, landHeight(x, z) + lift, z);
  object.scale.multiplyScalar(scale);
  object.rotation.y = rotation;
  group.add(object);
  return object;
}

export function createTower(kit, width, height, color, roofColor = P.white) {
  const tower = new THREE.Group();
  const body = kit.mesh(roundedBox(width, height, width, Math.min(0.08, width * 0.2)), color);
  body.position.y = height / 2;
  tower.add(body);
  const roof = kit.mesh(roundedBox(width + 0.06, 0.07, width + 0.06, 0.03), roofColor);
  roof.position.y = height;
  tower.add(roof);
  const bandGeometry = kit.geometry(`band-${width}`, () => roundedBox(width + 0.02, 0.035, width + 0.02, 0.012));
  for (let y = 0.25; y < height - 0.1; y += 0.25) {
    const band = kit.mesh(bandGeometry, "#eef8fb", { castShadow: false });
    band.position.y = y;
    tower.add(band);
  }
  return tower;
}

function createTinSoldier(kit) {
  const soldier = new THREE.Group();
  const parts = [
    [roundedBox(0.09, 0.3, 0.1, 0.03), "#1f2a44", -0.06, 0.15],
    [roundedBox(0.09, 0.3, 0.1, 0.03), "#1f2a44", 0.06, 0.15],
    [roundedBox(0.28, 0.34, 0.18, 0.06), "#d62839", 0, 0.47],
    [roundedBox(0.3, 0.05, 0.19, 0.02), P.white, 0, 0.32],
  ];
  for (const [geometry, color, x, y] of parts) {
    const part = kit.mesh(geometry, color);
    part.position.set(x, y, 0);
    soldier.add(part);
  }
  for (const side of [-1, 1]) {
    const arm = kit.mesh(roundedBox(0.07, 0.28, 0.08, 0.03), "#d62839");
    arm.position.set(side * 0.18, 0.48, 0);
    soldier.add(arm);
  }
  const head = kit.mesh(new THREE.SphereGeometry(0.1, 16, 12), "#f5d0b5");
  head.position.y = 0.73;
  soldier.add(head);
  const busby = kit.mesh(new THREE.CapsuleGeometry(0.1, 0.16, 6, 14), "#1b1b24");
  busby.position.y = 0.9;
  soldier.add(busby);
  for (const y of [0.4, 0.48, 0.56]) {
    const button = kit.mesh(new THREE.SphereGeometry(0.016, 8, 6), P.yellow, { castShadow: false });
    button.position.set(0, y, 0.095);
    soldier.add(button);
  }
  return soldier;
}

function createTemple(kit) {
  const temple = new THREE.Group();
  const base = kit.mesh(roundedBox(0.9, 0.1, 0.6, 0.03), "#efe6d6");
  base.position.y = 0.05;
  temple.add(base);
  const hall = kit.mesh(roundedBox(0.7, 0.3, 0.45, 0.04), "#d6453d");
  hall.position.y = 0.25;
  temple.add(hall);
  const roof = kit.mesh(new THREE.ConeGeometry(0.62, 0.28, 4), "#f2b134", { flat: true });
  roof.rotation.y = Math.PI / 4;
  roof.scale.z = 0.72;
  roof.position.y = 0.53;
  temple.add(roof);
  return temple;
}

function createFort(kit) {
  const fort = new THREE.Group();
  const stakeGeometry = kit.geometry("fort-stake", () => new THREE.CylinderGeometry(0.035, 0.035, 0.28, 6));
  const size = 1.1;
  for (let index = 0; index < 40; index += 1) {
    const side = Math.floor(index / 10);
    const t = (index % 10) / 10 - 0.5;
    const position = [
      [t * size, -size / 2], [size / 2, t * size], [-t * size, size / 2], [-size / 2, -t * size],
    ][side];
    const stake = kit.mesh(stakeGeometry, "#a8714f");
    stake.position.set(position[0], 0.14, position[1]);
    fort.add(stake);
  }
  const bastion = kit.mesh(roundedBox(0.3, 0.42, 0.3, 0.05), "#c48b5c");
  bastion.position.set(size / 2, 0.21, -size / 2);
  fort.add(bastion);
  const bastionRoof = kit.mesh(new THREE.ConeGeometry(0.26, 0.2, 4), "#6d4c3d", { flat: true });
  bastionRoof.rotation.y = Math.PI / 4;
  bastionRoof.position.set(size / 2, 0.52, -size / 2);
  fort.add(bastionRoof);
  const house = kit.mesh(roundedBox(0.4, 0.22, 0.28, 0.04), P.white);
  house.position.set(-0.1, 0.11, 0.05);
  fort.add(house);
  return fort;
}

function createFieldRows(kit, rows, length, bushColor, dotColor) {
  const field = new THREE.Group();
  const bushGeometry = kit.geometry("field-bush", () => new THREE.SphereGeometry(0.09, 10, 8));
  const dotGeometry = kit.geometry("field-dot", () => new THREE.SphereGeometry(0.028, 6, 5));
  for (let row = 0; row < rows; row += 1) {
    for (let step = 0; step < length; step += 1) {
      const x = (step - (length - 1) / 2) * 0.2;
      const z = (row - (rows - 1) / 2) * 0.28;
      const bush = kit.mesh(bushGeometry, bushColor, { castShadow: false });
      bush.position.set(x, 0.07, z);
      field.add(bush);
      if ((row + step) % 2 === 0) {
        const dot = kit.mesh(dotGeometry, dotColor, { castShadow: false });
        dot.position.set(x + 0.04, 0.13, z + 0.05);
        field.add(dot);
      }
    }
  }
  return field;
}

function createMall(kit, width, depth, color) {
  const mall = new THREE.Group();
  const body = kit.mesh(roundedBox(width, 0.26, depth, 0.06), color);
  body.position.y = 0.13;
  mall.add(body);
  const glass = kit.mesh(roundedBox(width * 0.6, 0.12, 0.04, 0.02), P.glass, { castShadow: false });
  glass.position.set(0, 0.14, depth / 2);
  mall.add(glass);
  const roof = kit.mesh(roundedBox(width + 0.05, 0.05, depth + 0.05, 0.02), P.white);
  roof.position.y = 0.27;
  mall.add(roof);
  return mall;
}

function createFountain(kit) {
  const fountain = new THREE.Group();
  const jetGeometry = kit.geometry("fountain-jet", () => new THREE.SphereGeometry(0.05, 8, 6));
  const jets = Array.from({ length: 6 }, () => {
    const jet = kit.mesh(jetGeometry, P.white, { castShadow: false });
    fountain.add(jet);
    return jet;
  });
  function update(time) {
    jets.forEach((jet, index) => {
      const phase = (time * 0.9 + index / jets.length) % 1;
      jet.position.set(Math.sin(index * 2.1) * 0.05 * phase, Math.sin(Math.PI * phase) * 0.5, Math.cos(index * 2.1) * 0.05 * phase);
      jet.scale.setScalar(1 - phase * 0.6);
    });
  }
  return { object: fountain, update };
}

function scatter(group, x, z, factory, positions) {
  for (const [dx, dz, scale = 1, rotation = 0] of positions) put(group, factory(), x + dx, z + dz, { scale, rotation });
}

export function createLandmarks(kit) {
  const group = new THREE.Group();
  const updaters = [];
  const pine = () => createPine(kit, 1);
  const roundTree = (color = "#7cc96b") => () => createRoundTree(kit, color, 1);

  // Vancouver
  const vancouverTowers = [
    [-20.2, -3.6, 0.42, 1.4], [-19.5, -3.1, 0.5, 2.0], [-18.7, -3.7, 0.42, 1.3], [-19.9, -2.5, 0.4, 1.1],
    [-18.3, -2.9, 0.46, 1.7], [-20.9, -2.9, 0.36, 0.9], [-18.9, -2.2, 0.36, 1.0], [-17.7, -3.6, 0.38, 1.2],
  ];
  vancouverTowers.forEach(([x, z, width, height], index) =>
    put(group, createTower(kit, width, height, index % 3 === 0 ? "#9fd3e6" : index % 3 === 1 ? "#8cc7de" : "#b4dcea"), x, z),
  );
  put(group, createHarbourCentre(kit), -19.0, -4.4, { scale: 0.36 });
  put(group, createCanadaPlace(kit), -18.0, -5.35, { scale: 0.34 });
  put(group, createBCPlace(kit), -17.6, -2.0, { scale: 0.34 });
  put(group, createScienceWorld(kit), -16.5, -0.2, { scale: 0.34 });
  put(group, createInukshuk(kit), -22.6, -3.0, { scale: 0.32 });
  scatter(group, -21.6, -4.8, pine, [
    [0, 0, 0.42], [0.5, 0.2, 0.38], [-0.5, 0.3, 0.4], [0.2, -0.4, 0.36], [-0.3, -0.3, 0.44], [0.8, -0.2, 0.34],
    [-0.8, -0.1, 0.38], [0.4, 0.6, 0.36], [-0.2, 0.7, 0.34], [-0.9, 0.5, 0.36],
  ]);
  group.add(createBridge(kit, [-22.7, -5.3], [-22.5, -7.7], { style: "suspension", color: "#3f9a6b" }));

  // North Vancouver: Grouse Mountain gondola, Lonsdale Quay, Capilano Suspension Bridge
  put(group, createMall(kit, 0.8, 0.4, "#f6d6a8"), -16.4, -7.95);
  const gondolaBase = new THREE.Vector3(-15.2, 0.6, -9.4);
  const gondolaTop = new THREE.Vector3(-15.5, 3.9, -12.3);
  group.add(cylinderBetween(kit, gondolaBase, gondolaTop, 0.012, P.ink, { castShadow: false }));
  const gondola = kit.mesh(roundedBox(0.16, 0.14, 0.16, 0.05), "#e63946");
  group.add(gondola);
  updaters.push((time) => {
    const t = (Math.sin(time * 0.35) + 1) / 2;
    gondola.position.lerpVectors(gondolaBase, gondolaTop, t).y -= 0.1;
  });
  scatter(group, -19.6, -10.0, pine, [
    [-0.6, 0, 0.4], [-0.9, 0.4, 0.36], [-0.7, -0.5, 0.42], [0.6, 0, 0.4], [0.9, 0.4, 0.36], [0.7, -0.5, 0.4],
  ]);
  group.add(createBridge(kit, [-20.1, -10.0], [-19.1, -10.0], { style: "rope", deckHeight: 0.25 }));

  // Burnaby
  [[-8.7, 1.7, 0.42, 1.6], [-8.1, 2.2, 0.46, 2.0], [-9.3, 2.3, 0.38, 1.2], [-7.6, 1.6, 0.36, 1.1]].forEach(
    ([x, z, width, height]) => put(group, createTower(kit, width, height, "#f7c59f"), x, z),
  );
  put(group, createMall(kit, 1.3, 0.55, "#f1e3c8"), -8.4, 3.0);
  const sfu = new THREE.Group();
  sfu.add(kit.mesh(roundedBox(1.3, 0.2, 0.34, 0.05), "#eae6df"));
  const sfuWing = kit.mesh(roundedBox(0.34, 0.2, 0.9, 0.05), "#eae6df");
  sfuWing.position.set(0.3, 0, 0.3);
  sfu.add(sfuWing);
  put(group, sfu, -4.8, -4.2, { lift: 0.08 });
  scatter(group, -5.6, 0.9, pine, [[-1.8, 0.2, 0.36], [1.7, -0.3, 0.38], [0.2, -0.9, 0.34], [-0.6, 0.9, 0.36]]);
  scatter(group, -9.7, 0.1, roundTree(), [[-0.9, 0.1, 0.38], [0.8, 0.2, 0.4], [0, -0.7, 0.36]]);
  scatter(group, -4.8, -4.2, pine, [[-1.4, 0.6, 0.4], [1.2, 0.8, 0.4], [-0.9, -1.0, 0.42], [0.8, -1.2, 0.4]]);

  // New Westminster
  put(group, createTinSoldier(kit), -1.5, 4.3, { scale: 1.2 });
  put(group, createMall(kit, 0.9, 0.42, "#ffe1a8"), -0.5, 4.2);
  const boardwalkPositions = [];
  for (let x = -2.9; x <= 0.6; x += 0.22) boardwalkPositions.push(x);
  const plankGeometry = kit.geometry("plank", () => roundedBox(0.2, 0.03, 0.22, 0.01));
  for (const x of boardwalkPositions) {
    const plank = kit.mesh(plankGeometry, "#d9a86c", { castShadow: false });
    plank.position.set(x, landHeight(x, 4.75) + 0.02, 4.75);
    group.add(plank);
  }
  group.add(createBridge(kit, [-3.5, 4.4], [-3.8, 7.0], { style: "arch", color: "#ff8c42" }));
  [[-2.8, 3.0, "#ffadad"], [-2.2, 2.7, "#9bf6ff"], [-1.6, 3.1, "#fdffb6"], [-0.9, 2.9, "#caffbf"]].forEach(([x, z, color]) =>
    put(group, createSmallHouse(kit, color), x, z, { scale: 0.7 }),
  );

  // Richmond: YVR, Steveston, International Buddhist Temple
  for (const z of [8.6, 10.0]) {
    const runway = kit.mesh(roundedBox(4.0, 0.03, 0.4, 0.01), "#c7ccd9", { castShadow: false });
    runway.position.set(-21.4, 0.52, z);
    group.add(runway);
  }
  put(group, createMall(kit, 1.2, 0.4, "#e4ecf7"), -20.6, 9.3);
  const controlTower = new THREE.Group();
  const mast = kit.mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 10), P.white);
  mast.position.y = 0.35;
  controlTower.add(mast);
  const cab = kit.mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.12, 12), P.glass);
  cab.position.y = 0.74;
  controlTower.add(cab);
  put(group, controlTower, -19.6, 9.2);
  const parkedPlane = createPlane(kit);
  put(group, parkedPlane.object, -21.8, 9.3, { scale: 0.28, lift: 0.19, rotation: Math.PI / 2 });

  const departingPlane = createPlane(kit);
  departingPlane.object.scale.setScalar(0.32);
  group.add(departingPlane.object);
  updaters.push((time, deltaSeconds) => {
    const cycle = 14;
    const phase = (time % cycle) / cycle;
    const x = -19.4 - phase * 18;
    const climb = Math.max(0, x < -21 ? (-21 - x) * 0.32 : 0);
    departingPlane.object.position.set(x, 0.74 + climb, 8.6);
    departingPlane.object.rotation.set(-Math.min(0.3, climb * 0.3), -Math.PI / 2, 0);
    departingPlane.object.visible = phase < 0.85;
    departingPlane.propeller.rotation.z += deltaSeconds * 30;
  });

  const cannery = kit.mesh(roundedBox(0.7, 0.3, 0.45, 0.05), "#c8553d");
  cannery.position.set(-19.8, landHeight(-19.8, 12.5) + 0.15, 12.5);
  group.add(cannery);
  const fishingBoats = [[-18.6, 13.4, 0], [-19.6, 13.8, 1.6]].map(([x, z, phase]) => {
    const boat = createBoat(kit, phase ? "#3d6fb6" : "#e76f51", P.white);
    boat.scale.setScalar(0.3);
    boat.position.set(x, 0.52, z);
    boat.rotation.y = 1.2;
    group.add(boat);
    return { boat, phase };
  });
  updaters.push((time) => {
    for (const { boat, phase } of fishingBoats) boat.position.y = 0.53 + Math.sin(time * 2 + phase) * 0.02;
  });
  put(group, createTemple(kit), -13.2, 10.6, { scale: 1.1 });
  scatter(group, -15.8, 9.0, () => createCherryTree(kit, 1), [[0, 0, 0.36], [0.9, 0.6, 0.34], [-1.0, 0.8, 0.36]]);

  // Surrey & Langley
  put(group, createTower(kit, 0.5, 2.0, "#bde0fe"), 2.4, 9.0);
  put(group, createTower(kit, 0.38, 1.1, "#a2d2ff"), 3.0, 9.4);
  put(group, createTower(kit, 0.36, 0.8, "#cdb4db"), 1.8, 9.5);
  put(group, createFort(kit), 16.6, 7.2, { scale: 0.9 });
  put(group, createFieldRows(kit, 5, 10, "#6fbf5f", "#8e44ad"), 19.4, 12.8, { rotation: 0.1 });

  // Port Moody: Rocky Point Park pier and Brewery Row
  const pier = kit.mesh(roundedBox(0.22, 0.04, 0.9, 0.02), "#c79a6b");
  pier.position.set(2.4, 0.56, -6.0);
  group.add(pier);
  put(group, createMall(kit, 0.7, 0.36, "#d4a373"), 0.6, -5.0);
  const barrel = kit.mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 12).rotateZ(Math.PI / 2), "#8d5b3c");
  barrel.position.set(1.1, 0.58, -4.75);
  group.add(barrel);

  // Coquitlam: Lafarge Lake fountain, Coquitlam Centre, Coquitlam Crunch, Town Centre Park, Mundy Park
  const fountain = createFountain(kit);
  fountain.object.position.set(4.7, 0.52, -3.3);
  group.add(fountain.object);
  updaters.push(fountain.update);
  put(group, createMall(kit, 1.3, 0.75, "#f4e1c1"), 6.3, -3.6);
  scatter(group, 4.7, -3.3, () => createCherryTree(kit, 1), [[-0.9, -0.2, 0.32], [0.9, 0.3, 0.3], [0.1, -0.75, 0.3], [-0.6, 0.6, 0.3]]);
  const crunchPath = [];
  for (let index = 0; index <= 14; index += 1) {
    const t = index / 14;
    crunchPath.push([5.2 + t * 1.2 + Math.sin(t * Math.PI * 5) * 0.35, -5.1 - t * 1.8]);
  }
  const stepGeometry = kit.geometry("crunch-step", () => roundedBox(0.12, 0.03, 0.12, 0.01));
  for (const [x, z] of crunchPath) {
    const step = kit.mesh(stepGeometry, "#e9c46a", { castShadow: false });
    step.position.set(x, landHeight(x, z) + 0.02, z);
    group.add(step);
  }
  scatter(group, 6.4, -6.9, pine, [[-1.2, 0.4, 0.38], [1.0, 0.6, 0.4], [-0.6, -1.0, 0.42], [1.3, -0.6, 0.38], [0.4, -1.5, 0.36]]);
  scatter(group, 1.6, 0.6, pine, [
    [0, 0, 0.42], [0.5, 0.3, 0.38], [-0.5, 0.4, 0.4], [0.3, -0.4, 0.36], [-0.4, -0.3, 0.44], [0.9, -0.1, 0.36], [-0.9, 0.1, 0.38],
  ]);

  // Port Coquitlam, Pitt Meadows, Maple Ridge
  [[9.0, -1.8, "#ffd6a5"], [9.6, -1.2, "#bde0fe"], [8.8, -0.6, "#ffc8dd"], [9.8, -0.2, "#caffbf"]].forEach(([x, z, color]) =>
    put(group, createSmallHouse(kit, color), x, z, { scale: 0.7 }),
  );
  put(group, createFieldRows(kit, 4, 9, "#4f9d69", "#3a56c5"), 13.0, 2.8);
  put(group, createFieldRows(kit, 4, 8, "#4f9d69", "#3a56c5"), 13.4, -1.6, { rotation: 0.2 });
  group.add(createBridge(kit, [14.8, 3.9], [14.5, 6.1], { style: "cablestay", color: "#dfe4ea" }));
  group.add(createBridge(kit, [6.6, 4.0], [6.9, 5.7], { style: "cablestay", color: P.white }));
  [[18.0, 1.2, 0.4, 0.9], [18.6, 1.6, 0.36, 0.7]].forEach(([x, z, width, height]) =>
    put(group, createTower(kit, width, height, "#ffcfd2"), x, z),
  );
  [[19.4, 0.8, "#fde4cf"], [17.4, 0.4, "#cfbaf0"], [20.0, 1.8, "#a3c4f3"]].forEach(([x, z, color]) =>
    put(group, createSmallHouse(kit, color), x, z, { scale: 0.7 }),
  );
  scatter(group, 21.5, -8.6, pine, [
    [-1.1, 1.4, 0.44], [1.0, 1.0, 0.42], [-1.0, -1.0, 0.46], [1.1, -1.6, 0.44], [0.9, 2.4, 0.4], [-1.2, 2.6, 0.42],
  ]);

  return {
    group,
    update(time, deltaSeconds) {
      for (const updater of updaters) updater(time, deltaSeconds);
    },
  };
}

export function createSmallHouse(kit, wallColor, roofColor = "#5b6275") {
  const house = new THREE.Group();
  const body = kit.mesh(roundedBox(0.5, 0.3, 0.42, 0.05), wallColor);
  body.position.y = 0.15;
  house.add(body);
  const roof = kit.mesh(new THREE.ConeGeometry(0.42, 0.24, 4), roofColor, { flat: true });
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.05, 1, 0.85);
  roof.position.y = 0.42;
  house.add(roof);
  return house;
}

/** Instanced bushes and houses that fill the gaps between landmarks. */
export function createFiller(kit, isFree, random) {
  const group = new THREE.Group();
  const treePositions = [];
  const housePositions = [];
  for (let attempt = 0; attempt < 5200 && (treePositions.length < 520 || housePositions.length < 160); attempt += 1) {
    const x = -26 + random() * 58;
    const z = -11 + random() * 27;
    const wantsHouse = housePositions.length < 160 && random() < 0.3 && z > -9;
    const radius = wantsHouse ? 0.4 : 0.22;
    if (!isFree(x, z, radius)) continue;
    if (wantsHouse) housePositions.push([x, z]);
    else if (treePositions.length < 520) treePositions.push([x, z]);
  }

  const treeColors = ["#5fb874", "#4aa66a", "#7cc96b", "#3f9a6b"].map((color) => new THREE.Color(color));
  const trees = new THREE.InstancedMesh(kit.track(new THREE.SphereGeometry(0.2, 10, 8)), kit.material(P.white), treePositions.length);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  treePositions.forEach(([x, z], index) => {
    const size = 0.8 + random() * 0.6;
    matrix.compose(new THREE.Vector3(x, landHeight(x, z) + 0.14 * size, z), quaternion, new THREE.Vector3(size, size * 1.15, size));
    trees.setMatrixAt(index, matrix);
    trees.setColorAt(index, treeColors[index % treeColors.length]);
  });
  trees.castShadow = true;
  trees.receiveShadow = true;
  group.add(trees);

  const wallColors = ["#fff1d6", "#ffd6a5", "#bde0fe", "#ffc8dd", "#caffbf", "#fdffb6", "#e2ece9"].map((color) => new THREE.Color(color));
  const bodies = new THREE.InstancedMesh(kit.track(roundedBox(0.36, 0.22, 0.3, 0.04)), kit.material(P.white), housePositions.length);
  const roofs = new THREE.InstancedMesh(kit.track(new THREE.ConeGeometry(0.3, 0.18, 4)), kit.material("#6b7190", { flat: true }), housePositions.length);
  housePositions.forEach(([x, z], index) => {
    const y = landHeight(x, z);
    const turn = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.floor(random() * 4) * (Math.PI / 2));
    matrix.compose(new THREE.Vector3(x, y + 0.11, z), turn, new THREE.Vector3(1, 1, 1));
    bodies.setMatrixAt(index, matrix);
    bodies.setColorAt(index, wallColors[index % wallColors.length]);
    const roofTurn = turn.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 4));
    matrix.compose(new THREE.Vector3(x, y + 0.31, z), roofTurn, new THREE.Vector3(1, 1, 1));
    roofs.setMatrixAt(index, matrix);
  });
  for (const instanced of [bodies, roofs]) {
    instanced.castShadow = true;
    instanced.receiveShadow = true;
    group.add(instanced);
  }
  return group;
}
