---
name: chain-workflows
description: Hands work from one workflow to another, through an HTTP step that calls the next workflow's webhook URL or through a queue that the next workflow consumes. Use when a process is split into separate workflows owned or deployed separately, or one workflow should start another.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workflows queues"
  tools: "connectors_list connectors_module_form workflows_list workflows_get workflows_save workflows_deploy workflows_runs queues_save queues_get"
  resources: "workflows queues variables"
---

## Use it when

- One process has 2 or more parts with their own owners, schedules or retry needs.
- A shared part (for example "create customer") is used by 3 or more workflows.

## Why this design

There is no native "start workflow" step. A workflow starts another in one of two ways:

| Way | Use when | Trade-off |
| --- | --- | --- |
| HTTP step to the next workflow's webhook URL | One hand-off per run, low volume | One run of the next workflow per call; at most 20 run at the same time; a failed call is not retried |
| Queue insert step, next workflow on the queue trigger | Many hand-offs or bursts | Adds a wait up to the queue's maximum age (default 60 seconds); the next workflow handles a batch |

Advantages:
- Each part deploys and is replayed on its own.
- A shared part is built once.

Trade-offs:
- A run's history is split over two workflows; trace by an id passed along.
- The webhook URL is shown only on the trigger step in the web app.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| Copying the steps into each workflow | Every fix is made in several places |
| A genie in between | A genie runs single app actions, never a whole workflow |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `workflows` | next workflow | HTTP step posting to its webhook URL, kept in a variable |
| 1b | `workflows` | `queues` | Or: queue insert step |
| 2 | `workflows` | caller | Webhook trigger, or queue trigger |

```
workflow A -> HTTP POST -> workflow B webhook trigger        (one by one)
workflow A -> queue insert -> queue -> workflow B queue trigger  (batched)
```

## Build it

1. Build and deploy the next workflow first: `workflows` "Create a workflow" with the webhook or
   queue trigger, then "Deploy a version".
2. Webhook: the person copies the URL from its trigger step in the web app; keep it with
   `variables` "Create a variable" and read it as `{{ WORKSPACE_VARIABLES.<reference> }}`.
3. Queue: `queues` "Create a queue" in the workflows' region.
4. In the first workflow, `workflows` "Add a step" (HTTP request or queue insert), "Fill a step's
   form", then "Deploy a version".
5. Run the first workflow once and read both runs with `workflows` "Read runs".

## Variations

- Wait for a result: put the parts in one workflow instead; a chained call does not return the
  next workflow's output to the first.

## Check before going live

- Loops: workflow B must never call workflow A back unless a condition stops it.
- Backfill: a bulk run of workflow A starts as many runs of workflow B; prefer the queue.
- Rate limits: count B's app calls per A run.

## Rules

| Rule | Why |
| --- | --- |
| Pass a correlation id (A's record id) in every hand-off | It links the runs of both workflows |
| Keep the next workflow's URL in a variable, not typed into each step | A changed URL is fixed in one place |
| Make B safe to run twice for the same input | A replayed A sends the hand-off again |
