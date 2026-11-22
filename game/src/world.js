// The simulation: movement with wall collision, guard patrols and chases,
// vision cones with line of sight, the detection meter, alarms, intel
// pickups, the exit, and lives. It knows nothing about drawing or keys.

import { DETECTION, FIELD, GUARD, LIVES, PLAYER, STEP } from './config.js';
import { LEVELS } from './levels.js';

export const EVENT_INTEL = 1;
export const EVENT_ALARM = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_LEVEL = 8;
export const EVENT_WIN = 16;
export const EVENT_OVER = 32;

const CRATE_SIZE = 40;

function rectsOverlapCircle(rect, cx, cy, radius) {
  const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

function circleHitsSolids(level, x, y, radius) {
  for (const wall of level.walls) {
    if (rectsOverlapCircle(wall, x, y, radius)) return true;
  }
  for (const crate of level.crates) {
    if (rectsOverlapCircle({ x: crate.x, y: crate.y, w: CRATE_SIZE, h: CRATE_SIZE }, x, y, radius)) return true;
  }
  return false;
}

/** True when a wall or crate stands between (x1, y1) and (x2, y2). */
export function sightBlocked(level, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(distance / 8));
  for (let i = 1; i < steps; i += 1) {
    const x = x1 + (dx * i) / steps;
    const y = y1 + (dy * i) / steps;
    for (const wall of level.walls) {
      if (x >= wall.x && x <= wall.x + wall.w && y >= wall.y && y <= wall.y + wall.h) return true;
    }
    for (const crate of level.crates) {
      if (x >= crate.x && x <= crate.x + CRATE_SIZE && y >= crate.y && y <= crate.y + CRATE_SIZE) return true;
    }
  }
  return false;
}

function inBush(level, x, y) {
  for (const bush of level.bushes) {
    const dx = x - bush.x;
    const dy = y - bush.y;
    if (dx * dx + dy * dy < bush.r * bush.r) return true;
  }
  return false;
}

function moveCircle(level, body, dx, dy, radius) {
  const nextX = body.x + dx;
  if (!circleHitsSolids(level, nextX, body.y, radius)) body.x = nextX;
  const nextY = body.y + dy;
  if (!circleHitsSolids(level, body.x, nextY, radius)) body.y = nextY;
  body.x = Math.max(PLAYER.radius + 2, Math.min(FIELD.width - PLAYER.radius - 2, body.x));
  body.y = Math.max(PLAYER.radius + 2, Math.min(FIELD.height - PLAYER.radius - 2, body.y));
}

function guardFacing(guard) {
  return Math.atan2(guard.facingY, guard.facingX);
}

/** Can this guard see the player right now? Writes the reason onto the guard. */
function guardSeesPlayer(level, guard, player, playerInBush) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const distance = Math.hypot(dx, dy);
  const range = playerInBush ? DETECTION.bushSightRange : GUARD.sightRange;
  if (distance > range) {
    guard.sees = false;
    return false;
  }
  const angle = Math.atan2(dy, dx);
  let diff = angle - guardFacing(guard);
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) > GUARD.sightHalfAngle) {
    guard.sees = false;
    return false;
  }
  if (sightBlocked(level, guard.x, guard.y, player.x, player.y)) {
    guard.sees = false;
    return false;
  }
  guard.sees = true;
  guard.lastSeenX = player.x;
  guard.lastSeenY = player.y;
  return true;
}

function loadLevel(index) {
  const def = LEVELS[index];
  return {
    def,
    index,
    player: {
      x: def.playerStart.x,
      y: def.playerStart.y,
      facingX: 1,
      facingY: 0,
      sneaking: false,
      moving: false,
      inBush: false,
    },
    guards: def.guards.map((g) => ({
      x: g.waypoints[0][0],
      y: g.waypoints[0][1],
      waypoints: g.waypoints,
      waypointIndex: 1 % g.waypoints.length,
      pauseLeft: 0,
      speed: g.speed,
      facingX: 0,
      facingY: 1,
      sees: false,
      state: 'patrol',
      lastSeenX: 0,
      lastSeenY: 0,
    })),
    intelTaken: def.intel.map(() => false),
    exitOpen: false,
  };
}

export function createWorld(random) {
  const state = {
    level: 0,
    levelState: loadLevel(0),
    lives: LIVES,
    detection: 0,
    alarmLeft: 0,
    alarmCalmLeft: 0,
    alarms: 0,
    intelTotal: 0,
    time: 0,
    caughtFlash: 0,
    /** The level just cleared, for the level-clear screen (the state has already moved on to the next one). */
    completedLevelName: '',
    completedTime: 0,
  };

  function resetRun() {
    state.level = 0;
    state.levelState = loadLevel(0);
    state.lives = LIVES;
    state.detection = 0;
    state.alarmLeft = 0;
    state.alarmCalmLeft = 0;
    state.alarms = 0;
    state.intelTotal = 0;
    state.time = 0;
    state.caughtFlash = 0;
  }

  function respawn() {
    const taken = state.levelState.intelTaken.slice();
    const total = state.intelTotal;
    state.levelState = loadLevel(state.level);
    state.levelState.intelTaken = taken;
    state.levelState.exitOpen = taken.every(Boolean);
    state.intelTotal = total;
    state.detection = 0;
    state.alarmLeft = 0;
    state.alarmCalmLeft = 0;
    for (const guard of state.levelState.guards) guard.state = 'patrol';
  }

  function stepGuards(dt) {
    const level = state.levelState;
    for (const guard of level.guards) {
      if (guard.state === 'chase') {
        const dx = state.levelState.player.x - guard.x;
        const dy = state.levelState.player.y - guard.y;
        const distance = Math.hypot(dx, dy) || 1;
        guard.facingX = dx / distance;
        guard.facingY = dy / distance;
        moveCircle(level.def, guard, guard.facingX * GUARD.chaseSpeed * dt, guard.facingY * GUARD.chaseSpeed * dt, GUARD.radius);
        continue;
      }
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        continue;
      }
      const target = guard.waypoints[guard.waypointIndex];
      const dx = target[0] - guard.x;
      const dy = target[1] - guard.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 4) {
        guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
        guard.pauseLeft = GUARD.waypointPause;
        continue;
      }
      guard.facingX = dx / distance;
      guard.facingY = dy / distance;
      moveCircle(level.def, guard, guard.facingX * guard.speed * dt, guard.facingY * guard.speed * dt, GUARD.radius);
    }
  }

  /**
   * Advance the world one fixed step. `move` is {x, y} in -1..1 and `sneak`
   * is true while the player creeps. Returns an event bitmask.
   */
  function step(dt, move, sneak) {
    let events = 0;
    const level = state.levelState;
    const player = level.player;
    state.time += dt;
    if (state.caughtFlash > 0) state.caughtFlash -= dt;

    const speed = sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    const moving = move.x !== 0 || move.y !== 0;
    const length = Math.hypot(move.x, move.y) || 1;
    const dx = (move.x / length) * speed * dt;
    const dy = (move.y / length) * speed * dt;
    if (moving) {
      player.facingX = move.x / length;
      player.facingY = move.y / length;
    }
    player.moving = moving;
    player.sneaking = sneak;
    moveCircle(level.def, player, moving ? dx : 0, moving ? dy : 0, PLAYER.radius);
    player.inBush = inBush(level.def, player.x, player.y);

    // Intel pickup: touch a file to take it; the exit opens on the last one.
    for (let i = 0; i < level.def.intel.length; i += 1) {
      if (level.intelTaken[i]) continue;
      const item = level.def.intel[i];
      if (Math.hypot(player.x - item.x, player.y - item.y) < PLAYER.radius + 16) {
        level.intelTaken[i] = true;
        state.intelTotal += 1;
        events |= EVENT_INTEL;
        if (level.intelTaken.every(Boolean)) level.exitOpen = true;
      }
    }

    // Vision: any guard with eyes on the player fills the meter.
    let seen = false;
    let nearestSeen = Infinity;
    for (const guard of level.guards) {
      if (guardSeesPlayer(level.def, guard, player, player.inBush)) {
        seen = true;
        nearestSeen = Math.min(nearestSeen, Math.hypot(player.x - guard.x, player.y - guard.y));
      }
    }
    if (seen) {
      const distance = nearestSeen;
      let rate = DETECTION.baseRate;
      rate *= distance < 90 ? DETECTION.closeMultiplier : distance > 170 ? DETECTION.farMultiplier : 1;
      if (sneak) rate *= DETECTION.sneakMultiplier;
      if (player.inBush) rate *= DETECTION.bushMultiplier;
      rate *= moving ? DETECTION.movingMultiplier : DETECTION.stillMultiplier;
      state.detection = Math.min(100, state.detection + rate * dt);
      state.alarmCalmLeft = DETECTION.alarmCalmSeconds;
    } else {
      state.detection = Math.max(0, state.detection - DETECTION.decayRate * dt);
      if (state.alarmLeft > 0) state.alarmCalmLeft -= dt;
    }

    if (state.detection >= 100 && state.alarmLeft <= 0) {
      state.alarmLeft = DETECTION.alarmSeconds;
      state.alarmCalmLeft = DETECTION.alarmCalmSeconds;
      state.alarms += 1;
      events |= EVENT_ALARM;
      for (const guard of level.guards) guard.state = 'chase';
    }
    if (state.alarmLeft > 0) {
      state.alarmLeft -= dt;
      if (!seen && state.alarmCalmLeft <= 0) {
        state.alarmLeft = 0;
        state.detection = DETECTION.suspicionLeft;
        for (const guard of level.guards) guard.state = 'patrol';
      }
      if (state.alarmLeft <= 0) {
        state.detection = DETECTION.suspicionLeft;
        for (const guard of level.guards) guard.state = 'patrol';
      }
    }

    stepGuards(dt);

    // Caught: a chasing guard reaches the player.
    if (state.alarmLeft > 0) {
      for (const guard of level.guards) {
        if (Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD.catchRange + PLAYER.radius) {
          state.lives -= 1;
          state.caughtFlash = 1.2;
          events |= EVENT_CAUGHT;
          if (state.lives <= 0) {
            events |= EVENT_OVER;
            return events;
          }
          respawn();
          break;
        }
      }
    }

    // Exit: step through the open door to finish the level.
    if (level.exitOpen) {
      const exit = level.def.exit;
      if (player.x > exit.x && player.x < exit.x + exit.w && player.y > exit.y && player.y < exit.y + exit.h) {
        if (state.level + 1 >= LEVELS.length) {
          events |= EVENT_WIN;
          return events;
        }
        state.level += 1;
        state.completedLevelName = level.def.name;
        state.completedTime = state.time;
        state.levelState = loadLevel(state.level);
        state.detection = 0;
        state.alarmLeft = 0;
        events |= EVENT_LEVEL;
      }
    }
    return events;
  }

  function reset() {
    resetRun();
  }

  return {
    state,
    step,
    reset,
    get levelCount() {
      return LEVELS.length;
    },
  };
}

export { STEP };
