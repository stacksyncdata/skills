# Contributing

Every change arrives as a pull request, and CI checks it before anyone reviews it. Write by
[STYLE.md](STYLE.md); CI enforces its banned list.

## Skill types

Every skill is one folder, `skills/<name>/`, holding `SKILL.md` and, when needed, `references/`,
`scripts/`, `assets/` and `evals/`. `metadata.type` says what it is:

| Type | One per | Answers | Template |
| --- | --- | --- | --- |
| `resource` | Stacksync resource | What it is, when to use it, what it connects to, and every operation and how to do it | `templates/resource/` |
| `blueprint` | Reusable design combining resources | When, why, advantages and trade-offs, the shape, and how to build it | `templates/blueprint/` |
| `solution` | Real build between named apps, proven live | The outcome, the blueprint used, what was built, the build log, the proof, and how to adapt it | `templates/solution/` |
| `runbook` | Ordered procedure across resources | When to use it, numbered steps each with a check, and the rules | `templates/runbook/` |

Pick the type with the first question that answers yes:

1. Does it name the apps and was it proven on a live workspace? A `solution`.
2. Does it combine two or more resources into one build? A `blueprint`.
3. Is it an ordered procedure with checks across resources, such as troubleshooting, migrating,
   onboarding or building a connector? A `runbook`.
4. Otherwise it covers one resource: a `resource`.

How they link: a solution follows a blueprint (`metadata.blueprints`), a blueprint's build steps
name a resource skill and its `### Operation`, and a runbook's steps name resource operations too.
Each skill links to another by its folder name in backticks, such as `queues`, and never copies
the steps it links to.

## Sections by type

Each type has these `##` sections, exactly and in this order. CI checks them.

| Type | Sections |
| --- | --- |
| `resource` | What it is, When to use it, Connects to, Operations, Defaults and limits, Rules, Common problems |
| `blueprint` | Use it when, Why this design, Shape, Build it, Variations, Check before going live, Rules |
| `solution` | Outcome, Blueprint, What was built, Build log, Proof, Adapt it |
| `runbook` | Use it when, Before you start, Steps, Rules, When the MCP cannot do it |

- Resource: `metadata.resource` names the resource. "Connects to" is a table
  `| Resource | How they link | Tool |` with one row per linked resource, naming its published
  resource skill in backticks, including links people expect that do not exist ("No native
  link: ..."). "Operations" holds one `### <Operation>` block per operation, with a verb-first
  title; each block has a "Use when ..." line, a `Tools:` line with the MCP tools in call order,
  and numbered steps. It covers every MCP tool of the resource and every operation only the web
  app does. "Common problems" is a table `| What the person sees | Why | What to do |`.
- Blueprint: `metadata.resources` names two or more published resource skills. "Use it when"
  gives a number, such as "more than 100 changes per minute". "Shape" is a table
  `| Step | Resource | Links to | How |` naming published resource skills, plus a text diagram in
  a code block. "Build it" is a numbered list. A blueprint names no apps; `metadata.verified_on`
  is optional.
- Solution: `metadata.blueprints` names published blueprints, `metadata.apps` names two or more
  slugs from [data/apps.json](data/apps.json), and `metadata.verified_on` is the date of the last
  end to end run on a live workspace. "Blueprint" names the blueprint in backticks.
  `evals/evals.json` holds at least 3 test prompts with expected outcomes, and the body stays
  under 250 lines.
- Runbook: "Steps" is a numbered list, and each step ends with a `Check:` line saying what to
  confirm before the next step. A troubleshooting runbook follows one order: locate, read the
  logs, explain, suggest, apply after the person agrees, confirm. It teaches that order, never a
  catalog of error messages.

## Adding a solution

Without code: open an issue with the **Integration solution** form. A maintainer adds the
`draft-solution` label, an AI agent drafts the solution as a draft pull request, and a reviewer
who ran the build live corrects it and adds the evidence.

With code: copy `templates/solution/` (with its `evals/` folder) to `skills/<name>/`, fill in every
metadata key and section, delete the template comments, run `node scripts/generate-catalog.mjs`
and `npm test`, and open a pull request.

An AI agent drafts only. It never approves, merges or marks a pull request ready; a person who
ran the solution live does.

## Rules for every skill

- `name` equals the folder name: lowercase letters, digits and single hyphens, at most 64
  characters, without the reserved words "claude" or "anthropic".
- `description` is at most 1,024 characters, in the third person, and says "Use when …". AI apps
  choose skills by the description alone, and the MCP's `skills_list` shows only the sentence that
  starts with "Use when". That sentence names the requests the skill answers, in the person's
  words, and no request another skill's "Use when" sentence already names.
- `license` is set, and every `metadata` value is one plain string; lists such as `tools` are
  separated by spaces.
- `metadata.type`, `metadata.version` (for example `"1.2.0"`) and `metadata.owner`, a GitHub team
  handle such as `@stacksyncdata/ai-team`, are required. `areas`, `tools` and `status` are
  optional; a skill with `status: deprecated` names its replacement in `superseded_by`.
- `SKILL.md` stays under 500 lines (aim for 250); long material goes in `references/`.
- Customer words only, and stand ins such as `YOUR_API_KEY`, never a real credential.

Raise the patch version for wording fixes, the minor version for new steps, and the major version
when the skill asks for different tools or a different order of work. Until the first release
every skill stays at 1.0.0; the bump rule applies from then on.

A skill teaches the process and the MCP tools. The web app appears only where the MCP cannot do a
step, as one line that says why: "Do this in the web app: **Screen > tab**". When the person may
want to look themselves, one "In the web app: **Screen > tab**" line at most. No tables of web app
screens and no web app column next to the MCP tools: the AI app reads the skill, and it cannot
open a screen.

## Platform names

Skills name no other platform, with one exception: a migration runbook reads another platform's
export files. Each format gets `references/<format>.md`, whose first line is
`# <Format> exports from <Platform>`. That line declares the platform name, and CI fails the name
anywhere else. Comparisons stay banned everywhere, reference files included.

## Review gates

A solution merges only after all four:

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
| `scripts/validate-skills.mjs` | A skill breaks a rule above (including its type's sections and their structure), sits anywhere but `skills/<name>/SKILL.md`, names a skill that does not exist, or has a table column or heading of web app screens. Unknown metadata keys only warn |
| `scripts/check-writing.mjs` | A Markdown file in `skills/` uses something STYLE.md bans, or a platform name outside its reference file |
| `scripts/check-secrets.mjs` | A value shaped like an API key, token or private key appears in any file |
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
