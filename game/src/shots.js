// The screenshot scenes behind ?shot=start|play|alert|win. Each one plays the
// real rules forward from a fresh world, steered by a waypoint autopilot or
// until a game event fires, so the frame is what a short game really looks
// like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_ALARM, EVENT_LEVEL, EVENT_WIN } from './world.js';
import { SCREEN_LEVEL, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** Waypoints the play scene's pilot creeps along, toward the first intel. */
const PLAY_PATH = [
  { x: 240, y: 560 },
  { x: 300, y: 420 },
  { x: 200, y: 300 },
  { x: 180, y: 120 },
];
const PLAY_SECONDS = 9;

/** Where the alert scene stands the player: dead ahead of guard one's patrol. */
const ALERT_SPOT = { x: 500, y: 320 };
/** Steps after the alarm sounds before the frame is taken: the chase is on, the player is not caught yet. */
const ALERT_CHASE_STEPS = 5;

/** Where the win scene drops the player: a short hop from the open exit. */
const WIN_SPOT = { x: 1140, y: 140 };
const WIN_LIMIT_SECONDS = 8;

function directionTo(from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  return { x: dx / length, y: dy / length, distance: Math.hypot(dx, dy) };
}

function followPath(world, path, seconds, sneak) {
  let waypoint = 0;
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    const player = world.state.levelState.player;
    if (waypoint >= path.length) {
      world.step(STEP, { x: 0, y: 0 }, sneak);
      continue;
    }
    const leg = directionTo(player, path[waypoint]);
    if (leg.distance < 18) {
      waypoint += 1;
      continue;
    }
    world.step(STEP, { x: leg.x, y: leg.y }, sneak);
  }
}

/**
 * Set `world` to the named scene (start, play, alert or win; any other name
 * is start) and return the screen to draw over it and the best time to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    followPath(world, PLAY_PATH, PLAY_SECONDS, true);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alert') {
    const player = world.state.levelState.player;
    player.x = ALERT_SPOT.x;
    player.y = ALERT_SPOT.y;
    // Stand still until the meter fills and the alarm sounds, then let the
    // chase run a few steps: the frame shows the alarm up, the guards
    // closing in, and the player still alive at the spot.
    let alarmed = false;
    for (let i = 0; i < 12 / STEP; i += 1) {
      const events = world.step(STEP, { x: 0, y: 0 }, false);
      if (events & EVENT_ALARM) {
        alarmed = true;
        break;
      }
    }
    if (alarmed) {
      for (let i = 0; i < ALERT_CHASE_STEPS; i += 1) {
        world.step(STEP, { x: 0, y: 0 }, false);
      }
    }
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    const level = world.state.levelState;
    level.intelTaken = level.intelTaken.map(() => true);
    level.exitOpen = true;
    const player = level.player;
    player.x = WIN_SPOT.x;
    player.y = WIN_SPOT.y;
    const exit = level.def.exit;
    const target = { x: exit.x + exit.w / 2, y: exit.y + exit.h / 2 };
    for (let i = 0; i < WIN_LIMIT_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, directionTo(player, target), false);
      if (events & (EVENT_WIN | EVENT_LEVEL)) break;
    }
    return { screen: SCREEN_LEVEL, best: 0 };
  }
  for (let i = 0; i < 3 / STEP; i += 1) {
    world.step(STEP, { x: 0, y: 0 }, false);
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
