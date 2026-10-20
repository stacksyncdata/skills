---
name: migrating-to-stacksync
description: "Moves integrations and automations from another integration or automation platform to Stacksync in order: inventory, export, mapping to syncs, workflows, queues and variables, build, parallel run on test records, comparison, cutover and rollback. Use when someone wants to move existing integrations, automations or data pipelines to Stacksync, retire another platform, or plan a cutover without losing data."
license: Apache-2.0
metadata:
  type: runbook
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "migration"
  tools: "workspaces_list connections_list connections_create connectors_list syncs_list syncs_get syncs_save syncs_switch syncs_issues workflows_list workflows_get workflows_save workflows_deploy workflows_run workflows_runs queues_list queues_save variables_list variables_save skills_get"
---

## Use it when

The person already runs integrations on another platform and wants them in Stacksync. This runbook
gives the order; each build step names the resource skill that holds the operation.

## Before you start

Ask the person:

1. Which platform runs the integrations today, and can they export them?
2. Which integrations matter most, and which can stop for a while during the move?
3. Who checks that the results are right, and on which records?
4. Is there a date the old platform must be switched off by?

Then call `workspaces_list`, `connections_list`, `syncs_list` and `workflows_list` to see what
Stacksync already holds, so nothing is built twice.

## Steps

1. **Inventory what runs today.** List every integration with its trigger, the apps it reads and
   writes, the steps in order, lookups, schedule, records moved per day and owner.
   Check: the person agreed which integrations move, and in which order.
2. **Get the export.** Ask for the export files from the old platform, or screenshots of each
   integration when there is no export. Read the steps from the export; never guess them.
   Check: every integration in the inventory has an export or screenshots.
3. **Map each part to Stacksync.**

   | Old platform part | Stacksync |
   | --- | --- |
   | Keeps records equal between two apps, on a schedule or on change | A sync, one-way or two-way per table (`syncs`, `two-way-sync-between-apps`) |
   | Trigger: a record change, a webhook, an email or a schedule | A workflow trigger (`workflows`) |
   | Steps: create, update, look up, transform, branch | Workflow steps; a code step for custom logic (`workflows`) |
   | Lookups of fixed values, IDs or settings | Variables (`variables`) |
   | Large batches, or work that must run at a steady pace | A queue in front of the workflow (`queues`, `throttle-writes-with-a-queue`) |
   | Stored credentials | New connections created with `connections_create` (`connections`) |

   For an old step with no match, search `connectors_list` by capability for a built-in module
   first; otherwise use an HTTP request step or a code step (`building-a-connector`).
   Check: every step of every moving integration has a Stacksync part.
4. **Design the whole target**: one row per integration with its syncs, workflows, queues and
   variables, and the blueprint each follows.
   Check: the person approved the design.
5. **Connect the apps.** Follow `connections` "Connect an app": `connections_list` first; for
   each missing app, `connections_create` and give the person the secure sign in link it returns.
   Check: `connections_list` shows every app the design needs, none needing reauthorization.
6. **Build.** Follow the resource skills: `syncs` "Create a sync" (`syncs_save`), `workflows`
   "Create a workflow" (`workflows_save`), `queues` "Create a queue" (`queues_save`), `variables`
   "Save a variable" (`variables_save`).
   Check: each new resource appears in its `_list` tool.
7. **Run in parallel on test records.** Move one integration at a time, on test records only,
   while the old platform keeps running for everything else. Set the test record as the
   workflow's Input step test data and run it with `workflows_run`. Point a sync at a sandbox or
   test copy of each app, or a test table, so the first run touches no live records.
   Check: the test run touched only test records.
8. **Compare.** For each test record, compare the old platform's result with Stacksync's, field by
   field. Read errors with `syncs_issues` and `workflows_runs`; fix differences with the
   troubleshooting runbooks before going further.
   Check: the person confirmed the results match.
9. **Cut over** on the date the person chose: `syncs` "Switch a sync on or off" (`syncs_switch`)
   for a sync, `workflows` "Deploy a version" (`workflows_deploy`) for a workflow. Writes run
   directly unless the workspace turned on "Ask before every change"; then the person accepts each
   one first.
   Check: the sync shows `running`, or the deployed version is the one tested.
10. **Switch the old one off.** Ask the person to switch off the same integration on the old
    platform straight after, so the two never write the same records at the same time.
    Check: the person confirmed the old integration is off.
11. **Keep a rollback.** Keep the old integration saved but switched off, and the export file,
    until the Stacksync version has run cleanly for an agreed period, for example 2 weeks. To roll
    back: switch the Stacksync integration off, then switch the old one on.
    Check: the person agreed the period and knows the rollback order.

## Rules

| Rule | Why |
| --- | --- |
| Never reuse a password, API key or token found in an export. Create each connection with `connections_create` | The person controls who signs in to their apps, not the export file |
| Never run the old and the new integration on the same records at the same time, except test records during step 7 | Both would write each change, creating duplicates or overwriting each other |
| Move one integration at a time | A problem stays limited to one integration and is easy to roll back |
| Do not delete anything on the old platform as part of the move | The old integration is the rollback |
| For two-way syncs, check for records that already exist in both apps before the first run | Syncs have no match keys and do not merge existing duplicates |

## When the MCP cannot do it

- **No export is available**: rebuild from screenshots and the person's description, step by step.
- **An app has no Stacksync connector**: follow `building-a-connector`.
- **Records appear twice after cutover**: both platforms wrote the same records, or a two-way sync
  started on apps holding the same records. Switch one side off, then de-duplicate in the app;
  Stacksync does not merge records.
- **Per field direction and associations of a sync** are set in the web app, in the sync's
  **Schema** and **Associations** tabs.
