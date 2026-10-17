import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const palette = {
  white: "#fffaf2",
  cream: "#fff0d6",
  ink: "#33364a",
  brand: "#d6435a",
  brandDeep: "#9b1b30",
  yellow: "#ffd166",
  glass: "#9fe0f2",
  windowDark: "#4b6c9e",
  tire: "#3b3d4f",
  grassTokyo: "#b4e27f",
  grassVancouver: "#86d38c",
  sand: "#ffe1a6",
  ocean: "#5cc6e0",
  foam: "#ffffff",
  pad: "#dfe3ee",
  road: "#9aa1b8",
  trunk: "#a8714f",
  pink: "#ffb3c7",
  pinkLight: "#ffd3e0",
  pine: "#2f9a6a",
  pineLight: "#46b37f",
  towerOrange: "#ff6a3d",
  roofSlate: "#4d5270",
  shrineRed: "#e8453c",
  stone: "#bdb6aa",
  fuji: "#7f93d1",
  mountain: "#6ba8a0",
};

/** Rounded box with a safe corner radius. */
export function roundedBox(width, height, depth, radius) {
  const maxRadius = Math.min(width, height, depth) / 2 - 0.001;
  const cornerRadius = Math.min(radius ?? Math.min(width, height, depth) * 0.25, maxRadius);
  return new RoundedBoxGeometry(width, height, depth, 3, cornerRadius);
}

/**
 * Tracks every geometry, material and texture the scene creates so it can all
 * be released on unmount, and shares toon materials by color.
 */
export function createToonKit() {
  const gradientData = new Uint8Array([110, 170, 225, 255]);
  const gradientMap = new THREE.DataTexture(gradientData, gradientData.length, 1, THREE.RedFormat);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.needsUpdate = true;

  const disposables = new Set([gradientMap]);
  const materials = new Map();
  const geometries = new Map();

  function track(resource) {
    disposables.add(resource);
    return resource;
  }

  function material(color, { flat = false, emissive = null, side = THREE.FrontSide, fog = true } = {}) {
    const key = `${color}|${flat}|${emissive}|${side}|${fog}`;
    let toonMaterial = materials.get(key);
    if (!toonMaterial) {
      toonMaterial = new THREE.MeshToonMaterial({ color, gradientMap, side, fog });
      // Not a constructor option for toon materials, but the shader honours it.
      toonMaterial.flatShading = flat;
      if (emissive) toonMaterial.emissive = new THREE.Color(emissive);
      materials.set(key, toonMaterial);
      track(toonMaterial);
    }
    return toonMaterial;
  }

  function texturedMaterial(texture, options = {}) {
    track(texture);
    return track(new THREE.MeshToonMaterial({ map: texture, gradientMap, ...options }));
  }

  /** Shared geometry for repeated props (trees, windows, puffs). */
  function geometry(key, factory) {
    let shared = geometries.get(key);
    if (!shared) {
      shared = track(factory());
      geometries.set(key, shared);
    }
    return shared;
  }

  function mesh(meshGeometry, color, options = {}) {
    track(meshGeometry);
    const toonMesh = new THREE.Mesh(meshGeometry, options.material ?? material(color, options));
    toonMesh.castShadow = options.castShadow ?? true;
    toonMesh.receiveShadow = options.receiveShadow ?? true;
    return toonMesh;
  }

  function dispose() {
    disposables.forEach((resource) => resource.dispose());
    disposables.clear();
    materials.clear();
    geometries.clear();
  }

  return { gradientMap, track, material, texturedMaterial, geometry, mesh, dispose };
}

/** Thin cylinder spanning two points — used for tower legs and struts. */
export function cylinderBetween(kit, start, end, radius, color, options) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const strut = kit.mesh(new THREE.CylinderGeometry(radius, radius, length, 8), color, options);
  strut.position.copy(start).addScaledVector(direction, 0.5);
  strut.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return strut;
}
