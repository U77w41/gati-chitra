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

## 2. Current State (v0.6.0)

- **Last verified**: 2026-11-04, locally. CI is red and the Pages deploy is skipped; see section 6.
- **Branch**: `main` (HEAD, pushed to `origin/main`). The local `improvements` branch is an older pointer at `821d484` and does not carry the two commits after it.
- **Release commit**: `5cb55d7` (`chore: release v0.6.0`). The `v0.6.0` tag currently points at `821d484` (the commit that added this handoff), not at the release commit. Fixing the tag needs the owner's decision, because the tag may already exist on the remote.
- **Plans**:
  - `docs/superpowers/plans/2026-11-02-gati-chitra.md` (v0.1, Tasks 0 to 23): all task boxes ticked.
  - `docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md` (v0.2 to v0.6, Tasks 24 to 60): all 196 task step boxes ticked, with no task steps left open. The automated boxes in Part 7 are now ticked too. The remaining open boxes are by-hand, real-device, deployed-site and owner items.
- **Checks run on 2026-11-04**:
  - `npm test`: 389 tests passing across 57 files.
  - `npm run lint`: 0 warnings, 0 errors across 154 files.
  - `npm run build` with `BASE_PATH=/gati-chitra/`: passes, including both TypeScript configs.
  - `npm run check:dist` on that build: initial JS 149.81 KB gzip (limit 150 KB); largest lazy chunk 57.27 KB gzip (limit 80 KB); `OK`.
  - `npm run test:e2e`: 310 passed, 15 skipped across `chromium` (103), `firefox` (103), `webkit` (103), `mobile-chrome` (8) and `mobile-safari` (8). The skipped tests are conditional mobile cases, not failures.
  - Targeted re-run after the `a75627d` test change: `npx playwright test tests/e2e/perf.spec.ts tests/e2e/preview.spec.ts --project=chromium --project=firefox --project=webkit --repeat-each=3` gave 99 passed, and `npm run lint` stayed clean. None of it reproduced the CI failure; see section 6.

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
5. **Decisions log**:
   - When resolving any architectural choice or design ambiguity, record a single-line entry in `DECISIONS.md` in the format: `Task N: chose X because Y`.
6. **Agent instructions & Skills**:
   - `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` define shared guidelines across coding tools.
   - Use the `superpowers` skills (`test-driven-development`, `systematic-debugging`, `executing-plans`, `verification-before-completion`).
   - The Freebuff agent tool used on 2026-11-04 could load only `find-skills` and `humanizer`. It followed Part 0 of the improvements plan instead, as `AGENTS.md` allows when a skill cannot be installed.
   - Humanize all public prose (`README.md`, documentation pages) using plain, direct phrasing without promotional filler.

---

## 4. Key Architecture and File Map

| Subsystem | Key Files | Description |
| --- | --- | --- |
| **Core & Constants** | `src/core/constants.ts`<br>`src/core/types.ts`<br>`src/core/shapes.ts` | Numerical limits, token palettes, animation rates, touch timings, and shape metadata. |
| **Parser & AST** | `src/mermaid/parse.ts`<br>`src/mermaid/ops.ts`<br>`src/mermaid/compat.ts`<br>`src/mermaid/positions.ts` | Custom parser for Mermaid flowcharts, statement splitters, and AST operation modifiers (add/delete/rename/pin). |
| **Layout** | `src/layout/layout.ts`<br>`src/layout/geometry.ts`<br>`src/layout/subgraph-layout.ts`<br>`src/layout/polygon.ts` | Dagre layout wrapper, hit testing, edge routing, pin coordinates, and subgraph bounding boxes. |
| **Canvas & Render** | `src/render/draw.ts`<br>`src/render/svg.ts`<br>`src/render/themes.ts`<br>`src/anim/anim.ts`<br>`src/app/render-loop.ts` | Canvas 2D rendering loop, SVG generation, Daylight/Nord/Monokai/Slate themes, and flow particle animation. |
| **Editor & App UI** | `src/app/ui.ts`<br>`src/app/canvas-events.ts`<br>`src/editor/controller.ts`<br>`src/app/properties.ts`<br>`src/app/splitter.ts` | CodeMirror 6 editor wiring, canvas mouse/keyboard events, properties panel, and resizable layout splitter. |
| **Mobile & Touch** | `src/editor/gestures.ts`<br>`src/app/touch-wiring.ts`<br>`src/app/narrow.ts`<br>`src/app/share-file.ts` | Gesture recognizer (pan, pinch, tap, double-tap, long-press), narrow viewport tabs (Diagram/Text), bottom properties sheet, and Web Share API integration. |
| **Exports** | `src/export/png.ts`<br>`src/export/svg.ts`<br>`src/export/gif.ts`<br>`src/export/video.ts` | Raster PNG, vector SVG, animated GIF (`gifenc`), and hardware-accelerated MP4/WebM (`mediabunny` + WebCodecs) with GIF fallback. |
| **PWA & Offline** | `src/sw/sw.ts`<br>`src/sw/sw-logic.ts`<br>`src/app/sw-register.ts` | Service worker for offline asset caching and `.mmd` file launch handling. |

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

## 6. Open Blocker: GitHub Pages Deploy (2026-11-04)

The published site still runs the v0.2.0 build. `https://u77w41.github.io/gati-chitra/` returns 200, but the latest Pages deployment starts from `df28685` (2026-11-03 15:48 UTC), which is before the v0.3.0 release. `https://u77w41.github.io/gati-chitra/sitemap.xml` returns 404. Pages uses `build_type: workflow`, and `.github/workflows/deploy.yml` runs the `deploy` job only when the `test` job passes on `main`, so any e2e failure blocks the release.

### Failing runs

| Run | Commit | e2e result | Failing test |
| --- | --- | --- | --- |
| `41790756473` | `821d484` | 308 passed, 15 skipped | `webkit` `tests/e2e/perf.spec.ts` idle repaint: 7 draws instead of 6; `webkit` `tests/e2e/preview.spec.ts` preserved picture: 0 non-background pixels |
| `41871883863` | `a75627d` | 309 passed, 15 skipped | `webkit` `tests/e2e/preview.spec.ts` `animation updates frames when active and freezes when paused`: the two snapshots are equal |

`a75627d` replaced the fixed waits in the idle-repaint and preserved-picture tests with polling. The animation test still samples the canvas at fixed times.

### Evidence

The data URL from the `41871883863` failure decodes to a 1596x798 PNG in which every one of the 1,273,608 pixels is `00000000`: a fully transparent canvas. The canvas was still empty 500 ms later. It can only stay blank if the background is never drawn, or if a resize clears it and no frame follows. Both point at the render loop not running (an exception, or no further `requestAnimationFrame`), not at a paint the test read too early.

That reading fits the earlier two failures as well: an extra frame after pause, and a blank preserved picture.

The `a75627d` wait-for-quiescence change did not stop the suite from failing on the next run, so waiting longer is not the fix on its own.

### What was checked locally

- The two specs passed 99 of 99 runs across chromium, firefox and webkit (`--repeat-each=3`).
- Repeated WebKit runs of the two specs (`--repeat-each=5`) passed 55 of 55.
- The full local e2e suite passed 310 tests with 15 conditional skips.

All of that ran without the CI runner's CPU contention and without the five-project parallel load.

### Next steps

1. Record page errors and draw counts. In `tests/e2e/preview.spec.ts`, collect `page.on('pageerror')` and `page.on('console')` before `goto`, and record `window.__studio.getDrawCount()` with each snapshot. A count that stops growing means the loop died, and the page error names the cause.
2. Reproduce under load rather than in isolation: `npx playwright test tests/e2e/preview.spec.ts --project=webkit --workers=4 --repeat-each=10`, or run the full suite with a CPU burner in the background.
3. Fix the cause the error points to. Do not add retries or raise limits to get a green run.
4. If the loop is healthy and only the pixel readback is blank, the problem is in WebKit's canvas readback under load. In that case run the WebKit project with one worker in CI and see whether the failures stop, then record the choice in `DECISIONS.md`.
5. Check the deploy after a green run:

```bash
gh run list --workflow deploy.yml --limit 3
gh run watch <run-id> --exit-status
gh api repos/U77w41/gati-chitra/deployments --jq '.[0:3][] | "\(.sha[0:7]) \(.created_at)"'
curl -s -o /dev/null -w '%{http_code}\n' https://u77w41.github.io/gati-chitra/sitemap.xml
```

## 7. Pending Actions for Next Session / Repository Owner

1. **Unblock the deploy**: follow section 6 before any new feature work. The release stays invisible to users until the e2e job passes on `main`.
2. **Manual hardware and by-hand checks**:
   All automated checks pass locally, and the CI test job gets through lint, unit tests, build and size checks before it reaches e2e. The open boxes in Part 7 of the improvements plan and in `RELEASE_CHECKLIST.md` remain:
   - Physical Android and iPhone testing (gesture feel, on-screen keyboard, share sheet, rotation).
   - Desktop repeat of the v0.4.0 keyboard and mouse checks.
   - Deployed-site checks: install prompt, offline reload, update notice, social card, 404 page.
   - Pasting five real-world flowcharts, and checking shapes and labels in every theme and export.
   - Optional: JSON-LD Rich Results Test and Search Console sitemap submission.
3. **Tag correction**:
   The `v0.6.0` tag points at `821d484` instead of the release commit `5cb55d7`. Decide whether to move it. Moving a pushed tag rewrites history for anyone who has fetched it, so the owner should decide.
4. **Subsequent work**:
   If starting a new feature set or milestone, follow the superpower workflow: brainstorm scope, write an implementation plan under `docs/superpowers/plans/`, verify with TDD, and keep files under the 300-line budget.
