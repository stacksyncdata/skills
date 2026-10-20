# Triggers

A trigger starts a workflow. Each trigger step has an edge into the Input step. Find trigger
modules with `connectors_get`, which lists an app's triggers next to its actions, and fill them
with `connectors_module_form`.

| Trigger, as the web app names it | Starts the workflow when | Through the MCP |
| --- | --- | --- |
| Receive Webhook/HTTP events (`system-webhook_trigger-1`) | An HTTP request with the trigger's method (POST by default) reaches the trigger URL | Yes. The URL is shown only on the trigger step in the web app |
| Automated schedule | A cron schedule fires, in UTC | Yes |
| Receive emails (`system-email_trigger-1`) | An email reaches the step's Stacksync address on `@stacksync.email` | Yes |
| Gmail trigger (`gmail-gmail_trigger-1`) | A new email arrives in the connected Gmail mailbox | Yes, with a Gmail connection from `connections_list` |
| Queue trigger | A queue flushes a batch of records | Yes (see `queues`) |
| Sync trigger of an app, such as `salesforce-workflow_sync_trigger-1` | A record is created, updated or deleted in a table of a connected app | No. The person builds it in the web app (see "Sync trigger") |

For an email start, ask the person whether the emails arrive in their own mailbox (Gmail trigger,
on their Gmail connection) or can be forwarded to a Stacksync address (Receive emails). The
catalog has no trigger for other mailboxes, so those emails are forwarded to a Stacksync address.

## Receive Webhook/HTTP events

- A workflow created in the web app starts with this trigger (POST Trigger). A workflow created
  with `workflows_save` holds only the steps its document holds.
- Saving the workflow creates its trigger URL. No MCP tool returns it: the person copies it from
  the trigger step in the web app. It starts runs once the version is deployed.
- The workflow receives `body`, `headers` and `query_parameters`. Read them through
  Input, for example `{{ input.body.order_id }}`.
- Expected body fields can be declared in the trigger's form under **Body**.

## Automated schedule

- Fields: a cron expression (frequency by minute, hour, day, week, month or year, in UTC) and a
  start time in UTC.
- Error handling can be switched on in the trigger's form.
- Saving the workflow sets the schedule up; it then runs at every interval from the start time.

## Receive emails

- Each Receive emails step gets its own address on `@stacksync.email`. A workflow can hold several,
  each with a distinct address.
- The step needs an edge into Input. Removing the edge pauses intake; deleting the step stops it.
- An optional alias such as `order-intake@stacksync.email`: at least 3 characters, starting
  with a lowercase letter or a number, then lowercase letters, numbers, `.`, `-` and `_`. Common
  names such as admin, support and info are reserved. Check an alias is free with `workflows_get`, passing the
  email trigger's `step_id` and the `alias`. Changing the alias switches the old one off at once;
  the generated address keeps working.
- `workflows_get` with the email trigger's `step_id` returns the address of a step that has an
  alias. Set an alias to give senders an address from here.
- The workflow receives `from`, `to`, `subject`, `text`, `html`, `headers` and `attachments`. Each
  attachment has `filename`, `content_type` and a `file_id` that later steps use.

## Gmail trigger

- Starts the workflow when a new email arrives in the mailbox of a Gmail connection. Find the
  connection with `connections_list`; with none, call `connections_create` and give the person
  the link.
- Find the module with `connectors_list` and the `search` `gmail`, and fill its form with
  `connectors_module_form`. Saving the workflow sets the trigger up, and `workflows_deploy` sets it up
  for the deployed version.

## Sync trigger

A sync trigger starts the workflow when a record is created, updated or deleted in a table of a
connected app. Each app that offers it has its own module, such as
`salesforce-workflow_sync_trigger-1`. The web app builds a sync behind it, so it cannot be set up
through the MCP: the person builds it in the workflow builder. Tell them what to choose there:

- The connection, the tables, the columns to track, and the events: Created, Updated, Deleted,
  in any combination.
- Filter conditions (AND and OR, nested as needed), so only the changes that matter start a run.
- **Historic backfill** runs the existing records through the trigger once. On objects with many
  records this creates many runs: apply filters first, and switch it on only after the person
  confirms.

The workflow receives `record`, the full record, and `changes`, the changed fields on an update.
