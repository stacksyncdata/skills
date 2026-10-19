// Fails when a skill names an MCP tool that does not exist. The tool list (tools.json) is
// published by the Stacksync MCP build; its path comes from STACKSYNC_TOOLS_JSON.
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
  if (unknownTools.length > 0) process.exit(1);
  console.log(`check-tools: every tool named in ${skills.length} skills exists`);
}
