import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRepository, findUnknownSkillMentions, MAXIMUM_BODY_LINES, MAXIMUM_DESCRIPTION_LENGTH, MAXIMUM_GUIDED_BODY_LINES,
} from '../validate-skills.mjs';
import { REPOSITORY_ROOT } from '../lib/skill-files.mjs';
import {
  createRepository, createRepositoryWithRules, buildSkillText, buildPlaybookText, fixtureUseCaseText, fixtureEvalsText,
} from './helpers.mjs';

function problemsFor(skillText, path = 'skills/building-syncs/SKILL.md') {
  const { problemsByFile } = validateRepository(createRepository({ [path]: skillText }));
  return problemsByFile.get(path) ?? [];
}

test('this repository passes', () => {
  const { problemsByFile } = validateRepository(REPOSITORY_ROOT);
  assert.deepEqual([...problemsByFile], []);
});

test('a valid guide passes', () => {
  assert.deepEqual(problemsFor(buildSkillText()), []);
});

test('a SKILL.md sits only at skills/<name>/SKILL.md', () => {
  const repositoryRoot = createRepository({
    'skills/SKILL.md': buildSkillText(),
    'skills/guides/building-syncs/SKILL.md': buildSkillText(),
  });
  const { problemsByFile } = validateRepository(repositoryRoot);
  assert.deepEqual([...problemsByFile.keys()].sort(), ['skills/SKILL.md', 'skills/guides/building-syncs/SKILL.md']);
  assert.match(problemsByFile.get('skills/SKILL.md').join(), /belongs at skills\/<name>\/SKILL.md/);
});

test('the name must equal the folder', () => {
  assert.match(problemsFor(buildSkillText({ name: 'building-workflows' })).join(), /must equal its folder/);
});

test('the name must be lowercase with single hyphens and at most 64 characters', () => {
  assert.match(problemsFor(buildSkillText({ name: 'Building_Syncs' })).join(), /lowercase/);
  const longName = 'a'.repeat(65);
  assert.match(problemsFor(buildSkillText({ name: longName }), `skills/${longName}/SKILL.md`).join(), /over 64/);
});

test('the description has a length limit and says "Use when"', () => {
  const longDescription = `Use when ${'x'.repeat(MAXIMUM_DESCRIPTION_LENGTH)}`;
  assert.match(problemsFor(buildSkillText({ description: longDescription })).join(), /over 1024/);
  assert.match(problemsFor(buildSkillText({ description: 'Creates syncs.' })).join(), /Use when/);
});

test('the body has a line limit', () => {
  const body = 'line\n'.repeat(MAXIMUM_BODY_LINES + 1);
  assert.match(problemsFor(buildSkillText({ body })).join(), /over 500/);
});

test('the banned word for type is rejected anywhere in the file', () => {
  const body = `Pick the ${'ki' + 'nd'} of sync.\n`;
  assert.match(problemsFor(buildSkillText({ body })).join(), /say "type"/);
  assert.deepEqual(problemsFor(buildSkillText({ body: 'Be kindly precise.\n' })), []);
});

test('every skill requires type, version and owner, and type is one of three', () => {
  const problems = problemsFor(buildSkillText({ metadataLines: ['tools: syncs_list'] })).join();
  for (const key of ['type', 'version', 'owner']) assert.match(problems, new RegExp(`metadata.${key} is required`));
  const widget = buildSkillText({ metadataLines: ['type: widget', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"'] });
  assert.match(problemsFor(widget).join(), /guide, playbook, usecase/);
});

test('owner is a GitHub team handle', () => {
  const text = buildSkillText({ metadataLines: ['type: guide', 'version: "1.0.0"', 'owner: sync-team'] });
  assert.match(problemsFor(text).join(), /GitHub team handle/);
});

test('a deprecated skill names its replacement', () => {
  const lines = ['type: guide', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"', 'status: deprecated'];
  assert.match(problemsFor(buildSkillText({ metadataLines: lines })).join(), /superseded_by is required/);
  assert.deepEqual(problemsFor(buildSkillText({ metadataLines: [...lines, 'superseded_by: managing-syncs'] })), []);
  const retired = buildSkillText({ metadataLines: [...lines.slice(0, 3), 'status: retired'] });
  assert.match(problemsFor(retired).join(), /active, deprecated/);
});

test('an unknown metadata key is a warning, not a problem', () => {
  const path = 'skills/building-syncs/SKILL.md';
  const text = buildSkillText({ metadataLines: ['type: guide', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"', 'industry: retail'] });
  const { problemsByFile, warningsByFile } = validateRepository(createRepository({ [path]: text }));
  assert.equal(problemsByFile.size, 0);
  assert.deepEqual(warningsByFile.get(path), ['metadata.industry is not a known key for type guide']);
});

const USECASE_PATH = 'skills/shopify-to-netsuite-orders/SKILL.md';
const USECASE_EVALS_PATH = 'skills/shopify-to-netsuite-orders/evals/evals.json';
const PLAYBOOK_NAME = 'high-volume-changes-through-a-queue';
const PLAYBOOK_PATH = `skills/${PLAYBOOK_NAME}/SKILL.md`;
const PLAYBOOK_EVALS_PATH = `skills/${PLAYBOOK_NAME}/evals/evals.json`;

// Validates one use case (by default the fixture) with its evals, in a repository holding the real
// data/apps.json and "Before you start" block.
function useCaseProblemsFor(useCaseText = fixtureUseCaseText, extraFiles = {}, path = USECASE_PATH) {
  const evalsPath = path.replace('SKILL.md', 'evals/evals.json');
  const files = { [path]: useCaseText, [evalsPath]: fixtureEvalsText, ...extraFiles };
  const { problemsByFile } = validateRepository(createRepositoryWithRules(files));
  return (problemsByFile.get(path) ?? []).join('\n');
}

function withMetadata(text, key, value) {
  return text.replace(new RegExp(`^  ${key}: .*$`, 'm'), `  ${key}: ${value}`);
}

test('the fixture use case passes', () => {
  assert.equal(useCaseProblemsFor(), '');
});

test('a use case needs every use case metadata key', () => {
  const text = fixtureUseCaseText.replace(/^  volume_tested: .*\n/m, '');
  assert.match(useCaseProblemsFor(text), /metadata.volume_tested is required/);
});

test('a one-way use case name is <source>-to-<destination>-<object>', () => {
  const text = fixtureUseCaseText.replace('name: shopify-to-netsuite-orders', 'name: netsuite-orders');
  assert.match(useCaseProblemsFor(text, {}, 'skills/netsuite-orders/SKILL.md'), /<source_app>-to-<destination_app>-<object>/);
});

test('a two-way use case name is <a>-and-<b>-<object>-two-way-sync, in either order', () => {
  const twoWayText = withMetadata(fixtureUseCaseText, 'direction', 'two-way');
  for (const name of ['shopify-and-netsuite-orders-two-way-sync', 'netsuite-and-shopify-orders-two-way-sync']) {
    const text = twoWayText.replace('name: shopify-to-netsuite-orders', `name: ${name}`);
    assert.equal(useCaseProblemsFor(text, {}, `skills/${name}/SKILL.md`), '');
  }
  assert.match(useCaseProblemsFor(twoWayText), /two-way-sync/);
});

test('apps, direction, trigger and resources come from fixed lists', () => {
  assert.match(useCaseProblemsFor(withMetadata(fixtureUseCaseText, 'source_app', 'shopfy')), /"shopfy" is not in data\/apps.json/);
  assert.match(useCaseProblemsFor(withMetadata(fixtureUseCaseText, 'direction', 'both')), /direction must be one of/);
  assert.match(useCaseProblemsFor(withMetadata(fixtureUseCaseText, 'trigger', 'polling')), /trigger must be one of/);
  assert.match(useCaseProblemsFor(withMetadata(fixtureUseCaseText, 'resources', '"workflow connection"')), /resources must list only/);
});

test('verified_on must be a real date that has passed', () => {
  assert.match(useCaseProblemsFor(withMetadata(fixtureUseCaseText, 'verified_on', '"2026-02-30"')), /real date/);
  assert.match(useCaseProblemsFor(withMetadata(fixtureUseCaseText, 'verified_on', '"15/01/2026"')), /real date/);
  assert.match(useCaseProblemsFor(withMetadata(fixtureUseCaseText, 'verified_on', '"2999-01-01"')), /not in the future/);
});

test('the description follows the third person use case pattern', () => {
  const text = fixtureUseCaseText.replace('Syncs orders from Shopify', 'I sync orders from Shopify');
  assert.match(useCaseProblemsFor(text), /third person/);
});

test('the sections are exactly the use case sections, in order', () => {
  const swapped = fixtureUseCaseText.replace('## Field mapping', '## Temporary').replace('## Build steps', '## Field mapping')
    .replace('## Temporary', '## Build steps');
  assert.match(useCaseProblemsFor(swapped), /sections must be, in order/);
  assert.match(useCaseProblemsFor(fixtureUseCaseText.replace('## Limits', '## Notes')), /sections must be, in order/);
});

test('"Before you start" must equal the fixed block word for word', () => {
  const text = fixtureUseCaseText.replace('skip to the next section', 'carry on');
  assert.match(useCaseProblemsFor(text), /word for word/);
});

test('a use case body has a 200 line limit', () => {
  const text = `${fixtureUseCaseText}${'- line\n'.repeat(MAXIMUM_GUIDED_BODY_LINES)}`;
  assert.match(useCaseProblemsFor(text), /over 200 for a usecase/);
});

test('a use case needs at least three evals', () => {
  const twoEvals = JSON.stringify({ evals: JSON.parse(fixtureEvalsText).evals.slice(0, 2) });
  assert.match(useCaseProblemsFor(fixtureUseCaseText, { [USECASE_EVALS_PATH]: twoEvals }), /at least 3 evals/);
  assert.match(useCaseProblemsFor(fixtureUseCaseText, { [USECASE_EVALS_PATH]: '{' }), /not valid JSON/);
  const { problemsByFile } = validateRepository(createRepositoryWithRules({ [USECASE_PATH]: fixtureUseCaseText }));
  assert.match(problemsByFile.get(USECASE_PATH).join(), /evals.json is missing/);
});

test('a use case may name playbooks, and each must be a published playbook', () => {
  const text = fixtureUseCaseText.replace('  verified_on:', `  playbooks: ${PLAYBOOK_NAME}\n  verified_on:`);
  assert.match(useCaseProblemsFor(text), /not a published playbook/);
  const playbookFiles = { [PLAYBOOK_PATH]: buildPlaybookText(), [PLAYBOOK_EVALS_PATH]: fixtureEvalsText };
  assert.equal(useCaseProblemsFor(text, playbookFiles), '');
});

function playbookProblemsFor(text) {
  const files = { [PLAYBOOK_PATH]: text, [PLAYBOOK_EVALS_PATH]: fixtureEvalsText };
  return (validateRepository(createRepositoryWithRules(files)).problemsByFile.get(PLAYBOOK_PATH) ?? []).join();
}

test('a playbook follows the playbook sections and allows connection as a resource', () => {
  assert.equal(playbookProblemsFor(buildPlaybookText()), '');
  assert.equal(playbookProblemsFor(withMetadata(buildPlaybookText(), 'resources', '"sync queue workflow connection"')), '');
  assert.match(playbookProblemsFor(buildPlaybookText().replace('## Settings that matter', '## Settings')), /sections must be/);
  assert.match(playbookProblemsFor(buildPlaybookText().replace(/^  verified_on: .*\n/m, '')), /verified_on is required/);
});

test('a playbook may drop its optional sections', () => {
  const withoutOptional = buildPlaybookText()
    .replace(/## Questions to ask first\n[\s\S]*?(?=## How the resources connect)/, '')
    .replace(/## Rules\n[\s\S]*?(?=## When something goes wrong)/, '');
  assert.doesNotMatch(withoutOptional, /## Rules/);
  assert.equal(playbookProblemsFor(withoutOptional), '');
});

test('"When to use this playbook" must give a number', () => {
  const text = buildPlaybookText().replace(
    /## When to use this playbook\n[\s\S]*?(?=## Questions)/, '## When to use this playbook\n\nUse it when changes arrive in bursts.\n\n',
  );
  assert.match(playbookProblemsFor(text), /must give a number/);
});

test('names must not use the words Anthropic reserves', () => {
  const name = 'claude-helper';
  assert.match(problemsFor(buildSkillText({ name }), `skills/${name}/SKILL.md`).join(), /reserved word "claude"/);
});

test('a broken frontmatter is reported, not thrown', () => {
  assert.match(problemsFor('# no frontmatter\n').join(), /must start with/);
  assert.match(problemsFor(buildSkillText({ metadataLines: ['tools: [a, b]'] })).join(), /plain string/);
});

test('every skill a skills.sh group lists is a published skill', () => {
  const listing = JSON.stringify({ groupings: [{ title: 'Guides', skills: ['building-syncs', 'missing-skill'] }] });
  const { problemsByFile } = validateRepository(createRepository({ 'skills/building-syncs/SKILL.md': buildSkillText(), 'skills.sh.json': listing }));
  assert.deepEqual(problemsByFile.get('skills.sh.json'), ['group "Guides" lists "missing-skill", which is not a published skill']);
});

test('a guide that points at a skill that does not exist fails; a hyphenated package does not', () => {
  const publishedNames = new Set(['building-workflows', 'fixing-sync-issues']);
  const body = [
    'Use the `enterprise-architect` guide when it is available.',
    'Then follow the `fixing-sync-issues` process, or see `building-workflows`.',
    'Packages: `dayjs`, `live-plugin-manager`.',
  ].join('\n');

  assert.deepEqual(findUnknownSkillMentions(body, publishedNames), [
    'mentions the skill "enterprise-architect", which is not a published skill',
  ]);
});
