---
name: building-workflows
description: Builds and changes Stacksync workflows through the Stacksync MCP, from the workflow document to the trigger (webhook, schedule, email or app event), each step's form, Python and JavaScript code steps, data references between steps, drafts, versions, duplicates and deploys. Use when someone wants to automate a process, create or edit a workflow, add a step or a trigger, run code in a workflow, reference a previous step's output, copy a workflow to another region, or put a new version live.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workflows"
  tools: "workflows_list workflows_get workflows_schema connectors_list connectors_get connectors_module_form connections_create variables_list workflows_save workflows_run workflows_runs workflows_deploy workflows_create_draft workflows_duplicate workflows_delete"
---

## When to use

Use this guide to create a workflow, change its steps or triggers, or put a version live. A
workflow runs steps in order when its trigger fires: an HTTP request, a schedule, an email or a
change in a connected app.

Use `running-app-actions` for one read or change in an app with no workflow,
`monitoring-workflow-runs` for runs that failed, `managing-variables-and-secrets` for values steps
read, and `managing-queues` when records should reach a workflow in batches.

## How a workflow is stored

- A workflow is one **document**: its steps, the edges between them, the steps whose output the
  workflow returns, and a timeout in seconds. It is what the workflow's YAML tab shows in the web
  app.
- Every workflow has exactly one **Input** step. Each trigger has an edge into Input, and every
  action step is reached from Input. Read trigger data through Input, as the docs recommend.
- Each step has a **step id** (the web app calls it Module ID), made from its name in lower case
  with spaces and dashes turned into `_`. Other steps reference its output by that id.
- Each save writes a **draft**. **Deploy** makes a version live. A deployed version cannot be
  saved again: open a new draft from it first.

The full format, edges, branches and loops: [references/workflow-document.md](references/workflow-document.md).

## Before you build

Ask the person, and wait for the answers:

1. What starts the workflow: an HTTP request, a schedule, an email, or a change in an app?
2. What should each step do, in which app, with which records?
3. Which region: `besg` (Europe) or `usnv` (United States)? Choose the one closest to the apps it
   talks to.

Then discover what exists:

1. `workflows_list` with a `search`: extend a workflow that already does this job instead of
   building a second one.
2. `variables_list`: values such as account IDs or thresholds that steps should read instead of
   holding them as fixed text.

## Steps

1. **Read the document format once.** Call `workflows_schema`. It returns the JSON schema, the
   rules and an example. Write documents from it.
2. **Find each step's module.** Call `connectors_list` with the app name, then `connectors_get`
   with its `app_type`. The answer lists the actions and triggers (`module_id`,
   `module_version`) and the person's connections for that app. With no connection, call
   `connections_create` and give the person the sign in link it returns.
3. **Fill each step's form.** Call `connectors_module_form` with the module, version and
   connection. Call it again after each choice, passing `values` and the `dropdown_ids` to load,
   until every required field has a value. Ask the person when a required value is not known;
   never guess one.
4. **Create the workflow.** Call `workflows_save` with a `name`, the `region` and a document with
   only the Input step. A new workflow starts as a draft.
5. **Save the steps.** Call `workflows_save` once with the `workflow_id`, the `region` and the whole
   document: triggers, Input, every action and edges. Fill every step's form first, so the person
   approves the whole workflow in one change. Show the person the steps first.
6. **Read it back.** Call `workflows_get` and show the saved steps and each trigger's status.
7. **Test it.** Call `workflows_run` with `mode` `run`, which runs with the Input step's test
   data. Read the result with `workflows_runs` and the `run_id`, and show each step's output.
8. **Deploy.** After the person confirms, call `workflows_deploy`. A trigger step that reports a
   failed status stops the work: report it to the person.

Triggers and their setup: [references/triggers.md](references/triggers.md). Code steps:
[references/code-steps.md](references/code-steps.md).

## Changing a workflow

1. Call `workflows_get` and keep the document it returns.
2. If the latest version is deployed, call `workflows_create_draft`. It copies the version into a
   new draft.
3. Change the document and send all of it to `workflows_save`. The save overwrites the whole
   document of the draft, so a step left out is removed.
4. Test with `workflows_run`, then `workflows_deploy` once the person confirms.

To rename, pause or share a workflow, call `workflows_save` with only `name`, `status` or
`is_shared_with_workspace`. A call carries either the document or these fields, never both.

To copy a workflow, call `workflows_duplicate` with a new `name`. Pass `copy_region` to copy it to
the other region. The copy is a new workflow with its own draft.

## Referencing data

| What | Reference |
| --- | --- |
| A field of a previous step's output | `{{ step_id.field }}`, nested as `{{ step_id.field.subfield }}` |
| The trigger's data | `{{ input.body.field }}`, through the Input step |
| A workspace variable or secret | `{{ WORKSPACE_VARIABLES.name }}`, from `variables_list` |

References follow Jinja templating rules. Text that must keep its double curly brackets is
wrapped once more, as the docs show: `{{ {{ text to keep }} }}`.

## Rules

| Rule | Why |
| --- | --- |
| Configure every step from `connectors_module_form`; never copy a step from another workflow as a template | The form holds the app's live fields and dropdown options; a copied step carries another workflow's connection and values |
| Send the whole document to `workflows_save` | A save overwrites the draft's document; a partial document removes the missing steps |
| Test with `workflows_run` before `workflows_deploy` | A deployed workflow starts on every webhook, schedule, email or app change |
| Put changing values in variables, not in step fields | One variable change updates every step that reads it |
| Delete a workflow with `workflows_delete` only after the person names it and agrees; pausing with `workflows_save` `status` `paused` keeps it | A deleted workflow's schedules and sync triggers stop, and it cannot be brought back |
| Never ask for a password or key; use `connections_create` | A secret typed into a chat stays in the chat history |
| Writes run directly unless the workspace turned on "Ask before every change"; then the person sees a preview card and selects Accept. Report a change only after it ran | A declined card means nothing changed |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| The save is refused because the version is deployed | Only a draft can be saved | `workflows_create_draft`, then `workflows_save` again |
| A step disappeared after a save | The document sent to `workflows_save` left it out | `workflows_get` the previous version, add the step back, save the whole document |
| A reference comes through empty | The step id or field name differs from the output | Read a run's step output with `workflows_runs` and copy the exact path |
| The schedule or email trigger never fires | The trigger has no edge into Input, or the version is not deployed | Add the edge, save, then `workflows_deploy` |
| `workflows_deploy` reports a failed trigger step | The trigger could not be set up | Report the step's message; fix its form values with `connectors_module_form` |
| The person asks for a workflow started by a sync's record changes | A sync trigger step cannot be set up through the MCP | Do this in the web app: build the trigger in the workflow builder |
| A JavaScript step times out | JavaScript steps stop after 6 seconds | Move slow calls and large data to a Python step (300 seconds) |
