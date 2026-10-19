// Checks every skill, recipe and template against the Agent Skills standard (agentskills.io)
// plus the Stacksync rules in CONTRIBUTING.md. Exits 1 and lists every problem when one fails.
import {
  REPOSITORY_ROOT, PUBLISHED_FOLDERS, TEMPLATE_FOLDER, FrontmatterError,
  findSkillFiles, readSkill, displayPath, isRunDirectly,
} from './lib/skill-files.mjs';

export const MAXIMUM_NAME_LENGTH = 64;
export const MAXIMUM_DESCRIPTION_LENGTH = 1024;
export const MAXIMUM_BODY_LINES = 500;
export const SKILL_TYPES = ['resource', 'recipe', 'playbook', 'guide'];
export const REQUIRED_METADATA_BY_TYPE = {
  resource: ['version', 'type', 'resource', 'tools', 'owner'],
  recipe: ['version', 'type', 'systems', 'uses', 'fits_when'],
  playbook: ['version', 'type'],
  guide: ['version', 'type'],
};
// The banned word is spelled in two parts so this file passes its own check.
const BANNED_WORDS = ['ki' + 'nd'];
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export function findSkillProblems(skill) {
  const problems = [];
  const { frontmatter, body, skillName, folder, text } = skill;
  const { name, description, license, metadata } = frontmatter;

  if (typeof name !== 'string' || !NAME_PATTERN.test(name)) {
    problems.push('name must be lowercase letters, digits and single hyphens');
  } else {
    if (name.length > MAXIMUM_NAME_LENGTH) problems.push(`name is over ${MAXIMUM_NAME_LENGTH} characters`);
    if (name !== skillName) problems.push(`name "${name}" must equal its folder name "${skillName}"`);
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

  if (typeof metadata !== 'object' || metadata === null) {
    problems.push('metadata is missing');
  } else {
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value !== 'string' || value === '') problems.push(`metadata.${key} must be a non empty string`);
    }
    const { type, version } = metadata;
    if (!SKILL_TYPES.includes(type)) {
      problems.push(`metadata.type must be one of: ${SKILL_TYPES.join(', ')}`);
    } else {
      for (const key of REQUIRED_METADATA_BY_TYPE[type]) {
        if (!(key in metadata)) problems.push(`metadata.${key} is required for type ${type}`);
      }
      if (folder === 'recipes' && type !== 'recipe') problems.push('a skill in recipes/ must have type recipe');
      if (folder === 'skills' && type === 'recipe') problems.push('a recipe belongs in recipes/, not skills/');
    }
    if (version !== undefined && !VERSION_PATTERN.test(version)) {
      problems.push('metadata.version must look like "1.0.0"');
    }
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

export function validateRepository(repositoryRoot) {
  const skillFiles = findSkillFiles(repositoryRoot, [...PUBLISHED_FOLDERS, TEMPLATE_FOLDER]);
  const problemsByFile = new Map();
  for (const skillFile of skillFiles) {
    let problems;
    try {
      problems = findSkillProblems(readSkill(skillFile));
    } catch (error) {
      if (!(error instanceof FrontmatterError)) throw error;
      problems = [error.message];
    }
    if (problems.length > 0) problemsByFile.set(displayPath(repositoryRoot, skillFile.path), problems);
  }
  return { checkedCount: skillFiles.length, problemsByFile };
}

if (isRunDirectly(import.meta.url)) {
  const { checkedCount, problemsByFile } = validateRepository(REPOSITORY_ROOT);
  for (const [filePath, problems] of problemsByFile) {
    for (const problem of problems) console.error(`${filePath}: ${problem}`);
  }
  if (problemsByFile.size > 0) process.exit(1);
  console.log(`validate-skills: ${checkedCount} SKILL.md files pass`);
}
