---
name: managing-variables-and-secrets
description: Creates, reads, changes and deletes Stacksync workspace variables and secrets through the Stacksync MCP, and shows how workflow steps read them by reference. Use when someone wants to store a value that workflows share, such as an account ID, a threshold, a cursor or an API token, asks how a step reads a variable or secret, wants to change a value every workflow uses, or a workflow reads the wrong or an empty value.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "variables"
  tools: "variables_list variables_get variables_save variables_delete workflows_list workflows_get"
---

## When to use

Use this guide for named values that workflow steps read at run time. A **variable** holds a
value people may see, such as an account ID or a page size. A **secret** holds a sensitive value,
such as an API token: it is stored encrypted and never shown again.

Sign in to an app with a connection (`connections_create`), not a secret, whenever the app has a
Stacksync connector. Use `building-workflows` to put a reference into a step.

## How workflows read them

A step field reads a variable or secret by its reference:

```
{{ WORKSPACE_VARIABLES.api_token }}
```

`variables_list` and `variables_get` return each variable's exact reference. In the web app, the
variable picker of any step field lists them under Workspace Variables. Replacement follows Jinja
templating rules: a `json` value can be read field by field, as `{{ WORKSPACE_VARIABLES.settings.region }}`.

A workflow can also change a workspace variable while it runs, with the **Workspace Variable -
Update** step, for example to keep a cursor between runs.

## Tools in order

1. `variables_list` with a `search_query`: the `variable_id`, name, whether it is secret, its
   value (never a secret's), type, reference and region. Reuse a variable that already exists.
2. `variables_get` with the `variable_id` and `region`: one variable, as a document
   `variables_save` accepts.
3. `variables_save`:
   - To create: `variable_name`, the `region`, and a `document` with `value`, `value_type` and
     `description`, and `is_secret` for a secret.
   - To change: the `variable_id`, the `region`, and only the fields to change in the `document`.
4. `variables_delete` with the `variable_id` and `region`, after the person confirms.

## Values and types

| `value_type` | Example `value` (always sent as text) |
| --- | --- |
| `string` | `ACME-EU` |
| `number` | `0` |
| `boolean` | `true` |
| `object` | `{"region": "eu", "limit": 100}` |
| `array` | `["sales", "support"]` |
| `json` | `{"y": "world"}` |

`object`, `array` and `json` values are JSON text. Each variable belongs to a region,
`besg` (Europe) or `usnv` (United States), and its name is unique in that region. Ask the person
which region, and use the region of the workflows that will read it.

## Secrets

- Ask whether a new value is secret before saving it.
- Never ask the person to type a secret into the chat. Ask them to create it in the web app
  instead: **Create Resource** > **Variable** opens the "Create a new Variable" dialog (name,
  region, value type). Then find it with `variables_list`.
- If the person pastes a secret anyway, save it with `is_secret` `true` and tell them it also sits
  in the chat history.
- Making a variable secret cannot be undone, and its value is never returned again. Changing a
  secret needs the full new value, so ask the person to enter it in the web app as well.

## Rules

| Rule | Why |
| --- | --- |
| Check `variables_list` before creating | Two variables for one value drift apart |
| Before changing or deleting, find the workflows that read it: `workflows_list`, then `workflows_get` and search each document for the reference | Every step with the reference reads the new value on its next run, or loses it on delete |
| State the old and new value before a change and wait for a yes | A shared value changes many workflows at once |
| Never ask for a secret in the chat | A secret typed into a chat stays in the chat history |
| Writes run directly unless the workspace turned on "Ask before every change"; then the person sees a preview card and selects Accept | A declined card means nothing changed |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| A step reads an empty value | The name in the reference differs from the variable's name | Copy the exact reference from `variables_list` into the step |
| A cursor never moves and the workflow reads the same page forever | The workflow updates a workflow variable, not the workspace variable | Use the **Workspace Variable - Update** step |
| A field reads `null` from `.field` | The value is a plain string, not JSON | Set `value_type` to `json` or `object` with JSON text |
| `variables_get` shows no value | The variable is a secret | Expected; secrets are never shown again |
| Steps fail right after a delete | They still hold the deleted reference | Create the variable again with the same name, or change the steps |
| The person needs text with double curly brackets kept as is | The template engine fills it in | Wrap it once more: `{{ {{ text to keep }} }}` |
