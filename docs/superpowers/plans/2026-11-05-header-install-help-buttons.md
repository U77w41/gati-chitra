# Header Install and Help Buttons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate the Install and Help/Shortcuts buttons from the editor toolbar into the site header, equipping the Install button with a download icon and the Help button with a `?` icon and descriptive text.

**Architecture:** Update `ICONS` in `src/app/icons.ts` with compact `install` and `help` SVGs. Update `headerHtml()` in `src/app/chrome.ts` to include `#btn-install` and `#btn-help` within `.site-nav ul`, styled as `.site-nav-btn.nav-text-desktop` in `src/app/chrome.css`. Remove `#btn-help` and `#btn-install` from `#toolbar` in `index.html`. Wire event handlers via existing DOM selectors and verify initial JS bundle stays under the 150 KB gzip budget.

**Tech Stack:** TypeScript, CSS, Vite, Vitest, Playwright, Oxlint.

**Spec:** User request: "Add icon in the install bottom and add text in the help/shortcuts (?) bottom and put them in the header" with confirmed design in brainstorming turn.

## Global Constraints

- Non-test `.ts` files in `src/` must be strictly < 300 lines.
- Total initial JS gzip budget must stay <= 150.00 KB (`npm run check:dist`).
- Largest lazy chunk gzip budget must stay <= 80.00 KB (`npm run check:dist`).
- Zero linter warnings/errors (`npm run lint` using oxlint).
- All unit and e2e tests must pass (`npm test`, `npm run test:e2e`).
- Preserve `SECURITY.md` without modifications.
- Record decisions in `DECISIONS.md`.

## Review Focus

1. Mobile responsiveness: on screens <= 768px, `#btn-install` and `#btn-help` collapse their text labels and render as circular icon buttons, matching other nav items without overflowing header bounds.
2. Initial JS bundle size: check that adding SVG icons and markup does not exceed the 150.00 KB gzip budget across platforms.
3. Event handler continuity: verify that clicking `#btn-help` opens `#help-dialog` and clicking `#btn-install` triggers the PWA install prompt / message.
4. Standalone PWA mode: verify that `#btn-install` is hidden when running in standalone mode.
5. Contrast & accessibility: all buttons must have accessible labels (`aria-label`) and meet WCAG AA requirements.

---

### Task 1: Add install and help icons to `icons.ts` and update unit tests

**Files:**
- Modify: `src/app/icons.ts:13-32`
- Test: `src/app/brand.test.ts` or `src/app/chrome.test.ts`

- [x] **Step 1: Write test assertion for new icons in `src/app/chrome.test.ts`**
  Add assertions checking that `headerHtml()` includes the new `install` and `help` icons and button IDs `#btn-install` and `#btn-help`.
- [x] **Step 2: Run test to watch it fail**
  Run `npm test src/app/chrome.test.ts` and confirm failure.
- [x] **Step 3: Add `install` and `help` icons in `src/app/icons.ts`**
  Add compact SVG icon definitions:
  - `install`: arrow pointing down into a tray (`viewBox="0 0 24 24"`).
  - `help`: circle with `?` mark (`viewBox="0 0 24 24"`).
- [x] **Step 4: Verify `icons.ts` line count < 300**
  Run `wc -l src/app/icons.ts`.
- [x] **Step 5: Run unit tests**
  Run `npm test src/app/chrome.test.ts`.

---

### Task 2: Render `#btn-install` and `#btn-help` in `headerHtml()`, style them in `chrome.css`, and remove them from `#toolbar` in `index.html`

**Files:**
- Modify: `src/app/chrome.ts:20-75`
- Modify: `src/app/chrome.css:91-118, 166-185`
- Modify: `index.html:60-66`
- Modify: `src/app/chrome.test.ts`

- [x] **Step 1: Update `headerHtml()` in `src/app/chrome.ts`**
  Add `#btn-install` and `#btn-help` list items inside `.site-nav ul`:
  ```html
  <li>
    <button type="button" class="site-nav-btn nav-text-desktop" id="btn-install" title="Install Gati-chitra as an app" aria-label="Install Gati-chitra as an app">
      ${ICONS.install}
      <span class="nav-label">Install</span>
    </button>
  </li>
  <li>
    <button type="button" class="site-nav-btn nav-text-desktop" id="btn-help" title="Help and keyboard shortcuts (?)" aria-label="Help and keyboard shortcuts">
      ${ICONS.help}
      <span class="nav-label">Help</span>
    </button>
  </li>
  ```
- [x] **Step 2: Add `.site-nav-btn` styles in `src/app/chrome.css`**
  Style `.site-nav-btn` to match `.site-nav a` and `.menu-social-dropdown-toggle`:
  - Reset button defaults (border: 0, font: inherit, cursor: pointer, background: transparent).
  - Add hover & focus-visible styles.
  - On mobile (`@media (width <= 768px)`), apply circular icon button styles (`width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border)`), and hide `.nav-label`.
- [x] **Step 3: Remove `#btn-help` and `#btn-install` from `#toolbar` in `index.html`**
  Delete lines 62-63 from `index.html`.
- [x] **Step 4: Verify line counts and linting**
  Run `wc -l src/app/chrome.ts src/app/chrome.css index.html` and `npm run lint`.
- [x] **Step 5: Verify unit tests pass**
  Run `npm test`.

---

### Task 3: Verify bundle size budget and end-to-end tests

**Files:**
- Modify: `tests/e2e/chrome.spec.ts`
- Modify: `DECISIONS.md`

- [x] **Step 1: Add e2e assertion in `tests/e2e/chrome.spec.ts`**
  Verify `#btn-install` and `#btn-help` are visible in the header and clicking `#btn-help` opens `#help-dialog`.
- [x] **Step 2: Build and verify distribution check**
  Run `BASE_PATH=/gati-chitra/ VITE_SITE_URL=https://u77w41.github.io/gati-chitra/ VITE_SOURCE_URL=https://github.com/U77w41/gati-chitra npm run build && BASE_PATH=/gati-chitra/ npm run check:dist` to confirm initial JS gzip is <= 150.00 KB.
- [x] **Step 3: Run full e2e test suite**
  Run `npm run test:e2e`.
- [x] **Step 4: Update `DECISIONS.md`**
  Record the architectural choice for moving `#btn-install` and `#btn-help` to `#site-header`.
- [ ] **Step 5: Commit changes**
  Commit with message `feat: add icons and move install and help buttons to site header`.
- [ ] **Step 6: Push to `main` and watch CI deployment**
  Push and observe `gh run watch` to confirm live deployment.
