# Claude Code instructions for Gati-chitra

@AGENTS.md

The line above imports the shared instructions. If your session does not show them, open `AGENTS.md` and read it before you do anything else.

## Install the skills in Claude Code

Run these once per machine, inside a Claude Code session, then start a new session so the skills load.

- superpowers: `/plugin install superpowers@claude-plugins-official`. Alternative: `/plugin marketplace add obra/superpowers-marketplace`, then `/plugin install superpowers@superpowers-marketplace`.
- humanizer: `/plugin marketplace add blader/humanizer`, then `/plugin install humanizer@humanizer` (this needs Claude Code 2.1.142 or later). Without the plugin system: `npx skills add blader/humanizer --global`.

Check: run `/plugin` and confirm both are listed, or ask "Which skills can you use?" and confirm that `brainstorming`, `writing-plans`, `test-driven-development` and `humanizer` appear.

## Using them here

- Start every code or planning task by naming the skill: "Use the superpowers brainstorming skill, then writing-plans."
- Before you commit any README, docs page or wiki page, run the humanizer: `/humanizer:humanizer` followed by the file path. Keep commands, numbers and code blocks exactly as written. Leave the existing custom `SECURITY.md` untouched.
- Keep this file short. Shared rules belong in `AGENTS.md`.
