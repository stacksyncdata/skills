import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

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
  metadataLines = [
    'version: "1.0.0"', 'type: resource', 'resource: syncs', 'tools: syncs_list syncs_get', 'owner: sync-team',
  ],
  body = '## When to use\n\nWhen someone wants records kept equal.\n',
} = {}) {
  const metadata = metadataLines.map((line) => `  ${line}`).join('\n');
  return `---\nname: ${name}\ndescription: ${description}\nlicense: Apache-2.0\nmetadata:\n${metadata}\n---\n${body}`;
}
