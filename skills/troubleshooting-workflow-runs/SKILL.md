---
name: troubleshooting-workflow-runs
description: "Finds why Stacksync workflow runs failed and fixes them in order: locate the failed runs by status or by a record they handled, read the failing step's input, output, error and form, check the record in the app itself, explain the cause, suggest a fix, replay on the fixed version after the person's yes, and confirm the new runs succeed. Use when a workflow failed or did not run, someone asks why a step errored or what it received, a run for one order or record must be found, or failed runs need a fix and a replay."
license: Apache-2.0
metadata:
  type: runbook
  version: "1.1.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workflows"
  tools: "workflows_list workflows_get workflows_runs workflows_run workflows_replay workflows_resolve_runs workflows_create_draft workflows_save workflows_deploy connections_list connections_get connections_tables connectors_get connectors_module_form connectors_run_action"
---

## Use it when

A workflow run failed, a step returned the wrong data, or a workflow did not run at all. To run a
workflow, replay runs or read runs without a failure to fix, use `workflows`.

Read the error text yourself: it names the cause in the app's own words. This runbook gives the
order; [the product rules](references/product-rules.md) cover what the error text does not show.

## Before you start

- The Stacksync MCP is connected and the workspace is chosen (`getting-started`).
- "Allow log access" is on: `workflows_runs` is refused otherwise. A workspace owner switches it
  on in the **MCP** page, under **Settings**.
- Steps 1 to 4 only read. Nothing changes before step 6, and only after the person says yes.

## Steps

1. **Locate the failed runs.** Follow `workflows` "List and find workflows" and "Read runs":
   `workflows_list` with `search` and `region` `all` gives the `workflow_id` and `region`, but no
   last run status. Then `workflows_runs` with `workflow_id`, `region`, `query`
   `workflow.execution_status='ERROR'` and `time_range_start` and `time_range_end` (ISO 8601).
   Each run has `run_id`, status, version, start, duration, error and the failed step. `limit`
   takes up to 1,000 (30 by default); pass `next_cursor` as `cursor` for the next page.
   To find the runs of one order or record, search the text of every step's input and output
   with `query`:

   | To find | `query` |
   | --- | --- |
   | Runs that handled order 5534981 | `'5534981'` |
   | Failed runs that handled it | `workflow.execution_status = 'ERROR' AND '5534981'` |
   | Runs where one step failed | `module.execution_status = 'ERROR'` |
   | Runs whose data has a key with a value | `order_id = '5534981'` |
   | Runs that took over 5 seconds | `workflow.execution_duration > 5000` |

   Quote text; a number may stay unquoted, so a data key holding the number 5534981 matches
   `order_id = 5534981` and one holding the text matches `order_id = '5534981'`. Put spaces around
   `=` after a data key. Unquoted text on its own, such as `order 5534981`, is refused with
   "Expected comparator after parameter". Combine conditions with `AND`, `OR` and parentheses.
   Check: you hold the failed runs, or you found there are no runs at all (see [the product
   rules](references/product-rules.md)).
2. **Read the logs.** Group the failed runs by failed step and error, then open one run of each
   group: `workflows_runs` with its `run_id` gives each step's input, output and error; add a
   `step_id` for one step in full. Call `workflows_get` to map each step id to its name and read
   the step's configuration. Code steps write `print()` and `console.log()` output as `stdout` in
   the step's log whose `log_type` is `execution_metadata`. When the error names a field or a
   value, read the step's form: `connectors_module_form` with the step's `module_id`,
   `module_version`, `connection_id` and its values shows the fields and the choices the app
   accepts now, to compare with what the step sent.
   Check: for each group you know the step name, its input and the error.
3. **Check the app.** Look up the record the run handled in the app itself, on the step's
   connection, to see whether it exists and what it holds now: a read action such as Get Records
   with `connectors_run_action`, or for a database follow `connectors` "Query a database". A run
   that failed after the record was written, or a record changed by hand since, explains errors
   the logs alone do not.
   Check: you know the record's current state in the app.
4. **Explain** the cause in plain words, naming the step by its name: the app's message, a
   reference that came through empty, a step that ran out of time. Check [the product rules](references/product-rules.md) first.
   Check: the person agrees the cause matches what they see.
5. **Suggest** the fix and say what it will write and where: a workflow change, a connection to
   sign in again, or a change the person makes in the app (a permission, a validation rule). Name
   the replay risk: a replay is at-least-once with no de-duplication, and `replay_all` runs steps
   that already succeeded, so they can write records twice. State how many runs will replay, and
   prefer `replay_failed` when earlier steps already changed data.
   Check: the person said yes to this fix and to the replay mode and run count.
6. **Apply** the fix:
   - Lost access: `connections` "Reauthorize a connection". `connections_list` shows
     `needs_reauthorization`; `connections_get` gives the link to that connection in the web app,
     where the person selects **Reauthorize**.
   - A workflow change: `workflows` "Save the whole document" and "Deploy a version":
     `workflows_create_draft` when the latest version is deployed, then `workflows_save`, then
     `workflows_deploy`.
   - Run again on the new version: `workflows` "Replay runs": `workflows_replay` with `run_ids`,
     or a `query` and time range, the chosen `mode` and the new `version`. Without a `version`,
     each run replays on its own old version and fails the same way. For one run, `workflows_run`
     with `from_run_id` runs the latest version unless you pass `version`. `replay_failed` and
     `replay_failed_and_dependents` work only on a run that failed.

   Writes run directly unless the workspace turned on "Ask before every change"; then the person
   accepts the change first, and only then report it as done.
   Check: the deploy returned the new version, and the replay returned its counts.
7. **Confirm** the fix worked: `workflows_runs` with the new `run_id` values. A replay by `query`
   returns no new `run_id` values, so list the runs since the replay started. After the person
   confirms the failures are handled, follow `workflows` "Resolve runs": `workflows_resolve_runs`
   with one `run_id` or a `query` and time range marks the old failed runs resolved. It changes no
   data.
   Check: the new runs show success, and the old runs are resolved only after the person agreed.
8. **Escalate** when the cause is on Stacksync's side or a limit only Stacksync can change: a run
   that fails again with no cause in the workflow or the app, or a time or size limit the workflow
   cannot fit. Stop replaying and send the person to **Workspace Settings > General > Support
   Channels** with the workflow, `run_id` and step.
   Check: the person has the workflow name, `run_id` and step to send.

## Rules

| Rule | Why |
| --- | --- |
| Read a failed run's step input, output and error before proposing a fix | The error names the cause; a guess sends the replay into the same failure |
| Fix the cause before replaying, and replay on the fixed version | A replay with the same version and data fails the same way |
| Wait for the person's yes before every write in step 6 | A replay writes to the apps again |
| Resolve runs only after the person confirms they are handled | Resolved runs drop out of the list of failures to act on |

## When the MCP cannot do it

- Email alerts for failed workflow runs: in the web app, **Workspace Settings > Notifications**;
  the MCP has no tool for notification settings.
- The person can look at a run themselves in the web app: the workflow's **Workflow Execution
  Logs** panel below the canvas.
