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
