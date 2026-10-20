---
name: designing-two-way-syncs
description: Designs, builds and repairs Stacksync syncs that keep records equal between two apps, choosing one-way or two-way direction per table and planning record linking, deletes, frequency, rate limits, associations and schema changes. Use when someone wants records kept equal between two apps or databases, asks whether a sync should be one-way or two-way, is about to switch on a sync on apps that already hold data, or has a sync with issues, missing parent links or changed fields.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs"
  tools: "connections_list connections_get connections_create connections_tables connectors_list connectors_get syncs_list syncs_get syncs_save syncs_switch syncs_issues syncs_resolve_issues"
---

## When to use

Use this guide to plan or change a sync: which tables, which direction, how existing records are
linked, and what happens on deletes and schema changes. Also use it when a sync shows issues.

Use another guide when the person wants steps to run after a change (a workflow, see
`getting-started`) or when one of the apps has no Stacksync connector (`building-connectors`).

## How a sync works, in short

- A sync connects two apps and holds one or more **table pairs**, such as Salesforce Account and
  a Postgres `account` table, with the fields mapped between them.
- **Direction is set per table pair.** One sync can hold two-way tables and one-way tables side by
  side.
- **Read-only fields are one-way automatically.** In a two-way table, a field one app does not
  allow writing (a record ID, a last modified time, a formula field, a column the database user
  cannot write) syncs only out of that app, while the other fields stay two-way.
- **Database views are one-way only**, from the database to the other app, because a view cannot
  be written to.
- **Per-field direction and associations are set in the web app today.** The MCP tools set
  tables, fields and the direction of each table pair; send the person to the sync in the web app
  for the per-field direction (**Schema** tab) and for the **Associations** tab.

The full decision table is in [references/direction-decision-table.md](references/direction-decision-table.md).
App notes: [HubSpot](references/hubspot.md), [NetSuite](references/netsuite.md), [Salesforce](references/salesforce.md), [Postgres](references/postgres.md).

## Before you build

Ask the person, and wait for the answers:

1. Which two apps, and which tables in each?
2. For each table: where do people edit these records? One place means one-way; both places
   means two-way.
3. Do both apps already hold these records? If yes, record linking needs a plan (see "Record
   linking") before the sync is switched on.
4. Should a delete in one app delete the record in the other app?
5. How fresh must the data be? Seconds, every hour or once a day?

Then discover what exists:

1. `syncs_list`: an existing sync between the same two apps is extended, never duplicated.
2. `connections_list`: both apps need a connection. If one is missing, call `connections_create`
   and give the person the sign in link it returns. Never ask for a password or key in the chat.
3. `connections_tables` on each connection: the real table and field names to map.

## Steps

1. **Draft the table pairs.** For each pair, state the direction and the mapped fields, and show
   the plan to the person as a table: table A, table B, direction, fields.
2. **Create the sync switched off** with `syncs_save`. A new sync is saved paused, so nothing is
   written until the person switches it on.
3. **Read it back** with `syncs_get` and show the person the saved table pairs and fields.
4. **Associations and per-field direction.** If the plan needs either, give the person the link
   to the sync in the web app and wait until they confirm they set it.
5. **Check record linking** (next section) before switching on.
6. **Switch it on** with `syncs_switch` only after the person confirms.
7. **Watch the first run.** Call `syncs_issues` and report what it returns.

To change a running sync, read it with `syncs_get`, then send the complete new list of table
pairs to `syncs_save`: a table pair left out of the list is removed from the sync.

## Record linking

When a two-way table pair starts, the records already in each app are copied to the other app.
Stacksync does not merge records that already exist on both sides: a contact present in both apps
before the first run ends up twice in each.

- **Start with one side empty.** For example, sync Salesforce accounts with a new, empty Postgres
  table.
- **Or de-duplicate first.** When both apps hold the same records, remove the overlap from one
  side, or split the data so each record exists in only one app, before the first run.
- **Never delete and recreate a running sync** to fix a mapping. A new sync does not know which
  records the old one linked, so it copies everything again and creates duplicates. Edit the
  existing sync with `syncs_save` instead.

## Deletes and Delete Protection

By default a delete in one app is synced to the other app. **Delete Protection** is a setting on
each app of a sync: when it is on for an app, deletes made elsewhere are not applied to that app.
It works for one-way and two-way syncs, and can be on for both apps at once. The sync statistics
show how many records are held by Delete Protection.

Switching Delete Protection off deletes, at once, every record it held back. This cannot be
undone. Before the person switches it off, tell them how many held records the sync statistics
show and wait for an explicit yes.

## Frequency and rate limits

- **Data Sync Frequency** goes from real time to once a day, 1 setting per sync: set
  `max_records_sync_delay_in_seconds` with `syncs_save` (values in `managing-syncs`). Choose the
  slowest frequency the business accepts, for example 1 run per hour for data read once a
  morning; slower runs use fewer API calls.
- **Rate limit** is set per app in the sync: the maximum number of API calls Stacksync makes to
  that app, per second, minute, hour or day. Prefer a per second or per minute limit, such as
  5 to 10 requests per second; an hourly or daily limit can leave data waiting until the window
  resets. When the limit is reached, changes wait and sync once calls are available again; they
  do not fail. A changed limit takes up to 1 minute to apply.
- With no changes in either app, Stacksync makes almost no API calls.

## Associations

Associations fill a child record's link to its parent, such as an opportunity's account, when the
parent's ID in the other app is not known yet. Set them in the sync's **Associations** tab in the
web app. HubSpot associations sync as association tables, and NetSuite transaction line items sync
as an array field on the transaction. Details and examples:
[references/associations.md](references/associations.md).

## Schema changes

New tables and columns, deleted columns and renames can be handled automatically or need a manual
change, depending on the sync's schema update settings. What an AI app can do with `syncs_get` and
`syncs_save`, and what stays in the web app:
[references/schema-changes.md](references/schema-changes.md).

## Rules

| Rule | Why |
| --- | --- |
| Show the plan (tables, direction, fields) and wait for confirmation before `syncs_save` | A sync writes to live apps; the person owns that decision |
| Save new syncs switched off; switch on with `syncs_switch` only after the person confirms | The first run copies every existing record |
| Never delete and recreate a running sync | The new sync duplicates every record the old one linked |
| Never choose an issue resolution for the person; ask which one for each group of issues | Revert, retry and ignore each change data in a different app |
| Never switch Delete Protection off without an explicit yes after stating the held count | The held deletes run at once and cannot be undone |
| Never ask for a password or key; use the link from `connections_create` | Secrets in a chat leave the person's control |

## Common problems and fixes

To find and fix a sync that has issues, follow the `fixing-sync-issues` process. The rows below are
design choices that cause problems later.

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| Every record appears twice after the first run | Both apps held the same records before the sync started | See "Record linking"; de-duplicate one side, never recreate the sync |
| A field never syncs back to an app | It is read-only in that app, so it syncs one-way | Explain it; map the value to a writable field if the person needs it written |
| A view cannot be set to two-way | Views cannot be written to | Sync the underlying table, or keep the view one-way |
| Records show in the issues list | The other app rejected the change | `syncs_issues`, then ask the person which resolution, then `syncs_resolve_issues` |
| Changes arrive later than expected | Data Sync Frequency or the rate limit spaces the calls out | Check both with `syncs_get`; prefer a per second rate limit |
