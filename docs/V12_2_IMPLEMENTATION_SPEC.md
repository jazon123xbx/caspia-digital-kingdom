# V12.2 — Gameplay and Boss Overhaul (implementation specification)

## Goal
Preserve the established V12.1 game and ICS portal while fixing real gameplay issues noticed in laptop + Android screenshots. This is a **plan**, not implemented V12.2 code.

## Defects from user screenshots
1. `kingdom.html` failed with `ERR_FILE_NOT_FOUND` when standalone portal was moved alone. Root cause: external relative link to missing file. Package fixed modular files together and maintain a separate generated one-file export; verify navigation in both formats.
2. The actual loaded bubble is not visibly inside Snap's claw, and shots appear from an abstract center line. Fix geometry/source of truth and z-order.
3. Board bubbles remain far from Snap; missing-shot pressure is too weak. Give the player a clearly indicated danger boundary and actual game-over scenario.
4. Level 10 Enchanted Pearl Core appears as a purple circle, not a convincing boss/prison. Need legible bespoke boss art/state; avoid extra effects hiding gameplay.

## Critical, ordered implementation gates

### Gate 0 — Baseline and tests
- Inspect canonical files, record reproducible gameplay baseline, audit load errors and state machine.
- Commit baseline. Record current defects with browser screenshots/video.
- Create Playwright tests for successful menu start, Level 1 bubble render, shot + collision, ammo swap, confirm restart, all stages load, direct boss damage, final victory, portal navigation, and mobile fit.

### Gate 1 — Snap claw launcher alignment
- Derive a common **launcherWorldPosition** from the illustrated claw muzzle; adapt scale/resizes. Canonical launcher position must drive ready-bubble render, aim dotted path, actual projectile starting coordinate, collision calculations and claw recoil effects.
- Visibly render a glossy bubble inside/pinch of Snap's oversized pincer, never hidden behind foreground art; loaded color must equal actual fired color and READY preview.
- Render NEXT color and swap animation; swap never consumes shot/time; swapping disabled while projectile in flight.
- Pointer release launches from claw; keyboard Space launches too. Wall bounces and predicted aim path remain accurate. Add focused tests verifying projectile spawn is within a small tolerance of the visible claw bubble.

### Gate 2 — Descending pressure and game over
- Use shot-pressure that becomes gradually tougher through levels. Starting tuning targets: Lv1–3: one row/step after 7 non-clearing shots; Lv4–6: after 6; Lv7–9: after 5; Lv10: after 4, with clear warnings and caps/boss fairness adjustments. Tune from playtests, do not assume numbers are balanced.
- Each pressure event advances the attached formation toward Snap by one visual row/controlled y-offset **without breaking hex-grid adjacency**. New incoming rows can be added later only if justified by tests.
- Visible dashed danger line at a safe distance above the claw. **Lose as soon as any attached bubble touches/crosses danger boundary**, checked after settling and descent. Also lose at 0:00. Do NOT lose from temporary particles/falling detached bubbles or an in-flight projectile.
- Show escalation: warning counter to next descent, yellow then red cue when clusters approach line, sound cue at pressure event, brief but nonblocking animation. Pausing, tutorial, dialogs and background tab must pause timer, pressure and shots.
- Repeatable stage retry resets board/pressure/timer. Tests must simulate deliberate missing shots until failure; verify lose modal and retry flow.

### Gate 3 — Bosses and story art
- Boss stage 4: readable jellyfish guardian (3 HP), stationary exposed weak point; stage 7 armored crab (4 HP), telegraphed two-position weak point; stage 10 fractured corrupted pearl prison/core (5 HP) with Caspia visibly captive **behind** the villain.
- Shielded -> Exposed -> Hit -> Re-shield/Defeated flow. Matching shield bubbles reveals the weak point; during exposed phase Snap fires a neutral Pearl Strike at an actual target hitbox, never at Caspia. One projectile == at most one HP damage. Weak point target, hitbox and aim guide must align.
- Each boss must have understandable name, silhouette, shield indicator, HP bar, hurt reaction, phase instructions and defeat animation. Distinct attack/pressure mechanism if feasible without performance regressions.
- Final rescue animation should read as spell shattered/Caspia freed; buttons Home, Replay and story summary. Keep all images self-contained/local and optimize for mobile.

### Gate 4 — Polish and distribution
- Rebalance all 10 handcrafted levels against timer+pressure; earlier levels accessible, later levels difficult yet fair. Quick Rescue should still be approachable for short booth visits.
- Performance: avoid expensive global filters/blur and excessive particles; cap DPR; honor prefers-reduced-motion; sound toggle works and respects autoplay rules.
- All controls visible at small viewport with safe-area insets, no document scrolling needed for game input; contrast, touch sizes, keyboard shortcuts.
- Restore a single-file generated export **from canonical modular sources**, not copied old HTML; browser test both multi-file and single-file. Public QR must point to an HTTPS hosted root index.

## Completion criteria
- 10/10 stages initialize and can be completed; intentionally triggering lose succeeds on early + late levels; boss direct-hit test decreases HP only after exposed state.
- No blank board, no missing level selector, no white/incorrect active ammo, no loading from empty muzzle.
- Portal -> Explore Website -> Portal and Portal -> Game -> Portal work on a real HTTP server. No broken relative assets or 404s.
- 320x568, 360x640, 390x844, 1440x900 verified; Android Chrome touch QA performed; iPhone Safari where accessible. No claim of physical-device QA if unavailable.
- Documentation and test evidence are included in handoff.
