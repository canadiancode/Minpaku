import * as THREE from "three";
import { palette as P, roundedBox } from "../hero3d/toonKit.js";

/* Bubbly dollhouse furniture. Everything faces +z unless rotated by the caller. */

const WOOD = "#c99566";
const WOOD_DARK = "#9a6b45";

function placed(object, x, y, z) {
  object.position.set(x, y, z);
  return object;
}

function group(...children) {
  const container = new THREE.Group();
  for (const child of children) container.add(child);
  return container;
}

export function rug(kit, width, depth, color) {
  return placed(kit.mesh(roundedBox(width, 0.04, depth, 0.02), color, { castShadow: false }), 0, 0.02, 0);
}

export function bed(kit, { width = 1.5, length = 2.0, duvet = "#ffadc0", pillow = P.white, headboard = WOOD } = {}) {
  const halfLength = length / 2;
  const bedGroup = group(
    placed(kit.mesh(roundedBox(width + 0.12, 0.28, length + 0.08, 0.06), WOOD), 0, 0.14, 0),
    placed(kit.mesh(roundedBox(width, 0.22, length, 0.09), "#fdfbf6"), 0, 0.39, 0),
    placed(kit.mesh(roundedBox(width + 0.05, 0.14, length * 0.66, 0.06), duvet), 0, 0.47, halfLength * 0.32),
    placed(kit.mesh(roundedBox(width + 0.14, 0.85, 0.14, 0.06), headboard), 0, 0.5, -halfLength - 0.02),
  );
  const pillows = width > 1.3 ? [-width / 4, width / 4] : [0];
  for (const x of pillows) {
    bedGroup.add(placed(kit.mesh(roundedBox(width / pillows.length - 0.12, 0.14, 0.36, 0.06), pillow), x, 0.55, -halfLength + 0.3));
  }
  return bedGroup;
}

/** Folded towels and a paper crane: the welcome touch on guest beds. */
export function welcomeSet(kit) {
  const set = group(
    placed(kit.mesh(roundedBox(0.36, 0.07, 0.26, 0.03), P.white), 0, 0.035, 0),
    placed(kit.mesh(roundedBox(0.34, 0.07, 0.24, 0.03), "#9fe0f2"), 0, 0.1, 0),
  );
  const crane = new THREE.Group();
  crane.add(placed(kit.mesh(new THREE.ConeGeometry(0.06, 0.16, 4), "#ff8fab", { flat: true }), 0, 0.08, 0));
  const wingGeometry = new THREE.ConeGeometry(0.04, 0.2, 3).rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    const wing = kit.mesh(wingGeometry, "#ff8fab", { flat: true });
    wing.position.set(side * 0.08, 0.1, 0);
    wing.rotation.z = side * 0.4;
    crane.add(wing);
  }
  set.add(placed(crane, 0, 0.13, 0));
  return set;
}

export function nightstand(kit, lampColor = "#ffe9a8") {
  return group(
    placed(kit.mesh(roundedBox(0.42, 0.46, 0.38, 0.05), WOOD), 0, 0.23, 0),
    placed(kit.mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.22, 10), P.white), 0, 0.57, 0),
    placed(kit.mesh(new THREE.ConeGeometry(0.16, 0.18, 16, 1, true), lampColor, { emissive: "#6b5418", side: THREE.DoubleSide }), 0, 0.75, 0),
  );
}

export function plant(kit, scale = 1) {
  const plantGroup = group(
    placed(kit.mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.28, 14), "#e07a5f"), 0, 0.14, 0),
    placed(kit.mesh(new THREE.SphereGeometry(0.24, 14, 10), "#5fb874"), 0, 0.46, 0),
    placed(kit.mesh(new THREE.SphereGeometry(0.17, 12, 10), "#7cc96b"), 0.12, 0.62, 0.05),
  );
  plantGroup.scale.setScalar(scale);
  return plantGroup;
}

export function sofa(kit, { width = 2.0, color = "#7a9cc6", cushion = "#9db8db" } = {}) {
  const sofaGroup = group(
    placed(kit.mesh(roundedBox(width, 0.32, 0.86, 0.1), color), 0, 0.24, 0),
    placed(kit.mesh(roundedBox(width, 0.62, 0.24, 0.1), color), 0, 0.5, -0.33),
  );
  for (const side of [-1, 1]) {
    sofaGroup.add(placed(kit.mesh(roundedBox(0.22, 0.5, 0.86, 0.09), color), side * (width / 2 - 0.08), 0.38, 0));
  }
  const seats = Math.max(2, Math.round(width / 0.8));
  const seatWidth = (width - 0.4) / seats;
  for (let index = 0; index < seats; index += 1) {
    const x = -width / 2 + 0.2 + seatWidth * (index + 0.5);
    sofaGroup.add(placed(kit.mesh(roundedBox(seatWidth - 0.04, 0.14, 0.62, 0.06), cushion), x, 0.46, 0.06));
  }
  sofaGroup.add(placed(kit.mesh(roundedBox(0.34, 0.3, 0.12, 0.06), "#ffd166"), -width / 2 + 0.42, 0.62, -0.12));
  return sofaGroup;
}

export function coffeeTable(kit) {
  return group(
    placed(kit.mesh(roundedBox(1.0, 0.08, 0.56, 0.04), WOOD), 0, 0.36, 0),
    placed(kit.mesh(roundedBox(0.9, 0.06, 0.46, 0.03), WOOD_DARK), 0, 0.12, 0),
    placed(kit.mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 12), P.white), 0.22, 0.45, 0.05),
    placed(kit.mesh(roundedBox(0.26, 0.04, 0.18, 0.015), "#e76f51"), -0.2, 0.42, -0.02),
  );
}

/** Television whose screen colour drifts slowly — returns `{ object, screen }`. */
export function television(kit) {
  const screenMaterial = kit.track(new THREE.MeshBasicMaterial({ color: "#6ec6ff" }));
  const screen = new THREE.Mesh(kit.track(new THREE.PlaneGeometry(1.08, 0.6)), screenMaterial);
  const tv = group(
    placed(kit.mesh(roundedBox(1.5, 0.42, 0.42, 0.06), WOOD_DARK), 0, 0.21, 0),
    placed(kit.mesh(roundedBox(1.2, 0.72, 0.08, 0.04), "#22252f"), 0, 0.84, 0),
    placed(screen, 0, 0.84, 0.045),
  );
  return { object: tv, screen };
}

export function bookshelf(kit) {
  const shelf = group(placed(kit.mesh(roundedBox(0.9, 1.5, 0.34, 0.04), WOOD), 0, 0.75, 0));
  const bookColors = ["#e76f51", "#2a9d8f", "#e9c46a", "#264653", "#f4a261", "#8ecae6"];
  for (let row = 0; row < 3; row += 1) {
    for (let index = 0; index < 5; index += 1) {
      const height = 0.24 + ((index * 7 + row * 3) % 4) * 0.03;
      const book = kit.mesh(roundedBox(0.12, height, 0.24, 0.02), bookColors[(index + row * 2) % bookColors.length], { castShadow: false });
      shelf.add(placed(book, -0.3 + index * 0.15, 0.22 + row * 0.46 + height / 2, 0.06));
    }
  }
  return shelf;
}

export function diningTable(kit, chairs = 4) {
  const table = group(
    placed(kit.mesh(roundedBox(1.7, 0.1, 0.95, 0.05), WOOD), 0, 0.74, 0),
    placed(kit.mesh(roundedBox(1.4, 0.68, 0.12, 0.04), WOOD_DARK), 0, 0.36, 0),
  );
  const chairPositions = [[-0.45, 1], [0.45, 1], [-0.45, -1], [0.45, -1]].slice(0, chairs);
  for (const [x, side] of chairPositions) {
    const chair = group(
      placed(kit.mesh(roundedBox(0.42, 0.08, 0.42, 0.04), "#f2cc8f"), 0, 0.46, 0),
      placed(kit.mesh(roundedBox(0.42, 0.46, 0.08, 0.04), "#f2cc8f"), 0, 0.72, -0.18),
      placed(kit.mesh(roundedBox(0.34, 0.44, 0.34, 0.04), WOOD_DARK), 0, 0.22, 0),
    );
    chair.position.set(x, 0, side * 0.72);
    chair.rotation.y = side > 0 ? Math.PI : 0;
    table.add(chair);
  }
  // A home-cooked spread: bowls, a nabe pot and a fruit plate.
  const bowlGeometry = new THREE.SphereGeometry(0.1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  for (const [x, z, color] of [[-0.5, 0.25, P.white], [0.5, 0.25, P.white], [-0.5, -0.25, P.white], [0.5, -0.25, P.white]]) {
    table.add(placed(kit.mesh(bowlGeometry, color, { side: THREE.DoubleSide }), x, 0.89, z));
  }
  table.add(placed(kit.mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.16, 20), "#3b3d4f"), 0, 0.88, 0));
  table.add(placed(kit.mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 20), "#f4a261", { castShadow: false }), 0, 0.965, 0));
  return table;
}

export function kitchen(kit) {
  const cabinet = "#9cc9b3";
  const counter = "#f7f3ea";
  const kitchenGroup = group(
    // Counter run along the back wall
    placed(kit.mesh(roundedBox(3.0, 0.82, 0.62, 0.05), cabinet), 0, 0.41, 0),
    placed(kit.mesh(roundedBox(3.08, 0.08, 0.68, 0.03), counter), 0, 0.86, 0.02),
    // Upper cabinets
    placed(kit.mesh(roundedBox(2.2, 0.6, 0.36, 0.05), cabinet), -0.3, 1.75, -0.12),
    // Fridge
    placed(kit.mesh(roundedBox(0.82, 1.9, 0.7, 0.09), "#eef1f5"), 1.95, 0.95, 0.02),
    placed(kit.mesh(roundedBox(0.04, 0.5, 0.05, 0.02), "#b8c0cc"), 1.7, 1.25, 0.39),
    // Stove top and a pot
    placed(kit.mesh(roundedBox(0.7, 0.03, 0.5, 0.01), "#2b2d36", { castShadow: false }), -0.8, 0.91, 0.03),
    placed(kit.mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.22, 18), "#e76f51"), -0.95, 1.03, 0.03),
    // Rice cooker and kettle
    placed(kit.mesh(new THREE.CylinderGeometry(0.16, 0.17, 0.24, 18), P.white), 0.5, 1.02, 0.02),
    placed(kit.mesh(new THREE.SphereGeometry(0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), "#f2f2f2"), 0.5, 1.14, 0.02),
    placed(kit.mesh(new THREE.SphereGeometry(0.13, 14, 10), "#ffd166"), 0.95, 1.0, 0.05),
  );
  return kitchenGroup;
}

export function kitchenIsland(kit) {
  const island = group(
    placed(kit.mesh(roundedBox(1.6, 0.82, 0.72, 0.06), "#f2e3c9"), 0, 0.41, 0),
    placed(kit.mesh(roundedBox(1.7, 0.08, 0.82, 0.03), "#fbf7ef"), 0, 0.86, 0),
    placed(kit.mesh(new THREE.SphereGeometry(0.12, 12, 10), "#e63946"), -0.3, 0.97, 0.1),
    placed(kit.mesh(new THREE.SphereGeometry(0.11, 12, 10), "#f4a261"), -0.12, 0.96, 0.18),
    placed(kit.mesh(new THREE.SphereGeometry(0.1, 12, 10), "#90be6d"), -0.22, 0.96, -0.06),
  );
  for (const x of [-0.45, 0.35]) {
    island.add(placed(kit.mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 16), "#264653"), x, 0.66, 0.62));
    island.add(placed(kit.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 8), "#3b3d4f"), x, 0.32, 0.62));
  }
  return island;
}

export function pendantLight(kit, drop = 0.9) {
  return group(
    placed(kit.mesh(new THREE.CylinderGeometry(0.01, 0.01, drop, 6), "#3b3d4f", { castShadow: false }), 0, -drop / 2, 0),
    placed(
      kit.mesh(new THREE.ConeGeometry(0.2, 0.2, 16, 1, true), "#ffd166", { emissive: "#6b5418", side: THREE.DoubleSide, castShadow: false }),
      0,
      -drop - 0.06,
      0,
    ),
  );
}

export function toilet(kit) {
  return group(
    placed(kit.mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.36, 16), P.white), 0, 0.18, 0.05),
    placed(kit.mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.08, 18), "#f4f6f9"), 0, 0.4, 0.08),
    placed(kit.mesh(roundedBox(0.44, 0.5, 0.2, 0.06), P.white), 0, 0.55, -0.2),
  );
}

export function vanity(kit) {
  return group(
    placed(kit.mesh(roundedBox(0.9, 0.78, 0.48, 0.05), "#a8d5e2"), 0, 0.39, 0),
    placed(kit.mesh(roundedBox(0.96, 0.06, 0.54, 0.02), P.white), 0, 0.81, 0),
    placed(kit.mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.06, 18), "#dff3fb", { castShadow: false }), 0, 0.85, 0.04),
    placed(kit.mesh(roundedBox(0.6, 0.7, 0.04, 0.03), "#cfeefa", { emissive: "#1d3440" }), 0, 1.5, -0.2),
  );
}

export function bathtub(kit) {
  return group(
    placed(kit.mesh(roundedBox(1.5, 0.52, 0.76, 0.2), P.white), 0, 0.26, 0),
    placed(kit.mesh(roundedBox(1.3, 0.04, 0.58, 0.02), "#8fd4f5", { castShadow: false }), 0, 0.5, 0),
    placed(kit.mesh(new THREE.SphereGeometry(0.07, 10, 8), "#ffd166"), 0.3, 0.55, 0.1),
  );
}

export function dresser(kit) {
  const dresserGroup = group(placed(kit.mesh(roundedBox(1.1, 0.8, 0.46, 0.05), WOOD), 0, 0.4, 0));
  for (const y of [0.22, 0.5]) {
    for (const x of [-0.26, 0.26]) {
      dresserGroup.add(placed(kit.mesh(new THREE.SphereGeometry(0.03, 8, 6), "#e9c46a", { castShadow: false }), x, y, 0.24));
    }
  }
  return dresserGroup;
}

/** Skis, a snowboard, pickleball paddles and hiking boots — the hosts' gear wall. */
export function gearWall(kit) {
  const gear = new THREE.Group();
  for (const [x, color] of [[-0.55, "#e63946"], [-0.4, "#e63946"]]) {
    const ski = kit.mesh(roundedBox(0.1, 1.7, 0.04, 0.02), color);
    ski.position.set(x, 0.86, 0);
    ski.rotation.z = 0.08;
    gear.add(ski);
  }
  const board = kit.mesh(roundedBox(0.34, 1.45, 0.05, 0.12), "#4cc9f0");
  board.position.set(0.0, 0.75, 0);
  board.rotation.z = -0.06;
  gear.add(board);
  gear.add(placed(kit.mesh(roundedBox(0.2, 0.3, 0.04, 0.02), "#ffd166", { castShadow: false }), 0, 0.85, 0.03));
  const paddleColors = ["#2a9d8f", "#f4a261"];
  paddleColors.forEach((color, index) => {
    const paddle = group(
      placed(kit.mesh(roundedBox(0.3, 0.36, 0.03, 0.1), color), 0, 0.2, 0),
      placed(kit.mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), "#3b3d4f"), 0, -0.06, 0),
    );
    paddle.position.set(0.5 + index * 0.36, 1.25, 0);
    paddle.rotation.z = (index - 0.5) * 0.3;
    gear.add(paddle);
  });
  gear.add(placed(kit.mesh(new THREE.SphereGeometry(0.06, 10, 8), "#d8f35a"), 0.68, 0.98, 0.04));
  for (const x of [0.45, 0.72]) {
    gear.add(placed(kit.mesh(roundedBox(0.2, 0.18, 0.36, 0.07), "#8d5b3c"), x, 0.09, 0.3));
  }
  gear.add(placed(kit.mesh(roundedBox(0.46, 0.6, 0.28, 0.12), "#f77f00"), 1.1, 0.3, 0.2));
  return gear;
}

export function wallWindow(kit, width = 1.1, height = 0.9) {
  return group(
    placed(kit.mesh(roundedBox(width + 0.12, height + 0.12, 0.08, 0.03), P.white, { castShadow: false }), 0, 0, 0),
    placed(kit.mesh(roundedBox(width, height, 0.1, 0.02), "#bfe9f5", { castShadow: false, emissive: "#2b3b44" }), 0, 0, 0),
    placed(kit.mesh(roundedBox(0.04, height, 0.12, 0.01), P.white, { castShadow: false }), 0, 0, 0),
  );
}
