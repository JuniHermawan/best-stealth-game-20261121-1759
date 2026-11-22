// Shadow Protocol — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 14,
  walkSpeed: 175,
  sneakSpeed: 98,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 168,
  /** Vision cone: how far a guard sees, and half of the cone's angle. */
  sightRange: 212,
  sightHalfAngle: 0.62,
  /** How close a guard must be to catch the player during an alarm. */
  catchRange: 20,
  /** Seconds a guard waits at each waypoint before moving on. */
  waypointPause: 0.9,
};

export const DETECTION = {
  /** Base fill per second while the player is plainly visible. */
  baseRate: 58,
  /** Drain per second while the player is out of sight. */
  decayRate: 26,
  /** Multipliers on the fill rate. */
  closeMultiplier: 1.7,
  farMultiplier: 0.55,
  sneakMultiplier: 0.5,
  bushMultiplier: 0.15,
  stillMultiplier: 0.8,
  movingMultiplier: 1.15,
  /** A player inside a bush is only seen within this range. */
  bushSightRange: 72,
  /** Alarm length in seconds once the meter fills. */
  alarmSeconds: 5,
  /** Alarm ends early after this long with no sighting at all. */
  alarmCalmSeconds: 2.5,
  /** Meter left over when an alarm ends without a catch. */
  suspicionLeft: 35,
};

export const LIVES = 3;

export const PALETTE = {
  backdrop: '#0b0e14',
  floorA: '#12161f',
  floorB: '#151a26',
  grid: '#1b2130',
  wall: '#2e3648',
  wallTop: '#4a5878',
  crate: '#6b4f2a',
  crateEdge: '#8a6a3c',
  bush: '#1d4d2b',
  bushLeaf: '#2f7a44',
  player: '#37e0c8',
  playerSneak: '#1f9d8d',
  guard: '#e5534b',
  cone: 'rgba(242, 201, 76, 0.20)',
  coneSuspicious: 'rgba(242, 140, 60, 0.30)',
  coneAlarm: 'rgba(229, 83, 75, 0.32)',
  intel: '#4fc3f7',
  exit: '#58d68d',
  exitLocked: '#5a6478',
  panel: '#1a2030',
  text: '#eef1f5',
  muted: '#8b93a3',
  danger: '#ff6b61',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best clear time is kept between visits (this browser only). */
export const BEST_KEY = 'shadow-protocol.best-seconds';
