# Product rules the error text does not show

- **A renamed column or table can break the configuration.** When the app has no fixed field IDs,
  a rename counts as a deleted column plus a new one. Look for the rename in the sync's **Schema
  History** tab and compare the names in `syncs_get` with `connections_tables`.
- **A deleted table pauses the sync** when its schema setting is **Keep in mapping**.
- **Deletes held back by Delete Protection are expected**, not failures. Switching it off deletes
  every held record at once.
- **Late changes come from settings**: Data Sync Frequency and the rate limit, both in
  `syncs_get`, space out the calls. `pending_changes` that keeps growing points there.
- **A child record without its parent link** means a missing or stale association: an association
  whose reference key column changed must be added again.
- **A sync event trigger that did not fire** was excluded by its filters, operations or ignored
  fields; see `syncs` "Add, change, pause or delete a sync event trigger".
