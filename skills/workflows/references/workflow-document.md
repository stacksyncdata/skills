# The workflow document

`workflows_schema` returns the authoritative JSON schema, rules and example. Read it once before
writing a document; this page summarises its rules.

## Top level

| Key | What it holds |
| --- | --- |
| `modules` | The steps |
| `edges` | The links between steps |
| `return_workflow_module_instance_ids` | The steps whose output the workflow returns |
| `workflow_execution_timeout` | Seconds a run may take, for example `300` |

`workflows_get` returns the document of a version as JSON or YAML (`document_format`). One step
of `modules`, with its edges, is what `workflows_steps_save` takes; the whole document, sent back
with your change, is what `workflows_save` takes.

## Steps

Each step in `modules` has:

| Key | What it holds |
| --- | --- |
| `name` | The name the web app shows |
| `workflow_module_instance_id` | The step id: the name in lower case, spaces and dashes turned into `_`. Unique per step. A name starts with a letter and holds letters, digits, spaces, `_` and `-` |
| `module_id` | A module of the catalog, from `connectors_get`, for example `hubspot-create_records-1` |
| `properties` | The values of the module's form, from `connectors_module_form` |
| `connections` | The connection the step uses: `connection_resource_id`, `connection_app_type` and `connection_management_type` `managed`, from `connectors_get` or `connections_list` |

The Input step is always:

```json
{"name": "Input", "workflow_module_instance_id": "input", "module_id": "system-input-1", "properties": {}}
```

## Edges

```json
{
  "edge_id": "post_trigger-input",
  "source": {"workflow_module_instance_id": "post_trigger"},
  "target": {"workflow_module_instance_id": "input"}
}
```

- Every trigger step has an edge into `input`: the trigger is the source, `input` the target.
- Action steps are reached from `input` or from a previous step.
- `handle_id` on the source is empty for the normal output, `error` for the error branch (the
  step sets `module_options.enable_error_handling` to `true`), and `else` or a condition id for an
  if/else step.
- `edge_id` is unique.

## Loops and try/catch

`for_loop`, `while_loop` and `try_catch` steps hold their inner steps. The group has two children,
`<id>_start` and `<id>_end`, and every inner step sets
`module_options.layout.group_module_instance_id` to the group's step id.

## Saving and deploying

- Only a draft can be saved. When the latest version is deployed, call `workflows_create_draft`
  first.
- Saving sets up the triggers of each new or changed step (schedules, queue consumers, email and
  Gmail triggers), as the builder does. Deploying makes the version live and sets the triggers up for
  it.
- A workflow is built one step at a time: `workflows_save` creates it with the Input step,
  `workflows_steps_save` adds or changes one step with its edges, and `workflows_steps_delete`
  removes one. `workflows_save` with the whole document is for importing one.
- A sync trigger step, which starts a workflow when a record changes in an app, is saved like any
  step; its tables and filters are set with `app_triggers_save` (see
  [triggers.md](triggers.md)).

## Minimal example

```json
{
  "modules": [
    {"name": "Input", "workflow_module_instance_id": "input", "module_id": "system-input-1", "properties": {}},
    {"name": "POST Trigger", "workflow_module_instance_id": "post_trigger", "module_id": "system-webhook_trigger-1", "properties": {}}
  ],
  "edges": [
    {"edge_id": "post_trigger-input", "source": {"workflow_module_instance_id": "post_trigger"}, "target": {"workflow_module_instance_id": "input"}}
  ],
  "return_workflow_module_instance_ids": [],
  "workflow_execution_timeout": 300
}
```
