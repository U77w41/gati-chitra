# Release Checklist

Tick every box before the release tag.

## Setup (Task 0)

- [x] `AGENTS.md`, `CLAUDE.md` and `GEMINI.md` exist, and `src/repo.test.ts` passes.
- [x] The superpowers and humanizer skills are installed in the tool you used, and the agent can list them.
- [x] `.gitignore` exists, and `git ls-files` shows no file under `node_modules/` or `dist/`.
- [x] `README.md` went through the humanizer (with every command, number and path in it still correct), and the custom `SECURITY.md` is preserved intact.

## Automated (run from a clean checkout)

- [x] `npm ci` succeeds.
- [x] `npm test` passes.
- [x] `npm run build` passes with no type errors.
- [x] `npm run check:dist` passes, also with `BASE_PATH=/gati-chitra/` after building with it.
- [x] `npm run test:e2e` passes.
- [x] `git status` is clean; every task has its own commit; `DECISIONS.md` is reviewed.

## Features, tested by hand on the running site

- [x] F1: typing updates the picture within about a quarter of a second.
- [x] F2: every diagram in Part 8 behaves as its row says.
- [x] F3: add `click A "https://x"` and a `%%` comment to a diagram, then drag one node and rename another: the click line and the comment are unchanged and in the same place.
- [x] F4: a dragged node stays put; Auto-layout clears the pins and the diagram re-flows.
- [x] F5: move, connect, add (toolbar, double-click, drop an arrow on empty space), rename in place, delete, change shape, change colours, change arrow style, reverse an arrow, and undo and redo each of them.
- [x] F6: break the text; the last picture stays and the errors list line numbers; fix the text and editing works again.
- [x] F7: all four animation styles, speed, density, glow and pause behave.
- [x] F8: all four themes look right.
- [x] F9: wheel zoom, Space-drag pan and Fit work.
- [x] F10: present mode steps forward and back, and exits with Escape.
- [x] F11: PNG at 1x, 2x and 3x, transparent and themed background, content and slide frames all save and open.
- [x] F12: the SVG opens in a browser; text with `&` and `<` is correct; if you have a vector editor or slide tool, open it there and note the result in `DECISIONS.md`.
- [x] F13: the GIF loops and plays; try it in a slide tool if you have one.
- [x] F14: an MP4 or WebM plays; with the encoder disabled, the GIF fallback and message appear.
- [x] F15: Save and Open of `.mmd` files work; reloading restores the last diagram.
- [x] F16: a share link opens the same diagram in a fresh tab; all five templates load.
- [x] F17: after the page has loaded, switch the network off: editing and PNG and SVG saving still work.
- [x] F18: the deployed site works under its sub-path, including templates and a share link.
- [x] F19: every shortcut in the Task 19 table works.
- [x] F20: the whole page can be used with the keyboard alone; reduced-motion starts paused; buttons have names a screen reader can read.
- [x] F21: the favicon shows in the browser tab with a light and with a dark browser theme; the header logo is visible in both page schemes; `public/favicon.svg` opened on its own matches the supplied artwork.
- [x] F22: open https://u77w41.github.io/diff-checker/ next to the site, in light and in dark: the header (72 px, logo, name, round toggle, navigation), the footer (copyright line and links), the colours and the font match. The toggle works and remembers the choice, returns to "follow the system" on the second press when that matches the system, and the choice carries over between the two sites. In a narrow window the header becomes two rows with round icon buttons.

## Browsers

- [x] Chrome or Edge: load, edit, drag, export PNG, SVG, GIF and video.
- [x] Firefox: load, edit, drag, export PNG, SVG and GIF (video if it is supported).
- [x] Safari: load, edit, drag, export PNG, SVG and GIF (video if it is supported).

## Release

- [x] The site is deployed by the workflow and the Pages source is set to GitHub Actions.
- [x] The tag `v0.1.0` exists.

## v0.2.0

- [x] Automated, in Chromium, Firefox and WebKit.
- [x] `check:dist` reports initial JS of 150 KB gzip or less, and a largest lazy chunk of 80 KB gzip or less. Both numbers are in `DECISIONS.md`.
- [ ] By hand: `subgraph X` nested inside `subgraph X` shows a warning, and editing continues.
- [ ] By hand: Tab to every toolbar button and footer link and press Enter; each one acts.
- [ ] By hand: open a share link over an existing diagram, then press Ctrl+Z; your diagram is back.
- [ ] By hand: with two tabs open, an edit in one appears in the other.
- [ ] By hand: a paused, idle tab uses close to no CPU (browser task manager).
- [x] The first workflow run on `main` deploys, and the site works under `/gati-chitra/`.

## v0.3.0

- [x] Automated.
- [ ] Paste five flowcharts you use from GitHub READMEs or docs. Each draws with no warning, or the warning is about something under "Not supported".
- [ ] All 10 new shapes and 5 new arrow kinds look right in all four themes, on canvas, in PNG and in SVG.
- [ ] Bold and italic labels show on canvas and in PNG, SVG and GIF.
- [ ] An SVG with `click` links opens in a browser; the links work, and `_blank` opens a new tab.
- [ ] `direction LR` inside a TB chart lays out sideways; with an arrow to the outside, the info note appears.
- [x] The README syntax list matches what the parser reads.

## v0.4.0

- [x] Automated, including `axe.spec.ts`.
- [ ] Keyboard only: build a three-node diagram with two arrows, rename one node, nudge one, and save a PNG, without touching the mouse.
- [ ] VoiceOver (macOS) or NVDA (Windows): toolbar groups, the editor, the canvas selection announcements and the diagnostics are all read.
- [ ] Type, drag, rename, then press Ctrl+Z three times, alternating between the editor and the page; each step restores the exact earlier text.
- [ ] Copy PNG pastes into a document or slide app; Copy SVG pastes as text.
- [ ] The panel split is remembered after a reload.

## v0.5.0

- [x] Automated, including `offline.spec.ts`.
- [ ] In Chrome or Edge on the deployed site, the install option appears. The installed app opens in its own window, and opening a `.mmd` file with it loads the file.
- [ ] Load the deployed site once, go offline and reload. Editing and saving PNG, SVG, GIF and video still work.
- [ ] Deploy a change while a tab is open. "A new version is available" appears, and Reload brings in the new version.
- [ ] Paste the site URL into a messaging app; the 1200x630 card shows.
- [ ] `https://u77w41.github.io/gati-chitra/does-not-exist` shows the 404 page with a working link back.
- [ ] Optional, by the owner: check the JSON-LD with Google's Rich Results Test, and submit `sitemap.xml` in Google Search Console.

## v0.6.0

- [x] Automated, in all five Playwright projects.
- [ ] On a real Android phone (Chrome) and a real iPhone (Safari):
  - [ ] tabs and the More menu
  - [ ] move a node, pan, pinch zoom
  - [ ] long press opens the sheet
  - [ ] double tap adds a node
  - [ ] rename with the on-screen keyboard
  - [ ] Save as PNG opens the share sheet
- [ ] Rotating the phone keeps the layout usable, with no sideways scrolling.
- [ ] On desktop, quickly repeat the v0.4.0 keyboard and mouse checks; nothing has changed there.

## v0.9.0 (D1)

- [x] `npm test`, `npm run lint`, `npm run build`, `npm run check:dist`, `npm run test:e2e` all pass.
- [x] Initial JS ≤ 150 KB gzip (write the number in `handoff.md`).
- [ ] By hand: every template in the gallery still opens and animates exactly as before, in light and dark mode.
- [ ] By hand: typing `pie title Pets` shows "Pie chart is not supported yet…" on line 1, and the last picture stays.

## v0.10.0 (D2)

For each type the milestone adds (state, class, er):

- [x] The automated checks above pass; the new engine chunks are listed by `check:dist`, each ≤ 80 KB gzip.
- [ ] By hand: the type's template opens from the gallery and draws.
- [ ] By hand: all five animation styles (pulse, traffic, dash, build, typewriter) run on it; Pause stops and Play continues from the same frame.
- [ ] By hand: switching three themes (one light, one dark, one with a gradient) and the four shading modes recolours nodes, edges and decorations; nothing becomes unreadable.
- [ ] By hand: PNG, SVG and GIF exports match the canvas (no grid, no missing decorations).
- [ ] By hand: present mode steps through the diagram in a sensible order.
- [ ] By hand: double-click rename, Delete, Add node and (where the type allows) drag and connect all change the text, and Undo restores it.
- [ ] By hand: on a phone, the Diagram tab shows the type and pinch zoom works.
- [ ] By hand, deployed site: load the site, go offline, reload, and open the new type for the first time from a template; it draws (the chunk was precached).

## v0.11.0 (D3)

For each type the milestone adds (requirement, usecase, architecture):

- [x] The automated checks above pass; the new engine chunks are listed by `check:dist`, each ≤ 80 KB gzip.
- [ ] By hand: the type's template opens from the gallery and draws.
- [ ] By hand: all five animation styles (pulse, traffic, dash, build, typewriter) run on it; Pause stops and Play continues from the same frame.
- [ ] By hand: switching three themes (one light, one dark, one with a gradient) and the four shading modes recolours nodes, edges and decorations; nothing becomes unreadable.
- [ ] By hand: PNG, SVG and GIF exports match the canvas (no grid, no missing decorations).
- [ ] By hand: present mode steps through the diagram in a sensible order.
- [ ] By hand: double-click rename, Delete, Add node and (where the type allows) drag and connect all change the text, and Undo restores it.
- [ ] By hand: on a phone, the Diagram tab shows the type and pinch zoom works.
- [ ] By hand, deployed site: load the site, go offline, reload, and open the new type for the first time from a template; it draws (the chunk was precached).





