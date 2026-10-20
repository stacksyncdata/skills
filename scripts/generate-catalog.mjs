// Writes catalog.json, read by the Stacksync MCP, and the index in skills/README.md, read by
// people browsing the repository. Never edit either by hand; run this script. With --check it only
// fails when one is out of date, which is how CI uses it.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  REPOSITORY_ROOT, PUBLISHED_FOLDERS, findSkillFiles, readSkill, splitWords, displayPath, isRunDirectly,
} from './lib/skill-files.mjs';

export const CATALOG_FILE_NAME = 'catalog.json';
export const CATALOG_SCHEMA_VERSION = 1;
export const INDEX_FILE = join('skills', 'README.md');
export const INDEX_START_MARKER = '<!-- catalog:start -->';
export const INDEX_END_MARKER = '<!-- catalog:end -->';

export function buildCatalog(skills, repositoryRoot, generatedAt = new Date().toISOString()) {
  const entries = skills.map(({ frontmatter, path }) => {
    const metadata = frontmatter.metadata ?? {};
    const isSolution = metadata.type === 'solution';
    return {
      name: frontmatter.name,
      type: metadata.type ?? null,
      status: metadata.status ?? 'active',
      superseded_by: metadata.superseded_by ?? null,
      description: frontmatter.description,
      path: displayPath(repositoryRoot, path),
      version: metadata.version ?? null,
      owner: metadata.owner ?? null,
      areas: splitWords(metadata.areas),
      tools: splitWords(metadata.tools),
      // A resource skill covers its one resource; a blueprint lists the resource skills it combines.
      resources: metadata.type === 'resource' ? splitWords(metadata.resource) : splitWords(metadata.resources),
      // The MCP matches solutions to a person's connected apps by these slugs.
      apps: splitWords(metadata.apps),
      blueprints: splitWords(metadata.blueprints),
      verified_on: metadata.verified_on ?? null,
      solution: isSolution ? buildSolutionEntry(metadata) : null,
    };
  });
  return { schema: CATALOG_SCHEMA_VERSION, generated_at: generatedAt, skills: entries };
}

function buildSolutionEntry(metadata) {
  return {
    apps: splitWords(metadata.apps),
    blueprints: splitWords(metadata.blueprints),
    verified_on: metadata.verified_on ?? null,
  };
}

export function renderCatalog(catalog) {
  return `${JSON.stringify(catalog, null, 2)}\n`;
}

// generated_at changes on every run, so two catalogs are equal when everything else is.
export function isSameCatalogContent(firstCatalog, secondCatalog) {
  const withoutTimestamp = ({ generated_at: _generatedAt, ...rest }) => JSON.stringify(rest);
  return withoutTimestamp(firstCatalog) === withoutTimestamp(secondCatalog);
}

// The index groups skills by type, in the order a newcomer reads them; getting-started opens the runbooks.
export const INDEX_GROUPS = [
  { type: 'runbook', title: 'Runbooks' },
  { type: 'resource', title: 'Resources' },
  { type: 'blueprint', title: 'Blueprints' },
  { type: 'solution', title: 'Solutions' },
];
export const FIRST_SKILL = 'getting-started';

export function renderIndex(catalog) {
  if (catalog.skills.length === 0) return 'No skills are published yet.';
  const blocks = [];
  for (const { type, title } of INDEX_GROUPS) {
    const skills = catalog.skills.filter((skill) => skill.type === type)
      .sort((first, second) => Number(second.name === FIRST_SKILL) - Number(first.name === FIRST_SKILL));
    if (skills.length === 0) continue;
    const rows = skills.map(({ name, status, description }) => {
      const label = status === 'deprecated' ? `[${name}](${name}/SKILL.md) (deprecated)` : `[${name}](${name}/SKILL.md)`;
      return `| ${label} | ${description.replace(/\|/g, '\\|')} |`;
    });
    blocks.push([`### ${title}`, '', '| Skill | Description |', '| --- | --- |', ...rows].join('\n'));
  }
  return blocks.join('\n\n');
}

export function replaceIndex(readmeText, indexText) {
  const startIndex = readmeText.indexOf(INDEX_START_MARKER);
  const endIndex = readmeText.indexOf(INDEX_END_MARKER);
  if (startIndex === -1 || endIndex < startIndex) {
    throw new Error(`${INDEX_FILE} must hold the lines ${INDEX_START_MARKER} and ${INDEX_END_MARKER}`);
  }
  return `${readmeText.slice(0, startIndex + INDEX_START_MARKER.length)}\n${indexText}\n${readmeText.slice(endIndex)}`;
}

if (isRunDirectly(import.meta.url)) {
  const skills = findSkillFiles(REPOSITORY_ROOT, PUBLISHED_FOLDERS).map(readSkill);
  const catalogPath = join(REPOSITORY_ROOT, CATALOG_FILE_NAME);
  const indexPath = join(REPOSITORY_ROOT, INDEX_FILE);
  const committedCatalog = existsSync(catalogPath) ? JSON.parse(readFileSync(catalogPath, 'utf8')) : null;
  const catalog = buildCatalog(skills, REPOSITORY_ROOT);
  const isCatalogCurrent = committedCatalog !== null && isSameCatalogContent(committedCatalog, catalog);
  const committedReadme = readFileSync(indexPath, 'utf8');
  const renderedReadme = replaceIndex(committedReadme, renderIndex(catalog));
  const isIndexCurrent = committedReadme === renderedReadme;

  if (process.argv.includes('--check')) {
    if (!isCatalogCurrent || !isIndexCurrent) {
      const staleFiles = [!isCatalogCurrent && CATALOG_FILE_NAME, !isIndexCurrent && INDEX_FILE].filter(Boolean);
      console.error(`generate-catalog: ${staleFiles.join(' and ')} out of date; run "node scripts/generate-catalog.mjs"`);
      process.exit(1);
    }
    console.log(`generate-catalog: catalog.json and skills/README.md are current (${skills.length} skills)`);
  } else {
    // Rewriting an unchanged catalog would only move generated_at and add noise to the diff.
    if (!isCatalogCurrent) writeFileSync(catalogPath, renderCatalog(catalog));
    if (!isIndexCurrent) writeFileSync(indexPath, renderedReadme);
    console.log(`generate-catalog: ${skills.length} skills in catalog.json and skills/README.md`);
  }
}
