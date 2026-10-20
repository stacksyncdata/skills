---
name: migrating-to-stacksync
description: Moves integrations and automations from another integration or automation platform to Stacksync, step by step: inventory, export, mapping to syncs, workflows, queues and variables, a switched off build, a parallel run on test records, comparison, cutover and rollback. Use when someone wants to move existing integrations, automations or data pipelines to Stacksync, retire another platform, or plan a cutover without losing data.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "migration"
  tools: "workspaces_list connections_list connections_create connectors_list syncs_list syncs_get syncs_save syncs_switch syncs_issues workflows_list workflows_get workflows_save workflows_deploy workflows_run workflows_runs queues_list queues_save variables_list variables_save skills_get"
---

## When to use

Use this guide when the person already runs integrations somewhere else and wants them in
Stacksync. It gives the method. For each build step, it points to the guide for that resource.

## Before you build

Ask the person:

1. Which platform runs the integrations today, and can they export them?
2. Which integrations matter most, and which can stop for a while during the move?
3. Who checks that the results are right, and on which records?
4. Is there a date the old platform must be switched off by?

Then call `workspaces_list`, `connections_list`, `syncs_list` and `workflows_list` to see what
Stacksync already holds, so nothing is built twice.

## Steps

1. **Inventory what runs today.** List every integration with: its trigger, the apps it reads and
   writes, the steps in order, any lookups, its schedule, how many records it moves per day, and
   who owns it. Show the list to the person and agree which ones move, and in which order.
2. **Get the export.** Ask the person for the export files from the old platform, or for
   screenshots of each integration when there is no export. Read the steps from the export; do not
   guess them.
3. **Map each part to Stacksync.**

   | Old platform part | Stacksync |
   | --- | --- |
   | Keeps records equal between two apps, on a schedule or on change | A sync, one-way or two-way per table (`designing-two-way-syncs`) |
   | Trigger: a record change, a webhook, an email or a schedule | A workflow trigger |
   | Steps: create, update, look up, transform, branch | Workflow steps; a code step for custom logic |
   | Lookups of fixed values, IDs or settings | Variables |
   | Large batches, or work that must run at a steady pace | A queue in front of the workflow |
   | Stored credentials | New connections created with `connections_create` |

4. **Design the whole target.** Draw it as one row per integration with its syncs, workflows,
   queues and variables. Show it to the person and wait for approval.
5. **Connect the apps.** For each app, call `connections_list`; if it is missing, call
   `connections_create` and give the person the secure sign in link it returns.
6. **Build everything switched off.** Syncs with `syncs_save`, workflows with `workflows_save`,
   queues with `queues_save`, variables with `variables_save`. Nothing runs yet.
7. **Run in parallel on test records.** Move one integration at a time, on test records only,
   while the old platform keeps running for everything else. Run a workflow on a test record with
   `workflows_run`. Point a sync at a sandbox or test copy of each app, or at a test table, so the
   first run touches no live records.
8. **Compare.** For each test record, compare what the old platform produced with what Stacksync
   produced, field by field. Check `syncs_issues` and `workflows_runs` for errors. Show the person
   the differences and fix them before going further.
9. **Switch on.** With the person's approval, switch the Stacksync integration on for live
   records: `syncs_switch` for a sync, `workflows_deploy` for a workflow.
10. **Switch the old one off.** Ask the person to switch off the same integration on the old
    platform straight after, so the two never write the same records at the same time.
11. **Keep a rollback.** Keep the old integration saved but switched off, and the export file,
    until the Stacksync version has run cleanly for an agreed period, for example 2 weeks. To roll
    back: switch the Stacksync integration off, then switch the old one on.

## Rules

| Rule | Why |
| --- | --- |
| Never reuse a password, API key or token found in an export. Create each connection with `connections_create`, which returns a secure sign in link | An export is a file; the person controls who signs in to their apps, not the file |
| Never run the old and the new integration on the same records at the same time, except on test records during the parallel run | Both would write each change, creating duplicates or overwriting each other |
| Build switched off and move one integration at a time | A problem stays limited to one integration and is easy to roll back |
| Do not delete anything on the old platform as part of the move | The old integration is the rollback |
| For two-way syncs, check for records that already exist in both apps before the first run | Stacksync does not merge existing duplicates; see `designing-two-way-syncs` |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| No export is available | The old platform does not offer one | Rebuild from screenshots and from the person's description, step by step |
| An old step has no matching Stacksync step | The step is custom to the old platform | Use an HTTP request step or a code step; see `building-connectors` |
| An app has no Stacksync connector | Not supported yet | See `building-connectors` |
| Results differ during the parallel run | A mapping, lookup or filter differs | Compare the two results for one record, fix the step, run again |
| Records appear twice after cutover | Both platforms wrote the same records, or a two-way sync started on apps holding the same records | Switch one side off; de-duplicate; see `designing-two-way-syncs` |
