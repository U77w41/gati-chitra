# Agent instructions for Gati-chitra

These instructions apply to every AI coding agent that works in this repository. `CLAUDE.md` and `GEMINI.md` import this file and add the install steps for their own tool. Keep the three files in step: when a rule changes here, check the other two.

## 1. Read first

- The current build plan is `plan.md` (Tasks 64 to 103: more Mermaid diagram types). Read its "Start here" and Part 0 first.
- The build plan is `docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md` (v0.2 to v0.6, Tasks 24 to 60). Before you change anything, read its "Start here" section and its Part 0. If you are Gemini CLI, also read its "Running this plan with Gemini CLI" section.
- The first plan, `docs/superpowers/plans/2026-11-02-gati-chitra.md` (v0.1, Tasks 0 to 23, all done), is the reference for every contract the new plan does not change. Do not work from it.
- Work through the plan's tasks in order, one task at a time, with one commit per task and the commit message the plan gives.
- When the plan leaves something open, choose the simplest option and add one line to `DECISIONS.md` in the form `Task N: chose X because Y`.
- To find where you are: run `git log --oneline`, read `DECISIONS.md` and `handoff.md`, and continue with the first task in the plan that has no commit yet. Tick the checkboxes in the plan copy as you finish steps.
- `handoff.md` is the running state of the project for the next agent. Read it at the start of a session. At the end of every session that changes code or docs, update it: what changed, which files, which checks you ran and their results, and what is left open.
- A bug the user reports outside the plan (for example from a screenshot) is still a task: use `systematic-debugging` to find the root cause, then `test-driven-development` for the fix, add one line to `DECISIONS.md`, and record it in `handoff.md`.

## 2. Skills

Install both skills before you write any code or any document. Your tool's file (`CLAUDE.md` or `GEMINI.md`) has the exact commands, and section 6 below has the commands for other tools. Check that the skills are available, then use them as described here. If one cannot be installed (no network, or your tool has no skill support), say so in `DECISIONS.md` and follow Part 0 of the plan, which holds the same rules in short form. Do not skip the process silently.

### superpowers: for planning and for writing code

Use it every time you write or change code, and every time you write a plan, a spec or a design document.

- Before any new feature, behaviour change or new file: use `brainstorming`. The build plan already holds the design, so keep it short and settle only what the plan leaves open.
- To write a plan or spec: use `writing-plans`.
- To carry out a plan: use `executing-plans`, or `subagent-driven-development` if your tool can start sub-agents.
- For every feature and bug fix: use `test-driven-development`. Write the test, watch it fail, then write the code.
- For a bug, a failing test or any surprise: use `systematic-debugging` before you propose a fix.
- Before you say that work is done, fixed or passing: use `verification-before-completion`. Run the command and read its output first.
- Before merging: `requesting-code-review`. When you receive review comments: `receiving-code-review`.
- When a branch is finished: `finishing-a-development-branch`.

If a skill and the build plan disagree, the plan's Part 2 constants and the task's Interfaces block win (Part 0, rule 7). Add a line to `DECISIONS.md`.

### humanizer: for writing that people will read

Use it on every piece of prose you write or edit before you commit it: `README.md`, pages in `docs/`, wiki pages, `CONTRIBUTING.md`, release notes, changelog entries and pull request descriptions. (`SECURITY.md` already contains the author's custom security policy — preserve it as-is and do not overwrite it.)

1. Write the draft, with every fact, number and command correct first.
2. Run the skill on the file, for example by asking "Humanize the prose in README.md". In Claude Code the command is `/humanizer:humanizer`.
3. Read the result. Keep the meaning, and keep the voice plain and specific. If it changed a command, a number, a path, a version or a code block, restore the original.

Do not run it on code, tests, configuration files, generated files, the build plan itself, or text that must stay word for word (licences, standards, quoted error messages).

## 3. Writing rules

- Say what the thing does, in short concrete sentences. No filler, no hype, no emoji.
- Use the exact names, paths and commands from the build plan.
- Comments in code explain why, never what.

## 4. Commands

- `npm test`: unit tests.
- `npm run build`: type check and production build.
- `npm run check:dist`: checks the built site (icons, sizes, base path).
- `npm run test:e2e`: browser tests.

Run `npm test` after every task. Run the other three before you finish a task that changes the page.

## 5. Git hygiene

- `.gitignore` must exist from the first commit. It keeps out `node_modules/`, `dist/`, test output, local environment files (`.env.local`), editor and system files, and each tool's local state. Never commit secrets. `.env` holds only public defaults and is committed.
- If you add a new kind of generated or local file, add it to `.gitignore` in the same commit.
- The plan (`docs/superpowers/plans/`), `DECISIONS.md`, `handoff.md`, `README.md` and the existing custom `SECURITY.md` are committed.
- Commit and push only when the user asks. If the user says not to commit or push, leave every change in the working tree, even where the plan says "one commit per task", and say in `handoff.md` that the changes are uncommitted. Never push to GitHub without an explicit request.

## 6. Install commands for tools without their own file

- Codex (CLI): open `/plugins`, search for `superpowers`, choose Install Plugin. Codex reads this file directly.
- Cursor: `/add-plugin superpowers` in Agent chat. Cursor reads this file directly.
- Any tool, for humanizer: `npx skills add blader/humanizer --global` (use `--global` so the installer does not drop untracked files into the repository; add `--agent '*'` to install it for every tool the installer supports). Update later with `npx skills update humanizer`.
- Anything else: follow the project pages https://github.com/obra/superpowers and https://github.com/blader/humanizer.
