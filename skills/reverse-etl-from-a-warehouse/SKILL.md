---
name: reverse-etl-from-a-warehouse
description: Copies modelled data, such as scores, segments or account health, from a data warehouse table or view into the matching fields of an operational app, through a one-way sync. Use when someone wants numbers computed in a warehouse to appear in a CRM, support tool or ERP for the teams who work there.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs connections"
  tools: "connections_list connections_create connections_tables syncs_list syncs_get syncs_save syncs_switch syncs_issues"
  resources: "connections syncs"
---

## Use it when

- Values are computed in a warehouse (a score, a segment, a lifetime value) and people need them
  in an app.
- Each warehouse row matches one app record by a key, such as the app's record id or an email.
- A refresh every 15 minutes to every 24 hours is enough (Data Sync Frequency `450` to `43200`
  seconds).

## Why this design

Advantages:
- A one-way sync from the warehouse cannot overwrite the warehouse.
- A view works as the source, and views are one-way by nature.
- The sync's rate limit keeps writes under the app's API limit.

Trade-offs:
- Each changed row is a write in the app; recomputing all scores each night can update every record.
- The key must exist on both sides; rows without a matching record become new records.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| A scheduled workflow that queries the warehouse and writes to the app | Rebuilds change detection, paging and rate limits the sync has |
| Exporting a file and importing it by hand | Out of date the moment it is imported |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `connections` | warehouse, app | One connection each |
| 2 | `syncs` | both | Table pair: warehouse table or view to the app object, one-way from the warehouse |

```
warehouse table / view -> one-way sync (frequency, rate limit) -> app object fields
```

## Build it

1. `connections` "Connect an app" for the warehouse and the app; "Read tables and columns" for names.
2. Prepare a view with one row per app record and only the fields to copy.
3. `syncs` "Create a sync": the table pair one-way from the warehouse, the key mapped, a frequency
   and the app's rate limit.
4. `syncs` "Switch a sync on or off", then "Read issues" after the first run.

## Variations

- Act on changed scores: add a sync event trigger (`batch-sync-changes-through-a-queue`).
- Several objects: one table pair per object in the same sync.

## Check before going live

- Loops: a workflow that writes the same fields in the app must not exist; the sync would overwrite
  it on the next run.
- Backfill: the first run writes every row; count them against the app's daily API limit.
- Rate limits: set the sync's rate limit for the app.

## Rules

| Rule | Why |
| --- | --- |
| Write into fields only the warehouse fills | People's edits to those fields are overwritten |
| Send only rows that changed, by keeping the view stable | Unchanged values spend no app calls |
| Keep it one-way | The warehouse is the source of truth for computed values |
