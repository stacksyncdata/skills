// Writes catalog.json: one entry per skill and recipe, read by the Stacksync MCP and the
// Enterprise Architect. Never edit catalog.json by hand; run this script. With --check it only
// fails when catalog.json is out of date, which is how CI uses it.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  REPOSITORY_ROOT, PUBLISHED_FOLDERS, findSkillFiles, readSkill, splitWords, displayPath, isRunDirectly,
} from './lib/skill-files.mjs';

export const CATALOG_FILE_NAME = 'catalog.json';

export function buildCatalog(skills, repositoryRoot) {
  const entries = skills.map(({ frontmatter, path }) => {
    const metadata = frontmatter.metadata ?? {};
    return {
      name: frontmatter.name,
      description: frontmatter.description,
      type: metadata.type ?? null,
      path: displayPath(repositoryRoot, path),
      version: metadata.version ?? null,
      resource: metadata.resource ?? null,
      tools: splitWords(metadata.tools),
      systems: splitWords(metadata.systems),
      fits_when: metadata.fits_when ?? null,
    };
  });
  return { skills: entries };
}

export function renderCatalog(catalog) {
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

if (isRunDirectly(import.meta.url)) {
  const skills = findSkillFiles(REPOSITORY_ROOT, PUBLISHED_FOLDERS).map(readSkill);
  const renderedCatalog = renderCatalog(buildCatalog(skills, REPOSITORY_ROOT));
  const catalogPath = join(REPOSITORY_ROOT, CATALOG_FILE_NAME);
  if (process.argv.includes('--check')) {
    const isCurrent = existsSync(catalogPath) && readFileSync(catalogPath, 'utf8') === renderedCatalog;
    if (!isCurrent) {
      console.error('generate-catalog: catalog.json is out of date; run "node scripts/generate-catalog.mjs"');
      process.exit(1);
    }
    console.log(`generate-catalog: catalog.json is current (${skills.length} entries)`);
  } else {
    writeFileSync(catalogPath, renderedCatalog);
    console.log(`generate-catalog: wrote ${skills.length} entries to catalog.json`);
  }
}
