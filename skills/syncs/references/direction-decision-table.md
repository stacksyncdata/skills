# Choosing direction for each table

Direction is chosen per table pair, so one sync can hold both. Ask where people edit each table's
records, then use the first row that matches.

| Situation | Direction | Why |
| --- | --- | --- |
| People edit the records in both apps, and both edits must reach the other app | Two-way | Each app sees the other's edits |
| One app is the place records are created and changed; the other only reads them (a report database, a warehouse, a dashboard) | One-way, from the editing app | Nothing in the reading app can overwrite the source |
| The source is a database view | One-way, from the database | A view cannot be written to |
| A table holds values computed by one app, such as totals or formula results | One-way, from that app | The other app cannot write computed values back |
| Records are created in one app and then enriched in the other | Two-way | The new record goes one way, the enrichment comes back |
| An app writes records that a second team must not change | One-way, from that app | Edits in the second app would be overwritten or rejected |
| Unsure | Start one-way; change the table pair to two-way later with `syncs_save` | Turning two-way on later is a smaller change than undoing unwanted writes |

## Read-only fields inside a two-way table

A two-way table can still hold fields that sync only one way. Fields an app does not allow
writing, such as:

- the record ID the app assigns
- the last modified time the app keeps
- formula or computed fields
- columns the connected database user cannot write

sync only out of that app. The other fields of the table stay two-way. The web app marks these
fields "Read-only" in the field mapping.

## Per-field direction

Per-field direction, beyond the read-only fields above, is set in the sync's field mapping in the
web app today. The MCP tools set the direction of each table pair. When the plan needs a field to
sync one way inside a two-way table, give the person the link to the sync and the list of fields
to change.

## Before turning a table pair to two-way

1. Check that both apps hold no duplicate copies of the same records. Stacksync does not merge
   them; see "Record linking" in `syncs`.
2. Check the connected account in each app may write to the table.
3. Agree on Delete Protection for each app.
