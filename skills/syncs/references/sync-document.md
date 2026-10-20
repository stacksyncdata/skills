# The syncs_save document

`syncs_save` takes one document. `syncs_get` returns the same shape, so read a sync, change the
fields you need and send them back. Fields `syncs_get` returns for reading only (`sync_id`,
`status`, `is_backfill_in_progress`, `region`, `table_pair_count`, `totals`, `apps`, `triggers`,
`webhooks`, and `app_type`, `connection_name`, `table_mapping_id` and `column_count`) are not
written. Leave out `unavailable_parts`: a save that sends it is refused.

## Arguments next to the document

| Argument | When | What it is |
| --- | --- | --- |
| `sync_id` | Edit | From `syncs_list`. Leave it out to create a sync |
| `name` | Create | 3 to 63 characters, unique in the region |
| `folder_id` | Create, optional | From `folders_list` |
| `region` | Create, optional | `besg` (Europe) or `usnv` (United States); defaults to the region of the connections |
| `sync_resource_id` | Create, optional | A stable id of your choice |

## Document fields

| Field | Create | Edit | What it does |
| --- | --- | --- | --- |
| `app_1.connection_id`, `app_2.connection_id` | Required | Not changed | The connection each app uses, from `connections_list` |
| `table_pairs` | Required, at least 1 | Optional; when sent, the FULL list | The tables that sync, one pair per entry |
| `sync_name` | Not used (use `name`) | Optional | Renames the sync, 3 to 63 characters |
| `max_records_sync_delay_in_seconds` | Not used | Optional | Data Sync Frequency: `0` real time (0 seconds of added wait), `30` at least once a minute, `150` every 5 minutes, `450` every 15 minutes, `1800` every hour, `10800` every 6 hours, `43200` every 24 hours |
| `app_1` / `app_2` `.delete_protection` | Not used | Optional | `true` stops deletes from the other app reaching this app |
| `app_1` / `app_2` `.rate_limit` | Not used | Optional | `{ "rate": 5, "frequency": 1 }`: at most `rate` API calls per `frequency` seconds (1, 60, 3600 or 86400) |
| `app_1` / `app_2` `.bulk_api_access` | Not used | Optional | Salesforce apps only: turns the bulk API on or off |
| `app_1` / `app_2` `.cdc_method` | Not used | Optional | Postgres apps only: how changes are captured, `triggers` or `logical_replication` |

On an edit, send only the fields that change. A field left out keeps its value, with one
exception: `table_pairs`, when sent, is the complete list.

## A table pair

| Field | What it is |
| --- | --- |
| `app_1_table_name`, `app_2_table_name` | Table names from `connections_tables` |
| `flow_direction` | `both`, `app_1_to_app_2` or `app_2_to_app_1` |
| `create_table_on` | Optional: `app_1` or `app_2`. That table is created, with every field of the other table copied into it; the app's naming rules can change field names, so read them back with `syncs_get` |
| `columns` | Optional list of `{ "app_1_column_name": "...", "app_2_column_name": "..." }`. Left out: fields are paired by name and type for a new pair, and kept as they are for a pair already in the sync. When sent, it is the complete field list of that pair |

## Examples

Create a sync of Salesforce accounts with a new Postgres table:

```json
{
  "app_1": { "connection_id": "SALESFORCE_CONNECTION_ID" },
  "app_2": { "connection_id": "POSTGRES_CONNECTION_ID" },
  "table_pairs": [
    { "app_1_table_name": "Account", "app_2_table_name": "account", "flow_direction": "both", "create_table_on": "app_2" }
  ]
}
```

Edit: keep the account pair, add contacts one way, and sync at least once every hour:

```json
{
  "max_records_sync_delay_in_seconds": 1800,
  "table_pairs": [
    { "app_1_table_name": "Account", "app_2_table_name": "account", "flow_direction": "both" },
    { "app_1_table_name": "Contact", "app_2_table_name": "contact", "flow_direction": "app_1_to_app_2" }
  ]
}
```

Edit: limit app 1 to 5 calls per second and protect app 2 from deletes:

```json
{
  "app_1": { "rate_limit": { "rate": 5, "frequency": 1 } },
  "app_2": { "delete_protection": true }
}
```

## What the answer holds

- Create: the new sync, paused. `syncs_switch` starts it. Saving also sets up change capture on the
  apps.
- Edit: the list of changes applied.
- With "Ask before every change" on, the person first sees a preview card and selects Accept.
