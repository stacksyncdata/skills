import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildCatalog, renderIndex, replaceIndex, isSameCatalogContent, INDEX_START_MARKER, INDEX_END_MARKER,
} from '../generate-catalog.mjs';
import { REPOSITORY_ROOT, PUBLISHED_FOLDERS, findSkillFiles, readSkill } from '../lib/skill-files.mjs';
import { createRepository, buildSkillText, buildPlaybookText, fixtureUseCaseText } from './helpers.mjs';

const GENERATED_AT = '2026-10-19T00:00:00.000Z';

test('lists every published skill with its metadata, and leaves templates out', () => {
  const repositoryRoot = createRepository({
    'skills/building-syncs/SKILL.md': buildSkillText(),
    'skills/high-volume-changes-through-a-queue/SKILL.md': buildPlaybookText(),
    'skills/shopify-to-netsuite-orders/SKILL.md': fixtureUseCaseText,
    'templates/usecase/SKILL.md': fixtureUseCaseText.replace('name: shopify-to-netsuite-orders', 'name: usecase'),
  });
  const skills = findSkillFiles(repositoryRoot, PUBLISHED_FOLDERS).map(readSkill);
  const catalog = buildCatalog(skills, repositoryRoot, GENERATED_AT);

  assert.equal(catalog.schema, 1);
  assert.equal(catalog.generated_at, GENERATED_AT);
  assert.deepEqual(catalog.skills.map((entry) => entry.name), [
    'building-syncs', 'high-volume-changes-through-a-queue', 'shopify-to-netsuite-orders',
  ]);
  const [guide, playbook, useCase] = catalog.skills;
  assert.deepEqual(useCase, {
    name: 'shopify-to-netsuite-orders',
    type: 'usecase',
    status: 'active',
    superseded_by: null,
    description: 'Syncs orders from Shopify to sales orders in NetSuite with Stacksync. Use when someone wants to connect'
      + ' Shopify to NetSuite, sync or integrate online orders with the ERP, or automate order entry.',
    path: 'skills/shopify-to-netsuite-orders/SKILL.md',
    version: '1.0.0',
    owner: '@stacksyncdata/ai-team',
    areas: [],
    tools: [],
    resources: ['workflow', 'variable'],
    apps: ['shopify', 'netsuite'],
    playbooks: [],
    verified_on: '2026-01-15',
    usecase: {
      source_app: 'shopify',
      destination_app: 'netsuite',
      objects: 'orders → sales orders',
      direction: 'one-way',
      trigger: 'webhook',
      frequency: 'within 60 seconds',
      volume_tested: '2,000 orders per day',
    },
  });
  assert.equal(playbook.type, 'playbook');
  assert.deepEqual(playbook.resources, ['sync', 'queue', 'workflow']);
  assert.deepEqual(playbook.apps, []);
  assert.equal(playbook.usecase, null);
  assert.deepEqual(guide.tools, ['syncs_list', 'syncs_get']);
});

test('writes status and superseded_by from a deprecated skill', () => {
  const metadataLines = [
    'type: guide', 'version: "1.0.0"', 'owner: "@stacksyncdata/ai-team"', 'status: deprecated',
    'superseded_by: managing-syncs',
  ];
  const repositoryRoot = createRepository({ 'skills/building-syncs/SKILL.md': buildSkillText({ metadataLines }) });
  const skills = findSkillFiles(repositoryRoot, PUBLISHED_FOLDERS).map(readSkill);
  const [entry] = buildCatalog(skills, repositoryRoot, GENERATED_AT).skills;
  assert.equal(entry.status, 'deprecated');
  assert.equal(entry.superseded_by, 'managing-syncs');
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
