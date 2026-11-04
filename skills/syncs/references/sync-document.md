# The syncs_save document

`syncs_save` takes one document. `syncs_get` returns the same shape, so read a sync, change the
fields you need and send them back. Fields `syncs_get` returns for reading only (`sync_id`,
`status`, `is_backfill_in_progress`, `region`, `table_pair_count`, `totals`, `apps`, `triggers`,
`webhooks`, `sync_resource_id`, `folder_id`, and `app_type`, `connection_name`, `table_mapping_id`,
`column_mapping_id`, `column_count` and `app_1_is_association_cdc_enabled` / `app_2_is_association_cdc_enabled`)
are not written. Leave out `unavailable_parts`: a save that sends it is refused.

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
| `max_records_sync_delay_in_seconds` | Optional | Optional | Data Sync Frequency: `0` real time (0 seconds of added wait), `30` at least once a minute, `150` every 5 minutes, `450` every 15 minutes, `1800` every hour, `10800` every 6 hours, `43200` every 24 hours |
| `app_1` / `app_2` `.delete_protection` | Optional | Optional | `true` stops deletes from the other app reaching this app |
| `app_1` / `app_2` `.rate_limit` | Optional | Optional | `{ "rate": 5, "frequency": 1 }`: at most `rate` API calls per `frequency` seconds (1, 60, 3600 or 86400) |
| `app_1` / `app_2` `.bulk_api_access` | Optional | Optional | Salesforce apps only: turns the bulk API on or off |
| `app_1` / `app_2` `.cdc_method` | Optional | Optional | Postgres apps only: how changes are captured, `triggers` or `logical_replication` |
| `app_1` / `app_2` `.app_options` | Optional | Optional | The app's schema update settings; send only the options that change ([schema-changes.md](schema-changes.md)) |

On a create, `delete_protection` and `rate_limit` are saved with the sync; the frequency, `bulk_api_access`,
`cdc_method` and the full table scan frequencies are saved right after it. When one of those is
refused, the answer names the changes already applied, the created sync first.

On an edit, send only the fields that change. A field left out keeps its value, with one
exception: `table_pairs`, when sent, is the complete list.

## A table pair

| Field | What it is |
| --- | --- |
| `app_1_table_name`, `app_2_table_name` | Table names from `connections_tables` |
| `flow_direction` | `both`, `app_1_to_app_2` or `app_2_to_app_1` |
| `create_table_on` | Optional: `app_1` or `app_2`. That table is created, with every field of the other table copied into it; the app's naming rules can change field names, so read them back with `syncs_get` |
| `columns` | Optional list of `{ "app_1_column_name": "...", "app_2_column_name": "...", "flow_direction": "..." }`. Left out: fields are paired by name and type for a new pair, and kept as they are for a pair already in the sync. When sent, it is the complete field list of that pair |
| `columns[].flow_direction` | Optional: one field's direction inside the pair, such as `app_1_to_app_2` in a `both` pair. Left out: a new field follows the pair, a field already in the sync keeps its direction. `syncs_get` shows it only where it differs from the pair's |
| `app_1_table_options`, `app_2_table_options` | Optional: that table's schema update settings ([schema-changes.md](schema-changes.md)) and, on an existing sync, its `associations` ([associations.md](associations.md)). Send only the options that change; left out, they are kept |
| `columns[].create_column_on` | Optional: `app_1` or `app_2`, in a pair of existing tables whose table on that side has `can_create_columns: true` in `connections_tables`. That field is created in the table, which then reads all its records again. One new field per pair; not used with `create_table_on` |
| `columns[].new_column_type` | Optional, on a field Stacksync creates (`create_column_on`, or a field of a `create_table_on` table): one of the app's `external_column_type` values from `connections_tables`. Left out: the app's default type for the paired field's type, an array becoming `json` |
| A new field's name | Optional on a field Stacksync creates: left out, it is named after its paired field, with `_1`, `_2` added when the name is taken. Any other field needs both names |
| `app_1_full_table_scan_frequency_in_seconds`, `app_2_full_table_scan_frequency_in_seconds` | Optional, on a table with formula fields only (Salesforce): `3600`, `14400`, `21600`, `43200` or `86400` seconds, or `null` for never |

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

Create: Postgres accounts, with a new `account` table holding the name, and the website stored in
a field named after its pair, typed `text`:

```json
{
  "app_1": { "connection_id": "SALESFORCE_CONNECTION_ID" },
  "app_2": { "connection_id": "POSTGRES_CONNECTION_ID", "delete_protection": true },
  "table_pairs": [
    {
      "app_1_table_name": "Account",
      "app_2_table_name": "account",
      "flow_direction": "app_1_to_app_2",
      "create_table_on": "app_2",
      "columns": [
        { "app_1_column_name": "Name", "app_2_column_name": "name" },
        { "app_1_column_name": "Website", "new_column_type": "postgres_text" }
      ]
    }
  ]
}
```

Edit: create a `phone` field in an existing Postgres table (its `can_create_columns` is `true`)
and, as Account holds formula fields, read it again every 24 hours for formula changes:

```json
{
  "table_pairs": [
    {
      "app_1_table_name": "Account",
      "app_2_table_name": "account",
      "flow_direction": "both",
      "app_1_full_table_scan_frequency_in_seconds": 86400,
      "columns": [
        { "app_1_column_name": "Name", "app_2_column_name": "name" },
        { "app_1_column_name": "Phone", "app_2_column_name": "phone", "create_column_on": "app_2" }
      ]
    }
  ]
}
```

Edit: an account pair of two fields, two-way, where only app 1 writes the owner (`columns` is the
pair's complete field list):

```json
{
  "table_pairs": [
    {
      "app_1_table_name": "Account",
      "app_2_table_name": "account",
      "flow_direction": "both",
      "columns": [
        { "app_1_column_name": "Name", "app_2_column_name": "name" },
        { "app_1_column_name": "OwnerId", "app_2_column_name": "owner_id", "flow_direction": "app_1_to_app_2" }
      ]
    }
  ]
}
```

## What the answer holds

- Create: the new sync, paused, and the settings saved right after it. `syncs_switch` starts it.
  Saving also sets up change capture on the apps.
- Edit: the list of changes applied.
- A refused change: the reason, often with the valid values, and the changes already applied.
- With "Ask before every change" on, the person first sees a preview card and selects Accept.
