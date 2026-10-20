import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRepository, findUnknownSkillMentions, findWebAppScreenProblems, MAXIMUM_BODY_LINES, MAXIMUM_DESCRIPTION_LENGTH,
  MAXIMUM_SOLUTION_BODY_LINES,
} from '../validate-skills.mjs';
import { REPOSITORY_ROOT } from '../lib/skill-files.mjs';
import {
  createRepository, createRepositoryWithRules, buildSkillText, buildTemplateText, fixtureSolutionText, fixtureEvalsText,
  RUNBOOK_BODY,
} from './helpers.mjs';

const RUNBOOK_PATH = 'skills/getting-started/SKILL.md';

function problemsFor(skillText, path = RUNBOOK_PATH) {
  const { problemsByFile } = validateRepository(createRepository({ [path]: skillText }));
  return problemsByFile.get(path) ?? [];
}

// Validates one skill in a repository that also holds data/apps.json and the resource and blueprint skills the
// fixtures link to.
function problemsWithRulesFor(path, text, extraFiles = {}) {
  const { problemsByFile } = validateRepository(createRepositoryWithRules({ [path]: text, ...extraFiles }));
  return (problemsByFile.get(path) ?? []).join('\n');
}

function withMetadata(text, key, value) {
  return text.replace(new RegExp(`^  ${key}: .*$`, 'm'), `  ${key}: ${value}`);
}

test('this repository passes', () => {
  const { problemsByFile } = validateRepository(REPOSITORY_ROOT);
  assert.deepEqual([...problemsByFile], []);
});

test('a valid runbook passes', () => {
  assert.deepEqual(problemsFor(buildSkillText()), []);
});

test('a SKILL.md sits only at skills/<name>/SKILL.md', () => {
  const repositoryRoot = createRepository({
    'skills/SKILL.md': buildSkillText(),
    'skills/runbooks/getting-started/SKILL.md': buildSkillText(),
  });
  const { problemsByFile } = validateRepository(repositoryRoot);
  assert.deepEqual([...problemsByFile.keys()].sort(), ['skills/SKILL.md', 'skills/runbooks/getting-started/SKILL.md']);
  assert.match(problemsByFile.get('skills/SKILL.md').join(), /belongs at skills\/<name>\/SKILL.md/);
});

test('the name must equal the folder', () => {
  assert.match(problemsFor(buildSkillText({ name: 'building-workflows' })).join(), /must equal its folder/);
});

test('the name must be lowercase with single hyphens and at most 64 characters', () => {
  assert.match(problemsFor(buildSkillText({ name: 'Getting_Started' })).join(), /lowercase/);
  const longName = 'a'.repeat(65);
  assert.match(problemsFor(buildSkillText({ name: longName }), `skills/${longName}/SKILL.md`).join(), /over 64/);
});

test('the description has a length limit and says "Use when"', () => {
  const longDescription = `Use when ${'x'.repeat(MAXIMUM_DESCRIPTION_LENGTH)}`;
  assert.match(problemsFor(buildSkillText({ description: longDescription })).join(), /over 1024/);
  assert.match(problemsFor(buildSkillText({ description: 'Creates syncs.' })).join(), /Use when/);
});

test('the body has a line limit', () => {
  const body = `${RUNBOOK_BODY}${'line\n'.repeat(MAXIMUM_BODY_LINES)}`;
  assert.match(problemsFor(buildSkillText({ body })).join(), /over 500/);
});

test('the banned word for type is rejected anywhere in the file', () => {
  const body = `${RUNBOOK_BODY}Pick the ${'ki' + 'nd'} of sync.\n`;
  assert.match(problemsFor(buildSkillText({ body })).join(), /say "type"/);
  assert.deepEqual(problemsFor(buildSkillText({ body: `${RUNBOOK_BODY}Be kindly precise.\n` })), []);
});

test('every skill requires type, version and owner, and type is one of four', () => {
  const problems = problemsFor(buildSkillText({ metadataLines: ['tools: syncs_list'] })).join();
  for (const key of ['type', 'version', 'owner']) assert.match(problems, new RegExp(`metadata.${key} is required`));
  for (const removedType of ['guide', 'playbook', 'usecase']) {
    const text = buildSkillText({ metadataLines: [`type: ${removedType}`, 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"'] });
    assert.match(problemsFor(text).join(), /resource, blueprint, solution, runbook/);
  }
});

test('owner is a GitHub team handle', () => {
  const text = buildSkillText({ metadataLines: ['type: runbook', 'version: "1.0.0"', 'owner: sync-team'] });
  assert.match(problemsFor(text).join(), /GitHub team handle/);
});

test('a deprecated skill names its replacement, and only its sections are skipped', () => {
  const lines = ['type: runbook', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"', 'status: deprecated'];
  assert.match(problemsFor(buildSkillText({ metadataLines: lines })).join(), /superseded_by is required/);
  const stub = buildSkillText({ metadataLines: [...lines, 'superseded_by: troubleshooting-a-sync'], body: 'Read the new skill.\n' });
  assert.deepEqual(problemsFor(stub), []);
  const retired = buildSkillText({ metadataLines: [...lines.slice(0, 3), 'status: retired'] });
  assert.match(problemsFor(retired).join(), /active, deprecated/);
});

test('an unknown metadata key is a warning, not a problem', () => {
  const text = buildSkillText({ metadataLines: ['type: runbook', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"', 'industry: retail'] });
  const { problemsByFile, warningsByFile } = validateRepository(createRepository({ [RUNBOOK_PATH]: text }));
  assert.equal(problemsByFile.size, 0);
  assert.deepEqual(warningsByFile.get(RUNBOOK_PATH), ['metadata.industry is not a known key for type runbook']);
});

test('every template passes', () => {
  const { problemsByFile } = validateRepository(createRepositoryWithRules({
    'templates/resource/SKILL.md': buildTemplateText('resource', 'resource'),
    'templates/blueprint/SKILL.md': buildTemplateText('blueprint', 'blueprint'),
  }));
  assert.deepEqual([...problemsByFile], []);
});

// Runbooks

test('a runbook has exactly the runbook sections, in order', () => {
  const swapped = RUNBOOK_BODY.replace('## Rules', '## Temporary').replace('## Steps', '## Rules').replace('## Temporary', '## Steps');
  assert.match(problemsFor(buildSkillText({ body: swapped })).join(), /sections must be exactly, in order: Use it when, Before you start/);
  const extra = `${RUNBOOK_BODY}## Notes\n\nMore.\n`;
  assert.match(problemsFor(buildSkillText({ body: extra })).join(), /found: .*Notes/);
});

test('a runbook\'s steps are a numbered list, each ending with a "Check:" line', () => {
  const bullets = RUNBOOK_BODY.replace('1. Call `workspaces_list`.', '- Call `workspaces_list`.');
  assert.match(problemsFor(buildSkillText({ body: bullets })).join(), /"## Steps" must be a numbered list/);
  const unchecked = RUNBOOK_BODY.replace('   Check: the workspace is listed.', '   Check: the workspace is listed.\n2. Call `folders_list`.');
  assert.match(problemsFor(buildSkillText({ body: unchecked })).join(), /step 2 of "## Steps" must end with a "Check:" line/);
});

// Resources

const RESOURCE_PATH = 'skills/variables/SKILL.md';
const resourceText = buildTemplateText('resource', 'variables');

test('a resource follows the resource sections and requires metadata.resource', () => {
  assert.equal(problemsWithRulesFor(RESOURCE_PATH, resourceText), '');
  assert.match(problemsWithRulesFor(RESOURCE_PATH, resourceText.replace(/^ {2}resource: .*\n/m, '')), /metadata.resource is required/);
  assert.match(problemsWithRulesFor(RESOURCE_PATH, resourceText.replace('## Defaults and limits', '## Limits')), /sections must be exactly/);
});

test('a resource\'s operations are "###" blocks with "Use when", a "Tools:" line and numbered steps', () => {
  const withoutBlocks = resourceText.replace(/### Create a queue\n[\s\S]*?(?=## Defaults and limits)/, 'Nothing yet.\n\n');
  assert.match(problemsWithRulesFor(RESOURCE_PATH, withoutBlocks), /at least one "### <Operation>" block/);
  const incomplete = resourceText.replace('Use when the person wants', 'When the person wants').replace('Tools: `queues_list`', '`queues_list`')
    .replace(/^1\. One numbered step.*\n.*\n/m, '');
  const problems = problemsWithRulesFor(RESOURCE_PATH, incomplete);
  assert.match(problems, /operation "Create a queue" must say "Use when …"/);
  assert.match(problems, /operation "Create a queue" must list its tools on a "Tools:" line/);
  assert.match(problems, /operation "Create a queue" must have numbered steps/);
});

test('a resource\'s "Connects to" and "Common problems" hold their tables', () => {
  const noTable = resourceText.replace('| Resource | How they link | Tool |', '| Resource | Link | Tool |');
  assert.match(problemsWithRulesFor(RESOURCE_PATH, noTable), /"## Connects to" must hold a table whose header is \| Resource \| How they link \| Tool \|/);
  const noProblemsTable = resourceText.replace('| What the person sees | Why | What to do |', '| Symptom | Fix |');
  assert.match(problemsWithRulesFor(RESOURCE_PATH, noProblemsTable), /"## Common problems" must hold a table/);
});

test('a resource\'s "Connects to" names published resource skills only', () => {
  const unknown = resourceText.replace('| `workflows` | A queue', '| `pipelines` | A queue');
  assert.match(problemsWithRulesFor(RESOURCE_PATH, unknown), /"## Connects to" names "pipelines", which is not a published resource skill/);
});

// Blueprints

const BLUEPRINT_PATH = 'skills/batch-sync-changes-through-a-queue/SKILL.md';
const blueprintText = buildTemplateText('blueprint', 'batch-sync-changes-through-a-queue');

test('a blueprint follows the blueprint sections and names two or more published resource skills', () => {
  assert.equal(problemsWithRulesFor(BLUEPRINT_PATH, blueprintText), '');
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, blueprintText.replace('## Variations', '## Options')), /sections must be exactly/);
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, withMetadata(blueprintText, 'resources', '"syncs pipelines"')),
    /metadata.resources names "pipelines", which is not a published resource skill/);
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, withMetadata(blueprintText, 'resources', 'syncs')), /at least two resource skills/);
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, blueprintText.replace(/^ {2}resources: .*\n/m, '')), /metadata.resources is required/);
});

test('a blueprint\'s "Use it when" gives a number', () => {
  const text = blueprintText.replace(/## Use it when\n[\s\S]*?(?=## Why this design)/, '## Use it when\n\nChanges arrive in bursts.\n\n');
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, text), /"## Use it when" must give a number/);
});

test('a blueprint\'s shape is a table of published resources plus a diagram, and "Build it" is numbered', () => {
  const noDiagram = blueprintText.replace(/```\nsync -> queue -> workflow\n```\n/, '');
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, noDiagram), /"## Shape" must hold a text diagram/);
  const noTable = blueprintText.replace('| Step | Resource | Links to | How |', '| Step | Resource |');
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, noTable), /"## Shape" must hold a table/);
  const unknown = blueprintText.replace('| 2 | `queues` |', '| 2 | `buffers` |');
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, unknown), /"## Shape" names "buffers"/);
  const notNumbered = blueprintText.replace('1. Name the resource skill', '- Name the resource skill');
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, notNumbered), /"## Build it" must be a numbered list/);
});

test('a blueprint may carry verified_on, and it must be a real date', () => {
  const lines = blueprintText.replace('  resources:', '  verified_on: "2026-02-30"\n  resources:');
  assert.match(problemsWithRulesFor(BLUEPRINT_PATH, lines), /real date/);
});

// Solutions

const SOLUTION_PATH = 'skills/shopify-to-netsuite-orders/SKILL.md';
const SOLUTION_EVALS_PATH = 'skills/shopify-to-netsuite-orders/evals/evals.json';

function solutionProblemsFor(text = fixtureSolutionText, extraFiles = {}) {
  return problemsWithRulesFor(SOLUTION_PATH, text, { [SOLUTION_EVALS_PATH]: fixtureEvalsText, ...extraFiles });
}

test('the fixture solution passes', () => {
  assert.equal(solutionProblemsFor(), '');
});

test('a solution needs blueprints, apps and verified_on', () => {
  for (const key of ['blueprints', 'apps', 'verified_on']) {
    const text = fixtureSolutionText.replace(new RegExp(`^ {2}${key}: .*\\n`, 'm'), '');
    assert.match(solutionProblemsFor(text), new RegExp(`metadata.${key} is required for type solution`));
  }
});

test('a solution names published blueprints and at least two apps from data/apps.json', () => {
  assert.match(solutionProblemsFor(withMetadata(fixtureSolutionText, 'blueprints', 'orders-pipeline')),
    /metadata.blueprints names "orders-pipeline", which is not a published blueprint/);
  assert.match(solutionProblemsFor(withMetadata(fixtureSolutionText, 'apps', '"shopfy netsuite"')), /"shopfy", which is not in data\/apps.json/);
  assert.match(solutionProblemsFor(withMetadata(fixtureSolutionText, 'apps', 'shopify')), /at least two apps/);
});

test('a solution\'s "## Blueprint" names a published blueprint', () => {
  const text = fixtureSolutionText.replace('Follows `inbound-webhook-to-records`.', 'Follows the webhook design.');
  assert.match(solutionProblemsFor(text), /"## Blueprint" must name the published blueprint/);
});

test('verified_on must be a real date that has passed', () => {
  assert.match(solutionProblemsFor(withMetadata(fixtureSolutionText, 'verified_on', '"2026-02-30"')), /real date/);
  assert.match(solutionProblemsFor(withMetadata(fixtureSolutionText, 'verified_on', '"15/01/2026"')), /real date/);
  assert.match(solutionProblemsFor(withMetadata(fixtureSolutionText, 'verified_on', '"2999-01-01"')), /not in the future/);
});

test('the sections are exactly the solution sections, in order', () => {
  const swapped = fixtureSolutionText.replace('## Proof', '## Temporary').replace('## Build log', '## Proof').replace('## Temporary', '## Build log');
  assert.match(solutionProblemsFor(swapped), /sections must be exactly, in order/);
});

test('a solution body has a line limit', () => {
  const text = `${fixtureSolutionText}${'- line\n'.repeat(MAXIMUM_SOLUTION_BODY_LINES)}`;
  assert.match(solutionProblemsFor(text), new RegExp(`over ${MAXIMUM_SOLUTION_BODY_LINES} for a solution`));
});

test('a solution needs at least three evals', () => {
  const twoEvals = JSON.stringify({ evals: JSON.parse(fixtureEvalsText).evals.slice(0, 2) });
  assert.match(solutionProblemsFor(fixtureSolutionText, { [SOLUTION_EVALS_PATH]: twoEvals }), /at least 3 evals/);
  assert.match(solutionProblemsFor(fixtureSolutionText, { [SOLUTION_EVALS_PATH]: '{' }), /not valid JSON/);
  assert.match(problemsWithRulesFor(SOLUTION_PATH, fixtureSolutionText), /evals.json is missing/);
});

// Shared checks

test('names must not use the words Anthropic reserves', () => {
  const name = 'claude-helper';
  assert.match(problemsFor(buildSkillText({ name }), `skills/${name}/SKILL.md`).join(), /reserved word "claude"/);
});

test('a broken frontmatter is reported, not thrown', () => {
  assert.match(problemsFor('# no frontmatter\n').join(), /must start with/);
  assert.match(problemsFor(buildSkillText({ metadataLines: ['tools: [a, b]'] })).join(), /plain string/);
});

test('every skill a skills.sh group lists is a published skill', () => {
  const listing = JSON.stringify({ groupings: [{ title: 'Start here', skills: ['getting-started', 'missing-skill'] }] });
  const { problemsByFile } = validateRepository(createRepository({ [RUNBOOK_PATH]: buildSkillText(), 'skills.sh.json': listing }));
  assert.deepEqual(problemsByFile.get('skills.sh.json'), ['group "Start here" lists "missing-skill", which is not a published skill']);
});

test('a skill that points at a skill that does not exist fails; a hyphenated package does not', () => {
  const publishedNames = new Set(['workflows', 'troubleshooting-a-sync', 'queues']);
  const body = [
    'Use the `enterprise-architect` runbook when it is available.',
    'Then follow the `troubleshooting-a-sync` runbook, or see the `workflows` resource and the `queues` skill.',
    'The `pipelines` resource does not exist, nor does the blueprint `orders-pipeline`.',
    'Packages: `dayjs`, `live-plugin-manager`.',
  ].join('\n');

  assert.deepEqual(findUnknownSkillMentions(body, publishedNames), [
    'mentions the skill "enterprise-architect", which is not a published skill',
    'mentions the skill "pipelines", which is not a published skill',
    'mentions the skill "orders-pipeline", which is not a published skill',
  ]);
});

test('a table of web app screens or a web app column fails; a one-line handoff passes', () => {
  const screensTable = ['## The screens in the web app', '', '| Screen | Where |', '| --- | --- |', '| Statistics | The sync tab |'].join('\n');
  const webAppColumn = ['| The person asks | Answer with | Or in the web app |', '| --- | --- | --- |', '| Counts | `syncs_get` | Statistics |'].join('\n');
  const screensHeading = '## Web app screens\n\nText.';
  const handoff = 'Associations: do this in the web app: the sync\'s **Associations** tab; the MCP does not set them.';

  assert.equal(findWebAppScreenProblems(screensTable).length, 1);
  assert.deepEqual(findWebAppScreenProblems(webAppColumn), ['has a table column "Or in the web app": name a web app screen only as a one-line handoff']);
  assert.equal(findWebAppScreenProblems(screensHeading).length, 1);
  assert.deepEqual(findWebAppScreenProblems(handoff), []);
});
