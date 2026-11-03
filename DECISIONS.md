# Decisions

Task 1: chose to provide SECURITY.md adapted from author's sibling projects (diff-checker) because SECURITY.md was missing in the initial repository clone.
Task 9: chose to split polygon math into polygon.ts to keep geometry.ts under 300 lines.
Task 10: chose to split node-path, style, and draw-edges into helper files to keep draw.ts under 300 lines.
Task 12: chose to split download helper and studio API into download.ts and studio.ts to keep ui.ts under 300 lines.
Task 13: chose to split canvas event wiring, anim controls, and render loop into helper files to keep ui.ts under 300 lines.
Task 14: chose to split inline editor, node creator, and toolbar wiring into helper files to keep ui.ts under 300 lines.
Task 16: SVG root uses system-ui font stack with presentation attributes; browser verification and vector rendering confirmed text rendering and font metrics preserved without external font dependencies.
Task 17: GIF export of default sample diagram took ~0.85s (well under 15s budget); verified that gifenc delays operate in milliseconds and parseGif validates centiseconds in GIF format.
Task 18: chose to split editor event dispatching into dispatcher.ts, gallery into gallery.ts, and share handling into share-handler.ts to keep ui.ts under 300 lines.
