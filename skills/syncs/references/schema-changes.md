# Schema changes

Apps change: a field is added, renamed or deleted, a table appears or goes away. What the sync does
depends on its schema update settings: per app in `app_options` on `app_1` or `app_2`, and per
table in `app_1_table_options` or `app_2_table_options`, set with `syncs_save` (the web app's
**Propagate Schema Updates** tab). The sync's **Schema History** tab in the web app lists every
change it saw, renames included.

## What happens automatically

| Change in an app | Setting (option) | Result |
| --- | --- | --- |
| Any change | **Enable schema updates** (`enable_detect_schema_changes`), with a check every 30 minutes to 24 hours (`detect_schema_changes_frequency_in_seconds`, 1800 to 86400), or the propagate now button for an immediate check | Stacksync looks for changes on that schedule; changes seen during a normal sync run are picked up sooner |
| New table | **Auto-create in target** (`propagate_table_creations_to_target_app` `true`) | The table is created in the other app and added to the sync, when that app allows creating tables and the connected account has permission |
| New table | **Do not propagate** (`propagate_table_creations_to_target_app` `false`) | The new table is ignored |
| New column in a synced table | **Add New Columns** on (table option `propagate_column_creations_to_target_app` `true`) | The column is created in the other app and added to the sync |
| Column deleted | **Unsync Deleted Columns** on (table option `auto_unsync_deleted_columns` `true`) | The column is removed from the sync. The column in the other app is kept, not deleted |
| Column renamed | (automatic) | Kept as the same column when the app has fixed field IDs. Otherwise it is treated as a deleted column plus a new one, and the two rules above apply |
| Table deleted | **Auto-unsync deleted tables** (`auto_unsync_deleted_tables` `true`) | The table leaves the sync and the sync keeps running. The table in the other app is kept |
| Table deleted | **Keep in mapping** (`auto_unsync_deleted_tables` `false`) | The sync pauses and workspace members are notified |

Tables and columns can be excluded by exact name or by a pattern, such as `^temp_.*`
(`excluded_external_table_names` and `excluded_external_table_names_regexes` on the app,
`excluded_external_column_names` and `excluded_external_column_names_regexes` on a table). The
table options set on an app side belong to that side's table, for changes made in it; tables the
sync adds later take `default_table_options_for_new_tables` from `app_options`. Send only the
options that change; the others keep their values.

## What needs action

- A table or column the settings do not add on their own needs a sync edit.
- An association whose reference key column changed is marked stale and must be added again (see
  `associations.md`).

## What an AI app can do

1. Call `syncs_get` to read the current table pairs and mapped fields.
2. Call `connections_tables` to read the current tables and fields in each app.
3. Show the person what is new, renamed or gone, and the change you propose.
4. After the person confirms, call `syncs_save` with the complete list of table pairs, including
   the new table or field, and any schema update settings that change. A table pair left out of
   the list is removed from the sync.
5. Call `syncs_get` again and show the saved result.

When a new field is added to a running sync, its values are filled in for records already synced,
and new changes keep syncing.

## Changing a schema yourself

When the person is about to rename, retype or remove fields in one of the apps:

1. Switch the sync off with `syncs_switch`, so no change is copied half way.
2. Make the change in the app.
3. Update the sync with `syncs_save`.
4. Check the saved configuration with `syncs_get`; a saved configuration change cannot be undone.
5. Switch the sync on with `syncs_switch`.
