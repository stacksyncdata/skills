---
name: managing-queues
description: Creates and runs Stacksync queues through the Stacksync MCP, which collect records from producer workflows and hand them to one consumer workflow in batches, with flush rules for batch size, maximum age, rate limit and order, plus pausing, flushing now, clearing and deleting. Use when someone wants to process many changes at a steady pace, batch records between workflows, set how often a queue flushes, see what is waiting in a queue, push waiting records through now, or empty or remove a queue.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "queues"
  tools: "queues_list queues_get queues_save queues_flush queues_clear queues_delete workflows_list workflows_get connectors_list"
---

## When to use

Use a queue when changes arrive in bursts and the next workflow should take them in batches: for
example an app trigger that fires on every record change feeding a workflow that writes to a rate
limited app. Use this guide to create a queue, set its flush rules, look at what waits in it, or
flush, clear or delete it. To build the workflows on either side, use `building-workflows`.

## How a queue works

- **Producers** are workflows with a step that adds records to the queue. A queue can have
  several.
- The **consumer** is the workflow whose trigger is the queue. Each **flush** sends a batch of
  waiting records to it.
- The **flush rules** decide when a flush happens:

| Rule | Field | Default | Range |
| --- | --- | --- | --- |
| Batch size: records per flush | `flush_batch_size` | 1,000 | 1 to 10,000 |
| Maximum age: seconds a record may wait before a flush, even when the batch is not full | `flush_record_max_age` | 60 | 1 to 86,400 |
| Flushes allowed per rate limit window | `flush_rate_limit_max_flush_count` | 10 | from 1 |
| Rate limit window, in seconds | `flush_rate_limit_time_window` | 1 | from 1 |
| Order: `fifo` sends the oldest records first, `lifo` the newest | `flush_strategy` | `fifo` | |

- A queue's `status` is `running` or `paused`. A paused queue holds its records.
- The workspace plan sets how many queues the workspace can hold and how many events per minute
  each queue accepts.

## Tools in order

1. `queues_list` with a `search_query`: `queue_id`, name, status, flush rules, consumer workflow
   and region. Reuse a queue that already exists.
2. `queues_get` with the `queue_id`: the queue as a `queues_save` document, its producers and
   consumers, `waiting_record_count`, and the waiting records (`order` `oldest` or `newest`,
   `limit` 1 to 100, 20 by default).
3. `queues_save`:
   - To create: `queue_name` (unique in its region), the `region`, and a `document` with the flush
     rules. Ask the person which region, `besg` (Europe) or `usnv` (United States); use the region
     of the workflows on both sides.
   - To change: `queue_id`, `region`, and only the fields to change, such as `status` or
     `flush_batch_size`.
4. Build the producer and consumer workflows with `building-workflows`. Find the queue steps and
   the queue trigger with `connectors_list` and a `search` for `queue`. Deploy both.
5. `queues_flush` with `record_count` (1 to 10,000): sends that many waiting records to the
   consumer workflow now. Ask the person how many.
6. `queues_clear`: discards every waiting record.
7. `queues_delete`: deletes the queue and its waiting records.

## Choosing flush rules

- Batch size: the number of records the consumer can handle in one run, and the most the
  receiving app accepts per call or per run.
- Maximum age: how long the business accepts a record waiting, for example 60 seconds for orders,
  3,600 for a nightly report table.
- Rate limit: keep flushes under the receiving app's API limit, for example 1 flush per 10 seconds
  for an app that allows few calls.
- Order: keep `fifo` unless the person wants the newest records handled first.

## Rules

| Rule | Why |
| --- | --- |
| Ask before `queues_clear`, and state `waiting_record_count` | Cleared records never reach the consumer and cannot be recovered |
| Ask before `queues_delete`, and name the producers and consumers it breaks | Producers can no longer add records, and the waiting records are deleted |
| Ask how many records before `queues_flush` | Each flush starts a consumer run that may write to live apps |
| Pause the queue, not the producers, to hold work during a fix | Records keep collecting and are sent once the queue runs again |
| Writes run directly unless the workspace turned on "Ask before every change"; then the person sees a preview card and selects Accept | A declined card means nothing changed |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| Records pile up and never leave | The queue is paused, or no deployed workflow has the queue as its trigger | `queues_get`: check `status` and consumers; set `running` or deploy the consumer |
| `queues_flush` is refused | The queue has no consumer workflow to send to | Build and deploy the consumer workflow first |
| The consumer runs on a few records at a time | The maximum age is reached before the batch fills | Raise `flush_record_max_age`, or lower `flush_batch_size` if small batches are fine |
| The receiving app reports too many requests | Flushes arrive above its API limit | Lower `flush_rate_limit_max_flush_count` or raise `flush_rate_limit_time_window` |
| Consumer runs fail on part of a batch | The receiving app rejected some records | Check the runs with `monitoring-workflow-runs`, fix, then replay the failed runs |
| The queue name is refused | Another queue in that region has the name | Choose another name, or reuse the existing queue |
