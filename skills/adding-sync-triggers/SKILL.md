---
name: adding-sync-triggers
description: Adds, changes, pauses and deletes Stacksync sync event triggers and sync webhooks through the Stacksync MCP. A trigger sends an HTTP call, runs a database query or adds a queue message when a synced record is created, updated or deleted; a webhook notifies a URL of a sync's activity, failed records or backfill. Use when someone wants something to happen when records change in a sync, wants to call an API or run SQL on a change, feed a queue from a sync, or be notified about sync issues or backfill.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs"
  tools: "syncs_list syncs_get syncs_triggers_save syncs_triggers_delete syncs_webhooks_save syncs_webhooks_delete connections_list queues_list"
---

## When to use

Use this guide to act on changes a sync sees, or to be told about the sync itself:

| The person wants | Use |
| --- | --- |
| An API called when a record is created, updated or deleted | Trigger, type `webhook` (an HTTP call) |
| A SQL query run in a database on such a change | Trigger, type `db_query` |
| A message added to a Stacksync queue on such a change | Trigger, type `queue` |
| A URL told about the sync's activity, its failed records or its backfill | Sync webhook |

Use `managing-syncs` for the sync's own tables and settings, and `fixing-sync-issues` to resolve
failed records.

## Tools, in the order you use them

1. `syncs_list` finds the `sync_id`.
2. `syncs_get` lists the sync's tables, and its triggers and webhooks with their ids.
3. `connections_list` gives the `connection_id` of the database a `db_query` trigger runs in. It
   can be any database connection in the sync's region, not only one of the synced apps.
4. `queues_list` gives the `queue_id` of a `queue` trigger.
5. `syncs_triggers_save` creates a trigger, changes it (`trigger_id` and the FULL document), or
   pauses and resumes it (`trigger_id` and `is_paused`).
6. `syncs_triggers_delete` deletes a trigger.
7. `syncs_webhooks_save` adds a webhook, or swaps in a new document for one with `webhook_id`.
8. `syncs_webhooks_delete` deletes a webhook.

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
sees one preview card and selects Accept.

## The trigger document

| Field | What it is |
| --- | --- |
| `name` | The trigger's name |
| `trigger_type` | `webhook`, `db_query` or `queue` |
| `table_name` | The synced table to watch |
| `operations` | One or more of `created`, `updated`, `deleted` |
| `changes_from` | `any` (default), `app_1` or `app_2`: fire only on changes made in that app |
| `column_names_from` | `app_1` (default) or `app_2`: whose field names the record JSON uses |
| `execute_after` | `read` (default) or `write`; keep the default unless the person asks |
| `columns_to_ignore` | Fields whose changes alone do not fire the trigger |
| `filters` | Conditions the record must match; empty fires on every change |
| `action` | `webhook`: `{ "curl_command" }`; `db_query`: `{ "connection_id", "query" }`; `queue`: `{ "queue_id", "queue_data" }` |

Details, placeholders, filters and examples:
[references/trigger-document.md](references/trigger-document.md).

## When a trigger fires

- On each change to a record of `table_name` that matches `operations` and `changes_from`.
- Only when the record matches every condition in `filters`.
- Not when every changed field is in `columns_to_ignore`. If at least one other field changed, the
  filters decide as usual. Use it for fields that change often on their own, such as a last
  modified time.
- Each trigger runs on its own: a failed or timed out call or query does not stop the others.
- A created, changed or deleted trigger takes up to 1 minute to start responding.
- There is no limit on the number of triggers per sync.

## Steps for a trigger

1. Ask what should happen, on which table, for which operations, from which app, and under which
   conditions. Ask for the URL, the query or the queue; never invent them.
2. Call `syncs_get` for the table names and existing triggers.
3. Call `syncs_triggers_save` with `sync_id` and the document.
4. Call `syncs_get` and show the saved trigger.
5. To change it later, send `trigger_id` with the complete document, built from the one
   `syncs_get` returns. To stop it for a while, send `trigger_id` and `is_paused: true`; resume
   with `is_paused: false`. A new trigger runs as soon as it is saved.

## Sync webhooks

A sync webhook sends notifications about the sync to a URL. The document holds:

| Field | What it is |
| --- | --- |
| `notification_type` | `base_activity` (the sync's activity), `real_time_issue_notification` (failed records) or `backfill` (the sync's first copy of the data) |
| `url` | A public `https` URL, reachable when the webhook is saved |
| `api_key` | A key Stacksync sends with each notification, so the endpoint can check the sender. It is never returned by any tool |

Ask the person for the URL and the API key; never invent them. Then call `syncs_webhooks_save`.
To change one, send its `webhook_id` with the complete new document. `syncs_get` lists webhooks
with their ids, without the key.

## Rules

| Rule | Why |
| --- | --- |
| Ask for every URL, query, queue and API key; never invent one | A made up endpoint sends customer data to the wrong place |
| Show the trigger (table, operations, filters, action) and wait for a yes | A trigger acts on live data on every matching change |
| Send the full trigger document on every change | The saved trigger becomes exactly the document sent |
| Test a webhook trigger's URL on a test endpoint before a production one | The cURL runs as written, with no check of the request |
| When the cURL needs a key, the person adds it in the web app trigger editor; never repeat it in the chat | `syncs_get` returns the cURL as saved, headers included |
| Delete a trigger or webhook only after the person confirms its name | A delete cannot be undone |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| The trigger never fires | Wrong `operations` or `changes_from`, a filter excludes the record, or only ignored fields changed | Read it with `syncs_get`; check each field against one real change |
| The trigger fires too often | A field that changes on its own fires it | Add that field to `columns_to_ignore` |
| A database query fails | The query runs as written, with no check; a text value lacks quotes | Quote text placeholders, such as `'<<record>>.name'`; test the query in the database |
| A query or call gets almost no fields on delete | Deletes carry only the record's primary key | Use only the key on `deleted` triggers |
| `connection_id` is refused for a `db_query` | The connection is in another region than the sync | Use a connection of the sync's region from `connections_list` |
| The webhook URL is refused | It is not public `https`, or it was not reachable when saved | Use a public `https` URL that answers, then save again |
| The person wants to build conditions visually | The MCP takes the filter as JSON | Do this in the web app: open the sync, then **Create trigger**, and read it back with `syncs_get` |
