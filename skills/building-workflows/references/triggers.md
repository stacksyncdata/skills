# Triggers

A trigger starts a workflow. Each trigger step has an edge into the Input step. Find trigger
modules with `connectors_get`, which lists an app's triggers next to its actions, and fill them
with `connectors_module_form`.

| Trigger | Starts the workflow when | Good for |
| --- | --- | --- |
| Receive Webhooks/HTTP Events | An HTTP POST reaches the trigger URL | Webhooks, manual runs, calls from other systems |
| Automated Schedule | A cron schedule fires, in UTC | Recurring reports, polling |
| Receive Email | An email reaches the trigger's address | Inbound orders, invoices, notifications |
| App Trigger | A record is created, updated or deleted in a connected app | Acting on app changes |
| Queue trigger | A queue flushes a batch of records | Many changes processed at a steady pace (see `managing-queues`) |

## Receive Webhooks/HTTP Events

- Every new workflow starts with this trigger (POST Trigger).
- Saving the workflow creates its trigger URL, shown in the trigger step in the web app.
- The workflow receives `method`, `body`, `headers` and the query parameters. Read them through
  Input, for example `{{ input.body.order_id }}`.
- Expected body fields can be declared in the trigger's form under **Body**.

## Automated Schedule

- Fields: a cron expression (frequency by minute, hour, day, week, month or year, in UTC) and a
  start time in UTC.
- Error handling can be switched on in the trigger's form.
- Saving the workflow sets the schedule up; it then runs at every interval from the start time.

## Receive Email

- Each Receive Email step gets its own address on `@stacksync.email`. A workflow can hold several,
  each with a distinct address.
- The step needs an edge into Input. Removing the edge pauses intake; deleting the step stops it.
- An optional alias such as `order-intake@stacksync.email`: more than 3 characters, lowercase
  letters, numbers, `.`, `-` and `_`. Check an alias is free with `workflows_get`, passing the
  email trigger's `step_id` and the `alias`. Changing the alias switches the old one off at once;
  the generated address keeps working.
- `workflows_get` with the email trigger's `step_id` returns the address to give to senders.
- The workflow receives `from`, `to`, `subject`, `text`, `html`, `headers` and `attachments`. Each
  attachment has `filename`, `content_type` and a `file_id` that later steps use.

## App Trigger

- Pick the connection, the tables, the columns to track, and the events: Created, Updated,
  Deleted, in any combination.
- Add filter conditions (AND and OR, nested as needed) so only the changes that matter start a
  run.
- The workflow receives `record`, the full record, and `changes`, the changed fields on an update.
- By default only changes after the trigger is on start runs. **Historic backfill** runs the
  existing records through the trigger once. On objects with many records this creates many runs:
  apply filters first and confirm with the person before switching it on.

## Sync trigger

A workflow started by a sync's record changes cannot be set up through the MCP. Do this in the web
app, in the workflow builder.
