---
name: building-connectors
description: Connects Stacksync to an app that has no Stacksync connector, first with an HTTP request step or a code step in a workflow, then by building a workflow connector with the Stacksync CLI and testing it locally before deploying it. Use when an app is missing from the Stacksync connector list, someone asks to build a custom connector or a new workflow module, or a workflow needs to call an API Stacksync does not cover.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "connectors workflows"
  tools: "connectors_list connectors_get connectors_run_action connections_list connections_create workflows_list workflows_get workflows_save workflows_run workflows_runs variables_list"
---

## When to use

Use this guide when the person needs an app that Stacksync does not connect to yet. Always check
`connectors_list` first: the app, or a close match, may already be there.

For an app that needs its own hosting, database or storage, read `building-internal-apps`.

## Before you build

Ask the person:

1. Which app, and what must Stacksync do with it: read records, create or update records, or
   react to its events?
2. Is it needed once or twice in one workflow, or in many workflows by many people?
3. Where is the app's API documentation?
4. How does the app's API sign in: an API key, OAuth or something else?

Then pick the path:

| Need | Path | Why |
| --- | --- | --- |
| A few API calls in one or two workflows | HTTP request step | No code to build or deploy |
| Data reshaping, logic or an API call that needs code | Code step (Python or JavaScript) | Runs inside the workflow, nothing to deploy |
| Reusable actions with forms and dropdowns, used across many workflows | Workflow connector built with the Stacksync CLI | Each action becomes a module anyone in the workspace can add to a workflow |
| The app must take part in a sync | Connector for syncs, started from Developer Mode | See "Connectors for syncs" |

## Path 1: no build

### HTTP request step

A workflow step that sends an HTTP request to any URL and passes the response to the next steps.

1. `workflows_list` and `workflows_get`: find the workflow the step belongs in, or plan a new one.
2. Add an HTTP request step with the method, URL, headers and body from the app's API
   documentation, and save with `workflows_save`.
3. Keep the app's API key out of the chat and out of the step text. The person stores it as a
   workspace secret or in a connection they create in the web app; `connections_create` returns a
   secure sign in link.
4. Run it once with `workflows_run` on a test record and read the result with `workflows_runs`.

### Code step

A Python or JavaScript step for logic a standard step cannot express. In Python the script defines
`main(WORKFLOW_CONTEXT)`; the values listed in the step's **Context** section arrive as keys of
`WORKFLOW_CONTEXT`, and whatever `main` returns becomes the step's output for the next steps.
`print()` output appears in the run logs under `metadata.stdout`, for debugging only.

```python
def main(WORKFLOW_CONTEXT):
    amount = WORKFLOW_CONTEXT["amount"]
    return {"amount_with_tax": round(amount * 1.2, 2)}
```

Docs: [Python](https://docs.stacksync.com/agentic-workflows/features/code-execution/python-code-execution)
and [JavaScript](https://docs.stacksync.com/agentic-workflows/features/code-execution/javascript-code-execution)
code execution.

## Path 2: a workflow connector with the Stacksync CLI

A workflow connector adds actions for one app to the workflow builder. Each action is a
**module** with its own inputs and outputs.

Who runs the commands:

- **A coding agent** (one that can run commands on the person's computer) runs them itself, and
  asks the person to approve the browser sign in.
- **A chat app** without a terminal explains each command and waits for the person to run it and
  paste back the output.

Requirements: Python 3.10 or later, on macOS, Linux or Windows.

1. **Install the CLI** (macOS and Linux; Windows steps are in the quickstart):

   ```sh
   curl -fsSL https://cli.stacksync.com/install.sh | sh
   stacksync --version
   ```

2. **Sign in.** `stacksync login` opens the browser and asks which workspace to use. An agent or
   a script without a browser signs in with an API key the person generated in Workspace
   Settings and put in an environment variable on their own machine, never in the chat:

   ```sh
   stacksync login
   stacksync login --api-key "$STACKSYNC_API_KEY" --workspace WORKSPACE_ID
   stacksync login --check
   ```

3. **Create the connector** and open its folder:

   ```sh
   stacksync workflow-connector create "My App"
   cd workflows-app-my-app
   ```

   Read the project's `guide/` folder before changing any file. It explains the project
   structure, inputs, dynamic dropdown options, credentials, outputs and errors.

4. **Add modules**, one per action, and remove the sample module when it is no longer needed:

   ```sh
   stacksync workflow-module create "Create Contact"
   stacksync workflow-module delete "create_records"
   ```

5. **Test locally.** While this runs, workflows in the workspace call the code on the person's
   computer, and saved changes apply at once:

   ```sh
   stacksync workflow-connector run
   ```

   In the web app, open a workflow, add an **Action** step, pick the connector and module, fill
   the inputs and run the step. To debug a call, replay it against the local code:

   ```sh
   stacksync workflow-connector replay last
   ```

   Stop the local run with Ctrl+C. Stop here unless the person asks to deploy.

6. **Deploy** when the person asks:

   ```sh
   stacksync workflow-connector deploy
   ```

   Each deploy creates a new version in the workspace. The connector then appears in the
   workflow builder; check it with `connectors_list` and `connectors_get`, and try one module with
   `connectors_run_action` on a test record.

Docs: [Developer platform](https://docs.stacksync.com/developers),
[Quickstart](https://docs.stacksync.com/developers/getting-started-with-stacksync-cli/quickstart),
[Build your first workflow connector](https://docs.stacksync.com/developers/getting-started-with-stacksync-cli/build-your-first-workflow-connector)
and [CLI command reference](https://docs.stacksync.com/developers/getting-started-with-stacksync-cli/cli-command-reference).

## Connectors for syncs

A connector that takes part in a two-way sync starts from **Developer Mode**, switched on in the
person's Stacksync profile. See
[Get started with the Connector Development Kit](https://docs.stacksync.com/two-way-sync/developers/get-started-with-the-connector-development-kit).

## Rules

| Rule | Why |
| --- | --- |
| Check `connectors_list` before building anything | A connector that already exists needs no build |
| Prefer the no-build path when it covers the need | Nothing to deploy or keep up to date |
| Never put an API key in the chat, in step text or in connector source code | Secrets in a chat or in code leave the person's control |
| Do not deploy until the person asks | Local runs touch only the person's test workflows; a deploy adds a version to the workspace |
| Test every module on a test record before using it in a live workflow | A module writes to the live app |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| `stacksync: command not found` | The install did not finish, or the terminal has the old path | Open a new terminal and run `stacksync --version`; install again if needed |
| `stacksync login --check` exits with 1 | The CLI is not signed in | Run `stacksync login` |
| The new module is missing in the workflow builder | The local run stopped, or the builder was not refreshed | Start `stacksync workflow-connector run` again and refresh the workflow builder |
| The local run picked another port | Port 2323 was in use | Expected; the CLI picks the next free port. Pass the same `--port` to `replay` |
| A module call fails | The request or the credentials are wrong | `stacksync workflow-connector replay last` against the local code, fix, save, try again |
