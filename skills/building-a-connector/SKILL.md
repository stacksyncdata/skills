---
name: building-a-connector
description: Connects Stacksync to an app that has no Stacksync connector, first with an HTTP request step or a code step in a workflow, then by building a workflow connector with the Stacksync CLI, testing it locally and deploying it on request. Use when an app is missing from the Stacksync connector list, someone asks to build a custom connector or a new workflow module, or a workflow needs an API Stacksync does not cover.
license: Apache-2.0
metadata:
  type: runbook
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "connectors workflows"
  tools: "connectors_list connectors_get connectors_module_form connectors_run_action connections_list connections_create workflows_list workflows_get workflows_save workflows_run workflows_runs variables_list"
---

## Use it when

The person needs an app that Stacksync does not connect to yet, or an action the app's connector
lacks. For an app that needs its own hosting, database or storage, use `internal-apps`.

## Before you start

Ask the person:

1. Which app, and what must Stacksync do with it: read records, create or update records, or
   react to its events?
2. Is it needed in one or two workflows, or in many workflows by many people?
3. Where is the app's API documentation?
4. How does the app's API sign in: an API key, OAuth or something else?

For the CLI path: Python 3.10 or later, on macOS, Linux or Windows.

Who runs CLI commands: a coding agent that can run commands on the person's computer runs them
itself, signing in with an API key the person put in the `STACKSYNC_API_KEY` environment variable.
A chat app without a terminal explains each command and waits for the person to run it and paste
back the output.

## Steps

1. **Check the catalog.** Follow `connectors` "List apps": `connectors_list` with one short word
   for the app and one for the capability, such as `enrich` or `search`. The app, a close match,
   or a built-in Stacksync module may already do the job; `connectors_get` shows its actions.
   Check: the app and capability are missing, or you handed over to `connectors`.
2. **Pick the path.**

   | Need | Path | Why |
   | --- | --- | --- |
   | A few API calls in one or two workflows | HTTP request step (step 3) | No code to build or deploy |
   | Data reshaping, logic, or a call that needs code | Code step (step 3) | Runs inside the workflow, nothing to deploy |
   | Reusable actions with forms and dropdowns, across many workflows | Workflow connector built with the CLI (steps 4 to 9) | Each action becomes a module anyone in the workspace can add |
   | The app must take part in a sync | Connector for syncs, started from **Developer Mode** | See "When the MCP cannot do it" |

   Check: the person agreed the path.
3. **No build: an HTTP request step or a code step.** Follow `workflows` "Save the whole document":
   `workflows_list` and `workflows_get` find the workflow; `connectors_module_form` fills the HTTP
   request step with the method, URL, headers and body from the app's API documentation, or the
   code step's script; `workflows_save` saves it. Keep the app's API key out of the chat and the
   step text: the person stores it as a workspace secret (`variables`) or in a connection whose
   sign in link `connections_create` returns. Run it once with `workflows_run` on a test record
   and read the result with `workflows_runs`. Stop here when this covers the need.
   Check: the test run succeeded and its output holds the app's response.
4. **Install the CLI** (macOS and Linux; Windows steps are in the quickstart):

   ```sh
   curl -fsSL https://cli.stacksync.com/install.sh | sh
   stacksync --version
   ```

   Check: `stacksync --version` prints a version.
5. **Sign in.** `stacksync login` offers a web login, which opens the browser and asks for the
   workspace, or an API key. An agent or script without a browser signs in with an API key the
   person generated in Workspace Settings and put in an environment variable, never in the chat:

   ```sh
   stacksync login
   stacksync login --api-key "$STACKSYNC_API_KEY" --workspace WORKSPACE_ID
   stacksync login --check
   ```

   Check: `stacksync login --check` exits with 0.
6. **Create the connector** and open its folder. Read the project's `guide/` folder before
   changing any file: it explains the structure, inputs, dynamic dropdown options, credentials,
   outputs and errors.

   ```sh
   stacksync workflow-connector create "My App"
   cd workflows-app-my-app
   ```

   Check: the folder exists and holds `guide/`.
7. **Add modules**, one per action, and remove the sample module when it is no longer needed:

   ```sh
   stacksync workflow-module create "Create Contact"
   stacksync workflow-module delete "create_records"
   ```

   Check: each action has its own module folder.
8. **Test locally.** While this runs, workflows in the workspace call the code on the person's
   computer, and saved changes apply at once. In the web app, open a workflow, add an **Action**
   step, pick the connector and module, fill the inputs and run the step. Replay a call against
   the local code to debug it. Stop the local run with Ctrl+C.

   ```sh
   stacksync workflow-connector run
   stacksync workflow-connector replay last
   ```

   Check: every module ran once on a test record. Stop here unless the person asks to deploy.
9. **Deploy** when the person asks. Each deploy is submitted for review: a Stacksync reviewer
   approves it before it is built, which can take hours. `deploy` prints the deployment id
   that `deploy-status` takes.

   ```sh
   stacksync workflow-connector deploy
   stacksync workflow-connector deploy-status DEPLOYMENT_ID
   ```

   Check: `deploy-status` shows the deployment live.
10. **Confirm in the catalog.** Follow `connectors` "Run one app action": `connectors_list` and
    `connectors_get` show the new connector; `connectors_run_action` tries one module on a test
    record.
    Check: the module returned the expected output on the test record.

## Rules

| Rule | Why |
| --- | --- |
| Check `connectors_list` before building anything | A connector that already exists needs no build |
| Prefer the no-build path when it covers the need | Nothing to deploy or keep up to date |
| Never put an API key in the chat, in step text or in connector source code | Secrets in a chat or in code leave the person's control |
| Do not deploy until the person asks | Local runs touch only the person's test workflows; a deploy adds a version to the workspace |
| Test every module on a test record before using it in a live workflow | A module writes to the live app |

## When the MCP cannot do it

- The CLI runs on the person's computer, not through the MCP. Problems and fixes:
  [CLI problems](references/cli-problems.md).
- A connector that takes part in a sync starts from **Developer Mode**, switched on in the
  person's Stacksync profile; see
  [Get started with the Connector Development Kit](https://docs.stacksync.com/two-way-sync/developers/get-started-with-the-connector-development-kit).
- Docs: [Developer platform](https://docs.stacksync.com/developers),
  [Quickstart](https://docs.stacksync.com/developers/getting-started-with-stacksync-cli/quickstart),
  [Build your first workflow connector](https://docs.stacksync.com/developers/getting-started-with-stacksync-cli/build-your-first-workflow-connector),
  [CLI command reference](https://docs.stacksync.com/developers/getting-started-with-stacksync-cli/cli-command-reference),
  and [Python](https://docs.stacksync.com/agentic-workflows/features/code-execution/python-code-execution)
  and [JavaScript](https://docs.stacksync.com/agentic-workflows/features/code-execution/javascript-code-execution)
  code steps.
