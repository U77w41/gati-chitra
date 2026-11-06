
# Gati-chitra: More Mermaid Diagram Types Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use the superpowers `executing-plans` skill (Gemini CLI, Antigravity CLI, Freebuff CLI) or `superpowers:subagent-driven-development` (Claude Code). Steps use checkbox (`- [ ]`) syntax for tracking. If your tool has no skills, follow Part 0 of this document instead; it holds the same rules.

**Goal:** Teach Gati-chitra to read, draw, animate, theme, export and visually edit twelve more Mermaid diagram types (sequence, class, state, ER, requirement, use case, architecture, block, gitGraph, journey, timeline, mindmap) without changing how flowcharts behave.

**Architecture:** Every new diagram type is an *engine*: a parser that turns its Mermaid text into the existing `ParsedDoc` (nodes, edges, groups), an optional layout that produces the existing `SceneLayout`, and a set of text-patching operations. The canvas renderer, SVG export, animations, themes, present mode, PNG/GIF/video export and hit testing already work on `ParsedDoc` + `SceneLayout`, so they keep working for every engine. A small set of optional fields (node compartments, icons, edge markers, end labels, colour indexes, decorations, animation stages) covers what flowcharts never needed. Engines are loaded on demand as separate JavaScript chunks, so the initial bundle stays under its 150 KB budget.

**Tech Stack:** unchanged. TypeScript (strict), Vite, Vitest, Playwright, `@dagrejs/dagre`, CodeMirror 6, `gifenc`, `mediabunny`, `@fontsource/lato`. **No new dependencies.**

**Spec:** this document. The owner asked for one file, so the agreed design is in Part 1. For every contract this plan does not change, the older plans still apply: `docs/superpowers/plans/2026-11-02-gati-chitra.md` (v0.1) and `docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md` (v0.2 to v0.6).

---

## Start here

1. Read `AGENTS.md`, then this document's "Start here", "Running this plan", Part 0, Part 1, Part 2 and Part 3. Read Parts 4 to 8 when a task names them.
2. Run `git log --oneline` and read `DECISIONS.md` and `handoff.md`. This plan's tasks are numbered **64 to 103**. They continue after Task 63 in `DECISIONS.md`. A task is done when its checkboxes in this file are ticked **and** `handoff.md` or `git log` says so. Start with the first task that is not done.
3. Run `npm ci && npm test && npm run lint && npm run build && npm run check:dist`. All five must pass before Task 64. If one fails, stop and use the `systematic-debugging` skill. Do not start the plan on a broken tree.

## Running this plan

The owner runs this plan in Gemini CLI, Antigravity CLI or Freebuff CLI (models such as Gemini or DeepSeek). This section tells the owner what to set up and tells the agent how to work.

### For the owner: once, before the first session

1. Install the skills as `GEMINI.md` and `AGENTS.md` section 6 describe. Check that `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion` and `humanizer` are available. If your tool cannot install skills, the agent follows Part 0 instead.
2. Install the Playwright browsers once: `npx playwright install chromium firefox webkit` (on Linux add `--with-deps`).
3. Work on a branch: `git switch -c diagrams`. Merging and pushing stay with you.

### For the owner: the prompt that starts a milestone

Paste this, changing the milestone. One milestone per session keeps the agent's context small. Delete the sentence in brackets if you want the changes left uncommitted.

```
Read AGENTS.md, then plan.md: the sections "Start here", "Running this plan", Part 0, Part 1, Part 2 and Part 3. Use the superpowers executing-plans skill. Do milestone D1 only (Tasks 64 to 74), one task at a time, in order, exactly as written, with test-driven-development for every task. [Commit after each task with the commit message the task gives.] Before you stop, update handoff.md as AGENTS.md section 1 says. Stop after the milestone's release task and list the by-hand items of its Part 10 checklist.
```

### For the owner: the prompt that resumes after a restart or a context reset

```
Read AGENTS.md and the "Running this plan" section of plan.md. Run git log --oneline, read DECISIONS.md and handoff.md, and find the first task of the current milestone whose checkboxes in plan.md are not all ticked. Continue from there with the executing-plans skill. Do not redo a finished task.
```

### For the agent: how to work

1. **Read a task fully before you start it.** Search for its heading (for example `### Task 70:`) and read to the next `### Task`. Read every Part the task names. Do not start the next task early.
2. **Read a file before you change it.** Open the current file from disk every time. Never edit from memory, never guess a line number, a function name or an import path. If the plan names a function that does not exist, stop and check whether an earlier task was skipped.
3. **Follow the steps in order:** write the test, run it and see it fail, implement, run it and see it pass, run the task's full command list, then commit (only if the owner's prompt allows it) with the exact message given. If a test you were told to write passes before you implement, the test is wrong: fix the test, not the plan.
4. **Keep edits small.** Change one function at a time and run `npx tsc --noEmit` after each file you change. Type errors tell you every place a new union member must be handled.
5. **Before each commit,** run `git status`. Only the task's files may be listed. Remove scratch files you made.
6. **Never start a command that does not exit.** Do not run `npm run dev` or `npm run preview`. Playwright starts and stops its own server. `npm run test:e2e` takes several minutes; wait for its summary.
7. **Do not change these files unless a task names them:** `plan.md` (except ticking its checkboxes), `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, the older plans. **Never change `SECURITY.md`.**
8. **Never push, merge, rebase, force anything, or delete a branch or tag.** Create tags only in release tasks, locally, and only if the owner's prompt allows commits.
9. **Copy exact values** (constants, messages, regular expressions, file names, commit messages) character for character. Where a task says "choose", choose the simplest option and add one line to `DECISIONS.md`: `Task N: chose X because Y`.
10. **When stuck:** if a test fails twice for the same reason, use the `systematic-debugging` skill. If it still fails, write `Task N: blocked: <what fails, the command, the error>` in `DECISIONS.md`, update `handoff.md`, and stop. Do not skip the task, do not weaken a test, do not delete a test.
11. **At a milestone's end,** finish the release task, update `handoff.md`, then stop. List the by-hand items from Part 10 for the owner.

## Part 0. Rules for the implementer

These rules repeat the ones in the older plans that matter here, plus new ones. They apply to every task.

1. **Flowcharts must not change.** Every existing test is a contract. You may change an existing test only where a task names the exact test and the exact change. A failing existing test means your code is wrong.
2. **Tests first.** For every task: write the failing test, run it, see the failure, write the code, see it pass.
3. **Files stay under 300 lines.** `src/repo.test.ts` enforces it for every non-test `.ts` file in `src/`. When a file you must change is near the limit, the task tells you what to split out first. If a file still grows past 280 lines, split by responsibility into a new file and add a line to `DECISIONS.md`.
4. **No `any`.** `npm run lint` denies it. Use `unknown` and narrow, or a precise type.
5. **Layer rules.** `src/core/` holds types and constants only. `src/diagrams/`, `src/mermaid/`, `src/layout/`, `src/anim/` and `src/render/` are pure: no `document`, no `window`, no `localStorage`, no network. DOM code lives in `src/app/`.
6. **No new dependencies, no network at runtime.** Icons are drawn with canvas and SVG primitives listed in Part 7. Mermaid icon packs (`logos:aws-lambda` and the like) are not loaded.
7. **Bundle budgets.** Initial JavaScript at most **150 KB gzip**; each lazy chunk at most **80 KB gzip** (`npm run check:dist`). Engine code is only ever imported with `import()` from `src/diagrams/registry.ts`. Never import a file from `src/diagrams/<kind>/` statically in `src/app/`, `src/render/`, `src/layout/` or `src/anim/`.
8. **Diagnostics.** Line numbers in `Diagnostic` are 1-based. A line the parser does not understand gets a `warning` with `MESSAGES.unknownLine` and is kept as written; it never makes `ok` false. Only `error` diagnostics make `ok` false.
9. **Prose.** Run the humanizer on `README.md` and any docs page before committing it. Never on this plan, code, tests or configuration.
10. **Commands** (run from the repository root):

```
npm test              # unit tests (Vitest)
npm run lint          # oxlint
npm run build         # type check (app and service worker) and production build
npm run check:dist    # checks the built site (budgets, base path)
npm run test:e2e      # browser tests (Playwright)
```

Run `npm test && npm run lint` after every task. Tasks that change the page also run `npm run build && npm run check:dist && npm run test:e2e`; the task says so.

## Global Constraints

- Initial JavaScript budget: **150 KB gzip**. Lazy chunk budget: **80 KB gzip**. Both checked by `scripts/check-dist.mjs`.
- Source files under **300 lines**.
- Limits per diagram, all types: **300 nodes**, **600 edges**, **20000 characters** (`LIMITS.maxNodes`, `LIMITS.maxEdges`, `LIMITS.maxTextChars`, with the existing messages `MESSAGES.tooManyNodes`, `MESSAGES.tooManyEdges`, `MESSAGES.textTooLong`).
- Site stays static on GitHub Pages; no server, no runtime third-party requests, no analytics, no AI or chat feature.
- Every diagram type works offline after the first visit: the service worker already precaches every emitted chunk (`scripts/vite-plugins.*` → `precacheUrls`), so engine chunks are covered with no change.
- Card styles (`classic`, `pipeline`, `workflow`) apply to flowcharts only. Other types always draw as `classic`.
- Supported browsers: current and previous major versions of Chrome, Edge, Firefox and Safari.

## Review Focus

These five situations are the most likely to hurt a user, and no single feature test covers them by accident. Each one has a test in the task named after it.

1. **Typing a header character by character** (`s`, `se`, … `sequenceDiagram`) while an engine chunk is still loading: the last good picture stays, no error sticks, and the finished text is drawn once the chunk arrives. If the user has already switched back to a flowchart, the flowchart stays. → Task 66, test `reparses the current text, not the text that started the load`.
2. **First use of a new type while offline with the chunk not cached:** the user sees `MESSAGES.diagramLoadFailed(name)` on line 1, the app stays usable, and flowcharts still work. → Task 66, test `reports a load failure as an error diagnostic`.
3. **Visual edits on a diagram that has errors:** every engine refuses ops with `MESSAGES.fixTextFirst` while `ok` is false, so a bad text is never patched further. → Task 67, test `guardOk refuses ops on a document with errors`, reused by every engine's ops test.
4. **Renaming with awkward characters** (`"`, `:`, `#`, `|`, a new line) in every type: the result still parses, with the same node count, and shows the new label. → every "edit ops" task has the test `rename with awkward characters keeps the diagram valid`.
5. **Switching between a flowchart and another type** keeps toolbar and properties controls consistent: after going back to a flowchart, the shape list, the arrow list and every button are exactly as before. → Task 73 builds the controls; Task 76 has the browser test `restores the flowchart controls after another type` (it needs a real second type, which arrives in D2).

---

## Part 1. What changes (the agreed design)

### 1.1 Constraints the owner set

- Cover the Mermaid types that are feasible; skip the ones that are not, and say why.
- Existing theming and animation must work on the new types.
- Nothing that works today may break.
- **Full visual editing** on the canvas for the new types (add, connect, rename, delete, move where the layout allows it), each edit written back to the Mermaid text, exactly like flowcharts.
- The plan is executed by less capable agents, so every decision is written down.

### 1.2 Which types are in, which are out

Mermaid's documentation (version 12.3.0, checked 2026-11-05) lists about thirty diagram types. Gati-chitra's value is animated arrows on a node-and-arrow picture, so a type is in when it is a picture of things joined by lines, its syntax is documented and stable, and it can be laid out with dagre or a short custom algorithm.

| Type                                                            | Header keyword(s)                                                                                              | Verdict                                                                  | Layout                      | Milestone |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------- | --------- |
| State                                                           | `stateDiagram-v2`, `stateDiagram`                                                                          | **In**                                                             | dagre (shared)              | D2        |
| Class                                                           | `classDiagram`, `classDiagram-v2`                                                                          | **In**                                                             | dagre (shared)              | D2        |
| Entity relationship                                             | `erDiagram`                                                                                                  | **In**                                                             | dagre (shared)              | D2        |
| Requirement                                                     | `requirementDiagram`                                                                                         | **In**                                                             | dagre (shared)              | D3        |
| Use case                                                        | `usecase-beta`                                                                                               | **In** (beta in Mermaid)                                           | dagre (shared)              | D3        |
| Architecture                                                    | `architecture-beta`                                                                                          | **In** (beta in Mermaid; built-in icons only)                      | grid from edge sides        | D3        |
| Sequence                                                        | `sequenceDiagram`                                                                                            | **In**                                                             | custom (columns and rows)   | D4        |
| Git graph                                                       | `gitGraph`                                                                                                   | **In**                                                             | custom (lanes)              | D4        |
| Block                                                           | `block`, `block-beta`                                                                                      | **In**                                                             | custom (grid)               | D5        |
| Mindmap                                                         | `mindmap`                                                                                                    | **In**                                                             | custom (two-sided tree)     | D5        |
| User journey                                                    | `journey`                                                                                                    | **In**                                                             | custom (task row and score) | D5        |
| Timeline                                                        | `timeline`                                                                                                   | **In**                                                             | custom (period columns)     | D5        |
| Gantt                                                           | `gantt`                                                                                                      | Out: date arithmetic, calendars and axes; no arrows to animate           | –                          | –        |
| Pie, Quadrant, XY chart, Radar, Treemap, Packet, Venn           | `pie`, `quadrantChart`, `xychart-beta`, `radar-beta`, `treemap-beta`, `packet-beta`, `venn-beta` | Out: charts, not node-and-arrow pictures; the animations do not apply    | –                          | –        |
| Sankey                                                          | `sankey-beta`                                                                                                | Out: needs a flow-layout algorithm (d3-sankey) the project does not have | –                          | –        |
| Kanban                                                          | `kanban`                                                                                                     | Out: no arrows; nothing to animate                                       | –                          | –        |
| C4                                                              | `C4Context`, `C4Container`, `C4Component`, `C4Dynamic`, `C4Deployment`                               | Out for now: a large function-call syntax; a candidate after D5          | –                          | –        |
| ZenUML                                                          | `zenuml`                                                                                                     | Out: rendered by a separate external library                             | –                          | –        |
| Swimlanes, Event modeling, Ishikawa, Wardley, Cynefin, TreeView | new betas                                                                                                      | Out: new, still changing, little documentation                           | –                          | –        |

An "Out" type gets a clear error on its header line (`MESSAGES.unsupportedDiagram`), never a crash.

### 1.3 How it fits together

```
text ──► detectKind(text)                       src/diagrams/detect.ts       (main bundle)
          │ 'flowchart' / 'unknown' ──► parseMermaid (unchanged)            src/mermaid/parse.ts
          │ 'unsupported' ──► error doc (MESSAGES.unsupportedDiagram)
          │ other kind ──► getEngine(kind)?                                 src/diagrams/registry.ts
          │                  yes ──► engine.parse(text) ──► ParsedDoc (kind set)
          │                  no  ──► start import(), return "loading" doc (ok false, info)
          ▼
ParsedDoc ──► buildScene(doc)                                               src/layout/scene.ts
          │   engine.layout? ──► engine.layout(doc, measure) ──► SceneLayout (with decorations)
          │   otherwise      ──► layoutDoc + routeEdges + computeBounds (unchanged dagre path)
          ▼
Scene ──► drawScene / renderSvg / frameState / buildSteps / hitTest (extended, not replaced)

visual edit ──► applyAnyOp(text, op) ──► flowchart: applyOp (unchanged) | engine.applyOp(text, op)
```

### 1.4 Design decisions

1. **Lower into the existing model.** Every engine produces `ParsedDoc` + `SceneLayout`. Nothing in rendering, animation or export branches on the diagram type except the few places this plan names.
2. **Optional fields only.** Every new field on an existing type is optional. A flowchart never sets them, so flowchart output is identical. `ParsedDoc.kind` is optional too; `undefined` means `'flowchart'`.
3. **Lazy engines.** Each engine is its own chunk, loaded by `import()` the first time its header is seen. While it loads, the app keeps the last picture and shows an info diagnostic. When it arrives, the app parses the *current* text again.
4. **Shared dagre path.** State, class, ER, requirement and use case diagrams have no `layout` function; the existing `layoutDoc` lays them out. New node content (compartments, icons, fixed sizes) is handled inside `sizeNode`.
5. **Custom layouts return complete layouts.** Sequence, gitGraph, block, mindmap, journey, timeline and architecture compute node boxes, edge paths, group boxes, decorations and bounds themselves.
6. **Decorations** are non-interactive drawing primitives (lines, rectangles, text) for things that are not nodes or edges: sequence lifelines, activation bars, loop/alt frames, journey and timeline section bands, git lanes and tags. They are coloured by role from the theme, so every theme and the light/dark scheme apply.
7. **Colour index.** Nodes, edges and decorations may carry `colorIndex`. When the node-shading setting is not `off`, they take colour `theme.nodeShades[colorIndex % 4]`. That is how git branches, journey sections, timeline sections and mindmap branches get distinct, theme-consistent colours.
8. **Animation stages.** By default, animation order is the existing topological depth. Sequence, gitGraph, journey and timeline set `ParsedDoc.stages` so that pulse, build, typewriter and present mode follow message, commit or time order instead.
9. **Editing through capabilities.** Each engine declares `EditCaps` (add, connect, rename, delete, move, shape, style, edge variant, reverse). The canvas controller, toolbar and properties panel enable only what the engine supports. Flowcharts declare everything they support today, so nothing changes for them.
10. **Edits are text patches, located by spans.** Parsers record where each label sits in the text (`Span`) and which lines belong to each node (`refLines`). Engine ops patch those spans and lines through the shared helpers in `src/diagrams/common/edit.ts`. Moves use the existing `%% studio:pos` comment lines, which are valid Mermaid comments in every diagram type.
11. **Mermaid styling that the parsers read:** `style`, `classDef`, `class` and `:::` where the type supports them in Mermaid. Colours a user writes win over theme colours, as they do for flowcharts.

### 1.5 Not in scope

The "Out" types in 1.2; icon packs and images (network); `click` callbacks and links in the new types (an info diagnostic); Mermaid `%%{init}%%` configuration (ignored as today); sequence `create`/`destroy` participants and participant menus (drawn as normal participants, with an info diagnostic); class lollipop interfaces (drawn as a plain link, with an info diagnostic); git `cherry-pick` editing; any new runtime dependency.

---

## Part 2. Constants and messages (exact values)

### 2.1 Additions to `LAYOUT` in `src/core/constants.ts` [Task 65]

Add these keys inside the existing `LAYOUT` object, after `titleH`:

```ts
  sectionFontSize: 14,
  sectionLineH: 18,
  sectionPadX: 12,
  sectionPadY: 6,
  sectionColGap: 12,
  sectionMinH: 12,
  iconSize: 32,
  iconGap: 6,
  noteFold: 10,
  actorFigureH: 56,
  actorMinW: 40,
  ellipseScale: 1.3,
  cloudScale: 1.35,
  bangScale: 1.4,
  blockArrowHead: 40,
  endLabelFontSize: 12,
  endLabelAlong: 18,
  endLabelAcross: 12,
```

### 2.2 New constant groups in `src/core/constants.ts` [Task 65]

```ts
export const SEQ = {
  participantGap: 40,
  minParticipantW: 100,
  participantH: 44,
  firstRowGap: 24,
  rowH: 44,
  selfRowH: 56,
  selfLoopW: 48,
  messageLabelPad: 16,
  labelLift: 12,
  noteGap: 10,
  noteRowGap: 12,
  frameHeaderH: 28,
  framePad: 12,
  frameSide: 60,
  frameInset: 8,
  dividerH: 28,
  activationW: 10,
  activationStep: 4,
  bottomPad: 24,
  boxPad: 12,
} as const;

export const GIT = {
  laneGap: 60,
  commitGap: 60,
  labelColW: 110,
  commitD: 20,
  highlightD: 24,
  mergeD: 22,
  tagLift: 22,
  captionDrop: 22,
} as const;

export const ARCH = { gapX: 80, gapY: 60, junctionD: 12 } as const;

export const MINDMAP = { levelGap: 80, siblingGap: 16 } as const;

export const BLOCK = { gap: 16, pad: 12, minUnitW: 80 } as const;

export const JOURNEY = {
  legendW: 140,
  taskMinW: 150,
  taskGap: 20,
  sectionH: 36,
  cardGap: 10,
  faceGap: 40,
  scoreStep: 36,
  faceD: 36,
  actorRowH: 20,
  actorDot: 12,
} as const;

export const TIMELINE = { colMinW: 150, colGap: 24, sectionH: 36, rowGap: 20, eventGap: 16 } as const;
```

### 2.3 Additions to `MESSAGES` [Task 65]

Change the value of `notFlowchart` (keep the key) and add the new keys:

```ts
  notFlowchart: "Not a diagram this app can read. Start with a type such as 'flowchart TD' or 'sequenceDiagram'.",
  unsupportedDiagram: (name: string) => `${name} is not supported yet. Supported types: flowchart, sequence, class, state, ER, requirement, use case, architecture, block, gitGraph, journey, timeline and mindmap.`,
  loadingDiagram: (name: string) => `Loading support for ${name} diagrams.`,
  diagramLoadFailed: (name: string) => `Support for ${name} diagrams could not be loaded. Check the connection, then reload the page.`,
  opUnsupported: 'This change is not available for this diagram type. Edit the text instead.',
  syntaxIgnored: (what: string) => `${what} is not supported; it is ignored.`,
  unclosedBlock: (keyword: string) => `"${keyword}" is not closed with end.`,
  strayBlockEnd: '`end` without a matching block.',
  unclosedBrace: (name: string) => `"${name}" is not closed with }.`,
  crossScope: 'These states are in different composite states. Connect them in the text.',
  gitBranchExists: (name: string) => `Branch "${name}" already exists.`,
  gitNoBranch: (name: string) => `Branch "${name}" does not exist.`,
  gitMergeInvalid: (name: string) => `Branch "${name}" cannot be merged here.`,
  gitNoCommit: (id: string) => `Commit "${id}" does not exist.`,
  journeyScore: 'A journey score must be a whole number from 1 to 5.',
  mindmapTwoRoots: 'A mindmap has one root. Indent this line under the root.',
  mindmapCycle: 'A node cannot be moved under its own branch.',
  iconFallback: (name: string) => `Icon "${name}" is not built in; a generic icon is drawn.`,
  nameTaken: (name: string) => `"${name}" is already used.`,
```

### 2.4 Kind names, header patterns and unsupported names [Task 66]

`src/diagrams/kinds.ts` (main bundle, no engine code):

```ts
export const KIND_NAMES: Record<DiagramKind, string> = {
  flowchart: 'Flowchart', sequence: 'Sequence', class: 'Class', state: 'State', er: 'ER',
  requirement: 'Requirement', usecase: 'Use case', architecture: 'Architecture', block: 'Block',
  gitgraph: 'Git graph', journey: 'User journey', timeline: 'Timeline', mindmap: 'Mindmap',
};

// Tested in order; the first match wins. Each pattern is matched against the trimmed header line.
export const HEADER_PATTERNS: [DiagramKind, RegExp][] = [
  ['flowchart', /^(flowchart|graph)\b/],
  ['sequence', /^sequenceDiagram\s*$/],
  ['class', /^classDiagram(-v2)?\s*$/],
  ['state', /^stateDiagram(-v2)?\s*$/],
  ['er', /^erDiagram\s*$/],
  ['requirement', /^requirementDiagram\s*$/],
  ['usecase', /^usecase-beta\s*$/],
  ['architecture', /^architecture-beta\s*$/],
  ['block', /^block(-beta)?\s*$/],
  ['gitgraph', /^gitGraph(\s+(LR|TB|BT))?\s*:?\s*$/],
  ['journey', /^journey\s*$/],
  ['timeline', /^timeline(\s+(LR|TD))?\s*$/],
  ['mindmap', /^mindmap\s*$/],
];

export const UNSUPPORTED_HEADERS: [RegExp, string][] = [
  [/^gantt\b/, 'Gantt chart'], [/^pie\b/, 'Pie chart'], [/^quadrantChart\b/, 'Quadrant chart'],
  [/^xychart(-beta)?\b/, 'XY chart'], [/^sankey(-beta)?\b/, 'Sankey diagram'],
  [/^packet(-beta)?\b/, 'Packet diagram'], [/^kanban\b/, 'Kanban board'], [/^radar(-beta)?\b/, 'Radar chart'],
  [/^treemap(-beta)?\b/, 'Treemap'], [/^C4(Context|Container|Component|Dynamic|Deployment)\b/, 'C4 diagram'],
  [/^zenuml\b/, 'ZenUML diagram'], [/^venn(-beta)?\b/, 'Venn diagram'],
];
```

Note: the `flowchart` pattern only needs to recognise the header word; `parseMermaid` still validates the direction exactly as today.

---

## Part 3. Data model changes (`src/core/types.ts`) [Task 65]

All additions are optional unless marked. Add them exactly as written.

```ts
export type DiagramKind =
  | 'flowchart' | 'sequence' | 'class' | 'state' | 'er' | 'requirement' | 'usecase'
  | 'architecture' | 'block' | 'gitgraph' | 'journey' | 'timeline' | 'mindmap';

// The 20 shapes flowcharts can write. The toolbar and the flowchart text ops only ever use these.
export type FlowShapeKind =
  | 'rect' | 'round' | 'stadium' | 'circle' | 'diamond'
  | 'hexagon' | 'parallelogram' | 'parallelogramAlt' | 'cylinder' | 'subroutine'
  | 'trapezoid' | 'trapezoidAlt' | 'doubleCircle' | 'asymmetric' | 'document'
  | 'smallCircle' | 'filledCircle' | 'framedCircle' | 'forkBar' | 'text';
export type ExtraShapeKind = 'note' | 'actor' | 'ellipse' | 'cloud' | 'bang' | 'blockArrow';
export type ShapeKind = FlowShapeKind | ExtraShapeKind;   // replaces the old ShapeKind union

export type MarkerKind =
  | 'none' | 'arrow' | 'circle' | 'cross' | 'openArrow' | 'triangle' | 'diamond' | 'diamondFilled'
  | 'erOne' | 'erZeroOrOne' | 'erOneOrMore' | 'erZeroOrMore';

export type IconName =
  | 'cloud' | 'database' | 'disk' | 'internet' | 'server'
  | 'faceHappy' | 'faceNeutral' | 'faceSad' | 'cross';

export type BlockArrowDir = 'right' | 'left' | 'up' | 'down' | 'x' | 'y';

export interface Span { line: number; from: number; to: number } // 0-based line; character offsets in that line; `to` is exclusive

export interface NodeSection {
  rows: string[][];                       // each row is one or more cells; one cell = one text
  align: 'center' | 'left';
  weight: 'bold' | 'normal' | 'italic';
  divider: boolean;                       // draw a line above this section
}
export interface SectionBox extends NodeSection {
  top: number;                            // offset from the top of the node box
  height: number;
  colX: number[];                         // x offset of each column from the left of the node box
}

export type DecorationRole =
  | 'lifeline' | 'activation' | 'frame' | 'frameDivider' | 'band' | 'lane' | 'tag' | 'caption' | 'axis';
export type Decoration =
  | { kind: 'line'; role: DecorationRole; from: Point; to: Point; colorIndex?: number }
  | { kind: 'rect'; role: DecorationRole; rect: Rect; radius: number; label?: string; colorIndex?: number }
  | { kind: 'text'; role: DecorationRole; at: Point; text: string; align: 'left' | 'center'; bold: boolean; size?: number; colorIndex?: number };

export interface DocStages { nodes: Record<string, number>; edges: Record<string, number> }
```

Field additions to existing interfaces:

```ts
// GraphNode
  sections?: NodeSection[];      // compartments (class, ER, requirement); when set, the box shows these instead of `label`
  icon?: IconName;               // drawn above the label (or alone when the label is empty)
  size?: { width: number; height: number }; // fixed box size; sizeNode returns it unchanged
  colorIndex?: number;           // see Part 1.4 decision 7
  arrowDir?: BlockArrowDir;      // only for shape 'blockArrow'
  labelSpan?: Span;              // where the visible label is written in the text
  defSpan?: Span;                // block diagrams only: the whole item (id, shape, label, `:N`)
  refLines?: number[];           // 0-based lines that exist only for this node; deleted with it

// GraphEdge
  markers?: { start: MarkerKind; end: MarkerKind }; // when set, these replace the markers implied by `kind`
  endLabels?: { from?: string; to?: string };        // small texts near each end (class cardinality)
  variant?: string;              // the operator as the engine knows it, for example '<|--' or '||--o{'
  colorIndex?: number;
  labelSpan?: Span;
  opSpan?: Span;                 // where the operator is written (types with edge variants)

// GraphGroup
  labelSpan?: Span;
  endLine?: number;              // 0-based line that closes the group (`}` or `end`)

// NodeBox
  sections?: SectionBox[];
  arrowDir?: BlockArrowDir;      // copied from the node by the block layout; read by shapePolygon for 'blockArrow'

// SceneLayout
  decorations?: Decoration[];

// ParsedDoc
  kind?: DiagramKind;            // undefined means 'flowchart'
  stages?: DocStages;            // undefined means: use topological depth (today's behaviour)
  pending?: boolean;             // true while the engine for `kind` is loading
  data?: DiagramData;            // engine-specific data for custom layouts (src/core/diagram-types.ts)

// EditorEnv (src/editor/controller-types.ts)
  caps?: EditCaps;               // undefined means every edit is allowed (today's behaviour)

// TextOp: one new member
  | { type: 'setEdgeVariant'; index: number; variant: string }
```

New file `src/core/diagram-types.ts` (types only, no runtime code):

```ts
export interface EditCaps {
  add: boolean; connect: boolean; rename: boolean; delete: boolean; move: boolean;
  shape: boolean; style: boolean; edgeVariant: boolean; reverse: boolean;
}
export interface Choice<T extends string = string> { value: T; name: string }

export type SeqEvent =
  | { type: 'message'; edgeId: string }
  | { type: 'note'; nodeId: string; placement: 'left' | 'right' | 'over'; targets: string[] }
  | { type: 'activate'; id: string }
  | { type: 'deactivate'; id: string }
  | { type: 'frameStart'; frameId: number; keyword: string; label: string }
  | { type: 'frameDivider'; frameId: number; label: string }
  | { type: 'frameEnd'; frameId: number };
export interface SequenceData {
  participants: string[];                         // node ids in column order
  boxes: { label: string; members: string[] }[];
  events: SeqEvent[];                             // source order
  autonumber: { start: number; step: number } | null;
}
export interface GitGraphData {
  direction: 'LR' | 'TB' | 'BT';
  branches: { name: string; colorIndex: number; order: number }[];
  commits: { id: string; branch: string; ordinal: number; tag: string | null; label: string }[];
}
export type BlockItem =
  | { type: 'node'; id: string; span: number }
  | { type: 'space'; span: number }
  | { type: 'block'; id: string; span: number; columns: number | null; children: BlockItem[] };
export interface BlockData { columns: number | null; items: BlockItem[] }
export interface MindmapData { root: string; parent: Record<string, string | null>; children: Record<string, string[]>; indent: Record<string, number> }
export interface JourneyData {
  sections: { name: string; colorIndex: number }[];
  actors: string[];
  tasks: { cardId: string; faceId: string; score: number; actors: string[]; section: number }[];
}
export interface TimelineData {
  direction: 'LR' | 'TD';
  sections: { name: string; colorIndex: number; periods: string[] }[];
  periods: { id: string; events: string[]; section: number }[];
}
export interface ArchitectureData {
  sides: Record<string, { from: 'L' | 'R' | 'T' | 'B'; to: 'L' | 'R' | 'T' | 'B' }>; // by edge id
}
export interface DiagramData {
  sequence?: SequenceData; gitgraph?: GitGraphData; block?: BlockData; mindmap?: MindmapData;
  journey?: JourneyData; timeline?: TimelineData; architecture?: ArchitectureData;
}
```

`src/core/types.ts` imports `DiagramData` and `EditCaps` with `import type` from `./diagram-types`, and `src/core/diagram-types.ts` may import `Point` and `Rect` with `import type` from `./types`. Type-only cycles are fine.

---

## Part 4. Engines, loading and app wiring

### 4.1 The engine interface (`src/diagrams/engine.ts`) [Task 66]

```ts
export interface DiagramEngine {
  kind: DiagramKind;
  caps: EditCaps;
  addChoices: Choice<ShapeKind>[];     // "Add node" list; the first entry is the default; [] when caps.add is false
  shapeChoices: Choice<ShapeKind>[];   // properties "Shape" list; [] when caps.shape is false
  edgeVariants: Choice[];              // properties "Arrow" list; [] when caps.edgeVariant is false
  parse(text: string): ParsedDoc;      // sets doc.kind
  layout?: (doc: ParsedDoc, measure: MeasureText) => SceneLayout; // absent = shared dagre path
  applyOp(text: string, op: TextOp): TextOpResult; // unsupported op → { error: MESSAGES.opUnsupported }
}
```

Every engine lives in `src/diagrams/<kind>/` and exports `export const engine: DiagramEngine` from `src/diagrams/<kind>/index.ts`. Folder names: `sequence`, `class`, `state`, `er`, `requirement`, `usecase`, `architecture`, `block`, `gitgraph`, `journey`, `timeline`, `mindmap`.

### 4.2 The flowchart engine (`src/diagrams/flowchart-engine.ts`, main bundle) [Task 66]

`export const FLOWCHART_ENGINE: DiagramEngine` with `kind: 'flowchart'`, `parse: parseMermaid`, `applyOp` (from `src/mermaid/ops.ts`, unchanged), no `layout`, `caps = { add: true, connect: true, rename: true, delete: true, move: true, shape: true, style: true, edgeVariant: false, reverse: true }`, `addChoices` and `shapeChoices` = the entries of `SHAPE_NAMES` in their current order, `edgeVariants: []` (flowcharts keep using `EDGE_KIND_NAMES` and `setEdgeKind`).

### 4.3 Registry and loader (`src/diagrams/registry.ts`, main bundle) [Task 66]

```ts
type Loader = () => Promise<DiagramEngine>;
// One line per engine. Each engine task adds its own line. Kinds without a line are reported as unsupported.
export const LOADERS: Partial<Record<DiagramKind, Loader>> = {
  // state: () => import('./state/index').then((m) => m.engine),   ← added by Task 75, and so on
};
export function getEngine(kind: DiagramKind): DiagramEngine | null;   // FLOWCHART_ENGINE for 'flowchart'; a loaded engine; else null
export function hasLoader(kind: DiagramKind): boolean;
export function loadEngine(kind: DiagramKind): Promise<DiagramEngine>; // one import per kind, cached; rejects on failure
export function engineFailed(kind: DiagramKind): boolean;            // true after a failed load
export function onEngineChange(cb: () => void): () => void;           // called once after each load settles (success or failure); returns unsubscribe
export function setLoaderForTest(kind: DiagramKind, loader: Loader | null): void; // replaces LOADERS[kind] (null removes it) and clears the cached engine, promise and failure state of that kind
```

Behaviour: `loadEngine` stores the promise per kind so a second call returns the same promise. On success it stores the engine (so `getEngine` returns it) and calls every `onEngineChange` listener. On failure it marks the kind failed, calls the listeners, and rethrows.

### 4.4 Detection (`src/diagrams/detect.ts`) [Task 66]

```ts
export interface Detected { kind: DiagramKind | 'unsupported' | 'unknown'; headerIdx: number; name: string }
export function detectKind(text: string): Detected;
```

1. Split with `/\r\n|\r|\n/`.
2. Skip leading blank lines. If the first non-blank line, trimmed, is `---`, skip to the next line that trimmed is `---` and continue after it (front matter). If there is no closing `---`, do not skip.
3. Skip blank lines and lines whose trimmed text starts with `%%`.
4. The first remaining line, trimmed, is the header. Test `HEADER_PATTERNS` in order; the first match gives `kind` and `name = KIND_NAMES[kind]`. Else test `UNSUPPORTED_HEADERS`; a match gives `kind: 'unsupported'` and its name. Else `kind: 'unknown'`, `name: ''`. `headerIdx` is that line's 0-based index; `-1` when there is no such line.

### 4.5 Parsing any text (`src/diagrams/parse-any.ts`) [Task 66]

```ts
export function parseDocument(text: string): ParsedDoc;
```

1. If `text.length > LIMITS.maxTextChars`, return `parseMermaid(text)` (it already reports `MESSAGES.textTooLong`).
2. `d = detectKind(text)`. If `d.kind` is `'flowchart'` or `'unknown'`, return `parseMermaid(text)`. (Unknown text gets the existing `MESSAGES.notFlowchart` error, whose wording Part 2.3 changes.)
3. If `d.kind === 'unsupported'`, return an error doc: `MESSAGES.unsupportedDiagram(d.name)` on line `d.headerIdx + 1`.
4. If `!hasLoader(d.kind)`, return an error doc with `MESSAGES.unsupportedDiagram(\`${d.name} diagram\`)`.
5. If `getEngine(d.kind)` is not null, return `engine.parse(text)`.
6. If `engineFailed(d.kind)`, return an error doc with `MESSAGES.diagramLoadFailed(d.name)`.
7. Otherwise call `void loadEngine(d.kind).catch(() => undefined)` and return a pending doc: `emptyDoc(lines, [{ line: d.headerIdx + 1, severity: 'info', message: MESSAGES.loadingDiagram(d.name) }])` with `kind: d.kind`, `pending: true`, `ok: false`.

"Error doc" means `emptyDoc(lines, [{ line, severity: 'error', message }])` where `lines` is one `SourceLine` per text line with `kind: 'unknown'`, `nodeIds: []`, `edgeIndexes: []`. `emptyDoc` is the existing export of `src/mermaid/parse.ts`.

### 4.6 Applying an op to any text (`src/diagrams/apply-op.ts`) [Task 66]

```ts
export function applyAnyOp(text: string, op: TextOp): TextOpResult;
```

`detectKind(text)`: `'flowchart'` or `'unknown'` → the existing `applyOp(text, op)`; a loaded engine → `engine.applyOp(text, op)`; anything else → `{ error: MESSAGES.fixTextFirst }`. In `src/mermaid/ops.ts`, the existing `applyOp` gets one new `case 'setEdgeVariant': return { error: MESSAGES.opUnsupported };`.

### 4.7 Scene building (`src/layout/scene.ts`) [Task 66]

At the top of `buildScene`, before the existing code:

```ts
const kind = doc.kind ?? 'flowchart';
if (kind !== 'flowchart') {
  const engine = getEngine(kind);
  if (engine?.layout) return { doc, layout: engine.layout(doc, measure) };
}
```

`withNodeAt` and `tryBuildScene` do not change.

### 4.8 App wiring [Tasks 66 and 73]

| Where                                                          | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/state.ts`                                           | `parseMermaid` → `parseDocument` (both calls).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `src/app/node-creator.ts`                                    | `parseMermaid` → `parseDocument`; `applyOp` → `applyAnyOp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `src/app/ui.ts`                                              | `applyOp` → `applyAnyOp`. Add, after `createDispatcher(...)`: `onEngineChange(() => { state = applyText(state, state.text, measure); updateAfterCommit(); });` (import `applyText` from `./state`, `onEngineChange` from `../diagrams/registry`).                                                                                                                                                                                                                                                                                                              |
| `src/editor/controller.ts` [73]                              | When `env.caps` is set: pass `null` instead of the selected node id to `hitTest` in `pointerDown` when `!caps.connect` (no handle hits); create `drag` only when `caps.move`; `dblClick` on an item starts editing only when `caps.rename`; `dblClick` on empty canvas emits `addNodeAt` only when `caps.add`, with `shape: engine default` passed in as `env.defaultShape ?? 'rect'`; `Delete`/`Backspace` only when `caps.delete`; `Enter` only when `caps.rename`. Add `defaultShape?: ShapeKind` to `EditorEnv` next to `caps`. |
| `src/app/dispatcher.ts` and `src/app/studio.ts` [73]       | Where they build `EditorEnv` (`ok: state.doc.ok`), add `caps: capsOf(state.doc), defaultShape: engineOf(state.doc).addChoices[0]?.value ?? 'rect'`.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/app/render-loop.ts` [73]                                | `handleNodeId` is the selected node id only when `capsOf(state.doc).connect`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `src/app/canvas-events.ts`, `src/app/touch-wiring.ts` [73] | Gate the shift+arrow nudge (`setPin`) with `capsOf(state.doc).move`; gate any path that creates a connected node with `.connect`; gate rename paths with `.rename`. Read both files first and list each gated path in `DECISIONS.md`.                                                                                                                                                                                                                                                                                                                                 |
| `src/app/toolbar.ts` [73]                                    | At the end of `updateButtons()`, call `syncKindControls(state.doc)`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `src/app/properties.ts` [73]                                 | The `#prop-kind` change handler sends `setEdgeKind` for flowcharts (as now) and `{ type: 'setEdgeVariant', index, variant: propKind.value }` otherwise. The update shows `edge.kind` for flowcharts and `edge.variant ?? ''` otherwise. At the end of the update function call `applyCapsToProps(panelEl, capsOf(state.doc))`.                                                                                                                                                                                                                                      |

### 4.9 Kind-aware controls (`src/app/kind-ui.ts`, new) [Task 73]

```ts
export function engineOf(doc: ParsedDoc): DiagramEngine;     // getEngine(doc.kind ?? 'flowchart') ?? FLOWCHART_ENGINE
export function capsOf(doc: ParsedDoc): EditCaps;            // engineOf(doc).caps
export function syncKindControls(doc: ParsedDoc): void;      // DOM
export function applyCapsToProps(panelEl: HTMLElement, caps: EditCaps): void; // DOM
```

`syncKindControls` remembers the last kind it saw (starts as `'flowchart'`). It refills the selects only when the kind changes, and always applies the disabled and hidden states:

- `#add-shape`: options from `engineOf(doc).addChoices` (for flowcharts this is the same list and order the toolbar builds today). `#add-shape` and `#btn-add-node` are disabled when `!caps.add`.
- `#btn-autolayout`: set `disabled = true` when `!caps.move` (never set it to false here; the toolbar's own rule decides otherwise).
- `#card-mode`: disabled, with `title="Card styles apply to flowcharts"`, when the kind is not `'flowchart'`; enabled with no title otherwise.
- `#prop-shape`: options from `shapeChoices`. `#prop-kind`: options from `EDGE_KIND_NAMES` for flowcharts, from `edgeVariants` otherwise.

`applyCapsToProps` hides (sets `hidden`) each control and its `label[for=…]` when the capability is false: `#prop-shape` (shape), `#prop-fill`, `#prop-stroke`, `#prop-text-color`, `#prop-clear-colours` (style), `#prop-connect`, `#prop-connect-go` (connect), `#prop-kind` (edgeVariant, but never hidden for flowcharts), `#prop-reverse` (reverse), `#prop-delete` (delete). `#prop-label` is disabled when `!caps.rename`. When the capability is true it removes `hidden` only from elements it hid itself, so the existing per-selection rules in `properties.ts` keep working.

### 4.10 Other main-bundle changes [Task 73]

- `src/app/describe.ts`: the default name becomes `doc.accTitle ?? doc.title ?? (kind === 'flowchart' ? 'Flowchart' : \`${KIND_NAMES[kind]} diagram\`)`with`kind = doc.kind ?? 'flowchart'`.
- `src/app/mermaid-lang.ts`: `tokenizeLine(line: string, mode: 'flowchart' | 'other' = 'flowchart')`. In `'other'` mode the keyword set is `OTHER_KEYWORDS` and the regexes in `OTHER_OPERATORS` are tried before the flowchart operators. The stream state gains `mode`, starting at `'flowchart'`; when a line's trimmed text matches an entry of `HEADER_PATTERNS`, the mode becomes `'flowchart'` for the flowchart entry and `'other'` for every other entry, starting with that line.
  - `OTHER_KEYWORDS`: `sequenceDiagram classDiagram classDiagram-v2 stateDiagram stateDiagram-v2 erDiagram requirementDiagram usecase-beta architecture-beta block block-beta gitGraph journey timeline mindmap participant actor as activate deactivate Note note over left right of loop alt else opt par and critical option break rect box end autonumber title class namespace direction classDef style cssClass state requirement functionalRequirement interfaceRequirement performanceRequirement physicalRequirement designConstraint element contains copies derives satisfies verifies refines traces systemBoundary group service junction in columns space commit branch checkout switch merge cherry-pick id type tag order section accTitle accDescr TB TD BT RL LR`.
  - `OTHER_OPERATORS`: `/^<<-->>/, /^<<->>/, /^-->>/, /^->>/, /^--x/, /^-x/, /^--\)/, /^-\)/, /^<\|--/, /^--\|>/, /^<\|\.\./, /^\.\.\|>/, /^\*--/, /^--\*/, /^o--/, /^--o/, /^\.\.>/, /^<\.\./, /^[|}][o|](?:--|\.\.)[o|][|{]/, /^<?-->?/, /^\.\./, /^->/, /^<-/, /^:/`.
- `src/app/help.ts`: add a `<h3>Diagram types</h3>` section after the cheat sheet with one list item per supported type: its name from `KIND_NAMES` and its header keyword in `<code>` (`flowchart TD`, `sequenceDiagram`, `classDiagram`, `stateDiagram-v2`, `erDiagram`, `requirementDiagram`, `usecase-beta`, `architecture-beta`, `block`, `gitGraph`, `journey`, `timeline`, `mindmap`). If `help.ts` would pass 280 lines, put the list in `src/app/help-diagrams.ts` and import it.

---

## Part 5. Grammars (one per engine)

**How to read the pattern lists.** Each bullet is `` `regex` → effect ``. Every regex is a JavaScript regular expression written exactly as it goes in the code: copy it character for character. A `\|` inside a regex is a literal pipe character; a plain `|` is alternation. The lists are tried top to bottom and the first match wins, unless a rule says otherwise.

### 5.0 Shared parser kit (`src/diagrams/common/prelude.ts`) [Task 67]

Every engine parser starts with the kit, so front matter, comments, positions, accessibility lines and limits behave the same everywhere.

```ts
export interface Prelude {
  rawLines: string[]; lines: SourceLine[]; diagnostics: Diagnostic[];
  headerIdx: number; headerText: string; title: string | null; // title from front matter
}
export function readPrelude(text: string, header: RegExp): Prelude | ParsedDoc; // ParsedDoc = an error doc to return as is
export interface CommonState { pins: Record<string, Point>; accTitle: string | null; accDescr: string | null; accBlock: string[] | null }
export function newCommonState(): CommonState;
export function commonLine(raw: string, i: number, lines: SourceLine[], st: CommonState): boolean; // true = consumed
export function makeNode(id: string, label: string, shape: ShapeKind, line: number, extra?: Partial<GraphNode>): GraphNode;
export function makeEdge(index: number, from: string, to: string, kind: EdgeKind, label: string, line: number, extra?: Partial<GraphEdge>): GraphEdge;
export function checkLimits(nodes: GraphNode[], edges: GraphEdge[], diagnostics: Diagnostic[], line: number): boolean; // false = over a limit (an error was pushed once)
export function finishDoc(kind: DiagramKind, p: Prelude, st: CommonState, parts: DocParts): ParsedDoc;
export interface DocParts { direction: Direction; nodes: GraphNode[]; edges: GraphEdge[]; groups: GraphGroup[]; classDefs: Record<string, StyleMap>; title: string | null; stages?: DocStages; data?: DiagramData }
export function leadOf(raw: string): number;   // raw.length - raw.trimStart().length
export function spanAt(raw: string, line: number, m: RegExpExecArray, group: number): Span | undefined; // needs the regex `d` flag; adds leadOf(raw)
export function applyClassStyles(nodes: GraphNode[], classDefs: Record<string, StyleMap>): void; // merges classDefs[c] for each c in node.classNames into node.style, explicit style wins
```

Rules:

- `readPrelude`: length over `LIMITS.maxTextChars` → error doc with `MESSAGES.textTooLong`. Front matter as in `parseHeader` (lines marked `'frontmatter'`, `title:` read, surrounding quotes removed). Blank, `%%` comment and `%%{` directive lines before the header are marked as today. The header line must match `header`; it is marked `'header'`. If the first content line does not match, return an error doc with `MESSAGES.notFlowchart` on that line (this cannot normally happen, because detection already matched).
- `commonLine` handles, on the trimmed line `t`: empty → `'blank'`; starts with `%%{` → `'directive'`; matches `PIN_LINE_RE` (from `src/mermaid/positions.ts`) → `'pos'` and `st.pins[id] = { x, y }`; other `%%` → `'comment'`; `accTitle\s*:\s*(.*)` → `'acc'`, sets `accTitle`; `accDescr\s*:\s*(.*)` → `'acc'`; `accDescr\s*\{` starts a block that collects lines until a line that trimmed is `}` (all marked `'acc'`), then `accDescr = lines.join('\n')`.
- `makeNode` defaults: `classNames: []`, `style: {}`, `group: null`, `markdown: false`. `makeEdge` defaults: `id: \`e${index}\``, `length: 1`, `style: {}`, `ref: null`, `anim: { animate: null, speed: null }`, `markdown: false`, `fromIsGroup: false`, `toIsGroup: false`.
- Labels always pass through `cleanLabel` from `src/mermaid/props.ts` (it turns `<br>` into a new line, decodes `#quot;` and other entity codes, and caps the length).
- `finishDoc` copies `parts`, sets `kind`, `pins: st.pins`, `accTitle`, `accDescr`, `links: {}`, `explicitEdgeAnimation: false`, `title: parts.title ?? p.title`, runs `applyClassStyles`, fills `lines[i].nodeIds` and `lines[i].edgeIndexes` from each node's `line` and each edge's `line`, and sets `ok` to "no error diagnostic".
- Every statement line the engine understands is marked `'statement'` (or `'style'`, `'classDef'`, `'class'`, `'end'` for those). Every other line gets `kind: 'unknown'` and a `warning` with `MESSAGES.unknownLine`.
- `style ID a:b,c:d` (where the type supports it) → `node.style = { ...node.style, ...parseStyleString('a:b,c:d') }` using `parseStyleString` from `src/mermaid/styles.ts`. `classDef NAME a:b` → `classDefs[NAME] = parseStyleString(...)`. `class A,B NAME` → add `NAME` to each node's `classNames`. `ID:::NAME` suffixes are cut from ids and added to `classNames`.
- **Spans for editing.** Record `labelSpan` for every label the text writes, `opSpan` for the operator of every edge in a type that has edge variants (sequence, class, ER, requirement, use case, architecture, block), and `defSpan` for every block-diagram item. A label the text does not write (an id shown as its own label) has no `labelSpan`.

Throughout Part 5, `t` is the trimmed line, regexes are applied to `t`, and every regex that captures a label has the `d` flag so that `spanAt` can record `labelSpan`.

### 5.1 State diagram (`state`) [Task 75]

Header: `/^stateDiagram(-v2)?\s*$/`. Default direction `TB`.

Scopes: a stack of composite ids; the root scope is `null`. The start and end pseudo-states of a scope have ids `__start_<scope>` and `__end_<scope>`, where `<scope>` is `root` or the composite id. They are created the first time `[*]` is used in that scope.

- `/^direction\s+(TB|TD|BT|LR|RL)$/` → `direction` (`TD` → `TB`)
- `/^state\s+"([^"]*)"\s+as\s+([\w.-]+)\s*(\{)?$/d` → declare `$2` with label `$1` (span of `$1`); `{` opens a composite
- `/^state\s+([\w.-]+)\s*<<(choice|fork|join)>>$/` → declare: `choice` → shape `diamond`, `size: {28, 28}`, label `''`; `fork`/`join` → shape `forkBar`, label `''`
- `/^state\s+([\w.-]+)\s*\{$/` → open composite `$1`
- `/^state\s+([\w.-]+)$/` → declare `$1`
- `/^\}$/` → close the innermost composite: set its group's `endLine`; error `MESSAGES.strayBlockEnd` when none is open
- `/^--$/` → concurrency divider inside a composite (see below); warning `unknownLine` at root
- `/^(\S+?)\s*-->\s*(\S+?)\s*(?::\s*(.*))?$/d` → transition; `[*]` on the left → `__start_<scope>`, on the right → `__end_<scope>`; label `$3` (span of `$3`)
- `/^note\s+(left|right)\s+of\s+([\w.-]+)\s*:\s*(.+)$/d` → note node + note edge (below)
- `/^note\s+(left|right)\s+of\s+([\w.-]+)$/` → multi-line note; the lines up to `end note` are its text (joined with `\n`), all marked `'statement'`
- `/^([\w.-]+)\s*:\s*(.+)$/d` → description of `$1`: first description replaces the label, later ones are appended with `\n`; span of the first description
- `/^hide empty description$/` → info `MESSAGES.syntaxIgnored('hide empty description')`
- `classDef`, `class`, `style`, `:::` → as in 5.0

Lowering:

- A state node: shape `round`, label = description or id, `group` = current scope, `line` = first line that names it. `labelSpan` = the span of its `state "…" as` label or first description.
- Start pseudo-state: shape `filledCircle`, label `''`, `size: { width: 20, height: 20 }`. End: shape `framedCircle`, label `''`, `size: { width: 24, height: 24 }`.
- A composite is a `GraphGroup` (`id`, `title` = label or id, `parent` = enclosing scope, `line`, `endLine`, `labelSpan`). Transitions that name a composite use `fromIsGroup` / `toIsGroup = true` and the group id. A composite is not also a node.
- The first `--` inside composite `C` creates groups `C__r1` and `C__r2` (title `''`, parent `C`), moves every node and group whose scope is `C` into `C__r1`, and makes `C__r2` the current scope. Each further `--` adds `C__r3`, and so on. The region is popped together with `C` at `}`.
- Edge: kind `open`, `markers: { start: 'none', end: 'arrow' }`, `variant: '-->'`, `labelSpan` of the label.
- Note: node id `note1`, `note2`, … (shape `note`, label = text, group = scope of its target); edge from the note to the target: kind `dotted`, `markers: { start: 'none', end: 'none' }`, `variant: 'note'`.
- `refLines` of a state: every line that declares it, describes it, or is a note about it (including the note's continuation lines).
- Unclosed composite at the end → error `MESSAGES.unclosedBrace(id)` on its opening line.
- An id can be used in a transition before `state X {` makes it a composite. After all lines are read: remove every node whose id is also a group id, and set `fromIsGroup` / `toIsGroup` on every edge end that names a group.

### 5.2 Class diagram (`class`) [Task 77]

Header: `/^classDiagram(-v2)?\s*$/`. Default direction `TB`. Class id: `[A-Za-z0-9_]+`, optionally followed by a generic `~T~`, shown as `<T>` in labels.

- `/^direction\s+(TB|TD|BT|LR|RL)$/` → direction
- `/^class\s+([A-Za-z0-9_]+)(~[^~]+~)?(?:\["([^"]*)"\])?(?::::(\w+))?\s*(\{)?$/d` → declare class; `$3` label (span); `$4` css class; `{` opens a member block
- member block lines until `/^\}$/` → each trimmed line is a member; `<<x>>` inside a block is the annotation
- `/^<<([^>]+)>>\s+([A-Za-z0-9_]+)$/` → annotation of `$2`
- relation (see below) → edge
- `/^([A-Za-z0-9_]+)\s*:\s*(.+)$/` → member `$2` of class `$1` (tested after the relation pattern)
- `/^note\s+for\s+([A-Za-z0-9_]+)\s+"([^"]*)"$/d` → note node + dotted note edge to `$1`
- `/^note\s+"([^"]*)"$/d` → free note node
- `/^namespace\s+([\w.]+)(?:\["([^"]*)"\])?\s*\{$/d` → open namespace group; classes declared until the matching `}` get `group` = namespace id
- `/^(click|callback|link)\b/` → info `MESSAGES.syntaxIgnored('Class click and link')`
- `/^cssClass\s+"([^"]+)"\s+(\w+)$/` → add css class `$2` to each id in `$1` (comma separated)
- `classDef`, `style` → as in 5.0

Relation regex (applied before the member pattern; lookbehind and lookahead stop `foo--bar` from reading `o` as a marker):

```ts
const REL_RE = /^([A-Za-z0-9_]+(?:~[^~]+~)?)\s*(?:"([^"]*)"\s*)?((?:(?<=\s)[o*]|<\||<)?(?:--|\.\.)(?:\|>|>|[o*](?=\s))?|\(\)--|--\(\))\s*(?:"([^"]*)"\s*)?([A-Za-z0-9_]+(?:~[^~]+~)?)\s*(?::\s*(.*))?$/d;
```

- `$1` from, `$5` to, `$2` cardinality near `from` → `endLabels.from`, `$4` cardinality near `to` → `endLabels.to`, `$6` label (span).
- `$3` is the operator. Line part `--` → kind `open`, `..` → kind `dotted`. Left end: `<|` → `triangle`, `*` → `diamondFilled`, `o` → `diamond`, `<` → `openArrow`, none → `none`. Right end: `|>` → `triangle`, `*` → `diamondFilled`, `o` → `diamond`, `>` → `openArrow`, none → `none`. `markers = { start: left, end: right }`, `variant = $3`.
- `()--` and `--()` → kind `open`, no markers, info `MESSAGES.syntaxIgnored('Lollipop interfaces')`.
- Classes named in relations are created if missing (label = id).
- A class id never contains the generic: `List~int~` is node `List` with label `List<int>`. A node keeps the group of its first declaration.
- A member block (`class X {`) with no closing `}` → error `MESSAGES.unclosedBrace(X)` on its opening line. The same rule applies to namespaces.

Lowering of a class node: shape `rect`, label = `$3` or the id (generic `~T~` → `<T>`), `labelSpan` = span of `$3` when present, sections:

1. if annotated: `{ rows: [['«' + annotation + '»']], align: 'center', weight: 'italic', divider: false }`;
2. `{ rows: [[label]], align: 'center', weight: 'bold', divider: false }`;
3. only when the class has at least one member: attributes `{ rows, align: 'left', weight: 'normal', divider: true }` then methods `{ rows, align: 'left', weight: 'normal', divider: true }` (either may be empty). A member is a method when it contains `(`. Remove a trailing `$` or `*` from a member; turn `~T~` into `<T>`.

`refLines` of a class: its `class` line, its whole member block (opening line to `}` inclusive), its `X : member` lines, its annotation lines, its `style X` lines and every `note for X` line. Notes: ids `note1`, `note2`, …; shape `note`; the note edge has kind `dotted`, no markers, `variant: 'note'`.

### 5.3 Entity relationship diagram (`er`) [Task 79]

Header: `/^erDiagram\s*$/`. Default direction `TB`. Entity name: `"[^"]+"` (quotes removed) or `[A-Za-z0-9_-]+`. An entity may carry an alias: `NAME[Label]` or `NAME["Label"]`.

```ts
const ENT = String.raw`("[^"]+"|[A-Za-z0-9_-]+)(?:\["?([^\]"]+)"?\])?`;   // 2 groups: name, alias (no backreference, so ENT can appear twice)
const CARD_L = String.raw`(\|o|\|\||\}o|\}\|)`;
const CARD_R = String.raw`(o\||\|\||o\{|\|\{)`;
const WORD = String.raw`(one or zero|zero or one|one or more|one or many|many\(1\)|1\+|zero or more|zero or many|many\(0\)|0\+|only one|1)`;
```

- `/^direction\s+(TB|TD|BT|LR|RL)$/` → direction
- `new RegExp(\`^${ENT}\\s*\\{$\`, 'd')`→ open the attribute block of the entity; lines until`/^\}$/` are attributes
- attribute line → `/^([\w()\[\],.?-]+)\s+(\*?[\w-]+)(?:\s+((?:PK|FK|UK)(?:\s*,\s*(?:PK|FK|UK))*))?(?:\s+"([^"]*)")?$/` → row `[type, name, keys ?? '', comment ?? '']`
- `new RegExp(\`^${ENT}\\s+${CARD_L}(--|\\.\\.)${CARD_R}\\s+${ENT}\\s*:\\s*(.+)$\`, 'd')` → relationship (symbols)
- `new RegExp(\`^${ENT}\\s+${WORD}\\s+(to|optionally to)\\s+${WORD}\\s+${ENT}\\s*:\\s*(.+)$\`, 'd')` → relationship (words)
- `new RegExp(\`^${ENT}$\`, 'd')` → declare the entity
- `/^subgraph\s+([\w-]+)(?:\s*\[([^\]]*)\])?$/` … `/^end$/` → group
- `classDef`, `class`, `style`, `:::` → as in 5.0
- Group numbers. Symbol relationship: 1 name, 2 alias, 3 left card, 4 line (`--` or `..`), 5 right card, 6 name, 7 alias, 8 label. Word relationship: 1 name, 2 alias, 3 left word, 4 `to` / `optionally to`, 5 right word, 6 name, 7 alias, 8 label. Entity block and declaration: 1 name, 2 alias.
- Symbols: left `|o` → `erZeroOrOne`, `||` → `erOne`, `}o` → `erZeroOrMore`, `}|` → `erOneOrMore`; right `o|` → `erZeroOrOne`, `||` → `erOne`, `o{` → `erZeroOrMore`, `|{` → `erOneOrMore`. `--` → kind `open`, `..` → kind `dotted`. `variant` = the whole operator, for example `||--o{`.
- Words: `zero or one`, `one or zero` → `erZeroOrOne`; `one or more`, `one or many`, `many(1)`, `1+` → `erOneOrMore`; `zero or more`, `zero or many`, `many(0)`, `0+` → `erZeroOrMore`; `only one`, `1` → `erOne`. `to` → kind `open`, `optionally to` → kind `dotted`. `variant` = the equivalent symbol operator (for example `only one to zero or more` → `||--o{`).
- The relationship label is the last group with surrounding quotes removed; it is the edge label (span).
- Entity node: shape `rect`, label = alias or name, `labelSpan` = span of the alias when written. With attributes, sections are `[{ rows: [[label]], align: 'center', weight: 'bold', divider: false }, { rows: attributeRows, align: 'left', weight: 'normal', divider: true }]`; without attributes, no sections. Columns that are empty in every row are dropped when sizing (Part 7.1).
- `refLines` of an entity: every declaration line and its whole attribute block.

### 5.4 Requirement diagram (`requirement`) [Task 82]

Header: `/^requirementDiagram\s*$/`. Default direction `TB`. Names: `[A-Za-z0-9_-]+` or `"…"`.

- `/^(requirement|functionalRequirement|interfaceRequirement|performanceRequirement|physicalRequirement|designConstraint)\s+("?)([^"{]+?)\2\s*\{$/d` → open a requirement block named `$3` (span)
- `/^element\s+("?)([^"{]+?)\1\s*\{$/d` → open an element block named `$2` (span)
- block lines until `/^\}$/` → `/^(id|text|risk|verifymethod|type|docref)\s*:\s*(.*)$/i` → field (key lower-cased, value with quotes removed)
- `/^(\S+)\s+-\s+(contains|copies|derives|satisfies|verifies|refines|traces)\s+->\s+(\S+)$/` → relation from `$1` to `$3`
- `/^(\S+)\s+<-\s+(contains|copies|derives|satisfies|verifies|refines|traces)\s+-\s+(\S+)$/` → relation from `$3` to `$1`
- `direction`, `classDef`, `class`, `style`, `:::` → as in 5.0 / 5.1
- Requirement node: shape `rect`, label = name, sections `[{ rows: [['«' + TYPE + '»']], center, italic, divider: false }, { rows: [[name]], center, bold, divider: false }, { rows: fieldRows, left, normal, divider: true }]`. `TYPE`: `requirement` → `Requirement`, `functionalRequirement` → `Functional Requirement`, `interfaceRequirement` → `Interface Requirement`, `performanceRequirement` → `Performance Requirement`, `physicalRequirement` → `Physical Requirement`, `designConstraint` → `Design Constraint`. `fieldRows` in this order, only for fields present: `ID: <id>`, `Text: <text>`, `Risk: <risk>`, `Verification: <verifymethod>`.
- Element node: same, with `«Element»` and rows `Type: <type>`, `Doc Ref: <docref>`.
- Relation edge: kind `dotted`, `markers: { start: 'none', end: 'arrow' }`, label `'«' + type + '»'` (no `labelSpan`: the type is edited with the edge variant), `variant` = the type.
- A name used in a relation but never declared is created as an element node with no fields.
- `refLines` of a node: its whole block. Unclosed block → error `MESSAGES.unclosedBrace(name)`.

### 5.5 Use case diagram (`usecase`) [Task 84]

Header: `/^usecase-beta\s*$/`. Default direction `LR`. Ids: `[A-Za-z0-9_-]+`.

Mermaid marks this type as beta. **Before you start Task 84, if you have network access, read https://mermaid.js.org/syntax/usecase.html and write every difference from this table into `DECISIONS.md`, then follow the page.** Without network, follow this table.

- `/^direction\s+(TB|TD|BT|LR|RL)$/` → direction
- `/^actor\s+([A-Za-z0-9_-]+)(?:\(\s*"?([^")]*)"?\s*\))?$/d` → actor node, shape `actor`, label `$2` or id (span of `$2`)
- `/^([A-Za-z0-9_-]+)\(\s*"?([^")]*)"?\s*\)$/d` → use case node, shape `ellipse`
- `/^([A-Za-z0-9_-]+)\[\s*"?([^"\]]*)"?\s*\]$/d` → node, shape `rect`
- `/^systemBoundary\s+([A-Za-z0-9_-]+)(?:\[\s*"?([^"\]]*)"?\s*\])?$/d` … `/^end$/` → group (one level only; a nested one is an error `MESSAGES.groupTooDeep`)
- `/^([A-Za-z0-9_-]+?)\s*--\s*"([^"]*)"\s*-+>\s*([A-Za-z0-9_-]+)$/d` → labelled association, kind `open`, end `arrow`, `variant: '-->'`, label `$2` (span)
- `/^([A-Za-z0-9_-]+?)\s*(-{2,}>|<-{2,}|-{2,}o|o-{2,}|-{2,}x|x-{2,}|-{2,}\|>|\.\.>|-{2,})\s*([A-Za-z0-9_-]+)(?:\s*:\s*(.*))?$/d` → edge (operators below); `$2` is the operator (record its span as `opSpan`); `$4` label (span)
- `/^note\s+for\s+([A-Za-z0-9_-]+)\s+"([^"]*)"$/d` → note node + dotted note edge
- `classDef`, `class`, `style` → as in 5.0

Runs of more than two dashes are accepted and drawn at normal length; `variant` is the operator with every run of dashes shortened to `--`. Operators: `-->` open, end `arrow`; `<--` open, start `arrow`; `--` open, none; `--o` open, end `circle`; `o--` open, start `circle`; `--x` open, end `cross`; `x--` open, start `cross`; `--|>` open, end `triangle`; `..>` dotted, end `openArrow`. For `..>`, a label that is exactly `include` or `extend` (any case) becomes `«include»` / `«extend»`. Ids used only in edges become use cases (shape `ellipse`, label = id). `variant` = the shortened operator.

### 5.6 Architecture diagram (`architecture`) [Task 86]

Header: `/^architecture-beta\s*$/`. Ids: `[A-Za-z0-9_-]+`.

- `/^group\s+([A-Za-z0-9_-]+)(?:\(([\w:-]+)\))?(?:\[([^\]]*)\])?(?:\s+in\s+([A-Za-z0-9_-]+))?$/d` → group `$1`, title `$3` or id (span), parent `$4`
- `/^service\s+([A-Za-z0-9_-]+)(?:\(([\w:-]+)\))?(?:\[([^\]]*)\])?(?:\s+in\s+([A-Za-z0-9_-]+))?$/d` → service node: shape `round`, icon from `$2`, label `$3` or id (span), group `$4`
- `/^junction\s+([A-Za-z0-9_-]+)(?:\s+in\s+([A-Za-z0-9_-]+))?$/` → junction: shape `filledCircle`, label `''`, `size: { width: 12, height: 12 }`
- `/^([A-Za-z0-9_-]+)(\{group\})?:([LRTB])\s*(<)?--(>)?\s*([LRTB]):([A-Za-z0-9_-]+)(\{group\})?$/` → edge from `$1` (side `$3`) to `$7` (side `$6`)
- `/^align\s+(row|column)\b/` → info `MESSAGES.syntaxIgnored('align')`
- Icons: `cloud`, `database`, `disk`, `internet`, `server` map to the same `IconName`. Any other icon name → icon `server` and info `MESSAGES.iconFallback(name)`. No icon written → no icon.
- Edge: kind `open`, `markers: { start: $4 ? 'arrow' : 'none', end: $5 ? 'arrow' : 'none' }`, `variant` = `--`, `-->`, `<--` or `<-->`, label `''`. Sides go into `data.architecture.sides[edgeId] = { from: $3, to: $6 }`. With `{group}` on an end, that end is the group of the service (`fromIsGroup` / `toIsGroup = true`, id = the service's group); a service with no group makes this an error `MESSAGES.unknownNode(id)`.
- `refLines` of a service or junction: its declaration line.

### 5.7 Sequence diagram (`sequence`) [Task 89]

Header: `/^sequenceDiagram\s*$/`. Participant id: `[^\s:,;+-][^\s:,;]*?` (any run without spaces, colons or commas; it may not start with `+` or `-`).

- `/^(participant|actor)\s+([^\s@]+)@\{(.*)\}(?:\s+as\s+(.+))?$/d` → declared participant with a type: `"type"\s*:\s*"(\w+)"` in `$3`; `database` → shape `cylinder`; `boundary`, `control`, `entity`, `collections`, `queue` → shape `rect` and info `MESSAGES.shapeApprox(type, 'a rectangle')`
- `/^(participant|actor)\s+(\S+?)(?:\s+as\s+(.+))?$/d` → declared participant; `actor` → shape `actor`, `participant` → `rect`; label `$3` (span) or id
- `/^create\s+(participant|actor)\s+/` → the rest as above, plus info `MESSAGES.syntaxIgnored('create')`
- `/^destroy\s+(\S+)$/` → info `MESSAGES.syntaxIgnored('destroy')`
- `/^box(?:\s+(.*))?$/` → open a participant box (top level only); label = `$1` without a leading colour word (`rgb(...)`, `rgba(...)`, `transparent`, or one word followed by a space when more text follows)
- `/^(loop|alt|opt|par|critical|break|rect)\b\s*(.*)$/` → `frameStart` with keyword `$1`, label `$2` (`rect`: label `''`)
- `/^(else|and|option)\b\s*(.*)$/` → `frameDivider` in the innermost frame; `else` needs `alt`, `and` needs `par`, `option` needs `critical`; otherwise warning `unknownLine`
- `/^end$/` → `frameEnd` (or closes a `box`); error `MESSAGES.strayBlockEnd` when nothing is open
- `/^activate\s+(\S+)$/` → `activate` event
- `/^deactivate\s+(\S+)$/` → `deactivate` event
- `/^[Nn]ote\s+(left of|right of|over)\s+([^:]+?)\s*:\s*(.*)$/d` → note node + `note` event; `over A,B` gives two targets
- `/^autonumber(?:\s+(\d+))?(?:\s+(\d+))?$/` → `autonumber = { start: $1 ?? 1, step: $2 ?? 1 }`
- `/^title\s*:?\s*(.+)$/` → title
- `/^(links?|properties|details)\b/` → info `MESSAGES.syntaxIgnored('Participant menus')`
- message (below) → edge + `message` event

Message regex (operators are listed longest first, so `-->>` wins over `-->` and `->>`):

```ts
const ARROWS = ['<<-->>', '<<->>', '-->>', '->>', '--x', '-x', '--)', '-)', '-->', '->'];
const HALF = ['--|\\', '-|\\', '--|/', '-|/', '--\\\\', '-\\\\', '--//', '-//'];
// operator alternation: HALF first, then ARROWS, each escaped with a regex-escape helper
const MSG_RE = new RegExp(String.raw`^([^\s:+-][^\s:]*?)\s*(${ops})\s*([+-]?)\s*([^\s:]+?)\s*(?::(.*))?$`, 'd');
```

| Operator    | kind                                           | markers start / end                            |
| ----------- | ---------------------------------------------- | ---------------------------------------------- |
| `->`      | open                                           | none / none                                    |
| `-->`     | dotted                                         | none / none                                    |
| `->>`     | open                                           | none / arrow                                   |
| `-->>`    | dotted                                         | none / arrow                                   |
| `<<->>`   | open                                           | arrow / arrow                                  |
| `<<-->>`  | dotted                                         | arrow / arrow                                  |
| `-x`      | open                                           | none / cross                                   |
| `--x`     | dotted                                         | none / cross                                   |
| `-)`      | open                                           | none / openArrow                               |
| `--)`     | dotted                                         | none / openArrow                               |
| half arrows | as `->>` (one dash) or `-->>` (two dashes) | info `MESSAGES.syntaxIgnored('Half arrows')` |

- `from = $1`, `to = $4` with any `()` removed (info `MESSAGES.syntaxIgnored('Central connections')` when there was one). `variant` = the operator (half arrows store `->>` or `-->>`). Label `$5` trimmed (span), `''` when absent.
- `$3 === '+'` adds an `activate` event for `to` after the message; `$3 === '-'` adds a `deactivate` event for `from` after the message.
- Participants that are not declared are created at their first use, shape `rect`, label = id. `data.sequence.participants` lists ids in the order of their first declaration or use.
- Notes: ids `note1`, `note2`, …; shape `note`; label `$3`. They are nodes but not participants.
- **Stages:** every participant node 0; the k-th message or note (k = 1, 2, … in source order) has stage k (edges by edge id, notes by node id).
- `refLines` of a participant: its declaration line(s), every message line it sends or receives, every note line that names it, its `activate`/`deactivate` lines.
- Unclosed frame or box at the end → error `MESSAGES.unclosedBlock(keyword)` on its opening line.

### 5.8 Git graph (`gitgraph`) [Task 92]

Header: `/^gitGraph(?:\s+(LR|TB|BT))?\s*:?\s*$/`; direction `$1` or `LR`.

Attributes are read with `/(id|type|tag|msg|order|parent)\s*:\s*("([^"]*)"|[\w-]+)/dg` (value = `$3` when quoted, else `$2`).

- `/^commit\b(.*)$/` → new commit on the current branch
- `/^branch\s+("?)([^"\s]+)\1(.*)$/` → new branch `$2` from the current head; `order` attribute; becomes current. Exists → error `MESSAGES.gitBranchExists`
- `/^(checkout|switch)\s+("?)([^"\s]+)\2$/` → current branch = `$3`; missing → error `MESSAGES.gitNoBranch`
- `/^merge\s+("?)([^"\s]+)\1(.*)$/` → merge commit on the current branch, second parent = head of `$2`; missing branch, empty branch or same branch → error `MESSAGES.gitMergeInvalid`
- `/^cherry-pick\b(.*)$/` → new commit with label `cherry-pick: <id>`; unknown `id` → error `MESSAGES.gitNoCommit`
- The branch `main` exists from the start (index 0). Branch `colorIndex` = creation index.
- Commit node ids: `c0`, `c1`, … in source order (that is also the ordinal and the stage). Label = the `id:` attribute or `''`; `labelSpan` = span of the quoted id value when written. Shapes: `NORMAL` (default) → `filledCircle` with `size` `GIT.commitD`; `REVERSE` → `filledCircle` with `icon: 'cross'`; `HIGHLIGHT` → `framedCircle` with `size` `GIT.highlightD`; merge commits → `doubleCircle` with `size` `GIT.mergeD`. `colorIndex` = its branch's index. `refLines` = its own line.
- Edges: parent → child, kind `thick`, `markers: { start: 'none', end: 'none' }`, `colorIndex` = the child's branch for the first parent and the merged branch for a merge's second parent; cherry-pick adds a `dotted` edge from the picked commit. Edge stage = the child's stage.
- `data.gitgraph` = `{ direction, branches (name, colorIndex, order ?? creation index), commits (id = node id, branch, ordinal, tag, label) }`.

### 5.9 Block diagram (`block`) [Task 95]

Header: `/^block(-beta)?\s*$/`. A line may hold several items separated by spaces. Read items left to right with a small scanner that respects brackets and quotes.

- `columns N` or `columns auto` (whole line) → columns of the current container (`auto` → `null`)
- `space` or `space:N` → `{ type: 'space', span: N ?? 1 }`
- `block:ID` or `block:ID:N` or `block` (whole line) → open a nested block (id `ID` or `block1`, `block2`, …), span `N ?? 1`; closed by a line `end`
- `ID<["label"]>(dir)` → block arrow: shape `blockArrow`, `arrowDir` = `dir` (`right`, `left`, `up`, `down`, `x`, `y`; `x, down` and other pairs → the first word)
- `ID` + optional shape + optional `:N` → node, span `N ?? 1`
- a whole line that contains `-->`, `---` or `-- "` → edge line: `/^(.+?)\s*(?:--\s*"([^"]*)"\s*--> | --> | ---)\s*(.+)$/d`; each side is one item (it may carry a shape: `id1("Start")-->id2("Stop")`, which declares that node in place, in the current container)
- `style`, `classDef`, `class` (whole line) → as in 5.0
- Shapes use the flowchart helpers `matchBracketShape(s, p)` and `readBracketLabel(s, start, close)` from `src/mermaid/props.ts` (read their signatures first). A node with no shape is `rect` with label = id.
- Edges: `-->` → kind `arrow`, `variant: '-->'`; `---` → kind `open`, `variant: '---'`; labels from `-- "label" -->` (span).
- Nested blocks become `GraphGroup`s (`title: ''`, `parent` = enclosing block or `null`, `line`, `endLine`). Their members get `group` = that id.
- `data.block = { columns, items }` keeps the item tree in order (Part 3).
- `refLines`: none (block nodes share lines). Each node's `labelSpan` covers its label; Part 8 deletes by span.

### 5.10 Mindmap (`mindmap`) [Task 97]

Header: `/^mindmap\s*$/`. Indentation counts leading spaces; a tab counts as 4.

- For each content line (not blank, not `%%`): `indent` = its leading width. Pop the stack while the top's indent ≥ `indent`. The parent is the new top, or none. A second line with no parent → error `MESSAGES.mindmapTwoRoots`. Push the node.
- Lines starting with `::icon(` belong to the previous node → info `MESSAGES.syntaxIgnored('Mindmap icons')`. A trailing `:::a b` adds classes.
- Node text: `/^([\w-]*)(\(\(|\)\)|\(|\)|\[|\{\{)(.*)(\)\)|\(\(|\)|\(|\]|\}\})$/d`, valid only for these pairs: `((`…`))` circle, `))`…`((` bang, `(`…`)` round, `)`…`(` cloud, `[`…`]` rect, `{{`…`}}` hexagon. No match → plain text, shape `round`. A quoted label `"…"` (with optional backticks) loses its quotes and backticks. Node id = `$1` when non-empty, else `m1`, `m2`, … in order.
- Edges: parent → child, kind `open`, `markers: { start: 'none', end: 'none' }`.
- `colorIndex`: the root has none; every other node and the edge into it take the index of its top-level branch (0 for the root's first child, 1 for the second, …).
- `data.mindmap = { root, parent, children, indent }`. `refLines` of a node: its own line and its icon lines. Stages: default (depth).

### 5.11 User journey (`journey`) [Task 99]

Header: `/^journey\s*$/`.

- `/^title\s+(.+)$/` → title
- `/^section\s+(.+)$/` → new section; `colorIndex` = section index
- `/^(.+?)\s*:\s*(-?\d+)\s*(?::\s*(.*))?$/d` → task `$1` (span), score `$2`, actors `$3` split on `,` and trimmed
- A score outside 1–5 → warning `MESSAGES.journeyScore` and the score is clamped. A task before any section joins an unnamed section `''`.
- Task k (from 1): card node `t<k>` (shape `round`, label = task name, `colorIndex` = section, `labelSpan`, `refLines: [line]`); face node `f<k>` (shape `circle`, label `''`, `size` `JOURNEY.faceD` square, icon `faceHappy` for 4–5, `faceNeutral` for 3, `faceSad` for 1–2, `colorIndex` = section, `refLines: [line]`).
- Edges `f<k-1> → f<k>` for k ≥ 2: kind `open`, no markers. (Mermaid draws no such line; it is added so the animations have a path to follow.)
- Stages: `t<k>` and `f<k>` → k − 1; edge into `f<k>` → k − 1.
- `data.journey` = sections, actors (all distinct names in first-seen order), tasks.

### 5.12 Timeline (`timeline`) [Task 101]

Header: `/^timeline(?:\s+(LR|TD))?\s*$/`; direction `$1` or `LR`.

- `/^title\s+(.+)$/` → title
- `/^section\s+(.+)$/` → new section
- `/^:\s*(.+)$/` → more events for the last period (split on `/\s*:\s*/`)
- `/^([^:]+?)\s*:\s*(.+)$/d` → period `$1` with events `$2` split on `/\s*:\s*/`
- `/^([^:]+)$/d` → period with no events (only when it is not a keyword above)
- Period k (from 1): node `p<k>`, shape `round`, `colorIndex` = section index, or k − 1 when there are no sections. Its events: nodes `p<k>e<j>`, shape `rect`, same `colorIndex`. Record a `labelSpan` for every period and event text (use the `d` flag or search the raw line from the previous match end).
- Edges: `p<k-1> → p<k>` (kind `arrow`); `p<k> → p<k>e1` and `p<k>e<j-1> → p<k>e<j>` (kind `dotted`, no markers).
- Stages: everything of period k → k − 1.
- `refLines` of a period: its line and its continuation lines.

---

## Part 6. Custom layouts

### 6.0 Shared helpers

- `src/layout/title.ts` [Task 64]: `placeTitle(bounds: Rect, title: string | null, measure: MeasureText): { bounds: Rect; title: SceneLayout['title'] }`. Move the title block at the end of `layoutDoc` here, unchanged, and call it from `layoutDoc`.
- `src/layout/path.ts` [Task 71]: `makeEdgePath(id: string, from: Point, to: Point, control: Point | null, labelPoint?: Point): EdgePath`. Kind `'quad'` when `control` is set, else `'straight'`. `labelPoint` defaults to `pointOnPath(path, 0.5)`. `length`: straight → distance; quad → sum of 16 chord lengths, as `routeEdges` does.
- `src/layout/decor-bounds.ts` [Task 71]: `growBounds(bounds: Rect, decorations: Decoration[]): Rect`. Lines add both points; rectangles add the rectangle; text adds `at` ± (`text.length × (size ?? 12) × 0.6 / 2`) horizontally and ± `size ?? 12` vertically.
- `src/layout/node-box.ts` [Task 71]: `boxFor(node: GraphNode, measure: MeasureText, direction: Direction, center: Point, override?: { width?: number; height?: number }): NodeBox` = `sizeNode` result + center (+ override), copying `lines`, `runs`, `sections` and `node.arrowDir`.
- Every custom layout ends the same way:

```ts
let bounds = computeBounds(doc, { nodes, groups, edges, bounds: { x: 0, y: 0, width: 0, height: 0 }, title: null }, measure);
bounds = growBounds(bounds, decorations);
const placed = placeTitle(bounds, doc.title, measure);
return { nodes, groups, edges, decorations, bounds: placed.bounds, title: placed.title };
```

- Pins: architecture applies `doc.pins[id]` as the node centre after placement (Part 6.3). The other custom layouts ignore pins (their engines have `caps.move = false`).

### 6.1 Sequence (`src/diagrams/sequence/layout.ts`) [Task 90]

Input: `doc.data.sequence`. `col(id)` = index in `participants`. `labelW(e)` = `measure(edge.label, LAYOUT.edgeLabelFontSize)`.

1. **Participant boxes.** For column i, `sized = sizeNode(node)`; `w[i] = max(SEQ.minParticipantW, sized.width)`, `h[i] = max(SEQ.participantH, sized.height)`. `topH = max(h)`.
2. **Columns.** `x[0] = w[0] / 2`; `x[i] = x[i-1] + w[i-1] / 2 + SEQ.participantGap + w[i] / 2`.
3. **Widen for labels**, messages in event order. For a message from column a to column b, a ≠ b: `i = min(a, b)`, `j = max(a, b)`, `need = labelW + 2 × SEQ.messageLabelPad`; when `x[j] − x[i] < need`, add `need − (x[j] − x[i])` to every `x[k]` with `k ≥ j`. For a self message (a = b) with `a + 1 < n`: `need = SEQ.selfLoopW + labelW + 2 × SEQ.messageLabelPad`; when `x[a+1] − x[a] < need`, shift every `k ≥ a + 1` the same way.
4. Participant node boxes: centre `(x[i], topH / 2)`, size `w[i] × h[i]`.
5. **Rows.** `y = topH + SEQ.firstRowGap`, `lastY = y`, `level[id] = 0`, `actStart[id] = []` (stack), `open = []` (frames), `k = 0` (message counter). For each event:
   - **message** (edge e, from column a, to column b): `off(id) = level[id] > 0 ? SEQ.activationW / 2 + SEQ.activationStep × (level[id] − 1) : 0`; `dir = x[b] ≥ x[a] ? 1 : −1`.
     - a ≠ b: path `makeEdgePath(e.id, (x[a] + dir × off(from), y), (x[b] − dir × off(to), y), null, (midX, y − SEQ.labelLift))`; `lastY = y`; `y += SEQ.rowH`.
     - a = b: `p0 = (x[a] + off, y)`, `p1 = (x[a] + off, y + 24)`, control `(x[a] + off + SEQ.selfLoopW, y + 12)`, label point `(x[a] + off + SEQ.selfLoopW + 8 + chipW / 2, y + 12)` with `chipW = labelW + 2 × LAYOUT.edgeLabelPadX`; `lastY = y + 24`; `y += SEQ.selfRowH`.
     - Autonumber on: a `text` decoration, role `caption`, bold, `String(start + k × step)`, at `(p0.x + dir × 14, p0.y − SEQ.labelLift)`, align `center`; then `k++`.
     - Every open frame widens its column range to include a and b.
   - **note** (node n, placement, targets): `s = sizeNode(n)`. `left of t`: centre x `x[t] − SEQ.noteGap − s.width / 2`; `right of t`: `x[t] + SEQ.noteGap + s.width / 2`; `over t`: `x[t]`; `over t1,t2`: `xl = min`, `xr = max` of the two columns' x, centre `(xl + xr) / 2`, width `max(s.width, xr − xl + 40)`. Centre y `y + s.height / 2`. `lastY = y + s.height / 2`; `y += s.height + SEQ.noteRowGap`. Open frames widen to the target columns.
   - **activate** id: `level[id]++`; push `lastY` on `actStart[id]`.
   - **deactivate** id: when `level[id] > 0`: `start = pop`; add a `rect` decoration, role `activation`, at `x = x[c] − SEQ.activationW / 2 + SEQ.activationStep × (level[id] − 1)`, `y = start`, width `SEQ.activationW`, height `max(lastY − start, 8)`, radius 2; then `level[id]--`. When `level[id]` is 0, do nothing.
   - **frameStart**: push `{ keyword, label, startY: y, minCol: Infinity, maxCol: -Infinity, dividers: [] }`; `y += SEQ.frameHeaderH`.
   - **frameDivider**: push `{ y, label }` on the innermost frame; `y += SEQ.dividerH`.
   - **frameEnd**: pop frame f; `d` = number of frames still open. Empty range → columns 0..0. `y += SEQ.framePad`. `left = x[f.minCol] − SEQ.frameSide + SEQ.frameInset × d`, `right = x[f.maxCol] + SEQ.frameSide − SEQ.frameInset × d`. Add a `rect` decoration, role `frame`, `(left, f.startY, right − left, y − f.startY)`, radius 4, label `keyword === 'rect' ? undefined : (label ? \`${keyword} [${label}]\` : keyword)`. For each divider add a `line`(role`frameDivider`) from `(left, dy)`to`(right, dy)`and, when it has a label, a`caption`text`[${label}]`at`((left + right) / 2, dy + SEQ.dividerH / 2)`. Widen the enclosing frame (if any) to f's columns.
6. Close activations still open at `lastY`. `endY = y + SEQ.bottomPad`.
7. **Lifelines:** one `line` decoration per participant, role `lifeline`, from `(x[i], topH)` to `(x[i], endY)`.
8. **Boxes:** for each box with member columns `lo..hi`: a `rect` decoration, role `frame`, `(x[lo] − w[lo] / 2 − SEQ.boxPad, −SEQ.boxPad, …, endY + 2 × SEQ.boxPad)` reaching `x[hi] + w[hi] / 2 + SEQ.boxPad`, label = box label.
9. `decorations` = boxes, then frames and dividers, then lifelines, then activations, then captions (this is the drawing order). `groups = {}`. Finish as in 6.0.

Worked example (used by the Task 90 test, with `testMeasure`, 8 px per character): `Alice->>Bob: Hello` → `x = [50, 190]`, participants centred at y 22, the message runs from (50, 68) to (190, 68), label point (120, 56). With the label `A very long message text here` (29 characters, need 264), Bob moves to x 314.

### 6.2 Git graph (`src/diagrams/gitgraph/layout.ts`) [Task 92]

1. Lanes: sort `branches` by `order`, then by `colorIndex`; a branch's lane is its position.
2. Commit centres. LR: `(GIT.labelColW + ordinal × GIT.commitGap + GIT.commitGap / 2, lane × GIT.laneGap)`. TB: `(lane × GIT.laneGap, 40 + ordinal × GIT.commitGap + GIT.commitGap / 2)`. BT: like TB with `ordinal` replaced by `maxOrdinal − ordinal`. Box sizes from `node.size`.
3. Edge paths (parent P → child C): `from = borderPoint(Pbox, Pshape, C.center)`, `to = borderPoint(Cbox, Cshape, P.center)`. Same branch → straight. First parent of a commit on another branch (a branch-off) → control `(from.x, to.y)` in LR, `(to.x, from.y)` in TB/BT. A merge's second parent or a cherry-pick → control `(to.x, from.y)` in LR, `(from.x, to.y)` in TB/BT. Use `makeEdgePath`.
4. Decorations, in this order:
   - Per branch, a `lane` line from the label column to the last commit of that lane plus `GIT.commitGap / 2` (LR: `(GIT.labelColW − 8, laneY)` → `(lastX, laneY)`; TB/BT: from `(laneX, 30)` down), `colorIndex` = the branch's.
   - Per branch, a `band` rect holding the name: LR `(0, laneY − 12, GIT.labelColW − 16, 24)`, TB `(laneX − 40, 0, 80, 24)`, BT the same at `y = 40 + (maxOrdinal + 1) × GIT.commitGap + 10`; radius 12, `label` = name, `colorIndex`.
   - Per commit with a label: `caption` text at `(cx, cy + GIT.captionDrop)` centred (LR), or `(cx + 16, cy)` left aligned (TB/BT).
   - Per commit with a tag: `tag` rect `(cx − tw / 2, cy − GIT.tagLift − 10, tw, 20)` with `tw = measure(tag, 12) + 16`, radius 4, `label` = tag.
5. Finish as in 6.0.

### 6.3 Architecture (`src/diagrams/architecture/layout.ts`) [Task 86]

1. Grid placement by breadth-first search over services and junctions, in declaration order. Place the first unplaced node at `(maxCol + 2, 0)` (the very first at `(0, 0)`), then visit its edges. For an edge `a:S1 -- S2:b` with `a` placed at `(c, r)` and `b` unplaced: `S1 = R` → `(c + 1, r)`, `L` → `(c − 1, r)`, `T` → `(c, r − 1)`, `B` → `(c, r + 1)`. With `b` placed and `a` unplaced, use `S2` from `b`'s cell the same way. If the target cell is taken, keep stepping in the same direction until a free cell. Group-modifier edges count as edges between the two services.
2. `cellW = max node width + ARCH.gapX`, `cellH = max node height + ARCH.gapY`. Centre = `(col × cellW, row × cellH)`. Then a pin (`doc.pins[id]`) replaces the centre.
3. Groups: `computeGroups(doc, nodes)`.
4. Edges: side point of a node box: `R (cx + w/2, cy)`, `L (cx − w/2, cy)`, `T (cx, cy − h/2)`, `B (cx, cy + h/2)`; of a group: the same on its rectangle. When `|dx| < 1` or `|dy| < 1` → straight; else a quad with control `(to.x, from.y)` when the from side is `L` or `R`, `(from.x, to.y)` when it is `T` or `B`.
5. Finish as in 6.0 (no decorations).

### 6.4 Block (`src/diagrams/block/layout.ts`) [Task 95]

1. Size every leaf with `sizeNode`. `unitW = max(BLOCK.minUnitW, widest leaf)`, `unitH = tallest leaf`.
2. `placeItems(items, cols, unitW, unitH, x0, y0): number` returns the height used. Top level: `cols = data.columns ?? items.length`, `x0 = y0 = 0`. Cursor `c = 0`, `rowTop = y0`, `rowH = 0`. For each item: `span = min(item.span, cols)`; when `c + span > cols`: `rowTop += rowH + BLOCK.gap`, `c = 0`, `rowH = 0`. `x = x0 + c × (unitW + BLOCK.gap)`, `w = span × unitW + (span − 1) × BLOCK.gap`.
   - node: box centre `(x + w / 2, rowTop + unitH / 2)`, width `w`, height `unitH`, `arrowDir` copied; `rowH = max(rowH, unitH)`.
   - space: nothing drawn.
   - block: `innerCols = item.columns ?? item.children.length`; `innerUnitW = (w − 2 × BLOCK.pad − (innerCols − 1) × BLOCK.gap) / innerCols`; `innerH = placeItems(item.children, innerCols, innerUnitW, unitH, x + BLOCK.pad, rowTop + BLOCK.pad)`; group rectangle `(x, rowTop, w, innerH + 2 × BLOCK.pad)`, title `''`, depth = nesting depth; `rowH = max(rowH, innerH + 2 × BLOCK.pad)`.
   - `c += span`.
     Return `rowTop + rowH − y0`.
3. Edges: `routeEdges(doc, nodes, groups)`. Finish as in 6.0.

### 6.5 Mindmap (`src/diagrams/mindmap/layout.ts`) [Task 97]

1. Size every node with `sizeNode`.
2. `subH(v) = max(h(v), Σ subH(children) + MINDMAP.siblingGap × (count − 1))` (a leaf: `h(v)`).
3. Root at `(0, 0)`. The root's children in order: the first `ceil(n / 2)` go right, the rest go left.
4. `place(v, side)`: the children of `v` (all on `v`'s side; for the root, each half separately) form a column whose total height is `Σ subH + gaps`, centred on `v.y`. Each child's centre y = column top + `subH(child) / 2`, advancing by `subH(child) + MINDMAP.siblingGap`. Right side: `child.x = v.x + v.w / 2 + MINDMAP.levelGap + child.w / 2`; left side: `child.x = v.x − v.w / 2 − MINDMAP.levelGap − child.w / 2`. Recurse.
5. Edges: `routeEdges(doc, nodes, {})`. Finish as in 6.0.

### 6.6 Journey (`src/diagrams/journey/layout.ts`) [Task 99]

1. `cardW = max(JOURNEY.taskMinW, widest card)`, `cardH = tallest card`. Task k (from 1): `x_k = JOURNEY.legendW + (k − 1) × (cardW + JOURNEY.taskGap) + cardW / 2`.
2. Cards: centre `(x_k, JOURNEY.sectionH + JOURNEY.cardGap + cardH / 2)`, width `cardW`. `cardTop = JOURNEY.sectionH + JOURNEY.cardGap`, `cardBottom = cardTop + cardH`.
3. Faces: centre `(x_k, cardBottom + JOURNEY.faceGap + JOURNEY.faceD / 2 + (5 − score) × JOURNEY.scoreStep)`.
4. Decorations, in order: a `band` rect per named section over its tasks `(x_first − cardW / 2, 0, x_last − x_first + cardW, JOURNEY.sectionH)`, radius 6, `label`, `colorIndex`; a `lifeline` line per task from `(x_k, cardBottom)` to the face top; per actor j a legend dot (`band` rect `(0, cardTop + j × JOURNEY.actorRowH, actorDot, actorDot)`, radius `actorDot / 2`, `colorIndex: j`) and a `caption` text (left) `(actorDot + 6, cardTop + j × actorRowH + actorDot / 2)`; per task actor m (its index in the task's list, colour = its index in `actors`) a dot `(x_k − cardW / 2 + 8 + m × (actorDot + 4), cardTop − actorDot / 2, actorDot, actorDot)`.
5. Edges between faces: `makeEdgePath` from `borderPoint(prev face, 'circle', this.center)` to `borderPoint(this face, 'circle', prev.center)`. Finish as in 6.0.

### 6.7 Timeline (`src/diagrams/timeline/layout.ts`) [Task 101]

LR (default): `colW = max(TIMELINE.colMinW, widest period or event)`, `periodH`, `eventH` = tallest of each. `y0 = sections exist ? TIMELINE.sectionH + TIMELINE.rowGap : 0`. Period k: centre `((k − 1) × (colW + TIMELINE.colGap) + colW / 2, y0 + periodH / 2)`, width `colW`. Event j of period k: same x, y `y0 + periodH + TIMELINE.rowGap + (j − 1) × (eventH + TIMELINE.eventGap) + eventH / 2`, width `colW`. Section bands: `band` rect over the section's periods `(x_first − colW / 2, 0, x_last − x_first + colW, TIMELINE.sectionH)`, radius 6, label, `colorIndex`.

TD: period k centre `(colW / 2, (k − 1) × (max(periodH, eventH) + TIMELINE.colGap) + periodH / 2)`; its events in a row to the right: x `colW + TIMELINE.colGap + (j − 1) × (colW + TIMELINE.eventGap) + colW / 2`, same y. No section bands in TD (colours still apply).

Edges: `makeEdgePath` between `borderPoint`s of the two boxes. Finish as in 6.0.

---

## Part 7. Rendering

### 7.1 Sizing (`src/layout/measure.ts` and new `src/layout/sections.ts`) [Tasks 68, 69]

At the top of `sizeNode`, before the existing code:

1. `node.size` set → return `{ width, height, lines: node.label ? wrapLabel(node.label, LAYOUT.labelWrapWidth, measure) : [] }`.
2. `node.sections` set → return `{ ...sizeSections(node.sections, measure), lines: [] }`.

`sizeSections(sections: NodeSection[], measure: MeasureText): { width: number; height: number; sections: SectionBox[] }`:

- In a section whose rows all have one cell, split a cell wider than `LAYOUT.labelWrapWidth` into several rows with `wrapLabel`.
- Drop columns that are empty (`''`) in every row of the section.
- Column width = widest cell, measured with `measure(cell, LAYOUT.sectionFontSize, { bold: weight === 'bold', italic: weight === 'italic' })`. `rowW = Σ colW + (cols − 1) × LAYOUT.sectionColGap`. `colX[c] = LAYOUT.sectionPadX + Σ colW[<c] + c × LAYOUT.sectionColGap`.
- Section height = `rows.length × LAYOUT.sectionLineH + 2 × LAYOUT.sectionPadY`, or `LAYOUT.sectionMinH` when it has no rows. `top` = sum of the heights above it.
- Width = `max(LAYOUT.minNodeW, widest rowW + 2 × LAYOUT.sectionPadX)`. Height = sum of section heights.

Worked examples (with `testMeasure`, 8 px per character): class `Animal` with `+int age` and `+eat() void` → width 112, height 90, section tops 0, 30, 60. ER entity `CUSTOMER` with rows `[string, name, PK, '']` and `[int, id, '', '']` → width 144, height 78; attribute section `colX = [12, 72, 116]` (the comment column is dropped).

After the existing size computation, in its shape switch, add: `note` → `width += LAYOUT.noteFold`; `actor` → `width = max(LAYOUT.actorMinW, widest line + 8)`, `height = LAYOUT.actorFigureH + lines.length × LAYOUT.lineHeight + 4`; `ellipse` → width and height × `LAYOUT.ellipseScale`; `cloud` → × `LAYOUT.cloudScale`; `bang` → × `LAYOUT.bangScale`; `blockArrow` → `right`, `left`, `x`: `width += LAYOUT.blockArrowHead`; `up`, `down`, `y`: `height += LAYOUT.blockArrowHead`. Then, for any node with `icon`: `height += LAYOUT.iconSize + LAYOUT.iconGap`, `width = max(width, LAYOUT.iconSize + 2 × LAYOUT.nodePadX)`.

The return type of `sizeNode` gains `sections?: SectionBox[]`. `layoutDoc` copies `sections` into each `NodeBox`. `structureKey` appends, per node, `` `\0${JSON.stringify(n.sections ?? null)}\0${n.icon ?? ''}\0${n.size ? `${n.size.width}x${n.size.height}` : ''}\0${n.arrowDir ?? ''}` `` and, at the end, `` `|${doc.kind ?? ''}` ``.

### 7.2 Node content (`src/render/sections.ts`, `src/render/label-pos.ts`, `src/render/icons.ts`) [Tasks 68, 69]

- `labelCenter(node: GraphNode, box: NodeBox): Point`: `actor` → `(cx, top + LAYOUT.actorFigureH + n × LAYOUT.lineHeight / 2)`; a node with `icon` and a label → `(cx, top + LAYOUT.nodePadY + LAYOUT.iconSize + LAYOUT.iconGap + n × LAYOUT.lineHeight / 2)`; otherwise `box.center`. (`n` = `box.lines.length`, `top = cy − h / 2`.)
- `drawNodeLines(ctx, box, textProg, center = box.center)`: new optional fourth parameter (in `src/render/draw-runs.ts`); the existing two callers do not pass it.
- `drawSections(ctx, box, st, textProg)` and `svgSections(box, st): string`: for each section, when `divider`, a 1 px line in `st.stroke` across the box at `top + s.top`. Row r of a section is drawn at `y = top + s.top + LAYOUT.sectionPadY + (r + 0.5) × LAYOUT.sectionLineH` in `st.text`, font `` `${weight === 'normal' ? '' : weight + ' '}${LAYOUT.sectionFontSize}px ${FONT_STACK_SANS}` ``. Centre-aligned rows: cells joined with a space, centred on `cx`. Left-aligned rows: each cell at `left + s.colX[c]`, `textAlign = 'left'`. With a typewriter progress p, only the first `ceil(totalRows × p)` rows (counting across sections) are drawn.
- Icons. `IconPrim = { op: 'circle'; cx: number; cy: number; r: number; fill?: boolean } | { op: 'ellipse'; cx: number; cy: number; rx: number; ry: number } | { op: 'poly'; pts: [number, number][]; closed?: boolean } | { op: 'arc'; cx: number; cy: number; r: number; a0: number; a1: number }`, in a 24 × 24 box:
  - `server`: poly closed `(3,3)(21,3)(21,10)(3,10)`; poly closed `(3,14)(21,14)(21,21)(3,21)`; circle `(6.5,6.5) r1` filled; circle `(6.5,17.5) r1` filled.
  - `database`: ellipse `(12,5) 8×3`; poly `(4,5)(4,19)`; poly `(20,5)(20,19)`; ellipse `(12,19) 8×3`.
  - `disk`: circle `(12,12) r9`; circle `(12,12) r2.5` filled.
  - `internet`: circle `(12,12) r9`; ellipse `(12,12) 4×9`; poly `(3,12)(21,12)`; poly `(5,7)(19,7)`; poly `(5,17)(19,17)`.
  - `cloud`: circles `(8,14) r4`, `(13,10) r5`, `(17,14) r4`; poly `(6,18)(19,18)`.
  - `faceHappy`: circle `(12,12) r9`; circles `(9,10) r1` and `(15,10) r1` filled; arc `(12,13) r4` from `0.15π` to `0.85π`.
  - `faceNeutral`: the same circle and eyes; poly `(8.5,16)(15.5,16)`.
  - `faceSad`: the same circle and eyes; arc `(12,18) r4` from `1.15π` to `1.85π`.
  - `cross`: poly `(7,7)(17,17)`; poly `(17,7)(7,17)`.
- `drawIcon(ctx, name, cx, cy, size, color)` and `svgIcon(name, cx, cy, size, color): string`: scale `size / 24`, origin `(cx − size / 2, cy − size / 2)`, line width 1.5, strokes in `color`, `fill: true` circles filled in `color`. SVG arcs: `M x0 y0 A r r 0 <large> 1 x1 y1`, `large = a1 − a0 > π ? 1 : 0`. Icon size = `min(LAYOUT.iconSize, box.width × 0.6)`. Icon centre: the box centre when the label is empty, else `(cx, top + LAYOUT.nodePadY + size / 2)`. Colour: `st.fill` on a `filledCircle`, else `st.stroke`.
- In the node drawing (classic branch of `src/render/draw-nodes.ts`, and `src/render/svg-nodes.ts`): after the shape is filled and stroked, a node with `box.sections` draws its sections and no label; otherwise a node with `icon` draws the icon, then its label (if any) at `labelCenter`; otherwise the existing label code runs unchanged. `actor` nodes draw the stick figure and no outline.

### 7.3 New shapes (`src/render/shapes-new.ts`, `src/layout/polygon.ts`) [Task 69]

Let `l, r, t, b` be the box edges, `cx, cy` the centre, `w, h` the size.

- `note`: path `(l, t) (r − f, t) (r, t + f) (r, b) (l, b)` closed, with `f = LAYOUT.noteFold`; inner fold line `(r − f, t) (r − f, t + f) (r, t + f)`. Border: rectangle.
- `actor`: no outline. Figure in `st.stroke`, width `st.strokeWidth`: head circle `(cx, t + 10) r 8`; body `(cx, t + 18)` → `(cx, t + 36)`; arms `(cx − 12, t + 24)` → `(cx + 12, t + 24)`; legs `(cx, t + 36)` → `(cx − 10, t + 50)` and → `(cx + 10, t + 50)`. Border and hit area: rectangle.
- `ellipse`: `ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2π)`; SVG `<ellipse>`. Border: for direction `(dx, dy)` from the centre, the point at `s = 1 / sqrt((dx / a)² + (dy / b)²)` along it, `a = w / 2`, `b = h / 2`.
- `cloud`: ten points `P_k` on the ellipse `(w / 2, h / 2)` at angles `k × 2π / 10`; `moveTo(P_0)`, then for each k `quadraticCurveTo(C_k, P_{k+1})` (indices mod 10), where `C_k` is on the ellipse scaled by 1.25 at angle `(k + 0.5) × 2π / 10`; close. SVG: the same as `M … Q …`. Border: ellipse.
- `bang`: polygon of 16 points at angles `k × 2π / 16`, radius factor 1 for even k and 0.75 for odd k, on the ellipse `(w / 2, h / 2)`. `shapePolygon` returns it.
- `blockArrow`: polygon, by `box.arrowDir`. Right: `(l, cy − h/4) (r − h/2, cy − h/4) (r − h/2, t) (r, cy) (r − h/2, b) (r − h/2, cy + h/4) (l, cy + h/4)`. Left: mirror around `cx`. Up and down: the same with x and y swapped, using `w` for the head (`w / 2` and `w / 4`). `x`: heads on both ends `(l, cy) (l + h/2, t) (l + h/2, cy − h/4) (r − h/2, cy − h/4) (r − h/2, t) (r, cy) (r − h/2, b) (r − h/2, cy + h/4) (l + h/2, cy + h/4) (l + h/2, b)`; `y`: the same rotated. `shapePolygon` returns it.
- `shapeShadeTier`: `note` 3, `actor` 0, `ellipse` 1, `cloud` 2, `bang` 3, `blockArrow` 2.
- `src/core/shapes.ts`: `SHAPE_NAMES` and `SHAPE_SHORT` become `Record<FlowShapeKind, string>` (unchanged entries). Code that indexes them with a `ShapeKind` uses `(SHAPE_NAMES as Record<string, string>)[shape]`. `shapeTokens` in `src/mermaid/format.ts` returns `null` for the new shapes.

### 7.4 Markers (`src/render/markers.ts`) [Task 70]

`tip` is the end point, `u` the unit direction of travel into the tip (end marker: `tangentAt(path, 1)`, or the tangent at the grow point; start marker: `−tangentAt(path, 0)` at `path.from`), `n = (−u.y, u.x)`, `s = LAYOUT.arrowSize`.

| Kind              | Primitives                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `openArrow`     | polyline `T − s·u + 0.5s·n`, `T`, `T − s·u − 0.5s·n`; stroke only, edge width                             |
| `triangle`      | polygon `T`, `T − 1.4s·u + 0.7s·n`, `T − 1.4s·u − 0.7s·n`; fill background, stroke edge colour, width 1.5 |
| `diamond`       | polygon `T`, `T − s·u + 0.5s·n`, `T − 2s·u`, `T − s·u − 0.5s·n`; fill background, stroke, width 1.5   |
| `diamondFilled` | the same polygon, filled with the edge colour                                                                          |
| `erOne`         | bars at d = 6 and d = 11: segment `T − d·u ± 0.7s·n`; width 1.5                                                  |
| `erZeroOrOne`   | bar at d = 6; circle at `T − 15·u`, r 4, fill background, stroke                                                   |
| `erOneOrMore`   | crow's foot: `B = T − 12·u`, segments `B → T + 0.7s·n`, `B → T`, `B → T − 0.7s·n`; bar at d = 15       |
| `erZeroOrMore`  | crow's foot; circle at `T − 18·u`, r 4, fill background, stroke                                                    |

```ts
export type MarkerPrim =
  | { type: 'poly'; points: Point[]; closed: boolean; fill: 'none' | 'stroke' | 'background' }
  | { type: 'circle'; c: Point; r: number; fill: 'stroke' | 'background' };
export function markerPrims(kind: MarkerKind, tip: Point, u: Point, size?: number): MarkerPrim[]; // [] for none, arrow, circle, cross
export function drawMarker(ctx: CanvasRenderingContext2D, prims: MarkerPrim[], stroke: string, background: string, width: number): void;
export function svgMarker(prims: MarkerPrim[], stroke: string, background: string, width: number): string; // elements carry class="marker-extra"
```

`arrow`, `circle` and `cross` keep their existing drawing code in `draw-edges.ts` and `svg.ts`, untouched. After the existing `if … else if` chains for the end and the start markers, add one more `else if (kind !== 'none')` branch that calls `drawMarker` / `svgMarker`. Background colour = `theme.background`.

`edgeStyle` (in `src/render/style.ts`): the marker fields become `MarkerKind`. At the end, when `edge.markers` is set, `endMarker = edge.markers.end`, `startMarker = edge.markers.start`, `startArrow = startMarker === 'arrow'`.

### 7.5 End labels (`src/render/edge-extras.ts`) [Task 70]

`endLabelPoints(path: EdgePath, labels: { from?: string; to?: string }): { at: Point; text: string }[]`: from-label at `path.from + LAYOUT.endLabelAlong × t0 + LAYOUT.endLabelAcross × n0` (`t0 = tangentAt(path, 0)`, `n0 = (−t0.y, t0.x)`); to-label at `path.to − LAYOUT.endLabelAlong × t1 + LAYOUT.endLabelAcross × n1` (`t1 = tangentAt(path, 1)`, `n1 = (−t1.y, t1.x)`). `drawEdgeEndLabels(ctx, scene, theme, frame)` draws them centred, `${LAYOUT.endLabelFontSize}px`, in `theme.edgeLabelText`, skipping invisible edges and edges whose `frame.edgeGrow` is below 1. `svgEdgeEndLabels(scene, theme): string`. Called right after the edge labels in `drawScene` and in `renderSvg`.

### 7.6 Decorations (`src/render/decorations.ts`) [Task 71]

`drawDecorations(ctx, decorations, theme)` and `svgDecorations(decorations, theme): string`, called after the groups and before the edges in both `drawScene` and `renderSvg`. `shade = shadeFor(theme, colorIndex)` (Part 7.7); without a colour index the fallback colours below apply.

| Role             | Draw                                                                                                                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lifeline`     | line, `theme.edge`, width 1, dash `[4, 4]`, alpha 0.6                                                                                                                    |
| `activation`   | rect, fill `theme.nodeFill`, stroke `theme.nodeStroke`, width 1                                                                                                          |
| `frame`        | rect, fill `theme.groupFill`, stroke `theme.groupStroke`, width 1.5; label bold 13 px, left, at `(x + 8, y + 14)`, `theme.groupTitle`                                |
| `frameDivider` | line, `theme.groupStroke`, width 1, dash `[6, 4]`                                                                                                                        |
| `band`         | rect, fill `shade.fill` (fallback `theme.groupFill`), stroke `shade.stroke` (fallback `theme.groupStroke`), width 1.5; label bold 14 px, centred, `theme.nodeText` |
| `lane`         | line, `shade.stroke` (fallback `theme.edge`), width 2, dash `[2, 6]`, alpha 0.5                                                                                        |
| `tag`          | rect, fill `theme.edgeLabelBg`, stroke `theme.edge`, width 1; label 12 px, centred, `theme.edgeLabelText`                                                              |
| `caption`      | text, `theme.nodeText`, `${bold ? 'bold ' : ''}${size ?? 12}px`                                                                                                          |
| `axis`         | line, `theme.edge`, width 2                                                                                                                                                |

Text decorations of any other role use `theme.nodeText`. `ctx.save()` / `ctx.restore()` around each decoration so dashes and alpha never leak. SVG output uses `fmt` for every number and `escapeXml` for every text.

### 7.7 Colour index and card styles [Task 71]

- `shadeFor(theme: Theme, colorIndex: number | undefined): NodeShade | null` in `src/render/style.ts`: `null` when `colorIndex` is undefined or `theme.shadingMode === 'off'`; else `theme.nodeShades?.[colorIndex % 4] ?? { fill: theme.nodeFill, stroke: theme.nodeStroke }`.
- `nodeStyle`: after the shading block, `const ci = shadeFor(theme, node.colorIndex); if (ci) { defaultFill = ci.fill; defaultStroke = ci.stroke; }`. Explicit `node.style` still wins.
- `edgeStyle`: when `shadeFor(theme, edge.colorIndex)` is not null, the default stroke is its `stroke` and the true/false label colouring is skipped. Explicit `edge.style.stroke` still wins.
- In `src/render/draw-nodes.ts`: `const cardMode = (scene.doc.kind ?? 'flowchart') === 'flowchart' ? options.cardMode : 'classic';`, used both for drawing and for the selection outline.

### 7.8 Animation stages (`src/anim/stages.ts`) [Task 72]

```ts
export interface Stages { node: Record<string, number>; edge: Record<string, number>; count: number }
export function animStages(doc: ParsedDoc): Stages;
```

- With `doc.stages`: `node` = `doc.stages.nodes` (missing ids → 0), `edge[e.id]` = `doc.stages.edges[e.id] ?? node[e.from] ?? 0`.
- Without: `node = computeDepths(doc)` (from `src/render/prepared.ts`), `edge[e.id] = node[e.from] ?? 0`.
- `count = 1 + max(all node and edge values, 0)`.

Changes, each keeping today's flowchart numbers exactly:

- `src/anim/anim.ts` (pulse): use `animStages(scene.doc).edge[edge.id]` where it uses `nodeDepths[edge.from]` today (both in the max loop and per edge).
- `src/anim/build-anim.ts`, `frameStateBuild`: node stage from `st.node`, edge stage from `st.edge`, `stages = st.count`.
- `frameStateTypewriter`: first line `if (scene.doc.stages) return frameStateBuild(scene, _settings, p);`.
- `src/anim/steps.ts`, `buildSteps`: `count` steps; node into `st.node[id]`; edge into `doc.stages ? st.edge[e.id] : Math.min((st.node[e.from] ?? 0) + 1, st.count − 1)`.

---

## Part 8. Editing

### 8.0 Shared edit kit (`src/diagrams/common/edit.ts`) [Task 67]

```ts
export function guardOk(doc: ParsedDoc): TextOpResult | null;          // { error: MESSAGES.fixTextFirst } when !doc.ok
export function textLines(text: string): string[];                     // split on '\n', trailing empty lines removed
export function joinLines(lines: string[]): string;                    // lines.join('\n') + '\n'
export function replaceSpan(text: string, span: Span, value: string): string;
export function deleteLines(text: string, lineIdx: number[]): string;  // any order, duplicates allowed
export function insertLine(text: string, afterIdx: number, line: string): string; // -1 = before the first line
export function appendLine(text: string, doc: ParsedDoc, line: string): string;   // inserts `line` exactly as given after lastContentLine(doc)
export function appendLines(text: string, doc: ParsedDoc, lines: string[]): string; // the same for several lines, kept in order
export function lastContentLine(doc: ParsedDoc): number;               // last line whose kind is not blank, comment, pos, directive or frontmatter
export function indentOf(line: string): string;
export function nextId(doc: ParsedDoc, prefix: string): string;        // prefix + (largest n of ids matching ^prefix(\d+)$, plus 1)
export function cleanForText(label: string, forbid: RegExp): string;   // '\n' → ' '; chars matching forbid (global) → ' '; collapse spaces; trim; '' → 'New'
export function upsertStyleLine(text: string, doc: ParsedDoc, id: string, style: StyleMap): string; // `style <id> k:v,…`, merged with an existing line; '' values remove keys; no keys left → line removed
export function upsertClassStyle(text: string, doc: ParsedDoc, id: string, style: StyleMap): string; // `classDef gc_<id> k:v,…` + `class <id> gc_<id>`
export function pinOps(text: string, doc: ParsedDoc, op: TextOp, caps: EditCaps): TextOpResult | null; // setPin / clearPins via setPinInternal / clearPinsInternal when caps.move; { error: opUnsupported } when not; null for other ops
export function deleteNodeGeneric(text: string, doc: ParsedDoc, id: string): TextOpResult;  // node.refLines + edge.line of each edge touching id + the node's pin line
export function deleteEdgeGeneric(text: string, doc: ParsedDoc, index: number): TextOpResult; // edge.line when no other edge has that line; else { error: opUnsupported }
export function renameBySpan(text: string, span: Span | undefined, label: string, forbid: RegExp): TextOpResult | null; // null when span is undefined
export function rebuildLine(text: string, lineIdx: number, content: string): string; // keeps the line's indentation
export function mirrorOp(op: string): string;                          // reverse the characters, then swap < with > and { with }
```

Every engine's `applyOp(text, op)` follows the same order:

1. `const doc = engine.parse(text)`; `guardOk(doc)` → return it when not null.
2. `pinOps(text, doc, op, caps)` → return it when not null.
3. Unknown node id → `{ error: MESSAGES.unknownNode(id) }`; unknown edge index → `{ error: MESSAGES.unknownEdge(i) }`.
4. The op table of the engine (below). An op not in the table → `{ error: MESSAGES.opUnsupported }`.
5. `addNode` returns `{ text, createdId }`; when `op.pin` is set and `caps.move`, it then applies `setPinInternal(text, createdId, op.pin.x, op.pin.y, true)`.
6. `addNode` uses `op.shape` when it is one of `addChoices`, otherwise the first choice.

`mirrorOp` examples: `<|--` → `--|>`, `-->` → `<--`, `..|>` → `<|..`, `*--` → `--*`, `||--o{` → `}o--||`, `|o--o{` → `}o--o|`.

### 8.1 Capabilities and choices per engine

| Engine       | add | connect | rename | delete | move | shape | style | edgeVariant | reverse |
| ------------ | --- | ------- | ------ | ------ | ---- | ----- | ----- | ----------- | ------- |
| sequence     | yes | yes     | yes    | yes    | no   | yes   | no    | yes         | yes     |
| class        | yes | yes     | yes    | yes    | yes  | no    | yes   | yes         | yes     |
| state        | yes | yes     | yes    | yes    | yes  | no    | yes   | no          | yes     |
| er           | yes | yes     | yes    | yes    | yes  | no    | yes   | yes         | yes     |
| requirement  | yes | yes     | yes    | yes    | yes  | no    | yes   | yes         | yes     |
| usecase      | yes | yes     | yes    | yes    | yes  | no    | yes   | yes         | yes     |
| architecture | yes | yes     | yes    | yes    | yes  | no    | no    | yes         | yes     |
| block        | yes | yes     | yes    | yes    | no   | yes   | yes   | yes         | no      |
| gitgraph     | yes | no      | yes    | yes    | no   | no    | no    | no          | no      |
| journey      | yes | no      | yes    | yes    | no   | no    | no    | no          | no      |
| timeline     | yes | no      | yes    | yes    | no   | no    | no    | no          | no      |
| mindmap      | yes | yes     | yes    | yes    | no   | yes   | no    | no          | no      |

| Engine       | addChoices (value: name)                                                                                                | shapeChoices                            | edgeVariants (value: name)                                                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sequence     | `rect`: Participant, `actor`: Actor                                                                                 | `rect`: Participant, `actor`: Actor | `->>`: Arrow, `-->>`: Dotted arrow, `->`: Line, `-->`: Dotted line, `-x`: Cross, `--x`: Dotted cross, `-)`: Async, `--)`: Dotted async, `<<->>`: Both ways, `<<-->>`: Dotted, both ways   |
| class        | `rect`: Class                                                                                                         | –                                      | `<\|--`: Inheritance, `*--`: Composition, `o--`: Aggregation, `-->`: Association, `--`: Link, `..>`: Dependency, `..\|>`: Realization, `..`: Dashed link                                        |
| state        | `round`: State                                                                                                        | –                                      | –                                                                                                                                                                                                            |
| er           | `rect`: Entity                                                                                                        | –                                      | `\|\|--\|\|`: One to one, `\|\|--o{`: One to zero or more, `\|\|--\|{`: One to one or more, `\|o--o{`: Zero or one to zero or more, `}o--o{`: Many to many, `\|\|..o{`: One to zero or more (non-identifying) |
| requirement  | `rect`: Requirement, `document`: Element                                                                            | –                                      | `contains`, `copies`, `derives`, `satisfies`, `verifies`, `refines`, `traces` (name = value)                                                                                                    |
| usecase      | `ellipse`: Use case, `actor`: Actor, `rect`: Box                                                                  | –                                      | `-->`: Association, `--`: Line, `--\|>`: Generalization, `..>`: Include or extend                                                                                                                      |
| architecture | `round`: Service                                                                                                      | –                                      | `--`: Line, `-->`: Arrow, `<--`: Arrow back, `<-->`: Both ways                                                                                                                                        |
| block        | flowchart shapes from `SHAPE_NAMES` except `smallCircle`, `filledCircle`, `framedCircle`, `forkBar`, `text` | same as addChoices                      | `-->`: Arrow, `---`: Line                                                                                                                                                                                 |
| gitgraph     | `filledCircle`: Commit                                                                                                | –                                      | –                                                                                                                                                                                                            |
| journey      | `round`: Task                                                                                                         | –                                      | –                                                                                                                                                                                                            |
| timeline     | `round`: Period                                                                                                       | –                                      | –                                                                                                                                                                                                            |
| mindmap      | `round`: Rounded, `rect`: Square, `circle`: Circle, `bang`: Bang, `cloud`: Cloud, `hexagon`: Hexagon        | same                                    | –                                                                                                                                                                                                            |

(In the table, `\|` stands for the character `|`; Markdown needs the escape. The values in code have no backslash: for example `'<|--'` and `'||--o{'`.)

### 8.2 Op tables

`forbid` is the regex passed to `cleanForText` and `renameBySpan`. "Append `X`" means `appendLine(text, doc, indent + X)` where `indent` is the indentation of the last content line, or two spaces when that line is the header; an op that names its own indentation uses that instead. Several lines use `appendLines`. Ids come from `nextId`. Every label written by an op passes through `cleanForText` with the engine's `forbid` first.

**Sequence** (forbid `/[";#]/g`)

- `addNode`: id `P<n>`; `actor P<n> as <label>` or `participant P<n> as <label>`; inserted after the last participant declaration line, or right after the header.
- `addEdge`: append `<from>->><to>: <label or 'message'>`.
- `renameNode`: participant with `labelSpan` → replace it; declared without alias → add ` as <label>` at the end of the declaration line; implicit (never declared) → insert `participant <id> as <label>` directly **before the line where it is first used** (`insertLine(text, node.line − 1, …)`, with that line's indentation), so the column order does not change. Note → replace its span.
- `renameEdge`: `labelSpan` → replace; none → add `: <label>` at the end of the line.
- `deleteNode`, `deleteEdge`: generic.
- `setEdgeVariant`: `replaceSpan(opSpan, variant)`.
- `reverseEdge`: `rebuildLine(line, \`${to}${variant}${from}\` + (label ? \`: ${label}\` : ''))`(activation suffixes are dropped; record this in`DECISIONS.md`).
- `setShape` (`rect` ↔ `actor`): change the keyword of the declaration line; an implicit participant gets `participant <id>` or `actor <id>` inserted before its first use, as in `renameNode`.

**Class** (forbid `/["]/g`)

- `addNode`: id `Class<n>`; append `class Class<n>["<label>"]`.
- `addEdge`: append `<from> --> <to>` plus ` : <label>` when given.
- `renameNode`: `labelSpan` → replace; a `class X` line without a label → insert `["<label>"]` right after the id (before `:::` or `{`); no declaration → insert `class <id>["<label>"]` after the header. Note → replace its span.
- `renameEdge`: `labelSpan` → replace; none → add ` : <label>`.
- `deleteNode`, `deleteEdge`: generic.
- `setEdgeVariant`: `replaceSpan(opSpan, variant)`, then make sure a space sits on both sides of the operator.
- `reverseEdge`: rebuild `<to>[ "<toCard>"] <mirrorOp(op)> ["<fromCard>" ]<from>[ : <label>]`.
- `setNodeStyle`: `upsertStyleLine`.

**State** (forbid `/[:;"]/g`)

- `addNode`: id `S<n>`; append `S<n> : <label>` (root scope).
- `addEdge`: both ends must share a scope, else `{ error: MESSAGES.crossScope }`. Pseudo-states are written `[*]`. Root scope → append; composite G → `insertLine(text, G.endLine − 1, …)` with the indentation of G's first inner line (or G's indentation plus two spaces). Line: `<from> --> <to>` plus ` : <label>`.
- `renameNode`: `labelSpan` → replace; none → add `<id> : <label>` in the node's scope (as `addEdge` places lines). Pseudo-states and multi-line notes → `{ error: MESSAGES.opUnsupported }`.
- `renameEdge`: span → replace; none → add ` : <label>`.
- `renameGroup`: span → replace; none → on the `state X {` line insert `"<title>" as ` after `state `.
- `deleteNode`, `deleteEdge`: generic.
- `reverseEdge`: rebuild `<to> --> <from>[ : <label>]` (pseudo-states as `[*]`).
- `setNodeStyle`: `upsertClassStyle`.

**ER** (forbid `/["[\]{}]/g`)

- `addNode`: id `E<n>`; append `E<n>["<label>"]`.
- `addEdge`: append `<from> ||--o{ <to> : "<label or 'relates'>"`.
- `renameNode`: alias span → replace; none → insert `<name>["<label>"]` right after the header line (quote the name when it has a space).
- `renameEdge`: replace the span; when the old label was not quoted and the new one has a space, write it with quotes.
- `deleteNode`, `deleteEdge`: generic.
- `setEdgeVariant`: `replaceSpan(opSpan, variant)` (a word-form relationship becomes symbols).
- `reverseEdge`: rebuild `<to> <mirrorOp(variant)> <from> : "<label>"`.
- `setNodeStyle`: `upsertStyleLine`.

**Requirement** (names: every character outside `[A-Za-z0-9_]` → `_`)

- `addNode`: `rect` → the block `requirement req<n> {` / `  id: <n>` / `  text: <label>` / `  risk: medium` / `  verifymethod: test` / `}`; `document` → `element el<n> {` / `  type: <label>` / `}`. Append the lines.
- `addEdge`: append `<from> - satisfies -> <to>`.
- `renameNode`: new name = sanitised label; already used → `{ error: MESSAGES.nameTaken(name) }`; replace the old name as a whole word on the block line and on every line of an edge that touches the node.
- `renameEdge`: `{ error: MESSAGES.opUnsupported }` (change the type with the edge variant).
- `deleteNode`, `deleteEdge`: generic.
- `setEdgeVariant`: `replaceSpan(opSpan, variant)` (the span is the type word).
- `reverseEdge`: rebuild `<to> - <type> -> <from>`.
- `setNodeStyle`: `upsertStyleLine`.

**Use case** (forbid `/["()[\]]/g`)

- `addNode`: `ellipse` → `UC<n>("<label>")`; `actor` → `actor Actor<n>("<label>")`; `rect` → `Box<n>["<label>"]`. Append.
- `addEdge`: append `<from> --> <to>`.
- `renameNode`: span → replace; a bare `actor X` → add `("<label>")`; implicit → insert `<id>("<label>")` after the header.
- `renameEdge`: span → replace; none and variant `-->` → rebuild `<from> -- "<label>" --> <to>`; otherwise `{ error: MESSAGES.opUnsupported }`.
- `deleteNode`, `deleteEdge`: generic.
- `setEdgeVariant`: `replaceSpan(opSpan, variant)`.
- `reverseEdge`: variants `-->`, `<--`, `--` → rebuild with `mirrorOp`; others → `{ error: MESSAGES.opUnsupported }`.
- `setNodeStyle`: `upsertStyleLine`.

**Architecture** (forbid `/[[\]()]/g`)

- `addNode`: id `s<n>`; append `service s<n>(server)[<label>]`.
- `addEdge`: append `<from>:R -- L:<to>`.
- `renameNode` / `renameGroup`: span → replace; none → insert `[<label>]` after the icon `(…)` or after the id on the declaration line.
- `deleteNode`, `deleteEdge`: generic.
- `setEdgeVariant`: `replaceSpan(opSpan, variant)`.
- `reverseEdge`: when neither end uses `{group}`, rebuild `<to>:<toSide> <mirrorOp(variant)> <fromSide>:<from>`; otherwise `{ error: MESSAGES.opUnsupported }`.

**Block** (forbid `/["[\](){}<>]/g`)

- `addNode`: id `b<n>`; append `b<n>["<label>"]`.
- `addEdge`: append `<from> --> <to>`.
- `renameNode`: `labelSpan` → replace; a bare id → replace its `defSpan` with `<id>["<label>"]` followed by the old `:N` suffix, if any.
- `deleteNode`: remove `defSpan` and one space next to it from its line (delete the line when nothing else is left), then delete every edge line that touches the node.
- `deleteEdge`: generic.
- `setShape`: replace `defSpan` with `<id><open>"<label>"<close>[:N]` (the label in double quotes) using `shapeTokens(shape)`.
- `setEdgeVariant`: `replaceSpan(opSpan, variant)`.
- `setNodeStyle`: `upsertStyleLine`.

**Git graph** (forbid `/["]/g`)

- `addNode`: append `commit id: "<label>"`.
- `renameNode`: span → replace; none → insert ` id: "<label>"` after `commit` or after `merge <branch>`; cherry-pick commits → `{ error: MESSAGES.opUnsupported }`.
- `deleteNode`: `deleteLines(refLines)`.

**Journey** (forbid `/[:"]/g`)

- `addNode`: append `<label>: 3: Me` with the indentation of the last task line (or four spaces).
- `renameNode`: card → replace its span; face → `{ error: MESSAGES.opUnsupported }`.
- `deleteNode` (card or face): `deleteLines(refLines)`.

**Timeline** (forbid `/[:"]/g`)

- `addNode`: append `<label>` with the indentation of the last period line (or four spaces).
- `renameNode`: replace the span (period or event).
- `deleteNode`: period → `deleteLines(refLines)`; event → remove its ` : <text>` segment (from the space before the colon before its span to the span end); an event alone on a continuation line removes that line.

**Mindmap** (forbid `/[()[\]{}"]/g`)

- Delimiters: `rect` `[`…`]`, `round` `(`…`)`, `circle` `((`…`))`, `bang` `))`…`((`, `cloud` `)`…`(`, `hexagon` `{{`…`}}`.
- `addNode`: id `m<n>`; append `<root indent + 2 spaces><id><open><label><close>` (a child of the root).
- `addEdge(from, to)` moves `to`'s branch under `from`: `to` is the root, or `from` is inside `to`'s branch → `{ error: MESSAGES.mindmapCycle }`. Cut `to`'s lines (its line and every following line with a larger indentation); re-indent each cut line to `indent(from) + 2 + (oldIndent − indent(to))` spaces; insert them after the last line of `from`'s branch.
- `renameNode`: replace its span.
- `deleteNode`: root → `{ error: MESSAGES.opUnsupported }`; else delete its line and every following line with a larger indentation (blank and comment lines inside the branch go with it).
- `setShape`: rewrite the node text as `<id when written><open><label><close>`, keeping any `:::` suffix.

---

## Part 9. Tasks

### File map

| File                                                                                                                                                                                                                                        | New or changed  | Responsibility                              | Task           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------- | -------------- |
| `src/core/types.ts`, `src/core/diagram-types.ts`                                                                                                                                                                                        | changed, new    | data model (Part 3)                         | 65, 66, 69, 73 |
| `src/core/constants.ts`                                                                                                                                                                                                                   | changed         | Part 2 values                               | 65             |
| `src/diagrams/kinds.ts`, `detect.ts`, `engine.ts`, `registry.ts`, `flowchart-engine.ts`, `parse-any.ts`, `apply-op.ts`                                                                                                        | new             | detection, loading, dispatch (Part 4)       | 66             |
| `src/diagrams/common/prelude.ts`, `src/diagrams/common/edit.ts`                                                                                                                                                                         | new             | shared parser and edit kits (5.0, 8.0)      | 67             |
| `src/diagrams/<kind>/parse.ts`, `layout.ts`, `ops.ts`, `index.ts` (+ tests)                                                                                                                                                         | new             | one engine each                             | 75 to 102      |
| `src/layout/sections.ts`, `title.ts`, `path.ts`, `decor-bounds.ts`, `node-box.ts`                                                                                                                                                 | new             | sizing and layout helpers                   | 64, 68, 71     |
| `src/layout/measure.ts`, `layout.ts`, `polygon.ts`, `scene.ts`                                                                                                                                                                      | changed         | sizing hooks, cache key, borders, dispatch  | 64, 66, 68, 69 |
| `src/render/draw-nodes.ts`, `svg-nodes.ts`                                                                                                                                                                                              | new (split out) | node drawing                                | 64             |
| `src/render/sections.ts`, `label-pos.ts`, `icons.ts`, `shapes-new.ts`, `markers.ts`, `edge-extras.ts`, `decorations.ts`                                                                                                       | new             | Part 7                                      | 68 to 71       |
| `src/render/draw.ts`, `svg.ts`, `draw-edges.ts`, `node-path.ts`, `style.ts`, `draw-runs.ts`                                                                                                                                     | changed         | calls into the new files                    | 64, 68 to 71   |
| `src/anim/stages.ts`                                                                                                                                                                                                                      | new             | animation order (7.8)                       | 72             |
| `src/anim/anim.ts`, `build-anim.ts`, `steps.ts`                                                                                                                                                                                       | changed         | use stages                                  | 72             |
| `src/app/kind-ui.ts`, `wrap-toggle.ts`                                                                                                                                                                                                  | new             | kind-aware controls; split out of `ui.ts` | 64, 73         |
| `src/app/state.ts`, `ui.ts`, `node-creator.ts`, `toolbar.ts`, `properties.ts`, `dispatcher.ts`, `studio.ts`, `render-loop.ts`, `canvas-events.ts`, `touch-wiring.ts`, `describe.ts`, `mermaid-lang.ts`, `help.ts` | changed         | wiring (4.8 to 4.10)                        | 64, 66, 73     |
| `src/editor/controller.ts`, `controller-types.ts`                                                                                                                                                                                       | changed         | capabilities                                | 73             |
| `tests/support/fake-engine.ts`                                                                                                                                                                                                            | new             | a tiny engine for tests                     | 66             |
| `tests/fixtures/diagrams/*.mmd` + `.json`, `src/diagrams/corpus.test.ts`                                                                                                                                                              | new             | parser corpus                               | 75 onwards     |
| `tests/e2e/diagrams.spec.ts`, `tests/e2e/diagram-edit.spec.ts`                                                                                                                                                                          | new             | browser tests, one row per type             | 76 onwards     |
| `public/templates/<kind>.mmd`, `public/templates/index.json`                                                                                                                                                                            | new, changed    | gallery templates                           | 76 onwards     |

---

## Milestone D1: v0.9.0 Foundation (Tasks 64 to 74)

Nothing new is visible yet except clearer messages for unsupported types. Everything after D1 depends on it.

### Task 64: Point agents at this plan and make room in crowded files

**Files:**

- Modify: `AGENTS.md` (section 1), `handoff.md` (add a short "Current plan" line), `src/repo.test.ts`
- Create: `src/render/draw-nodes.ts`, `src/render/svg-nodes.ts`, `src/app/wrap-toggle.ts`, `src/layout/title.ts`
- Modify: `src/render/draw.ts`, `src/render/svg.ts`, `src/app/ui.ts`, `src/layout/layout.ts`
- Test: `src/repo.test.ts`, `src/layout/title.test.ts`

**Interfaces:**

- Produces:
  - `drawNodes(ctx: CanvasRenderingContext2D, scene: Scene, theme: Theme, frame: FrameState, options: DrawOptions): void` — the whole "7. Nodes" loop of `drawScene`, moved unchanged (it includes the selection outline).
  - `svgNodes(scene: Scene, theme: Theme, measure: MeasureText): string` — the `for (const node of scene.doc.nodes)` loop of `renderSvg` and the helpers only it uses, moved unchanged.
  - `setupWrapToggle(env: { el: HTMLInputElement | null; getSettings: () => Settings; editor: CodeEditor; save: () => void }): void` — the `#editor-wrap` block of `initApp`, moved unchanged.
  - `placeTitle(bounds: Rect, title: string | null, measure: MeasureText): { bounds: Rect; title: SceneLayout['title'] }` — the title block at the end of `layoutDoc`, moved unchanged.

- [ ] **Step 1: Write the failing tests**

```ts
// src/repo.test.ts (add)
it('points agents at plan.md', () => {
  expect(readFileSync('AGENTS.md', 'utf8')).toContain('`plan.md`');
});

// src/layout/title.test.ts
import { describe, expect, it } from 'vitest';
import { testMeasure } from '../../tests/support/measure';
import { placeTitle } from './title';
describe('placeTitle', () => {
  it('adds the title band above the bounds and widens them for a long title', () => {
    const r = placeTitle({ x: 0, y: 0, width: 40, height: 100 }, 'A long title', testMeasure);
    expect(r.title).toEqual({ text: 'A long title', center: { x: 20, y: -18 } });
    expect(r.bounds).toEqual({ x: -28, y: -36, width: 96, height: 136 });
  });
  it('returns the bounds unchanged without a title', () => {
    expect(placeTitle({ x: 1, y: 2, width: 3, height: 4 }, null, testMeasure)).toEqual({ bounds: { x: 1, y: 2, width: 3, height: 4 }, title: null });
  });
});
```

- [ ] **Step 2: Run** `npx vitest run src/repo.test.ts src/layout/title.test.ts`. Expected: FAIL (no `plan.md` in AGENTS.md; no `./title` module).
- [ ] **Step 3: Implement.**
  - `AGENTS.md` section 1: add a first bullet: ``- The current build plan is `plan.md` (Tasks 64 to 103: more Mermaid diagram types). Read its "Start here" and Part 0 first.`` Keep every existing line, because `src/repo.test.ts` checks the older plan paths too.
  - `handoff.md`: under section 2, add ``- **Current plan**: `plan.md` (Tasks 64 to 103).``
  - Move the four blocks named in Interfaces into their new files, unchanged. The old call sites call the new functions. Imports move with the code. Do not change behaviour, names of exports that other files use, or any test.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build`. Expected: PASS, and `wc -l src/render/draw.ts src/render/svg.ts src/app/ui.ts src/layout/layout.ts` shows each file shorter than before.
- [ ] **Step 5: Run** `npm run test:e2e -- preview.spec.ts export-svg.spec.ts`. Expected: PASS.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "refactor: point agents at plan.md and split node drawing, title placement and the wrap toggle into their own files"
```

### Task 65: Types, constants and messages

**Files:**

- Create: `src/core/diagram-types.ts`
- Modify: `src/core/types.ts`, `src/core/constants.ts`
- Test: `src/core/constants.test.ts`, `src/core/types.test.ts` (new)

**Interfaces:**

- Produces: everything in Part 2.1 to 2.3 and Part 3, **except**: `ExtraShapeKind` (Task 69; for now `export type ShapeKind = FlowShapeKind`), the `setEdgeVariant` member of `TextOp` (Task 66), and `caps` / `defaultShape` on `EditorEnv` (Task 73).

- [ ] **Step 1: Write the failing tests**

```ts
// src/core/constants.test.ts (add)
import { ARCH, BLOCK, GIT, JOURNEY, LAYOUT, MESSAGES, MINDMAP, SEQ, TIMELINE } from './constants';
it('has the diagram layout constants', () => {
  expect(LAYOUT.sectionLineH).toBe(18);
  expect(LAYOUT.iconSize).toBe(32);
  expect(SEQ.participantGap).toBe(40);
  expect(SEQ.minParticipantW).toBe(100);
  expect(GIT.commitGap).toBe(60);
  expect(ARCH.gapX).toBe(80);
  expect(MINDMAP.levelGap).toBe(80);
  expect(BLOCK.minUnitW).toBe(80);
  expect(JOURNEY.scoreStep).toBe(36);
  expect(TIMELINE.colMinW).toBe(150);
});
it('has the diagram messages', () => {
  expect(MESSAGES.unsupportedDiagram('Pie chart')).toBe('Pie chart is not supported yet. Supported types: flowchart, sequence, class, state, ER, requirement, use case, architecture, block, gitGraph, journey, timeline and mindmap.');
  expect(MESSAGES.loadingDiagram('Sequence')).toBe('Loading support for Sequence diagrams.');
  expect(MESSAGES.opUnsupported).toBe('This change is not available for this diagram type. Edit the text instead.');
  expect(MESSAGES.notFlowchart).toBe("Not a diagram this app can read. Start with a type such as 'flowchart TD' or 'sequenceDiagram'.");
});

// src/core/types.test.ts
import { expect, it } from 'vitest';
import type { Decoration, GraphEdge, GraphNode, ParsedDoc } from './types';
it('accepts the optional diagram fields', () => {
  const n: Partial<GraphNode> = { sections: [{ rows: [['a']], align: 'left', weight: 'normal', divider: true }], icon: 'server', size: { width: 1, height: 2 }, colorIndex: 3, labelSpan: { line: 0, from: 1, to: 2 } };
  const e: Partial<GraphEdge> = { markers: { start: 'triangle', end: 'erZeroOrMore' }, endLabels: { from: '1' }, variant: '<|--' };
  const d: Decoration = { kind: 'text', role: 'caption', at: { x: 0, y: 0 }, text: 't', align: 'center', bold: false };
  const p: Partial<ParsedDoc> = { kind: 'sequence', stages: { nodes: {}, edges: {} }, pending: true };
  expect([n, e, d, p].length).toBe(4);
});
```

- [ ] **Step 2: Run** `npx vitest run src/core`. Expected: FAIL (missing exports).
- [ ] **Step 3: Implement** Part 2.1 to 2.3 and Part 3 (minus the three exceptions). Update `src/mermaid/parse.header.test.ts` only if it compares the old `notFlowchart` text literally (it uses the constant, so it should not need a change). Do **not** change `tests/e2e/preview.spec.ts` yet; Task 66 does.
- [ ] **Step 4: Run** `npm test && npm run lint && npx tsc --noEmit`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add the data model, constants and messages for more diagram types"
```

### Task 66: Detect the diagram type, load engines on demand, dispatch parse, layout and ops

**Files:**

- Create: `src/diagrams/kinds.ts`, `src/diagrams/detect.ts`, `src/diagrams/engine.ts`, `src/diagrams/registry.ts`, `src/diagrams/flowchart-engine.ts`, `src/diagrams/parse-any.ts`, `src/diagrams/apply-op.ts`, `tests/support/fake-engine.ts`
- Modify: `src/core/types.ts` (`setEdgeVariant` op), `src/mermaid/ops.ts` (one case), `src/layout/scene.ts`, `src/app/state.ts`, `src/app/node-creator.ts`, `src/app/ui.ts`
- Modify (named test changes): `src/app/state.test.ts` (the input `'sequenceDiagram'` becomes `'pie title Pets'`), `tests/support/corpus.ts` (the `invalid` entry's text becomes `pie title Pets\n  "Dogs" : 3`), `tests/e2e/preview.spec.ts` (in "displays diagnostics on invalid syntax…": `setText('pie title Pets')` and `toContainText('Line 1: Pie chart is not supported yet')`)
- Test: `src/diagrams/detect.test.ts`, `src/diagrams/parse-any.test.ts`, `src/diagrams/apply-op.test.ts`, `src/app/state.test.ts` (add), `src/layout/scene.test.ts` (add)

**Interfaces:**

- Consumes: Part 3 types; `parseMermaid`, `emptyDoc`, `applyOp`.
- Produces: Part 4.1 to 4.7, plus `reparseCurrent(state: AppState, measure: MeasureText): AppState` in `src/app/state.ts` (= `applyText(state, state.text, measure)`), used by `ui.ts`'s `onEngineChange` listener.
- `tests/support/fake-engine.ts`: `fakeEngine(kind: DiagramKind): DiagramEngine` whose `parse` returns a doc with `kind`, one node `F` (label `fake`, shape `rect`) and `ok: true`; whose `layout` puts `F` at (0, 0), 80 × 40; whose `applyOp` returns `{ text: text + '%% op\n' }`; caps all true; one add choice `rect`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/diagrams/detect.test.ts
import { describe, expect, it } from 'vitest';
import { detectKind } from './detect';
describe('detectKind', () => {
  it.each([
    ['flowchart LR\nA-->B', 'flowchart', 0], ['graph TD', 'flowchart', 0],
    ['sequenceDiagram\n  A->>B: hi', 'sequence', 0], ['%% note\n\nclassDiagram', 'class', 2],
    ['---\ntitle: T\n---\nstateDiagram-v2', 'state', 3], ['stateDiagram', 'state', 0],
    ['erDiagram', 'er', 0], ['requirementDiagram', 'requirement', 0], ['usecase-beta', 'usecase', 0],
    ['architecture-beta', 'architecture', 0], ['block-beta', 'block', 0], ['block', 'block', 0],
    ['gitGraph TB:', 'gitgraph', 0], ['journey', 'journey', 0], ['timeline TD', 'timeline', 0], ['mindmap', 'mindmap', 0],
  ])('%j is %s', (text, kind, headerIdx) => {
    expect(detectKind(text)).toMatchObject({ kind, headerIdx });
  });
  it('names unsupported types and leaves other text unknown', () => {
    expect(detectKind('pie title Pets')).toEqual({ kind: 'unsupported', headerIdx: 0, name: 'Pie chart' });
    expect(detectKind('gantt\n dateFormat YYYY')).toMatchObject({ kind: 'unsupported', name: 'Gantt chart' });
    expect(detectKind('blockade')).toMatchObject({ kind: 'unknown' });
    expect(detectKind('')).toEqual({ kind: 'unknown', headerIdx: -1, name: '' });
  });
});

// src/diagrams/parse-any.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '../core/constants';
import { parseMermaid } from '../mermaid/parse';
import { fakeEngine } from '../../tests/support/fake-engine';
import { parseDocument } from './parse-any';
import { getEngine, loadEngine, onEngineChange, setLoaderForTest } from './registry';
afterEach(() => setLoaderForTest('sequence', null));
describe('parseDocument', () => {
  it('parses flowcharts exactly as before', () => {
    const t = 'flowchart TD\nA-->B';
    expect(parseDocument(t)).toEqual(parseMermaid(t));
  });
  it('reports unsupported types on their header line', () => {
    const d = parseDocument('%% x\npie title Pets');
    expect(d.ok).toBe(false);
    expect(d.diagnostics).toEqual([{ line: 2, severity: 'error', message: MESSAGES.unsupportedDiagram('Pie chart') }]);
  });
  it('reports a known type without an engine as unsupported', () => {
    setLoaderForTest('sequence', null); // later tasks add a real loader; null removes it for this test file
    expect(parseDocument('sequenceDiagram').diagnostics[0].message).toBe(MESSAGES.unsupportedDiagram('Sequence diagram'));
  });
  it('returns a pending doc, loads the engine once, then parses with it', async () => {
    const loader = vi.fn(async () => fakeEngine('sequence'));
    setLoaderForTest('sequence', loader);
    const changed = vi.fn();
    const off = onEngineChange(changed);
    const first = parseDocument('sequenceDiagram\n  A->>B: hi');
    expect(first).toMatchObject({ ok: false, pending: true, kind: 'sequence' });
    expect(first.diagnostics).toEqual([{ line: 1, severity: 'info', message: MESSAGES.loadingDiagram('Sequence') }]);
    parseDocument('sequenceDiagram');
    await loadEngine('sequence');
    expect(loader).toHaveBeenCalledTimes(1);
    expect(changed).toHaveBeenCalledTimes(1);
    expect(getEngine('sequence')).not.toBeNull();
    expect(parseDocument('sequenceDiagram')).toMatchObject({ ok: true, kind: 'sequence' });
    off();
  });
  it('reports a load failure as an error diagnostic', async () => {
    setLoaderForTest('sequence', async () => { throw new Error('offline'); });
    parseDocument('sequenceDiagram');
    await expect(loadEngine('sequence')).rejects.toThrow('offline');
    expect(parseDocument('sequenceDiagram').diagnostics).toEqual([{ line: 1, severity: 'error', message: MESSAGES.diagramLoadFailed('Sequence') }]);
    expect(parseDocument('flowchart TD\nA').ok).toBe(true);
  });
});

// src/diagrams/apply-op.test.ts
import { expect, it } from 'vitest';
import { MESSAGES } from '../core/constants';
import { applyOp } from '../mermaid/ops';
import { applyAnyOp } from './apply-op';
it('sends flowchart ops to the flowchart code and refuses other types with no engine', () => {
  const t = 'flowchart TD\nA-->B';
  const op = { type: 'renameNode', id: 'A', label: 'Start' } as const;
  expect(applyAnyOp(t, op)).toEqual(applyOp(t, op));
  expect(applyAnyOp('sequenceDiagram\n  A->>B: hi', op)).toEqual({ error: MESSAGES.fixTextFirst });
  expect(applyOp(t, { type: 'setEdgeVariant', index: 0, variant: 'x' })).toEqual({ error: MESSAGES.opUnsupported });
});

// src/app/state.test.ts (add) — Review Focus 1
it('reparses the current text, not the text that started the load', async () => {
  setLoaderForTest('sequence', async () => fakeEngine('sequence'));
  let s = createState('sequenceDiagram\n  A->>B: hi', settings);
  expect(s.doc.pending).toBe(true);
  s = applyText(s, 'flowchart TD\nX', testMeasure);
  await loadEngine('sequence');
  s = reparseCurrent(s, testMeasure);
  expect(s.doc.kind).toBeUndefined();
  expect(s.doc.nodes.map((n) => n.id)).toEqual(['X']);
  s = reparseCurrent(applyText(s, 'sequenceDiagram', testMeasure), testMeasure);
  expect(s.doc.kind).toBe('sequence');
  setLoaderForTest('sequence', null);
});

// src/layout/scene.test.ts (add)
it('uses an engine layout when the engine has one', async () => {
  setLoaderForTest('sequence', async () => fakeEngine('sequence'));
  await loadEngine('sequence');
  const doc = parseDocument('sequenceDiagram');
  const scene = buildScene(doc, testMeasure);
  expect(scene.layout.nodes.F).toMatchObject({ center: { x: 0, y: 0 }, width: 80, height: 40 });
  setLoaderForTest('sequence', null);
});
```

- [ ] **Step 2: Run** `npx vitest run src/diagrams src/app/state.test.ts src/layout/scene.test.ts`. Expected: FAIL (modules missing).
- [ ] **Step 3: Implement** Part 4.1 to 4.7 and the `ui.ts` / `state.ts` / `node-creator.ts` rows of Part 4.8. `LOADERS` starts empty. In `ui.ts`, add the `onEngineChange` listener right after the `createDispatcher(...)` block; it calls `state = reparseCurrent(state, measure); updateAfterCommit();`. Make the three named test changes.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run check:dist`. Expected: PASS; initial JS still at most 150 KB.
- [ ] **Step 5: Run** `npm run test:e2e -- preview.spec.ts`. Expected: PASS.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: detect Mermaid diagram types, load engines on demand and report unsupported types"
```

### Task 67: Shared parser kit and edit kit

**Files:**

- Create: `src/diagrams/common/prelude.ts`, `src/diagrams/common/edit.ts`
- Test: `src/diagrams/common/prelude.test.ts`, `src/diagrams/common/edit.test.ts`

**Interfaces:**

- Consumes: `cleanLabel`, `decodeEntities` (`src/mermaid/props.ts`), `parseStyleString` (`src/mermaid/styles.ts`), `PIN_LINE_RE`, `setPinInternal`, `clearPinsInternal`, `formatPinLine` (`src/mermaid/positions.ts`), `emptyDoc`.
- Produces: Part 5.0 and Part 8.0, exactly as written there.

- [ ] **Step 1: Write the failing tests**

```ts
// src/diagrams/common/prelude.test.ts
import { describe, expect, it } from 'vitest';
import { LIMITS, MESSAGES } from '../../core/constants';
import type { GraphNode } from '../../core/types';
import { checkLimits, commonLine, finishDoc, makeEdge, makeNode, newCommonState, readPrelude } from './prelude';
const HEADER = /^demo\s*$/;
describe('readPrelude', () => {
  it('reads front matter, skips comments and finds the header', () => {
    const p = readPrelude('---\ntitle: "Hello"\n---\n%% c\ndemo\n  x', HEADER);
    if ('ok' in p) throw new Error('expected a prelude');
    expect(p).toMatchObject({ headerIdx: 4, title: 'Hello' });
    expect(p.lines.map((l) => l.kind).slice(0, 5)).toEqual(['frontmatter', 'frontmatter', 'frontmatter', 'comment', 'header']);
  });
  it('rejects text that is too long', () => {
    const r = readPrelude('demo\n' + 'x'.repeat(LIMITS.maxTextChars), HEADER);
    expect('ok' in r && r.diagnostics[0].message).toBe(MESSAGES.textTooLong);
  });
});
describe('commonLine', () => {
  it('handles pins, comments, directives and accessibility lines', () => {
    const p = readPrelude('demo\n%% studio:pos A 10 20\n%%{init: {}}%%\naccTitle: T\naccDescr {\n  one\n  two\n}\n', HEADER);
    if ('ok' in p) throw new Error('expected a prelude');
    const st = newCommonState();
    for (let i = 1; i < p.rawLines.length; i++) commonLine(p.rawLines[i], i, p.lines, st);
    expect(st.pins).toEqual({ A: { x: 10, y: 20 } });
    expect(st.accTitle).toBe('T');
    expect(st.accDescr).toBe('one\ntwo');
    expect(p.lines.map((l) => l.kind)).toEqual(['header', 'pos', 'directive', 'acc', 'acc', 'acc', 'acc', 'acc', 'blank']);
  });
});
it('fills node and edge defaults', () => {
  expect(makeNode('A', 'a', 'rect', 3)).toMatchObject({ id: 'A', label: 'a', shape: 'rect', classNames: [], style: {}, group: null, markdown: false, line: 3 });
  expect(makeEdge(2, 'A', 'B', 'open', 'l', 4)).toMatchObject({ id: 'e2', index: 2, length: 1, ref: null, anim: { animate: null, speed: null }, fromIsGroup: false, toIsGroup: false, line: 4 });
});
it('reports the node limit once', () => {
  const nodes: GraphNode[] = Array.from({ length: LIMITS.maxNodes + 1 }, (_, i) => makeNode(`n${i}`, '', 'rect', 1));
  const diags: { line: number; severity: 'error' | 'warning' | 'info'; message: string }[] = [];
  expect(checkLimits(nodes, [], diags, 5)).toBe(false);
  expect(checkLimits(nodes, [], diags, 6)).toBe(false);
  expect(diags).toEqual([{ line: 5, severity: 'error', message: MESSAGES.tooManyNodes }]);
});
it('finishes a doc with kind, ok and line indexes', () => {
  const p = readPrelude('demo\n  A', HEADER);
  if ('ok' in p) throw new Error('expected a prelude');
  const doc = finishDoc('state', p, newCommonState(), { direction: 'TB', nodes: [makeNode('A', 'A', 'round', 1)], edges: [], groups: [], classDefs: {}, title: null });
  expect(doc).toMatchObject({ kind: 'state', ok: true, links: {}, explicitEdgeAnimation: false });
  expect(doc.lines[1].nodeIds).toEqual(['A']);
});

// src/diagrams/common/edit.test.ts
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseMermaid } from '../../mermaid/parse';
import { appendLine, appendLines, cleanForText, deleteLines, guardOk, insertLine, mirrorOp, nextId, rebuildLine, replaceSpan, upsertClassStyle, upsertStyleLine } from './edit';
const doc = (t: string) => parseMermaid(t);
describe('edit kit', () => {
  it('guardOk refuses ops on a document with errors', () => {
    expect(guardOk({ ...doc('flowchart TD\nA'), ok: false })).toEqual({ error: MESSAGES.fixTextFirst });
    expect(guardOk(doc('flowchart TD\nA'))).toBeNull();
  });
  it('replaces spans and edits lines', () => {
    expect(replaceSpan('a\n  hello\n', { line: 1, from: 2, to: 7 }, 'bye')).toBe('a\n  bye\n');
    expect(deleteLines('a\nb\nc\n', [2, 0, 2])).toBe('b\n');
    expect(insertLine('a\nb\n', 0, 'x')).toBe('a\nx\nb\n');
    expect(insertLine('a\n', -1, 'x')).toBe('x\na\n');
    expect(rebuildLine('a\n    b --> c\n', 1, 'c --> b')).toBe('a\n    c --> b\n');
  });
  it('appends after the last content line, before pins', () => {
    const t = 'flowchart TD\n  A\n%% studio:layout v1\n%% studio:pos A 1 2\n';
    expect(appendLine(t, doc(t), '  B')).toBe('flowchart TD\n  A\n  B\n%% studio:layout v1\n%% studio:pos A 1 2\n');
    expect(appendLines('flowchart TD\n  A\n', doc('flowchart TD\n  A\n'), ['  B', '  C'])).toBe('flowchart TD\n  A\n  B\n  C\n');
  });
  it('makes ids, cleans labels and mirrors operators', () => {
    expect(nextId(doc('flowchart TD\nS1\nS7\nX'), 'S')).toBe('S8');
    expect(cleanForText('say "hi":\nnow', /[":]/g)).toBe('say hi now');
    expect(cleanForText('  ', /x/g)).toBe('New');
    expect(['<|--', '-->', '..|>', '*--', '||--o{', '|o--o{'].map(mirrorOp)).toEqual(['--|>', '<--', '<|..', '--*', '}o--||', '}o--o|']);
  });
  it('writes and merges style lines', () => {
    const t = 'classDiagram\n  class A\n';
    const once = upsertStyleLine(t, doc('flowchart TD\nA'), 'A', { fill: '#f00' });
    expect(once).toBe('classDiagram\n  class A\n  style A fill:#f00\n');
    expect(upsertStyleLine(once, doc('flowchart TD\nA\nstyle A fill:#f00'), 'A', { fill: '' })).toBe('classDiagram\n  class A\n');
    expect(upsertClassStyle('stateDiagram-v2\n  A\n', doc('flowchart TD\nA'), 'A', { fill: '#0f0' })).toBe('stateDiagram-v2\n  A\n  classDef gc_A fill:#0f0\n  class A gc_A\n');
  });
});
```

Note: these tests use flowchart docs only as a source of `lines` and `ok`; that is enough for the kit, which works on any `ParsedDoc`. `upsertStyleLine` finds an existing line by matching `/^\s*style\s+<id>\s/` on the raw lines of the text, not by `lines[i].kind`.

- [ ] **Step 2: Run** `npx vitest run src/diagrams/common`. Expected: FAIL.
- [ ] **Step 3: Implement** Part 5.0 and Part 8.0.
- [ ] **Step 4: Run** `npm test && npm run lint`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add the shared parser kit and text-edit kit for diagram engines"
```

### Task 68: Node compartments, icons and fixed sizes

**Files:**

- Create: `src/layout/sections.ts`, `src/render/sections.ts`, `src/render/label-pos.ts`, `src/render/icons.ts`
- Modify: `src/layout/measure.ts` (`sizeNode`), `src/layout/layout.ts` (`structureKey`, copy `sections`), `src/render/draw-runs.ts` (`drawNodeLines` centre parameter), `src/render/draw-nodes.ts`, `src/render/svg-nodes.ts`
- Test: `src/layout/sections.test.ts`, `src/layout/measure.test.ts` (add), `src/layout/layout.test.ts` (add), `src/render/sections.test.ts`, `src/render/icons.test.ts`

**Interfaces:**

- Produces: `sizeSections(sections: NodeSection[], measure: MeasureText): { width: number; height: number; sections: SectionBox[] }`; `labelCenter(node: GraphNode, box: NodeBox): Point`; `drawSections(ctx: CanvasRenderingContext2D, box: NodeBox, st: { stroke: string; text: string }, textProg: number | undefined): void`; `svgSections(box: NodeBox, st: { stroke: string; text: string }): string`; `ICON_PRIMS: Record<IconName, IconPrim[]>`; `drawIcon(ctx, name: IconName, cx: number, cy: number, size: number, color: string): void`; `svgIcon(name: IconName, cx: number, cy: number, size: number, color: string): string`. All per Part 7.1 and 7.2.

- [ ] **Step 1: Write the failing tests**

```ts
// src/layout/sections.test.ts
import { expect, it } from 'vitest';
import { testMeasure } from '../../tests/support/measure';
import { sizeSections } from './sections';
it('sizes a class box', () => {
  const r = sizeSections([
    { rows: [['Animal']], align: 'center', weight: 'bold', divider: false },
    { rows: [['+int age']], align: 'left', weight: 'normal', divider: true },
    { rows: [['+eat() void']], align: 'left', weight: 'normal', divider: true },
  ], testMeasure);
  expect([r.width, r.height]).toEqual([112, 90]);
  expect(r.sections.map((s) => s.top)).toEqual([0, 30, 60]);
});
it('aligns table columns and drops empty ones', () => {
  const r = sizeSections([
    { rows: [['CUSTOMER']], align: 'center', weight: 'bold', divider: false },
    { rows: [['string', 'name', 'PK', ''], ['int', 'id', '', '']], align: 'left', weight: 'normal', divider: true },
  ], testMeasure);
  expect([r.width, r.height]).toEqual([144, 78]);
  expect(r.sections[1].colX).toEqual([12, 72, 116]);
  expect(r.sections[1].rows[0]).toEqual(['string', 'name', 'PK']);
});
it('gives an empty section its minimum height', () => {
  expect(sizeSections([{ rows: [], align: 'left', weight: 'normal', divider: true }], testMeasure).height).toBe(12);
});

// src/layout/measure.test.ts (add)
it('keeps a fixed size and makes room for an icon', () => {
  const base = parseMermaid('flowchart TD\nA[Server]').nodes[0];
  expect(sizeNode({ ...base, size: { width: 20, height: 20 } }, testMeasure, 'TB')).toMatchObject({ width: 20, height: 20 });
  const plain = sizeNode(base, testMeasure, 'TB');
  const iconned = sizeNode({ ...base, icon: 'server' }, testMeasure, 'TB');
  expect(iconned.height).toBe(plain.height + 38);
});

// src/layout/layout.test.ts (add)
it('relayouts when compartments change', () => {
  const a = parseMermaid('flowchart TD\nA');
  const b = parseMermaid('flowchart TD\nA');
  b.nodes[0].sections = [{ rows: [['x']], align: 'left', weight: 'normal', divider: false }];
  expect(structureKey(a, testMeasure)).not.toBe(structureKey(b, testMeasure));
  expect(layoutDoc(b, testMeasure).nodes.A.sections?.length).toBe(1);
});

// src/render/sections.test.ts
import { expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import { drawSections, svgSections } from './sections';
const box = { id: 'A', center: { x: 56, y: 45 }, width: 112, height: 90, lines: [], sections: [
  { rows: [['Animal']], align: 'center' as const, weight: 'bold' as const, divider: false, top: 0, height: 30, colX: [12] },
  { rows: [['+int age']], align: 'left' as const, weight: 'normal' as const, divider: true, top: 30, height: 30, colX: [12] },
] };
it('draws dividers and left-aligned rows on canvas', () => {
  const { ctx, calls } = createRecordingContext();
  drawSections(ctx, box, { stroke: '#111', text: '#222' }, undefined);
  expect(calls).toContainEqual({ name: 'fillText', args: ['Animal', 56, 15] });
  expect(calls).toContainEqual({ name: 'fillText', args: ['+int age', 12, 45] });
  expect(calls).toContainEqual({ name: 'moveTo', args: [0, 30] });
});
it('reveals rows progressively for the typewriter', () => {
  const { ctx, calls } = createRecordingContext();
  drawSections(ctx, box, { stroke: '#111', text: '#222' }, 0.5);
  expect(calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])).toEqual(['Animal']);
});
it('writes the same rows in SVG', () => {
  const svg = svgSections(box, { stroke: '#111', text: '#222' });
  expect(svg).toContain('>Animal</text>');
  expect(svg).toContain('<line');
});

// src/render/icons.test.ts
import { expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import { drawIcon, ICON_PRIMS, svgIcon } from './icons';
it('has every icon and draws it on canvas and in SVG', () => {
  expect(Object.keys(ICON_PRIMS).sort()).toEqual(['cloud', 'cross', 'database', 'disk', 'faceHappy', 'faceNeutral', 'faceSad', 'internet', 'server']);
  const { ctx, calls } = createRecordingContext();
  drawIcon(ctx, 'disk', 50, 50, 24, '#000');
  expect(calls.filter((c) => c.name === 'arc')).toHaveLength(2);
  expect(svgIcon('database', 50, 50, 24, '#000')).toContain('<ellipse');
});
```

- [ ] **Step 2: Run** `npx vitest run src/layout src/render`. Expected: FAIL.
- [ ] **Step 3: Implement** Part 7.1 (compartments, fixed size, icons; not the new shapes) and Part 7.2. In `draw-nodes.ts` and `svg-nodes.ts`, the classic branch draws sections, icons and label positions as Part 7.2 says. Pipeline and workflow card branches stay untouched.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: size and draw node compartments, icons and fixed-size nodes"
```

### Task 69: Six new shapes

**Files:**

- Create: `src/render/shapes-new.ts`
- Modify: `src/core/types.ts` (`ExtraShapeKind`), `src/core/shapes.ts`, `src/mermaid/format.ts`, `src/layout/measure.ts`, `src/layout/polygon.ts`, `src/render/node-path.ts`, `src/render/style.ts` (`shapeShadeTier`), `src/render/draw-nodes.ts`, `src/render/svg-nodes.ts`, `src/app/describe.ts`, and every other place `npx tsc --noEmit` reports
- Test: `src/layout/measure.test.ts`, `src/layout/geometry.test.ts`, `src/render/shapes-new.test.ts`, `src/core/shapes.test.ts`

**Interfaces:**

- Produces: `ShapeKind = FlowShapeKind | ExtraShapeKind`; `traceExtraShape(ctx: CanvasPath, box: NodeBox, shape: ExtraShapeKind): void` (not for `actor`); `extraShapePath(box: NodeBox, shape: ExtraShapeKind): string` (SVG `d`; not for `actor`); `drawActorFigure(ctx, box, color: string, width: number): void`; `svgActorFigure(box, color: string, width: number): string`; `drawNoteFold(ctx, box): void`; `svgNoteFold(box): string`. `shapePolygon` returns polygons for `bang` and `blockArrow`; `borderPoint` handles all six (Part 7.3).

- [ ] **Step 1: Write the failing tests**

```ts
// src/layout/measure.test.ts (add)
it.each([
  ['note', 86, 44], ['ellipse', 99, 58], ['cloud', 103, 60], ['bang', 107, 62], ['blockArrow', 116, 44],
] as const)('sizes %s', (shape, w, h) => {
  const n = { ...parseMermaid('flowchart TD\nA[Login]').nodes[0], shape, arrowDir: 'right' as const };
  expect(sizeNode(n, testMeasure, 'TB')).toMatchObject({ width: w, height: h });
});
it('sizes an actor around its figure and label', () => {
  const n = { ...parseMermaid('flowchart TD\nA[User]').nodes[0], shape: 'actor' as const };
  expect(sizeNode(n, testMeasure, 'TB')).toMatchObject({ width: 40, height: 80 });
});

// src/layout/geometry.test.ts (add)
it('finds ellipse border points', () => {
  const box = { id: 'A', center: { x: 0, y: 0 }, width: 100, height: 50, lines: [] };
  expect(borderPoint(box, 'ellipse', { x: 100, y: 0 })).toEqual({ x: 50, y: 0 });
  const p = borderPoint(box, 'ellipse', { x: 0, y: 100 });
  expect(p.x).toBeCloseTo(0); expect(p.y).toBeCloseTo(25);
});
it('makes bang and block arrow polygons', () => {
  const box = { id: 'A', center: { x: 0, y: 0 }, width: 120, height: 40, lines: [], arrowDir: 'right' as const };
  expect(shapePolygon(box, 'bang')).toHaveLength(16);
  const arrow = shapePolygon(box, 'blockArrow')!;
  expect(arrow).toHaveLength(7);
  expect(arrow[3]).toEqual({ x: 60, y: 0 });
});

// src/render/shapes-new.test.ts
import { expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import { drawActorFigure, extraShapePath, svgActorFigure } from './shapes-new';
const box = { id: 'A', center: { x: 50, y: 40 }, width: 40, height: 80, lines: ['User'] };
it('draws the actor figure with a head of radius 8', () => {
  const { ctx, calls } = createRecordingContext();
  drawActorFigure(ctx, box, '#000', 2);
  expect(calls).toContainEqual({ name: 'arc', args: [50, 10, 8, 0, 2 * Math.PI] });
  expect(svgActorFigure(box, '#000', 2)).toContain('<circle');
});
it('writes SVG paths for the note and the cloud', () => {
  expect(extraShapePath({ ...box, width: 100, height: 40 }, 'note')).toMatch(/^M /);
  expect(extraShapePath({ ...box, width: 100, height: 40 }, 'cloud')).toContain('Q ');
});

// src/core/shapes.test.ts (add)
it('keeps the flowchart shape list at 20 entries', () => {
  expect(Object.keys(SHAPE_NAMES)).toHaveLength(20);
});
```

- [ ] **Step 2: Run** `npx vitest run src/layout src/render src/core`. Expected: FAIL.
- [ ] **Step 3: Implement** Part 7.3 and the new-shape lines of Part 7.1. Change `ShapeKind` in `types.ts`, then run `npx tsc --noEmit` and handle every error it lists (switches over `ShapeKind`, records keyed by it). Flowchart paths never see the new shapes, so their output stays identical.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- preview.spec.ts export-svg.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: draw note, actor, ellipse, cloud, bang and block arrow shapes"
```

### Task 70: New edge markers and end labels

**Files:**

- Create: `src/render/markers.ts`, `src/render/edge-extras.ts`
- Modify: `src/render/style.ts` (`edgeStyle`), `src/render/draw-edges.ts`, `src/render/svg.ts`, `src/render/draw.ts`
- Test: `src/render/markers.test.ts`, `src/render/edge-extras.test.ts`, `src/render/style.test.ts` (add), `src/render/draw.test.ts` (add), `src/render/svg.test.ts` (add)

**Interfaces:**

- Produces: Part 7.4 (`MarkerPrim`, `markerPrims`, `drawMarker`, `svgMarker`) and Part 7.5 (`endLabelPoints`, `drawEdgeEndLabels`, `svgEdgeEndLabels`). `edgeStyle(...).endMarker` and `.startMarker` are `MarkerKind`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/render/markers.test.ts
import { expect, it } from 'vitest';
import { markerPrims } from './markers';
const T = { x: 0, y: 0 }, U = { x: 1, y: 0 };
it('builds a hollow triangle', () => {
  expect(markerPrims('triangle', T, U)).toEqual([{ type: 'poly', points: [{ x: 0, y: 0 }, { x: -14, y: 7 }, { x: -14, y: -7 }], closed: true, fill: 'background' }]);
});
it('builds diamonds, open arrows and ER ends', () => {
  expect(markerPrims('diamondFilled', T, U)[0]).toMatchObject({ fill: 'stroke', points: [{ x: 0, y: 0 }, { x: -10, y: 5 }, { x: -20, y: 0 }, { x: -10, y: -5 }] });
  expect(markerPrims('openArrow', T, U)[0]).toMatchObject({ closed: false, fill: 'none' });
  expect(markerPrims('erOne', T, U)).toEqual([
    { type: 'poly', points: [{ x: -6, y: 7 }, { x: -6, y: -7 }], closed: false, fill: 'none' },
    { type: 'poly', points: [{ x: -11, y: 7 }, { x: -11, y: -7 }], closed: false, fill: 'none' },
  ]);
  expect(markerPrims('erZeroOrMore', T, U).find((p) => p.type === 'circle')).toEqual({ type: 'circle', c: { x: -18, y: 0 }, r: 4, fill: 'background' });
  expect(markerPrims('arrow', T, U)).toEqual([]);
});

// src/render/edge-extras.test.ts
import { expect, it } from 'vitest';
import { endLabelPoints } from './edge-extras';
it('places end labels beside each end', () => {
  const path = { id: 'e0', kind: 'straight' as const, from: { x: 0, y: 0 }, to: { x: 100, y: 0 }, control: null, labelPoint: { x: 50, y: 0 }, length: 100 };
  expect(endLabelPoints(path, { from: '1', to: '*' })).toEqual([{ at: { x: 18, y: 12 }, text: '1' }, { at: { x: 82, y: 12 }, text: '*' }]);
});

// src/render/style.test.ts (add)
it('lets explicit markers replace the markers of the edge kind', () => {
  const e = { ...parseMermaid('flowchart TD\nA-->B').edges[0], markers: { start: 'triangle' as const, end: 'none' as const } };
  expect(edgeStyle(e, THEMES.daylight)).toMatchObject({ startMarker: 'triangle', endMarker: 'none', startArrow: false });
});

// src/render/draw.test.ts (add)
it('draws extra markers and end labels', () => {
  const doc = parseMermaid('flowchart LR\nA --- B');
  doc.edges[0].markers = { start: 'none', end: 'diamondFilled' };
  doc.edges[0].endLabels = { from: '1', to: '*' };
  const { ctx, calls } = createRecordingContext(800, 600);
  drawScene(ctx, buildScene(doc, testMeasure), THEMES.daylight, { zoom: 1, panX: 0, panY: 0 }, emptyFrame(), { transparent: false, selection: null, handleNodeId: null, connectPreview: null, focus: null, showGlow: false });
  expect(calls.filter((c) => c.name === 'fillText').map((c) => c.args[0])).toEqual(expect.arrayContaining(['1', '*']));
  expect(calls.some((c) => c.name === 'set:fillStyle' && c.args[0] === THEMES.daylight.edge)).toBe(true);
});

// src/render/svg.test.ts (add)
it('writes extra markers in SVG', () => {
  const doc = parseMermaid('flowchart LR\nA --- B');
  doc.edges[0].markers = { start: 'none', end: 'triangle' };
  expect(renderSvg(buildScene(doc, testMeasure), THEMES.daylight, { mode: 'content', transparent: false }, testMeasure)).toContain('class="marker-extra"');
});
```

- [ ] **Step 2: Run** `npx vitest run src/render`. Expected: FAIL.
- [ ] **Step 3: Implement** Parts 7.4 and 7.5. Keep the existing `arrow`, `circle` and `cross` code paths untouched; add the new branches after them.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- preview.spec.ts export-svg.spec.ts`. Expected: PASS (the existing arrow tests prove flowchart markers did not change).
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: draw UML and crow's foot edge markers and edge end labels"
```

### Task 71: Decorations, colour indexes and layout helpers

**Files:**

- Create: `src/render/decorations.ts`, `src/layout/path.ts`, `src/layout/decor-bounds.ts`, `src/layout/node-box.ts`
- Modify: `src/render/style.ts` (`shadeFor`, `nodeStyle`, `edgeStyle`), `src/render/draw.ts`, `src/render/svg.ts`, `src/render/draw-nodes.ts` (card style only for flowcharts)
- Test: `src/render/decorations.test.ts`, `src/layout/path.test.ts`, `src/render/style.test.ts` (add), `src/render/draw.test.ts` (add)

**Interfaces:**

- Produces: Part 6.0 helpers (`makeEdgePath`, `growBounds`, `boxFor`), Part 7.6 (`drawDecorations(ctx, decorations: Decoration[], theme: Theme): void`, `svgDecorations(decorations: Decoration[], theme: Theme): string`), Part 7.7 (`shadeFor`, colour index in `nodeStyle` / `edgeStyle`, card style gate).

- [ ] **Step 1: Write the failing tests**

```ts
// src/render/decorations.test.ts
import { expect, it } from 'vitest';
import { createRecordingContext } from '../../tests/support/recording-context';
import type { Decoration } from '../core/types';
import { THEMES } from './themes';
import { drawDecorations, svgDecorations } from './decorations';
const decs: Decoration[] = [
  { kind: 'line', role: 'lifeline', from: { x: 0, y: 0 }, to: { x: 0, y: 100 } },
  { kind: 'rect', role: 'frame', rect: { x: 0, y: 0, width: 100, height: 50 }, radius: 4, label: 'loop [Every minute]' },
  { kind: 'text', role: 'caption', at: { x: 5, y: 5 }, text: '1', align: 'center', bold: true },
];
it('draws lifelines dashed and frame labels on canvas', () => {
  const { ctx, calls } = createRecordingContext();
  drawDecorations(ctx, decs, THEMES.daylight);
  expect(calls).toContainEqual({ name: 'setLineDash', args: [[4, 4]] });
  expect(calls).toContainEqual({ name: 'fillText', args: ['loop [Every minute]', 8, 14] });
  expect(calls.filter((c) => c.name === 'save').length).toBe(calls.filter((c) => c.name === 'restore').length);
});
it('writes the same decorations in SVG', () => {
  const svg = svgDecorations(decs, THEMES.daylight);
  expect(svg).toContain('stroke-dasharray="4 4"');
  expect(svg).toContain('loop [Every minute]');
});

// src/layout/path.test.ts
import { expect, it } from 'vitest';
import { makeEdgePath } from './path';
import { growBounds } from './decor-bounds';
it('makes straight and curved paths with lengths', () => {
  expect(makeEdgePath('e0', { x: 0, y: 0 }, { x: 30, y: 40 }, null)).toMatchObject({ kind: 'straight', length: 50, labelPoint: { x: 15, y: 20 } });
  expect(makeEdgePath('e1', { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: 50 }).kind).toBe('quad');
});
it('grows bounds to cover decorations', () => {
  expect(growBounds({ x: 0, y: 0, width: 10, height: 10 }, [{ kind: 'line', role: 'axis', from: { x: -5, y: 0 }, to: { x: 0, y: 30 } }])).toEqual({ x: -5, y: 0, width: 15, height: 30 });
});

// src/render/style.test.ts (add)
it('colours nodes and edges by colour index unless shading is off', () => {
  const t = { ...THEMES.daylight, shadingMode: 'shape' as const };
  const n = { ...parseMermaid('flowchart TD\nA').nodes[0], colorIndex: 5 };
  expect(nodeStyle(n, t).fill).toBe(t.nodeShades![1].fill);
  expect(nodeStyle({ ...n, style: { fill: '#123456' } }, t).fill).toBe('#123456');
  expect(shadeFor({ ...t, shadingMode: 'off' }, 2)).toBeNull();
  const e = { ...parseMermaid('flowchart TD\nA-->|yes|B').edges[0], colorIndex: 2 };
  expect(edgeStyle(e, t).stroke).toBe(t.nodeShades![2].stroke);
});

// src/render/draw.test.ts (add)
it('draws other diagram types with classic cards only', () => {
  const doc = { ...parseMermaid('flowchart TD\nA["Form Submitted"]'), kind: 'class' as const };
  const calls = drawDoc(doc, { cardMode: 'workflow' });   // helper: like draw() above but takes a ParsedDoc
  expect(calls.some((c) => c.name === 'roundRect' && c.args[2] === 64 && c.args[3] === 64)).toBe(false);
});
```

If `THEMES.daylight.nodeShades` is undefined, pick any theme in `THEMES` that defines `nodeShades` and use it in the style test.

- [ ] **Step 2: Run** `npx vitest run src/render src/layout`. Expected: FAIL.
- [ ] **Step 3: Implement** Part 6.0 helpers, Part 7.6 and Part 7.7. In `drawScene` and `renderSvg`, draw `scene.layout.decorations` right after the groups.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: draw layout decorations, colour nodes by index and keep card styles to flowcharts"
```

### Task 72: Animation stages

**Files:**

- Create: `src/anim/stages.ts`
- Modify: `src/anim/anim.ts`, `src/anim/build-anim.ts`, `src/anim/steps.ts`
- Test: `src/anim/stages.test.ts`, `src/anim/anim.test.ts` (add), `src/anim/steps.test.ts` (add)

**Interfaces:**

- Produces: Part 7.8 (`Stages`, `animStages`).

- [ ] **Step 1: Write the failing tests**

```ts
// src/anim/stages.test.ts
import { expect, it } from 'vitest';
import { parseMermaid } from '../mermaid/parse';
import { computeDepths } from '../render/prepared';
import { animStages } from './stages';
it('uses topological depth when the doc has no stages', () => {
  const doc = parseMermaid('flowchart TD\nA-->B-->C\nA-->C');
  const st = animStages(doc);
  expect(st.node).toEqual(computeDepths(doc));
  expect(st.edge).toEqual({ e0: 0, e1: 1, e2: 0 });
  expect(st.count).toBe(3);
});
it('uses explicit stages when the doc has them', () => {
  const doc = { ...parseMermaid('flowchart LR\nA-->B\nB-->A'), stages: { nodes: { A: 0, B: 0 }, edges: { e0: 1, e1: 2 } } };
  expect(animStages(doc)).toEqual({ node: { A: 0, B: 0 }, edge: { e0: 1, e1: 2 }, count: 3 });
});

// src/anim/anim.test.ts (add)
const staged = () => {
  const doc = { ...parseMermaid('flowchart LR\nA-->B\nB-->A'), stages: { nodes: { A: 0, B: 0 }, edges: { e0: 1, e1: 2 } } };
  return buildScene(doc, testMeasure);
};
it('builds staged docs in stage order', () => {
  const s = staged();
  const early = frameState(s, { ...ANIM_DEFAULTS, style: 'build' }, 0.45);
  expect(early.edgeGrow?.e0).toBeGreaterThan(0);
  expect(early.edgeGrow?.e1).toBe(0);
  const late = frameState(s, { ...ANIM_DEFAULTS, style: 'build' }, 0.74);
  expect(late.edgeGrow?.e1).toBeGreaterThan(0);
});
it('typewriter follows the build stages for staged docs', () => {
  const s = staged();
  expect(frameState(s, { ...ANIM_DEFAULTS, style: 'typewriter' }, 0.45)).toEqual(frameState(s, { ...ANIM_DEFAULTS, style: 'build' }, 0.45));
});
it('pulses one staged edge at a time', () => {
  const s = staged();
  const ids = frameState(s, { ...ANIM_DEFAULTS, style: 'pulse' }, 0.9).particles.map((p) => p.edgeId);
  expect(ids).toEqual(['e1']);
});

// src/anim/steps.test.ts (add)
it('puts staged edges in their own step', () => {
  const doc = { ...parseMermaid('flowchart LR\nA-->B\nB-->A'), stages: { nodes: { A: 0, B: 0 }, edges: { e0: 1, e1: 2 } } };
  expect(buildSteps(doc)).toEqual([{ nodes: ['A', 'B'], edges: [] }, { nodes: [], edges: ['e0'] }, { nodes: [], edges: ['e1'] }]);
});
```

`ANIM_DEFAULTS` means `{ style: 'pulse', speed: 1, density: 4, glow: false }`; define it at the top of the test file if the file has no such constant.

- [ ] **Step 2: Run** `npx vitest run src/anim`. Expected: FAIL.
- [ ] **Step 3: Implement** Part 7.8. Every existing test in `src/anim/` must still pass unchanged; they prove flowcharts animate exactly as before.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run test:e2e -- present.spec.ts preview.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: let diagrams set their own animation order"
```

### Task 73: Edit capabilities in the canvas, toolbar and properties; highlighting, names and help

**Files:**

- Create: `src/app/kind-ui.ts`
- Modify: `src/core/diagram-types.ts` / `src/editor/controller-types.ts` (`caps`, `defaultShape` on `EditorEnv`), `src/editor/controller.ts`, `src/app/dispatcher.ts`, `src/app/studio.ts`, `src/app/render-loop.ts`, `src/app/canvas-events.ts`, `src/app/touch-wiring.ts`, `src/app/toolbar.ts`, `src/app/properties.ts`, `src/app/describe.ts`, `src/app/mermaid-lang.ts`, `src/app/help.ts`
- Test: `src/editor/controller.test.ts` (add), `src/app/kind-ui.test.ts`, `src/app/mermaid-lang.test.ts` (add), `src/app/describe.test.ts` (add)

**Interfaces:**

- Consumes: `getEngine`, `FLOWCHART_ENGINE`, `KIND_NAMES`, `HEADER_PATTERNS`.
- Produces: Part 4.8 rows marked [73], Part 4.9 and Part 4.10. Also a pure helper in `kind-ui.ts`, used by `syncKindControls` and by the test: `kindControlModel(doc: ParsedDoc): { kind: DiagramKind; caps: EditCaps; addChoices: Choice<ShapeKind>[]; shapeChoices: Choice<ShapeKind>[]; edgeChoices: Choice[]; cardEnabled: boolean }` (`edgeChoices` = `EDGE_KIND_NAMES` entries for flowcharts, `edgeVariants` otherwise).

- [ ] **Step 1: Write the failing tests**

```ts
// src/editor/controller.test.ts (add)
const NO_EDIT = { add: false, connect: false, rename: false, delete: false, move: false, shape: false, style: false, edgeVariant: false, reverse: false };
it('respects capabilities', () => {
  const scene = buildScene(parseMermaid('flowchart TD\nA-->B'), testMeasure);
  const env = { scene, ok: true, measure: testMeasure, caps: NO_EDIT };
  const a = scene.layout.nodes.A.center;
  const down = reduce(createEditorState(), { type: 'pointerDown', world: a, screen: a, button: 0, space: false }, env);
  expect(down.state.selection).toEqual({ kind: 'node', id: 'A' });
  expect(down.state.drag).toBeNull();
  expect(reduce(down.state, { type: 'keyDown', key: 'Delete' }, env).effects).toEqual([]);
  expect(reduce(down.state, { type: 'keyDown', key: 'Enter' }, env).effects).toEqual([]);
  expect(reduce(createEditorState(), { type: 'dblClick', world: a }, env).effects).toEqual([]);
  const far = { x: 9999, y: 9999 };
  expect(reduce(createEditorState(), { type: 'dblClick', world: far }, env).effects).toEqual([]);
  const addEnv = { ...env, caps: { ...NO_EDIT, add: true }, defaultShape: 'round' as const };
  expect(reduce(createEditorState(), { type: 'dblClick', world: far }, addEnv).effects).toEqual([{ type: 'addNodeAt', at: far, shape: 'round' }]);
});

// src/app/kind-ui.test.ts
import { afterEach, expect, it } from 'vitest';
import { EDGE_KIND_NAMES, SHAPE_NAMES } from '../core/shapes';
import { parseMermaid } from '../mermaid/parse';
import { loadEngine, setLoaderForTest } from '../diagrams/registry';
import { fakeEngine } from '../../tests/support/fake-engine';
import { kindControlModel } from './kind-ui';
afterEach(() => setLoaderForTest('sequence', null));
it('gives flowcharts their usual controls', () => {
  const m = kindControlModel(parseMermaid('flowchart TD\nA'));
  expect(m.addChoices.map((c) => c.value)).toEqual(Object.keys(SHAPE_NAMES));
  expect(m.edgeChoices.map((c) => c.value)).toEqual(Object.keys(EDGE_KIND_NAMES));
  expect(m.cardEnabled).toBe(true);
});
it('gives other types their engine controls', async () => {
  setLoaderForTest('sequence', async () => fakeEngine('sequence'));
  await loadEngine('sequence');
  const m = kindControlModel({ ...parseMermaid('flowchart TD\nA'), kind: 'sequence' });
  expect(m.addChoices.map((c) => c.value)).toEqual(['rect']);
  expect(m.cardEnabled).toBe(false);
});

// src/app/mermaid-lang.test.ts (add)
it('highlights keywords of other diagram types only in other modes', () => {
  expect(tokenizeLine('participant A as Alice', 'other')[0]).toMatchObject({ type: 'keyword' });
  expect(tokenizeLine('participant A as Alice')[0]).toMatchObject({ type: 'id' });
  expect(tokenizeLine('A->>B: hi', 'other').some((t) => t.type === 'operator')).toBe(true);
});

// src/app/describe.test.ts (add)
it('names other diagram types', () => {
  expect(describeDiagram({ ...parseMermaid('flowchart TD\nA'), kind: 'sequence' }).name).toBe('Sequence diagram');
  expect(describeDiagram(parseMermaid('flowchart TD\nA')).name).toBe('Flowchart');
});
```

- [ ] **Step 2: Run** `npx vitest run src/editor src/app`. Expected: FAIL.
- [ ] **Step 3: Implement** the [73] rows of Part 4.8, Part 4.9 and Part 4.10. Read `canvas-events.ts` and `touch-wiring.ts` fully before gating; list each gated path in `DECISIONS.md` (`Task 73: gated <path> with caps.<name>`). Keep every file under 300 lines (`toolbar.ts`, `properties.ts` and `ui.ts` have room for one or two lines each).
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run check:dist && npm run test:e2e`. Expected: PASS (all existing editing, keyboard, touch and properties e2e tests prove flowcharts are unchanged).
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: enable canvas, toolbar and properties edits per diagram type; highlight other diagram keywords"
```

### Task 74: Release v0.9.0

**Files:**

- Modify: `package.json` (`"version": "0.9.0"`), `src/repo.test.ts` (named change: `expect(pkg.version).toBe('0.6.0')` → `toBe('0.9.0')`), `RELEASE_CHECKLIST.md` (add the v0.9.0 list from Part 10), `handoff.md`, `DECISIONS.md`

- [ ] **Step 1:** Make the changes above. In `handoff.md`, record the milestone, the checks and their numbers (tests, initial JS KB, largest lazy chunk KB, e2e passed and skipped).
- [ ] **Step 2: Run** `npm test && npm run lint && BASE_PATH=/gati-chitra/ npm run build && BASE_PATH=/gati-chitra/ npm run check:dist && npm run test:e2e`. Expected: PASS.
- [ ] **Step 3:** Tick the Part 10 v0.9.0 boxes you checked by running commands.
- [ ] **Step 4: Commit and tag** (only if the owner's prompt allows commits)

```bash
git add -A && git commit -m "chore: release v0.9.0" && git tag v0.9.0
```

---

## How every engine task is built

Each diagram type takes two tasks: a **parse** task and an **edit** task (sequence takes three, because its layout is large). They follow the same recipe, so read this once.

**Parse task:**

1. `src/diagrams/<kind>/parse.ts`: `export function parse<Kind>(text: string): ParsedDoc` per its Part 5 section, built on the Part 5.0 kit. Keep it under 300 lines; if it grows, move the regexes to `src/diagrams/<kind>/patterns.ts`.
2. `src/diagrams/<kind>/layout.ts` (custom layouts only) per Part 6.
3. `src/diagrams/<kind>/index.ts`: `export const engine: DiagramEngine` with `parse`, `layout` (if any), **all caps false**, empty choice lists and `applyOp: () => ({ error: MESSAGES.opUnsupported })`. The edit task replaces the caps, choices and `applyOp`.
4. `src/diagrams/registry.ts`: add the kind's line to `LOADERS`, for example `state: () => import('./state/index').then((m) => m.engine),`.
5. `tests/fixtures/diagrams/<kind>.mmd` (the text given in the task) and `tests/fixtures/diagrams/<kind>.json` (`{ "kind": …, "nodes": …, "edges": …, "groups": … }`). The corpus test (created in Task 75) picks them up by itself.
6. Tests: `src/diagrams/<kind>/parse.test.ts` (and `layout.test.ts`). Import the parser directly, not through the registry.

**Edit task:**

1. `src/diagrams/<kind>/ops.ts`: `export function apply<Kind>Op(text: string, op: TextOp): TextOpResult` per Part 8.0 (the fixed order) and the kind's Part 8.2 table, built on the edit kit.
2. `index.ts`: real `caps`, `addChoices`, `shapeChoices`, `edgeVariants` from Part 8.1; `applyOp: apply<Kind>Op`.
3. `public/templates/<kind>.mmd` = a copy of the fixture; add `{ "id": "<kind>", "title": "<title given in the task>", "file": "<kind>.mmd" }` to `public/templates/index.json`.
4. Add one row to `CASES` in `tests/e2e/diagrams.spec.ts` and one row to `CASES` in `tests/e2e/diagram-edit.spec.ts` (both created in Task 76).
5. Tests: `src/diagrams/<kind>/ops.test.ts` with the task's cases, the "rename with awkward characters keeps the diagram valid" case (Review Focus 4) and the "refuses ops while the text has errors" case (Review Focus 3).

**Imports in test snippets.** From Task 82 on, test snippets leave out their import lines to save space. Import what they use: `describe`, `it`, `expect` from `vitest`; `MESSAGES` from `src/core/constants`; `testMeasure` from `tests/support/measure`; `guardOk` from `src/diagrams/common/edit`; the engine's own `parse…`, `layout…` and `apply…Op` from its folder.

**Commands for both kinds of task:** `npm test && npm run lint && npm run build && npm run check:dist`. Edit tasks also run `npm run test:e2e -- diagrams.spec.ts diagram-edit.spec.ts`, then the full `npm run test:e2e`. `check:dist` must show the new engine as its own lazy chunk under 80 KB and the initial JS still at most 150 KB.

---

## Milestone D2: v0.10.0 State, class and ER diagrams (Tasks 75 to 81)

### Task 75: State diagrams: parse

**Files:** Create `src/diagrams/state/parse.ts`, `src/diagrams/state/index.ts`, `src/diagrams/state/parse.test.ts`, `src/diagrams/corpus.test.ts`, `tests/fixtures/diagrams/state.mmd`, `tests/fixtures/diagrams/state.json`. Modify `src/diagrams/registry.ts`.

**Interfaces:**

- Consumes: Part 5.0 kit; Part 5.1 grammar.
- Produces: `parseState(text: string): ParsedDoc`; `engine` (state, no `layout`); the corpus test.

Fixture `tests/fixtures/diagrams/state.mmd`, expected `{ "kind": "state", "nodes": 8, "edges": 8, "groups": 1 }`:

```
---
title: Order lifecycle
---
stateDiagram-v2
  direction LR
  [*] --> Idle
  Idle --> Paying : checkout
  Paying --> Paid : approved
  Paying --> Idle : declined
  state Paid {
    [*] --> Packing
    Packing --> Shipped
  }
  Paid --> [*]
  note right of Idle : Waiting for the customer
```

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/corpus.test.ts
import fs from 'node:fs';
import path from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import type { DiagramKind } from '../core/types';
import { buildScene } from '../layout/scene';
import { testMeasure } from '../../tests/support/measure';
import { parseDocument } from './parse-any';
import { LOADERS, loadEngine } from './registry';
const DIR = path.resolve(__dirname, '../../tests/fixtures/diagrams');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.mmd'));
beforeAll(async () => { for (const k of Object.keys(LOADERS)) await loadEngine(k as DiagramKind); });
describe('diagram corpus', () => {
  for (const f of files) {
    it(`${f} parses with no errors or warnings and lays out`, () => {
      const text = fs.readFileSync(path.join(DIR, f), 'utf8');
      const want = JSON.parse(fs.readFileSync(path.join(DIR, f.replace(/\.mmd$/, '.json')), 'utf8'));
      const doc = parseDocument(text);
      expect(doc.diagnostics.filter((d) => d.severity !== 'info')).toEqual([]);
      expect({ kind: doc.kind, nodes: doc.nodes.length, edges: doc.edges.length, groups: doc.groups.length }).toEqual(want);
      expect(() => buildScene(doc, testMeasure)).not.toThrow();
    });
  }
});

// src/diagrams/state/parse.test.ts
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseState } from './parse';
const T = `stateDiagram-v2
  [*] --> Still
  Still --> Moving : push
  Moving --> Crash
  Crash --> [*]
  state Moving {
    [*] --> Slow
    Slow --> Fast
  }`;
describe('parseState', () => {
  it('reads states, pseudo-states, composites and labels', () => {
    const d = parseState(T);
    expect(d).toMatchObject({ kind: 'state', ok: true, direction: 'TB' });
    expect(d.nodes.map((n) => n.id)).toEqual(['__start_root', 'Still', 'Crash', '__end_root', '__start_Moving', 'Slow', 'Fast']);
    expect(d.groups.map((g) => [g.id, g.title, g.parent, g.endLine])).toEqual([['Moving', 'Moving', null, 8]]);
    expect(d.edges).toHaveLength(6);
    expect(d.edges[1]).toMatchObject({ from: 'Still', to: 'Moving', toIsGroup: true, label: 'push', variant: '-->', markers: { start: 'none', end: 'arrow' } });
    const span = d.edges[1].labelSpan!;
    expect(T.split('\n')[span.line].slice(span.from, span.to)).toBe('push');
    expect(d.nodes.find((n) => n.id === 'Slow')!.group).toBe('Moving');
    expect(d.nodes[0]).toMatchObject({ shape: 'filledCircle', label: '', size: { width: 20, height: 20 } });
    expect(d.nodes[3]).toMatchObject({ shape: 'framedCircle', size: { width: 24, height: 24 } });
  });
  it('reads descriptions, choices, forks, notes and regions', () => {
    const d = parseState(`stateDiagram
  s1 : First
  s1 : more
  state "Second" as s2
  state c <<choice>>
  state f <<fork>>
  note left of s1 : hello
  state Busy {
    a --> b
    --
    x --> y
  }`);
    expect(d.nodes.find((n) => n.id === 's1')!.label).toBe('First\nmore');
    expect(d.nodes.find((n) => n.id === 's2')!.label).toBe('Second');
    expect(d.nodes.find((n) => n.id === 'c')).toMatchObject({ shape: 'diamond', size: { width: 28, height: 28 } });
    expect(d.nodes.find((n) => n.id === 'f')!.shape).toBe('forkBar');
    expect(d.nodes.find((n) => n.id === 'note1')).toMatchObject({ shape: 'note', label: 'hello' });
    expect(d.groups.map((g) => [g.id, g.parent])).toEqual([['Busy', null], ['Busy__r1', 'Busy'], ['Busy__r2', 'Busy']]);
    expect(d.nodes.find((n) => n.id === 'a')!.group).toBe('Busy__r1');
    expect(d.nodes.find((n) => n.id === 'y')!.group).toBe('Busy__r2');
  });
  it('reports an unclosed composite and a stray brace', () => {
    expect(parseState('stateDiagram-v2\n  state X {\n  a --> b').diagnostics).toContainEqual({ line: 2, severity: 'error', message: MESSAGES.unclosedBrace('X') });
    expect(parseState('stateDiagram-v2\n  }').diagnostics).toContainEqual({ line: 2, severity: 'error', message: MESSAGES.strayBlockEnd });
  });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams`. Expected: FAIL.
- [x] **Step 3: Implement** per "How every engine task is built" and Part 5.1.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read Mermaid state diagrams"
```

### Task 76: State diagrams: visual edits, template and browser tests

**Files:** Create `src/diagrams/state/ops.ts`, `src/diagrams/state/ops.test.ts`, `public/templates/state.mmd`, `tests/e2e/diagrams.spec.ts`, `tests/e2e/diagram-edit.spec.ts`. Modify `src/diagrams/state/index.ts`, `public/templates/index.json`.

**Interfaces:**

- Produces: `applyStateOp(text: string, op: TextOp): TextOpResult`; the two e2e specs with their `CASES` tables. Template title: `State machine`.

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/state/ops.test.ts
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseState } from './parse';
import { applyStateOp } from './ops';
const B = 'stateDiagram-v2\n  [*] --> A\n  A --> B\n';
const text = (r: ReturnType<typeof applyStateOp>) => ('text' in r ? r.text : r.error);
describe('applyStateOp', () => {
  it('adds, connects, renames, reverses and deletes', () => {
    expect(applyStateOp(B, { type: 'addNode', label: 'New', shape: 'round' })).toEqual({ text: B + '  S1 : New\n', createdId: 'S1' });
    expect(text(applyStateOp(B, { type: 'addEdge', from: 'B', to: 'A', label: 'back' }))).toBe(B + '  B --> A : back\n');
    expect(text(applyStateOp(B, { type: 'renameNode', id: 'A', label: 'Idle' }))).toBe(B + '  A : Idle\n');
    expect(text(applyStateOp(B, { type: 'renameEdge', index: 1, label: 'go' }))).toBe('stateDiagram-v2\n  [*] --> A\n  A --> B : go\n');
    expect(text(applyStateOp(B, { type: 'reverseEdge', index: 1 }))).toBe('stateDiagram-v2\n  [*] --> A\n  B --> A\n');
    expect(text(applyStateOp(B, { type: 'deleteNode', id: 'B' }))).toBe('stateDiagram-v2\n  [*] --> A\n');
    expect(text(applyStateOp(B, { type: 'setNodeStyle', id: 'A', style: { fill: '#f00' } }))).toBe(B + '  classDef gc_A fill:#f00\n  class A gc_A\n');
    expect(text(applyStateOp(B, { type: 'setPin', id: 'A', x: 10, y: 20 }))).toContain('%% studio:pos A 10 20');
  });
  it('keeps transitions inside their composite state', () => {
    const C = 'stateDiagram-v2\n  A --> B\n  state C {\n    D --> E\n  }\n';
    expect(applyStateOp(C, { type: 'addEdge', from: 'A', to: 'D' })).toEqual({ error: MESSAGES.crossScope });
    expect(text(applyStateOp(C, { type: 'addEdge', from: 'E', to: 'D' }))).toBe('stateDiagram-v2\n  A --> B\n  state C {\n    D --> E\n    E --> D\n  }\n');
  });
  it('rename with awkward characters keeps the diagram valid', () => {
    const r = applyStateOp(B, { type: 'renameNode', id: 'A', label: 'say "hi": now #1 | ok' });
    const d = parseState(text(r));
    expect(d.ok).toBe(true);
    expect(d.nodes).toHaveLength(parseState(B).nodes.length);
    expect(d.nodes.find((n) => n.id === 'A')!.label).toBe('say hi now #1 | ok');
  });
  it('refuses ops while the text has errors', () => {
    expect(applyStateOp('stateDiagram-v2\n  state X {\n', { type: 'addNode', label: 'x', shape: 'round' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
```

```ts
// tests/e2e/diagrams.spec.ts
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, type Page } from '@playwright/test';
const CASES: { kind: string; file: string; nodes: number; svgText: string }[] = [
  { kind: 'state', file: 'state.mmd', nodes: 8, svgText: 'Paying' },
];
async function load(page: Page, file: string): Promise<void> {
  const text = fs.readFileSync(path.join('public/templates', file), 'utf8');
  await page.evaluate((t) => (window as any).__studio.setText(t), text);
  await expect.poll(() => page.evaluate(() => (window as any).__studio.getSummary().ok), { timeout: 10_000 }).toBe(true);
}
for (const c of CASES) {
  test(`${c.kind}: parses, draws, animates and exports`, async ({ page, browserName }) => {
    await page.goto('./?e2e=1');
    await load(page, c.file);
    expect((await page.evaluate(() => (window as any).__studio.getSummary())).nodes.length).toBe(c.nodes);
    // 1. the canvas is not blank: reuse the nonBgPixels idea from preview.spec.ts (> 100 pixels)
    // 2. animation (skip this part on webkit, as preview.spec.ts does): select 'build' in #anim-style, take two canvas.toDataURL() snapshots 500 ms apart, expect them to differ
    // 3. export: copy the download steps of export-svg.spec.ts; the SVG text contains c.svgText and parses with DOMParser without a parsererror
  });
}
test('restores the flowchart controls after another type', async ({ page }) => {
  await page.goto('./?e2e=1');
  const count = (sel: string) => page.locator(`${sel} option`).count();
  const before = { add: await count('#add-shape'), kind: await count('#prop-kind') };
  await load(page, CASES[0].file);
  await expect(page.locator('#card-mode')).toBeDisabled();
  await page.evaluate(() => (window as any).__studio.setText('flowchart TD\nA-->B'));
  await expect.poll(() => count('#add-shape')).toBe(before.add);
  expect(await count('#prop-kind')).toBe(before.kind);
  await expect(page.locator('#card-mode')).toBeEnabled();
  await expect(page.locator('#btn-add-node')).toBeEnabled();
});
```

```ts
// tests/e2e/diagram-edit.spec.ts
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
const CASES: { kind: string; file: string; nodeId: string; newLabel: string; canAdd: boolean; canDelete: boolean }[] = [
  { kind: 'state', file: 'state.mmd', nodeId: 'Paying', newLabel: 'Charging', canAdd: true, canDelete: true },
];
for (const c of CASES) {
  test(`${c.kind}: rename, delete and add on the canvas write the text`, async ({ page }) => {
    await page.goto('./?e2e=1');
    // load the template as in diagrams.spec.ts
    // rename: double-click the node at __studio.getNodeScreenCenter(c.nodeId), type c.newLabel into #inline-edit, press Enter
    //         (copy the double-click rename steps from tests/e2e/edit.spec.ts); expect __studio.getText() to contain c.newLabel and getSummary().ok to be true
    // delete (when c.canDelete): click the node, press Delete; expect the node count to drop and ok to stay true
    // add (when c.canAdd): click #btn-add-node; expect the node count to grow by one and ok to stay true
  });
}
```

The comments inside the two e2e files are the steps to write; replace each comment with the real Playwright code it describes.

- [x] **Step 2: Run** `npx vitest run src/diagrams/state`. Expected: FAIL.
- [x] **Step 3: Implement** per "How every engine task is built" and Part 8.2 **State**. Caps from Part 8.1.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit state diagrams on the canvas; add the state template and diagram browser tests"
```

### Task 77: Class diagrams: parse

**Files:** Create `src/diagrams/class/parse.ts`, `src/diagrams/class/index.ts`, `src/diagrams/class/parse.test.ts`, `tests/fixtures/diagrams/class.mmd`, `tests/fixtures/diagrams/class.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "class", "nodes": 5, "edges": 5, "groups": 0 }`:

```
---
title: Animals
---
classDiagram
  direction LR
  class Animal {
    <<abstract>>
    +String name
    +int age
    +eat(food) void
  }
  class Duck {
    +swim() void
  }
  class Fish {
    -int fins
  }
  class Pond["Pond"]
  Animal <|-- Duck
  Animal <|-- Fish
  Pond "1" o-- "*" Duck : lives in
  Pond *-- Fish
  note for Duck "Can fly and swim"
```

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/class/parse.test.ts
import { describe, expect, it } from 'vitest';
import { parseClass } from './parse';
const T = `classDiagram
  direction LR
  class Animal {
    <<interface>>
    +int age
    +eat() void
  }
  class Duck["Mallard duck"]
  Animal <|-- Duck : extends
  Duck "1" --> "*" Egg
  Duck : +swim()
  note for Duck "can fly"
  foo--bar
  List~int~ ..|> Animal`;
describe('parseClass', () => {
  it('reads classes, members, annotations and labels', () => {
    const d = parseClass(T);
    expect(d).toMatchObject({ kind: 'class', ok: true, direction: 'LR' });
    expect(d.nodes.map((n) => n.id)).toEqual(['Animal', 'Duck', 'Egg', 'note1', 'foo', 'bar', 'List']);
    expect(d.nodes[0].sections).toEqual([
      { rows: [['«interface»']], align: 'center', weight: 'italic', divider: false },
      { rows: [['Animal']], align: 'center', weight: 'bold', divider: false },
      { rows: [['+int age']], align: 'left', weight: 'normal', divider: true },
      { rows: [['+eat() void']], align: 'left', weight: 'normal', divider: true },
    ]);
    const duck = d.nodes[1];
    expect(duck.label).toBe('Mallard duck');
    expect(T.split('\n')[duck.labelSpan!.line].slice(duck.labelSpan!.from, duck.labelSpan!.to)).toBe('Mallard duck');
    expect(duck.sections!.at(-1)).toEqual({ rows: [['+swim()']], align: 'left', weight: 'normal', divider: true });
    expect(d.nodes[6].label).toBe('List<int>');
  });
  it('reads relations, markers, cardinalities and notes', () => {
    const e = parseClass(T).edges;
    expect(e[0]).toMatchObject({ from: 'Animal', to: 'Duck', kind: 'open', label: 'extends', variant: '<|--', markers: { start: 'triangle', end: 'none' } });
    expect(e[1]).toMatchObject({ from: 'Duck', to: 'Egg', variant: '-->', endLabels: { from: '1', to: '*' }, markers: { start: 'none', end: 'openArrow' } });
    expect(e[2]).toMatchObject({ from: 'note1', to: 'Duck', kind: 'dotted', variant: 'note' });
    expect(e[3]).toMatchObject({ from: 'foo', to: 'bar', variant: '--', markers: { start: 'none', end: 'none' } });
    expect(e[4]).toMatchObject({ from: 'List', to: 'Animal', kind: 'dotted', variant: '..|>', markers: { start: 'none', end: 'triangle' } });
  });
  it('reads namespaces as groups and styles', () => {
    const d = parseClass('classDiagram\n  namespace Shapes {\n    class Square\n  }\n  style Square fill:#f00\n  classDef hot stroke:#0f0\n  class Square:::hot');
    expect(d.groups.map((g) => g.id)).toEqual(['Shapes']);
    expect(d.nodes[0]).toMatchObject({ id: 'Square', group: 'Shapes', style: { fill: '#f00', stroke: '#0f0' } });
  });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/class`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 5.2.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read Mermaid class diagrams"
```

### Task 78: Class diagrams: visual edits and template

**Files:** Create `src/diagrams/class/ops.ts`, `src/diagrams/class/ops.test.ts`, `public/templates/class.mmd`. Modify `src/diagrams/class/index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'class', file: 'class.mmd', nodes: 5, svgText: 'Animal' }` and `{ kind: 'class', file: 'class.mmd', nodeId: 'Fish', newLabel: 'Trout', canAdd: true, canDelete: true }`. Template title: `Class model`.

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/class/ops.test.ts
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseClass } from './parse';
import { applyClassOp } from './ops';
const B = 'classDiagram\n  class A\n  A <|-- B\n';
const text = (r: ReturnType<typeof applyClassOp>) => ('text' in r ? r.text : r.error);
describe('applyClassOp', () => {
  it('adds, connects and renames', () => {
    expect(applyClassOp(B, { type: 'addNode', label: 'Shape', shape: 'rect' })).toEqual({ text: B + '  class Class1["Shape"]\n', createdId: 'Class1' });
    expect(text(applyClassOp(B, { type: 'addEdge', from: 'A', to: 'B', label: 'uses' }))).toBe(B + '  A --> B : uses\n');
    expect(text(applyClassOp(B, { type: 'renameNode', id: 'A', label: 'Animal' }))).toBe('classDiagram\n  class A["Animal"]\n  A <|-- B\n');
    expect(text(applyClassOp(B, { type: 'renameNode', id: 'B', label: 'Bee' }))).toBe('classDiagram\n  class B["Bee"]\n  class A\n  A <|-- B\n');
    expect(text(applyClassOp(B, { type: 'renameEdge', index: 0, label: 'is' }))).toBe('classDiagram\n  class A\n  A <|-- B : is\n');
  });
  it('changes, reverses and deletes relations', () => {
    expect(text(applyClassOp(B, { type: 'setEdgeVariant', index: 0, variant: '*--' }))).toBe('classDiagram\n  class A\n  A *-- B\n');
    expect(text(applyClassOp(B, { type: 'reverseEdge', index: 0 }))).toBe('classDiagram\n  class A\n  B --|> A\n');
    expect(text(applyClassOp(B, { type: 'deleteNode', id: 'A' }))).toBe('classDiagram\n');
    expect(text(applyClassOp(B, { type: 'setNodeStyle', id: 'A', style: { fill: '#f00' } }))).toBe(B + '  style A fill:#f00\n');
  });
  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseClass(text(applyClassOp(B, { type: 'renameNode', id: 'A', label: 'say "hi": now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes.find((n) => n.id === 'A')!.label).toBe('say hi : now #1 | ok');
  });
  it('refuses ops while the text has errors', () => {
    expect(applyClassOp('classDiagram\n  class A {\n', { type: 'deleteNode', id: 'A' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
```

(Only `"` is forbidden in class labels; `cleanForText` turns each `"` into a space and then collapses spaces, so `say "hi": now` becomes `say hi : now`.)

- [x] **Step 2: Run** `npx vitest run src/diagrams/class`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Class**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit class diagrams on the canvas and add the class template"
```

### Task 79: ER diagrams: parse

**Files:** Create `src/diagrams/er/parse.ts`, `src/diagrams/er/index.ts`, `src/diagrams/er/parse.test.ts`, `tests/fixtures/diagrams/er.mmd`, `tests/fixtures/diagrams/er.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "er", "nodes": 4, "edges": 3, "groups": 0 }`:

```
---
title: Shop data
---
erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE-ITEM : contains
  PRODUCT ||--o{ LINE-ITEM : "appears in"
  CUSTOMER {
    string id PK
    string name
    string email UK
  }
  ORDER {
    string id PK
    string customerId FK
    date placedAt
  }
  PRODUCT {
    string sku PK
    float price
  }
```

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/er/parse.test.ts
import { describe, expect, it } from 'vitest';
import { parseEr } from './parse';
const T = `erDiagram
  CUSTOMER ||--o{ ORDER : places
  CUSTOMER {
    string name PK
    int id
  }
  ORDER }|..|{ LINE-ITEM : "contains"
  p[Person] only one to zero or more CUSTOMER : knows`;
describe('parseEr', () => {
  it('reads entities, attributes and aliases', () => {
    const d = parseEr(T);
    expect(d).toMatchObject({ kind: 'er', ok: true });
    expect(d.nodes.map((n) => [n.id, n.label])).toEqual([['CUSTOMER', 'CUSTOMER'], ['ORDER', 'ORDER'], ['LINE-ITEM', 'LINE-ITEM'], ['p', 'Person']]);
    expect(d.nodes[0].sections![1].rows).toEqual([['string', 'name', 'PK', ''], ['int', 'id', '', '']]);
    expect(d.nodes[1].sections).toBeUndefined();
  });
  it('reads symbol and word relationships', () => {
    const e = parseEr(T).edges;
    expect(e[0]).toMatchObject({ from: 'CUSTOMER', to: 'ORDER', kind: 'open', label: 'places', variant: '||--o{', markers: { start: 'erOne', end: 'erZeroOrMore' } });
    expect(e[1]).toMatchObject({ kind: 'dotted', label: 'contains', variant: '}|..|{', markers: { start: 'erOneOrMore', end: 'erOneOrMore' } });
    expect(e[2]).toMatchObject({ from: 'p', to: 'CUSTOMER', kind: 'open', variant: '||--o{', markers: { start: 'erOne', end: 'erZeroOrMore' } });
  });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/er`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 5.3.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read Mermaid entity relationship diagrams"
```

### Task 80: ER diagrams: visual edits and template

**Files:** Create `src/diagrams/er/ops.ts`, `src/diagrams/er/ops.test.ts`, `public/templates/er.mmd`. Modify `src/diagrams/er/index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'er', file: 'er.mmd', nodes: 4, svgText: 'CUSTOMER' }` and `{ kind: 'er', file: 'er.mmd', nodeId: 'PRODUCT', newLabel: 'Item', canAdd: true, canDelete: true }`. Template title: `Data model`.

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/er/ops.test.ts
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseEr } from './parse';
import { applyErOp } from './ops';
const B = 'erDiagram\n  A ||--o{ B : has\n';
const text = (r: ReturnType<typeof applyErOp>) => ('text' in r ? r.text : r.error);
describe('applyErOp', () => {
  it('adds, connects and renames', () => {
    expect(applyErOp(B, { type: 'addNode', label: 'Item', shape: 'rect' })).toEqual({ text: B + '  E1["Item"]\n', createdId: 'E1' });
    expect(text(applyErOp(B, { type: 'addEdge', from: 'B', to: 'A' }))).toBe(B + '  B ||--o{ A : "relates"\n');
    expect(text(applyErOp(B, { type: 'renameNode', id: 'A', label: 'Account' }))).toBe('erDiagram\n  A["Account"]\n  A ||--o{ B : has\n');
    expect(text(applyErOp(B, { type: 'renameEdge', index: 0, label: 'owns many' }))).toBe('erDiagram\n  A ||--o{ B : "owns many"\n');
  });
  it('changes, reverses and deletes relationships', () => {
    expect(text(applyErOp(B, { type: 'setEdgeVariant', index: 0, variant: '}o--o{' }))).toBe('erDiagram\n  A }o--o{ B : has\n');
    expect(text(applyErOp(B, { type: 'reverseEdge', index: 0 }))).toBe('erDiagram\n  B }o--|| A : "has"\n');
    expect(text(applyErOp(B, { type: 'deleteNode', id: 'B' }))).toBe('erDiagram\n');
  });
  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseEr(text(applyErOp(B, { type: 'renameNode', id: 'A', label: 'say "hi": now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes).toHaveLength(2);
    expect(d.nodes[0].label).toBe('say hi : now #1 | ok');
  });
  it('refuses ops while the text has errors', () => {
    expect(applyErOp('erDiagram\n  A {\n', { type: 'deleteNode', id: 'A' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
```

For this test to hold, an ER entity block with no closing `}` must be an error `MESSAGES.unclosedBrace(name)` (add it to the parser if Task 79 did not).

- [x] **Step 2: Run** `npx vitest run src/diagrams/er`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **ER**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit ER diagrams on the canvas and add the ER template"
```

### Task 81: Release v0.10.0

**Files:** `package.json` (`0.10.0`), `src/repo.test.ts` (version `0.9.0` → `0.10.0`), `README.md` (a "Diagram types" section listing flowchart, state, class and ER, with one header line each; run the humanizer on it), `RELEASE_CHECKLIST.md`, `handoff.md`, `DECISIONS.md`.

- [x] **Step 1:** Make the changes.
- [x] **Step 2: Run** `npm test && npm run lint && BASE_PATH=/gati-chitra/ npm run build && BASE_PATH=/gati-chitra/ npm run check:dist && npm run test:e2e`. Expected: PASS.
- [x] **Step 3:** Tick the Part 10 v0.10.0 boxes you checked by command; record the numbers in `handoff.md`.
- [x] **Step 4: Commit and tag** (only if allowed): `git add -A && git commit -m "chore: release v0.10.0" && git tag v0.10.0`

---

## Milestone D3: v0.11.0 Requirement, use case and architecture diagrams (Tasks 82 to 88)

### Task 82: Requirement diagrams: parse

**Files:** Create `src/diagrams/requirement/parse.ts`, `index.ts`, `parse.test.ts`, `tests/fixtures/diagrams/requirement.mmd`, `requirement.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "requirement", "nodes": 4, "edges": 4, "groups": 0 }`:

```
requirementDiagram
  requirement fast_checkout {
    id: 1
    text: Checkout takes under 3 seconds.
    risk: medium
    verifymethod: test
  }
  functionalRequirement pay_by_card {
    id: 1.1
    text: Customers can pay by card.
    risk: high
    verifymethod: demonstration
  }
  element checkout_service {
    type: service
    docref: docs/checkout.md
  }
  element load_test {
    type: test suite
  }
  checkout_service - satisfies -> fast_checkout
  checkout_service - satisfies -> pay_by_card
  load_test - verifies -> fast_checkout
  fast_checkout - contains -> pay_by_card
```

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/requirement/parse.test.ts
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseRequirement } from './parse';
const T = `requirementDiagram
  requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
  }
  element test_entity {
    type: simulation
  }
  test_entity - satisfies -> test_req
  test_req <- copies - other`;
describe('parseRequirement', () => {
  it('reads requirements, elements and their fields', () => {
    const d = parseRequirement(T);
    expect(d).toMatchObject({ kind: 'requirement', ok: true });
    expect(d.nodes.map((n) => n.id)).toEqual(['test_req', 'test_entity', 'other']);
    expect(d.nodes[0].sections).toEqual([
      { rows: [['«Requirement»']], align: 'center', weight: 'italic', divider: false },
      { rows: [['test_req']], align: 'center', weight: 'bold', divider: false },
      { rows: [['ID: 1'], ['Text: the test text.'], ['Risk: high'], ['Verification: test']], align: 'left', weight: 'normal', divider: true },
    ]);
    expect(d.nodes[1].sections![2].rows).toEqual([['Type: simulation']]);
    expect(d.nodes[0].refLines).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('reads both relation directions', () => {
    const e = parseRequirement(T).edges;
    expect(e[0]).toMatchObject({ from: 'test_entity', to: 'test_req', kind: 'dotted', label: '«satisfies»', variant: 'satisfies', markers: { start: 'none', end: 'arrow' } });
    expect(e[1]).toMatchObject({ from: 'other', to: 'test_req', variant: 'copies' });
  });
  it('reports an unclosed block', () => {
    expect(parseRequirement('requirementDiagram\n  requirement r {\n    id: 1').diagnostics).toContainEqual({ line: 2, severity: 'error', message: MESSAGES.unclosedBrace('r') });
  });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/requirement`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 5.4.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read Mermaid requirement diagrams"
```

### Task 83: Requirement diagrams: visual edits and template

**Files:** Create `src/diagrams/requirement/ops.ts`, `ops.test.ts`, `public/templates/requirement.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'requirement', file: 'requirement.mmd', nodes: 4, svgText: 'fast_checkout' }` and `{ kind: 'requirement', file: 'requirement.mmd', nodeId: 'load_test', newLabel: 'soak_test', canAdd: true, canDelete: true }`. Template title: `Requirements`.

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/requirement/ops.test.ts
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseRequirement } from './parse';
import { applyRequirementOp } from './ops';
const B = 'requirementDiagram\n  requirement r1 {\n    id: 1\n  }\n  element e1 {\n  }\n  e1 - satisfies -> r1\n';
const text = (r: ReturnType<typeof applyRequirementOp>) => ('text' in r ? r.text : r.error);
describe('applyRequirementOp', () => {
  it('adds requirements and relations', () => {
    expect(applyRequirementOp(B, { type: 'addNode', label: 'Fast', shape: 'rect' })).toEqual({
      text: B + '  requirement req1 {\n    id: 1\n    text: Fast\n    risk: medium\n    verifymethod: test\n  }\n', createdId: 'req1',
    });
    expect(text(applyRequirementOp(B, { type: 'addEdge', from: 'r1', to: 'e1' }))).toBe(B + '  r1 - satisfies -> e1\n');
  });
  it('renames a requirement everywhere and refuses a taken name', () => {
    expect(text(applyRequirementOp(B, { type: 'renameNode', id: 'r1', label: 'fast checkout' }))).toBe(
      'requirementDiagram\n  requirement fast_checkout {\n    id: 1\n  }\n  element e1 {\n  }\n  e1 - satisfies -> fast_checkout\n');
    expect(applyRequirementOp(B, { type: 'renameNode', id: 'r1', label: 'e1' })).toEqual({ error: MESSAGES.nameTaken('e1') });
    expect(applyRequirementOp(B, { type: 'renameEdge', index: 0, label: 'x' })).toEqual({ error: MESSAGES.opUnsupported });
  });
  it('changes, reverses and deletes', () => {
    expect(text(applyRequirementOp(B, { type: 'setEdgeVariant', index: 0, variant: 'verifies' }))).toBe(B.replace('satisfies', 'verifies'));
    expect(text(applyRequirementOp(B, { type: 'reverseEdge', index: 0 }))).toBe(B.replace('e1 - satisfies -> r1', 'r1 - satisfies -> e1'));
    expect(text(applyRequirementOp(B, { type: 'deleteNode', id: 'e1' }))).toBe('requirementDiagram\n  requirement r1 {\n    id: 1\n  }\n');
  });
  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseRequirement(text(applyRequirementOp(B, { type: 'renameNode', id: 'r1', label: 'say "hi": now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes).toHaveLength(2);
    expect(d.nodes[0].label).toMatch(/^say_+hi_+now_+1_+ok$/);
  });
  it('refuses ops while the text has errors', () => {
    expect(applyRequirementOp('requirementDiagram\n  requirement r {\n', { type: 'deleteNode', id: 'r' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/requirement`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Requirement**. Inner block lines get two more spaces than the block's first line.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit requirement diagrams on the canvas and add the requirement template"
```

### Task 84: Use case diagrams: parse

Read the note at the top of Part 5.5 first.

**Files:** Create `src/diagrams/usecase/parse.ts`, `index.ts`, `parse.test.ts`, `tests/fixtures/diagrams/usecase.mmd`, `usecase.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "usecase", "nodes": 6, "edges": 4, "groups": 1 }`:

```
usecase-beta
  direction LR
  actor Customer
  actor Clerk("Shop clerk")
  systemBoundary shop["Online shop"]
    Browse("Browse products")
    Buy("Place an order")
    Pay("Pay")
    Refund("Issue a refund")
  end
  Customer --> Browse
  Customer --> Buy
  Buy ..> Pay : include
  Clerk --> Refund
```

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/usecase/parse.test.ts
import { describe, expect, it } from 'vitest';
import { parseUsecase } from './parse';
const T = `usecase-beta
  direction LR
  actor Customer
  actor Admin("Main administrator")
  Login("Sign in")
  Report[Generate report]
  systemBoundary shop["Online shop"]
    Checkout("Check out")
  end
  Customer --> Login
  Customer -- "buys" --> Checkout
  Admin ---> Report
  Checkout ..> Login : include
  Admin --|> Customer`;
describe('parseUsecase', () => {
  it('reads actors, use cases, boxes and the boundary', () => {
    const d = parseUsecase(T);
    expect(d).toMatchObject({ kind: 'usecase', ok: true, direction: 'LR' });
    expect(d.nodes.map((n) => [n.id, n.shape, n.label])).toEqual([
      ['Customer', 'actor', 'Customer'], ['Admin', 'actor', 'Main administrator'], ['Login', 'ellipse', 'Sign in'],
      ['Report', 'rect', 'Generate report'], ['Checkout', 'ellipse', 'Check out'],
    ]);
    expect(d.groups.map((g) => [g.id, g.title])).toEqual([['shop', 'Online shop']]);
    expect(d.nodes[4].group).toBe('shop');
  });
  it('reads every operator', () => {
    const e = parseUsecase(T).edges;
    expect(e.map((x) => x.variant)).toEqual(['-->', '-->', '-->', '..>', '--|>']);
    expect(e[1].label).toBe('buys');
    expect(e[3]).toMatchObject({ kind: 'dotted', label: '«include»', markers: { start: 'none', end: 'openArrow' } });
    expect(e[4].markers).toEqual({ start: 'none', end: 'triangle' });
  });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/usecase`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 5.5.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read Mermaid use case diagrams"
```

### Task 85: Use case diagrams: visual edits and template

**Files:** Create `src/diagrams/usecase/ops.ts`, `ops.test.ts`, `public/templates/usecase.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'usecase', file: 'usecase.mmd', nodes: 6, svgText: 'Place an order' }` and `{ kind: 'usecase', file: 'usecase.mmd', nodeId: 'Pay', newLabel: 'Pay online', canAdd: true, canDelete: true }`. Template title: `Use cases`.

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/usecase/ops.test.ts
import { describe, expect, it } from 'vitest';
import { MESSAGES } from '../../core/constants';
import { parseUsecase } from './parse';
import { applyUsecaseOp } from './ops';
const B = 'usecase-beta\n  actor U\n  Login("Sign in")\n  U --> Login\n';
const text = (r: ReturnType<typeof applyUsecaseOp>) => ('text' in r ? r.text : r.error);
describe('applyUsecaseOp', () => {
  it('adds and renames', () => {
    expect(applyUsecaseOp(B, { type: 'addNode', label: 'Pay', shape: 'ellipse' })).toEqual({ text: B + '  UC1("Pay")\n', createdId: 'UC1' });
    expect(text(applyUsecaseOp(B, { type: 'renameNode', id: 'Login', label: 'Log in' }))).toBe(B.replace('Sign in', 'Log in'));
    expect(text(applyUsecaseOp(B, { type: 'renameNode', id: 'U', label: 'User' }))).toBe(B.replace('actor U\n', 'actor U("User")\n'));
    expect(text(applyUsecaseOp(B, { type: 'renameEdge', index: 0, label: 'starts' }))).toBe(B.replace('U --> Login', 'U -- "starts" --> Login'));
  });
  it('changes, reverses and deletes', () => {
    expect(text(applyUsecaseOp(B, { type: 'setEdgeVariant', index: 0, variant: '--' }))).toBe(B.replace('U --> Login', 'U -- Login'));
    expect(text(applyUsecaseOp(B, { type: 'reverseEdge', index: 0 }))).toBe(B.replace('U --> Login', 'Login <-- U'));
    expect(text(applyUsecaseOp(B, { type: 'deleteNode', id: 'Login' }))).toBe('usecase-beta\n  actor U\n');
  });
  it('rename with awkward characters keeps the diagram valid', () => {
    const d = parseUsecase(text(applyUsecaseOp(B, { type: 'renameNode', id: 'Login', label: 'say "hi": now #1 | ok' })));
    expect(d.ok).toBe(true);
    expect(d.nodes.find((n) => n.id === 'Login')!.label).toBe('say hi : now #1 | ok');
  });
  it('refuses ops while the text has errors', () => {
    expect(applyUsecaseOp('usecase-beta\n  systemBoundary b\n', { type: 'addNode', label: 'x', shape: 'ellipse' })).toEqual({ error: MESSAGES.fixTextFirst });
  });
});
```

The last case needs an unclosed `systemBoundary` to be an error `MESSAGES.unclosedBlock('systemBoundary')`; add it to the parser if Task 84 did not.

- [x] **Step 2: Run** `npx vitest run src/diagrams/usecase`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Use case**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit use case diagrams on the canvas and add the use case template"
```

### Task 86: Architecture diagrams: parse and grid layout

**Files:** Create `src/diagrams/architecture/parse.ts`, `layout.ts`, `index.ts`, `parse.test.ts`, `layout.test.ts`, `tests/fixtures/diagrams/architecture.mmd`, `architecture.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "architecture", "nodes": 4, "edges": 3, "groups": 1 }`:

```
architecture-beta
  group cloud(cloud)[Cloud]
  service web(internet)[Web app] in cloud
  service api(server)[API] in cloud
  service db(database)[Database] in cloud
  service files(disk)[Files] in cloud
  web:R --> L:api
  api:R --> L:db
  api:B --> T:files
```

- [x] **Step 1: Write the failing tests**

```ts
// shared input for both test files
const T = `architecture-beta
  group api(cloud)[API]
  service db(database)[Database] in api
  service server(server)[Server] in api
  service disk1(disk)[Storage] in api
  service lambda(logos:aws-lambda)[Lambda]
  junction j1
  db:L -- R:server
  disk1:T -- B:server
  server:R --> L:j1
  j1:R -- L:lambda`;

// src/diagrams/architecture/parse.test.ts
it('reads groups, services, junctions, icons and sides', () => {
  const d = parseArchitecture(T);
  expect(d).toMatchObject({ kind: 'architecture', ok: true });
  expect(d.nodes.map((n) => n.id)).toEqual(['db', 'server', 'disk1', 'lambda', 'j1']);
  expect(d.nodes[0]).toMatchObject({ shape: 'round', icon: 'database', label: 'Database', group: 'api' });
  expect(d.nodes[3].icon).toBe('server');
  expect(d.diagnostics).toContainEqual({ line: 6, severity: 'info', message: MESSAGES.iconFallback('logos:aws-lambda') });
  expect(d.nodes[4]).toMatchObject({ shape: 'filledCircle', label: '', size: { width: 12, height: 12 } });
  expect(d.edges[2]).toMatchObject({ from: 'server', to: 'j1', variant: '-->', markers: { start: 'none', end: 'arrow' } });
  expect(d.data!.architecture!.sides.e0).toEqual({ from: 'L', to: 'R' });
});

// src/diagrams/architecture/layout.test.ts
it('places nodes on a grid from the edge sides', () => {
  const doc = parseArchitecture(T);
  const L = layoutArchitecture(doc, testMeasure);
  const c = (id: string) => L.nodes[id].center;
  expect(c('server').x).toBeLessThan(c('db').x);
  expect(c('db').x).toBeLessThan(c('j1').x);
  expect(c('lambda').x).toBeLessThan(c('j1').x);
  expect(c('db').y).toBe(c('server').y);
  expect(c('disk1').x).toBe(c('server').x);
  expect(c('disk1').y).toBeGreaterThan(c('server').y);
  expect(L.edges.e0.kind).toBe('straight');
  const g = L.groups.api.rect;
  for (const id of ['db', 'server', 'disk1']) expect(c(id).x).toBeGreaterThan(g.x);
});
it('lets a pin move a service', () => {
  const doc = parseArchitecture(T + '\n%% studio:pos db 500 400');
  expect(layoutArchitecture(doc, testMeasure).nodes.db.center).toEqual({ x: 500, y: 400 });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/architecture`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe, Part 5.6 and Part 6.3. `layoutArchitecture(doc: ParsedDoc, measure: MeasureText): SceneLayout` is the engine's `layout`.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read and lay out Mermaid architecture diagrams with built-in icons"
```

### Task 87: Architecture diagrams: visual edits and template

**Files:** Create `src/diagrams/architecture/ops.ts`, `ops.test.ts`, `public/templates/architecture.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'architecture', file: 'architecture.mmd', nodes: 4, svgText: 'Database' }` and `{ kind: 'architecture', file: 'architecture.mmd', nodeId: 'files', newLabel: 'Blobs', canAdd: true, canDelete: true }`. Template title: `Cloud architecture`.

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/architecture/ops.test.ts
const B = 'architecture-beta\n  service a(server)[A]\n  service b(database)[B]\n  a:R -- L:b\n';
const text = (r: ReturnType<typeof applyArchitectureOp>) => ('text' in r ? r.text : r.error);
it('adds, connects, renames, changes, reverses and deletes', () => {
  expect(applyArchitectureOp(B, { type: 'addNode', label: 'Cache', shape: 'round' })).toEqual({ text: B + '  service s1(server)[Cache]\n', createdId: 's1' });
  expect(text(applyArchitectureOp(B, { type: 'addEdge', from: 'b', to: 'a' }))).toBe(B + '  b:R -- L:a\n');
  expect(text(applyArchitectureOp(B, { type: 'renameNode', id: 'a', label: 'Api' }))).toBe(B.replace('[A]', '[Api]'));
  expect(text(applyArchitectureOp(B, { type: 'setEdgeVariant', index: 0, variant: '-->' }))).toBe(B.replace('a:R -- L:b', 'a:R --> L:b'));
  expect(text(applyArchitectureOp(B, { type: 'reverseEdge', index: 0 }))).toBe(B.replace('a:R -- L:b', 'b:L -- R:a'));
  expect(text(applyArchitectureOp(B, { type: 'deleteNode', id: 'b' }))).toBe('architecture-beta\n  service a(server)[A]\n');
  expect(text(applyArchitectureOp(B, { type: 'setPin', id: 'a', x: 5, y: 6 }))).toContain('%% studio:pos a 5 6');
});
it('rename with awkward characters keeps the diagram valid', () => {
  const d = parseArchitecture(text(applyArchitectureOp(B, { type: 'renameNode', id: 'a', label: 'say [hi]: now #1 | ok' })));
  expect(d.ok).toBe(true);
  expect(d.nodes[0].label).toBe('say hi : now #1 | ok');
});
it('refuses ops while the text has errors', () => {
  expect(applyArchitectureOp('architecture-beta\n  a:R -- L:missing\n', { type: 'addNode', label: 'x', shape: 'round' })).toEqual({ error: MESSAGES.fixTextFirst });
});
```

The last case needs an edge to an unknown service to be an error `MESSAGES.unknownNode(id)`; add it to the parser if Task 86 did not.

- [x] **Step 2: Run** `npx vitest run src/diagrams/architecture`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Architecture**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit architecture diagrams on the canvas and add the architecture template"
```

### Task 88: Release v0.11.0

Same steps as Task 81, with version `0.11.0` (`src/repo.test.ts`: `0.10.0` → `0.11.0`), README listing requirement, use case and architecture as well, and the Part 10 v0.11.0 checklist. Commit message `chore: release v0.11.0`, tag `v0.11.0`.

- [x] **Step 1:** Make the changes and run the humanizer on `README.md`.
- [x] **Step 2: Run** the release commands from Task 81. Expected: PASS.
- [x] **Step 3:** Tick the boxes you checked by command; record the numbers in `handoff.md`.
- [x] **Step 4: Commit and tag** (only if allowed).

---

## Milestone D4: v0.12.0 Sequence diagrams and git graphs (Tasks 89 to 94)

### Task 89: Sequence diagrams: parse

**Files:** Create `src/diagrams/sequence/parse.ts`, `src/diagrams/sequence/index.ts`, `parse.test.ts`, `tests/fixtures/diagrams/sequence.mmd`, `sequence.json`. Modify `src/diagrams/registry.ts`. (The engine has no `layout` until Task 90, so the fixture lays out with dagre for one task; that is fine.)

Fixture, expected `{ "kind": "sequence", "nodes": 4, "edges": 5, "groups": 0 }`:

```
sequenceDiagram
  title Checkout
  actor C as Customer
  participant W as Web app
  participant P as Payments
  C->>W: Place order
  activate W
  W->>+P: Charge card
  P-->>-W: Approved
  alt in stock
    W-->>C: Order confirmed
  else out of stock
    W-->>C: Refund started
  end
  deactivate W
  Note over C,W: Email receipt sent
```

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/sequence`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 5.7. Build the operator alternation from the `HALF` and `ARROWS` arrays with a small `escapeRegExp(s)` helper (`s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`).
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read Mermaid sequence diagrams"
```

### Task 90: Sequence diagrams: layout

**Files:** Create `src/diagrams/sequence/layout.ts`, `layout.test.ts`. Modify `src/diagrams/sequence/index.ts` (add `layout`).

**Interfaces:** `layoutSequence(doc: ParsedDoc, measure: MeasureText): SceneLayout` per Part 6.1.

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/sequence`. Expected: FAIL.
- [x] **Step 3: Implement** Part 6.1 exactly, step by step, in the order written.
- [x] **Step 4: Run** the commands for engine tasks, then `npm run test:e2e -- preview.spec.ts present.spec.ts`. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: lay out sequence diagrams with lifelines, activations, frames and notes"
```

### Task 91: Sequence diagrams: visual edits and template

**Files:** Create `src/diagrams/sequence/ops.ts`, `ops.test.ts`, `public/templates/sequence.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'sequence', file: 'sequence.mmd', nodes: 4, svgText: 'Charge card' }` and `{ kind: 'sequence', file: 'sequence.mmd', nodeId: 'P', newLabel: 'Bank', canAdd: true, canDelete: true }`. Template title: `Checkout sequence`.

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/sequence`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Sequence**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit sequence diagrams on the canvas and add the sequence template"
```

### Task 92: Git graphs: parse and lane layout

**Files:** Create `src/diagrams/gitgraph/parse.ts`, `layout.ts`, `index.ts`, `parse.test.ts`, `layout.test.ts`, `tests/fixtures/diagrams/gitgraph.mmd`, `gitgraph.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "gitgraph", "nodes": 5, "edges": 5, "groups": 0 }`:

```
gitGraph
  commit id: "init"
  branch feature
  checkout feature
  commit id: "add form"
  commit id: "validate"
  checkout main
  commit id: "hotfix"
  merge feature id: "release" tag: "v1.0"
```

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/gitgraph`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe, Part 5.8 and Part 6.2.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read and lay out Mermaid git graphs"
```

### Task 93: Git graphs: visual edits and template

**Files:** Create `src/diagrams/gitgraph/ops.ts`, `ops.test.ts`, `public/templates/gitgraph.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'gitgraph', file: 'gitgraph.mmd', nodes: 5, svgText: 'release' }` and `{ kind: 'gitgraph', file: 'gitgraph.mmd', nodeId: 'c3', newLabel: 'urgent fix', canAdd: true, canDelete: true }`. Template title: `Release branches`.

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/gitgraph/ops.test.ts
const B = 'gitGraph\n  commit id: "a"\n  commit\n';
const text = (r: ReturnType<typeof applyGitGraphOp>) => ('text' in r ? r.text : r.error);
it('adds, renames and deletes commits', () => {
  expect(applyGitGraphOp(B, { type: 'addNode', label: 'b', shape: 'filledCircle' })).toEqual({ text: B + '  commit id: "b"\n', createdId: 'c2' });
  expect(text(applyGitGraphOp(B, { type: 'renameNode', id: 'c0', label: 'start' }))).toBe(B.replace('"a"', '"start"'));
  expect(text(applyGitGraphOp(B, { type: 'renameNode', id: 'c1', label: 'x' }))).toBe('gitGraph\n  commit id: "a"\n  commit id: "x"\n');
  expect(text(applyGitGraphOp(B, { type: 'deleteNode', id: 'c1' }))).toBe('gitGraph\n  commit id: "a"\n');
  expect(applyGitGraphOp(B, { type: 'addEdge', from: 'c0', to: 'c1' })).toEqual({ error: MESSAGES.opUnsupported });
});
it('rename with awkward characters keeps the diagram valid', () => {
  const d = parseGitGraph(text(applyGitGraphOp(B, { type: 'renameNode', id: 'c0', label: 'say "hi": now #1 | ok' })));
  expect(d.ok).toBe(true);
  expect(d.nodes[0].label).toBe('say hi : now #1 | ok');
});
it('refuses ops while the text has errors', () => {
  expect(applyGitGraphOp('gitGraph\n  checkout nope\n', { type: 'addNode', label: 'x', shape: 'filledCircle' })).toEqual({ error: MESSAGES.fixTextFirst });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/gitgraph`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Git graph**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit git graphs on the canvas and add the git graph template"
```

### Task 94: Release v0.12.0

Same steps as Task 81, with version `0.12.0` (`src/repo.test.ts`: `0.11.0` → `0.12.0`), README listing sequence and gitGraph as well, and the Part 10 v0.12.0 checklist. Commit message `chore: release v0.12.0`, tag `v0.12.0`.

- [x] **Step 1:** Make the changes and run the humanizer on `README.md`.
- [x] **Step 2: Run** the release commands from Task 81. Expected: PASS.
- [x] **Step 3:** Tick the boxes you checked by command; record the numbers in `handoff.md`.
- [x] **Step 4: Commit and tag** (only if allowed).

---

## Milestone D5: v0.13.0 Block, mindmap, journey and timeline (Tasks 95 to 103)

### Task 95: Block diagrams: parse and grid layout

**Files:** Create `src/diagrams/block/parse.ts`, `layout.ts`, `index.ts`, `parse.test.ts`, `layout.test.ts`, `tests/fixtures/diagrams/block.mmd`, `block.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "block", "nodes": 5, "edges": 4, "groups": 1 }`:

```
block
  columns 3
  web["Web"] api["API"] db[("Database")]
  space:3
  block:workers:3
    columns 2
    w1["Worker 1"] w2["Worker 2"]
  end
  web --> api
  api --> db
  api --> w1
  api --> w2
```

- [x] **Step 1: Write the failing tests**

```ts
const T = `block
  columns 3
  a["A"] b:2
  space c d
  block:grp:3
    columns 2
    e f
  end
  a --> d`;

// src/diagrams/block/parse.test.ts
it('reads items, spans, nested blocks and edges', () => {
  const d = parseBlock(T);
  expect(d).toMatchObject({ kind: 'block', ok: true });
  expect(d.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  expect(d.groups.map((g) => [g.id, g.parent])).toEqual([['grp', null]]);
  expect(d.nodes.find((n) => n.id === 'e')!.group).toBe('grp');
  expect(d.data!.block!.columns).toBe(3);
  expect(d.data!.block!.items.map((i) => [i.type, i.span])).toEqual([['node', 1], ['node', 2], ['space', 1], ['node', 1], ['node', 1], ['block', 3]]);
  expect(d.edges[0]).toMatchObject({ from: 'a', to: 'd', kind: 'arrow', variant: '-->' });
  const s = d.nodes[1].defSpan!;
  expect(T.split('\n')[s.line].slice(s.from, s.to)).toBe('b:2');
});
it('reads shapes and block arrows', () => {
  const d = parseBlock('block\n  x[("DB")] y<["Go"]>(right) z((("End")))');
  expect(d.nodes.map((n) => [n.id, n.shape, n.label])).toEqual([['x', 'cylinder', 'DB'], ['y', 'blockArrow', 'Go'], ['z', 'doubleCircle', 'End']]);
  expect(d.nodes[1].arrowDir).toBe('right');
});

// src/diagrams/block/layout.test.ts
it('fills rows of columns, spans cells and nests blocks', () => {
  const L = layoutBlock(parseBlock(T), testMeasure);
  expect(L.nodes.a.center).toEqual({ x: 40, y: 22 });
  expect(L.nodes.b).toMatchObject({ center: { x: 184, y: 22 }, width: 176 });
  expect(L.nodes.c.center).toEqual({ x: 136, y: 82 });
  expect(L.groups.grp.rect).toEqual({ x: 0, y: 120, width: 272, height: 68 });
  expect(L.nodes.e).toMatchObject({ center: { x: 70, y: 154 }, width: 116 });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/block`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe, Part 5.9 and Part 6.4.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read and lay out Mermaid block diagrams"
```

### Task 96: Block diagrams: visual edits and template

**Files:** Create `src/diagrams/block/ops.ts`, `ops.test.ts`, `public/templates/block.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'block', file: 'block.mmd', nodes: 5, svgText: 'Worker 1' }` and `{ kind: 'block', file: 'block.mmd', nodeId: 'db', newLabel: 'Store', canAdd: true, canDelete: true }`. Template title: `Block layout`.

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/block`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Block**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit block diagrams on the canvas and add the block template"
```

### Task 97: Mindmaps: parse and two-sided tree layout

**Files:** Create `src/diagrams/mindmap/parse.ts`, `layout.ts`, `index.ts`, `parse.test.ts`, `layout.test.ts`, `tests/fixtures/diagrams/mindmap.mmd`, `mindmap.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "mindmap", "nodes": 12, "edges": 11, "groups": 0 }`:

```
mindmap
  root((Gati-chitra))
    Edit
      Text panel
      Canvas
    Animate
      Pulse
      Traffic
      Build
    Export
      PNG
      SVG
      GIF and video
```

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/mindmap`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe, Part 5.10 and Part 6.5.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read and lay out Mermaid mindmaps"
```

### Task 98: Mindmaps: visual edits and template

**Files:** Create `src/diagrams/mindmap/ops.ts`, `ops.test.ts`, `public/templates/mindmap.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'mindmap', file: 'mindmap.mmd', nodes: 12, svgText: 'Animate' }` and `{ kind: 'mindmap', file: 'mindmap.mmd', nodeId: 'm5', newLabel: 'Glow', canAdd: true, canDelete: true }` (`m5` is `Pulse`: the fifth node without its own id). Template title: `Mindmap`.

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/mindmap`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Mindmap**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit mindmaps on the canvas and add the mindmap template"
```

### Task 99: User journeys: parse and layout

**Files:** Create `src/diagrams/journey/parse.ts`, `layout.ts`, `index.ts`, `parse.test.ts`, `layout.test.ts`, `tests/fixtures/diagrams/journey.mmd`, `journey.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "journey", "nodes": 10, "edges": 4, "groups": 0 }`:

```
journey
  title Ordering lunch
  section Choose
    Open the app: 4: Me
    Browse menus: 3: Me, Friend
  section Order
    Pay: 2: Me
    Track the courier: 3: Me
    Eat: 5: Me, Friend
```

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/journey`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe, Part 5.11 and Part 6.6.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read and lay out Mermaid user journeys"
```

### Task 100: User journeys: visual edits and template

**Files:** Create `src/diagrams/journey/ops.ts`, `ops.test.ts`, `public/templates/journey.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'journey', file: 'journey.mmd', nodes: 10, svgText: 'Browse menus' }` and `{ kind: 'journey', file: 'journey.mmd', nodeId: 't3', newLabel: 'Pay by phone', canAdd: true, canDelete: true }`. Template title: `User journey`.

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/journey`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Journey**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit user journeys on the canvas and add the journey template"
```

### Task 101: Timelines: parse and layout

**Files:** Create `src/diagrams/timeline/parse.ts`, `layout.ts`, `index.ts`, `parse.test.ts`, `layout.test.ts`, `tests/fixtures/diagrams/timeline.mmd`, `timeline.json`. Modify `src/diagrams/registry.ts`.

Fixture, expected `{ "kind": "timeline", "nodes": 11, "edges": 10, "groups": 0 }`:

```
timeline
  title Web history
  section Early web
    1991 : First website
    1993 : Mosaic browser
  section Social
    2004 : Facebook
    2005 : YouTube : Reddit
    2006 : Twitter
```

- [x] **Step 1: Write the failing tests**
- [x] **Step 2: Run** `npx vitest run src/diagrams/timeline`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe, Part 5.12 and Part 6.7.
- [x] **Step 4: Run** the commands for engine tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: read and lay out Mermaid timelines"
```

### Task 102: Timelines: visual edits and template

**Files:** Create `src/diagrams/timeline/ops.ts`, `ops.test.ts`, `public/templates/timeline.mmd`. Modify `index.ts`, `public/templates/index.json`, both e2e `CASES` tables.

e2e rows: `{ kind: 'timeline', file: 'timeline.mmd', nodes: 11, svgText: 'Mosaic browser' }` and `{ kind: 'timeline', file: 'timeline.mmd', nodeId: 'p5', newLabel: '2007', canAdd: true, canDelete: true }`. Template title: `Timeline`.

- [x] **Step 1: Write the failing tests**

```ts
// src/diagrams/timeline/ops.test.ts
const B = 'timeline\n  2004 : Facebook : Google\n  2005 : YouTube\n';
const text = (r: ReturnType<typeof applyTimelineOp>) => ('text' in r ? r.text : r.error);
it('adds periods and renames periods and events', () => {
  expect(applyTimelineOp(B, { type: 'addNode', label: '2006', shape: 'round' })).toEqual({ text: B + '  2006\n', createdId: 'p3' });
  expect(text(applyTimelineOp(B, { type: 'renameNode', id: 'p1', label: '2003' }))).toBe(B.replace('2004', '2003'));
  expect(text(applyTimelineOp(B, { type: 'renameNode', id: 'p1e2', label: 'Gmail' }))).toBe(B.replace('Google', 'Gmail'));
});
it('deletes events and periods', () => {
  expect(text(applyTimelineOp(B, { type: 'deleteNode', id: 'p1e1' }))).toBe(B.replace('2004 : Facebook : Google', '2004 : Google'));
  expect(text(applyTimelineOp(B, { type: 'deleteNode', id: 'p2' }))).toBe('timeline\n  2004 : Facebook : Google\n');
});
it('rename with awkward characters keeps the diagram valid', () => {
  const d = parseTimeline(text(applyTimelineOp(B, { type: 'renameNode', id: 'p1', label: 'say "hi": now #1 | ok' })));
  expect(d.ok).toBe(true);
  expect(d.nodes.length).toBe(parseTimeline(B).nodes.length);
  expect(d.nodes[0].label).toBe('say hi now #1 | ok');
});
it('refuses ops while the text has errors', () => {
  expect(guardOk({ ...parseTimeline(B), ok: false })).toEqual({ error: MESSAGES.fixTextFirst });
});
```

- [x] **Step 2: Run** `npx vitest run src/diagrams/timeline`. Expected: FAIL.
- [x] **Step 3: Implement** per the recipe and Part 8.2 **Timeline**.
- [x] **Step 4: Run** the commands for edit tasks. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: edit timelines on the canvas and add the timeline template"
```

### Task 103: Release v0.13.0

Same steps as Task 81, with version `0.13.0` (`src/repo.test.ts`: `0.12.0` → `0.13.0`), the Part 10 v0.13.0 checklist, and:

- `README.md`: the "Diagram types" section lists all thirteen supported types with their header keywords, and one sentence on what is not supported and why (Part 1.2). Run the humanizer on it.
- Check that the Help dialog lists all thirteen types (Task 73 wrote the list; nothing to add if it is complete).
- `handoff.md`: the full state after D5.

Commit message `chore: release v0.13.0`, tag `v0.13.0`.

- [ ] **Step 1:** Make the changes.
- [ ] **Step 2: Run** the release commands from Task 81. Expected: PASS.
- [ ] **Step 3:** Tick the boxes you checked by command; record the numbers in `handoff.md`.
- [ ] **Step 4: Commit and tag** (only if allowed).

---

## Part 10. Release checklists

Tick a box only after you have checked it. "By hand" boxes are for the owner, in a real browser.

### v0.9.0 (D1)

- [x] `npm test`, `npm run lint`, `npm run build`, `npm run check:dist`, `npm run test:e2e` all pass.
- [x] Initial JS ≤ 150 KB gzip (write the number in `handoff.md`).
- [ ] By hand: every template in the gallery still opens and animates exactly as before, in light and dark mode.
- [ ] By hand: typing `pie title Pets` shows "Pie chart is not supported yet…" on line 1, and the last picture stays.

### v0.10.0 (D2), v0.11.0 (D3), v0.12.0 (D4), v0.13.0 (D5)

For each type the milestone adds:

- [x] The automated checks above pass; the new engine chunks are listed by `check:dist`, each ≤ 80 KB gzip.
- [ ] By hand: the type's template opens from the gallery and draws.
- [ ] By hand: all five animation styles (pulse, traffic, dash, build, typewriter) run on it; Pause stops and Play continues from the same frame.
- [ ] By hand: switching three themes (one light, one dark, one with a gradient) and the four shading modes recolours nodes, edges and decorations; nothing becomes unreadable.
- [ ] By hand: PNG, SVG and GIF exports match the canvas (no grid, no missing decorations).
- [ ] By hand: present mode steps through the diagram in a sensible order.
- [ ] By hand: double-click rename, Delete, Add node and (where the type allows) drag and connect all change the text, and Undo restores it.
- [ ] By hand: on a phone, the Diagram tab shows the type and pinch zoom works.
- [ ] By hand, deployed site: load the site, go offline, reload, and open the new type for the first time from a template; it draws (the chunk was precached).

---

## Part 11. Troubleshooting

| Symptom                                                          | Likely cause                                                                                               | Fix                                                                                                                                                                                                                             |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check:dist` says the initial JS is over 150 KB                | an engine file is imported statically somewhere                                                            | search for `from './<kind>/` and `from '../diagrams/<kind>/` outside `src/diagrams/registry.ts` and the engine's own tests; replace with the registry                                                                     |
| A new lazy chunk is over 80 KB                                   | the engine imports a large app module                                                                      | engines may import only from `src/core`, `src/diagrams/common`, `src/mermaid/props.ts`, `src/mermaid/styles.ts`, `src/mermaid/positions.ts`, `src/mermaid/format.ts`, `src/layout` and `src/render/prepared.ts` |
| `src/repo.test.ts` fails with "has N lines (expected < 300)"   | a file grew too big                                                                                        | split by responsibility (patterns, helpers) into a new file in the same folder and note it in `DECISIONS.md`                                                                                                                  |
| `tsc` errors after Task 69 in many files                       | a `switch` over `ShapeKind` or a `Record<ShapeKind, …>` lacks the new shapes                        | handle each one as Part 7.3 says; use `Record<FlowShapeKind, …>` for flowchart-only tables                                                                                                                                   |
| A test fails with `expected -0 to equal 0`                     | `toEqual` treats `-0` and `0` as different                                                           | compute the value so it is `0` (for example add `+ 0`, or build the point from `tip` directly); do not change the test's numbers                                                                                          |
| A `labelSpan` points a few characters too early                | the span was taken from the trimmed line                                                                   | add `leadOf(raw)` (Part 5.0 `spanAt` does this)                                                                                                                                                                             |
| A regex from Part 5 never matches                                | it was copied with `\|` from a Markdown table                                                             | Part 5 uses bullet lists; copy from there, character for character                                                                                                                                                              |
| An e2e test times out waiting for `ok: true` after `setText` | the engine chunk loads asynchronously                                                                      | wait with `expect.poll(...)`, as `tests/e2e/diagrams.spec.ts` does, never with a fixed `waitForTimeout`                                                                                                                   |
| An existing flowchart test fails                                 | a shared code path changed behaviour                                                                       | revert to the old path for flowcharts; new behaviour must be behind an optional field or `doc.kind`                                                                                                                           |
| Drag does nothing on a new type                                  | the engine's `caps.move` is false (by design for sequence, git graph, block, mindmap, journey, timeline) | not a bug; check Part 8.1                                                                                                                                                                                                       |
