---
name: fixing-sync-issues
description: "Finds and fixes Stacksync sync problems through the Stacksync MCP with one process: find the sync, read its health and the records that failed, explain the cause, propose a fix, check it cannot create duplicates or lose data, apply it after the person agrees, and confirm the next sync succeeds. Use when someone says records are not syncing, a sync shows issues or errors, a sync is paused by errors, data looks different in the two apps, or changes are stuck or slow."
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs"
  tools: "syncs_list syncs_get syncs_issues syncs_resolve_issues syncs_switch syncs_save connections_list connections_get connections_create connections_tables"
---

## When to use

Use this guide when a sync does not do what the person expects: records fail, the sync stopped,
changes are late, or the two apps disagree.

A record that cannot sync is listed as an **issue** instead of being skipped, so nothing fails
silently. Read the error text yourself: it names the cause in the app's own words, and new
messages appear all the time. This guide gives the process and the product rules the error text
does not show.

Use `managing-syncs` to change tables, fields or settings, and `designing-two-way-syncs` for
direction choices, record linking and associations.

## The process

Follow the steps in order. Steps 1 to 4 only read; nothing changes until step 6.

1. **Find the sync.** `syncs_list`, with `name_contains` when the person names it. A
   `paused_temporarily` status means app errors stopped it. Pass `status` to list only those.
2. **Open the logs.** `syncs_get` with `sync_id` reads the health per table (see "Reading
   health"); pass `include_diagnostics: true` for queued, in-flight and stuck work. Then
   `syncs_issues` with the `sync_id` lists the failed records, grouped by message in `reasons`.
   Each issue holds its `message`, the `action` that failed (`create`, `update` or `delete`), the
   table, the changed fields and the record ids in both apps. `table_mapping_id` from `syncs_get`
   narrows to one table pair; `limit` takes 1 to 100 (20 by default) and `page` reads more.
3. **Explain** the cause to the person in plain words, for each reason: the count, the cause and
   one example record. Check the product rules below before naming a cause.
4. **Suggest** the fix: a value or rule to change in the app, a sync setting to change, a
   connection to sign in again, or a resolution for the issues (see "Resolutions").
5. **Check before fixing.** Say what the fix will write and where, and wait for the person's yes:
   - Syncs have no match keys. A retry, or switching on a sync where both apps already hold the
     same records, can create duplicates. Check for matching records in the destination first.
   - `ignore` leaves the two apps with different values, and only Stacksync support can restore
     an ignored issue.
   - Deleting cannot be undone. Never delete and recreate a sync to clear issues: the new sync
     copies every record again.
6. **Apply** the fix through a tool:
   - Lost access: `connections_list` shows `needs_reauthorization`; `connections_create` gives
     the sign in link for the person. Never ask for a password or key in the chat.
   - A sync setting, table pair or field: `syncs_save` (see `managing-syncs`).
   - The issues: `syncs_resolve_issues` with `sync_id`, the chosen `resolution`, and either
     `issue_ids` (at most 100) or `all_issues: true` (every issue of the sync, or of
     `table_mapping_id`). Show the total count before `all_issues`.
   - A paused sync: `syncs_switch` with `on: true`.
7. **Confirm** the fix worked: `syncs_issues` and `syncs_get` again, and `syncs_list` for the
   status. Report what is left as numbers.
8. **Contact Stacksync support** when the cause is on Stacksync's side, or a limit only
   Stacksync can change: stuck counts that stay above 0, an issue that fails again with no cause
   in either app, or an ignored issue to restore. Stop retrying, and send the person to
   **Workspace Settings > General > Support Channels** with the sync, table and example record.

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
sees one preview card and selects Accept.

## Reading health

`syncs_get` returns, per app and per table:

| Count | What it means |
| --- | --- |
| `records` | Records in that table |
| `issues` | Records that failed to sync and wait for a resolution |
| `pending_changes` | Changes read and waiting to be written |
| `ignored_issues` | Issues the person chose to ignore |
| `delete_protected_records` | Deletes held back by Delete Protection |

`totals` adds up `issues` and `pending_changes`. `is_backfill_in_progress: true` means the sync
is still reading its first copy of the apps' data, so counts keep moving. Counts ending in
`_stuck_count` above 0 mean work has waited too long.

## Resolutions

Ask the person which resolution to use for each group of issues. Never choose for them: each one
changes data in a different place.

| Resolution | What it does |
| --- | --- |
| `retry` | Reads the record's latest values from the app where the change was made and sends them again. Fix the cause first, or it fails again |
| `revert` | Puts the previous value back in the app where the change was made, read from the other app |
| `ignore` | Removes the issue from the list; the two apps keep different values |

## Product rules the error text does not show

- **Without a `sync_id`, `syncs_issues` reads only the workspace's default region.** Issues of a
  sync in another region are missed, so always pass the `sync_id`.
- **A renamed column or table can break the sync's configuration.** When the app has no fixed
  field IDs, a rename counts as a deleted column plus a new one. When a column or table is
  missing, look for a rename in the sync's **Schema History** tab and compare the names in
  `syncs_get` with `connections_tables`.
- **A deleted table pauses the sync** when its schema setting is **Keep in mapping**.
- **Deletes held back by Delete Protection are expected**, not failures. Switching it off
  deletes every held record at once.
- **Late changes come from settings**: Data Sync Frequency and the rate limit, both in
  `syncs_get`, space out the calls. `pending_changes` that keeps growing points there.
- **A child record without its parent link** means a missing or stale association: an
  association whose reference key column changed must be added again.
- **A trigger that did not fire** was excluded by its filters, operations or ignored fields; see
  `adding-sync-triggers`.

## When the MCP cannot make the fix

The MCP has no tool for these settings. Say so, and send the person to the one place:

- Schema update settings, such as **Keep in mapping**: do this in the web app: the sync's
  **Propagate Schema Updates** tab.
- Per field direction: do this in the web app: the sync's **Schema** tab.
- Associations: do this in the web app: the sync's **Associations** tab.
- Email alerts for sync issues: do this in the web app: **Workspace Settings > Notifications**.

To see renames and other column changes the sync saw, look in the web app: the sync's **Schema
History** tab; no MCP tool reads it.

## Rules

| Rule | Why |
| --- | --- |
| Read the issues before proposing a fix | The message names the cause; a guess sends the retry into the same failure |
| Ask which resolution for each group of issues; never pick one | Revert, retry and ignore each change data in a different app |
| Wait for the person's yes before every write in step 6 | Each fix writes to live apps |
| Stop retrying when step 8 applies | A retry cannot fix a cause on Stacksync's side |
