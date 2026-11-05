# Gati-Chitra Architecture & Implementation Plan: Independent Flow Diagram & Canvas Background Theming, Multi-Shade Node & Shape Palettes, Background Lock, Auto-Excluded Canvas Grids, Mermaid Editor Text Wrapping, Control Bar Ergonomics, and Advanced Workflow & Pipeline Animations

**Target Repository:** [U77w41/gati-chitra](https://github.com/U77w41/gati-chitra)
**Live Deployment:** [https://u77w41.github.io/gati-chitra/](https://u77w41.github.io/gati-chitra/)
**Recommended Plan Path in Repo:** `docs/superpowers/plans/gati_chitra_improvement_plan.md`
**Target Executor:** Autonomous LLM Coding Agent (Antigravity CLI / Agentic IDE)

## 1. Executive Instructions & Operating Rules for the Coding Agent

You are tasked with implementing seven cohesive upgrades in the **Gati-Chitra** repository:

1. **Single-Click Modern & Minimal Flow Diagram Theming (16 Curated Palettes):** Upgrade the diagram dashboard from a basic two-click dropdown with 4 themes to an instant, **single-click visual theme swatch bar** featuring **16 palettes** (the 4 existing themes for backward compatibility + **12 new designer-curated modern & minimal palettes** inspired by Vercel Geist, Flexoki Paper, Catppuccin Latte, Kyoto Sage, Terracotta Clay, Swiss Grid, Linear Obsidian, Raycast Graphite, Tokyo Night, Nordic Frost, Rosé Pine, and Espresso Warm).
2. **Multi-Shade & Semantic Status Node/Shape Theming (`By Shape` | `Semantic Status` | `By Node` | `Uniform`):** Give each of the 16 themes a 4-tier harmonious node shade palette (`nodeShades`) plus semantic status detection (`semantic` mode: Blue = Process, Purple = Decision Diamond, Orange = Dispatch/Async, Green = Success/Delivered, Red = Error/Declined/Failure/Cancelled) wired through `nodeStyle(node, theme)` in `src/render/style.ts`—while still honoring explicit per-node color overrides (`node.style.fill`, `node.style.stroke`, `node.style.color`).
3. **Independent Canvas Background Theming & One-Click Background Lock:** Decouple the **Canvas Background** from the **Flow Diagram Theme** so users can either:
   * Pick a dedicated **Canvas Background** independently of the node/edge/particle diagram theme.
   * Click a **Lock Background** toggle (`#bg-lock`) so that clicking through different flow diagram themes changes **only** the diagram (nodes, subgraphs, edges, and animated flow particles) while keeping the current canvas background locked in place.
4. **Diagram Dashboard Canvas Grid (Auto-Removed on Export):** Add a single-click canvas grid toggle (`#canvas-grid`) in the diagram dashboard (`#canvas-controls`) that renders a zoom- and pan-aware alignment grid whose color automatically adapts to the active **Canvas Background**, and **automatically excludes** the grid whenever the user exports to PNG, SVG, Animated GIF, WebM, or MP4.
5. **Mermaid Script Writing Section Text Wrapping (Word Wrap) Toggle:** Add a single-click **Wrap Text** toggle (`#editor-wrap`) inside the Mermaid script writing panel (`#text-panel`) that dynamically reconfigures the CodeMirror 6 editor (`src/app/code-editor.ts`) using a `Compartment` with `EditorView.lineWrapping`, persisting the user's preference in `localStorage`.
6. **De-Cluttering & Ergonomic Redesign of All Cramped Buttons and Controls (`#toolbar`, `#canvas-controls`, `#props`, and `#text-panel`):** Transform the currently squashed, flat `gap: 4px / 8px` button strips into a spacious, visually grouped, modern studio layout with segmented button clusters, structured multi-row canvas control decks, pill-styled checkboxes, aligned range sliders, and a clean node/edge properties inspector—while strictly preserving every DOM ID, role, header height (`>= 72px`), and mobile no-overflow invariant enforced by Vitest and Playwright E2E tests.
7. **Two New Signature Animation & Card Styles (n8n Approval Workflow + Food Delivery Pipeline Typewriter Reveal):**
   * **Animation Style 1 — `build` ("Cascade Build"):** Progressively reveals nodes and grows outgoing curves stage-by-stage by topological depth ($d = 0, 1, 2, \dots$), with optional **n8n-style Workflow Tile mode (`cardMode: 'workflow'`)** featuring `64×64` rounded icon tiles, `⚡` trigger badges on root nodes, output port rings (`o`), external titles + subtitles below the tile, and emerald-green (`true`) / coral-red (`false`) dashed branches.
   * **Animation Style 2 — `typewriter` ("Pipeline Typewriter Reveal" — Food Delivery Pipeline Style):**
     * Reveals the diagram Title/Subtitle at the top-left with a smooth character-by-character typewriter effect.
     * For each stage in sequence: first pops in the node's rounded card (or **rounded-corner decision diamond** via `arcTo` with a top `?` badge) and its **inline left semantic icon** (shopping bag, credit card, utensils, delivery truck, check circle, error/cancel icon), then **types in the node's bold primary title and muted subtitle character-by-character**, then grows the outgoing arrow while **typing in the edge label character-by-character**, and finally transitions all completed edges into a **smooth flowing dashed line animation** for the remainder of the cycle!
     * Includes both **"Approval Workflow"** and **"Food Delivery Pipeline"** as built-in starter templates in `src/share/templates.ts`.

### Mandatory Guardrails for Agent Execution

* **Zero External Runtime Dependencies:** Gati-Chitra is a pure Vanilla TypeScript + Vite SPA (`package.json` uses `@codemirror/*`, `@dagrejs/dagre`, `gifenc`, `mediabunny`, and `@fontsource/lato`). Do **not** install React, Tailwind, Lucide, or any npm packages. All icons, rounded diamonds, and typewriter effects must be drawn with pure Canvas 2D primitives and SVG paths.
* **Strict Layer Separation (`AGENTS.md`):** Pure rendering logic belongs strictly in `src/render/` and must never read from `document`, `window`, or `localStorage`. DOM wiring belongs in `src/app/`. Export framing belongs in `src/export/`.
* **TypeScript Strictness:** `tsconfig.json` enforces strict mode, `noImplicitAny`, strict null checks, and explicit return types on exported functions.
* **Think Before Editing:** Before modifying any file, you **must** execute the `<THINKING_CHECKPOINT>` listed in each phase using your thinking/reasoning tool and read the target file from disk first. Never guess line numbers or variable names without reading the current file content.
* **Verify After Every Phase:** Run `npm run test`, `npm run lint`, and `npm run build` after each phase. Never batch all changes blindly without intermediate test runs.

## 2. Repository Architecture & File Map

| Subsystem | File Path | Existing Responsibility | Planned Modification |
| :--- | :--- | :--- | :--- |
| **Core Types** | `src/core/types.ts` | Defines `ShapeKind`, `AnimStyle`, `FrameState`, `ThemeId`, `ThemeChoice`, `Theme`, `ViewState`, `AnimSettings`, and `DrawOptions` | Expand `ThemeId` to 16 themes; add `'build'` and `'typewriter'` to `AnimStyle`; add optional `titleChars?: number`, `nodeAlpha?: Record<string, number>`, `nodeTextProgress?: Record<string, number>`, `edgeGrow?: Record<string, number>`, and `edgeTextProgress?: Record<string, number>` to `FrameState`; add `BackgroundChoice`, `NodeShadeMode` (`'shape' \| 'semantic' \| 'node' \| 'off'`), `CardStyleMode` (`'classic' \| 'pipeline' \| 'workflow'`), and `NodeShade`; add `nodeShades`, `shadingMode?`, `gridColor`, and `titleText` to `Theme`; add `showGrid?: boolean` and `cardMode?: CardStyleMode` to `DrawOptions` |
| **Theme & Background Palettes** | `src/render/themes.ts` | Exports `THEME_IDS`, `THEME_CHOICES`, `THEMES`, and `resolveTheme` | Register 16 flow diagram themes in `THEMES` (each with a 4-tier `nodeShades` array), export `BACKGROUND_CHOICES`, and export `composeTheme(diagramChoice, bgChoice, pageDark, shadingMode)` |
| **Node & Edge Style Resolver** | `src/render/style.ts` | Exports `nodeStyle(node, theme)` and `edgeStyle(edge, theme)` | Upgrade `nodeStyle` with `shapeShadeTier`, `semanticStatusShade` (Blue Process, Purple Decision, Orange Dispatch, Green Success/Delivered, Red Error/Declined/Failure), and `hashNodeId`; upgrade `edgeStyle` to auto-style `true`/`yes` and `false`/`no` branch edges |
| **Animation Engine** | `src/anim/anim.ts` & `src/anim/steps.ts` | Computes `phaseAt`, `computeDepths`, and `frameState(scene, settings, phase)` | Add `'build'` (Cascade Build) and `'typewriter'` (Pipeline Typewriter Reveal + Post-Build Flowing Dashes) modes to `frameState` |
| **Canvas Node & Edge Renderers** | `src/render/draw.ts` & `src/render/draw-edges.ts` | Renders background, groups, nodes, edges, labels, and particles | Add `drawGrid`; implement rounded-corner diamonds (`arcTo`); support `nodeAlpha`, `nodeTextProgress` (character-by-character typewriter slicing + two-line Bold Title / Muted Subtitle hierarchy), `edgeGrow`, and `edgeTextProgress`; implement `cardMode: 'pipeline'` (inline left vector icons & top `?` diamond badge) and `cardMode: 'workflow'` (n8n `64×64` icon tiles, `⚡` trigger badge, output port ring `o`) |
| **Templates** | `src/share/templates.ts` | Defines built-in Mermaid starter templates | Add both the `"Approval Workflow"` template and the `"Food Delivery Pipeline"` template |
| **Settings Storage** | `src/app/storage.ts` | Defines `Settings` interface (`theme`, `anim`, `split`), `loadSettings`, and `saveSettings` | Add optional `bgTheme?: BackgroundChoice`, `bgLocked?: boolean`, `nodeShading?: NodeShadeMode`, `cardMode?: CardStyleMode`, `grid?: boolean`, and `wordWrap?: boolean` to `Settings`; allow `'build'` and `'typewriter'` in `anim.style` validation |
| **Mermaid Code Editor** | `src/app/code-editor.ts` | Exports `CodeEditorEnv`, `CodeEditor`, and `createCodeEditor(parent, env)` | Add `wordWrap?: boolean` to `CodeEditorEnv` and `setWordWrap(wrap: boolean): void` to `CodeEditor` using a CodeMirror `Compartment` and `EditorView.lineWrapping` |
| **Dashboard & Editor HTML** | `index.html` | Defines `#toolbar`, `#text-panel`, `#canvas-controls`, and `#props` | Add `#text-panel-bar` with `#editor-wrap` inside `#text-panel`; add `<option value="build">build</option>` and `<option value="typewriter">typewriter</option>` to `#anim-style`; structure `#canvas-controls` into two ergonomic tiers housing `#canvas-grid`, `#card-mode`, `#node-shading`, `#theme-strip`, `#bg-lock`, `#bg-strip`, and `#bg-theme` |
| **Dashboard & Control Styling** | `src/app/style.css` & `src/app/tokens.css` | Styles `#toolbar`, `#text-panel`, `#canvas-panel`, `#canvas`, `#canvas-controls`, and `#props` | De-clutter and redesign `#toolbar` groups, `#canvas-controls` tiers, `#props` inspector sections, range sliders, color inputs, and pill toggles |
| **Controls & App Wiring** | `src/app/anim-controls.ts` & `src/app/ui.ts` | Wires editor and canvas controls | Wire `#editor-wrap` in `ui.ts`; wire `#theme-strip`, `#node-shading`, `#card-mode`, `#bg-theme` / `.bg-chip`, `#bg-lock`, and `#canvas-grid` in `anim-controls.ts` |
| **Export Pipeline** | `src/export/draw-frame.ts`, `src/export/png.ts`, `src/export/gif.ts`, `src/export/video.ts`, `src/render/svg.ts` | Renders offscreen frames for PNG, GIF, WebM/MP4, and generates SVG XML | Ensure `drawExportFrame` and `svg.ts` **never** call `drawGrid` (`showGrid: false`), while passing `cardMode` and the composed `theme` so exports include the pipeline/workflow cards and `build` / `typewriter` animations! |

## 3. Pre-Implementation Discovery Protocol (Mandatory First Step)

> **[THINKING_CHECKPOINT_0: Codebase Verification]**
> Before modifying a single line of code, use your file-reading tool to inspect the exact current versions of:
> 1. `src/core/types.ts` and `src/core/shapes.ts`
> 2. `src/render/themes.ts` and `src/render/style.ts`
> 3. `src/anim/anim.ts` and `src/anim/steps.ts`
> 4. `src/render/draw.ts`, `src/render/draw-edges.ts`, and `src/render/node-path.ts`
> 5. `src/app/storage.ts` and `src/app/storage.test.ts`
> 6. `src/app/code-editor.ts`
> 7. `src/app/anim-controls.ts`, `src/app/ui.ts`, and `src/app/narrow.ts`
> 8. `src/app/render-loop.ts`, `src/export/draw-frame.ts`, and `src/render/svg.ts`
> 9. `src/share/templates.ts`
> 10. `index.html` and `src/app/style.css`
>
> **In your thinking tool, explicitly write down:**
> * What values are currently in `AnimStyle` in `src/core/types.ts` and validated in `loadSettings` (`src/app/storage.ts`)?
> * How does `frameState` in `src/anim/anim.ts` use `computeDepths` for `'pulse'` mode?
> * How does `drawNode` in `src/render/draw.ts` render multi-line node labels (`box.lines` / `box.runs`) and how does `drawEdges` in `src/render/draw-edges.ts` render edge labels?
> * Run `npm test` once before editing anything to confirm the baseline test suite passes.

## 4. Feature Specification A: Modern + Minimal Color Theory, Decoupled Background/Diagram Theming & Multi-Shade / Semantic Node Palettes

### 4.1 The 60-30-10 Minimalist Color Principle for Animated Flowcharts

* **60% Calm Architectural Surface (`background` & `groupFill`):** Desaturated, low-glare surfaces (warm unbleached paper, pure zinc alabaster, deep carbon-indigo, or polar slate) that never fatigue the eye.
* **30% Whisper-Soft Tonal Node Hierarchy (`nodeShades[0..3]` & `edge`):** Different node shapes or semantic statuses receive **5%–12% micro-tinted surface fills** paired with crisp, medium-contrast semantic borders (`stroke`) and quiet structural connectors (`edge`).
* **10% Kinetic Focal Point (`particle` & `glow`):** Keeping nodes and edges restrained makes the **animated flow particles**, **typewriter reveals**, and **flowing dashed connectors** pop with jewel-like clarity.

### 4.2 `composeTheme` + `nodeStyle` Architecture

Keep `Theme` as the single unified runtime object passed to renderers, and create `composeTheme(diagramChoice, bgChoice, scheme, shadingMode): Theme` in `src/render/themes.ts`:
* **From the Flow Diagram Theme (`diagramChoice`):** `nodeFill`, `nodeStroke`, `nodeText`, `nodeShades`, `edge`, `groupFill`, `groupStroke`, `groupTitle`, `particle`, `glow`, `selection`, `glowDefault`
* **From the Canvas Background Theme (`bgChoice`):** `background`, `backgroundGradient`, `gridColor`, `edgeLabelBg`, `edgeLabelText`, and `titleText`
* **Active Node Shading Mode (`shadingMode`):** `shadingMode: NodeShadeMode` (`'shape' | 'semantic' | 'node' | 'off'`)

### 4.3 Multi-Shade & Semantic Status Node Theming (`src/render/style.ts`)

Support 4 `NodeShadeMode` options in `#node-shading`:

1. **`'shape'` (By Shape Geometry):** Maps the 20 `ShapeKind` values to the theme's 4 `nodeShades` tiers:
   * **Tier `0` (Process):** `'rect'`, `'round'`, `'subroutine'`, `'text'`
   * **Tier `1` (Terminals / Pills):** `'stadium'`, `'circle'`, `'doubleCircle'`, `'smallCircle'`, `'filledCircle'`, `'framedCircle'`, `'forkBar'`
   * **Tier `2` (Decisions / Gateways):** `'diamond'`, `'hexagon'`, `'asymmetric'`
   * **Tier `3` (Storage / Data / I/O):** `'cylinder'`, `'parallelogram'`, `'parallelogramAlt'`, `'trapezoid'`, `'trapezoidAlt'`, `'document'`
2. **`'semantic'` (Semantic Status — Food Delivery Pipeline Style!):**
   Inspects `node.shape` and `node.label.toLowerCase()` to assign semantic status colors (matching the **Food Delivery Pipeline** reference video, automatically adapted for light vs. dark themes):
   * **Decision / Question (`node.shape === 'diamond' || node.shape === 'hexagon' || label.includes('?')`):**
     * Light theme: `fill: '#faf5ff'`, `stroke: '#9333ea'` (Soft Lavender fill, Vivid Purple border)
     * Dark theme: `fill: '#231829'`, `stroke: '#c084fc'`
   * **Error / Declined / Failure / Cancelled (`/declin|fail|cancel|error|reject|timeout|issue/i.test(label)`):**
     * Light theme: `fill: '#fef2f2'`, `stroke: '#ef4444'` (Soft Rose fill, Coral Red border)
     * Dark theme: `fill: '#2d1519'`, `stroke: '#f87171'`
   * **Success / Delivered / Completed / Approved (`/deliver|success|complet|approv|done|pass/i.test(label)`):**
     * Light theme: `fill: '#f0fdf4'`, `stroke: '#22c55e'` (Soft Mint fill, Emerald Green border)
     * Dark theme: `fill: '#0f291e'`, `stroke: '#4ade80'`
   * **Dispatch / Courier / Queue / Warning (`/dispatch|courier|wait|pend|queue|assign/i.test(label)`):**
     * Light theme: `fill: '#fff7ed'`, `stroke: '#ea580c'` (Soft Warm Peach fill, Burnt Orange border)
     * Dark theme: `fill: '#2b1d12'`, `stroke: '#fb923c'`
   * **Standard Process / Action (Default):**
     * Light theme: `fill: '#eff6ff'`, `stroke: '#3b82f6'` (Soft Ice Blue fill, Royal Blue border) or `theme.nodeShades[0]`
     * Dark theme: `fill: '#172033'`, `stroke: '#60a5fa'` or `theme.nodeShades[0]`
3. **`'node'` (By Node Hash):** Cycles across `theme.nodeShades[hashNodeId(node.id) % 4]`.
4. **`'off'` (Uniform):** Uses base `theme.nodeFill` and `theme.nodeStroke`.

*Note:* In all modes, explicit user overrides (`node.style.fill`, `node.style.stroke`, `node.style.color`) always take top priority!

### 4.4 Complete 16-Theme Modern & Minimal Palette Table (`src/render/themes.ts`)

| Theme ID (`ThemeId`) | Display Name (`name`) | Mode & Design Inspiration | `background` | `backgroundGradient` | `nodeFill` (Tier 0) | `nodeStroke` (Tier 0) | `nodeText` | `edge` | `edgeLabelBg` | `edgeLabelText` / `titleText` | `groupFill` | `groupStroke` | `groupTitle` | `particle` / `glow` / `selection` | `glowDefault` | `gridColor` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `daylight` *(existing)* | `Daylight` | Classic Light | `#ffffff` | `null` | `#f7f7fb` | `#34495e` | `#111418` | `#4f5660` | `#ffffff` | `#111418` | `#f5f5fa` | `#cfd1dc` | `#34495e` | `#3b82f6` | `false` | `rgba(15, 23, 42, 0.08)` |
| `geist` *(new)* | `Vercel Mono` | Light — Architectural Zinc Monochrome | `#fafafa` | `null` | `#ffffff` | `#18181b` | `#09090b` | `#71717a` | `#fafafa` | `#09090b` | `#f4f4f5` | `#d4d4d8` | `#27272a` | `#2563eb` | `false` | `rgba(24, 24, 27, 0.07)` |
| `flexoki` *(new)* | `Flexoki Paper` | Light — Warm Unbleached Ink (Steph Ango) | `#fffcf0` | `null` | `#f2f0e5` | `#403e3c` | `#100f0f` | `#6f6e69` | `#fffcf0` | `#100f0f` | `#f7f5ea` | `#dad8ce` | `#575653` | `#da702c` | `false` | `rgba(16, 15, 15, 0.07)` |
| `latte` *(new)* | `Catppuccin Latte` | Light — Soft Editorial Pastel | `#eff1f5` | `null` | `#ffffff` | `#4c4f69` | `#4c4f69` | `#7c7f93` | `#eff1f5` | `#4c4f69` | `#e6e9ef` | `#bcc0cc` | `#5c5f77` | `#8839ef` | `false` | `rgba(76, 79, 105, 0.08)` |
| `matcha` *(new)* | `Kyoto Sage` | Light — Botanical Ceramic Minimal | `#f4f7f4` | `null` | `#ffffff` | `#2d4a3e` | `#16261f` | `#5c7c6d` | `#f4f7f4` | `#16261f` | `#ebf1ec` | `#c5d6c8` | `#2d4a3e` | `#10b981` | `false` | `rgba(45, 74, 62, 0.08)` |
| `clay` *(new)* | `Terracotta Sand` | Light — Warm Earth & Linen Minimal | `#fbf7f4` | `null` | `#f5ebe6` | `#5c4033` | `#291d18` | `#8c6d5e` | `#fbf7f4` | `#291d18` | `#f7efe9` | `#e0cec4` | `#6e4f41` | `#ea580c` | `false` | `rgba(92, 64, 51, 0.08)` |
| `swiss` *(new)* | `Swiss Grid` | Light — Bauhaus / International Typographic | `#f6f6f6` | `null` | `#ffffff` | `#111111` | `#111111` | `#555555` | `#f6f6f6` | `#111111` | `#eeeeee` | `#cccccc` | `#111111` | `#e11d48` | `false` | `rgba(17, 17, 17, 0.09)` |
| `midnight` *(existing)* | `Midnight` | Classic Dark | `#0f172a` | `null` | `#1e293b` | `#475569` | `#f8fafc` | `#64748b` | `#0f172a` | `#f8fafc` | `#1e293b` | `#334155` | `#94a3b8` | `#38bdf8` | `true` | `rgba(248, 250, 252, 0.07)` |
| `obsidian` *(new)* | `Linear Carbon` | Dark — Deep Carbon & Electric Indigo | `#090a0f` | `['#090a0f', '#10121a']` | `#141622` | `#26293d` | `#f3f4f6` | `#4b5278` | `#090a0f` | `#f3f4f6` | `#0e1018` | `#1f2233` | `#9ca3af` | `#818cf8` | `true` | `rgba(129, 140, 248, 0.08)` |
| `graphite` *(new)* | `Raycast Matte` | Dark — Pure Neutral Dark & Kinetic Lime | `#111113` | `null` | `#18181b` | `#3f3f46` | `#f4f4f5` | `#71717a` | `#111113` | `#f4f4f5` | `#141417` | `#27272a` | `#a1a1aa` | `#a3e635` | `false` | `rgba(255, 255, 255, 0.07)` |
| `tokyonight` *(new)* | `Tokyo Night` | Dark — Nocturnal Dusk & Cyber Cyan | `#1a1b26` | `['#1a1b26', '#16161e']` | `#24283b` | `#414868` | `#c0caf5` | `#565f89` | `#1a1b26` | `#c0caf5` | `#1f2335` | `#3b4261` | `#7aa2f7` | `#7dcfff` | `true` | `rgba(192, 202, 245, 0.07)` |
| `nordic` *(new)* | `Nordic Frost` | Dark — Arctic Polar Slate | `#242933` | `['#242933', '#2e3440']` | `#3b4252` | `#4c566a` | `#eceff4` | `#616e88` | `#242933` | `#eceff4` | `#292e39` | `#434c5e` | `#d8dee9` | `#88c0d0` | `false` | `rgba(216, 222, 233, 0.07)` |
| `rosepine` *(new)* | `Rosé Velvet` | Dark — Soho Muted Plum & Rose Gold | `#191724` | `['#191724', '#1f1d2e']` | `#26233a` | `#403d52` | `#e0def4` | `#6e6a86` | `#191724` | `#e0def4` | `#1f1d2e` | `#393552` | `#908caa` | `#f6c177` | `true` | `rgba(224, 222, 244, 0.07)` |
| `monokai` *(new)* | `Espresso Warm` | Dark — Roasted Charcoal & Amber Gold | `#1c1917` | `['#1c1917', '#24201d']` | `#292524` | `#44403c` | `#f5f5f4` | `#78716c` | `#1c1917` | `#f5f5f4` | `#211e1c` | `#383330` | `#a8a29e` | `#f59e0b` | `true` | `rgba(245, 245, 244, 0.07)` |
| `lagoon` *(existing)* | `Lagoon` | Deep Ocean Dark | `#041e2b` | `['#041e2b', '#0a2e3f']` | `#0b3548` | `#14536b` | `#e0f2fe` | `#0ea5e9` | `#041e2b` | `#e0f2fe` | `#082a3a` | `#0f4459` | `#38bdf8` | `#22d3ee` | `true` | `rgba(56, 189, 248, 0.09)` |
| `ember` *(existing)* | `Ember` | Warm Crimson Dark | `#180c0e` | `['#180c0e', '#2a1215']` | `#2d1519` | `#4a2026` | `#fef2f2` | `#f43f5e` | `#180c0e` | `#fef2f2` | `#241013` | `#3d181d` | `#fb7185` | `#fb923c` | `true` | `rgba(251, 113, 133, 0.08)` |

### 4.5 Curated 4-Tier `nodeShades` Specification Table for All 16 Themes

| Theme ID | **Tier 0: Process / Action** (`fill`, `stroke`) | **Tier 1: Terminal / Stadium / Circle** (`fill`, `stroke`) | **Tier 2: Decision / Diamond / Hexagon** (`fill`, `stroke`) | **Tier 3: Data / Cylinder / I/O** (`fill`, `stroke`) |
| :--- | :--- | :--- | :--- | :--- |
| `daylight` | `fill: '#eff6ff'`, `stroke: '#3b82f6'` | `fill: '#f0fdf4'`, `stroke: '#22c55e'` | `fill: '#faf5ff'`, `stroke: '#9333ea'` | `fill: '#fff7ed'`, `stroke: '#ea580c'` |
| `geist` | `fill: '#ffffff'`, `stroke: '#18181b'` | `fill: '#f4f4f5'`, `stroke: '#3f3f46'` | `fill: '#eff6ff'`, `stroke: '#1d4ed8'` | `fill: '#f5f3ff'`, `stroke: '#6d28d9'` |
| `flexoki` | `fill: '#f2f0e5'`, `stroke: '#403e3c'` | `fill: '#e2ece9'`, `stroke: '#24837b'` | `fill: '#efe9d5'`, `stroke: '#ad8301'` | `fill: '#e6e4d9'`, `stroke: '#205ea6'` |
| `latte` | `fill: '#ffffff'`, `stroke: '#4c4f69'` | `fill: '#e0f2f1'`, `stroke: '#179299'` | `fill: '#ffedd5'`, `stroke: '#fe640b'` | `fill: '#f3e8ff'`, `stroke: '#8839ef'` |
| `matcha` | `fill: '#ffffff'`, `stroke: '#2d4a3e'` | `fill: '#dcfce7'`, `stroke: '#15803d'` | `fill: '#fef9c3'`, `stroke: '#a16207'` | `fill: '#e0f2fe'`, `stroke: '#0369a1'` |
| `clay` | `fill: '#f5ebe6'`, `stroke: '#5c4033'` | `fill: '#e9f0ec'`, `stroke: '#3d6b58'` | `fill: '#f7eed6'`, `stroke: '#b45309'` | `fill: '#fae5dc'`, `stroke: '#c2410c'` |
| `swiss` | `fill: '#ffffff'`, `stroke: '#111111'` | `fill: '#eaeaea'`, `stroke: '#111111'` | `fill: '#fee2e2'`, `stroke: '#b91c1c'` | `fill: '#dbeafe'`, `stroke: '#1d4ed8'` |
| `midnight` | `fill: '#1e293b'`, `stroke: '#475569'` | `fill: '#0f292a'`, `stroke: '#14b8a6'` | `fill: '#2b2118'`, `stroke: '#f59e0b'` | `fill: '#1e1b4b'`, `stroke: '#6366f1'` |
| `obsidian` | `fill: '#141622'`, `stroke: '#26293d'` | `fill: '#112229'`, `stroke: '#22d3ee'` | `fill: '#231829'`, `stroke: '#c084fc'` | `fill: '#171c30'`, `stroke: '#818cf8'` |
| `graphite` | `fill: '#18181b'`, `stroke: '#3f3f46'` | `fill: '#1a2418'`, `stroke: '#84cc16'` | `fill: '#27272a'`, `stroke: '#71717a'` | `fill: '#172026'`, `stroke: '#38bdf8'` |
| `tokyonight` | `fill: '#24283b'`, `stroke: '#414868'` | `fill: '#1d2b2f'`, `stroke: '#73daca'` | `fill: '#2e2624'`, `stroke: '#ff9e64'` | `fill: '#292338'`, `stroke: '#bb9af7'` |
| `nordic` | `fill: '#3b4252'`, `stroke: '#4c566a'` | `fill: '#2e3d3b'`, `stroke: '#8fbcbb'` | `fill: '#3d3733'`, `stroke: '#ebcb8b'` | `fill: '#333b4d'`, `stroke: '#81a1c1'` |
| `rosepine` | `fill: '#26233a'`, `stroke: '#403d52'` | `fill: '#212e34'`, `stroke: '#9ccfd8'` | `fill: '#332732'`, `stroke: '#f6c177'` | `fill: '#2c253f'`, `stroke: '#c4a7e7'` |
| `monokai` | `fill: '#292524'`, `stroke: '#44403c'` | `fill: '#1f2922'`, `stroke: '#84cc16'` | `fill: '#30261c'`, `stroke: '#f59e0b'` | `fill: '#2b2129'`, `stroke: '#ec4899'` |
| `lagoon` | `fill: '#0b3548'`, `stroke: '#14536b'` | `fill: '#083b3e'`, `stroke: '#2dd4bf'` | `fill: '#102e4a'`, `stroke: '#38bdf8'` | `fill: '#16284c'`, `stroke: '#818cf8'` |
| `ember` | `fill: '#2d1519'`, `stroke: '#4a2026'` | `fill: '#2b1d12'`, `stroke: '#fb923c'` | `fill: '#361520'`, `stroke: '#fb7185'` | `fill: '#261726'`, `stroke: '#e879f9'` |

### 4.6 Background Lock & Separate Background Selection State Machine

| User Action in Dashboard | State Transition in `state.settings` | Visual Result on Canvas |
| :--- | :--- | :--- |
| **1. Initial Default State** | `theme: 'auto'`, `bgTheme: 'match'`, `bgLocked: false`, `nodeShading: 'shape'` | Clicking a Diagram Theme chip changes **both** the multi-shaded flow diagram and the canvas background together. |
| **2. User Clicks `Lock BG` Button (`#bg-lock`) to Lock** | `bgLocked` becomes `true`. If `bgTheme === 'match'`, resolve the currently visible background's `ThemeId` and set `state.settings.bgTheme = currentResolvedThemeId`. | The current background is now **locked**! Clicking any Flow Diagram Theme chip in `#theme-strip` changes **only** the nodes, node shades, edges, groups, and particles while the canvas background stays locked. |
| **3. User Clicks Any Background Swatch in `#bg-strip` (or chooses a background in `#bg-theme`)** | Sets `state.settings.bgTheme = chosenBgId` and automatically sets `state.settings.bgLocked = (chosenBgId !== 'match')`. | Immediately applies the chosen canvas background while leaving the flow diagram theme untouched. |
| **4. User Clicks `Lock BG` Button (`#bg-lock`) to Unlock (or clicks `Match` in `#bg-strip`)** | Sets `state.settings.bgLocked = false` and `state.settings.bgTheme = 'match'`. | The canvas background unlocks and snaps back to matching the active Flow Diagram Theme. |

## 5. Feature Specification B: Diagram Dashboard Grid & Automatic Removal on Export

1. **Settings Persistence (`src/app/storage.ts`):**
   Add optional `bgTheme?: BackgroundChoice`, `bgLocked?: boolean`, `nodeShading?: NodeShadeMode`, `cardMode?: CardStyleMode`, `grid?: boolean`, and `wordWrap?: boolean` to `Settings`.
2. **Pan & Zoom Infinite Canvas Grid (`drawGrid` in `src/render/draw.ts`):**
   * Base step `step = 24`, adaptive LOD (`while (scaledStep < 12) step *= 2; while (scaledStep > 96) step /= 2;`), screen-space modulo offsets `offsetX` / `offsetY`, single-pass batched hairline stroke in `theme.gridColor`.
3. **Automatic Grid Removal on Export:**
   * Only `src/app/render-loop.ts` passes `showGrid: Boolean(state.settings.grid)`.
   * `src/export/draw-frame.ts`, `src/export/png.ts`, and `src/render/svg.ts` always enforce `showGrid: false`, guaranteeing exports never contain grid lines.

## 6. Feature Specification C: Mermaid Script Writing Section Text Wrapping (Word Wrap) Toggle

1. In `src/app/code-editor.ts`, add `wordWrap?: boolean` to `CodeEditorEnv` and `setWordWrap(wrap: boolean): void` to `CodeEditor` using `const wrapConf = new Compartment()` and `EditorView.lineWrapping`.
2. In `index.html` & `src/app/ui.ts`, add `#text-panel-bar` with `<input id="editor-wrap" type="checkbox" />` above `#source` inside `#text-panel` and wire it to `editor.setWordWrap` and `saveSettings`.

## 7. Feature Specification D: De-Cluttering & Ergonomic Redesign of All Cramped Buttons and Controls

Apply the two-tier control deck layout (`.canvas-controls-tier.playback-tier` and `.canvas-controls-tier.theming-tier`), segmented `#toolbar > [role="group"]` pill clusters, tabular-num slider readouts (`min-width: 3.2ch`), `.control-pill-toggle` checkboxes, and sectioned `#props` inspector styling while preserving `.site-header` height (`>= 72px`), direct `#toolbar > [role="group"]` children for `src/app/narrow.ts`, and `flex-wrap: wrap; min-width: 0; max-width: 100%` for mobile no-overflow (`tests/e2e/mobile.spec.ts`).

## 8. Feature Specification E: Two Advanced Workflow & Pipeline Animation/Graphics Systems

Gati-Chitra will now support both reference video styles via two new `AnimStyle` modes (`'build'` and `'typewriter'`) and a **Card Style selector (`#card-mode`: `'classic' | 'pipeline' | 'workflow'`)** in `#canvas-controls`:

### 8.1 Style 1: "Food Delivery Pipeline" Style (`cardMode: 'pipeline'` + `anim.style: 'typewriter'`)

This reproduces every visual and kinetic detail of the **Food Delivery Pipeline** reference video:

1. **Choreographed Typewriter Reveal + Post-Build Flowing Dashes (`style: 'typewriter'` in `src/anim/anim.ts`):**
   * Extend `FrameState` in `src/core/types.ts` with:
     * `titleChars?: number;` (fraction `[0, 1]` of diagram title/subtitle characters revealed)
     * `nodeAlpha?: Record<string, number>;` (card box & icon fade/scale-in `[0, 1]`)
     * `nodeTextProgress?: Record<string, number>;` (fraction `[0, 1]` of node title/subtitle characters typed in)
     * `edgeGrow?: Record<string, number>;` (fraction `[0, 1]` of outgoing connector line drawn)
     * `edgeTextProgress?: Record<string, number>;` (fraction `[0, 1]` of edge label characters typed in)
   * **Exact Timeline Allocation across Normalized Phase $p \in [0, 1)$ in `frameState`:**
     * **Phase `0.00 -> 0.06` (Header Typewriter Reveal):** `titleChars = clamp(p / 0.06, 0, 1)`. The diagram title (e.g., `"Food Delivery Pipeline"`) types in character-by-character from left to right!
     * **Phase `0.06 -> 0.78` (Sequential Node-by-Node & Edge-by-Edge Choreography):**
       Order nodes topologically (by `computeDepths(scene.doc)` and appearance order in `scene.doc.nodes`, $k = 0, 1, \dots, K-1$). Each step $k$ gets an equal slice $[s_k, e_k]$ of `[0.06, 0.78]`:
       1. **First 35% of slice (`localP` in `[0, 0.35]`):** The node card box (`nodeAlpha[id] = clamp(localP / 0.30, 0, 1)`) and its inline left icon (or top `?` icon on diamonds) appear first while `nodeTextProgress[id]` is `0`!
       2. **25% to 75% of slice (`localP` in `[0.25, 0.75]`):** The node's primary title and subtitle **type in character-by-character** (`nodeTextProgress[id] = clamp((localP - 0.25) / 0.50, 0, 1)`)!
       3. **65% to 100% of slice (`localP` in `[0.65, 1.00]`):** Outgoing edges from this node grow toward their target (`edgeGrow[edge.id] = clamp((localP - 0.65) / 0.30, 0, 1)`) while the edge label above/beside the arrow **types in character-by-character** (`edgeTextProgress[edge.id] = clamp((localP - 0.70) / 0.30, 0, 1)`)!
     * **Phase `0.78 -> 1.00` (Post-Build Flowing Dashed Connectors — matching `00:20–00:24` of the video!):**
       Once `p >= 0.78`, all nodes and edges have `alpha = 1`, `textProgress = 1`, `edgeGrow = 1`, and `frameState` activates continuous flowing dashes (`dashOffset = 0 - ((p - 0.78) / 0.22) * ANIM.dashCycles * 24`) across all edges so the completed pipeline pulses with live data flow!

2. **Pipeline Card Graphics (`cardMode: 'pipeline'` in `src/render/draw.ts`):**
   When `options.cardMode === 'pipeline'`:
   * **Rounded-Corner Decision Diamonds (`node.shape === 'diamond'`):**
     Instead of sharp 90° corners, draw the 4 diamond vertices `(top, right, bottom, left)` using `ctx.arcTo(v1.x, v1.y, v2.x, v2.y, 10)` so every decision diamond has smooth `10px` rounded corners! Draw a `16px` circle with a centered `?` question mark near the top vertex inside the diamond in `st.stroke` color!
   * **Two-Line Bold Title + Muted Subtitle Typography inside Process Cards:**
     When a node has 2+ lines (or a subtitle separated by `\n` or ` — ` / `: `), render Line 1 in **bold `13.5px`** (`st.text`) and Line 2 in **regular `11px` muted text** (`ctx.globalAlpha = 0.62`), left-aligned next to the inline icon!
     When `frame.nodeTextProgress?.[node.id]` is `< 1`, slice the total character count across lines (`visibleChars = Math.floor(totalChars * progress)`) so Line 1 types in first, followed seamlessly by Line 2!
   * **Inline Left Semantic Line Icon (`18px × 18px` in `st.stroke` color):**
     Draw a clean vector icon on the left side inside rectangular/rounded cards (`box.center.x - box.width / 2 + 18, box.center.y`) matched from `node.label.toLowerCase()`:
     * `order` / `placed` / `cart` / `bag`: Shopping bag outline with handle arch.
     * `payment` / `auth` / `stripe` / `card`: Credit card rectangle with horizontal magnetic stripe.
     * `kitchen` / `prep` / `restaurant` / `food`: Fork & knife / utensils outline.
     * `courier` / `dispatch` / `delivery` / `truck`: Delivery van / truck outline with two wheels.
     * `declined` / `cancel` / `error` / `fail` / `timeout`: Circle or triangle with `!` / `×` mark.
     * `delivered` / `success` / `complete` / `approved`: Circle with `✓` checkmark.

### 8.2 Style 2: "Approval Process Workflow" Style (`cardMode: 'workflow'` + `anim.style: 'build'`)

This reproduces the dark **n8n / Zapier Approval Process Workflow** reference video:
1. **Cascade Build Animation (`style: 'build'` in `src/anim/anim.ts`):**
   * Reveals nodes stage-by-stage by topological depth $d = 0, 1, \dots, \text{maxD}$ (`nodeAlpha`), followed immediately by `edgeGrow` (`0 -> 1`) and continuous `dashOffset` on `true` (emerald `#10b981`) and `false` (coral `#ef4444`) dashed branch curves.
2. **Compact `64×64` Rounded-Square Icon Tiles (`cardMode: 'workflow'` in `src/render/draw.ts`):**
   * Draws a `64px × 64px` rounded square (`radius: 16px`) with a centered vector icon (Google Drive triangle, Form/Doc sheet, Approval/Slack cross, Git-branch condition fork, 2×2 Sheet grid, Envelope, or `+` circle), a top-left red-orange lightning badge (`⚡`) on root trigger nodes (`inDegree === 0`), a right-side output port ring (`o`), and the bold title + muted subtitle positioned **below** the square tile.

### 8.3 Built-In Starter Templates (`src/share/templates.ts`)

Add both reference diagrams to `src/share/templates.ts`:

1. **`"Food Delivery Pipeline"` Template:**
   * `title: Food Delivery Pipeline — From tap to doorstep`
   * `order["Order Placed\nCustomer App Request"] --> auth["Payment Auth\nStripe Gateway Sync"]`
   * `auth --> checkPay{"Payment\nAuthorized?"}`
   * `checkPay -->|Declined| declined["Payment Declined\nTransaction Failed"]`
   * `checkPay -->|Pre-Dispatch| dispatch["Courier Dispatch\nProximity Matching"]`
   * `checkPay -->|Success| kitchen["Kitchen Preparation\nRestaurant Processing"]`
   * `dispatch --> assigned{"Courier\nAssigned?"}`
   * `assigned -->|Found| kitchen`
   * `assigned -->|Timeout| fail["Dispatch Failure\nNo Courier Found"]`
   * `kitchen --> onTime{"Prepared\non Time?"}`
   * `onTime -->|Issue| cancelled["Order Cancelled\nItem Out of Stock"]`
   * `onTime -->|En Route| delivered["Order Delivered\nCustomer Handover"]`
2. **`"Approval Workflow"` Template:**
   * The 7-stage n8n Approval Process graph from **Section 8.2**.

## 9. Step-by-Step Atomic Execution Plan for the Coding Agent

Follow these 9 sequential phases. Complete and verify each phase before starting the next.

### Phase 1: Update Core Types (`src/core/types.ts`)

1. Expand `ThemeId` to all 16 theme IDs.
2. Expand `AnimStyle` to `'pulse' | 'traffic' | 'dash' | 'build' | 'typewriter' | 'off'`.
3. Add `titleChars?: number`, `nodeAlpha?: Record<string, number>`, `nodeTextProgress?: Record<string, number>`, `edgeGrow?: Record<string, number>`, and `edgeTextProgress?: Record<string, number>` to `FrameState`.
4. Add `BackgroundChoice`, `NodeShadeMode` (`'shape' | 'semantic' | 'node' | 'off'`), `CardStyleMode` (`'classic' | 'pipeline' | 'workflow'`), and `NodeShade`.
5. Add `nodeShades`, `shadingMode?`, `gridColor`, and `titleText?` to `Theme`.
6. Add `showGrid?: boolean` and `cardMode?: CardStyleMode` to `DrawOptions`.

### Phase 2: Implement the 16 Modern Minimal Themes, 4-Tier `nodeShades` & `composeTheme` (`src/render/themes.ts`)

1. Populate all 16 themes in `THEMES` using **Section 4.4** and **Section 4.5**.
2. Export `BACKGROUND_CHOICES` and `composeTheme(diagramChoice, bgChoice, scheme, shadingMode)`.

### Phase 3: Upgrade `nodeStyle` & `edgeStyle` (`src/render/style.ts`)

1. Implement `shapeShadeTier`, `semanticStatusShade` (Blue Process, Purple Decision, Orange Dispatch, Green Success, Red Failure/Declined), and `hashNodeId` in `src/render/style.ts` and wire them into `nodeStyle(node, theme)`.
2. In `edgeStyle(edge, theme)`, auto-color `true`/`yes`/`approved` edge labels with `#10b981` + `[6, 4]` dash, and `false`/`no`/`rejected` edge labels with `#ef4444` + `[6, 4]` dash when not overridden by `edge.style.stroke`.

### Phase 4: Implement `'build'` & `'typewriter'` Animations and Starter Templates (`src/anim/anim.ts` & `src/share/templates.ts`)

1. In `src/anim/anim.ts`, add `'build'` and `'typewriter'` mode support inside `frameState(scene, settings, phase)` using **Section 8.1** and **Section 8.2**.
2. In `src/share/templates.ts`, add both `"Food Delivery Pipeline"` and `"Approval Workflow"` templates from **Section 8.3**.

### Phase 5: Persist New Settings (`src/app/storage.ts`) & Editor Word Wrap (`src/app/code-editor.ts`)

1. In `src/app/storage.ts`, add `bgTheme`, `bgLocked`, `nodeShading`, `cardMode`, `grid`, and `wordWrap` to `Settings`, and include `'build'` and `'typewriter'` in valid `anim.style` values in `loadSettings`.
2. In `src/app/code-editor.ts`, add `wordWrap?: boolean` to `CodeEditorEnv` and `setWordWrap(wrap: boolean): void` using a CodeMirror `Compartment` and `EditorView.lineWrapping`.

### Phase 6: Implement `drawGrid`, Typewriter/Build Rendering, Rounded Diamonds & Card Modes (`src/render/draw.ts`, `src/render/draw-edges.ts`, `src/render/svg.ts`)

1. In `src/render/draw.ts`:
   * Implement `drawGrid` (called only when `options.showGrid && !options.transparent`).
   * Slice diagram title by `frame.titleChars` when defined.
   * Apply `frame.nodeAlpha` and `frame.nodeTextProgress` (character-by-character typewriter reveal).
   * Render rounded-corner diamonds (`arcTo` radius `10px`) + top `?` icon, inline left pipeline icons + two-line bold/muted text (`cardMode === 'pipeline'`), and `64×64` n8n icon tiles + `⚡` trigger badge (`cardMode === 'workflow'`).
2. In `src/render/draw-edges.ts`:
   * Apply `frame.edgeGrow` progressive path drawing, `frame.edgeTextProgress` typewriter edge labels, and post-build flowing dashes (`frame.dashOffset`).
3. In `src/app/render-loop.ts` and export callers (`src/export/draw-frame.ts`, `src/app/ui.ts`):
   * Pass `composeTheme(...)`, `cardMode: state.settings.cardMode ?? 'classic'`, and enforce `showGrid: false` on all exports.

### Phase 7: Upgrade & De-Clutter Dashboard, Toolbar, Properties & Editor UI (`index.html`, `src/app/anim-controls.ts`, `src/app/ui.ts`, `src/app/style.css`)

1. Add `#text-panel-bar` with `#editor-wrap` inside `#text-panel` in `index.html`.
2. Add `<option value="build">build</option>` and `<option value="typewriter">typewriter</option>` to `#anim-style` in `index.html`.
3. Structure `#canvas-controls` into the two ergonomic tiers (`.playback-tier` and `.theming-tier`) with `#card-mode` (`Classic` | `Pipeline` | `Workflow`), `#node-shading` (`By shape` | `Semantic` | `By node` | `Uniform`), `#canvas-grid` (`Grid` pill toggle), `#theme-strip`, `#bg-lock`, and `#bg-strip`.
4. Wire all controls in `src/app/ui.ts` and `src/app/anim-controls.ts`, and apply the ergonomic CSS rules in `src/app/style.css`.

### Phase 8: Write Unit & Integration Tests

1. Add unit tests for all 16 themes, `composeTheme`, `nodeStyle` (`'shape'`, `'semantic'`, `'node'`, `'off'`), `edgeStyle` semantic `true`/`false` branches, `frameState` with `style: 'build'` and `style: 'typewriter'`, storage persistence (`bgTheme`, `bgLocked`, `nodeShading`, `cardMode`, `grid`, `wordWrap`), `editor.setWordWrap`, and `drawExportFrame` grid exclusion.

### Phase 9: Full Validation & Quality Gate Checklist

| Step | Command | Expected Outcome |
| :--- | :--- | :--- |
| **1. Typecheck & Build** | `npm run build` | `tsc --noEmit` and `vite build` succeed with zero errors |
| **2. Linter** | `npm run lint` | `oxlint` passes with 0 warnings and 0 errors |
| **3. Unit Tests** | `npm run test` | All Vitest unit test suites pass (`0 failed`) |
| **4. E2E Tests (if browser installed)** | `npm run test:e2e` | Playwright tests in `tests/e2e/` pass |

## 10. Common Pitfalls & Troubleshooting Guide for the Coding Agent

| Symptom / Error | Root Cause | Exact Fix |
| :--- | :--- | :--- |
| Selecting `build` or `typewriter` animation style resets to `pulse` on page reload | `loadSettings` in `src/app/storage.ts` only checked `['pulse', 'traffic', 'dash', 'off']` | Add `'build'` and `'typewriter'` to the allowed `animRaw?.style` array in `loadSettings()` in `src/app/storage.ts`! |
| Existing unit tests calling `nodeStyle(node, THEMES.daylight)` fail | `THEMES.daylight` had `shadingMode` hardcoded on the static object | Keep `shadingMode` `undefined` on the raw `THEMES` objects in `src/render/themes.ts`, and only attach `shadingMode` inside `composeTheme(...)`! |
| `tests/e2e/mobile.spec.ts` fails on `scrollWidth <= innerWidth` | A new control strip (`#theme-strip`, `#bg-strip`, or `.slider-group`) has `white-space: nowrap` without `flex-wrap: wrap` or `min-width: 0` | Ensure `.theme-strip`, `.bg-strip`, `.theme-row`, and `.canvas-controls-tier` all have `flex-wrap: wrap; min-width: 0; max-width: 100%;`! |
| `src/app/narrow.test.ts` fails after editing `#toolbar` | Added wrapper `<div>` elements around `#toolbar > [role="group"]` | Keep `<div role="group">` elements as direct children of `#toolbar` and style them purely via `#toolbar > [role="group"]` in `src/app/style.css`. |
| `oxlint` fails with missing return type warning | New exported function lacks an explicit TypeScript return type | Always add explicit return types (`: Theme`, `: 0 \| 1 \| 2 \| 3`, `: number`, `: void`) to every exported function. |
