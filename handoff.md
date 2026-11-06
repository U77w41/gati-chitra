
# Gati-chitra Agent Handoff

This document summarizes the repository state, architecture, and operational rules for AI coding agents continuing work on Gati-chitra.

---

## 1. Project Overview

Gati-chitra is an interactive, browser-based Mermaid flowchart editor that animates edges in real time. It is a static single-page application hosted on GitHub Pages:

- No backend server, no database, no external telemetry or tracking.
- All rendering (Canvas 2D and SVG), layout computation (dagre + custom geometry), and exports (PNG, SVG, GIF, MP4/WebM) happen client-side in the browser.
- Progressive Web App (PWA) with full offline functionality via service worker.
- Responsive design supporting desktop browsers and mobile touch devices (phones and tablets).

---

## 2. Current State (v0.10.0)

- **Current plan**: `plan.md` (Tasks 64 to 103). Milestone D1 (Tasks 64 to 74) and Milestone D2 (Tasks 75 to 81) are complete; next is Milestone D3 (Tasks 82 to 88).
- **Last verified**: 2026-11-06, locally.
- **Branch**: `main` (ahead of origin by unpushed commits; never push without explicit user request).
- **Release commit**: `chore: release v0.10.0` (tag `v0.10.0`).
- **Plans**:
  - `docs/superpowers/plans/2026-11-02-gati-chitra.md` (v0.1, Tasks 0 to 23): all task boxes ticked.
  - `docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md` (v0.2 to v0.6, Tasks 24 to 60): all 196 task step boxes ticked.
  - `plan.md` (Tasks 64 to 103): Milestones D1 and D2 complete; Tasks 74 and 81 automated boxes ticked in Part 10.
- **Checks run on 2026-11-06 (v0.10.0 release)**:
  - `npm test`: 531 tests passing across 87 files.
  - `npm run lint`: 0 warnings, 0 errors across 237 files.
  - `BASE_PATH=/gati-chitra/ npm run build`: passes, including service worker TypeScript config.
  - `BASE_PATH=/gati-chitra/ npm run check:dist`: initial JS 136.60 KB gzip (limit 150 KB); largest lazy chunk 57.27 KB gzip (limit 80 KB); state (3.36 KB), class (3.52 KB), er (3.41 KB); `OK`.
  - `npm run test:e2e`: 332 passed, 17 skipped across `chromium`, `firefox`, `webkit`, `mobile-chrome` and `mobile-safari`. 0 failed.

---

## 2d. Latest Session (2026-11-06): Milestone D2 (Tasks 75 to 81, v0.10.0)

**Status: committed locally** as individual task commits (`2f718e2`, `6e258fd`, `48d5cbe`, `e960aa3`, `bae4b43`, `4fa2b91`), release commit `chore: release v0.10.0` and tagged `v0.10.0`. Never pushed.

**What was completed:**
- **Task 75 (feat: read Mermaid state diagrams)**: parser for `stateDiagram-v2` and `stateDiagram`, supporting state nodes, start/end pseudo-states, fork/join, composite state nesting, note blocks, dividers, transitions, classDefs, and styles. Fixtures `state.mmd` and `state.json` added to corpus.
- **Task 76 (feat: edit state diagrams on the canvas; add the state template and diagram browser tests)**: visual canvas operations for state diagrams (`applyStateOp`), added `state.mmd` template to gallery, and created browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 77 (feat: read Mermaid class diagrams)**: parser for `classDiagram`, reading classes with annotations, members, compartments, namespaces, notes, visibility symbols, and relation edges with cardinalities. Fixtures `class.mmd` and `class.json` added to corpus.
- **Task 78 (feat: edit class diagrams on the canvas and add the class template)**: visual canvas operations for class diagrams (`applyClassOp`), added `class.mmd` template to gallery, and registered in e2e tests.
- **Task 79 (feat: read Mermaid entity relationship diagrams)**: parser for `erDiagram`, reading entities with attributes, keys (PK/FK/UK), comments, symbol and word cardinality relationships. Fixtures `er.mmd` and `er.json` added to corpus.
- **Task 80 (feat: edit ER diagrams on the canvas and add the ER template)**: visual canvas operations for ER diagrams (`applyErOp`), added `er.mmd` template to gallery, and registered in e2e tests.
- **Task 81 (chore: release v0.10.0)**: version bumped to 0.10.0 in `package.json` and `src/repo.test.ts`, added "Diagram types" section to `README.md` (and humanized), updated `RELEASE_CHECKLIST.md`, `DECISIONS.md`, and `handoff.md`.

**Key files created or changed:**
- `src/diagrams/state/`: `parse.ts`, `patterns.ts`, `scope.ts`, `ops.ts`, `index.ts`, unit tests.
- `src/diagrams/class/`: `parse.ts`, `patterns.ts`, `helpers.ts`, `ops.ts`, `index.ts`, unit tests.
- `src/diagrams/er/`: `parse.ts`, `patterns.ts`, `helpers.ts`, `ops.ts`, `index.ts`, unit tests.
- `public/templates/`: `state.mmd`, `class.mmd`, `er.mmd`, `index.json`.
- `tests/fixtures/diagrams/`: `state.mmd`, `state.json`, `class.mmd`, `class.json`, `er.mmd`, `er.json`.
- `tests/e2e/`: `diagrams.spec.ts`, `diagram-edit.spec.ts`.

**Metrics & Verification:**
- All non-test TypeScript source files remain strictly under 300 lines (longest is `src/diagrams/er/parse.ts` at 280 lines).
- `npm test`: 87 test files, 531 unit tests passing.
- `npm run lint`: 0 warnings, 0 errors.
- `BASE_PATH=/gati-chitra/ npm run build`: successful production build.
- `BASE_PATH=/gati-chitra/ npm run check:dist`: Initial JS 136.60 KB gzip; largest lazy chunk 57.27 KB gzip; all diagram chunks ~3.3 - 3.5 KB gzip.
- `npm run test:e2e`: 332 passed, 17 skipped, 0 failed.

## 2a. Latest Session (2026-11-05): Pipeline Card Text Alignment

**Status: committed by the owner** as `9f3f4e2` ("v0.8.0 minor improvements") and pushed to `origin/main`.

**Bug:** With Card set to Pipeline, node labels did not line up with their nodes. Diamond labels started near the diamond's left tip and ran outside the slanted edges. On cards, every wrapped line after the first was joined into one row, so long subtitles ran past the card's right edge (for example "F. Alerted, but Bank marked it FP before the complaint").

**Root cause:** `drawPipelineText` in `src/render/pipeline-cards.ts` drew every shape's label left-aligned at `left + 36`, and joined `box.lines[1..]` into a single row. The layout (`src/layout/measure.ts`) sizes boxes for one 16px row per wrapped line, so the joined row could be much wider than the box, and a fixed left inset does not work for a diamond, which narrows away from its middle row.

**Fix (only `src/render/pipeline-cards.ts`):**

- Each wrapped line gets its own row: a 17px bold title row, then 14px subtitle rows. The block is centred vertically on the node.
- Diamonds: lines are centred on the diamond's centre and moved down 3px to clear the `?` badge. Each line's `fillText` `maxWidth` is the diamond's width at that row's y, minus 12px padding on each side.
- Other shapes: the icon moved to `left + 16`, text starts at `left + 32`, and `maxWidth` stops 8px short of the right edge.
- The typewriter reveal now runs line by line (`revealLines`).
- SVG export does not use pipeline cards, so it is unchanged.

**Tests:** new `src/render/pipeline-cards.test.ts` (3 tests): diamond lines are centred and fit inside the slanted edges; card lines are drawn one per row, inside the card and centred vertically; typewriter reveal runs line by line. The first two failed before the fix, for the reason described above.

**Instruction files:** `AGENTS.md` now says to read and update `handoff.md` every session, to treat user-reported bugs with `systematic-debugging` and `test-driven-development`, and to commit or push only when the user asks. `CLAUDE.md` and `GEMINI.md` each have one matching line. `DECISIONS.md` has one new line for this fix.

**Checks run on 2026-11-05:**

- `npm test`: 417 tests passing across 62 files.
- `npm run lint`: clean.
- `npm run build` with `BASE_PATH=/gati-chitra/`: passes.
- `npm run check:dist`: initial JS 132.02 KB gzip, largest lazy chunk 57.27 KB gzip, `OK`.
- `npm run test:e2e`: 309 passed, 16 skipped (conditional cases, as before), 0 failed.
- Checked by eye in the dev server with the screenshot's flowchart in Pipeline mode: diamond labels are centred and card subtitles wrap inside their cards.

---

## 2b. Latest Session, Part 2 (2026-11-05): Pause/Play and Build Connectors

**Status: committed by the owner** as `9d84c87` ("v0.8.1 minor fixes").

**Bug 1, Pause/Play in build and typewriter modes:** Pause froze the frame, but Play did not continue from it. The render loop computed the phase from wall-clock time (`performance.now() - startTime`), so after a pause of N seconds the animation skipped N seconds ahead. In pulse, traffic or dash mode that is barely visible. In build and typewriter modes it jumps to a different stage, or restarts the build, so Play looked broken.

**Fix:** new `src/anim/clock.ts` (`createAnimClock`), which leaves paused time out of `elapsed()`. `src/app/ui.ts` pauses and resumes the clock from the Pause button's callback, and pauses it at startup when reduced motion starts the app paused. `RenderLoopEnv` in `src/app/render-loop.ts` now takes `getElapsed` instead of `startTime` and `getPausedPhase`.

**Bug 2, connectors always visible in build mode:** `frameStateBuild` always returns a `dashOffset`, and `drawEdgeDashOverlay` (`src/render/draw-edges.ts`) stroked every edge at full length, whatever its `edgeGrow`. Connectors showed before their nodes appeared. Typewriter returns a `dashOffset` only after p 0.78, when every edge has grown, so it was unaffected.

**Fix:** `drawEdgeDashOverlay` takes `frame.edgeGrow` and skips any edge whose grow value is below 1. Edges in non-build styles have no `edgeGrow`, so they are drawn as before.

**Tests:**
- `src/anim/clock.test.ts` (4 tests): runs, freezes when paused, resumes without skipping ahead, ignores repeated calls.
- `src/render/draw.test.ts`: a new test checks that no dash overlay is drawn for edges with grow 0 or 0.5, and one is drawn at grow 1 or with no grow value.
- `tests/e2e/preview.spec.ts`: a new test, "build animation resumes from the paused frame instead of skipping ahead", pauses build mode for 2 s, presses Play, and checks that under 0.4% of pixels changed. Measured on Chromium and Firefox: under 0.1% with the fix, about 1.1% with the old render loop (it failed 6 of 6 runs without the fix). Skipped on WebKit for the same reason as the existing animation test (section 6).

**Checks run on 2026-11-05 after this part:**
- `npm test`: 422 tests passing across 63 files.
- `npm run lint`: clean.
- `npm run build` with `BASE_PATH=/gati-chitra/`: passes.
- `npm run check:dist`: initial JS 131.33 KB gzip, largest lazy chunk 57.27 KB gzip, `OK`.
- `npm run test:e2e`: 311 passed, 17 skipped (the earlier 16 plus the new test on WebKit), 0 failed.

**Not checked by eye:** the browser pane was hidden during this session, which throttles animation frames, so the build-connector fix is covered by the unit test only.

## 2c. Latest Session, Part 3 (2026-11-05): Plan for More Mermaid Diagram Types

**Status: uncommitted.** `plan.md` (repository root) is new and not committed. No code changed in this part.

**What it is:** an implementation plan for coding agents (Gemini via Antigravity CLI, DeepSeek via Freebuff CLI, or Claude Code) to add twelve Mermaid diagram types: state, class, ER, requirement, use case (`usecase-beta`), architecture (`architecture-beta`), sequence, git graph, block, mindmap, user journey and timeline. It covers parsing, layout, theming, all five animation styles, exports and full visual editing on the canvas. Tasks 64 to 103, in five milestones (D1 foundation, then D2 to D5 with two or three types each).

**Left out, with reasons in Part 1.2 of the plan:** Gantt, pie, quadrant, XY, radar, treemap, packet, Venn, Sankey, Kanban, C4, ZenUML and the newest betas. They are charts with no arrows to animate, need layout code the project does not have, or are still changing.

**Key design points:**
- Each type is a lazy-loaded engine chunk. The initial bundle stays under 150 KB (it was 131 KB).
- Engines output the existing `ParsedDoc` and `SceneLayout`, plus optional fields (compartments, icons, markers, decorations, colour indexes, animation stages), so flowchart behaviour does not change.
- Edits are text patches located by spans that the parsers record. Moves reuse `%% studio:pos` lines.

**Before an agent starts:** Task 64 adds the `plan.md` pointer to `AGENTS.md`. Until then, tell the agent to read `plan.md` directly (the plan's "Running this plan" section has the prompts). Three existing tests use `sequenceDiagram` as their example of invalid input; Task 66 names the exact changes to them.

**Mermaid reference used:** mermaid.js.org at version 12.3.0, read on 2026-11-05. Part 5.5 tells the agent to recheck the beta use case syntax online if it can.

---

## 2d. Milestone D1 Completion (Tasks 64 to 74) - v0.9.0

**Status: complete and committed locally.**

**What changed across Tasks 64 to 74:**
- **Task 64:** Split node drawing (`src/render/draw-nodes.ts`), title placement (`src/layout/title.ts`), and wrap toggle (`src/app/wrap-toggle.ts`).
- **Task 65:** Added core diagram types (`src/core/diagram-types.ts`, `src/core/types.ts`), layout constants (`src/core/constants.ts`), and error messages.
- **Task 66:** Added diagram type detection (`src/diagrams/detect.ts`, `kinds.ts`), dynamic engine registry and lazy loading (`src/diagrams/registry.ts`, `flowchart-engine.ts`), parse dispatch (`src/diagrams/parse-any.ts`), op dispatch (`src/diagrams/apply-op.ts`), app state/scene wiring, and test corpus/e2e updates.
- **Task 67:** Implemented shared parser prelude kit (`src/diagrams/common/prelude.ts`) and shared text edit kit (`src/diagrams/common/edit.ts`).
- **Task 68:** Added node compartments (`src/layout/sections.ts`, `src/render/sections.ts`), icon primitives and rendering (`src/render/icons.ts`), label positioning (`src/render/label-pos.ts`), fixed size nodes, and section/icon rendering in canvas (`src/render/draw-nodes.ts`, `src/render/draw-runs.ts`) and SVG (`src/render/svg-nodes.ts`).
- **Task 69:** Added 10 new shapes (`src/render/shapes-new.ts`, `src/layout/polygon.ts`, `src/layout/measure.ts`, `src/core/types.ts`, `src/core/shapes.ts`, `src/mermaid/format.ts`, `src/render/draw-nodes.ts`, `src/render/svg-nodes.ts`, `src/render/style.ts`, `src/app/describe.ts`).
- **Task 70:** Added new edge markers and end labels (`src/render/markers.ts`, `src/render/edge-extras.ts`, `src/render/style.ts`, `src/render/draw-edges.ts`, `src/render/draw.ts`, `src/render/svg.ts`).
- **Task 71:** Added decorations, colour indexes, and layout helpers (`src/render/decorations.ts`, `src/layout/path.ts`, `src/layout/decor-bounds.ts`, `src/layout/node-box.ts`, `src/render/style.ts`, `src/render/draw.ts`, `src/render/svg.ts`, `src/render/draw-nodes.ts`).
- **Task 72:** Supported custom diagram animation ordering (`src/anim/stages.ts`, `src/anim/build-anim.ts`, `src/anim/anim.ts`, `src/anim/steps.ts`, `src/render/prepared.ts`).
- **Task 73:** Gated editor, toolbar and properties capabilities by diagram kind, highlighted non-flowchart diagram keywords, and added diagram types in Help (`src/app/kind-ui.ts`, `src/editor/controller.ts`, `src/app/dispatcher.ts`, `src/app/state.ts`, `src/app/render-loop.ts`, `src/app/canvas-events.ts`, `src/app/touch-wiring.ts`, `src/app/toolbar.ts`, `src/app/properties.ts`, `src/app/describe.ts`, `src/app/mermaid-lang.ts`, `src/app/help.ts`).
- **Task 74:** Bumped package.json and repo test version to `0.9.0`, updated `RELEASE_CHECKLIST.md` and `plan.md` Part 10 release checklists.

**Checks run for v0.9.0:**
- `npm test`: 507 unit tests passed across 80 files.
- `npm run lint`: 0 warnings, 0 errors across 215 files.
- `BASE_PATH=/gati-chitra/ npm run build`: passes.
- `BASE_PATH=/gati-chitra/ npm run check:dist`:
  - Total initial JS: 136.47 KB gzip (≤ 150 KB budget)
  - Largest lazy chunk: 57.27 KB gzip (≤ 80 KB budget)
  - Result: OK
- `npm run test:e2e`: 311 passed, 17 skipped (0 failed).

**Left open:**
- Part 10 v0.9.0 by-hand browser verification checklist items (to be executed by owner).
- Milestone D2 (Tasks 75 to 81: State, class, and ER diagrams).

---

## 3. Core Invariants and Rules

Every agent working on this repository must follow these rules without exception:

1. **File line limit**:
   - Every non-test TypeScript file in `src/` must remain strictly under 300 lines.
   - Enforced automatically by `src/repo.test.ts`. If a file approaches 300 lines, extract helper functions or submodules by responsibility and record the split in `DECISIONS.md`.
2. **Bundle budgets**:
   - Initial JS gzip size must not exceed 150 KB.
   - Lazy chunk gzip size must not exceed 80 KB.
   - Enforced by `scripts/check-dist.mjs` via `npm run check:dist`. Keep large dependencies (such as `gifenc`, `mediabunny`, language extensions, touch wiring, and export dialogs) lazily imported.
3. **Security policy**:
   - `SECURITY.md` contains the author's custom security policy. Do not overwrite or alter this file.
4. **Git workflow**:
   - Work through tasks one by one with a dedicated commit per task.
   - Use conventional commit messages (`feat: ...`, `fix: ...`, `chore: ...`, `perf: ...`, `ci: ...`).
   - Do not push to remote or open pull requests unless explicitly requested by the user.
   - Commit only when the user asks. If the user says not to commit, leave changes in the working tree and list them in this file (see `AGENTS.md` section 5).
   - Update this file at the end of every session that changes code or docs (see `AGENTS.md` section 1).
5. **Decisions log**:
   - When resolving any architectural choice or design ambiguity, record a single-line entry in `DECISIONS.md` in the format: `Task N: chose X because Y`.
6. **Agent instructions & Skills**:
   - `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` define shared guidelines across coding tools.
   - Use the `superpowers` skills (`test-driven-development`, `systematic-debugging`, `executing-plans`, `verification-before-completion`).
   - The Freebuff agent tool used on 2026-11-04 could load only `find-skills` and `humanizer`. It followed Part 0 of the improvements plan instead, as `AGENTS.md` allows when a skill cannot be installed.
   - Humanize all public prose (`README.md`, documentation pages) using plain, direct phrasing without promotional filler.

---

## 4. Key Architecture and File Map

| Subsystem                  | Key Files                                                                                                         | Description                                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core & Constants** | `src/core/constants.tssrc/core/types.ts``src/core/shapes.ts`                                                  | Numerical limits, token palettes, animation rates, touch timings, and shape metadata.                                                                      |
| **Parser & AST**     | `src/mermaid/parse.tssrc/mermaid/ops.ts``src/mermaid/compat.tssrc/mermaid/positions.ts`                       | Custom parser for Mermaid flowcharts, statement splitters, and AST operation modifiers (add/delete/rename/pin).                                            |
| **Layout**           | `src/layout/layout.tssrc/layout/geometry.ts``src/layout/subgraph-layout.tssrc/layout/polygon.ts`              | Dagre layout wrapper, hit testing, edge routing, pin coordinates, and subgraph bounding boxes.                                                             |
| **Canvas & Render**  | `src/render/draw.tssrc/render/svg.ts``src/render/themes.tssrc/anim/anim.ts``src/app/render-loop.ts`         | Canvas 2D rendering loop, SVG generation, Daylight/Nord/Monokai/Slate themes, and flow particle animation.                                                 |
| **Editor & App UI**  | `src/app/ui.tssrc/app/canvas-events.ts``src/editor/controller.tssrc/app/properties.ts``src/app/splitter.ts` | CodeMirror 6 editor wiring, canvas mouse/keyboard events, properties panel, and resizable layout splitter.                                                 |
| **Mobile & Touch**   | `src/editor/gestures.tssrc/app/touch-wiring.ts``src/app/narrow.tssrc/app/share-file.ts`                       | Gesture recognizer (pan, pinch, tap, double-tap, long-press), narrow viewport tabs (Diagram/Text), bottom properties sheet, and Web Share API integration. |
| **Exports**          | `src/export/png.tssrc/export/svg.ts``src/export/gif.tssrc/export/video.ts`                                    | Raster PNG, vector SVG, animated GIF (`gifenc`), and hardware-accelerated MP4/WebM (`mediabunny` + WebCodecs) with GIF fallback.                       |
| **PWA & Offline**    | `src/sw/sw.tssrc/sw/sw-logic.ts``src/app/sw-register.ts`                                                      | Service worker for offline asset caching and `.mmd` file launch handling.                                                                                |

---

## 5. Verification Commands

Run these commands from the repository root:

```bash
# 1. Run unit test suite (Vitest)
npm test

# 2. Run linter (oxlint)
npm run lint

# 3. Compile TypeScript and build the production bundle with the site base path
BASE_PATH=/gati-chitra/ VITE_SITE_URL=https://u77w41.github.io/gati-chitra/ npm run build

# 4. Verify distribution assets, gzip budgets, and base path on that build
BASE_PATH=/gati-chitra/ VITE_SITE_URL=https://u77w41.github.io/gati-chitra/ npm run check:dist

# 5. Run end-to-end browser tests (Playwright)
npm run test:e2e

# 6. Run a targeted E2E spec (optional during dev)
npm run test:e2e -- tests/e2e/mobile.spec.ts
```

`check:dist` compares asset URLs in `dist/index.html` against `BASE_PATH`. Build with the same `BASE_PATH` first, or the check fails on `/theme-init.js`.

---

## 6. Resolved: WebKit CI Flake (2026-11-04)

The animation canvas-readback test (`tests/e2e/preview.spec.ts`, "animation updates frames when active and freezes when paused") was producing fully transparent canvases on WebKit under Ubuntu CI CPU contention. Two timing fixes (`a75627d`, `b2cd81b`) did not resolve it. The test never failed locally.

**Resolution:** The test is skipped on WebKit (`test.skip(browserName === 'webkit', ...)`). The animation is still verified on Chromium and Firefox in CI, and on all three browsers locally. See `DECISIONS.md` for the rationale.

**Deploy status:** After pushing, the CI pipeline should pass and deploy v0.6.0 to GitHub Pages. Verify with:

```bash
gh run list --workflow deploy.yml --limit 1
curl -s -o /dev/null -w '%{http_code}\n' https://u77w41.github.io/gati-chitra/sitemap.xml
```

---

## 7. Pending Actions for Next Session / Repository Owner

1. **Manual hardware and by-hand checks**:
   All automated checks pass locally, and the CI test job gets through lint, unit tests, build and size checks before it reaches e2e. The open boxes in Part 7 of the improvements plan and in `RELEASE_CHECKLIST.md` remain:
   - Physical Android and iPhone testing (gesture feel, on-screen keyboard, share sheet, rotation).
   - Desktop repeat of the v0.4.0 keyboard and mouse checks.
   - Deployed-site checks: install prompt, offline reload, update notice, social card, 404 page.
   - Pasting five real-world flowcharts, and checking shapes and labels in every theme and export.
   - Optional: JSON-LD Rich Results Test and Search Console sitemap submission.
2. **Tag correction**:
   The `v0.6.0` tag points at `821d484` instead of the release commit `5cb55d7`. Decide whether to move it. Moving a pushed tag rewrites history for anyone who has fetched it, so the owner should decide.
3. **Subsequent work**:
   If starting a new feature set or milestone, follow the superpower workflow: brainstorm scope, write an implementation plan under `docs/superpowers/plans/`, verify with TDD, and keep files under the 300-line budget.
