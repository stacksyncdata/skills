---
name: exploring-data-and-logs
description: Reads sync counts, sync issues, workflow runs and Genie activity through the Stacksync MCP, sends a sync's activity to the person's own URL, and names the one web app place for what the MCP cannot read. Use when someone asks how many records a sync holds, how a sync, workflow or Genie is doing, where to find logs, how long logs are kept, how to see trends over time, or how to get alerted.
license: Apache-2.0
metadata:
  type: runbook
  version: "1.1.0"
  owner: "@stacksyncdata/ai-team"
  areas: "monitoring"
  tools: "syncs_list syncs_get syncs_issues workflows_list workflows_runs genies_list genies_activity"
---

## Use it when

The person wants to look at data or activity: records and issues per sync, runs of a workflow,
what a Genie did and what it cost, or an alert. Answer in the chat with the MCP tools. When
something is failing, hand over at once: `troubleshooting-a-sync`, `troubleshooting-workflow-runs`
or `troubleshooting-a-genie`.

## Before you start

- The Stacksync MCP is connected and the workspace is chosen (`getting-started`).
- For workflow runs and Genie activity, "Allow log access" is on. A workspace owner switches it on
  in the **MCP** page, under **Settings**; `workflows_runs` and `genies_activity` are refused
  otherwise.
- Logs are kept for the plan's retention: 1 day on Starter, 7 days on Pro, 30 days on Enterprise.
  An older run or conversation cannot be read.

## Steps

1. **Pick what to read.** Match the question to a resource:

   | The person asks | Read with |
   | --- | --- |
   | "How many records does my sync hold?" or "Is anything stuck?" | `syncs` (step 2) |
   | "Which records did not sync?" | `syncs` (step 2), then `troubleshooting-a-sync` |
   | "Did my workflow run?" or "What did a step return?" | `workflows` (step 3) |
   | "What did the Genie do?" or "What did it cost?" | `genies` (step 4) |
   | "Alert me when records fail" | step 5 |

   Check: you know which resource and which item the person means.
2. **Read a sync.** Follow `syncs` "Find and read syncs": `syncs_list` gives every sync
   with its status and region (`paused_temporarily` means app errors stopped it). `syncs_get`
   gives counts per table: records, issues, pending changes and records held by Delete
   Protection; add `include_diagnostics: true` for queued, in-flight and stuck work. For failed
   records, `syncs` "Read issues" (`syncs_issues`, grouped by reason).
   Check: you quote the counts exactly as returned.
3. **Read workflow runs.** Follow `workflows` "Read runs": `workflows_list` gives the
   `workflow_id` and `region`; `workflows_runs` lists runs with status, duration, error and failed
   step, and with a `run_id` each step's input, output and error.
   Check: the runs you report fall inside the time range the person asked about.
4. **Read Genie activity.** Follow `genies` "Check activity and cost": `genies_list` gives the `genie_id`
   and `region`; `genies_activity` gives conversations, steps, errors and tool runs, and with
   `genie_id` and `time_range_start` the cost of each message and the total.
   Check: you report counts and cost as numbers for the period asked.
5. **Send alerts to the person's own system**, when asked. Follow `syncs` "List or delete a sync webhook":
   a sync webhook needs an API key, so a developer adds it with the public API; the AI never takes
   the key. This runbook makes no change.
   Check: `syncs_get` lists the webhook once it is added.

## Rules

| Rule | Why |
| --- | --- |
| Answer with the MCP tool in the chat; name a web app place only when no tool covers the request | The person asked the AI app and gets the number where they asked |
| Say plainly when no MCP tool covers the request | A guessed number misleads the person |
| Never resolve issues or replay runs from this runbook; hand over to the troubleshooting runbook | Those changes write to live apps and need their own checks |
| Quote counts exactly as the tools return them | A rounded count hides small failures |

## When the MCP cannot do it

The MCP has no tool for these. Say so, then name the one place in the web app:

- Trends over time (records created, updated and deleted, monthly active records, issues):
  **Sync monitoring** in the sidebar. Its API call and latency charts need the Enterprise plan.
- Column changes a sync saw, renames included: the sync's **Schema History** tab.
- The rows of a table: **Data Explorer** in the sidebar, when the workspace has it turned on.
- Runs across every workflow at once: **Log explorer** in the sidebar.
- Email alerts: **Workspace settings > Notifications**; each person sets their own in **User
  Settings**.
