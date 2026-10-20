---
name: playbook
description: Template for a playbook, a way Stacksync resources work together that does not depend on the apps. Replace this with one sentence in the third person on what the playbook does, for example "Moves high volume changes from a two-way sync into a queue that a workflow works through, so no change is lost at peak load." Then add "Use when" with the words a person would type, for example "Use when a sync trigger fires faster than a workflow can finish, or changes arrive in bursts."
license: Apache-2.0
metadata:
  # Every value is one plain string. Replace each example value below.
  type: playbook
  version: "0.1.0"
  # The GitHub team that keeps the playbook current and runs it again each quarter.
  owner: "@stacksyncdata/ai-team"
  # Any of: sync workflow queue genie variable knowledge_base api_proxy connection, separated by spaces.
  resources: "sync queue workflow"
  # The day of the last end to end run on a live workspace, as YYYY-MM-DD.
  verified_on: "2026-01-15"
---

<!--
Copy this folder to skills/<name>/ and set name to the same folder name. The name says what
the playbook does, for example high-volume-changes-through-a-queue.
A playbook names no apps: it explains how Stacksync resources work together. A use case applies
a playbook to two specific apps.
Keep the eight required sections below, in this order, and keep the body under 200 lines. The
sections marked optional may be kept where they help or deleted.
Copy "Before you start" exactly as it is: CI compares it with templates/usecase/before-you-start.md.
Follow STYLE.md, and delete every comment like this one before you open the pull request.
-->

## Before you start

Check whether a tool from the Stacksync MCP server, such as `connections_list`, is available in
this conversation. If it is, the Stacksync MCP is already connected: skip to the next section.

If it is not, set it up once:

1. Ask the person to add `https://mcp.stacksync.com/mcp` as a connector or MCP server in their
   AI app. The steps for each app are in the README of github.com/stacksyncdata/skills.
2. The person signs in with their Stacksync account when the AI app asks. Sign in uses OAuth, so
   nobody creates or copies an API key.
3. Call `connections_list` to confirm the tools respond.

Then connect in Stacksync each app the build uses; for a use case, that is the source app and the
destination app. Call `connections_create` once per app. It returns a secure sign in link; give
the link to the person and wait until they say they have signed in. Never ask the person to paste
a password, token or API key into the chat.

## When to use this playbook

<!--
Say with numbers when this playbook fits, and when the simpler option is enough. The reader uses
this to decide, so a threshold beats an adjective. CI fails this section without a number.
-->

Use it when a sync trigger produces more than 100 changes per minute, or bursts of more than
1,000 changes at once. Below that, a workflow started directly by the sync trigger is simpler and
enough.

## Questions to ask first

<!--
Optional. The questions to ask the person before designing anything: the records that move, how
many and how fast, who owns each app, and what must never break.
-->

- How many changes arrive per minute at the busiest hour?
- Which changes may wait, and for how long?

## How the resources connect

<!--
A short flow, then one line per resource on what it does and why that resource carries it.
-->

Two-way sync → sync trigger → queue → workflow

- The two-way sync keeps the records equal and detects each change.
- The sync trigger adds one queue item per change instead of starting a workflow run.
- The queue holds the items, so a burst waits instead of failing.
- The workflow takes items from the queue in batches and does the work on each.

## Review against the workspace

<!--
Optional. What to check in the person's workspace before building: existing connections and
resources to reuse, nothing duplicated, and the person's access.
-->

Call `queues_list` and `workflows_list` first, and reuse a queue that already holds these items.

## Build steps

<!--
One numbered step per tool call. Name the MCP tool in backticks and say what to pass.
Build in this order: connections, then syncs and variables, then workflows and queues, then
genies. Everything is created switched off; switch it on only after the person confirms.
-->

1. Call `syncs_list` and note the two-way sync the person names.
2. Call `queues_create` with a name that says what the items are.
3. Call `workflows_create` with the queue as its trigger. It is created switched off.
4. Call `sync_triggers_create` to add one item to the queue for each change in the sync.
5. Show the person the queue, the workflow and the trigger, and ask them to confirm.
6. Call `workflows_deploy` only after the person confirms.

## Settings that matter

<!--
One row per setting, with the value to use and the reason. A setting without a reason gets
changed by the next person.
-->

| Setting | Value | Why |
| --- | --- | --- |
| Batch size | 50 items | Keeps each run under the destination app's request limit |
| Retries | 3, then hold the item | A short outage clears on its own; a bad record needs a person |
| Ordering | By record, oldest first | Two changes to one record must arrive in the order they happened |

## Rules

<!--
Optional. What always needs the person's confirmation, and when to stop and ask.
-->

- Switch nothing on until the person has seen the queue, the workflow and the trigger.

## When something goes wrong

<!--
One row per problem a person has actually seen. Write the first column in the words on their
screen.
-->

| What the person sees | Cause | Fix |
| --- | --- | --- |
| The queue keeps growing | The workflow is off or failing | Check `workflows_runs`; fix the failing step, then deploy again |

## Check it works

<!--
One test the person can watch, with the exact result and how long it takes.
-->

Change 10 records in the synced app. Within 2 minutes, `queues_records` shows the queue empty and
`workflows_runs` shows the runs that processed all 10 changes.

## Limits

<!--
What the playbook does not do, so nobody assumes it does.
-->

- Changes made while the sync is off are not added to the queue.
