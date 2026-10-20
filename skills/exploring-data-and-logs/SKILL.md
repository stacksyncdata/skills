---
name: exploring-data-and-logs
description: Reads sync counts, issues, workflow runs and Genie activity through the Stacksync MCP, sets up alerts to the person's own URL, and says plainly what only the web app shows. Use when someone asks how many records a sync holds, how a sync or workflow is doing, where to find logs, how long logs are kept, how to see trends over time, or how to get alerted when something fails.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "monitoring"
  tools: "syncs_list syncs_get syncs_issues syncs_webhooks_save workflows_runs genies_activity"
---

## When to use

Use this guide when the person wants to look at data or activity: records and issues per sync,
runs of a workflow, what a Genie did, and alerts. Answer in the chat with the MCP tools below.

When anything is failing, hand over to the process guide at once: `fixing-sync-issues` for a
sync, `monitoring-workflow-runs` for a workflow run, `operating-genies` for a Genie. Each one
finds the failure, reads the logs, explains the cause and applies a fix only after the person
agrees.

## Tools, in the order an agent uses them

1. `syncs_list`: every sync with its status and region. `paused_temporarily` means it was
   stopped by app errors.
2. `syncs_get`: one sync with its counts per table: records, issues, pending changes and records
   held by Delete Protection. Pass `include_diagnostics` true to also see queued, in flight and
   stuck work per table.
3. `syncs_issues`: the records of one sync that could not sync, grouped by reason. Continue with
   `fixing-sync-issues`.
4. `workflows_runs`: a workflow's runs with status, duration, error and failed step; with
   `run_id`, each step's input, output and error. Continue with `monitoring-workflow-runs`.
5. `genies_activity`: what Genies did: conversations, steps, errors, tool runs and cost.
   Continue with `operating-genies`.
6. `syncs_webhooks_save`: notifies a URL of a sync's activity, failed records or backfill. Use it
   when the person wants their own system alerted.

Every tool above reads only, except `syncs_webhooks_save`. That write runs directly unless the
workspace turned on "Ask before every change"; then the person sees one preview card and selects
**Accept**.

## Which tool answers which question

| The person asks | Answer with |
| --- | --- |
| "How many records does my sync hold?" | `syncs_get` |
| "Why did these records not sync?" | `fixing-sync-issues` |
| "Is anything stuck?" | `syncs_get` with `include_diagnostics` |
| "Why did my workflow fail last night?" | `monitoring-workflow-runs` |
| "What did the Genie do?" or "Why did it fail?" | `genies_activity`; for a failure, `operating-genies` |
| "Alert me when records fail" | `syncs_webhooks_save` for a URL the person chooses |

## What the MCP cannot read

Say so plainly, then name the one place to look. The MCP has no tool for these:

- Trends over time (new, updated and deleted records per day, billable records): in the web app,
  **Sync monitoring** in the sidebar, on the Pro and Enterprise plans.
- What changed in a sync's columns, renames included: in the web app, the sync's **Schema
  History** tab.
- The rows of a table: in the web app, **Data Explorer** in the sidebar.
- Email alerts: do this in the web app: **Workspace Settings > Notifications**; each person sets
  their own in **User Settings**. The MCP has no tool for notification settings.

## Log retention

Logs are kept for 1 day on the Starter plan, 7 days on Pro and 30 days on Enterprise.
`workflows_runs` and `genies_activity` return nothing older, so look at a failure soon after it
happens.

## Alerts

Stacksync sends notifications by email on every plan; Enterprise adds Slack, WhatsApp and
PagerDuty. To send a sync's failed records or activity to the person's own system, create a
webhook with `syncs_webhooks_save` and give the URL they choose.

## Rules

| Rule | Why |
| --- | --- |
| Answer with the MCP tool in the chat; name a web app screen only when no tool covers the request | The person asked the AI app, and gets the number where they asked |
| Say plainly when no MCP tool covers the request | Guessing a number misleads the person |
| Never resolve issues or replay runs from this guide; hand over to `fixing-sync-issues` or `monitoring-workflow-runs` | Those changes write to live apps and need their own checks |
| Quote counts exactly as the tools return them | A rounded count hides small failures |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| An old run is missing from the logs | It is older than the plan's log retention | Explain the retention; look at failures soon after they happen |
| The Sync monitoring page is missing | The plan does not include it | Use `syncs_get` and `workflows_runs` for current numbers |
| A sync, workflow run or Genie is failing | Repair writes to live apps and needs its own checks | Hand over to `fixing-sync-issues`, `monitoring-workflow-runs` or `operating-genies` |
