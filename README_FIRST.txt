# Caspia V14 — Royal Arcade (Release Candidate)

## Play immediately — no OpenCode

**Standalone game:** Open `game-standalone.html` in Brave or Chrome. All 36 character/boss/praise images, styles, and scripts are embedded in this file. Its **Home / Portal** actions intentionally return to the game's self-contained welcome menu instead of linking to a missing `index.html`.

**Whole website:** Keep the folder together and open `index.html` to explore the ICS website or launch the playable game. For best QR-code testing or deployment, serve this folder with a web server:

```powershell
cd "PATH_TO_EXTRACTED_FOLDER"
py -m http.server 8080
```

Visit `http://localhost:8080/`. The standalone file also opens with no local server.

## Audio

Royal Arcade synthesised sound effects are provided by `js/royal-audio.js` (Web Audio API). Sounds only play after an interaction. **Sound effects default on; ambient music defaults off.** Click the note icon to mute or unmute, or the gear icon for sound settings and volume. Settings are saved when browser storage is available. Volume and active sound voices are bounded; gameplay works without audio.

## Key V14 changes

- Final Enchanted Pearl Core body and five-position target share a single gameplay clock; the boss now visibly tracks the collision coordinates, freezes on pause, and accelerates slightly as HP falls.
- Completed players' **Play Again** starts at Level 1, retaining previously unlocked progress.
- Loaded pearl is rendered from the same canvas muzzle used to aim and fire; illustrated Snap placement now uses scale-aware math instead of repeated measuring on every pointer move.
- Cached occupied-pearl collision candidates until the grid or layout changes.
- No full-canvas repaint behind a modal or while paused; live gameplay still animates normally.
- Tutorial page 1 fits Snap's full art on 320px screens; enhanced portrait contrast and mobile controls.
- Shorter pearl vocabulary and clearer strike labels; rescue progress becomes 100% at final victory.
- Original gameplay mechanics retained: 10 stages, bosses at 4/7/10, quick rescue, aiming, reflection math, three-miss descent, defeat/retry.

## Smoke test

1. Start Story Adventure; verify Guide, shooting, swapping and matching. Check left/right wall reflection.
2. Boss Demo → Jellyfish: shield break, weak point, attack on third unsuccessful shot, damage pose returns to idle.
3. Level Map → Level 7 Crab; watch shield and attack.
4. Level 10 Core; observe boss drift and its five weak-point positions with the mouse still; verify hit visual alignment.
5. Allow pearls to reach the red danger line; test Game Over and Retry.
6. Verify Mute, Sound Settings, volume, optional quiet music, and pause.
7. Complete final victory; confirm progress and Play Again at Level 1.
8. Mobile: test 320px and 390px widths, and physical Android/iPhone devices if possible.
9. Visit the whole website starting at `index.html` and check Explore ICS, return to portal, and Play Game.

## Validation scope and limitations

Chromium loaded the self-contained HTML directly via a browser content injection because this testing environment blocks local HTTP and file navigation. Desktop and mobile smoke checks passed, including 10-stage initialization, core body alignment while moving, save/replay logic, audio controls, three-miss boss attack, boss hit/idle, danger and Retry. The existing deterministic physics and local dependency checks passed.

Full ten-stage human playthrough, actual Android/iPhone FPS/battery behavior, live QR deployment, and listening tests on real hardware are **not** claimed as verified. Sound is synthesized rather than professionally recorded; adjust volume based on booth speakers.
