---
name: internal-apps
description: Deploys a hosted internal app, a managed PostgreSQL database, file storage or an internal API with Stacksync Enterprise OS through its CLI, and connects the app to Stacksync workflows. Use when someone wants to host a web app, portal, dashboard or API for their team, needs a managed database or file storage behind it, or asks for software that syncs and workflows do not provide on their own.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "enterprise-os"
  tools: "workflows_list workflows_get workflows_deploy"
  resource: "internal-apps"
---

## What it is

An internal app is software Stacksync Enterprise OS (EOS) builds, deploys and hosts: an internal
tool, a partner portal, an operations dashboard, an API, or the database and file storage behind
them. EOS is reached from **Enterprise OS** in the web app's sidebar and driven by the `eos` CLI.
The Stacksync MCP has no internal app tools: every operation below runs in the CLI.

| Building block | What the person gets |
| --- | --- |
| Applications | Web apps and APIs built and deployed from a folder, with a URL, deployment history, memory and scaling settings |
| Databases | Managed PostgreSQL with dedicated credentials for each app |
| Storage | Private file buckets with scoped API keys |
| AI inference | One API key for the available models, with a spending limit per key |
| Access | Sign in for app users managed by EOS; resources shared with people and groups |

EOS publishes its own agent skill, kept current with the CLI. Save it into the project with
`eos skill save` and follow it for every command beyond the operations below. It is also at
`https://enterprise-os.stacksync.ai/skill.md`; `eos --help` lists the installed commands.

Who runs the commands: a coding agent runs them on the person's computer and asks the person to
approve the browser sign in; a chat app without a terminal explains each command and waits for
the person to run it.

## When to use it

- The person needs a hosted app, portal, dashboard or API with a URL.
- The app needs a managed database, file storage or AI inference.
- For an app Stacksync should connect to as a connector, use `building-a-connector` instead.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `workflows` | The app sends an HTTP POST to the URL of a workflow's **Receive Webhooks / HTTP Events** trigger | `workflows_deploy` |
| `api-proxies` | The app calls an API proxy with the token kept in its deployment variables | |
| `connections` | A database of the app is connected to Stacksync like any other database | `connections_create` |

## Operations

### Install the CLI and sign in

Use when the computer has not run an EOS command yet.

Tools: none; done in the `eos` CLI.

1. Install (macOS, Linux, or Windows with WSL), then open a new terminal:

   ```sh
   curl -fsSL https://enterprise-os.stacksync.ai/downloads/install.sh | sh
   eos --version
   ```

2. Sign in and choose the workspace before creating anything:

   ```sh
   eos auth login
   eos workspace list
   eos workspace current
   ```

3. When there is more than 1 workspace, ask which one, and switch with
   `eos workspace switch WORKSPACE_ID`.

### Deploy an app

Use when the person has an app folder to host.

Tools: none; done in the `eos` CLI.

1. The app's web server must listen on `0.0.0.0` and on the `PORT` given at run time.
2. Check the plan with a dry run and show it to the person:

   ```sh
   eos deploy --dry-run --project=partner-portal
   ```

3. Deploy:

   ```sh
   eos deploy --project=partner-portal
   ```

4. EOS prints the app's URL when the deploy succeeds; use that URL, never one built by hand.

### Add a database, storage or AI

Use when the app needs data or model access.

Tools: none; done in the `eos` CLI.

1. Follow the saved EOS skill for the commands.
2. Each app gets its own credentials, passed as deployment variables and read by the app's
   server code.

### Set who can use the app

Use when the app will hold sensitive data or must be limited to some people.

Tools: none; done in the `eos` CLI or EOS.

1. In an account workspace, a new app opens to all workspace members by default.
2. Ask the person who should use it, and set the app's access before sharing sensitive data.

### Start a workflow from the app

Use when the app should hand work to Stacksync.

Tools: `workflows_list`, `workflows_get`, `workflows_deploy`

1. Find the workflow with `workflows_list` and `workflows_get`. Its trigger must be
   **Receive Webhooks / HTTP Events**.
2. The MCP does not return the trigger URL: ask the person to copy it from the trigger step in
   the web app.
3. Deploy the workflow with `workflows_deploy` so the URL starts runs.
4. Store the URL in the app's deployment variables.

### Read deployment logs

Use when a deploy fails.

Tools: none; done in the `eos` CLI.

1. Run `eos deployment logs DEPLOYMENT_ID`.
2. Check the manifest, dependencies, start command and port.

Docs: [Enterprise OS](https://docs.stacksync.com/enterprise-os),
[Quick start](https://docs.stacksync.com/enterprise-os/quick-start) and
[CLI reference](https://docs.stacksync.com/enterprise-os/cli-reference).

## Defaults and limits

- A new app in an account workspace opens to all workspace members.
- Deploys without sign in create a guest workspace: its apps are public, and it is deleted 14
  days after creation unless claimed with `eos auth login`.
- Credentials are shown once when created.

## Rules

| Rule | Why |
| --- | --- |
| Choose the workspace explicitly before creating any resource | Resources created in the wrong workspace are visible to the wrong people |
| Run `eos deploy --dry-run` and show the result before every deploy | A dry run checks the package without uploading it |
| Keep database credentials and API keys in deployment variables read by the server, never in source code, frontend code or the chat | Credentials in code or chat leave the person's control |
| Capture credentials privately when created, never in shared logs | They cannot be shown again |
| Ask before deleting an app or a database | Database deletion removes its data for good |
| Sign in before deploying anything sensitive | A guest workspace's apps are public to anyone with the URL |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| Authentication required | The CLI sign in expired | `eos auth login` |
| A resource is missing | Another workspace is selected, or the person lacks access to it | `eos workspace current`, then switch or ask the resource owner to share it |
| A command is unknown | The CLI is out of date | `eos update`, then `eos --help` |
| The deploy fails | Build or start error | Follow "Read deployment logs" |
| The workflow does not start when the app calls it | The workflow is not deployed, or the URL is wrong | `workflows_deploy`, then copy the URL again from the trigger step |
