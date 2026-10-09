# Project rules for OpenCode agents

You are maintaining **Caspia's Digital Kingdom**, an offline-capable static website with a 10-stage bubble shooter game for an LMC 2026 Institute of Computer Studies (ICS/TCGC) booth. Character: Princess Caspia, long pink hair, blue outfit, colorful mermaid tail. Hero launcher: Snap, recognizable pistol shrimp with oversized functional snapping claw. Palette: magical underwater pink/cyan/blue/purple, strong mobile readability.

## Mandatory workflow
1. Inspect `git status`, if available, plus `index.html`, `game.html`, `css/game.css`, `js/game.js`, `kingdom.html`, and `docs/V12_2_IMPLEMENTATION_SPEC.md`. Do not trust the old one-file archive as source of truth.
2. Establish a browser-playable baseline and write automated tests. Install Playwright if permitted/available; use actual browser interaction where possible rather than syntax checks alone.
3. Work in small reviewable stages; keep the previous stable version or a git commit before physics changes.
4. Fix errors by root cause. Never declare ready solely because `node --check` passes; confirm canvas paints bubbles, shots travel, stage resets, and state transitions work.
5. Run desktop + mobile viewport QA (at least 320x568, 360x640, 390x844, 1440x900), then test on physical Android; iPhone Safari when possible.
6. Verify navigation from portal to game and kingdom, home confirmation, and public deployment behavior under HTTPS.
7. Provide a concise changelog, test evidence, screenshot paths, blockers, and next steps. Do not say tests passed unless actually run.

## Preserve
- 10 rescue stages; bosses at 4 (jellyfish), 7 (armored crab), 10 (magical prison/core); Quick Rescue and Boss Demo.
- Bubble 3+ matching, wall bounce, disconnected drops, accurate trajectory, ready/next swap, local progress save.
- Audio on first user gesture, pause/restart/quit confirmations, tutorial, keyboard+touch controls, Caspia celebrations, final rescue story.
- Existing ICS website text, photos and interactive pearls/cards. Don't redesign unrelated content without clear reason.
- Offline/static hosting; no backend, paywall, analytics, ads, login, external CDN requirements.

## Rules for new mechanics
- True shot origin and visibly loaded projectile must match Snap's claw tip. Use shared firing coordinates for drawing, trajectory simulation and projectiles.
- Real failure: descending bubble pressure + danger line + time-out; fail condition must be deterministic and testable. No redundant 3-heart system unless separately agreed.
- Bosses must have readable character identity and distinct shield/exposed/damaged phases. Direct weak-point hits only when exposed; protect Caspia from being a target.
- Do not make levels mathematically impossible via ammo generation or unavoidable pressure; test every stage.
- Keep essential controls visible without scrolling and without covering Snap or the target bubbles.
- When changing canonical source, regenerate any distribution exports deliberately; never edit the archived one-file output.
