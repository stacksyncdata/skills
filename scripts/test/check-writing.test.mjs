import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findWritingProblemsInText, scanRepository } from '../check-writing.mjs';
import { REPOSITORY_ROOT } from '../lib/skill-files.mjs';
import { createRepository, fixtureSolutionText, fixtureReferenceText } from './helpers.mjs';

function labelsFor(text) {
  return findWritingProblemsInText(text).map((problem) => problem.label);
}

// One sentence per rule. Banned words are joined at run time where this file would otherwise
// hold the word the validator rejects.
const sentencesByLabel = {
  'a banned phrase': 'Orders flow seamlessly into NetSuite.',
  '"This skill"': 'This skill builds a workflow.',
  'an em dash or en dash': 'Orders arrive — then sync.',
  'an exclamation mark': 'Orders arrive in seconds!',
  'a {{ }} placeholder': 'Set the field to {{ order id }}.',
  'a <your …> placeholder': 'Connect <your store> first.',
  'TODO or TBD': 'Limits: TBD.',
  'lorem ipsum': 'Lorem ipsum dolor.',
  'a template comment': '<!-- Copy this folder -->',
  hedging: 'You may want to check the mapping.',
  '"real-time" without a number': 'Orders sync in real-time.',
  '"best"': 'The best way to sync orders.',
  pricing: 'Costs $49 a month.',
  'a comparison': 'Faster than other tools.',
  [`the word "${'ki' + 'nd'}"`]: `Pick the ${'ki' + 'nd'} of sync.`,
};

for (const [label, sentence] of Object.entries(sentencesByLabel)) {
  test(`finds ${label}`, () => {
    assert.ok(labelsFor(sentence).includes(label), `expected ${label} in ${labelsFor(sentence)}`);
  });
}

test('reports the line number of each problem', () => {
  assert.deepEqual(findWritingProblemsInText('Fine.\nA robust sync.\n').map((problem) => problem.lineNumber), [2]);
});

test('finds every comparison wording', () => {
  const sentences = [
    'Better than other tools.', 'Cheaper than a developer.', 'Easier than a script.', 'Unlike other tools.',
    'Compared to a script.', 'Compared with a script.', 'Sync vs. export.', 'Sync versus export.',
    'An alternative to scripts.', 'It replaces Acme Flows.', 'Replaces Acme for order entry.',
    'Instead of using a script.',
  ];
  for (const sentence of sentences) assert.ok(labelsFor(sentence).includes('a comparison'), sentence);
});

test('finds every pricing amount', () => {
  const sentences = ['Costs $49.', 'From € 20 a month.', 'Only 30 USD.', 'Billed at $/month.', 'Priced per seat.', 'Pay £/user.'];
  for (const sentence of sentences) assert.ok(labelsFor(sentence).includes('pricing'), sentence);
});

test('allows "replaces" and "price" in ordinary sentences', () => {
  const text = [
    'The sync replaces the value in the destination record.',
    'A later run replaces it with the new address.',
    'Map the price field of each order line to the item rate.',
    'Prices, priced items and the pricing level are fields like any other.',
    'One connection per user, and 2 seats in the meeting room.',
  ].join('\n');
  assert.deepEqual(labelsFor(text), []);
});

test('reports a line once when both comparison rules match', () => {
  assert.deepEqual(labelsFor('Unlike scripts, it replaces Acme Flows.'), ['a comparison']);
});

test('allows plain writing, numbers with real-time, and words that only contain a banned one', () => {
  const text = [
    'Changes reach NetSuite in real time, within 60 seconds.',
    'The workflow unlocked nothing and is kindly precise.',
    'Shopify sends each new order as a webhook.',
    '![Diagram](diagram.png)',
  ].join('\n');
  assert.deepEqual(labelsFor(text), []);
});

test('leaves code alone for prose rules, but still finds leftovers in it', () => {
  assert.deepEqual(labelsFor('Compare with `status != "done"` and `{{ steps.order.id }}`.'), []);
  assert.deepEqual(labelsFor('```\nif (done != true) return "ok!";\n```'), []);
  assert.deepEqual(labelsFor('```\n// TODO handle refunds\n```'), ['TODO or TBD']);
});

test('allows only the catalog markers as comments', () => {
  assert.deepEqual(labelsFor('<!-- catalog:start -->\n<!-- catalog:end -->'), []);
  assert.deepEqual(labelsFor('<!-- catalog:start --> <!-- note -->'), ['a template comment']);
});

test('the fixture solution has no banned writing', () => {
  assert.deepEqual(findWritingProblemsInText(fixtureSolutionText), []);
});

test('checks skills/, and leaves templates/ and evals out', () => {
  const repositoryRoot = createRepository({
    'skills/building-syncs/SKILL.md': 'A robust sync.\n',
    'skills/batch-sync-changes-through-a-queue/SKILL.md': 'Fine.\nOrders arrive!\n',
    'skills/shopify-to-netsuite-orders/SKILL.md': '<!-- leftover -->\n',
    'skills/shopify-to-netsuite-orders/evals/evals.json': '{"prompt": "Sync it now!"}\n',
    'templates/solution/SKILL.md': 'A robust sync.\n',
  });
  assert.deepEqual(scanRepository(repositoryRoot).map(({ filePath, lineNumber }) => `${filePath}:${lineNumber}`), [
    'skills/batch-sync-changes-through-a-queue/SKILL.md:2',
    'skills/building-syncs/SKILL.md:1',
    'skills/shopify-to-netsuite-orders/SKILL.md:1',
  ]);
});

// The fixture reference file declares the fictional platform "Acme Flows" in its first line.
const REFERENCE_PATH = 'skills/migrating-to-stacksync/references/flow-json.md';

function problemsInRepository(files) {
  return scanRepository(createRepository(files)).map(({ filePath, lineNumber, label }) => `${filePath}:${lineNumber}: ${label}`);
}

test('a platform name is allowed only in the reference file that declares it', () => {
  assert.deepEqual(problemsInRepository({ [REFERENCE_PATH]: fixtureReferenceText }), []);
  const runbook = 'Read references/flow-json.md for each export.\nThen rebuild each ACME  flows step.\n';
  assert.deepEqual(problemsInRepository({ [REFERENCE_PATH]: fixtureReferenceText, 'skills/migrating-to-stacksync/SKILL.md': runbook }), [
    'skills/migrating-to-stacksync/SKILL.md:2: the platform name "Acme Flows"',
  ]);
});

test('a first line outside references/ declares nothing', () => {
  const files = { 'skills/migrating-to-stacksync/flow-json.md': fixtureReferenceText, 'skills/other/SKILL.md': 'Acme Flows.\n' };
  assert.deepEqual(problemsInRepository(files), []);
});

test('a reference file still follows the comparison rule', () => {
  const text = `${fixtureReferenceText}Stacksync is faster than Acme Flows.\n`;
  assert.deepEqual(problemsInRepository({ [REFERENCE_PATH]: text }), [`${REFERENCE_PATH}:5: a comparison`]);
});

test('this repository has no banned writing', () => {
  assert.deepEqual(scanRepository(REPOSITORY_ROOT), []);
});
