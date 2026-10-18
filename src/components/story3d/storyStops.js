/**
 * Our Story chapter stops. The house is centred on the origin: x points east,
 * z points south (toward the street and the camera), floors sit at y 0.25 and 2.85.
 */
export const STORY_STOPS = [
  {
    id: "hello",
    hold: [0, 0.1],
    camera: { x: 0, y: 2.4, z: 0, fitWidth: 16, pitch: 0.1, yaw: 0, narrow: { fitWidth: 11.5 } },
  },
  {
    id: "upstairs",
    hold: [0.24, 0.36],
    camera: { x: -2.0, y: 3.7, z: -0.8, fitWidth: 7.8, pitch: 0.36, yaw: -0.3, narrow: { fitWidth: 6.2 } },
  },
  {
    id: "rooms",
    hold: [0.48, 0.6],
    camera: { x: 2.6, y: 2.7, z: 0.4, fitWidth: 7.5, pitch: 0.2, yaw: 0.42, narrow: { fitWidth: 6.4 } },
  },
  {
    id: "downstairs",
    hold: [0.72, 0.84],
    camera: { x: -1.0, y: 1.2, z: 0, fitWidth: 9.5, pitch: 0.1, yaw: 0.12, narrow: { x: -1.6, fitWidth: 7 } },
  },
  {
    id: "house",
    hold: [0.94, 1],
    camera: { x: 0, y: 2.8, z: 0, fitWidth: 17, pitch: 0.32, yaw: 0.38, narrow: { fitWidth: 12 } },
  },
];
