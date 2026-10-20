---
name: exploring-data-and-logs
description: Explains where to look at data, logs, sync statistics, monitoring charts and alerts in the Stacksync web app (Data Explorer, Log Explorer, Issues dashboard, Sync Stats, Monitoring) and which MCP tools read the same facts. Use when someone asks how many records a sync holds, how a sync or workflow is doing, where to find logs, how long logs are kept, how to see trends over time, or how to get alerted when something fails.
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
logs of runs, trends over time and alerts. Most of these screens are in the web app; this guide
says where, and which MCP tool answers the same question in the chat.

When anything is failing, hand over to the process guide at once: `fixing-sync-issues` for a
sync, `monitoring-workflow-runs` for a workflow run, `operating-genies` for a Genie. Each one
finds the failure, reads the logs, explains the cause and applies a fix only after the person
agrees.

## The screens in the web app

| Screen | What it shows | Where |
| --- | --- | --- |
| Data Explorer | Inspects and queries the data reachable through Stacksync | **Data Explorer** in the sidebar |
| Log Explorer | Searches, filters and inspects the logs of resources and their runs | **Log explorer** in the sidebar |
| Sync issues | Every record that could not sync, with filters by region, sync, app and table, and the fixes Revert change, Retry sync and Ignore issue | **Sync issues** in the sidebar; each issue opens an **Issue Details** panel |
| Statistics | Per table: records in each app, records processing, issues and records held by Delete Protection | The sync's **Statistics** tab |
| Schema History | Columns and tables added, renamed, retyped or no longer synced, and column direction changes | The sync's **Schema History** tab |
| Sync monitoring | Charts of new, updated and deleted records, issues, billable records and trigger runs, with filters | **Sync monitoring** in the sidebar. Pro and Enterprise plans |
| Genie conversations | Every Genie conversation, its steps and browser sessions | **Genie conversations** in the sidebar |

Logs are kept for 1 day on the Starter plan, 7 days on Pro and 30 days on Enterprise. Older logs
cannot be read in Log Explorer, so look at a failure soon after it happens.

## MCP tools, in the order an agent uses them

1. `syncs_list`: every sync with its status and region. `paused_temporarily` means it was
   stopped by app errors.
2. `syncs_get`: one sync with its counts per table, the same facts as Statistics: records,
   issues, pending changes and records held by Delete Protection. Pass `include_diagnostics`
   true to also see queued, in-flight and stuck work per table.
3. `syncs_issues`: the Sync issues page for one sync, grouped by reason. Continue with
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

## Which to use

| The person asks | Answer with | Or in the web app |
| --- | --- | --- |
| "How many records does my sync hold?" | `syncs_get` | Statistics |
| "Why did these records not sync?" | `fixing-sync-issues` | Sync issues |
| "Is anything stuck?" | `syncs_get` with `include_diagnostics` | Statistics |
| "Why did my workflow fail last night?" | `monitoring-workflow-runs` | Log Explorer |
| "What did the Genie do?" or "Why did it fail?" | `genies_activity`; for a failure, `operating-genies` | Genie conversations |
| "How has volume changed this month?" | No MCP tool | Sync monitoring |
| "What changed in my sync's columns?" | No MCP tool | Schema History |
| "Show me the rows in this table" | No MCP tool | Data Explorer |
| "Alert me when records fail" | `syncs_webhooks_save` for a URL | **Workspace Settings > Notifications** |

## Alerts

Stacksync sends notifications and alerts by email on every plan; Enterprise adds Slack, WhatsApp
and PagerDuty. Email alerts for sync issues, a daily digest of issues, sync activity, trigger or
scheduled job failures and workflow issues are switched on in **Workspace Settings >
Notifications**; each person sets their own in **User Settings**. To send a sync's failed records or activity to the
person's own system, create a webhook with `syncs_webhooks_save` and give the URL they choose.

## Rules

| Rule | Why |
| --- | --- |
| Answer with the MCP tool first, then name the web app screen for more | The person gets the number in the chat and knows where to look next |
| Say plainly when no MCP tool covers the request, and name the screen | Guessing a number misleads the person |
| Never resolve issues or replay runs from this guide; hand over to `fixing-sync-issues` or `monitoring-workflow-runs` | Those changes write to live apps and need their own checks |
| Quote counts exactly as the tools return them | A rounded count hides small failures |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| An old run is missing from the logs | It is older than the plan's log retention | Explain the retention; look at failures soon after they happen |
| The Sync monitoring page is missing | The plan does not include it | Use `syncs_get` and `workflows_runs` for current numbers |
| A sync, workflow run or Genie is failing | Repair writes to live apps and needs its own checks | Hand over to `fixing-sync-issues`, `monitoring-workflow-runs` or `operating-genies` |
