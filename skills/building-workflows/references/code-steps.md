# Python and JavaScript code steps

Use a code step for data reshaping, calculations or logic no module covers. Find the **Python
Code** and **JavaScript Code** modules with `connectors_list` and fill their forms with
`connectors_module_form`.

## Passing data in

Add entries under **Context**, each with a name and a value. A value is usually a reference such
as `{{ input.body.amount }}` or `{{ WORKSPACE_VARIABLES.cursor }}`. Each entry becomes a key of
`WORKFLOW_CONTEXT`.

## The script

The script defines `main`, which receives `WORKFLOW_CONTEXT`. What `main` returns is the step's
output.

```python
def main(WORKFLOW_CONTEXT):
    amount = WORKFLOW_CONTEXT["amount"]
    return {"amount": amount}
```

```javascript
function main(WORKFLOW_CONTEXT) {
    const amount = WORKFLOW_CONTEXT.amount;
    return { amount: amount };
}
```

Later steps read the output as `{{ step_id.amount }}`. `print()` in Python and `console.log()` in
JavaScript appear under `metadata.stdout` in the run's logs; they do not pass data on.

## Limits

| | Python | JavaScript |
| --- | --- | --- |
| Timeout | 300 seconds | 6 seconds |
| Memory | 700 MB | 8 GB |
| File system | Read only | Read only |
| Packages | `pandas`, `numpy`, `phonenumbers`, `json`, `os` and the Python 3.10 standard library | `dayjs`, `moment`, `live-plugin-manager` and the Node.js 23 standard library |

No other packages can be installed. Use Python for HTTP calls, loops over many records and large
data; process large tables in chunks to stay under 700 MB.

## Paging through an API

One run cannot loop through every page of a large API within 300 seconds. Do one page per run:
keep the cursor in a workspace variable, update it with the **Workspace Variable - Update** step,
and have the workflow call its own trigger URL with an HTTP Request step while more pages remain.
Use the workspace variable step, not the workflow variable step: they write to different places,
and the wrong one leaves the cursor where it was, so the workflow reads the same page forever.
