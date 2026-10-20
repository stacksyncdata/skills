# Product rules the error text does not show

- **A Genie that seems stuck is often paused on an approval.** A message in `genies_activity`
  with an `approval` whose `status` is `awaiting_approval` waits for `genies_approve`.
- **Schedules run in UTC.** A task at the wrong hour was saved in local time.
- **An Inactive Genie** handles no new messages, and each scheduled run is refused while it stays
  inactive (the task is not paused). Check the status with `genies_get`, and `is_paused` with
  `genies_tasks_list`.
- **A decided approval cannot be decided again**; `genies_activity` shows its status.
- **`genies_ask` waits about 40 seconds.** A `processing` status means the Genie is still working,
  not that it failed; read the conversation later with `genies_activity`.
