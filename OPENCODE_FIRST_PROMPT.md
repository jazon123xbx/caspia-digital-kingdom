We are continuing our existing project **Caspia's Digital Kingdom / Save Princess Caspia**. This is the project handoff, NOT a blank new app.

Act as **caspia-orchestrator**, coordinate appropriate subagents if available, and follow `AGENTS.md` and `docs/V12_2_IMPLEMENTATION_SPEC.md`. Read the project source and current status first. The working modular files are `index.html`, `kingdom.html`, `game.html`, `css/game.css`, `js/game.js`, `assets/caspia.webp`. Do NOT use `reference/V12_1_1_previous_singlefile_DO_NOT_EDIT.html` as an editing base; it is an archived export.

**Objective:** build **V12.2 Gameplay & Boss Overhaul**, keeping the existing 10 levels (bosses at 4/7/10), Quick Rescue, Snap shrimp launcher, Caspia artwork, and ICS website.

**Priority order:**
1. Audit and browser-test baseline; fix broken links/assets/blank-board bugs first. Create a git baseline commit.
2. Make the loaded bubble visible INSIDE Snap's oversized claw and launch precisely from the same coordinate. Next and Swap must reflect the real shot.
3. Add visible danger line, shot-pressure-based descending board, deterministic GAME OVER when attached bubbles touch the line, and timeout loss. Pause accurately. Add tests that PROVE losing is possible.
4. Replace abstract boss art with recognizable jellyfish/crab/enchanted pearl prison and correctly working shield, exposed weak point, direct-hit HP phases. Make Caspia visible behind the final prison, never a target.
5. Polish cinematic CSS, sound, particles, warnings, mobile view, controls and portal; regenerate one-file standalone from canonical modular code at the end.
6. Test at 320x568, 360x640, 390x844 and 1440x900; verify actual shots, loss, retries, boss hitbox, Quick Rescue, victory and portal -> website -> portal. Save screenshots and report blocked tests honestly.

Before changing code, tell me what currently works, what is broken, and the ordered implementation plan. Then START implementing Gate 1 and Gate 2 with tests. Do not rewrite the whole game or destroy its preserved content. For each gate, report files changed, verified behavior, and any failures. Preserve my existing mobile-friendly pink/blue cinematic identity.
