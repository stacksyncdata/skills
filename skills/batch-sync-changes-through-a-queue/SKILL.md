---
name: batch-sync-changes-through-a-queue
description: Collects the records a sync changes in a Stacksync queue and hands them to one workflow run per batch, with flush rules for batch size and maximum wait. Use when changes arrive in bursts of hundreds or thousands, when one run per record is too many runs, or when the receiving app accepts records in bulk.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs queues workflows"
  tools: "syncs_list syncs_get syncs_triggers_save queues_list queues_save queues_get queues_flush connectors_list connectors_module_form workflows_save workflows_deploy workflows_runs workflows_replay"
  resources: "syncs queues workflows"
---

## Use it when

- A sync sees more than a few hundred changed records per hour, or bursts of 1,000 or more.
- The next step can take records as a list: a bulk API call, a file, one database statement.
- A wait of up to 60 seconds (the default maximum age) between the change and the action is fine.

## Why this design

Advantages:
- One run per batch instead of one per record: 5,000 changes at the default batch size of 1,000
  start 5 runs, not 5,000.
- Runs stay under the limit of 20 concurrent runs per workflow, so nothing waits for a slot.
- Flush rules set the pace: batch size (default 1,000, up to 10,000), maximum age (default 60
  seconds, up to 86,400) and flushes per time window.
- Records wait in the queue while the consumer workflow is paused, so a fix does not lose them.

Trade-offs:
- The workflow handles an array, so steps loop over records.
- A record waits up to the maximum age before it is handled.
- The sync event trigger adds one queue message per changed record; a failed insert is not
  retried. A failed consumer run is not retried either: replay it.

Alternatives and why they lose here:

| Alternative | Why it loses at this volume |
| --- | --- |
| Sync event trigger of type `webhook` to a workflow (`react-to-each-record-change`) | One run and one call per record; bursts fill the 20 run slots and hit the target app's rate limit; no batching |
| Scheduled workflow that reads the table (`scheduled-workflow`) | Re-reads unchanged records and needs its own change tracking |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `syncs` | the source app | The sync that reads the changed table |
| 2 | `queues` | `syncs` | A sync event trigger of type `queue` adds one message per changed record |
| 3 | `workflows` | `queues` | The queue trigger: one run per flush, the batch as an array |
| 4 | `workflows` | the target app | Steps that write the batch |

```
sync sees a change -> sync event trigger (type queue) -> queue
queue flush (batch size reached, or oldest record older than max age)
  -> consumer workflow run with [record, record, ...] -> target app
```

## Build it

1. `syncs` "Create a sync" if no sync reads the table yet.
2. `queues` "Create a queue" in the sync's region with the flush rules.
3. `workflows` "Create a workflow" with the queue trigger on that queue, then "Add a step"
   for the steps that write the batch, then "Deploy a version".
4. `syncs` "Add, change, pause or delete a sync event trigger" with type `queue`, the table, the operations and the
   `queue_id`.
5. Change a few test records; `queues` "Show a queue and its waiting records" shows them waiting, then the flush. Check the
   run with `workflows` "Read runs".

## Variations

- Strict ordering: keep `fifo`; `lifo` handles the newest records first.
- Several syncs into one queue: each sync gets its own trigger with the same `queue_id`.
- Large records: lower the batch size so one run stays within the target app's payload limit.

## Check before going live

- Loops: if the consumer writes back to an app in the same sync, set the trigger's `changes_from`
  to the other app or list the written fields in `columns_to_ignore`.
- Backfill: switching on a new sync copies every existing record and fires `created` triggers for
  them. Expect one queue message per record; size the batch for it or add the trigger after the
  first copy.
- Rate limits: set the queue's flushes per time window under the target app's limit.

## Rules

| Rule | Why |
| --- | --- |
| Put the queue in the same region as the sync and the workflow | A trigger only reaches a queue of the sync's region |
| Pause the consumer workflow, not the trigger, to hold work during a fix | Records keep collecting and flush once the workflow runs again |
| Make the batch write safe to repeat (upsert by key) | A replayed run sends the whole batch again |
