# Product rules the error text does not show

- **No runs at all means no error to read.** The trigger never fired: the version is not deployed,
  the trigger has no edge into the Input step, or the workflow is paused. Check with
  `workflows_get`.
- **Code steps have time limits**: JavaScript steps stop after 6 seconds, Python steps after
  300 seconds.
- **Runs older than the plan's log retention are gone**: 1 day on Starter, 7 days on Pro and
  30 days on Enterprise. Look at failures soon after they happen.
- **No automatic retry.** A failed run stays failed until it is replayed.
