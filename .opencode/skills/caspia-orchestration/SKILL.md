---
name: caspia-orchestration
description: Coordinates safe, incremental development and browser acceptance testing of the Caspia Digital Kingdom static site and 10-level rescue bubble shooter.
---

# Caspia project-specific delivery skill

Read `AGENTS.md`, `README.md`, `docs/V12_2_IMPLEMENTATION_SPEC.md`, and `docs/TEST_MATRIX.md` before editing. Treat `game.html` plus `css/game.css` and `js/game.js` as canonical gameplay source; `index.html` for modular portal and `kingdom.html` for preserved ICS site.

As orchestrator, delegate distinct review/tasks to inlined specialists when available, but coordinate collisions around `js/game.js` and protect working mechanics. Establish a reproducible baseline, then implement Gates 1–4 in order. Prioritize correctness and browser QA over effects; provide user with screenshots and actual pass/fail tests before claiming success. Rebuild standalone distributions from canonical source at the end.

Never assume the previous single-file export updates automatically. Never edit the archived copy in `reference/`.
