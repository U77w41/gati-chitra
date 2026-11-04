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

- **Branch**: `improvements`
- **Release tag**: `v0.6.0` (commit `5cb55d7`)
- **Completed plans**:
  - `docs/superpowers/plans/2026-11-02-gati-chitra.md` (v0.1, Tasks 0 to 23).
  - `docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md` (v0.2 to v0.6, Tasks 24 to 60).
- **Test suite**:
  - Unit tests: 389 passing across 57 files (`npm test`).
  - Linter: 0 warnings, 0 errors across 154 files (`npm run lint`).
  - Bundle budgets: Initial JS 149.81 KB gzip (limit 150 KB); Largest lazy chunk 57.27 KB gzip (limit 80 KB).
  - End-to-end tests: 310 passing across all 5 Playwright projects: `chromium`, `firefox`, `webkit`, `mobile-chrome`, `mobile-safari` (`npm run test:e2e`).

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

# 3. Compile TypeScript and build production bundle
npm run build

# 4. Verify distribution assets, gzip budgets, and base path
BASE_PATH=/gati-chitra/ VITE_SITE_URL=https://u77w41.github.io/gati-chitra/ npm run check:dist

# 5. Run end-to-end browser tests (Playwright)
npm run test:e2e

# 6. Run targeted E2E spec (optional during dev)
npm run test:e2e -- tests/e2e/mobile.spec.ts
```

---

## 6. Pending Actions for Next Session / Repository Owner

1. **Manual hardware testing**:
   Automated checks for `v0.6.0` pass in all 5 Playwright projects. The manual checks in `RELEASE_CHECKLIST.md` under `## v0.6.0` remain for physical Android and iPhone testing (gesture feel, on-screen keyboard, share sheet).
2. **Branch integration**:
   The `improvements` branch is fully tested and tagged at `v0.6.0`. When ready, merge `improvements` into `main` and push tags:
   ```bash
   git checkout main
   git merge improvements --ff-only
   git push origin main --tags
   ```
3. **Subsequent work**:
   If starting a new feature set or milestone, follow the superpower workflow: brainstorm scope, write an implementation plan under `docs/superpowers/plans/`, verify with TDD, and keep files under the 300-line budget.
