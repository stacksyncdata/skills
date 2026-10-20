import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { REPOSITORY_ROOT } from '../lib/skill-files.mjs';

export function createRepository(skillTextsByPath) {
  const repositoryRoot = mkdtempSync(join(tmpdir(), 'stacksync-skills-test-'));
  for (const [relativePath, text] of Object.entries(skillTextsByPath)) {
    const filePath = join(repositoryRoot, relativePath);
    mkdirSync(join(filePath, '..'), { recursive: true });
    writeFileSync(filePath, text);
  }
  return repositoryRoot;
}

export function buildSkillText({
  name = 'building-syncs',
  description = 'Create and fix two way syncs. Use when records must stay equal between two apps.',
  metadataLines = ['type: guide', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"', 'tools: syncs_list syncs_get'],
  body = '## When to use\n\nWhen someone wants records kept equal.\n',
} = {}) {
  const metadata = metadataLines.map((line) => `  ${line}`).join('\n');
  return `---\nname: ${name}\ndescription: ${description}\nlicense: Apache-2.0\nmetadata:\n${metadata}\n---\n${body}`;
}

// A playbook or use case is checked against data/apps.json and the fixed "Before you start" block,
// so a test repository for one gets copies of the real files.
const RULE_FILES = ['data/apps.json', 'templates/usecase/before-you-start.md'];
const FIXTURE_USECASE_FOLDER = join(REPOSITORY_ROOT, 'scripts/test/fixtures/shopify-to-netsuite-orders');

export const fixtureUseCaseText = readFileSync(join(FIXTURE_USECASE_FOLDER, 'SKILL.md'), 'utf8');
export const fixtureEvalsText = readFileSync(join(FIXTURE_USECASE_FOLDER, 'evals/evals.json'), 'utf8');
export const fixtureReferenceText = readFileSync(join(REPOSITORY_ROOT, 'scripts/test/fixtures/references/flow-json.md'), 'utf8');
export const playbookTemplateText = readFileSync(join(REPOSITORY_ROOT, 'templates/playbook/SKILL.md'), 'utf8');

export function createRepositoryWithRules(textsByPath) {
  const ruleTexts = Object.fromEntries(RULE_FILES.map((path) => [path, readFileSync(join(REPOSITORY_ROOT, path), 'utf8')]));
  return createRepository({ ...ruleTexts, ...textsByPath });
}

// The template with its guidance comments removed, so it reads like a published playbook.
export function buildPlaybookText(name = 'high-volume-changes-through-a-queue') {
  return playbookTemplateText.replace('name: playbook\n', `name: ${name}\n`).replace(/<!--[\s\S]*?-->\n\n/g, '');
}
