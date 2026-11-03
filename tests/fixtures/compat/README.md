# Mermaid Compatibility Fixtures

These 20 test diagrams are adapted from the official Mermaid documentation at https://mermaid.js.org/syntax/flowchart.html (MIT License).

Each `.mmd` file has a matching `.json` file that records the expected node, edge, and group counts.

1. `01-classic-shapes.mmd`: Node shapes supported by Mermaid syntax (rectangle, rounded, stadium, cylinder, circle, diamond, hexagon, parallelograms, subroutine).
2. `02-new-shapes.mmd`: Extended node shapes (trapezoids, double circle, asymmetric, document, small circle, framed circle, fork, text).
3. `03-arrow-forms.mmd`: Standard and bidirectional link types with solid, dotted, thick, and circle/cross terminations.
4. `04-link-length.mmd`: Arrow operators with explicit link lengths.
5. `05-invisible-links.mmd`: Invisible links (`~~~`) for controlling layout ranking.
6. `06-edge-animation.mmd`: Edge references with animation properties (`@{ animate, animation }`).
7. `07-ampersand-chains.mmd`: Multi-node linking with ampersand syntax.
8. `08-markdown-strings.mmd`: Markdown-formatted node and edge labels.
9. `09-entity-codes.mmd`: HTML entity codes decoded in labels.
10. `10-subgraph-direction.mmd`: Subgraphs specifying internal flow directions.
11. `11-arrows-to-subgraphs.mmd`: Edges connecting directly to a subgraph.
12. `12-click-links.mmd`: Interactive hyperlink bindings on nodes.
13. `13-comments-directives.mmd`: Flowchart directives and line comments.
14. `14-frontmatter-title.mmd`: YAML front matter block specifying diagram title.
15. `15-accessibility.mmd`: Accessible title and multi-line descriptions.
16. `16-styles-classes.mmd`: Default classDef styles, custom classes, node styles, and link styles.
17. `17-several-statements.mmd`: Multiple statements on a single line separated by semicolons.
18. `18-unicode-ids.mmd`: Node identifiers containing Unicode letters and hyphens.
19. `19-ci-pipeline.mmd`: Multi-stage continuous integration workflow diagram.
20. `20-login-flow.mmd`: User authentication and two-factor verification flowchart.
