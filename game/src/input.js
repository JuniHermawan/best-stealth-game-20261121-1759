// Keyboard and mouse: WASD/arrows to move, Shift to sneak, P or Escape to
// pause, Enter to confirm. A mouse click sets a walk target the player heads
// for until a key is pressed. The canvas reports its own scale so a click
// lands on the same logical point the renderer drew.

import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const KEYS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ShiftLeft: 'sneak',
  ShiftRight: 'sneak',
};

export function createInput(canvas) {
  const held = new Set();
  const pressed = new Set();
  let clickTarget = null;

  function onKeyDown(event) {
    if (event.code === 'Enter' || event.code === 'Space') {
      pressed.add(ACTION_CONFIRM);
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyP' || event.code === 'Escape') {
      pressed.add(ACTION_PAUSE);
      event.preventDefault();
      return;
    }
    const name = KEYS[event.code];
    if (name) {
      held.add(name);
      clickTarget = null;
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    const name = KEYS[event.code];
    if (name) held.delete(name);
  }

  function onClick(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const offsetX = (rect.width - FIELD.width * scale) / 2;
    const offsetY = (rect.height - FIELD.height * scale) / 2;
    clickTarget = {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('click', onClick);

  function moveVector(player) {
    let x = 0;
    let y = 0;
    if (held.has('left')) x -= 1;
    if (held.has('right')) x += 1;
    if (held.has('up')) y -= 1;
    if (held.has('down')) y += 1;
    if (x === 0 && y === 0 && clickTarget) {
      const dx = clickTarget.x - player.x;
      const dy = clickTarget.y - player.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 10) {
        clickTarget = null;
      } else {
        x = dx / distance;
        y = dy / distance;
      }
    }
    return { x, y };
  }

  function takePressed() {
    const actions = new Set(pressed);
    pressed.clear();
    return actions;
  }

  return {
    moveVector,
    takePressed,
    isSneaking() {
      return held.has('sneak');
    },
    clearTarget() {
      clickTarget = null;
    },
  };
}
