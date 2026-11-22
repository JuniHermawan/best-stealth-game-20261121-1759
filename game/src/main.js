// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between six screens: title,
// play, paused, level clear, game over and victory.
//
// ?seed=N fixes the run. ?shot=start|play|alert|win (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets
// window.__shotReady for a screenshot.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CAUGHT, EVENT_LEVEL, EVENT_OVER, EVENT_WIN } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_LEVEL, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseFloat(window.localStorage.getItem(BEST_KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best time then lasts this visit only.
  }
}

function announce(text) {
  status.textContent = text;
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function startRun() {
    world.reset();
    screen = SCREEN_PLAY;
    announce('Shadow Protocol: collect the intel, reach the exit, stay unseen.');
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const pressed = input.takePressed();
    if (pressed.has(ACTION_PAUSE) && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
    } else if (pressed.has(ACTION_PAUSE) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
    }
    if (screen === SCREEN_TITLE && pressed.has(ACTION_CONFIRM)) {
      startRun();
    } else if (screen === SCREEN_LEVEL && pressed.has(ACTION_CONFIRM)) {
      screen = SCREEN_PLAY;
    } else if ((screen === SCREEN_OVER || screen === SCREEN_WIN) && pressed.has(ACTION_CONFIRM)) {
      startRun();
    }
    if (screen === SCREEN_PLAY) {
      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const events = world.step(STEP, input.moveVector(world.state.levelState.player), input.isSneaking());
        if (events & EVENT_CAUGHT) {
          announce('Caught! A guard reached you. Lives left: ' + world.state.lives + '.');
        }
        if (events & EVENT_LEVEL) {
          screen = SCREEN_LEVEL;
          announce('Level clear. Next floor.');
        } else if (events & EVENT_WIN) {
          screen = SCREEN_WIN;
          const time = world.state.time;
          if (best === 0 || time < best) {
            best = time;
            saveBest(best);
          }
          announce('All clear. Rating: ' + (world.state.alarms === 0 ? 'Ghost' : world.state.alarms <= 2 ? 'Shadow' : 'Operative') + '.');
        } else if (events & EVENT_OVER) {
          screen = SCREEN_OVER;
          announce('Caught three times. Run over.');
        }
      }
    }
    renderer.draw(world.state, screen, best);
    requestAnimationFrame(frame);
  }

  // A click on the title, level-clear, game-over or victory screen starts too.
  canvas.addEventListener('click', () => {
    if (screen === SCREEN_TITLE || screen === SCREEN_LEVEL || screen === SCREEN_OVER || screen === SCREEN_WIN) {
      if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN) startRun();
      else screen = SCREEN_PLAY;
    }
  });

  announce('Shadow Protocol: press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
