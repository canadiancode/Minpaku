/**
 * Shared by the React section (cards) and the 3D scene (camera).
 * Map coordinates: x points east, z points south, one unit ≈ 1.2 km.
 */
export const HOME = { x: 4.6, z: -0.6 };
export const LAND_TOP = 0.5;

export const CITY_LABELS = [
  { name: "Vancouver", x: -19, z: -2.2 },
  { name: "North Vancouver", x: -17, z: -9.2 },
  { name: "Burnaby", x: -8, z: -1.4 },
  { name: "New Westminster", x: -2.4, z: 3.4 },
  { name: "Richmond", x: -16, z: 10.2 },
  { name: "Surrey", x: 2, z: 9.6 },
  { name: "Langley", x: 16, z: 11.8 },
  { name: "Port Moody", x: 0.4, z: -6.6 },
  { name: "Coquitlam", x: 4.6, z: -1.6, highlight: true },
  { name: "Port Coquitlam", x: 9.6, z: 2.0 },
  { name: "Pitt Meadows", x: 13.6, z: -1.8 },
  { name: "Maple Ridge", x: 19.4, z: 1.4 },
];

/**
 * Each stop holds the camera still-ish for its `hold` range of scroll progress
 * (0 → 1 across the section); the camera glides between stops. `narrow`
 * overrides the framing on portrait phone screens.
 */
export const TOUR_STOPS = [
  {
    id: "overview",
    hold: [0, 0.1],
    camera: { x: -1, z: 0.4, fitWidth: 80, pitch: 1.0, yaw: 0, narrow: { x: -3, fitWidth: 44, pitch: 1.05 } },
    eyebrow: "Where we are",
    title: "Central Coquitlam, BC",
    body: "The perfect base. World-class hiking trails when you want nature, and the heart of Vancouver when you want the city.",
  },
  {
    id: "vancouver",
    hold: [0.2, 0.3],
    camera: { x: -20.4, z: -4.8, fitWidth: 16, pitch: 0.72, yaw: -0.25 },
    eyebrow: "The city",
    title: "Vancouver",
    sights: ["Stanley Park", "Canada Place", "BC Place", "Science World", "Lions Gate Bridge"],
  },
  {
    id: "north-vancouver",
    hold: [0.4, 0.5],
    camera: { x: -18.4, z: -10.2, fitWidth: 17, pitch: 0.66, yaw: -0.12, narrow: { x: -17.2, z: -11.8, fitWidth: 12, pitch: 0.5 } },
    eyebrow: "Across the water",
    title: "North Vancouver",
    sights: ["Grouse Mountain", "Capilano Suspension Bridge", "Lonsdale Quay", "Lynn Canyon"],
  },
  {
    id: "coquitlam",
    hold: [0.62, 0.72],
    camera: { x: 4.4, z: -2.2, fitWidth: 9.5, pitch: 0.8, yaw: 0.15 },
    eyebrow: "Home base",
    title: "Coquitlam",
    sights: ["Lafarge Lake", "Coquitlam Crunch", "Town Centre Park", "Mundy Park", "Evergreen SkyTrain"],
  },
  {
    id: "home",
    hold: [0.86, 1],
    camera: { x: HOME.x - 0.05, z: HOME.z + 0.7, y: LAND_TOP + 0.36, fitWidth: 1.9, pitch: 0.16, yaw: 0, narrow: { fitWidth: 1.3, pitch: 0.2 } },
    eyebrow: "Meet your hosts",
    title: "Someone's waiting for you",
    body: "We'll be right here at the front door, waving hello.",
  },
];

/** Opening shot above the clouds; the camera descends from here while the section scrolls into view. */
export const INTRO_CAMERA = { x: 0, z: 0, fitWidth: 80, pitch: 1.4, yaw: 0, lift: 30 };
