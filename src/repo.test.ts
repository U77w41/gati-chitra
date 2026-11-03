import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const read = (p: string) => readFileSync(p, 'utf8');
const PLAN = 'docs/superpowers/plans/2026-11-02-gati-chitra.md';

it('has the three agent files, the custom security policy and the plan', () => {
  for (const f of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'SECURITY.md', PLAN]) expect(existsSync(f)).toBe(true);
});
it('AGENTS.md names both skills, the workflow skills, the install command and the plan', () => {
  const a = read('AGENTS.md');
  for (const t of ['superpowers', 'humanizer', 'brainstorming', 'writing-plans', 'executing-plans', 'test-driven-development',
    'systematic-debugging', 'verification-before-completion', 'npx skills add blader/humanizer', '.gitignore', PLAN]) expect(a).toContain(t);
});
it('CLAUDE.md imports AGENTS.md and has the Claude Code install commands', () => {
  const c = read('CLAUDE.md');
  for (const t of ['@AGENTS.md', '/plugin install superpowers@claude-plugins-official', '/plugin marketplace add blader/humanizer',
    '/plugin install humanizer@humanizer']) expect(c).toContain(t);
});
it('GEMINI.md imports AGENTS.md and has the Gemini CLI install commands', () => {
  const g = read('GEMINI.md');
  for (const t of ['@./AGENTS.md', 'gemini extensions install https://github.com/obra/superpowers', 'npx skills add blader/humanizer']) expect(g).toContain(t);
});
it('.gitignore keeps generated and local files out, and keeps the shared files in', () => {
  const lines = read('.gitignore').split('\n').map(l => l.trim());
  for (const need of ['node_modules/', 'dist/', 'playwright-report/', 'test-results/', '.env.local', '.DS_Store', '.worktrees/']) expect(lines).toContain(need);
  for (const never of ['.env', 'docs/', 'public/', 'AGENTS.md', 'CLAUDE.md', 'GEMINI.md', 'SECURITY.md', 'README.md']) expect(lines).not.toContain(never);
});
it('has a lint script, an engines field and a Node version file', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  expect(pkg.version).toBe('0.1.0');
  expect(pkg.engines.node).toBe('>=22');
  expect(pkg.scripts.lint).toContain('oxlint');
  expect(readFileSync('.nvmrc', 'utf8').trim()).toMatch(/^\d+$/);
});
it('points agents at the improvements plan', () => {
  expect(readFileSync('AGENTS.md', 'utf8')).toContain('docs/superpowers/plans/2026-11-03-gati-chitra-improvements.md');
});

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

it('every source file in src/ has fewer than 300 lines', () => {
  const files = walk('src');
  for (const f of files) {
    const count = read(f).split('\n').length;
    expect(count, `${f} has ${count} lines (expected < 300)`).toBeLessThan(300);
  }
});


