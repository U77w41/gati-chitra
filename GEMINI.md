# Gemini CLI instructions for Gati-chitra

@./AGENTS.md

The line above imports the shared instructions. Run `/memory show` to confirm that the content of `AGENTS.md` is loaded. If it is not, run `/memory reload` (needed when the files were created during this session), or open `AGENTS.md` and read it before you do anything else. Do not also list `AGENTS.md` in the `context.fileName` setting: this file already imports it, and it would load twice.

## Install the skills in Gemini CLI

Run these once per machine, in a terminal, then start a new Gemini CLI session.

- superpowers: `gemini extensions install https://github.com/obra/superpowers`. Update later with `gemini extensions update superpowers`.
- humanizer: `npx skills add blader/humanizer --global`. Add `--agent '*'` to install it for every tool the installer supports.

Check: ask "Which skills can you use?" and confirm that `brainstorming`, `writing-plans`, `test-driven-development` and `humanizer` appear.

## Using them here

- Start every code or planning task by naming the skill: "Use the superpowers brainstorming skill, then writing-plans."
- Before you commit any README, docs page or wiki page, ask for the humanizer: "Humanize the prose in README.md." Keep commands, numbers and code blocks exactly as written. Leave the existing custom `SECURITY.md` untouched.
- At the end of a session that changed anything, update `handoff.md` (see `AGENTS.md` section 1). Do not commit or push unless the user asks.
- Keep this file short. Shared rules belong in `AGENTS.md`.
