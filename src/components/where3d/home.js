import * as THREE from "three";
import { palette as P, roundedBox } from "../hero3d/toonKit.js";
import { createCar, createPine, createRoundTree } from "../hero3d/props.js";
import { ribbonGeometry, curveFromPoints } from "./terrain.js";
import { HOME, LAND_TOP } from "./tour.js";

const HOUSE_DEPTH = 0.9;
export const STREET_Z = HOME.z + 1.25;

function placed(object, x, y, z) {
  object.position.set(x, y, z);
  return object;
}

function gableRoof(width, height, depth, overhang) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 - overhang, 0);
  shape.lineTo(width / 2 + overhang, 0);
  shape.lineTo(0, height);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: depth + overhang * 2,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  }).translate(0, 0, -(depth + overhang * 2) / 2);
}

function addWindow(kit, parent, x, y, z, width = 0.2, height = 0.17) {
  parent.add(placed(kit.mesh(roundedBox(width + 0.05, height + 0.05, 0.03, 0.012), P.white, { castShadow: false }), x, y, z));
  parent.add(placed(kit.mesh(roundedBox(width, height, 0.035, 0.01), "#bfe9f5", { castShadow: false, emissive: "#3b3010" }), x, y, z + 0.004));
  parent.add(placed(kit.mesh(roundedBox(0.012, height, 0.04, 0.004), P.white, { castShadow: false }), x, y, z + 0.006));
}

/** Two-storey West Coast family home; front faces +z. */
export function createHouse(kit, { lower = "#f6e7c8", upper = "#9cc9b3", roof = "#59627a", door = P.brand, detailed = true } = {}) {
  const house = new THREE.Group();
  const width = 1.3;
  const floor = 0.4;
  const front = HOUSE_DEPTH / 2;

  house.add(placed(kit.mesh(roundedBox(width + 0.08, 0.06, HOUSE_DEPTH + 0.08, 0.02), "#d9d3c7"), 0, 0.03, 0));
  house.add(placed(kit.mesh(roundedBox(width, floor, HOUSE_DEPTH, 0.04), lower), 0, 0.06 + floor / 2, 0));
  house.add(placed(kit.mesh(roundedBox(width + 0.04, 0.035, HOUSE_DEPTH + 0.04, 0.012), P.white), 0, 0.06 + floor, 0));
  house.add(placed(kit.mesh(roundedBox(width, floor, HOUSE_DEPTH, 0.04), upper), 0, 0.06 + floor * 1.5 + 0.02, 0));
  const roofMesh = kit.mesh(gableRoof(width, 0.42, HOUSE_DEPTH, 0.08), roof);
  roofMesh.position.y = 0.08 + floor * 2;
  house.add(roofMesh);
  house.add(placed(kit.mesh(roundedBox(0.14, 0.4, 0.14, 0.03), "#b5654a"), -0.38, 0.06 + floor * 2 + 0.22, -0.18));

  // Ground floor: door with porch, two windows
  house.add(placed(kit.mesh(roundedBox(0.2, 0.3, 0.04, 0.03), door), 0, 0.06 + 0.15, front + 0.01));
  house.add(placed(kit.mesh(new THREE.SphereGeometry(0.014, 8, 6), P.yellow, { castShadow: false }), 0.065, 0.21, front + 0.035));
  house.add(placed(kit.mesh(roundedBox(0.44, 0.04, 0.24, 0.015), roof), 0, 0.06 + 0.35, front + 0.1));
  for (const side of [-1, 1]) {
    house.add(placed(kit.mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.34, 6), P.white), side * 0.19, 0.06 + 0.17, front + 0.2));
  }
  house.add(placed(kit.mesh(roundedBox(0.34, 0.045, 0.12, 0.015), "#cfc7ba"), 0, 0.022, front + 0.08));
  addWindow(kit, house, -0.4, 0.06 + 0.2, front + 0.01);
  addWindow(kit, house, 0.4, 0.06 + 0.2, front + 0.01);

  // Upper floor: two windows + round gable window
  addWindow(kit, house, -0.32, 0.06 + floor * 1.5 + 0.02, front + 0.01, 0.24, 0.18);
  addWindow(kit, house, 0.32, 0.06 + floor * 1.5 + 0.02, front + 0.01, 0.24, 0.18);
  const gableWindow = kit.mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 18).rotateX(Math.PI / 2), "#bfe9f5", {
    castShadow: false,
    emissive: "#3b3010",
  });
  house.add(placed(gableWindow, 0, 0.08 + floor * 2 + 0.15, front + 0.09));

  if (detailed) {
    // Attached garage
    house.add(placed(kit.mesh(roundedBox(0.58, 0.36, HOUSE_DEPTH - 0.04, 0.04), lower), width / 2 + 0.28, 0.06 + 0.18, 0.02));
    house.add(placed(kit.mesh(roundedBox(0.64, 0.05, HOUSE_DEPTH + 0.04, 0.02), roof), width / 2 + 0.28, 0.06 + 0.38, 0.02));
    house.add(placed(kit.mesh(roundedBox(0.44, 0.27, 0.03, 0.02), P.white), width / 2 + 0.28, 0.06 + 0.14, front + 0.01));
    for (let index = 1; index < 4; index += 1) {
      house.add(placed(kit.mesh(roundedBox(0.42, 0.008, 0.035, 0.003), "#d8dbe2", { castShadow: false }), width / 2 + 0.28, 0.06 + index * 0.068, front + 0.02));
    }
  }
  return house;
}

function createJapaneseMaple(kit) {
  const tree = createRoundTree(kit, "#e4572e", 1);
  const accent = kit.mesh(kit.geometry("maple-accent", () => new THREE.SphereGeometry(0.32, 14, 10)), "#f28f3b");
  tree.add(placed(accent, 0.28, 1.12, 0.1));
  return tree;
}

function createWelcomeSign(kit) {
  const sign = new THREE.Group();
  sign.add(placed(kit.mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), "#a8714f"), 0, 0.11, 0));
  sign.add(placed(kit.mesh(roundedBox(0.3, 0.12, 0.025, 0.02), P.cream), 0, 0.24, 0));

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 200;
  const context = canvas.getContext("2d");
  context.fillStyle = P.brandDeep;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "700 74px system-ui, -apple-system, sans-serif";
  context.fillText("WELCOME", 256, 70);
  context.font = '700 58px "Hiragino Sans", "Yu Gothic", "Noto Sans JP", system-ui, sans-serif';
  context.fillText("ようこそ", 256, 150);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const face = kit.mesh(new THREE.PlaneGeometry(0.28, 0.11), null, {
    material: kit.texturedMaterial(texture, { transparent: true }),
    castShadow: false,
  });
  sign.add(placed(face, 0, 0.24, 0.014));
  return sign;
}

function createPlaidTexture(kit) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  context.fillStyle = "#c0392b";
  context.fillRect(0, 0, 64, 64);
  context.fillStyle = "rgba(40, 20, 30, 0.55)";
  for (const offset of [0, 32]) {
    context.fillRect(offset + 8, 0, 10, 64);
    context.fillRect(0, offset + 8, 64, 10);
  }
  context.fillStyle = "rgba(255, 255, 255, 0.25)";
  context.fillRect(28, 0, 2, 64);
  context.fillRect(0, 28, 64, 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  texture.magFilter = THREE.NearestFilter;
  return kit.texturedMaterial(texture);
}

/**
 * Chibi-style person, one unit tall, facing +z. `waveSide` is the arm that
 * waves (+1 = their left, on screen right); the other hand reaches inward.
 */
function createPerson(kit, look) {
  const person = new THREE.Group();
  const body = new THREE.Group();
  person.add(body);
  const add = (object, x, y, z) => {
    body.add(placed(object, x, y, z));
    return object;
  };

  for (const side of [-1, 1]) {
    add(kit.mesh(roundedBox(0.12, 0.07, 0.19, 0.03), look.shoes), side * 0.075, 0.035, 0.025);
    add(kit.mesh(new THREE.CapsuleGeometry(0.062, 0.16, 6, 12), look.legs), side * 0.075, 0.17, 0);
  }
  if (look.skirt) {
    add(kit.mesh(new THREE.CylinderGeometry(0.13, 0.21, 0.26, 20), look.skirt), 0, 0.3, 0);
  }
  const torso = add(kit.mesh(new THREE.CapsuleGeometry(0.155, 0.14, 8, 18), null, { material: look.shirtMaterial }), 0, 0.45, 0);
  torso.scale.z = 0.85;
  if (look.collar) {
    const collar = add(kit.mesh(new THREE.TorusGeometry(0.075, 0.022, 6, 16).rotateX(Math.PI / 2), look.collar), 0, 0.6, 0.015);
    collar.scale.z = 0.8;
  }

  const shoulders = {};
  for (const side of [-1, 1]) {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.17, 0.56, 0);
    body.add(shoulder);
    shoulder.add(placed(kit.mesh(new THREE.CapsuleGeometry(0.048, 0.18, 6, 10), null, { material: look.sleeveMaterial }), 0, -0.12, 0));
    shoulder.add(placed(kit.mesh(new THREE.SphereGeometry(0.052, 12, 10), look.skin), 0, -0.25, 0));
    shoulders[side] = shoulder;
  }

  const head = new THREE.Group();
  head.position.y = 0.8;
  body.add(head);
  head.add(kit.mesh(new THREE.SphereGeometry(0.2, 28, 20), look.skin));
  for (const side of [-1, 1]) {
    head.add(placed(kit.mesh(new THREE.SphereGeometry(0.04, 10, 8), look.skin), side * 0.195, -0.01, 0));
    head.add(placed(kit.mesh(new THREE.SphereGeometry(0.024, 10, 8), "#2b2433", { castShadow: false }), side * 0.068, 0.015, 0.18));
    head.add(placed(kit.mesh(new THREE.SphereGeometry(0.008, 6, 5), P.white, { castShadow: false }), side * 0.068 + 0.008, 0.026, 0.2));
    const cheek = placed(kit.mesh(new THREE.SphereGeometry(0.034, 10, 8), "#ff9eaa", { castShadow: false }), side * 0.115, -0.045, 0.155);
    cheek.scale.set(1, 0.6, 0.4);
    head.add(cheek);
  }
  const smile = kit.mesh(new THREE.TorusGeometry(0.04, 0.009, 6, 16, Math.PI), "#7a2f3b", { castShadow: false });
  smile.rotation.z = Math.PI;
  head.add(placed(smile, 0, -0.06, 0.185));

  const hairMaterial = kit.material(look.hair, { side: THREE.DoubleSide });
  const hairTop = new THREE.Mesh(kit.track(new THREE.SphereGeometry(0.212, 28, 16, 0, Math.PI * 2, 0, look.topCap)), hairMaterial);
  hairTop.castShadow = true;
  head.add(hairTop);
  const faceGap = look.faceGap;
  const hairBack = new THREE.Mesh(
    kit.track(new THREE.SphereGeometry(0.218, 28, 16, Math.PI / 2 + faceGap / 2, Math.PI * 2 - faceGap, 0, look.backCap)),
    hairMaterial,
  );
  hairBack.castShadow = true;
  head.add(hairBack);
  if (look.fringe) {
    const fringe = kit.mesh(new THREE.SphereGeometry(0.2, 24, 12, Math.PI / 2 - 0.9, 1.8, 0.3, 0.55), null, { material: hairMaterial });
    fringe.scale.set(1.04, 1.02, 1.08);
    head.add(fringe);
  }
  if (look.streak) {
    const streak = kit.mesh(new THREE.SphereGeometry(0.214, 12, 8, Math.PI / 2 + 0.55, 0.12, 0.15, 0.7), null, {
      material: kit.material(look.streak, { side: THREE.DoubleSide }),
    });
    head.add(streak);
  }
  if (look.glasses) {
    for (const side of [-1, 1]) {
      head.add(placed(kit.mesh(new THREE.TorusGeometry(0.042, 0.007, 6, 18), "#3b3b46", { castShadow: false }), side * 0.068, 0.015, 0.192));
    }
    head.add(placed(kit.mesh(roundedBox(0.04, 0.008, 0.008, 0.003), "#3b3b46", { castShadow: false }), 0, 0.022, 0.198));
  }
  if (look.earrings) {
    for (const side of [-1, 1]) {
      head.add(placed(kit.mesh(new THREE.SphereGeometry(0.014, 8, 6), "#fdfbf3", { castShadow: false }), side * 0.19, -0.105, 0.03));
    }
  }

  const waveSide = look.waveSide;
  function update(time, offset) {
    const t = time + offset;
    shoulders[waveSide].rotation.z = waveSide * (2.55 + Math.sin(t * 7.5) * 0.38);
    shoulders[-waveSide].rotation.z = -waveSide * 0.55;
    shoulders[-waveSide].rotation.x = -0.15;
    body.position.y = Math.abs(Math.sin(t * 3.75)) * 0.03;
    head.rotation.z = Math.sin(t * 1.9) * 0.09;
    head.rotation.x = -0.05;
  }
  return { object: person, update };
}

export function createHome(kit) {
  const group = new THREE.Group();
  const base = new THREE.Vector3(HOME.x, LAND_TOP, HOME.z);
  const front = HOME.z + HOUSE_DEPTH / 2;

  const lawnPatch = kit.mesh(roundedBox(2.0, 0.02, 1.6, 0.01), "#a6e391", { castShadow: false });
  group.add(placed(lawnPatch, HOME.x + 0.2, LAND_TOP + 0.01, HOME.z + 0.1));

  const house = createHouse(kit);
  house.position.copy(base);
  group.add(house);

  const street = curveFromPoints([[1.0, STREET_Z], [4.6, STREET_Z], [7.2, STREET_Z]]);
  group.add(kit.mesh(ribbonGeometry(street, 0.5, LAND_TOP + 0.022, 24), P.road, { castShadow: false }));
  for (let x = 1.4; x < 7.0; x += 0.45) {
    group.add(placed(kit.mesh(kit.geometry("street-dash", () => roundedBox(0.2, 0.01, 0.035, 0.005)), P.white, { castShadow: false }), x, LAND_TOP + 0.03, STREET_Z));
  }
  group.add(placed(kit.mesh(roundedBox(0.18, 0.02, STREET_Z - 0.25 - front, 0.008), "#e6dccb", { castShadow: false }), HOME.x, LAND_TOP + 0.015, (front + STREET_Z - 0.25) / 2));
  group.add(placed(kit.mesh(roundedBox(0.5, 0.02, STREET_Z - 0.25 - front, 0.008), "#cfd2d9", { castShadow: false }), HOME.x + 0.93, LAND_TOP + 0.015, (front + STREET_Z - 0.25) / 2));

  const maple = createJapaneseMaple(kit);
  maple.scale.setScalar(0.32);
  group.add(placed(maple, HOME.x - 0.78, LAND_TOP, front + 0.2));
  const flowerGeometry = kit.geometry("flower", () => new THREE.SphereGeometry(0.03, 8, 6));
  const flowerColors = ["#ff8fab", "#ffd166", "#ffffff", "#c77dff"];
  for (let index = 0; index < 12; index += 1) {
    const side = index < 6 ? -1 : 1;
    const x = HOME.x + side * (0.2 + (index % 6) * 0.07);
    if (side === 1 && x > HOME.x + 0.55) continue;
    group.add(placed(kit.mesh(flowerGeometry, flowerColors[index % flowerColors.length], { castShadow: false }), x, LAND_TOP + 0.04, front + 0.06));
  }
  const welcome = createWelcomeSign(kit);
  welcome.rotation.y = 0.25;
  group.add(placed(welcome, HOME.x - 0.45, LAND_TOP, front + 0.32));
  const mailbox = new THREE.Group();
  mailbox.add(placed(kit.mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6), "#7a5c48"), 0, 0.07, 0));
  mailbox.add(placed(kit.mesh(roundedBox(0.07, 0.06, 0.1, 0.025), "#2f6fd6"), 0, 0.16, 0));
  group.add(placed(mailbox, HOME.x + 0.55, LAND_TOP, STREET_Z - 0.32));

  const car = createCar(kit, "#5fa8d3");
  car.scale.setScalar(0.32);
  group.add(placed(car, HOME.x + 0.93, LAND_TOP + 0.02, front + 0.22));

  const neighbours = [
    [-1.75, HOME.z, 0, { lower: "#fde2e4", upper: "#cddafd", roof: "#6b5b73" }],
    [-3.4, HOME.z, 0, { lower: "#fff1e6", upper: "#bee1e6", roof: "#5d6470" }],
    [2.05, HOME.z, 0, { lower: "#e2ece9", upper: "#f9dcc4", roof: "#5b6275" }],
    [-3.4, STREET_Z + 1.0, Math.PI, { lower: "#f0efeb", upper: "#ffd7ba", roof: "#6a6d7c" }],
    [-1.9, STREET_Z + 1.0, Math.PI, { lower: "#fefae0", upper: "#a9def9", roof: "#56607a" }],
    [1.9, STREET_Z + 1.0, Math.PI, { lower: "#eae4e9", upper: "#d0f4de", roof: "#5f5a72" }],
  ];
  for (const [dx, z, rotation, colors] of neighbours) {
    const neighbour = createHouse(kit, { ...colors, door: "#6d597a", detailed: false });
    neighbour.scale.setScalar(0.85);
    neighbour.rotation.y = rotation;
    group.add(placed(neighbour, HOME.x + dx, LAND_TOP, z));
  }
  const parked = createCar(kit, "#f4a261");
  parked.scale.setScalar(0.32);
  parked.rotation.y = Math.PI / 2;
  group.add(placed(parked, HOME.x - 2.6, LAND_TOP + 0.02, STREET_Z + 0.16));

  const yardTrees = [
    [-1.1, -0.55, "pine", 0.34], [1.2, -0.6, "round", 0.3], [-2.6, -0.5, "pine", 0.3], [2.9, -0.5, "pine", 0.32],
    [-0.5, -0.75, "round", 0.26], [-2.7, STREET_Z - HOME.z + 1.0, "round", 0.3], [2.75, STREET_Z - HOME.z + 1.1, "pine", 0.32],
    [0.75, STREET_Z - HOME.z + 1.55, "round", 0.3], [-0.8, STREET_Z - HOME.z + 1.6, "round", 0.28],
  ];
  for (const [dx, dz, kind, scale] of yardTrees) {
    const tree = kind === "pine" ? createPine(kit, scale) : createRoundTree(kit, "#7cc96b", scale);
    group.add(placed(tree, HOME.x + dx, LAND_TOP, HOME.z + dz));
  }

  // Little garden across the street, low enough not to block the hosts.
  const bushGeometry = kit.geometry("garden-bush", () => new THREE.SphereGeometry(0.12, 12, 10));
  for (const [dx, dz, color] of [
    [-0.75, 0.55, "#6cc56a"], [-0.55, 0.75, "#58b45e"], [0.7, 0.6, "#6cc56a"], [0.95, 0.8, "#58b45e"], [-1.05, 0.95, "#7fd27a"],
  ]) {
    const bush = kit.mesh(bushGeometry, color);
    bush.scale.set(1.2, 0.8, 1.2);
    group.add(placed(bush, HOME.x + dx, LAND_TOP + 0.07, STREET_Z + dz));
  }
  for (let index = 0; index < 14; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = HOME.x + side * (0.45 + (index % 5) * 0.09);
    const z = STREET_Z + 0.45 + Math.floor(index / 5) * 0.12;
    group.add(placed(kit.mesh(flowerGeometry, flowerColors[index % flowerColors.length], { castShadow: false }), x, LAND_TOP + 0.04, z));
  }

  // Hosts on the front path, holding hands and waving.
  const skinLight = "#f6d3bb";
  const skinWarm = "#f1c9a5";
  const wife = createPerson(kit, {
    skin: skinWarm,
    hair: "#2c2629",
    streak: "#a7a2a6",
    topCap: Math.PI * 0.42,
    backCap: Math.PI * 0.6,
    faceGap: 1.7,
    fringe: true,
    earrings: true,
    shirtMaterial: kit.material("#b9a3dd"),
    sleeveMaterial: kit.material("#b9a3dd"),
    collar: P.white,
    skirt: "#34406b",
    legs: skinWarm,
    shoes: "#7a4f3a",
    waveSide: -1,
  });
  const plaid = createPlaidTexture(kit);
  const husband = createPerson(kit, {
    skin: skinLight,
    hair: "#a29c96",
    topCap: Math.PI * 0.36,
    backCap: Math.PI * 0.5,
    faceGap: 2.2,
    shirtMaterial: plaid,
    sleeveMaterial: plaid,
    legs: "#3e5c8a",
    shoes: "#5b4334",
    waveSide: 1,
  });
  const hostScale = 0.34;
  const hostsZ = front + 0.24;
  wife.object.scale.setScalar(hostScale * 0.94);
  husband.object.scale.setScalar(hostScale);
  group.add(placed(wife.object, HOME.x - 0.1, LAND_TOP + 0.02, hostsZ));
  group.add(placed(husband.object, HOME.x + 0.1, LAND_TOP + 0.02, hostsZ));

  // Map pin that marks the house from far away.
  const pin = new THREE.Group();
  pin.add(placed(kit.mesh(new THREE.SphereGeometry(0.42, 24, 18), P.brand), 0, 0.62, 0));
  pin.add(placed(kit.mesh(new THREE.ConeGeometry(0.3, 0.55, 20).rotateX(Math.PI), P.brand), 0, 0.3, 0));
  pin.add(placed(kit.mesh(new THREE.SphereGeometry(0.17, 16, 12), P.white, { castShadow: false }), 0, 0.64, 0.3));
  pin.position.set(HOME.x, LAND_TOP + 1.2, HOME.z);
  group.add(pin);

  return {
    group,
    pin,
    hostsPosition: new THREE.Vector3(HOME.x, LAND_TOP + 0.2, hostsZ),
    update(time, pinVisibility, pinScale) {
      wife.update(time, 0);
      husband.update(time, 0.35);
      pin.visible = pinVisibility > 0.01;
      pin.scale.setScalar(pinVisibility * pinScale);
      pin.position.y = LAND_TOP + 0.9 * pinScale + 0.3 + Math.abs(Math.sin(time * 2.4)) * 0.35 * pinScale;
      pin.rotation.y = time * 0.8;
    },
  };
}
