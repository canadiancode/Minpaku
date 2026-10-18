import * as THREE from "three";
import { palette as P } from "../hero3d/toonKit.js";

/* Shared sky and sea for every stage view. */

export const SKY_TOP = "#8fd4f5";
export const SKY_HORIZON = "#e9f8fc";

/** Sky dome shaded by view direction, so the horizon always meets the fogged ocean. */
export function createSkyDome(kit, { top = SKY_TOP, horizon = SKY_HORIZON } = {}) {
  const material = kit.track(
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        topColor: { value: new THREE.Color(top) },
        horizonColor: { value: new THREE.Color(horizon) },
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        varying vec3 vDirection;
        void main() {
          float height = pow(clamp(vDirection.y * 2.2, 0.0, 1.0), 0.7);
          gl_FragColor = vec4(mix(horizonColor, topColor, height), 1.0);
          #include <colorspace_fragment>
        }`,
    }),
  );
  const dome = new THREE.Mesh(kit.track(new THREE.SphereGeometry(500, 32, 16)), material);
  dome.renderOrder = -1;
  return dome;
}

export function createOcean(kit, color = P.ocean) {
  const geometry = new THREE.PlaneGeometry(420, 320, 110, 84).rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -60);
  const ocean = kit.mesh(geometry, color, { flat: true, castShadow: false });
  const positions = geometry.attributes.position.array;

  function update(time) {
    for (let index = 0; index < positions.length; index += 3) {
      const x = positions[index];
      const z = positions[index + 2];
      positions[index + 1] = Math.sin(x * 0.33 + time * 1.1) * 0.11 + Math.cos(z * 0.41 - time * 0.8) * 0.09;
    }
    geometry.attributes.position.needsUpdate = true;
  }

  return { object: ocean, update };
}
