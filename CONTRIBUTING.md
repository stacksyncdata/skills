# Contributing

Every change arrives as a pull request, and CI checks it before anyone reviews it.

## Who adds what

| Who | Adds | Review |
| --- | --- | --- |
| Resource owners (engineers) | Resource skills, updated whenever one of their tools changes | The owning team in CODEOWNERS |
| Solutions and marketing | Recipes from real customer integrations | The solutions owner and one engineer |
| AI agents | Drafts of any skill, started from a template | The same as a person; an agent opens the pull request and never merges it |

## Start from a template

1. Copy the matching folder from `templates/`:
   - `templates/resource-skill/` into `skills/<name>/`
   - `templates/recipe/` into `recipes/<name>/`
   - `templates/playbook/` into `skills/<name>/`
2. Set `name` in the frontmatter to the new folder name: lowercase letters, digits and hyphens,
   at most 64 characters.
3. Write the `description` (at most 1,024 characters) as what the skill does, followed by
   "Use when …". Your AI app chooses skills by this sentence alone, so make it specific.
4. Fill in every section and every `metadata` key. Metadata values are plain strings; lists
   such as `tools` or `systems` are separated by spaces.
5. Keep `SKILL.md` under 500 lines. Put long material in `references/`, worked examples in
   `examples/` and helper files in `scripts/`; AI apps load them only when needed.
6. Run the checks below, then run `node scripts/generate-catalog.mjs` and commit the updated
   `catalog.json`.

Write in customer words: the names people see in the Stacksync web app, never internal names.
Say "type", never the word the validator rejects. Examples use stand ins such as
`YOUR_API_KEY`, never a real credential.

## Checks

CI runs these on every pull request, with Node 22 and no dependencies. Run them locally with
`npm test`:

| Check | Fails when |
| --- | --- |
| `scripts/validate-skills.mjs` | A name does not match its folder, a description is over 1,024 characters or has no "Use when", a body is over 500 lines, metadata is missing for the skill type, or the rejected word for "type" appears |
| `scripts/check-secrets.mjs` | A value shaped like an API key, bearer token or private key appears in any file |
| `scripts/check-tools.mjs` | A tool named in `metadata.tools` is not in the MCP tool list. Set `STACKSYNC_TOOLS_JSON` to the path of `tools.json`; without it the check is skipped |
| `scripts/generate-catalog.mjs --check` | `catalog.json` does not match the skills |
| `node --test scripts/test/*.test.mjs` | A check itself is broken |

## Versions

Each skill carries `metadata.version` (for example `"1.2.0"`). Raise the patch number for
wording fixes, the minor number for new steps or examples, and the major number when the skill
asks for different tools or a different order of work.

## Promotion

Changes move through `dev`, `stage` and `prod` branches by pull request, like other Stacksync
repositories. The Stacksync MCP server installs the skills from the branch for its environment
on its next deploy; plugin users receive them when the plugin version is raised.
