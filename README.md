# Shadow Protocol

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/JuniHermawan/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/JuniHermawan/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A top-down stealth game: slip past the guards, collect every intel file, and reach the exit without ever being seen. Three levels, three lives, and a rating — Ghost if no alarm ever sounds.

## Play it

```sh
node serve.ts
```

Then open http://localhost:8080. No build step, no dependencies, no network: the game is plain static files under `game/`.

- **WASD / arrow keys** — move. **Shift** — sneak (slower, harder to spot). **Click** — walk there. **P** — pause. **Enter** — start / continue.
- Guards patrol fixed routes and watch a vision cone. Step into the cone and the detection meter fills — faster up close, slower while sneaking or hiding in a bush.
- **Crates block sight.** **Bushes hide you** — a guard only spots you in a bush from very close.
- Fill the meter and the alarm sounds: every guard chases you until you break line of sight for a while. Get caught and you lose a life and restart the level, intel kept.
- Collect all the intel to open the green exit, then walk through it. Clear all three levels for a rating: **Ghost** (no alarms), **Shadow** (one or two), or **Operative** (more).

## How it is built

- `game/index.html` — the page: a full-window canvas and one screen-reader status line.
- `game/src/main.js` — boot and the one loop: input every frame, the world in fixed 1/60 s steps, paint what is there. Screens: title, play, paused, level clear, game over, victory.
- `game/src/world.js` — the simulation: movement with wall collision, guard patrols and chases, vision cones with line of sight, the detection meter, alarms, intel pickups, the exit, lives. It knows nothing about drawing or keys.
- `game/src/levels.js` — the three levels as data: walls, crates, bushes, patrol loops, intel, exits.
- `game/src/render.js` — everything on screen: the level from above, the cones, the HUD, and the five screens.
- `game/src/input.js` — keyboard and mouse, including click-to-move.
- `game/src/shots.js` — the four staged screenshot scenes (`?shot=start|play|alert|win`), each played forward from the real rules.
- `game/src/config.js` — every tuning number and colour in one place. `game/src/random.js` — a seeded generator so a scene repeats exactly.

The hand-in program is `main.ts` (Node 22, standard library only): it copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library. `serve.ts` is a small static server for local play. `shots.json` lists the four screenshots.

## Screenshots

1. Title screen over level 1. 2. Sneaking toward the first intel file. 3. Spotted — the alarm is up and the guards are chasing. 4. Level clear.

---

<sub>Entered on [make.fun](https://make.fun/?ref=yspfqw66&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
