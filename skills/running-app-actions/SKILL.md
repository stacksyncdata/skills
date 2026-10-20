---
name: running-app-actions
description: Runs one read, search or change in a connected app through the Stacksync MCP, without building a workflow, by choosing the app's action, filling its form and running it once. Use when someone asks to look up, find, create, update or delete a record in an app such as a CRM, an ERP or a database right now, wants a one-off answer from an app, or wants to try an action before putting it in a workflow.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "connectors"
  tools: "connectors_list connectors_get connections_create connectors_module_form connectors_run_action"
---

## When to use

Use this guide for one action, now: "find the HubSpot contact with this email", "create a
NetSuite customer", "list today's Shopify orders". Each action is the same one a workflow step
runs, run once on its own.

Use `building-workflows` when the action should repeat, run on a trigger, or chain with other
steps. Use a sync (`designing-two-way-syncs`) when records should stay equal between two apps.

## Steps

1. **Find the app.** Call `connectors_list` with a `search` such as the app name or the job, for
   example `contacts`. Take the `app_type` from the answer.
2. **Choose the action and connection.** Call `connectors_get` with the `app_type`. The answer
   lists the actions (`module_id`, `module_version`, `name`, `is_read_action`) and the person's
   connections for that app.
   - When several actions fit, ask the person which one.
   - When several connections fit, ask which account to use.
   - With no connection, call `connections_create` and give the person the sign in link it
     returns. Continue once they say they signed in.
3. **Fill the form.** Call `connectors_module_form` with the `module_id`, `module_version` and
   `connection_id`. The answer holds the `input_schema` and which fields are dropdowns.
   - Pass the `dropdown_ids` to load their options from the app, for example the list of objects
     or tables.
   - Call again after each choice with the `values` chosen so far: later fields often depend on
     earlier ones.
   - Ask the person for any required value you do not know. Never guess one.
4. **Show the person what will run** when the action changes data: the app, the account, the
   action and the values.
5. **Run it.** Call `connectors_run_action` with the same `module_id`, `module_version`,
   `connection_id` and `values`.
   - A read action runs at once and returns the data.
   - An action that changes data may return a preview first. Show it to the person and, after
     they accept, call again with the same arguments and the `confirmation_token`.
6. **Report the result** in the app's own terms: the records found, or the record created or
   changed with its ID.

## Rules

| Rule | Why |
| --- | --- |
| Take every value from `connectors_module_form` or from the person; never guess a required value | The action runs against the live app with exactly these values |
| Show the app, account, action and values before an action that changes data | The person owns changes to their live apps |
| Use one confirmation per change; never reuse a `confirmation_token` for other values | The token is valid only for the exact call it was issued for |
| Never ask for a password or key; use the link from `connections_create` | A secret typed into a chat stays in the chat history |
| Writes run directly unless the workspace turned on "Ask before every change"; then the person sees one preview card and selects Accept | A declined card means nothing changed |
| For more than one record per request, or repeated runs, build a workflow | One action runs once; a workflow keeps the run history and can replay failed runs |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| `connectors_get` lists no connection | The person has not connected this app | `connections_create`, give the sign in link, then `connectors_get` again |
| The run is refused for a missing or invalid value | A required field is empty or a value is not one the app accepts | `connectors_module_form` with the current `values`, load the dropdown, ask the person |
| The status is `failed` with the app's reason | The app rejected the action, for example a validation rule or missing permission | Stop and show the reason; do not retry with changed values unless the person asks |
| The status is `outcome_unknown` | The app did not confirm whether the change happened | Check the record in the app (a read action) before running the change again, so it is not made twice |
| The dropdown options are empty | The connected account cannot see those objects in the app | Check the account's permissions in the app, or use another connection |
| The person wants the same action every day | One action runs once | Build a workflow with a schedule trigger (`building-workflows`) |
