---
name: react-to-each-record-change
description: Runs one workflow for each record that is created, updated or deleted in a connected app, through a workflow sync trigger or a sync event trigger that calls the workflow's webhook. Use when someone wants an action per changed record at low volume, such as notifying a team, creating a follow-up record or calling an API each time one record changes.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs workflows"
  tools: "syncs_list syncs_get syncs_triggers_save connectors_list connectors_get connectors_module_form workflows_save workflows_get workflows_deploy workflows_runs workflows_replay"
  resources: "syncs workflows connections connectors"
---

## Use it when

- Each changed record needs its own action: a message, an API call, a record in another app.
- Changes stay under about 20 at the same moment and a few hundred per hour. The engine runs at
  most 20 runs of one workflow at a time; more changes wait for a free slot.
- The action can run within seconds of the change.

Above that volume, or when the receiving app limits calls, use `batch-sync-changes-through-a-queue`.

## Why this design

Advantages:
- One run per record: each run is short, its input is one record, and a failed run names the
  record that failed.
- No batching code: steps read the record directly.

Trade-offs:
- One run and at least one call to the receiving app per record. A bulk edit of 5,000 records
  starts 5,000 runs.
- A failed run is not retried on its own. Replay it with `workflows` "Replay runs".
- A sync event trigger of type `webhook` sends one HTTP call per record and records the answer;
  a failed call is not sent again. Calls to addresses outside Stacksync time out after 30 seconds.

Alternatives and why they lose here:

| Alternative | Why it loses at this volume |
| --- | --- |
| Queue and one run per batch (`batch-sync-changes-through-a-queue`) | Adds a queue and array handling; worth it only above a few hundred changes per hour or with a rate limited app |
| Scheduled workflow that reads changed records (`scheduled-workflow`) | Adds a delay up to the schedule interval and needs its own "changed since" logic |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `connections` | the app that changes | A connection to the app that holds the records |
| 2a | `workflows` | the app | A workflow sync trigger on the app's table (built in the web app) |
| 2b | `syncs` | `workflows` | Or: a sync event trigger, type `webhook`, that calls the workflow's webhook URL |
| 3 | `workflows` | the target app | Steps that act on the one record |

```
app record changes
  -> workflow sync trigger            (option A, one run per record)
  -> sync event trigger type webhook  (option B, one HTTP call per record)
       -> workflow webhook trigger -> steps -> target app
```

Choose option A when no sync exists. Choose option B when a sync already reads the table, so the
change is seen once and the trigger reuses it.

## Build it

1. `connections`: "Connect an app" for each app that does not have one yet.
2. Option A: `workflows` "Add a trigger", the app's sync trigger. It is set up in the web app's
   workflow builder; the MCP cannot set it. Ask the person to pick the table, the events and the
   filters there.
3. Option B: `workflows` "Create a workflow" with the webhook trigger and "Deploy a version". The person
   copies the trigger URL from the trigger step in the web app. Then `syncs` "Add a sync event
   trigger" with type `webhook` and a cURL to that URL that sends the record.
4. `workflows` "Add a step" for each action step, reading fields from the record.
5. `workflows` "Deploy a version", then change one test record and read the run with `workflows` "Read runs".

## Variations

- Only some changes matter: add `filters` to the sync event trigger, or filter conditions to the
  workflow sync trigger, so other changes start no run.
- Only one app's edits matter: set `changes_from` to that app.
- Deletes: a deleted record carries only its primary key; act on the key alone.

## Check before going live

- Loops: when the workflow writes back to an app in the same sync, set `changes_from` to the
  other app, or list the fields the workflow writes in `columns_to_ignore`. Otherwise each write
  starts a new run.
- Backfill: the workflow sync trigger's **Historic backfill** sends every existing record through
  the workflow once. Leave it off unless the person confirms the run count.
- Rate limits: estimate changes per minute against the receiving app's API limit. When it is
  close, switch to `throttle-writes-with-a-queue`.

## Rules

| Rule | Why |
| --- | --- |
| Test with one record before switching on for the whole table | Every matching change starts a live run |
| Make each run safe to repeat: look the record up before creating it | A replayed or duplicated call must not create a second record |
| Ask for the target URL; never invent it | A made up endpoint sends customer data to the wrong place |
