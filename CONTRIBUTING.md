# Contributing

Every change arrives as a pull request, and CI checks it before anyone reviews it. Write by
[STYLE.md](STYLE.md); CI enforces its banned list.

## Skill types

Every skill is one folder, `skills/<name>/`, holding `SKILL.md` and, when needed, `references/`,
`scripts/`, `assets/` and `evals/`. `metadata.type` says what it is:

| Type | What it covers | Template |
| --- | --- | --- |
| `guide` | One Stacksync resource, such as syncs, or one method, such as getting started | `templates/guide/` |
| `playbook` | Several resources working together, whatever the apps | `templates/playbook/` |
| `usecase` | A playbook applied to two named apps, proven on a live workspace | `templates/usecase/` |

## Adding a use case

Without code: open an issue with the **Integration use case** form. A maintainer adds the
`draft-usecase` label, an AI agent drafts the use case as a draft pull request, and a reviewer who ran
the use case live corrects it and adds the evidence.

With code: copy `templates/usecase/` (with its `evals/` folder) to `skills/<name>/`, fill in every
metadata key and section, delete the template comments, run `node scripts/generate-catalog.mjs`
and `npm test`, and open a pull request.

An AI agent drafts only. It never approves, merges or marks a pull request ready; a person who
ran the use case live does.

## Rules for every skill

- `name` equals the folder name: lowercase letters, digits and single hyphens, at most 64
  characters, without the reserved words "claude" or "anthropic".
- `description` is at most 1,024 characters, in the third person, and says "Use when …". AI apps
  choose skills by this sentence alone.
- `license` is set, and every `metadata` value is one plain string; lists such as `tools` are
  separated by spaces.
- `metadata.type`, `metadata.version` (for example `"1.2.0"`) and `metadata.owner`, a GitHub team
  handle such as `@stacksyncdata/ai-team`, are required. `areas`, `tools` and `status` are
  optional; a skill with `status: deprecated` names its replacement in `superseded_by`.
- `SKILL.md` stays under 500 lines; long material goes in `references/`.
- Customer words only, and stand ins such as `YOUR_API_KEY`, never a real credential.

Raise the patch version for wording fixes, the minor version for new steps, and the major version
when the skill asks for different tools or a different order of work.

## Rules for playbooks and use cases

- "Before you start" is copied word for word from `templates/usecase/before-you-start.md`. It
  connects the Stacksync MCP only when it is not already connected; it is a prerequisite, never an
  advertisement.
- The sections follow the template, in order, and the body stays under 200 lines.
- `evals/evals.json` holds at least 3 test prompts with expected outcomes.
- `metadata.resources` and `metadata.verified_on` are required: the date of the last end to end
  run on a live workspace.
- A playbook names no apps, and "When to use this playbook" gives a number, such as "more than
  100 changes per minute".
- A use case is named `<source>-to-<destination>-<object>` for one-way or
  `<a>-and-<b>-<object>-two-way-sync` for two-way, using slugs from
  [data/apps.json](data/apps.json). Its description reads "<Verb>s … with Stacksync. Use when …".
  `metadata.playbooks` may name the published playbooks it applies.

## Platform names

Skills name no other platform, with one exception: a migration guide reads another platform's
export files. Each format gets `references/<format>.md`, whose first line is
`# <Format> exports from <Platform>`. That line declares the platform name, and CI fails the name
anywhere else. Comparisons stay banned everywhere, reference files included.

## Review gates

A playbook or use case merges only after all four:

| Gate | Who or what |
| --- | --- |
| Lint | CI: `npm test` |
| Live run | A reviewer ran it end to end on a live workspace through the Stacksync MCP; date, workspace type and result are in the pull request |
| Approval | A maintainer from a team CODEOWNERS lists for the path |
| Quarterly re-run | `scripts/check-freshness.mjs` warns when `verified_on` is more than 90 days old; the owner runs it again and updates the date |

## Checks

`npm test` runs every check with Node 22 and no dependencies, as CI does:

| Check | Fails when |
| --- | --- |
| `scripts/validate-skills.mjs` | A skill breaks a rule above or sits anywhere but `skills/<name>/SKILL.md`. Unknown metadata keys only warn |
| `scripts/check-writing.mjs` | A Markdown file in `skills/` uses something STYLE.md bans, or a platform name outside its reference file |
| `scripts/check-secrets.mjs` | A value shaped like an API key, token or private key appears in any file |
| `scripts/check-tools.mjs` | A tool in `metadata.tools` is not in the MCP tool list; skipped unless `STACKSYNC_TOOLS_JSON` points at it |
| `scripts/check-freshness.mjs` | Never fails; warns when `verified_on` is more than 90 days old |
| `scripts/generate-catalog.mjs --check` | `catalog.json` or the index in `skills/README.md` is out of date |
| `node --test scripts/test/*.test.mjs` | A check itself is broken |

## Growing without breaking installs

Skill names are permanent, because installs and other skills refer to them. A rename publishes
the new skill and keeps the old name as a short skill with `status: deprecated` and
`superseded_by` pointing at the new one. The same rule covers what comes later: a list of allowed
`areas` values, a renames file, `language` or `industry` keys, or checksums of each skill. Each
arrives as a new optional key or a new file next to `catalog.json`, which unknown-key warnings and
the catalog `schema` number let older readers ignore.
