import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateRepository, MAXIMUM_BODY_LINES, MAXIMUM_DESCRIPTION_LENGTH } from '../validate-skills.mjs';
import { REPOSITORY_ROOT } from '../lib/skill-files.mjs';
import { createRepository, buildSkillText } from './helpers.mjs';

function problemsFor(skillText, path = 'skills/building-syncs/SKILL.md') {
  const { problemsByFile } = validateRepository(createRepository({ [path]: skillText }));
  return problemsByFile.get(path) ?? [];
}

test('this repository passes', () => {
  const { problemsByFile } = validateRepository(REPOSITORY_ROOT);
  assert.deepEqual([...problemsByFile], []);
});

test('a valid resource skill passes', () => {
  assert.deepEqual(problemsFor(buildSkillText()), []);
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

test('each type requires its metadata keys', () => {
  const problems = problemsFor(buildSkillText({ metadataLines: ['version: "1.0.0"', 'type: resource'] }));
  assert.match(problems.join(), /metadata.resource is required/);
  assert.match(problems.join(), /metadata.owner is required/);
  assert.match(problemsFor(buildSkillText({ metadataLines: ['version: "1.0.0"', 'type: widget'] })).join(), /one of/);
});

test('recipes live in recipes/ and nowhere else', () => {
  const recipeMetadata = [
    'version: "1.0.0"', 'type: recipe', 'systems: shopify netsuite', 'uses: building-workflows',
    'fits_when: orders must reach the ERP in minutes',
  ];
  const recipeText = buildSkillText({ name: 'order-to-cash', metadataLines: recipeMetadata });
  assert.deepEqual(problemsFor(recipeText, 'recipes/order-to-cash/SKILL.md'), []);
  assert.match(problemsFor(recipeText, 'skills/order-to-cash/SKILL.md').join(), /belongs in recipes/);
});

test('a broken frontmatter is reported, not thrown', () => {
  assert.match(problemsFor('# no frontmatter\n').join(), /must start with/);
  assert.match(problemsFor(buildSkillText({ metadataLines: ['tools: [a, b]'] })).join(), /plain string/);
});
