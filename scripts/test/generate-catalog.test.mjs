import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalog, renderCatalog } from '../generate-catalog.mjs';
import { REPOSITORY_ROOT, PUBLISHED_FOLDERS, findSkillFiles, readSkill } from '../lib/skill-files.mjs';
import { createRepository, buildSkillText } from './helpers.mjs';

test('lists skills and recipes with their metadata, and leaves templates out', () => {
  const recipeMetadata = [
    'version: "1.2.0"', 'type: recipe', 'systems: shopify netsuite', 'uses: building-workflows',
    'fits_when: orders must reach the ERP in minutes',
  ];
  const repositoryRoot = createRepository({
    'skills/building-syncs/SKILL.md': buildSkillText(),
    'recipes/order-to-cash/SKILL.md': buildSkillText({ name: 'order-to-cash', metadataLines: recipeMetadata }),
    'templates/recipe/SKILL.md': buildSkillText({ name: 'recipe', metadataLines: recipeMetadata }),
  });
  const skills = findSkillFiles(repositoryRoot, PUBLISHED_FOLDERS).map(readSkill);
  const catalog = buildCatalog(skills, repositoryRoot);

  assert.deepEqual(catalog.skills.map((entry) => entry.name), ['order-to-cash', 'building-syncs']);
  assert.deepEqual(catalog.skills[0], {
    name: 'order-to-cash',
    description: 'Create and fix two way syncs. Use when records must stay equal between two apps.',
    type: 'recipe',
    path: 'recipes/order-to-cash/SKILL.md',
    version: '1.2.0',
    resource: null,
    tools: [],
    systems: ['shopify', 'netsuite'],
    fits_when: 'orders must reach the ERP in minutes',
  });
  assert.deepEqual(catalog.skills[1].tools, ['syncs_list', 'syncs_get']);
});

test('the committed catalog.json is current', () => {
  const skills = findSkillFiles(REPOSITORY_ROOT, PUBLISHED_FOLDERS).map(readSkill);
  const committedCatalog = readFileSync(join(REPOSITORY_ROOT, 'catalog.json'), 'utf8');
  assert.equal(committedCatalog, renderCatalog(buildCatalog(skills, REPOSITORY_ROOT)));
});
