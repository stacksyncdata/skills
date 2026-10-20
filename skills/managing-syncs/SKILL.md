---
name: managing-syncs
description: Creates, edits, copies, starts, pauses and deletes Stacksync syncs through the Stacksync MCP, and changes their table pairs, fields, Data Sync Frequency, rate limits and Delete Protection. Use when someone asks to set up a new sync, add or remove a table or a custom field, change how often a sync runs, copy a sync, turn a sync on or off, rename it, or delete it.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs"
  tools: "syncs_list syncs_get syncs_save syncs_switch syncs_delete connections_list connections_create connections_tables folders_list"
---

## When to use

Use this guide for the day to day work on a sync: create it, change its tables and fields, set how
often it runs, copy it, start or pause it, and delete it.

Use another guide when the person needs to decide which tables sync in which direction, how
existing records are linked, or how associations work (`designing-two-way-syncs`), when records
fail to sync (`fixing-sync-issues`), or when a change should call a URL, run a query or fill a
queue (`adding-sync-triggers`).

## Before you build

Ask the person, and wait for the answers:

1. Which two apps, and which tables in each?
2. Which direction for each table pair: both ways, or one way and which way?
3. For an existing sync: what exactly should change?

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
sees one preview card for each write and selects Accept before anything changes.

## Tools, in the order you use them

1. `syncs_list` finds the sync and its `sync_id`. Filter with `name_contains` or `status`
   (`running`, `paused`, `paused_temporarily`, `processing`). An existing sync between the same two
   apps is extended, never duplicated.
2. `connections_list` finds the `connection_id` of each app. When an app has no connection, call
   `connections_create` and give the person the secure sign in link it returns. Never ask for a
   password or key in the chat.
3. `connections_tables` on each connection gives the real table and field names to map.
4. `syncs_get` reads a sync as a `syncs_save` document, with its counts per table, triggers and
   webhooks. Pass `include_columns: true` to see the mapped fields.
5. `syncs_save` creates, copies or edits the sync. The document is explained in
   [references/sync-document.md](references/sync-document.md).
6. `syncs_switch` starts (`on: true`) or pauses (`on: false`) the sync.
7. `syncs_delete` deletes the sync for good.

## Create a sync

1. Show the plan as a table (table in app 1, table in app 2, direction) and wait for a yes.
2. Call `syncs_save` with `name` (3 to 63 characters, unique in the region) and a document holding
   `app_1.connection_id`, `app_2.connection_id` and `table_pairs`. Leave `columns` out to pair the
   fields by name and type. Set `create_table_on` to `app_1` or `app_2` to create that table, with
   every field of the other table copied into it.
3. The new sync is saved paused. Nothing is written to either app yet.
4. Set app settings (Delete Protection, rate limit) with a second `syncs_save` on the new
   `sync_id`; a create takes only the connections and the table pairs.
5. Call `syncs_get` with `include_columns: true` and show the person the saved table pairs and
   fields.
6. Switch it on with `syncs_switch`. The first run copies the records already in each app;
   check "Record linking" in `designing-two-way-syncs` first.

The sync lives in the region of its connections, `besg` (Europe) or `usnv` (United States). Both
connections must be in the same region.

## Edit a sync

1. Call `syncs_get` and keep the document it returns.
2. Send `syncs_save` with `sync_id` and only the fields that change.
3. When `table_pairs` is sent, send the FULL list: every table pair the sync keeps, plus the new
   ones. A table pair left out of the list is removed from the sync. A pair already in the sync
   keeps its mapped fields unless you send its `columns`.
4. Call `syncs_get` again and show the result.

A saved configuration change cannot be undone. Show the change and wait for a yes before saving.

## Copy a sync

1. Call `syncs_get` on the sync to copy, with `include_columns: true`.
2. Call `syncs_save` without `sync_id`, with a new `name`, the same or new connections in `app_1`
   and `app_2`, and the `table_pairs` from the copied document.
3. The copy is saved paused. Set its app settings, then switch it on with `syncs_switch`.

A copy does not know which records the original linked. Pointing a copy at the same two apps as a
running sync copies every record again and creates duplicates, so copy to other connections, such
as from a test account to a production account.

## Add a custom field

1. Create the field in the app first, such as a new HubSpot property or a database column.
2. If the sync's schema settings have **Add New Columns** on, the field is added on its own at the
   next schema check (every 1 to 24 hours, or **Propagate now** in the web app). Check with
   `syncs_get`.
3. Otherwise call `syncs_get` with `include_columns: true`, then `syncs_save` with the full
   `table_pairs` list, where the changed pair lists all its `columns` plus the new field pair.
4. Values of the new field are filled in for records already synced, then keep syncing.

To rename, retype or remove fields in an app, pause the sync with `syncs_switch` first, make the
change, update the sync, then start it again. Details in
`designing-two-way-syncs/references/schema-changes.md`.

## Frequency, rate limits and Delete Protection

- **Data Sync Frequency**: set `max_records_sync_delay_in_seconds` in the document. `0` syncs each
  change as it arrives, with no added wait; the other values are 30, 150, 450, 1800, 10800 and
  43200 seconds. Choose the slowest value the business accepts; slower runs
  use fewer API calls.
- **Rate limit**: `app_1.rate_limit` or `app_2.rate_limit` with `rate` and `frequency` in seconds
  (1, 60, 3600 or 86400). A per second or per minute limit, such as 5 to 10 per second, keeps
  data moving; an hourly or daily limit can hold changes until the period resets.
- **Delete Protection**: `delete_protection: true` on an app stops deletes made in the other app
  from reaching it. Switching it off deletes, at once, every record it held back, and this cannot
  be undone. Read the held count first (`delete_protected_records` in `syncs_get`), tell the person
  and wait for an explicit yes.

## Start, pause and delete

- `syncs_switch` with `on: false` pauses the sync; changes wait and sync once it is started again.
  Use it to stop a sync for a while.
- `syncs_delete` deletes the sync for good. The apps keep their data. A deleted sync cannot be
  brought back, and a new sync between the same apps copies every record again.

## Rules

| Rule | Why |
| --- | --- |
| Show the plan and wait for a yes before every `syncs_save` | A sync writes to live apps |
| Send the full `table_pairs` list on every edit that sends it | A table pair left out is removed from the sync |
| Pause instead of delete when the person wants it stopped | A deleted sync cannot come back; a new one duplicates records |
| Never switch Delete Protection off without the held count and a yes | The held deletes run at once and cannot be undone |
| Never ask for a password or key; use the link from `connections_create` | Secrets in a chat leave the person's control |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| A table disappeared from the sync after an edit | `table_pairs` was sent without it | `syncs_save` again with the full list, including that pair |
| "The connections are hosted in different Stacksync regions" | The two connections are in Europe and the United States | Create the missing connection in the same region with `connections_create` |
| A table or field is missing in `connections_tables` | The connected account cannot see it | Fix access in the app (app notes in `designing-two-way-syncs/references/`), then read again |
| The sync status is `paused_temporarily` | App errors stopped it | Read `syncs_get` and `syncs_issues`; see `fixing-sync-issues` |
| A new field never arrives | It was not added to the table pair, or the account cannot see it | Add it with `syncs_save`; check field visibility in the app |
| Every record appears twice after a copy | The copy ran on the same apps as the original | See "Record linking" in `designing-two-way-syncs` |
| A schema setting, per-field direction or association is needed | The MCP does not set these | Do this in the web app: open the sync, then its **Propagate Schema Updates**, **Schema** or **Associations** tab |
