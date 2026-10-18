/** Island centres along x, shared by the scene and the camera stops. */
export const ISLANDS = { hiking: -21, snow: -7, pickleball: 7, food: 21 };

export const ACTIVITY_STOPS = [
  {
    id: "intro",
    hold: [0, 0.1],
    camera: { x: 0, y: 0.5, z: 0, fitWidth: 62, pitch: 0.5, yaw: 0, narrow: { x: -7, fitWidth: 30 } },
  },
  {
    id: "hiking",
    hold: [0.22, 0.32],
    camera: { x: ISLANDS.hiking, y: 2, z: 0, fitWidth: 15, pitch: 0.42, yaw: -0.2, narrow: { fitWidth: 11 } },
  },
  {
    id: "snow",
    hold: [0.44, 0.54],
    camera: { x: ISLANDS.snow, y: 2.2, z: 0, fitWidth: 15, pitch: 0.38, yaw: 0.15, narrow: { fitWidth: 11 } },
  },
  {
    id: "pickleball",
    hold: [0.66, 0.76],
    camera: { x: ISLANDS.pickleball, y: 0.8, z: 0, fitWidth: 12, pitch: 0.6, yaw: -0.12, narrow: { fitWidth: 9 } },
  },
  {
    id: "food",
    hold: [0.88, 1],
    camera: { x: ISLANDS.food, y: 1.2, z: 0, fitWidth: 12, pitch: 0.45, yaw: 0.2, narrow: { fitWidth: 9 } },
  },
];
