// Warns when a playbook or use case was last proven on a live workspace more than 90 days ago, so its
// owner runs it again each quarter. Apps and the product change; a use case nobody has run since is
// a guess. It only warns: an old date does not block a pull request.
import {
  REPOSITORY_ROOT, PUBLISHED_FOLDERS, findSkillFiles, readSkill, displayPath, isRunDirectly,
} from './lib/skill-files.mjs';

export const MAXIMUM_AGE_IN_DAYS = 90;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export function findStaleSkills(skills, today = new Date()) {
  const staleSkills = [];
  for (const skill of skills) {
    const verifiedOn = skill.frontmatter.metadata?.verified_on;
    if (typeof verifiedOn !== 'string') continue;
    const verifiedDate = new Date(`${verifiedOn}T00:00:00Z`);
    if (Number.isNaN(verifiedDate.getTime())) continue;
    const ageInDays = Math.floor((today.getTime() - verifiedDate.getTime()) / MILLISECONDS_PER_DAY);
    if (ageInDays > MAXIMUM_AGE_IN_DAYS) {
      staleSkills.push({ path: skill.path, verifiedOn, ageInDays, owner: skill.frontmatter.metadata.owner ?? null });
    }
  }
  return staleSkills;
}

if (isRunDirectly(import.meta.url)) {
  const skills = findSkillFiles(REPOSITORY_ROOT, PUBLISHED_FOLDERS).map(readSkill);
  const staleSkills = findStaleSkills(skills);
  for (const { path, verifiedOn, ageInDays, owner } of staleSkills) {
    // "::warning" shows as an annotation on the pull request in GitHub Actions.
    console.log(`::warning file=${displayPath(REPOSITORY_ROOT, path)}::verified_on ${verifiedOn} is ${ageInDays} days old;`
      + ` ${owner ?? 'the owner'} should run it again on a live workspace and update the date`);
  }
  console.log(`check-freshness: ${skills.length} skills checked, ${staleSkills.length} verified more than`
    + ` ${MAXIMUM_AGE_IN_DAYS} days ago`);
}
