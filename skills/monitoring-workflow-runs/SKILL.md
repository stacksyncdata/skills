---
name: monitoring-workflow-runs
description: Checks Stacksync workflow runs through the Stacksync MCP and fixes failed ones with one process: find the failed runs, read the failing step's input, output and error, explain the cause, propose a fix, check a replay cannot write records twice, apply it after the person agrees, and confirm the next run succeeds. Also runs workflows now and marks failed runs resolved. Use when someone asks whether a workflow ran, why it failed, what a step received or returned, wants to run a workflow now, rerun or replay failed runs after a fix, or clear failed runs from the Log Explorer.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workflows"
  tools: "workflows_list workflows_get workflows_runs workflows_run workflows_replay workflows_resolve_runs workflows_create_draft workflows_save workflows_deploy connections_list connections_create"
---

## When to use

Use this guide for what happened when a workflow ran: which runs failed, at which step, with what
data, and how to run them again. To change the workflow itself, use `building-workflows`.

Read the error text yourself: it names the cause in the app's own words, and new messages appear
all the time. This guide gives the process and the product rules the error text does not show.

## The process

Follow the steps in order. Steps 1 to 4 only read; nothing changes until step 6.

1. **Find the workflow and the failed runs.** `workflows_list` with a `search` gives the
   `workflow_id` and `region`, but no last run status. So check the runs of the workflows the
   person names, or of the likely candidates by name or app: `workflows_runs` with `workflow_id`,
   `region`, `query` `workflow.execution_status='ERROR'` and a time range
   (`time_range_start`, `time_range_end`, ISO 8601). Each run has `run_id`, status, version,
   start, duration, error and the failed step. `limit` takes up to 1,000 (30 by default); pass
   `next_cursor` as `cursor` for the next page.
2. **Open the logs.** Group the failed runs by failed step and error, then open one run of each
   group: `workflows_runs` with its `run_id` gives each step's input, output and error; add a
   `step_id` for one step in full. Steps are named by id, so call `workflows_get` to map each id
   to its step name and to read the step's configuration. Code steps write `print()` and
   `console.log()` output under `metadata.stdout`.
3. **Explain** the cause to the person in plain words, naming the step by its name: the app's
   message, a reference that came through empty, a step that ran out of time. Check the product
   rules below first.
4. **Suggest** the fix: a change to the workflow, a connection to sign in again, or a change the
   person makes in the app (a permission, a validation rule).
5. **Check before fixing.** Say what the fix will write and where, and wait for the person's yes:
   - A replay is at-least-once, with no automatic de-duplication. Steps that already succeeded
     run again with `replay_all` and can write records twice. State how many runs will replay,
     and prefer `replay_failed` when earlier steps already changed data.
   - Deleting cannot be undone.
6. **Apply** the fix through a tool:
   - Lost access: `connections_list` shows `needs_reauthorization`; `connections_create` gives
     the sign in link for the person.
   - A workflow change: `workflows_create_draft` when the latest version is deployed, then
     `workflows_save`, then `workflows_deploy` (see `building-workflows`).
   - Run again with the new version: `workflows_replay` with `run_ids`, or a `query` and time
     range, and the new `version`; `workflows_run` with `from_run_id` for one run. Without a
     `version`, each run replays on its own old version and fails the same way.
7. **Confirm** the fix worked: `workflows_runs` with the new `run_id` values. Then, after the
   person confirms the failures are handled, `workflows_resolve_runs` marks the old failed runs
   resolved, with one `run_id` or a `query` and time range. It changes no data.
8. **Contact Stacksync support** when the cause is on Stacksync's side, or a limit only
   Stacksync can change: a run that fails again with no cause in the workflow or the app, or a
   time or size limit the workflow cannot fit. Stop replaying, and send the person to
   **Workspace Settings > General > Support Channels** with the workflow, `run_id` and step.

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
sees one preview card and selects Accept.

## Running and replaying

| The person wants | Call | `mode` |
| --- | --- | --- |
| Run the workflow now with the Input step's test data | `workflows_run` | `run` |
| Run one run again from the start, with its trigger data | `workflows_run` with `from_run_id` | `replay_all` |
| Run only the failed steps of one run | `workflows_run` with `from_run_id` | `replay_failed` |
| Run the failed steps and the steps after them | `workflows_run` with `from_run_id` | `replay_failed_and_dependents` |
| Run one step on its own | `workflows_run` with `step_id` | `step_only` |
| Replay one run up to, or from, a step | `workflows_run` with `from_run_id` and `step_id` | `until_step` or `from_step` |
| Replay many runs | `workflows_replay` with `run_ids`, or a `query` and a time range | `replay_all`, `replay_failed` or `replay_failed_and_dependents` |

`workflows_run` queues the run and returns its `run_id`. `workflows_replay` returns how many
replays were requested, succeeded and failed, and the new `run_id` values. `replay_failed` works
only on a run that failed.

## Product rules the error text does not show

- **No runs at all means no error to read.** The trigger never fired: the version is not
  deployed, the trigger has no edge into the Input step, or the workflow is paused. Check with
  `workflows_get`.
- **Code steps have time limits**: JavaScript steps stop after 6 seconds, Python steps after
  300 seconds.
- **Runs older than the plan's log retention are gone**: 1 day on Starter, 7 days on Pro and 30
  days on Enterprise. Look at failures soon after they happen.
- **`workflows_runs` is refused when "Allow log access" is off.** A workspace owner switches it
  on in the **MCP** page, under **Settings**.

## In the web app

Each workflow has an **Execution Logs** panel below the canvas: the runs, each step's output, and
the iterations of a loop under **Child Runs**. The toolbar holds **Run**, **Replay** and
**Deploy**. **Log Explorer** in the sidebar searches logs across workflows. Email alerts for
failed workflow runs are set in **Workspace Settings > Notifications**.

## Rules

| Rule | Why |
| --- | --- |
| Read a failed run's step input, output and error before proposing a fix | The error names the cause; a guess sends the replay into the same failure |
| Fix the cause before replaying, and replay on the fixed version | A replay with the same version and data fails the same way |
| Wait for the person's yes before every write in step 6 | A replay writes to the apps again |
| Resolve runs only after the person confirms they are handled | Resolved runs drop out of the list of failures to act on |
