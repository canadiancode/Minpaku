import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function canMerge(mesh) {
  const { material, geometry } = mesh;
  return (
    mesh.isMesh &&
    !mesh.isInstancedMesh &&
    !mesh.isSkinnedMesh &&
    !Array.isArray(material) &&
    !material.map &&
    !material.isShaderMaterial &&
    !Object.keys(geometry.morphAttributes).length
  );
}

function collect(object, meshes) {
  if (object.userData.dynamic) return;
  if (object.isMesh) {
    if (canMerge(object)) meshes.push(object);
    return;
  }
  for (const child of object.children) collect(child, meshes);
}

function pruneEmptyGroups(object) {
  for (const child of [...object.children]) {
    pruneEmptyGroups(child);
    if (child.type === "Group" && child.children.length === 0 && !child.userData.dynamic) object.remove(child);
  }
}

/**
 * Bakes every static mesh under `root` into one mesh per material (and shadow
 * setting), cutting hundreds of draw calls to a handful. Anything inside an
 * object marked `userData.dynamic` is left alone so it can keep moving.
 */
export async function mergeStaticMeshes(kit, root, slice = async () => {}) {
  root.updateMatrixWorld(true);
  const toRootSpace = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const meshes = [];
  for (const child of root.children) collect(child, meshes);

  const buckets = new Map();
  const sourceGeometries = new Set();
  const matrix = new THREE.Matrix4();
  for (const mesh of meshes) {
    const geometry = mesh.geometry.clone();
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
    }
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    if (!geometry.index) {
      geometry.setIndex(Array.from({ length: geometry.attributes.position.count }, (_, index) => index));
    }
    geometry.clearGroups();
    geometry.applyMatrix4(matrix.multiplyMatrices(toRootSpace, mesh.matrixWorld));

    const key = `${mesh.material.uuid}|${mesh.castShadow}|${mesh.receiveShadow}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material: mesh.material, castShadow: mesh.castShadow, receiveShadow: mesh.receiveShadow, geometries: [] };
      buckets.set(key, bucket);
    }
    bucket.geometries.push(geometry);
    mesh.parent.remove(mesh);
    sourceGeometries.add(mesh.geometry);
    await slice();
  }

  for (const { material, castShadow, receiveShadow, geometries } of buckets.values()) {
    const merged = mergeGeometries(geometries, false);
    for (const geometry of geometries) geometry.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(kit.track(merged), material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    mesh.name = "merged-static";
    root.add(mesh);
    await slice();
  }
  pruneEmptyGroups(root);
  // The originals now live inside the merged meshes; free the copies we no longer draw.
  const stillUsed = new Set();
  root.traverse((object) => object.isMesh && stillUsed.add(object.geometry));
  for (const geometry of sourceGeometries) if (!stillUsed.has(geometry)) kit.release(geometry);
  return { mergedMeshes: meshes.length, drawGroups: buckets.size };
}
