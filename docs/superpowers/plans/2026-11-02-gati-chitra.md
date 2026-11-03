# Gati-chitra — Animated Mermaid Flowchart Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. If your harness has no such skills, follow Part 0 of this document instead; it contains the same rules.

**Goal:** Build a static website, hostable on GitHub Pages, where a person pastes or types a Mermaid flowchart, edits it by dragging nodes and drawing arrows (kept in two-way sync with the text), watches the connections animate, and saves the result as PNG, SVG, GIF, or MP4/WebM. The page uses the logo, colours, font, header and footer of the author's diff-checker site (https://u77w41.github.io/diff-checker/), so the author's tools look like one family.

**Architecture:** Mermaid text is the source of truth. A hand-written parser reads a defined flowchart subset into a graph, a layered-graph library lays it out, and one canvas drawing function renders the live preview, the PNG and every animation frame. A matching writer produces the SVG file from the same geometry. Visual edits are applied as small patches to the text, never as a full rewrite, so lines the parser does not understand are never lost. Everything runs in the browser, so the site is static.

**Tech Stack:** TypeScript (strict), Vite, Vitest, Playwright. Runtime libraries: `@dagrejs/dagre` (layout), `gifenc` (GIF), `mediabunny` (MP4 and WebM, loaded on demand), `@fontsource/lato` (the page font, bundled so nothing loads from a CDN). No UI framework: plain DOM and Canvas 2D.

**Standalone:** this file does not depend on any other document or link. Everything the implementer needs is in it.

**What this document contains:** exact constants, type definitions, a precise grammar, algorithms in numbered steps, test cases as input and expected output, and a task list. It does not contain the implementation. Begin with the "Start here" section below (Task 0).

## Start here: Task 0, agent files, skills and `.gitignore`

**How to run this plan with a CLI agent (for the person starting it).** This file is enough on its own.

1. Put this `plan.md` file in the root of your cloned `gati-chitra` repository folder (which already has `README.md` and your custom `SECURITY.md`) and start your agent in that folder.

2. First session, prompt: `Read plan.md. Do only the "Start here" section (Task 0). Copy this file with cp, do not retype it. Leave existing README.md and SECURITY.md untouched. Then stop and tell me to restart.`

3. Restart the agent in the same folder. The agent files and the skills are read when a session starts. (In Gemini CLI, `/memory reload` also picks up `GEMINI.md`, but the skills need a new session.)

4. Second session, prompt: `Read GEMINI.md (or CLAUDE.md, or AGENTS.md) and continue the build plan from Task 1. One task at a time, one commit per task.`

5. Every later session, the same prompt. The agent finds its place with `git log --oneline`: each task is one commit with the message the plan gives, so it continues with the first task that has no commit.

6. If a command asks for a confirmation, a login or a permission, the agent stops and asks you to run it.

Do this before Task 1. It takes a few minutes and it is what keeps every later session on the same process, whichever AI tool is used.

**Why:** AI coding tools each read their own instruction file. Claude Code reads `CLAUDE.md`, Gemini CLI reads `GEMINI.md`, and Codex, Cursor and many others read `AGENTS.md`. Create all three, because different people (or different sessions) may use different tools. `AGENTS.md` holds the shared rules; the other two import it and add the install steps for their own tool. The files tell the agent two things: install and use the **superpowers** skills (planning and writing code) and the **humanizer** skill (writing that people read), and keep the repository clean with a `.gitignore`.

**Which file is yours:** Claude Code uses `CLAUDE.md`, Gemini CLI uses `GEMINI.md`, any other tool uses `AGENTS.md`. Follow the install commands in the file for your tool.

**Files:**

* Create: `docs/superpowers/plans/2026-11-02-gati-chitra.md` (a copy of this document, so the agent files can point to it), `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`

* Preserve existing: `README.md`, `SECURITY.md` (never overwrite or delete the author's custom `SECURITY.md`)

* Test: the shell checks in Step 5. A Vitest test for these files is added in Task 1, when Vitest exists.

* [x] **Step 1: Prepare the repository.** Work inside the existing `gati-chitra` repository folder (run `git init` only if `.git/` does not exist yet; keep the existing `README.md` and custom `SECURITY.md` intact). Create `docs/superpowers/plans/` and copy `plan.md` to `docs/superpowers/plans/2026-11-02-gati-chitra.md` with `cp plan.md docs/superpowers/plans/2026-11-02-gati-chitra.md`, then remove the root `plan.md` (`rm -f plan.md`) so there is a single canonical plan file for tracking checkboxes. (That folder is where the superpowers skills keep plans, so they will find it.)

* [x] **Step 2: Create `.gitignore`** with exactly this content:

```
# dependencies
node_modules/

# build output
dist/
dist-ssr/
*.tsbuildinfo

# test output
coverage/
playwright-report/
test-results/
blob-report/

# environment: .env holds only public defaults and is committed; local overrides are not
.env.local
.env.*.local

# logs
*.log
npm-debug.log*

# system and editor files
.DS_Store
Thumbs.db
.idea/
.vscode/
*.swp

# local state of AI coding tools (the shared instructions live in AGENTS.md, CLAUDE.md and GEMINI.md)
.claude/settings.local.json
CLAUDE.local.md
.gemini/settings.local.json
GEMINI.local.md
.agents/
.worktrees/
worktrees/

```

* [x] **Step 3: Create the three agent files** with exactly the content below. They are written in Markdown; the four-backtick fences here only keep the inner formatting intact, so leave the fences out of the files.

`AGENTS.md`:

```
# Agent instructions for Gati-chitra

These instructions apply to every AI coding agent that works in this repository. `CLAUDE.md` and `GEMINI.md` import this file and add the install steps for their own tool. Keep the three files in step: when a rule changes here, check the other two.

## 1. Read first

- The build plan is `docs/superpowers/plans/2026-11-02-gati-chitra.md`. Read its "Start here" section and Part 0 before you change anything.
- Work through the plan's tasks in order, one task at a time, with one commit per task and the commit message the plan gives.
- When the plan leaves something open, choose the simplest option and add one line to `DECISIONS.md` in the form `Task N: chose X because Y`.
- To find where you are: run `git log --oneline`, read `DECISIONS.md`, and continue with the first task in the plan that has no commit yet. Tick the checkboxes in the plan copy as you finish steps.

## 2. Skills

Install both skills before you write any code or any document. Your tool's file (`CLAUDE.md` or `GEMINI.md`) has the exact commands, and section 6 below has the commands for other tools. Check that the skills are available, then use them as described here. If one cannot be installed (no network, or your tool has no skill support), say so in `DECISIONS.md` and follow Part 0 of the plan, which holds the same rules in short form. Do not skip the process silently.

### superpowers: for planning and for writing code

Use it every time you write or change code, and every time you write a plan, a spec or a design document.

- Before any new feature, behaviour change or new file: use `brainstorming`. The build plan already holds the design, so keep it short and settle only what the plan leaves open.
- To write a plan or spec: use `writing-plans`.
- To carry out a plan: use `executing-plans`, or `subagent-driven-development` if your tool can start sub-agents.
- For every feature and bug fix: use `test-driven-development`. Write the test, watch it fail, then write the code.
- For a bug, a failing test or any surprise: use `systematic-debugging` before you propose a fix.
- Before you say that work is done, fixed or passing: use `verification-before-completion`. Run the command and read its output first.
- Before merging: `requesting-code-review`. When you receive review comments: `receiving-code-review`.
- When a branch is finished: `finishing-a-development-branch`.

If a skill and the build plan disagree, the plan's Part 2 constants and the task's Interfaces block win (Part 0, rule 7). Add a line to `DECISIONS.md`.

### humanizer: for writing that people will read

Use it on every piece of prose you write or edit before you commit it: `README.md`, pages in `docs/`, wiki pages, `CONTRIBUTING.md`, release notes, changelog entries and pull request descriptions. (`SECURITY.md` already contains the author's custom security policy — preserve it as-is and do not overwrite it.)

1. Write the draft, with every fact, number and command correct first.
2. Run the skill on the file, for example by asking "Humanize the prose in README.md". In Claude Code the command is `/humanizer:humanizer`.
3. Read the result. Keep the meaning, and keep the voice plain and specific. If it changed a command, a number, a path, a version or a code block, restore the original.

Do not run it on code, tests, configuration files, generated files, the build plan itself, or text that must stay word for word (licences, standards, quoted error messages).

## 3. Writing rules

- Say what the thing does, in short concrete sentences. No filler, no hype, no emoji.
- Use the exact names, paths and commands from the build plan.
- Comments in code explain why, never what.

## 4. Commands

- `npm test`: unit tests.
- `npm run build`: type check and production build.
- `npm run check:dist`: checks the built site (icons, sizes, base path).
- `npm run test:e2e`: browser tests.

Run `npm test` after every task. Run the other three before you finish a task that changes the page.

## 5. Git hygiene

- `.gitignore` must exist from the first commit. It keeps out `node_modules/`, `dist/`, test output, local environment files (`.env.local`), editor and system files, and each tool's local state. Never commit secrets. `.env` holds only public defaults and is committed.
- If you add a new kind of generated or local file, add it to `.gitignore` in the same commit.
- The plan (`docs/superpowers/plans/`), `DECISIONS.md`, `README.md` and the existing custom `SECURITY.md` are committed.

## 6. Install commands for tools without their own file

- Codex (CLI): open `/plugins`, search for `superpowers`, choose Install Plugin. Codex reads this file directly.
- Cursor: `/add-plugin superpowers` in Agent chat. Cursor reads this file directly.
- Any tool, for humanizer: `npx skills add blader/humanizer --global` (use `--global` so the installer does not drop untracked files into the repository; add `--agent '*'` to install it for every tool the installer supports). Update later with `npx skills update humanizer`.
- Anything else: follow the project pages https://github.com/obra/superpowers and https://github.com/blader/humanizer.

```

`CLAUDE.md`:

```
# Claude Code instructions for Gati-chitra

@AGENTS.md

The line above imports the shared instructions. If your session does not show them, open `AGENTS.md` and read it before you do anything else.

## Install the skills in Claude Code

Run these once per machine, inside a Claude Code session, then start a new session so the skills load.

- superpowers: `/plugin install superpowers@claude-plugins-official`. Alternative: `/plugin marketplace add obra/superpowers-marketplace`, then `/plugin install superpowers@superpowers-marketplace`.
- humanizer: `/plugin marketplace add blader/humanizer`, then `/plugin install humanizer@humanizer` (this needs Claude Code 2.1.142 or later). Without the plugin system: `npx skills add blader/humanizer --global`.

Check: run `/plugin` and confirm both are listed, or ask "Which skills can you use?" and confirm that `brainstorming`, `writing-plans`, `test-driven-development` and `humanizer` appear.

## Using them here

- Start every code or planning task by naming the skill: "Use the superpowers brainstorming skill, then writing-plans."
- Before you commit any README, docs page or wiki page, run the humanizer: `/humanizer:humanizer` followed by the file path. Keep commands, numbers and code blocks exactly as written. Leave the existing custom `SECURITY.md` untouched.
- Keep this file short. Shared rules belong in `AGENTS.md`.

```

`GEMINI.md`:

```
# Gemini CLI instructions for Gati-chitra

@./AGENTS.md

The line above imports the shared instructions. Run `/memory show` to confirm that the content of `AGENTS.md` is loaded. If it is not, run `/memory reload` (needed when the files were created during this session), or open `AGENTS.md` and read it before you do anything else. Do not also list `AGENTS.md` in the `context.fileName` setting: this file already imports it, and it would load twice.

## Install the skills in Gemini CLI

Run these once per machine, in a terminal, then start a new Gemini CLI session.

- superpowers: `gemini extensions install https://github.com/obra/superpowers`. Update later with `gemini extensions update superpowers`.
- humanizer: `npx skills add blader/humanizer --global`. Add `--agent '*'` to install it for every tool the installer supports.

Check: ask "Which skills can you use?" and confirm that `brainstorming`, `writing-plans`, `test-driven-development` and `humanizer` appear.

## Using them here

- Start every code or planning task by naming the skill: "Use the superpowers brainstorming skill, then writing-plans."
- Before you commit any README, docs page or wiki page, ask for the humanizer: "Humanize the prose in README.md." Keep commands, numbers and code blocks exactly as written. Leave the existing custom `SECURITY.md` untouched.
- Keep this file short. Shared rules belong in `AGENTS.md`.

```

* [x] **Step 4: Install the two skills** in the tool you are running, with the commands in your tool's file, and check that they are available (each file says how). This is a one-time step per machine. If a command asks for a confirmation, a login or a permission you cannot give, stop and ask the person you are working with to run it. Install superpowers first. If a command fails because the tool or the project changed its install method, read the project's page (https://github.com/obra/superpowers, https://github.com/blader/humanizer), use the current method, and record it in `DECISIONS.md`.

* [x] **Step 5: Verify** (run these in the repository folder):

```
git check-ignore node_modules/x dist/x test-results/x .env.local .DS_Store .worktrees/x
# expected: all six paths are printed, one per line
git check-ignore .env docs/superpowers/plans/2026-11-02-gati-chitra.md AGENTS.md CLAUDE.md GEMINI.md SECURITY.md public/favicon.svg; echo $?
# expected: nothing printed, then 1 (none of these files is ignored)
head -3 CLAUDE.md GEMINI.md
# expected: CLAUDE.md shows its title and later the line @AGENTS.md; GEMINI.md shows its title and later the line @./AGENTS.md

```

* [x] **Step 6: Commit.** `git add -A && git commit -m "chore: agent instruction files and .gitignore"`

**From now on:** use the superpowers skills whenever you write code or a plan (the process in `AGENTS.md`), and run the humanizer on every README, docs page and wiki page before you commit it (leaving the existing custom `SECURITY.md` untouched). Task 23 repeats this for the README. The install commands above were checked against the projects' own pages and the Gemini CLI documentation on 2026-11-02; those pages are the place to look if a command stops working.

## Part 0. How to use this document (rules for the implementer)

 1. Do Task 0 first (the "Start here" section above): create the agent files and `.gitignore` and install the skills. Then read Parts 0 to 5 completely before writing any code, and start Task 1.

 2. Do one task at a time, in order. Do not start a task until the previous task's verification passes.

 3. For every task, follow its steps in order: write the tests first and watch them fail, implement, run the task's tests, run the whole suite, then commit with the given message.

 4. Copy names, file paths, constants, messages and regular expressions exactly as written. Never rename anything.

 5. Do not add features that are not described. If something is unspecified, choose the simplest behaviour and append one line to `DECISIONS.md` in the form `Task N: chose X because Y`.

 6. Leave no placeholders: no `TODO`, no stub functions, no commented-out code, no `any` (except in the one declaration file named in Task 1).

 7. If two instructions conflict, use this order: Part 2 (Global Constraints), then the task's Interfaces block, then the examples. Record the conflict in `DECISIONS.md`.

 8. Keep each source file under 300 lines. If a file grows past that, split it by responsibility and update imports.

 9. Pure logic (parser, text patches, layout math, geometry, animation, SVG writing, share encoding) must not touch the DOM, so it can be unit-tested in Node. Only `src/app` and the canvas and file-saving helpers may use browser APIs.

10. Line numbers in diagnostics are 1-based. Indexes into arrays are 0-based. Never mix them.

11. If you are a smaller model: write one function at a time, re-read its Interfaces block first, and run its tests right after. If a test fails twice for the same reason, re-read the algorithm steps and follow them literally, one by one. Do not guess.

12. The project is finished only when every box in Part 9 is ticked.

13. The pure-logic examples in this document (parser, text patches, layout sizes, geometry, view and export maths, animation, steps, history, share encoding, GIF delay unit) were checked against a reference implementation of the algorithms written here (that implementation is not part of this document). If one of those tests fails for you, your implementation is wrong, not the test: re-read the algorithm and follow it step by step. The drawing, SVG and browser tests describe behaviour that was specified but not executed, so if one of those looks wrong, apply Rule 7 and note it in `DECISIONS.md`. For Task 22 (logo, header, footer, colour scheme) the CSS and markup were rendered in a real browser and compared with the reference site, and the scheme-toggle table was checked, but its unit and browser tests were not run.

14. Use the skills named in `AGENTS.md`: the superpowers skills while you write code or plans, and the humanizer on every README, docs page and wiki page before you commit it (preserving the existing custom `SECURITY.md` untouched).

15. You do not need the whole document in view at once. Keep Part 0 and Part 2 in mind. For each task, read that task and the parts it names (Part 3 for the data model, Part 4 for the grammar). Find a task by searching for its heading, for example `### Task 7:`.

### Commands you will use

```
npm test              # unit tests (Vitest)
npm run build         # typecheck and production build
npm run test:e2e      # browser tests (Playwright, Chromium)

```

## Part 1. What the finished site does

Each feature has an ID. Tasks name the IDs they deliver.

| ID | Feature | Done when | 
| ----- | ----- | ----- | 
| F1 | Paste or type Mermaid flowchart text and see it drawn | The picture updates 150 ms after typing stops | 
| F2 | A defined subset of flowchart syntax (Part 4) | Every diagram in Appendix A parses as described | 
| F3 | Lines the parser does not understand are kept | Editing visually never removes or reorders such lines | 
| F4 | Automatic layout, with manual positions ("pins") | Moved nodes stay where they were dropped; others re-flow | 
| F5 | Drag-and-drop editing | Move, connect, add, rename, delete, change shape, change colours, change arrow style, reverse an arrow, clear pins, undo and redo | 
| F6 | Two-way sync with the text | Visual edits change only the intended lines; a text error keeps the last good picture and shows the error | 
| F7 | Animated connections | Styles `pulse`, `traffic`, `dash`, `off`; speed, density, glow, pause | 
| F8 | Themes | Four diagram themes (Daylight, Midnight, Lagoon, Ember) plus "Match page" (the default), which uses Daylight in the light page scheme and Midnight in the dark one | 
| F9 | Pan, zoom, fit | Wheel zoom, Space-drag pan, Fit button | 
| F10 | Present mode | Full-window, step-through highlighting | 
| F11 | Save as PNG | 1x, 2x or 3x; transparent or themed background; fit to content or 16:9 slide frame | 
| F12 | Save as SVG | A standalone `.svg` file that opens in a browser and in vector editors | 
| F13 | Save as GIF | Looping animated file | 
| F14 | Save as MP4 or WebM | Probes the browser; falls back to GIF with a message | 
| F15 | Save and open `.mmd` files; autosave | Reload restores the last diagram | 
| F16 | Share links and templates | A link carries the diagram; a gallery loads samples | 
| F17 | Works offline after loading | No network request after the page and its files have loaded | 
| F18 | Works under a GitHub Pages sub-path | All asset and template URLs respect Vite's `BASE_URL` | 
| F19 | Keyboard shortcuts | Table in Task 19 | 
| F20 | Accessibility basics and reduced motion | Labels, focus order, starts paused when the user prefers reduced motion | 
| F21 | Logo and favicon | The supplied logo is the favicon (SVG, ICO and Apple touch icon) and the header logo, and stays visible in light and dark | 
| F22 | The author's site look | Header, footer, colours, font and the light/dark switch match https://u77w41.github.io/diff-checker/, including the shared storage key for the scheme | 

**Not in scope:** AI generation, accounts, servers, collaboration, other Mermaid diagram types, editing subgraph membership visually (groups are drawn and laid out, but changed in the text), touch and phone editing.

## Part 2. Global Constraints (exact values)

Every task inherits this section. Task 2 creates `src/core/constants.ts` with exactly this content.

```
export const LIMITS = {
  maxNodes: 300,
  maxEdges: 600,
  maxTextChars: 20000,
  maxLabelChars: 200,
  maxGroupDepth: 4,
  undoDepth: 200,
} as const;

export const TIMING = { parseDebounceMs: 150, autosaveDebounceMs: 500 } as const;

export const STORAGE = {
  docKey: 'gati-chitra:v1:doc',
  settingsKey: 'gati-chitra:v1:settings',
} as const;

export const FONT_STACK_SANS =
  "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const LAYOUT = {
  fontSize: 16,
  lineHeight: 20,
  labelWrapWidth: 200,
  nodePadX: 18,
  nodePadY: 12,
  minNodeW: 72,
  minNodeH: 40,
  nodeSep: 40,
  rankSep: 64,
  edgeSep: 12,
  margin: 24,
  groupPad: 24,
  groupTitleH: 28,
  edgeLabelPadX: 8,
  edgeLabelH: 20,
  edgeLabelFontSize: 13,
  arrowSize: 10,
  edgeWidth: 2,
  edgeWidthThick: 4,
  dottedDash: [3, 5],
  hitTolerance: 6,
  handleRadius: 7,
  parallelOffset: 14,
  selfLoopSize: 28,
  diamondScale: 1.6,
  hexagonExtraW: 28,
  parallelogramExtraW: 28,
  cylinderExtraH: 18,
  circleExtra: 8,
  roundRadius: 12,
  rectRadius: 4,
  hexagonInset: 14,
  parallelogramSkew: 14,
} as const;

export const VIEW = { zoomMin: 0.1, zoomMax: 4, wheelSensitivity: 0.002, fitMargin: 48 } as const;

export const ANIM = {
  loopSecondsBase: 4,
  speedMin: 0.25,
  speedMax: 3,
  speedStep: 0.25,
  speedDefault: 1,
  densityMin: 1,
  densityMax: 10,
  densityDefault: 4,
  particleRadius: 4,
  spacingBase: 640,
  maxParticlesPerEdge: 12,
  maxParticlesTotal: 1500,
  particleFade: 0.1,
  dashPattern: [8, 8],
  dashCycles: 4,
  glowWindow: 0.12,
  glowBlur: 18,
  dimAlpha: 0.25,
  presentStepSeconds: 1.5,
} as const;

export const EXPORT = {
  margin: 32,
  pngScales: [1, 2, 3],
  pngMaxSide: 8192,
  pngMaxPixels: 40_000_000,
  slideWidth: 1280,
  slideHeight: 720,
  gifFps: [10, 20, 25],
  gifFpsDefault: 20,
  gifMaxFrames: 300,
  gifMaxPixels: 2_073_600,
  videoFps: 30,
  videoMaxSeconds: 30,
  videoLoopsDefault: 2,
  videoLoopsMax: 5,
  videoMaxPixels: 2_073_600,
  svgDecimals: 2,
} as const;

export const SHARE = { prefix: 'v1=', plainPrefix: 'v1p=', maxUrlChars: 8000 } as const;

export const MESSAGES = {
  notFlowchart: "Only flowchart diagrams are supported. Start with 'flowchart TD' or 'graph LR'.",
  tooManyNodes: 'Too many nodes (limit 300).',
  tooManyEdges: 'Too many arrows (limit 600).',
  textTooLong: 'The text is too long (limit 20000 characters).',
  groupTooDeep: 'Subgraph nesting is too deep (limit 4).',
  unknownLine: (n: number) => `Line ${n} is not understood and is kept as written.`,
  unclosedGroup: (id: string) => `Subgraph "${id}" is not closed with end.`,
  strayEnd: (n: number) => `Line ${n}: end without a matching subgraph.`,
  unknownNode: (id: string) => `Unknown node "${id}".`,
  unknownEdge: (i: number) => `Unknown arrow ${i}.`,
  nothingToExport: 'Nothing to export. Add a node first.',
  pngReduced: (scale: number) => `The image was too large, so it was saved at ${scale}x.`,
  gifReduced: 'The GIF was scaled down to fit the size limit.',
  videoUnsupported: 'This browser cannot encode video. Saved as GIF instead.',
  fixTextFirst: 'Fix the errors in the text first.',
  shareTooLong: 'This diagram is too large for a link. Save it as a .mmd file instead.',
  shareInvalid: 'The share link could not be read. Showing the sample diagram.',
  storageUnavailable: 'Browser storage is unavailable, so autosave is off.',
  groupsInText: 'Groups are edited in the text.',
  linkCopied: 'Link copied.',
  nothingToPresent: 'Nothing to present. Add a node first.',
  exportCancelled: 'Export cancelled.',
  videoFailed: (m: string) => `Video export failed: ${m}`,
} as const;

// The page (not the diagram) uses Lato; the diagram keeps FONT_STACK_SANS so measurements and exports never depend on a web font.
export const FONT_STACK_UI =
  '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", "Droid Sans", "Helvetica Neue", Arial, sans-serif';

export const SCHEME = {
  storageKey: 'StackColorScheme', // the key the author's other sites use, so one choice applies to all of them
  lightThemeColor: '#f5f5fa',
  darkThemeColor: '#303030',
} as const;

export const BRAND = {
  name: 'Gati-chitra',
  owner: 'Ujjwal Chowdhury',
  startYear: 2026,
  hireUrl: 'https://u77w41.github.io/resume/',
  supportUrl: 'https://u77w41.github.io/support-my-work/',
  tools: [
    {
      id: 'diff',
      name: 'Diff Checker',
      description: 'Fast, browser-based diff tool for text files, source code, and Jupyter notebooks.',
      url: 'https://u77w41.github.io/diff-checker/',
    },
    {
      id: 'anurup',
      name: 'ANURUP',
      description: 'Privacy-first photo & PDF tools for online forms',
      url: 'https://u77w41.github.io/anurup/',
    },
  ],
} as const;

```

**Other fixed rules**

* Browsers: current Chrome, Edge, Firefox and Safari on desktop.

* Coordinates: pixels in "world space". Origin top-left, y grows downward.

* Text output uses `\n` line endings and always ends with one trailing newline.

* Position comments use exactly this syntax, one per line: `%% studio:pos <id> <x> <y>` with integers, preceded once by the marker line `%% studio:layout v1`.

* Node ids that the app creates look like `n1`, `n2`, `n3`: `n` plus (the highest existing `n<number>` suffix plus one).

* Dependencies: `@dagrejs/dagre`, `gifenc`, `mediabunny`, `@fontsource/lato`. Do not add others. Do not use CDNs. Make no network request after load.

* Node 22 or later for tooling.

**Visual identity (the same look as the author's diff-checker site)**

The site reuses the look of https://u77w41.github.io/diff-checker/ so that the author's tools feel like one family: the same colours, the same font, the same header and footer, the same light and dark switch, and the same storage key for the choice of scheme. The values below were read from that site's published files.

* **Colours:** `src/app/tokens.css` (below, exact content). Every stylesheet takes its colours from these variables. No colour value is written anywhere else, except inside the diagram themes (Task 10) and the logo files (Task 22).

* **Font:** Lato, weights 400 and 700, bundled through the npm package `@fontsource/lato`, so nothing loads from a CDN. The page uses it. Diagram text keeps `FONT_STACK_SANS`, so layout measurements and exported files never depend on a web font.

* **Shapes:** cards have a 10 px radius, controls 8 px; the header is at least 72 px high; round icon buttons are 40 px.

* **Scheme:** the page follows the system light or dark setting until the user presses the toggle. The choice is saved in `localStorage` under `SCHEME.storageKey` (`StackColorScheme`) as `light`, `dark` or `auto`, exactly as on the author's other sites, so one choice applies to all of them (they share the host `u77w41.github.io`).

* **Logo and favicon:** the supplied SVG, see Task 22.

```
:root {
  --body-background: #f5f5fa;
  --card-background: #ffffff;
  --card-background-muted: #f7f7fb;
  --text-main: #111418;
  --text-body: #4f5660;
  --text-muted: #6b7079;
  --border: #e3e4ec;
  --border-strong: #cfd1dc;
  --accent: #34495e;
  --accent-darker: #2c3e50;
  --accent-text: #ffffff;
  --focus-ring: #3b82f6;
  --danger: #b4232c;
  --success: #1f7a3a;
  --shadow-l1: 0 4px 8px #0000000a, 0 0 2px #0000000f, 0 0 1px #0000000a;
  --shadow-l2: 0 10px 20px #0000000a, 0 2px 6px #0000000a, 0 0 1px #0000000a;
  --font-sans: "Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", "Droid Sans", "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  --radius-card: 10px;
  --radius-control: 8px;
  --radius-tag: 4px;
  --font-size-xs: .8125rem;
  --font-size-sm: .875rem;
  --container: 960px;
  --container-wide: 1440px;
  --gutter: 16px;
  color-scheme: light;
}

:root[data-scheme="dark"] {
  --body-background: #303030;
  --card-background: #424242;
  --card-background-muted: #3a3a3a;
  --text-main: #ffffffeb;
  --text-body: #ffffffbf;
  --text-muted: #ffffff99;
  --border: #ffffff1f;
  --border-strong: #ffffff38;
  --accent: #ecf0f1;
  --accent-darker: #bdc3c7;
  --accent-text: #111418;
  --focus-ring: #8ab4ff;
  --danger: #ff9a9f;
  --success: #8fe0a6;
  --shadow-l1: 0 4px 8px #0000002e, 0 0 2px #0003;
  --shadow-l2: 0 10px 20px #00000038, 0 2px 6px #0003;
  color-scheme: dark;
}

```

## Part 3. Data model (type definitions)

Task 2 creates `src/core/types.ts` with exactly these definitions. This is type notation: copy it, do not reinterpret it.

```
export type Direction = 'TB' | 'BT' | 'LR' | 'RL'; // "TD" in the text is read as 'TB'
export type ShapeKind =
  | 'rect' | 'round' | 'stadium' | 'circle' | 'diamond'
  | 'hexagon' | 'parallelogram' | 'parallelogramAlt' | 'cylinder' | 'subroutine';
export type EdgeKind =
  | 'arrow' | 'open' | 'dottedArrow' | 'dotted' | 'thickArrow'
  | 'thick' | 'circleEnd' | 'crossEnd' | 'bidirectional';
export type StyleMap = Record<string, string>; // CSS-like, e.g. { fill: '#f9f', 'stroke-width': '2px' }

export interface Point { x: number; y: number }
export interface Rect { x: number; y: number; width: number; height: number }

export interface GraphNode {
  id: string; label: string; shape: ShapeKind; classNames: string[];
  style: StyleMap; group: string | null;
  line: number; // 0-based index of the line where the node is first referenced
}
export interface GraphEdge {
  id: string;    // `e${index}`
  index: number; // 0-based order of creation; matches linkStyle numbers
  from: string; to: string; kind: EdgeKind; label: string; style: StyleMap;
  line: number;  // 0-based index of the line that defines the edge
}
export interface GraphGroup {
  id: string; title: string; parent: string | null; direction: Direction | null;
  line: number; // 0-based index of the `subgraph` line
}
export type LineKind =
  | 'frontmatter' | 'directive' | 'header' | 'blank' | 'comment' | 'pos' | 'statement'
  | 'subgraph' | 'end' | 'direction' | 'classDef' | 'class' | 'style' | 'linkStyle' | 'unknown';
export interface SourceLine {
  index: number; text: string; kind: LineKind;
  nodeIds: string[];     // nodes referenced on this line, in order, without duplicates
  edgeIndexes: number[]; // edges created on this line, in order
}
export interface Diagnostic { line: number; severity: 'error' | 'warning'; message: string } // line is 1-based
export interface ParsedDoc {
  direction: Direction;
  nodes: GraphNode[]; edges: GraphEdge[]; groups: GraphGroup[];
  classDefs: Record<string, StyleMap>;
  pins: Record<string, Point>;
  lines: SourceLine[]; diagnostics: Diagnostic[];
  ok: boolean; // true when there is no diagnostic with severity 'error'
}

export interface NodeBox { id: string; center: Point; width: number; height: number; lines: string[] }
export interface GroupBox { id: string; rect: Rect; title: string; depth: number } // depth 0 = outermost
export interface EdgePath {
  id: string; kind: 'straight' | 'quad' | 'loop';
  from: Point; to: Point; control: Point | null; // control is null only for 'straight'
  labelPoint: Point; length: number;
}
export interface SceneLayout {
  nodes: Record<string, NodeBox>; groups: Record<string, GroupBox>;
  edges: Record<string, EdgePath>; bounds: Rect;
}
export interface Scene { doc: ParsedDoc; layout: SceneLayout }

export type ThemeId = 'daylight' | 'midnight' | 'lagoon' | 'ember';
export type ThemeChoice = ThemeId | 'auto'; // 'auto' ("Match page") is Daylight in the light page scheme and Midnight in the dark one
export type SchemePref = 'light' | 'dark' | 'auto'; // the saved choice of page colour scheme
export interface Theme {
  id: ThemeId; name: string; background: string; backgroundGradient: [string, string] | null;
  nodeFill: string; nodeStroke: string; nodeText: string;
  edge: string; edgeLabelBg: string; edgeLabelText: string;
  groupFill: string; groupStroke: string; groupTitle: string;
  particle: string; glow: string; selection: string; glowDefault: boolean;
}

export type AnimStyle = 'pulse' | 'traffic' | 'dash' | 'off';
export interface AnimSettings { style: AnimStyle; speed: number; density: number; glow: boolean }
export interface Particle { edgeId: string; u: number; alpha: number } // u: 0 at the start of the arrow, 1 at its head
export interface FrameState {
  particles: Particle[];
  dashOffset: number | null;         // a number only for style 'dash'; null otherwise
  nodeGlow: Record<string, number>;  // node id -> 0..1; absent means 0
}

export interface ViewState { zoom: number; panX: number; panY: number }
export interface Focus { nodes: string[]; edges: string[] }
export interface Selection { kind: 'node' | 'edge' | 'group'; id: string }
export interface DrawOptions {
  transparent: boolean; selection: Selection | null; handleNodeId: string | null;
  connectPreview: { from: Point; to: Point } | null; focus: Focus | null; showGlow: boolean;
}

export type ExportMode = 'content' | 'slide';
export interface ExportFrame { world: Rect; pixelWidth: number; pixelHeight: number; zoom: number }

export type TextOp =
  | { type: 'addNode'; label: string; shape: ShapeKind; pin?: Point }
  | { type: 'addEdge'; from: string; to: string; kind?: EdgeKind; label?: string }
  | { type: 'deleteNode'; id: string }
  | { type: 'deleteEdge'; index: number }
  | { type: 'renameNode'; id: string; label: string }
  | { type: 'renameEdge'; index: number; label: string }
  | { type: 'renameGroup'; id: string; title: string }
  | { type: 'setShape'; id: string; shape: ShapeKind }
  | { type: 'setEdgeKind'; index: number; kind: EdgeKind }
  | { type: 'reverseEdge'; index: number }
  | { type: 'setNodeStyle'; id: string; style: StyleMap }
  | { type: 'setPin'; id: string; x: number; y: number }
  | { type: 'clearPins' }
  | { type: 'setDirection'; direction: Direction };
export type TextOpResult = { text: string; createdId?: string } | { error: string };

```

## Part 4. The Mermaid subset (exact grammar)

The parser never throws. Every line of the input becomes one `SourceLine` with a `LineKind`. Anything the parser cannot read becomes kind `'unknown'`, is kept as written, and adds a warning.

### 4.1 Header

The first line that is not blank, not a comment, not a directive and not inside front matter must match:

`/^\s*(flowchart|graph)(?:\s+(TB|TD|BT|RL|LR))?\s*;?\s*$/`

The direction is the second capture, with `TD` mapped to `TB`, and `TB` when absent. If the line does not match, add the error `MESSAGES.notFlowchart` on that line, classify every later line as `'unknown'`, and return `ok: false`.

### 4.2 Node references

A node reference is: an id, then an optional shape with label, then an optional class shorthand.

* Id: `/[A-Za-z0-9_]+/`.

* Shape: look at the text right after the id and try these opening tokens in this order. The first that matches wins.

| Open | Close | ShapeKind | 
| ----- | ----- | ----- | 
| `[[` | `]]` | subroutine | 
| `[(` | `)]` | cylinder | 
| `[/` | `/]` | parallelogram | 
| `[\` | `\]` | parallelogramAlt | 
| `([` | `])` | stadium | 
| `((` | `))` | circle | 
| `{{` | `}}` | hexagon | 
| `[` | `]` | rect | 
| `(` | `)` | round | 
| `{` | `}` | diamond | 

* Label: if the next character after the opening token is `"`, the label is everything up to the next `"`, and the close token must follow it. Otherwise the label is everything up to the first occurrence of the close token. If the close token is missing, the reference is invalid.

* Label cleanup: trim; replace `<br>`, `<br/>` and `<br />` (any case) with `\n`; replace `#quot;` with `"`; cut to `LIMITS.maxLabelChars` characters. An empty label means "use the id".

* Class shorthand: `:::name` right after the reference sets one class name (`/:::([A-Za-z0-9_]+)/`).

### 4.3 Edge operators

Try these patterns, in this order, at the current position (after skipping spaces). The first match decides the kind.

| Order | Pattern | EdgeKind | Example | 
| ----- | ----- | ----- | ----- | 
| 1 | `/^<-{2,}>/` | bidirectional | `<-->` | 
| 2 | `/^-{2,}o(?=\s)/` | circleEnd | `--o` | 
| 3 | `/^-{2,}x(?=\s)/` | crossEnd | `--x` | 
| 4 | `/^-\.+->/` | dottedArrow | `-.->` | 
| 5 | `/^-\.+-/` | dotted | `-.-` | 
| 6 | `/^={2,}>/` | thickArrow | `==>` | 
| 7 | `/^={3,}/` | thick | `===` | 
| 8 | `/^-{2,}>/` | arrow | `-->` | 
| 9 | `/^-{3,}/` | open | `---` | 

**Edge text, form 1 (pipes):** right after any operator, skip spaces; if the next character is `\|`, the label is everything up to the next `\|` (trimmed). Example: `A -->|yes| B`.

**Edge text, form 2 (inline):** these openers are tried before the table above.

| Opener | Closers, tried in this order at each candidate position | 
| ----- | ----- | 
| `/^--(?=\s)/` | `/^-{2,}>/` arrow, then `/^-{3,}/` open | 
| `/^-\.(?=\s)/` | `/^\.+->/` dottedArrow, then `/^\.+-/` dotted | 
| `/^==(?=\s)/` | `/^={2,}>/` thickArrow, then `/^={3,}/` thick | 

After the opener, scan forward through the rest of the line. A position is a candidate if it is preceded by whitespace and a closer matches there. The first candidate wins. The label is the text between the opener and that position, trimmed. Examples: `A -- yes --> B`, `A -. maybe .-> B`, `A == big ==> B`.

### 4.4 Statements

```
statement := nodegroup ( edge nodegroup )* ';'?
nodegroup := noderef ( '&' noderef )*

```

Spaces are optional around `&` and around edges. A statement with one nodegroup and no edge is valid (it declares nodes). A statement that ends with an edge, or has two edges in a row, or contains text the grammar cannot place, is invalid: the whole line becomes `'unknown'`.

Edges are created between every node of one nodegroup and every node of the next, in the order (left node, right node). `A & B --> C & D` creates four edges: A-C, A-D, B-C, B-D.

### 4.5 Nodes, repeated definitions and groups

* The first reference creates the node (label defaults to the id, shape defaults to `rect`).

* Later references that carry a shape or label replace the earlier shape and label ("last definition wins"). A later reference without a shape or label changes nothing.

* A node belongs to the innermost group that is open when the node is first referenced inside a group. A node first referenced outside every group stays outside.

### 4.6 Groups (subgraphs)

* `subgraph <id>` creates a group with that id and title.

* `subgraph <id> [<title>]` uses the text in brackets (quotes around it are removed) as the title.

* `subgraph "<title>"` creates the id `group<k>` (k = number of groups created so far plus one) and the title.

* `subgraph <anything else>` uses the rest of the line (trimmed) as the title; the id is the same text with every character outside `[A-Za-z0-9_]` replaced by `_`.

* `end` alone on a line (spaces and one trailing `;` allowed) closes the innermost open group.

* `direction XX` inside a group (`TB`, `TD`, `BT`, `RL`, `LR`) stores the group's direction. The layout ignores it.

* Groups may nest to `LIMITS.maxGroupDepth`. Deeper groups are an error: `MESSAGES.groupTooDeep`, reported once on the line where the limit is first crossed.

### 4.7 Classes and styles

| Line | Meaning | 
| ----- | ----- | 
| `classDef a,b fill:#f9f,stroke:#333` | define classes `a` and `b` with that style | 
| `class n1,n2 a` | add class `a` to nodes `n1` and `n2` | 
| `style n1 fill:#f9f` | style one node | 
| `linkStyle 0 stroke:#f00` or `linkStyle 0,2 stroke:#f00` or `linkStyle default stroke:#f00` | style edges by index, or all edges | 
| `A[Text]:::a` | class shorthand | 

Style strings split on commas that are followed by a key and a colon (`/,(?=\s*[A-Za-z-]+\s*:)/`). Each part is split at its first colon; both sides are trimmed; a trailing `;` is removed. Keys the renderers use: `fill`, `stroke`, `stroke-width` (a number with optional `px`), `color`, `stroke-dasharray`. Other keys are stored and ignored.

Precedence for a node: class styles in the order the classes were added, then the `style` line. For an edge: `linkStyle default`, then `linkStyle <index>`. Assignments in `class`, `style` and `linkStyle` lines are applied after all lines have been read, so they may appear before the nodes they name; names that do not exist are ignored.

### 4.8 Comments, directives, front matter, positions

* A line starting with `%%{` is kind `'directive'`.

* A line matching `/^\s*%%\s*studio:pos\s+(\S+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*$/` is kind `'pos'` and sets `pins[id] = {x, y}`.

* Any other line starting with `%%` is kind `'comment'`. (The marker `%% studio:layout v1` is a comment.)

* If the first non-blank line is `---`, every line up to and including the next `---` is kind `'frontmatter'`. Without a closing `---`, treat the opening line as unknown.

### 4.9 Limits

Reading stops adding nodes beyond `LIMITS.maxNodes` and edges beyond `LIMITS.maxEdges`, and adds the errors `MESSAGES.tooManyNodes` or `MESSAGES.tooManyEdges` (once each, on the line where the limit was crossed). Text longer than `LIMITS.maxTextChars` returns immediately with the error `MESSAGES.textTooLong` on line 1 and an empty graph.

## Part 5. File structure and dependency rule

```
src/
  core/        constants.ts  types.ts
  mermaid/     tokens.ts  styles.ts  parse.ts  positions.ts  ids.ts  ops.ts
  layout/      measure.ts  layout.ts  geometry.ts  scene.ts
  render/      themes.ts  draw.ts  svg.ts  frame.ts
  anim/        hash.ts  anim.ts  steps.ts
  editor/      view.ts  history.ts  controller.ts
  export/      filename.ts  download.ts  png.ts  draw-frame.ts  gif.ts  video.ts
  share/       share.ts  templates.ts
  app/         main.ts  state.ts  ui.ts  storage.ts  sample.ts  properties.ts
               export-panel.ts  gallery.ts  present.ts  shortcuts.ts
               scheme.ts  chrome.ts  icons.ts  tokens.css  chrome.css  style.css
  types/       gifenc.d.ts  (and dagre.d.ts only if needed)
  vite-env.d.ts  sanity.test.ts  repo.test.ts
public/             favicon.svg  favicon.ico  apple-touch-icon.png  theme-init.js
public/templates/   index.json  *.mmd
tests/support/      recording-context.ts  measure.ts  corpus.ts  parse-gif.ts
tests/e2e/          *.spec.ts
scripts/            check-dist.mjs  make-icons.mjs
.github/workflows/  deploy.yml
docs/superpowers/plans/  2026-11-02-animated-mermaid-flowchart-studio.md
AGENTS.md  CLAUDE.md  GEMINI.md  .gitignore  DECISIONS.md  README.md  SECURITY.md  .env

```

Tests for pure modules sit next to them as `*.test.ts`.

**Dependency rule (imports point one way only):** `core` ← `mermaid` ← `layout` ← `render` and `anim` ← `editor`, `export`, `share` ← `app`. A lower layer never imports a higher one. `mermaid`, `layout`, `render/svg.ts`, `render/frame.ts`, `anim`, `export/filename.ts` and `share` encode/decode must not touch the DOM.

## Review Focus (failure modes the tests must pin)

These are the inputs most likely to hurt a real user. Each has a test in the task named in brackets.

1. **Awkward but valid text.** Windows line endings, tabs, trailing spaces, quoted labels containing brackets, `<br/>`, the word `end` inside a label, semicolons, blank lines, Unicode labels. The parser must not throw, and unknown lines must survive. \[Tasks 3, 4, 5\]

2. **Degenerate graphs.** Header only, one node, a self-loop, duplicate and opposite arrows, cycles, disconnected parts, 300 nodes. No crash, no two nodes at the same spot, layout under 2 seconds. \[Tasks 8, 9, 11\]

3. **Editing safety.** Undo restores the exact previous text; an edit never drops or reorders lines it does not own; edits are refused while the text has errors; typing in the text during a drag cancels the drag. \[Tasks 6, 7, 13, 14\]

4. **Export limits.** A 3x PNG that would be too large is reduced with a message; SVG text containing `&`, `<`, `>` and quotes is escaped; an empty diagram cannot be exported; GIF and video export keep running in a background tab. \[Tasks 15, 16, 17, 20\]

5. **Browser limits.** Storage disabled or full (the diagram, the settings and the colour-scheme choice), a corrupted or over-long share link, no `CompressionStream`, no video encoder. \[Tasks 12, 18, 20, 22\]

## Part 6. Tasks

Every task lists: **Delivers** (feature IDs), **Files**, **Interfaces**, numbered **Steps**, and a **Commit**. Run `npm test` after every task, not only the task's own tests.

### Task 1: Project scaffold and tooling

**Delivers:** groundwork for F17, F18.

**Files:**

* Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `playwright.config.ts`, `index.html`, `DECISIONS.md`, `src/app/main.ts`, `src/types/gifenc.d.ts`, `src/vite-env.d.ts`

* Preserve existing: `README.md`, `SECURITY.md`

* Test: `src/sanity.test.ts`, `src/repo.test.ts`

**Interfaces:**

* Consumes: nothing.

* Produces: the npm scripts `dev`, `build`, `preview`, `test`, `test:e2e`; the `BASE_PATH` environment variable read by `vite.config.ts`.

* [x] **Step 1: Create the project.** Work in the repository folder from Task 0 (it already has `git init`, `.gitignore`, the agent files and the plan). Run `npm init -y`, then set `"type": "module"` in `package.json` and these scripts exactly:

```
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:e2e": "playwright test"
}

```

* [x] **Step 2: Install dependencies.** Run `npm install @dagrejs/dagre gifenc`, then `npm install -D typescript vite vitest @playwright/test @types/node`, then `npx playwright install chromium`. Do not install `mediabunny` yet (Task 20).

* [x] **Step 3: Write the config files.**

  * `tsconfig.json`: `compilerOptions` = `target ES2022`, `module ESNext`, `moduleResolution Bundler`, `lib ["ES2022","DOM","DOM.Iterable"]`, `strict true`, `noEmit true`, `skipLibCheck true`, `types ["node"]`; `include` = `["src","tests","scripts","vite.config.ts","playwright.config.ts"]`.

  * `vite.config.ts`: import `defineConfig` from `vitest/config`; export a config with `base: process.env.BASE_PATH ?? '/'` and `test: { include: ['src/**/*.test.ts'], environment: 'node', server: { deps: { inline: ['gifenc'] } } }` (the last option lets Vitest load the ESM build of `gifenc`, which is published as CommonJS plus ESM).

  * `playwright.config.ts`: `testDir: 'tests/e2e'`, one project using Chromium, `use.baseURL = 'http://localhost:4173'`, and `webServer = { command: 'npm run build && npm run preview -- --port 4173', url: 'http://localhost:4173', reuseExistingServer: true, timeout: 120000 }`.

  * `index.html`: a minimal page with `<meta charset="utf-8">`, a viewport meta tag, the title `Gati-chitra`, one `<div id="app"></div>`, and `<script type="module" src="/src/app/main.ts"></script>`.

  * `.gitignore`, `README.md` and `SECURITY.md` already exist in the repository. Do not overwrite or delete them here.

  * `DECISIONS.md`: the single line `# Decisions`.

  * `src/app/main.ts`: sets the text of `#app` to `Gati-chitra`.

  * `src/vite-env.d.ts`: the single line `/// <reference types="vite/client" />` (it gives `import.meta.env` and CSS imports their types).

* [x] **Step 4: Declare the types of `gifenc`** (the package ships none). Create `src/types/gifenc.d.ts` with exactly:

```
declare module 'gifenc' {
  export type Palette = number[][];
  export interface WriteFrameOptions {
    palette?: Palette; delay?: number; repeat?: number;
    transparent?: boolean; transparentIndex?: number; dispose?: number; first?: boolean;
  }
  export interface GIFEncoderInstance {
    writeFrame(index: Uint8Array, width: number, height: number, opts?: WriteFrameOptions): void;
    finish(): void;
    bytes(): Uint8Array;
  }
  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): GIFEncoderInstance;
  export function quantize(rgba: Uint8Array | Uint8ClampedArray, maxColors: number, opts?: { format?: string }): Palette;
  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: string): Uint8Array;
}

```

* [x] **Step 5: Write the tests.** `src/sanity.test.ts`: one test asserting `1 + 1` equals `2`. `src/repo.test.ts` pins the files from Task 0 (it reads them with `node:fs` from the project root):

```
import { existsSync, readFileSync } from 'node:fs';
const read = (p: string) => readFileSync(p, 'utf8');
const PLAN = 'docs/superpowers/plans/2026-11-02-gati-chitra.md';

it('has the three agent files, the custom security policy and the plan', () => {
  for (const f of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'SECURITY.md', PLAN]) expect(existsSync(f)).toBe(true);
});
it('AGENTS.md names both skills, the workflow skills, the install command and the plan', () => {
  const a = read('AGENTS.md');
  for (const t of ['superpowers', 'humanizer', 'brainstorming', 'writing-plans', 'executing-plans', 'test-driven-development',
    'systematic-debugging', 'verification-before-completion', 'npx skills add blader/humanizer', '.gitignore', PLAN]) expect(a).toContain(t);
});
it('CLAUDE.md imports AGENTS.md and has the Claude Code install commands', () => {
  const c = read('CLAUDE.md');
  for (const t of ['@AGENTS.md', '/plugin install superpowers@claude-plugins-official', '/plugin marketplace add blader/humanizer',
    '/plugin install humanizer@humanizer']) expect(c).toContain(t);
});
it('GEMINI.md imports AGENTS.md and has the Gemini CLI install commands', () => {
  const g = read('GEMINI.md');
  for (const t of ['@./AGENTS.md', 'gemini extensions install https://github.com/obra/superpowers', 'npx skills add blader/humanizer']) expect(g).toContain(t);
});
it('.gitignore keeps generated and local files out, and keeps the shared files in', () => {
  const lines = read('.gitignore').split('\n').map(l => l.trim());
  for (const need of ['node_modules/', 'dist/', 'playwright-report/', 'test-results/', '.env.local', '.DS_Store', '.worktrees/']) expect(lines).toContain(need);
  for (const never of ['.env', 'docs/', 'public/', 'AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'SECURITY.md', 'README.md']) expect(lines).not.toContain(never);
});

```

* [x] **Step 6: Verify.** Run `npm test` (expect 2 test files and every test passing) and `npm run build` (expect no errors and a `dist` folder).

* [x] **Step 7: Commit.** `git add -A && git commit -m "chore: scaffold project"`

### Task 2: Constants and types

**Delivers:** groundwork for every feature.

**Files:**

* Create: `src/core/constants.ts`, `src/core/types.ts`, `tests/support/measure.ts`

* Test: `src/core/constants.test.ts`

**Interfaces:**

* Consumes: Part 2 and Part 3 of this document.

* Produces: every export named in Part 2 and Part 3; `testMeasure(text: string): number` in `tests/support/measure.ts`, which returns `text.length * 8` (a fixed fake text width used by all layout tests).

* [x] **Step 1: Write the failing test** `src/core/constants.test.ts`:

```
import { LIMITS, LAYOUT, ANIM, EXPORT, SHARE, MESSAGES, SCHEME, BRAND } from './constants';

it('pins the limits', () => {
  expect(LIMITS.maxNodes).toBe(300);
  expect(LIMITS.maxEdges).toBe(600);
  expect(LIMITS.undoDepth).toBe(200);
});
it('pins layout and animation values', () => {
  expect(LAYOUT.rankSep).toBe(64);
  expect(LAYOUT.nodeSep).toBe(40);
  expect(ANIM.dashPattern).toEqual([8, 8]);
  expect(ANIM.spacingBase).toBe(640);
});
it('pins export values', () => {
  expect(EXPORT.gifMaxFrames).toBe(300);
  expect(EXPORT.slideWidth).toBe(1280);
  expect(EXPORT.pngScales).toEqual([1, 2, 3]);
});
it('builds messages', () => {
  expect(MESSAGES.unknownLine(7)).toBe('Line 7 is not understood and is kept as written.');
  expect(MESSAGES.unknownNode('Z')).toBe('Unknown node "Z".');
  expect(MESSAGES.groupTooDeep).toBe('Subgraph nesting is too deep (limit 4).');
  expect(MESSAGES.unknownEdge(5)).toBe('Unknown arrow 5.');
  expect(MESSAGES.groupsInText).toBe('Groups are edited in the text.');
  expect(MESSAGES.videoFailed('x')).toBe('Video export failed: x');
  expect(SCHEME.storageKey).toBe('StackColorScheme');
  expect(BRAND.name).toBe('Gati-chitra');
  expect(BRAND.tools.map(t => t.id)).toEqual(['diff', 'anurup']);
  expect(SHARE.prefix).toBe('v1=');
});

```

* [x] **Step 2: Run** `npx vitest run src/core/constants.test.ts`. Expected: FAIL (module not found).

* [x] **Step 3: Create** `src/core/constants.ts` by copying the code block in Part 2 exactly, and `src/core/types.ts` by copying the code block in Part 3 exactly. Create `tests/support/measure.ts` exporting `testMeasure`.

* [x] **Step 4: Run** the test again. Expected: PASS. Run `npm run build`. Expected: no type errors.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: add constants and shared types"`

### Task 3: Parser, part 1: header, node references, line classification

**Delivers:** part of F2, F3.

**Files:**

* Create: `src/mermaid/tokens.ts`, `src/mermaid/parse.ts`

* Test: `src/mermaid/tokens.test.ts`, `src/mermaid/parse.header.test.ts`

**Interfaces:**

* Consumes: types from `src/core/types.ts`; `LIMITS`, `MESSAGES`.

* Produces (in `tokens.ts`):

```
export interface NodeRef { id: string; label: string | null; shape: ShapeKind | null; className: string | null }
export function cleanLabel(raw: string): string;
export function readNodeRef(s: string, pos: number): { ref: NodeRef; end: number } | null;

```

* Produces (in `parse.ts`): `export function parseMermaid(text: string): ParsedDoc;` (grows in Tasks 4 and 5).

**The full `parseMermaid` algorithm** (Tasks 3, 4 and 5 implement it in stages; in Task 3 implement steps 1 to 4, the blank, comment, directive and position branches of step 5, and statements that contain exactly one node group with no edges; everything else in step 5 is classified `'unknown'` with a warning for now):

1. If `text.length > LIMITS.maxTextChars`: return an empty document with the single error `MESSAGES.textTooLong` on line 1, `ok: false`, and one `'unknown'` `SourceLine` per line.

2. Split into `rawLines` with `/\r\n|\r|\n/`. Create one `SourceLine` per raw line: `{ index, text, kind: 'blank', nodeIds: [], edgeIndexes: [] }`.

3. Front matter: let `first` be the index of the first line whose trimmed text is not empty. If that trimmed text is `---` and a later line is also `---`, mark both and every line between as `'frontmatter'`, and start step 4 after them. Otherwise start step 4 at `first`.

4. Header search, from the start index: skip blank lines; a line starting with `%%{` is `'directive'`; a line starting with `%%` is `'comment'`; the first other line must match the header pattern in 4.1. If it does, mark it `'header'`, set `direction`, and go to step 5. If it does not, add the error `MESSAGES.notFlowchart` on that line (1-based), mark that line and every later line `'unknown'`, and return with `ok: false`. If the text has no such line at all, add the same error on line 1 and return.

5. For each later line (trim it for matching; keep the original text in the `SourceLine`):

   * empty: `'blank'`

   * starts with `%%`: `'pos'` if it matches the position pattern in 4.8 (and set `pins`), else `'directive'` if it starts with `%%{`, else `'comment'`

   * starts with `subgraph`: handle as in Task 5

   * matches `/^end\s*;?$/`: close a group, as in Task 5

   * matches `/^direction\s+(TB|TD|BT|RL|LR)\s*;?$/`: kind `'direction'`

   * starts with `classDef `, `class `, `style ` or `linkStyle `: handle as in Task 5

   * otherwise call `scanStatement` (Task 4). If it returns tokens, add the statement; if it returns null, mark the line `'unknown'` and add the warning `MESSAGES.unknownLine(index + 1)`.

6. After the last line, add the warning `MESSAGES.unclosedGroup(id)` (on the `subgraph` line) for every group still open.

7. Apply the pending `class`, `style` and `linkStyle` assignments (4.7).

8. Node and edge limits are enforced while statements are added (4.9).

9. `ok` is true when no diagnostic has severity `'error'`.

**`readNodeRef` algorithm:**

1. Match `/[A-Za-z0-9_]+/y` at `pos` (sticky). No match: return null. That is the id.

2. Let `p` be the position after the id. For each row of the shape table in 4.2, in order: if `s.startsWith(open, p)` then read the label. If the character after the opening token is `"`, find the next `"`; if there is none, return null; the label is the text between the quotes, and `close` must start right after the closing quote, else return null. Otherwise find the first `close` at or after the end of the opening token; if there is none, return null. Set `shape` from the row, `label` to `cleanLabel(raw)` (or null when the cleaned label is empty), `end` after the close token, and stop looking at rows.

3. If no row matched, `shape` and `label` are null and `end = p`.

4. If `s.startsWith(':::', end)` and `/:::([A-Za-z0-9_]+)/y` matches there, set `className` and move `end` past it.

5. Return `{ ref, end }`.

* [x] **Step 1: Write the failing tests.** `tokens.test.ts` (each line is one assertion; `r(s)` means `readNodeRef(s, 0)`):

```
expect(r('A')).toEqual({ ref: { id: 'A', label: null, shape: null, className: null }, end: 1 });
expect(r('A[Start]')).toEqual({ ref: { id: 'A', label: 'Start', shape: 'rect', className: null }, end: 8 });
expect(r('B(Round)')!.ref).toMatchObject({ shape: 'round', label: 'Round' });
expect(r('C([Pill])')!.ref).toMatchObject({ shape: 'stadium', label: 'Pill' });
expect(r('D((Dot))')!.ref).toMatchObject({ shape: 'circle', label: 'Dot' });
expect(r('E{Choice}')!.ref).toMatchObject({ shape: 'diamond', label: 'Choice' });
expect(r('F{{Hex}}')!.ref).toMatchObject({ shape: 'hexagon', label: 'Hex' });
expect(r('G[/Slant/]')!.ref).toMatchObject({ shape: 'parallelogram', label: 'Slant' });
expect(r('H[\\Back\\]')!.ref).toMatchObject({ shape: 'parallelogramAlt', label: 'Back' }); // text is H[\Back\]
expect(r('I[(Store)]')!.ref).toMatchObject({ shape: 'cylinder', label: 'Store' });
expect(r('J[[Sub]]')!.ref).toMatchObject({ shape: 'subroutine', label: 'Sub' });
expect(r('K["a (b) [c]"]')!.ref).toMatchObject({ shape: 'rect', label: 'a (b) [c]' });
expect(r('L[Line<br/>two]')!.ref.label).toBe('Line\ntwo');
expect(r('M[]')!.ref).toMatchObject({ shape: 'rect', label: null });
expect(r('N:::hot')).toMatchObject({ ref: { id: 'N', className: 'hot' }, end: 7 });
expect(r('O[Hi]:::hot')!.ref).toMatchObject({ label: 'Hi', className: 'hot' });
expect(r('[x]')).toBeNull();
expect(r('P[unclosed')).toBeNull();
expect(readNodeRef('x A', 2)).toMatchObject({ ref: { id: 'A' }, end: 3 });
expect(cleanLabel('  hi  ')).toBe('hi');
expect(cleanLabel('a<BR>b')).toBe('a\nb');
expect(cleanLabel('a'.repeat(300)).length).toBe(200);

```

`parse.header.test.ts`:

```
expect(parseMermaid('flowchart TD\nA[Start]')).toMatchObject({ ok: true, direction: 'TB' });
expect(parseMermaid('flowchart TD\nA[Start]').nodes).toMatchObject([{ id: 'A', label: 'Start', shape: 'rect' }]);
expect(parseMermaid('flowchart TD\nA[Start]').lines.map(l => l.kind)).toEqual(['header', 'statement']);
expect(parseMermaid('flowchart TD\nA[Start]').lines[1].nodeIds).toEqual(['A']);
expect(parseMermaid('graph LR\n').direction).toBe('LR');
expect(parseMermaid('flowchart\nA').direction).toBe('TB');
expect(parseMermaid('flowchart BT;').direction).toBe('BT');
expect(parseMermaid('').diagnostics[0]).toEqual({ line: 1, severity: 'error', message: MESSAGES.notFlowchart });
expect(parseMermaid('sequenceDiagram\n A->>B: hi')).toMatchObject({ ok: false });
expect(parseMermaid('sequenceDiagram\n A->>B: hi').lines[1].kind).toBe('unknown');
expect(parseMermaid('%% c\n\nflowchart TD').lines.map(l => l.kind)).toEqual(['comment', 'blank', 'header']);
expect(parseMermaid('%%{init: {"theme":"forest"}}%%\nflowchart TD').lines[0].kind).toBe('directive');
expect(parseMermaid('---\ntitle: T\n---\nflowchart TD').lines.map(l => l.kind))
  .toEqual(['frontmatter', 'frontmatter', 'frontmatter', 'header']);
expect(parseMermaid('flowchart TD\r\nA\r\n')).toMatchObject({ ok: true });  // CRLF
expect(parseMermaid('flowchart TD\r\nA\r\n').lines.length).toBe(3);
expect(parseMermaid('x'.repeat(20001))).toMatchObject({ ok: false, nodes: [] });
expect(parseMermaid('flowchart TD\nA[Start]\nA[Begin]').nodes).toMatchObject([{ id: 'A', label: 'Begin' }]);
expect(parseMermaid('flowchart TD\nA[Ünï code]').nodes[0].label).toBe('Ünï code');
expect(parseMermaid('flowchart TD\nA[the end]').nodes[0].label).toBe('the end');   // Review Focus 1

```

* [x] **Step 2: Run** `npx vitest run src/mermaid`. Expected: FAIL (modules not found).

* [x] **Step 3: Implement** `cleanLabel`, `readNodeRef` in `src/mermaid/tokens.ts` and the Task 3 portion of `parseMermaid` in `src/mermaid/parse.ts`, following the algorithms above. Keep a `SHAPE_TABLE` constant in `tokens.ts` with the ten rows of 4.2 in the stated order.

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: parse flowchart header and node references"`

### Task 4: Parser, part 2: edges

**Delivers:** part of F2, F3.

**Files:**

* Modify: `src/mermaid/tokens.ts`, `src/mermaid/parse.ts`

* Test: `src/mermaid/edges.test.ts`

**Interfaces:**

* Consumes: `NodeRef`, `readNodeRef` (Task 3).

* Produces:

```
export type StatementToken =
  | { type: 'node'; ref: NodeRef; start: number; end: number }
  | { type: 'edge'; kind: EdgeKind; label: string; start: number; end: number }
  | { type: 'amp'; start: number; end: number }
  | { type: 'semi'; start: number; end: number };
export function readEdgeOperator(s: string, pos: number): { kind: EdgeKind; label: string; end: number } | null;
export function scanStatement(line: string): StatementToken[] | null;

```

Offsets in tokens are character positions in the full `line` string passed in (including leading spaces). Task 7 uses them to rewrite lines.

**`readEdgeOperator` algorithm:**

1. Let `rest = s.slice(pos)`. Try the three inline openers of 4.3 form 2. If one matches, scan forward for the first candidate closer position as described there. If found, return `{ kind, label, end }` where `end` is just after the closer. If an opener matched but no closer is found, return null.

2. Otherwise try the nine operator patterns of 4.3 in table order. The first match gives `kind` and `end`.

3. After the operator: skip spaces; if the next character is `|`, find the next `|`; the label is the trimmed text between them; set `end` just after the closing `|`. If there is an opening `|` without a closing one, return null.

4. If nothing matched, return null.

**`scanStatement` algorithm:**

1. `p` = index of the first non-space character; if the line is empty or blank, return null. `tokens = []`. `expectNode = true`.

2. Loop. Skip spaces.

   * If `expectNode`: call `readNodeRef(line, p)`. If null, return null. Push a `node` token. Move `p`. Skip spaces. If `line[p] === '&'`, push an `amp` token, move past it, and keep `expectNode = true`; otherwise set `expectNode = false`.

   * Else: if `p >= line.length`, stop. If `line[p] === ';'`, push a `semi` token, move past it, skip spaces, and return null if any text remains (several statements on one line are not supported; the line stays unknown). Otherwise call `readEdgeOperator(line, p)`; if null, return null; push an `edge` token; set `expectNode = true`.

3. When the loop ends, if `expectNode` is true and `tokens` is not empty, return null (the line ended after an edge or `&`). Return `tokens`.

**Statement handling in `parseMermaid`** (replaces the Task 3 single-node branch):

1. Walk the tokens. Keep `groups: NodeRef[][] = [[]]` and `ops: {kind, label}[] = []`. A `node` token appends to the last group; an `edge` token appends to `ops` and starts a new empty group; `amp` and `semi` do nothing.

2. For every node reference, in order: get or create the node. Creating: `{ id, label: ref.label ?? id, shape: ref.shape ?? 'rect', classNames: [], style: {}, group: <innermost open group or null>, line: <line index> }`. Existing node: if the reference has a shape, replace the shape; if it has a label, replace the label; if it has a class name not yet present, append it; if its `group` is null and a group is open, set `group` to the innermost open group. If creating would exceed `LIMITS.maxNodes`, add the error `MESSAGES.tooManyNodes` once (on that line) and skip that node.

3. For `i` from 0 to `ops.length - 1`, for every `a` in `groups[i]` and every `b` in `groups[i + 1]` (in that order): if both nodes exist, push an edge `{ id: 'e' + index, index, from: a.id, to: b.id, kind: ops[i].kind, label: ops[i].label, style: {}, line }`. If this would exceed `LIMITS.maxEdges`, add the error `MESSAGES.tooManyEdges` once and stop adding edges.

4. The `SourceLine` becomes `kind: 'statement'`, `nodeIds` = ids in order of first appearance on the line without duplicates, `edgeIndexes` = the indexes created on this line.

* [x] **Step 1: Write the failing tests** `src/mermaid/edges.test.ts`. Table-driven: for each row, parse `'flowchart TD\n' + input` and compare. "Edges" lists `from>to kind 'label'`.

| Input line | Expected edges | Node count | 
| ----- | ----- | ----- | 
| `A-->B` | `A>B arrow ''` | 2 | 
| `A --- B` | `A>B open ''` | 2 | 
| `A -.-> B` | `A>B dottedArrow ''` | 2 | 
| `A -.- B` | `A>B dotted ''` | 2 | 
| `A ==> B` | `A>B thickArrow ''` | 2 | 
| `A === B` | `A>B thick ''` | 2 | 
| `A --o B` | `A>B circleEnd ''` | 2 | 
| `A --x B` | `A>B crossEnd ''` | 2 | 
| `A <--> B` | `A>B bidirectional ''` | 2 | 
| `A ---> B` | `A>B arrow ''` | 2 | 
| `A -->|yes| B` | `A>B arrow 'yes'` | 2 | 
| `A -- yes --> B` | `A>B arrow 'yes'` | 2 | 
| `A -- yes --- B` | `A>B open 'yes'` | 2 | 
| `A -. maybe .-> B` | `A>B dottedArrow 'maybe'` | 2 | 
| `A == big ==> B` | `A>B thickArrow 'big'` | 2 | 
| `A --> B --> C` | `A>B arrow ''`, `B>C arrow ''` | 3 | 
| `A --> B & C` | `A>B arrow ''`, `A>C arrow ''` | 3 | 
| `A & B --> C & D` | `A>C`, `A>D`, `B>C`, `B>D` (all arrow) | 4 | 
| `A[Start] --> B{Check}` | `A>B arrow ''` (shapes rect and diamond) | 2 | 
| `A --> A` | `A>A arrow ''` | 1 | 
| `A --> B;` | `A>B arrow ''` | 2 | 
| `A -->` | none; line is `'unknown'` with warning `MESSAGES.unknownLine(2)` | 0 | 
| `A --> B; B --> C` | none; line unknown (several statements) | 0 | 
| `A -- B` | none; line unknown | 0 | 
| `--> B` | none; line unknown | 0 | 
| `A --> B -->` | none; line unknown | 0 | 

In the table above, `\|` stands for a plain `|` character; it is escaped only because of the table syntax. In the test code write a plain `|`.

Further assertions:

```
expect(readEdgeOperator('--> B', 0)).toEqual({ kind: 'arrow', label: '', end: 3 });
expect(readEdgeOperator('-->|x| B', 0)).toEqual({ kind: 'arrow', label: 'x', end: 6 });
expect(readEdgeOperator('-- hi --> B', 0)).toEqual({ kind: 'arrow', label: 'hi', end: 9 });
expect(scanStatement('  A --> B')!.map(t => t.type)).toEqual(['node', 'edge', 'node']);
expect(scanStatement('  A --> B')![0]).toMatchObject({ start: 2, end: 3 });
const d = parseMermaid('flowchart TD\nA-->B\nB-->C');
expect(d.edges.map(e => e.id)).toEqual(['e0', 'e1']);
expect(d.lines[2].edgeIndexes).toEqual([1]);
expect(d.lines[2].nodeIds).toEqual(['B', 'C']);
// limits
const many = 'flowchart TD\n' + Array.from({ length: 301 }, (_, i) => `N${i}`).join('\n');
expect(parseMermaid(many).nodes.length).toBe(300);
expect(parseMermaid(many).diagnostics.map(x => x.message)).toContain(MESSAGES.tooManyNodes);
const dup = 'flowchart TD\n' + Array.from({ length: 601 }, () => 'A-->B').join('\n');
expect(parseMermaid(dup).edges.length).toBe(600);
expect(parseMermaid(dup).ok).toBe(false);

```

* [x] **Step 2: Run** `npx vitest run src/mermaid/edges.test.ts`. Expected: FAIL.

* [x] **Step 3: Implement** `readEdgeOperator` and `scanStatement` in `tokens.ts`, and replace the single-node statement branch in `parse.ts` with the statement handling above. Use the regular expressions of Part 4 exactly.

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: parse edges, labels, chains and node groups"`

### Task 5: Parser, part 3: groups, classes, styles, comments, positions

**Delivers:** the rest of F2 and F3.

**Files:**

* Create: `src/mermaid/styles.ts`

* Modify: `src/mermaid/parse.ts`

* Test: `src/mermaid/styles.test.ts`, `src/mermaid/parse.groups.test.ts`, `src/mermaid/parse.styles.test.ts`, `src/mermaid/parse.lines.test.ts`, `tests/support/corpus.ts`

**Interfaces:**

* Consumes: Tasks 3 and 4.

* Produces: `export function parseStyleString(s: string): StyleMap;` in `styles.ts`; `tests/support/corpus.ts` exporting the six Appendix A diagrams as `CORPUS: { name: string; text: string; ok: boolean; nodes: number; edges: number; groups: number }[]`.

**Handlers (steps 5 and 7 of the parse algorithm):**

1. `subgraph` line. Try, in order: `/^subgraph\s+([A-Za-z0-9_]+)\s*\[(.*)\]\s*;?$/` (id, title; strip one pair of surrounding double quotes from the title); `/^subgraph\s+"(.*)"\s*;?$/` (id `group<k>`, title); `/^subgraph\s+(.+?)\s*;?$/` (title = the text; id = the text with every character outside `[A-Za-z0-9_]` replaced by `_`). If none matches, the line is `'unknown'` with the usual warning. Otherwise push a `GraphGroup` with `parent` = innermost open group id or null, `line` = this index, `direction: null`, and push the id on the open-group stack. If the stack is now deeper than `LIMITS.maxGroupDepth`, add the error `MESSAGES.groupTooDeep` once. Kind `'subgraph'`.

2. `end` line: if the stack is empty, add the warning `MESSAGES.strayEnd(index + 1)`; otherwise pop. Kind `'end'`.

3. `direction` line: if a group is open, set that group's `direction` (`TD` becomes `TB`). Kind `'direction'`.

4. `classDef`: after the keyword, the first whitespace-delimited token is the comma-separated class names; the rest of the line (trailing `;` removed) is passed to `parseStyleString`. Store the result in `classDefs[name]` for every name. Kind `'classDef'`.

5. `class`: first token = comma-separated node ids, second token = class name. Queue `{ ids, className }`. Kind `'class'`.

6. `style`: first token = node id, rest = style string. Queue `{ id, style }`. Kind `'style'`.

7. `linkStyle`: first token = `default` or comma-separated integers, rest = style string. Queue the assignment. Kind `'linkStyle'`.

8. After all lines (step 7 of the algorithm): for every queued `class` assignment, add the class name to each existing node not already carrying it. Then for every node compute its effective `style`: start with `{}`, merge `classDefs[c]` for each class in `classNames` order, then merge queued `style` entries for that node in line order. For every edge compute `style`: merge every `linkStyle default` entry, then entries whose index list contains the edge index, in line order.

**`parseStyleString`:** split on `/,(?=\s*[A-Za-z-]+\s*:)/`; for each part split at the first `:`; trim both sides; skip parts without a colon or with an empty key; strip a trailing `;` from the value.

* [x] **Step 1: Write the failing tests.**

`styles.test.ts`:

```
expect(parseStyleString('fill:#f9f,stroke:#333,stroke-width:4px;')).toEqual({ fill: '#f9f', stroke: '#333', 'stroke-width': '4px' });
expect(parseStyleString('fill:rgb(1,2,3),color:#fff')).toEqual({ fill: 'rgb(1,2,3)', color: '#fff' });
expect(parseStyleString('stroke-dasharray: 5 5')).toEqual({ 'stroke-dasharray': '5 5' });
expect(parseStyleString('')).toEqual({});

```

`parse.groups.test.ts`:

```
const nested = parseMermaid('flowchart TD\n  subgraph outer [Outer]\n    subgraph inner [Inner]\n      A\n    end\n    B\n  end\n  C');
expect(nested.groups).toMatchObject([{ id: 'outer', parent: null, title: 'Outer' }, { id: 'inner', parent: 'outer', title: 'Inner' }]);
expect(Object.fromEntries(nested.nodes.map(n => [n.id, n.group]))).toEqual({ A: 'inner', B: 'outer', C: null });
expect(parseMermaid('flowchart TD\nsubgraph "My Title"\nA\nend').groups[0]).toMatchObject({ id: 'group1', title: 'My Title' });
expect(parseMermaid('flowchart TD\nsubgraph Plain Words\nA\nend').groups[0]).toMatchObject({ id: 'Plain_Words', title: 'Plain Words' });
expect(parseMermaid('flowchart TD\nsubgraph g1 ["Quoted"]\nA\nend').groups[0].title).toBe('Quoted');
expect(parseMermaid('flowchart TD\nend').diagnostics).toEqual([{ line: 2, severity: 'warning', message: MESSAGES.strayEnd(2) }]);
expect(parseMermaid('flowchart TD\nsubgraph g\nA').diagnostics).toEqual([{ line: 2, severity: 'warning', message: MESSAGES.unclosedGroup('g') }]);
expect(parseMermaid('flowchart TD\nsubgraph g\ndirection LR\nA\nend').groups[0].direction).toBe('LR');
const deep = 'flowchart TD\n' + 'subgraph a\n'.repeat(5) + 'X\n' + 'end\n'.repeat(5);
expect(parseMermaid(deep)).toMatchObject({ ok: false });
expect(parseMermaid(deep).diagnostics.map(d => d.message)).toContain(MESSAGES.groupTooDeep);

```

`parse.styles.test.ts` (uses Appendix A diagram 3):

```
const d = parseMermaid(CORPUS[2].text);
expect(d.classDefs.hot).toEqual({ fill: '#ffe4e1', stroke: '#c0392b', 'stroke-width': '2px' });
expect(d.nodes.find(n => n.id === 'A')).toMatchObject({ classNames: ['hot'], style: { fill: '#ffe4e1', stroke: '#c0392b', 'stroke-width': '2px' } });
expect(d.nodes.find(n => n.id === 'C')!.style).toEqual({ fill: '#e8f8f5' });
expect(d.edges[0].style).toEqual({ stroke: '#c0392b', 'stroke-width': '3px' });
expect(d.edges[1].kind).toBe('dottedArrow');
expect(parseMermaid('flowchart TD\nclass Z hot\nA').nodes.map(n => n.id)).toEqual(['A']);
const ls = parseMermaid('flowchart TD\nA-->B\nB-->C\nlinkStyle default stroke:#0f0\nlinkStyle 1 stroke:#f00');
expect(ls.edges.map(e => e.style)).toEqual([{ stroke: '#0f0' }, { stroke: '#f00' }]);
expect(parseMermaid('flowchart TD\nA\nclass A hot\nclassDef hot fill:#f00').nodes[0].style).toEqual({ fill: '#f00' });

```

`parse.lines.test.ts` (uses Appendix A diagram 5):

```
const d = parseMermaid(CORPUS[4].text);
expect(d.lines.map(l => l.kind)).toEqual(['directive', 'header', 'comment', 'statement', 'unknown', 'comment', 'pos', 'pos']);
expect(d.pins).toEqual({ A: { x: 100, y: 40 }, B: { x: 100, y: 200 } });
expect(d.diagnostics).toEqual([{ line: 5, severity: 'warning', message: MESSAGES.unknownLine(5) }]);
expect(d.lines[3]).toMatchObject({ nodeIds: ['A', 'B'], edgeIndexes: [0] });
expect(parseMermaid('flowchart TD\n%% studio:pos A 1.5 -2').pins.A).toEqual({ x: 1.5, y: -2 });
expect(parseMermaid('flowchart TD\r\n\tA[Hi] --> B\t\r\n').edges.length).toBe(1);   // tabs, CRLF (Review Focus 1)
expect(parseMermaid('flowchart TD\nA["x [y] (z)"] --> B').nodes[0].label).toBe('x [y] (z)');
// corpus
for (const c of CORPUS) {
  const d = parseMermaid(c.text);
  expect([c.name, d.ok, d.nodes.length, d.edges.length, d.groups.length]).toEqual([c.name, c.ok, c.nodes, c.edges, c.groups]);
}
// robustness: never throws, always one SourceLine per line
// mulberry32(seed): a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
const alphabet = 'AB[]{}()-><|&;:%"\n .=#';
// for seed 1..200: build a string of up to 60 random characters from the alphabet, and assert
// parseMermaid(s) does not throw and lines.length === s.split(/\r\n|\r|\n/).length

```

* [x] **Step 2: Run** `npx vitest run src/mermaid`. Expected: FAIL.

* [x] **Step 3: Create** `tests/support/corpus.ts` from Appendix A, then implement `styles.ts` and the handlers in `parse.ts`.

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: parse groups, classes, styles, comments and pins"`

### Task 6: Text patches, part 1: pins, add, delete

**Delivers:** part of F3, F5, F6.

**Files:**

* Create: `src/mermaid/positions.ts`, `src/mermaid/ids.ts`, `src/mermaid/ops.ts`

* Modify: `src/mermaid/tokens.ts`, `src/mermaid/tokens.test.ts` (ensure `cleanLabel` replaces `#quot;` with `"`)

* Test: `src/mermaid/ops.add-delete.test.ts`

**Interfaces:**

* Consumes: `parseMermaid`, `scanStatement`, `StatementToken` (Tasks 3 to 5); `MESSAGES`.

* Produces:

```
// positions.ts
export const PIN_MARKER = '%% studio:layout v1';
export const PIN_LINE_RE: RegExp; // the pattern in Part 4.8
export function formatPinLine(id: string, x: number, y: number): string; // '%% studio:pos A 120 81'
// ids.ts
export function nextNodeId(doc: ParsedDoc): string; // 'n' + (highest existing n<number> suffix + 1), or 'n1'
// ops.ts
export function applyOp(text: string, op: TextOp): TextOpResult;
export function splitStatement(line: string): string[];
export function shapeTokens(shape: ShapeKind): { open: string; close: string };
export function edgeOperatorText(kind: EdgeKind): string;
export function formatLabel(label: string): string;

```

**How `applyOp` works (all operations):**

1. `doc = parseMermaid(text)`. If `!doc.ok`, return `{ error: MESSAGES.fixTextFirst }`.

2. `lines = doc.lines.map(l => l.text)`, then remove empty strings from the end of the array (so the function controls the final newline).

3. Apply the operation to `lines` using the rules below.

4. Return `{ text: lines.join('\n') + '\n' }` (plus `createdId` for `addNode`).

**Shared helpers:**

* `indentOf(line)`: the leading whitespace of the line.

* *Top-level content lines*: walk `doc.lines` keeping a depth counter (a `subgraph` line adds 1 after it; an `end` line subtracts 1 before being checked). A line is a top-level content line if its kind is `statement`, `subgraph`, `end`, `direction`, `classDef`, `class`, `style` or `linkStyle` and its depth, after processing the line, is 0. Lines inside an open subgraph are not top-level.

* `insertionIndex`: the index of the last top-level content line, or the header line's index if there is none. New lines go after it. Their indentation is `indentOf` that line when it is a content line, else two spaces. (Inserting at top level keeps new nodes from being pulled into a subgraph.)

* `shapeTokens(shape)`: the open and close tokens from the table in 4.2.

* `edgeOperatorText(kind)`: `arrow` `-->`, `open` `---`, `dottedArrow` `-.->`, `dotted` `-.-`, `thickArrow` `==>`, `thick` `===`, `circleEnd` `--o`, `crossEnd` `--x`, `bidirectional` `<-->`.

* `formatLabel(label)`: replace each newline with `<br/>`; if the result contains any of `[ ] ( ) { } " | ;`, replace `"` with `#quot;` and wrap the whole thing in double quotes.

* Edge label text inside pipes: replace `|` with `/` and newlines with `<br/>`.

**Operation rules:**

* **setPin(id, x, y):** error `MESSAGES.unknownNode(id)` if the node does not exist. Round `x` and `y` with `Math.round`. If a `pos` line for `id` exists, replace it. Else if any `pos` line exists, insert the new line after the last one. Else remove trailing blank lines, then append a blank line, `PIN_MARKER` (skip the marker if a marker line already exists, and insert after it instead) and the new line.

* **clearPins:** remove every line of kind `pos` and every line whose trimmed text equals `PIN_MARKER`, then remove blank lines from the end.

* **addNode:** `id = nextNodeId(doc)`. Insert `indent + id + open + formatLabel(label) + close` after `insertionIndex`. If `pin` is given, apply `setPin` to the result. Set `createdId = id`.

* **addEdge:** error `MESSAGES.unknownNode` for the first missing node (check `from` first). Kind defaults to `arrow`. Insert `indent + from + ' ' + edgeOperatorText(kind) + (label ? '|' + pipeLabel + '|' : '') + ' ' + to` after `insertionIndex`.

* **splitStatement(line)** (used to make a line hold one edge before it is edited):

  1. `tokens = scanStatement(line)`; if null, return `[line]`.

  2. If there is at most one `edge` token and no `amp` token, return `[line]`.

  3. Build node groups and operators as the parser does (Task 4). Keep a set `emitted` of node ids.

  4. For each operator `i`, for each `a` in group `i`, for each `b` in group `i + 1`: output `indent + text(a) + ' ' + operator + ' ' + text(b)`, where `operator = edgeOperatorText(kind) + (label ? '|' + label + '|' : '')`, and `text(t)` is the original substring `line.slice(t.start, t.end)` the first time that node id is emitted, and just the id afterwards.

* **deleteEdge(index):** error `MESSAGES.unknownEdge(index)` if out of range. Let `L = doc.edges[index].line`. If that line holds more than one edge, replace it with `splitStatement(line)` and run `deleteEdge` again on the new text (indexes do not change). Otherwise the line holds exactly one edge: for each of its two node tokens (once, if the same node appears twice), if no *other* line references that node and the node is not in the `exclude` list, output `indent + original token text` as a standalone line. Replace line `L` with those lines (possibly none). Then fix every `linkStyle` line whose first token is a list of numbers: remove `index`, subtract 1 from every larger number, and delete the line if the list becomes empty. (Deleting an arrow never deletes a node.)

* **deleteNode(id):** error if the node does not exist. For each edge touching the node, in descending index order, run the `deleteEdge` steps with `exclude = [id]`. Then remove every statement line that consists only of this node (one node token and nothing else); rewrite a statement made only of node tokens and `&` without this node (or remove it if nothing is left). Remove `style <id> <style text>` lines. In `class a,b name` lines remove `id` from the list and delete the line if the list is empty. Remove the node's `pos` line.

* [x] **Step 1: Write the failing tests** (`ok` means `applyOp` returns exactly `{ text }`; `\n` shows line breaks):

```
const run = (t: string, op: TextOp) => applyOp(t, op);
// pins
run('flowchart TD\n  A --> B\n', { type: 'setPin', id: 'A', x: 120.4, y: 80.6 })
  // -> { text: 'flowchart TD\n  A --> B\n\n%% studio:layout v1\n%% studio:pos A 120 81\n' }
run(<result above>, { type: 'setPin', id: 'B', x: 10, y: 20 })
  // -> 'flowchart TD\n  A --> B\n\n%% studio:layout v1\n%% studio:pos A 120 81\n%% studio:pos B 10 20\n'
run(<result above>, { type: 'setPin', id: 'A', x: 200, y: 40 })
  // -> 'flowchart TD\n  A --> B\n\n%% studio:layout v1\n%% studio:pos A 200 40\n%% studio:pos B 10 20\n'   (updated in place)
run(<result above>, { type: 'clearPins' })   // -> { text: 'flowchart TD\n  A --> B\n' }
run('flowchart TD\n  A\n', { type: 'setPin', id: 'Z', x: 1, y: 1 })   // -> { error: 'Unknown node "Z".' }
run('nonsense', { type: 'clearPins' })                                // -> { error: MESSAGES.fixTextFirst }
// addNode
run('flowchart TD\n  A --> B\n', { type: 'addNode', label: 'New step', shape: 'rect' })
  // -> { text: 'flowchart TD\n  A --> B\n  n1[New step]\n', createdId: 'n1' }
run('flowchart TD\n  A\n', { type: 'addNode', label: 'Go', shape: 'stadium' })       // new line '  n1([Go])'
run('flowchart TD\n  A\n', { type: 'addNode', label: 'Yes (maybe)', shape: 'rect' }) // new line '  n1["Yes (maybe)"]'
run('flowchart TD\n  n1\n  n3\n', { type: 'addNode', label: 'New', shape: 'rect' }).createdId // 'n4'
run('flowchart TD\n  subgraph g\n    A\n  end\n', { type: 'addNode', label: 'New', shape: 'rect' })
  // -> 'flowchart TD\n  subgraph g\n    A\n  end\n  n1[New]\n'   (after the end line, not inside the group)
run('flowchart TD\n', { type: 'addNode', label: 'New', shape: 'rect' })               // -> 'flowchart TD\n  n1[New]\n'
run('flowchart TD\n  A\n', { type: 'addNode', label: 'New', shape: 'rect', pin: { x: 5, y: 6 } })
  // -> 'flowchart TD\n  A\n  n1[New]\n\n%% studio:layout v1\n%% studio:pos n1 5 6\n'
// addEdge
run('flowchart TD\n  A --> B\n', { type: 'addEdge', from: 'B', to: 'A' })            // -> 'flowchart TD\n  A --> B\n  B --> A\n'
run('flowchart TD\n  A --> B\n', { type: 'addEdge', from: 'B', to: 'A', kind: 'dottedArrow', label: 'back' }) // '  B -.->|back| A'
run('flowchart TD\n  A --> B\n', { type: 'addEdge', from: 'Z', to: 'A' })            // -> { error: 'Unknown node "Z".' }
run('flowchart TD\n  A\n  B\n\n%% studio:layout v1\n%% studio:pos A 1 2\n', { type: 'addEdge', from: 'A', to: 'B' })
  // -> 'flowchart TD\n  A\n  B\n  A --> B\n\n%% studio:layout v1\n%% studio:pos A 1 2\n'
// splitStatement
splitStatement('A[Start] --> B{Q} --> C')  // ['A[Start] --> B{Q}', 'B --> C']
splitStatement('A & B --> C')              // ['A --> C', 'B --> C']
splitStatement('  A -->|x| B -.-> C')      // ['  A -->|x| B', '  B -.-> C']
splitStatement('A -- yes --> B & C')       // ['A -->|yes| B', 'A -->|yes| C']
splitStatement('A --> B;')                 // ['A --> B;']
splitStatement('A & B')                    // ['A & B']
// deleteEdge
run('flowchart TD\n  A --> B\n  B --> C\n', { type: 'deleteEdge', index: 0 })   // 'flowchart TD\n  A\n  B --> C\n'
run('flowchart TD\n  A[Start] --> B[End]\n', { type: 'deleteEdge', index: 0 })  // 'flowchart TD\n  A[Start]\n  B[End]\n'
run('flowchart TD\n  A --> B --> C\n', { type: 'deleteEdge', index: 1 })        // 'flowchart TD\n  A --> B\n  C\n'
run('flowchart TD\n  A --> B\n  B --> C\n  linkStyle 1 stroke:#f00\n', { type: 'deleteEdge', index: 0 })
  // 'flowchart TD\n  A\n  B --> C\n  linkStyle 0 stroke:#f00\n'
run('flowchart TD\n  A --> B\n  B --> C\n  linkStyle 1 stroke:#f00\n', { type: 'deleteEdge', index: 1 })
  // 'flowchart TD\n  A --> B\n  C\n'
run('flowchart TD\n  A --> A\n', { type: 'deleteEdge', index: 0 })              // 'flowchart TD\n  A\n'
run('flowchart TD\n  A --> B\n', { type: 'deleteEdge', index: 5 })              // { error: 'Unknown arrow 5.' }
// deleteNode
run('flowchart TD\n  A --> B\n  B --> C\n', { type: 'deleteNode', id: 'B' })    // 'flowchart TD\n  A\n  C\n'
run('flowchart TD\n  A[Start]\n  A --> B\n', { type: 'deleteNode', id: 'A' })   // 'flowchart TD\n  B\n'
run('flowchart TD\n  A --> B\n  style A fill:#f00\n  class A,B hot\n', { type: 'deleteNode', id: 'A' })
  // 'flowchart TD\n  B\n  class B hot\n'
run('flowchart TD\n  A\n  B\n\n%% studio:layout v1\n%% studio:pos A 1 2\n%% studio:pos B 3 4\n', { type: 'deleteNode', id: 'A' })
  // 'flowchart TD\n  B\n\n%% studio:layout v1\n%% studio:pos B 3 4\n'
run('flowchart TD\n  A\n', { type: 'deleteNode', id: 'Z' })                    // { error: 'Unknown node "Z".' }
// formatLabel
formatLabel('Hi') // 'Hi';  formatLabel('a\nb') // 'a<br/>b';  formatLabel('Yes (maybe)') // '"Yes (maybe)"'
formatLabel('say "x"') // '"say #quot;x#quot;"';  formatLabel('a;b') // '"a;b"'
// Review Focus 3, properties over every CORPUS diagram with ok === true:
//  (a) deleteNode of any node: the result parses ok, has every other node, and every line of kind
//      'unknown', 'directive' and 'comment' from the original is still present in the same order.
//  (b) for diagrams with no pos lines: setPin then clearPins returns the original text normalised
//      (trailing blank lines removed, one trailing newline).

```

* [x] **Step 2: Run** `npx vitest run src/mermaid/ops.add-delete.test.ts`. Expected: FAIL.

* [x] **Step 3: Implement** the three files following the rules above, and verify `cleanLabel` in `src/mermaid/tokens.ts` replaces `#quot;` with `"` (add `expect(cleanLabel('say #quot;x#quot;')).toBe('say "x"')` to `src/mermaid/tokens.test.ts` so labels written by `formatLabel` read back unchanged). Re-parse with `parseMermaid` whenever a rule says "run again".

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: text patches for pins, add and delete"`

### Task 7: Text patches, part 2: rename, shape, arrow style, reverse, colours, direction

**Delivers:** the rest of F5 and F6 on the text side.

**Files:**

* Modify: `src/mermaid/ops.ts`

* Test: `src/mermaid/ops.edit.test.ts`

**Interfaces:**

* Consumes: Task 6 helpers; `parseStyleString` (Task 5); `scanStatement` tokens with `start` and `end` offsets.

* Produces: `applyOp` now also handles `renameNode`, `renameEdge`, `renameGroup`, `setShape`, `setEdgeKind`, `reverseEdge`, `setNodeStyle`, `setDirection`.

**Shared helper:** `spliceLine(line, edits)`: applies `{ start, end, text }` replacements to one string from the highest `start` to the lowest, so earlier offsets stay valid.

**Rules:**

* **renameNode(id, label):** error if unknown. If `label.trim()` is empty, use `id` as the label. `newLabel = formatLabel(label)`. For every `statement` line that references the node, run `scanStatement`; for every `node` token with that id and `ref.shape !== null`, replace the token's text with `id + open + newLabel + close + (className ? ':::' + className : '')`, using the token's own shape. If nothing was replaced, insert a standalone line `indent + id + open + newLabel + close` (using the node's current shape) right after the first line that references the node.

* **setShape(id, shape):** same walk. For every node token with that id and `ref.shape !== null`, replace it with `id + newOpen + formatLabel(ref.label ?? id) + newClose + class suffix`. If nothing was replaced, insert a standalone line with the node's current label and the new shape after the first referencing line.

* **renameEdge(index, label):** error `MESSAGES.unknownEdge` if out of range. If the edge's line holds more than one edge, replace it with `splitStatement(line)` and run again. Otherwise replace the one `edge` token (its range covers both the operator and any label, in either form) with `edgeOperatorText(kind) + (label ? '|' + pipeLabel + '|' : '')`.

* **setEdgeKind(index, kind):** the same replacement, keeping the existing label as a pipe label.

* **reverseEdge(index):** after splitting, the line is `prefix + a + edge + b + suffix` (node token, edge token, node token). Rebuild it as `prefix + text(b) + ' ' + edgeText + ' ' + text(a) + suffix`, where `text(x)` is the token's original substring (so definitions travel with the node). A self-loop stays unchanged.

* **setNodeStyle(id, style):** find the `style` line whose first token is `id`. If it exists, merge: parse its style string, apply the new keys over it (a key with an empty string value is removed), and rewrite the line as `indent + 'style ' + id + ' ' + pairs.join(',')` where each pair is `key:value` in insertion order. If no keys remain, remove the line. If the line does not exist and keys remain, insert a new `style` line after `insertionIndex`.

* **renameGroup(id, title):** replace the group's `subgraph` line with `indent + 'subgraph ' + id + ' [' + formatLabel(title) + ']'`.

* **setDirection(direction):** rewrite the header line with `/^(\s*)(flowchart|graph)(?:\s+(TB|TD|BT|RL|LR))?(\s*;?\s*)$/` as `$1$2 <dir>$4`, where `<dir>` is `TD` for `TB` and the value otherwise.

* [x] **Step 1: Write the failing tests:**

```
// renameNode
run('flowchart TD\n  A[Start] --> B\n', { type: 'renameNode', id: 'A', label: 'Begin' })   // '  A[Begin] --> B'
run('flowchart TD\n  A --> B\n', { type: 'renameNode', id: 'A', label: 'Begin' })           // 'flowchart TD\n  A --> B\n  A[Begin]\n'
run('flowchart TD\n  A{Q} --> B\n', { type: 'renameNode', id: 'A', label: 'Is it ok?' })    // '  A{Is it ok?} --> B'
run('flowchart TD\n  A[Hi] --> B\n', { type: 'renameNode', id: 'A', label: 'Yes (maybe)' }) // '  A["Yes (maybe)"] --> B'
run('flowchart TD\n  A[Hi]:::hot --> B\n', { type: 'renameNode', id: 'A', label: 'Yo' })     // '  A[Yo]:::hot --> B'
run('flowchart TD\n  A[One] --> B\n  C --> A[One]\n', { type: 'renameNode', id: 'A', label: 'Two' })
  // '  A[Two] --> B\n  C --> A[Two]'
run('flowchart TD\n  A\n', { type: 'renameNode', id: 'Z', label: 'x' })                     // { error: 'Unknown node "Z".' }
// renameEdge
run('flowchart TD\n  A -->|yes| B\n', { type: 'renameEdge', index: 0, label: 'sure' })       // '  A -->|sure| B'
run('flowchart TD\n  A -- yes --> B\n', { type: 'renameEdge', index: 0, label: 'sure' })     // '  A -->|sure| B'
run('flowchart TD\n  A --> B\n', { type: 'renameEdge', index: 0, label: 'go' })              // '  A -->|go| B'
run('flowchart TD\n  A -->|yes| B\n', { type: 'renameEdge', index: 0, label: '' })           // '  A --> B'
run('flowchart TD\n  A --> B --> C\n', { type: 'renameEdge', index: 1, label: 'x' })         // '  A --> B\n  B -->|x| C'
// setShape
run('flowchart TD\n  A[Start] --> B\n', { type: 'setShape', id: 'A', shape: 'diamond' })     // '  A{Start} --> B'
run('flowchart TD\n  A --> B\n', { type: 'setShape', id: 'A', shape: 'circle' })             // 'flowchart TD\n  A --> B\n  A((A))\n'
run('flowchart TD\n  A([Pill])\n', { type: 'setShape', id: 'A', shape: 'hexagon' })          // '  A{{Pill}}'
// setEdgeKind
run('flowchart TD\n  A --> B\n', { type: 'setEdgeKind', index: 0, kind: 'dotted' })          // '  A -.- B'
run('flowchart TD\n  A -->|x| B\n', { type: 'setEdgeKind', index: 0, kind: 'dottedArrow' })  // '  A -.->|x| B'
// reverseEdge
run('flowchart TD\n  A[Start] --> B[End]\n', { type: 'reverseEdge', index: 0 })              // '  B[End] --> A[Start]'
run('flowchart TD\n  A --> B --> C\n', { type: 'reverseEdge', index: 1 })                    // '  A --> B\n  C --> B'
// setNodeStyle
run('flowchart TD\n  A --> B\n', { type: 'setNodeStyle', id: 'A', style: { fill: '#ffd' } }) // 'flowchart TD\n  A --> B\n  style A fill:#ffd\n'
run('flowchart TD\n  A --> B\n  style A fill:#ffd\n', { type: 'setNodeStyle', id: 'A', style: { stroke: '#333' } })
  // '  style A fill:#ffd,stroke:#333'
run('flowchart TD\n  A --> B\n  style A fill:#ffd,stroke:#333\n', { type: 'setNodeStyle', id: 'A', style: { fill: '' } })
  // '  style A stroke:#333'
run('flowchart TD\n  A --> B\n  style A fill:#ffd\n', { type: 'setNodeStyle', id: 'A', style: { fill: '' } })  // line removed
// renameGroup and setDirection
run('flowchart TD\n  subgraph g1 [Old]\n    A\n  end\n', { type: 'renameGroup', id: 'g1', title: 'New' }) // '  subgraph g1 [New]'
run('flowchart TD\n  A\n', { type: 'setDirection', direction: 'LR' })                       // 'flowchart LR\n  A\n'
run('graph LR;\nA\n', { type: 'setDirection', direction: 'TB' })                            // 'graph TD;\nA\n'
// Review Focus 3: on Appendix A diagram 5, after renameNode A -> 'Z' the lines of kind
// 'unknown', 'directive' and 'comment' are identical and in the same order as before.

```

* [x] **Step 2: Run** `npx vitest run src/mermaid/ops.edit.test.ts`. Expected: FAIL.

* [x] **Step 3: Implement** the new operations in `ops.ts`. If the file passes 300 lines, move the edge-editing rules into `src/mermaid/ops-edge.ts` and import them.

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: text patches for rename, shape, arrow style, reverse, colours"`

### Task 8: Node sizing and automatic layout

**Delivers:** F4 (the automatic part), part of F9.

**Files:**

* Create: `src/layout/measure.ts`, `src/layout/layout.ts`

* Create only if the build reports missing types: `src/types/dagre.d.ts` (content in Step 3)

* Test: `src/layout/measure.test.ts`, `src/layout/layout.test.ts`

**Interfaces:**

* Consumes: `ParsedDoc`, `NodeBox`, `GroupBox`, `SceneLayout`, `LAYOUT`, `FONT_STACK_SANS`, `testMeasure`.

* Produces:

```
export type MeasureText = (text: string, fontSize: number) => number;
// measure.ts
export function wrapLabel(label: string, maxWidth: number, measure: MeasureText): string[];
export function sizeNode(node: GraphNode, measure: MeasureText): { width: number; height: number; lines: string[] };
export function canvasMeasure(): MeasureText; // browser only: offscreen canvas, font `${size}px ${FONT_STACK_SANS}`
// layout.ts
export function layoutDoc(doc: ParsedDoc, measure: MeasureText): SceneLayout; // edges is {} here
export function computeGroups(doc: ParsedDoc, nodes: Record<string, NodeBox>): Record<string, GroupBox>;

```

**`wrapLabel` algorithm:** process each `\n`-separated paragraph on its own. Split into words on whitespace. Greedy: keep `current`; for each word, `candidate = current ? current + ' ' + word : word`; if `measure(candidate, LAYOUT.fontSize) <= maxWidth` or `current` is empty, set `current = candidate`; otherwise push `current` and set `current = word`. Push the last `current`. An empty paragraph gives one empty line. A word wider than `maxWidth` stays alone on its line.

**`sizeNode` algorithm:** `lines = wrapLabel(label, LAYOUT.labelWrapWidth, measure)`; `textW` = widest line; `width = max(minNodeW, textW + 2*nodePadX)`; `height = max(minNodeH, lines.length*lineHeight + 2*nodePadY)`. Then by shape: `diamond`: both times `diamondScale`; `hexagon`: width plus `hexagonExtraW`; `parallelogram` and `parallelogramAlt`: width plus `parallelogramExtraW`; `cylinder`: height plus `cylinderExtraH`; `circle`: `d = max(width, height) + circleExtra`, width and height both `d`; every other shape unchanged. Round both numbers up with `Math.ceil`.

**`layoutDoc` algorithm:**

 1. If there are no nodes, return `{ nodes: {}, groups: {}, edges: {}, bounds: { x: 0, y: 0, width: 0, height: 0 } }`.

 2. Size every node with `sizeNode`.

 3. `g = new dagre.graphlib.Graph({ compound: true, multigraph: true })` (`import dagre from '@dagrejs/dagre'`). `g.setGraph({ rankdir: doc.direction, nodesep: LAYOUT.nodeSep, ranksep: LAYOUT.rankSep, edgesep: LAYOUT.edgeSep, marginx: LAYOUT.margin, marginy: LAYOUT.margin })`. `g.setDefaultEdgeLabel(() => ({}))`.

 4. For each group: `g.setNode('group:' + id, {})`, and if it has a parent `g.setParent('group:' + id, 'group:' + parent)`. The prefix keeps group ids from clashing with node ids.

 5. For each node: `g.setNode(id, { width, height })`, and if it has a group `g.setParent(id, 'group:' + group)`.

 6. For each edge whose ends differ: `g.setEdge(from, to, labelObj, edge.id)` where `labelObj` is `{ width: measure(label, LAYOUT.edgeLabelFontSize) + 2*LAYOUT.edgeLabelPadX, height: LAYOUT.edgeLabelH, labelpos: 'c' }` when the edge has a label and `{}` otherwise. (Self-loops are not given to dagre.)

 7. `dagre.layout(g)`. Dagre returns the **centre** of each node as `x` and `y`.

 8. Build a `NodeBox` for each node from the dagre centre, then replace the centre with `doc.pins[id]` when a pin exists.

 9. `computeGroups(doc, nodes)`: handle groups from the deepest to the shallowest. A group's rectangle is the union of its member node rectangles and its child group rectangles, grown by `groupPad` on every side and by an extra `groupTitleH` on top. Groups with no members are skipped. `depth` is the number of ancestors. Do not use dagre's own group coordinates (pins would make them wrong).

10. `bounds` is the union of all node rectangles and group rectangles.

* [x] **Step 1: Write the failing tests** (`m = testMeasure`, so every character is 8 px wide):

```
// measure.test.ts
expect(wrapLabel('hello world', 200, testMeasure)).toEqual(['hello world']);
const lines = wrapLabel('a '.repeat(40).trim(), 200, testMeasure);
expect(lines.length).toBe(4);
expect(lines.every(l => testMeasure(l, 16) <= 200)).toBe(true);
expect(wrapLabel('a\nb', 200, testMeasure)).toEqual(['a', 'b']);
expect(wrapLabel('x'.repeat(40), 200, testMeasure)).toEqual(['x'.repeat(40)]);
const n = (label: string, shape: ShapeKind) => sizeNode({ id: 'A', label, shape, classNames: [], style: {}, group: null, line: 0 }, testMeasure);
expect(n('Hi', 'rect')).toMatchObject({ width: 72, height: 44 });
expect(n('Hi', 'diamond')).toMatchObject({ width: 116, height: 71 });
expect(n('Hi', 'circle')).toMatchObject({ width: 80, height: 80 });
expect(n('Hi', 'hexagon')).toMatchObject({ width: 100, height: 44 });
expect(n('Hi', 'parallelogram')).toMatchObject({ width: 100, height: 44 });
expect(n('Hi', 'cylinder')).toMatchObject({ width: 72, height: 62 });
expect(n('Hi', 'stadium')).toMatchObject({ width: 72, height: 44 });
expect(n('hello world', 'rect')).toMatchObject({ width: 124, height: 44 });
expect(n('a\nb', 'rect')).toMatchObject({ width: 72, height: 64 });

// layout.test.ts   (L = text => layoutDoc(parseMermaid(text), testMeasure))
const tb = L('flowchart TD\nA-->B');
expect(tb.nodes.B.center.y - tb.nodes.A.center.y).toBeGreaterThanOrEqual(100);
expect(tb.nodes.B.center.y - tb.nodes.A.center.y).toBeLessThanOrEqual(140);
expect(Math.abs(tb.nodes.B.center.x - tb.nodes.A.center.x)).toBeLessThan(1);
const lr = L('flowchart LR\nA-->B');
expect(lr.nodes.B.center.x).toBeGreaterThan(lr.nodes.A.center.x + 100);
const bt = L('flowchart BT\nA-->B');
expect(bt.nodes.B.center.y).toBeLessThan(bt.nodes.A.center.y);
expect(L('flowchart TD\nA-->B\n%% studio:pos B 500 500').nodes.B.center).toEqual({ x: 500, y: 500 });
expect(L('flowchart TD').bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 });
expect(L(CORPUS[0].text)).toEqual(L(CORPUS[0].text));        // deterministic
// every member box lies inside its group rectangle (use CORPUS[1])
// bounds contain every node rectangle and every group rectangle
// Review Focus 2: none of these throws, and no two nodes share a centre:
//   'flowchart TD\nA-->A', 'flowchart TD\nA-->B\nA-->B\nB-->A', 'flowchart TD\nA-->B\nB-->C\nC-->A',
//   'flowchart TD\nA\nB\nC', and a 300-node chain (`N0-->N1`, `N1-->N2`, and so on up to `N298-->N299`, one edge per line).
// the 300-node chain finishes in under 2000 ms.

```

* [x] **Step 2: Run** `npx vitest run src/layout`. Expected: FAIL.

* [x] **Step 3: Implement** both files. If `npm run build` says `@dagrejs/dagre` has no type declarations, create `src/types/dagre.d.ts` with exactly:

```
declare module '@dagrejs/dagre' {
  export namespace graphlib {
    class Graph {
      constructor(opts?: { directed?: boolean; multigraph?: boolean; compound?: boolean });
      setGraph(label: Record<string, unknown>): this;
      setDefaultEdgeLabel(fn: () => Record<string, unknown>): this;
      setNode(id: string, label: Record<string, unknown>): this;
      setParent(child: string, parent: string): void;
      setEdge(v: string, w: string, label?: Record<string, unknown>, name?: string): this;
      node(id: string): { x: number; y: number; width: number; height: number };
    }
  }
  export function layout(g: graphlib.Graph): void;
  const dagre: { graphlib: typeof graphlib; layout: typeof layout };
  export default dagre;
}

```

`canvasMeasure` creates one offscreen `<canvas>` (or `OffscreenCanvas`), sets `ctx.font = size + 'px ' + FONT_STACK_SANS` and returns `ctx.measureText(text).width`.

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: size nodes and lay out the graph"`

### Task 9: Geometry, edge routing, hit-testing and the scene

**Delivers:** the drawing geometry behind F5, F9, F11, F12.

**Files:**

* Create: `src/layout/geometry.ts`, `src/layout/scene.ts`

* Modify: `src/layout/layout.ts` (export `computeBounds`)

* Test: `src/layout/geometry.test.ts`, `src/layout/scene.test.ts`

**Interfaces:**

* Consumes: Task 8 (`layoutDoc`, `computeGroups`, `MeasureText`), types.

* Produces:

```
// geometry.ts
export function shapePolygon(box: NodeBox, shape: ShapeKind): Point[] | null;
export function borderPoint(box: NodeBox, shape: ShapeKind, toward: Point): Point;
export function routeEdges(doc: ParsedDoc, nodes: Record<string, NodeBox>): Record<string, EdgePath>;
export function pointOnPath(path: EdgePath, u: number): Point;
export function tangentAt(path: EdgePath, u: number): Point; // unit vector
export function handlePoint(doc: ParsedDoc, box: NodeBox): Point;
export type Hit =
  | { kind: 'handle'; id: string } | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }   | { kind: 'group'; id: string };
export function hitTest(scene: Scene, p: Point, handleNodeId: string | null): Hit | null;
// layout.ts (added)
export function computeBounds(doc: ParsedDoc, layout: SceneLayout, measure: MeasureText): Rect;
// scene.ts
export function buildScene(doc: ParsedDoc, measure: MeasureText): Scene;
export function withNodeAt(scene: Scene, nodeId: string, center: Point, measure: MeasureText): Scene;

```

**Polygons** (`c` = centre, `w`, `h` = box size, `i = LAYOUT.hexagonInset`, `s = LAYOUT.parallelogramSkew`):

* diamond: `(cx, cy-h/2) (cx+w/2, cy) (cx, cy+h/2) (cx-w/2, cy)`

* hexagon: `(cx-w/2+i, cy-h/2) (cx+w/2-i, cy-h/2) (cx+w/2, cy) (cx+w/2-i, cy+h/2) (cx-w/2+i, cy+h/2) (cx-w/2, cy)`

* parallelogram: `(cx-w/2+s, cy-h/2) (cx+w/2, cy-h/2) (cx+w/2-s, cy+h/2) (cx-w/2, cy+h/2)`

* parallelogramAlt: `(cx-w/2, cy-h/2) (cx+w/2-s, cy-h/2) (cx+w/2, cy+h/2) (cx-w/2+s, cy+h/2)`

* every other shape: `null`.

**`borderPoint(box, shape, toward)`:** `d = toward - centre`; if `d` is zero return the centre.

* `circle`: `centre + unit(d) * (width / 2)`.

* Polygon shapes: for each polygon edge from `v1` to `v2` with `e = v2 - v1`, compute `den = cross(d, e)`; skip if `den` is 0; `t = cross(v1 - c, e) / den`; `s = cross(v1 - c, d) / den`; accept when `t > 0` and `0 <= s <= 1`; take the smallest `t`; the result is `c + d*t`. (`cross(a, b) = a.x*b.y - a.y*b.x`.)

* All other shapes (box-like): `t = min((w/2)/|dx|, (h/2)/|dy|)` over the non-zero components; result `c + d*t`.

**`routeEdges` algorithm:**

1. Group the edges by unordered node pair (`[min(from,to), max(from,to)].join('|')`). Inside a group, sort by edge index; `n` is the group size and `i` the edge's position.

2. Self-loop (`from === to`): box `b`, `size = LAYOUT.selfLoopSize`. `from = (cx + w/2 - 14, cy - h/2)`, `to = (cx + w/2, cy - h/2 + 14)`, `control = (cx + w/2 + size, cy - h/2 - size)`, kind `'loop'`.

3. Otherwise `p0 = borderPoint(fromBox, fromShape, toBox.center)` and `p1 = borderPoint(toBox, toShape, fromBox.center)`.

   * If `n === 1`: kind `'straight'`, `control = null`.

   * If `n > 1`: let `d` be the unit vector from the centre of the node with the smaller id to the centre of the node with the larger id, and `nrm = (-d.y, d.x)`. `offset = (i - (n - 1) / 2) * LAYOUT.parallelOffset`. `control = midpoint(p0, p1) + nrm * (offset * 2)`. Kind `'quad'`.

4. `labelPoint = pointOnPath(path, 0.5)`.

5. `length`: straight = distance; quad and loop = the sum of the lengths of 16 straight segments sampled at `u = k/16`.

`pointOnPath`: straight is linear; quad and loop use `(1-u)^2*from + 2(1-u)u*control + u^2*to`. `tangentAt`: straight is `unit(to - from)`; quad is the unit vector of `2(1-u)(control-from) + 2u(to-control)`; if the vector is zero return `(1, 0)`.

`handlePoint(doc, box)`: `TB` bottom-centre, `BT` top-centre, `LR` right-middle, `RL` left-middle.

**`hitTest(scene, p, handleNodeId)`** returns the first match of:

1. If `handleNodeId` is set and `p` is within `LAYOUT.handleRadius + 4` of that node's handle point: `{ kind: 'handle', id }`.

2. Nodes, checked from the last in `doc.nodes` to the first: circle uses the ellipse equation; polygon shapes use even-odd point-in-polygon; all others use the box. Hit: `{ kind: 'node', id }`.

3. Edges: distance from `p` to each of the 16 sampled segments; the nearest edge within `LAYOUT.hitTolerance`: `{ kind: 'edge', id }`.

4. Groups: the title band (the group rectangle's top `LAYOUT.groupTitleH` pixels), deepest group first: `{ kind: 'group', id }`.

5. Otherwise `null`.

`computeBounds`: the union of node rectangles, group rectangles, edge label chips (centred at `labelPoint`, width `measure(label) + 2*edgeLabelPadX`, height `edgeLabelH`, only for labelled edges) and every edge's `from`, `to` and `control` points.

`buildScene(doc, measure)`: `layout = layoutDoc(doc, measure)`; `edges = routeEdges(doc, layout.nodes)`; `bounds = computeBounds(doc, { ...layout, edges }, measure)`; return `{ doc, layout: { ...layout, edges, bounds } }`. (For an empty graph, return the empty layout unchanged.)

`withNodeAt(scene, id, center, measure)`: copy the node boxes with the new centre for `id`; recompute groups with `computeGroups`, edges with `routeEdges`, bounds with `computeBounds`.

* [x] **Step 1: Write the failing tests** (`box(id, x, y, w = 100, h = 40)` builds a `NodeBox`):

```
// borderPoint
expect(borderPoint(box('A', 0, 0), 'rect', { x: 200, y: 0 })).toEqual({ x: 50, y: 0 });
expect(borderPoint(box('A', 0, 0), 'rect', { x: 0, y: 100 })).toEqual({ x: 0, y: 20 });
expect(borderPoint(box('A', 0, 0), 'rect', { x: 100, y: 100 })).toEqual({ x: 20, y: 20 });
expect(borderPoint(box('A', 0, 0, 60, 60), 'circle', { x: 100, y: 0 })).toEqual({ x: 30, y: 0 });
const dia = box('A', 0, 0, 100, 60);
expect(borderPoint(dia, 'diamond', { x: 100, y: 0 })).toEqual({ x: 50, y: 0 });
expect(borderPoint(dia, 'diamond', { x: 0, y: 100 })).toEqual({ x: 0, y: 30 });
expect(borderPoint(dia, 'diamond', { x: 100, y: 100 }).x).toBeCloseTo(18.75);
expect(borderPoint(box('A', 0, 0), 'parallelogram', { x: 100, y: 0 }).x).toBeCloseTo(43);
expect(shapePolygon(box('A', 0, 0), 'rect')).toBeNull();
// routeEdges
const nodes = { A: box('A', 0, 0), B: box('B', 0, 200) };
const one = routeEdges(parseMermaid('flowchart TD\nA-->B'), nodes).e0;
expect(one).toMatchObject({ kind: 'straight', from: { x: 0, y: 20 }, to: { x: 0, y: 180 }, length: 160, labelPoint: { x: 0, y: 100 } });
const two = routeEdges(parseMermaid('flowchart TD\nA-->B\nB-->A'), nodes);
expect([two.e0.kind, two.e1.kind]).toEqual(['quad', 'quad']);
expect([two.e0.control!.x, two.e1.control!.x]).toEqual([14, -14]);
const three = routeEdges(parseMermaid('flowchart TD\nA-->B\nA-->B\nA-->B'), nodes);
expect([three.e0.control!.x, three.e1.control!.x, three.e2.control!.x]).toEqual([28, 0, -28]);
const loop = routeEdges(parseMermaid('flowchart TD\nA-->A'), nodes).e0;
expect(loop).toMatchObject({ kind: 'loop', control: { x: 50 + 28, y: -20 - 28 } });
// pointOnPath and tangentAt
expect(pointOnPath({ id: 'e', kind: 'quad', from: { x: 0, y: 0 }, control: { x: 0, y: 100 }, to: { x: 100, y: 0 }, labelPoint: { x: 0, y: 0 }, length: 0 }, 0.5)).toEqual({ x: 25, y: 50 });
expect(tangentAt({ id: 'e', kind: 'straight', from: { x: 0, y: 0 }, to: { x: 0, y: 10 }, control: null, labelPoint: { x: 0, y: 0 }, length: 10 }, 0.3)).toEqual({ x: 0, y: 1 });
// handlePoint: TB -> { x: cx, y: cy + h/2 }; LR -> { x: cx + w/2, y: cy }
// hitTest (scene = buildScene(parseMermaid('flowchart TD\nA-->B'), testMeasure))
//   centre of A -> { kind: 'node', id: 'A' };  a point far outside -> null;
//   the midpoint of the edge -> { kind: 'edge', id: 'e0' };
//   with handleNodeId 'A', the handle point of A -> { kind: 'handle', id: 'A' };
//   the title band of a group (CORPUS[1]) -> { kind: 'group', id: 'ingest' }
// scene.test.ts
//   buildScene(CORPUS[0]).layout.bounds contains every node rectangle, every edge label chip and every edge end point.
//   withNodeAt(scene, 'B', { x: 300, y: 300 }, testMeasure): node B is at (300, 300), edge e0's `to` point moved,
//   the original scene is unchanged (not mutated).
//   buildScene works for a 300-node chain in under 2000 ms.

```

* [x] **Step 2: Run** `npx vitest run src/layout`. Expected: FAIL.

* [x] **Step 3: Implement** `geometry.ts`, `scene.ts` and `computeBounds`, following the formulas above.

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: geometry, edge routing, hit testing and scene"`

### Task 10: Themes and the canvas renderer

**Delivers:** F8, and the drawing half of F1 and F5.

**Files:**

* Create: `src/render/themes.ts`, `src/render/draw.ts`, `tests/support/recording-context.ts`

* Test: `src/render/themes.test.ts`, `src/render/draw.test.ts`

**Interfaces:**

* Consumes: `Scene`, `Theme`, `FrameState`, `DrawOptions`, `ViewState`; `LAYOUT`, `ANIM`, `FONT_STACK_SANS`; `pointOnPath`, `tangentAt`, `shapePolygon`, `handlePoint` (Task 9); `buildScene`; `CORPUS`.

* Produces:

```
// themes.ts
export const THEMES: Record<ThemeId, Theme>;
export const THEME_IDS: ThemeId[]; // ['daylight', 'midnight', 'lagoon', 'ember']
export const THEME_CHOICES: ThemeChoice[]; // ['auto', 'daylight', 'midnight', 'lagoon', 'ember']
export function resolveTheme(choice: ThemeChoice, scheme: 'light' | 'dark'): ThemeId; // 'auto' gives 'midnight' for 'dark' and 'daylight' for 'light'; any other choice is returned unchanged
// draw.ts
export type Ctx2D = CanvasRenderingContext2D;
export function emptyFrame(): FrameState; // { particles: [], dashOffset: null, nodeGlow: {} }
export function drawBackground(ctx: Ctx2D, theme: Theme, width: number, height: number, transparent: boolean): void;
export function drawScene(ctx: Ctx2D, scene: Scene, theme: Theme, view: ViewState, frame: FrameState, options: DrawOptions): void;
export function nodeStyle(node: GraphNode, theme: Theme): { fill: string; stroke: string; strokeWidth: number; text: string };
export function edgeStyle(edge: GraphEdge, theme: Theme): {
  stroke: string; width: number; dash: number[] | null;
  endMarker: 'arrow' | 'circle' | 'cross' | 'none'; startArrow: boolean;
};
// tests/support/recording-context.ts
export function createRecordingContext(width?: number, height?: number): {
  ctx: CanvasRenderingContext2D; calls: { name: string; args: unknown[] }[];
};

```

**Theme values (copy exactly).** Every theme also has `name` equal to its capitalised id.

| Field | daylight | midnight | lagoon | ember | 
| ----- | ----- | ----- | ----- | ----- | 
| background | `#ffffff` | `#303030` | `#06222b` | `#1a0b12` | 
| backgroundGradient | `null` | `null` | `['#06222b', '#0b4a52']` | `['#1a0b12', '#2b1020']` | 
| nodeFill | `#f7f7fb` | `#424242` | `#0d3a44` | `#2a1220` | 
| nodeStroke | `#34495e` | `#ecf0f1` | `#43d9c5` | `#ff8a5b` | 
| nodeText | `#111418` | `#ebebeb` | `#e6fffb` | `#fff1e8` | 
| edge | `#4f5660` | `#bdc3c7` | `#2fb8a8` | `#d9673f` | 
| edgeLabelBg | `#ffffff` | `#303030` | `#0a2e36` | `#1f0d17` | 
| edgeLabelText | `#111418` | `#ebebeb` | `#e6fffb` | `#fff1e8` | 
| groupFill | `#f5f5fa` | `#3a3a3a` | `#0a2f38` | `#231019` | 
| groupStroke | `#cfd1dc` | `#5e5e5e` | `#1f7f78` | `#7a3a2a` | 
| groupTitle | `#34495e` | `#bdc3c7` | `#8ff0e2` | `#ffb59a` | 
| particle | `#3b82f6` | `#8ab4ff` | `#b6fff3` | `#ffd27a` | 
| glow | `#3b82f6` | `#8ab4ff` | `#43d9c5` | `#ff8a5b` | 
| selection | `#3b82f6` | `#8ab4ff` | `#b6fff3` | `#ffd27a` | 
| glowDefault | `false` | `false` | `true` | `true` | 

Daylight and Midnight use the same palette as the page (the tokens in Part 2), so a diagram sits naturally in the page. Lagoon and Ember are the expressive extras. `resolveTheme` is what makes "Match page" follow the page scheme.

**`createRecordingContext`:** build it with a `Proxy`. Reading any property returns a function that pushes `{ name, args }` onto `calls`, except: `canvas` returns `{ width, height }`; `measureText(text)` returns `{ width: text.length * 8 }`; `createLinearGradient()` returns `{ addColorStop() {} }` after recording the call. Setting any property pushes `{ name: 'set:' + prop, args: [value] }` and returns true.

**`nodeStyle`:** `fill = node.style.fill ?? theme.nodeFill`; `stroke = node.style.stroke ?? theme.nodeStroke`; `strokeWidth = parseFloat(node.style['stroke-width']) || 2`; `text = node.style.color ?? theme.nodeText`.

**`edgeStyle`:** `stroke = style.stroke ?? theme.edge`; `width = parseFloat(style['stroke-width'])` if present, else `edgeWidthThick` for `thick` and `thickArrow`, else `edgeWidth`; `dash` = numbers from `style['stroke-dasharray']` (split on spaces or commas) if present, else `LAYOUT.dottedDash` for `dotted` and `dottedArrow`, else `null`; `endMarker`: `'arrow'` for `arrow`, `dottedArrow`, `thickArrow`, `bidirectional`; `'circle'` for `circleEnd`; `'cross'` for `crossEnd`; `'none'` for `open`, `dotted`, `thick`; `startArrow` is true only for `bidirectional`.

**`drawBackground`** (callers first call `ctx.setTransform(1, 0, 0, 1, 0, 0)`): if `transparent`, `clearRect(0, 0, width, height)`. Else if the theme has a gradient, `createLinearGradient(0, 0, 0, height)` with the two colours at stops 0 and 1, set it as `fillStyle`, and `fillRect(0, 0, width, height)`. Else set `fillStyle` to `theme.background` and `fillRect`.

**`drawScene` algorithm** (the exact order matters for the tests):

 1. `ctx.save()`; `ctx.translate(view.panX, view.panY)`; `ctx.scale(view.zoom, view.zoom)`. (It composes with any transform the caller set, such as the device pixel ratio.)

 2. **Groups**, by ascending `depth`: `roundRect(x, y, w, h, 10)`, fill `groupFill`, stroke `groupStroke` at width 1.5; then the title with `fillText` at `(x + 12, y + groupTitleH / 2)`, font `bold 14px <FONT_STACK_SANS>`, `textAlign 'left'`, `textBaseline 'middle'`, colour `groupTitle`.

 3. **Edges**, in `doc.edges` order. `globalAlpha` is `ANIM.dimAlpha` when `options.focus` exists and does not list the edge, else 1. Path: `beginPath`, `moveTo(from)`, then `lineTo(to)` for `'straight'` or `quadraticCurveTo(control, to)` otherwise. Set `lineWidth`, `strokeStyle`, `lineCap 'round'`, `setLineDash(dash ?? [])`, `stroke()`, then `setLineDash([])`. Heads: with `t = tangentAt(path, 1)` and `n = (-t.y, t.x)`, an arrow head is the triangle tip `to`, then `to - t*arrowSize + n*arrowSize*0.4`, then `to - t*arrowSize - n*arrowSize*0.4`, drawn with `beginPath`, `moveTo`, `lineTo`, `lineTo`, `closePath`, `fill` in the edge colour. `startArrow` adds the same triangle at `from` using the reversed tangent at `u = 0`. `'circle'`: `arc(to - t*5, 5)` filled. `'cross'`: two short strokes forming an X, half-size 5, centred at `to - t*6`, `lineWidth 2`. Reset `globalAlpha` to 1.

 4. **Edge labels**, after all edges: for each edge with a label, a chip `roundRect(labelPoint.x - w/2, labelPoint.y - h/2, w, h, 4)` with `w = ctx.measureText(label).width + 2*edgeLabelPadX`, `h = edgeLabelH`, filled `edgeLabelBg`, then the label with `fillText` centred, font `13px <FONT_STACK_SANS>`, colour `edgeLabelText`.

 5. **Dash overlay:** if `frame.dashOffset !== null`, for each edge draw its path again with `strokeStyle = theme.particle`, `setLineDash(ANIM.dashPattern)`, `lineDashOffset = frame.dashOffset`, then reset the dash and offset.

 6. **Particles:** for each particle, `p = pointOnPath(edges[edgeId], u)`; `globalAlpha = alpha` (times `dimAlpha` if the edge is outside the focus); `beginPath`, `arc(p.x, p.y, ANIM.particleRadius, 0, 2π)`, fill `theme.particle`. Reset `globalAlpha`.

 7. **Nodes**, in `doc.nodes` order. `globalAlpha` as for edges. Build the shape path once (`beginPath`, the path calls below), then `fill()` and `stroke()` using that path. If `options.showGlow` and `frame.nodeGlow[id] > 0`, set `shadowColor = theme.glow` and `shadowBlur = ANIM.glowBlur * glow` before `fill()` and reset `shadowBlur = 0` after it. Shape paths: `rect` `roundRect(x, y, w, h, rectRadius)`; `round` `roundRect(x, y, w, h, roundRadius)`; `stadium` `roundRect(x, y, w, h, h/2)`; `circle` `arc(cx, cy, w/2, 0, 2π)`; `diamond`, `hexagon`, `parallelogram`, `parallelogramAlt`: `moveTo` the first `shapePolygon` point, `lineTo` the rest, `closePath`; `cylinder`: with `rx = w/2`, `ry = 8`, `l`, `r`, `t`, `b` the box edges: `moveTo(l, t+ry)`, `ellipse(cx, t+ry, rx, ry, 0, π, 2π)`, `lineTo(r, b-ry)`, `ellipse(cx, b-ry, rx, ry, 0, 0, π)`, `closePath`; after the fill and stroke, `beginPath`, `ellipse(cx, t+ry, rx, ry, 0, 0, π)`, `stroke` (the front rim); `subroutine`: the `rect` path, then after the stroke two lines `moveTo(l+8, t) lineTo(l+8, b)` and `moveTo(r-8, t) lineTo(r-8, b)` stroked. Label lines: `fillText(line, cx, cy + (k - (n-1)/2) * lineHeight)` with `textAlign 'center'`, `textBaseline 'middle'`, font `16px <FONT_STACK_SANS>`, colour from `nodeStyle`. A selected node gets a second stroke of the same path in `theme.selection` at `lineWidth 3`.

 8. **Selection of an edge or group:** redraw the selected edge path in `theme.selection` at `width + 2`, or stroke the group rectangle in `theme.selection` at width 3.

 9. **Handle:** if `options.handleNodeId` is set, `arc(handlePoint, handleRadius)` filled `theme.selection`.

10. **Connect preview:** if `options.connectPreview` is set, `setLineDash([6, 4])`, a line from `from` to `to` in `theme.selection` at width 2, then reset the dash.

11. `ctx.restore()`.

* [x] **Step 1: Write the failing tests.** `themes.test.ts`: `THEME_IDS` equals the four ids; every theme has all `Theme` fields; `THEMES.lagoon.backgroundGradient` equals `['#06222b', '#0b4a52']`; `glowDefault` is true for lagoon and ember only; `THEMES.daylight.nodeStroke` is `#34495e` and `THEMES.midnight.background` is `#303030`; `THEME_CHOICES` equals `['auto', 'daylight', 'midnight', 'lagoon', 'ember']`; `resolveTheme('auto', 'light')` is `'daylight'`, `resolveTheme('auto', 'dark')` is `'midnight'`, `resolveTheme('lagoon', 'dark')` is `'lagoon'` and `resolveTheme('ember', 'light')` is `'ember'`. `draw.test.ts` (helper `draw(text, options?, frame?, theme?)` builds the scene with `testMeasure`, uses `view = { zoom: 1, panX: 0, panY: 0 }`, and returns the recorded calls; `count(calls, name)` counts calls):

```
// background
bg(THEMES.daylight, 800, 600, true)  -> calls: clearRect(0,0,800,600) and no fillRect
bg(THEMES.daylight, 800, 600, false) -> set:fillStyle '#ffffff' then fillRect(0,0,800,600)
bg(THEMES.lagoon, 800, 600, false)   -> createLinearGradient(0,0,0,600) recorded, then fillRect
// order and balance
count(draw('flowchart TD\nA-->B'), 'save') === count(calls, 'restore')
first call is 'save'; translate(0,0) and scale(1,1) occur before any fillText
index of first lineTo < index of first fillText                       // edges before nodes
draw('flowchart TD\nA-->B').filter(c => c.name === 'fillText').map(c => c.args[0])   // ['A', 'B']
count(draw('flowchart TD\nA-->B'), 'roundRect') === 2; the radius argument (index 4) is 4
// edge kinds
draw('flowchart TD\nA -.-> B') contains setLineDash [3, 5] and later setLineDash []
draw('flowchart TD\nA ==> B') contains set:lineWidth 4
closePath count: 'A --> B' 1;  'A --- B' 0;  'A <--> B' 2;  'A --x B' 0
draw('flowchart TD\nA --o B') contains arc with radius 5
draw('flowchart TD\nA -->|yes| B') has fillText 'yes' and count(roundRect) === 3
// shapes
draw('flowchart TD\nA{Q}')      -> moveTo 1, lineTo 3, closePath 1, fill 1, stroke 1
draw('flowchart TD\nA((Q))')    -> one arc with radius 40
draw('flowchart TD\nA[(DB)]')   -> ellipse count 3
draw('flowchart TD\nA[[S]]')    -> roundRect 1, lineTo 2
// styles, selection, focus, glow
draw('flowchart TD\nA\nstyle A fill:#ff0000,stroke:#00ff00') -> set:fillStyle '#ff0000', set:strokeStyle '#00ff00'
selection { kind: 'node', id: 'A' } -> set:strokeStyle equal to theme.selection appears
focus { nodes: ['A'], edges: [] } on 'A-->B' -> set:globalAlpha 0.25 appears
nodeGlow { A: 1 } with showGlow true -> set:shadowBlur 18 appears; with showGlow false -> every set:shadowBlur is 0 or absent
// animation overlays
particle { edgeId: 'e0', u: 0.5, alpha: 0.5 } -> arc with radius 4 and set:globalAlpha 0.5
dashOffset -10 -> set:lineDashOffset -10 and setLineDash [8, 8]
// groups, preview, handle
CORPUS[1]: fillText 'Ingest' and 'Serve' both occur before the fillText 'Parse'
connectPreview -> setLineDash [6, 4] recorded
handleNodeId 'A' -> arc with radius 7
// styles
edgeStyle for thickArrow -> { width: 4, endMarker: 'arrow', dash: null }
edgeStyle for dotted -> { dash: [3, 5], endMarker: 'none' }
edgeStyle with style { 'stroke-dasharray': '5 5' } -> dash [5, 5]
edgeStyle for bidirectional -> startArrow true

```

* [x] **Step 2: Run** `npx vitest run src/render`. Expected: FAIL.

* [x] **Step 3: Implement** `themes.ts`, `draw.ts` and the recording context helper as specified.

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: themes and canvas renderer"`

### Task 11: Animation engine

**Delivers:** F7 (the maths; the controls come in Task 12).

**Files:**

* Create: `src/anim/hash.ts`, `src/anim/anim.ts`

* Test: `src/anim/hash.test.ts`, `src/anim/anim.test.ts`

**Interfaces:**

* Consumes: `Scene`, `AnimSettings`, `FrameState`, `Particle`; `ANIM`; `pointOnPath` is not needed here.

* Produces:

```
export function hash32(s: string): number; // FNV-1a, 32-bit, unsigned
export const DEFAULT_ANIM: AnimSettings;   // { style: 'pulse', speed: 1, density: 4, glow: false }
export function loopSeconds(settings: AnimSettings): number;          // ANIM.loopSecondsBase / settings.speed
export function phaseAt(elapsedSeconds: number, settings: AnimSettings): number; // (elapsed / loopSeconds) mod 1, never negative
export function computeDepths(doc: ParsedDoc): Record<string, number>;
export function frameState(scene: Scene, settings: AnimSettings, phase: number): FrameState;

```

**Algorithms.** Every result is a pure function of the inputs; there is no randomness and no clock. All animation is periodic in `phase` with period 1, so loops join up exactly.

* `hash32`: `h = 0x811c9dc5`; for each UTF-16 code unit `c`: `h ^= c; h = Math.imul(h, 0x01000193) >>> 0`. Return `h`.

* `computeDepths(doc)`: ignore self-loops. Sources are nodes with no incoming edge. Breadth-first search from all sources at depth 0; a node's depth is set on its first visit as the parent's depth plus 1. While nodes remain unvisited, start a new search from the first unvisited node (in `doc.nodes` order) at depth 0. An edge's depth is the depth of its `from` node.

* `frameState` with `p = ((phase % 1) + 1) % 1`:

  * `'off'`: `{ particles: [], dashOffset: null, nodeGlow: {} }`.

  * `'pulse'`: `D` = the largest edge depth (0 with no edges); `slots = D + 1`. For each edge with depth `d`: if `d/slots <= p < (d+1)/slots` add the particle `{ edgeId, u: (p - d/slots) * slots, alpha: 1 }`.

  * `'traffic'`: for each edge, `k = clamp(Math.round(length / (ANIM.spacingBase / density)), 1, ANIM.maxParticlesPerEdge)`. If the sum of all `k` exceeds `ANIM.maxParticlesTotal`, replace each `k` by `Math.max(1, Math.floor(k * maxParticlesTotal / sum))`. `offset = (hash32(edge.id) % 1000) / 1000`. For `i` from 0 to `k - 1`: `u = frac(p + i/k + offset)` where `frac(x) = x - Math.floor(x)`; `alpha = Math.max(0, Math.min(1, u / fade, (1 - u) / fade))` with `fade = ANIM.particleFade`.

  * `'dash'`: no particles; `dashOffset = 0 - p * ANIM.dashCycles * (ANIM.dashPattern[0] + ANIM.dashPattern[1])` (write it as `0 - x` so the result is never negative zero).

  * Glow (only when `settings.glow` is true and the style is `pulse` or `traffic`): for each particle on edge `e`, `bump = u >= 1 - glowWindow ? (u - (1 - glowWindow)) / glowWindow : 0`; `nodeGlow[e.to] = Math.max(existing ?? 0, bump * alpha)`. Store only values above 0.

  * Edges that have no entry in `scene.layout.edges` are skipped.

* [x] **Step 1: Write the failing tests.** For scenes use `buildScene(parseMermaid(text), testMeasure)`.

```
// hash32
expect(hash32('')).toBe(2166136261);
expect(hash32('a')).toBe(3826002220);
expect(hash32('foobar')).toBe(3214735720);
// loop and phase
expect(loopSeconds({ ...DEFAULT_ANIM, speed: 1 })).toBe(4);
expect(loopSeconds({ ...DEFAULT_ANIM, speed: 2 })).toBe(2);
expect(loopSeconds({ ...DEFAULT_ANIM, speed: 0.5 })).toBe(8);
expect(phaseAt(5, DEFAULT_ANIM)).toBeCloseTo(0.25);
expect(phaseAt(4, DEFAULT_ANIM)).toBe(0);
expect(phaseAt(-1, DEFAULT_ANIM)).toBeCloseTo(0.75);
// depths
computeDepths(parse('flowchart TD\nA-->B\nB-->C'))              // { A: 0, B: 1, C: 2 }
computeDepths(parse('flowchart TD\nA-->B\nB-->C\nC-->A'))       // { A: 0, B: 1, C: 2 }
computeDepths(parse('flowchart TD\nA-->B\nA-->C\nB-->D\nC-->D')) // { A: 0, B: 1, C: 1, D: 2 }
computeDepths(parse('flowchart TD\nA-->B\nC-->D'))              // { A: 0, B: 1, C: 0, D: 1 }
// pulse on the chain A-->B-->C (edge depths 0 and 1, so two slots)
const chain = scene('flowchart TD\nA-->B\nB-->C');
const pulse = { ...DEFAULT_ANIM, style: 'pulse' as const };
frameState(chain, pulse, 0).particles    // [{ edgeId: 'e0', u: 0, alpha: 1 }]
frameState(chain, pulse, 0.25).particles // [{ edgeId: 'e0', u: 0.5, alpha: 1 }]
frameState(chain, pulse, 0.5).particles  // [{ edgeId: 'e1', u: 0, alpha: 1 }]
frameState(chain, pulse, 0.75).particles // [{ edgeId: 'e1', u: 0.5, alpha: 1 }]
// glow on arrival: u = 0.9 at phase 0.45
frameState(chain, { ...pulse, glow: true }, 0.45).nodeGlow.B   // about 0.1667 (toBeCloseTo(0.1667, 3))
frameState(chain, { ...pulse, glow: false }, 0.45).nodeGlow    // {}
// traffic: one edge of length about 756 (pins put A and B 800 apart), density 4
const far = scene('flowchart TD\nA-->B\n%% studio:pos A 0 0\n%% studio:pos B 0 800');
frameState(far, { ...DEFAULT_ANIM, style: 'traffic' }, 0).particles.length   // 5
// dash
frameState(chain, { ...DEFAULT_ANIM, style: 'dash' }, 0.5).dashOffset        // about -32
frameState(chain, { ...DEFAULT_ANIM, style: 'dash' }, 0).dashOffset          // 0, not null
frameState(chain, { ...DEFAULT_ANIM, style: 'pulse' }, 0.5).dashOffset       // null
// off and empty
frameState(chain, { ...DEFAULT_ANIM, style: 'off' }, 0.3)                    // { particles: [], dashOffset: null, nodeGlow: {} }
frameState(scene('flowchart TD'), DEFAULT_ANIM, 0.3).particles               // []
// seamless loop: for each style and each phase in [0, 0.25, 0.5, 0.75]
//   expect(frameState(s, st, ph)).toEqual(frameState(s, st, ph + 1))
// determinism: two calls with the same arguments are deeply equal
// cap: a document of 300 nodes in a chain with style 'traffic' and density 10 gives at most 1500 particles

```

* [x] **Step 2: Run** `npx vitest run src/anim`. Expected: FAIL.

* [x] **Step 3: Implement** `hash.ts` and `anim.ts` as specified.

* [x] **Step 4: Run** `npm test`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: deterministic animation engine"`

### Task 12: The app shell: viewport, live preview, controls, text panel, storage

**Delivers:** F1, F6 (the text side), F7 controls, F8 controls, F9, F15 (autosave), F17, F20 (partly).

This is the first task that runs in a browser. Build it in this order: view maths, storage, state, then the page.

**Files:**

* Create: `src/editor/view.ts`, `src/app/storage.ts`, `src/app/state.ts`, `src/app/ui.ts`, `src/app/sample.ts`, `src/app/tokens.css`, `src/app/style.css`

* Modify: `src/app/main.ts`, `index.html`

* Test: `src/editor/view.test.ts`, `src/app/storage.test.ts`, `src/app/state.test.ts`, `tests/e2e/preview.spec.ts`

**Interfaces:**

* Consumes: `buildScene`, `drawScene`, `drawBackground`, `emptyFrame`, `THEMES`, `frameState`, `phaseAt`, `DEFAULT_ANIM`, `parseMermaid`, `canvasMeasure`, `STORAGE`, `TIMING`, `VIEW`, `MESSAGES`, `CORPUS[0]` text (as the sample diagram).

* Produces:

```
// view.ts (pure)
export function fitView(bounds: Rect, viewport: { width: number; height: number }, margin?: number): ViewState; // margin defaults to VIEW.fitMargin
export function screenToWorld(view: ViewState, p: Point): Point;
export function worldToScreen(view: ViewState, p: Point): Point;
export function zoomAt(view: ViewState, screenPoint: Point, factor: number): ViewState;
export function panBy(view: ViewState, dx: number, dy: number): ViewState;
export function wheelFactor(deltaY: number, deltaMode: number): number;
// storage.ts
export interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void }
export interface Settings { theme: ThemeChoice; anim: AnimSettings }
export function safeStore(): KeyValueStore | null;
export function loadDoc(store: KeyValueStore | null): string | null;
export function saveDoc(store: KeyValueStore | null, text: string): boolean;
export function loadSettings(store: KeyValueStore | null): Settings;
export function saveSettings(store: KeyValueStore | null, settings: Settings): boolean;
// state.ts
export interface AppState {
  text: string; doc: ParsedDoc; scene: Scene | null; // scene is the last good scene
  view: ViewState; settings: Settings; paused: boolean;
}
export function createState(text: string, settings: Settings): AppState;
export function applyText(state: AppState, text: string, measure: MeasureText): AppState;

```

**View maths:**

* `fitView`: if `bounds.width` and `bounds.height` are both 0, return `{ zoom: 1, panX: viewport.width / 2, panY: viewport.height / 2 }`. Else `zoom = clamp(min((vw - 2m) / bw, (vh - 2m) / bh), zoomMin, zoomMax)`, `panX = (vw - bw*zoom) / 2 - bx*zoom`, `panY = (vh - bh*zoom) / 2 - by*zoom`.

* `screenToWorld`: `((x - panX) / zoom, (y - panY) / zoom)`. `worldToScreen` is the inverse.

* `zoomAt`: `newZoom = clamp(zoom * factor, zoomMin, zoomMax)`; `real = newZoom / zoom`; keep the world point under `screenPoint` fixed: `pan = screenPoint - (screenPoint - pan) * real` on each axis.

* `wheelFactor(deltaY, deltaMode)`: `delta = deltaY * (deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1)`; result `Math.exp(-delta * VIEW.wheelSensitivity)`.

**Storage rules:** every call is wrapped in `try/catch`. `safeStore()` returns `window.localStorage` after a test write and delete of a probe key, else `null`. `loadDoc` returns `null` for a `null` store, a missing key or a throwing store. `saveDoc` and `saveSettings` return false for a `null` or throwing store. `loadSettings` returns the defaults `{ theme: 'auto', anim: DEFAULT_ANIM }` for a missing key or invalid JSON, and validates each field: the theme must be one of `THEME_CHOICES`; `anim.style` one of the four styles; `speed` clamped to `[ANIM.speedMin, ANIM.speedMax]`; `density` clamped to `[ANIM.densityMin, ANIM.densityMax]`; `glow` a boolean. Invalid fields fall back to the default for that field.

**State rules:** `createState(text, settings)` parses the text, builds a scene when `doc.ok`, sets `view` to `{ zoom: 1, panX: 0, panY: 0 }`, `paused` false. `applyText(state, text, measure)` re-parses; if the new `doc.ok` is true, `scene = buildScene(doc, measure)`; if not, `scene` stays the previous object (the last good picture). It never mutates its input.

**Page structure** (use these ids exactly; later tasks and the browser tests rely on them):

```
<div id="app">
  <div id="toolbar" role="toolbar" aria-label="Diagram tools"> <!-- buttons with ids: btn-new btn-open btn-save-mmd btn-undo btn-redo btn-fit btn-autolayout btn-present btn-export btn-share btn-templates (later tasks fill in some) --> </div>
  <div id="workspace">
    <section id="text-panel"> <textarea id="source" spellcheck="false" aria-label="Mermaid text"></textarea> <ul id="diagnostics" aria-live="polite"></ul> </section>
    <section id="canvas-panel">
      <canvas id="canvas" role="img"></canvas>
      <div id="canvas-controls">
        <select id="anim-style"> pulse traffic dash off </select>
        <input id="anim-speed" type="range" min="0.25" max="3" step="0.25">
        <input id="anim-density" type="range" min="1" max="10" step="1">
        <label><input id="anim-glow" type="checkbox"> Glow</label>
        <button id="anim-pause" aria-pressed="false">Pause</button>
        <select id="theme"> auto (label "Match page") daylight midnight lagoon ember </select>
      </div>
      <div id="message" aria-live="polite"></div>
    </section>
  </div>
</div>

```

**Behaviour:**

 1. Start: `text = loadDoc(store) ?? CORPUS[0].text` (copy that sample text into `src/app/sample.ts` as `SAMPLE_TEXT`), `settings = loadSettings(store)`. Put the text into `#source`. If `new URLSearchParams(location.search).has('e2e')`, expose `window.__studio` with: `getText()`, `setText(t)` (acts like typing, without the debounce), `getSummary()` returning `{ nodes: string[]; edges: number; ok: boolean }`, `getView()`, `getSettings()`, `getNodeScreenCenter(id)`, `getEdgeScreenMid(id)`, `getSelection()`, `getResolvedTheme()` (the `ThemeId` actually drawn).

 2. Typing in `#source` waits `TIMING.parseDebounceMs`, then `applyText`. On the first successful scene, and when the Fit button or Ctrl/Cmd+0 is used, set `view = fitView(scene.layout.bounds, canvasCssSize)`.

 3. `#diagnostics` shows one `<li>` per diagnostic as `Line N: message` with class `error` or `warning`. Clicking an item selects that whole line in `#source` and focuses it. With no diagnostics the list is empty.

 4. `#canvas` has `aria-label` `Flowchart with N nodes and M arrows` (updated with each scene). A `ResizeObserver` keeps the canvas backing size at CSS size times `devicePixelRatio` and redraws.

 5. Render loop with `requestAnimationFrame`: `phase = paused ? pausedPhase : phaseAt(elapsed, settings.anim)`. The theme is `THEMES[resolveTheme(settings.theme, scheme)]`, where `scheme` is `document.documentElement.getAttribute('data-scheme') === 'dark' ? 'dark' : 'light'` (Task 22 sets that attribute; before it exists the scheme is light). Draw: `ctx.setTransform(1,0,0,1,0,0)`; `drawBackground(ctx, theme, canvas.width, canvas.height, false)`; `ctx.setTransform(dpr,0,0,dpr,0,0)`; `drawScene(ctx, scene, theme, view, frame, options)` with `frameState(scene, settings.anim, phase)` and `showGlow = settings.anim.glow`. With no scene, draw only the background. When paused, record `pausedPhase` at the moment of pausing.

 6. Pan and zoom: wheel over the canvas calls `zoomAt(view, point, wheelFactor(event.deltaY, event.deltaMode))` with `preventDefault` (register the listener with `{ passive: false }`). A drag on empty canvas, a middle-button drag, or a drag with Space held pans (use pointer capture).

 7. Controls update `settings` immediately and call `saveSettings`. Choosing a specific theme also sets `settings.anim.glow` to that theme's `glowDefault` (choosing "Match page" sets it to false) and updates the checkbox. The `#theme` options come from `THEME_CHOICES`; the label of `auto` is `Match page` and the label of every other choice is the theme's `name`. `#anim-pause` toggles `paused` and `aria-pressed`.

 8. Autosave: after each successful text change, wait `TIMING.autosaveDebounceMs`, then `saveDoc`. If a save returns false, show `MESSAGES.storageUnavailable` in `#message` once.

 9. New: `#btn-new` replaces the text with `flowchart TD\n`. Open: `#btn-open` opens a file picker for `.mmd` and `.txt`, reads the text and applies it. Save: `#btn-save-mmd` downloads the text with `downloadBlob` (Task 15 creates `downloadBlob`; until then write a minimal local version and move it in Task 15) as `diagram.mmd`.

10. Undo, redo, selection and dragging come in Task 13; the toolbar buttons for them exist but are disabled.

* [x] **Step 1: Write the failing unit tests.**

```
// view.test.ts
fitView({ x: 0, y: 0, width: 400, height: 200 }, { width: 1000, height: 600 }, 48) // zoom 2.26, panX 48, panY 74 (toBeCloseTo)
fitView({ x: 0, y: 0, width: 10000, height: 10000 }, { width: 1000, height: 600 }).zoom   // 0.1 (clamped)
fitView({ x: 0, y: 0, width: 0, height: 0 }, { width: 1000, height: 600 })               // { zoom: 1, panX: 500, panY: 300 }
zoomAt({ zoom: 1, panX: 0, panY: 0 }, { x: 100, y: 100 }, 2)                              // { zoom: 2, panX: -100, panY: -100 }
zoomAt({ zoom: 1, panX: 0, panY: 0 }, { x: 100, y: 100 }, 100).zoom                       // 4
worldToScreen(v, screenToWorld(v, p)) equals p (toBeCloseTo) for v = { zoom: 2.5, panX: 30, panY: -12 }, p = { x: 77, y: 9 }
wheelFactor(100, 0) // exp(-0.2), about 0.8187;  wheelFactor(-100, 0) // about 1.2214
wheelFactor(3, 1)   // exp(-48 * 0.002);        wheelFactor(1, 2) // exp(-100 * 0.002)
// storage.test.ts (use an in-memory store object and a store whose methods throw)
saveDoc(mem, 'x') === true and loadDoc(mem) === 'x';  loadDoc(mem2) === null when nothing was saved
loadDoc(throwingStore) === null;  saveDoc(throwingStore, 'x') === false;  saveDoc(null, 'x') === false   // Review Focus 5
loadSettings(emptyStore)                      // { theme: 'auto', anim: DEFAULT_ANIM }
loadSettings(store holding '{bad json')       // the same defaults
loadSettings(store holding '{"theme":"nope","anim":{"style":"dash","speed":99,"density":0,"glow":true}}')
  // { theme: 'auto', anim: { style: 'dash', speed: 3, density: 1, glow: true } }
loadSettings(store holding '{"theme":"lagoon","anim":{"style":"pulse","speed":1,"density":4,"glow":false}}').theme   // 'lagoon'
// state.test.ts (testMeasure)
const s1 = applyText(createState('flowchart TD\nA-->B', defaults), 'flowchart TD\nA-->B', testMeasure);
const s2 = applyText(s1, 'sequenceDiagram', testMeasure);
expect(s2.doc.ok).toBe(false);  expect(s2.scene).toBe(s1.scene);                          // last good scene kept
const s3 = applyText(s2, 'flowchart TD\nX', testMeasure);
expect(s3.scene).not.toBe(s1.scene);  expect(s3.scene!.doc.nodes.map(n => n.id)).toEqual(['X']);
expect(s1.text).toBe('flowchart TD\nA-->B');                                              // input not mutated

```

* [x] **Step 2: Write the failing browser tests** `tests/e2e/preview.spec.ts` (open `/?e2e=1`):

  * The page loads; `#source` contains the sample text; the canvas has more than 100 non-background pixels (read `getImageData` inside `page.evaluate`).

  * After `__studio.setText('flowchart LR\nX-->Y')` and 400 ms, `__studio.getSummary()` is `{ nodes: ['X','Y'], edges: 1, ok: true }`.

  * After `setText('sequenceDiagram')` and 400 ms, `#diagnostics li` has text starting `Line 1: Only flowchart diagrams are supported`, and the canvas still has non-background pixels (the last good picture stays).

  * Autosave: set text, wait 800 ms, reload; `#source` has the same text.

  * Storage failure (Review Focus 5): use `context.addInitScript` to make `Storage.prototype.setItem` throw; load, type something, wait 1 s; `#message` contains `Browser storage is unavailable, so autosave is off.` and the page still works.

  * Animation: with style `pulse` and not paused, two `canvas.toDataURL()` snapshots 500 ms apart differ; after clicking `#anim-pause`, two snapshots 300 ms apart are equal.

  * Wheel zoom: dispatch a wheel event with `deltaY = -200` over the canvas; `__studio.getView().zoom` is larger than before.

  * Typing 1000 characters of valid text keeps the page responsive (no error in the console).

* [x] **Step 3: Run** `npx vitest run src/editor src/app` and `npm run test:e2e`. Expected: FAIL.

* [x] **Step 4: Implement** the view maths, storage, state, then the page (`ui.ts` builds the DOM and wires events; `main.ts` only starts it). Create `src/app/tokens.css` with exactly the content shown under "Visual identity" in Part 2 and import it from `main.ts` before `style.css`. Keep `style.css` minimal for now: a two-column layout (text left, canvas right, stacking vertically under 900 px wide) and visible `:focus-visible` outlines, taking every colour from the tokens (`var(--text-main)`, `var(--card-background)` and so on; never write a colour value in a stylesheet). Task 22 puts the site header and footer around this page and replaces `style.css` with the full skin, using the same tokens.

* [x] **Step 5: Run** `npm test` then `npm run test:e2e`. Expected: PASS.

* [x] **Step 6: Commit.** `git add -A && git commit -m "feat: app shell with live animated preview"`

### Task 13: Undo and redo, selection, drag to move (pins)

**Delivers:** part of F5 (move, select, undo, redo), F4 (pins), F6 (sync on edits).

**Files:**

* Create: `src/editor/history.ts`, `src/editor/controller.ts`

* Modify: `src/app/state.ts`, `src/app/ui.ts`, `src/app/main.ts`

* Test: `src/editor/history.test.ts`, `src/editor/controller.test.ts`, `tests/e2e/drag.spec.ts`

**Interfaces:**

* Consumes: `applyOp`, `hitTest`, `withNodeAt`, `buildScene`, `MESSAGES`, `LIMITS.undoDepth`.

* Produces:

```
// history.ts
export interface History { past: string[]; present: string; future: string[] }
export function createHistory(text: string): History;
export function pushText(h: History, text: string, opts?: { coalesce?: boolean }): History;
export function undo(h: History): History;
export function redo(h: History): History;
export function canUndo(h: History): boolean;
export function canRedo(h: History): boolean;
// controller.ts
export interface EditorState {
  selection: Selection | null;
  drag: { nodeId: string; grab: Point; start: Point; current: Point; moved: boolean } | null;
  pan: { last: Point } | null;
  connect: { fromId: string; to: Point } | null;                                   // Task 14
  editing: { kind: 'node' | 'edge' | 'group'; id: string; initial: string } | null; // Task 14
}
export type EditorEvent =
  | { type: 'pointerDown'; world: Point; screen: Point; button: number; space: boolean }
  | { type: 'pointerMove'; world: Point; screen: Point }
  | { type: 'pointerUp'; world: Point; screen: Point }
  | { type: 'keyDown'; key: string }
  | { type: 'textChanged' };
export type EditorEffect =
  | { type: 'applyOp'; op: TextOp }
  | { type: 'panBy'; dx: number; dy: number }
  | { type: 'message'; text: string };
export interface EditorEnv { scene: Scene; ok: boolean; measure: MeasureText }
export function createEditorState(): EditorState;
export function reduce(state: EditorState, event: EditorEvent, env: EditorEnv): { state: EditorState; effects: EditorEffect[] };

```

(Task 14 adds more event and effect variants to these unions.)

**History rules:** `pushText` does nothing when `text === present`. Otherwise `past = [...past, present]`, `present = text`, `future = []`; if `past.length > LIMITS.undoDepth`, drop the oldest entries. With `coalesce: true` and a non-empty `past`, replace `present` instead of pushing (used to merge a burst of typing into one undo step). `undo` moves `present` onto `future` and takes the last `past` entry as `present`; `redo` does the reverse; both return the input unchanged when there is nothing to do.

**Reducer rules:**

* `pointerDown`, button 0, no `space`: `hit = hitTest(env.scene, world, selectedNodeId)` where `selectedNodeId` is the selected node's id when `selection.kind === 'node'`, else null (Task 14 uses the handle). Hit `node`: set `selection`; if `!env.ok`, return the effect `{ type: 'message', text: MESSAGES.fixTextFirst }` and no drag; else set `drag = { nodeId, grab: world - nodeCenter, start: world, current: world, moved: false }`. Hit `edge` or `group`: set `selection`. No hit: `selection = null` and `pan = { last: screen }`. Button 1 (middle) or `space`: `pan = { last: screen }`.

* `pointerMove`: with `drag`, set `current = world`; once the distance from `start` exceeds 3 world pixels, `moved = true`. With `pan`, emit `{ type: 'panBy', dx: screen.x - last.x, dy: screen.y - last.y }` and update `last`.

* `pointerUp`: if `drag.moved`, emit `{ type: 'applyOp', op: { type: 'setPin', id, x: Math.round(current.x - grab.x), y: Math.round(current.y - grab.y) } }`. Always clear `drag` and `pan`.

* `keyDown` `Escape`: clear `selection`, `drag`, `pan`.

* `textChanged`: clear `drag`, `pan`, `connect`, `editing` (so typing in the text during a drag cancels the drag).

**App wiring:**

1. `AppState` gains `history: History` and `editor: EditorState`. One function `commitText(state, text, source)` is the only way text changes: it calls `applyText`, then `pushText` (with `coalesce: true` when `source === 'typing'` and the previous commit was typing less than 1000 ms ago), then schedules autosave. Typing, operations, undo, redo, open and (later) templates and share links all go through it. After every commit, send the editor a `textChanged` event only when the source is `typing`, `undo`, `redo`, `open`, `template` or `share` (not `op`).

2. Pointer events on `#canvas` are converted to world coordinates with `screenToWorld`, passed to `reduce`, and the effects are executed: `applyOp` calls `applyOp(state.text, op)`; on `{ error }` show it in `#message`, on `{ text }` call `commitText(state, result.text, 'op')`.

3. While `drag` is set and `moved` is true, render `withNodeAt(scene, drag.nodeId, current - grab, measure)` instead of the stored scene. The stored scene does not change until the drop.

4. `#btn-undo` and `#btn-redo` (enabled by `canUndo` and `canRedo`) and the keys Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z and Ctrl+Y act on the history when focus is not in a text field. After `undo` or `redo`, set the textarea to the new `present` and call `applyText`.

5. `#btn-autolayout` applies `{ type: 'clearPins' }`.

6. Selection is drawn through `DrawOptions.selection`; `window.__studio.getSelection()` returns it.

* [x] **Step 1: Write the failing tests.**

```
// history.test.ts
let h = createHistory('a'); h = pushText(h, 'b'); h = pushText(h, 'c');
expect([h.past, h.present, h.future]).toEqual([['a', 'b'], 'c', []]);
h = undo(h);  expect([h.present, h.future]).toEqual(['b', ['c']]);
h = redo(h);  expect(h.present).toBe('c');
expect(pushText(h, 'c')).toBe(h);                                    // same text: unchanged object
h = undo(undo(h)); h = pushText(h, 'z');  expect(h.future).toEqual([]);  // new edit clears redo
expect(undo(createHistory('a')).present).toBe('a');
let big = createHistory('t0'); for (let i = 1; i <= 205; i++) big = pushText(big, 't' + i);
expect(big.past.length).toBe(200); expect(big.past[0]).toBe('t5');
let d = pushText(createHistory('a'), 'x'); d = pushText(d, 'xy', { coalesce: true }); d = pushText(d, 'xyz', { coalesce: true });
expect([d.past, d.present]).toEqual([['a'], 'xyz']);
// controller.test.ts (scene = buildScene(parseMermaid('flowchart TD\nA-->B'), testMeasure); env = { scene, ok: true, measure: testMeasure })
const a = scene.layout.nodes.A.center;
down on A -> selection { kind: 'node', id: 'A' }, drag set, effects []
move by 2 px -> drag.moved false;  move by 20 px -> drag.moved true
up after the 20 px move -> effects [{ type: 'applyOp', op: { type: 'setPin', id: 'A', x: Math.round(a.x + 20), y: Math.round(a.y) } }], drag null
up without a move -> effects []
down on empty space -> selection null, pan set; move by screen (+10, +5) -> effect { type: 'panBy', dx: 10, dy: 5 }
down on A with env.ok false -> effects [{ type: 'message', text: MESSAGES.fixTextFirst }], drag null
textChanged during a drag -> drag null                                // Review Focus 3
keyDown 'Escape' -> selection null
down with button 1 on a node -> pan set, no selection change to that node

```

`tests/e2e/drag.spec.ts` (`/?e2e=1`, text `flowchart TD\nA-->B`):

* Drag node A by 60 px: afterwards `#source` contains the line `%% studio:pos A ` and the marker `%% studio:layout v1`; `getSummary().ok` is true; the A→B arrow still connects (take two canvas snapshots, they differ from the pre-drag one).

* Click `#btn-undo`: `#source` equals the exact text from before the drag. Click `#btn-redo`: the pos line is back.

* Mid-drag, call `__studio.setText('flowchart TD\nX')` then release the mouse: `#source` has no pos line for A and contains node X (Review Focus 3).

* Make the text invalid (`__studio.setText('nonsense')`), try to drag: no pos line is added and `#message` shows `Fix the errors in the text first.`

* Click `#btn-autolayout` after a drag: the pos lines and marker are gone.

* [x] **Step 2: Run** `npx vitest run src/editor` and the new e2e file. Expected: FAIL.

* [x] **Step 3: Implement** `history.ts`, `controller.ts` and the app wiring.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: selection, drag to move, undo and redo"`

### Task 14: Connect, add, delete, rename in place, properties panel

**Delivers:** the rest of F5.

**Files:**

* Create: `src/app/properties.ts`

* Modify: `src/editor/controller.ts`, `src/app/ui.ts`, `src/app/main.ts`, `src/app/style.css`, `index.html`

* Test: `src/editor/controller.test.ts` (extend), `tests/e2e/edit.spec.ts`

**Interfaces:**

* Consumes: Task 13 (`reduce`, `EditorState`, `commitText`), `applyOp`, `handlePoint`, `hitTest`, `MESSAGES`.

* Produces: these additions to the unions of Task 13:

```
// EditorEvent additions
| { type: 'dblClick'; world: Point }
| { type: 'commitEdit'; text: string }
| { type: 'cancelEdit' }
// EditorEffect additions
| { type: 'addNodeAt'; at: Point; shape: ShapeKind }
| { type: 'addConnectedNode'; fromId: string; at: Point }
| { type: 'startEdit'; kind: 'node' | 'edge' | 'group'; id: string; initial: string }

```

**Reducer rules (all text-changing results are refused with `{ type: 'message', text: MESSAGES.fixTextFirst }` when `env.ok` is false):**

* `pointerDown` (button 0, no space): hit-test with `selectedNodeId`. A `handle` hit sets `connect = { fromId, to: world }` and changes nothing else.

* `pointerMove` with `connect`: `connect.to = world`.

* `pointerUp` with `connect`: `target = hitTest(scene, world, null)`. Target `node`: effect `applyOp addEdge { from: fromId, to: target.id }` (a self-loop is allowed). Target `null`: effect `addConnectedNode { fromId, at: world }`. Any other target: no effect. Then `connect = null`.

* `dblClick`: hit-test with no handle. `node`: `editing = { kind: 'node', id, initial: label }` and effect `startEdit`. `edge`: same with the edge label. `group`: same with the group title. No hit: effect `addNodeAt { at: world, shape: 'rect' }`.

* `keyDown`, ignored while `editing` is set: `Delete` or `Backspace` with a selected node: `applyOp deleteNode`; selected edge: `applyOp deleteEdge { index: Number(id.slice(1)) }`; selected group: `{ type: 'message', text: MESSAGES.groupsInText }`. After a delete, `selection = null`. `Enter` with any selection: set `editing` and emit `startEdit` as for `dblClick`.

* `commitEdit`: by `editing.kind`: `renameNode`, `renameEdge` (index from the id) or `renameGroup`. Then `editing = null`. If the text equals `editing.initial`, emit no effect.

* `cancelEdit`: `editing = null`.

**App wiring:**

1. `addNodeAt`: apply `{ type: 'addNode', label: 'New', shape, pin: { x: round(at.x), y: round(at.y) } }`, commit, select the created id, then open the in-place editor for it.

2. `addConnectedNode`: apply `addNode` (label `New`, shape `rect`, pin at the drop point), then apply `addEdge` from `fromId` to the created id to the *result*, and commit **once** with the final text (one undo step). Select the new node and open the editor.

3. In-place editor: a `<textarea id="inline-edit">` positioned over the target (node: its screen rectangle; edge: centred on the label point, at least 80 px wide; group: the title band). Enter commits (`commitEdit`); Shift+Enter inserts a newline (nodes only); Escape sends `cancelEdit`; blur commits. Its value is selected on open.

4. Properties panel `#props`, shown only while something is selected, disabled while the text has errors:

   * Node: `#prop-label` (rename on Enter or blur); `#prop-shape` (select; options labelled Rectangle, Rounded, Stadium, Circle, Diamond, Hexagon, Parallelogram, Parallelogram reversed, Cylinder, Subroutine, in `ShapeKind` order) sends `setShape`; `#prop-fill` and `#prop-stroke` (`<input type="color">`, on `change`) send `setNodeStyle` with `{ fill }` or `{ stroke }`; `#prop-clear-colours` sends `setNodeStyle { fill: '', stroke: '' }`; `#prop-delete` deletes.

   * Edge: `#prop-label`; `#prop-kind` (select; Arrow, Line, Dotted arrow, Dotted line, Thick arrow, Thick line, Circle end, Cross end, Both ways, in `EdgeKind` order) sends `setEdgeKind`; `#prop-reverse` sends `reverseEdge`; `#prop-delete`.

   * Group: `#prop-label` sends `renameGroup`.

   * A colour input starts at the node's effective colour when it is a `#rrggbb` or `#rgb` value (expand `#rgb`), otherwise at the theme's colour.

5. Toolbar `#add-shape` (the same shape select) and `#btn-add-node` run `addNodeAt` at the world position of the canvas centre.

6. A document-level `keydown` listener sends keys to the reducer, but ignores events whose target is an `input`, `textarea` or `select`, except `Escape`.

7. After any operation, keep the selection if its id still exists; otherwise clear it.

* [x] **Step 1: Write the failing tests.** Extend `controller.test.ts` (scene from `'flowchart TD\nA-->B'`, `env.ok` true unless stated):

```
// selection of A is set first; hp = handlePoint(doc, boxA)
down at hp                       -> connect { fromId: 'A' }, selection still A, effects []
up on B's centre                 -> effects [{ type: 'applyOp', op: { type: 'addEdge', from: 'A', to: 'B' } }], connect null
up on empty space (world w)      -> effects [{ type: 'addConnectedNode', fromId: 'A', at: w }]
up on A's centre                 -> effects [{ type: 'applyOp', op: { type: 'addEdge', from: 'A', to: 'A' } }]
dblClick on A                    -> editing { kind: 'node', id: 'A', initial: 'A' }, effects [{ type: 'startEdit', kind: 'node', id: 'A', initial: 'A' }]
dblClick on the edge midpoint    -> editing { kind: 'edge', id: 'e0', initial: '' }
dblClick on empty space          -> effects [{ type: 'addNodeAt', at: <that point>, shape: 'rect' }]
keyDown 'Delete', node A selected -> [{ applyOp deleteNode A }], selection null
keyDown 'Delete', edge e1 selected -> [{ applyOp deleteEdge index 1 }]
keyDown 'Delete', a group selected -> [{ type: 'message', text: MESSAGES.groupsInText }]
keyDown 'Enter', node A selected -> editing set, effect startEdit
commitEdit 'Beta' after startEdit on A -> [{ applyOp renameNode A 'Beta' }], editing null
commitEdit with the unchanged text -> []
cancelEdit -> editing null
keys are ignored while editing is set
env.ok false: Delete -> [{ message fixTextFirst }]; dblClick -> [{ message fixTextFirst }]; handle down -> [{ message fixTextFirst }]

```

`tests/e2e/edit.spec.ts` (`/?e2e=1`; screen positions come from `__studio.getNodeScreenCenter` and `getEdgeScreenMid`; the handle of a node in a top-to-bottom diagram is at its bottom centre):

 1. Text `flowchart TD\nA\nB`. Click A. Drag from A's handle to B's centre: `#source` now contains the line `A --> B`.

 2. Drag from A's handle to empty space: the text gains `n1[New]` and `A --> n1` and a `%% studio:pos n1` line, and `#inline-edit` is visible. Type `Next`, press Enter: the text contains `n1[Next]`. One click on undo removes the node, the arrow and the pin in a single step.

 3. Double-click empty canvas: a node `n1[New]` is added and the editor opens.

 4. Double-click A, type `Alpha`, Enter: the text contains `A[Alpha]`.

 5. Select A, press Delete: no line of the text mentions `A` any more.

 6. Select A, choose Diamond in `#prop-shape`: the text contains `A{A}`.

 7. Select A, set `#prop-fill` to `#ffcc00`: the text contains `style A fill:#ffcc00`.

 8. Text `flowchart TD\nA-->B`: click the edge midpoint; choose Dotted arrow in `#prop-kind`: the text has `A -.-> B`; click `#prop-reverse`: `B -.-> A`; click `#prop-delete`: the text has the standalone lines `A` and `B` and no arrow.

 9. After any of the operations above, clicking `#btn-undo` restores the text exactly as it was before (Review Focus 3).

10. `__studio.setText('nonsense')`: `#props` is hidden or its controls are disabled; pressing Delete or double-clicking the canvas shows `Fix the errors in the text first.` and changes nothing.

11. With the `CORPUS[1]` text, click a group's title band and press Delete: `#message` shows `Groups are edited in the text.` and the text is unchanged.

* [x] **Step 2: Run** `npx vitest run src/editor` and `npx playwright test tests/e2e/edit.spec.ts`. Expected: FAIL.

* [x] **Step 3: Implement** the reducer additions, `properties.ts` and the wiring.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: connect, add, delete, rename in place and properties panel"`

### Task 15: Export framework and PNG

**Delivers:** F11.

**Files:**

* Create: `src/render/frame.ts`, `src/export/filename.ts`, `src/export/download.ts`, `src/export/png.ts`, `src/app/export-panel.ts`

* Modify: `src/app/ui.ts`, `src/app/main.ts`, `index.html`, `src/app/style.css`

* Test: `src/render/frame.test.ts`, `src/export/filename.test.ts`, `tests/e2e/export-png.spec.ts`

**Interfaces:**

* Consumes: `Scene`, `Theme`, `ExportMode`, `ExportFrame`, `EXPORT`, `MESSAGES`, `drawBackground`, `drawScene`, `emptyFrame`.

* Produces:

```
// frame.ts (pure)
export function isEmptyBounds(b: Rect): boolean; // width === 0 && height === 0
export function exportFrame(bounds: Rect, mode: ExportMode, scale: number): ExportFrame; // bounds must not be empty
export function viewForFrame(frame: ExportFrame): ViewState;
export function fitToPixels(width: number, height: number, maxPixels: number): number;   // 1 when it fits, else sqrt(maxPixels / (width*height))
export function chooseScale(bounds: Rect, mode: ExportMode, requested: number): { scale: number; reduced: boolean };
// filename.ts (pure)
export function safeFilename(name: string, ext: string): string;
// download.ts
export function downloadBlob(blob: Blob, filename: string): void;
// png.ts
export interface PngOptions { mode: ExportMode; scale: number; transparent: boolean }
export function exportPng(scene: Scene, theme: Theme, opts: PngOptions): Promise<{ blob: Blob; scaleUsed: number; reduced: boolean }>;

```

**`exportFrame` rules** (`m = EXPORT.margin`):

* `'content'`: `world = { x: b.x - m, y: b.y - m, width: b.width + 2m, height: b.height + 2m }`; `zoom = scale`; `pixelWidth = Math.ceil(world.width * scale)`; `pixelHeight = Math.ceil(world.height * scale)`.

* `'slide'`: `zoom0 = Math.min(slideWidth / (b.width + 2m), slideHeight / (b.height + 2m))`; `zoom = zoom0 * scale`; `pixelWidth = slideWidth * scale`; `pixelHeight = slideHeight * scale`; `world.width = slideWidth / zoom0`; `world.height = slideHeight / zoom0`; `world.x = (b.x + b.width/2) - world.width/2`; `world.y = (b.y + b.height/2) - world.height/2`. (The picture is scaled to fit and centred.)

**`viewForFrame`:** `{ zoom: frame.zoom, panX: -world.x * zoom, panY: -world.y * zoom }`.

**`chooseScale`:** for `s` from `requested` down to 1 (integers): `frame = exportFrame(bounds, mode, s)`; if `max(pixelWidth, pixelHeight) <= EXPORT.pngMaxSide` and `pixelWidth * pixelHeight <= EXPORT.pngMaxPixels`, return `{ scale: s, reduced: s !== requested }`. If none fits: take the frame at scale 1, `f = Math.min(pngMaxSide / max(pw, ph), Math.sqrt(pngMaxPixels / (pw * ph)))`, and return `{ scale: Math.floor(f * 100) / 100, reduced: true }`.

**`safeFilename(name, ext)`:** lower-case the trimmed name; if it ends with `.` + `ext`, remove that ending; replace every run of characters outside `[a-z0-9._-]` with `-`; collapse repeated `-`; remove leading and trailing `-` and `.`; if nothing is left use `diagram`; return `base + '.' + ext`.

**`downloadBlob`:** `url = URL.createObjectURL(blob)`; create an `<a>` with `href = url` and `download = filename`, append it to the body, `click()`, remove it, and call `URL.revokeObjectURL(url)` after 10 seconds (`setTimeout`).

**`exportPng`:** `{ scale, reduced } = chooseScale(bounds, mode, scale)`; `frame = exportFrame(bounds, mode, scale)`; create a canvas of `pixelWidth` by `pixelHeight`; `ctx.setTransform(1,0,0,1,0,0)`; `drawBackground(ctx, theme, w, h, transparent)`; `drawScene(ctx, scene, theme, viewForFrame(frame), emptyFrame(), { transparent, selection: null, handleNodeId: null, connectPreview: null, focus: null, showGlow: false })`; `blob = await new Promise(r => canvas.toBlob(r, 'image/png'))`; throw an `Error('PNG encoding failed')` when `blob` is null.

**Export panel** (`createExportPanel`, a `<dialog id="export-panel">` opened by `#btn-export`; later tasks add buttons to it): `#export-name` (text, default `diagram`), `#export-mode` (select: `content` "Fit to content", `slide` "16:9 slide frame"), `#export-scale` (select: 1x, 2x, 3x), `#export-transparent` (checkbox "Transparent background"), `#export-png` (button "Save as PNG"), `#export-progress` (a `<progress>` element, hidden when idle), `#export-cancel`, `#export-close`, and a message line `#export-message` with `aria-live="polite"`. When the dialog opens and there is no scene or `isEmptyBounds(scene.layout.bounds)`, disable every save button and show `MESSAGES.nothingToExport`. `#export-png` runs `exportPng` and `downloadBlob(blob, safeFilename(name, 'png'))`; when `reduced`, show `MESSAGES.pngReduced(scaleUsed)`. Also expose `window.__studio.getExportSize(mode, scale)` returning `{ width, height }` from `exportFrame`. Move the minimal `downloadBlob` written in Task 12 into `download.ts`.

* [x] **Step 1: Write the failing tests.**

```
// frame.test.ts
exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'content', 1)
  // { world: { x: -32, y: -32, width: 464, height: 264 }, pixelWidth: 464, pixelHeight: 264, zoom: 1 }
exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'content', 2)   // pixelWidth 928, pixelHeight 528, zoom 2
const sl = exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'slide', 1);
// pixelWidth 1280, pixelHeight 720, zoom about 2.7273, world.height 264, world.width about 469.33,
// world.x about -34.67, world.y -32  (use toBeCloseTo)
exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'slide', 2)     // pixelWidth 2560, pixelHeight 1440
viewForFrame(exportFrame({ x: 0, y: 0, width: 400, height: 200 }, 'content', 2))  // { zoom: 2, panX: 64, panY: 64 }
isEmptyBounds({ x: 0, y: 0, width: 0, height: 0 })  // true
fitToPixels(3000, 2000, 2073600)  // about 0.5879 (toBeCloseTo 4 digits);  fitToPixels(100, 100, 2073600)  // 1
chooseScale({ x: 0, y: 0, width: 400, height: 200 }, 'content', 3)    // { scale: 3, reduced: false }
chooseScale({ x: 0, y: 0, width: 6000, height: 6000 }, 'content', 3)  // { scale: 1, reduced: true }
chooseScale({ x: 0, y: 0, width: 9000, height: 100 }, 'content', 1)   // { scale: 0.9, reduced: true }
chooseScale({ x: 0, y: 0, width: 400, height: 200 }, 'slide', 3).scale // 3
// filename.test.ts
safeFilename('My Diagram!', 'png')  // 'my-diagram.png'
safeFilename('', 'svg')             // 'diagram.svg'
safeFilename('a/b\\c', 'gif')       // 'a-b-c.gif'
safeFilename('  ', 'mp4')           // 'diagram.mp4'
safeFilename('Flow.PNG', 'png')     // 'flow.png'
safeFilename('ÜBER', 'png')         // 'ber.png'

```

`tests/e2e/export-png.spec.ts` (`/?e2e=1`):

* Open the panel, click `#export-png`: a download starts named `diagram.png`; its first 8 bytes are `89 50 4E 47 0D 0A 1A 0A`; the width and height stored in the IHDR chunk (big-endian 32-bit integers at byte offsets 16 and 20) equal `__studio.getExportSize('content', 1)`.

* Scale 2 gives exactly twice the width and height (within 1 pixel for rounding).

* Mode `slide` gives 1280 by 720; with scale 2, 2560 by 1440.

* Transparent: load the downloaded bytes into an `<img>` inside `page.evaluate`, draw it on a canvas and read pixel (0, 0): alpha is 0 when `#export-transparent` is checked and 255 when it is not.

* Name `My Flow` downloads as `my-flow.png`.

* Empty diagram (`__studio.setText('flowchart TD')`): opening the panel shows `Nothing to export. Add a node first.`, the save buttons are disabled and no download happens (Review Focus 4).

* [x] **Step 2: Run** `npx vitest run src/render/frame.test.ts src/export` and the e2e file. Expected: FAIL.

* [x] **Step 3: Implement** the files above, build the export panel and wire `#btn-export` and `#btn-save-mmd` to the shared `downloadBlob`.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: export panel and PNG export"`

### Task 16: SVG export

**Delivers:** F12.

**Files:**

* Create: `src/render/svg.ts`

* Modify: `src/app/export-panel.ts`

* Test: `src/render/svg.test.ts`, `tests/e2e/export-svg.spec.ts`

**Interfaces:**

* Consumes: Task 9 and Task 10 helpers (`shapePolygon`, `tangentAt`, `nodeStyle`, `edgeStyle`), `exportFrame` (Task 15), `THEMES`, `LAYOUT`, `EXPORT.svgDecimals`, `FONT_STACK_SANS`.

* Produces:

```
export interface SvgOptions { mode: ExportMode; transparent: boolean }
export function renderSvg(scene: Scene, theme: Theme, opts: SvgOptions, measure: MeasureText): string;
export function escapeXml(s: string): string; // & < > " ' become &amp; &lt; &gt; &quot; &apos;
export function fmt(n: number): string;       // round to EXPORT.svgDecimals, no trailing zeros, never '-0'

```

**The SVG file is static** (no animation, no glow). It must open correctly in a browser and in vector editors, so it uses only presentation attributes, no `<style>`, no `<script>`, no `<image>`, no `<filter>`, no external references, and no `dominant-baseline`.

**Document layout** (`frame = exportFrame(bounds, opts.mode, 1)`; every number goes through `fmt`; every piece of text goes through `escapeXml`):

1. Root: `<svg xmlns="http://www.w3.org/2000/svg" width="<pixelWidth>" height="<pixelHeight>" viewBox="<world.x> <world.y> <world.width> <world.height>" role="img" font-family="<FONT_STACK_SANS escaped>">`.

2. `<title>Flowchart</title>` and `<desc>Flowchart with N nodes and M arrows</desc>`.

3. Background, unless `transparent`: a `<rect>` covering the world rectangle with `fill` equal to `theme.background`. For a gradient theme, first add `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="A"/><stop offset="1" stop-color="B"/></linearGradient></defs>` and use `fill="url(#bg)"`.

4. Groups by ascending depth: `<rect x y width height rx="10" fill stroke stroke-width="1.5"/>` and `<text x="<x+12>" y="<y+groupTitleH/2>" dy="0.35em" font-size="14" font-weight="700" fill>Title</text>`.

5. Edges in `doc.edges` order, using `edgeStyle`: `<path d="M fx fy L tx ty" fill="none" stroke width stroke-linecap="round" [stroke-dasharray="3 5"]/>` for straight edges, `d="M fx fy Q cx cy tx ty"` for quad and loop edges. Heads use the same triangle as the canvas (tip at `to`, the other two points at `to - t*arrowSize ± n*arrowSize*0.4`): `<polygon points="tipX,tipY leftX,leftY rightX,rightY" fill="<edge colour>"/>`; a circle end is `<circle cx cy r="5" fill/>`; a cross end is one `<path d="M x1 y1 L x2 y2 M x3 y3 L x4 y4" stroke="<edge colour>" stroke-width="2" fill="none"/>`.

6. Edge labels after all edges: `<rect x y width height rx="4" fill="<edgeLabelBg>"/>` (width from `measure(label, 13) + 2*edgeLabelPadX`, height `edgeLabelH`, centred on `labelPoint`) and `<text x y dy="0.35em" text-anchor="middle" font-size="13" fill>label</text>`.

7. Nodes in `doc.nodes` order using `nodeStyle`:

| Shape | Element | 
| ----- | ----- | 
| rect | `<rect rx="4">` | 
| round | `<rect rx="12">` | 
| stadium | `<rect rx="<height/2>">` | 
| circle | `<ellipse cx cy rx="<w/2>" ry="<h/2>">` | 
| diamond, hexagon, parallelogram, parallelogramAlt | `<polygon points>` from `shapePolygon` | 
| cylinder | one `<path>`: `M l t+ry A rx ry 0 0 1 r t+ry L r b-ry A rx ry 0 0 1 l b-ry Z` for the body (with `rx = w/2`, `ry = 8`), then a second `<path d="M l t+ry A rx ry 0 0 0 r t+ry" fill="none">` for the front rim | 
| subroutine | `<rect rx="4">` plus two `<line>` elements at `x = l+8` and `x = r-8` from `t` to `b` | 

Each shape carries `fill`, `stroke` and `stroke-width` from `nodeStyle`. After it, one `<text x="<cx>" y="<cy + (k - (n-1)/2) * lineHeight>" dy="0.35em" text-anchor="middle" font-size="16" fill="<text colour>">` per label line. 8. Close with `</svg>`.

**Example structure** for `flowchart TD\nA[Start] --> B` in the Daylight theme (`N` stands for a number; the output has no whitespace between elements apart from what the format needs):

```
<svg xmlns="http://www.w3.org/2000/svg" width="N" height="N" viewBox="N N N N" role="img" font-family="system-ui, -apple-system, &#39;Segoe UI&#39;, Roboto, Helvetica, Arial, sans-serif">
<title>Flowchart</title><desc>Flowchart with 2 nodes and 1 arrows</desc>
<rect x="N" y="N" width="N" height="N" fill="#ffffff" />
<path d="M N N L N N" fill="none" stroke="#4f5660" stroke-width="2" stroke-linecap="round" />
<polygon points="N,N N,N N,N" fill="#4f5660" />
<rect x="N" y="N" width="N" height="N" rx="4" fill="#f7f7fb" stroke="#34495e" stroke-width="2" />
<text x="N" y="N" dy="0.35em" text-anchor="middle" font-size="16" fill="#111418">Start</text>
<rect x="N" y="N" width="N" height="N" rx="4" fill="#f7f7fb" stroke="#34495e" stroke-width="2" />
<text x="N" y="N" dy="0.35em" text-anchor="middle" font-size="16" fill="#111418">B</text>
</svg>
```

* [x] **Step 1: Write the failing tests** (`svg(text, opts?, theme?)` builds the scene with `testMeasure` and calls `renderSvg`; `count(s, needle)` counts occurrences):

```
fmt(1.5) // '1.5'      fmt(2) // '2'      fmt(-0) // '0'      fmt(3.14159) // '3.14'      fmt(0.004) // '0'
escapeXml(`a&b<c>"d'`) // 'a&amp;b&lt;c&gt;&quot;d&apos;'
const s = svg('flowchart TD\nA[Start] --> B{Check}');
expect(s.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
expect(s.endsWith('</svg>')).toBe(true);
expect(s).toContain('<title>Flowchart</title>');
expect(s).toContain('>Start</text>'); expect(s).toContain('>Check</text>');
count(s, '<rect ') === 2;  count(s, '<polygon ') === 2;  count(s, '<path ') === 1;   // background + node A; diamond + arrow head; one edge
svg('flowchart TD\nA["a & b < c"]') contains 'a &amp; b &lt; c' and does not contain 'a & b'          // Review Focus 4
svg('flowchart TD\nA -.-> B') contains 'stroke-dasharray="3 5"'
svg('flowchart TD\nA ==> B') contains 'stroke-width="4"'
svg('flowchart TD\nA --> B', { mode: 'content', transparent: true }): count('<rect ') is one fewer than with transparent false; no 'url(#bg)'
svg('flowchart TD\nA', { mode: 'content', transparent: false }, THEMES.lagoon) contains '<linearGradient id="bg"' and 'fill="url(#bg)"'
svg('flowchart TD\nA', { mode: 'slide', transparent: false }) contains 'width="1280" height="720"'
svg('flowchart TD\nA[(DB)]') contains two '<path ' elements; svg('flowchart TD\nA[[S]]') contains two '<line '
svg('flowchart TD\nA --o B') contains '<circle ';  svg('flowchart TD\nA <--> B') has two arrow-head polygons
svg('flowchart TD\nA -->|yes| B') contains '>yes</text>'
// for every CORPUS diagram with ok === true: the string contains none of 'NaN', 'undefined', 'Infinity', '-0 ',
// and the number of '<text ' elements is at least the number of nodes
// deterministic: two calls give identical strings

```

`tests/e2e/export-svg.spec.ts`:

* Open the panel, click `#export-svg`: a download named `diagram.svg` starts. Parse its text in the page with `new DOMParser().parseFromString(text, 'image/svg+xml')`: there is no `parsererror` element; the root `width` and `height` equal `__studio.getExportSize('content', 1)`.

* Load the SVG as an `<img>` (via a blob URL), draw it on a canvas and check that the number of non-background pixels is above 100 (it really renders).

* Mode `slide` gives `width="1280" height="720"`; the transparent checkbox removes the background `<rect>`.

* Text with `&` and `<` in a label (`A["x & y < z"]`) still parses as valid XML.

* Empty diagram: the SVG button is disabled (as in Task 15).

* Manual check (record the result in `DECISIONS.md`): open the file in your slide tool and in a vector editor if you have them; note whether text keeps its font.

* [x] **Step 2: Run** `npx vitest run src/render/svg.test.ts`. Expected: FAIL.

* [x] **Step 3: Implement** `svg.ts`; add `#export-svg` ("Save as SVG") to the panel; its blob type is `image/svg+xml;charset=utf-8` and its name comes from `safeFilename(name, 'svg')`.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: SVG export"`

### Task 17: GIF export

**Delivers:** F13.

**Files:**

* Create: `src/export/gif.ts`, `src/export/draw-frame.ts`, `tests/support/parse-gif.ts`

* Modify: `src/app/export-panel.ts`

* Test: `src/export/gif.test.ts`, `src/export/draw-frame.test.ts`, `tests/e2e/export-gif.spec.ts`

**Interfaces:**

* Consumes: `exportFrame`, `viewForFrame`, `fitToPixels`, `loopSeconds`, `frameState`, `drawBackground`, `drawScene`, `GIFEncoder`, `quantize`, `applyPalette` from `gifenc`, `EXPORT`, `MESSAGES`.

* Produces:

```
export interface GifOptions { mode: ExportMode; fps: number }
export interface GifPlan { frames: number; delayCs: number; width: number; height: number; zoom: number; reduced: boolean }
export function gifPlan(bounds: Rect, mode: ExportMode, anim: AnimSettings, fps: number): GifPlan;
export function yieldToEventLoop(): Promise<void>; // MessageChannel based
// draw-frame.ts (shared with video export in Task 20)
export function drawExportFrame(
  ctx: CanvasRenderingContext2D, scene: Scene, theme: Theme, anim: AnimSettings,
  view: ViewState, phase: number, width: number, height: number,
): void;
export function exportGif(
  scene: Scene, theme: Theme, anim: AnimSettings, opts: GifOptions,
  onProgress: (done: number, total: number) => void, signal: AbortSignal,
): Promise<{ blob: Blob; reduced: boolean }>;
// tests/support/parse-gif.ts
export function parseGif(bytes: Uint8Array): { width: number; height: number; frames: number; delays: number[]; loop: boolean };

```

**`gifPlan` algorithm:**

1. `frame = exportFrame(bounds, mode, 1)`; `width = frame.pixelWidth`, `height = frame.pixelHeight`, `zoom = frame.zoom`.

2. If `width * height > EXPORT.gifMaxPixels`: `f = fitToPixels(width, height, EXPORT.gifMaxPixels)`; `width = Math.floor(width * f)`, `height = Math.floor(height * f)`, `zoom = zoom * f`, `reduced = true`.

3. `loop = loopSeconds(anim)`; `frames = Math.max(1, Math.min(EXPORT.gifMaxFrames, Math.round(loop * fps)))`; `delayCs = Math.max(2, Math.round(loop * 100 / frames))`. (2 centiseconds is the smallest delay that browsers honour.)

**`exportGif` algorithm:**

1. `plan = gifPlan(bounds, mode, anim, opts.fps)`. Create a canvas of `width` by `height` and a 2D context with `{ willReadFrequently: true }`.

2. A frame is drawn by `drawExportFrame(ctx, scene, theme, anim, view, phase, w, h)` with `view = { zoom: plan.zoom, panX: -world.x * plan.zoom, panY: -world.y * plan.zoom }` (`world` comes from `exportFrame(bounds, mode, 1)`) and `phase = i / plan.frames`. `drawExportFrame` does exactly this, in this order: `ctx.setTransform(1,0,0,1,0,0)`; `drawBackground(ctx, theme, width, height, false)`; `drawScene(ctx, scene, theme, view, frameState(scene, anim, phase), { transparent: false, selection: null, handleNodeId: null, connectPreview: null, focus: null, showGlow: anim.glow })`.

3. **Shared palette:** render up to four sample frames (`i = 0, N/4, N/2, 3N/4`, rounded down) and concatenate their RGBA bytes; `palette = quantize(allRgba, 256)`.

4. For each frame `i` in `0 .. frames - 1`: render it, `rgba = ctx.getImageData(0, 0, w, h).data`, `index = applyPalette(rgba, palette)`, then `encoder.writeFrame(index, w, h, { palette: i === 0 ? palette : undefined, delay: plan.delayCs * 10, repeat: 0 })`. (`delay` is in milliseconds in gifenc; the test below proves it. `repeat: 0` loops forever.) After each frame call `onProgress(i + 1, frames)`, then `await yieldToEventLoop()`; if `signal.aborted`, throw `new DOMException('Cancelled', 'AbortError')`.

5. `encoder.finish()`; return `{ blob: new Blob([encoder.bytes()], { type: 'image/gif' }), reduced }`.

6. `yieldToEventLoop` is `new Promise(r => { const c = new MessageChannel(); c.port1.onmessage = () => { c.port1.close(); r(); }; c.port2.postMessage(0); })` (closing the port lets Node exit cleanly in tests). Do not use `setTimeout` for this: browsers slow timers down in background tabs, which would stall the export (Review Focus 4).

**`parseGif(bytes)` algorithm:**

1. The first 6 bytes must be `GIF89a` or `GIF87a`. `width` and `height` are little-endian 16-bit integers at offsets 6 and 8. `flags = bytes[10]`. `pos = 13`; if `flags & 0x80`, `pos += 3 * 2 ** ((flags & 7) + 1)`.

2. Loop while `pos < bytes.length`: `b = bytes[pos]`.

   * `0x3B`: stop.

   * `0x21` (extension): `label = bytes[pos + 1]`. If `label === 0xF9`, push the little-endian 16-bit value at `pos + 4` onto `delays` (centiseconds). If `label === 0xFF` and the next bytes spell `NETSCAPE2.0`, set `loop = true`. Then `pos += 2` and skip sub-blocks: `while (bytes[pos] !== 0) pos += bytes[pos] + 1; pos += 1`.

   * `0x2C` (image): `frames += 1`; `local = bytes[pos + 9]`; `pos += 10`; if `local & 0x80`, `pos += 3 * 2 ** ((local & 7) + 1)`; `pos += 1` (LZW code size); skip sub-blocks as above.

   * Anything else: throw an error.

3. Return `{ width, height, frames, delays, loop }`.

* [x] **Step 1: Write the failing tests.**

```
// gif.test.ts (plans use bounds { x: 0, y: 0, width: 400, height: 200 }, so the content frame is 464 by 264)
gifPlan(b, 'content', { ...DEFAULT_ANIM, speed: 1 }, 20)    // { frames: 80, delayCs: 5, width: 464, height: 264, reduced: false }
gifPlan(b, 'content', { ...DEFAULT_ANIM, speed: 1 }, 25)    // frames 100, delayCs 4
gifPlan(b, 'content', { ...DEFAULT_ANIM, speed: 1 }, 10)    // frames 40, delayCs 10
gifPlan(b, 'content', { ...DEFAULT_ANIM, speed: 0.25 }, 25) // frames 300, delayCs 5
const big = gifPlan({ x: 0, y: 0, width: 2936, height: 1936 }, 'content', DEFAULT_ANIM, 20); // frame 3000 by 2000
expect(big.reduced).toBe(true); expect(big.width * big.height).toBeLessThanOrEqual(2073600);
await expect(yieldToEventLoop()).resolves.toBeUndefined();
// draw-frame.test.ts (recording context from Task 10): for a scene of 'flowchart TD\nA-->B', view { zoom: 2, panX: 5, panY: 7 }, phase 0
//   the first call is setTransform(1,0,0,1,0,0); then set:fillStyle '#ffffff' and fillRect(0, 0, w, h);
//   then translate(5, 7) and scale(2, 2) occur before any fillText;  fillText was called for 'A' and 'B'.
// the unit of gifenc's delay, proven with parseGif (this test uses gifenc directly, in Node)
const g = GIFEncoder(); const palette = [[0, 0, 0], [255, 255, 255]]; const idx = new Uint8Array(16);
g.writeFrame(idx, 4, 4, { palette, delay: 50, repeat: 0 }); g.writeFrame(idx, 4, 4, { delay: 50 }); g.finish();
expect(parseGif(g.bytes())).toEqual({ width: 4, height: 4, frames: 2, delays: [5, 5], loop: true });

```

If that last assertion shows delays of `50` instead of `5`, gifenc takes centiseconds: pass `plan.delayCs` instead of `plan.delayCs * 10` in the export code, and record this in `DECISIONS.md`.

`tests/e2e/export-gif.spec.ts`:

* Choose 10 fps (`#export-fps` offers 10, 20 and 25) and click `#export-gif` with the default sample diagram. The download is named `diagram.gif`. `parseGif` on its bytes gives `frames: 40`, every delay `10`, `loop: true`, and `width` and `height` equal to `__studio.getExportSize('content', 1)`.

* `#export-progress` becomes visible during the export and hidden afterwards.

* Cancel: set the text to a chain of 100 nodes (one edge per line), start a 25 fps export, click `#export-cancel` after 200 ms: no download occurs within 2 seconds and `#export-message` contains `Export cancelled.` (Review Focus 4).

* Empty diagram: the GIF button is disabled.

* Record in `DECISIONS.md` how long the default sample took to export; it should be under 15 seconds.

* [x] **Step 2: Run** `npx vitest run src/export/gif.test.ts`. Expected: FAIL.

* [x] **Step 3: Implement** `gif.ts` and `parse-gif.ts`; add the GIF controls to the export panel (`#export-fps`, `#export-gif`); the panel owns an `AbortController` that `#export-cancel` aborts, and shows `MESSAGES.gifReduced` when the plan says `reduced`.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: GIF export"`

### Task 18: Share links and templates

**Delivers:** F16 and the browser-limit part of Review Focus 5.

**Files:**

* Create: `src/share/share.ts`, `src/share/templates.ts`, `src/app/gallery.ts`, `public/templates/index.json`, `public/templates/approval.mmd`, `public/templates/pipeline.mmd`, `public/templates/incident.mmd`, `public/templates/arrow-styles.mmd`, `public/templates/checkout.mmd`

* Modify: `src/app/ui.ts`, `src/app/main.ts`, `index.html`, `src/app/style.css`

* Test: `src/share/share.test.ts`, `src/share/templates.test.ts`, `tests/e2e/share.spec.ts`

**Interfaces:**

* Consumes: `SHARE`, `LIMITS`, `MESSAGES`, `commitText` (Task 13).

* Produces:

```
// share.ts (pure apart from the standard Web APIs TextEncoder, Blob, CompressionStream, btoa)
export function toBase64Url(bytes: Uint8Array): string;           // standard base64, then '+' -> '-', '/' -> '_', no '='
export function fromBase64Url(s: string): Uint8Array | null;      // null when s has characters outside [A-Za-z0-9_-]
export function encodeShare(text: string, opts?: { compression?: boolean }): Promise<{ hash: string } | { error: string }>;
export function decodeShare(hash: string): Promise<string | null>;
export function buildShareUrl(pageUrl: string, hash: string): string; // pageUrl without its own '#...' + '#' + hash
// templates.ts
export interface TemplateInfo { id: string; title: string; file: string }
export function templateUrl(baseUrl: string, file: string): string; // always `<base>/templates/<file>`, with exactly one slash after base
export function loadTemplateIndex(baseUrl: string, fetchFn?: typeof fetch): Promise<TemplateInfo[]>; // [] on any failure
export function loadTemplate(baseUrl: string, info: TemplateInfo, fetchFn?: typeof fetch): Promise<string | null>;

```

**`encodeShare`:** `utf8 = new TextEncoder().encode(text)`. If `opts.compression !== false` and `typeof CompressionStream !== 'undefined'`, try: `stream = new Blob([utf8]).stream().pipeThrough(new CompressionStream('deflate-raw'))`, `bytes = new Uint8Array(await new Response(stream).arrayBuffer())`, `hash = SHARE.prefix + toBase64Url(bytes)`. If that is unavailable or throws, use `hash = SHARE.plainPrefix + toBase64Url(utf8)`. If `hash.length + 100 > SHARE.maxUrlChars`, return `{ error: MESSAGES.shareTooLong }` (100 characters are reserved for the address). Else return `{ hash }` (without a leading `#`).

**`decodeShare`:** remove a leading `#`. If it starts with `SHARE.prefix`, decode the rest with `fromBase64Url`, inflate with `new DecompressionStream('deflate-raw')` (return null if unavailable or if it throws), and decode the bytes with `new TextDecoder('utf-8', { fatal: true })` (return null on error). If it starts with `SHARE.plainPrefix`, decode the rest the same way without inflating. Anything else returns null. A result longer than `LIMITS.maxTextChars` returns null. The function never throws.

**Templates:** `index.json` is an array of `{ "id", "title", "file" }`. Create five templates: `approval` titled "Approval flow" (Appendix A diagram 1), `pipeline` "Data pipeline" (diagram 2), `incident` "Incident alert" (diagram 3), `arrow-styles` "Arrow styles" (diagram 4), `checkout` "Order checkout" with this text:

```
flowchart LR
  Cart[Cart] --> Pay{Payment ok?}
  Pay -->|yes| Ship[[Ship order]]
  Pay -->|no| Retry[Retry payment]
  Retry --> Pay
  Ship --> Done([Delivered])

```

Load templates with `templateUrl(import.meta.env.BASE_URL, file)` so they work under a Pages sub-path (F18). Never hard-code `/templates/`.

**UI:**

1. `#btn-share`: `r = await encodeShare(text)`. On `{ error }` show it in `#message`. Else `url = buildShareUrl(location.href, r.hash)`; try `navigator.clipboard.writeText(url)` and show `MESSAGES.linkCopied`; if the clipboard fails, show a read-only `<input id="share-url">` holding the URL, selected, inside a small box `#share-box`.

2. `#btn-templates` opens `<dialog id="gallery">` with one `<button class="template">` per template (its title as text). Clicking one loads the text, calls `commitText(state, text, 'template')`, refits the view and closes the dialog. A failed load shows `MESSAGES.shareInvalid`.

3. Start-up: if `location.hash` starts with `#v1`, call `decodeShare`. A string: apply it as the diagram (source `'share'`) and replace the URL with `location.pathname + location.search` (`history.replaceState`). The shared diagram does **not** overwrite the autosaved diagram until the user edits it. `null`: show `MESSAGES.shareInvalid` and start normally (autosaved diagram or sample).

* [x] **Step 1: Write the failing tests.**

```
// share.test.ts (runs in Node 22, which has CompressionStream and DecompressionStream)
expect(toBase64Url(new Uint8Array([0xfb, 0xff]))).toBe('-_8');
expect(Array.from(fromBase64Url('-_8')!)).toEqual([0xfb, 0xff]);
expect(fromBase64Url('a b')).toBeNull();
const all = Uint8Array.from({ length: 256 }, (_, i) => i);
expect(Array.from(fromBase64Url(toBase64Url(all))!)).toEqual(Array.from(all));
const t = 'flowchart TD\nA-->B';
const enc = await encodeShare(t); expect('hash' in enc && enc.hash.startsWith('v1=')).toBe(true);
expect(await decodeShare('#' + (enc as { hash: string }).hash)).toBe(t);
const u = 'flowchart TD\nA[Ünï ✓] --> B';
expect(await decodeShare('#' + ((await encodeShare(u)) as { hash: string }).hash)).toBe(u);
const plain = await encodeShare(t, { compression: false }) as { hash: string };
expect(plain.hash.startsWith('v1p=')).toBe(true); expect(await decodeShare(plain.hash)).toBe(t);
expect(await decodeShare('#v1=!!!')).toBeNull();
expect(await decodeShare('#zzz')).toBeNull();
expect(await decodeShare('')).toBeNull();
expect(await decodeShare('#v1=' + toBase64Url(Uint8Array.from({ length: 40 }, (_, i) => (i * 37) % 256)))).toBeNull();
// 20000 characters of seeded random letters and digits cannot be compressed under the limit (mulberry32(7), see Task 5)
expect(await encodeShare(randomText(20000))).toEqual({ error: MESSAGES.shareTooLong });
expect('hash' in (await encodeShare('x'.repeat(200))) && ((await encodeShare('x'.repeat(200))) as { hash: string }).hash.length < 400).toBe(true);
expect(await decodeShare('v1p=' + toBase64Url(new TextEncoder().encode('x'.repeat(20001))))).toBeNull();
expect(buildShareUrl('https://x.test/app/?e2e=1#old', 'v1=abc')).toBe('https://x.test/app/?e2e=1#v1=abc');
// templates.test.ts (a fake fetch returning canned responses)
expect(templateUrl('/', 'a.mmd')).toBe('/templates/a.mmd');
expect(templateUrl('/gati-chitra/', 'a.mmd')).toBe('/gati-chitra/templates/a.mmd');
expect(templateUrl('/gati-chitra', 'a.mmd')).toBe('/gati-chitra/templates/a.mmd');
loadTemplateIndex with a fetch returning two entries -> those two entries;  with a fetch that rejects or returns a non-OK response -> []
loadTemplate with an OK response -> its text;  with a failing fetch -> null
// every file named in public/templates/index.json exists, and parseMermaid(file text).ok is true for all five

```

`tests/e2e/share.spec.ts`:

* Share round trip: set text `flowchart LR\nP-->Q`, click `#btn-share`; read the URL from `#share-url` (or the clipboard, after granting `clipboard-read` and `clipboard-write`); open it in a new page: `#source` equals `flowchart LR\nP-->Q`, and the address no longer has a hash. Reload that page: the previously autosaved diagram is shown, not the shared one.

* Invalid link: open `/#v1=!!!`: `#message` shows `The share link could not be read. Showing the sample diagram.` and `#source` is not empty.

* Templates: click `#btn-templates`; five `.template` buttons are listed; click "Data pipeline": `#source` contains `subgraph ingest`.

* No `CompressionStream` (Review Focus 5): use `addInitScript` to delete `window.CompressionStream` and `window.DecompressionStream`; share a diagram: the link starts with `#v1p=` and opening it in a page with the same script restores the text.

* Too large: set a text consisting of `flowchart TD\nA["` followed by 15000 random letters and digits and `"]`; click `#btn-share`: `#message` shows `This diagram is too large for a link. Save it as a .mmd file instead.`

* [x] **Step 2: Run** `npx vitest run src/share`. Expected: FAIL.

* [x] **Step 3: Implement** the files and the UI. `toBase64Url` builds a binary string in chunks of 0x8000 bytes (to avoid argument-count limits) and calls `btoa`.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: share links and templates"`

### Task 19: Present mode, shortcuts, reduced motion, accessibility

**Delivers:** F10, F19, F20.

**Files:**

* Create: `src/anim/steps.ts`, `src/app/present.ts`, `src/app/shortcuts.ts`

* Modify: `src/app/ui.ts`, `src/app/main.ts`, `index.html`, `src/app/style.css`

* Test: `src/anim/steps.test.ts`, `src/app/shortcuts.test.ts`, `tests/e2e/present.spec.ts`, `tests/e2e/a11y.spec.ts`

**Interfaces:**

* Consumes: `computeDepths` (Task 11), `Focus`, `DrawOptions.focus`, `ANIM.presentStepSeconds`.

* Produces:

```
// steps.ts (pure)
export interface Step { nodes: string[]; edges: string[] }
export function buildSteps(doc: ParsedDoc): Step[];
export function focusAt(steps: Step[], index: number): Focus; // the union of steps 0..index
// shortcuts.ts (pure)
export type ShortcutAction = 'undo' | 'redo' | 'fit' | 'present' | 'togglePause' | 'zoomIn' | 'zoomOut' | 'delete' | 'rename' | 'escape';
export interface KeyInfo { key: string; ctrl: boolean; meta: boolean; shift: boolean; alt: boolean; targetTag: string }
export function shortcutFor(k: KeyInfo): ShortcutAction | null;

```

**`buildSteps`:** `depths = computeDepths(doc)`; if there are no nodes return `[]`. `maxD` = the largest depth. Create `maxD + 1` empty steps. For each node in `doc.nodes` order, push its id onto `steps[depths[id]].nodes`. For each edge in `doc.edges` order, push its id onto `steps[Math.min(depths[edge.from] + 1, maxD)].edges`. `focusAt(steps, i)` concatenates the nodes and edges of steps `0..i` (clamp `i`).

**Keyboard shortcuts:**

| Key | Modifiers | Action | 
| ----- | ----- | ----- | 
| `z` | Ctrl or Cmd, no Shift | `undo` | 
| `z` | Ctrl or Cmd, with Shift | `redo` | 
| `y` | Ctrl (not Cmd) | `redo` | 
| `0` | Ctrl or Cmd | `fit` | 
| `+` or `=` | none | `zoomIn` | 
| `-` | none | `zoomOut` | 
| `p` | none | `present` | 
| `k` | none | `togglePause` | 
| `Delete` or `Backspace` | none | `delete` | 
| `Enter` | none | `rename` | 
| `Escape` | none | `escape` | 

`shortcutFor` returns `null` when Alt is held, and, when `targetTag` is `INPUT`, `TEXTAREA` or `SELECT`, returns `null` for everything except `Escape`. Key matching is case-insensitive for letters. Space (hold) for panning is handled by the pointer code from Task 12, not here.

**Present mode** (`present.ts`): `#btn-present` or the `present` action starts it. With no scene, show `MESSAGES.nothingToPresent`.

1. `steps = buildSteps(doc)`, `index = 0`, add the class `presenting` to `<body>` (add CSS rules for `body.presenting` that hide the toolbar, the text panel and the controls; Task 22 adds the site header and footer to that list), try `canvasPanel.requestFullscreen()` and ignore a refusal, refit the view, and show `#present-step` with the text `Step <index+1> of <n>`.

2. Pass `focus = focusAt(steps, index)` in the draw options: items outside the focus are drawn at `ANIM.dimAlpha`.

3. Auto-advance every `ANIM.presentStepSeconds` seconds until the last step, then stop.

4. Keys while presenting: Space toggles auto-advance (at the end it restarts from step 0); `ArrowRight`, `ArrowDown`, `PageDown` next; `ArrowLeft`, `ArrowUp`, `PageUp` previous; `Home`, `End`; `f` refits; `Escape` exits (also when the browser leaves full screen). Selecting and dragging are disabled; pan and zoom still work.

5. Exit removes the class, clears the focus and leaves full screen. Expose `window.__studio.getPresentStep()` (the index, or `null` when not presenting).

**Reduced motion:** at start, if `matchMedia('(prefers-reduced-motion: reduce)').matches`, start with `paused = true`, `#anim-pause` has `aria-pressed="true"` and its text is `Play`. The pause button's text is `Pause` when playing and `Play` when paused.

**Accessibility basics:** every `<button>` has visible text or an `aria-label`; `<html lang="en">`; the canvas keeps `role="img"` and its `aria-label`; every dialog is a `<dialog>` with `aria-modal="true"` and an `aria-label`, moves focus to its first control when opened and returns focus to the button that opened it when closed; messages live in `aria-live="polite"` regions; keyboard focus is always visible; the tab order follows the page (toolbar, text, canvas controls); text and background colours come from `tokens.css` (the pairs `--text-body`, `--text-main` and `--text-muted` on `--card-background` have a contrast above 4.5:1 in both schemes).

* [x] **Step 1: Write the failing tests.**

```
// steps.test.ts
buildSteps(parse('flowchart TD\nA-->B\nB-->C'))
  // [{ nodes: ['A'], edges: [] }, { nodes: ['B'], edges: ['e0'] }, { nodes: ['C'], edges: ['e1'] }]
buildSteps(parse('flowchart TD\nA-->B\nA-->C\nB-->D\nC-->D'))
  // [{ nodes: ['A'], edges: [] }, { nodes: ['B', 'C'], edges: ['e0', 'e1'] }, { nodes: ['D'], edges: ['e2', 'e3'] }]
buildSteps(parse('flowchart TD\nA-->B\nB-->C\nC-->A'))
  // [{ nodes: ['A'], edges: [] }, { nodes: ['B'], edges: ['e0'] }, { nodes: ['C'], edges: ['e1', 'e2'] }]
buildSteps(parse('flowchart TD\nA-->B\nC-->D'))
  // [{ nodes: ['A', 'C'], edges: [] }, { nodes: ['B', 'D'], edges: ['e0', 'e1'] }]
buildSteps(parse('flowchart TD\nA'))   // [{ nodes: ['A'], edges: [] }]
buildSteps(parse('flowchart TD'))      // []
focusAt(chainSteps, 1)                 // { nodes: ['A', 'B'], edges: ['e0'] }
focusAt(chainSteps, 99)                // everything (index clamped)
// shortcuts.test.ts (key info fields not named are false; targetTag 'CANVAS' unless stated)
{ key: 'z', ctrl: true } -> 'undo';  { key: 'z', ctrl: true, shift: true } -> 'redo';  { key: 'Z', meta: true, shift: true } -> 'redo'
{ key: 'y', ctrl: true } -> 'redo';  { key: 'y', meta: true } -> null
{ key: '0', meta: true } -> 'fit';  { key: '+' } -> 'zoomIn';  { key: '=' } -> 'zoomIn';  { key: '-' } -> 'zoomOut'
{ key: 'p' } -> 'present';  { key: 'k' } -> 'togglePause'
{ key: 'Delete' } -> 'delete';  { key: 'Backspace' } -> 'delete';  { key: 'Enter' } -> 'rename';  { key: 'Escape' } -> 'escape'
{ key: 'p', alt: true } -> null;  { key: 'q' } -> null
{ key: 'z', ctrl: true, targetTag: 'TEXTAREA' } -> null;  { key: 'Escape', targetTag: 'TEXTAREA' } -> 'escape';  { key: 'p', targetTag: 'INPUT' } -> null

```

`tests/e2e/present.spec.ts`: click `#btn-present`: `<body>` has the class `presenting` and `__studio.getPresentStep()` is 0; press `ArrowRight`: it is 1 and the canvas pixels differ from step 0; press `Home`: 0; `Escape`: the class is gone and `getPresentStep()` is `null`. With `__studio.setText('flowchart TD')` the button shows `Nothing to present. Add a node first.` and present mode does not start. Pressing `p` while focus is in `#source` types a `p` and does not start present mode.

`tests/e2e/a11y.spec.ts`: every `button` has a non-empty accessible name; the canvas has `role="img"` and an `aria-label` starting `Flowchart with`; `<html>` has `lang="en"`; opening the export dialog moves focus into it and closing it returns focus to `#btn-export`; with `page.emulateMedia({ reducedMotion: 'reduce' })` and a reload, `#anim-pause` has `aria-pressed="true"` and the text `Play`; `Tab` from the page start reaches `#btn-new` first.

* [x] **Step 2: Run** `npx vitest run src/anim/steps.test.ts src/app/shortcuts.test.ts`. Expected: FAIL.

* [x] **Step 3: Implement** the three modules and wire `shortcutFor` into the document `keydown` listener from Task 14 (replacing its ad-hoc key handling), and the actions: `undo`, `redo` (Task 13), `fit`, `zoomIn` and `zoomOut` (multiply the zoom by 1.25 or 0.8 about the canvas centre with `zoomAt`), `present`, `togglePause`, and the editor reducer actions from Task 14.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: present mode, shortcuts, reduced motion, accessibility"`

### Task 20: Video export (MP4 and WebM)

**Delivers:** F14.

**Files:**

* Create: `src/export/video.ts`

* Modify: `src/app/export-panel.ts`, `package.json` (new dependency)

* Test: `src/export/video.test.ts`, `tests/e2e/export-video.spec.ts`

**Interfaces:**

* Consumes: `drawExportFrame` (from Task 17), `exportFrame`, `fitToPixels`, `loopSeconds`, `yieldToEventLoop`, `gifPlan` defaults, `EXPORT`, `MESSAGES`.

* Produces:

```
export interface VideoOptions { mode: ExportMode; loops: number } // loops 1..EXPORT.videoLoopsMax
export interface VideoPlan { width: number; height: number; totalFrames: number; fps: number; seconds: number; loopsUsed: number; reduced: boolean }
export interface EncoderSupport { codec: 'avc' | 'vp9'; container: 'mp4' | 'webm' }
export function videoPlan(bounds: Rect, mode: ExportMode, anim: AnimSettings, loops: number): VideoPlan;
export function videoBitrate(width: number, height: number, fps: number): number;
export function probeEncoder(
  width: number, height: number,
  isConfigSupported?: (c: VideoEncoderConfig) => Promise<{ supported?: boolean }>,
): Promise<EncoderSupport | null>;
export function exportVideo(
  scene: Scene, theme: Theme, anim: AnimSettings, opts: VideoOptions,
  onProgress: (done: number, total: number) => void, signal: AbortSignal,
): Promise<{ blob: Blob; container: 'mp4' | 'webm' } | { fallback: 'gif' }>;

```

**Install:** `npm install mediabunny --save-exact` (pins the version so a later API change cannot break the build). Look at the documentation of the version you installed at https://mediabunny.dev/guide/quick-start before coding: the calls below match its documented flow (an `Output` with a format and a target, a `CanvasSource`, `addVideoTrack`, `start`, `source.add(timestamp, duration)`, `finalize`, then `output.target.buffer`). If the documentation of your version differs in a call name, follow the documentation and note it in `DECISIONS.md`.

**`videoPlan`:** `frame = exportFrame(bounds, mode, 1)`; `width`, `height` = `frame.pixelWidth`, `frame.pixelHeight`; if `width * height > EXPORT.videoMaxPixels`, multiply both by `fitToPixels(width, height, EXPORT.videoMaxPixels)` and floor them and set `reduced = true`. Then make both even: `width -= width % 2`, `height -= height % 2` (H.264 needs even sizes), minimum 2. `fps = EXPORT.videoFps`. `loopSec = loopSeconds(anim)`; `loopsUsed = loops`; while `loopSec * loopsUsed > EXPORT.videoMaxSeconds` and `loopsUsed > 1`, decrement `loopsUsed`. `seconds = loopSec * loopsUsed`; `totalFrames = Math.round(seconds * fps)`.

**`videoBitrate`:** `Math.min(8_000_000, Math.max(1_000_000, Math.round(width * height * fps * 0.1)))`.

**`probeEncoder`:** if `typeof VideoEncoder === 'undefined'` and no `isConfigSupported` is given, return null. Try these H.264 strings in order: `avc1.640028`, `avc1.4d0028`, `avc1.42001f`; for each, call `isConfigSupported({ codec, width, height, bitrate: videoBitrate(width, height, 30), framerate: 30 })` (default: `VideoEncoder.isConfigSupported`); the first with `supported === true` returns `{ codec: 'avc', container: 'mp4' }`. Then try `vp09.00.40.08` the same way for `{ codec: 'vp9', container: 'webm' }`. Otherwise null. Catch errors from `isConfigSupported` and treat them as "not supported".

**`exportVideo`:**

1. `plan = videoPlan(bounds, mode, anim, opts.loops)`; `support = await probeEncoder(plan.width, plan.height)`; if null, return `{ fallback: 'gif' }`.

2. Create a canvas of the plan size. Load the library on demand so it stays out of the first download: `const m = await import('mediabunny')`.

3. `output = new m.Output({ format: support.container === 'mp4' ? new m.Mp4OutputFormat() : new m.WebMOutputFormat(), target: new m.BufferTarget() })`; `source = new m.CanvasSource(canvas, { codec: support.codec, bitrate: videoBitrate(plan.width, plan.height, plan.fps) })`; `output.addVideoTrack(source, { frameRate: plan.fps })`; `await output.start()`.

4. For `i` from 0 to `totalFrames - 1`: `phase = ((i / plan.fps) / loopSeconds(anim)) % 1`; draw with `drawExportFrame(ctx, scene, theme, anim, view, phase, plan.width, plan.height)`; `await source.add(i / plan.fps, 1 / plan.fps)`; `onProgress(i + 1, totalFrames)`; `await yieldToEventLoop()`; if `signal.aborted`, stop and throw `new DOMException('Cancelled', 'AbortError')` (the half-written output is simply dropped).

5. `await output.finalize()`; `blob = new Blob([output.target.buffer!], { type: support.container === 'mp4' ? 'video/mp4' : 'video/webm' })`.

**Panel:** add `#export-loops` (select 1 to 5, default 2) and `#export-video` ("Save as video"). Click: run `exportVideo`. A `{ fallback: 'gif' }` result: show `MESSAGES.videoUnsupported`, then run the GIF export at 20 fps and download the GIF. A thrown error other than `AbortError`: show `MESSAGES.videoFailed(error.message)`. Success: `downloadBlob(blob, safeFilename(name, container))` where the extension is `mp4` or `webm`. Use the same `AbortController` and progress element as the GIF export.

* [x] **Step 1: Write the failing tests.**

```
// video.test.ts (Node: VideoEncoder does not exist)
const b = { x: 0, y: 0, width: 400, height: 200 };       // content frame 464 by 264
videoPlan(b, 'content', { ...DEFAULT_ANIM, speed: 1 }, 2)
  // { width: 464, height: 264, totalFrames: 240, fps: 30, seconds: 8, loopsUsed: 2, reduced: false }
videoPlan({ x: 0, y: 0, width: 401, height: 199 }, 'content', DEFAULT_ANIM, 1)   // frame 465 by 263 -> width 464, height 262
const huge = videoPlan({ x: 0, y: 0, width: 2936, height: 1936 }, 'content', DEFAULT_ANIM, 1);
expect(huge.reduced).toBe(true); expect(huge.width % 2).toBe(0); expect(huge.height % 2).toBe(0);
expect(huge.width * huge.height).toBeLessThanOrEqual(2073600);
videoPlan(b, 'content', { ...DEFAULT_ANIM, speed: 0.25 }, 5)   // loop is 16 s, 80 s is over 30 s: loopsUsed 1, seconds 16
videoBitrate(464, 264, 30)    // 1000000
videoBitrate(1920, 1080, 30)  // 6220800
videoBitrate(3840, 2160, 30)  // 8000000
await probeEncoder(100, 100)  // null (no VideoEncoder in Node)
const only = (ok: string[]) => async (c: { codec: string }) => ({ supported: ok.includes(c.codec) });
await probeEncoder(100, 100, only(['avc1.640028']))      // { codec: 'avc', container: 'mp4' }
await probeEncoder(100, 100, only(['avc1.42001f']))      // { codec: 'avc', container: 'mp4' }
await probeEncoder(100, 100, only(['vp09.00.40.08']))    // { codec: 'vp9', container: 'webm' }
await probeEncoder(100, 100, only([]))                   // null
await probeEncoder(100, 100, async () => { throw new Error('x'); })   // null

```

`tests/e2e/export-video.spec.ts`:

* Click `#export-video` with the default sample and 1 loop. Chromium without proprietary codecs cannot encode H.264, so accept either container: the download is `diagram.mp4` or `diagram.webm`; for MP4 the bytes at offsets 4 to 8 spell `ftyp`; for WebM the first four bytes are `1A 45 DF A3`; the file is larger than 1000 bytes.

* No video encoder (Review Focus 5): `addInitScript` sets `window.VideoEncoder = undefined`; click `#export-video`: `#export-message` shows `This browser cannot encode video. Saved as GIF instead.` and a `diagram.gif` download starts.

* Cancel: start a video export of a 100-node chain and click `#export-cancel` after 200 ms: no download within 2 seconds and the message `Export cancelled.`.

* Empty diagram: the video button is disabled.

* The first page load does not download the video library: record the network requests while loading and check that no request URL contains `mediabunny` until `#export-video` is clicked (the on-demand chunk is named by Vite after the module).

* [x] **Step 2: Run** `npx vitest run src/export/video.test.ts`. Expected: FAIL.

* [x] **Step 3: Implement** `video.ts` and the panel changes.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "feat: MP4 and WebM export with fallback"`

### Task 21: CI, GitHub Pages deployment, size and network checks

**Delivers:** F17, F18, and the size and speed budgets.

**Files:**

* Create: `.github/workflows/deploy.yml`, `scripts/check-dist.mjs`

* Modify: `package.json` (script `check:dist`), `src/app/ui.ts` (add `__studio.measureFrames`)

* Test: `tests/e2e/network.spec.ts`, `tests/e2e/perf.spec.ts`

**Interfaces:**

* Consumes: the `BASE_PATH` variable (Task 1), `dist/` after `npm run build`.

* Produces: `npm run check:dist`; the workflow.

**Workflow** (`.github/workflows/deploy.yml`, exactly this structure). Before committing, open https://vite.dev/guide/static-deploy.html (the GitHub Pages section) and, if it shows newer major versions of the five actions, replace the `@vN` suffixes below with those. The structure stays the same.

```
name: Test and deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm test
      - run: npm run build
      - run: npm run check:dist
      - run: npm run test:e2e

  deploy:
    needs: test
    if: github.event_name != 'pull_request'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Compute base path and site URLs
        run: |
          owner="${GITHUB_REPOSITORY_OWNER,,}"
          repo="${GITHUB_REPOSITORY#*/}"
          if [ "${repo,,}" = "$owner.github.io" ]; then base="/"; else base="/$repo/"; fi
          echo "BASE_PATH=$base" >> "$GITHUB_ENV"
          echo "VITE_SITE_URL=https://$owner.github.io$base" >> "$GITHUB_ENV"
          echo "VITE_SOURCE_URL=https://github.com/$GITHUB_REPOSITORY" >> "$GITHUB_ENV"
      - run: npm ci
      - run: npm run build
      - run: npm run check:dist
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4

```

The `deploy` job runs only after `test` passes (a failing check blocks a release). It needs the repository setting Settings, Pages, Source set to **GitHub Actions** (Task 23 documents this). The step "Compute base path and site URLs" sets `BASE_PATH` (`/` for a repository named `<user>.github.io`, otherwise `/<repository>/`) and the two `VITE_` variables that Task 22 uses for the canonical address and the "Source" link; the lower-casing keeps the address in the form `https://u77w41.github.io/...`.

**`scripts/check-dist.mjs` algorithm:**

1. `base = process.env.BASE_PATH ?? '/'`; `dist = 'dist'`.

2. Read `dist/index.html`. Collect every `src` of a `<script ...>` tag and every `href` of a `<link rel="modulepreload" ...>` that ends in `.js`. If there are none, print `No script found in dist/index.html` and exit 1.

3. For each reference: it must start with `base`, else print `Asset URL does not start with BASE_PATH: <url>` and exit 1. Its file is `dist/` plus the reference with `base` removed. `gz` = `zlib.gzipSync(fs.readFileSync(file), { level: 9 }).length`.

4. Print each file with its gzip size in KB and the total. If the total is more than `350 * 1024` bytes, print `Initial JavaScript is over the 350 KB budget` and exit 1.

5. Read `dist/templates/index.json`; for each entry check that `dist/templates/<file>` exists; else print the missing file and exit 1.

6. Print `OK` and exit 0.

**`__studio.measureFrames(count)`:** draws `count` frames at consecutive phases (`i / count`) straight onto the main canvas using the current scene and settings, with `performance.now()` around the loop, and returns the average milliseconds per frame.

* [x] **Step 1: Write the browser tests.**

`tests/e2e/network.spec.ts` (F17): record every request with `page.on('request')`. Load `/?e2e=1`, interact (type, drag a node, export a PNG and an SVG), and assert that no request goes to another origin. Then call `context.setOffline(true)`, and repeat: type text, drag a node, export PNG and SVG; they all still work (the page keeps functioning offline after load).

`tests/e2e/perf.spec.ts` (budgets): build a text of 100 nodes as a binary tree (`flowchart TD`, then for node `n` an edge to `2n` and `2n+1` while within 100); set it; select the `traffic` style; `__studio.measureFrames(30)` returns less than 50 milliseconds on average. Also assert that setting a 300-node chain text and waiting for `__studio.getSummary().nodes.length === 300` takes less than 3 seconds.

* [x] **Step 2: Implement** `check-dist.mjs`, the `check:dist` script (`"check:dist": "node scripts/check-dist.mjs"`), the workflow and `measureFrames`.

* [x] **Step 3: Verify the dist check:**

  * Run `npm run build && npm run check:dist`. Expected: it prints the sizes and `OK`.

  * Run `BASE_PATH=/gati-chitra/ npm run build && BASE_PATH=/gati-chitra/ npm run check:dist`. Expected: `OK`.

  * Run `BASE_PATH=/other/ npm run check:dist; echo $?` right after the previous build. Expected: the error about `BASE_PATH` and the exit code `1`.

  * Run `npm run build` again (without `BASE_PATH`) so `dist` matches the default.

* [x] **Step 4: Run** `npm test` and `npm run test:e2e`. Expected: PASS.

* [x] **Step 5: Commit.** `git add -A && git commit -m "ci: test, check and deploy to GitHub Pages"`

### Task 22: Brand, logo, favicon, site header and footer, colour scheme

**Delivers:** F21, F22, and the "Match page" part of F8.

**Why:** the supplied logo becomes the favicon and the header logo, and the page frame (header, footer, colours, font, light and dark switch) copies the author's diff-checker site so the tools look like one family. Every value below was read from that site's published HTML, CSS and JavaScript.

**Files:**

* Create: `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`, `public/theme-init.js`, `scripts/make-icons.mjs`, `.env`, `src/app/icons.ts`, `src/app/scheme.ts`, `src/app/chrome.ts`, `src/app/chrome.css`

* Modify: `index.html`, `src/vite-env.d.ts`, `src/app/main.ts`, `src/app/ui.ts`, `src/app/style.css`, `package.json` (new dependency and the `icons` script), `scripts/check-dist.mjs`, `README.md`

* Test: `src/app/scheme.test.ts`, `src/app/chrome.test.ts`, `src/app/brand.test.ts`, `tests/e2e/chrome.spec.ts`, `tests/e2e/branding.spec.ts`

**Interfaces:**

* Consumes: `BRAND`, `SCHEME`, `FONT_STACK_UI` (Part 2); `THEMES`, `resolveTheme` (Task 10); `KeyValueStore`, `safeStore` (Task 12); `escapeXml` (Task 16).

* Produces:

```
// scheme.ts
export interface SchemeDoc {
  documentElement: { setAttribute(name: string, value: string): void };
  querySelector(selector: string): { setAttribute(name: string, value: string): void } | null;
}
export function readPref(store: KeyValueStore | null): SchemePref;           // missing, invalid or throwing store -> 'auto'
export function writePref(store: KeyValueStore | null, pref: SchemePref): boolean;
export function isDark(pref: SchemePref, systemDark: boolean): boolean;       // pref === 'dark' || (pref === 'auto' && systemDark)
export function nextPref(current: SchemePref, systemDark: boolean): SchemePref;
export function applyScheme(pref: SchemePref, systemDark: boolean, doc: SchemeDoc): 'light' | 'dark';
export function startSchemeWatcher(store: KeyValueStore | null, onChange: (scheme: 'light' | 'dark') => void): () => void;
// icons.ts
export const ICONS: { moon: string; sun: string; briefcase: string; support: string; grid: string; chevron: string; external: string; anurup: string; diff: string };
export function logoSvg(className: string): string;
// chrome.ts
export function copyrightText(year: number): string;
export function headerHtml(): string;
export function footerHtml(year: number, sourceUrl: string): string;
export function mountChrome(doc: Document, store: KeyValueStore | null, sourceUrl: string): () => void; // returns a dispose function

```

#### The logo and the favicon

The supplied artwork has two filled circles joined by a flowing S-curve that ends in an arrowhead, and a dashed vertical line. Keep its geometry exactly (viewBox `0 0 512 512`, stroke width 24, the five elements below). Only the colours change: the standalone favicon gets two colours and a dark-mode rule, and the header logo uses `currentColor`.

`public/favicon.svg` (exact content; `#363853` and `#cbd5e1` are the two colours the author's diff-checker favicon uses):

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <style>
    .line { stroke: #363853; }
    .dot { fill: #363853; }
    @media (prefers-color-scheme: dark) {
      .line { stroke: #cbd5e1; }
      .dot { fill: #cbd5e1; }
    }
  </style>
  <path class="line" d="M 408 42 L 408 78 M 408 112 L 408 148 M 408 182 L 408 240" stroke-width="24" stroke-linecap="round" />
  <path class="line" d="M 108 196 C 68 232 56 272 56 320 C 56 388.5 101.2 444 157 444 C 212.8 444 258 388.5 258 320 L 258 240 C 258 198.6 291.6 165 333 165 C 374.4 165 408 198.6 408 240 L 408 362" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
  <path class="line" d="M 366 318 L 408 362 L 450 318" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" />
  <circle class="dot" cx="108" cy="196" r="62" />
  <circle class="dot" cx="408" cy="412" r="62" />
</svg>
```

`logoSvg(className)` returns the same artwork inline, so CSS can colour it (the header sets `color: var(--accent)` on it):

```
export function logoSvg(className: string): string {
  return (
    `<svg class="${className}" viewBox="0 0 512 512" fill="none" aria-hidden="true">` +
    '<path d="M 408 42 L 408 78 M 408 112 L 408 148 M 408 182 L 408 240" stroke="currentColor" stroke-width="24" stroke-linecap="round"/>' +
    '<path d="M 108 196 C 68 232 56 272 56 320 C 56 388.5 101.2 444 157 444 C 212.8 444 258 388.5 258 320 L 258 240 C 258 198.6 291.6 165 333 165 C 374.4 165 408 198.6 408 240 L 408 362" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M 366 318 L 408 362 L 450 318" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<circle cx="108" cy="196" r="62" fill="currentColor"/>' +
    '<circle cx="408" cy="412" r="62" fill="currentColor"/>' +
    '</svg>'
  );
}

```

**`scripts/make-icons.mjs`** makes the two bitmap icons from `public/favicon.svg`. It is run by hand (`npm run icons`) and its output is committed, so builds and CI never run it. Steps:

1. Read `public/favicon.svg` and turn it into a `data:image/svg+xml;base64,...` URL.

2. Launch Chromium with `import { chromium } from '@playwright/test'` and open a page with `colorScheme: 'light'`.

3. 32 by 32: viewport 32 by 32; set the page content to `<body style="margin:0"><img src="<data url>" width="32" height="32"></body>`; take a screenshot with `omitBackground: true` (a transparent PNG).

4. Write `public/favicon.ico` as an ICO file that contains that PNG. The bytes, in order: `00 00 01 00 01 00` (reserved, type 1, one image); then 16 bytes: `20` (width 32), `20` (height 32), `00` (colours), `00` (reserved), `01 00` (planes), `20 00` (32 bits per pixel), the PNG length as a 4-byte little-endian integer, and the offset `16 00 00 00` (22); then the PNG bytes themselves.

5. 180 by 180: viewport 180 by 180, page background `#f5f5fa`, the image 130 by 130 with a 25 px margin on every side; a normal screenshot becomes `public/apple-touch-icon.png`.

6. Close the browser and print the files written and their sizes. Add `"icons": "node scripts/make-icons.mjs"` to `package.json`, run it once, and commit the results.

#### The colour scheme

`public/theme-init.js` is a classic script (not a module) that runs from `<head>` before the page paints, so there is no flash of the wrong colours. It must have exactly this content (it is the author's script, and it is why the choice carries across their sites):

```
(function () {
  var key = 'StackColorScheme';
  var saved = null;
  try {
    saved = localStorage.getItem(key);
  } catch (e) {}
  if (saved !== 'light' && saved !== 'dark') saved = 'auto';
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var dark = saved === 'dark' || (saved === 'auto' && prefersDark);
  document.documentElement.setAttribute('data-scheme', dark ? 'dark' : 'light');
})();

```

**`scheme.ts` rules:**

* `readPref`: `store.getItem(SCHEME.storageKey)`; return it when it is `light`, `dark` or `auto`, otherwise `'auto'`; any exception gives `'auto'`.

* `writePref`: `store.setItem(...)`; return false for a `null` or throwing store.

* `nextPref(current, systemDark)` (what the toggle does): `target = isDark(current, systemDark) ? 'light' : 'dark'`; if `target` equals the system's own scheme (`systemDark ? 'dark' : 'light'`) return `'auto'`, else return `target`.

* `applyScheme(pref, systemDark, doc)`: `dark = isDark(pref, systemDark)`; `doc.documentElement.setAttribute('data-scheme', dark ? 'dark' : 'light')`; `meta = doc.querySelector('meta[name="theme-color"]:not([media])')`; if it exists, set its `content` to `SCHEME.darkThemeColor` or `SCHEME.lightThemeColor`; return the scheme.

* `startSchemeWatcher(store, onChange)`: apply once at start (read the system setting from `matchMedia('(prefers-color-scheme: dark)')`); listen for changes of that media query and re-apply when the stored choice is `auto`; listen for the `storage` event with `key === SCHEME.storageKey` and re-apply; after two nested `requestAnimationFrame` calls add the class `theme-ready` to `<html>` (it switches the colour transitions on only after the first paint); call `onChange(scheme)` after every apply; return a function that removes the listeners.

#### The page head, `index.html` (exact)

```
<!doctype html>
<html lang="en" data-scheme="light">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Gati-chitra · Ujjwal Chowdhury</title>
    <meta name="description" content="Draw, drag and animate Mermaid flowcharts, then save them as PNG, SVG, GIF or video. Everything runs in your browser." />
    <meta name="author" content="Ujjwal Chowdhury" />
    <link rel="canonical" href="%VITE_SITE_URL%" />

    <meta property="og:title" content="Gati-chitra · Ujjwal Chowdhury" />
    <meta property="og:description" content="Draw, drag and animate Mermaid flowcharts, then save them as PNG, SVG, GIF or video. Everything runs in your browser." />
    <meta property="og:url" content="%VITE_SITE_URL%" />
    <meta property="og:site_name" content="Ujjwal Chowdhury" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://u77w41.github.io/support-my-work/assets/avatar.png" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Gati-chitra · Ujjwal Chowdhury" />
    <meta name="twitter:description" content="Draw, drag and animate Mermaid flowcharts, then save them as PNG, SVG, GIF or video." />

    <meta name="theme-color" content="#f5f5fa" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#303030" media="(prefers-color-scheme: dark)" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="alternate icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <script src="/theme-init.js"></script>
  </head>
  <body>
    <header class="site-header" id="site-header"></header>
    <main id="main" class="container-wide" tabindex="-1"><div id="app"></div></main>
    <footer class="site-footer" id="site-footer"></footer>
    <noscript>This tool needs JavaScript.</noscript>
    <script type="module" src="/src/app/main.ts"></script>
  </body>
</html>

```

The title pattern `<Tool name> · Ujjwal Chowdhury` and the Open Graph image are the same as on the author's other sites. `%VITE_SITE_URL%` is replaced by Vite from the file `.env`:

```
VITE_SITE_URL=https://u77w41.github.io/gati-chitra/
VITE_SOURCE_URL=https://github.com/U77w41/gati-chitra

```

The deploy workflow (Task 21) overrides both with the real repository values. Add to `src/vite-env.d.ts`, after the existing reference line:

```
interface ImportMetaEnv {
  readonly VITE_SITE_URL: string;
  readonly VITE_SOURCE_URL: string;
}

```

#### Header and footer markup (`chrome.ts`)

`headerHtml()` returns this markup (shown with the values from `BRAND`; build it with template strings, passing every inserted value through `escapeXml`, and insert `ICONS.*` and `logoSvg(...)` strings unescaped). It is placed inside `<header id="site-header">`; `footerHtml(year, sourceUrl)` is placed inside `<footer id="site-footer">`.

```
<div class="container header-inner">
  <a class="brand" href="./" aria-label="Gati-chitra home">
    <!-- logoSvg('brand-icon') -->
    <span class="brand-text"><span class="brand-name">Gati-chitra</span></span>
  </a>
  <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Switch between light and dark colour scheme" title="Switch between light and dark colour scheme">
    <!-- ICONS.moon --><!-- ICONS.sun -->
  </button>
  <nav class="site-nav" aria-label="Main">
    <ul>
      <li>
        <div class="menu-social-dropdown">
          <button type="button" class="menu-social-dropdown-toggle nav-text-desktop" id="tools-toggle" title="My Other Tools" aria-label="My Other Tools" aria-haspopup="true" aria-expanded="false" aria-controls="menu-social-dropdown-tools">
            <!-- ICONS.grid -->
            <span class="nav-label">My Other Tools</span>
            <span class="menu-social-dropdown-chevron" aria-hidden="true"><!-- ICONS.chevron --></span>
          </button>
          <div class="menu-social-dropdown-panel" id="menu-social-dropdown-tools" hidden>
            <p class="menu-social-dropdown-title">Tools</p>
            <ul>
              <!-- one <li> per entry of BRAND.tools: -->
              <li>
                <a href="https://u77w41.github.io/diff-checker/" target="_blank" rel="noopener noreferrer">
                  <span class="menu-social-dropdown-icon"><!-- ICONS.diff --></span>
                  <span class="menu-social-dropdown-text">
                    <span class="menu-social-dropdown-name">Diff Checker</span>
                    <span class="menu-social-dropdown-description">Fast, browser-based diff tool for text files, source code, and Jupyter notebooks.</span>
                  </span>
                  <span class="menu-social-dropdown-external"><!-- ICONS.external --></span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </li>
      <li>
        <a class="nav-text-desktop" href="https://u77w41.github.io/resume/" aria-label="Hire Me"><!-- ICONS.briefcase --><span class="nav-label">Hire Me</span></a>
      </li>
      <li class="mobile-hide">
        <a class="support-link-item" data-testid="support-link" href="https://u77w41.github.io/support-my-work/" target="_blank" rel="noreferrer" title="Support my work: send a small tip over UPI"><!-- ICONS.support --><span>Support my work</span></a>
      </li>
    </ul>
  </nav>
</div>

```

The tools list has two entries, in this order: Diff Checker (icon `ICONS.diff`) and ANURUP (icon `ICONS.anurup`, description `Privacy-first photo & PDF tools for online forms`, which becomes `&amp;` after escaping), both taken from `BRAND.tools` by their `id`.

```
<div class="container footer-row">
  <p class="footer-meta">
    <span class="copyright">© 2026 Ujjwal Chowdhury</span>
    <span class="footer-sep" aria-hidden="true">·</span>
    <span>Runs entirely in your browser</span>
  </p>
  <nav class="footer-nav" aria-label="Footer">
    <a href="https://u77w41.github.io/resume/">Hire Me</a>
    <a href="https://u77w41.github.io/diff-checker/">Diff Checker</a>
    <a href="https://u77w41.github.io/anurup/">Anurup</a>
    <a href="<sourceUrl>" target="_blank" rel="noreferrer">Source</a>
    <a class="footer-support" data-testid="support-link-footer" href="https://u77w41.github.io/support-my-work/" target="_blank" rel="noreferrer" title="Support my work: send a small tip over UPI"><!-- ICONS.support --><span>Support my work</span></a>
  </nav>
</div>

```

`copyrightText(year)`: `'© ' + BRAND.startYear + ' ' + BRAND.owner` when `year <= BRAND.startYear`, else `'© ' + BRAND.startYear + ' – ' + year + ' ' + BRAND.owner` (with an en dash and spaces around it).

`mountChrome(doc, store, sourceUrl)`:

1. Set the inner HTML of `#site-header` to `headerHtml()` and of `#site-footer` to `footerHtml(new Date().getFullYear(), sourceUrl)`.

2. `#theme-toggle` click: `pref = nextPref(readPref(store), systemDark())`; `writePref(store, pref)`; `applyScheme(pref, systemDark(), doc)`; then notify the app (call the same `onChange` the watcher uses).

3. Tools menu: clicking `#tools-toggle` toggles the `hidden` attribute of the panel and `aria-expanded` on the button; `Escape` closes it (and moves focus back to the button when focus was inside the panel); a click outside the menu closes it; a click on one of its links closes it.

4. Start the scheme watcher and return a function that disposes everything.

#### Icons (`src/app/icons.ts`, exact content; these are the icon shapes the author's site uses)

```
export const ICONS = {
  moon:
    '<svg class="nav-icon icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3h.393a7.5 7.5 0 0 0 7.92 12.446A9 9 0 1 1 12 2.992z"/></svg>',
  sun:
    '<svg class="nav-icon icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M3 12h1m8-9v1m8 8h1m-9 8v1M5.6 5.6l.7.7m12.1-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"/></svg>',
  briefcase:
    '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 12v.01"/><path d="M3 13a20 20 0 0 0 18 0"/></svg>',
  support:
    '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="heart-icon" d="M16 6.27975C16 6.88118 15.7625 7.45883 15.3383 7.88611C14.3619 8.87007 13.415 9.89605 12.4021 10.8443C12.17 11.0585 11.8017 11.0507 11.5795 10.8268L8.6615 7.88611C7.7795 6.99725 7.7795 5.56225 8.6615 4.67339C9.55218 3.77579 11.0032 3.77579 11.8938 4.67339L11.9999 4.78027L12.1059 4.67345C12.533 4.24286 13.1146 4 13.7221 4C14.3297 4 14.9113 4.24284 15.3383 4.67339C15.7625 5.10073 16 5.67835 16 6.27975Z" stroke-linejoin="round"/><path d="M18 20L21.8243 16.1757C21.9368 16.0632 22 15.9106 22 15.7515V10.5C22 9.67157 21.3284 9 20.5 9V9C19.6716 9 19 9.67157 19 10.5V15" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 16L18.8581 15.1419C18.949 15.051 19 14.9278 19 14.7994V14.7994C19 14.6159 18.8963 14.4482 18.7322 14.3661L18.2893 14.1447C17.5194 13.7597 16.5894 13.9106 15.9807 14.5193L15.0858 15.4142C14.7107 15.7893 14.5 16.298 14.5 16.8284V20" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 20L2.17574 16.1757C2.06321 16.0632 2 15.9106 2 15.7515V10.5C2 9.67157 2.67157 9 3.5 9V9C4.32843 9 5 9.67157 5 10.5V15" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 16L5.14187 15.1419C5.05103 15.051 5 14.9278 5 14.7994V14.7994C5 14.6159 5.10366 14.4482 5.26776 14.3661L5.71067 14.1447C6.48064 13.7597 7.41059 13.9106 8.01931 14.5193L8.91421 15.4142C9.28929 15.7893 9.5 16.298 9.5 16.8284V20" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  grid:
    '<svg class="nav-icon icon-tools-grid" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="17.5" cy="17.5" r="3.5"/><circle cx="17.5" cy="6.5" r="3.5"/><circle cx="6.5" cy="17.5" r="3.5"/><circle cx="6.5" cy="6.5" r="3.5"/></svg>',
  chevron:
    '<svg class="icon icon-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6-6 6"/></svg>',
  external:
    '<svg class="icon icon-external-link" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 6H6A2 2 0 004 8v10a2 2 0 002 2h10a2 2 0 002-2v-6"/><path d="M11 13l9-9"/><path d="M15 4h5v5"/></svg>',
  anurup:
    '<svg class="icon icon-anurup" width="32" height="32" viewBox="100 100 800 800" fill="none" stroke="currentColor" stroke-width="64" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M 280 200 H 740 A 60 60 0 0 1 800 260 V 640 A 60 60 0 0 1 740 700 H 650"/><path d="M 200 270 V 740 A 60 60 0 0 0 260 800 H 610 A 40 40 0 0 0 650 760 V 380 A 30 30 0 0 0 620 350 H 380 A 30 30 0 0 0 350 380 V 440 A 75 75 0 0 0 500 440 V 350"/></svg>',
  diff:
    '<svg class="icon icon-diff" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M12 3L12 21M14.7107 19.3887C17.1796 18.8321 19.1072 16.979 19.6863 14.6058C20.1046 12.8918 20.1046 11.1081 19.6863 9.39419C19.1072 7.02094 17.1796 5.16789 14.7107 4.61121M12 4.30969C11.0904 4.30969 10.1808 4.41019 9.28927 4.61121C6.82045 5.16789 4.89278 7.02094 4.31367 9.39419C3.89544 11.1081 3.89544 12.8918 4.31367 14.6058C4.89278 16.979 6.82045 18.8321 9.28928 19.3887C10.1808 19.5898 11.0904 19.6903 12 19.6903"/></svg>',
} as const;

```

`logoSvg` (above) is exported from this same file.

#### Styles

`src/app/chrome.css` (exact content; every colour is a variable from `tokens.css`):

```
/* Page frame copied from the author's diff-checker site. Colours come from tokens.css only. */
*,
*::before,
*::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  margin: 0;
  background: var(--body-background);
  color: var(--text-body);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
a { color: inherit; }
button { font: inherit; color: inherit; }
:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }

.theme-ready body,
.theme-ready .site-header,
.theme-ready .site-footer,
.theme-ready .theme-toggle,
.theme-ready .card,
.theme-ready .btn-primary,
.theme-ready .btn-secondary {
  transition: background-color .3s, color .3s, border-color .3s, box-shadow .3s;
}

.container { width: 100%; max-width: var(--container); padding: 0 var(--gutter); margin: 0 auto; }
.container-wide { width: 100%; max-width: var(--container-wide); padding: 0 var(--gutter); margin: 0 auto; }

.card {
  padding: 24px;
  background: var(--card-background);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-l1);
}
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  min-height: 44px; padding: 10px 20px; border: none;
  border-radius: var(--radius-card);
  background: var(--accent); color: var(--accent-text);
  box-shadow: var(--shadow-l1); font-weight: 700; cursor: pointer;
}
.btn-secondary {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 36px; padding: 6px 14px;
  border: 1px solid var(--border); border-radius: var(--radius-control);
  background: var(--card-background); color: var(--text-main);
  font-weight: 600; cursor: pointer;
}
.btn-secondary:hover { border-color: var(--border-strong); background: var(--card-background-muted); }
.btn-primary:disabled,
.btn-secondary:disabled { opacity: .5; cursor: not-allowed; }

/* ---- header ---- */
.site-header { position: relative; background: var(--card-background); border-bottom: 1px solid var(--border); }
.header-inner {
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-areas: "brand nav toggle";
  align-items: center;
  gap: 12px 24px;
  min-height: 72px;
  padding-top: 12px;
  padding-bottom: 12px;
}
.brand { grid-area: brand; display: flex; align-items: center; gap: 12px; min-width: 0; text-decoration: none; }
.brand-icon { width: 36px; height: 36px; flex-shrink: 0; color: var(--accent); }
.brand-text { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
.brand-name { color: var(--accent); font-size: 17px; font-weight: 700; }
.brand:hover .brand-name { opacity: .8; }

.theme-toggle {
  grid-area: toggle;
  display: inline-flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; padding: 0;
  border: 1px solid var(--border); border-radius: 50%;
  background: var(--card-background); color: var(--text-main); cursor: pointer;
}
.theme-toggle:hover { border-color: var(--border-strong); background: var(--card-background-muted); }
.theme-toggle .icon-sun,
:root[data-scheme="dark"] .theme-toggle .icon-moon { display: none; }
:root[data-scheme="dark"] .theme-toggle .icon-sun { display: block; }

.site-nav { grid-area: nav; }
.site-nav ul { display: flex; gap: 4px; margin: 0; padding: 0; list-style: none; }
.site-nav a {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 12px; border: none; border-radius: var(--radius-control);
  background: transparent; color: var(--text-body);
  font-family: inherit; font-size: 15px; white-space: nowrap; text-decoration: none; cursor: pointer;
  transition: background-color .2s, color .2s, border-color .2s;
}
.site-nav a:hover { color: var(--text-main); background: var(--card-background-muted); }
.nav-icon { flex-shrink: 0; width: 18px; height: 18px; }
.support-link-item .heart-icon,
.footer-support .heart-icon { fill: none; transition: fill .2s, stroke .2s; }
.support-link-item:hover .heart-icon,
.footer-support:hover .heart-icon { fill: var(--danger); stroke: var(--danger); }

/* ---- "My Other Tools" menu ---- */
.menu-social-dropdown { position: relative; display: inline-flex; align-items: center; }
.menu-social-dropdown-toggle {
  display: inline-flex; align-items: center; gap: 8px;
  margin: 0; padding: 7px 12px; border: 0; border-radius: var(--radius-control);
  background: transparent; color: var(--text-body);
  font-family: inherit; font-size: 15px; line-height: inherit; white-space: nowrap; cursor: pointer;
  transition: background-color .15s, color .15s, border-color .15s;
}
.menu-social-dropdown-toggle:hover { background: var(--card-background-muted); color: var(--text-main); }
.menu-social-dropdown-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.menu-social-dropdown-toggle[aria-expanded="true"] { color: var(--accent); }
.menu-social-dropdown-chevron { display: inline-flex; align-items: center; margin-left: -2px; }
.menu-social-dropdown-chevron svg { width: 12px; height: 12px; stroke-width: 2.5px; transform: rotate(90deg); transition: transform .2s; }
.menu-social-dropdown-toggle[aria-expanded="true"] .menu-social-dropdown-chevron svg { transform: rotate(-90deg); }
.menu-social-dropdown-panel {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 50;
  width: 320px; max-width: calc(100vw - 32px); padding: 8px;
  background: var(--card-background); border: 1px solid var(--border); border-radius: var(--radius-card);
  box-shadow: var(--shadow-l2), 0 12px 32px #0000001f;
}
[data-scheme="dark"] .menu-social-dropdown-panel { box-shadow: 0 12px 32px #00000080; }
.menu-social-dropdown-panel[hidden] { display: none; }
.menu-social-dropdown-title {
  margin: 6px 10px; color: var(--text-muted);
  font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
}
.menu-social-dropdown-panel ul { display: block; margin: 0; padding: 0; list-style: none; }
.menu-social-dropdown-panel a {
  display: flex; align-items: center; gap: 12px; padding: 10px;
  border-radius: var(--radius-control); color: var(--text-main); font-size: 14px; text-decoration: none; white-space: normal;
  transition: background-color .15s;
}
.menu-social-dropdown-panel a:hover { background: var(--card-background-muted); }
.menu-social-dropdown-panel a:focus-visible { background: var(--card-background-muted); outline: 2px solid var(--accent); outline-offset: -2px; }
.menu-social-dropdown-icon { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.menu-social-dropdown-icon svg { width: 32px; height: 32px; stroke: var(--accent); }
.menu-social-dropdown-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; text-align: left; }
.menu-social-dropdown-name { color: var(--text-main); font-size: 14px; font-weight: 700; }
.menu-social-dropdown-description { color: var(--text-muted); font-size: 12px; line-height: 1.35; }
.menu-social-dropdown-external { display: flex; flex-shrink: 0; margin-left: auto; color: var(--text-muted); }
.menu-social-dropdown-external svg { width: 16px; height: 16px; }

/* ---- footer ---- */
.site-footer {
  padding: 20px 0 28px;
  border-top: 1px solid var(--border);
  background: var(--card-background); color: var(--text-muted);
  font-size: var(--font-size-sm);
}
.footer-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 24px; }
.footer-meta { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; }
.copyright { color: var(--text-body); font-weight: 600; }
.footer-nav { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 20px; }
.footer-nav a { color: var(--text-body); text-decoration: none; }
.footer-nav a:hover { color: var(--text-main); text-decoration: underline; }
.footer-nav .footer-support { display: inline-flex; align-items: center; gap: 6px; color: var(--accent); font-weight: 600; }

/* ---- small screens ---- */
@media (width <= 768px) {
  .header-inner { grid-template-columns: 1fr auto; grid-template-areas: "brand toggle" "nav nav"; min-height: 0; padding-bottom: 8px; }
  .site-nav { padding-top: 8px; }
  .site-nav a.nav-text-desktop .nav-label { display: none; }
  .site-nav a.nav-text-desktop {
    justify-content: center; width: 40px; height: 40px; padding: 0;
    border: 1px solid var(--border); border-radius: 50%;
  }
  .site-nav a.nav-text-desktop:hover { border-color: var(--border-strong); }
  .mobile-hide { display: none !important; }
  .menu-social-dropdown { position: static; }
  .menu-social-dropdown-toggle {
    justify-content: center; gap: 0; width: 40px; height: 40px; padding: 0;
    border: 1px solid var(--border); border-radius: 50%;
  }
  .menu-social-dropdown-toggle:hover { border-color: var(--border-strong); }
  .menu-social-dropdown-toggle .nav-label,
  .menu-social-dropdown-toggle .menu-social-dropdown-chevron { display: none; }
  .menu-social-dropdown-panel { top: 100%; right: auto; left: var(--gutter); width: min(320px, 100vw - 32px); }
}
@media (width <= 767px) {
  .footer-row { flex-direction: column; text-align: center; }
  .footer-meta,
  .footer-nav { justify-content: center; text-align: center; }
  .footer-meta { flex-direction: column; gap: 0; }
  .footer-sep { display: none; }
}

```

Replace the contents of `src/app/style.css` with this "studio skin". It styles the tool inside the frame, uses variables only, and supersedes the minimal layout rules from Task 12. In `ui.ts`, give every `<button>` in `#toolbar`, `#canvas-controls`, `#props` and the dialogs the class `btn-secondary`, except `#btn-export`, which gets `btn-primary`.

```
/* ---- studio skin ---- */
#main { flex: 1 0 auto; display: flex; flex-direction: column; padding-top: 16px; padding-bottom: 24px; }
#app { display: flex; flex-direction: column; flex: 1; gap: 12px; }
#toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
#workspace { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(0, 2fr); gap: 12px; flex: 1; min-height: 520px; }
#text-panel,
#canvas-panel {
  display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 12px;
  background: var(--card-background); border: 1px solid var(--border);
  border-radius: var(--radius-card); box-shadow: var(--shadow-l1);
}
#canvas-panel { position: relative; }
#source {
  flex: 1; min-height: 200px; width: 100%; resize: none; padding: 10px;
  border: 1px solid var(--border); border-radius: var(--radius-control);
  background: var(--card-background-muted); color: var(--text-main);
  font-family: var(--font-mono); font-size: 14px; line-height: 1.5;
}
#diagnostics { margin: 0; padding: 0; list-style: none; font-size: var(--font-size-sm); }
#diagnostics li { padding: 4px 0; cursor: pointer; }
#diagnostics li.error { color: var(--danger); }
#diagnostics li.warning { color: var(--text-muted); }
#canvas { flex: 1; width: 100%; min-height: 360px; border-radius: var(--radius-control); touch-action: none; }
#canvas-controls,
#props { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
#message { min-height: 1.5em; color: var(--text-body); font-size: var(--font-size-sm); }
select,
#props input[type="text"],
#export-panel input[type="text"],
#inline-edit {
  padding: 6px 10px; border: 1px solid var(--border); border-radius: var(--radius-control);
  background: var(--card-background); color: var(--text-main); font: inherit;
}
#inline-edit { position: absolute; z-index: 5; resize: none; box-shadow: var(--shadow-l2); }
dialog {
  padding: 20px; border: 1px solid var(--border); border-radius: var(--radius-card);
  background: var(--card-background); color: var(--text-main); box-shadow: var(--shadow-l2);
}
dialog::backdrop { background: #00000066; }
body.presenting .site-header,
body.presenting .site-footer,
body.presenting #toolbar,
body.presenting #text-panel,
body.presenting #canvas-controls,
body.presenting #props { display: none; }
body.presenting #workspace { grid-template-columns: 1fr; }
@media (width <= 900px) { #workspace { grid-template-columns: 1fr; } }

```

`main.ts` imports, in this order: `@fontsource/lato/400.css`, `@fontsource/lato/700.css`, `./tokens.css`, `./chrome.css`, `./style.css`. (Weight 600, used by the buttons, resolves to Lato 700, as on the author's site.)

#### Wiring in `ui.ts`

1. Start-up: call `mountChrome(document, store, import.meta.env.VITE_SOURCE_URL)` before the app is built.

2. The diagram theme is `THEMES[resolveTheme(settings.theme, scheme)]`, where `scheme` is `document.documentElement.getAttribute('data-scheme') === 'dark' ? 'dark' : 'light'`. When the scheme watcher reports a change, read the scheme again and redraw, so with the choice "Match page" the canvas switches between Daylight and Midnight together with the page.

3. Present mode (Task 19) hides the header and footer (the CSS above does it through `body.presenting`).

#### `scripts/check-dist.mjs` additions (after the existing steps, before printing `OK`)

7. Check that these files exist in `dist/`: `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `theme-init.js`. Otherwise print the missing file and exit 1.

8. In `dist/index.html`, check that the text `href="<base>favicon.svg"`, `href="<base>favicon.ico"`, `href="<base>apple-touch-icon.png"` and `src="<base>theme-init.js"` all appear (`<base>` is `BASE_PATH`, default `/`). If Vite did not add the base to one of them, write that attribute as `%BASE_URL%favicon.svg` (and so on) in `index.html` and build again.

9. Check that `dist/index.html` contains no `%VITE_` text. Otherwise print `Unreplaced environment placeholder in dist/index.html` and exit 1.

* [x] **Step 1: Install the font package.** `npm install @fontsource/lato`.

* [x] **Step 2: Write the failing tests** (below).

* [x] **Step 3: Create** `favicon.svg`, `theme-init.js`, `icons.ts`, `scheme.ts`, `chrome.ts`, `chrome.css` and the `.env` file, extend `src/vite-env.d.ts`, rewrite `index.html`, then run `npm run icons`.

* [x] **Step 4: Wire** `main.ts` and `ui.ts` as described, add the skin to `style.css`, and extend `check-dist.mjs`.

* [x] **Step 5: Run** `npm test`, `npm run build && npm run check:dist`, and `npm run test:e2e`. Expected: PASS.

* [x] **Step 6: Compare by eye (a step for the person you are working with; an agent cannot judge this).** Ask them to open https://u77w41.github.io/diff-checker/ next to the running site in a light and a dark browser window and compare: header height and layout, logo and name, round toggle, nav buttons, footer line and links, colours, font. Write any difference they accept into `DECISIONS.md`. If nobody is available, write `Task 22: visual comparison with the reference site not done` there and go on.

* [x] **Step 7: Commit.** `git add -A && git commit -m "feat: logo, favicon, site header and footer, colour scheme"`

**Tests.**

```
// scheme.test.ts (mem(x) is an in-memory store whose getItem returns x; throwing is a store whose methods throw)
readPref(null) -> 'auto';  readPref(mem('dark')) -> 'dark';  readPref(mem('light')) -> 'light';  readPref(mem('auto')) -> 'auto'
readPref(mem('purple')) -> 'auto';  readPref(mem(null)) -> 'auto';  readPref(throwing) -> 'auto'              // Review Focus 5
writePref(null, 'dark') -> false;  writePref(throwing, 'dark') -> false;  writePref(mem(null), 'dark') -> true
isDark('dark', false) true;  isDark('light', true) false;  isDark('auto', true) true;  isDark('auto', false) false
nextPref('auto', false) -> 'dark';   nextPref('dark', false) -> 'auto';  nextPref('light', false) -> 'dark'
nextPref('auto', true)  -> 'light';  nextPref('light', true) -> 'auto';  nextPref('dark', true)  -> 'light'
// applyScheme with a fake SchemeDoc that records calls and returns a fake <meta> for the media-less theme-color selector
applyScheme('dark', false, fake) -> 'dark', sets data-scheme 'dark' and the meta content '#303030'
applyScheme('auto', false, fake) -> 'light', sets data-scheme 'light' and the meta content '#f5f5fa'
applyScheme('light', true, fake) with no such meta element -> 'light' and no error
// chrome.test.ts
copyrightText(2026) -> '© 2026 Ujjwal Chowdhury';  copyrightText(2027) -> '© 2026 – 2027 Ujjwal Chowdhury';  copyrightText(2020) -> '© 2026 Ujjwal Chowdhury'
const h = headerHtml();
h contains: 'class="brand-name">Gati-chitra<', 'aria-label="Gati-chitra home"', 'id="theme-toggle"', 'aria-label="Main"',
  'href="https://u77w41.github.io/resume/"', 'Support my work', 'href="https://u77w41.github.io/diff-checker/"',
  'href="https://u77w41.github.io/anurup/"', 'ANURUP', 'Privacy-first photo &amp; PDF tools for online forms',
  'stroke="currentColor"', 'class="heart-icon"', 'aria-expanded="false"', ' hidden>'
h does not contain: '#000000', 'Privacy-first photo & PDF' (an unescaped ampersand)
const f = footerHtml(2026, 'https://github.com/U77w41/gati-chitra');
f contains: '© 2026 Ujjwal Chowdhury', 'Runs entirely in your browser', 'aria-label="Footer"', '>Hire Me<', '>Diff Checker<', '>Anurup<',
  '>Source<', 'href="https://github.com/U77w41/gati-chitra"', 'data-testid="support-link-footer"', 'Support my work'
// brand.test.ts (reads files with node:fs from the project root)
public/favicon.svg contains 'viewBox="0 0 512 512"', 'prefers-color-scheme: dark', '#363853', '#cbd5e1', 'M 408 42 L 408 78'; it has exactly 2 '<circle' elements and 3 '<path' elements
public/favicon.ico: bytes 0..5 are [0, 0, 1, 0, 1, 0]; byte 6 and byte 7 are 32; readUInt32LE(14) equals fileLength - 22; readUInt32LE(18) equals 22;
  bytes 22..29 are the PNG signature [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
public/apple-touch-icon.png: readUInt32BE(16) equals 180 and readUInt32BE(20) equals 180
public/theme-init.js contains "'StackColorScheme'" and "setAttribute('data-scheme'"
logoSvg('brand-icon') contains 'class="brand-icon"', 'currentColor', 'M 408 42 L 408 78' and does not contain '#000000'
ICONS: every value starts with '<svg' and ends with '</svg>'; ICONS.support contains 'class="heart-icon"'

```

`tests/e2e/chrome.spec.ts` (`/?e2e=1`):

* **Header:** `.site-header` is at least 72 px high at a 1280 px viewport; `.brand-name` reads `Gati-chitra`; `.brand-icon` is an `<svg>` inside `.brand`; the nav has links `Hire Me` (href `https://u77w41.github.io/resume/`) and `Support my work`; `#theme-toggle` has an accessible name.

* **Footer:** `.copyright` text matches `/^© 2026( – \d{4})? Ujjwal Chowdhury$/`; the footer contains `Runs entirely in your browser`; its links are `Hire Me`, `Diff Checker`, `Anurup`, `Source` and `Support my work`, with the hrefs given above; the `Source` link starts with `https://github.com/`.

* **Scheme follows the system:** with `page.emulateMedia({ colorScheme: 'dark' })` before loading, `html[data-scheme]` is `dark` and the computed `background-color` of `<body>` is `rgb(48, 48, 48)`; with `light` it is `light` and `rgb(245, 245, 250)`.

* **Toggle:** with a light system, click `#theme-toggle`: `data-scheme` becomes `dark` and `localStorage['StackColorScheme']` is `dark`; click again: `data-scheme` is `light` and the stored value is `auto`. Set the scheme to dark, reload: `document.documentElement.dataset.scheme` is `dark` immediately after load (no flash).

* **Canvas follows the page:** with the theme choice "Match page", the pixel at the canvas corner is white (`255, 255, 255`) in the light scheme and `48, 48, 48` after the toggle to dark; choosing Lagoon in `#theme` keeps the Lagoon background after the toggle.

* **Storage disabled** (Review Focus 5): `addInitScript` makes `Storage.prototype.setItem` and `getItem` throw; the page loads, and the toggle still switches the scheme for the current page view.

* **Narrow window** (600 px wide): `.site-nav` sits below `.brand` (its top is greater than the brand's bottom), `.nav-label` is not visible, the `.mobile-hide` Support link is not visible in the header but the footer's Support link is, and the nav buttons are 40 by 40 px.

* **Tools menu:** clicking `#tools-toggle` shows the panel (`aria-expanded="true"`) with two entries, `Diff Checker` and `ANURUP`; `Escape` hides it and focus returns to `#tools-toggle`; clicking elsewhere hides it.

* **Present mode** hides `.site-header` and `.site-footer` (`display: none`).

`tests/e2e/branding.spec.ts`: the `<title>` is `Gati-chitra · Ujjwal Chowdhury`; `meta[property="og:site_name"]` is `Ujjwal Chowdhury`; two `meta[name="theme-color"]` elements exist with the `media` values `(prefers-color-scheme: light)` and `(prefers-color-scheme: dark)`; `link[rel="icon"][type="image/svg+xml"]` points at a `favicon.svg` that loads with status 200 and content type `image/svg+xml`; `favicon.ico` and `apple-touch-icon.png` load with status 200; the canonical link is `https://u77w41.github.io/gati-chitra/`; the page contains no text `%VITE_`.

### Task 23: README, release checklist, final verification

**Delivers:** documentation, and the finish line for F1 to F20.

**Files:**

* Modify: `README.md`, `DECISIONS.md`

* Create: `RELEASE_CHECKLIST.md`

* Preserve existing: `SECURITY.md` (the repository already has the author's custom `SECURITY.md`; do not overwrite or replace it)

* \[ \] **Step 1: Write `README.md`** with these sections, in this order: (1) one paragraph on what Gati-chitra does; (2) **Run locally**: `npm install`, `npm run dev`, then the test commands; (3) **Deploy to GitHub Pages**: push to `https://github.com/U77w41/gati-chitra`, set Settings, Pages, Source to GitHub Actions, push to `main`, and note that a repository named `<user>.github.io` is served at the root and any other repository under `/<repository-name>/` (so Gati-chitra is served at `https://u77w41.github.io/gati-chitra/`, and the workflow sets `BASE_PATH` automatically); (4) **Supported Mermaid syntax**: a short version of Part 4, and the rule that lines the site does not understand are kept; (5) **Keyboard shortcuts**: the table from Task 19; (6) **Limits**: the numbers from `LIMITS` and `EXPORT`; (7) **Saving**: PNG, SVG (static), GIF and MP4 or WebM, and that positions of moved nodes are stored as `%% studio:pos` comments that other Mermaid tools ignore; (8) **Privacy**: nothing leaves the browser after the page loads; (9) **Branding**: the logo and favicon come from `public/favicon.svg`; the name, owner and links are in `BRAND` (`src/core/constants.ts`) and in `index.html`; the colours are the variables in `src/app/tokens.css`, shared with the author's diff-checker site; the page font is Lato; (10) **Working with AI agents**: `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` tell an AI tool how to work in this repository, and they install and use the superpowers and humanizer skills; (11) **Known limitations**: groups are edited in the text, one statement per line, only flowcharts. Put the logo above the title with `<img src="public/favicon.svg" alt="Gati-chitra logo" width="64">`. Verify that the existing custom `SECURITY.md` is intact and unmodified. Then run the humanizer (see "Start here") on `README.md`, and check that every command, number, path and version in it is unchanged.

* \[ \] **Step 2: Create `RELEASE_CHECKLIST.md`** by copying Part 9 of this document.

* \[ \] **Step 3: Run everything** from a clean state: `rm -rf node_modules dist && npm ci && npm test && npm run build && npm run check:dist && npm run test:e2e`. Expected: every command succeeds.

* \[ \] **Step 4: Review `DECISIONS.md`.** Every line must have the form `Task N: chose X because Y`. Remove duplicates.

* \[ \] **Step 5: Work through Part 9** and tick each box by hand-testing the running site (`npm run preview`).

* \[ \] **Step 6: Commit.** `git add -A && git commit -m "docs: README and release checklist"`. Create the tag `v0.1.0` only after every box in Part 9 is ticked: `git tag v0.1.0`.

## Part 7. Troubleshooting for implementers

| Symptom | Likely cause | Fix | 
| ----- | ----- | ----- | 
| A diagnostic points one line too early or too late | Mixed 0-based indexes and 1-based line numbers | Diagnostics use `index + 1`; everything else uses `index` | 
| Nodes appear shifted by half their size | dagre returns node **centres**, not top-left corners | Store centres in `NodeBox.center` and subtract half the size only when drawing a rectangle | 
| After a drag the arrows do not follow | The stored scene was mutated, or edges were not routed again | Never mutate a scene; use `withNodeAt`, which returns a new scene | 
| The dash animation runs backwards | Wrong sign of `lineDashOffset` | The offset must decrease as the phase grows: `0 - phase * 64` | 
| Canvas looks blurry on a sharp screen | The canvas backing size equals its CSS size | Backing size = CSS size times `devicePixelRatio`, then `setTransform(dpr, 0, 0, dpr, 0, 0)` | 
| The page scrolls while zooming with the wheel | Passive wheel listener | Register with `{ passive: false }` and call `preventDefault()` | 
| A PNG is blank or black | The background was not drawn, or the canvas size is 0 | Call `drawBackground` before `drawScene`; check `pixelWidth` and `pixelHeight` | 
| GIF colours are wrong or flicker | A palette from only the first frame, or different palettes per frame | Build one shared palette from the four sample frames (Task 17) | 
| An export freezes in a background tab | `setTimeout` is throttled there | Yield with `MessageChannel` (`yieldToEventLoop`) | 
| A share link or template fails on GitHub Pages | A root-relative URL, or path-based routing | Use `import.meta.env.BASE_URL` for files and the URL hash for links | 
| The undo list fills with one entry per letter typed | No coalescing | Commit typing with `coalesce: true` (Task 13) | 
| The parser hangs on odd input | A scan loop that does not advance its position | Every loop iteration must increase `p`; run the fuzz test from Task 5 | 
| A node called `end` breaks the diagram | `end` closes a subgraph in Mermaid | Never generate it (new ids are `n1`, `n2`) and keep the rule that a line holding only `end` closes a group | 
| A unit test says `Named export 'GIFEncoder' not found` | Node loaded the CommonJS build of `gifenc` | Keep `server: { deps: { inline: ['gifenc'] } }` in the `test` block of `vite.config.ts` (Task 1) | 
| TypeScript cannot find types for `gifenc` or `@dagrejs/dagre` | The package ships none or they are not picked up | Use the declaration files given in Tasks 1 and 8 | 
| Playwright cannot start Chromium in CI | Missing system libraries | `npx playwright install --with-deps chromium` | 
| SVG text sits too high or low in an editor | `dominant-baseline` is not honoured everywhere | Use `dy="0.35em"` as specified in Task 16 | 
| A looping animation jumps at the loop point | A phase that is not taken modulo 1, or a value that is not periodic | Compute `p = ((phase % 1) + 1) % 1` once and base every effect on it | 
| Tests that wait for the picture are flaky | Fixed sleeps | Poll `__studio.getSummary()` until it shows the expected nodes | 
| The page flashes the wrong colours when it loads | The scheme is applied after the first paint | Load `theme-init.js` as a normal (non-module) script in `<head>`, before the app script, as in the `index.html` of Task 22 | 
| The logo disappears in dark mode | Its strokes use a fixed colour | Inline the logo with `currentColor` and set `color: var(--accent)` on `.brand-icon`; the standalone `favicon.svg` has its own `prefers-color-scheme` rule | 
| Favicon, icons or `theme-init.js` return 404 on GitHub Pages | Root-relative URLs that ignore the sub-path | Write them as `/favicon.svg` and so on in `index.html` so Vite adds the base, and run `npm run check:dist`, which checks the built HTML; if one is not rewritten, use `%BASE_URL%favicon.svg` for that attribute | 
| The footer or the page head shows the text `%VITE_SITE_URL%` | The environment variable was not available at build time | Keep `.env` in the repository and keep the "Compute base path and site URLs" step in the workflow | 
| A skill install command fails, or the skill is not listed | The tool or the project changed its install method, or the session was not restarted | Start a new session; read the project's page (https://github.com/obra/superpowers, https://github.com/blader/humanizer); use the current method; record it in `DECISIONS.md`; if the skill still cannot be installed, follow Part 0, which holds the same rules | 

## Part 8. Appendix A: test diagrams (the corpus)

Task 5 creates `tests/support/corpus.ts` exporting `CORPUS: { name: string; text: string; ok: boolean; nodes: number; edges: number; groups: number }[]` with these six entries, in this order. The `text` of each is exactly the code block shown (with `\n` between lines and no trailing newline).

| \# | name | ok | nodes | edges | groups | 
| ----- | ----- | ----- | ----- | ----- | ----- | 
| 1 | approval | true | 5 | 5 | 0 | 
| 2 | pipeline | true | 5 | 4 | 2 | 
| 3 | alert | true | 3 | 2 | 0 | 
| 4 | arrow-styles | true | 7 | 8 | 0 | 
| 5 | comments | true | 2 | 1 | 0 | 
| 6 | invalid | false | 0 | 0 | 0 | 

**1. approval**

```
flowchart TD
  A[Start] --> B{Valid?}
  B -->|yes| C[Save]
  B -->|no| D[Fix input]
  D --> B
  C --> E([Done])

```

**2. pipeline**

```
graph LR
  subgraph ingest [Ingest]
    S3[(Raw files)] --> Parse[Parse]
  end
  subgraph serve [Serve]
    API[API] --> UI[[Web app]]
  end
  Parse --> Store[(Warehouse)]
  Store --> API

```

**3. alert**

```
flowchart TB
  classDef hot fill:#ffe4e1,stroke:#c0392b,stroke-width:2px;
  A[Alert]:::hot --> B[Page on-call]
  B -.-> C[Ack]
  style C fill:#e8f8f5
  linkStyle 0 stroke:#c0392b,stroke-width:3px

```

**4. arrow-styles**

```
flowchart LR
  A --> B --> C
  A & B ==> D
  C -- label text --> D
  D --o E
  E --x F
  F <--> G

```

**5. comments**

```
%%{init: {"theme": "forest"}}%%
flowchart TD
  %% a comment
  A[Start] --> B[End]
  click A "https://example.com"
  %% studio:layout v1
  %% studio:pos A 100 40
  %% studio:pos B 100 200

```

**6. invalid**

```
sequenceDiagram
  A->>B: hi

```

Expected details: diagram 1 has edge labels `yes` (edge 1) and `no` (edge 2) and a cycle between B and D; diagram 2 puts S3 and Parse in group `ingest`, API and UI in group `serve`, and Store in no group; diagram 4 has the edge kinds, in order, `arrow`, `arrow`, `thickArrow`, `thickArrow`, `arrow` (label `label text`), `circleEnd`, `crossEnd`, `bidirectional`; diagram 5 has one warning, on line 5, for the `click` line, and two pins.

## Part 9. Final checklist

Tick every box before the release tag.

**Setup (Task 0)**

* \[ \] `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` exist, and `src/repo.test.ts` passes.

* \[ \] The superpowers and humanizer skills are installed in the tool you used, and the agent can list them.

* \[ \] `.gitignore` exists, and `git ls-files` shows no file under `node_modules/` or `dist/`.

* \[ \] `README.md` went through the humanizer (with every command, number and path in it still correct), and the custom `SECURITY.md` is preserved intact.

**Automated** (run from a clean checkout)

* \[ \] `npm ci` succeeds.

* \[ \] `npm test` passes.

* \[ \] `npm run build` passes with no type errors.

* \[ \] `npm run check:dist` passes, also with `BASE_PATH=/gati-chitra/` after building with it.

* \[ \] `npm run test:e2e` passes.

* \[ \] `git status` is clean; every task has its own commit; `DECISIONS.md` is reviewed.

**Features, tested by hand on the running site**

* \[ \] F1: typing updates the picture within about a quarter of a second.

* \[ \] F2: every diagram in Part 8 behaves as its row says.

* \[ \] F3: add `click A "https://x"` and a `%%` comment to a diagram, then drag one node and rename another: the click line and the comment are unchanged and in the same place.

* \[ \] F4: a dragged node stays put; Auto-layout clears the pins and the diagram re-flows.

* \[ \] F5: move, connect, add (toolbar, double-click, drop an arrow on empty space), rename in place, delete, change shape, change colours, change arrow style, reverse an arrow, and undo and redo each of them.

* \[ \] F6: break the text; the last picture stays and the errors list line numbers; fix the text and editing works again.

* \[ \] F7: all four animation styles, speed, density, glow and pause behave.

* \[ \] F8: all four themes look right.

* \[ \] F9: wheel zoom, Space-drag pan and Fit work.

* \[ \] F10: present mode steps forward and back, and exits with Escape.

* \[ \] F11: PNG at 1x, 2x and 3x, transparent and themed background, content and slide frames all save and open.

* \[ \] F12: the SVG opens in a browser; text with `&` and `<` is correct; if you have a vector editor or slide tool, open it there and note the result in `DECISIONS.md`.

* \[ \] F13: the GIF loops and plays; try it in a slide tool if you have one.

* \[ \] F14: an MP4 or WebM plays; with the encoder disabled, the GIF fallback and message appear.

* \[ \] F15: Save and Open of `.mmd` files work; reloading restores the last diagram.

* \[ \] F16: a share link opens the same diagram in a fresh tab; all five templates load.

* \[ \] F17: after the page has loaded, switch the network off: editing and PNG and SVG saving still work.

* \[ \] F18: the deployed site works under its sub-path, including templates and a share link.

* \[ \] F19: every shortcut in the Task 19 table works.

* \[ \] F20: the whole page can be used with the keyboard alone; reduced-motion starts paused; buttons have names a screen reader can read.

* \[ \] F21: the favicon shows in the browser tab with a light and with a dark browser theme; the header logo is visible in both page schemes; `public/favicon.svg` opened on its own matches the supplied artwork.

* \[ \] F22: open https://u77w41.github.io/diff-checker/ next to the site, in light and in dark: the header (72 px, logo, name, round toggle, navigation), the footer (copyright line and links), the colours and the font match. The toggle works and remembers the choice, returns to "follow the system" on the second press when that matches the system, and the choice carries over between the two sites. In a narrow window the header becomes two rows with round icon buttons.

**Browsers**

* \[ \] Chrome or Edge: load, edit, drag, export PNG, SVG, GIF and video.

* \[ \] Firefox: load, edit, drag, export PNG, SVG and GIF (video if it is supported).

* \[ \] Safari: load, edit, drag, export PNG, SVG and GIF (video if it is supported).

**Release**

* \[ \] The site is deployed by the workflow and the Pages source is set to GitHub Actions.

* \[ \] The tag `v0.1.0` exists.

*End of plan.*