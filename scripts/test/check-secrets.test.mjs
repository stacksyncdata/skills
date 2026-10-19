import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findSecretsInText, scanRepository } from '../check-secrets.mjs';
import { REPOSITORY_ROOT } from '../lib/skill-files.mjs';

// Each fake credential is joined at run time so this file never holds one and passes the scan.
const fakeCredentials = {
  'private key': ['-----BEGIN RSA ', 'PRIVATE KEY-----'].join(''),
  'AWS access key': ['AKIA', 'ABCDEFGHIJKLMNOP'].join(''),
  'GitHub token': ['ghp_', 'a'.repeat(36)].join(''),
  'Slack token': ['xoxb-', '1234567890-abcdef'].join(''),
  'OpenAI or Anthropic key': ['sk-ant-', 'b'.repeat(40)].join(''),
  'JSON web token': ['eyJ', 'hbGciOiJIUzI1NiJ9', '.eyJ', 'zdWIiOiIxMjM0NTY3ODkwIn0', '.', 'c'.repeat(20)].join(''),
  'bearer token': ['Authorization: Bearer ', 'd'.repeat(30)].join(''),
  'credential assignment': ['api_key = "', 'e'.repeat(24), '"'].join(''),
};

for (const [label, credential] of Object.entries(fakeCredentials)) {
  test(`finds a ${label}`, () => {
    const labels = findSecretsInText(`intro\n${credential}\n`).map((finding) => finding.label);
    assert.ok(labels.includes(label), `expected ${label} in ${labels}`);
  });
}

test('allows obvious stand ins', () => {
  const standIns = 'Authorization: Bearer YOUR_TOKEN\napi_key: "YOUR_API_KEY"\nstacksync login --api-key $KEY';
  assert.deepEqual(findSecretsInText(standIns), []);
});

test('this repository holds no credential shaped values', () => {
  assert.deepEqual(scanRepository(REPOSITORY_ROOT), []);
});
