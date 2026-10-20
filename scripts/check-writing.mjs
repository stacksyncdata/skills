// Applies the banned list in STYLE.md to every Markdown file in skills/, and reports each hit as
// file:line. templates/ is left out: it explains the rules, so it quotes some of what they ban.
// evals/ prompts are left out too, because they copy what people type.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import {
  REPOSITORY_ROOT, PUBLISHED_FOLDERS, listFilesRecursively, displayPath, isRunDirectly,
} from './lib/skill-files.mjs';

const BANNED_PHRASES = [
  'seamlessly', 'seamless', 'robust', 'leverage', 'leverages', 'leveraged', 'leveraging', 'unlock', 'unlocks',
  'streamline', 'streamlines', 'streamlined', 'powerful', 'effortless', 'effortlessly', 'cutting-edge',
  'game-changer', 'game changer', "in today's", 'delve', 'delves', 'elevate', 'elevates', 'empower',
  'empowers', 'supercharge', 'supercharges',
];

function wordPattern(words) {
  const escaped = words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?<![\\w-])(?:${escaped.join('|')})(?![\\w-])`, 'i');
}

// isCheckedInCode: false for rules about prose, because code keeps its own syntax (a "!=" or a
// "{{ }}" expression is correct there).
export const WRITING_RULES = [
  { label: 'a banned phrase', pattern: wordPattern(BANNED_PHRASES), reason: 'it says nothing a reader can check', isCheckedInCode: false },
  { label: '"This skill"', pattern: /\bThis skill\b/, reason: 'say what it does instead', isCheckedInCode: false },
  { label: 'an em dash or en dash', pattern: /[–—]/, reason: 'use a comma, colon or full stop', isCheckedInCode: false },
  { label: 'an exclamation mark', pattern: /(?<!<)!(?![[=])/, reason: 'state facts calmly', isCheckedInCode: false },
  { label: 'a {{ }} placeholder', pattern: /\{\{.*?\}\}/, reason: 'replace it with the real value', isCheckedInCode: false },
  { label: 'a <your …> placeholder', pattern: /<your[\s_-][^>]*>/i, reason: 'replace it with the real value', isCheckedInCode: true },
  { label: 'TODO or TBD', pattern: /\b(?:TODO|TBD)\b/, reason: 'finish it before the pull request', isCheckedInCode: true },
  { label: 'lorem ipsum', pattern: /\blorem\b/i, reason: 'replace it with the real text', isCheckedInCode: true },
  // The catalog markers in skills/README.md are the one comment that belongs in published files.
  {
    label: 'a template comment', pattern: /<!--(?! catalog:(?:start|end) -->)/, reason: 'delete the template guidance',
    isCheckedInCode: false,
  },
  {
    label: 'hedging', pattern: /\b(?:you may want to|it is important to note|it's important to note)\b/i,
    reason: 'say what to do', isCheckedInCode: false,
  },
  {
    label: '"real-time" without a number', pattern: /\breal[- ]?time\b(?!.*\d)(?<!\d.*)/i,
    reason: 'give the delay, for example "within 60 seconds"', isCheckedInCode: false,
  },
  { label: '"best"', pattern: /\bbest\b/i, reason: 'promotion; say what it does and how fast', isCheckedInCode: false },
  // Only amounts: a record's price, or the word "pricing", is ordinary data in a skill.
  {
    label: 'pricing', pattern: /[$€£]\s?\d|\d\s?(?:USD|EUR|GBP)\b|[$€£]\s?\/\s?(?:month|year|seat|user)\b|\bper seat\b/i,
    reason: 'promotion; pricing lives on the website', isCheckedInCode: false,
  },
  // "replaces" counts only before a product name, which is capitalized: "replaces Acme" compares,
  // "replaces the value" does not. \p{Lu} with the u flag but without i keeps that test exact.
  {
    label: 'a comparison',
    pattern: /\b(?:better|faster|cheaper|easier) than\b|\bunlike\b|\bcompared (?:to|with)\b|\bvs\.|\bversus\b|\balternative to\b|\binstead of using\b/i,
    reason: 'promotion; describe the build, compare nothing', isCheckedInCode: false,
  },
  {
    label: 'a comparison', pattern: /\b[Rr]eplaces\s+\p{Lu}/u,
    reason: 'promotion; describe the build, compare nothing', isCheckedInCode: false,
  },
  // Spelled in two parts so this file passes its own check.
  { label: `the word "${'ki' + 'nd'}"`, pattern: new RegExp(`\\b${'ki' + 'nd'}\\b`, 'i'), reason: 'say "type"', isCheckedInCode: true },
];

export function findWritingProblemsInText(text) {
  const problems = [];
  let isInCodeBlock = false;
  text.split('\n').forEach((line, index) => {
    const isFence = line.trimStart().startsWith('```');
    if (isFence) isInCodeBlock = !isInCodeBlock;
    const isCode = isFence || isInCodeBlock;
    const prose = isCode ? '' : line.replace(/`[^`]*`/g, '');
    const labelsOnLine = new Set();
    for (const { label, pattern, reason, isCheckedInCode } of WRITING_RULES) {
      // Two rules share the comparison label; a line is reported once per label.
      if (labelsOnLine.has(label) || !pattern.test(isCheckedInCode ? line : prose)) continue;
      labelsOnLine.add(label);
      problems.push({ lineNumber: index + 1, label, reason });
    }
  });
  return problems;
}

// A migration runbook needs another platform's name to read its export files, and only there. Each
// such file is references/<format>.md with the first line "# <Format> exports from <Platform>";
// that line declares the platform name, and the name is allowed in that file alone.
const PLATFORM_DECLARATION_PATTERN = /^# .+ exports from (.+?)\s*$/;

export function readDeclaredPlatformName(filePath, text) {
  if (basename(dirname(filePath)) !== 'references') return null;
  return text.split('\n')[0].match(PLATFORM_DECLARATION_PATTERN)?.[1] ?? null;
}

function platformNamePattern(platformName) {
  const words = platformName.split(/\s+/).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?<![\\w-])${words.join('\\s+')}(?![\\w-])`, 'i');
}

export function findPlatformNameProblemsInText(text, platformNames) {
  const problems = [];
  text.split('\n').forEach((line, index) => {
    for (const platformName of platformNames) {
      if (platformNamePattern(platformName).test(line)) {
        problems.push({
          lineNumber: index + 1,
          label: `the platform name "${platformName}"`,
          reason: 'name another platform only in its own references/<format>.md',
        });
      }
    }
  });
  return problems;
}

export function scanRepository(repositoryRoot) {
  const markdownFiles = [];
  for (const folder of PUBLISHED_FOLDERS) {
    const folderPath = join(repositoryRoot, folder);
    if (!existsSync(folderPath)) continue;
    for (const filePath of listFilesRecursively(folderPath)) {
      if (filePath.endsWith('.md')) markdownFiles.push({ filePath, text: readFileSync(filePath, 'utf8') });
    }
  }
  const platformNameByFile = new Map(markdownFiles
    .map(({ filePath, text }) => [filePath, readDeclaredPlatformName(filePath, text)])
    .filter(([, platformName]) => platformName !== null));

  const problems = [];
  for (const { filePath, text } of markdownFiles) {
    const otherPlatformNames = [...platformNameByFile]
      .filter(([declaringFile, platformName]) => declaringFile !== filePath && platformName !== platformNameByFile.get(filePath))
      .map(([, platformName]) => platformName);
    const fileProblems = [
      ...findWritingProblemsInText(text), ...findPlatformNameProblemsInText(text, new Set(otherPlatformNames)),
    ];
    for (const problem of fileProblems) problems.push({ filePath: displayPath(repositoryRoot, filePath), ...problem });
  }
  return problems.sort((first, second) => first.filePath.localeCompare(second.filePath)
    || first.lineNumber - second.lineNumber);
}

if (isRunDirectly(import.meta.url)) {
  const problems = scanRepository(REPOSITORY_ROOT);
  for (const { filePath, lineNumber, label, reason } of problems) {
    console.error(`${filePath}:${lineNumber}: uses ${label}; ${reason} (see STYLE.md)`);
  }
  if (problems.length > 0) process.exit(1);
  console.log('check-writing: no banned writing found');
}
