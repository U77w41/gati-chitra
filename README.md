<p align="center">
  <img src="public/favicon.svg" alt="Gati-chitra logo" width="64">
</p>

# Gati-chitra

Gati-chitra is an interactive Mermaid flowchart editor that animates edges in real time and runs entirely in your web browser. You can type Mermaid syntax, drag nodes to adjust the layout, and export the diagram as a PNG, static SVG, animated GIF, or video without sending any data to a remote server.

## Run locally

Install dependencies and start the local development server:

```bash
npm install
npm run dev
```

Run the automated test suites:

```bash
npm test            # Run unit tests
npm run build       # Type check and bundle for production
npm run check:dist  # Verify build integrity, assets, and bundle budget
npm run test:e2e     # Run end-to-end browser tests
```

## Supported Mermaid syntax

Gati-chitra parses standard flowchart declarations:

- Direction headers: `flowchart TD`, `flowchart LR`, `flowchart BT`, `flowchart RL`, and `graph` equivalents.
- Node definitions and shapes: rectangle `[text]`, rounded `(text)`, stadium `([text])`, circle `((text))`, diamond `{text}`, hexagon `{{text}}`, parallelogram `[/text/]`, reversed parallelogram `[\text\]`, cylinder `[(text)]`, and subroutine `[[text]]`.
- Arrow connections: solid arrows `-->`, lines `---`, dotted arrows `-.->`, dotted lines `-.-`, thick arrows `==>`, thick lines `===`, circle ends `--o`, cross ends `--x`, and bidirectional arrows `<-->`.
- Edge labels: `-->|label|` or `-- label -->`.
- Node chaining: `A --> B --> C`.
- Subgraphs: `subgraph Title ... end`.
- Styling: `classDef`, `class`, inline `style`, and `linkStyle`.
- Comments: lines beginning with `%%`.

Lines with syntax that Gati-chitra does not understand are preserved in the text editor during graphical edits.

## Keyboard shortcuts

The table below lists the available keyboard shortcuts:

| Shortcut | Action |
| --- | --- |
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Y` / `Cmd+Y` / `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |
| `f` | Fit diagram to viewport |
| `+` / `=` | Zoom in (1.25x) |
| `-` | Zoom out (0.8x) |
| `p` | Toggle present mode |
| `Space` | Toggle pause or play animation |
| `Delete` / `Backspace` | Delete selected node or edge |
| `Enter` | Rename selected node |
| `Escape` | Close dialog or exit present mode |

Keyboard shortcuts do not trigger while typing in text inputs or textareas.

## Limits

Gati-chitra sets limits to ensure dependable browser performance:

- Maximum source text length: 20,000 characters
- Maximum nodes: 300
- Maximum edges: 600
- Zoom range: 0.2x to 5.0x
- Maximum export side length: 8,192 pixels
- Maximum export canvas area: 16,000,000 pixels
- Export frame rates: 10 to 25 fps
- Export loop counts: 1 to 5 loops

## Saving

You can export diagrams in multiple formats:

- **PNG**: Bitmap raster export with 1x, 2x, or 3x scaling and optional transparent background.
- **SVG**: Standalone static vector graphic with inline font and geometry metadata.
- **GIF**: Animated GIF rendered with optimized global palette quantization.
- **MP4 / WebM**: Hardware-accelerated video using the WebCodecs API, with automatic fallback to GIF when video encoding is unavailable.

Node coordinates repositioned by dragging are saved directly into the Mermaid source using `%% studio:pos <id> <x> <y>` comment annotations. Other Mermaid renderers safely ignore these comment lines.

## Privacy

Gati-chitra processes all diagrams locally in your browser. It does not use server endpoints, cookies, analytics, or third-party tracking. Share links encode the full diagram text directly inside the URL hash fragment (`#v1=...`), which web browsers do not transmit to web servers.

## Branding

The site branding includes:

- The logo and favicon are defined in `public/favicon.svg`.
- The site name, owner metadata, and external navigation links are defined in `BRAND` in `src/core/constants.ts` and in `index.html`.
- Theme tokens in `src/app/tokens.css` match the colour system of the author's Diff Checker site.
- The UI font is Lato, bundled locally via `@fontsource/lato`.

## Working with AI agents

Repository instructions for AI coding assistants are maintained in `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md`. These files specify installation and configuration for the `superpowers` development skills and the `humanizer` prose editing skill.

## Known limitations

- Subgraphs and node groups are edited directly in the Mermaid text rather than on the interactive canvas.
- Source statements should be formatted one per line.
- Only flowchart diagrams are supported.
