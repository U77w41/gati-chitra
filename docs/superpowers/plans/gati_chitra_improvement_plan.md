# Gati-Chitra Architecture & Implementation Plan: Independent Flow Diagram & Canvas Background Theming, Background Lock, Auto-Excluded Canvas Grids, Mermaid Editor Text Wrapping, and Control Bar Ergonomics

**Target Repository:** [U77w41/gati-chitra](https://github.com/U77w41/gati-chitra)
**Live Deployment:** [https://u77w41.github.io/gati-chitra/](https://u77w41.github.io/gati-chitra/)
**Target Executor:** Autonomous LLM Coding Agent (Antigravity CLI / Agentic IDE)

## 1. Executive Instructions & Operating Rules for the Coding Agent

You are tasked with implementing five cohesive upgrades in the **Gati-Chitra** repository:

1. **Single-Click Modern & Minimal Flow Diagram Theming:** Upgrade the diagram dashboard from a basic two-click dropdown with 4 themes to an instant, **single-click visual theme swatch bar** featuring 12 modern, minimal light and dark palettes (while maintaining full backward compatibility with `<select id="theme">` tests and `localStorage` persistence).
2. **Independent Canvas Background Theming & One-Click Background Lock:** Decouple the **Canvas Background** from the **Flow Diagram Theme** so users can either:
   * Pick a dedicated **Canvas Background** independently of the node/edge/particle diagram theme (e.g., placing dark obsidian nodes with glowing cyan particles onto a warm paper or pure white canvas, or placing crisp white nodes onto a carbon-black canvas).
   * Click a **Lock Background** toggle (`#bg-lock`) so that clicking through different flow diagram themes changes **only** the diagram (nodes, subgraphs, edges, and animated flow particles) while keeping the current canvas background locked in place.
3. **Diagram Dashboard Canvas Grid (Auto-Removed on Export):** Add a single-click canvas grid toggle (`#canvas-grid`) in the diagram dashboard (`#canvas-controls`) that renders a zoom- and pan-aware alignment grid whose color automatically adapts to the active **Canvas Background**, and **automatically excludes** the grid whenever the user exports to PNG, SVG, Animated GIF, WebM, or MP4.
4. **Mermaid Script Writing Section Text Wrapping (Word Wrap) Toggle:** Add a single-click **Wrap Text** toggle (`#editor-wrap`) inside the Mermaid script writing panel (`#text-panel`) that dynamically reconfigures the CodeMirror 6 editor (`src/app/code-editor.ts`) using a `Compartment` with `EditorView.lineWrapping`, persisting the user's preference in `localStorage`.
5. **De-Cluttering & Ergonomic Redesign of All Cramped Buttons and Controls (`#toolbar`, `#canvas-controls`, `#props`, and `#text-panel`):** Transform the currently squashed, flat `gap: 4px / 8px` button strips into a spacious, visually grouped, modern studio layout with segmented button clusters, structured multi-row canvas control decks, pill-styled checkboxes, aligned range sliders, and a clean node/edge properties inspector—while strictly preserving every DOM ID, role, header height (`>= 72px`), and mobile no-overflow invariant enforced by Vitest and Playwright E2E tests.

### Mandatory Guardrails for Agent Execution

* **Zero External Runtime Dependencies:** Gati-Chitra is a pure Vanilla TypeScript + Vite SPA (`package.json` uses `@codemirror/*`, `@dagrejs/dagre`, `gifenc`, `mediabunny`, and `@fontsource/lato`). Do **not** install React, Tailwind, Lucide, or any npm packages.
* **Strict Layer Separation (`AGENTS.md`):** Pure rendering logic belongs strictly in `src/render/` and must never read from `document`, `window`, or `localStorage`. DOM wiring belongs in `src/app/`. Export framing belongs in `src/export/`.
* **TypeScript Strictness:** `tsconfig.json` enforces strict mode, `noImplicitAny`, strict null checks, and explicit return types on exported functions.
* **Think Before Editing:** Before modifying any file, you **must** execute the `<THINKING_CHECKPOINT>` listed in each phase using your thinking/reasoning tool and read the target file from disk first. Never guess line numbers or variable names without reading the current file content.
* **Verify After Every Phase:** Run `npm run test`, `npm run lint`, and `npm run build` after each phase. Never batch all changes blindly without intermediate test runs.

## 2. Repository Architecture & File Map

Before planning your edits, orient yourself using this exact map of the files involved in diagram theming, background theming/locking, dashboard controls, canvas rendering, exporting, the CodeMirror 6 Mermaid script editor, and UI layout styling.

| Subsystem | File Path | Existing Responsibility | Planned Modification |
| :--- | :--- | :--- | :--- |
| **Core Types** | `src/core/types.ts` | Defines `ThemeId`, `ThemeChoice`, `Theme`, `ViewState`, `AnimSettings`, and `DrawOptions` | Expand `ThemeId` with 8 new modern minimal theme IDs; add `BackgroundChoice` (`'match' \| ThemeChoice`); add `gridColor` and `titleText` to `Theme`; add optional `showGrid?: boolean` to `DrawOptions` |
| **Theme & Background Palettes** | `src/render/themes.ts` | Exports `THEME_IDS`, `THEME_CHOICES`, `THEMES`, and `resolveTheme` | Register 12 flow diagram themes in `THEMES`, export `BACKGROUND_CHOICES`, and export `composeTheme(diagramChoice, bgChoice, pageDark)` so any diagram theme + any locked/custom background merges into a single `Theme` object |
| **Settings Storage** | `src/app/storage.ts` | Defines `Settings` interface (`theme`, `anim`, `split`), `loadSettings`, and `saveSettings` | Add optional `bgTheme?: BackgroundChoice`, `bgLocked?: boolean`, `grid?: boolean`, and `wordWrap?: boolean` to `Settings` with safe defaults in `loadSettings` |
| **Mermaid Code Editor** | `src/app/code-editor.ts` | Exports `CodeEditorEnv`, `CodeEditor`, and `createCodeEditor(parent, env)` using CodeMirror 6 (`@codemirror/view` & `@codemirror/state`) | Add `wordWrap?: boolean` to `CodeEditorEnv` and `setWordWrap(wrap: boolean): void` to `CodeEditor` using a CodeMirror `Compartment` and `EditorView.lineWrapping` |
| **Dashboard & Editor HTML** | `index.html` | Defines `#toolbar`, `#text-panel` (`#source`, `#diagnostics-summary`, `#diagnostics`), `#canvas-controls`, and `#props` | Add `#text-panel-bar` with `#editor-wrap` inside `#text-panel`; structure `#canvas-controls` into two ergonomic tiers (`.controls-row-playback` and `.controls-row-theming`) housing `#canvas-grid`, `#theme-strip`, `#bg-lock`, `#bg-strip`, and `#bg-theme` while keeping all existing IDs intact |
| **Dashboard & Control Styling** | `src/app/style.css` & `src/app/tokens.css` | Styles `#toolbar`, `#text-panel`, `#canvas-panel`, `#canvas`, `#canvas-controls`, and `#props` | De-clutter and redesign `#toolbar` groups, `#canvas-controls` tiers, `#props` inspector sections, range sliders, color inputs, and pill toggles so controls have generous breathing room and clear visual hierarchy |
| **Controls & App Wiring** | `src/app/anim-controls.ts` & `src/app/ui.ts` | Initializes `createCodeEditor` in `ui.ts` and binds `#anim-*` / `#theme` in `anim-controls.ts` | Wire `#editor-wrap` checkbox to `editor.setWordWrap(...)` + `saveSettings` in `ui.ts`; wire single-click diagram theme chips, `#bg-theme` / `.bg-chip`, `#bg-lock`, and `#canvas-grid` in `anim-controls.ts` |
| **Canvas Renderer** | `src/render/draw.ts` | Exports `drawBackground` and `drawScene` | Add a pure `drawGrid` function that renders pan/zoom-transformed minimal hairlines using `theme.gridColor`; update title color in `drawScene` to use `theme.titleText ?? theme.nodeText` |
| **Live Render Loop & Export Callers** | `src/app/render-loop.ts` & `src/app/ui.ts` | Resolves current `Theme` and calls `drawBackground` / `drawScene` / export dialogs | Use `composeTheme(state.settings.theme, state.settings.bgTheme ?? 'match', scheme)` in both the live render loop and when passing `theme` into the export pipeline (`exportPng`, `exportSvg`, `exportGif`, `exportVideo`) |
| **Export Pipeline** | `src/export/draw-frame.ts`, `src/export/png.ts`, `src/export/gif.ts`, `src/export/video.ts`, `src/render/svg.ts` | Renders offscreen frames for PNG, GIF, WebM/MP4, and generates SVG XML | Ensure `drawExportFrame` and `svg.ts` **never** call `drawGrid` and always enforce `showGrid: false`, while automatically respecting the user's composed diagram + background theme |
| **Test Suite** | `src/app/storage.test.ts`, `src/app/scheme.test.ts`, `src/app/narrow.test.ts`, `src/export/draw-frame.test.ts`, `tests/e2e/*.spec.ts` | Unit tests and Playwright E2E tests | Add unit tests for all 12 themes, `composeTheme` separation, background locking, `wordWrap` & `grid` storage persistence, `editor.setWordWrap`, export grid removal, and verify E2E layout assertions pass |

## 3. Pre-Implementation Discovery Protocol (Mandatory First Step)

> **[THINKING_CHECKPOINT_0: Codebase Verification]**
> Before modifying a single line of code, use your file-reading tool to inspect the exact current versions of:
> 1. `src/core/types.ts`
> 2. `src/render/themes.ts`
> 3. `src/app/storage.ts`
> 4. `src/app/code-editor.ts`
> 5. `src/app/anim-controls.ts`
> 6. `src/app/ui.ts` and `src/app/narrow.ts`
> 7. `src/render/draw.ts`
> 8. `src/app/render-loop.ts`
> 9. `src/export/draw-frame.ts` and `src/app/export-dialog.ts`
> 10. `src/render/svg.ts`
> 11. `index.html`, `src/app/style.css`, `src/app/chrome.css`, and `src/app/tokens.css`
>
> **In your thinking tool, explicitly write down:**
> * What is the exact signature and return type of `resolveTheme` in `src/render/themes.ts`?
> * Where in `src/app/ui.ts` or `src/app/export-dialog.ts` is `resolveTheme` called when the user triggers an export (PNG, SVG, GIF, Video)?
> * How does `src/app/narrow.ts` inspect `#toolbar` and its `[role="group"]` children to move overflowing buttons into `#more-menu`? (Understanding this guarantees your `#toolbar` CSS/HTML polish will never break `narrow.test.ts`!)
> * Run `npm test` once before editing anything to confirm the baseline test suite passes.

## 4. Feature Specification A: Decoupled Flow Diagram Themes & Canvas Background Themes (with Background Lock)

### 4.1 Why `composeTheme` is the Key Architectural Secret for Smaller Models

In Gati-Chitra, every rendering and export function (`drawBackground`, `drawScene`, `drawExportFrame`, `exportPng`, `exportSvg`, `exportGif`, `exportVideo`) accepts a **single** `theme: Theme` parameter.

* **What NOT to do:** Do **not** change `drawScene`, `drawExportFrame`, `exportPng`, `exportSvg`, `exportGif`, or `exportVideo` to take two separate theme arguments (`diagramTheme`, `bgTheme`). Doing so would break dozens of existing function signatures and unit tests across the codebase.
* **What TO do (`composeTheme` Pattern):** Keep `Theme` as the single unified runtime object passed to renderers, and create a pure function `composeTheme(diagramChoice: ThemeChoice, bgChoice: BackgroundChoice, scheme: 'light' | 'dark'): Theme` in `src/render/themes.ts`!
  * When `bgChoice === 'match'` (default when unlocked), `composeTheme` simply returns the full `Theme` resolved from `diagramChoice`.
  * When `bgChoice` is set to a specific background ID (either because the user clicked the **Lock Background** button or selected a standalone background swatch), `composeTheme` takes:
    * **From the Flow Diagram Theme (`diagramChoice`):** `nodeFill`, `nodeStroke`, `nodeText`, `edge`, `groupFill`, `groupStroke`, `groupTitle`, `particle`, `glow`, `selection`, `glowDefault`
    * **From the Canvas Background Theme (`bgChoice`):** `background`, `backgroundGradient`, `gridColor`, `edgeLabelBg`, `edgeLabelText`, and `titleText`

### 4.2 Why `edgeLabelBg`, `edgeLabelText`, and `titleText` Must Follow the Canvas Background

Think about what happens visually when a user separates the background from the flow diagram:
* Suppose the user picks a **Dark Flow Diagram Theme** (e.g., `obsidian` where nodes are dark `#141622` with white text `#f3f4f6`) but locks a **Light Canvas Background** (e.g., `paper` `#faf8f5` or `daylight` `#ffffff`).
* Inside nodes, `nodeText` (`#f3f4f6`) sits on `nodeFill` (`#141622`), so node text is 100% readable.
* However, the **diagram title** (`scene.layout.title`) and **edge labels** sit directly on top of the **Canvas Background**!
* Therefore, in `composeTheme(diagramChoice, bgChoice, scheme)`:
  * `edgeLabelBg` must come from the **Background Theme** (`bgTheme.edgeLabelBg`, which matches `bgTheme.background`) and `edgeLabelText` must come from the **Background Theme** (`bgTheme.edgeLabelText`, dark ink on light backgrounds, crisp light text on dark backgrounds).
  * Add `titleText: string` to `Theme` (coming from `bgTheme.edgeLabelText`), and in `src/render/draw.ts` (under `// 1. Title`) and `src/render/svg.ts`, use `theme.titleText || theme.nodeText` for the diagram title fill!
  * This guarantees that **any** of the 12 flow diagram themes combined with **any** of the 12 canvas backgrounds has 100% legible titles, edge labels, nodes, groups, and animated particles!

### 4.3 Curated 12-Theme Palette Table (Used for Both Flow Diagram Themes & Background Presets)

Preserve the 4 existing `ThemeId` values (`daylight`, `midnight`, `lagoon`, `ember`) so zero existing tests break, and add 8 modern, minimal themes (`geist`, `paper`, `matcha`, `lavender`, `obsidian`, `graphite`, `nordic`, `rosepine`).

Every entry in `THEMES` (`src/render/themes.ts`) uses these exact tokens:

| Theme ID (`ThemeId`) | Display Name (`name`) | Mode | `background` | `backgroundGradient` | `nodeFill` | `nodeStroke` | `nodeText` | `edge` | `edgeLabelBg` | `edgeLabelText` / `titleText` | `groupFill` | `groupStroke` | `groupTitle` | `particle` / `glow` / `selection` | `glowDefault` | `gridColor` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `daylight` *(existing)* | `Daylight` | Light | `#ffffff` | `null` | `#f7f7fb` | `#34495e` | `#111418` | `#4f5660` | `#ffffff` | `#111418` | `#f5f5fa` | `#cfd1dc` | `#34495e` | `#3b82f6` | `false` | `rgba(15, 23, 42, 0.08)` |
| `geist` *(new)* | `Mono Light` | Light | `#fafafa` | `null` | `#ffffff` | `#18181b` | `#09090b` | `#71717a` | `#fafafa` | `#09090b` | `#f4f4f5` | `#d4d4d8` | `#27272a` | `#2563eb` | `false` | `rgba(24, 24, 27, 0.08)` |
| `paper` *(new)* | `Warm Paper` | Light | `#faf8f5` | `null` | `#f3efea` | `#44403c` | `#1c1917` | `#78716c` | `#faf8f5` | `#1c1917` | `#f5f2ed` | `#d6d3d1` | `#57534e` | `#d97706` | `false` | `rgba(68, 64, 60, 0.08)` |
| `matcha` *(new)* | `Sage Minimal` | Light | `#f4f7f4` | `null` | `#ffffff` | `#2d4a3e` | `#16261f` | `#5c7c6d` | `#f4f7f4` | `#16261f` | `#ebf1ec` | `#c5d6c8` | `#2d4a3e` | `#10b981` | `false` | `rgba(45, 74, 62, 0.08)` |
| `lavender` *(new)* | `Soft Mist` | Light | `#f8f7ff` | `null` | `#ffffff` | `#4338ca` | `#1e1b4b` | `#6366f1` | `#f8f7ff` | `#1e1b4b` | `#f0eeff` | `#c7d2fe` | `#3730a3` | `#7c3aed` | `false` | `rgba(67, 56, 202, 0.08)` |
| `midnight` *(existing)* | `Midnight` | Dark | `#0f172a` | `null` | `#1e293b` | `#475569` | `#f8fafc` | `#64748b` | `#0f172a` | `#f8fafc` | `#1e293b` | `#334155` | `#94a3b8` | `#38bdf8` | `true` | `rgba(248, 250, 252, 0.07)` |
| `obsidian` *(new)* | `Linear Dark` | Dark | `#090a0f` | `['#090a0f', '#10121a']` | `#141622` | `#26293d` | `#f3f4f6` | `#4b5278` | `#090a0f` | `#f3f4f6` | `#0e1018` | `#1f2233` | `#9ca3af` | `#818cf8` | `true` | `rgba(129, 140, 248, 0.08)` |
| `graphite` *(new)* | `Graphite Mono` | Dark | `#121212` | `null` | `#1e1e1e` | `#383838` | `#e5e5e5` | `#666666` | `#121212` | `#e5e5e5` | `#171717` | `#2e2e2e` | `#a3a3a3` | `#a3e635` | `false` | `rgba(255, 255, 255, 0.07)` |
| `nordic` *(new)* | `Nordic Frost` | Dark | `#242933` | `['#242933', '#2e3440']` | `#3b4252` | `#4c566a` | `#eceff4` | `#616e88` | `#242933` | `#eceff4` | `#292e39` | `#434c5e` | `#d8dee9` | `#88c0d0` | `false` | `rgba(216, 222, 233, 0.07)` |
| `rosepine` *(new)* | `Rosé Velvet` | Dark | `#191724` | `['#191724', '#1f1d2e']` | `#26233a` | `#403d52` | `#e0def4` | `#6e6a86` | `#191724` | `#e0def4` | `#1f1d2e` | `#393552` | `#908caa` | `#f6c177` | `true` | `rgba(224, 222, 244, 0.07)` |
| `lagoon` *(existing)* | `Lagoon` | Dark | `#041e2b` | `['#041e2b', '#0a2e3f']` | `#0b3548` | `#14536b` | `#e0f2fe` | `#0ea5e9` | `#041e2b` | `#e0f2fe` | `#082a3a` | `#0f4459` | `#38bdf8` | `#22d3ee` | `true` | `rgba(56, 189, 248, 0.09)` |
| `ember` *(existing)* | `Ember` | Dark | `#180c0e` | `['#180c0e', '#2a1215']` | `#2d1519` | `#4a2026` | `#fef2f2` | `#f43f5e` | `#180c0e` | `#fef2f2` | `#241013` | `#3d181d` | `#fb7185` | `#fb923c` | `true` | `rgba(251, 113, 133, 0.08)` |

### 4.4 How Background Lock & Separate Background Selection Work Together

Define `BackgroundChoice` in `src/core/types.ts` as:
* `export type BackgroundChoice = 'match' | 'auto' | ThemeId;`
  * `'match'` *(Default when Background is unlocked)*: The canvas background automatically uses the background of whatever **Flow Diagram Theme** is currently selected.
  * `'auto'`: The canvas background always follows the page's system/UI light or dark scheme (`daylight` background in light mode, `midnight` background in dark mode), regardless of which flow diagram theme is chosen.
  * Any `ThemeId` (`'daylight'`, `'geist'`, `'paper'`, `'matcha'`, `'lavender'`, `'midnight'`, `'obsidian'`, `'graphite'`, `'nordic'`, `'rosepine'`, `'lagoon'`, `'ember'`): The canvas background is explicitly pinned to that palette's background surface (`background`, `backgroundGradient`, `gridColor`, `edgeLabelBg`, `edgeLabelText`, `titleText`), while the diagram nodes, edges, subgraphs, and animated particles use the selected `state.settings.theme`!

#### Exact State Machine for the "Lock Background" Button (`#bg-lock`) & Background Swatches (`#bg-strip` / `#bg-theme`)

| User Action in Dashboard | State Transition in `state.settings` | Visual Result on Canvas |
| :--- | :--- | :--- |
| **1. Initial Default State** | `theme: 'auto'`, `bgTheme: 'match'`, `bgLocked: false` | Clicking a Diagram Theme chip changes **both** the flow diagram and the canvas background together. |
| **2. User Clicks `Lock BG` Button (`#bg-lock`) to Lock** | `bgLocked` becomes `true`. If `bgTheme === 'match'`, resolve the currently visible background's `ThemeId` (via `resolveTheme(state.settings.theme, currentScheme)`) and set `state.settings.bgTheme = currentResolvedThemeId`. | The current background is now **locked**! When the user clicks any Flow Diagram Theme chip in `#theme-strip`, **only** the nodes, edges, groups, and particles change; the canvas background stays locked. |
| **3. User Clicks Any Background Swatch in `#bg-strip` (or chooses a background in `#bg-theme`)** | Sets `state.settings.bgTheme = chosenBgId` and automatically sets `state.settings.bgLocked = (chosenBgId !== 'match')`. | Immediately applies the chosen canvas background while leaving the flow diagram theme (`state.settings.theme`) untouched! Because picking a specific background implies wanting that background to stay put, `bgLocked` automatically activates so subsequent clicks on Diagram Theme chips don't overwrite the chosen background. |
| **4. User Clicks `Lock BG` Button (`#bg-lock`) to Unlock (or clicks `Match Diagram` in `#bg-strip`)** | Sets `state.settings.bgLocked = false` and `state.settings.bgTheme = 'match'`. | The canvas background unlocks and snaps back to matching the active Flow Diagram Theme. |

> **[THINKING_CHECKPOINT_1: Verifying the Separation Logic]**
> Trace this scenario in your thinking tool to confirm your understanding:
> * Scenario: The user selects the `paper` ("Warm Paper") theme. Currently `bgLocked` is `false` and `bgTheme` is `'match'`, so both the canvas background and diagram are `paper`.
> * Next, the user clicks the **Lock BG** button (`#bg-lock`). What happens?
>   * `state.settings.bgLocked` becomes `true`, and `state.settings.bgTheme` is pinned to `'paper'`.
> * Next, the user single-clicks the `obsidian` ("Linear Dark") chip in the **Diagram Theme** bar (`#theme-strip`). What happens?
>   * `state.settings.theme` becomes `'obsidian'`.
>   * Because `state.settings.bgTheme` is `'paper'`, `composeTheme('obsidian', 'paper', scheme)` returns a `Theme` with `paper`'s warm `#faf8f5` background, warm grid color, and readable dark title/edge-label text, combined with `obsidian`'s sleek carbon nodes (`#141622`), white node text (`#f3f4f6`), and glowing electric indigo animated flow particles (`#818cf8`)!
> * Next, the user clicks a different background swatch in the **Background** bar (`#bg-strip`), such as `midnight` or `geist`. What happens?
>   * `state.settings.bgTheme` updates to that background in one click, while `state.settings.theme` remains `'obsidian'`!

## 5. Feature Specification B: Diagram Dashboard Grid & Automatic Removal on Export

### 5.1 Grid & Editor Wrap State Persistence Contract (`src/app/storage.ts`)

1. **Settings Interface (`src/app/storage.ts`):**
   Extend `Settings` with optional properties so existing unit test fixtures don't break on missing fields:
   * `bgTheme?: BackgroundChoice;` (defaults to `'match'` in `loadSettings`)
   * `bgLocked?: boolean;` (defaults to `false` in `loadSettings`)
   * `grid?: boolean;` (defaults to `false` in `loadSettings`)
   * `wordWrap?: boolean;` (defaults to `false` in `loadSettings`)
2. **Validation in `loadSettings`:**
   * Validate `bgTheme` against `BACKGROUND_CHOICES` (`['match', 'auto', ...THEME_IDS]`); fallback to `'match'` if invalid or absent.
   * Validate `bgLocked` with `typeof parsed?.bgLocked === 'boolean' ? parsed.bgLocked : (bgTheme !== 'match')`.
   * Validate `grid` with `typeof parsed?.grid === 'boolean' ? parsed.grid : false`.
   * Validate `wordWrap` with `typeof parsed?.wordWrap === 'boolean' ? parsed.wordWrap : false`.

### 5.2 Pan & Zoom Infinite Canvas Grid Rendering (`src/render/draw.ts`)

Create and export a pure function `drawGrid` in `src/render/draw.ts`:

* **Function Signature:**
  `export function drawGrid(ctx: Ctx2D, theme: Theme, view: ViewState, viewportWidth: number, viewportHeight: number): void`
* **Step-by-Step Mathematical Algorithm:**
  1. **Base World Grid Spacing:** Start with `let step = 24`.
  2. **Adaptive Level-of-Detail (LOD) Scaling:**
     * Compute `let scaledStep = step * view.zoom`.
     * If the user zooms far out (`while (scaledStep < 12)`), double the step (`step *= 2; scaledStep = step * view.zoom;`) so the canvas never draws thousands of dense lines.
     * If the user zooms far in (`while (scaledStep > 96)`), halve the step (`step /= 2; scaledStep = step * view.zoom;`) so the grid subdivides cleanly.
  3. **Screen-Space Modulo Offset:**
     * `const offsetX = ((view.panX % scaledStep) + scaledStep) % scaledStep;`
     * `const offsetY = ((view.panY % scaledStep) + scaledStep) % scaledStep;`
  4. **Single-Pass Batched Stroke Rendering:**
     * Call `ctx.save()`.
     * Set `ctx.strokeStyle = theme.gridColor` (which comes from the **Canvas Background Theme** via `composeTheme`, so the grid always has the exact right subtle contrast against the active background!).
     * Set `ctx.lineWidth = 1`.
     * Call `ctx.beginPath()`.
     * Loop `for (let x = offsetX; x <= viewportWidth; x += scaledStep)` -> `ctx.moveTo(x, 0); ctx.lineTo(x, viewportHeight);`.
     * Loop `for (let y = offsetY; y <= viewportHeight; y += scaledStep)` -> `ctx.moveTo(0, y); ctx.lineTo(viewportWidth, y);`.
     * Call `ctx.stroke()` once and `ctx.restore()`.

### 5.3 Automatic Grid Removal During Export (All 5 Export Paths)

The user explicitly requires: **"in the diagram dashboard, add an option to apply grids (while exporting the grids should be removed automatically)."**

Enforce this across all rendering paths as follows:

| Rendering Path | File Path | Uses `composeTheme` (Separated BG + Diagram)? | Renders Grid? | Exact Enforcement Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **1. Live Dashboard Canvas** | `src/app/render-loop.ts` | **YES** | **YES** (when `state.settings.grid === true`) | `render-loop.ts` calls `composeTheme(state.settings.theme, state.settings.bgTheme ?? 'match', scheme)` and passes `showGrid: Boolean(state.settings.grid)` in `DrawOptions` to `drawScene`. |
| **2. PNG Export** | `src/export/png.ts` & `src/export/draw-frame.ts` | **YES** | **NO (Never)** | Passes `showGrid: false` in `DrawOptions`. Grid is automatically excluded. |
| **3. Animated GIF Export** | `src/export/gif.ts` & `src/export/draw-frame.ts` | **YES** | **NO (Never)** | Calls `drawExportFrame`, which hardcodes `showGrid: false`. Grid is automatically excluded. |
| **4. Video Export (WebM/MP4)** | `src/export/video.ts` & `src/export/draw-frame.ts` | **YES** | **NO (Never)** | Calls `drawExportFrame`, which hardcodes `showGrid: false`. Grid is automatically excluded. |
| **5. Static & Animated SVG Export** | `src/render/svg.ts` | **YES** | **NO (Never)** | `svg.ts` uses the composed `theme` (so separated background + diagram colors export accurately) and never emits grid SVG elements. |

## 6. Feature Specification C: Mermaid Script Writing Section Text Wrapping (Word Wrap) Toggle

### 6.1 How CodeMirror 6 Handles Dynamic Line Wrapping (`src/app/code-editor.ts`)

`src/app/code-editor.ts` already uses `@codemirror/state` (`Compartment`, `EditorState`, `Prec`) and `@codemirror/view` (`EditorView`, `lineNumbers`, `drawSelection`, `highlightActiveLine`, `keymap`).

To support live toggling of text wrapping without recreating the editor or losing undo history/cursor position:

1. **Extend `CodeEditorEnv` (`src/app/code-editor.ts`):**
   * Add optional `wordWrap?: boolean;` to `export interface CodeEditorEnv`.
2. **Extend `CodeEditor` (`src/app/code-editor.ts`):**
   * Add `setWordWrap(wrap: boolean): void;` to `export interface CodeEditor`.
3. **Configure the Wrapping `Compartment` inside `createCodeEditor` (`src/app/code-editor.ts`):**
   * Instantiate a dedicated compartment alongside `lintConf` and `langConf`:
     `const wrapConf = new Compartment();`
   * Inside the `extensions` array passed to `EditorState.create(...)`, include:
     `wrapConf.of(env.wordWrap ? EditorView.lineWrapping : [])`
   * On the returned `CodeEditor` object, implement `setWordWrap(wrap: boolean): void` by dispatching a compartment reconfiguration effect on `view`:
     `view.dispatch({ effects: wrapConf.reconfigure(wrap ? EditorView.lineWrapping : []) });`

### 6.2 Mermaid Script Section Toggle UI & Wiring (`index.html`, `src/app/ui.ts`, `src/app/style.css`)

1. **DOM Structure in `index.html` inside `#text-panel`:**
   * Insert a compact header bar `<div id="text-panel-bar" class="text-panel-bar">` right above `<div id="source"></div>` inside `#text-panel`:
     * Left side: `<span class="text-panel-title">Mermaid Script</span>`
     * Right side: `<label class="control-pill-toggle" title="Toggle line wrapping in the Mermaid editor"><input id="editor-wrap" type="checkbox" /> <span>Wrap text</span></label>`
2. **Wiring in `src/app/ui.ts`:**
   * Pass `wordWrap: Boolean(state.settings.wordWrap)` into `createCodeEditor(sourceParent, { ... })`.
   * Query `const editorWrapEl = document.querySelector<HTMLInputElement>('#editor-wrap');`.
   * If `editorWrapEl` is present, initialize `editorWrapEl.checked = Boolean(state.settings.wordWrap);` and on `'change'`, set `state.settings.wordWrap = editorWrapEl.checked`, call `editor.setWordWrap(state.settings.wordWrap)`, and call `saveSettings(store, state.settings)`.

## 7. Feature Specification D: De-Cluttering & Ergonomic Redesign of All Cramped Buttons and Controls

### 7.1 Root-Cause Diagnosis of the Live UI (`https://u77w41.github.io/gati-chitra/`)

Currently, across the live application, buttons and controls look squashed and visually fatiguing for four specific CSS/DOM reasons:

1. **Top Toolbar (`#toolbar`):** All three `<div role="group">` clusters (*File*, *Edit*, *View*) sit in a bare `gap: 8px` flex row with only `gap: 4px` between buttons, zero surface elevation, zero visual dividers between groups, and tight `6px 10px` padding. Every button looks identical and runs into its neighbors.
2. **Canvas Controls (`#canvas-controls`):** Mixes dropdown selects (`#anim-style`, `#theme`), range sliders (`#anim-speed`, `#anim-density`), dynamic value readouts (`#anim-speed-value`, `#anim-density-value`), checkboxes (`#anim-glow`), and action buttons (`#anim-pause`) into a single flat `display: flex; flex-wrap: wrap; gap: 8px;` row with no grouping cards, no vertical alignment polish, and no visual separation between **Animation Controls** and **Theme/Background Controls**.
3. **Node/Edge Properties Panel (`#props`):** Packs 10+ form elements (`#props-close`, `#prop-label`, `#prop-shape`, `#prop-fill`, `#prop-stroke`, `#prop-text-color`, `#prop-clear-colours`, `#prop-connect`, `#prop-connect-go`, `#prop-delete`) into a raw `gap: 8px` flex wrap list without section dividers or aligned color swatch pills.
4. **Text Panel (`#text-panel`) & Canvas Panel (`#canvas-panel`):** Tight `gap: 8px; padding: 12px;` leaves almost no breathing room between the canvas viewport and the control strip below it.

### 7.2 Mandatory Test Compatibility Guardrails for Layout & CSS Changes

Before changing any HTML wrapper or CSS rule, you **must** honor these exact test invariants from `src/app/chrome.test.ts`, `src/app/narrow.test.ts`, `tests/e2e/chrome.spec.ts`, and `tests/e2e/mobile.spec.ts`:

* **Invariant 1 — Preserve Every Existing Element ID and `role="group"` Hierarchy in `#toolbar`:**
  * `src/app/narrow.ts` measures direct children of `#toolbar` (`#toolbar > [role="group"]`, `.toolbar-spacer`, `#btn-more`, `#more-menu`, `#btn-export`). Do **not** wrap `#toolbar > [role="group"]` inside extra intermediate `<div>` tags! Style `#toolbar` and `#toolbar > [role="group"]` directly via CSS.
* **Invariant 2 — Preserve `.site-header` Height (`>= 72px`):**
  * `tests/e2e/chrome.spec.ts` asserts `expect(box!.height).toBeGreaterThanOrEqual(72)` on `.site-header`. Do not reduce `.site-header` min-height or vertical padding.
* **Invariant 3 — Zero Horizontal Page Overflow on Mobile (`scrollWidth <= innerWidth`):**
  * `tests/e2e/mobile.spec.ts` asserts `document.scrollingElement.scrollWidth <= innerWidth` on mobile screens. Any multi-item control bar (`#toolbar`, `#canvas-controls`, `#theme-strip`, `#bg-strip`, `#props`) must use `flex-wrap: wrap`, `max-width: 100%`, and `min-width: 0` so no child ever forces horizontal page scrolling.

### 7.3 Exact UI Ergonomics & Styling Blueprint (`index.html` & `src/app/style.css`)

Apply the following exact structural and CSS upgrades across the 4 control zones:

| UI Control Zone | Structural & Visual Upgrade Specification (`index.html` & `src/app/style.css`) |
| :--- | :--- |
| **1. Top Action Toolbar (`#toolbar`)** | - **Container Surface:** Give `#toolbar` a clean card surface: `background: var(--card-background); border: 1px solid var(--border); border-radius: var(--radius-card); padding: 8px 12px; gap: 10px; box-shadow: var(--shadow-l1);`<br>- **Segmented Button Clusters (`#toolbar > [role="group"]`):** Style each group (*File*, *Edit*, *View*) as a cohesive pill cluster: `display: inline-flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 4px 6px; background: color-mix(in srgb, var(--border) 28%, transparent); border-radius: var(--radius-control);`<br>- **Button Ergonomics:** Give toolbar buttons and `#add-shape` select consistent height and breathing room: `min-height: 34px; padding: 6px 12px; font-weight: 500; line-height: 1.2;`<br>- **Primary Export CTA (`#btn-export`):** Give `#btn-export` `padding: 6px 16px; min-height: 34px; font-weight: 600;` so the primary action stands out clearly on the far right. |
| **2. Two-Tier Canvas Dashboard Deck (`#canvas-controls`)** | Organize `#canvas-controls` (`display: flex; flex-direction: column; align-items: stretch; gap: 10px; padding-top: 8px; border-top: 1px solid var(--border);`) into **two clean horizontal tiers** inside `#canvas-controls`:<br>- **Tier 1 — `.canvas-controls-tier.playback-tier`:** Contains 3 visually distinct clusters (`display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 16px;`):<br>  1. **Transport & Mode Cluster (`.control-cluster`):** `#anim-pause` button (`min-width: 88px; font-weight: 600;`) + `Animation` label & `#anim-style` select.<br>  2. **Sliders Cluster (`.control-cluster.sliders-cluster`):** Pairs `Speed` (`#anim-speed` + `#anim-speed-value`) and `Density` (`#anim-density` + `#anim-density-value`) inside clean sub-pills (`display: inline-flex; align-items: center; gap: 8px; padding: 4px 10px; background: color-mix(in srgb, var(--border) 22%, transparent); border-radius: var(--radius-control);`). Give `#anim-speed-value` and `#anim-density-value` `display: inline-block; min-width: 3.2ch; text-align: right; font-variant-numeric: tabular-nums; font-weight: 600;` so dragging sliders never causes horizontal layout jitter!<br>  3. **Canvas Toggles Cluster (`.control-cluster`):** Houses the **Glow** (`#anim-glow`) and **Grid** (`#canvas-grid`) checkboxes styled as modern interactive pill toggles (`.control-pill-toggle`: `display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 1px solid var(--border); border-radius: 999px; cursor: pointer; user-select: none; font-size: 13px; font-weight: 500;`). Use `:has(input:checked)` (with standard fallback) to highlight active toggle pills (`border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent);`).<br>- **Tier 2 — `.canvas-controls-tier.theming-tier`:** A dedicated, well-spaced palette deck (`display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; background: color-mix(in srgb, var(--border) 18%, transparent); border: 1px solid var(--border); border-radius: var(--radius-control);`):<br>  1. **Flow Diagram Theme Row (`.theme-row`):** Left label `<span class="theme-row-label">Diagram</span>` (`min-width: 78px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted);`) + `#theme-strip` (`display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex: 1; min-width: 0;`).<br>  2. **Canvas Background Row (`.theme-row`):** Left label `<span class="theme-row-label">Background</span>` + `#bg-lock` button (`padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600;`) + `#bg-strip` (`display: flex; flex-wrap: wrap; align-items: center; gap: 6px; flex: 1; min-width: 0;`). |
| **3. Theme & Background Pill Swatches (`.theme-chip` & `.bg-chip`)** | - **`.theme-chip`:** `display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px 5px 7px; min-height: 30px; border-radius: 999px; border: 1px solid var(--border); background: var(--card-background); font-size: 12.5px; font-weight: 500; cursor: pointer; transition: all 0.15s ease;`<br>- **`.theme-chip[aria-pressed="true"]`, `.bg-chip[aria-pressed="true"]`:** `border-color: var(--accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent); font-weight: 600;`<br>- **`.theme-swatch-dot`:** `width: 14px; height: 14px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; border: 1px solid rgba(128,128,128,0.35); flex-shrink: 0;` with an inner 6px particle accent dot (`border-radius: 50%`). |
| **4. Node & Edge Properties Inspector (`#props`)** | - **Inspector Card Surface:** Style `#props` as a structured floating/bottom inspector bar (`margin-top: 4px; padding: 10px 14px; background: color-mix(in srgb, var(--border) 22%, var(--card-background)); border: 1px solid var(--border); border-radius: var(--radius-control); display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px;`).<br>- **Section Dividers:** Style `#prop-section-label`, `#prop-section-node`, and `#prop-section-edge` with `display: inline-flex; flex-wrap: wrap; align-items: center; gap: 10px; padding-right: 14px; border-right: 1px solid var(--border);`.<br>- **Color Picker Inputs (`#prop-fill`, `#prop-stroke`, `#prop-text-color`):** Style `input[type="color"]` inside `#props` with `width: 30px; height: 30px; padding: 2px; border-radius: 6px; border: 1px solid var(--border); background: var(--card-background); cursor: pointer;` and align each `<label>` with `display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;`.<br>- **Right-Aligned Destructive / Close Actions:** Give `#prop-delete` subtle danger styling and push `#props-close` cleanly with comfortable `padding: 6px 12px;`. |
| **5. Mermaid Script Panel Header (`#text-panel-bar`)** | - Place `#text-panel-bar` at the top of `#text-panel` (`display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 4px 6px 4px; border-bottom: 1px solid var(--border); margin-bottom: 4px;`) with `<span class="text-panel-title">Mermaid Script</span>` (`font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted);`) and the `.control-pill-toggle` wrapping `#editor-wrap`. |

> **[THINKING_CHECKPOINT_3: Checking Child Selectors Before Restructuring `#canvas-controls`]**
> Pause and verify in your thinking tool before editing `index.html`:
> * Does `src/app/ui.ts` or `src/app/anim-controls.ts` use direct child selectors like `#canvas-controls > #anim-style`, or does it use descendant queries like `document.querySelector('#anim-style')`?
>   * In `src/app/ui.ts`, it uses `document.querySelector('#anim-style')!`, `document.querySelector('#anim-speed')!`, etc. (descendant/ID queries!).
>   * Therefore, grouping controls inside `.canvas-controls-tier` and `.control-cluster` divs inside `#canvas-controls` is 100% compatible with `ui.ts`, `anim-controls.ts`, and all unit/E2E tests—while transforming the visual layout from a cramped line of ungrouped inputs into a clean, spacious two-tier studio control deck!
> * What about `<select id="theme">` and `<select id="bg-theme">`?
>   * Keep `<select id="theme">` and `<select id="bg-theme">` inside `#canvas-controls`! You can either display them cleanly as compact fallback dropdowns or visually hide them on desktop when `#theme-strip` and `#bg-strip` are shown—Wait: check if any Playwright test in `tests/e2e/` interacts with `#theme` via `page.selectOption('#theme', ...)`!
>   * **Crucial Playwright Tip:** In Playwright, `page.selectOption('#theme', ...)` requires `#theme` to be visible (not `display: none` or `hidden`) unless force-selected! Therefore, keep `<select id="theme">` **visible** as a neat compact preset dropdown right next to the `Diagram` row label (or at the start of `.theme-row`), while `#theme-strip` provides the instant 1-click visual swatch pills right beside it! That way, both human users (1-click swatch pills) and automated Playwright tests (`selectOption('#theme')`) work seamlessly!

## 8. Step-by-Step Atomic Execution Plan for the Coding Agent

Follow these 8 sequential phases. Complete and verify each phase before starting the next.

### Phase 1: Update Core Types (`src/core/types.ts`)

1. Read `src/core/types.ts` completely.
2. Expand `export type ThemeId` to include all 12 theme IDs:
   * `'daylight' | 'geist' | 'paper' | 'matcha' | 'lavender' | 'midnight' | 'obsidian' | 'graphite' | 'nordic' | 'rosepine' | 'lagoon' | 'ember'`
3. Keep `export type ThemeChoice = ThemeId | 'auto';`.
4. Add `export type BackgroundChoice = 'match' | ThemeChoice;` (where `'match'` means "follow the active diagram theme", `'auto'` means "follow page light/dark mode", and any `ThemeId` locks/sets that specific background).
5. On `export interface Theme`, add:
   * `gridColor: string;`
   * `titleText?: string;`
6. On `export interface DrawOptions` (in `src/core/types.ts` or `src/render/draw.ts`), add `showGrid?: boolean;`.

### Phase 2: Implement the 12 Modern Minimal Themes & `composeTheme` (`src/render/themes.ts`)

1. Read `src/render/themes.ts` and `src/app/scheme.test.ts`.
2. Update `THEME_IDS` and `THEME_CHOICES` with all 12 theme IDs.
3. Export `BACKGROUND_CHOICES: BackgroundChoice[] = ['match', 'auto', ...THEME_IDS]`.
4. Populate all 12 themes in `THEMES` using the exact hex and RGBA specifications from **Section 4.3** (including `gridColor` and `titleText: edgeLabelText`).
5. Keep `resolveTheme(choice: ThemeChoice, scheme: ...)` with its exact existing parameter and return types so no existing unit tests break.
6. Add and export `composeTheme`:
   * Parameters: `diagramChoice: ThemeChoice`, `bgChoice: BackgroundChoice | undefined`, `scheme: 'light' | 'dark'` (or boolean `pageDark`—match the exact second parameter type used by `resolveTheme` in `src/render/themes.ts`!).
   * Logic:
     1. Resolve the diagram theme object `dTheme` using `resolveTheme(diagramChoice, scheme)`.
     2. If `!bgChoice || bgChoice === 'match'`, return `dTheme`.
     3. Otherwise, resolve the background theme object `bTheme` using `resolveTheme(bgChoice, scheme)`.
     4. Return a merged `Theme` object `{ ...dTheme, background: bTheme.background, backgroundGradient: bTheme.backgroundGradient, gridColor: bTheme.gridColor, edgeLabelBg: bTheme.edgeLabelBg, edgeLabelText: bTheme.edgeLabelText, titleText: bTheme.titleText ?? bTheme.edgeLabelText }`.

### Phase 3: Persist Background Theme, Background Lock, Grid & Word Wrap Settings (`src/app/storage.ts`)

1. Read `src/app/storage.ts` and `src/app/storage.test.ts`.
2. Add optional fields to `export interface Settings`:
   * `bgTheme?: BackgroundChoice;`
   * `bgLocked?: boolean;`
   * `grid?: boolean;`
   * `wordWrap?: boolean;`
3. In `loadSettings(store)`:
   * Validate `bgTheme`: `const bgTheme: BackgroundChoice = BACKGROUND_CHOICES.includes(parsed?.bgTheme) ? parsed.bgTheme : 'match';`
   * Validate `bgLocked`: `const bgLocked = typeof parsed?.bgLocked === 'boolean' ? parsed.bgLocked : (bgTheme !== 'match');`
   * Validate `grid`: `const grid = typeof parsed?.grid === 'boolean' ? parsed.grid : false;`
   * Validate `wordWrap`: `const wordWrap = typeof parsed?.wordWrap === 'boolean' ? parsed.wordWrap : false;`
   * Include `bgTheme`, `bgLocked`, `grid`, and `wordWrap` in the returned `Settings` object.
4. Run `npm test` to verify all existing storage tests pass.

### Phase 4: Add Dynamic Text Wrapping to the Mermaid Code Editor (`src/app/code-editor.ts`)

1. Read `src/app/code-editor.ts`.
2. Add `wordWrap?: boolean;` to `export interface CodeEditorEnv`.
3. Add `setWordWrap(wrap: boolean): void;` to `export interface CodeEditor`.
4. Inside `createCodeEditor(parent: HTMLElement, env: CodeEditorEnv): CodeEditor`:
   * Create `const wrapConf = new Compartment();`.
   * Add `wrapConf.of(env.wordWrap ? EditorView.lineWrapping : [])` to the `extensions` array in `EditorState.create(...)`.
   * Add `setWordWrap(wrap: boolean): void { view.dispatch({ effects: wrapConf.reconfigure(wrap ? EditorView.lineWrapping : []) }); }` to the returned object.

### Phase 5: Implement `drawGrid` and Title Contrast in `src/render/draw.ts` & `src/render/svg.ts`

1. Read `src/render/draw.ts` and `src/render/svg.ts`.
2. In `src/render/draw.ts`:
   * Export `drawGrid(ctx: Ctx2D, theme: Theme, view: ViewState, viewportWidth: number, viewportHeight: number): void` using the exact algorithm in **Section 5.2**.
   * Inside `drawScene(ctx, scene, theme, view, frame, options)`:
     * Right after `ctx.save()` and **before** `ctx.translate(view.panX, view.panY)`, check:
       `if (options.showGrid && !options.transparent)`
     * Safely compute viewport dimensions (guarding for mock test contexts):
       `const dpr = typeof ctx.getTransform === 'function' ? (ctx.getTransform().a || 1) : 1;`
       `const vw = ctx.canvas ? ctx.canvas.width / dpr : 800;`
       `const vh = ctx.canvas ? ctx.canvas.height / dpr : 600;`
     * Call `drawGrid(ctx, theme, view, vw, vh);`.
     * Under `// 1. Title` in `drawScene`, update `ctx.fillStyle = theme.titleText ?? theme.nodeText;` so diagram titles stay legible when background and diagram themes are separated.
3. In `src/render/svg.ts`:
   * Where the diagram title `<text>` element is emitted (if present), use `theme.titleText ?? theme.nodeText` for its fill color.
   * Confirm no grid elements are added to `svg.ts`.
4. In `src/app/render-loop.ts`:
   * Replace the `resolveTheme(state.settings.theme, scheme)` lookup with `composeTheme(state.settings.theme, state.settings.bgTheme ?? 'match', scheme)`.
   * Pass `showGrid: Boolean(state.settings.grid)` in `drawScene(...)` options.
5. In `src/export/draw-frame.ts` (and `src/export/png.ts` if it calls `drawScene` directly):
   * Ensure `showGrid: false` is passed in `DrawOptions`.
6. Check `src/app/ui.ts` / `src/app/export-dialog.ts` where exports are triggered:
   * Ensure the `theme` passed to `exportPng`, `exportSvg`, `exportGif`, and `exportVideo` is resolved via `composeTheme(state.settings.theme, state.settings.bgTheme ?? 'match', scheme)` so exported files reflect the user's separated background and flow diagram themes!

### Phase 6: Upgrade & De-Clutter Dashboard, Toolbar, Properties & Editor UI (`index.html`, `src/app/anim-controls.ts`, `src/app/ui.ts`, `src/app/style.css`)

1. Read `index.html`, `src/app/anim-controls.ts`, `src/app/ui.ts`, and `src/app/style.css`.
2. **Update `index.html` inside `#text-panel`:**
   * Immediately above `<div id="source"></div>`, add:
     `<div id="text-panel-bar" class="text-panel-bar"><span class="text-panel-title">Mermaid Script</span><label class="control-pill-toggle"><input id="editor-wrap" type="checkbox" /> <span>Wrap text</span></label></div>`
3. **Restructure `index.html` inside `#canvas-controls` into Two Ergonomic Tiers (preserving all existing IDs):**
   * **Tier 1 (`.canvas-controls-tier.playback-tier`):**
     * **Transport & Mode Cluster (`.control-cluster`):** `<button id="anim-pause">Pause</button>`, `<label for="anim-style">Animation</label>`, `<select id="anim-style">...</select>`
     * **Sliders Cluster (`.control-cluster.sliders-cluster`):**
       * `<div class="slider-group"><label for="anim-speed">Speed <output id="anim-speed-value" for="anim-speed">1x</output></label><input id="anim-speed" type="range" ... /></div>`
       * `<div class="slider-group"><label for="anim-density">Density <output id="anim-density-value" for="anim-density">4</output></label><input id="anim-density" type="range" ... /></div>`
     * **Toggles Cluster (`.control-cluster.toggles-cluster`):**
       * `<label class="control-pill-toggle"><input id="anim-glow" type="checkbox" /> <span>Glow</span></label>`
       * `<label class="control-pill-toggle"><input id="canvas-grid" type="checkbox" /> <span>Grid</span></label>`
   * **Tier 2 (`.canvas-controls-tier.theming-tier`):**
     * **Diagram Theme Row (`.theme-row`):**
       * `<label for="theme" class="theme-row-label">Diagram</label>`
       * `<select id="theme">...</select>`
       * `<div id="theme-strip" class="theme-strip" role="radiogroup" aria-label="Flow diagram theme"></div>`
     * **Canvas Background Row (`.theme-row`):**
       * `<label for="bg-theme" class="theme-row-label">Background</label>`
       * `<button id="bg-lock" type="button" class="bg-lock-btn" aria-pressed="false" title="Lock canvas background while changing diagram themes">🔓 Lock BG</button>`
       * `<select id="bg-theme" aria-label="Canvas background"><option value="match">Match diagram</option></select>`
       * `<div id="bg-strip" class="bg-strip" role="radiogroup" aria-label="Canvas background"></div>`
4. **Update `src/app/ui.ts` and `src/app/anim-controls.ts`:**
   * In `src/app/ui.ts`:
     * Pass `wordWrap: Boolean(state.settings.wordWrap)` into `createCodeEditor(sourceParent, { ... })`.
     * Bind `#editor-wrap` checkbox: initialize `editorWrapEl.checked = Boolean(state.settings.wordWrap)`, and on `'change'`, update `state.settings.wordWrap = editorWrapEl.checked`, call `editor.setWordWrap(state.settings.wordWrap)`, and call `saveSettings(store, state.settings)`.
   * In `src/app/anim-controls.ts`:
     * Add optional properties to `AnimControlElements`:
       * `canvasGridEl?: HTMLInputElement | null;`
       * `themeStripEl?: HTMLElement | null;`
       * `bgThemeEl?: HTMLSelectElement | null;`
       * `bgStripEl?: HTMLElement | null;`
       * `bgLockEl?: HTMLButtonElement | null;`
     * Pass these elements from `src/app/ui.ts` when calling `setupAnimControls`.
     * Wire `#theme-strip`, `#bg-lock`, `#bg-strip`, `#bg-theme`, and `#canvas-grid` following the state transitions in **Section 4.4** and **Section 5**.
5. **Apply Ergonomic De-Cluttering CSS in `src/app/style.css`:**
   * Implement all styling rules from **Section 7.3** for `#toolbar`, `#toolbar > [role="group"]`, `#canvas-controls`, `.canvas-controls-tier`, `.control-cluster`, `.slider-group`, `.control-pill-toggle`, `.theming-tier`, `.theme-row`, `.theme-chip`, `.bg-chip`, `.bg-lock-btn`, `#props`, and `#text-panel-bar`.

### Phase 7: Write Unit & Integration Tests

1. **Theme Composition & Separation Tests (`src/app/scheme.test.ts`):**
   * Test that all 12 `THEME_IDS` exist in `THEMES` and have valid color strings including `gridColor` and `titleText`.
   * Test `composeTheme(diagramChoice, bgChoice, scheme)` for both `'match'` and decoupled light/dark combinations (`'obsidian'` diagram on `'paper'` background, `'geist'` diagram on `'midnight'` background).
2. **Storage Persistence Tests (`src/app/storage.test.ts`):**
   * Verify `bgTheme`, `bgLocked`, `grid`, and `wordWrap` round-trip through `saveSettings` and `loadSettings`, and default safely to `bgTheme: 'match'`, `bgLocked: false`, `grid: false`, `wordWrap: false` when absent.
3. **Code Editor Word Wrap Tests (`src/app/code-editor.test.ts` or `src/app/chrome.test.ts`):**
   * Verify `createCodeEditor` accepts `wordWrap: true/false` and `editor.setWordWrap(true)` / `editor.setWordWrap(false)` reconfigures the editor cleanly without throwing or resetting `editor.getText()`.
4. **Export Grid Exclusion Tests (`src/export/draw-frame.test.ts`):**
   * Verify `drawExportFrame` renders with `showGrid: false` so exported frames never include dashboard grid lines.

### Phase 8: Full Validation & Quality Gate Checklist

Run each command sequentially and resolve any errors or warnings before finishing:

| Step | Command | Expected Outcome |
| :--- | :--- | :--- |
| **1. Typecheck & Build** | `npm run build` | `tsc --noEmit` and `vite build` succeed with zero errors |
| **2. Linter** | `npm run lint` | `oxlint` passes with 0 warnings and 0 errors |
| **3. Unit Tests** | `npm run test` | All Vitest unit test suites pass (`0 failed`) |
| **4. E2E Tests (if browser installed)** | `npm run test:e2e` | Playwright tests in `tests/e2e/` pass (including `chrome.spec.ts` and `mobile.spec.ts`) |

## 9. Common Pitfalls & Troubleshooting Guide for the Coding Agent

| Symptom / Error | Root Cause | Exact Fix |
| :--- | :--- | :--- |
| `tests/e2e/mobile.spec.ts` fails on `scrollWidth <= innerWidth` | A new control strip (`#theme-strip`, `#bg-strip`, or `.slider-group`) has `white-space: nowrap` without `flex-wrap: wrap` or `min-width: 0` | Ensure `.theme-strip`, `.bg-strip`, `.theme-row`, and `.canvas-controls-tier` all have `flex-wrap: wrap; min-width: 0; max-width: 100%;` so controls wrap cleanly on narrow mobile screens! |
| `src/app/narrow.test.ts` fails after editing `#toolbar` | Added wrapper `<div>` elements around `#toolbar > [role="group"]` | Keep `<div role="group">` elements as direct children of `#toolbar` and style them purely via `#toolbar > [role="group"]` in `src/app/style.css`. |
| Toggling `Wrap text` in `#text-panel` resets undo history or cursor position | Recreated `EditorState` from scratch instead of using a CodeMirror `Compartment` | Use `const wrapConf = new Compartment()` at editor creation and call `view.dispatch({ effects: wrapConf.reconfigure(wrap ? EditorView.lineWrapping : []) })` inside `setWordWrap(wrap)`! |
| Clicking a Flow Diagram theme still changes the background even when `Lock BG` was clicked | `bgLocked` was set to `true`, but `bgTheme` was left as `'match'` | When `#bg-lock` is toggled from `false` to `true`, immediately resolve the current effective background ID (e.g., if `state.settings.theme === 'auto'`, resolve `'daylight'` or `'midnight'`, else `state.settings.theme`) and assign `state.settings.bgTheme = currentId`! |
| Edge labels or diagram title become invisible when combining a dark diagram theme with a light locked background | `edgeLabelBg`, `edgeLabelText`, or `titleText` came from the diagram theme instead of the background theme | In `composeTheme`, always copy `edgeLabelBg`, `edgeLabelText`, and `titleText` from `bTheme` (the resolved background theme), because the title and edge labels sit on the canvas background, not inside nodes! |
| Exported PNG/GIF/Video/SVG uses the diagram theme's default background instead of the locked/separate background | The export caller in `src/app/ui.ts` or `src/app/export-dialog.ts` called `resolveTheme(state.settings.theme, scheme)` instead of `composeTheme(...)` | Update the export caller in `src/app/` to resolve the export `Theme` via `composeTheme(state.settings.theme, state.settings.bgTheme ?? 'match', scheme)`. |
| `oxlint` fails with missing return type warning | New exported function (`composeTheme`, `drawGrid`, or `setWordWrap`) lacks an explicit TypeScript return type | Always write `: Theme` on `composeTheme` and `: void` on `drawGrid` and `setWordWrap`. |
| Unit test in `draw-frame.test.ts` throws `ctx.getTransform is not a function` | Mock canvas context in Vitest only implements basic drawing primitives | Guard `typeof ctx.getTransform === 'function'` inside `drawScene` / `drawGrid`. |
