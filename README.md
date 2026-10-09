# Caspia's Digital Kingdom — OpenCode development handoff

**Current baseline:** V12.1.1, navigation-fixed content + V12.1 modular portal.
**Next goal:** V12.2 Gameplay, Danger Line & Boss Overhaul.

## Open on your Windows laptop

1. Extract this whole ZIP into a dedicated project folder such as `Documents\Caspia-OpenCode`.
2. Open that **folder** in OpenCode (or run `opencode` from the folder in a terminal).
3. In OpenCode, select the configured **caspia-orchestrator** primary agent if available, or use Build.
4. Paste the text from `OPENCODE_FIRST_PROMPT.md` into OpenCode.
5. For local web preview run `py -m http.server 4173` (or `python -m http.server 4173`) in the project folder, then open `http://localhost:4173/`.
6. Run `python scripts/check_project.py` and `node --check js/game.js` for baseline checks.

## Files to edit

- `index.html` — lightweight welcome portal; links to `kingdom.html` and `game.html`.
- `kingdom.html` — preserve the established ICS/TCGC presentation, photos, and interactive sections.
- `game.html` — real modular game page; work **here**, not in the standalone copy.
- `css/game.css` — gameplay styles and responsive layout.
- `js/game.js` — game state, shooting, physics, boss logic, levels, tutorial, and sounds.
- `assets/caspia.webp` — approved Caspia character artwork.
- `game-standalone.html` — old static export; **does not update automatically**.
- `reference/` — archived all-in-one version for comparison only. It contains previously embedded code and is **not** the canonical source.

**Do not run website production from only one extracted file.** Keep the full directory together for local/hosted mode.

## Read before coding

- `AGENTS.md` — developer instructions and non-negotiable preservation rules.
- `docs/V12_2_IMPLEMENTATION_SPEC.md` — exact target game behaviors and acceptance criteria.
- `docs/TEST_MATRIX.md` — browser/gameplay tests to implement and execute.

**There is no claim that V12.2 has been built or tested here.** The package is a ready-to-work source handoff. The exported one-file build is a past baseline.
