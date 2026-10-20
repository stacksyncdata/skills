import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readToolNames, findUnknownTools, findUntaughtTools } from '../check-tools.mjs';

test('reads every supported tools.json shape', () => {
  const expected = new Set(['syncs_list', 'syncs_get']);
  assert.deepEqual(readToolNames(['syncs_list', 'syncs_get']), expected);
  assert.deepEqual(readToolNames([{ name: 'syncs_list' }, { name: 'syncs_get' }]), expected);
  assert.deepEqual(readToolNames({ tools: [{ name: 'syncs_list' }, 'syncs_get'] }), expected);
  assert.throws(() => readToolNames({ items: [] }), /must be a list/);
});

test('reports only the tools that do not exist', () => {
  const skills = [
    { path: 'skills/building-syncs/SKILL.md', frontmatter: { metadata: { tools: 'syncs_list  syncs_remove' } } },
    { path: 'skills/getting-started/SKILL.md', frontmatter: { metadata: { type: 'guide' } } },
  ];
  assert.deepEqual(findUnknownTools(skills, new Set(['syncs_list'])), [
    { path: 'skills/building-syncs/SKILL.md', toolName: 'syncs_remove' },
  ]);
});

test('reports every tool that no skill teaches', () => {
  const skills = [{ path: 'skills/building-syncs/SKILL.md', frontmatter: { metadata: { tools: 'syncs_list' } } }];
  assert.deepEqual(findUntaughtTools(skills, new Set(['syncs_list', 'workflows_delete', 'genies_ask'])), ['genies_ask', 'workflows_delete']);
});
