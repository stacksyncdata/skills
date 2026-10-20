---
name: troubleshooting-a-sync
description: "Finds why a Stacksync sync misbehaves and fixes it in order: locate the sync, read its health and issues, explain the cause, suggest a fix, apply it after the person's yes, and confirm the next sync succeeds. Use when records are not syncing, a sync shows issues or errors, a sync is paused by errors, data differs between the two apps, or changes are stuck or slow."
license: Apache-2.0
metadata:
  type: runbook
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs"
  tools: "syncs_list syncs_get syncs_issues syncs_resolve_issues syncs_switch syncs_save connections_list connections_get connections_tables"
---

## Use it when

A sync does not do what the person expects: records fail, the sync stopped, changes are late, or
the two apps disagree. A record that cannot sync is listed as an **issue** instead of being
skipped, so nothing fails silently.

Read the error text yourself: it names the cause in the app's own words. This runbook gives the
order; [the product rules](references/product-rules.md) cover what the error text does not show. To change tables, fields or settings
outside a fix, use `syncs`.

## Before you start

- The Stacksync MCP is connected and the workspace is chosen (`getting-started`).
- Steps 1 to 3 only read. Nothing changes before step 5, and only after the person says yes.

## Steps

1. **Locate the sync.** Follow `syncs` "Find and read syncs": `syncs_list`, with `name_contains` when the
   person names it, or `status` `paused_temporarily` to list syncs that app errors stopped.
   Check: you hold one `sync_id` and its status.
2. **Read the logs.** Follow `syncs` "Find and read syncs" and "Read issues":
   - `syncs_get` with `sync_id` gives the health per table (see [health counts](references/health-and-resolutions.md)); add
     `include_diagnostics: true` for queued, in-flight and stuck work.
   - `syncs_issues` with `sync_id` lists the failed records, grouped by message in `reasons`.
     Each issue holds its `message`, the `action` that failed (`create`, `update` or `delete`),
     the table, the changed fields and the record ids in both apps. `table_mapping_id` from
     `syncs_get` narrows to one table pair; `limit` takes 1 to 100 (20 by default), `page` reads
     more. Without a `sync_id`, `syncs_issues` reads every region and returns up to `limit`
     issues per region.

   Check: you know each reason, its count and one example record.
3. **Explain** the cause in plain words, per reason: the count, the cause and one example
   record. Check [the product rules](references/product-rules.md) before naming a cause.
   Check: the person agrees the cause matches what they see.
4. **Suggest** the fix and say what it will write and where: a value or rule to change in the
   app, a sync setting, a connection to sign in again, or a resolution for the issues (see
   [resolutions](references/health-and-resolutions.md#resolutions)). Name the risks:
   - Syncs have no match keys. A retry, or switching on a sync where both apps already hold the
     same records, can create duplicates. Check for matching records in the destination first.
   - `ignore` leaves the two apps with different values; only Stacksync support restores an
     ignored issue.
   - Never delete and recreate a sync to clear issues: the new sync copies every record again.

   Check: the person said yes to this exact fix, and for each group of issues chose the
   resolution themselves.
5. **Apply** the fix:
   - Lost access: `connections` "Reauthorize a connection". `connections_list` shows
     `needs_reauthorization`; `connections_get` gives the link to that connection in the web app,
     where the person selects **Reauthorize**. Never ask for a password or key in the chat.
   - A sync setting, table pair or field: `syncs` "Change fields and table pairs" (`syncs_save`).
   - A paused sync: `syncs` "Switch a sync on or off" (`syncs_switch` with `on: true`) first.
     Resolving issues is refused while the sync is paused or not running.
   - The issues: `syncs` "Resolve issues": `syncs_resolve_issues` with `sync_id`, the
     chosen `resolution`, and either `issue_ids` (at most 100) or `all_issues: true` (every issue
     of the sync, or of `table_mapping_id`). Show the total count before `all_issues`.

   Writes run directly unless the workspace turned on "Ask before every change"; then the person
   accepts the change first, and only then report it as done.
   Check: each call returned success, or the person accepted it.
6. **Confirm** the fix worked: `syncs_issues` and `syncs_get` again, and `syncs_list` for the
   status. Report what is left as numbers.
   Check: the issue count for the fixed reason dropped and no new reason appeared.
7. **Escalate** when the cause is on Stacksync's side or a limit only Stacksync can change:
   stuck counts that stay above 0, an issue that fails again with no cause in either app, or an
   ignored issue to restore. Stop retrying and send the person to **Workspace Settings > General
   > Support Channels** with the sync, table and example record.
   Check: the person has the sync name, table and example record to send.

## Rules

| Rule | Why |
| --- | --- |
| Read the issues before proposing a fix | The message names the cause; a guess sends the retry into the same failure |
| Let the person pick the resolution for each group of issues | Revert, retry and ignore each change data in a different app |
| Wait for the person's yes before every write in step 5 | Each fix writes to live apps |
| Stop retrying when step 7 applies | A retry cannot fix a cause on Stacksync's side |

## When the MCP cannot do it

The MCP has no tool for these settings. Say so, and send the person to the one place in the web app:

- Schema update settings, such as **Keep in mapping**: the sync's **Propagate Schema Updates** tab.
- Per field direction: the sync's **Schema** tab.
- Associations: the sync's **Associations** tab.
- Column changes the sync saw, renames included: the sync's **Schema History** tab.
- Email alerts for sync issues: **Workspace Settings > Notifications**.
