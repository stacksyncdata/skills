---
name: syncs
description: Creates, edits, copies, starts, pauses and deletes Stacksync syncs that keep records equal between two apps, plans one-way or two-way direction per table, resolves failed records, and adds sync event triggers and sync webhooks. Use when someone asks to set up or change a sync, choose sync direction, add a table or field, change how often a sync runs, switch a sync on or off, retry or ignore failed records, or run a call, query or queue message when synced records change.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs"
  resource: "syncs"
  tools: "syncs_list syncs_get syncs_save syncs_switch syncs_delete syncs_issues syncs_resolve_issues syncs_triggers_save syncs_triggers_delete syncs_webhooks_save syncs_webhooks_delete connections_list connections_create connections_tables queues_list folders_list"
---

## What it is

A sync keeps records equal between two apps, such as a CRM and a database. It holds one or more
**table pairs**, each with mapped fields and a direction: `both`, `app_1_to_app_2` or
`app_2_to_app_1`. One sync can hold two-way and one-way pairs side by side. A sync lives in one
region, `besg` (Europe) or `usnv` (United States), the region of its two connections.

A sync also carries **sync event triggers** (an HTTP call, a database query or a queue message
when a synced record is created, updated or deleted) and **sync webhooks** (notifications about
the sync itself).

## When to use it

- Records must stay equal in two apps, continuously, in one or both directions.
- A record change in a synced app must call an API, run SQL or feed a queue.
- A URL must be told about a sync's activity, failed records or first copy of the data.

Use a workflow instead for multi-step logic on each record, and `connectors` for a one-off action
in an app. When a sync has failed records or stopped, follow the runbook `troubleshooting-a-sync`.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `connections` | Each sync uses two connections in the same region | `connections_list`, `connections_tables`, `connections_create` |
| `queues` | A sync event trigger of type `queue` adds one queue message per matching record change | `syncs_triggers_save`, `queues_list` |
| `workflows` | A sync event trigger of type `webhook` calls a workflow's webhook URL, one call per record. The workflow sync trigger (a record change starts a workflow) is set in the web app only | `syncs_triggers_save` |
| `folders` | A new sync can be saved in a folder; move it later with the folders tools | `syncs_save` (`folder_id`), `folders_list` |
| `connectors` | No native link: the connector catalog runs single app actions; a sync uses its own engine | none |
| `variables` | No native link: a trigger's cURL or query runs as written, without workspace variables | none |
| `api-proxies` | No native link: an API proxy and a sync can share a connection, nothing more | none |
| `genies` | No native link: a sync trigger calls a URL, a database or a queue, never a Genie | none |
| `knowledge-bases` | No native link | none |

## Operations

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
accepts each change on a preview card, and only then report it as done.

### Find and read syncs

Use when the person names a sync, asks which syncs exist, or before any change.

Tools: `syncs_list`, `syncs_get`

1. Call `syncs_list` with `name_contains` or `status` (`running`, `paused`, `paused_temporarily`,
   `processing`). `paused_temporarily` means app errors stopped it.
2. Call `syncs_get` with the `sync_id`. It returns the sync as a `syncs_save` document, counts per
   table, triggers and webhooks with their ids. Add `include_columns: true` for mapped fields,
   `table_name_contains` to narrow a large sync, `include_diagnostics: true` for queued, in-flight
   and stuck work.

### Plan direction per table pair

Use when the person wants a new sync or a new table pair and has not said the direction.

Tools: `syncs_list`, `connections_tables`

1. Ask where people edit each table's records. One place: one-way from that app. Both places:
   two-way. Use [references/direction-decision-table.md](references/direction-decision-table.md).
2. Ask whether both apps already hold these records (see "Record linking" below), whether a
   delete should reach the other app, and how fresh the data must be.
3. Call `syncs_list`: extend an existing sync between the same two apps, never duplicate it.
4. Show the plan as a table (table in app 1, table in app 2, direction, fields) and wait for a yes.

Record linking: Stacksync does not merge records that exist in both apps before a two-way pair
starts, so a contact present in both ends up twice in each. Start with one side empty, or remove
the overlap from one side before the first run.

Read-only fields (a record ID, a last modified time, a formula, a column the database user cannot
write) sync only out of their app, even in a two-way pair. A database view syncs one-way only.
App notes: [HubSpot](references/hubspot.md), [NetSuite](references/netsuite.md),
[Salesforce](references/salesforce.md), [Postgres](references/postgres.md).

### Create a sync

Use when no sync exists yet between the two apps for these tables.

Tools: `connections_list`, `connections_create`, `connections_tables`, `syncs_save`, `syncs_get`

1. Call `connections_list` for both apps. When one is missing, call `connections_create` and give
   the person the sign-in link it returns. Never ask for a password or key in the chat.
2. Call `connections_tables` on each connection for the real table and field names.
3. Call `syncs_save` without `sync_id`, with `name` (3 to 63 characters, unique in the region) and
   a document holding `app_1.connection_id`, `app_2.connection_id` and `table_pairs`. Leave
   `columns` out to pair fields by name and type. Set `create_table_on` to create that table with
   every field of the other one. Optional: `folder_id`, `region`, `sync_resource_id`.
4. The sync is saved paused. Saving already creates any `create_table_on` table and sets up change
   capture in the apps. Set app settings with a second `syncs_save` (see "Set frequency, rate
   limits and app settings"): a create takes only connections and table pairs.
5. Call `syncs_get` with `include_columns: true` and show the saved pairs and fields.

Document fields and examples: [references/sync-document.md](references/sync-document.md).

### Copy a sync

Use when the person wants the same sync on other connections, such as test to production.

Tools: `syncs_get`, `syncs_save`

1. Call `syncs_get` with `include_columns: true`.
2. Call `syncs_save` without `sync_id`, with a new `name`, the target connections and the copied
   `table_pairs`. The copy is saved paused.

A copy does not know which records the original linked: on the same two apps it copies every
record again and creates duplicates.

### Change fields and table pairs

Use when the person adds, removes or changes a table pair, its direction or its mapped fields,
including a new custom field.

Tools: `syncs_get`, `connections_tables`, `syncs_save`

1. Call `syncs_get` with `include_columns: true` and keep the document.
2. Send `syncs_save` with `sync_id` and the FULL `table_pairs` list: every pair the sync keeps plus
   the new ones. A pair left out is removed, with its record links and issues. A kept pair keeps
   its fields unless you send its `columns`, which is then its complete field list.
3. Show the change and wait for a yes; a saved change cannot be undone. Read it back with
   `syncs_get`.

A new custom field must exist in the app and be visible to the connected account. With **Add New
Columns** on in the sync's schema settings, it is added on its own at the next schema check;
otherwise add it to the pair's `columns`. Values are filled in for records already synced. To
rename, retype or remove a field in an app: pause the sync, change the app, update the sync,
start it again ([references/schema-changes.md](references/schema-changes.md)).

### Set frequency, rate limits and app settings

Use when the person wants the sync faster or slower, fewer API calls, or a per-app setting changed.

Tools: `syncs_get`, `syncs_save`

1. Call `syncs_save` with `sync_id` and only the changed fields:
   - `max_records_sync_delay_in_seconds` (Data Sync Frequency): `0` (0 seconds of added wait), `30` at least once a
     minute, `150` every 5 minutes, `450` every 15 minutes, `1800` every hour, `10800` every 6
     hours, `43200` every 24 hours. Choose the slowest value the business accepts.
   - `app_1.rate_limit` / `app_2.rate_limit`: `rate` calls per `frequency` seconds (1, 60, 3600 or
     86400). Prefer per second or per minute; an hourly or daily limit holds changes until it
     resets. Changes wait at the limit, they do not fail.
   - `bulk_api_access` (Salesforce), `cdc_method` (`triggers` or `logical_replication`, Postgres).
   - `sync_name` renames the sync.
2. Read it back with `syncs_get`.

### Set Delete Protection

Use when deletes in one app must not reach the other app, or the person wants that stopped.

Tools: `syncs_get`, `syncs_save`

1. Send `syncs_save` with `sync_id` and `app_1.delete_protection` or `app_2.delete_protection`.
   `true` stops deletes made in the other app from reaching this app.
2. Before setting it to `false`, read `delete_protected_records` with `syncs_get`, tell the person
   the count and wait for an explicit yes: every held delete runs at once and cannot be undone.

### Switch a sync on or off

Use when the person asks to start, resume, pause or stop a sync.

Tools: `syncs_get`, `syncs_switch`

1. Before the first start, check "Record linking" in "Plan direction per table pair".
2. Call `syncs_switch` with `on: true` to start, `on: false` to pause. Paused changes wait and sync
   once it starts again. The first run copies the records already in the sending app, or in both
   apps for a two-way pair.

### Delete a sync

Use when the person wants the sync gone for good, not paused.

Tools: `syncs_get`, `syncs_delete`

1. Confirm the sync's name with the person; suggest pausing if they only want it stopped.
2. Call `syncs_delete`. The apps keep their data; the data Stacksync holds for the sync is deleted.
   A new sync between the same apps copies every record again.

### Read issues

Use when the person asks why records failed to sync.

Tools: `syncs_issues`, `syncs_get`

1. Call `syncs_issues` with `sync_id` (faster; without it every region is read), optionally
   `table_mapping_id` from `syncs_get`, `issue_id`, `limit` (1 to 100, default 20) and `page`.
2. Explain the reasons grouped by message first, then single records. The full process is in
   `troubleshooting-a-sync`.

### Resolve issues

Use when the person chose what to do with failed records.

Tools: `syncs_issues`, `syncs_resolve_issues`

1. Ask which resolution for each group; never pick one: `retry` sends the change again, `revert`
   undoes it in the source app, `ignore` drops it.
2. Call `syncs_resolve_issues` with `sync_id`, `resolution` and either `issue_ids` (at most 100)
   or `all_issues: true`, optionally with `table_mapping_id` to limit it to one table.
3. Report how many were resolved and failed.

### Add, change, pause or delete a sync event trigger

Use when a record change in the sync must send an HTTP call (`webhook`), run SQL (`db_query`) or
add a queue message (`queue`).

Tools: `syncs_get`, `connections_list`, `queues_list`, `syncs_triggers_save`, `syncs_triggers_delete`

1. Ask what should happen, on which table, for which operations (`created`, `updated`,
   `deleted`), from which app (`changes_from`) and under which conditions. Ask for the URL, query
   or queue; never invent them.
2. Call `syncs_get` for table names and existing triggers. For `db_query`, pick a database
   connection of the sync's region with `connections_list`; for `queue`, a queue with
   `queues_list`.
3. Call `syncs_triggers_save` with `sync_id` and the document. A new trigger is saved active.
4. To change one, send `trigger_id` with the FULL document built from `syncs_get`. To pause or
   resume, send `trigger_id` and `is_paused`.
5. To delete one, confirm its name, then call `syncs_triggers_delete` with `trigger_id`.

Fields, placeholders (`<<record>>`, `<<changes>>`, `<<change_type>>`), conditions and examples:
[references/trigger-document.md](references/trigger-document.md). A change to a trigger takes up
to 1 minute to apply. Each trigger runs on its own; one failing does not stop the others.

### Add, change or delete a sync webhook

Use when a URL must be notified of the sync's activity, failed records or backfill.

Tools: `syncs_get`, `syncs_webhooks_save`, `syncs_webhooks_delete`

1. Ask for the URL (public `https`, reachable when saved) and the API key Stacksync sends with each
   notification.
2. Call `syncs_webhooks_save` with `sync_id` and `notification_type` (`base_activity`,
   `real_time_issue_notification` or `backfill`), `url` and `api_key`.
3. To replace one, send its `webhook_id` with the complete document, the API key included: no tool
   returns it, so ask the person again.
4. To delete one, call `syncs_webhooks_delete` with `webhook_id`.

### Set per-field direction, associations and schema settings

Use when a field must sync one way inside a two-way pair, a child record needs its parent link, or
schema changes must be handled automatically.

Tools: `syncs_get`

1. Give the person the link to the sync in the web app; the MCP does not set these.
2. Per-field direction: the sync's **Schema** tab. Associations: the **Associations** tab, see
   [references/associations.md](references/associations.md). Schema update settings: the
   **Propagate Schema Updates** tab; past changes: **Schema History**, see
   [references/schema-changes.md](references/schema-changes.md).
3. Read the result back with `syncs_get` once the person confirms.

### Start a workflow when a synced record changes

Use when a workflow must run on each record change in an app.

Tools: `syncs_triggers_save`

1. Through the MCP: add a sync event trigger of type `webhook` that calls the workflow's webhook
   URL, one call per record, or of type `queue` that a queue consumer workflow reads.
2. The workflow sync trigger is set in the web app only, as the first step of the workflow.

## Defaults and limits

| Setting | Value |
| --- | --- |
| Sync name | 3 to 63 characters, unique in the region |
| New sync | Saved paused, in the region of its connections |
| Data Sync Frequency, rate limit period | See "Set frequency, rate limits and app settings" |
| `syncs_issues` page | 20 by default, 100 at most |
| `syncs_resolve_issues` | 100 `issue_ids` at most, or `all_issues` |
| Trigger defaults | `changes_from: any`, `column_names_from: app_1`, `execute_after: read`, active |
| Trigger changes | Apply within 1 minute; no limit on triggers per sync |

## Rules

| Rule | Why |
| --- | --- |
| Show the plan and wait for a yes before every `syncs_save` | A sync writes to live apps |
| Send the full `table_pairs` list whenever it is sent | A pair left out is removed with its record links and issues |
| Never delete and recreate a sync to fix a mapping; edit it | A new sync duplicates every record the old one linked |
| Pause instead of delete when the person wants it stopped | A deleted sync cannot come back |
| Never switch Delete Protection off without the held count and a yes | The held deletes run at once and cannot be undone |
| Never choose an issue resolution; ask for each group | Retry, revert and ignore change data in different apps |
| Ask for every URL, query, queue and API key; never invent one | A made-up endpoint sends customer data to the wrong place |
| Send the full trigger document on every trigger change | The saved trigger becomes exactly the document sent |
| When a trigger's cURL needs a key, the person adds it in the web app trigger editor | `syncs_get` returns the cURL as saved, headers included |
| Never ask for a password or key; use the link from `connections_create` | Secrets in a chat leave the person's control |

## Common problems

For failed records, stopped syncs or late data, follow the runbook `troubleshooting-a-sync`.

| What the person sees | Why | What to do |
| --- | --- | --- |
| A table disappeared after an edit | `table_pairs` was sent without it | Save again with the full list; the pair starts fresh, so check a two-way pair for duplicates first |
| Every record appears twice | Both apps held the records before the first run, or a copy ran on the same apps | De-duplicate one side; never recreate the sync |
| "The connections are hosted in different Stacksync regions" | The connections are in `besg` and `usnv` | Create the missing connection with `connections_create` in the other connection's region |
| A table or field is missing in `connections_tables` | The connected account cannot see it | Fix access in the app (app notes in references), then read again |
| The sync status is `paused_temporarily` | App errors stopped it | Follow `troubleshooting-a-sync` |
| A trigger misfires or fails | See the trigger problems table | [references/trigger-document.md](references/trigger-document.md#common-problems) |
| The webhook URL is refused | Not public `https`, not reachable when saved, holds `%`, `#` or a space, or the sync already has that type for that URL | Use a public `https` URL that answers, then save again |
