---
name: scheduled-genie-task
description: Gives a genie a task that runs on a cron schedule in UTC or once at a set time, such as a morning summary, a weekly review of open deals or a check of overdue invoices, answered with the genie's app actions and knowledge. Use when someone wants an AI to do a recurring review or report that needs judgement, not fixed steps.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "genies"
  tools: "genies_list genies_get genies_tasks_list genies_tasks_save genies_tasks_delete genies_activity genies_approve"
  resources: "genies knowledge-bases connections"
---

## Use it when

- A review or report is needed at a fixed time, for example every weekday at 08:00 UTC
  (`0 8 * * 1-5`), or once at a set future time.
- The output needs reading and judgement: what is unusual, what to follow up.
- Once a day or less often; for every few minutes, use a `scheduled-workflow`.

## Why this design

Advantages:
- One instruction in business words replaces a built workflow.
- The genie uses its channels, app actions and knowledge base on each run.
- `is_paused` stops a task without deleting it.

Trade-offs:
- Each run costs AI usage, more with many records read.
- Output wording varies between runs; fixed formats belong in a workflow.
- A genie runs single app actions; it cannot start a workflow.

Alternatives and why they lose:

| Alternative | Why it loses for judgement work |
| --- | --- |
| `scheduled-workflow` with an AI prompt step | Fixed steps; each new question needs a rebuild |
| A person running the report | Depends on someone remembering |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `genies` | apps | The genie with the app actions and knowledge base the task needs |
| 2 | `genies` | time | A task: `instruction`, and `cron_expression` (UTC) with an optional `start_time`, or `run_at` |
| 3 | `genies` | channel | The result goes where the instruction says, through the genie's channels |

```
schedule (UTC) -> genie task instruction -> app actions / knowledge base -> message on a channel
```

## Build it

1. `genies` "Find a Genie" that already has the needed skills, or "Create a Genie".
2. Write the instruction with the person: what to read, what to report, to which channel.
3. `genies` "Schedule a task" with the instruction and the schedule in UTC.
4. Read the first run in `genies` "Check activity and cost".

## Variations

- One-off reminder: `run_at` instead of a cron expression.
- Actions after review: give the genie skills with `approval_required` so a person approves each
  change.

## Check before going live

- Loops: a task that writes to an app read by a sync with triggers starts those triggers; check
  what they do.
- Backfill: the first run reads whatever window the instruction names; name a window ("since
  yesterday").
- Rate limits: a task that reads thousands of records spends many app calls per run.

## Rules

| Rule | Why |
| --- | --- |
| Give cron times in UTC and tell the person the local time | Tasks run in UTC |
| Name the time window and the channel in the instruction | The genie does exactly what the instruction says |
| Pause a task with `is_paused` before changing the genie's skills | A run during the change may act on a half-set configuration |
