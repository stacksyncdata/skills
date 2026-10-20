---
name: scheduled-workflow
description: Runs a workflow on a cron schedule in UTC to pull, check, report or clean up data at fixed times. Use when work should happen every few minutes, hourly, daily or weekly rather than on each change, such as a nightly report, a daily reconciliation or an hourly import from an API without webhooks.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workflows"
  tools: "connectors_list connectors_get connectors_module_form workflows_save workflows_get workflows_deploy workflows_runs workflows_run workflows_replay"
  resources: "workflows connectors variables"
---

## Use it when

- The work has a natural time: a report at 08:00, a reconciliation once a day, an import every
  15 minutes.
- A delay up to the schedule interval is fine (for example 1 hour on an hourly schedule).
- The source has no change events, or the action works on a whole set (totals, a file, a digest).

## Why this design

Advantages:
- One run per interval, whatever the number of changes: 10,000 changes in a day are one daily run.
- Predictable load on the apps, at a time the person chooses.

Trade-offs:
- Data is as old as the interval.
- The workflow must find what changed since the last run, for example records modified in the
  last interval plus a margin.
- A failed run waits for the next interval unless replayed.

Alternatives and why they lose:

| Alternative | Why it loses for time-based work |
| --- | --- |
| Per-change runs (`react-to-each-record-change`) | One run per record; a digest or a total needs all records at once |
| A sync | Copies records; it does not compute reports or send digests |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `workflows` | time | Automated schedule trigger: a cron expression and a start time, in UTC |
| 2 | `workflows` | source app | Read step: records changed since the last interval |
| 3 | `workflows` | target app or email | Write, report or send |

```
cron (UTC) -> workflow run -> read changed records -> act -> write / send
```

## Build it

1. Agree the schedule in UTC with the person; convert from their time zone.
2. `workflows` "Create a workflow" with the Automated schedule trigger.
3. `connectors` "Show an app" for the read and write steps; `workflows` "Add a step".
4. `workflows` "Deploy a version", then "Test a workflow" once to test without waiting for the schedule.

## Variations

- Large result sets: the run adds records to a queue and a consumer writes batches
  (`throttle-writes-with-a-queue`).
- A summary written by AI: a scheduled genie task (`scheduled-genie-task`) when the output is a
  judgement rather than fixed steps.

## Check before going live

- Loops: if the workflow writes to an app that a sync reads, the sync carries those writes on;
  make sure no sync event trigger starts this workflow again.
- Backfill: the first run reads the full "since" window; set it to one interval, not all history.
- Rate limits: a run that reads or writes thousands of records must page and stay under the app's
  limit; overlapping runs happen when one run lasts longer than the interval.

## Rules

| Rule | Why |
| --- | --- |
| Write cron times in UTC and tell the person the local time | The trigger runs in UTC |
| Overlap the "changed since" window by a margin and upsert | A late or replayed run must not miss or duplicate records |
| Keep the run shorter than the interval | Otherwise runs pile up |
