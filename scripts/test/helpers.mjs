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

export const RUNBOOK_BODY = [
  '## Use it when', '', 'Someone is new.', '',
  '## Before you start', '', 'Connect the MCP.', '',
  '## Steps', '', '1. Call `workspaces_list`.', '   Check: the workspace is listed.', '',
  '## Rules', '', 'Ask before every change.', '',
  '## When the MCP cannot do it', '', 'Roles: do this in the web app.', '',
].join('\n');

export function buildSkillText({
  name = 'getting-started',
  description = 'Connects the Stacksync MCP and sets the build order. Use when someone is new to Stacksync.',
  metadataLines = ['type: runbook', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"', 'tools: workspaces_list'],
  body = RUNBOOK_BODY,
} = {}) {
  const metadata = metadataLines.map((line) => `  ${line}`).join('\n');
  return `---\nname: ${name}\ndescription: ${description}\nlicense: Apache-2.0\nmetadata:\n${metadata}\n---\n${body}`;
}

const FIXTURE_SOLUTION_FOLDER = join(REPOSITORY_ROOT, 'scripts/test/fixtures/shopify-to-netsuite-orders');

export const fixtureSolutionText = readFileSync(join(FIXTURE_SOLUTION_FOLDER, 'SKILL.md'), 'utf8');
export const fixtureEvalsText = readFileSync(join(FIXTURE_SOLUTION_FOLDER, 'evals/evals.json'), 'utf8');
export const fixtureReferenceText = readFileSync(join(REPOSITORY_ROOT, 'scripts/test/fixtures/references/flow-json.md'), 'utf8');

// A template with its guidance comments removed and its name set, so it reads like a published skill.
export function buildTemplateText(type, name) {
  const templateText = readFileSync(join(REPOSITORY_ROOT, 'templates', type, 'SKILL.md'), 'utf8');
  return templateText.replace(`name: ${type}\n`, `name: ${name}\n`).replace(/<!--[\s\S]*?-->\n\n/g, '');
}

// The published skills the fixture solution links to: the resources its blueprint combines and the blueprint itself.
export const LINKED_SKILL_TEXTS = {
  'skills/syncs/SKILL.md': buildTemplateText('resource', 'syncs'),
  'skills/queues/SKILL.md': buildTemplateText('resource', 'queues'),
  'skills/workflows/SKILL.md': buildTemplateText('resource', 'workflows'),
  'skills/inbound-webhook-to-records/SKILL.md': buildTemplateText('blueprint', 'inbound-webhook-to-records'),
};

// A solution is checked against data/apps.json and the skills it links to, so a test repository gets copies of both.
export function createRepositoryWithRules(textsByPath) {
  const appsText = readFileSync(join(REPOSITORY_ROOT, 'data/apps.json'), 'utf8');
  return createRepository({ 'data/apps.json': appsText, ...LINKED_SKILL_TEXTS, ...textsByPath });
}
