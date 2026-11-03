# Security Policy

Gati-chitra runs entirely in your browser. There is no server, no account and no analytics. Your diagram files and edits are processed and rendered on your own machine and never uploaded.

Below: how to report a problem, what the app defends against, and where it can't.

## Reporting a vulnerability

Please don't open a public issue for security bugs.

Use GitHub's private reporting instead: **Security → Report a vulnerability** on this repository. If that isn't available to you, email u77w41+gatichitra@gmail.com with "Gati-chitra security" in the subject.

Helpful things to include:

- what an attacker can do, and what the victim has to do (open a link, import a file, click something)
- steps to reproduce, ideally a share link or sample Mermaid text
- the browser and version you tested in

I'll reply within 7 days and aim to ship a fix for anything High or Critical within 30. I'm happy to credit you in the release notes, or to leave you out if you'd rather.

## Supported versions

Only the live site at <https://u77w41.github.io/gati-chitra/> and the `main` branch get fixes. The app works offline after the first visit, so an old copy can stay cached. A normal reload picks up the new version.

## How the app treats your data

| What                  | Where it goes                                                                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Diagram text and edits| Browser memory only.                                                                                                                                                      |
| Share links           | The diagram is compressed into the part of the URL after `#`. Browsers don't send that part to any server, but it stays in your history and anywhere you paste the link. |
| Autosave and settings | Saved in plain text in this browser's `localStorage`.                                                                                                                     |

## What's in scope

- anything that runs script on the `u77w41.github.io` origin (XSS, a sanitizer bypass, a CSP bypass)
- a share link or export that can draw over the app, imitate its UI, or send data anywhere
- a crafted input that freezes or crashes the tab, beyond what its size would explain
- anything that leaks your diagrams off the device
- weaknesses in the build and deploy pipeline (dependencies, GitHub Actions)

## Built-in defences

- **Content Security Policy.** Scripts load only from this site. No inline scripts, no `eval`, no plugins.
- **Sanitised export.** Standalone SVG and HTML exports escape special characters.
- **Limits.** Text over 20,000 characters, 300 nodes, 600 edges are refused.
- **No remote dependencies at runtime.** No CDNs; font and libraries are bundled.
- **Pinned dependencies.** Exact versions only.

## Known limits

GitHub Pages can't send custom HTTP headers, so a few protections are out of reach:

- **Framing.** The site can't stop another page from loading it in a frame. There's no login and nothing to change, so the risk is low.
- **Inline styles.** Dynamic canvas and DOM styles are needed for diagram rendering.
