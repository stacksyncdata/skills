---
name: workflows
description: Builds, changes, runs and deploys Stacksync workflows through the Stacksync MCP, from the workflow document, triggers (webhook, schedule, email, Gmail, queue), steps, code steps and data references to test runs, run logs, replays, resolved runs, drafts, copies and deletes. Use when someone wants to automate a process, create or edit a workflow, add a step or a trigger, run a workflow now, read what a run did, replay or resolve runs, put a version live, copy a workflow to another region, or pause, share or delete one.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workflows"
  resource: "workflows"
  tools: "workflows_list workflows_get workflows_schema workflows_save workflows_run workflows_runs workflows_replay workflows_resolve_runs workflows_deploy workflows_create_draft workflows_duplicate workflows_delete connectors_list connectors_get connectors_module_form connections_list connections_create variables_list"
---

## What it is

A workflow runs steps in order when its trigger fires: an HTTP request, a schedule, an email, a
queue batch or a change in a connected app. It is stored as one **document**: its steps, the edges
between them, the steps whose output the workflow returns, and a timeout in seconds. The document
is what the workflow's YAML tab shows in the web app.

- Every workflow has exactly one **Input** step. Each trigger has an edge into Input, and every
  action step is reached from Input.
- Each step has a **step id** (the web app calls it Module ID): its name in lower case, with
  spaces and dashes turned into `_`. Other steps read its output by that id.
- Each save writes a **draft**. **Deploy** makes a version live. A deployed version cannot be
  saved again: open a new draft from it first.

Full format, edges, branches and loops: [references/workflow-document.md](references/workflow-document.md).
Triggers: [references/triggers.md](references/triggers.md). Code steps:
[references/code-steps.md](references/code-steps.md).

## When to use it

- A process should repeat, run on a trigger, or chain several app actions.
- For one action in an app, now, use `connectors` (`connectors_run_action`).
- For records that stay equal between two apps, use `syncs`.
- For a failed run to diagnose step by step, follow the runbook `troubleshooting-workflow-runs`.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `connectors` | Each step and trigger is a catalog module, filled from its form | `connectors_get`, `connectors_module_form` |
| `connections` | A step that reads or writes an app uses one of the person's connections | `connections_list`, `connections_create` |
| `variables` | Steps read `{{ WORKSPACE_VARIABLES.<reference> }}` | `variables_list` |
| `queues` | Queue consumer trigger receives a batch; the queue insert step adds records | `connectors_module_form` |
| `syncs` | A sync event trigger of type `webhook` calls the workflow's webhook URL once per changed record, or type `queue` feeds a queue the workflow consumes | `syncs_triggers_save` |
| `syncs` | A workflow sync trigger step starts on record changes in an app; it is built in the web app only | None |
| `workflows` | No native link: one workflow calls another only with an HTTP step to its webhook URL | `connectors_module_form` |
| `genies` | No native link: a Genie runs single modules, never a whole workflow, and no step calls a Genie | None |
| `folders` | A workflow sits in folders | `workflows_save` `folder_id` |

## Operations

### List and find workflows

Use when you need a `workflow_id` or want to know whether a workflow already does the job.

Tools: `workflows_list`

1. Call `workflows_list` with a `search` (part of a name or id) and `region` `all`.
2. Extend a workflow that already does the job instead of building a second one.

### Read a workflow

Use when you need its steps, document, versions or an email trigger's address.

Tools: `workflows_get`

1. Call `workflows_get` with the `workflow_id`. Pass a `version` for an older one and
   `document_format` `yaml` to show it as the YAML tab does.
2. Keep the returned document: send it back as is to `workflows_save` after changing it.

### Read the document format

Use when writing a workflow document for the first time in a conversation.

Tools: `workflows_schema`

1. Call `workflows_schema` once. It returns the JSON schema, the rules and an example.
2. Write every document from it.

### Create a workflow

Use when the person wants a new automation.

Tools: `workflows_list`, `variables_list`, `workflows_schema`, `workflows_save`

1. Ask what starts it, what each step does in which app, and the region: `besg` (Europe) or
   `usnv` (United States), the one closest to the apps. Wait for the answers.
2. Check `workflows_list` and `variables_list` for what already exists.
3. Call `workflows_save` with a `name`, the `region` and a document holding only the Input step.
   A new workflow starts as a draft.
4. Add the trigger and steps with the next two operations, then save the whole document.

### Add a step

Use when the workflow needs an action in an app or a built-in module.

Tools: `connectors_list`, `connectors_get`, `connections_create`, `connectors_module_form`

1. Call `connectors_list` with one short word for the app or capability, such as `enrich`,
   `search`, `scrape`, `email` or `validate`. Try several single words: the search matches part
   of a module name, module type or app name, not the descriptions.
2. Prefer a built-in module: they enrich people and company records, find and check email
   addresses and phone numbers, search and scrape the web, extract data, run AI prompts and send
   email, with no connection.
3. Call `connectors_get` with the `app_type`. Take the `module_id` and `module_version`, and the
   person's connection. With none, call `connections_create` and give the person the link.
4. Call `connectors_module_form` with the module, version and connection. Call it again after
   each choice with `values` and the `dropdown_ids` to load, until every required field has a
   value. Ask the person for any value you do not know.
5. Put the step in the document with an edge from Input or a previous step.

Never create an API key variable for a service the catalog already covers without asking the
person: a built-in module needs no key.

### Add a trigger

Use when the workflow must start on a request, schedule, email, Gmail message or queue batch.

Tools: `connectors_get`, `connectors_module_form`, `connections_list`, `workflows_get`

1. Choose the trigger with the person:
   - HTTP request: **Receive Webhook/HTTP events**.
   - Schedule: **Automated schedule** (cron, in UTC).
   - Email: ask whether it arrives in the person's own Gmail mailbox (Gmail trigger, on a Gmail
     connection from `connections_list`) or at a Stacksync address (**Receive emails**). Other
     mailboxes forward to the Stacksync address.
   - Batch of records: queue consumer trigger on a queue (see `queues`).
2. Fill the trigger's form with `connectors_module_form`, as for a step.
3. Add an edge from the trigger into Input.
4. For Receive emails with an alias, check it is free: `workflows_get` with the trigger's
   `step_id` and the `alias`. After the save, the same call without `alias` returns the address.
5. The webhook URL is shown only on the trigger step in the web app; no tool returns it.

Saving sets up the triggers of new and changed steps; deploying sets them up for the live
version. Details per trigger: [references/triggers.md](references/triggers.md).

### Add a workflow sync trigger

Use when the person wants a run each time a record is created, updated or deleted in an app.

Tools: none

1. Do this in the web app, in the workflow builder: the sync trigger step builds a sync behind
   it, and the MCP cannot set it up.
2. Tell the person what to choose: connection, tables, columns, events, filters, and Historic
   backfill only after they confirm (it runs every existing record through the workflow).
3. For an existing sync, a sync event trigger (`syncs_triggers_save`, see `syncs`) can call the
   workflow's webhook or feed a queue instead.

### Add a code step

Use when no module covers a reshaping, calculation or piece of logic.

Tools: `connectors_list`, `connectors_get`, `connectors_module_form`

1. Search `code` and choose **Python Code** or **JavaScript Code**.
2. Pass data in under **Context**; `main(WORKFLOW_CONTEXT)` returns the step's output.
3. Use Python for HTTP calls, many records or large data: JavaScript stops after 6 seconds,
   Python after 300 seconds. Details: [references/code-steps.md](references/code-steps.md).

### Reference data between steps

Use when a step needs the trigger's data, a previous step's output or a variable.

Tools: `variables_list`, `workflows_runs`

1. Write the reference into the step's form value, using the table below.
2. For a variable, copy its `reference` from `variables_list`.
3. For a step's output, copy the exact field path from a run's step output in `workflows_runs`.

| What | Reference |
| --- | --- |
| A field of a previous step's output | `{{ step_id.field }}`, nested as `{{ step_id.field.subfield }}` |
| The trigger's data | `{{ input.body.field }}`, through the Input step |
| A workspace variable or secret | `{{ WORKSPACE_VARIABLES.reference }}`: copy the `reference` from `variables_list` |

References follow Jinja rules. Text that must keep its curly brackets is wrapped once more:
`{{ {{ text to keep }} }}`.

### Save the whole document

Use when steps, triggers or edges change.

Tools: `workflows_get`, `workflows_create_draft`, `workflows_save`

1. Call `workflows_get` and keep the document.
2. If the latest version is deployed, call `workflows_create_draft` first.
3. Show the person the steps, then call `workflows_save` with the `workflow_id`, the `region`
   and the whole document. A step left out is removed.
4. Read the `triggers` in the answer: a trigger with status `failed` carries the reason.

### Test a workflow

Use when a saved draft should be tried before it goes live.

Tools: `workflows_run`, `workflows_runs`

1. Call `workflows_run` with `mode` `run`: it runs with the Input step's test data and returns
   the queued `run_id`.
2. Call `workflows_runs` with that `run_id` and show each step's output.
3. To try one step alone, call `workflows_run` with `mode` `step_only` and the `step_id`.

### Read runs

Use when the person asks whether a workflow ran, what a step received or returned, or why it failed.

Tools: `workflows_runs`, `workflows_get`

1. Call `workflows_runs` with `workflow_id`, `region` and a time range (`time_range_start`,
   `time_range_end`, ISO 8601). Add `query` `workflow.execution_status='ERROR'` for failures.
   `limit` takes up to 1,000 (30 by default); pass `next_cursor` as `cursor` for the next page.
2. Call it with a `run_id` for each step's input, output and error; add a `step_id` for one step
   in full. Code steps' `print()` and `console.log()` output is `stdout` in the log whose
   `log_type` is `execution_metadata`.
3. Map step ids to step names with `workflows_get`.

`workflows_runs` is refused while "Allow log access" is off: a workspace owner switches it on in
the **MCP** page under **Settings**.

### Replay runs

Use when runs should run again, usually on a fixed version.

Tools: `workflows_run`, `workflows_replay`, `workflows_runs`

Which call and `mode` for each case: [references/runs.md](references/runs.md).

1. State how many runs will replay and what they write. A replay is at-least-once with no
   de-duplication: steps that already succeeded run again with `replay_all`. Prefer
   `replay_failed` when earlier steps already changed data. Wait for the person's yes.
2. Pass the fixed `version`. Without it, `workflows_replay` replays each run on its own old
   version, which fails the same way; `workflows_run` uses the latest version.
3. `workflows_replay` with `run_ids` returns the new `run_id` values; by `query` it returns only
   counts, so find the new runs with `workflows_runs`.

`replay_failed` and `replay_failed_and_dependents` work only on a run that failed.

### Resolve runs

Use when failed runs are handled and should leave the list of failures.

Tools: `workflows_resolve_runs`

1. After the person confirms the failures are handled, call `workflows_resolve_runs` with one
   `run_id`, or a `query` and a time range. It changes no data.
2. To reopen one run, pass its `run_id` with `is_resolved` `false`.

### Deploy a version

Use when a tested version should go live.

Tools: `workflows_deploy`

1. After the person confirms, call `workflows_deploy` with the `workflow_id` and `region`. Pass a
   `version`, or none for the latest.
2. Deploying sets up every trigger for the version: webhooks, schedules, email, Gmail, queue
   consumers and sync triggers. A trigger step with status `failed` stops the work: report its
   message.

### Open a new draft

Use when the latest version is deployed and must change.

Tools: `workflows_create_draft`

1. Call `workflows_create_draft` with the `workflow_id`, the `region` and, for an older version,
   its `version`. It copies the version into a new draft.

### Duplicate a workflow or copy it to another region

Use when the person wants a copy, in the same region or the other one.

Tools: `workflows_duplicate`

1. Call `workflows_duplicate` with a new `name`; pass `copy_region` for the other region.
2. The copy is a new workflow with its own draft. A Receive emails step keeps its source's alias
   in the document but receives no email: give it a new alias and save.

### Rename, pause or share a workflow

Use when only the name, the on/off status or sharing changes.

Tools: `workflows_save`

1. Call `workflows_save` with the `workflow_id`, the `region` and only `name`, `status`
   (`running` or `paused`) or `is_shared_with_workspace`. A call carries these fields or a
   document, never both.
2. `paused` stops the workflow's schedules and sync triggers until it is switched on again.

### Delete a workflow

Use when the person names a workflow to remove for good.

Tools: `workflows_delete`

1. Confirm the workflow by name with the person; offer `paused` instead when they may need it again.
2. Call `workflows_delete` with the `workflow_id` and `region`. Its schedules and sync triggers stop.

### Set alerts for failed runs

Use when the person wants an email when a run fails.

Tools: none

1. Do this in the web app: **Workspace Settings > Notifications**. The MCP has no tool for
   notification settings.

## Defaults and limits

- Up to 20 runs of one workflow at a time. Runs are at-least-once with no automatic retry: use
  a replay.
- Code steps: JavaScript 6 seconds, Python 300 seconds.
- `workflows_runs` returns 30 runs by default, up to 1,000 per page.
- Run logs are kept for the plan's retention: 1 day on Starter, 7 days on Pro, 30 days on
  Enterprise.

## Rules

| Rule | Why |
| --- | --- |
| Configure every step from `connectors_module_form`; never copy a step from another workflow | The form holds the app's live fields and options; a copied step carries another workflow's connection and values |
| Search the catalog by capability with short single words, and use a built-in module first | A built-in module needs no key and no extra account |
| Never create an API key variable for a service the catalog covers without asking | A key the person did not ask for is a secret to manage |
| Ask whether an email arrives in the person's own Gmail mailbox or at a Stacksync address | The two need different triggers |
| Send the whole document to `workflows_save` | A save overwrites the draft; missing steps are removed |
| Test with `workflows_run` before `workflows_deploy` | A deployed workflow starts on every request, schedule, email or batch |
| Replay on the fixed version, after the person's yes | A replay writes to the apps again |
| Never ask for a password or key; use `connections_create` | A secret typed into a chat stays in the chat history |
| Writes run directly unless the workspace turned on "Ask before every change"; then the person accepts the change and only then report it done | A declined change means nothing changed |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| The save is refused because the version is deployed | Only a draft can be saved | `workflows_create_draft`, then `workflows_save` again |
| A step disappeared after a save | The document sent left it out | Copy it from an older `version` with `workflows_get`, or rebuild it with `connectors_module_form`, then save the whole document |
| A reference comes through empty | The step id or field name differs from the output | Read a run's step output with `workflows_runs` and copy the exact path |
| No runs at all | The version is not deployed, the trigger has no edge into Input, or the workflow is paused | Check with `workflows_get`, fix, save and `workflows_deploy` |
| A trigger step reports `failed` | Its settings were refused or it could not be set up | Report the message; fix the form values with `connectors_module_form` |
| `workflows_runs` is refused | "Allow log access" is off | A workspace owner switches it on in **Settings > MCP** |
| A replay fails the same way | It ran on the old version | Replay with the fixed `version` |
| A JavaScript step times out | JavaScript steps stop after 6 seconds | Move the work to a Python step |
