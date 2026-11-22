// The three levels, as data. Walls and crates block movement and sight; bushes
// hide the player; guards walk waypoint loops; intel must all be collected
// before the exit opens. Coordinates are pixels on the 1280x720 field.

const BORDER = 24;

function borderWalls() {
  return [
    { x: 0, y: 0, w: 1280, h: BORDER },
    { x: 0, y: 720 - BORDER, w: 1280, h: BORDER },
    { x: 0, y: 0, w: BORDER, h: 720 },
    { x: 1280 - BORDER, y: 0, w: BORDER, h: 720 },
  ];
}

export const LEVELS = [
  {
    name: 'LEVEL 1 — FIRST LIGHT',
    briefing: 'Two guards. Grab both intel files, then slip out the east door.',
    playerStart: { x: 80, y: 640 },
    walls: [
      ...borderWalls(),
      { x: 420, y: 200, w: 24, h: 360 },
      { x: 700, y: 380, w: 400, h: 24 },
      { x: 860, y: 24, w: 24, h: 216 },
    ],
    crates: [
      { x: 300, y: 300 },
      { x: 300, y: 344 },
      { x: 560, y: 520 },
      { x: 980, y: 180 },
      { x: 1120, y: 520 },
    ],
    bushes: [
      { x: 240, y: 560, r: 30 },
      { x: 640, y: 140, r: 30 },
      { x: 1000, y: 480, r: 30 },
    ],
    guards: [
      { waypoints: [[520, 120], [520, 620]], speed: 70 },
      { waypoints: [[760, 520], [1150, 520], [1150, 180], [760, 180]], speed: 80 },
    ],
    intel: [
      { x: 180, y: 120 },
      { x: 1150, y: 620 },
    ],
    exit: { x: 1180, y: 90, w: 52, h: 64 },
  },
  {
    name: 'LEVEL 2 — CROSSFIRE',
    briefing: 'Three guards, crossing patrols. Three files. Stay in the dark.',
    playerStart: { x: 80, y: 640 },
    walls: [
      ...borderWalls(),
      { x: 320, y: 24, w: 24, h: 276 },
      { x: 320, y: 420, w: 24, h: 276 },
      { x: 320, y: 360, w: 640, h: 24 },
      { x: 960, y: 360, w: 24, h: 336 },
    ],
    crates: [
      { x: 480, y: 140 },
      { x: 524, y: 140 },
      { x: 480, y: 560 },
      { x: 760, y: 520 },
      { x: 1080, y: 140 },
      { x: 1080, y: 560 },
    ],
    bushes: [
      { x: 180, y: 360, r: 30 },
      { x: 640, y: 300, r: 30 },
      { x: 880, y: 600, r: 30 },
      { x: 1160, y: 300, r: 30 },
    ],
    guards: [
      { waypoints: [[420, 120], [420, 620]], speed: 85 },
      { waypoints: [[700, 120], [1120, 120], [1120, 620], [700, 620]], speed: 90 },
      { waypoints: [[1100, 300], [700, 300]], speed: 95 },
    ],
    intel: [
      { x: 120, y: 120 },
      { x: 1240, y: 640 },
      { x: 640, y: 640 },
    ],
    exit: { x: 1180, y: 90, w: 52, h: 64 },
  },
  {
    name: 'LEVEL 3 — THE VAULT',
    briefing: 'Four guards on tight loops. The vault door is the way out.',
    playerStart: { x: 80, y: 120 },
    walls: [
      ...borderWalls(),
      { x: 300, y: 200, w: 24, h: 320 },
      { x: 640, y: 24, w: 24, h: 336 },
      { x: 640, y: 480, w: 360, h: 24 },
      { x: 1000, y: 120, w: 24, h: 360 },
    ],
    crates: [
      { x: 420, y: 120 },
      { x: 420, y: 560 },
      { x: 760, y: 180 },
      { x: 760, y: 600 },
      { x: 1120, y: 600 },
    ],
    bushes: [
      { x: 200, y: 200, r: 30 },
      { x: 560, y: 480, r: 30 },
      { x: 900, y: 300, r: 30 },
      { x: 1160, y: 200, r: 30 },
    ],
    guards: [
      { waypoints: [[380, 120], [380, 620]], speed: 95 },
      { waypoints: [[720, 120], [1080, 120], [1080, 600], [720, 600]], speed: 100 },
      { waypoints: [[560, 300], [560, 620]], speed: 100 },
      { waypoints: [[1180, 200], [900, 200]], speed: 105 },
    ],
    intel: [
      { x: 120, y: 640 },
      { x: 1240, y: 120 },
      { x: 820, y: 640 },
    ],
    exit: { x: 1180, y: 90, w: 52, h: 64 },
  },
];
