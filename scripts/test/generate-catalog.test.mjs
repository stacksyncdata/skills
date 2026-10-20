import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildCatalog, renderIndex, replaceIndex, isSameCatalogContent, INDEX_START_MARKER, INDEX_END_MARKER,
} from '../generate-catalog.mjs';
import { REPOSITORY_ROOT, PUBLISHED_FOLDERS, findSkillFiles, readSkill } from '../lib/skill-files.mjs';
import { createRepository, buildSkillText, buildTemplateText, fixtureSolutionText } from './helpers.mjs';

const GENERATED_AT = '2026-10-19T00:00:00.000Z';

test('lists every published skill with its metadata, and leaves templates out', () => {
  const repositoryRoot = createRepository({
    'skills/getting-started/SKILL.md': buildSkillText(),
    'skills/queues/SKILL.md': buildTemplateText('resource', 'queues'),
    'skills/batch-sync-changes-through-a-queue/SKILL.md': buildTemplateText('blueprint', 'batch-sync-changes-through-a-queue'),
    'skills/shopify-to-netsuite-orders/SKILL.md': fixtureSolutionText,
    'templates/solution/SKILL.md': fixtureSolutionText.replace('name: shopify-to-netsuite-orders', 'name: solution'),
  });
  const skills = findSkillFiles(repositoryRoot, PUBLISHED_FOLDERS).map(readSkill);
  const catalog = buildCatalog(skills, repositoryRoot, GENERATED_AT);

  assert.equal(catalog.schema, 1);
  assert.equal(catalog.generated_at, GENERATED_AT);
  assert.deepEqual(catalog.skills.map((entry) => entry.name), [
    'batch-sync-changes-through-a-queue', 'getting-started', 'queues', 'shopify-to-netsuite-orders',
  ]);
  const [blueprint, runbook, resource, solution] = catalog.skills;
  assert.deepEqual(solution, {
    name: 'shopify-to-netsuite-orders',
    type: 'solution',
    status: 'active',
    superseded_by: null,
    description: 'Creates a NetSuite sales order for each new Shopify order with Stacksync. Use when someone wants to'
      + ' connect Shopify to NetSuite, sync or integrate online orders with the ERP, or automate order entry.',
    path: 'skills/shopify-to-netsuite-orders/SKILL.md',
    version: '1.0.0',
    owner: '@stacksyncdata/ai-team',
    areas: [],
    tools: ['connections_create', 'variables_save', 'workflows_save', 'workflows_run', 'workflows_deploy'],
    resources: [],
    apps: ['shopify', 'netsuite'],
    blueprints: ['inbound-webhook-to-records'],
    verified_on: '2026-01-15',
    solution: { apps: ['shopify', 'netsuite'], blueprints: ['inbound-webhook-to-records'], verified_on: '2026-01-15' },
  });
  assert.deepEqual(Object.keys(runbook), Object.keys(solution));
  assert.equal(blueprint.type, 'blueprint');
  assert.deepEqual(blueprint.resources, ['syncs', 'queues', 'workflows']);
  assert.deepEqual(blueprint.apps, []);
  assert.equal(blueprint.solution, null);
  assert.equal(resource.type, 'resource');
  assert.deepEqual(resource.resources, ['queue']);
  assert.deepEqual(runbook.tools, ['workspaces_list']);
});

test('writes status and superseded_by from a deprecated skill', () => {
  const metadataLines = [
    'type: runbook', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"', 'status: deprecated',
    'superseded_by: troubleshooting-a-sync',
  ];
  const repositoryRoot = createRepository({ 'skills/getting-started/SKILL.md': buildSkillText({ metadataLines }) });
  const skills = findSkillFiles(repositoryRoot, PUBLISHED_FOLDERS).map(readSkill);
  const [entry] = buildCatalog(skills, repositoryRoot, GENERATED_AT).skills;
  assert.equal(entry.status, 'deprecated');
  assert.equal(entry.superseded_by, 'troubleshooting-a-sync');
});

test('the index groups skills by type: runbooks with getting-started first, then resources, blueprints, solutions', () => {
  const entry = (name, type) => ({ name, type, status: 'active', description: `${name} | text` });
  const catalog = { skills: [
    entry('api-proxies', 'resource'), entry('building-a-connector', 'runbook'), entry('chain-workflows', 'blueprint'),
    entry('getting-started', 'runbook'), entry('shopify-to-netsuite-orders', 'solution'),
  ] };
  const index = renderIndex(catalog);
  const headingsAndNames = index.split('\n').filter((line) => line.startsWith('### ') || line.startsWith('| ['))
    .map((line) => (line.startsWith('### ') ? line : line.match(/\[([a-z-]+)\]/)[1]));
  assert.deepEqual(headingsAndNames, [
    '### Runbooks', 'getting-started', 'building-a-connector', '### Resources', 'api-proxies',
    '### Blueprints', 'chain-workflows', '### Solutions', 'shopify-to-netsuite-orders',
  ]);
  assert.match(index, /getting-started \\\| text/);
  assert.doesNotMatch(renderIndex({ skills: [entry('getting-started', 'runbook')] }), /### Solutions/);
});

test('two catalogs that differ only in generated_at are the same', () => {
  const catalog = buildCatalog([], REPOSITORY_ROOT, GENERATED_AT);
  assert.ok(isSameCatalogContent(catalog, { ...catalog, generated_at: '2027-01-01T00:00:00.000Z' }));
  assert.ok(!isSameCatalogContent(catalog, { ...catalog, schema: 2 }));
});

test('the index replaces only the text between its markers', () => {
  const readme = `# skills\n\nIntro.\n\n${INDEX_START_MARKER}\nold\n${INDEX_END_MARKER}\n\nOutro.\n`;
  const catalog = buildCatalog([], REPOSITORY_ROOT, GENERATED_AT);
  assert.equal(replaceIndex(readme, renderIndex(catalog)),
    `# skills\n\nIntro.\n\n${INDEX_START_MARKER}\nNo skills are published yet.\n${INDEX_END_MARKER}\n\nOutro.\n`);
  assert.throws(() => replaceIndex('# skills\n', 'x'), /must hold the lines/);
});

test('the committed catalog.json and skills/README.md index are current', () => {
  const skills = findSkillFiles(REPOSITORY_ROOT, PUBLISHED_FOLDERS).map(readSkill);
  const catalog = buildCatalog(skills, REPOSITORY_ROOT);
  const committedCatalog = JSON.parse(readFileSync(join(REPOSITORY_ROOT, 'catalog.json'), 'utf8'));
  assert.ok(isSameCatalogContent(committedCatalog, catalog));
  const readme = readFileSync(join(REPOSITORY_ROOT, 'skills/README.md'), 'utf8');
  assert.equal(readme, replaceIndex(readme, renderIndex(catalog)));
});
