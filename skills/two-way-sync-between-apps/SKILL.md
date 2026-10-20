---
name: two-way-sync-between-apps
description: Keeps the same records in two apps or an app and a database in step, with edits in either app copied to the other, direction chosen per table and safeguards for duplicates and deletes. Use when people edit the same records in two places and both must see each other's changes, such as a CRM and an ERP, or an app and a team's database.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs connections"
  tools: "connections_list connections_create connections_tables syncs_list syncs_get syncs_save syncs_switch syncs_issues syncs_resolve_issues"
  resources: "connections syncs"
---

## Use it when

- People create or edit the same records in both apps.
- Edits must reach the other app within seconds to 24 hours; the sync's Data Sync Frequency goes
  from 0 seconds of added wait to every 24 hours.
- The records match one to one between the two tables.

## Why this design

Advantages:
- One sync replaces two one-way integrations that would overwrite each other.
- Direction is set per table pair, so one sync can hold two-way and one-way tables.
- Read-only fields (record ids, formula fields, last modified times) sync only out of their app.
- A per-app rate limit keeps the sync under each app's API limit.

Trade-offs:
- Records already in both apps are not merged: a contact in both before the first run ends up
  twice in each. Start with one side empty, or remove the overlap first.
- A delete in one app deletes the record in the other unless Delete Protection is on.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| Two one-way syncs | Each overwrites the other's changes and can loop |
| Workflows on each side's change events | One run per record each way, no record linking, and loops unless every write is filtered |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `connections` | app 1, app 2 | One connection per app |
| 2 | `syncs` | both connections | Table pairs with fields mapped, direction per pair |
| 3 | `syncs` | web app | Per-field direction and associations, set in the web app |

```
app 1 <-> sync (table pairs, direction per pair) <-> app 2
```

## Build it

1. `connections` "Connect an app" for each app that has none; "Read tables and columns" for the real names.
2. Decide direction per table with the decision table in `syncs`.
3. `syncs` "Create a sync" with the table pairs. A new sync is saved paused.
4. Per-field direction and associations: the person sets them in the web app; give them the link.
5. Check record linking (one side empty or de-duplicated), then `syncs` "Switch a sync on or off".
6. Read the first run's issues with `syncs` "Read issues".

## Variations

- A database as one side: the team queries and edits the database with SQL; see
  `database-replica-of-an-app` for one-way.
- Actions on changes: add sync event triggers (`react-to-each-record-change`,
  `batch-sync-changes-through-a-queue`).

## Check before going live

- Loops: a workflow that writes back to either app on a sync change must use `changes_from` or
  `columns_to_ignore` on its trigger.
- Backfill: the first run copies the existing records each way; count them and confirm.
- Rate limits: set each app's rate limit in the sync under its API limit.
- Duplicates: confirm with the person that no record exists on both sides before the first run.

## Rules

| Rule | Why |
| --- | --- |
| Extend an existing sync between the same apps; never create a second | Two syncs on one table write against each other |
| Never delete and recreate a running sync to fix a mapping | The new sync does not know the old links and copies everything again |
| Agree Delete Protection per app before switching on | A delete is copied to the other app |
