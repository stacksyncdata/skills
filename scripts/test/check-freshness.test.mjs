import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findStaleSkills, MAXIMUM_AGE_IN_DAYS } from '../check-freshness.mjs';

function skillVerifiedOn(verifiedOn, path = 'skills/shopify-to-netsuite-orders/SKILL.md') {
  return { path, frontmatter: { metadata: { verified_on: verifiedOn, owner: '@stacksyncdata/ai-team' } } };
}

const today = new Date('2026-10-19T12:00:00Z');

test(`flags a date more than ${MAXIMUM_AGE_IN_DAYS} days old`, () => {
  assert.deepEqual(findStaleSkills([skillVerifiedOn('2026-07-20')], today), [{
    path: 'skills/shopify-to-netsuite-orders/SKILL.md', verifiedOn: '2026-07-20', ageInDays: 91, owner: '@stacksyncdata/ai-team',
  }]);
});

test(`accepts a date exactly ${MAXIMUM_AGE_IN_DAYS} days old or newer`, () => {
  assert.deepEqual(findStaleSkills([skillVerifiedOn('2026-07-21'), skillVerifiedOn('2026-10-19')], today), []);
});

test('skips a missing or unreadable date; the validator reports those', () => {
  assert.deepEqual(findStaleSkills([skillVerifiedOn(undefined), skillVerifiedOn('soon')], today), []);
});
