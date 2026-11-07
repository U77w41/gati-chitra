
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

## 2. Current State (v0.13.0)

- **Current plan**: `plan.md` (Tasks 64 to 103). All milestones D1 (Tasks 64 to 74), D2 (Tasks 75 to 81), D3 (Tasks 82 to 88), D4 (Tasks 89 to 94), and D5 (Tasks 95 to 103) are complete!
- **Last verified**: 2026-11-06, locally.
- **Branch**: `main`, level with `origin/main` at `b71adbd` on 2026-11-06 (the owner pushed the D1 to D5 commits). The workspace layout fix (section 2h), the minimal skin (section 2i), the footer removal (section 2j), the corner controls (section 2k), the tab icon (section 2l), the canvas icon buttons (section 2m), the editor tabs (section 2o, which replaces the add-node menu of section 2n), the label editor (section 2p), the header auto-hide (section 2q), the Templates icon (section 2r), the Share and Export icons (section 2s), the toolbar removal (section 2t), the phone tab names (section 2u) and the minimal header, hover labels, switches and zoom (section 2v) are uncommitted. Never push without an explicit user request.
- **Release commit**: `chore: release v0.13.0` (tag `v0.13.0`).
- **Plans**:
  - `docs/superpowers/plans/2026-11-02-gati-chitra.md` (v0.1, Tasks 0 to 23): all task boxes ticked.
  - `docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md` (v0.2 to v0.6, Tasks 24 to 60): all 196 task step boxes ticked.
  - `plan.md` (Tasks 64 to 103): Milestones D1 through D5 complete; all automated boxes ticked in Part 10.
- **Checks run on 2026-11-06 (v0.13.0 release)**:
  - `npm test`: 609 tests passing across 112 files.
  - `npm run lint`: 0 warnings, 0 errors across 307 files.
  - `BASE_PATH=/gati-chitra/ npm run build`: passes, including service worker TypeScript config.
  - `BASE_PATH=/gati-chitra/ npm run check:dist`: initial JS 131.35 KB gzip (limit 150 KB); largest lazy chunk 57.27 KB gzip (limit 80 KB); block (3.89 KB), mindmap (2.97 KB), journey (2.42 KB), timeline (2.73 KB); `OK`.
  - `npm run test:e2e`: 386 passed, 17 skipped across `chromium`, `firefox`, `webkit`, `mobile-chrome` and `mobile-safari`. 0 failed.

---

## 2x. Latest Session, Part 17 (2026-11-07): Rounded Segmented Toggle in #text-panel-bar with Active Option Text

**Status: uncommitted**, running locally on `http://localhost:5173/` for owner's manual verification.

**Request:** in `#text-panel-bar`, add a similar toggle to the theme switcher, but when an option is selected, show its text as well as its icon.

**What changed:**
- `src/app/style.css`: styled `#editor-tabs` as a rounded segmented pill toggle (`background: var(--card-background-muted); border: 1px solid var(--border); border-radius: 16px; height: 32px; padding: 2px`).
- Active tab (`aria-selected="true"`): shows both its SVG icon and its text label ("Script" or "Nodes") with an active pill background (`background: var(--card-background); box-shadow: var(--shadow-l1); color: var(--text-main); font-weight: 600; border-radius: 13px`).
- Inactive tab (`aria-selected="false"`): collapses down to show only its icon (`color: var(--text-muted); opacity: 0.75`), expanding to show text on hover or focus.
- `src/app/editor-tabs.ts`: added optional `rootDoc` dependency injection parameter for unit testing.
- `src/app/editor-tabs.test.ts` (new): unit tests verifying tab switching between script and nodes panes.
- `tests/e2e/layout.spec.ts`: updated e2e tests to verify that the active tab displays its text while the inactive tab hides its text.
- `DECISIONS.md`: added entry #108.

**Checks on 2026-11-07:**
- `npm test`: 630 passed across 118 test files (1 new unit test file).
- `npm run build`: cleanly built in 223ms.
- `npm run check:dist`: initial JS 133.17 KB gzip, `OK`.
- `npx playwright test tests/e2e/layout.spec.ts`: 90 passed across Chromium, Firefox, WebKit.
- `npm run dev`: running locally at `http://localhost:5173/`.

---

## 2w. Latest Session, Part 16 (2026-11-07): Rounded Checkbox Glide Toggle with Sun and Moon Icons (Icon-Only)

**Status: uncommitted**, running locally on `http://localhost:5173/` for owner's manual verification.

**Request:** replace the light/dark mode icon button with a rounded button checkbox glide toggle (`switcher-1` style with sliding label, smooth CSS transitions), showing only the Sun and Moon icons (no text labels).

**What changed:**
- `src/app/chrome.ts`: `headerHtml()` generates `<span class="switcher switcher-1"><input type="checkbox" id="theme-toggle" aria-label="Switch between light and dark colour scheme" /><span class="switcher-track" aria-hidden="true"><span class="switcher-option switcher-light">${ICONS.sun}</span><span class="switcher-option switcher-dark">${ICONS.moon}</span></span><label for="theme-toggle" aria-hidden="true"></label></span>`.
- `src/app/chrome.ts`: `mountChrome()` synchronizes checkbox `checked` state with the resolved scheme via `isDark()`, listens to checkbox `change` event, updates scheme preference via `nextPref()` and `applyScheme()`, and disposes cleanly.
- `src/app/chrome.css`: added styles for `.switcher` (58×28px compact pill), `.switcher input`, `.switcher-track`, `.switcher-option`, `.switcher label`, and `.switcher-1` stretch-glide animation using CSS custom properties (`--text-main`, `--text-muted`, `--card-background`, `--card-background-muted`, `--focus-ring`). Active icons scale to 1.12× with `--text-main`, while inactive icons dim to 0.55 opacity.
- `src/app/chrome.test.ts`: updated unit test to assert `<span class="switcher switcher-1">`, `<input type="checkbox" id="theme-toggle">`, `.switcher-track`, `.switcher-option`, sun and moon icons, and that text labels are absent.
- `DECISIONS.md`: added entry #107 for the icon-only glide toggle.

**Checks on 2026-11-07:**
- `npm test`: 629 passed across 117 test files.
- `npm run build`: cleanly built in 185ms.
- `npm run check:dist`: initial JS 133.14 KB gzip, `OK`.
- `npx playwright test tests/e2e/chrome.spec.ts`: 42 passed across Chromium, Firefox, WebKit.
- `npm run dev`: running locally at `http://localhost:5173/`.

---

## 2v. Latest Session, Part 15 (2026-11-07): Minimal Header, Hover Labels Everywhere, Switches, Zoom and Move

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2u.

**Request:** the owner asked:
- to bring the header back (no auto-hide), very minimal, with icons only apart from the project name;
- for every control to show its name on hover, like Save .mmd, Share and Export;
- to make Wrap text and the background lock into toggles;
- for zoom in, zoom out and move icons on the canvas.

**What changed:**
- **Header auto-hide removed** (it reverses section 2q): `src/app/header-autohide.ts` and its test, the `shell.css` block, the `main.ts` call and `tests/support/header.ts` with its calls in `chrome.spec.ts`, `a11y.spec.ts` and `axe.spec.ts` are all gone.
- **Minimal header:**
  - `src/app/chrome.ts` `headerHtml()` builds one row: the brand (28 px logo and "Gati Chitra"), then Install, Help, My Other Tools, Hire Me and Support my work as `.action-btn` icons, each with an `.action-label` and an `aria-label`, then the theme switch (label "Theme") last, so the visual order and the Tab order match.
  - The tools chevron and the `title` tooltips are gone, and `ICONS.chevron` is removed from `icons.ts`.
  - `src/app/chrome.css`: the header is a 48 px flex row with 34 px icon buttons. The phone rules no longer make two rows or round bordered buttons; they only hide the support link and place the tools panel.
- **Hover labels everywhere:**
  - `src/app/style.css` has one shared pattern. `.action-btn` shows only its icon; `.action-label` grows from `max-width: 0` to 160 px on `:focus-visible`, and on `:hover` only under `(hover: hover)`. Reduced motion turns the transition off.
  - In `index.html`, Undo, Redo, Fit, Auto-layout, Present, the two editor tabs (labels "Script" and "Nodes"), New, Open, Templates, Grid and the new zoom buttons now carry labels, and their `title` attributes are gone.
  - `.editor-tab` and `.icon-toggle` (Grid) size to their content.
- **Switches:**
  - `#editor-wrap` (in the editor corner pill) is a `role="switch"` checkbox, and `#bg-lock` is a `role="switch"` button labelled "Lock background".
  - Both draw a `.switch-track` with a sliding knob, using `--accent` when on.
  - `src/app/anim-controls.ts` sets `aria-checked` and no longer rewrites the lock's text. `.bg-lock-btn` styles are gone, and `ui.ts` skips `.switch-toggle` when adding `btn-secondary`.
- **Zoom and Move:**
  - `#canvas-zoom` (in `#canvas-corner`, bottom-right) holds Zoom out, Zoom in and Move.
  - `src/app/canvas-events.ts` wires the zoom buttons to 1.25× steps around the canvas centre, the same as the + and − keys.
  - `src/app/pan-tool.ts` (new) has `panToolOn()` and `setupPanTool()`. Move toggles `aria-pressed`; while it is on, mouse drags are sent as Space-held pans and `touch-wiring.ts` skips its node hit test, so dragging from a node moves the view. A grab cursor shows while it is on.
- **Tests (written first):**
  - Unit (watched fail): `src/app/anim-controls.test.ts` checks the lock's `aria-checked` and that its text is left alone; `src/app/chrome.test.ts` checks the header has a label for each item and no `nav-label`.
  - `tests/support/icons.ts` (new) has `expectHoverName(page, control, name)`: the label is hidden, shows the name on hover, and hides again.
  - `tests/e2e/layout.spec.ts`:
    - the header stays in view, at most 52 px, with the name visible and icon-only items no wider than 40 px on one row;
    - header and canvas/panel icons show their names on hover;
    - the zoom group sits bottom-right; Zoom in and out change the zoom by 1.25×; with Move on, a drag from node A moves the view and leaves the text unchanged (also run with Move broken, where it fails);
    - Lock background and Wrap text are switches that change state;
    - the old tooltip checks are now label checks.
  - `tests/e2e/chrome.spec.ts`: the header is 40 to 52 px tall and stays one row on narrow screens.
- **Checks on 2026-11-07:**
  - `npm test`: 629 passing across 117 files (the 2 header auto-hide unit tests are gone).
  - `npm run lint`: clean.
  - `npm run build`: passes. The first build failed on a stray `}` my edit left at the end of `chrome.css`; that is fixed.
  - `npm run check:dist`: initial JS 133.06 KB gzip, `OK`.
  - `npm run test:e2e`: 485 passed, 17 skipped, 0 failed.
  - Screenshots in a separate scripted browser at 1127×760 (dark and light: header, Help on hover, Zoom in on hover, the switches) and 375×812 (one-row header, the zoom group).

---

## 2u. Latest Session, Part 14 (2026-11-07): Phone Tabs Named Canvas and Editor

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2t.

**Request:** on phones, the `#view-tabs` tabs should read "Canvas" and "Editor" instead of "Diagram" and "Text".

**What changed:**
- `index.html`: the tab labels are now Canvas and Editor. The ids `#tab-diagram` and `#tab-text` are unchanged, because `narrow.ts`, `toolbar.ts` (`showDiagramOnPhone`) and the tests use them.
- `src/app/narrow.ts`: the text fallbacks look for "Canvas" and "Editor". `src/app/narrow.test.ts` labels follow.
- Comments in `toolbar.ts`, `props-dock.ts` and `shell.css`, and test titles and comments in `tests/e2e/mobile.spec.ts`, now say the Canvas and Editor tabs.
- `README.md`: the feature line and the phone layout line now name Canvas and Editor tabs. The phone line no longer mentions the More menu, which section 2t removed. **Run the humanizer on README.md before committing**, as `CLAUDE.md` asks.
- **Test (changed first, watched fail):** `tests/e2e/mobile.spec.ts` checks the two tabs read exactly "Canvas" and "Editor" and finds them by those names.
- **Checks on 2026-11-07:**
  - `npm test`: 631 passing across 118 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 133.21 KB gzip, `OK`.
  - `npm run test:e2e`: 485 passed, 17 skipped, 0 failed.
  - Screenshot at 375×812 in a separate scripted browser: the tabs read Canvas and Editor.

---

## 2t. Latest Session, Part 13 (2026-11-07): Toolbar Removed, File Actions as Icons, Hover Labels

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2s.

**Request:** the owner asked:
- to put Save .mmd next to Share and Export as an icon;
- for those icons to widen on hover to show their name;
- to move New and Open from `#toolbar` into `#text-panel-bar`.

**What changed:**
- `index.html`:
  - `#toolbar` is gone, along with `#btn-more`, `#more-menu` and the spacer.
  - `#text-panel-bar` now ends with `#script-actions` (`role="group"`, "File"), holding New (file-plus icon), Open (folder icon) and Templates as `.icon-btn` buttons with `aria-label` and `title`, plus the hidden `#file-picker`.
  - `#dock-actions` holds Save .mmd (disk icon), Share and Export as `.icon-btn.action-btn` buttons, each with a `<span class="action-label">` and no `title`.
- `src/app/style.css`: the `#toolbar`, `.toolbar-spacer`, `#more-menu` and `#btn-more` rules are gone (including the phone ones), and so is the present-mode `#toolbar` rule (also in `present.css`). `.action-btn` shows only its icon; on `:hover` or `:focus-visible`, the label grows from `max-width: 0` to 90 px and the button pads out. With reduced motion there is no transition. `#script-actions` is a small flex row.
- `src/app/narrow.ts`: the More menu code is gone; it now only switches the Diagram and Text tabs.
- `src/app/ui.ts`: the `btn-secondary` pass no longer looks for `#toolbar`.
- `src/app/shell.css`: the auto-hide comment now says the hot zone ends where the workspace starts.
- `toolbar.ts` still wires New, Open and Save .mmd by id, so it is unchanged.
- **Tests (written first, watched fail):**
  - `tests/e2e/layout.spec.ts`:
    - no `#toolbar`, `#btn-more` or `#more-menu`, and the workspace starts within 20 px of the top;
    - Save .mmd, Share and Export are named icon buttons, at most 34 px wide with the label hidden, centred in the dock row, in that order, ending within 16 px of its right edge, and Export works with the dock collapsed;
    - hovering each one shows its name and widens it by over 25 px, and moving away hides the name;
    - Save .mmd downloads `diagram.mmd`;
    - New, Open and Templates sit in order in the panel bar's File group as named icons with tooltips, New empties the script to `flowchart TD`, and Open asks for a file.
    - The old "toolbar stays on one slim row" test is replaced.
  - `tests/e2e/mobile.spec.ts`: no toolbar or More; Save .mmd and Export are in the dock row; New, Open and Templates are in the Text tab's bar. The Fit, Undo and Grid checks are kept.
  - `tests/e2e/a11y.spec.ts`: the first Tab stop is now `tab-script`.
  - `tests/e2e/chrome.spec.ts`: the grouping test's title says "controls"; the File group is now the panel bar's.
- **Checks on 2026-11-07:**
  - `npm test`: 631 passing across 118 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 133.21 KB gzip, `OK`.
  - `npm run test:e2e`: 485 passed, 17 skipped, 0 failed.
  - Screenshots in a separate scripted browser at 1127×760 (dark and light): the page without the toolbar, and Share widened with its name on hover.

---

## 2s. Latest Session, Part 12 (2026-11-07): Share and Export as Icons in the Dock Title Row

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2r.

**Request:** the owner asked to put Export and Share as icons at the bottom right, at the far right of the "Animation & theme" row.

**What changed:**
- `index.html`: `#btn-share` left the File group, and `#btn-export` left the toolbar. Both now sit in `#dock-actions` (`role="group"`, "Share and export") at the end of `.dock-header`, after `#message`, as `.icon-btn` buttons:
  - share-nodes icon, title "Share: copy a link to this diagram";
  - arrow-out-of-tray icon, title "Export as PNG, SVG, GIF or video".
  `#share-box` moved into `#dock-actions` too. The toolbar now holds New, Open and Save .mmd (plus More on phones).
- `src/app/style.css`: `#dock-actions` sits at the far right. `#btn-export` keeps the accent fill (darker on hover). `#share-box` is an absolutely positioned card just above the icons, at most 420 px wide (80vw on phones), with a shadow. The old `#btn-export` text-button rule is gone, and so is the dead `#add-shape` width rule in `src/app/shell.css`.
- `src/app/ui.ts`: the class pass now skips `.icon-btn` in `#canvas-controls` and adds only `btn-secondary` (the Export-only `btn-primary` branch is gone). `share-dialog.ts`, `export-panel` and `a11y` focus return find the buttons by id, so nothing else changed.
- The icons stay visible with the dock collapsed, and present mode hides them with the dock. "Link copied." shows in `#message`, right next to them.
- **Tests (written first, watched fail):**
  - `tests/e2e/layout.spec.ts`: Share and Export are not in `#toolbar`. In `.dock-header` they are named, have tooltips, show only icons, are vertically centred in the row, end within 16 px of its right edge, and Share sits left of Export. Export still shows and opens `#export-panel` with the dock collapsed. With copying blocked (the box opens only then), the share box opens above the row, within 24 px of its right edge, inside the canvas width, with a `#v1=` link.
  - `tests/e2e/mobile.spec.ts`: Export is out of the toolbar and in the dock row on phones.
- **Checks on 2026-11-07:**
  - `npm test`: 631 passing across 118 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 133.22 KB gzip, `OK`.
  - `npm run test:e2e`: 474 passed, 17 skipped, 2 failed. Both were the new share box test in Firefox and WebKit. Those browsers let the page copy to the clipboard, so Share copied the link and showed "Link copied." without opening the box, which is the intended behaviour. The test now blocks copying first and passed in all three desktop browsers (3 of 3).
  - Screenshots in a separate scripted browser at 1127×760 (dark and light, dock open and collapsed with the share box) and 375×812.

---

## 2r. Latest Session, Part 11 (2026-11-07): Templates as an Icon in the Script Panel Bar

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2q.

**Request:** the owner asked to put Templates in `#text-panel-bar` as an icon.

**What changed:**
- `index.html`: `#btn-templates` left the toolbar's File group (now New, Open, Save .mmd, Share) for the right end of `#text-panel-bar`, after the editor tabs. It is an `.icon-btn` with a layout-template icon, `aria-label="Templates"` and `title="Templates: start from an example"`, and starts `disabled` as before.
- `src/app/gallery.ts` finds the button by id, enables it and returns focus to it on close, so no script changed. The bar's `justify-content: space-between` puts it at the right.
- Phones: it shows on the Text tab's panel bar, so the More menu now holds New, Open, Save .mmd and Share.
- **Tests (written first, watched fail):**
  - `tests/e2e/layout.spec.ts`: Templates is not in `#toolbar`; in the bar it is enabled, named "Templates" with a tooltip, shows only an icon, sits within 16 px of the bar's right end, and opens `#gallery`.
  - `tests/e2e/mobile.spec.ts`: the icon is on the Text tab, and the More menu check now looks for "Open".
  - `tests/e2e/chrome.spec.ts`: the File group check now looks for `#btn-open`.
- **Checks on 2026-11-07:**
  - `npm test`: 631 passing across 118 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 133.22 KB gzip, `OK`.
  - `npm run test:e2e`: 470 passed, 17 skipped, 0 failed.
  - Screenshots in a separate scripted browser at 1127×760 (dark and light, hovered) and 375×812 (Text tab).

---

## 2q. Latest Session, Part 10 (2026-11-07): Header Auto-Hide

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2p.

**Request:** the owner asked for the site header to auto-hide.

**What changed:**
- `src/app/shell.css`: under `(min-width: 768px) and (hover: hover) and (pointer: fine)`, and not while presenting:
  - `.site-header` is fixed at the top and translated up so only a 4 px strip shows, with a 44×3 px handle (`::before`) and an invisible 8 px target under it (`::after`), which ends where the toolbar starts.
  - `[data-revealed]` slides it back down with a shadow. It overlays the page, so `#main` starts at the top of the window and the canvas does not resize.
  - `prefers-reduced-motion` turns off the slide.
- `src/app/header-autohide.ts` (new): `headerShouldShow({ hovering, focusInside, menuOpen })` and `setupHeaderAutohide()`. The latter sets `data-revealed` on `pointerenter` and on `focusin`, clears it 300 ms after `pointerleave` or once focus has left, and rechecks when the tools menu's `aria-expanded` changes. `src/app/main.ts` calls it.
- Phones and touch screens: unchanged; the header stays in the page flow. On phones the page already loads scrolled to the main area (`ui.ts` focuses `#main`), so the header sits above the fold until you scroll up.
- `tests/support/header.ts` (new): `revealHeader(page)` points at the top edge and waits for the header. `tests/e2e/chrome.spec.ts` (7 places), `a11y.spec.ts` and `axe.spec.ts` call it before clicking header controls.
- **Tests (written first, watched fail):**
  - `src/app/header-autohide.test.ts` (new, 2 tests).
  - `tests/e2e/layout.spec.ts`: the header hides and `#main` starts at the top; pointing at the top edge shows it fully (Help fully in view) without resizing the canvas, and moving away hides it; keyboard focus shows it until focus leaves; it stays while the tools menu is open.
  - `tests/e2e/mobile.spec.ts`: on phones the header is not fixed and shows whole at the top of the page.
- **Checks on 2026-11-07:**
  - `npm test`: 631 passing across 118 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 133.22 KB gzip, `OK`.
  - `npm run test:e2e`: 467 passed, 17 skipped, 0 failed.
  - Screenshots in a separate scripted browser at 1127×760 (dark and light): hidden (strip and handle, toolbar at the top) and shown (header over the toolbar with a shadow).

---

## 2p. Latest Session, Part 9 (2026-11-07): Label Editor as a Compact Pill

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2o.

**Request:** the owner found the text entry popup that opens on a node ugly.

**Before:** `#inline-edit` was a text box the size of the node's bounding box (at least 80×30 px) in the card colour, with a border, the browser's focus outline and padding. Text started at the top-left, in the page font. On a circle or diamond it covered the shape with a grey square, with a double border.

**What changed:**
- `src/app/inline-edit-box.ts` (new): `EDITOR` limits, `editorFontPx(labelSize, zoom)` (the label's size at the current zoom, clamped to 12–24 px) and `editorWidth(lineWidths)` (widest line plus padding, border and caret room, from 64 to 320 px).
- `src/app/inline-edit.ts`: `start` now records an anchor (the label centre for nodes and arrows, the top-left for group titles), sets the font to `FONT_STACK_SANS` at 16, 13 or 14 px times the zoom, and centres the text (left-aligned for group titles). `fit()` measures the typed lines with a canvas context, sets the width, then sets the height from `scrollHeight`, so a long label wraps and grows taller after 320 px. It re-centres on the anchor and runs on every `input`.
- `src/app/style.css`: `#inline-edit` is a pill (8 px radius, 4×10 px padding, line height 1.3) with one `--focus-ring` border, a soft 3 px focus-coloured ring and no browser outline. `index.html` gives the textarea `rows="1"`.
- **Tests (written first, watched fail):**
  - `src/app/inline-edit-box.test.ts` (new, 5 tests): font size at zoom and the clamps; width from the widest line, the minimum, the maximum.
  - `tests/e2e/edit.spec.ts`: on a circle node the editor centres its text in the label's font size with no outline, is one line tall, stays centred on the label, and grows wider (up to 320 px) as you type. "inline editor sits on the node" still passes.
- **Checks on 2026-11-07:**
  - `npm test`: 629 passing across 117 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 133.02 KB gzip, `OK`.
  - `npm run test:e2e`: 453 passed, 17 skipped, 0 failed.
  - Screenshots in a separate scripted browser of a rectangle, a circle and a diamond, before and after, in dark and light.

---

## 2o. Latest Session, Part 8 (2026-11-07): Script and Nodes Tabs in the Editor Panel

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2n.

**Request:** the owner did not like the "+" menu on the canvas (section 2n). They asked for "Add node" to become a tab in the Mermaid script panel: one tab for writing the script, and one for picking nodes to add and formatting them. Every node shape gets an icon, and both tabs show icons instead of text.

**What changed:**
- `index.html`: `#text-panel-bar` now holds `#editor-tabs` (`role="tablist"`, "Editor panels") with two icon tabs. `#tab-script` (code icon, `aria-label` "Mermaid script") controls `#script-pane`, which holds `#source`, the Wrap text strip and the diagnostics. `#tab-nodes` (shapes icon, `aria-label` "Nodes", title "Nodes: add and format") controls `#nodes-pane`. The Nodes pane has two sections:
  - **Format** (first): `#props-empty` hint, then `#format-slot`, where `props-dock.ts` puts `#props` on wide screens.
  - **Add a node**: `#node-palette`, `#palette-hint` for types that add nodes only in the script, and the hidden `#add-shape` select.
  - The "+" button, its menu and the divider are gone from the canvas; `#canvas-edit` (still the "Edit" group) holds only Undo and Redo.
- `src/app/node-palette.ts` (new): `rovingStep(index, key, count)` and `setupNodePalette(env)`. One button per `#add-shape` option, with `shapeIcon` and the name (full name in `title`, since long names truncate). It redraws through a `MutationObserver` when kind-ui refills or disables the select. Clicking sets `selectedIndex`, runs `beforeAdd` and then `onAdd`; the arrow keys move a roving tab stop.
- `src/app/editor-tabs.ts` (new): `setupEditorTabs()` handles click and arrow-key switching. When `#props` goes from hidden to shown inside the Nodes pane (a node or arrow was selected on the diagram), it opens the Nodes tab at the top.
- `src/app/toolbar.ts`: `setupNodePalette` replaces the menu; on phones, `showDiagramOnPhone` switches to the Diagram tab and waits two frames before adding, so the node is placed and labelled on a visible canvas.
- `src/app/props-dock.ts`: the wide-screen target is now `#format-slot` (`PropsDockEnv.wideParent`), and `props-dock.test.ts` follows.
- `src/app/kind-ui.ts`: the `#btn-add-node` lines are gone. `src/app/main.ts` calls `setupEditorTabs()`. `src/app/add-node-menu.ts` is deleted.
- `src/app/style.css`: tab, pane, palette grid and hint styles. On phones the Format section is hidden, since properties are a sheet over the diagram there. `src/app/shell.css` styles `#format-slot > #props` and hides its own title row in favour of the section heading.
- **Why Format comes first:** with the palette first, selecting a node left the controls below the fold, and the pane could not scroll them up because there was not enough content under them (a check measured 307 px short).
- **Also fixed (found in the screenshots):** `properties.ts` hides the arrow section for a node and the node section for an arrow, but the sections' `display: inline-flex` overrode the `hidden` attribute, so both always showed. A `[hidden]` rule now hides them. This dates from before `b71adbd`.
- **Tests (written first, watched fail):**
  - `src/app/node-palette.test.ts` (new): `rovingStep`.
  - `src/app/shape-icons.test.ts`: the menu tests are gone.
  - `src/app/props-dock.test.ts`: the panel moves into the format section.
  - `tests/e2e/layout.spec.ts`: two icon tabs with names, tooltips and arrow keys; the Nodes tab lists 20 iconned, named shapes and a click adds one (Diamond gives braces); there is no `#btn-add-node` or menu; selecting a node opens the Nodes tab with Format at the top, the node section shown and the arrow section hidden; a state diagram offers only "State". The undo test adds through the palette.
  - `tests/e2e/mobile.spec.ts`: adding from the Nodes tab on a phone switches to the Diagram tab and adds the node.
  - `tests/e2e/diagram-edit.spec.ts` and `tests/e2e/diagrams.spec.ts` use the palette.
  - `tests/support/editor.ts`: `typeInEditor` opens the Script tab first.
- **Checks on 2026-11-07:**
  - `npm test`: 624 passing across 116 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 132.79 KB gzip, `OK`.
  - `npm run test:e2e`: 450 passed, 17 skipped, 0 failed (the final run, with the property section fix).
  - Screenshots from the dev server in a separate scripted browser at 1127×760 (dark and light) and 375×812: icon tabs, Format at the top with the selection's controls, the palette with icons and names, and the phone Nodes tab showing the palette only.

---

## 2n. Latest Session, Part 7 (2026-11-07): Add-Node Menu on the Canvas, Stale Add List Fix

**Superseded by section 2o:** the "+" menu was removed at the owner's request. The stale add list fix in `kind-ui.ts` and `src/app/shape-icons.ts` remain.

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2m.

**Request:** the owner asked to move "Add node" and the shape drop-down into the canvas as a "+" icon that opens the list of node shapes, each with a name and an icon, where clicking one adds that node.

**What changed:**
- `index.html`: the toolbar's Edit group is gone. The canvas's top-left card is now `#canvas-edit` (`.canvas-float`, `role="group"`, `aria-label="Edit"`), holding `.add-node` (the "+" `#btn-add-node` with `aria-haspopup="menu"`, `#add-node-menu` with `role="menu"` and `aria-label="Node shapes"`, and the hidden `#add-shape` select), a divider, and `#canvas-history` (Undo, Redo).
- `src/app/shape-icons.ts` (new): `shapeIcon(shape)` returns a 20 px outline SVG (`currentColor`, `aria-hidden`) for each of the 26 `ShapeKind` values, and a dashed box for anything unknown.
- `src/app/add-node-menu.ts` (new): `menuStep(index, key, count)` for arrow, Home and End movement with wrap-around, and `setupAddNodeMenu(env)`. On open it rebuilds the items from `#add-shape` (icon plus escaped name), caps the height so the list stays inside the canvas, and focuses the first item. Choosing an item sets `selectedIndex`, closes the menu and calls `onAdd` (the new node's label editor takes focus). A type with one node kind adds straight away. Escape closes and refocuses "+"; Tab or a pointer press outside closes.
- `src/app/toolbar.ts`: the old click-to-add listener is replaced by `setupAddNodeMenu(...)`.
- `src/app/narrow.ts`: the File group goes back with `toolbar.prepend` (it used to go before the Edit group, which no longer exists).
- `src/app/style.css`: `#canvas-edit` (left, `z-index: 6` so the menu opens over the Grid strip), `.float-divider`, `.add-node`, and the `#add-node-menu` list styles with a focus ring for keyboard use. `src/app/present.css` hides `#canvas-edit`.
- **Stale add list fixed (`src/app/kind-ui.ts`):** `syncKindControls` now refills the lists when the engine changes, not only the diagram type. Before, a state diagram's first parse ran on the flowchart fallback, and the refill never ran once the state engine arrived, so "+" offered 20 flowchart shapes. This was the first finding of the review in section 2h.
- **Tests (written first, watched fail):**
  - `src/app/shape-icons.test.ts` (new, 7 tests): every shape has its own decorative icon, unknown shapes get the fallback, and `menuStep` moves, wraps and jumps.
  - `src/app/kind-ui.test.ts`: with a stub document, the add list switches from flowchart shapes to the engine's own once the engine loads.
  - `tests/e2e/layout.spec.ts`: "+" sits on the canvas with a menu of 20 named, iconned shapes that stays inside the canvas and closes on an outside click; choosing Diamond adds a braced node; the keyboard path works; a state diagram adds straight away; present mode hides "+". The undo test now adds through the menu.
  - `tests/e2e/diagram-edit.spec.ts`: when the menu opens, the test takes its first entry, as the old button did.
  - `tests/e2e/mobile.spec.ts`: the shape picker is out of the toolbar and "+" is on the canvas.
- **Checks on 2026-11-07:**
  - `npm test`: 623 passing across 115 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 132.58 KB gzip (was 131.36 KB), `OK`.
  - `npm run test:e2e`: 445 passed, 17 skipped, 3 failed. All three were `chrome.spec.ts` "groups toolbar buttons into File, Edit and View" (one per desktop browser): the Edit controls had moved into `#canvas-edit`, which had no group name. `#canvas-edit` now has `role="group"` and `aria-label="Edit"`. After that, `chrome.spec.ts` plus `axe.spec.ts` passed in all three desktop browsers (63 passed), and `layout.spec.ts`, `mobile.spec.ts` and `diagram-edit.spec.ts` passed in every project (107 passed, 7 skipped).
  - Screenshots in a clean browser profile at 1127×760 (dark and light) and 375×812: the menu opens under "+", shows icons and names, scrolls inside the canvas, and shows the focus ring on the keyboard-focused item.
- **Note:** while checking, a click on "+" in the owner's own browser tab added a node to their saved architecture diagram (one node kind, so it adds at once). It was removed straight away with Escape and Undo, and the four services are as before. Later visual checks used a separate browser profile.

---

## 2m. Latest Session, Part 6 (2026-11-07): Undo and Redo on the Canvas, Icon Buttons

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2l.

**Request:** the owner asked to put Undo and Redo in the top-left of the diagram canvas as icons, and to make Grid, Fit, Auto-layout and Present icons too.

**What changed:**
- `index.html`: `#btn-undo` and `#btn-redo` left the toolbar's Edit group (which now holds the shape picker and Add node) for `#canvas-history` (`role="group"`, `aria-label="History"`) in the canvas's top-left corner. Fit, Auto-layout, Present, Undo and Redo are `.icon-btn` buttons, each with an inline 18 px stroke SVG (`currentColor`), an `aria-label` and a `title` tooltip that names the shortcut where there is one (from `src/app/shortcuts-help.ts`). Grid is a `.icon-toggle` label holding a grid icon and the `#canvas-grid` checkbox, visually hidden with `aria-label="Grid"`.
- Every id is unchanged, so `toolbar.ts`, `kind-ui.ts`, `present.ts` and `ui.ts` need no change. No script rewrites these buttons' text.
- `src/app/style.css`: `.canvas-float` is the shared floating card for `#canvas-history` (left) and `#canvas-tools` (right); `.icon-btn` is a 30 px square icon button; `.icon-toggle` is the 38 px Grid toggle, tinted with the focus colour when on and outlined when its checkbox has keyboard focus. The Wrap text pill keeps its text.
- `src/app/present.css`: present mode also hides `#canvas-history`.
- Phones: the toolbar is now one row (shape picker, Add node, More, Export). Undo and Redo show on the Diagram tab only; the Text tab relies on the editor's own undo.
- **Tests (written first, watched fail):**
  - `tests/e2e/layout.spec.ts`: Undo and Redo are not in `#toolbar`, sit within the canvas's top-left corner, are named "Undo"/"Redo" with a tooltip, show only an icon, and Undo reverts Add node. Fit, Auto-layout, Present and Grid are named icon controls with tooltips, and Grid still toggles. Present mode hides `#canvas-history`.
  - `tests/e2e/mobile.spec.ts`: Undo sits on the canvas on phones. The double-tap test now taps below the Undo/Redo group and checks that the point is bare canvas.
- **Checks on 2026-11-07:**
  - `npm test`: 615 passing across 114 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 131.36 KB gzip, `OK`.
  - `npm run test:e2e`: 435 passed, 17 skipped, 1 failed. The failure, `mobile.spec.ts` "a double tap on empty space adds a node", double-tapped 20 px in and 40 px down from the canvas's top-left corner, which is now the Undo button. The test now taps 80 px down and first checks that `document.elementFromPoint` is the canvas; it passed 5 of 5 runs, and `mobile.spec.ts` then passed in full on both phone projects (11 passed, 7 skipped).
  - Checked in the browser at 1127×760 (dark and light) and 375×812: the icons sit in three corners, disabled ones are greyed, and Grid turns the grid on and off.

---

## 2l. Latest Session, Part 5 (2026-11-07): Tab Icon Readable on Dark Tabs

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2k.

**Bug (reported by the owner):** the favicon was hard to see in a dark browser tab (Brave, macOS in dark mode).

**Root cause:** `public/favicon.svg` drew the logo with 24/512 lines, which are 0.75 px wide at a 16 px tab size. Rendered on a dark tab, the light-grey dark-mode variant blurred into a faint smudge and only the two dots read. It also depended on the browser applying `prefers-color-scheme` inside the favicon, which not every browser does.

**What changed:**
- `public/favicon.svg`: one design for every tab colour, a rounded `#34495e` tile (the site accent) with the logo in `#ecf0f1` (about 8:1 contrast), lines 52/512 at 0.8 scale (about 1.3 px in a 16 px tab) and larger dots. The top dashes use butt caps so their gaps stay visible. No media query.
- `public/favicon.ico`: regenerated from it with `npm run icons`.
- `scripts/app-icon.svg` (new): the original transparent artwork, so `scripts/make-icons.mjs` still builds the installed-app icons (`apple-touch-icon.png`, `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png`) from it. They regenerated byte for byte, so they are unchanged. It lives in `scripts/` so it is not deployed.
- **Test (written first, watched fail):** `src/app/brand.test.ts` now checks that `favicon.svg` has a full-size tile, no `prefers-color-scheme`, at least 4.5:1 between tile and logo, and lines at least 40/512 thick after scaling.
- **Evidence:** a scratch render of both icons at 16 and 32 px on a dark (`#35363a`) and a white tab, before and after.
- **Also fixed:** the lock contrast test in `tests/e2e/layout.spec.ts` read the colours once, mid-way through the pill's 0.15 s colour transition, and failed in Firefox and WebKit (3.2:1 and 1.9:1). It now polls with `expect.poll` and passed 15 of 15 runs across the three desktop browsers.
- **Checks on 2026-11-07:**
  - `npm test`: 615 passing across 114 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 131.36 KB gzip, `OK`.
  - `npm run test:e2e`: 430 passed, 17 skipped, 0 failed.
- **Note for the owner:** browsers cache favicons. If the old icon still shows, reload the page with Cmd+Shift+R.

---

## 2k. Latest Session, Part 4 (2026-11-07): Corner Controls on the Canvas and Editor, Light-Scheme Lock Fix

**Status: uncommitted**, waiting for the owner's local review together with sections 2h to 2j.

**Request:** the owner selected the toolbar and asked to put Fit, Auto-layout and Present inside the canvas, then asked for the Grid toggle in the canvas's bottom-left corner and the Wrap text toggle in the editor's bottom-right corner. At their window width (about 1127 px) the toolbar wrapped Export onto a second row.

**What changed:**
- `index.html`: the toolbar's View group is gone. `#canvas-tools` (`role="group"`, `aria-label="View"`) sits right after `<canvas id="canvas">` in `#canvas-panel` and holds `#btn-fit`, `#btn-autolayout` and `#btn-present` with the same ids, so `toolbar.ts`, `kind-ui.ts` and `present.ts` work unchanged.
- `src/app/style.css`: `#canvas-tools` floats 10 px from the canvas's top-right corner as a small card-coloured pill with quiet 28 px buttons. Fit leaves a 48 px margin (`VIEW.fitMargin`), so it never covers a node after fitting.
- `src/app/present.css`: present mode hides `#canvas-tools`.
- `src/app/narrow.ts`: no longer moves a View group into the phone More menu (the `viewGroup` and `spacer` lookups are gone). Phones show the group on the Diagram tab.
- **Grid toggle (follow-up request):** the owner asked for Grid in the canvas's bottom-left corner. `index.html` moves the Grid label (checkbox id `canvas-grid` unchanged) out of the dock into `#canvas-corner`, a zero-height strip right after the canvas and `#canvas-tools`. In `src/app/style.css` the pill hangs 10 px up from that strip, so it follows the canvas edge whether the dock is open or hidden. `src/app/present.css` hides it in present mode. Glow stays in the dock on its own.
- **Wrap text toggle (follow-up request):** the owner asked for Wrap text at the bottom right inside the Mermaid editor. `index.html` moves the label (checkbox id `editor-wrap` unchanged, so `wrap-toggle.ts` and `ui.ts` are unchanged) out of `#text-panel-bar` into `#source-corner`, a zero-height strip right after `#source`. CodeMirror empties `#source` when it mounts, so the toggle cannot sit inside it. `#source-corner` and `#canvas-corner` share the `.corner-strip` class in `src/app/style.css`. The pill sits 20 px from the editor's right and bottom edges to clear scrollbars. `#source .cm-content` gets 56 px of bottom padding, so the last line of a long script scrolls above it. The title row now holds only "Mermaid Script" and stays one line at the narrowest split (it was 62 px tall there, with the pill wrapping onto two lines).
- **Light-scheme fix (found while checking):** the pressed background lock and the selected phone tab underline used `var(--brand)`, which `tokens.css` never defines. In the light scheme the pressed "Locked" pill was white text on a transparent background (contrast 1.37:1). Both now use `--accent` (and `--accent-text` for the pill text). This was already in `b71adbd`.
- **Tests (written first, watched fail):**
  - `tests/e2e/layout.spec.ts`: the toolbar stays one row (at most 56 px) at 1280, 1100 and 1024 px (was 82 px at 1100); Fit, Auto-layout and Present are not in `#toolbar` and sit inside the canvas box; the canvas tools hide while presenting and come back on Escape; the pressed lock has at least 4.5:1 contrast in the light scheme.
  - `tests/e2e/layout.spec.ts`: Grid is not in the dock, sits within 24 px of the canvas's bottom-left corner, and still toggles with the dock hidden; present mode hides it.
  - `tests/e2e/layout.spec.ts`: Wrap text is not in the title row, sits within 28 px of the editor's bottom-right corner and still turns on line wrapping; the title row is at most 45 px tall with the splitter at 20%; after scrolling a long script to the end, the last line sits above the toggle (this one was also run without the padding, where it fails by 45 px).
  - `tests/e2e/mobile.spec.ts`: the More menu no longer lists Fit; Fit and Grid sit on the canvas and Wrap text in the editor on phones.
- **Checks on 2026-11-07 (with sections 2h to 2k together, after the Wrap text move):**
  - `npm test`: 615 passing across 114 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 131.36 KB gzip, `OK`.
  - `npm run test:e2e`: 428 passed, 17 skipped, 2 failed. Both failures were the lock contrast test in Firefox and WebKit, which measured mid-transition. Section 2l fixes the test and has the final run.
  - Checked in the browser at 1127×760 (dark and light) and 375×812: the toolbar and the script title row are one line each, the view group sits in the canvas's top-right corner, Grid in its bottom-left corner (it toggles the grid and follows the canvas edge when the dock is hidden), Wrap text in the editor's bottom-right corner, and the pressed lock reads clearly.
---

## 2j. Latest Session, Part 3 (2026-11-07): Site Footer Removed

**Status: uncommitted**, waiting for the owner's local review together with sections 2h and 2i.

**Request:** the owner selected the site footer on the page and asked to remove it entirely. This replaces the earlier rule that the header and footer stay.

**What changed:**
- `index.html`: the `<footer id="site-footer">` element is gone.
- `src/app/chrome.ts`: `footerHtml`, `copyrightText` and the footer mount are gone; `mountChrome(doc, store, onSchemeChange)` no longer takes `sourceUrl`. `src/app/ui.ts` calls it without `VITE_SOURCE_URL`.
- `src/core/constants.ts`: `BRAND.owner` and `BRAND.startYear` are gone (only the copyright line used them).
- `src/app/chrome.css`: every footer rule is gone; `src/app/style.css` no longer hides the footer in present mode; the `src/app/shell.css` comment no longer mentions it.
- Kept: `VITE_SOURCE_URL` in `.env` and `src/vite-env.d.ts`, because the `<noscript>` text in `index.html` still links to the source.
- Lost with the footer: the copyright line, "Runs entirely in your browser", the Source link, and on phones the only Support link (the header hides its own below 768 px).
- **Tests (changed first, watched fail):**
  - `src/app/chrome.test.ts`: the footer and copyright tests are replaced by one that checks `index.html` has no `<footer>` and the module exports no `footerHtml` or `copyrightText`.
  - `tests/e2e/chrome.spec.ts`: "the page has no footer" replaces the footer test; the narrow-screen and present-mode tests no longer look for the footer.
  - `tests/e2e/layout.spec.ts`: the 1280×800 test now checks that `#main` reaches the bottom of the window; the long-script test checks `#main` instead of the footer.
- **Checks on 2026-11-07:**
  - `npm test`: 615 passing across 114 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 131.36 KB gzip, `OK`.
  - `npm run test:e2e`: 409 passed, 17 skipped, 0 failed.
  - Checked in the browser at 1280×800 and 375×812: no footer, the workspace ends at the window bottom on desktop, and phones end at the controls card with no sideways scroll.

---

## 2i. Latest Session, Part 2 (2026-11-06): Minimal Studio Skin and Hideable Dock

**Status: uncommitted**, waiting for the owner's local review together with section 2h.

**Request:** the owner found the page congested and asked for a professional, minimal body like mermaid.live, with a hide option for the controls. The header, footer and colour scheme stay as they are.

**What changed:**
- **Toolbar (`src/app/style.css`):** borderless buttons with a hover tint, and thin dividers between the File, Edit and View groups instead of tinted boxes. Export is the only filled button. The toolbar is 46 px tall at 1280 px (was 61 px).
- **Panels:** each card is one surface, with a title row and then content edge to edge. The editor has no bordered box inside the card, and the canvas has no inner frame. Dividers use a new `--line` token in `src/app/tokens.css`, derived from `--border`.
- **Dock (`index.html`, `src/app/dock-toggle.ts`, `src/app/dock-toggle.test.ts`):**
  - The animation and theme controls sit under a title row ("Animation & theme"). Its chevron button `#dock-toggle` hides or shows `#dock-body`.
  - The choice is stored in `localStorage` under `gati-chitra:v1:dock` (`STORAGE.dockKey` in `src/core/constants.ts`). The dock is open by default.
  - `#message` moved into the dock's title row, so status messages stay visible while the controls are hidden.
  - On wide screens the labels sit above their controls; on phones they sit beside them.
  - The Animation label and select are now wrapped in a `.field` div.
- **Properties panel:** a "Properties" title row (`.props-head`, which also holds the phone close button) and quieter buttons.
- **Wiring:** `src/app/main.ts` calls `setupDock()` after `initApp()`.
- **CSS cleanup:** `src/app/shell.css` keeps only layout rules; the dock spacing rules moved into `style.css`.
- **Tests (written first, watched fail), all in `tests/e2e/layout.spec.ts`:** the dock hides, shows and remembers the choice across a reload; status messages stay visible while it is hidden; the toolbar stays one slim row (at most 56 px) at 1280 px. `src/app/dock-toggle.test.ts` adds 4 unit tests, including storage that throws.
- **Checks on 2026-11-06:**
  - `npm test`: 616 passing across 114 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 131.71 KB gzip, `OK`.
  - `npm run test:e2e`: 408 passed, 17 skipped, 1 failed. The failure was `mobile.spec.ts` "a 600 ms press on A shows #props" on mobile-chrome; it passes when rerun on its own (6 of 6).
- **Known flaky phone tests (not caused by this work):**
  - The tests are "one finger dragging node A adds a studio:pos A line" and "a 600 ms press on A shows #props" in `tests/e2e/mobile.spec.ts`.
  - Under CPU load both fail intermittently. With 10 CPU-hog processes running, `mobile.spec.ts --project=mobile-chrome --repeat-each=10` failed 1 and 6 times on `b71adbd` and 4 and 3 times on this working tree.
  - Cause: they wait a fixed 650 ms against the 600 ms long-press timer, or read the text right after `touchEnd` without polling.
  - Fix later by polling with `expect.poll`.

---

## 2h. Latest Session (2026-11-06): Workspace Layout Fix and Review of Tasks 64 to 103

**Status: uncommitted**, waiting for the owner's local review. The owner asked for nothing to be committed or pushed until they say so.

**Bug (reported by the owner):** a long script grew the editor down the page, the diagram canvas grew with it, and the footer and canvas controls were pushed off screen.

**Root cause:** `#workspace` in `src/app/style.css` had `min-height: 520px` but no maximum, and CodeMirror was never given a bounded height. A 121-line script grew `#source` from 616 to 2381 px. The grid row and `#canvas-panel` stretched to match, and so did `#canvas`, its bitmap included (2218 px tall).

**Fix:**
- **`src/app/shell.css` (new; imported in `src/app/main.ts` after `style.css`):**
  - Desktop (≥ 768 px wide): `body` is one viewport tall (`100dvh`, with a 640 px minimum, below which the page scrolls). `#main` and `#app` take the space between header and footer. The workspace grid row is `minmax(0, 1fr)`, and the panels have `min-height: 0`. The editor scrolls inside `#source`.
  - The control dock under the canvas is tighter: 13 px text, smaller paddings, 72 px sliders, and the shape picker capped at 150 px so the toolbar stays on one row. `#diagnostics` scrolls after 7.5 lines.
  - Phones: the Text tab editor is fixed at `60dvh`.
  - Header and footer markup and styles are unchanged. Every control stays visible, and no markup changed.
- **`src/app/props-dock.ts` (new; called from `src/app/main.ts`) and `src/app/props-dock.test.ts` (3 tests):** on wide screens the properties panel (`#props`) moves under the script editor. Inside the fixed-height canvas panel it had shrunk the canvas by up to 178 px whenever a node was selected, and the second click of a double-click then landed on the panel instead of the node, which failed 15 runs of `tests/e2e/diagram-edit.spec.ts`. On phones it stays in the canvas panel, where it is the bottom sheet.
- **`src/app/present.css`:** `body.presenting #main { padding: 0; }`, so present mode no longer overflows the window.
- **Tests (written first, watched fail):**
  - `tests/e2e/layout.spec.ts` (new, 4 tests): a long script keeps the page, the text panel and the canvas the same height, and the editor scrolls instead; header, workspace and footer fit 1280×800; in a 480 px tall window the editor stays bounded.
  - `tests/e2e/layout.spec.ts` also checks that selecting a node shows its properties without resizing the canvas.
  - `tests/e2e/mobile.spec.ts`: one new test, the Text tab editor stays bounded with a long script.
- **Measured at 1280×800:** the page is exactly 800 px tall, the canvas is 418 px, and the dock is 85 px (was 159 px).
- **Checks on 2026-11-06 after the fix:**
  - `npm test`: 612 passing across 113 files.
  - `npm run lint`: clean.
  - `npm run build`: passes.
  - `npm run check:dist`: initial JS 131.52 KB gzip, `OK`.
  - `npm run test:e2e`: 400 passed, 17 skipped, 0 failed across all five projects.
- **Local review:** `.claude/launch.json` (uncommitted, local only) starts the Vite dev server on port 5173 for the owner's review. Do not commit it.

**Review of the agents' work on `plan.md` (Tasks 64 to 103):**
- Three read-only reviewers checked D1, D2+D3 and D4+D5 against the plan. Unit tests (609), lint, build and `check:dist` pass. The reviewers then found bugs the tests do not cover. Most of them were reproduced by running the code.
- **D1, most serious:** Task 72 rewrote `computeDepths` in `src/render/prepared.ts` (commit `6a6bb25`). Nodes in a cycle now restart at depth 0, so in the default sample "Save" and "Fix input" animate before "Valid?". The root cause is the plan itself: its `stages.test.ts` expects `count: 3` for `A-->B-->C, A-->C`, but the original first-visit BFS gives 2. Fix: restore the BFS and correct that expectation to 2.
- **D1, other:**
  - `syncKindControls` (`src/app/kind-ui.ts`) does not refill the shape and arrow lists after a lazily loaded engine arrives.
  - A failed engine chunk triggers the `vite:preloadError` handler in `src/app/sw-register.ts`, which reloads the page and then shows the video-export message.
  - `upsertClassStyle` (`src/diagrams/common/edit.ts`) appends a new `classDef` on every change instead of merging.
- **D2 and D3:**
  - `direction TD` crashes use case and requirement diagrams once a node is selected, because `TD` is not mapped to `TB` as the state parser does.
  - Reverse and rename on note connectors corrupt state, class and use case notes.
  - Architecture: delete and rename break `{group}` edges and junctions, and the layout ignores `{group}` edges.
  - Class: changing the arrow corrupts cardinalities.
  - ER: reverse drops quotes and aliases, and `end` inside a subgraph is read as an entity.
  - Use case: a node declared after its first use cannot be renamed or deleted, and reverse drops edge labels.
- **D4 and D5:**
  - Block: rename and setShape of a node declared on an edge line corrupt the line, because spans are relative to a substring.
  - Mindmap: rename can change the id instead of the label.
  - gitGraph: merge rename breaks with `/` in a branch name, and merging an empty branch is accepted.
  - Sequence: a note's Shape select inserts a fake participant.
  - Journey: unknown lines vanish without a warning.
- **Process:** D4 and D5 commits deleted about 427 lines of test snippets from `plan.md`. The tests in `src` match the original snippets, which are still in `461d785:plan.md`. The D1 task checkboxes in `plan.md` were never ticked.
- None of these is fixed yet. The full reviewer reports are in this session's transcript; the list above is enough to start each fix with `systematic-debugging` and a failing test.

---

## 2g. Latest Session (2026-11-06): Milestone D5 (Tasks 95 to 103, v0.13.0)

**Status: committed locally** as individual task commits (`c56e432`, `8076d82`, `54fbc5d`, `0181847`, `acd92f2`, `61e5844`, `d71bf2b`, `d11dbbe`), release commit `chore: release v0.13.0` and tagged `v0.13.0`. Never pushed.

**What was completed:**
- **Task 95 (feat: read and lay out Mermaid block diagrams)**: parser and grid layout for `block` / `block-beta`, reading column count, items, spans, spaces, nested blocks, and block arrows with directions (`up`, `down`, `left`, `right`). Fixtures `block.mmd` and `block.json` added to corpus.
- **Task 96 (feat: edit block diagrams on the canvas and add the block template)**: visual canvas operations for block diagrams (`applyBlockOp`), added `block.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 97 (feat: read and lay out Mermaid mindmaps)**: indentation-based parser and two-sided radial tree layout for `mindmap`, reading bracket shapes (`rect`, `round`, `circle`, `bang`, `cloud`, `hexagon`) and computing balanced left/right branch distribution. Fixtures `mindmap.mmd` and `mindmap.json` added to corpus.
- **Task 98 (feat: edit mindmaps on the canvas and add the mindmap template)**: visual canvas operations for mindmaps (`applyMindmapOp`), added `mindmap.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 99 (feat: read and lay out Mermaid user journeys)**: parser and sequential layout for `journey`, reading title, sections, tasks with satisfaction scores (1 to 5) and actors, rendering task cards with corresponding mood faces (`faceHappy`, `faceNeutral`, `faceSad`), and section bands. Fixtures `journey.mmd` and `journey.json` added to corpus.
- **Task 100 (feat: edit user journeys on the canvas and add the journey template)**: visual canvas operations for user journeys (`applyJourneyOp`), added `journey.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 101 (feat: read and lay out Mermaid timelines)**: parser and column-based layout for `timeline`, reading sections, periods, and event milestones, rendering period cards, event stacks, dotted connectors, and section headers. Fixtures `timeline.mmd` and `timeline.json` added to corpus.
- **Task 102 (feat: edit timelines on the canvas and add the timeline template)**: visual canvas operations for timelines (`applyTimelineOp`), added `timeline.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 103 (chore: release v0.13.0)**: version bumped to 0.13.0 in `package.json` and `src/repo.test.ts`, updated `README.md` (and humanized), updated `RELEASE_CHECKLIST.md`, `DECISIONS.md`, and `handoff.md`.

**Key files created or changed:**
- `src/diagrams/block/`: `parse.ts`, `helpers.ts`, `layout.ts`, `ops.ts`, `index.ts`, unit tests.
- `src/diagrams/mindmap/`: `parse.ts`, `layout.ts`, `ops.ts`, `index.ts`, unit tests.
- `src/diagrams/journey/`: `parse.ts`, `layout.ts`, `ops.ts`, `index.ts`, unit tests.
- `src/diagrams/timeline/`: `parse.ts`, `layout.ts`, `ops.ts`, `index.ts`, unit tests.
- `public/templates/`: `block.mmd`, `mindmap.mmd`, `journey.mmd`, `timeline.mmd`, `index.json`.
- `tests/fixtures/diagrams/`: `block.mmd`, `block.json`, `mindmap.mmd`, `mindmap.json`, `journey.mmd`, `journey.json`, `timeline.mmd`, `timeline.json`.
- `tests/e2e/`: `diagrams.spec.ts`, `diagram-edit.spec.ts`.

**Metrics & Verification:**
- All non-test TypeScript source files remain strictly under 300 lines (longest in D5 is `src/diagrams/timeline/parse.ts` at 237 lines, `src/diagrams/mindmap/parse.ts` at 234 lines).
- `npm test`: 112 test files, 609 unit tests passing.
- `npm run lint`: 0 warnings, 0 errors.
- `BASE_PATH=/gati-chitra/ npm run build`: successful production build.
- `BASE_PATH=/gati-chitra/ npm run check:dist`: Initial JS 131.35 KB gzip; largest lazy chunk 57.27 KB gzip; block (3.89 KB), mindmap (2.97 KB), journey (2.42 KB), timeline (2.73 KB).
- `npm run test:e2e`: 386 passed, 17 skipped, 0 failed.

---

## 2f. Latest Session (2026-11-06): Milestone D4 (Tasks 89 to 94, v0.12.0)

**Status: committed locally** as individual task commits (`e648010`, `052525f`, `7f23eaf`, `bbb0a2f`, `2f6e6eb`), release commit `chore: release v0.12.0` and tagged `v0.12.0`. Never pushed.

**What was completed:**
- **Task 89 (feat: read Mermaid sequence diagrams)**: parser for `sequenceDiagram`, reading actors, participants with aliases, title, autonumber, message arrows (`<<-->>`, `<<->>`, `-->>`, `->>`, `--x`, `-x`, `--)`, `-);`, `-->`, `->`, and half-arrows), activation/deactivation markers (`+`, `-`, `activate`, `deactivate`), notes (`over`, `left of`, `right of`), and nested frames (`loop`, `alt`/`else`, `opt`, `par`/`and`, `critical`/`option`, `break`, `rect`). Fixtures `sequence.mmd` and `sequence.json` added to corpus.
- **Task 90 (feat: lay out sequence diagrams with lifelines, activations, frames and notes)**: specialized column layout for sequence diagrams (`layoutSequence`), placing participants across evenly-spaced columns, calculating y-coordinates per message/frame event, computing activation boxes, dashed lifelines, frame bounding boxes with dividers, and note callouts.
- **Task 91 (feat: edit sequence diagrams on the canvas and add the sequence template)**: visual canvas operations for sequence diagrams (`applySequenceOp`), added `sequence.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 92 (feat: read and lay out Mermaid git graphs)**: parser and custom commit lane layout for `gitGraph`, reading commits with types (NORMAL, HIGHLIGHT, REVERSE), tags, messages, branches, checkouts/switches, merges, and cherry-picks. Fixtures `gitgraph.mmd` and `gitgraph.json` added to corpus.
- **Task 93 (feat: edit git graphs on the canvas and add the git graph template)**: visual canvas operations for git graphs (`applyGitGraphOp`), added `gitgraph.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 94 (chore: release v0.12.0)**: version bumped to 0.12.0 in `package.json` and `src/repo.test.ts`, updated `README.md` (and humanized), updated `RELEASE_CHECKLIST.md`, `DECISIONS.md`, and `handoff.md`.

**Key files created or changed:**
- `src/diagrams/sequence/`: `parse.ts`, `patterns.ts`, `helpers.ts`, `layout.ts`, `layout-helpers.ts`, `ops.ts`, `index.ts`, unit tests.
- `src/diagrams/gitgraph/`: `parse.ts`, `patterns.ts`, `layout.ts`, `ops.ts`, `index.ts`, unit tests.
- `public/templates/`: `sequence.mmd`, `gitgraph.mmd`, `index.json`.
- `tests/fixtures/diagrams/`: `sequence.mmd`, `sequence.json`, `gitgraph.mmd`, `gitgraph.json`.
- `tests/e2e/`: `diagrams.spec.ts`, `diagram-edit.spec.ts`.

**Metrics & Verification:**
- All non-test TypeScript source files remain strictly under 300 lines (longest is `src/diagrams/sequence/layout.ts` at 284 lines, `src/diagrams/gitgraph/parse.ts` at 282 lines).
- `npm test`: 100 test files, 584 unit tests passing.
- `npm run lint`: 0 warnings, 0 errors.
- `BASE_PATH=/gati-chitra/ npm run build`: successful production build.
- `BASE_PATH=/gati-chitra/ npm run check:dist`: Initial JS 131.23 KB gzip; largest lazy chunk 57.27 KB gzip; sequence (5.72 KB), gitgraph (3.17 KB).
- `npm run test:e2e`: 362 passed, 17 skipped, 0 failed.

---

## 2e. Latest Session (2026-11-06): Milestone D3 (Tasks 82 to 88, v0.11.0)

**Status: committed locally** as individual task commits (`96b8661`, `5b64f87`, `289d7d2`, `50a68a3`, `c5f9c05`, `b046257`), release commit `chore: release v0.11.0` and tagged `v0.11.0`. Never pushed.

**What was completed:**
- **Task 82 (feat: read Mermaid requirement diagrams)**: parser for `requirementDiagram`, reading requirements and elements with ids, text, risk, verifymethod, type, docref, and relationship edges (`contains`, `copies`, `derives`, `satisfies`, `verifies`, `refines`, `traces`). Added fixtures `requirement.mmd` and `requirement.json` to corpus.
- **Task 83 (feat: edit requirement diagrams on the canvas and add the requirement template)**: visual canvas operations for requirement diagrams (`applyRequirementOp`), added `requirement.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 84 (feat: read Mermaid use case diagrams)**: parser for `usecaseDiagram` (and `usecase`), reading use cases (`ellipse`), actors, system/boundary boxes (`rect`), packages, and edge relationships (`-->`, `--`, `--|>`, `..>`). Added fixtures `usecase.mmd` and `usecase.json` to corpus.
- **Task 85 (feat: edit use case diagrams on the canvas and add the use case template)**: visual canvas operations for use case diagrams (`applyUsecaseOp`), added `usecase.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 86 (feat: read and lay out Mermaid architecture diagrams with built-in icons)**: parser and custom BFS grid layout for `architecture-beta`, reading groups, services with icons (`cloud`, `database`, `disk`, `internet`, `server`, and fallback for unrecognized icons), junctions, and directional side-to-side edges (`L`, `R`, `T`, `B`). Added fixtures `architecture.mmd` and `architecture.json` to corpus.
- **Task 87 (feat: edit architecture diagrams on the canvas and add the architecture template)**: visual canvas operations for architecture diagrams (`applyArchitectureOp`), added `architecture.mmd` template to gallery, and updated browser test suites `diagrams.spec.ts` and `diagram-edit.spec.ts`.
- **Task 88 (chore: release v0.11.0)**: version bumped to 0.11.0 in `package.json` and `src/repo.test.ts`, updated `README.md` (and humanized), updated `RELEASE_CHECKLIST.md`, `DECISIONS.md`, and `handoff.md`.

**Key files created or changed:**
- `src/diagrams/requirement/`: `parse.ts`, `patterns.ts`, `helpers.ts`, `ops.ts`, `index.ts`, unit tests.
- `src/diagrams/usecase/`: `parse.ts`, `patterns.ts`, `helpers.ts`, `ops.ts`, `index.ts`, unit tests.
- `src/diagrams/architecture/`: `parse.ts`, `patterns.ts`, `layout.ts`, `ops.ts`, `index.ts`, unit tests.
- `public/templates/`: `requirement.mmd`, `usecase.mmd`, `architecture.mmd`, `index.json`.
- `tests/fixtures/diagrams/`: `requirement.mmd`, `requirement.json`, `usecase.mmd`, `usecase.json`, `architecture.mmd`, `architecture.json`.
- `tests/e2e/`: `diagrams.spec.ts`, `diagram-edit.spec.ts`.

**Metrics & Verification:**
- All non-test TypeScript source files remain strictly under 300 lines (longest is `src/diagrams/usecase/parse.ts` at 249 lines).
- `npm test`: 94 test files, 558 unit tests passing.
- `npm run lint`: 0 warnings, 0 errors.
- `BASE_PATH=/gati-chitra/ npm run build`: successful production build.
- `BASE_PATH=/gati-chitra/ npm run check:dist`: Initial JS 131.22 KB gzip; largest lazy chunk 57.27 KB gzip; all diagram chunks ~2.8 - 3.4 KB gzip.
- `npm run test:e2e`: 350 passed, 17 skipped, 0 failed.

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
