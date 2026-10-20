// Shared helpers for the CI checks: find every SKILL.md and read its frontmatter.
// No dependencies on purpose, so the checks run on a bare Node 22 install.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// Every published skill lives in skills/<name>/; metadata.type alone says what it is. templates/
// holds the starting points to copy.
export const PUBLISHED_FOLDERS = ['skills'];
export const TEMPLATE_FOLDER = 'templates';
export const SKILL_FILE_NAME = 'SKILL.md';

export function findSkillFiles(repositoryRoot, folders) {
  const skillFiles = [];
  for (const folder of folders) {
    const folderPath = join(repositoryRoot, folder);
    if (!existsSync(folderPath)) continue;
    for (const entry of readdirSync(folderPath, { withFileTypes: true })) {
      const skillFile = join(folderPath, entry.name, SKILL_FILE_NAME);
      if (entry.isDirectory() && existsSync(skillFile)) {
        skillFiles.push({ folder, skillName: entry.name, path: skillFile });
      }
    }
  }
  return skillFiles.sort((first, second) => first.path.localeCompare(second.path));
}

// A SKILL.md anywhere other than <folder>/<name>/SKILL.md is never loaded by an AI app, so the
// validator reports it instead of silently skipping it.
export function findMisplacedSkillFiles(repositoryRoot, folders) {
  const misplacedPaths = [];
  for (const folder of folders) {
    const folderPath = join(repositoryRoot, folder);
    if (!existsSync(folderPath)) continue;
    for (const filePath of listFilesRecursively(folderPath)) {
      const depth = relative(folderPath, filePath).split(sep).length;
      if (basename(filePath) === SKILL_FILE_NAME && depth !== 2) misplacedPaths.push(filePath);
    }
  }
  return misplacedPaths.sort();
}

export function listFilesRecursively(directoryPath, ignoredNames = new Set(['.git', 'node_modules'])) {
  const files = [];
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    if (ignoredNames.has(entry.name)) continue;
    const entryPath = join(directoryPath, entry.name);
    if (entry.isDirectory()) files.push(...listFilesRecursively(entryPath, ignoredNames));
    else if (statSync(entryPath).isFile()) files.push(entryPath);
  }
  return files;
}

export class FrontmatterError extends Error {}

// Parses the YAML subset the Agent Skills standard uses: top level "key: value" pairs and one
// level of nested "key: value" pairs (metadata). Anything richer is rejected so every reader of
// the skill (Claude, Cursor, skills.sh, our MCP) sees the same values.
export function parseSkillFile(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines[0] !== '---') throw new FrontmatterError('the file must start with a "---" frontmatter line');
  const closingIndex = lines.indexOf('---', 1);
  if (closingIndex === -1) throw new FrontmatterError('the frontmatter has no closing "---" line');

  const frontmatter = {};
  let openMappingKey = null;
  for (const [offset, line] of lines.slice(1, closingIndex).entries()) {
    const lineNumber = offset + 2;
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const nestedMatch = line.match(/^ {2}([A-Za-z0-9_-]+):\s*(.*)$/);
    const topLevelMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (nestedMatch && openMappingKey) {
      frontmatter[openMappingKey][nestedMatch[1]] = readScalar(nestedMatch[2], lineNumber);
    } else if (topLevelMatch) {
      const [, key, rawValue] = topLevelMatch;
      if (rawValue === '') {
        frontmatter[key] = {};
        openMappingKey = key;
      } else {
        frontmatter[key] = readScalar(rawValue, lineNumber);
        openMappingKey = null;
      }
    } else {
      throw new FrontmatterError(`line ${lineNumber} is not a "key: value" pair`);
    }
  }
  return { frontmatter, body: lines.slice(closingIndex + 1).join('\n') };
}

function readScalar(rawValue, lineNumber) {
  const value = rawValue.trim();
  const quote = value[0];
  if ((quote === '"' || quote === "'") && value.endsWith(quote) && value.length >= 2) {
    return value.slice(1, -1);
  }
  if (value.startsWith('[') || value.startsWith('{') || value === '|' || value === '>') {
    throw new FrontmatterError(`line ${lineNumber} uses a list, map or block value; write one plain string`);
  }
  return value;
}

export function readSkill(skillFile) {
  const text = readFileSync(skillFile.path, 'utf8');
  return { ...skillFile, text, ...parseSkillFile(text) };
}

// metadata values that name several things (tools, systems, uses) are space separated strings,
// because the standard allows only string to string metadata.
export function splitWords(value) {
  return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
}

// Splits a body into its "## " sections, ignoring headings inside fenced code blocks. Each
// section keeps its heading line, so callers can compare a whole block word for word.
export function splitSections(body) {
  const sections = [];
  let isInCodeBlock = false;
  for (const line of body.split('\n')) {
    if (line.startsWith('```')) isInCodeBlock = !isInCodeBlock;
    if (!isInCodeBlock && line.startsWith('## ')) sections.push({ heading: line.slice(3).trim(), lines: [line] });
    else if (sections.length > 0) sections.at(-1).lines.push(line);
  }
  return sections.map(({ heading, lines }) => ({ heading, text: lines.join('\n').trim() }));
}

export function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function displayPath(repositoryRoot, filePath) {
  return relative(repositoryRoot, filePath) || basename(filePath);
}

export function isRunDirectly(moduleUrl) {
  return process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(moduleUrl);
}
