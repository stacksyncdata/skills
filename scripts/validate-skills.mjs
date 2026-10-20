// Checks every skill and template against the Agent Skills standard (agentskills.io) plus the
// Stacksync rules in CONTRIBUTING.md. Exits 1 and lists every problem when one fails; unknown
// metadata keys are printed as warnings only, so a new optional key never breaks a pull request.
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  REPOSITORY_ROOT, PUBLISHED_FOLDERS, TEMPLATE_FOLDER, FrontmatterError, findSkillFiles, findMisplacedSkillFiles,
  readSkill, readJsonFile, splitSections, splitWords, displayPath, isRunDirectly,
} from './lib/skill-files.mjs';

export const MAXIMUM_NAME_LENGTH = 64;
export const MAXIMUM_DESCRIPTION_LENGTH = 1024;
export const MAXIMUM_COMPATIBILITY_LENGTH = 500;
export const MAXIMUM_BODY_LINES = 500;
// A solution is read start to finish while the person waits, so it stays short.
export const MAXIMUM_SOLUTION_BODY_LINES = 250;
export const MINIMUM_EVALS = 3;
export const SKILL_TYPES = ['resource', 'blueprint', 'solution', 'runbook'];
// The public skills.sh listing, whose groups name skills by folder
export const LISTING_FILE = 'skills.sh.json';
export const SKILL_STATUSES = ['active', 'deprecated'];
export const REQUIRED_METADATA = ['type', 'version', 'owner'];
export const OPTIONAL_METADATA = ['areas', 'tools', 'status', 'superseded_by'];
export const REQUIRED_METADATA_BY_TYPE = {
  resource: ['resource'],
  blueprint: ['resources'],
  solution: ['blueprints', 'apps', 'verified_on'],
  runbook: [],
};
export const OPTIONAL_METADATA_BY_TYPE = { resource: [], blueprint: ['verified_on'], solution: [], runbook: [] };
const KNOWN_FRONTMATTER_KEYS = ['name', 'description', 'license', 'compatibility', 'metadata'];
// Every type has fixed "## " sections in a fixed order, so an AI app finds the same answer under the same heading
// in every skill of that type.
export const SECTIONS_BY_TYPE = {
  resource: [
    'What it is', 'When to use it', 'Connects to', 'Operations', 'Defaults and limits', 'Rules', 'Common problems',
  ],
  blueprint: ['Use it when', 'Why this design', 'Shape', 'Build it', 'Variations', 'Check before going live', 'Rules'],
  solution: ['Outcome', 'Blueprint', 'What was built', 'Build log', 'Proof', 'Adapt it'],
  runbook: ['Use it when', 'Before you start', 'Steps', 'Rules', 'When the MCP cannot do it'],
};
// The header row each section's table must have, written as its cells.
export const TABLE_HEADERS = {
  'resource:Connects to': ['Resource', 'How they link', 'Tool'],
  'resource:Common problems': ['What the person sees', 'Why', 'What to do'],
  'blueprint:Shape': ['Step', 'Resource', 'Links to', 'How'],
};
export const APPS_FILE = join('data', 'apps.json');
export const EVALS_FILE = join('evals', 'evals.json');
// The banned word is spelled in two parts so this file passes its own check.
const BANNED_WORDS = ['ki' + 'nd'];
// Anthropic reserves these words in skill names.
const RESERVED_NAME_WORDS = ['claude', 'anthropic'];
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// A GitHub team, for example @stacksyncdata/ai-team, so CODEOWNERS and the owner agree.
const OWNER_PATTERN = /^@[A-Za-z0-9-]+\/[A-Za-z0-9_-]+$/;
const NUMBERED_LINE_PATTERN = /^\d+\.\s/;
const SKILL_NAME_IN_BACKTICKS_PATTERN = /`([a-z0-9]+(?:-[a-z0-9]+)*)`/g;
export function findSkillProblems(skill, repositoryRules = null) {
  const problems = [];
  const { frontmatter, body, skillName, text } = skill;
  const { name, description, license, compatibility, metadata } = frontmatter;

  if (typeof name !== 'string' || !NAME_PATTERN.test(name)) {
    problems.push('name must be lowercase letters, digits and single hyphens');
  } else {
    if (name.length > MAXIMUM_NAME_LENGTH) problems.push(`name is over ${MAXIMUM_NAME_LENGTH} characters`);
    if (name !== skillName) problems.push(`name "${name}" must equal its folder name "${skillName}"`);
    for (const word of RESERVED_NAME_WORDS) {
      if (name.split('-').includes(word)) problems.push(`name must not contain the reserved word "${word}"`);
    }
  }

  if (typeof description !== 'string' || description.trim() === '') {
    problems.push('description is missing');
  } else {
    if (description.length > MAXIMUM_DESCRIPTION_LENGTH) {
      problems.push(`description is ${description.length} characters, over ${MAXIMUM_DESCRIPTION_LENGTH}`);
    }
    if (!description.includes('Use when')) problems.push('description must say "Use when …"');
  }

  if (typeof license !== 'string' || license === '') problems.push('license is missing');
  if (compatibility !== undefined
    && (typeof compatibility !== 'string' || compatibility.length > MAXIMUM_COMPATIBILITY_LENGTH)) {
    problems.push(`compatibility must be one string of at most ${MAXIMUM_COMPATIBILITY_LENGTH} characters`);
  }

  if (typeof metadata !== 'object' || metadata === null) {
    problems.push('metadata is missing');
  } else {
    problems.push(...findMetadataProblems(skill, repositoryRules));
  }

  const bodyLineCount = body.split('\n').length;
  if (bodyLineCount > MAXIMUM_BODY_LINES) {
    problems.push(`body is ${bodyLineCount} lines, over ${MAXIMUM_BODY_LINES}; move detail into references/`);
  }

  for (const word of BANNED_WORDS) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) problems.push(`uses the word "${word}"; say "type" instead`);
  }
  return problems;
}

function findMetadataProblems(skill, repositoryRules) {
  const problems = [];
  const { metadata } = skill.frontmatter;
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value !== 'string' || value === '') problems.push(`metadata.${key} must be a non empty string`);
  }
  for (const key of REQUIRED_METADATA) {
    if (!(key in metadata)) problems.push(`metadata.${key} is required`);
  }
  const { type, version, owner, status } = metadata;
  if (version !== undefined && !VERSION_PATTERN.test(version)) problems.push('metadata.version must look like "1.0.0"');
  if (owner !== undefined && !OWNER_PATTERN.test(owner)) {
    problems.push('metadata.owner must be a GitHub team handle, for example "@stacksyncdata/ai-team"');
  }
  if (status !== undefined && !SKILL_STATUSES.includes(status)) {
    problems.push(`metadata.status must be one of: ${SKILL_STATUSES.join(', ')}`);
  }
  if (status === 'deprecated' && !('superseded_by' in metadata)) {
    problems.push('metadata.superseded_by is required when metadata.status is deprecated');
  }
  if (!SKILL_TYPES.includes(type)) {
    if (type !== undefined) problems.push(`metadata.type must be one of: ${SKILL_TYPES.join(', ')}`);
    return problems;
  }
  for (const key of REQUIRED_METADATA_BY_TYPE[type]) {
    if (!(key in metadata)) problems.push(`metadata.${key} is required for type ${type}`);
  }
  if (metadata.verified_on !== undefined && !isPastOrPresentDate(metadata.verified_on)) {
    problems.push('metadata.verified_on must be a real date written YYYY-MM-DD, not in the future');
  }
  if (status !== 'deprecated') problems.push(...findSectionProblems(skill, repositoryRules));
  // A template names example skills that need not be published yet; only published skills must link to real ones.
  if (skill.folder !== TEMPLATE_FOLDER) problems.push(...findLinkedSkillProblems(skill, repositoryRules));
  if (type === 'solution') problems.push(...findSolutionProblems(skill, repositoryRules));
  return problems;
}

// Unknown keys warn instead of failing, so a key added for a future reader does not break older
// checkouts of this validator.
export function findSkillWarnings(skill) {
  const { frontmatter } = skill;
  const warnings = Object.keys(frontmatter)
    .filter((key) => !KNOWN_FRONTMATTER_KEYS.includes(key))
    .map((key) => `${key} is not a known frontmatter key`);
  const metadata = frontmatter.metadata;
  if (typeof metadata !== 'object' || metadata === null) return warnings;
  const knownKeys = [
    ...REQUIRED_METADATA, ...OPTIONAL_METADATA,
    ...(REQUIRED_METADATA_BY_TYPE[metadata.type] ?? []), ...(OPTIONAL_METADATA_BY_TYPE[metadata.type] ?? []),
  ];
  for (const key of Object.keys(metadata)) {
    if (!knownKeys.includes(key)) warnings.push(`metadata.${key} is not a known key for type ${metadata.type}`);
  }
  return warnings;
}

// The sections are exactly the type's sections, in order, and each holds the structure its readers rely on.
export function findSectionProblems(skill, repositoryRules) {
  const type = skill.frontmatter.metadata.type;
  const required = SECTIONS_BY_TYPE[type];
  const sections = splitSections(skill.body);
  const headings = sections.map((section) => section.heading);
  if (headings.join('\n') !== required.join('\n')) {
    return [`a ${type}'s sections must be exactly, in order: ${required.join(', ')}; found: ${headings.join(', ') || 'none'}`];
  }
  const problems = [];
  const sectionText = (heading) => sectionContent(sections.find((section) => section.heading === heading));
  for (const [key, header] of Object.entries(TABLE_HEADERS)) {
    const [tableType, heading] = key.split(':');
    if (tableType !== type) continue;
    const tableHeaders = findTableHeaders(sectionText(heading));
    if (!tableHeaders.some((cells) => cells.join('|') === header.join('|'))) {
      problems.push(`"## ${heading}" must hold a table whose header is | ${header.join(' | ')} |`);
    }
  }
  if (type === 'resource') problems.push(...findOperationProblems(sectionText('Operations')));
  if (type === 'blueprint') {
    // The reader decides from this section whether the blueprint fits, and only a threshold decides.
    if (!/\d/.test(sectionText('Use it when'))) {
      problems.push('"## Use it when" must give a number, for example "more than 100 changes per minute"');
    }
    if (!/^```/m.test(sectionText('Shape'))) problems.push('"## Shape" must hold a text diagram in a code block');
    if (findNumberedItems(sectionText('Build it')).length === 0) problems.push('"## Build it" must be a numbered list');
  }
  if (type === 'runbook') {
    const steps = findNumberedItems(sectionText('Steps'));
    if (steps.length === 0) problems.push('"## Steps" must be a numbered list');
    steps.forEach((step, index) => {
      if (!/^\s*Check:/m.test(step)) problems.push(`step ${index + 1} of "## Steps" must end with a "Check:" line`);
    });
  }
  if (type === 'solution' && repositoryRules && skill.folder !== TEMPLATE_FOLDER) {
    const linkedBlueprints = findNamesInBackticks(sectionText('Blueprint')).filter((name) => repositoryRules.blueprintNames.has(name));
    if (linkedBlueprints.length === 0) problems.push('"## Blueprint" must name the published blueprint it follows, in backticks');
  }
  return problems;
}

// Each operation is one "### " block: when to use it, the tools in call order, then numbered steps.
export function findOperationProblems(operationsText) {
  const blocks = splitSubsections(operationsText);
  if (blocks.length === 0) return ['"## Operations" must hold at least one "### <Operation>" block'];
  const problems = [];
  for (const { heading, text } of blocks) {
    if (!/\bUse when\b/.test(text)) problems.push(`operation "${heading}" must say "Use when …"`);
    if (!/^\s*Tools:/m.test(text)) problems.push(`operation "${heading}" must list its tools on a "Tools:" line`);
    if (findNumberedItems(text).length === 0) problems.push(`operation "${heading}" must have numbered steps`);
  }
  return problems;
}

// Metadata and tables that link skills must name published skills of the right type, so skills_get never refuses
// a name the model was sent to.
export function findLinkedSkillProblems(skill, repositoryRules) {
  if (!repositoryRules) return ['repository rules are not loaded'];
  const problems = [];
  const { metadata } = skill.frontmatter;
  const { resourceNames, blueprintNames, appSlugs } = repositoryRules;
  if (metadata.type === 'blueprint') {
    const resources = splitWords(metadata.resources);
    if (metadata.resources !== undefined && resources.length < 2) problems.push('metadata.resources must name at least two resource skills');
    for (const name of resources) {
      if (!resourceNames.has(name)) problems.push(`metadata.resources names "${name}", which is not a published resource skill`);
    }
  }
  if (metadata.type === 'solution') {
    for (const name of splitWords(metadata.blueprints)) {
      if (!blueprintNames.has(name)) problems.push(`metadata.blueprints names "${name}", which is not a published blueprint`);
    }
    for (const slug of splitWords(metadata.apps)) {
      if (!appSlugs.has(slug)) problems.push(`metadata.apps names "${slug}", which is not in ${APPS_FILE}`);
    }
  }
  const sections = splitSections(skill.body);
  const tableColumns = { resource: ['Connects to', 'Resource'], blueprint: ['Shape', 'Resource'] }[metadata.type];
  if (tableColumns) {
    const [heading, column] = tableColumns;
    for (const name of findTableColumnNames(sectionContent(sections.find((section) => section.heading === heading)), column)) {
      if (!resourceNames.has(name)) problems.push(`"## ${heading}" names "${name}", which is not a published resource skill`);
    }
  }
  return problems;
}

// A solution is proven live, so it carries its test prompts.
export function findSolutionProblems(skill) {
  const problems = [];
  const bodyLineCount = skill.body.split('\n').length;
  if (bodyLineCount > MAXIMUM_SOLUTION_BODY_LINES) {
    problems.push(`body is ${bodyLineCount} lines, over ${MAXIMUM_SOLUTION_BODY_LINES} for a solution`);
  }
  if (splitWords(skill.frontmatter.metadata.apps).length < 2) problems.push('metadata.apps must name at least two apps');
  problems.push(...findEvalsProblems(join(dirname(skill.path), EVALS_FILE)));
  return problems;
}

// A section's text without its heading line
function sectionContent(section) {
  return section ? section.text.replace(/^.*\n?/, '') : '';
}

// Splits a section into its "### " blocks, ignoring headings inside fenced code blocks.
export function splitSubsections(text) {
  const blocks = [];
  let isInCodeBlock = false;
  for (const line of text.split('\n')) {
    if (line.startsWith('```')) isInCodeBlock = !isInCodeBlock;
    if (!isInCodeBlock && line.startsWith('### ')) blocks.push({ heading: line.slice(4).trim(), lines: [] });
    else if (blocks.length > 0) blocks.at(-1).lines.push(line);
  }
  return blocks.map(({ heading, lines }) => ({ heading, text: lines.join('\n') }));
}

// The top level numbered items of a list, each with the lines that follow it up to the next item.
export function findNumberedItems(text) {
  const items = [];
  let isInCodeBlock = false;
  for (const line of text.split('\n')) {
    if (line.trimStart().startsWith('```')) isInCodeBlock = !isInCodeBlock;
    if (!isInCodeBlock && NUMBERED_LINE_PATTERN.test(line)) items.push([line]);
    else if (items.length > 0) items.at(-1).push(line);
  }
  return items.map((lines) => lines.join('\n'));
}

function splitTableRow(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isTableSeparator(line) {
  return /^\s*\|[\s:|-]+\|\s*$/.test(line ?? '');
}

// The header row of every table in the text, as its cells
export function findTableHeaders(text) {
  const lines = text.split('\n');
  return lines.flatMap((line, index) => (line.trim().startsWith('|') && isTableSeparator(lines[index + 1]) ? [splitTableRow(line)] : []));
}

// The names in backticks in one column of the first table whose header holds that column
function findTableColumnNames(text, column) {
  const lines = text.split('\n');
  const headerIndex = lines.findIndex((line, index) => line.trim().startsWith('|') && isTableSeparator(lines[index + 1]));
  if (headerIndex === -1) return [];
  const columnIndex = splitTableRow(lines[headerIndex]).indexOf(column);
  if (columnIndex === -1) return [];
  const names = [];
  for (const line of lines.slice(headerIndex + 2)) {
    if (!line.trim().startsWith('|')) break;
    names.push(...findNamesInBackticks(splitTableRow(line)[columnIndex] ?? ''));
  }
  return names;
}

function findNamesInBackticks(text) {
  return [...text.matchAll(SKILL_NAME_IN_BACKTICKS_PATTERN)].map((match) => match[1]);
}

export function isPastOrPresentDate(value) {
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && date <= new Date();
}

function findEvalsProblems(evalsPath) {
  if (!existsSync(evalsPath)) return [`${EVALS_FILE} is missing; add at least ${MINIMUM_EVALS} test prompts`];
  let evalsDocument;
  try {
    evalsDocument = readJsonFile(evalsPath);
  } catch {
    return [`${EVALS_FILE} is not valid JSON`];
  }
  const evals = Array.isArray(evalsDocument?.evals) ? evalsDocument.evals : [];
  const completeEvals = evals.filter((entry) => isFilledString(entry?.prompt) && isFilledString(entry?.expected_output));
  if (completeEvals.length < MINIMUM_EVALS) {
    return [`${EVALS_FILE} needs at least ${MINIMUM_EVALS} evals, each with a prompt and an expected_output`];
  }
  return [];
}

function isFilledString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function loadRepositoryRules(repositoryRoot) {
  const appsPath = join(repositoryRoot, APPS_FILE);
  const appSlugs = existsSync(appsPath) ? new Set(readJsonFile(appsPath).apps.map((app) => app.slug)) : new Set();
  const resourceNames = new Set();
  const blueprintNames = new Set();
  for (const skillFile of findSkillFiles(repositoryRoot, PUBLISHED_FOLDERS)) {
    try {
      const type = readSkill(skillFile).frontmatter.metadata?.type;
      if (type === 'resource') resourceNames.add(skillFile.skillName);
      if (type === 'blueprint') blueprintNames.add(skillFile.skillName);
    } catch (error) {
      // The skill's own validation reports a broken frontmatter.
      if (!(error instanceof FrontmatterError)) throw error;
    }
  }
  return { appSlugs, resourceNames, blueprintNames };
}

export function validateRepository(repositoryRoot) {
  const skillFiles = findSkillFiles(repositoryRoot, [...PUBLISHED_FOLDERS, TEMPLATE_FOLDER]);
  const repositoryRules = loadRepositoryRules(repositoryRoot);
  const problemsByFile = new Map();
  const warningsByFile = new Map();
  const publishedNames = findPublishedNames(repositoryRoot, skillFiles);
  for (const misplacedPath of findMisplacedSkillFiles(repositoryRoot, PUBLISHED_FOLDERS)) {
    problemsByFile.set(displayPath(repositoryRoot, misplacedPath), ['a SKILL.md belongs at skills/<name>/SKILL.md']);
  }
  for (const skillFile of skillFiles) {
    let problems;
    let warnings = [];
    try {
      const skill = readSkill(skillFile);
      problems = [...findSkillProblems(skill, repositoryRules), ...findUnknownSkillMentions(skill.body, publishedNames), ...findWebAppScreenProblems(skill.body)];
      warnings = findSkillWarnings(skill);
    } catch (error) {
      if (!(error instanceof FrontmatterError)) throw error;
      problems = [error.message];
    }
    const filePath = displayPath(repositoryRoot, skillFile.path);
    if (problems.length > 0) problemsByFile.set(filePath, problems);
    if (warnings.length > 0) warningsByFile.set(filePath, warnings);
  }
  const listingProblems = findListingProblems(repositoryRoot, skillFiles);
  if (listingProblems.length > 0) problemsByFile.set(LISTING_FILE, listingProblems);
  return { checkedCount: skillFiles.length, problemsByFile, warningsByFile };
}

// The names of the skill folders under skills/: what skills_get serves
function findPublishedNames(repositoryRoot, skillFiles) {
  return new Set(
    skillFiles.map(({ path }) => displayPath(repositoryRoot, path).split('/')).filter((parts) => parts[0] === 'skills').map((parts) => parts[1]),
  );
}

// The skills.sh groups are written by hand, so a renamed or unpublished skill would leave a dead entry on the
// public listing; every name must be a published skill folder.
export function findListingProblems(repositoryRoot, skillFiles) {
  const listingPath = join(repositoryRoot, LISTING_FILE);
  if (!existsSync(listingPath)) return [];
  const publishedNames = findPublishedNames(repositoryRoot, skillFiles);
  const listing = JSON.parse(readFileSync(listingPath, 'utf8'));
  return (listing.groupings ?? []).flatMap(({ title, skills }) =>
    skills.filter((name) => !publishedNames.has(name)).map((name) => `group "${title}" lists "${name}", which is not a published skill`),
  );
}

// A skill that sends the reader to another skill by name must name one that exists: skills_get refuses an unknown
// name, and the model is left guessing. Only phrasings that point at a skill are checked ("use `x`", "the `x` resource"),
// so a hyphenated package or command in backticks is not taken for a skill.
const SKILL_MENTION_PATTERNS = [
  /\b(?:use|see|read|follow)\s+(?:the\s+)?`([a-z0-9]+(?:-[a-z0-9]+)+)`/gi,
  /`([a-z0-9]+(?:-[a-z0-9]+)*)`\s+(?:skill|resource|blueprint|solution|runbook)\b/gi,
  /\bthe\s+(?:skill|resource|blueprint|solution|runbook)\s+`([a-z0-9]+(?:-[a-z0-9]+)*)`/gi,
];

export function findUnknownSkillMentions(body, publishedNames) {
  const mentionedNames = new Set(SKILL_MENTION_PATTERNS.flatMap((pattern) => [...body.matchAll(pattern)].map((match) => match[1])));
  return [...mentionedNames].filter((name) => !publishedNames.has(name)).map((name) => `mentions the skill "${name}", which is not a published skill`);
}

// The AI app reads a skill and cannot open a web app screen: a table of screens, or a web app column next to the MCP
// tools, sends it to point the person at the web app instead of answering. A handoff the MCP cannot do is one line.
const WEB_APP_SCREENS_HEADING_PATTERN = /^#{1,6}\s.*(web app screens|screens in the web app)/im;

export function findWebAppScreenProblems(body) {
  const problems = [];
  if (WEB_APP_SCREENS_HEADING_PATTERN.test(body)) problems.push('has a heading of web app screens: the skill teaches the MCP; name a screen only as a one-line handoff');
  const lines = body.split('\n');
  lines.forEach((line, index) => {
    const isTableHeader = line.trim().startsWith('|') && /^\s*\|[\s:|-]+\|\s*$/.test(lines[index + 1] ?? '');
    if (!isTableHeader) return;
    const webAppColumns = line.split('|').map((cell) => cell.trim()).filter((cell) => /web app/i.test(cell));
    for (const column of webAppColumns) problems.push(`has a table column "${column}": name a web app screen only as a one-line handoff`);
  });
  return problems;
}

if (isRunDirectly(import.meta.url)) {
  const { checkedCount, problemsByFile, warningsByFile } = validateRepository(REPOSITORY_ROOT);
  for (const [filePath, warnings] of warningsByFile) {
    for (const warning of warnings) console.log(`::warning file=${filePath}::${warning}`);
  }
  for (const [filePath, problems] of problemsByFile) {
    for (const problem of problems) console.error(`${filePath}: ${problem}`);
  }
  if (problemsByFile.size > 0) process.exit(1);
  console.log(`validate-skills: ${checkedCount} SKILL.md files pass`);
}
