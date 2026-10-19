// Fails when a file holds a value shaped like a real credential. Skills are public and AI apps
// copy their examples into live accounts, so an example must use an obvious stand in instead.
import { readFileSync } from 'node:fs';
import { REPOSITORY_ROOT, listFilesRecursively, displayPath, isRunDirectly } from './lib/skill-files.mjs';

export const SECRET_PATTERNS = [
  { label: 'private key', pattern: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY( BLOCK)?-----/ },
  { label: 'AWS access key', pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { label: 'GitHub token', pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/ },
  { label: 'GitHub fine grained token', pattern: /\bgithub_pat_[A-Za-z0-9_]{60,}\b/ },
  { label: 'Slack token', pattern: /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/ },
  { label: 'Stripe secret key', pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/ },
  { label: 'OpenAI or Anthropic key', pattern: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{32,}\b/ },
  { label: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { label: 'JSON web token', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { label: 'bearer token', pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/ },
  {
    label: 'credential assignment',
    pattern: /\b(?:api[_-]?key|secret|password|access[_-]?token|client[_-]?secret)["']?\s*[:=]\s*["'][A-Za-z0-9+/_.-]{20,}["']/i,
  },
];

// Files that are binary or third party text never hold our examples.
const SKIPPED_EXTENSIONS = /\.(png|jpe?g|gif|webp|ico|pdf|zip|woff2?)$/i;

export function findSecretsInText(text) {
  const findings = [];
  text.split('\n').forEach((line, index) => {
    for (const { label, pattern } of SECRET_PATTERNS) {
      if (pattern.test(line)) findings.push({ lineNumber: index + 1, label });
    }
  });
  return findings;
}

export function scanRepository(repositoryRoot) {
  const findings = [];
  for (const filePath of listFilesRecursively(repositoryRoot)) {
    if (SKIPPED_EXTENSIONS.test(filePath)) continue;
    for (const finding of findSecretsInText(readFileSync(filePath, 'utf8'))) {
      findings.push({ filePath: displayPath(repositoryRoot, filePath), ...finding });
    }
  }
  return findings;
}

if (isRunDirectly(import.meta.url)) {
  const findings = scanRepository(REPOSITORY_ROOT);
  for (const { filePath, lineNumber, label } of findings) {
    console.error(`${filePath}:${lineNumber}: looks like a ${label}; use a stand in such as YOUR_API_KEY`);
  }
  if (findings.length > 0) process.exit(1);
  console.log('check-secrets: no credential shaped values found');
}
