# Sync health counts and issue resolutions

## Reading health

`syncs_get` returns, per app and per table:

| Count | What it means |
| --- | --- |
| `records` | Records in that table |
| `issues` | Records that failed to sync and wait for a resolution |
| `pending_changes` | Changes read and waiting to be written |
| `ignored_issues` | Issues the person chose to ignore |
| `delete_protected_records` | Deletes held back by Delete Protection |

`totals` adds up `issues` and `pending_changes`. `is_backfill_in_progress: true` means the sync is
still reading its first copy of the apps' data, so counts keep moving. With
`include_diagnostics: true`, counts ending in `_stuck_count` above 0 mean work has waited too long.

## Resolutions

| Resolution | What it does |
| --- | --- |
| `retry` | Reads the record's latest values from the app where the change was made and sends them again. Fix the cause first, or it fails again |
| `revert` | Puts the previous value back in the app where the change was made, read from the other app |
| `ignore` | Removes the issue from the list; the two apps keep different values |

In a one-way table pair only one of `retry` and `revert` is accepted: `retry` for records that
failed to reach the app that only receives, `revert` for the app that only sends. `ignore` works in
every case.
