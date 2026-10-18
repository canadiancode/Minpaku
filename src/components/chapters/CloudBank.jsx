const BACK_PUFFS = [
  [60, 120, 70], [180, 100, 80], [320, 115, 75], [450, 95, 85], [590, 110, 80], [730, 98, 86],
  [870, 112, 78], [1000, 100, 84], [1140, 115, 76],
];
const FRONT_PUFFS = [
  [0, 150, 70], [110, 140, 62], [230, 150, 72], [360, 135, 66], [490, 150, 74], [620, 138, 64],
  [750, 150, 72], [880, 136, 66], [1010, 150, 72], [1130, 140, 64], [1220, 150, 70],
];

/**
 * Puffy cloud bank that straddles the top edge of a section, so each chapter
 * rises out of the clouds below the previous one. `color` should match the
 * section's own top colour (or its entrance veil).
 */
export default function CloudBank({ color = "#f7fcfe", backColor = "#e4f4fb" }) {
  return (
    <svg
      className="pointer-events-none absolute inset-x-0 -top-14 z-10 h-28 w-full md:-top-20 md:h-40"
      viewBox="0 0 1200 220"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      {BACK_PUFFS.map(([cx, cy, r]) => (
        <circle key={`back-${cx}`} cx={cx} cy={cy} r={r} fill={backColor} />
      ))}
      {FRONT_PUFFS.map(([cx, cy, r]) => (
        <circle key={`front-${cx}`} cx={cx} cy={cy} r={r} fill={color} />
      ))}
      <rect x="0" y="160" width="1200" height="60" fill={color} />
    </svg>
  );
}
