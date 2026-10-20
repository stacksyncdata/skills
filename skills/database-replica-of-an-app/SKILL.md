---
name: database-replica-of-an-app
description: Keeps a copy of an app's tables in a database, one-way from the app, so teams query, join and report on the app's data with SQL. Use when someone wants app data such as CRM, ERP or e-commerce records in their own database or warehouse for analytics, backups or other systems to read.
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

- People need SQL over app data: joins, reports, dashboards, other systems reading it.
- The copy may lag the app by 0 seconds of added wait up to 24 hours, set by the Data Sync
  Frequency.
- The tables hold 1,000 records or more, so exports by hand stop being practical.

## Why this design

Advantages:
- One-way from the app: nothing in the database can overwrite the app.
- Queries run against the database, spending no app API calls.
- Table pairs per object, all in one sync.

Trade-offs:
- The first run copies every record; large tables take hours and many app calls.
- Deletes in the app are copied to the database unless Delete Protection is on for the database.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| Two-way sync (`two-way-sync-between-apps`) | Lets database edits reach the app; wrong for a read copy |
| Scheduled exports | Full copies each time and no deletes |
| Querying the app's API from reports | Spends API calls on every report and hits rate limits |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `connections` | app, database | One connection each |
| 2 | `syncs` | both | One table pair per object, one-way from the app, into new empty tables |

```
app objects -> one-way sync -> database tables -> SQL, reports, other systems
```

## Build it

1. `connections` "Connect an app" for the app and the database; "Read tables and columns" for the app's
   objects.
2. `syncs` "Create a sync" with one table pair per object, one-way from the app, into new tables.
3. Decide Delete Protection on the database side with the person.
4. `syncs` "Switch a sync on or off"; read the first run with "Read issues".

## Variations

- Act on changes: add sync event triggers on the replica (`react-to-each-record-change`).
- Edits from the database later: change a table pair to two-way with `syncs` "Change fields and table pairs".

## Check before going live

- Loops: none while one-way; a workflow writing to the app is carried into the database, not back.
- Backfill: the first run copies every record; check the app's daily API limit against the count.
- Rate limits: set the app's rate limit in the sync.

## Rules

| Rule | Why |
| --- | --- |
| Sync into new, empty tables | Existing rows are not merged and become duplicates |
| Keep it one-way unless people must edit in the database | A read copy must not change the app |
| Never delete and recreate the sync to change a mapping; edit it | A new sync copies everything again |
