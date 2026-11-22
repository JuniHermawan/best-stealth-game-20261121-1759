// Everything on screen: the level seen from above, the guards' vision cones,
// the HUD, and the title, pause, level-complete, game-over and victory
// screens. It draws state only; it never changes it.

import { FIELD, FONT, GUARD, PALETTE, PLAYER } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL = 'level';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const CRATE_SIZE = 40;

function drawCone(ctx, guard, alarmed) {
  const facing = Math.atan2(guard.facingY, guard.facingX);
  const range = GUARD.sightRange;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, range, facing - GUARD.sightHalfAngle, facing + GUARD.sightHalfAngle);
  ctx.closePath();
  ctx.fillStyle = alarmed ? PALETTE.coneAlarm : guard.sees ? PALETTE.coneSuspicious : PALETTE.cone;
  ctx.fill();
}

function drawGuard(ctx, guard, alarmed) {
  drawCone(ctx, guard, alarmed);
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.guard;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#7a1f1a';
  ctx.stroke();
  // Facing wedge: a small visor showing where the guard looks.
  const facing = Math.atan2(guard.facingY, guard.facingX);
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.arc(guard.x, guard.y, GUARD.radius - 3, facing - 0.5, facing + 0.5);
  ctx.closePath();
  ctx.fillStyle = '#ffd9d6';
  ctx.fill();
  if (guard.sees) {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 20px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - GUARD.radius - 8);
  }
}

function drawPlayer(ctx, player, detection) {
  ctx.beginPath();
  ctx.arc(player.x, player.y, PLAYER.radius, 0, Math.PI * 2);
  ctx.fillStyle = player.sneaking ? PALETTE.playerSneak : PALETTE.player;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0b3b35';
  ctx.stroke();
  const facing = Math.atan2(player.facingY, player.facingX);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.arc(player.x, player.y, PLAYER.radius - 4, facing - 0.45, facing + 0.45);
  ctx.closePath();
  ctx.fillStyle = '#d9fff8';
  ctx.fill();
  if (detection > 1) {
    const width = 46;
    const x = player.x - width / 2;
    const y = player.y - PLAYER.radius - 16;
    ctx.fillStyle = '#0b0e14';
    ctx.fillRect(x - 1, y - 1, width + 2, 8);
    ctx.fillStyle = detection > 66 ? PALETTE.danger : '#f2c94c';
    ctx.fillRect(x, y, (width * detection) / 100, 6);
  }
}

function drawHud(ctx, state, levelName) {
  const level = state.levelState;
  ctx.fillStyle = 'rgba(11, 14, 20, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, 44);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 16px ' + FONT;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(levelName, 20, 23);
  const intelDone = level.intelTaken.filter(Boolean).length;
  ctx.fillStyle = PALETTE.intel;
  ctx.fillText(`INTEL ${intelDone}/${level.def.intel.length}`, 330, 23);
  ctx.fillStyle = PALETTE.text;
  ctx.fillText('♥'.repeat(Math.max(0, state.lives)) + '♡'.repeat(Math.max(0, 3 - state.lives)), 520, 23);
  const minutes = Math.floor(state.time / 60);
  const seconds = Math.floor(state.time % 60);
  ctx.textAlign = 'right';
  ctx.fillText(`TIME ${minutes}:${String(seconds).padStart(2, '0')}`, FIELD.width - 20, 23);
  if (state.alarmLeft > 0) {
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 20px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('⚠ ALARM — BREAK LINE OF SIGHT ⚠', FIELD.width / 2, 72);
  } else if (!level.exitOpen) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '15px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('Collect all intel, then reach the green exit. Shift = sneak. Click = walk there.', FIELD.width / 2, 72);
  } else {
    ctx.fillStyle = PALETTE.exit;
    ctx.font = 'bold 16px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('EXIT OPEN — GO!', FIELD.width / 2, 72);
  }
  ctx.textBaseline = 'alphabetic';
}

function drawPanel(ctx, title, lines, hint) {
  ctx.fillStyle = 'rgba(5, 7, 11, 0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = PALETTE.panel;
  const boxW = 640;
  const boxH = 150 + lines.length * 30;
  const boxX = (FIELD.width - boxW) / 2;
  const boxY = (FIELD.height - boxH) / 2;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = PALETTE.wallTop;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 34px ' + FONT;
  ctx.textAlign = 'center';
  ctx.fillText(title, FIELD.width / 2, boxY + 58);
  ctx.font = '17px ' + FONT;
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? PALETTE.player : PALETTE.muted;
    ctx.fillText(line, FIELD.width / 2, boxY + 104 + i * 30);
  });
  if (hint) {
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 16px ' + FONT;
    ctx.fillText(hint, FIELD.width / 2, boxY + boxH - 24);
  }
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.floor(FIELD.width * scale);
    canvas.height = Math.floor(FIELD.height * scale);
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
  }
  fit();
  window.addEventListener('resize', fit);

  function drawLevel(state) {
    const level = state.levelState;
    const def = level.def;
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Checker floor.
    const tile = 80;
    for (let y = 0; y < FIELD.height / tile; y += 1) {
      for (let x = 0; x < FIELD.width / tile; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
        ctx.fillRect(x * tile, y * tile, tile, tile);
      }
    }
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= FIELD.width; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, FIELD.height);
      ctx.stroke();
    }
    for (let y = 0; y <= FIELD.height; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(FIELD.width, y);
      ctx.stroke();
    }
    // Bushes: soft cover the player can hide in.
    for (const bush of def.bushes) {
      ctx.beginPath();
      ctx.arc(bush.x, bush.y, bush.r, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.bush;
      ctx.fill();
      ctx.fillStyle = PALETTE.bushLeaf;
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * Math.PI * 2 + 0.4;
        ctx.beginPath();
        ctx.arc(bush.x + Math.cos(angle) * bush.r * 0.45, bush.y + Math.sin(angle) * bush.r * 0.45, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Exit door: locked grey, open green with a glow.
    const exit = def.exit;
    ctx.fillStyle = level.exitOpen ? PALETTE.exit : PALETTE.exitLocked;
    ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
    ctx.strokeStyle = level.exitOpen ? '#b8f5d2' : PALETTE.wallTop;
    ctx.lineWidth = 2;
    ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);
    ctx.fillStyle = '#0b0e14';
    ctx.font = 'bold 13px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
    // Intel files: cyan diamonds.
    for (let i = 0; i < def.intel.length; i += 1) {
      if (level.intelTaken[i]) continue;
      const item = def.intel[i];
      const pulse = 1 + Math.sin(performance.now() / 300 + i) * 0.12;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.scale(pulse, pulse);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = PALETTE.intel;
      ctx.fillRect(-9, -9, 18, 18);
      ctx.restore();
      ctx.fillStyle = '#0b0e14';
      ctx.font = 'bold 12px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('i', item.x, item.y + 4);
    }
    // Crates: solid cover that blocks sight.
    for (const crate of def.crates) {
      ctx.fillStyle = PALETTE.crate;
      ctx.fillRect(crate.x, crate.y, CRATE_SIZE, CRATE_SIZE);
      ctx.strokeStyle = PALETTE.crateEdge;
      ctx.lineWidth = 2;
      ctx.strokeRect(crate.x + 1, crate.y + 1, CRATE_SIZE - 2, CRATE_SIZE - 2);
      ctx.beginPath();
      ctx.moveTo(crate.x, crate.y);
      ctx.lineTo(crate.x + CRATE_SIZE, crate.y + CRATE_SIZE);
      ctx.moveTo(crate.x + CRATE_SIZE, crate.y);
      ctx.lineTo(crate.x, crate.y + CRATE_SIZE);
      ctx.stroke();
    }
    // Walls.
    for (const wall of def.walls) {
      ctx.fillStyle = PALETTE.wall;
      ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
      ctx.fillStyle = PALETTE.wallTop;
      if (wall.w >= wall.h) ctx.fillRect(wall.x, wall.y, wall.w, 3);
      else ctx.fillRect(wall.x, wall.y, 3, wall.h);
    }
    // Guards under the player, cones first so the player stays readable.
    const alarmed = state.alarmLeft > 0;
    for (const guard of level.guards) drawGuard(ctx, guard, alarmed);
    drawPlayer(ctx, level.player, state.detection);
    if (state.caughtFlash > 0) {
      ctx.fillStyle = `rgba(229, 83, 75, ${Math.min(0.45, state.caughtFlash * 0.4)})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
  }

  function draw(state, screen, best) {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawLevel(state);
    drawHud(ctx, state, state.levelState.def.name);
    if (screen === SCREEN_TITLE) {
      drawPanel(
        ctx,
        'SHADOW PROTOCOL',
        [
          'A top-down stealth game: collect the intel, reach the exit, stay unseen.',
          'WASD / arrows — move    Shift — sneak    Click — walk there    P — pause',
          'Vision cones are the guards’ eyes. Crates block sight, bushes hide you.',
          best > 0 ? `Best clear: ${Math.floor(best / 60)}:${String(Math.floor(best % 60)).padStart(2, '0')}` : 'No clear yet — ghosts finish without a single alarm.',
        ],
        'Press Enter or click to start',
      );
    } else if (screen === SCREEN_PAUSED) {
      drawPanel(ctx, 'PAUSED', ['Take a breath. The guards wait for no one — except now.'], 'Press P or Enter to resume');
    } else if (screen === SCREEN_LEVEL) {
      const doneName = state.completedLevelName || state.levelState.def.name;
      const doneTime = state.completedTime || state.time;
      drawPanel(
        ctx,
        'LEVEL CLEAR',
        [`${doneName} done in ${Math.floor(doneTime / 60)}:${String(Math.floor(doneTime % 60)).padStart(2, '0')}.`, 'The next floor has more guards and tighter patrols.'],
        'Press Enter for the next level',
      );
    } else if (screen === SCREEN_OVER) {
      drawPanel(ctx, 'CAUGHT', ['Three strikes and the run is over.', 'The guards keep the intel. Try a slower route.'], 'Press Enter to try again');
    } else if (screen === SCREEN_WIN) {
      const rating = state.alarms === 0 ? 'GHOST — never seen once' : state.alarms <= 2 ? 'SHADOW — barely a whisper' : 'OPERATIVE — loud, but alive';
      drawPanel(
        ctx,
        'ALL CLEAR',
        [
          `Every level done in ${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')} with ${state.alarms} alarm${state.alarms === 1 ? '' : 's'}.`,
          `Rating: ${rating}.`,
          best > 0 ? `Best clear: ${Math.floor(best / 60)}:${String(Math.floor(best % 60)).padStart(2, '0')}` : '',
        ].filter(Boolean),
        'Press Enter to run it again',
      );
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  return { draw, fit };
}
