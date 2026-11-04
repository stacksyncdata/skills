# Triggers

A trigger starts a workflow. A trigger is a step, saved with `workflows_steps_save` like any
other, with an edge into the Input step. Find trigger modules with `connectors_get`, which lists
an app's triggers next to its actions, and fill them with `connectors_module_form`.

| Trigger, as the web app names it | Starts the workflow when | Through the MCP |
| --- | --- | --- |
| Receive Webhook/HTTP events (`system-webhook_trigger-1`) | An HTTP request with the trigger's method (POST by default) reaches the trigger URL | Yes. The URL is shown only on the trigger step in the web app |
| Automated schedule | A cron schedule fires, in UTC | Yes |
| Receive emails (`system-email_trigger-1`) | An email reaches the step's Stacksync address on `@stacksync.email` | Yes |
| Gmail trigger (`gmail-gmail_trigger-1`) | A new email arrives in the connected Gmail mailbox | Yes, with a Gmail connection from `connections_list` |
| Queue trigger | A queue flushes a batch of records | Yes (see `queues`) |
| Sync trigger of an app, such as `salesforce-workflow_sync_trigger-1` | A record is created, updated or deleted in a table of a connected app | Yes, the step and then its app trigger with `app_triggers_save` (see "Sync trigger") |

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
`salesforce-workflow_sync_trigger-1`. Its settings live in an **app trigger**, which sets up a
sync of its own behind the step:

1. Save the step with `workflows_steps_save` and its edge into Input, and keep its `step_id`.
2. Call `app_triggers_save` with `target` `{"type": "workflow", "id": "<workflow_id>",
   "step_id": "<step_id>"}`, the `connection_id`, the workflow's `region` and `tables`. One call
   sets it up, links it to the step and switches it on; it starts runs once the version is
   deployed.
3. Each entry of `tables` has `table_name` (from `connections_tables`), `operations` (any of
   `created`, `updated`, `deleted`) and `filters`, so only the changes that matter start a run.

`filters` is a group (`and` or `or`) of conditions on the table's column names, nested as needed;
an empty `and` group matches every change. It has the shape of a sync event trigger's filters
(see `syncs`), with the operators `eq`, `neq`, `lt` (larger than), `leq`, `st` (smaller than),
`seq`, `in`, `nin`, `nu`, `nnu`, `cont`, `ncont`, `mreg` (matches a regular expression), `nmreg`
(does not match it) and `has_ch` (the field changed).

```json
{
  "table_name": "Opportunity",
  "operations": ["created", "updated"],
  "filters": {
    "type": "group",
    "operator": "and",
    "conditions": [{ "type": "condition", "column": "StageName", "operator": "eq", "value": "Closed Won" }]
  }
}
```

- `app_triggers_get` with the step's `base_id` (from `workflows_get`) shows the tables, filters
  and status. `app_triggers_save` with `app_trigger_id` and `region` replaces `tables` or sets
  `status` `paused` or `on`. The step and the connection stay: to change the connection, delete
  the app trigger and create another.
- `app_triggers_delete` removes the app trigger and the sync trigger step with its edges.
- The app trigger never loads the app's existing records. **Historic backfill**, which runs every
  existing record through the workflow once, is switched on in the web app's trigger step only,
  after the person confirms: on objects with many records it creates many runs.

The workflow receives `record`, the full record, and `changes`, the changed fields on an update.
