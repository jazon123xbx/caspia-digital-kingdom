# Acceptance Test Matrix (write and execute these tests)

| Category | Test | Evidence |
| --- | --- | --- |
| Initialization | Load Level 1 after tutorial; visible colored formation, level number, loaded/next bubble and Snap | Browser screenshot + no console errors |
| Launcher | Start bubble visibly clamped in claw; projectile starts at SAME visual spot and follows aim | Frame-by-frame or coordinate assertion |
| Swap | READY/NEXT swap colors; shot color equals shown READY; swapping during flight disabled | State + screenshot |
| Match/physics | Shoot a 3+ match; removes those only, detached clusters fall | Automation and video |
| Wall bounce | Projected aim path and projectile bounce align | Browser recorded interaction |
| Descend | Intentionally make N non-clearing shots; cluster moves toward danger line, indicator resets | Deterministic game harness |
| Game over | Force bottom attached bubble to touch fail line; loss dialog appears; input frozen | State assertion |
| Timeout | At 0 seconds game ends; dialogs and tab suspension pause countdown | Fake-clock/browser testing |
| Bosses | For stages 4,7,10 shield clears, target exposed, direct hits decrement HP once | Three independent tests |
| Fairness | Avoid generating absent colors / impossible shoots; retry is solvable | Scripted simulations |
| Final rescue | Complete stage 10 by real hits; ending and return/restart buttons work | Browser capture |
| Progress | Unlock/reload persistence and fresh-player starts | localStorage fixture tests |
| Navigation | `index.html -> kingdom.html -> index.html`; `index.html -> game.html -> index.html` | local HTTP test, no 404s |
| Mobile | 320x568, 360x640, 390x844, 412x915: READY/NEXT/SWAP visible; no overflow | screenshots + bounding boxes |
| Desktop | 1440x900 mouse/keyboard and pause controls work | screenshot |
| Offline | No nonlocal asset requirements for core game; works when hosted statically | network log |

Keep automated tests independent of level completion cheats when testing normal gameplay. For complex boss/final victory state tests, use explicit test-only hooks or deterministic fixtures but distinguish simulated and genuine playthrough tests in the report.
