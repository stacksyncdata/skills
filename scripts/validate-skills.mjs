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
// Playbooks and use cases are read start to finish while the person waits, so they stay short.
export const MAXIMUM_GUIDED_BODY_LINES = 200;
export const MINIMUM_EVALS = 3;
export const SKILL_TYPES = ['guide', 'playbook', 'usecase'];
// The public skills.sh listing, whose groups name skills by folder
export const LISTING_FILE = 'skills.sh.json';
export const SKILL_STATUSES = ['active', 'deprecated'];
export const REQUIRED_METADATA = ['type', 'version', 'owner'];
export const OPTIONAL_METADATA = ['areas', 'tools', 'status', 'superseded_by'];
export const REQUIRED_METADATA_BY_TYPE = {
  guide: [],
  playbook: ['resources', 'verified_on'],
  'usecase': [
    'source_app', 'destination_app', 'objects', 'direction', 'resources', 'trigger', 'frequency', 'volume_tested',
    'verified_on',
  ],
};
export const OPTIONAL_METADATA_BY_TYPE = { guide: [], playbook: [], 'usecase': ['playbooks'] };
const KNOWN_FRONTMATTER_KEYS = ['name', 'description', 'license', 'compatibility', 'metadata'];
// Playbooks and use cases are guided builds: a fixed MCP block first, fixed sections in order,
// evals and a verified date. A playbook may add the optional sections anywhere.
export const SECTIONS_BY_TYPE = {
  playbook: {
    required: [
      'Before you start', 'When to use this playbook', 'How the resources connect', 'Build steps',
      'Settings that matter', 'When something goes wrong', 'Check it works', 'Limits',
    ],
    optional: ['Questions to ask first', 'Review against the workspace', 'Rules'],
  },
  'usecase': {
    required: [
      'Before you start', 'What this builds', 'Field mapping', 'Build steps', 'When something goes wrong',
      'Check it works', 'Limits',
    ],
    optional: [],
  },
};
const WHEN_TO_USE_PLAYBOOK_SECTION = 'When to use this playbook';
export const RESOURCES_BY_TYPE = {
  playbook: ['sync', 'workflow', 'queue', 'genie', 'variable', 'knowledge_base', 'api_proxy', 'connection'],
  'usecase': ['sync', 'workflow', 'queue', 'genie', 'variable', 'knowledge_base', 'api_proxy'],
};
export const USECASE_DIRECTIONS = ['one-way', 'two-way'];
export const USECASE_TRIGGERS = ['change detection', 'webhook', 'schedule', 'email'];
export const APPS_FILE = join('data', 'apps.json');
export const BEFORE_YOU_START_FILE = join(TEMPLATE_FOLDER, 'usecase', 'before-you-start.md');
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
// "Syncs orders from Shopify to sales orders in NetSuite with Stacksync. Use when …"
const USECASE_DESCRIPTION_PATTERN = /^[A-Z][a-z]+s\b.* with Stacksync\. Use when /;

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
  if (type in SECTIONS_BY_TYPE) problems.push(...findGuidedBuildProblems(skill, repositoryRules));
  if (type === 'usecase') problems.push(...findUseCaseProblems(skill, repositoryRules));
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

// repositoryRules holds what a playbook or use case is compared with: the app slugs from
// data/apps.json, the names of published playbooks and the exact "Before you start" block.
export function findGuidedBuildProblems(skill, repositoryRules) {
  if (!repositoryRules) return ['repository rules are not loaded'];
  const problems = [];
  const { body, path } = skill;
  const metadata = skill.frontmatter.metadata;
  const type = metadata.type;

  if (metadata.resources !== undefined) {
    const allowedResources = RESOURCES_BY_TYPE[type];
    const resources = splitWords(metadata.resources);
    if (resources.length === 0 || resources.some((resource) => !allowedResources.includes(resource))) {
      problems.push(`metadata.resources must list only: ${allowedResources.join(', ')}`);
    }
  }
  if (metadata.verified_on !== undefined && !isPastOrPresentDate(metadata.verified_on)) {
    problems.push('metadata.verified_on must be a real date written YYYY-MM-DD, not in the future');
  }

  const bodyLineCount = body.split('\n').length;
  if (bodyLineCount > MAXIMUM_GUIDED_BODY_LINES) {
    problems.push(`body is ${bodyLineCount} lines, over ${MAXIMUM_GUIDED_BODY_LINES} for a ${type}`);
  }

  const { required, optional } = SECTIONS_BY_TYPE[type];
  const sections = splitSections(body);
  const headings = sections.map((section) => section.heading);
  const requiredHeadings = headings.filter((heading) => required.includes(heading));
  const unknownHeadings = headings.filter((heading) => !required.includes(heading) && !optional.includes(heading));
  if (requiredHeadings.join('\n') !== required.join('\n') || unknownHeadings.length > 0) {
    const optionalNote = optional.length > 0 ? `, plus optionally ${optional.join(', ')}` : '';
    problems.push(`sections must be, in order: ${required.join(', ')}${optionalNote}; found: ${headings.join(', ')}`);
  }
  if (sections[0]?.heading === required[0] && sections[0].text !== repositoryRules.beforeYouStartText) {
    problems.push(`"Before you start" must equal ${BEFORE_YOU_START_FILE} word for word`);
  }
  // The reader decides from this section whether the playbook fits, and only a threshold decides.
  const whenToUse = sections.find((section) => section.heading === WHEN_TO_USE_PLAYBOOK_SECTION);
  if (type === 'playbook' && whenToUse && !/\d/.test(whenToUse.text.replace(/^.*\n/, ''))) {
    problems.push(`"${WHEN_TO_USE_PLAYBOOK_SECTION}" must give a number, for example "more than 100 changes per minute"`);
  }

  problems.push(...findEvalsProblems(join(dirname(path), EVALS_FILE)));
  return problems;
}

// The name and description patterns apply to published use cases only, because the template keeps
// its own name and an explanatory description.
export function findUseCaseProblems(skill, repositoryRules) {
  if (!repositoryRules) return ['repository rules are not loaded'];
  const problems = [];
  const { frontmatter, folder } = skill;
  const { source_app: sourceApp, destination_app: destinationApp, direction, trigger } = frontmatter.metadata;
  const { appSlugs, playbookNames } = repositoryRules;

  for (const [key, slug] of [['source_app', sourceApp], ['destination_app', destinationApp]]) {
    if (typeof slug === 'string' && !appSlugs.has(slug)) problems.push(`metadata.${key} "${slug}" is not in ${APPS_FILE}`);
  }
  if (direction !== undefined && !USECASE_DIRECTIONS.includes(direction)) {
    problems.push(`metadata.direction must be one of: ${USECASE_DIRECTIONS.join(', ')}`);
  }
  if (trigger !== undefined && !USECASE_TRIGGERS.includes(trigger)) {
    problems.push(`metadata.trigger must be one of: ${USECASE_TRIGGERS.join(', ')}`);
  }
  for (const playbookName of splitWords(frontmatter.metadata.playbooks)) {
    if (!playbookNames.has(playbookName)) {
      problems.push(`metadata.playbooks names "${playbookName}", which is not a published playbook`);
    }
  }

  if (folder !== TEMPLATE_FOLDER) {
    const expectedNames = buildUseCaseNamePatterns(sourceApp, destinationApp, direction);
    if (!expectedNames.some((pattern) => pattern.test(frontmatter.name))) {
      problems.push(direction === 'two-way'
        ? 'name must be <a>-and-<b>-<object>-two-way-sync, using source_app and destination_app'
        : 'name must be <source_app>-to-<destination_app>-<object>');
    }
    if (typeof frontmatter.description === 'string' && !USECASE_DESCRIPTION_PATTERN.test(frontmatter.description)) {
      problems.push('description must read "<Verb>s … with Stacksync. Use when …" in the third person');
    }
  }
  return problems;
}

function buildUseCaseNamePatterns(sourceApp, destinationApp, direction) {
  const object = '[a-z0-9]+(-[a-z0-9]+)*';
  if (direction === 'two-way') {
    return [[sourceApp, destinationApp], [destinationApp, sourceApp]]
      .map(([first, second]) => new RegExp(`^${first}-and-${second}-${object}-two-way-sync$`));
  }
  return [new RegExp(`^${sourceApp}-to-${destinationApp}-${object}$`)];
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
  const beforeYouStartPath = join(repositoryRoot, BEFORE_YOU_START_FILE);
  const appSlugs = existsSync(appsPath) ? new Set(readJsonFile(appsPath).apps.map((app) => app.slug)) : new Set();
  const beforeYouStartText = existsSync(beforeYouStartPath) ? readFileSync(beforeYouStartPath, 'utf8').trim() : null;
  const playbookNames = new Set();
  for (const skillFile of findSkillFiles(repositoryRoot, PUBLISHED_FOLDERS)) {
    try {
      if (readSkill(skillFile).frontmatter.metadata?.type === 'playbook') playbookNames.add(skillFile.skillName);
    } catch (error) {
      // The skill's own validation reports a broken frontmatter.
      if (!(error instanceof FrontmatterError)) throw error;
    }
  }
  return { appSlugs, beforeYouStartText, playbookNames };
}

export function validateRepository(repositoryRoot) {
  const skillFiles = findSkillFiles(repositoryRoot, [...PUBLISHED_FOLDERS, TEMPLATE_FOLDER]);
  const repositoryRules = loadRepositoryRules(repositoryRoot);
  const problemsByFile = new Map();
  const warningsByFile = new Map();
  for (const misplacedPath of findMisplacedSkillFiles(repositoryRoot, PUBLISHED_FOLDERS)) {
    problemsByFile.set(displayPath(repositoryRoot, misplacedPath), ['a SKILL.md belongs at skills/<name>/SKILL.md']);
  }
  for (const skillFile of skillFiles) {
    let problems;
    let warnings = [];
    try {
      const skill = readSkill(skillFile);
      problems = findSkillProblems(skill, repositoryRules);
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

// The skills.sh groups are written by hand, so a renamed or unpublished skill would leave a dead entry on the
// public listing; every name must be a published skill folder.
export function findListingProblems(repositoryRoot, skillFiles) {
  const listingPath = join(repositoryRoot, LISTING_FILE);
  if (!existsSync(listingPath)) return [];
  const publishedNames = new Set(
    skillFiles.map(({ path }) => displayPath(repositoryRoot, path).split('/')).filter((parts) => parts[0] === 'skills').map((parts) => parts[1]),
  );
  const listing = JSON.parse(readFileSync(listingPath, 'utf8'));
  return (listing.groupings ?? []).flatMap(({ title, skills }) =>
    skills.filter((name) => !publishedNames.has(name)).map((name) => `group "${title}" lists "${name}", which is not a published skill`),
  );
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
