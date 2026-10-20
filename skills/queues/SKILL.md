---
name: queues
description: Lists, reads, creates, changes, pauses, flushes, clears and deletes Stacksync queues, which collect records from producers and hand them to one consumer workflow in batches by flush rules for batch size, maximum age, rate limit and order. Use when someone wants to process many changes at a steady pace, batch records between a sync or workflow and a workflow, set how often a queue flushes, see what waits in a queue, push waiting records through now, or empty or remove a queue.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "queues"
  tools: "queues_list queues_get queues_save queues_flush queues_clear queues_delete workflows_save connectors_list syncs_triggers_save"
  resource: "queues"
---

## What it is

A queue holds records until its flush rules send them to one consumer workflow as a batch.

- **Producers** add records: workflows with a queue insert step, and syncs with a sync event
  trigger of type `queue` (one record per changed record).
- The **consumer** is the workflow whose trigger is the queue. Each **flush** starts one run of
  it with the whole batch as an array.
- A queue's `status` is `running` or `paused`.

| Flush rule | Field | Default | Range |
| --- | --- | --- | --- |
| Batch size: records per flush | `flush_batch_size` | 1,000 | 1 to 10,000 |
| Maximum age: seconds a record may wait before a flush, even when the batch is not full | `flush_record_max_age` | 60 | 1 to 86,400 |
| Flushes allowed per rate limit window | `flush_rate_limit_max_flush_count` | 10 | from 1 |
| Rate limit window, in seconds | `flush_rate_limit_time_window` | 1 | from 1 |
| Order: `fifo` sends the oldest records first, `lifo` the newest | `flush_strategy` | `fifo` | |

A queue flushes when the batch size is reached, when the oldest record reaches the maximum age,
or when a flush is forced.

## When to use it

- Changes arrive in bursts and the next workflow should take them in batches.
- A workflow writes to an app with a strict API limit.
- Many sync changes should reach a workflow as one run per batch, not one call per record.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `syncs` | A sync event trigger of type `queue` adds one record per changed record; no retry | `syncs_triggers_save` |
| `workflows` | Producer: a queue insert step. Consumer: the queue consumer trigger; one run per flush | `workflows_save` |
| `connectors` | The queue steps and the queue consumer trigger are in the catalog | `connectors_list` |
| `folders` | A queue can sit in a folder | `folders_move` |

## Operations

### List queues

Use when looking for a queue by name, or before creating one.

Tools: `queues_list`

1. Call `queues_list` with a `search_query` and `region` `all`.
2. Each result gives `queue_id`, name, status, flush rules, consumer workflow and region. Reuse a
   queue that already exists.

### Show a queue and its waiting records

Use when the person asks what waits in a queue, or who produces and consumes it.

Tools: `queues_get`

1. Call `queues_get` with the `queue_id`. `region` is optional: empty searches every region.
2. It returns the queue as a `queues_save` document, its producers and consumers,
   `waiting_record_count`, and the waiting records: `order` `oldest` or `newest`, `limit` 1 to
   100 (20 by default).

### Create a queue

Use when records must collect between a producer and a consumer.

Tools: `queues_list`, `queues_save`, `connectors_list`, `workflows_save`

1. Call `queues_list` first; reuse a match.
2. Ask which region: the region of the workflows on both sides.
3. Choose the flush rules with the person:
   - Batch size: what the consumer and the receiving app handle per run.
   - Maximum age: how long a record may wait, for example 60 seconds for orders, 3,600 for a
     nightly report table.
   - Rate limit: keep flushes under the receiving app's API limit, for example 1 flush per 10
     seconds.
   - Order: keep `fifo` unless the newest records must go first.
4. Call `queues_save` with `queue_name` (unique in its region), `region`, and a `document` with
   the flush rules.
5. Build the producer and the consumer with `workflows`; find the queue steps and trigger with
   `connectors_list` and `search` `queue`. Deploy both.

### Change a queue

Use when the person wants a new name or other flush rules.

Tools: `queues_get`, `queues_save`

1. Call `queues_get` to read the current document.
2. Call `queues_save` with `queue_id`, `region`, and a `document` with only the fields to change.
   `queue_name` in the document renames it.

### Pause or resume a queue

Use when flushes must wait during a fix.

Tools: `queues_save`, `workflows_save`

1. To hold the work, prefer pausing the consumer workflow (`workflows_save` `status` `paused`):
   records keep collecting and flush once it runs again.
2. To pause the queue itself, call `queues_save` with `queue_id`, `region` and a `document` with
   `status` `paused`; `running` resumes it.

### Flush now

Use when waiting records must go to the consumer without waiting for the flush rules.

Tools: `queues_get`, `queues_flush`

1. Call `queues_get` and state `waiting_record_count`.
2. Ask the person how many records, because each flush starts a consumer run that may write to
   live apps.
3. Call `queues_flush` with `queue_id`, `region` and `record_count` (1 to 10,000).

It is the queue page's **Flush N Records** action. It asks Stacksync to flush now, whatever the
flush rules; each consumer run still takes at most `flush_batch_size` records. It is refused when
no record waits or the queue has no consumer workflow.

### Clear a queue

Use when the waiting records must be discarded.

Tools: `queues_get`, `queues_clear`

1. Call `queues_get` and state `waiting_record_count`.
2. After the person confirms, call `queues_clear` with `queue_id` and `region`.

Cleared records never reach the consumer and cannot be recovered.

### Delete a queue

Use when the queue is no longer needed.

Tools: `queues_get`, `queues_delete`

1. Call `queues_get` and name the producers and consumers that break.
2. After the person confirms, call `queues_delete` with `queue_id` and `region`. The waiting
   records are deleted with it.

## Defaults and limits

- Defaults and ranges are in the flush rule table above.
- `queues_flush`: `record_count` 1 to 10,000.
- The workspace plan sets how many queues the workspace can hold and how many events per minute
  each queue accepts.
- A sync event trigger of type `queue` adds records without retry.
- Writes run directly unless the workspace turned on "Ask before every change"; then the person
  accepts the change, and only then is it done.

## Rules

| Rule | Why |
| --- | --- |
| Ask before `queues_clear`, and state `waiting_record_count` | Cleared records cannot be recovered |
| Ask before `queues_delete`, and name the producers and consumers it breaks | Producers can no longer add records, and the waiting records are deleted |
| Ask how many records before `queues_flush` | Each flush starts a consumer run that may write to live apps |
| Pause the consumer workflow, not the producers, to hold work during a fix | Records keep collecting and flush once the workflow runs again |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| Records pile up and never leave | The consumer workflow is paused or deleted, or no workflow has the queue as its trigger | `queues_get`: check the consumers; switch the workflow on or deploy a consumer |
| `queues_flush` is refused | No record waits, or the queue has no consumer workflow | Check `waiting_record_count`; build and deploy the consumer first |
| The consumer runs on a few records at a time | The maximum age is reached before the batch fills | Raise `flush_record_max_age`, or accept small batches |
| The receiving app reports too many requests | Flushes arrive above its API limit | Lower `flush_rate_limit_max_flush_count` or raise `flush_rate_limit_time_window` |
| Consumer runs fail on part of a batch | The receiving app rejected some records | Follow `troubleshooting-workflow-runs`, fix, then replay the failed runs |
| The queue name is refused | Another queue in that region has the name | Choose another name, or reuse the existing queue |
