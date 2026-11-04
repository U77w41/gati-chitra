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

