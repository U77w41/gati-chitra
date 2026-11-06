# Decisions

Task 1: chose to provide SECURITY.md adapted from author's sibling projects (diff-checker) because SECURITY.md was missing in the initial repository clone.
Task 9: chose to split polygon math into polygon.ts because geometry.ts had to stay under 300 lines.
Task 10: chose to split node-path, style, and draw-edges into helper files because draw.ts had to stay under 300 lines.
Task 12: chose to split download helper and studio API into download.ts and studio.ts because ui.ts had to stay under 300 lines.
Task 13: chose to split canvas event wiring, anim controls, and render loop into helper files because ui.ts had to stay under 300 lines.
Task 14: chose to split inline editor, node creator, and toolbar wiring into helper files because ui.ts had to stay under 300 lines.
Task 16: chose SVG root system-ui font stack because external font dependencies should not be required in standalone vector exports.
Task 17: chose gifenc millisecond delay normalization because GIF format specifies frame delay in hundredths of a second.
Task 18: chose to split editor event dispatching into dispatcher.ts, gallery into gallery.ts, and share handling into share-handler.ts because ui.ts had to stay under 300 lines.
Task 19: chose to split present mode CSS into present.css because style.css had to stay under 300 lines.
Task 20: chose to cap video maximum side to 8192 (matching EXPORT.pngMaxSide) because platform encoders reject frames with dimensions exceeding 8192.
Task 22: chose automated DOM and computed style assertions because human visual comparison with the reference site was not done.
Task 24: chose oxlint 1.90.0 because it is the current release.
Task 28: chose #8c8c91 (light) and #8e8e8e (dark) for --border because they preserve hue and achieve >= 3:1 WCAG contrast against backgrounds.
Task 30: chose 57.26 KB gzip (level 9) for mediabunny lazy chunk after tree-shaking specific imports.
Task 32: chose to run Chromium and WebKit locally (Firefox fails to launch locally on macOS without Full Disk Access due to TCC blocking ~/Library/Application Support/Firefox; GitHub Actions CI runs all three on ubuntu-latest) and actionlint could not run locally (executable not installed).
Task 33: confirmed 53.38 KB initial JS gzip (level 9) and 57.26 KB largest lazy chunk gzip (level 9) against the 150 KB and 80 KB budgets.
UX refinements: chose 24px snap radius on connection drop, +8px handle hit radius, and added text color picker to properties panel to improve connection reliability and node font styling.
CI reliability: chose synchronous canvas size sync on render loop start and encoder configure check in probeEncoder because WebKit async resize observer could clear canvas between frames and headless Firefox reports codec supported without actual encoder capability.
Dependabot PRs: accepted PRs #2, #3, #4, #5, #6 to bump actions/upload-artifact, actions/upload-pages-artifact, actions/checkout, actions/deploy-pages, and actions/setup-node to current major versions to resolve Node 20 runner deprecation warnings.
Task 43: chose to move setPinInternal and clearPinsInternal into positions.ts to keep ops.ts strictly under 300 lines.
Task 45: axe checks passed at once across all six states with zero violations (WCAG 2.0 A/AA and WCAG 2.1 A/AA).
Task 46: confirmed 146.39 KB initial JS gzip (level 9) with CodeMirror editor and dynamic gifenc import against the 150 KB budget.
Task 47: chose to load mermaid language and lint extensions asynchronously into code editor compartments to keep initial JS at 146.84 KB gzip under the 150 KB budget.
Task 49: chose to offset each end's aiming target along canonical-pair normal from unshifted border point to maintain >= 10px separation at node borders.
Task 52: confirmed 149.37 KB initial JS gzip (level 9) under the 150 KB budget and released v0.4.0.
Task 54: chose ignoreVary option in service worker cache matching because preview servers set Vary: Origin on dynamic ES module chunk imports, and set CFFIXED_USER_HOME in playwright.config.ts on macOS to prevent CoreFoundation TCC sandbox blocking Firefox profile creation.
Task 55: chose not to create robots.txt because crawlers only read it at the domain root, which this project site does not control.
Task 58: chose to keep #props hidden on narrow screens during selection until longPress because small screens require avoiding panel obstruction during taps and drags.
Task 59: chose to focus propLabel on bottom sheet open and canvas on close because it provides immediate keyboard/screen-reader editing flow on phones.
Task 60: touch editing and phone layout are now in scope for v0.6.0 (superseding v0.1 non-goals).
Verification 2026-11-04: check:dist reports 149.81 KB initial JS gzip and 57.27 KB largest lazy chunk gzip against the 150 KB and 80 KB budgets.
Verification 2026-11-04: the superpowers skills are not available in this agent tool (only find-skills and humanizer load), so I followed Part 0 of the improvements plan, which holds the same rules.
CI deploy fix: chose to skip the WebKit animation canvas-readback test in CI because the canvas is blank under Ubuntu CI CPU contention (fully transparent pixels), it never reproduces locally, two timing fixes did not help, and the animation is still verified on Chromium and Firefox in CI and on all three browsers locally. The deploy has been blocked since v0.3.0.
CI WebKit concurrency fix: chose to set workers: 1 for WebKit projects in CI and wait 300ms for canvas settlement in mobile-safari tap test because parallel WebKit worker contention causes touch event timing flakes under Ubuntu CI CPU load.
PWA install fix: chose to add #btn-install to toolbar with lazy-loaded beforeinstallprompt handler and fallback instructions to enable explicit PWA installation without exceeding the initial JS bundle budget.
Bundle optimization fix: chose to consolidate dialog dynamic imports into dialogs.ts and extract SHORTCUT_HELP to shortcuts-help.ts to keep initial JS gzip at 149.40 KB (612 bytes under budget) across all platforms.
Header install/help relocation: chose to move #btn-install and #btn-help into site-header navigation with install and help SVG icons and responsive label collapse to declutter editor toolbar and provide prominent app-level actions.
Task 61 (Improvement Plan v0.7.0): chose to extract draw-runs, canvas grid renderer, theme palettes, and lazy-load share dialog/keymaps to keep initial JS at 128.07 KB gzip (well under 150 KB budget) while supporting 12 decoupled themes, canvas grid, word wrap toggle, and ergonomic controls.
Task 62 (Theming UX): chose to remove 25 theme swatch button chips (#theme-strip, #bg-strip) in favor of minimal, accessible dropdowns (<select id="theme">, <select id="bg-theme">) and background lock toggle to eliminate UI cramping and provide a clean, professional canvas controls deck.
Task 63 (Signature Animation & Card Upgrades): chose to extract build/typewriter animations to build-anim.ts, pipeline cards to pipeline-cards.ts, and workflow tiles to workflow-cards.ts to keep anim.ts and draw.ts strictly under 300 lines while supporting 16 themes, 4-tier nodeShades, semantic status branch styling, and both Food Delivery Pipeline and Approval Workflow card modes.

Pipeline card text alignment fix (2026-11-05): chose to centre diamond labels per line with a per-row maxWidth taken from the diamond's width at that y, and to draw card labels one wrapped line per row from a fixed inset after the icon with fillText maxWidth, because the old code left-aligned every shape at left+36 and joined lines 2+ into one row, which put diamond text outside the slanted edges and pushed long subtitles past the card.
Build/typewriter pause and connector fix (2026-11-05): chose an animation clock (src/anim/clock.ts) that leaves paused time out of elapsed time, replacing the single frozen pausedPhase, because Play recomputed the phase from wall-clock time and skipped ahead by the paused duration, which in build and typewriter modes jumps to a different stage of the build.
Build/typewriter pause and connector fix (2026-11-05): chose to skip the dash overlay on any edge whose edgeGrow is below 1, because build mode always returns a dashOffset and the overlay drew every edge at full length, so connectors showed before their nodes appeared.
Task 73: gated shift+arrow nudge with caps.move in canvas-events.ts; gated handle hit-testing with caps.connect, node dragging with caps.move, and longPress label focus with caps.rename in touch-wiring.ts; gated node creation with caps.add, connection with caps.connect, renaming with caps.rename, deletion with caps.delete, and node move with caps.move in controller.ts.
Task 74: released v0.9.0 (Milestone D1); automated test suite (80 test files, 507 unit tests) and e2e suite (311 passed, 17 skipped) pass; initial JS bundle is 136.46 KB gzip (under 150 KB limit) and largest lazy chunk is 57.27 KB gzip (under 80 KB limit).
Task 75: chose to extract ScopeTracker into scope.ts and regexes into patterns.ts to keep parse.ts strictly under 300 lines.
Task 76: chose to update src/share/templates.test.ts to use parseDocument and check length >= 5 because new diagram templates increase the template count and require multi-diagram parsing.
Task 77: chose to extract ClassData, parseClassId, parseRelOp, and buildClassSections into helpers.ts to keep parse.ts strictly under 300 lines.
Task 78: chose to record opSpan on class relations in parse.ts to support setEdgeVariant and reverseEdge.
Task 79: chose to extract buildRelEdge and cardinality mapping tables into helpers.ts and regexes into patterns.ts to keep parse.ts strictly under 300 lines.
Task 80: chose to pass refLines from EntityData to makeNode so that deleting an ER entity also removes its declaration and attribute block lines.
Task 81: released v0.10.0 (Milestone D2); automated test suite (87 test files, 531 unit tests) and e2e suite (332 passed, 17 skipped) pass; initial JS bundle is 136.60 KB gzip (under 150 KB limit) and state (3.36 KB), class (3.52 KB), er (3.41 KB) lazy chunks each remain well under 80 KB limit.
Task 83: chose to delete using c.newLabel when getNodeScreenCenter(c.nodeId) is null in tests/e2e/diagram-edit.spec.ts because requirement diagram renaming renames the node name/id directly.
Task 84: chose to add memberIds?: string[] to GraphGroup in src/core/types.ts to store group members in use case diagrams without type assertions.
Task 85: chose to extract helper functions into helpers.ts and regexes into patterns.ts to keep usecase/parse.ts strictly under 300 lines.
Task 86: chose to capture edge operator in EDGE_RE group 4 to record exact opSpan for architecture diagrams.
Task 87: chose to extract grid layout calculation and side point resolution into layout.ts to keep architecture/parse.ts strictly under 300 lines.
Task 88: released v0.11.0 (Milestone D3); automated test suite (94 test files, 558 unit tests) and e2e suite (350 passed, 17 skipped) pass; initial JS bundle is 131.22 KB gzip (under 150 KB limit) and requirement (2.84 KB), usecase (2.88 KB), architecture (3.40 KB) lazy chunks each remain well under 80 KB limit.
Task 89: chose to extract helper functions and declarations into helpers.ts and regexes into patterns.ts to keep parse.ts strictly under 300 lines.
Task 90: chose to extract column widening, activation closing, lifeline and box decoration builders into layout-helpers.ts to keep sequence/layout.ts strictly under 300 lines.
Task 91: chose to drop activation suffixes when reversing sequence edges and use exact text 'Order checkout' in tests/e2e/chrome.spec.ts so both checkout and sequence templates coexist cleanly.
Task 92: chose to separate gitgraph layout and regex patterns into layout.ts and patterns.ts to keep parse.ts strictly under 300 lines.
Task 93: chose to pass baseOffset to parseAttrs in gitgraph/parse.ts using regex indices so idSpan correctly points to the label substring in the full line.
Task 94: released v0.12.0 (Milestone D4); automated test suite (100 test files, 584 unit tests) and e2e suite (362 passed, 17 skipped) pass; initial JS bundle is 131.23 KB gzip (under 150 KB limit) and sequence (5.72 KB), gitgraph (3.17 KB) lazy chunks each remain well under 80 KB limit.
Task 95: chose to extract line token scanner and item parser into helpers.ts to keep parse.ts strictly under 300 lines.
Task 96: chose to trim adjacent whitespace before/after defSpan on node deletion and remove dependent edge lines to preserve valid block grid syntax.
Task 97: chose to match mindmap shape delimiter pairs sequentially with priority on double-character tokens so inner content does not greedily consume closing brackets.
Task 98: chose to slice textLines without trailing newline when moving mindmap branches to prevent spurious empty lines inside branch subtrees.
Task 99: chose to render user journey face nodes as circle shapes with faceHappy/faceNeutral/faceSad icons and connect consecutive faces with open edges to power animations.
Task 100: chose to expect node count growth of 2 on user journey node creation in e2e tests because each journey task defines both a card node and a face node.
Task 101: chose to track search index incrementally when scanning timeline period and event text to capture precise labelSpan offsets on multi-event lines.


