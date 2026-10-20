// Fails when a skill names an MCP tool that does not exist, or when an MCP tool is named by no skill: the
// skills are how an agent learns what Stacksync can do, so every capability must be taught by one. The tool
// list (tools.json) is published by the Stacksync MCP build; its path comes from STACKSYNC_TOOLS_JSON.
import { existsSync, readFileSync } from 'node:fs';
import {
  REPOSITORY_ROOT, PUBLISHED_FOLDERS, findSkillFiles, readSkill, splitWords, displayPath, isRunDirectly,
} from './lib/skill-files.mjs';

export const TOOLS_FILE_VARIABLE = 'STACKSYNC_TOOLS_JSON';

// Accepts ["tool_name", …], [{ "name": "tool_name" }, …] or { "tools": [ … ] }.
export function readToolNames(toolsDocument) {
  const toolEntries = Array.isArray(toolsDocument) ? toolsDocument : toolsDocument?.tools;
  if (!Array.isArray(toolEntries)) throw new Error('tools.json must be a list of tools or { "tools": [ … ] }');
  return new Set(toolEntries.map((entry) => (typeof entry === 'string' ? entry : entry?.name)).filter(Boolean));
}

export function findUnknownTools(skills, knownToolNames) {
  const unknownTools = [];
  for (const skill of skills) {
    for (const toolName of splitWords(skill.frontmatter.metadata?.tools)) {
      if (!knownToolNames.has(toolName)) unknownTools.push({ path: skill.path, toolName });
    }
  }
  return unknownTools;
}

export function findUntaughtTools(skills, knownToolNames) {
  const taughtToolNames = new Set(skills.flatMap((skill) => splitWords(skill.frontmatter.metadata?.tools)));
  return [...knownToolNames].filter((toolName) => !taughtToolNames.has(toolName)).sort();
}

if (isRunDirectly(import.meta.url)) {
  const toolsFilePath = process.env[TOOLS_FILE_VARIABLE];
  if (!toolsFilePath || !existsSync(toolsFilePath)) {
    console.log(`check-tools: skipped, set ${TOOLS_FILE_VARIABLE} to the path of the MCP tools.json to run it`);
    process.exit(0);
  }
  const knownToolNames = readToolNames(JSON.parse(readFileSync(toolsFilePath, 'utf8')));
  const skills = findSkillFiles(REPOSITORY_ROOT, PUBLISHED_FOLDERS).map(readSkill);
  const unknownTools = findUnknownTools(skills, knownToolNames);
  for (const { path, toolName } of unknownTools) {
    console.error(`${displayPath(REPOSITORY_ROOT, path)}: tool "${toolName}" is not in ${toolsFilePath}`);
  }
  const untaughtTools = findUntaughtTools(skills, knownToolNames);
  for (const toolName of untaughtTools) {
    console.error(`tool "${toolName}" is in ${toolsFilePath} but no skill lists it in metadata.tools`);
  }
  if (unknownTools.length > 0 || untaughtTools.length > 0) process.exit(1);
  console.log(`check-tools: every tool named in ${skills.length} skills exists, and every tool is taught by a skill`);
}
