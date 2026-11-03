# Gati-chitra Improvements (v0.2 to v0.6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: in Gemini CLI, use the superpowers `executing-plans` skill and follow "Running this plan with Gemini CLI" below. In Claude Code, use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Steps use checkbox (`- [ ]`) syntax for tracking. If your tool has no such skills, follow Part 0 of this document instead; it contains the same rules.

**Goal:** Take the finished v0.1 site to v0.6 in five shippable milestones: fix the bugs found in review, read real-world Mermaid flowcharts, give the editor a proper code panel and keyboard access, make the site an installable offline app that search engines and social cards describe well, and make it usable on a phone.

**Architecture:** Nothing about the core changes. Mermaid text is still the source of truth, visual edits are still small text patches, and the site is still static files on GitHub Pages. New syntax extends the hand-written parser and the existing `ParsedDoc` types. The `<textarea>` becomes a CodeMirror 6 editor that has no history of its own, so the app's `History` stays the only undo stack. A hand-written service worker, built by a small Vite plugin, precaches every file so the site works offline.

**Tech Stack:** unchanged (TypeScript strict, Vite, Vitest, Playwright, `@dagrejs/dagre`, `gifenc`, `mediabunny`, `@fontsource/lato`). Added at runtime: `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/language`, `@codemirror/lint` (Task 46). Added for development: `oxlint` (Task 24), `@axe-core/playwright` (Task 45). Nothing else.

**Spec:** this document. The owner asked for one plan file, so the agreed design is in Part 1 instead of a separate spec. The v0.1 plan, `docs/superpowers/plans/2026-11-02-gati-chitra.md`, stays as the reference for every contract this plan does not change (its Parts 2 to 5).

---

## Start here

1. Read Part 0, Part 1 and Part 2 of this document. Read Parts 3 to 5 when a task names them.
2. Run `git log --oneline`. v0.1 ended with `docs: remove GitHub Pages deployment section from README` and the tag `v0.1.0`; the commit that adds this plan follows it. This plan's tasks are numbered 24 to 60 so that they continue the v0.1 numbering. Start with the first task whose commit message (given at the end of each task) is not in the log yet.
3. Run `npm ci && npm test && npm run build && npm run check:dist`. All four must pass before Task 24. If one fails, stop and use `superpowers:systematic-debugging`.

## Running this plan with Gemini CLI

The owner runs this plan in Gemini CLI. This section tells the owner what to set up and tells Gemini how to work.

### For the owner: once, before the first session

1. Install the skills as `GEMINI.md` describes (`gemini extensions install https://github.com/obra/superpowers` and `npx skills add blader/humanizer --global`). Start a new Gemini CLI session in the repository folder. Run `/memory show` and confirm that it contains "Agent instructions for Gati-chitra"; if not, run `/memory reload`.
2. Install the Playwright browsers once: `npx playwright install chromium firefox webkit` (on Linux, add `--with-deps`).
3. Commit this plan file and the `AGENTS.md` change on `main`, so the plan is in git before any task commit.
4. Work on a branch: `git switch -c improvements`. Gemini commits to it. Merging and pushing are yours.

### For the owner: the prompt that starts a milestone

Paste this, changing the milestone. One milestone per session keeps the context small.

```
Read AGENTS.md, then docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md: the sections "Start here", "Running this plan with Gemini CLI", Part 0, Part 1 and Part 2. Use the superpowers executing-plans skill. Do milestone M1 only (Tasks 24 to 33), one task at a time, in order, exactly as written, with test-driven-development for every task. Stop after the milestone's release task and give me the by-hand items of its Part 7 checklist.
```

### For the owner: the prompt that resumes after a restart or `/compress`

```
Read AGENTS.md and the "Running this plan with Gemini CLI" section of docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md. Run git log --oneline and read DECISIONS.md to find the first task of the current milestone with no commit, then continue from there with the executing-plans skill. Do not redo a task that has a commit.
```

### For Gemini: how to work

1. **Read a task fully before you start it.** Search for its heading (`### Task 27:`) and read to the next `### Task`. Also read every Part the task names. Do not read ahead into other tasks and start them.
2. **Follow the steps in order:** write the test, run it and see it fail, implement, run it and see it pass, run the task's full command list, then commit with the exact message given. If a test you were told to write passes before you implement, the test is wrong: fix the test, not the plan.
3. **Before each commit,** run `git status`. Only the task's files may be listed. Remove scratch files you made, and add new kinds of generated files to `.gitignore` (AGENTS.md section 5). Then use the task's `git add` line.
4. **Never start a command that does not exit.** Do not run `npm run dev` or `npm run preview` yourself: Playwright starts and stops its own server. Task 55's `make-og.mjs` starts and stops its own too. `npm run test:e2e` can take several minutes; wait for it to finish and read the summary.
5. **Do not change these files unless a task names them:** this plan (except ticking its checkboxes), `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `SECURITY.md`. Never change `SECURITY.md`.
6. **Never push, merge, rebase, force anything, or delete a branch or tag.** Create tags only in the release tasks, locally. Do not open pull requests.
7. **Copy exact values** (constants, messages, regular expressions, file names, commit messages) from the plan character for character. Where a task says "choose", choose the simplest option and add one line to `DECISIONS.md`.
8. **When stuck:** if a test fails twice for the same reason, use the `systematic-debugging` skill. If it still fails, write the blocker in `DECISIONS.md` as `Task N: blocked: <what fails, the command, the error>` and stop. Do not skip the task or weaken its test.
9. **When a step needs the internet** (current versions of npm packages or GitHub Actions in Tasks 24, 32 and 46), use `npm view <package> version` or `gh api repos/<owner>/<repo>/releases/latest`. If there is no network, keep the version already in the repository and say so in `DECISIONS.md`.
10. **At a milestone's end,** finish the release task, then stop. List the by-hand items from Part 7 for the owner. Do not begin the next milestone in the same session.

## Part 0. Rules for the implementer

Rules 2 to 11 and 13 to 15 of the v0.1 plan's Part 0 still apply word for word: one task at a time, tests first, exact names, no unasked-for features, no placeholders, no `any` outside `src/types/gifenc.d.ts`, conflict order, files under 300 lines, pure logic kept away from the DOM, 1-based diagnostic lines, skills from `AGENTS.md`. The rules below are added or changed.

1. **Hosting is GitHub Pages only.** No server, no backend, no serverless function, no third-party request at runtime, no analytics, no cookies, and no AI, chat or assistant feature of any kind. Every new URL respects Vite's `BASE_URL` (the site is served from `/gati-chitra/`).
2. **Milestones ship separately.** Each milestone ends with a release task. The implementer ticks the Part 7 boxes it can check by running commands, creates the tag locally, and lists the remaining boxes (by hand, real device, deployed site, owner) for the owner. The owner ticks those, then pushes. The next milestone starts only after that.
3. **New command.** From Task 24 on, run `npm run lint` with `npm test` after every task.
4. **Existing tests are contracts.** A task may change an existing test only when this plan names the change. Otherwise a failing existing test means your code is wrong.
5. **Decisions.** Same format as before: one line in `DECISIONS.md`, `Task N: chose X because Y`.
6. **Prose.** Run the humanizer on `README.md`, `RELEASE_CHECKLIST.md` and any docs page before committing it. Never on this plan, code, tests or config. `SECURITY.md` is never changed.
7. **Check versions when you add or bump a dependency or an Action.** Use the current release at the time you do the task (`npm view <pkg> version`, `gh api repos/<owner>/<repo>/releases/latest`). Pin npm runtime dependencies to exact versions. Record what you chose in `DECISIONS.md`.

### Commands

```
npm test              # unit tests (Vitest)
npm run lint          # oxlint (from Task 24)
npm run build         # type check (app and service worker) and production build
npm run check:dist    # checks the built site
npm run test:e2e      # browser tests (Playwright; three desktop browsers from Task 32, two phones from Task 57)
```

## Part 1. What changes (the agreed design)

### Constraints the owner set

- Static site on GitHub Pages only (Part 0, rule 1).
- No chatbot or AI feature, now or later.
- All four areas are in scope: Mermaid compatibility, editor UX and accessibility, offline PWA and discoverability, mobile and touch. CI hardening, dependency updates and code health are the baseline.

### Milestones

| Milestone | Version | Tasks | Theme |
| --- | --- | --- | --- |
| M1 | v0.2.0 | 24 to 33 | Foundations and fixes |
| M2 | v0.3.0 | 34 to 44 | Mermaid compatibility |
| M3 | v0.4.0 | 45 to 52 | Editor UX and accessibility |
| M4 | v0.5.0 | 53 to 56 | Offline PWA and discoverability |
| M5 | v0.6.0 | 57 to 60 | Mobile and touch |

### Features (IDs continue from v0.1's F1 to F22)

| ID | Feature | Done when |
| --- | --- | --- |
| F23 | No input can freeze the app | Duplicate subgraph ids, layout exceptions and bad share links show a diagnostic or message; the editor stays usable |
| F24 | No diagram is lost | Opening a share link, a second tab, closing the tab within 500 ms of typing and pressing New are all recoverable |
| F25 | Every control works from the keyboard and has a name | Enter activates focused buttons and links; every input has a visible or programmatic label; axe reports no WCAG 2.1 AA violation |
| F26 | Fast and small | Initial JS at most 150 KB gzip; every lazy chunk at most 80 KB gzip; the canvas is not redrawn while idle; dragging a node does not re-run dagre |
| F27 | Real-world Mermaid flowcharts parse | Every file in `tests/fixtures/compat/` parses with 0 errors and 0 warnings |
| F28 | New shapes and arrow forms are drawn | 10 new shapes, 5 new arrow kinds, link length, edge ids and per-edge animation |
| F29 | Markdown labels | `**bold**`, `*italic*`, `_italic_` and new lines in backtick-quoted labels |
| F30 | Title, accessible names, links | Front matter `title`, `accTitle`, `accDescr` and `click` links appear in the canvas and SVG |
| F31 | Code editor | Line numbers, highlighting, errors marked on their lines, one undo history shared with the canvas |
| F32 | Clear toolbar, help, resizable panels | Grouped toolbar, Help dialog, draggable and keyboard-adjustable split |
| F33 | Keyboard editing on the canvas | Select, move, rename, delete and connect without a pointer |
| F34 | Copy to clipboard | Copy PNG and Copy SVG in the export dialog |
| F35 | Installable and offline | Manifest, service worker, update notice, `.mmd` file handling |
| F36 | Discoverable | 1200x630 social image, 404 page, `sitemap.xml`, JSON-LD (no `robots.txt`: crawlers only read it at the domain root, see Task 55) |
| F37 | Phone layout | Text and Diagram tabs, compact toolbar, properties as a bottom sheet |
| F38 | Touch editing | Move, pan, pinch zoom, long press, double tap; share exports through the system share sheet |

### Design decisions (agreed with the owner)

1. **Code editor:** CodeMirror 6, with its `history()` extension left out. Ctrl+Z and Ctrl+Y inside the editor call the app's undo and redo. Canvas edits reach the editor as one minimal change, so the cursor stays where it was.
2. **Service worker:** hand-written (about 80 lines), built from `src/sw/sw.ts` by a Vite plugin that injects the precache list and a build id. Precache everything; network-first for HTML, cache-first for hashed assets. No Workbox.
3. **Layout speed:** stay on the main thread. Reuse the last dagre result when only pins, styles or colours changed. Redraw only when something changed or an animation is running.
4. **Shapes:** draw the four classic shapes v0.1 lacks (trapezoid, inverted trapezoid, double circle, asymmetric) and six common `@{ shape }` ones (document, small circle, filled circle, framed circle, fork bar, text). The other Mermaid shape names map to the nearest of the 20 with an info diagnostic.
5. **Lint:** oxlint. It does not depend on the TypeScript compiler API, so it works with TypeScript 7.
6. **Share link over autosave:** the share link becomes an undoable step on top of the autosaved diagram. No confirm dialog.
7. **CI:** the deploy job ships the exact `dist` that passed the tests, built with base `/gati-chitra/`. e2e runs in Chromium, Firefox and WebKit, plus two phone profiles from M5.

### Not in scope

AI or chat features; accounts; servers; collaboration; non-flowchart Mermaid diagrams; icon and image nodes (`icon:`, `img:`; they need network access and break offline use); `click` callbacks (JavaScript); Mermaid's `curve:` styles; class-based edge animation (`classDef ... animation:`); routing edges around nodes with dagre's control points (a candidate for after v0.6).

## Part 2. Global constraints (exact values)

Every task inherits this section.

- Initial JavaScript budget: **150 KB gzip** (lowered from 350 in Task 30). Each lazy chunk: **80 KB gzip**. Both are checked by `scripts/check-dist.mjs`.
- Source files stay under 300 lines; `src/repo.test.ts` enforces it from Task 25.
- Supported browsers: the current and previous major versions of Chrome, Edge, Firefox and Safari (desktop and iOS).
- Node: the Active LTS line at the time of Task 24, in `.nvmrc`; `engines.node` is `>=22`.

### Additions to `src/core/constants.ts`

Add these exactly, in the task that first needs them (named in brackets).

```ts
// [Task 29]
export const SHARE = { prefix: 'v1=', plainPrefix: 'v1p=', maxUrlChars: 8000, maxDecodedBytes: 80_000 } as const;

// [Task 39]
export const EDGE_ANIM = { fastFactor: 2, slowFactor: 0.5 } as const;

// [Task 48]
export const UI = { narrowBreakpoint: 768, splitMin: 0.2, splitMax: 0.8, splitDefault: 0.33, splitStep: 0.05 } as const;

// [Task 50]
export const KEYBOARD = { nudge: 10 } as const;

// [Task 58]
export const TOUCH = { hitTolerance: 14, handleRadius: 12, longPressMs: 500, slop: 8, doubleTapMs: 300 } as const;
```

`LAYOUT` gains these keys [Task 38 unless marked]: `smallCircleD: 20`, `forkBarW: 72`, `forkBarH: 10`, `documentWave: 8`, `doubleCircleGap: 5`, `trapezoidInset: 14`, `asymmetricNotch: 14`, `titleFontSize: 20` [41], `titleH: 36` [41], `edgeLabelRadius: 6` [49], `parallelEndShare: 0.5` [49]. `LAYOUT.parallelOffset` changes from `14` to `28` [49].

`EXPORT` gains `ogWidth: 1200, ogHeight: 630` [Task 55].

`MESSAGES` changes [task in brackets]:

```ts
unknownLine: 'Not understood; kept as written.',                       // [26] was a function of n
strayEnd: '`end` without a matching subgraph.',                         // [26] was a function of n
duplicateGroupId: (id: string, newId: string) => `Subgraph id "${id}" is already used, so this one is "${newId}".`, // [26]
layoutFailed: 'The diagram could not be laid out. The last picture is kept.', // [26]
templateFailed: 'The template could not be loaded.',                     // [27]
shareOpened: 'Opened a shared diagram. Press Ctrl+Z to get your previous diagram back.', // [29]
changedInOtherTab: 'This diagram was changed in another tab.',           // [29]
unknownShape: (name: string) => `Unknown shape "${name}", drawn as a rectangle.`, // [35]
shapeApprox: (name: string, drawnAs: string) => `Shape "${name}" is drawn as ${drawnAs}.`, // [35]
iconUnsupported: 'Icons and images are not supported; the node is drawn as a rectangle.', // [35]
linkBlocked: 'Only http, https and mailto links are kept.',              // [36]
clickCallbackIgnored: 'Click callbacks are ignored.',                     // [36]
groupDirectionIgnored: (id: string) => `Subgraph "${id}" has arrows to the outside, so its direction is ignored.`, // [36]
copied: 'Copied to the clipboard.',                                       // [51]
copyUnsupported: 'This browser cannot copy images. Use Save instead.',    // [51]
updateReady: 'A new version is available.',                               // [54]
offlineReady: 'Ready to work offline.',                                   // [54]
```

### New file `src/core/shapes.ts` [Task 35]

Display names, canonical Mermaid short names, and the alias table. The select lists in the page are generated from `SHAPE_NAMES` and `EDGE_KIND_NAMES` (Task 43), so the lists in `index.html` go away.

| ShapeKind | `SHAPE_NAMES` | `SHAPE_SHORT` | Bracket form |
| --- | --- | --- | --- |
| rect | Rectangle | rect | `[x]` |
| round | Rounded | rounded | `(x)` |
| stadium | Stadium | stadium | `([x])` |
| circle | Circle | circle | `((x))` |
| diamond | Diamond | diam | `{x}` |
| hexagon | Hexagon | hex | `{{x}}` |
| parallelogram | Parallelogram | lean-r | `[/x/]` |
| parallelogramAlt | Parallelogram reversed | lean-l | `[\x\]` |
| cylinder | Cylinder | cyl | `[(x)]` |
| subroutine | Subroutine | fr-rect | `[[x]]` |
| trapezoid | Trapezoid | trap-b | `[/x\]` |
| trapezoidAlt | Trapezoid reversed | trap-t | `[\x/]` |
| doubleCircle | Double circle | dbl-circ | `(((x)))` |
| asymmetric | Flag | odd | `>x]` |
| document | Document | doc | none |
| smallCircle | Start point | sm-circ | none |
| filledCircle | Junction | f-circ | none |
| framedCircle | Stop point | fr-circ | none |
| forkBar | Fork or join | fork | none |
| text | Text only | text | none |

`SHAPE_ALIASES` (lower-case keys; `approx: false` unless listed under "approximate"):

- Exact: `rect proc process rectangle` → rect; `rounded event` → round; `stadium pill terminal` → stadium; `circle circ` → circle; `diam decision diamond question` → diamond; `hex hexagon prepare` → hexagon; `lean-r in-out lean-right` → parallelogram; `lean-l lean-left out-in` → parallelogramAlt; `cyl cylinder database db` → cylinder; `fr-rect framed-rectangle subproc subprocess subroutine` → subroutine; `trap-b priority trapezoid trapezoid-bottom` → trapezoid; `trap-t inv-trapezoid manual trapezoid-top` → trapezoidAlt; `dbl-circ double-circle` → doubleCircle; `odd` → asymmetric; `doc document` → document; `sm-circ small-circle start` → smallCircle; `f-circ filled-circle junction` → filledCircle; `fr-circ framed-circle stop` → framedCircle; `fork join` → forkBar; `text` → text.
- Approximate (`approx: true`): `docs documents st-doc stacked-document lin-doc lined-document tag-doc tagged-document` → document; `h-cyl das horizontal-cylinder lin-cyl disk lined-cylinder datastore data-store` → cylinder; `cross-circ crossed-circle summary` → framedCircle; `flag paper-tape` → asymmetric; `delay half-rounded-rectangle curv-trap curved-trapezoid display cloud bang` → round; `notch-pent loop-limit notched-pentagon` → hexagon; `brace brace-l comment brace-r braces` → text; every other name in Mermaid's shape table (`st-rect processes procs stacked-rectangle div-rect div-proc divided-process divided-rectangle lin-rect lin-proc lined-process lined-rectangle shaded-process tag-rect tag-proc tagged-process tagged-rectangle win-pane internal-storage window-pane notch-rect card notched-rectangle sl-rect manual-input sloped-rectangle bow-rect bow-tie-rectangle stored-data hourglass collate bolt com-link lightning-bolt tri extract triangle flip-tri flipped-triangle manual-file folder directory browser console bucket person`) → rect.

Exports: `SHAPE_NAMES: Record<ShapeKind, string>`, `SHAPE_SHORT: Record<ShapeKind, string>`, `SHAPE_ALIASES: Record<string, { shape: ShapeKind; approx: boolean }>`, `shapeFromName(name: string): { shape: ShapeKind; approx: boolean } | null` (trims and lower-cases), `EDGE_KIND_NAMES: Record<EdgeKind, string>` (existing select labels plus `dottedBidirectional: 'Dotted, both ways'`, `thickBidirectional: 'Thick, both ways'`, `circleBoth: 'Circle ends'`, `crossBoth: 'Cross ends'`, `invisible: 'Invisible link'`).

## Part 3. Data model changes (`src/core/types.ts`)

Each change lands in the task named in brackets, together with every place that must handle the new values (the compiler lists them).

```ts
export type ShapeKind = /* existing 10 */
  | 'trapezoid' | 'trapezoidAlt' | 'doubleCircle' | 'asymmetric' | 'document'
  | 'smallCircle' | 'filledCircle' | 'framedCircle' | 'forkBar' | 'text';            // [35]
export type EdgeKind = /* existing 9 */
  | 'dottedBidirectional' | 'thickBidirectional' | 'circleBoth' | 'crossBoth' | 'invisible'; // [34]
export type LineKind = /* existing */ | 'edgeProps' | 'click' | 'acc';                // [36]
export interface Diagnostic { line: number; severity: 'error' | 'warning' | 'info'; message: string } // [35]; ok still means "no error"

export interface EdgeAnim { animate: boolean | null; speed: 'fast' | 'slow' | null }   // [36]
export interface NodeLink { url: string; tooltip: string | null; target: '_self' | '_blank' | '_parent' | '_top' } // [36]
export interface TextRun { text: string; bold: boolean; italic: boolean }              // [40]
export interface FontStyle { bold: boolean; italic: boolean }                           // [40]

// GraphNode gains:  markdown: boolean                                                  [35]
// GraphGroup gains: markdown: boolean                                                  [35]
// GraphEdge gains:  length: number (1 = normal)                                        [34]
//                   ref: string | null (the user's edge id, e.g. "e1")                 [36]
//                   anim: EdgeAnim                                                     [36]
//                   markdown: boolean                                                  [35]
//                   fromIsGroup: boolean; toIsGroup: boolean                           [36]
// ParsedDoc gains:  title: string | null; accTitle: string | null; accDescr: string | null;
//                   links: Record<string, NodeLink>; explicitEdgeAnimation: boolean    [36]
// NodeBox gains:    runs?: TextRun[][] (absent for plain labels)                       [40]
// SceneLayout gains: title: { text: string; center: Point } | null                     [41]
```

When a task adds a required field, it also adds that field's default to every object literal the compiler flags, tests included.

`MeasureText` in `src/layout/measure.ts` becomes `(text: string, fontSize: number, style?: FontStyle) => number` [40]. `Settings` in `src/app/storage.ts` gains `split: number` [48]; `loadSettings` clamps it to `[UI.splitMin, UI.splitMax]` and defaults to `UI.splitDefault`.

## Part 4. Grammar additions (M2)

These extend Part 4 of the v0.1 plan. Unless stated, a construct the parser cannot read still becomes an `'unknown'` line with a warning, and the text is kept.

### 4.1 Statements per line [34]

A line may hold several statements separated by `;`. Split at `;` characters that are outside `"..."`, outside `|...|` pipe labels, and outside bracket pairs `[] () {}`. Each part is parsed as a v0.1 statement. `SourceLine.nodeIds` and `edgeIndexes` cover all parts in order. A trailing `;` is still allowed.

### 4.2 Ids [34]

Node, group and edge ids match `/[\p{L}\p{N}_]+(?:-[\p{L}\p{N}_]+)*/u`. A hyphen belongs to the id only when a letter, digit or `_` follows it, so `A-->B` is still `A`, `-->`, `B`, and `node-1` is one id.

### 4.3 Edge operators [34]

These are tried before the v0.1 table, in this order:

| Order | Pattern | EdgeKind |
| --- | --- | --- |
| 1 | `/^<-\.+->/` | dottedBidirectional |
| 2 | `/^<={2,}>/` | thickBidirectional |
| 3 | `/^o-{2,}o(?=\s)/` | circleBoth |
| 4 | `/^x-{2,}x(?=\s)/` | crossBoth |
| 5 | `/^~{3,}/` | invisible |

Patterns 3 and 4 are only tried where an operator is expected (after a node group), so a node named `o` or `x` still works.

**Edge id prefix.** Right before an operator, `/^([\p{L}\p{N}_]+)@(?=[-=<~ox])/u` sets `GraphEdge.ref`. Example: `A e1@--> B`.

**Link length.** `GraphEdge.length` = max(1, value), where the value is counted on the operator (or, for inline-label forms, on the closer):

| Kind | Value |
| --- | --- |
| arrow, bidirectional, thickArrow, thickBidirectional | number of `-` or `=` minus 1 |
| open, thick, invisible, circleEnd, crossEnd, circleBoth, crossBoth | number of `-`, `=` or `~` minus 2 |
| dottedArrow, dotted, dottedBidirectional | number of `.` |

**Pipe labels.** `-->|"yes"|` gives the label `yes`: one pair of surrounding double quotes is removed.

### 4.4 Node shapes [35]

Classic forms added to the opening-token table (`(((` is tried before `((`):

| Open | Close | ShapeKind |
| --- | --- | --- |
| `(((` | `)))` | doubleCircle |
| `[/` | `\]` | trapezoid |
| `[\` | `/]` | trapezoidAlt |
| `>` | `]` | asymmetric |

For the opener `[/`, the label ends at the first `/]` or `\]`, whichever comes first; `/]` gives parallelogram and `\]` gives trapezoid. For `[\`, `\]` gives parallelogramAlt and `/]` gives trapezoidAlt.

**`@{ }` form.** Right after an id, `@{` starts a property block that ends at the matching `}` (quotes respected). The body is `key: value` pairs separated by commas; a value is a double-quoted string or a bare word. Keys:

- `shape`: `shapeFromName(value)`. Unknown name → `rect` and warning `MESSAGES.unknownShape(name)`. Approximate → info `MESSAGES.shapeApprox(name, SHAPE_NAMES[shape])`.
- `label`: the label, cleaned as in v0.1 (and markdown when backtick-quoted).
- `icon`, `img`: node becomes `rect`, info `MESSAGES.iconUnsupported`.
- Any other key is ignored without a diagnostic.

The `@{ }` form can appear anywhere a node reference can, including inside edges: `A@{ shape: diam } --> B`.

### 4.5 Labels [35]

- **Markdown strings:** a label written as ``"`...`"`` sets `markdown: true` and keeps the text between the backticks, markers included. In markdown labels a real line break inside the quotes is a new line (multi-line labels are already supported through `<br>`; a markdown label may span lines only inside one quoted string on one source line in this version).
- **Entity codes:** after the v0.1 cleanup, replace `#(\d+);` with the code point, and `#amp;`, `#lt;`, `#gt;`, `#quot;`, `#apos;`, `#nbsp;` with their characters. `formatLabel` (Task 43) writes `#` followed by `[A-Za-z0-9]+;` as `#35;` plus the rest, so a label never turns into an entity by accident.

### 4.6 Lines [36]

| Line | Kind | Effect |
| --- | --- | --- |
| `<edgeRef>@{ animate: true, animation: fast, curve: linear }` (whole line; the id is an edge `ref` anywhere in the text) | edgeProps | `animate` true/false sets `anim.animate`; `animation: fast\|slow` sets `anim.speed` and, if `animate` was not given, `anim.animate = true`; `curve` is ignored. Sets `explicitEdgeAnimation`. Edge refs are collected in a first pass, so the props line may come before the edge. |
| `click <id> "url"` or `click <id> href "url"`, optional `"tooltip"`, optional `_self\|_blank\|_parent\|_top` | click | `links[id]`. URLs that do not match `/^(https?:\|mailto:)/i` are dropped with info `MESSAGES.linkBlocked`. Default target `_self`. |
| `click <id> <callback...>` (any other form) | click | info `MESSAGES.clickCallbackIgnored` |
| `accTitle: text` | acc | `accTitle` |
| `accDescr: text` | acc | `accDescr` |
| `accDescr {` ... `}` | acc (every line of the block) | `accDescr` = the inner lines, trimmed, joined with `\n` |
| `title: text` inside front matter | frontmatter | `title` (one pair of surrounding quotes removed) |
| `classDef default ...` | classDef | Applied to every node before its own classes |

### 4.7 Edges to subgraphs [36]

When an edge end names a group id and that id is not given a shape or label anywhere, the end is the group: set `fromIsGroup` or `toIsGroup`, and create no node. At the end of parsing, for each group with a `direction` that has an edge between a node inside it (at any depth) and a node outside, add info `MESSAGES.groupDirectionIgnored(id)` on the group's `direction` line.

### 4.8 Text patches for the new syntax [43]

- **Rename** on a node whose defining reference uses `@{ }`: replace the `label:` value, or add `label: "..."` as the last key.
- **Set shape:**
  - Bracket form to a shape with a bracket form: as in v0.1.
  - `@{ }` form to any shape: replace the `shape:` value with `SHAPE_SHORT[shape]`.
  - Bracket form to a shape without a bracket form: rewrite the reference as `id@{ shape: <short>, label: "<label>" }`.
- **Set edge kind** and **reverse** keep `length` and `ref`. `edgeOperatorText(kind, length)` writes the longer operator.
- **Several statements on one line:** before any op changes such a line, rewrite it as one statement per line with the line's indentation, then apply the op.

## Part 5. File changes

New files (task in brackets):

```
src/core/shapes.ts [35]
src/mermaid/parse-header.ts  parse-blocks.ts  parse-statement.ts [25]
src/mermaid/props.ts (the @{ } reader) [35]   src/mermaid/groups.ts [36]   src/mermaid/fences.ts [37]   src/mermaid/compat.test.ts [37]
src/app/message.ts [29]   tests/support/scene.ts [31]
src/layout/rich-text.ts [40]   src/layout/subgraph-layout.ts [42]
src/render/prepared.ts [31]   src/render/shapes-extra.ts [38]
src/editor/text-diff.ts [46]   src/editor/keyboard-nav.ts [50]   src/editor/gestures.ts [58]
src/app/describe.ts [41]   src/app/code-editor.ts  editor-wiring.ts [46]   src/app/mermaid-lang.ts [47]
src/app/help.ts  splitter.ts [48]   src/app/clipboard.ts [51]   src/app/file-launch.ts [53]
src/app/sw-register.ts [54]   src/app/narrow.ts [57]   src/app/touch-wiring.ts [58]   src/app/share-file.ts [59]
src/sw/sw.ts  src/sw/sw-logic.ts [54]   tsconfig.sw.json [54]   scripts/vite-plugins.ts [54, 55]
scripts/make-og.mjs [55]   public/manifest.webmanifest  public/icons/* [53]   404.html [55]
tests/fixtures/compat/*.mmd  *.json [37]   tests/support/editor.ts [46]   tests/support/contrast.ts [28]
tests/e2e/axe.spec.ts [45]  keyboard.spec.ts [50]  offline.spec.ts [54]  mobile.spec.ts [57, 58, 59]
.nvmrc [24]   .github/dependabot.yml [32]
```

The dependency rule from v0.1 is unchanged: `core` ← `mermaid` ← `layout` ← `render` and `anim` ← `editor`, `export`, `share` ← `app`. `src/sw` imports only from `src/sw`.

## Review Focus

These are the five failure modes most likely to hurt a person using the site that no single feature test covers. Each has a test in the task named in brackets.

1. **A Mermaid file from the wild that mixes new and old syntax.** It must never throw, never lose a line, and every prefix of it must parse. [Task 37: the prefix test over the whole corpus]
2. **A redeploy while a tab is open, or a stale service worker.** The user must not be stuck on an old version or hit a missing lazy chunk. [Task 54: the update offer, tested with a fake registration, and the `vite:preloadError` reload, tested in e2e]
3. **Two ways to undo after the editor swap.** Typing, then a canvas edit, then Ctrl+Z in the editor, then Ctrl+Z on the page must step back through the exact earlier texts. [Task 46]
4. **Touch ambiguity.** Two fingers that land on a node zoom and do not drag it; a long press does not also start a drag; a pinch that ends with one finger lifted does not jump. [Task 58]
5. **Losing work through storage.** A share link over autosave, two tabs, closing within the debounce, and New must all leave the earlier diagram recoverable. [Task 29, plus New in Task 27]

---

## Part 6. Tasks

Every task lists **Files**, **Interfaces**, numbered **Steps** and a **Commit**. "Run" steps name the command and the result that means success.

## Milestone M1: v0.2.0 Foundations and fixes

### Task 24: Lint, Node version, no `any`, agent files point here

**Files:**
- Create: `.nvmrc`
- Modify: `package.json` (version `0.1.0`, `engines`, `lint` script, `oxlint` dev dependency), `src/repo.test.ts`, `src/vite-env.d.ts`
- Modify to remove `any`: `src/app/export-panel.ts`, `src/app/anim-controls.ts`, `src/app/studio.ts`, `src/export/video.ts`, `src/share/share.ts`, `src/export/gif.ts`
- Modify to remove dead code: `src/core/constants.ts` (`FONT_STACK_UI` if `grep -rn FONT_STACK_UI src` finds no use), `src/app/inline-edit.ts` (unused `canvasRect`)

**Interfaces:**
- Produces: `npm run lint` = `oxlint --deny-warnings -D no-explicit-any -D no-unused-vars src scripts`. `interface StudioApi` in `src/vite-env.d.ts` with the methods `studio.ts` already exposes, and `interface Window { __studio?: StudioApi }`.

- [x] **Step 1: Write the failing test** in `src/repo.test.ts`

```ts
it('has a lint script, an engines field and a Node version file', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  expect(pkg.version).toBe('0.1.0');
  expect(pkg.engines.node).toBe('>=22');
  expect(pkg.scripts.lint).toContain('oxlint');
  expect(readFileSync('.nvmrc', 'utf8').trim()).toMatch(/^\d+$/);
});
it('points agents at the improvements plan', () => {
  expect(readFileSync('AGENTS.md', 'utf8')).toContain('docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md');
});
```

- [x] **Step 2: Run** `npm test -- src/repo.test.ts`. Expected: FAIL (no `engines`, no `.nvmrc`).
- [x] **Step 3: Add oxlint and the scripts.**
  - Pin `oxlint` to its current version.
  - `.nvmrc` holds `26`: Node 26 has been the Active LTS line since October 2026, and it is what the owner develops on. If https://nodejs.org/en/about/previous-releases says otherwise, use the Active LTS major it lists and note it in `DECISIONS.md`.
  - `AGENTS.md` already names this plan (the owner committed that change with the plan), so the second test passes from the start. Leave `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` as they are.
- [x] **Step 4: Run** `npm run lint`. Expected: FAIL listing the `any` uses and unused code.
- [x] **Step 5: Remove every `any`** in `src` (except `src/types/gifenc.d.ts`) with real types: `unknown` plus narrowing for caught errors and decoded data, the `StudioApi` interface for `window.__studio`, mediabunny's exported types in `video.ts`, `BlobPart` in `share.ts`. Delete the dead code.
- [x] **Step 6: Run** `npm run lint && npm test && npm run build`. Expected: all pass, `0 warnings`.
- [x] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: lint, Node version file, remove any and dead code"
```

### Task 25: Split the parser

**Files:**
- Modify: `src/mermaid/parse.ts` (driver only, under 150 lines)
- Create: `src/mermaid/parse-header.ts` (front matter, directives, header), `src/mermaid/parse-blocks.ts` (subgraph, end, direction, classDef, class, style, linkStyle), `src/mermaid/parse-statement.ts` (statements to nodes and edges)
- Test: `src/repo.test.ts`

**Interfaces:**
- Consumes and produces: `parseMermaid(text: string): ParsedDoc`, unchanged. The new modules are internal to `src/mermaid`. Later tasks add new syntax to the module that owns it: statements in `parse-statement.ts`, line kinds in `parse-blocks.ts`, front matter in `parse-header.ts`.

- [x] **Step 1: Write the failing test** in `src/repo.test.ts`: walk `src/` and assert every `.ts` file that is not a test has fewer than 300 lines; the failure message names the file.
- [x] **Step 2: Run** `npm test -- src/repo.test.ts`. Expected: FAIL naming `src/mermaid/parse.ts` (417 lines).
- [x] **Step 3: Move code without changing behaviour.** Move the existing functions into the three files by responsibility; `parse.ts` keeps the line loop, the limits and the final `ok` computation. While moving, replace the three copies of the empty `ParsedDoc` literal with one `emptyDoc(lines: SourceLine[], diagnostics: Diagnostic[]): ParsedDoc`.
- [x] **Step 4: Run** `npm test && npm run lint`. Expected: all pass with no test changed.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: split the parser into header, block and statement modules"
```

### Task 26: Duplicate subgraph ids and layout errors never break the app

**Files:**
- Modify: `src/mermaid/parse-blocks.ts`, `src/core/constants.ts` (`MESSAGES` per Part 2), `src/layout/scene.ts`, `src/app/state.ts`, `src/app/ui.ts`, `src/app/diagnostics.ts`
- Test: `src/mermaid/parse.groups.test.ts`, `src/layout/scene.test.ts`, `src/app/state.test.ts`, `tests/e2e/share.spec.ts`, and every test that used `MESSAGES.unknownLine(n)` or `MESSAGES.strayEnd(n)` (now plain strings)

**Interfaces:**
- Produces: `tryBuildScene(doc: ParsedDoc, measure: MeasureText): Scene | null` in `src/layout/scene.ts` (returns `null` when layout throws). `applyText` uses it; on `null` it returns a `doc` with the extra diagnostic `{ line: 1, severity: 'error', message: MESSAGES.layoutFailed }`, `ok: false`, and keeps `state.scene`.

- [x] **Step 1: Write the failing tests**

```ts
// parse.groups.test.ts
it('renames a repeated subgraph id', () => {
  const d = parseMermaid('flowchart TD\nsubgraph X\nsubgraph X\nA\nend\nend');
  expect(d.groups.map(g => g.id)).toEqual(['X', 'X_2']);
  expect(d.diagnostics).toContainEqual({ line: 3, severity: 'warning', message: MESSAGES.duplicateGroupId('X', 'X_2') });
});
it('does not let a quoted title reuse an id', () => {
  const d = parseMermaid('flowchart TD\nsubgraph group2\nA\nend\nsubgraph "T"\nB\nend');
  expect(new Set(d.groups.map(g => g.id)).size).toBe(2);
});
// scene.test.ts
it('returns null instead of throwing', () => {
  const doc = parseMermaid('flowchart TD\nA');
  expect(tryBuildScene(doc, () => { throw new Error('boom'); })).toBeNull();
});
// state.test.ts
it('keeps the last picture when layout fails', () => {
  const s = createState('flowchart TD\nA', settings);
  const next = applyText(s, 'flowchart TD\nB', () => { throw new Error('boom'); });
  expect(next.scene).toBe(s.scene);
  expect(next.doc.ok).toBe(false);
  expect(next.doc.diagnostics.at(-1)?.message).toBe(MESSAGES.layoutFailed);
});
```

e2e in `share.spec.ts`: open a share link whose text has `subgraph X` nested in `subgraph X`; expect the canvas to show node `A` (`__studio.getSummary().nodes` contains `'A'`) and the Share button to be enabled.

- [x] **Step 2: Run** `npm test`. Expected: the four new tests FAIL.
- [x] **Step 3: Implement.**
  - The parser makes a group id unique by appending `_2`, `_3` and so on (the smallest unused suffix).
  - `tryBuildScene` wraps `buildScene` in try/catch.
  - `ui.ts` start-up decodes the share link inside try/catch and falls back to the sample with `MESSAGES.shareInvalid`.
  - Change `unknownLine` and `strayEnd` to plain strings. `diagnostics.ts` already prefixes `Line n:`, so the text no longer says the line twice. Update the tests that called them as functions.
- [x] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- share.spec.ts`. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "fix: duplicate subgraph ids and layout errors no longer break the app"
```

### Task 27: Editing fixes

**Files:**
- Modify: `src/app/properties.ts`, `src/mermaid/format.ts`, `src/mermaid/ops-edge.ts`, `src/app/toolbar.ts`, `src/app/gallery.ts`, `src/app/inline-edit.ts`, `src/app/style.css`, `src/core/constants.ts` (`MESSAGES.templateFailed`)
- Test: `src/mermaid/ops.edit.test.ts`, `src/mermaid/edges.test.ts`, `tests/e2e/edit.spec.ts`, `tests/e2e/chrome.spec.ts`

**Interfaces:**
- Produces: `formatLabel(label: string): string` now also quotes labels that start or end with `/` or `\`, start with `>`, or contain `@{`.

- [ ] **Step 1: Write the failing unit tests**

```ts
it.each(['/api', '/api/', '\\x', 'a/b', '>x', 'x@{y}'])('rename to %s round-trips', (label) => {
  const r = applyOp('flowchart TD\nA[Start]', { type: 'renameNode', id: 'A', label });
  expect('text' in r && parseMermaid(r.text).nodes[0]).toMatchObject({ label, shape: 'rect' });
});
it('changes the kind of an edge with an inline label in a node group', () => {
  const r = applyOp('flowchart TD\nA & B -- yes|no --> C', { type: 'setEdgeKind', index: 0, kind: 'dottedArrow' });
  expect('text' in r).toBe(true);
  const d = parseMermaid((r as { text: string }).text);
  expect(d.edges.map(e => e.label)).toEqual(['yes|no', 'yes|no']);
});
```

- [ ] **Step 2: Write the failing e2e tests**
  - `edit.spec.ts`: "typed label survives a mouse move". Select node A, type `Renamed` into `#prop-label` without leaving it, move the mouse across the canvas; `#prop-label` still holds `Renamed`.
  - `edit.spec.ts`: "New is undoable". Type a line, click New within one second, press Ctrl+Z with focus on the page body; the typed text is back.
  - `edit.spec.ts`: "the same file opens twice". `setInputFiles` the same `.mmd` file twice, editing the text in between; the second open loads the file again.
  - `edit.spec.ts`: "inline editor sits on the node". Double-click node A; the centre of `#inline-edit`'s box is within 4 px of `getNodeScreenCenter('A')`.
  - `chrome.spec.ts`: "a failed template says so". Route `**/templates/checkout.mmd` to abort, click that template; `#message` shows `MESSAGES.templateFailed`.
  - `chrome.spec.ts`: "export footer fits a phone". At viewport 375x812, open Export; every `.dialog-footer button` box lies inside the viewport.
- [ ] **Step 3: Run** `npm test && npm run test:e2e -- edit.spec.ts chrome.spec.ts`. Expected: the new tests FAIL.
- [ ] **Step 4: Implement.**
  - `updateProps` skips writing any input that is `document.activeElement`.
  - `formatLabel` quotes per the Interfaces block.
  - `splitStatement` writes pipe labels with `formatPipeLabel`.
  - New commits with source `'open'`.
  - The file input's `value` is reset to `''` after each read.
  - `gallery.ts` shows `MESSAGES.templateFailed`.
  - The inline editor position uses the canvas's bounding rect.
  - `.dialog-footer` gets `flex-wrap: wrap`.
- [ ] **Step 5: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "fix: properties, rename quoting, New, reopening files and template errors"
```

### Task 28: Keyboard activation, control labels and contrast

**Files:**
- Modify: `src/app/shortcuts.ts`, `index.html`, `src/app/anim-controls.ts`, `src/app/diagnostics.ts`, `src/app/tokens.css`, `src/app/style.css`
- Create: `tests/support/contrast.ts`
- Test: `src/app/shortcuts.test.ts`, `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Produces: `KeyInfo.targetTag` semantics. `shortcutFor` returns `null` for `Enter` unless `targetTag` is `BODY`, `MAIN` or `CANVAS`. `contrastRatio(a: string, b: string): number` (WCAG formula, hex input) in `tests/support/contrast.ts`.

- [ ] **Step 1: Write the failing tests**

```ts
it.each(['BUTTON', 'A', 'SUMMARY', 'SELECT'])('Enter on %s is left to the browser', (tag) => {
  expect(shortcutFor({ key: 'Enter', ctrl: false, meta: false, shift: false, alt: false, targetTag: tag })).toBeNull();
});
it.each(['BODY', 'MAIN', 'CANVAS'])('Enter on %s renames', (tag) => {
  expect(shortcutFor({ key: 'Enter', ctrl: false, meta: false, shift: false, alt: false, targetTag: tag })).toBe('rename');
});
```

`a11y.spec.ts`:
- "every form control has a name": for every `input, select, textarea, progress` that is visible or in an open dialog, `getAttribute('aria-label')` or a `label[for]` exists. Covers `#add-shape`, `#anim-style`, `#anim-speed`, `#anim-density`, `#theme`, `#inline-edit` and `#export-progress`.
- "Enter opens Templates": focus `#btn-templates`, press Enter; the `#gallery` dialog is open.
- "sliders show their value": `#anim-speed-value` reads `1×`; after pressing ArrowRight on the slider it reads `1.25×`.
- "diagnostics are buttons": break line 2; Tab to the first `#diagnostics button` and press Enter; the caret is on line 2.
- "control borders meet 3:1": read `--border` (or the token `.btn` borders use) from the computed style on `:root` in light and dark; `contrastRatio(border, background) >= 3`.

- [ ] **Step 2: Run** `npm test && npm run test:e2e -- a11y.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **Labels:** `index.html` adds visible labels "Animation", "Speed" (with `<output id="anim-speed-value">`), "Density" (with `<output id="anim-density-value">`) and "Theme". It adds a visually hidden label "New node shape" for `#add-shape`, and `aria-label`s "Edit label" for `#inline-edit` and "Export progress" for `#export-progress`. Add a `.visually-hidden` utility class.
  - **Pause button:** its text switches between "Pause" and "Play"; remove `aria-pressed`.
  - **Diagnostics:** each item is a `<button type="button">` inside its `<li>`. `aria-live` moves from the list to a new `#diagnostics-summary` that reads, for example, "2 errors, 1 warning".
  - **Border tokens:** darken (light scheme) or lighten (dark scheme) them, keeping the hue, until they reach 3:1. Record the values in `DECISIONS.md`.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "fix: keyboard activation, control labels and contrast"
```

### Task 29: Share links and autosave never lose a diagram

**Files:**
- Create: `src/app/message.ts`
- Modify: `src/share/share.ts`, `src/core/constants.ts` (`SHARE`, `MESSAGES`), `src/app/ui.ts`, `src/app/dispatcher.ts` (use `showMessage`), `src/app/share-handler.ts`, `src/app/storage.ts`
- Test: `src/share/share.test.ts`, `src/app/state.test.ts`, `tests/e2e/share.spec.ts`

**Interfaces:**
- Produces: `showMessage(text: string, action?: { label: string; run: () => void }): void` in `src/app/message.ts`. It writes `#message` and, when an action is given, adds one button after the text; any later message replaces it. Every place that now sets `messageEl.textContent` calls it instead.
- Produces: `decodeShare(hash: string): Promise<string | null>` (same signature; stops reading once the output passes `SHARE.maxDecodedBytes`, and rejects input longer than `SHARE.maxUrlChars`). `flushAutosave(): void` and `setupDocSync(env: { store: KeyValueStore | null; getText(): string; isDirty(): boolean; apply(text: string): void; ask(text: string): void }): () => void` in `src/app/storage.ts`.

- [ ] **Step 1: Write the failing unit tests**

```ts
it('rejects a share link that inflates past the limit', async () => {
  const bytes = deflateRawSync(Buffer.from('A'.repeat(1_000_000)));      // node:zlib, about 1 KB
  expect(await decodeShare(SHARE.prefix + toBase64Url(new Uint8Array(bytes)))).toBeNull();
});
it('opening a share link is one undo step above the autosaved diagram', () => {
  let s = createState('flowchart TD\nSaved', settings);
  s = commitText(s, 'flowchart TD\nShared', 'share', measure);
  s = commitText(s, '', 'undo', measure);
  expect(s.text).toBe('flowchart TD\nSaved');
});
```

- [ ] **Step 2: Write the failing e2e tests** in `share.spec.ts`
  - "share link keeps the autosave undoable": seed `localStorage[STORAGE.docKey]`, open a share link, see `MESSAGES.shareOpened`, press Ctrl+Z on the page body; the text equals the seed.
  - "a new hash loads": with the app open, set `location.hash` to another share hash; the text changes.
  - "typing right before a reload is kept": type, reload at once; the text is kept.
  - "a second tab follows": two pages in one context; type in page 2; page 1, which has no edits of its own, shows the new text within 1 s. When page 1 has edits, it shows `MESSAGES.changedInOtherTab` with a "Load it" button instead.
- [ ] **Step 3: Run** `npm test && npm run test:e2e -- share.spec.ts`. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - **`decodeShare`:** read the decompressed stream with a reader, counting bytes, and cancel past the limit.
  - **Start-up:** build the state from the autosaved text (or the sample), then commit the shared text with source `'share'`.
  - **`hashchange`:** a listener runs the same path.
  - **Autosave:** `pagehide`, and `visibilitychange` to hidden, call `flushAutosave`.
  - **Other tabs:** `setupDocSync` listens for `storage` events on `STORAGE.docKey`. "Dirty" means this tab committed text since it last loaded or synced.
- [ ] **Step 5: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "fix: share links and autosave never lose a diagram"
```

### Task 30: Smaller video chunk and stricter bundle budgets

**Files:**
- Modify: `src/export/video.ts`, `scripts/check-dist.mjs`

**Interfaces:**
- Produces: `check-dist.mjs` constants `INITIAL_JS_BUDGET_KB = 150` and `LAZY_CHUNK_BUDGET_KB = 80`. It prints `Largest lazy chunk: <name> <n> KB (gzip)`.

- [ ] **Step 1: Add the failing check.** In `check-dist.mjs`, after the initial-JS check, gzip every `.js` file in `dist/assets` that is not an initial script. Fail with `Lazy chunk <name> is over the 80 KB budget` if one is over. Lower the initial budget to 150.
- [ ] **Step 2: Run** `npm run build && npm run check:dist`. Expected: FAIL on the mediabunny chunk (about 182 KB gzip).
- [ ] **Step 3: Implement.** In `exportVideo` and `probeEncoder`, replace `const m = await import('mediabunny')` with a destructured import of exactly the names the file uses, so Rollup can tree-shake the rest.
- [ ] **Step 4: Run** `npm run build && npm run check:dist && npm run test:e2e -- export-video.spec.ts`. Expected: PASS. The chunk should be about 59 KB gzip; record the real number in `DECISIONS.md`.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "perf: smaller video chunk and stricter bundle budgets"
```

### Task 31: Redraw only when needed, reuse layout during drags

**Files:**
- Create: `src/render/prepared.ts`, `tests/support/scene.ts`
- Modify: `src/app/render-loop.ts`, `src/anim/anim.ts`, `src/render/draw.ts`, `src/layout/layout.ts`, `src/app/ui.ts` (call `requestRedraw` where state changes)
- Test: `src/render/draw.test.ts`, `src/anim/anim.test.ts`, `src/layout/layout.test.ts`, `src/app/render-loop.test.ts` (new), `tests/e2e/perf.spec.ts`

**Interfaces:**
- Produces: test helpers in `tests/support/scene.ts`, used by every later unit test in this plan. All of them use `testMeasure` from `tests/support/measure.ts`.
  - `layoutOf(text: string): SceneLayout`
  - `sceneOf(textOrDoc: string | ParsedDoc): Scene`
  - `svgOf(text: string): string` (Daylight theme, content frame)
  - `recordDraw(text: string): { name: string; args: unknown[] }[]` (draws the scene into `createRecordingContext()`)
  - `nodeOf(shape: ShapeKind, label = 'x'): GraphNode`
  - `dist(a: Point, b: Point): number`

  Later tasks that need another helper add it here and name it in their Files list.
- Produces:
  - `prepare(scene: Scene): PreparedScene`, cached in a `WeakMap<Scene, PreparedScene>`. `PreparedScene = { depths: Record<string, number>; edgesById: Map<string, GraphEdge>; groupOrder: string[] }`. `frameState` and `drawScene` read from it instead of rebuilding per frame.
  - `shouldDraw(s: { dirty: boolean; paused: boolean; style: AnimStyle; presenting: boolean }): boolean`, true when `dirty`, or when `!paused && style !== 'off'`, or when `presenting`.
  - The render loop exports `requestRedraw(): void`.
  - `layoutDoc` keeps a one-entry cache keyed by `structureKey(doc: ParsedDoc, measure: MeasureText): string`, built from direction, node ids, labels and shapes, edge ends, labels, kinds and lengths, and groups. Pins, styles and classes are left out. `dagreRunCount(): number` is exported for tests.

- [ ] **Step 1: Write the failing tests**

```ts
it('caches prepared data per scene', () => { const s = sceneOf('flowchart TD\nA --> B'); expect(prepare(s)).toBe(prepare(s)); });
it('does not draw while idle', () => {
  expect(shouldDraw({ dirty: false, paused: true, style: 'pulse', presenting: false })).toBe(false);
  expect(shouldDraw({ dirty: false, paused: false, style: 'off', presenting: false })).toBe(false);
  expect(shouldDraw({ dirty: true, paused: true, style: 'off', presenting: false })).toBe(true);
});
it('moving a pin does not re-run dagre', () => {
  const a = parseMermaid('flowchart TD\nA --> B\nB --> C');
  const b = parseMermaid('flowchart TD\nA --> B\nB --> C\n%% studio:pos A 10 20');
  layoutDoc(a, testMeasure); const n = dagreRunCount();
  const lb = layoutDoc(b, testMeasure);
  expect(dagreRunCount()).toBe(n);
  expect(lb.nodes.A.center).toEqual({ x: 10, y: 20 });
});
```

`perf.spec.ts`: lower the per-frame budget from 50 ms to 33 ms (p95) on the 300-node corpus diagram, and add "idle canvas does not repaint": pause, wait 500 ms, and count `drawScene` calls through a `__studio.getDrawCount()` hook; the count does not change.
- [ ] **Step 2: Run** `npm test && npm run test:e2e -- perf.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block. Theme changes, view changes, selection changes, scene changes and present-mode steps call `requestRedraw()`.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "perf: redraw only when needed and reuse layout during drags"
```

### Task 32: CI on three browsers, the real base path, ship the tested build

**Files:**
- Modify: `playwright.config.ts`, `.github/workflows/deploy.yml`, every `tests/e2e/*.spec.ts` (`page.goto('/` → `page.goto('./`)
- Create: `.github/dependabot.yml`
- Test: `src/repo.test.ts`

**Interfaces:**
- Produces:
  - `playwright.config.ts` reads `BASE_PATH` (default `/`): `baseURL` is `http://localhost:4173` + `BASE_PATH`, and the web server builds with the same `BASE_PATH`.
  - Projects `chromium`, `firefox` and `webkit`.
  - Video tests run only where `probeEncoder` reports support; elsewhere they assert the GIF fallback message.

- [ ] **Step 1: Write the failing test** in `src/repo.test.ts`

```ts
it('CI tests three browsers on the real base path and ships what it tested', () => {
  const wf = readFileSync('.github/workflows/deploy.yml', 'utf8');
  expect(wf).toContain('concurrency:');
  expect(wf).toContain('node-version-file: .nvmrc');
  expect(wf).toContain('npm run lint');
  expect(wf).toMatch(/BASE_PATH.*\/gati-chitra\//s);
  expect(wf).toContain('upload-pages-artifact');
  const pw = readFileSync('playwright.config.ts', 'utf8');
  for (const p of ['chromium', 'firefox', 'webkit']) expect(pw).toContain(p);
  const dep = readFileSync('.github/dependabot.yml', 'utf8');
  expect(dep).toContain('npm'); expect(dep).toContain('github-actions');
});
```

- [ ] **Step 2: Run** `npm test -- src/repo.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - **`test` job:**
    - Computes `BASE_PATH` and the `VITE_*` URLs, using the same shell block the deploy job has now.
    - Runs `npm ci`, `npx playwright install --with-deps`, `npm run lint`, `npm test`, `npm run build`, `npm run check:dist` and `npm run test:e2e`.
    - Uploads `playwright-report/` with `actions/upload-artifact` when it fails.
    - On push to `main`, uploads `dist` with `actions/upload-pages-artifact`.
  - **`deploy` job:** only `configure-pages` and `deploy-pages`.
  - **Workflow:** add `concurrency: { group: pages, cancel-in-progress: false }`.
  - **Dependabot:** weekly updates for `npm` and `github-actions`, with minor and patch updates grouped.
  - **Action versions:** check the current major of every Action (Part 0, rule 7) and record them.
  - **e2e paths:** change `page.goto('/...')` to `page.goto('./...')` in every spec.
- [ ] **Step 4: Run** `npm test && BASE_PATH=/gati-chitra/ npm run test:e2e`. Expected: PASS in all three browsers. Do not push; the owner sees the first real workflow run when they push. If `npx actionlint .github/workflows/deploy.yml` runs, fix what it reports; if it cannot run (no network), say so in `DECISIONS.md`.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "ci: three browsers, real base path, ship the tested build"
```

### Task 33: Release v0.2.0

**Files:**
- Modify: `README.md`, `RELEASE_CHECKLIST.md`, `package.json` (version `0.2.0`), `DECISIONS.md`

- [ ] **Step 1: Fix the README facts against the code.**
  - The pause shortcut is `k`, not Space: `shortcutFor` maps `k`; Space is held to pan.
  - The zoom range is 0.1x to 4x (`VIEW`).
  - The PNG limit is 40,000,000 pixels (`EXPORT.pngMaxPixels`); GIF and video are 2,073,600 pixels per frame.
  - Add `npm run lint` to the commands.
  - Add the v0.2 fixes in one short "What's new" list.
  - Update "Known limitations" with the syntax M2 will add.
- [ ] **Step 2: Run the humanizer** on `README.md` (Part 0, rule 6), then restore any command, number or path it changed.
- [ ] **Step 3: Add the v0.2.0 section** from Part 7 to `RELEASE_CHECKLIST.md`. Tick the boxes you can check by running commands; list the rest for the owner (Part 0, rule 2).
- [ ] **Step 4: Run** `npm ci && npm run lint && npm test && npm run build && npm run check:dist && BASE_PATH=/gati-chitra/ npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit and tag**

```bash
git add -A && git commit -m "chore: release v0.2.0" && git tag v0.2.0
```

## Milestone M2: v0.3.0 Mermaid compatibility

Parser tasks (34 to 37) come first, drawing tasks (38 to 42) next, and text patches (43) last. Until a drawing task lands, the new kinds are drawn as their nearest existing kind (each parser task says how), so every commit builds and passes.

### Task 34: More arrow forms, link length, several statements per line, wider ids

**Files:**
- Modify: `src/core/types.ts` (`EdgeKind`, `GraphEdge.length`), `src/mermaid/tokens.ts`, `src/mermaid/parse-statement.ts`, `src/mermaid/format.ts` (`edgeOperatorText(kind, length = 1)`), `src/render/style.ts`, `src/render/draw-edges.ts`, `src/render/svg.ts`, `src/layout/geometry.ts`, `src/anim/anim.ts`
- Test: `src/mermaid/edges.test.ts`, `src/mermaid/tokens.test.ts`, `src/mermaid/parse.lines.test.ts`

**Interfaces:**
- Produces:
  - `GraphEdge.length: number`, with the grammar in Part 4.1 to 4.3.
  - `edgeOperatorText(kind: EdgeKind, length?: number): string` writes the longer operator: `('arrow', 2)` gives `--->`, `('dotted', 3)` gives `-...-`, `('invisible', 1)` gives `~~~`.
  - Until Task 39 the renderers treat `dottedBidirectional` as `dottedArrow`, `thickBidirectional` as `thickArrow`, `circleBoth` as `circleEnd` and `crossBoth` as `crossEnd`, and skip `invisible` edges in drawing, hit-testing and particles.

- [x] **Step 1: Write the failing tests**

```ts
it('reads several statements on one line', () => {
  const d = parseMermaid('flowchart LR\nA --> B; B --> C');
  expect(d.edges.map(e => [e.from, e.to])).toEqual([['A', 'B'], ['B', 'C']]);
  expect(d.diagnostics).toEqual([]);
  expect(d.lines[1].edgeIndexes).toEqual([0, 1]);
});
it('keeps ; inside labels', () => {
  expect(parseMermaid('flowchart LR\nA["a;b"] -->|c;d| B').edges[0].label).toBe('c;d');
});
it.each([
  ['A <-.-> B', 'dottedBidirectional'], ['A <==> B', 'thickBidirectional'],
  ['A o--o B', 'circleBoth'], ['A x--x B', 'crossBoth'], ['A ~~~ B', 'invisible'],
])('%s is %s', (line, kind) => {
  expect(parseMermaid(`flowchart LR\n${line}`).edges[0].kind).toBe(kind);
});
it.each([
  ['A --> B', 1], ['A ---> B', 2], ['A ----> B', 3], ['A --- B', 1], ['A ---- B', 2],
  ['A -.-> B', 1], ['A -..-> B', 2], ['A ==> B', 1], ['A ===> B', 2], ['A ==== B', 2],
  ['A -- x ----> B', 3], ['A ~~~ B', 1], ['A <---> B', 2],
])('%s has length %i', (line, len) => {
  expect(parseMermaid(`flowchart LR\n${line}`).edges[0].length).toBe(len);
});
it('removes quotes around pipe labels', () => {
  expect(parseMermaid('flowchart LR\nA -->|"yes"| B').edges[0].label).toBe('yes');
});
it('reads hyphenated and Unicode ids', () => {
  expect(parseMermaid('flowchart LR\nnode-1 --> 节点').nodes.map(n => n.id)).toEqual(['node-1', '节点']);
  expect(parseMermaid('flowchart LR\nA-->B').nodes.map(n => n.id)).toEqual(['A', 'B']);
});
it('writes longer operators', () => {
  expect(edgeOperatorText('arrow', 2)).toBe('--->');
  expect(edgeOperatorText('dotted', 3)).toBe('-...-');
  expect(edgeOperatorText('thickBidirectional', 1)).toBe('<==>');
});
```

- [x] **Step 2: Run** `npm test -- src/mermaid`. Expected: FAIL.
- [x] **Step 3: Implement** Part 4.1 to 4.3 in `tokens.ts` and `parse-statement.ts`, and the fallbacks listed in the Interfaces block in the renderers.
- [x] **Step 4: Run** `npm test && npm run lint && npm run build`. Expected: PASS, including every v0.1 corpus test.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: parse more arrow forms, link length and several statements per line"
```

### Task 35: New node shapes, the `@{ }` form, entity codes and markdown labels

**Files:**
- Create: `src/core/shapes.ts` (+ `src/core/shapes.test.ts`), `src/mermaid/props.ts`
- Modify: `src/core/types.ts` (`ShapeKind`, `Diagnostic.severity`, `markdown` on nodes, edges and groups), `src/core/constants.ts` (`MESSAGES`), `src/mermaid/tokens.ts`, `src/mermaid/parse-statement.ts`, `src/mermaid/format.ts`, `src/mermaid/ops-node.ts`, `src/app/diagnostics.ts` (class `info`), `src/layout/measure.ts`, `src/layout/polygon.ts`, `src/render/node-path.ts`, `src/render/svg.ts`
- Test: `src/mermaid/tokens.test.ts`, `src/mermaid/parse.lines.test.ts`, `src/mermaid/ops.edit.test.ts`

**Interfaces:**
- Produces:
  - `src/core/shapes.ts` exactly as Part 2 describes.
  - `readProps(s: string, pos: number): { props: Record<string, string>; end: number } | null` in `src/mermaid/props.ts`.
  - `shapeTokens(shape: ShapeKind): { open: string; close: string } | null`, which is `null` for `document`, `smallCircle`, `filledCircle`, `framedCircle`, `forkBar` and `text`.
  - `setShape` to a shape whose tokens are `null` writes `id@{ shape: <SHAPE_SHORT>, label: "<label>" }` (Part 4.8).
  - Until Task 38, the 10 new shapes are sized and drawn as `rect`.

- [x] **Step 1: Write the failing tests**

```ts
it.each([
  ['A[/x\\]', 'trapezoid'], ['A[\\x/]', 'trapezoidAlt'], ['A(((x)))', 'doubleCircle'], ['A>x]', 'asymmetric'],
  ['A[/x/]', 'parallelogram'], ['A[\\x\\]', 'parallelogramAlt'], ['A((x))', 'circle'],
])('%s is %s', (ref, shape) => {
  const n = parseMermaid(`flowchart TD\n${ref}`).nodes[0];
  expect(n).toMatchObject({ shape, label: 'x' });
});
it('reads @{ } shapes and labels', () => {
  const d = parseMermaid('flowchart TD\nA@{ shape: doc, label: "Report" }');
  expect(d.nodes[0]).toMatchObject({ shape: 'document', label: 'Report' });
  expect(d.diagnostics).toEqual([]);
});
it('notes approximate shapes', () => {
  const d = parseMermaid('flowchart TD\nA@{ shape: cloud }');
  expect(d.nodes[0].shape).toBe('round');
  expect(d.diagnostics).toEqual([{ line: 2, severity: 'info', message: MESSAGES.shapeApprox('cloud', 'Rounded') }]);
  expect(d.ok).toBe(true);
});
it('warns on unknown shapes', () => {
  const d = parseMermaid('flowchart TD\nA@{ shape: banana }');
  expect(d.nodes[0].shape).toBe('rect');
  expect(d.diagnostics[0]).toMatchObject({ severity: 'warning', message: MESSAGES.unknownShape('banana') });
});
it('draws icon nodes as rectangles with a note', () => {
  const d = parseMermaid('flowchart TD\nA@{ icon: "fa:user", label: "U" }');
  expect(d.nodes[0]).toMatchObject({ shape: 'rect', label: 'U' });
  expect(d.diagnostics[0]).toMatchObject({ severity: 'info', message: MESSAGES.iconUnsupported });
});
it('reads @{ } inside edges', () => {
  const d = parseMermaid('flowchart TD\nA@{ shape: diam } --> B');
  expect(d.nodes[0].shape).toBe('diamond');
  expect(d.edges).toHaveLength(1);
});
it('decodes entity codes', () => {
  expect(parseMermaid('flowchart TD\nA["#9829; #35; #amp; #lt;"]').nodes[0].label).toBe('♥ # & <');
});
it('marks markdown labels', () => {
  expect(parseMermaid('flowchart TD\nA["`**Bold** text`"]').nodes[0]).toMatchObject({ label: '**Bold** text', markdown: true });
  expect(parseMermaid('flowchart TD\nA -->|"`*x*`"| B').edges[0]).toMatchObject({ label: '*x*', markdown: true });
});
it('writes shapes without a bracket form as @{ }', () => {
  const r = applyOp('flowchart TD\nA[Start]', { type: 'setShape', id: 'A', shape: 'document' });
  expect(r).toEqual({ text: 'flowchart TD\nA@{ shape: doc, label: "Start" }' });
});
// shapes.test.ts
it('maps every alias to a shape', () => {
  expect(shapeFromName(' DB ')).toEqual({ shape: 'cylinder', approx: false });
  expect(shapeFromName('cloud')).toEqual({ shape: 'round', approx: true });
  expect(shapeFromName('banana')).toBeNull();
  for (const k of Object.keys(SHAPE_SHORT) as ShapeKind[]) expect(shapeFromName(SHAPE_SHORT[k])?.shape).toBe(k);
});
```

- [x] **Step 2: Run** `npm test`. Expected: FAIL.
- [x] **Step 3: Implement** Part 4.4 and 4.5 and the Interfaces block. Every `switch` over `ShapeKind` must stay exhaustive; the compiler lists them.
- [x] **Step 4: Run** `npm test && npm run lint && npm run build`. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: parse new node shapes, @{} syntax, entities and markdown labels"
```

### Task 36: Edge ids and animation, click links, accessibility lines, title, `classDef default`, arrows to subgraphs

**Files:**
- Create: `src/mermaid/groups.ts`
- Modify: `src/core/types.ts` (`LineKind`, `EdgeAnim`, `NodeLink`, the `GraphEdge` and `ParsedDoc` fields in Part 3), `src/core/constants.ts` (`MESSAGES`), `src/mermaid/parse-header.ts`, `src/mermaid/parse-blocks.ts`, `src/mermaid/parse-statement.ts`, `src/mermaid/styles.ts`, `src/layout/layout.ts` (skip edges whose end is a group until Task 42)
- Test: `src/mermaid/parse.lines.test.ts`, `src/mermaid/parse.styles.test.ts`, `src/mermaid/parse.groups.test.ts`, `src/mermaid/parse.header.test.ts`

**Interfaces:**
- Produces: `sealedGroups(doc: ParsedDoc): Set<string>` in `src/mermaid/groups.ts`. It returns the groups that have a `direction` and no edge between a node inside them (at any depth) and a node outside. The parser uses it for the info note; Task 42's layout uses it too. It lives in `mermaid` because `mermaid` may not import `layout`.
- Produces the Part 3 fields with Part 4.6 and 4.7 semantics. Default values: `ref: null`, `anim: { animate: null, speed: null }`, `fromIsGroup: false`, `toIsGroup: false`, `title: null`, `accTitle: null`, `accDescr: null`, `links: {}`, `explicitEdgeAnimation: false`.

- [x] **Step 1: Write the failing tests**

```ts
it('reads edge ids and properties', () => {
  const d = parseMermaid('flowchart LR\nA e1@--> B\ne1@{ animate: true, animation: fast }');
  expect(d.edges[0]).toMatchObject({ ref: 'e1', anim: { animate: true, speed: 'fast' } });
  expect(d.lines[2].kind).toBe('edgeProps');
  expect(d.explicitEdgeAnimation).toBe(true);
});
it('reads properties written before the edge', () => {
  expect(parseMermaid('flowchart LR\ne1@{ animation: slow }\nA e1@--> B').edges[0].anim).toEqual({ animate: true, speed: 'slow' });
});
it('reads click links', () => {
  const d = parseMermaid('flowchart LR\nA\nclick A "https://x.org" "Tip" _blank');
  expect(d.links.A).toEqual({ url: 'https://x.org', tooltip: 'Tip', target: '_blank' });
  expect(d.lines[2].kind).toBe('click');
});
it('drops unsafe links', () => {
  const d = parseMermaid('flowchart LR\nA\nclick A "javascript:alert(1)"');
  expect(d.links).toEqual({});
  expect(d.diagnostics[0]).toMatchObject({ severity: 'info', message: MESSAGES.linkBlocked });
});
it('notes callbacks', () => {
  expect(parseMermaid('flowchart LR\nA\nclick A callback').diagnostics[0].message).toBe(MESSAGES.clickCallbackIgnored);
});
it('reads accTitle and a multi-line accDescr', () => {
  const d = parseMermaid('flowchart LR\naccTitle: Orders\naccDescr {\n  line one\n  line two\n}\nA');
  expect(d).toMatchObject({ accTitle: 'Orders', accDescr: 'line one\nline two' });
  expect(d.lines.slice(1, 6).map(l => l.kind)).toEqual(['acc', 'acc', 'acc', 'acc', 'acc']);
});
it('reads the front matter title', () => {
  expect(parseMermaid('---\ntitle: "Checkout"\n---\nflowchart TD\nA').title).toBe('Checkout');
});
it('applies classDef default before other classes', () => {
  const d = parseMermaid('flowchart LR\nclassDef default fill:#eee\nclassDef hot fill:#f00\nA\nB:::hot');
  expect(d.nodes.map(n => n.style.fill)).toEqual(['#eee', '#f00']);
});
it('arrows to a subgraph do not create nodes', () => {
  const d = parseMermaid('flowchart LR\nsubgraph S\nA\nend\nB --> S');
  expect(d.nodes.map(n => n.id)).toEqual(['A', 'B']);
  expect(d.edges[0]).toMatchObject({ from: 'B', to: 'S', toIsGroup: true });
});
it('notes a subgraph direction that cannot apply', () => {
  const d = parseMermaid('flowchart TB\nsubgraph S\ndirection LR\nA\nend\nC --> A');
  expect(d.diagnostics).toContainEqual({ line: 3, severity: 'info', message: MESSAGES.groupDirectionIgnored('S') });
});
```

- [x] **Step 2: Run** `npm test -- src/mermaid`. Expected: FAIL.
- [x] **Step 3: Implement** Part 4.6 and 4.7. Collect edge refs in a first pass over the lines, using the edge-id regex from Part 4.3.
- [x] **Step 4: Run** `npm test && npm run lint && npm run build`. Expected: PASS.
- [x] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: parse edge ids, click links, accessibility lines and the title"
```

### Task 37: Compatibility corpus and fence stripping

**Files:**
- Create: `src/mermaid/fences.ts` (+ `fences.test.ts`), `src/mermaid/compat.test.ts`, `tests/fixtures/compat/*.mmd` with one `*.json` each, and `tests/fixtures/compat/README.md` (where each example came from; Mermaid's documentation is MIT-licensed)
- Modify: `src/app/toolbar.ts` (Open strips fences; the file picker also accepts `.md`), `src/app/ui.ts` (a `paste` listener on `#source` strips fences when the paste replaces the whole text or the text is empty)

**Interfaces:**
- Produces:
  - `stripFences(text: string): string`. When the first non-blank line matches `/^\s*(```|~~~)\s*mermaid\s*$/i` and the last non-blank line matches `/^\s*(```|~~~)\s*$/`, it removes both; otherwise it returns the text unchanged.
  - Fixture format: `<name>.json` = `{ "nodes": number, "edges": number, "groups": number }`.

- [x] **Step 1: Write the fixtures.**
  - Copy 20 examples from https://mermaid.js.org/syntax/flowchart.html, one per file, covering: classic shapes, every new shape name, every arrow form, link length, invisible links, edge ids with animation, `&` chains, markdown strings, entity codes, subgraphs with `direction`, arrows to subgraphs, `click`, comments and directives, front matter title, `accTitle`/`accDescr`, `classDef`/`class`/`:::`/`style`/`linkStyle default`, several statements on one line, Unicode ids, and two longer real-world diagrams (a CI pipeline and a login flow).
  - Leave out icon and image examples (not in scope).
  - Count the nodes, edges and groups by hand into the `.json` file.
- [x] **Step 2: Write the failing tests**

```ts
for (const name of fixtureNames) {
  it(`${name} parses cleanly`, () => {
    const d = parseMermaid(read(`${name}.mmd`));
    expect(d.diagnostics.filter(x => x.severity !== 'info')).toEqual([]);
    expect({ nodes: d.nodes.length, edges: d.edges.length, groups: d.groups.length }).toEqual(readJson(`${name}.json`));
  });
  it(`${name}: every prefix parses without throwing and keeps every line`, () => {
    const lines = read(`${name}.mmd`).split('\n');
    for (let i = 1; i <= lines.length; i++) {
      const text = lines.slice(0, i).join('\n');
      expect(parseMermaid(text).lines.map(l => l.text).join('\n')).toBe(text);
    }
  });
}
it('strips fences', () => {
  expect(stripFences('```mermaid\nflowchart TD\nA\n```')).toBe('flowchart TD\nA');
  expect(stripFences('\n~~~ Mermaid\nflowchart TD\n~~~\n')).toBe('flowchart TD');
  expect(stripFences('```mermaid\nflowchart TD')).toBe('```mermaid\nflowchart TD');
  expect(stripFences('flowchart TD\nA')).toBe('flowchart TD\nA');
});
```

- [x] **Step 3: Run** `npm test -- src/mermaid`. Expected: FAIL on `stripFences` and on any fixture that shows a gap. Fix gaps in the parser task's module (34, 35 or 36), not with special cases in the test. If a fixture uses syntax listed under "Not in scope", replace that fixture.
- [x] **Step 4: Write the failing e2e test** in `edit.spec.ts`, "opening a Markdown file strips the fences": `setInputFiles` a `.md` file whose whole content is a fenced flowchart; the editor shows the text without fences.
- [x] **Step 5: Implement** `stripFences` and wire it to Open and paste.
- [x] **Step 6: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- edit.spec.ts`. Expected: PASS.
- [x] **Step 7: Commit**

```bash
git add -A && git commit -m "test: Mermaid compatibility corpus and fence stripping"
```

### Task 38: Draw the ten new shapes

**Files:**
- Create: `src/render/shapes-extra.ts` (document wave path, ring helpers shared by canvas and SVG)
- Modify: `src/core/constants.ts` (`LAYOUT` keys from Part 2), `src/layout/measure.ts` (`sizeNode` gains `direction: Direction`), `src/layout/layout.ts`, `src/layout/polygon.ts`, `src/render/node-path.ts`, `src/render/draw.ts`, `src/render/svg.ts`
- Test: `src/layout/measure.test.ts`, `src/layout/geometry.test.ts`, `src/render/draw.test.ts`, `src/render/svg.test.ts`

**Interfaces:**
- Produces:
  - `sizeNode(node: GraphNode, measure: MeasureText, direction: Direction)`:
    - `smallCircle` and `filledCircle`: `LAYOUT.smallCircleD` square.
    - `forkBar`: `forkBarW` x `forkBarH` for TB and BT; swapped for LR and RL.
    - `doubleCircle`: the circle size plus `2 * doubleCircleGap`.
    - The rest as `rect`, plus the shape's inset.
  - **Labels:** `smallCircle`, `filledCircle` and `forkBar` draw no label. `text` draws its label with no fill and no stroke.
  - **Fills:** `filledCircle` and `forkBar` are filled with the node's stroke colour.
  - **Outlines:**
    - `trapezoid`: the top edge is inset by `trapezoidInset` on both sides.
    - `trapezoidAlt`: the bottom edge is inset.
    - `asymmetric`: five points, with the notch `asymmetricNotch` on the left side at mid-height.
    - `document`: the bottom edge is a wave of height `documentWave`.
    - `framedCircle`: an outer circle and an inner circle `doubleCircleGap` smaller.

- [ ] **Step 1: Write the failing tests**

```ts
it('sizes point shapes and the fork bar', () => {
  expect(sizeNode(nodeOf('smallCircle'), testMeasure, 'TB')).toMatchObject({ width: 20, height: 20 });
  expect(sizeNode(nodeOf('forkBar'), testMeasure, 'TB')).toMatchObject({ width: 72, height: 10 });
  expect(sizeNode(nodeOf('forkBar'), testMeasure, 'LR')).toMatchObject({ width: 10, height: 72 });
});
it.each(['trapezoid', 'trapezoidAlt', 'asymmetric'] as const)('%s polygon stays inside its box', (shape) => {
  const box = { id: 'A', center: { x: 0, y: 0 }, width: 100, height: 40, lines: ['x'] };
  for (const p of shapePolygon(box, shape)!) { expect(Math.abs(p.x)).toBeLessThanOrEqual(50); expect(Math.abs(p.y)).toBeLessThanOrEqual(20); }
});
it.each(['doubleCircle', 'smallCircle', 'filledCircle', 'framedCircle'] as const)('%s border point is on the outer circle', (shape) => {
  const box = { id: 'A', center: { x: 0, y: 0 }, width: 40, height: 40, lines: [] };
  const p = borderPoint(box, shape, { x: 100, y: 0 });
  expect(Math.hypot(p.x, p.y)).toBeCloseTo(20, 1);
});
it('SVG draws two rings for a double circle and fills a junction', () => {
  const svg = svgOf('flowchart TD\nA(((x)))\nB@{ shape: f-circ }');
  expect(svg.match(/<circle/g)!.length).toBeGreaterThanOrEqual(3);
  expect(svg).toMatch(/<circle[^>]*fill="(?!none)/);
});
it('canvas draws no label for a start point and no outline for text', () => {
  const calls = recordDraw('flowchart TD\nA@{ shape: sm-circ, label: "S" }\nB@{ shape: text, label: "T" }');
  expect(calls.filter(c => c.name === 'fillText').map(c => c.args[0])).toEqual(['T']);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block, sharing one path builder per shape between `node-path.ts` (canvas) and `svg.ts`.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- preview.spec.ts export-svg.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: draw ten new node shapes on canvas and in SVG"
```

### Task 39: Invisible links, two-ended markers, link length and per-edge animation

**Files:**
- Modify: `src/core/constants.ts` (`EDGE_ANIM`), `src/layout/layout.ts` (dagre `minlen: edge.length`; invisible edges stay in dagre), `src/layout/geometry.ts` (`routeEdges` and `hitTest` skip invisible edges), `src/render/style.ts`, `src/render/draw-edges.ts`, `src/render/svg.ts`, `src/anim/anim.ts`, `src/anim/steps.ts`
- Test: `src/layout/layout.test.ts`, `src/layout/geometry.test.ts`, `src/anim/anim.test.ts`, `src/anim/steps.test.ts`, `src/render/svg.test.ts`

**Interfaces:**
- Produces: `edgeSpeedFactor(edge: GraphEdge, doc: ParsedDoc): number` in `src/anim/anim.ts`:
  - `0` for invisible edges.
  - `0` when `doc.explicitEdgeAnimation` is true and `edge.anim.animate !== true`.
  - Otherwise `EDGE_ANIM.fastFactor` for `fast`, `EDGE_ANIM.slowFactor` for `slow`, and `1`.

  `frameState` makes no particles and no dash offset for factor-0 edges, and multiplies the phase by the factor.
- The four two-ended kinds draw their marker at both ends. The dotted and thick variants use the dash pattern and width of `dotted` and `thick`.

- [ ] **Step 1: Write the failing tests**

```ts
it('longer links span more ranks', () => {
  const l = layoutOf('flowchart TD\nA --> B\nA ----> C');
  expect(l.nodes.C.center.y - l.nodes.A.center.y).toBeGreaterThan(l.nodes.B.center.y - l.nodes.A.center.y + LAYOUT.rankSep / 2);
});
it('invisible links place nodes but are not drawn or hit', () => {
  const s = sceneOf('flowchart LR\nA ~~~ B');
  expect(s.layout.nodes.B.center.x).toBeGreaterThan(s.layout.nodes.A.center.x);
  expect(s.layout.edges).toEqual({});
  expect(buildSteps(s.doc).flatMap(st => st.edges)).toEqual([]);
});
it('only animated edges move in explicit mode', () => {
  const doc = parseMermaid('flowchart LR\nA e1@--> B\nB --> C\ne1@{ animate: true }');
  const f = frameState(sceneOf(doc), DEFAULT_ANIM, 0.25);
  expect(new Set(f.particles.map(p => p.edgeId))).toEqual(new Set(['e0']));
});
it('fast edges run at twice the speed', () => {
  const doc = parseMermaid('flowchart LR\nA e1@--> B\ne1@{ animation: fast }');
  expect(edgeSpeedFactor(doc.edges[0], doc)).toBe(2);
});
it('two-ended kinds draw two markers', () => {
  expect(svgOf('flowchart LR\nA o--o B').match(/class="marker-circle"/g)).toHaveLength(2);
  expect(svgOf('flowchart LR\nA x--x B').match(/class="marker-cross"/g)).toHaveLength(2);
  expect(svgOf('flowchart LR\nA <-.-> B').match(/class="marker-arrow"/g)).toHaveLength(2);
});
```

(If `svg.ts` does not already put a `class` on markers, add `marker-arrow`, `marker-circle` and `marker-cross` in this task.)

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block, replacing Task 34's fallbacks.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- preview.spec.ts export-gif.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: invisible links, two-ended markers, link length and per-edge animation"
```

### Task 40: Bold and italic markdown labels

**Files:**
- Create: `src/layout/rich-text.ts` (+ `rich-text.test.ts`)
- Modify: `src/core/types.ts` (`TextRun`, `FontStyle`, `NodeBox.runs`), `src/layout/measure.ts` (`MeasureText` with `style`; `canvasMeasure` sets the font weight and style), `src/layout/layout.ts` (edge-label width from runs), `src/render/draw.ts`, `src/render/draw-edges.ts`, `src/render/svg.ts`
- Test: `src/layout/rich-text.test.ts`, `src/layout/measure.test.ts`, `src/render/svg.test.ts`

**Interfaces:**
- Produces:
  - `parseInlineMarkdown(text: string): TextRun[]` reads only `**bold**`, `*italic*` and `_italic_`. An unmatched marker is literal text. Neighbouring runs with the same style are merged.
  - `wrapRuns(runs: TextRun[], maxWidth: number, fontSize: number, measure: MeasureText): TextRun[][]` breaks at `\n` and at spaces, like `wrapLabel`.
  - `drawRuns(ctx: Ctx2D, lines: TextRun[][], center: Point, fontSize: number, lineHeight: number): void` in `src/render/draw.ts`.
  - `fontString(fontSize: number, style?: FontStyle): string` in `src/layout/measure.ts`. Both `canvasMeasure` and `drawRuns` use it.
  - SVG: one `<text>` per line, with `<tspan font-weight="bold">` and/or `font-style="italic"` per run.
  - Plain labels leave `runs` undefined and keep the v0.1 drawing path.

- [ ] **Step 1: Write the failing tests**

```ts
const R = (text: string, bold = false, italic = false) => ({ text, bold, italic });
it('reads bold and italic', () => {
  expect(parseInlineMarkdown('**a** b *c* _d_')).toEqual([R('a', true), R(' b '), R('c', false, true), R(' '), R('d', false, true)]);
  expect(parseInlineMarkdown('**a')).toEqual([R('**a')]);
  expect(parseInlineMarkdown('***a***')).toEqual([R('a', true, true)]);
});
it('wraps runs and keeps their style', () => {
  const m: MeasureText = (t) => t.length * 10;
  expect(wrapRuns([R('aaaa ', true), R('bbbb')], 50, 16, m)).toEqual([[R('aaaa', true)], [R('bbbb')]]);
  expect(wrapRuns([R('x\ny')], 500, 16, m)).toEqual([[R('x')], [R('y')]]);
});
it('writes tspans in SVG', () => {
  expect(svgOf('flowchart TD\nA["`**Hi** there`"]')).toContain('<tspan font-weight="bold">Hi</tspan><tspan> there</tspan>');
});
it('builds the canvas font with weight and style', () => {
  expect(fontString(16)).toBe(`16px ${FONT_STACK_SANS}`);
  expect(fontString(16, { bold: true, italic: true })).toBe(`italic bold 16px ${FONT_STACK_SANS}`);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- preview.spec.ts export-png.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: bold and italic markdown labels"
```

### Task 41: Diagram title, accessible names and SVG links

**Files:**
- Create: `src/app/describe.ts` (+ `describe.test.ts`)
- Modify: `src/core/constants.ts` (`LAYOUT.titleFontSize`, `LAYOUT.titleH`), `src/core/types.ts` (`SceneLayout.title`), `src/layout/layout.ts`, `src/render/draw.ts`, `src/render/svg.ts`, `src/app/ui.ts`, `src/app/export-panel.ts`, `index.html` (`<p id="canvas-desc" class="visually-hidden">`, `aria-describedby="canvas-desc"` on the canvas)
- Test: `src/layout/layout.test.ts`, `src/render/svg.test.ts`, `tests/e2e/a11y.spec.ts`

**Interfaces:**
- Produces:
  - `describeDiagram(doc: ParsedDoc): { name: string; description: string }`.
    - `name` is `accTitle`, else `title`, else `'Flowchart'`.
    - `description` is `accDescr` (when present) plus a space, then `"<n> node(s), <m> arrow(s)."`, counting visible edges only.
  - `SceneLayout.title` is centred above the content. `bounds` grows upward by `LAYOUT.titleH`.
  - The SVG root gets `role="img" aria-labelledby="gc-title gc-desc"` with `<title id="gc-title">` and `<desc id="gc-desc">`.
  - A node with a link is wrapped in `<a href="..." target="..." rel="noopener noreferrer">`, with a `<title>` tooltip when one is given.
  - `#export-name` defaults to the title when the field still holds `diagram`.

- [ ] **Step 1: Write the failing tests**

```ts
it('names and describes the diagram', () => {
  expect(describeDiagram(parseMermaid('flowchart TD\naccTitle: Orders\naccDescr: How orders flow\nA --> B'))).toEqual({ name: 'Orders', description: 'How orders flow 2 nodes, 1 arrow.' });
  expect(describeDiagram(parseMermaid('---\ntitle: T\n---\nflowchart TD\nA')).name).toBe('T');
  expect(describeDiagram(parseMermaid('flowchart TD\nA ~~~ B')).description).toBe('2 nodes, 0 arrows.');
});
it('puts the title above the content', () => {
  const l = layoutOf('---\ntitle: Checkout\n---\nflowchart TD\nA');
  expect(l.title!.center.y).toBeLessThan(l.nodes.A.center.y - l.nodes.A.height / 2);
  expect(l.bounds.y).toBeLessThanOrEqual(l.title!.center.y - LAYOUT.titleFontSize / 2);
});
it('writes accessible SVG with safe links', () => {
  const svg = svgOf('flowchart TD\naccTitle: Orders\nA\nclick A "https://x.org/?a=1&b=2" "Tip" _blank');
  expect(svg).toContain('<title id="gc-title">Orders</title>');
  expect(svg).toContain('<a href="https://x.org/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer"><title>Tip</title>');
});
```

e2e in `a11y.spec.ts`: after `setText` with `accTitle: Orders`, the canvas has the accessible name "Orders" and `#canvas-desc` ends with `1 arrow.` for a one-edge diagram.
- [ ] **Step 2: Run** `npm test && npm run test:e2e -- a11y.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: diagram title, accessible names and SVG links"
```

### Task 42: Subgraph direction and arrows to subgraphs

**Files:**
- Create: `src/layout/subgraph-layout.ts` (+ `subgraph-layout.test.ts`)
- Modify: `src/layout/layout.ts`, `src/layout/geometry.ts`, `src/layout/polygon.ts` (`rectBorderPoint`), `tests/support/scene.ts` (add `distanceToRectBorder(p: Point, r: Rect): number`)

**Interfaces:**
- Consumes: `sealedGroups(doc)` from `src/mermaid/groups.ts` (Task 36).
- Produces:
  - `rectBorderPoint(rect: Rect, toward: Point): Point`.
  - **Layout algorithm for sealed groups**, innermost first:
    1. Build a dagre graph with `rankdir` set to the group's direction. It holds the group's direct member nodes, its child groups (a sealed child is a fixed-size node taken from its own earlier result; an unsealed child stays a compound node), and the edges among them.
    2. Lay it out. The group's box is the content bounds plus `2 * LAYOUT.groupPad`, plus `LAYOUT.groupTitleH` at the top.
    3. In the parent graph, the group is one plain node of that size; its members are not added to the parent.
    4. After the parent layout, move the inner positions so the content sits inside the group's box, below the title.
    5. Pins still override positions.
  - **Edges whose end is a group:** in dagre, they go to the group's first member node in document order (searching nested groups depth-first). With no member, the edge is not given to dagre and is not routed. When routing, that end is `rectBorderPoint(groupRect, otherEnd)`.

- [ ] **Step 1: Write the failing tests**

```ts
it('lays out a sealed LR subgraph sideways inside a TB chart', () => {
  const l = layoutOf('flowchart TB\nsubgraph S\ndirection LR\nA --> B\nend');
  expect(Math.abs(l.nodes.A.center.y - l.nodes.B.center.y)).toBeLessThan(1);
  expect(l.nodes.A.center.x).toBeLessThan(l.nodes.B.center.x);
});
it('ignores the direction when an arrow leaves the subgraph', () => {
  const l = layoutOf('flowchart TB\nsubgraph S\ndirection LR\nA --> B\nend\nC --> A');
  expect(l.nodes.A.center.y).toBeLessThan(l.nodes.B.center.y);
});
it('keeps nodes inside their group box', () => {
  const l = layoutOf('flowchart TB\nsubgraph S\ndirection LR\nA --> B\nend\nX --> S');
  const r = l.groups.S.rect;
  for (const id of ['A', 'B']) { const n = l.nodes[id]; expect(n.center.x - n.width / 2).toBeGreaterThanOrEqual(r.x); expect(n.center.y - n.height / 2).toBeGreaterThan(r.y); }
});
it('routes an arrow to the subgraph border', () => {
  const s = sceneOf('flowchart LR\nsubgraph S\nA\nend\nB --> S');
  expect(s.layout.nodes.S).toBeUndefined();
  expect(distanceToRectBorder(s.layout.edges.e0.to, s.layout.groups.S.rect)).toBeLessThan(0.5);
});
it('does not throw for an arrow to an empty subgraph', () => {
  expect(() => sceneOf('flowchart LR\nsubgraph S\nend\nB --> S')).not.toThrow();
});
```

- [ ] **Step 2: Run** `npm test -- src/layout`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block. Keep `layout.ts` under 300 lines by putting the sealed-group pass in `subgraph-layout.ts`.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- preview.spec.ts`. Expected: PASS; the v0.1 300-node layout test is still under 2 s.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: subgraph direction and arrows to subgraphs"
```

### Task 43: Visual edits keep the new syntax intact

**Files:**
- Modify: `src/mermaid/ops-node.ts`, `src/mermaid/ops-edge.ts`, `src/mermaid/ops.ts`, `src/mermaid/format.ts`, `src/app/properties.ts`, `src/app/toolbar.ts`, `index.html` (the shape and edge-kind `<select>`s become empty and are filled from `SHAPE_NAMES` and `EDGE_KIND_NAMES`)
- Test: `src/mermaid/ops.edit.test.ts`, `src/mermaid/ops.add-delete.test.ts`, `tests/e2e/edit.spec.ts`

**Interfaces:**
- Consumes: `SHAPE_SHORT`, `SHAPE_NAMES`, `EDGE_KIND_NAMES` (Task 35), `edgeOperatorText(kind, length)` (Task 34), `readProps` (Task 35).
- Produces: Part 4.8 behaviour for `applyOp`. `formatLabel` writes `#` followed by `[A-Za-z0-9]+;` as `#35;` plus the rest.

- [ ] **Step 1: Write the failing tests**

```ts
it.each([
  ['A@{ shape: doc, label: "R" }', { type: 'renameNode', id: 'A', label: 'Q' }, 'A@{ shape: doc, label: "Q" }'],
  ['A@{ shape: doc }', { type: 'renameNode', id: 'A', label: 'Q' }, 'A@{ shape: doc, label: "Q" }'],
  ['A@{ shape: doc, label: "R" }', { type: 'setShape', id: 'A', shape: 'diamond' }, 'A@{ shape: diam, label: "R" }'],
  ['A[x]', { type: 'setShape', id: 'A', shape: 'trapezoid' }, 'A[/x\\]'],
  ['A e1@---> B', { type: 'setEdgeKind', index: 0, kind: 'thickArrow' }, 'A e1@===> B'],
  ['A e1@--> B', { type: 'reverseEdge', index: 0 }, 'B e1@--> A'],
] as const)('%s', (line, op, expected) => {
  expect(applyOp(`flowchart TD\n${line}`, op)).toEqual({ text: `flowchart TD\n${expected}` });
});
it('splits a ; line before changing it', () => {
  const r = applyOp('flowchart TD\n  A --> B; B --> C', { type: 'deleteEdge', index: 1 }) as { text: string };
  const d = parseMermaid(r.text);
  expect(r.text).not.toContain(';');
  expect(d.edges.map(e => [e.from, e.to])).toEqual([['A', 'B']]);
  expect(r.text.split('\n')[1]).toBe('  A --> B');
});
it('a rename never creates an entity', () => {
  const r = applyOp('flowchart TD\nA[x]', { type: 'renameNode', id: 'A', label: 'C#1;' }) as { text: string };
  expect(parseMermaid(r.text).nodes[0].label).toBe('C#1;');
});
```

e2e in `edit.spec.ts`: "properties list every shape". Select node A; `#prop-shape option` count is 20; choose "Document"; the text line for A becomes `A@{ shape: doc, label: "Start" }`.
- [ ] **Step 2: Run** `npm test && npm run test:e2e -- edit.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** Part 4.8 and the generated selects.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: visual edits keep the new syntax intact"
```

### Task 44: Release v0.3.0

- [ ] **Step 1: Rewrite the README's "Supported Mermaid syntax" section.**
  - Cover every form from Part 4 with one short example each.
  - Add a "Not supported" list: icons and images, click callbacks, `curve:`, class-based edge animation, and other diagram types.
  - Update "Known limitations".
- [ ] **Step 2: Run the humanizer** on `README.md`, then restore commands, numbers and code blocks.
- [ ] **Step 3: Add the v0.3.0 section** from Part 7 and tick what commands can check (Part 0, rule 2). Set `package.json` to `0.3.0`.
- [ ] **Step 4: Run** the full command list from Part 0. Expected: PASS.
- [ ] **Step 5: Commit and tag**

```bash
git add -A && git commit -m "chore: release v0.3.0" && git tag v0.3.0
```

## Milestone M3: v0.4.0 Editor UX and accessibility

### Task 45: Automated accessibility checks

**Files:**
- Modify: `package.json` (`@axe-core/playwright` dev dependency), any file a violation points to
- Create: `tests/e2e/axe.spec.ts`

- [ ] **Step 1: Write the failing test.** For each state below, run `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()` and expect `violations` to equal `[]`. On failure, print each violation's `id` and target.
  - The page loaded in the light scheme.
  - The page loaded in the dark scheme (`page.emulateMedia({ colorScheme: 'dark' })` with no saved scheme).
  - The Export dialog open.
  - The Templates dialog open.
  - Present mode.
  - A parse error showing.
- [ ] **Step 2: Run** `npm run test:e2e -- axe.spec.ts`. Expected: FAIL or PASS. If it passes at once, note that in `DECISIONS.md` and go to Step 4.
- [ ] **Step 3: Fix each violation** at its source (colour tokens, names, landmarks, heading order). One line in `DECISIONS.md` per kind of fix.
- [ ] **Step 4: Run** `npm run lint && npm test && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "test: automated accessibility checks"
```

### Task 46: Code editor with one undo history

**Files:**
- Create: `src/editor/text-diff.ts` (+ `text-diff.test.ts`), `src/app/code-editor.ts`, `src/app/editor-wiring.ts`, `tests/support/editor.ts`
- Modify:
  - `package.json`: `@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/language` and `@codemirror/lint`, at exact versions.
  - `index.html`: `<textarea id="source">` becomes `<div id="source"></div>`.
  - `src/app/ui.ts`: move the source-text wiring into `editor-wiring.ts`.
  - `src/app/shortcuts.ts`, `src/app/studio.ts`, `src/app/style.css`.
  - Every e2e spec that touches `#source` (31 places): use the helpers in `tests/support/editor.ts`.

**Interfaces:**
- Produces:

```ts
// src/editor/text-diff.ts
export function minimalChange(a: string, b: string): { from: number; to: number; insert: string } | null;
// src/app/code-editor.ts
export interface CodeEditorEnv {
  initialText: string; label: string;
  onChange(text: string): void;   // user edits only
  onUndo(): void; onRedo(): void;
  onPaste(text: string): string;  // returns the text to insert (stripFences)
}
export interface CodeEditor {
  getText(): string;
  setText(text: string, how: 'replace' | 'patch'): void; // never calls onChange; 'patch' applies minimalChange
  revealLine(line: number): void;                         // 1-based
  focus(): void; destroy(): void;
}
export function createCodeEditor(parent: HTMLElement, env: CodeEditorEnv): CodeEditor;
// tests/support/editor.ts
export function setEditorText(page: Page, text: string): Promise<void>;  // via __studio.setText
export function typeInEditor(page: Page, text: string): Promise<void>;   // real key presses
export function editorText(page: Page): Promise<string>;
```

- **Extensions:** `lineNumbers()`, `drawSelection()`, `highlightActiveLine()`, `keymap.of(defaultKeymap)`, and a `Prec.highest` keymap that sends `Mod-z` to `onUndo` and `Mod-y` and `Mod-Shift-z` to `onRedo`. Do not use `history()` or `historyKeymap`.
- **Accessible name:** `EditorView.contentAttributes.of({ 'aria-label': env.label })`.
- **`KeyInfo`** gains `inEditor?: boolean`. When it is true, `shortcutFor` returns only `'escape'`.
- **`__studio`** gains `getCaret(): { line: number; col: number }`.

- [ ] **Step 1: Write the failing unit tests**

```ts
it('finds the smallest change', () => {
  expect(minimalChange('abc', 'abc')).toBeNull();
  expect(minimalChange('abc', 'abXc')).toEqual({ from: 2, to: 2, insert: 'X' });
  expect(minimalChange('flowchart TD\nA', 'flowchart TD\nB')).toEqual({ from: 13, to: 14, insert: 'B' });
  expect(minimalChange('aaa', 'aa')).toEqual({ from: 2, to: 3, insert: '' });
});
it('never splits a surrogate pair', () => {
  expect(minimalChange('a😀b', 'a😃b')).toEqual({ from: 1, to: 3, insert: '😃' });
});
it('leaves keys inside the editor to the editor', () => {
  expect(shortcutFor({ key: 'z', ctrl: true, meta: false, shift: false, alt: false, targetTag: 'DIV', inEditor: true })).toBeNull();
});
```

- [ ] **Step 2: Write the failing e2e tests** in `edit.spec.ts`
  - "one undo history":
    1. Type `\nA --> X` and wait 1.1 s.
    2. Drag node A 50 px.
    3. Focus the editor and press Ctrl+Z: the text has `A --> X` and no `studio:pos A` line.
    4. Click the page body and press Ctrl+Z: the text equals the starting text.
    5. Press Ctrl+Y twice: the drag is back.
  - "caret stays after a canvas edit": put the caret at the end of line 2, rename the node defined on line 4 from the properties panel, and check `__studio.getCaret().line` is still 2.
  - "line numbers show": `.cm-lineNumbers .cm-gutterElement` count is at least the line count.
  - "pasting fenced text strips the fences": in Chromium, grant clipboard permissions, write a fenced diagram to the clipboard and press Ctrl+V in an empty editor; the editor text has no ```` ``` ````.
- [ ] **Step 3: Run** `npm test && npm run test:e2e -- edit.spec.ts`. Expected: FAIL.
- [ ] **Step 4: Implement** per the Interfaces block. Canvas ops and undo/redo call `setText(text, 'patch')`; New, Open, templates and share links call `setText(text, 'replace')`. Move the `paste` handling from Task 37 into `onPaste`.
- [ ] **Step 5: Run** `npm test && npm run lint && npm run build && npm run check:dist && npm run test:e2e`. Expected: PASS; initial JS is under 150 KB gzip. Record the new size in `DECISIONS.md`.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: code editor with one undo history"
```

### Task 47: Mermaid highlighting and errors on their lines

**Files:**
- Create: `src/app/mermaid-lang.ts` (+ `mermaid-lang.test.ts`)
- Modify: `src/app/code-editor.ts` (language, lint, `setDiagnostics`), `src/app/diagnostics.ts` (buttons call `revealLine`), `src/app/tokens.css` (highlight colours for both schemes, each at least 4.5:1 against the editor background)
- Test: `src/app/mermaid-lang.test.ts`, `tests/e2e/edit.spec.ts`

**Interfaces:**
- Produces:

```ts
export type TokenType = 'keyword' | 'operator' | 'string' | 'comment' | 'bracket' | 'id' | 'property';
export interface Token { from: number; to: number; type: TokenType }
export function tokenizeLine(line: string): Token[];           // pure; whitespace is not a token
export const mermaidLanguage: StreamLanguage<unknown>;          // adapter over tokenizeLine
export function toCmDiagnostics(doc: Text, diags: Diagnostic[]): CmDiagnostic[]; // whole line; severities map 1:1
// CodeEditor gains: setDiagnostics(d: Diagnostic[]): void
```

  Keywords: `flowchart graph subgraph end direction classDef class style linkStyle click accTitle accDescr TB TD BT RL LR default`. Operators: every Part 4 edge operator, `&` and `:::`. Strings: bracketed label text and `|pipe labels|` (pipes included). Comments: `%%` to the end of the line. Property: the text after a style id in `classDef`, `style` and `linkStyle`, and the body of `@{ }`.

- [ ] **Step 1: Write the failing tests**

```ts
const types = (l: string) => tokenizeLine(l).map(t => t.type);
it('tokenizes', () => {
  expect(tokenizeLine('flowchart TD')).toEqual([{ from: 0, to: 9, type: 'keyword' }, { from: 10, to: 12, type: 'keyword' }]);
  expect(tokenizeLine('%% note')).toEqual([{ from: 0, to: 7, type: 'comment' }]);
  expect(types('A[Start] --> B')).toEqual(['id', 'bracket', 'string', 'bracket', 'operator', 'id']);
  expect(types('A -->|yes| B')).toEqual(['id', 'operator', 'string', 'id']);
  expect(types('classDef hot fill:#f00')).toEqual(['keyword', 'id', 'property']);
});
it('maps diagnostics to whole lines', () => {
  expect(toCmDiagnostics(Text.of(['a', 'bb']), [{ line: 2, severity: 'warning', message: 'm' }]))
    .toEqual([{ from: 2, to: 4, severity: 'warning', message: 'm' }]);
});
```

e2e: break line 3; a `.cm-lint-marker-error` appears in the gutter beside line 3. Tab to the first diagnostic button and press Enter: the caret is on line 3.
- [ ] **Step 2: Run** `npm test && npm run test:e2e -- edit.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block. `ui.ts` calls `setDiagnostics` wherever it now refreshes the diagnostics list.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS, including `axe.spec.ts`.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Mermaid highlighting and errors on their lines"
```

### Task 48: Grouped toolbar, Help dialog and resizable panels

**Files:**
- Create: `src/app/help.ts`, `src/app/splitter.ts` (+ `splitter.test.ts`)
- Modify: `index.html`, `src/app/toolbar.ts`, `src/app/shortcuts.ts` (`'help'` action on `?`; `SHORTCUT_HELP`), `src/app/storage.ts` (`Settings.split`), `src/core/constants.ts` (`UI`), `src/app/style.css`
- Test: `src/app/shortcuts.test.ts`, `src/app/storage.test.ts`, `src/app/splitter.test.ts`, `tests/e2e/chrome.spec.ts`

**Interfaces:**
- **Toolbar order:**
  - `File`: New, Open, Save .mmd, Share, Templates
  - `Edit`: Undo, Redo, shape select, Add node
  - `View`: Fit, Auto-layout, Present
  - a spacer, then `Help` (`?` icon with the name "Help"), then `Export` with class `btn-primary`

  Each group is a `<div role="group" aria-label="File">` (and so on). The `id`s of existing buttons do not change.
- **Exports:**
  - `SHORTCUT_HELP: { keys: string; action: ShortcutAction | 'pan' | 'navigate' | 'nudge'; text: string }[]`, which the Help dialog renders as a table. The dialog also shows a short syntax cheat sheet: one example per Part 4 heading.
  - `clampSplit(x: number): number`.
  - `setupSplitter(env: { handle: HTMLElement; workspace: HTMLElement; get(): number; set(v: number): void }): () => void`.
- **Splitter:** `<div id="splitter" role="separator" aria-orientation="vertical" tabindex="0" aria-valuemin="20" aria-valuemax="80" aria-valuenow="33" aria-label="Resize panels">`. Pointer drag sets the text panel's share of `#workspace`. ArrowLeft and ArrowRight change it by `UI.splitStep`. It is saved in settings and hidden under `UI.narrowBreakpoint`.

- [ ] **Step 1: Write the failing tests**

```ts
it('documents every shortcut', () => {
  const actions: ShortcutAction[] = ['undo', 'redo', 'fit', 'present', 'togglePause', 'zoomIn', 'zoomOut', 'delete', 'rename', 'escape', 'help'];
  for (const a of actions) expect(SHORTCUT_HELP.some(h => h.action === a)).toBe(true);
});
it('? opens help', () => {
  expect(shortcutFor({ key: '?', ctrl: false, meta: false, shift: true, alt: false, targetTag: 'BODY', inEditor: false })).toBe('help');
});
it('clamps the split', () => {
  expect([clampSplit(0), clampSplit(0.5), clampSplit(1)]).toEqual([0.2, 0.5, 0.8]);
});
it('loads the split from settings', () => {
  expect(loadSettings(store({ split: 3 })).split).toBe(0.8);
  expect(loadSettings(store({})).split).toBe(0.33);
});
```

e2e in `chrome.spec.ts`:
- `getByRole('group', { name: 'File' })` contains "Templates".
- Pressing `?` opens a dialog that lists "Undo".
- Dragging `#splitter` 100 px to the right widens `#text-panel`, and a reload keeps the width.
- With `#splitter` focused, ArrowRight raises `aria-valuenow` by 5.
- [ ] **Step 2: Run** `npm test && npm run test:e2e -- chrome.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block. Generate the README shortcut table from `SHORTCUT_HELP` by hand in Task 52, not by a script.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS, including `axe.spec.ts`.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: grouped toolbar, help and resizable panels"
```

### Task 49: Clearer parallel arrows and labels

**Files:**
- Modify: `src/core/constants.ts` (`LAYOUT.parallelOffset: 28`, `parallelEndShare: 0.5`, `edgeLabelRadius: 6`), `src/layout/geometry.ts`, `src/render/draw-edges.ts`, `src/render/svg.ts`
- Test: `src/layout/geometry.test.ts`, `src/render/svg.test.ts`, `src/render/draw.test.ts`

**Interfaces:**
- `routeEdges`, for groups of more than one edge between the same pair:
  - Keep the canonical-pair normal and the per-edge offset `(i - (n - 1) / 2) * parallelOffset`.
  - Aim each end at the other node's centre shifted by `normal * offset * parallelEndShare`, then clip with `borderPoint`, so the arrowheads no longer meet at one point.
- Edge labels sit on a rounded rectangle (radius `edgeLabelRadius`) filled with `theme.edgeLabelBg` and stroked with `theme.edge` at 30% alpha, on canvas and in SVG.

- [ ] **Step 1: Write the failing tests**

```ts
it('separates opposite arrows', () => {
  const s = sceneOf('flowchart LR\nA --> B\nB --> A');
  const [e0, e1] = [s.layout.edges.e0, s.layout.edges.e1];
  expect(dist(pointOnPath(e0, 0.5), pointOnPath(e1, 0.5))).toBeGreaterThanOrEqual(LAYOUT.parallelOffset - 0.5);
  expect(dist(e0.from, e1.to)).toBeGreaterThanOrEqual(10);   // both ends on A, no longer the same point
});
it('draws label pills', () => {
  expect(svgOf('flowchart LR\nA -->|yes| B')).toMatch(/<rect[^>]*rx="6"/);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block. Hit-testing uses the new paths automatically.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e -- drag.spec.ts edit.spec.ts`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: clearer parallel arrows and labels"
```

### Task 50: Select, move and connect with the keyboard

**Files:**
- Create: `src/editor/keyboard-nav.ts` (+ `keyboard-nav.test.ts`), `tests/e2e/keyboard.spec.ts`
- Modify: `src/app/describe.ts` (`announceSelection`), `src/app/canvas-events.ts` (keydown on the focused canvas), `src/app/properties.ts` ("Connect to"), `src/core/constants.ts` (`KEYBOARD`), `index.html` (`tabindex="0"` on the canvas; `<div id="canvas-status" class="visually-hidden" aria-live="polite">`; `<label for="prop-connect">Connect to</label><select id="prop-connect">` and `<button id="prop-connect-go">Connect</button>`), `src/app/shortcuts.ts` (`SHORTCUT_HELP` rows for the canvas keys)

**Interfaces:**
- Produces:

```ts
export type Dir = 'up' | 'down' | 'left' | 'right';
export function nextNodeInDirection(layout: SceneLayout, order: string[], fromId: string | null, dir: Dir): string | null;
export function edgeCycle(doc: ParsedDoc, nodeId: string, current: number | null, step: 1 | -1): number | null;
export function announceSelection(doc: ParsedDoc, sel: Selection | null): string;
```

- **`nextNodeInDirection`:**
  1. If `fromId` is null, return `order[0] ?? null`.
  2. Candidates are nodes whose offset `v` from the current centre lies in the direction's 90° cone. For `right`: `v.x > 0` and `|v.y| <= v.x`.
  3. Score = distance along the direction + 2 × perpendicular distance. The lowest score wins; ties go to the earlier entry in `order`.
  4. With no candidate, return `fromId`.
- **`edgeCycle`:** visible edges touching the node, sorted by index. It steps from `current`, wrapping around, and returns `null` when there are none.
- **`announceSelection`:**
  - Node: `Node A, Start, Rectangle. 0 in, 1 out.`
  - Edge: `Arrow from B to C, yes.` (without `, yes` when there is no label)
  - Group: `Group Title.`
  - Nothing: `No selection.`
- **Canvas keys** (canvas focused, no inline edit open):
  - Arrows select nodes.
  - `]` and `[` select the next or previous arrow of the selected node.
  - Shift+Arrow moves the selected node `KEYBOARD.nudge` world units, through a `setPin` op; consecutive nudges within 1 s are one undo step.
  - Enter renames, Delete deletes, Escape clears.
- **Connect to:** a node selection fills `#prop-connect` with every other node id. `#prop-connect-go` applies `{ type: 'addEdge', from, to }`.

- [ ] **Step 1: Write the failing unit tests**

```ts
// 3x3 grid, ids r{row}c{col}, centres at (col*100, row*100), order row-major
it('moves in a direction', () => {
  expect(nextNodeInDirection(grid, order, 'r1c1', 'right')).toBe('r1c2');
  expect(nextNodeInDirection(grid, order, 'r2c0', 'up')).toBe('r1c0');
  expect(nextNodeInDirection(grid, order, null, 'down')).toBe('r0c0');
  expect(nextNodeInDirection(grid, order, 'r0c2', 'right')).toBe('r0c2');
});
it('announces', () => {
  const d = parseMermaid('flowchart TD\nA[Start] --> B\nB -->|yes| C');
  expect(announceSelection(d, { kind: 'node', id: 'A' })).toBe('Node A, Start, Rectangle. 0 in, 1 out.');
  expect(announceSelection(d, { kind: 'edge', id: 'e1' })).toBe('Arrow from B to C, yes.');
  expect(announceSelection(d, null)).toBe('No selection.');
});
it('cycles arrows', () => {
  const d = parseMermaid('flowchart TD\nA --> B\nB --> C\nC --> A');
  expect(edgeCycle(d, 'B', null, 1)).toBe(0);
  expect(edgeCycle(d, 'B', 1, 1)).toBe(0);
});
```

- [ ] **Step 2: Write the failing e2e tests** in `keyboard.spec.ts`. Load the approval template, focus `#canvas`, then check each step:
  1. ArrowDown: `#canvas-status` reads `Node A, Start, Rectangle. 0 in, 1 out.`
  2. ArrowDown: node B is selected.
  3. Shift+ArrowRight: the text gains a `%% studio:pos B` line.
  4. Enter: `#inline-edit` is visible. Escape closes it.
  5. `]`: an arrow is selected.
  6. Escape, then select B with ArrowDown. Choose `E` in `#prop-connect` and activate `#prop-connect-go`: the text has a new `B --> E` line.
- [ ] **Step 3: Run** `npm test && npm run test:e2e -- keyboard.spec.ts`. Expected: FAIL.
- [ ] **Step 4: Implement** per the Interfaces block.
- [ ] **Step 5: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS, including `axe.spec.ts`.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: select, move and connect with the keyboard"
```

### Task 51: Copy PNG and SVG to the clipboard

**Files:**
- Create: `src/app/clipboard.ts` (+ `clipboard.test.ts`)
- Modify: `index.html` (export dialog: `<button id="export-copy-png">Copy PNG</button>` and `<button id="export-copy-svg">Copy SVG</button>`), `src/app/export-panel.ts`, `src/core/constants.ts` (`MESSAGES.copied`, `MESSAGES.copyUnsupported`)

**Interfaces:**
- Produces:

```ts
export interface ClipboardDeps { clipboard?: Pick<Clipboard, 'write' | 'writeText'>; makeItem?: (items: Record<string, Promise<Blob>>) => ClipboardItem }
export function copyImage(png: Promise<Blob>, deps: ClipboardDeps): Promise<'ok' | 'unsupported' | 'denied'>;
export function copyText(text: string, deps: ClipboardDeps): Promise<'ok' | 'denied'>;
```

  `copyImage` passes the Promise (not the Blob) to `ClipboardItem`, so Safari keeps the user gesture. With no `clipboard.write` or `makeItem`, it returns `'unsupported'`; a rejection returns `'denied'`. The panel shows `MESSAGES.copied` or `MESSAGES.copyUnsupported`.

- [ ] **Step 1: Write the failing tests**

```ts
it('reports missing support', async () => { expect(await copyImage(Promise.resolve(new Blob()), {})).toBe('unsupported'); });
it('reports a refusal', async () => {
  const deps = { clipboard: { write: () => Promise.reject(new Error('no')), writeText: async () => {} }, makeItem: (x: object) => x as unknown as ClipboardItem };
  expect(await copyImage(Promise.resolve(new Blob()), deps)).toBe('denied');
});
it('copies text', async () => {
  let got = ''; const deps = { clipboard: { write: async () => {}, writeText: async (t: string) => { got = t; } } };
  expect(await copyText('<svg/>', deps)).toBe('ok'); expect(got).toBe('<svg/>');
});
```

e2e in `export-svg.spec.ts`, Chromium only: grant `clipboard-read` and `clipboard-write`, click Copy SVG; `navigator.clipboard.readText()` starts with `<svg` and `#export-message` shows `MESSAGES.copied`.
- [ ] **Step 2: Run** `npm test && npm run test:e2e -- export-svg.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: copy PNG and SVG to the clipboard"
```

### Task 52: Release v0.4.0

- [ ] **Step 1: Update the README:**
  - the editor
  - the toolbar groups and Help
  - the shortcut table, copied from `SHORTCUT_HELP`
  - keyboard editing on the canvas
  - copy to clipboard
  - the new initial JS size
- [ ] **Step 2: Run the humanizer** on `README.md`, then restore commands, numbers and code blocks.
- [ ] **Step 3: Add the v0.4.0 section** from Part 7 and tick what commands can check (Part 0, rule 2). Set `package.json` to `0.4.0`.
- [ ] **Step 4: Run** the full command list. Expected: PASS.
- [ ] **Step 5: Commit and tag**

```bash
git add -A && git commit -m "chore: release v0.4.0" && git tag v0.4.0
```

## Milestone M4: v0.5.0 Offline PWA and discoverability

### Task 53: Installable app with `.mmd` file handling

**Files:**
- Create: `public/manifest.webmanifest`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/icons/icon-maskable-512.png`, `src/app/file-launch.ts`
- Modify: `scripts/make-icons.mjs` (also writes the three icons; the maskable one has the logo at 60% of the canvas on `#f5f5fa`), `index.html` (`<link rel="manifest" href="%BASE_URL%manifest.webmanifest" />`), `src/app/ui.ts`, `scripts/check-dist.mjs`, `src/repo.test.ts`

**Interfaces:**
- `public/manifest.webmanifest`, exactly:

```json
{
  "name": "Gati-chitra",
  "short_name": "Gati-chitra",
  "description": "Draw, drag and animate Mermaid flowcharts, then save them as PNG, SVG, GIF or video. Everything runs in your browser.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#f5f5fa",
  "theme_color": "#f5f5fa",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "file_handlers": [{ "action": "./", "accept": { "text/plain": [".mmd"] } }]
}
```

  Relative URLs resolve against the manifest's own URL, so the file works under any base path. `name` must equal `BRAND.name`.
- `setupFileLaunch(env: { open(text: string, name: string): void }): void`. When `'launchQueue' in window`, it reads the first file and calls `open(stripFences(text), file.name)`, which commits with source `'open'`.

- [ ] **Step 1: Write the failing tests.**
  - In `src/repo.test.ts`: parse `public/manifest.webmanifest`. `name` equals `BRAND.name`; `start_url` and `scope` equal `./`; each icon file exists and its PNG header (bytes 16 to 23) gives the stated size.
  - In `check-dist.mjs`: `dist/manifest.webmanifest` and the three icons exist, and `dist/index.html` has `<link rel="manifest" href="${base}manifest.webmanifest"`.
- [ ] **Step 2: Run** `npm test && npm run build && npm run check:dist`. Expected: FAIL.
- [ ] **Step 3: Implement.** Run `npm run icons` and commit the generated PNGs (they are site assets, not build output).
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run check:dist && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: installable app with .mmd file handling"
```

### Task 54: Offline use and the update notice

**Files:**
- Create: `src/sw/sw.ts`, `src/sw/sw-logic.ts` (+ `sw-logic.test.ts`), `tsconfig.sw.json` (`lib: ["ES2022", "WebWorker"]`, `include: ["src/sw"]`), `scripts/vite-plugins.ts`, `src/app/sw-register.ts` (+ `sw-register.test.ts`), `tests/e2e/offline.spec.ts`
- Modify: `tsconfig.json` (exclude `src/sw`), `package.json` (`build`: `tsc --noEmit && tsc --noEmit -p tsconfig.sw.json && vite build`), `vite.config.ts` (`plugins: [swPlugin()]`), `src/app/ui.ts`, `src/app/message.ts` (`MESSAGES.updateReady` and `offlineReady`), `scripts/check-dist.mjs`

**Interfaces:**
- Produces:

```ts
// src/sw/sw-logic.ts
export function cacheName(buildId: string): string;                  // `gati-chitra-${buildId}`
export function precacheUrls(files: string[], base: string): string[]; // base, then base + each file; drops 'sw.js' and '*.map'
export function strategyFor(url: URL, scope: URL): 'network-first' | 'cache-first' | 'bypass';
// src/app/sw-register.ts
export interface SwDeps {
  container: Pick<ServiceWorkerContainer, 'register' | 'addEventListener' | 'controller'> | undefined;
  prod: boolean; enabled: boolean;   // enabled: false for ?e2e unless ?sw=1
  base: string; reload(): void;
  showUpdate(onReload: () => void): void; showOfflineReady(): void;
}
export function registerServiceWorker(deps: SwDeps): Promise<void>;
// scripts/vite-plugins.ts
export function swPlugin(): Plugin;
```

- **`strategyFor`:**
  - `bypass` for another origin, or for a path outside `scope`.
  - `network-first` when the path ends in `/` or `.html`.
  - `cache-first` otherwise.
- **`sw.ts`:**
  - Install caches `self.__PRECACHE__`. It does not call `skipWaiting` on install.
  - Activate deletes other `gati-chitra-*` caches and calls `clients.claim()`.
  - Fetch follows `strategyFor`. `network-first` falls back to the cache, then to the cached `base`.
  - The message `{ type: 'skipWaiting' }` calls `self.skipWaiting()`.
- **`swPlugin`:**
  1. In `generateBundle`, list every emitted file plus every file under `public/`.
  2. Run Vite's `build()` with `{ configFile: false, logLevel: 'silent', build: { write: false, minify: true, lib: { entry: 'src/sw/sw.ts', formats: ['iife'], name: 'gcsw', fileName: () => 'sw.js' } } }`.
  3. Replace `self.__PRECACHE__` with the JSON list from `precacheUrls`, and `self.__BUILD_ID__` with the first 10 hex characters of a SHA-256 of the sorted list.
  4. Emit the result as the asset `sw.js`.
- **`registerServiceWorker`:**
  - Does nothing unless `prod && enabled && container`.
  - Registers `${base}sw.js` with scope `base`.
  - A waiting worker, or one that reaches `installed` while a controller exists, calls `showUpdate`. Its callback posts `skipWaiting`.
  - `controllerchange` calls `reload()` once.
  - The first install, with no prior controller, calls `showOfflineReady`.
- **`vite:preloadError`** in `ui.ts`: reload once, guarded by `sessionStorage['gc-reloaded']`; the second time, show `MESSAGES.videoFailed` with the error text.

- [ ] **Step 1: Write the failing unit tests**

```ts
it('names caches', () => { expect(cacheName('abc')).toBe('gati-chitra-abc'); });
it('lists precache URLs', () => {
  expect(precacheUrls(['index.html', 'assets/a.js', 'sw.js', 'assets/a.js.map'], '/gati-chitra/'))
    .toEqual(['/gati-chitra/', '/gati-chitra/index.html', '/gati-chitra/assets/a.js']);
});
it('chooses a strategy', () => {
  const scope = new URL('https://u.github.io/gati-chitra/');
  expect(strategyFor(new URL('https://u.github.io/gati-chitra/'), scope)).toBe('network-first');
  expect(strategyFor(new URL('https://u.github.io/gati-chitra/assets/a-1.js'), scope)).toBe('cache-first');
  expect(strategyFor(new URL('https://u.github.io/other/'), scope)).toBe('bypass');
  expect(strategyFor(new URL('https://cdn.example/x.js'), scope)).toBe('bypass');
});
it('offers an update when a new worker waits', async () => {
  const posted: unknown[] = []; let shown: (() => void) | null = null;
  const reg = { waiting: { postMessage: (m: unknown) => posted.push(m) }, addEventListener() {} };
  await registerServiceWorker({ ...fakeDeps({ register: async () => reg, controller: {} }), showUpdate: (cb) => { shown = cb; } });
  shown!(); expect(posted).toEqual([{ type: 'skipWaiting' }]);
});
it('stays off in dev and in e2e', async () => {
  let called = false;
  await registerServiceWorker({ ...fakeDeps({ register: async () => { called = true; return {}; } }), prod: false });
  expect(called).toBe(false);
});
```

- [ ] **Step 2: Write the failing e2e tests** in `offline.spec.ts`, Chromium only (`test.skip(browserName !== 'chromium')`):
  - "works offline after the first visit":
    1. Open `./?e2e=1&sw=1` and wait for `navigator.serviceWorker.controller`.
    2. Turn the network off with `context.setOffline(true)`, then reload.
    3. The editor shows the last text, a template loads, and Save as SVG downloads a file.
    4. Save as video either downloads a video or shows the GIF fallback, with no failed request in `page.on('requestfailed')` for `/assets/`.
  - "a missing lazy chunk reloads once": route the video chunk to 404 and click Save as video; the page reloads once, and the second failure shows a message instead of looping.
- [ ] **Step 3: Write the failing `check-dist` checks:**
  - `dist/sw.js` exists and is under 4 KB gzip.
  - It contains neither `__PRECACHE__` nor `__BUILD_ID__`.
  - Every precached URL (with `base` removed) exists in `dist`.
- [ ] **Step 4: Run** `npm test && npm run build && npm run check:dist && npm run test:e2e -- offline.spec.ts`. Expected: FAIL.
- [ ] **Step 5: Implement** per the Interfaces block. Show the update notice with `showMessage(MESSAGES.updateReady, { label: 'Reload', run })`.
- [ ] **Step 6: Run** `npm test && npm run lint && npm run build && BASE_PATH=/gati-chitra/ npm run check:dist && npm run test:e2e`. Expected: PASS.
- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: offline use and update notice"
```

### Task 55: Social image, 404 page, sitemap and structured data

**Files:**
- Create: `404.html` (repository root, next to `index.html`), `scripts/make-og.mjs`, `public/og-image.png`
- Modify:
  - `vite.config.ts`: `build.rollupOptions.input = { main: 'index.html', notFound: '404.html' }`.
  - `scripts/vite-plugins.ts`: add `siteFilesPlugin()`, which emits `sitemap.xml`.
  - `package.json`: script `"og": "node scripts/make-og.mjs"`.
  - `src/app/studio.ts`: `__studio.ogImage(): Promise<string>`, a PNG data URL of `EXPORT.ogWidth` x `EXPORT.ogHeight` in the Daylight theme.
  - `src/core/constants.ts` (`EXPORT.ogWidth`, `ogHeight`), `index.html`, `scripts/check-dist.mjs`.

**Interfaces:**
- **`index.html` meta.** Replace the current `og:image` and `twitter:card` lines with:

```html
<meta property="og:image" content="%VITE_SITE_URL%og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="An animated flowchart drawn in Gati-chitra" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="%VITE_SITE_URL%og-image.png" />
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"SoftwareApplication","name":"Gati-chitra","applicationCategory":"DesignApplication","operatingSystem":"Any (runs in a web browser)","url":"%VITE_SITE_URL%","description":"Draw, drag and animate Mermaid flowcharts, then save them as PNG, SVG, GIF or video. Everything runs in your browser.","isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"author":{"@type":"Person","name":"Ujjwal Chowdhury"}}
</script>
```

  The `<noscript>` text grows to one short paragraph that describes the tool and links to the source repository, so crawlers that skip JavaScript still get a description.
- **`404.html`:**
  - The same head as `index.html` (title "Page not found · Gati-chitra"), the logo, one sentence, and a link to `%BASE_URL%`.
  - An inline script: if `location.hash` starts with `#v1`, `location.replace('%BASE_URL%' + location.hash)`.
- **`sitemap.xml`:** one `<url>` with `<loc>${VITE_SITE_URL}</loc>` and `<lastmod>` set to the build date, `YYYY-MM-DD`.
- **No `robots.txt`:** crawlers only read it at the domain root, which this project site does not control. Record this in `DECISIONS.md`. The owner can submit `sitemap.xml` in Google Search Console.
- **`make-og.mjs`:**
  1. Expects `npm run build` to have run, and starts `vite preview` on port 4174.
  2. Opens `/?e2e=1` in Playwright Chromium and loads `public/templates/checkout.mmd` with `__studio.setText`.
  3. Writes `__studio.ogImage()` to `public/og-image.png` and stops the server.

- [ ] **Step 1: Write the failing `check-dist` checks:**
  - `dist/404.html` exists and contains `href="${base}"`.
  - `dist/sitemap.xml` contains `<loc>${VITE_SITE_URL}</loc>` when `VITE_SITE_URL` is set.
  - `dist/og-image.png`'s PNG header gives 1200x630.
  - `dist/index.html` contains `summary_large_image` and `application/ld+json`, and no `%VITE_` placeholder (the existing check).
- [ ] **Step 2: Run** `npm run build && npm run check:dist`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block. Run `npm run build && npm run og`, look at `public/og-image.png`, and commit it.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && BASE_PATH=/gati-chitra/ VITE_SITE_URL=https://u77w41.github.io/gati-chitra/ npm run check:dist && npm run test:e2e`. Expected: PASS.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: social image, 404 page, sitemap and structured data"
```

### Task 56: Release v0.5.0

- [ ] **Step 1: Update the README:**
  - installing the app
  - offline use
  - how updates arrive
  - opening `.mmd` files
  - a note in "Privacy" that the service worker caches only this site's own files
- [ ] **Step 2: Run the humanizer** on `README.md`, then restore commands, numbers and code blocks.
- [ ] **Step 3: Add the v0.5.0 section** from Part 7 and tick what commands can check. The offline and update checks on the deployed site are the owner's (Part 0, rule 2). Set `package.json` to `0.5.0`.
- [ ] **Step 4: Run** the full command list. Expected: PASS.
- [ ] **Step 5: Commit and tag**

```bash
git add -A && git commit -m "chore: release v0.5.0" && git tag v0.5.0
```

## Milestone M5: v0.6.0 Mobile and touch

### Task 57: Phone layout with Text and Diagram tabs

**Files:**
- Create: `src/app/narrow.ts` (+ `narrow.test.ts`), `tests/e2e/mobile.spec.ts`
- Modify:
  - `index.html`:
    - `<div id="view-tabs" role="tablist" aria-label="Panels">` with two `role="tab"` buttons, "Text" and "Diagram".
    - `role="tabpanel"` on `#text-panel` and `#canvas-panel`.
    - `<button id="btn-more" aria-expanded="false" aria-controls="more-menu">More</button>` and `<div id="more-menu" role="menu" hidden>`.
  - `src/app/toolbar.ts`, `src/app/style.css`.
  - `playwright.config.ts`: projects `mobile-chrome` (`devices['Pixel 7']`) and `mobile-safari` (`devices['iPhone 14']`), which run only `mobile.spec.ts`; the desktop projects ignore it.

**Interfaces:**
- Produces:
  - `isNarrow(width: number): boolean` (`width < UI.narrowBreakpoint`).
  - `setupNarrowLayout(env: { tabs: HTMLElement; textPanel: HTMLElement; canvasPanel: HTMLElement; onShowDiagram(): void }): () => void`, driven by `matchMedia('(max-width: 767px)')`.
- **Narrow layout:**
  - The tabs show and Diagram is selected first.
  - ArrowLeft and ArrowRight move between tabs; showing Diagram calls `onShowDiagram` (Fit).
  - The File and View groups move into `#more-menu`; Undo, Redo, Add node and Export stay in the bar.
  - `#more-menu` opens on click, Enter or Space. Arrow keys move inside it, and Escape closes it and returns focus to `#btn-more`.
- At 768 px and wider, nothing changes from v0.4.

- [ ] **Step 1: Write the failing tests**

```ts
it('uses the breakpoint', () => { expect([isNarrow(767), isNarrow(768)]).toEqual([true, false]); });
```

`mobile.spec.ts` (both phone projects):
- the tabs are visible, and the Diagram tab is selected
- tapping Text shows the editor and hides the canvas
- `document.scrollingElement.scrollWidth <= innerWidth`
- the toolbar's height is 100 px or less
- More opens a menu that contains "Templates"
- `axe` on this layout finds no violations
- [ ] **Step 2: Run** `npm test && npm run test:e2e -- --project=mobile-chrome --project=mobile-safari`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS in all five projects.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: phone layout with Text and Diagram tabs"
```

### Task 58: Touch gestures for move, pan, pinch and long press

**Files:**
- Create: `src/editor/gestures.ts` (+ `gestures.test.ts`), `src/app/touch-wiring.ts`
- Modify: `src/core/constants.ts` (`TOUCH`), `src/app/canvas-events.ts` (pointers with `pointerType === 'touch'` go to `touch-wiring.ts`; mouse and pen keep the v0.1 path), `src/layout/geometry.ts` (`hitTest(scene, p, handleNodeId, tolerance = LAYOUT.hitTolerance)`), `src/app/style.css`, `tests/support/scene.ts` (add `offsetFromEdgeMid(scene: Scene, edgeId: string, d: number): Point`: the point at `u = 0.5` on the edge, moved `d` world units along its normal)
- Test: `src/editor/gestures.test.ts`, `src/layout/geometry.test.ts`, `tests/e2e/mobile.spec.ts`

**Interfaces:**
- Produces:

```ts
export type PointerSample = { kind: 'down' | 'move' | 'up' | 'cancel'; id: number; x: number; y: number; t: number };
export type GestureInput = PointerSample | { kind: 'tick'; t: number };
export type GestureEvent =
  | { type: 'tap'; at: Point } | { type: 'doubleTap'; at: Point } | { type: 'longPress'; at: Point }
  | { type: 'dragStart'; at: Point } | { type: 'dragMove'; at: Point } | { type: 'dragEnd'; at: Point } | { type: 'dragCancel' }
  | { type: 'pinch'; center: Point; scale: number; dx: number; dy: number } | { type: 'pinchEnd' };
export interface GestureState { readonly _brand: 'GestureState' }   // fields private to gestures.ts
export function createGestureState(): GestureState;
export function gestureStep(s: GestureState, input: GestureInput): { state: GestureState; events: GestureEvent[] };
```

- **Rules for `gestureStep`:**
  1. **One pointer down** is pending.
     - When it moves more than `TOUCH.slop`, emit `dragStart` at the down point and `dragMove` at the current point in the same step. Later moves emit `dragMove`; up emits `dragEnd`.
     - When it lifts before that, it is a `tap`.
     - A second tap within `TOUCH.doubleTapMs` and `TOUCH.slop` of the first emits `doubleTap` instead of `tap`.
  2. **A `tick`** at least `TOUCH.longPressMs` after the down, while still pending, emits `longPress`. After that the touch emits nothing more until it lifts.
  3. **A second pointer down** emits `dragCancel` if a drag had started, then enters pinch mode. Each move emits `pinch`: `scale` is the current distance divided by the previous distance, `center` is the current midpoint, and `dx`/`dy` are the midpoint's movement since the previous step.
  4. **In pinch mode,** the first pointer up emits `pinchEnd`. The remaining pointer emits nothing until it lifts.
  5. **`cancel`** resets everything and emits `dragCancel` if a drag had started.
- **`touch-wiring.ts`** maps the events:
  - `tap`: select (as a click).
  - `dragStart` on a node or its handle: the controller's pointer down, then pointer moves. `dragStart` on empty space: pan with `panBy`.
  - `dragCancel`: the controller's `cancelEdit` and a revert of the uncommitted drag.
  - `pinch`: `zoomAt(center, scale)` and `panBy(dx, dy)`.
  - `longPress` on a node or edge: select it and show the properties panel.
  - `doubleTap`: add a node on empty space; rename on a node.
- Touch hit-tests use `TOUCH.hitTolerance` and the handle radius `TOUCH.handleRadius`. A `setInterval` of 100 ms sends `tick`s while a pointer is down.

- [ ] **Step 1: Write the failing unit tests**

```ts
const down = (id: number, x: number, y: number, t: number) => ({ kind: 'down', id, x, y, t }) as const;
const move = (id: number, x: number, y: number, t: number) => ({ kind: 'move', id, x, y, t }) as const;
const up = (id: number, x: number, y: number, t: number) => ({ kind: 'up', id, x, y, t }) as const;
const tick = (t: number) => ({ kind: 'tick', t }) as const;
const run = (inputs: GestureInput[]) => {
  let s = createGestureState(); const out: GestureEvent[] = [];
  for (const i of inputs) { const r = gestureStep(s, i); s = r.state; out.push(...r.events); }
  return out;
};
const types = (inputs: GestureInput[]) => run(inputs).map(e => e.type);
it('taps and double taps', () => {
  expect(run([down(1, 0, 0, 0), up(1, 0, 0, 100)])).toEqual([{ type: 'tap', at: { x: 0, y: 0 } }]);
  expect(types([down(1, 0, 0, 0), up(1, 0, 0, 80), down(1, 2, 2, 200), up(1, 2, 2, 260)])).toEqual(['tap', 'doubleTap']);
});
it('long press does not drag', () => {
  expect(types([down(1, 0, 0, 0), tick(600), move(1, 30, 0, 700), up(1, 30, 0, 800)])).toEqual(['longPress']);
});
it('drags past the slop', () => {
  expect(types([down(1, 0, 0, 0), move(1, 20, 0, 50), move(1, 40, 0, 80), up(1, 40, 0, 100)]))
    .toEqual(['dragStart', 'dragMove', 'dragMove', 'dragEnd']);
});
it('a second finger cancels the drag and pinches', () => {
  expect(types([down(1, 0, 0, 0), move(1, 20, 0, 50), down(2, 100, 0, 60), move(2, 120, 0, 80)]))
    .toEqual(['dragStart', 'dragMove', 'dragCancel', 'pinch']);
});
it('pinch reports scale, centre and movement', () => {
  expect(run([down(1, 0, 0, 0), down(2, 100, 0, 10), move(2, 200, 0, 20)]).at(-1))
    .toEqual({ type: 'pinch', center: { x: 100, y: 0 }, scale: 2, dx: 50, dy: 0 });
});
it('lifting one finger ends the pinch without a jump', () => {
  expect(types([down(1, 0, 0, 0), down(2, 100, 0, 10), up(2, 100, 0, 20), move(1, 50, 0, 30), up(1, 50, 0, 40)])).toEqual(['pinchEnd']);
});
it('touch hit-testing is more forgiving', () => {
  const s = sceneOf('flowchart LR\nA --> B');
  const nearEdge = offsetFromEdgeMid(s, 'e0', 10);    // 10 world units off the arrow
  expect(hitTest(s, nearEdge, null)).toBeNull();
  expect(hitTest(s, nearEdge, null, TOUCH.hitTolerance)).toMatchObject({ kind: 'edge' });
});
```

(Read `Hit` in `geometry.ts` for the exact shape of an edge hit and match it.)
- [ ] **Step 2: Write the failing e2e tests** in `mobile.spec.ts`.

  In `mobile-chrome`, send multi-touch with CDP `Input.dispatchTouchEvent`:
  - spreading two fingers raises `__studio.getView().zoom`
  - one finger dragging node A adds a `studio:pos A` line
  - one finger dragging empty space changes `panX` and leaves the text unchanged
  - a 600 ms press on A shows `#props`
  - a double tap on empty space adds a node

  In `mobile-safari`, use `page.touchscreen.tap` on A: A is selected.
- [ ] **Step 3: Run** `npm test && npm run test:e2e -- --project=mobile-chrome --project=mobile-safari`. Expected: FAIL.
- [ ] **Step 4: Implement** per the Interfaces block.
- [ ] **Step 5: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS in all five projects; the desktop drag and edit specs are unchanged.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: touch gestures for move, pan, pinch and long press"
```

### Task 59: Properties sheet and sharing exports on phones

**Files:**
- Create: `src/app/share-file.ts` (+ `share-file.test.ts`)
- Modify: `index.html` (`<button id="props-close" aria-label="Close properties">`), `src/app/properties.ts`, `src/app/export-panel.ts`, `src/app/style.css`

**Interfaces:**
- Produces:

```ts
export function canShareFile(file: File, nav: Pick<Navigator, 'canShare'> | undefined): boolean;
export function shareFile(file: File, nav: Pick<Navigator, 'share'> | undefined): Promise<'shared' | 'cancelled' | 'unsupported'>;
```

  An `AbortError` from `navigator.share` is `'cancelled'`; any other error is `'unsupported'`.
- **On narrow screens** where `canShareFile` is true, the four Save buttons pass their file to `shareFile` instead of downloading. `'cancelled'` shows nothing, and `'unsupported'` falls back to a download. Wide screens behave as before.
- **Narrow screens:** `#props` is a bottom sheet: fixed to the bottom, full width, `max-height: 50vh`, scrolling, with `#props-close`. Opening it moves focus to its first field; closing it returns focus to the canvas.

- [ ] **Step 1: Write the failing tests**

```ts
it('checks file sharing', () => {
  const f = new File(['x'], 'd.png', { type: 'image/png' });
  expect(canShareFile(f, undefined)).toBe(false);
  expect(canShareFile(f, { canShare: () => true })).toBe(true);
});
it('maps share results', async () => {
  const f = new File(['x'], 'd.png');
  expect(await shareFile(f, { share: async () => {} })).toBe('shared');
  expect(await shareFile(f, { share: () => Promise.reject(new DOMException('x', 'AbortError')) })).toBe('cancelled');
  expect(await shareFile(f, { share: () => Promise.reject(new DOMException('x', 'NotAllowedError')) })).toBe('unsupported');
});
```

`mobile.spec.ts`:
- A long press on A opens `#props`, whose box spans the viewport width and touches its bottom edge. `#props-close` closes it.
- In `mobile-chrome`, an init script replaces `navigator.share` and `navigator.canShare` with recorders. Save as PNG then records one call with a file named `diagram.png`.
- [ ] **Step 2: Run** `npm test && npm run test:e2e -- --project=mobile-chrome`. Expected: FAIL.
- [ ] **Step 3: Implement** per the Interfaces block.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run build && npm run test:e2e`. Expected: PASS in all five projects.
- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: properties sheet and shared exports on phones"
```

### Task 60: Release v0.6.0

- [ ] **Step 1: Update the README.**
  - Add a "Phones and tablets" section: tabs, More, the gestures table and sharing exports.
  - Remove touch editing from "Known limitations".
  - In the v0.1 plan's "Not in scope" line, nothing changes (that plan is history); record in `DECISIONS.md` that touch editing is now in scope.
- [ ] **Step 2: Run the humanizer** on `README.md`, then restore commands, numbers and code blocks.
- [ ] **Step 3: Add the v0.6.0 section** from Part 7 and tick what commands can check. The real-device checks are the owner's (Part 0, rule 2). Set `package.json` to `0.6.0`.
- [ ] **Step 4: Run** the full command list. Expected: PASS in all five Playwright projects.
- [ ] **Step 5: Commit and tag**

```bash
git add -A && git commit -m "chore: release v0.6.0" && git tag v0.6.0
```

## Part 7. Release checklists

Each release task appends its section to `RELEASE_CHECKLIST.md`. The implementer ticks the "Automated" box and any box it can check by running a command. It leaves boxes marked "By hand", "On a real", "deployed site", "Optional, by the owner" or "Paste" unticked, and lists them in its final message (Part 0, rule 2). "Automated" means from a clean checkout: `npm ci`, `npm run lint`, `npm test`, `npm run build`, `BASE_PATH=/gati-chitra/ npm run check:dist` (after building with that base), and `BASE_PATH=/gati-chitra/ npm run test:e2e`.

### v0.2.0

- [ ] Automated, in Chromium, Firefox and WebKit.
- [ ] `check:dist` reports initial JS of 150 KB gzip or less, and a largest lazy chunk of 80 KB gzip or less. Both numbers are in `DECISIONS.md`.
- [ ] By hand: `subgraph X` nested inside `subgraph X` shows a warning, and editing continues.
- [ ] By hand: Tab to every toolbar button and footer link and press Enter; each one acts.
- [ ] By hand: open a share link over an existing diagram, then press Ctrl+Z; your diagram is back.
- [ ] By hand: with two tabs open, an edit in one appears in the other.
- [ ] By hand: a paused, idle tab uses close to no CPU (browser task manager).
- [ ] The first workflow run on `main` deploys, and the site works under `/gati-chitra/`.

### v0.3.0

- [ ] Automated.
- [ ] Paste five flowcharts you use from GitHub READMEs or docs. Each draws with no warning, or the warning is about something under "Not supported".
- [ ] All 10 new shapes and 5 new arrow kinds look right in all four themes, on canvas, in PNG and in SVG.
- [ ] Bold and italic labels show on canvas and in PNG, SVG and GIF.
- [ ] An SVG with `click` links opens in a browser; the links work, and `_blank` opens a new tab.
- [ ] `direction LR` inside a TB chart lays out sideways; with an arrow to the outside, the info note appears.
- [ ] The README syntax list matches what the parser reads.

### v0.4.0

- [ ] Automated, including `axe.spec.ts`.
- [ ] Keyboard only: build a three-node diagram with two arrows, rename one node, nudge one, and save a PNG, without touching the mouse.
- [ ] VoiceOver (macOS) or NVDA (Windows): toolbar groups, the editor, the canvas selection announcements and the diagnostics are all read.
- [ ] Type, drag, rename, then press Ctrl+Z three times, alternating between the editor and the page; each step restores the exact earlier text.
- [ ] Copy PNG pastes into a document or slide app; Copy SVG pastes as text.
- [ ] The panel split is remembered after a reload.

### v0.5.0

- [ ] Automated, including `offline.spec.ts`.
- [ ] In Chrome or Edge on the deployed site, the install option appears. The installed app opens in its own window, and opening a `.mmd` file with it loads the file.
- [ ] Load the deployed site once, go offline and reload. Editing and saving PNG, SVG, GIF and video still work.
- [ ] Deploy a change while a tab is open. "A new version is available" appears, and Reload brings in the new version.
- [ ] Paste the site URL into a messaging app; the 1200x630 card shows.
- [ ] `https://u77w41.github.io/gati-chitra/does-not-exist` shows the 404 page with a working link back.
- [ ] Optional, by the owner: check the JSON-LD with Google's Rich Results Test, and submit `sitemap.xml` in Google Search Console.

### v0.6.0

- [ ] Automated, in all five Playwright projects.
- [ ] On a real Android phone (Chrome) and a real iPhone (Safari):
  - [ ] tabs and the More menu
  - [ ] move a node, pan, pinch zoom
  - [ ] long press opens the sheet
  - [ ] double tap adds a node
  - [ ] rename with the on-screen keyboard
  - [ ] Save as PNG opens the share sheet
- [ ] Rotating the phone keeps the layout usable, with no sideways scrolling.
- [ ] On desktop, quickly repeat the v0.4.0 keyboard and mouse checks; nothing has changed there.

## Part 8. Troubleshooting

- **CodeMirror in tests:** use the helpers in `tests/support/editor.ts`. Use `setEditorText` when a test is not about typing; it is faster and the same in every browser.
- **The service worker is not running:** it never registers in `npm run dev` or with `?e2e` unless `?sw=1` is set. Use `npm run build && npm run preview` and open `?sw=1`. To clear a stuck worker: DevTools, Application, Service workers, Unregister.
- **The nested service worker build picks up the root config:** pass `configFile: false` (Task 54 does).
- **dagre throws on an arrow to a subgraph:** the arrow must go to a member node in dagre (Task 42), never to the group id.
- **Firefox or WebKit has no video encoder:** the test must expect the GIF fallback, not skip.
- **A file passes 300 lines:** split it by responsibility before committing (v0.1 Part 0, rule 8), and note the split in `DECISIONS.md`.
