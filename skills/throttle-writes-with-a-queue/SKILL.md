---
name: throttle-writes-with-a-queue
description: Puts a Stacksync queue between workflows that produce records and the workflow that writes them, so writes reach a rate limited app at a set pace and in batches. Use when an app rejects calls with too many requests, when bursts of events must be smoothed, or when several workflows write to the same app.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "queues workflows"
  tools: "queues_list queues_save queues_get queues_flush connectors_list connectors_module_form workflows_save workflows_deploy workflows_runs workflows_replay"
  resources: "queues workflows"
---

## Use it when

- The target app allows a limited number of calls, for example 10 per second or 1,000 per day,
  and producers can exceed it.
- Producers start more than 20 runs at the same moment, the limit per workflow.
- A delay of up to the maximum age (default 60 seconds) before the write is fine.

## Why this design

Advantages:
- Flush rules cap the pace: flushes per time window (default 10 per 1 second), batch size
  (default 1,000, up to 10,000) and maximum age (default 60 seconds, up to 86,400).
- Many producers, one writer: every workflow that adds records shares one pace.
- Records wait in the queue while the writer is paused or failing.

Trade-offs:
- One more resource to watch: records pile up if the consumer stops.
- The writer handles an array.
- No automatic retry of a failed consumer run: replay it.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| A wait step in each producer | Each run waits on its own; 20 runs still call at once |
| Retrying on "too many requests" inside the step | Spends calls on failures and still bursts |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `workflows` | `queues` | Each producer adds records with the queue insert step |
| 2 | `queues` | `workflows` | Flush rules set batch size, maximum age and flushes per window |
| 3 | `workflows` | target app | Consumer with the queue trigger writes the batch |

```
producer workflows / sync triggers -> queue (pace: N flushes per window)
  -> consumer workflow run [batch] -> rate limited app
```

## Build it

1. `queues` "Create a queue" with flush rules derived from the app's limit: batch size = records
   the app accepts per call or run; flushes per window under its call limit.
2. `workflows` "Create a workflow" for the consumer with the queue trigger; "Add a step" for
   the bulk write; "Deploy a version".
3. In each producer, `workflows` "Add a step" with the queue insert step, then "Deploy a version".
4. Watch `queues` "Show a queue and its waiting records": the waiting count should rise and fall.

## Variations

- From a sync instead of producers: `batch-sync-changes-through-a-queue`.
- Urgent records first: set the order to `lifo`.

## Check before going live

- Loops: a consumer that writes to an app read by a sync with a queue trigger on the same table
  fills its own queue; use `changes_from` or `columns_to_ignore`.
- Backfill: a one-time load of old records flows through the same pace; estimate the hours it takes.
- Rate limits: one flush is one run; count the calls one run makes, not only the flushes.

## Rules

| Rule | Why |
| --- | --- |
| Keep queue, producers and consumer in one region | A queue belongs to one region |
| Ask before clearing a queue and state the waiting count | Cleared records cannot be recovered |
| Upsert by key in the consumer | A replayed run writes the batch again |
