import * as THREE from "three";
import { palette as P, roundedBox } from "./toonKit.js";

function place(object, x = 0, y = 0, z = 0) {
  object.position.set(x, y, z);
  return object;
}

/** Bubbly propeller plane. Nose points along +Z so `lookAt` steers it. */
export function createPlane(kit) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const add = (object, x, y, z) => {
    body.add(place(object, x, y, z));
    return object;
  };

  add(kit.mesh(new THREE.CapsuleGeometry(0.42, 1.25, 8, 24).rotateX(Math.PI / 2), P.white));
  add(kit.mesh(new THREE.CylinderGeometry(0.437, 0.437, 0.16, 28).rotateX(Math.PI / 2), P.brand), 0, 0, -0.2);

  const cockpit = add(kit.mesh(new THREE.SphereGeometry(0.3, 20, 14), P.glass), 0, 0.2, 0.55);
  cockpit.scale.set(1, 0.72, 1.25);

  const windowGeometry = kit.geometry("plane-window", () => new THREE.SphereGeometry(0.075, 10, 8));
  for (const side of [-1, 1]) {
    for (let index = 0; index < 3; index += 1) {
      add(kit.mesh(windowGeometry, P.windowDark, { castShadow: false }), side * 0.385, 0.1, 0.12 - index * 0.27);
    }
  }

  add(kit.mesh(roundedBox(3, 0.13, 0.64, 0.06), P.brand), 0, -0.1, 0.12);
  for (const side of [-1, 1]) {
    add(kit.mesh(new THREE.SphereGeometry(0.11, 12, 10), P.yellow), side * 1.5, -0.1, 0.12);
  }

  const fin = add(kit.mesh(roundedBox(0.11, 0.62, 0.5, 0.05), P.brand), 0, 0.44, -0.86);
  fin.rotation.x = -0.35;
  add(kit.mesh(roundedBox(1.2, 0.09, 0.34, 0.04), P.brand), 0, 0.1, -0.9);

  add(kit.mesh(new THREE.SphereGeometry(0.16, 16, 12), P.yellow), 0, 0, 1.07);
  const propeller = add(new THREE.Group(), 0, 0, 1.17);
  for (const angle of [0, Math.PI / 2]) {
    const blade = kit.mesh(roundedBox(0.13, 1.0, 0.04, 0.018), P.ink);
    blade.rotation.z = angle;
    propeller.add(blade);
  }

  for (const side of [-1, 1]) {
    add(kit.mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.26, 8), P.ink), side * 0.3, -0.45, 0.35);
    add(kit.mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.08, 14).rotateZ(Math.PI / 2), P.tire), side * 0.3, -0.58, 0.35);
  }
  add(kit.mesh(new THREE.SphereGeometry(0.06, 10, 8), P.tire), 0, -0.4, -0.82);

  return { object: root, body, propeller, wheelDrop: 0.69 };
}

export function createCar(kit, color) {
  const car = new THREE.Group();
  car.add(place(kit.mesh(roundedBox(0.72, 0.34, 1.15, 0.15), color), 0, 0.32, 0));
  car.add(place(kit.mesh(roundedBox(0.6, 0.32, 0.62, 0.14), P.white), 0, 0.58, -0.06));
  car.add(place(kit.mesh(roundedBox(0.5, 0.2, 0.06, 0.025), P.glass, { castShadow: false }), 0, 0.6, 0.25));

  const wheelGeometry = kit.geometry("car-wheel", () =>
    new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14).rotateZ(Math.PI / 2),
  );
  for (const side of [-1, 1]) {
    for (const end of [-1, 1]) {
      car.add(place(kit.mesh(wheelGeometry, P.tire), side * 0.34, 0.15, end * 0.37));
    }
  }
  const lightGeometry = kit.geometry("car-light", () => new THREE.SphereGeometry(0.065, 10, 8));
  for (const side of [-1, 1]) {
    car.add(place(kit.mesh(lightGeometry, P.yellow, { castShadow: false, emissive: "#6b5200" }), side * 0.22, 0.34, 0.57));
  }
  car.scale.setScalar(0.75);
  return car;
}

export function createCherryTree(kit, scale = 1) {
  const tree = new THREE.Group();
  const trunkGeometry = kit.geometry("cherry-trunk", () => new THREE.CylinderGeometry(0.09, 0.13, 0.9, 8));
  tree.add(place(kit.mesh(trunkGeometry, P.trunk), 0, 0.45, 0));
  const blossomGeometry = kit.geometry("blossom", () => new THREE.SphereGeometry(1, 16, 12));
  const puffs = [
    [0, 1.15, 0, 0.55, P.pink],
    [0.36, 1.0, 0.1, 0.4, P.pinkLight],
    [-0.32, 1.05, -0.08, 0.42, P.pinkLight],
    [0.04, 1.48, 0.04, 0.38, P.pink],
  ];
  for (const [x, y, z, radius, color] of puffs) {
    const puff = place(kit.mesh(blossomGeometry, color), x, y, z);
    puff.scale.setScalar(radius);
    tree.add(puff);
  }
  tree.scale.setScalar(scale);
  return tree;
}

export function createPine(kit, scale = 1) {
  const tree = new THREE.Group();
  const trunkGeometry = kit.geometry("pine-trunk", () => new THREE.CylinderGeometry(0.1, 0.12, 0.6, 8));
  tree.add(place(kit.mesh(trunkGeometry, P.trunk), 0, 0.3, 0));
  const tiers = [
    [0.78, 1.0, 0.9, P.pine],
    [0.6, 0.85, 1.45, P.pineLight],
    [0.42, 0.72, 1.95, P.pine],
  ];
  tiers.forEach(([radius, height, y, color], index) => {
    const coneGeometry = kit.geometry(`pine-tier-${index}`, () => new THREE.ConeGeometry(radius, height, 10));
    tree.add(place(kit.mesh(coneGeometry, color), 0, y, 0));
  });
  tree.scale.setScalar(scale);
  return tree;
}

export function createRoundTree(kit, color, scale = 1) {
  const tree = new THREE.Group();
  const trunkGeometry = kit.geometry("round-trunk", () => new THREE.CylinderGeometry(0.08, 0.11, 0.7, 8));
  tree.add(place(kit.mesh(trunkGeometry, P.trunk), 0, 0.35, 0));
  const crownGeometry = kit.geometry("round-crown", () => new THREE.SphereGeometry(0.55, 16, 12));
  tree.add(place(kit.mesh(crownGeometry, color), 0, 1.0, 0));
  tree.scale.setScalar(scale);
  return tree;
}

export function createCloud(kit, random) {
  const cloud = new THREE.Group();
  const puffGeometry = kit.geometry("cloud-puff", () => new THREE.SphereGeometry(1, 16, 12));
  const puffCount = 4 + Math.floor(random() * 3);
  for (let index = 0; index < puffCount; index += 1) {
    const radius = 0.8 + random() * 0.7 * (1 - Math.abs(index / (puffCount - 1) - 0.5));
    const puff = kit.mesh(puffGeometry, P.white, { castShadow: false, receiveShadow: false });
    puff.position.set((index - (puffCount - 1) / 2) * 0.95, random() * 0.35, (random() - 0.5) * 0.6);
    puff.scale.set(radius, radius * 0.8, radius);
    cloud.add(puff);
  }
  return cloud;
}

/** Flag on a pole; `draw` paints the 256×128 cloth texture. */
export function createFlag(kit, draw) {
  const flag = new THREE.Group();
  flag.userData.dynamic = true;
  flag.add(place(kit.mesh(new THREE.CylinderGeometry(0.05, 0.06, 3, 8), P.white), 0, 1.5, 0));
  flag.add(place(kit.mesh(new THREE.SphereGeometry(0.1, 10, 8), P.yellow), 0, 3.05, 0));

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  draw(canvas.getContext("2d"), canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const clothGeometry = kit.track(new THREE.PlaneGeometry(1.3, 0.65, 14, 4).translate(0.65, 0, 0));
  const basePositions = clothGeometry.attributes.position.array.slice();
  const cloth = kit.mesh(clothGeometry, null, {
    material: kit.texturedMaterial(texture, { side: THREE.DoubleSide }),
  });
  cloth.position.set(0.05, 2.62, 0);
  flag.add(cloth);

  function update(time) {
    const positions = clothGeometry.attributes.position.array;
    for (let index = 0; index < positions.length; index += 3) {
      const x = basePositions[index];
      positions[index + 2] = Math.sin(x * 4.5 - time * 5) * 0.09 * (x / 1.3);
    }
    clothGeometry.attributes.position.needsUpdate = true;
    clothGeometry.computeVertexNormals();
  }

  return { object: flag, update };
}

export function drawJapanFlag(context, width, height) {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#bc002d";
  context.beginPath();
  context.arc(width / 2, height / 2, height * 0.3, 0, Math.PI * 2);
  context.fill();
}

const mapleLeafRightHalf = [
  [0, 0.5], [0.09, 0.33], [0.18, 0.38], [0.15, 0.12], [0.27, 0.24], [0.3, 0.17],
  [0.43, 0.2], [0.38, 0.05], [0.47, 0], [0.25, -0.16], [0.29, -0.27], [0.04, -0.23], [0.04, -0.45],
];

export function drawCanadaFlag(context, width, height) {
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#d80621";
  context.fillRect(0, 0, width / 4, height);
  context.fillRect((width * 3) / 4, 0, width / 4, height);

  const leafPoints = [
    ...mapleLeafRightHalf,
    ...mapleLeafRightHalf.slice(1).reverse().map(([x, y]) => [-x, y]),
  ];
  const leafSize = height * 0.78;
  context.beginPath();
  leafPoints.forEach(([x, y], index) => {
    const canvasX = width / 2 + x * leafSize;
    const canvasY = height / 2 - y * leafSize;
    if (index === 0) context.moveTo(canvasX, canvasY);
    else context.lineTo(canvasX, canvasY);
  });
  context.closePath();
  context.fill();
}

/** Little wooden signboard with the city name. */
export function createSign(kit, label) {
  const sign = new THREE.Group();
  for (const side of [-1, 1]) {
    sign.add(place(kit.mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 8), P.trunk), side * 1.3, 0.6, 0));
  }
  sign.add(place(kit.mesh(roundedBox(3.2, 0.95, 0.16, 0.12), P.cream), 0, 1.25, 0));

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 180;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  let currentLabel = label;
  const paint = () => {
    const label = currentLabel;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = P.brandDeep;
    context.textAlign = "center";
    context.textBaseline = "middle";
    let fontSize = 104;
    do {
      context.font = `${fontSize}px Sekuya, "Arial Rounded MT Bold", system-ui, sans-serif`;
      fontSize -= 4;
    } while (context.measureText(label).width > canvas.width - 50 && fontSize > 20);
    context.fillText(label, canvas.width / 2, canvas.height / 2 + 6);
    texture.needsUpdate = true;
  };
  paint();
  document.fonts?.load('80px "Sekuya"').then(paint).catch(() => {});

  const face = kit.mesh(new THREE.PlaneGeometry(3.0, 0.84), null, {
    material: kit.texturedMaterial(texture, { transparent: true }),
    castShadow: false,
  });
  face.position.set(0, 1.25, 0.085);
  sign.add(face);
  sign.userData.setLabel = (nextLabel) => {
    currentLabel = nextLabel;
    paint();
  };
  return sign;
}

export function createBoat(kit, hullColor, cabinColor) {
  const boat = new THREE.Group();
  boat.add(place(kit.mesh(roundedBox(0.8, 0.42, 1.8, 0.18), hullColor), 0, 0.12, 0));
  boat.add(place(kit.mesh(roundedBox(0.82, 0.1, 1.82, 0.04), P.white), 0, 0.3, 0));
  boat.add(place(kit.mesh(roundedBox(0.6, 0.45, 0.9, 0.14), cabinColor), 0, 0.55, -0.15));
  const portholeGeometry = kit.geometry("porthole", () => new THREE.SphereGeometry(0.07, 10, 8));
  for (const side of [-1, 1]) {
    for (const z of [-0.4, -0.1, 0.2]) {
      boat.add(place(kit.mesh(portholeGeometry, P.windowDark, { castShadow: false }), side * 0.3, 0.58, z));
    }
  }
  return boat;
}

export function createOrca(kit) {
  const orca = new THREE.Group();
  const body = new THREE.Group();
  orca.add(body);
  body.add(kit.mesh(new THREE.CapsuleGeometry(0.38, 1.0, 8, 18).rotateX(Math.PI / 2), "#272a36"));
  const belly = place(kit.mesh(new THREE.SphereGeometry(0.3, 16, 12), P.white), 0, -0.16, 0.25);
  belly.scale.set(1.05, 0.6, 1.9);
  body.add(belly);
  for (const side of [-1, 1]) {
    const eyePatch = place(kit.mesh(new THREE.SphereGeometry(0.12, 12, 10), P.white), side * 0.3, 0.12, 0.5);
    eyePatch.scale.set(0.5, 0.45, 1.1);
    body.add(eyePatch);
    const flipper = place(kit.mesh(new THREE.SphereGeometry(0.2, 12, 10), "#272a36"), side * 0.42, -0.22, 0.2);
    flipper.scale.set(1.2, 0.3, 0.6);
    body.add(flipper);
    const fluke = place(kit.mesh(new THREE.SphereGeometry(0.22, 12, 10), "#272a36"), side * 0.22, 0, -0.95);
    fluke.scale.set(1.3, 0.25, 0.65);
    body.add(fluke);
  }
  const fin = place(kit.mesh(new THREE.ConeGeometry(0.14, 0.75, 10), "#272a36"), 0, 0.62, -0.1);
  fin.rotation.x = -0.3;
  body.add(fin);
  return { object: orca, body };
}

/** Pool of soft puffs for the plane's trail and orca splashes. */
export function createPuffPool(kit, scene, count) {
  const puffGeometry = kit.geometry("trail-puff", () => new THREE.SphereGeometry(1, 12, 10));
  const puffMaterial = kit.material(P.white, { fog: true });
  const puffs = Array.from({ length: count }, () => {
    const puff = new THREE.Mesh(puffGeometry, puffMaterial);
    puff.visible = false;
    scene.add(puff);
    return { mesh: puff, age: 0, life: 1, size: 1, velocity: new THREE.Vector3() };
  });
  let cursor = 0;

  function spawn(position, size, life, velocity) {
    const puff = puffs[cursor];
    cursor = (cursor + 1) % puffs.length;
    puff.mesh.position.copy(position);
    puff.mesh.visible = true;
    puff.age = 0;
    puff.life = life;
    puff.size = size;
    puff.velocity.copy(velocity ?? new THREE.Vector3());
  }

  function update(deltaSeconds) {
    for (const puff of puffs) {
      if (!puff.mesh.visible) continue;
      puff.age += deltaSeconds;
      const progress = puff.age / puff.life;
      if (progress >= 1) {
        puff.mesh.visible = false;
        continue;
      }
      puff.mesh.position.addScaledVector(puff.velocity, deltaSeconds);
      const grow = Math.min(1, progress * 5);
      puff.mesh.scale.setScalar(puff.size * grow * (1 - progress * progress));
    }
  }

  return { spawn, update };
}
