---
name: variables
description: Lists, reads, creates, changes and deletes Stacksync workspace variables and secrets, and shows how workflow steps read them by reference. Use when someone wants to store a value that workflows share, such as an account ID, a threshold, a cursor or an API token, asks how a step reads a variable or secret, wants to change a value every workflow uses, or a workflow reads the wrong or an empty value.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "variables"
  tools: "variables_list variables_get variables_save variables_delete workflows_list workflows_get"
  resource: "variables"
---

## What it is

A workspace variable is a named value that workflow steps read at run time. A **variable** holds
a value people may see, such as an account ID or a page size. A **secret** holds a sensitive
value, such as an API token: it is stored encrypted and never shown again.

A step field reads it by its reference:

```
{{ WORKSPACE_VARIABLES.api_token }}
```

`variables_list` and `variables_get` return each variable's exact reference. Replacement follows
Jinja templating rules: a `json` value can be read field by field, as
`{{ WORKSPACE_VARIABLES.settings.region }}`.

Each variable belongs to one region, `besg` (Europe) or `usnv` (United States). Its name and its
reference are each unique in that region. The reference is made from the name at creation, and a
rename keeps it.

## When to use it

- Store a value several workflows share, so it changes in one place.
- Keep a cursor between runs.
- Store a token for an API that has no Stacksync connector. When the app has a connector, sign in
  with a connection instead (`connections`).

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `workflows` | A step reads the reference; the **Workspace Variable - Update** step changes the value during a run | `workflows_save` |
| `connections` | No native link: an app with a connector signs in through a connection, not a secret | `connections_create` |
| `folders` | A variable can sit in a folder | `folders_move` |

## Operations

### List variables

Use when looking for a variable or its reference, or before creating one.

Tools: `variables_list`

1. Call `variables_list` with a `search_query` and `region` `all`.
2. Each result gives `variable_id`, name, whether it is secret, its value (never a secret's),
   type, reference and region. Reuse a variable that already exists.

### Show a variable

Use when the person asks for one variable's value, or before a change.

Tools: `variables_get`

1. Call `variables_get` with the `variable_id` and `region`.
2. It returns the variable as a document `variables_save` accepts. A secret shows no value.

### Create a variable

Use when no variable holds the value yet.

Tools: `variables_list`, `variables_save`

1. Call `variables_list` first; reuse a match.
2. Ask whether the value is secret, and which region: the region of the workflows that will read
   it.
3. Call `variables_save` with `variable_name`, `region`, and a `document` with `value`,
   `value_type`, `description`, `is_secret` for a secret, and optionally `parent_folder_id`.

| `value_type` | Example `value` (always sent as text) |
| --- | --- |
| `string` | `ACME-EU` |
| `number` | `0` |
| `boolean` | `true` |
| `object` | `{"region": "eu", "limit": 100}` |
| `array` | `["sales", "support"]` |
| `json` | `{"y": "world"}` |

### Create a secret

Use when the value is sensitive.

Tools: `variables_list`

1. Never ask the person to type a secret into the chat. Ask them to create it in the web app:
   **Create Resource** > **Variable**, with name, region, value type, value and **Is Secret?**.
   The value then never passes through the chat.
2. Find it with `variables_list`.

If the person pastes a secret anyway, save it with `is_secret` `true` and tell them it also sits
in the chat history.

### Change a variable

Use when a shared value must change, or a variable becomes a secret.

Tools: `workflows_list`, `workflows_get`, `variables_get`, `variables_save`

1. Find the workflows that read it: `workflows_list`, then `workflows_get`, and search each
   document for the reference.
2. Call `variables_get`, state the old and the new value, and wait for a yes.
3. Call `variables_save` with `variable_id`, `region`, and a `document` with only the fields to
   change (`variable_name`, `value`, `value_type`, `description`, `is_secret`).

Every step with the reference reads the new value on its next run. Making a variable secret
cannot be undone. Changing a secret needs the full new value: ask the person to enter it in the
web app.

### Delete a variable

Use when no workflow needs the value any more.

Tools: `workflows_list`, `workflows_get`, `variables_delete`

1. Find the workflows that read it, as in "Change a variable", and show them.
2. After the person confirms, call `variables_delete` with `variable_id` and `region`.

## Defaults and limits

- `value_type` defaults to `string`; `is_secret` defaults to false.
- `object`, `array` and `json` values are JSON text.
- A secret's value is never returned by any tool.
- Writes run directly unless the workspace turned on "Ask before every change"; then the person
  accepts the change, and only then is it done.

## Rules

| Rule | Why |
| --- | --- |
| Check `variables_list` before creating | Two variables for one value drift apart |
| Find the workflows that read a variable before changing or deleting it | Every step with the reference reads the new value, or loses it on delete |
| State the old and new value before a change and wait for a yes | A shared value changes many workflows at once |
| Never ask for a secret in the chat | A secret typed into a chat stays in the chat history |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| A step reads an empty value | The reference differs from the variable's `reference`, which is kept after a rename | Copy the exact reference from `variables_list` into the step |
| A cursor never moves and the workflow reads the same page forever | The workflow updates a workflow variable, not the workspace variable | Use the **Workspace Variable - Update** step |
| A field reads `null` from `.field` | The value is a plain string, not JSON | Set `value_type` to `json` or `object` with JSON text |
| `variables_get` shows no value | The variable is a secret | Expected; secrets are never shown again |
| Steps fail right after a delete | They still hold the deleted reference | Create the variable again with the same reference (pass `variable_resource_id` in the document if it differed from the name), or change the steps |
| Text with double curly brackets must be kept as is | The template engine fills it in | Wrap it once more: `{{ {{ text to keep }} }}` |
