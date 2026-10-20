---
name: building-internal-apps
description: Deploys a hosted internal app, a managed PostgreSQL database, file storage or an internal API with Stacksync Enterprise OS, and points the person to the official Enterprise OS agent skill for the full command set. Use when someone wants to host a web app, portal, dashboard or API for their team, needs a managed database or file storage, or asks for something Stacksync syncs and workflows do not provide on their own.
license: Apache-2.0
metadata:
  type: guide
  version: "0.1.0"
  owner: "@stacksyncdata/ai-team"
  areas: "enterprise-os"
  tools: "workflows_list workflows_get"
---

## When to use

Use this guide when the person needs software that runs somewhere: an internal tool, a partner
portal, an operations dashboard, an API, or the database and file storage behind them. Stacksync
Enterprise OS (EOS) builds, deploys and hosts it, and gives it a URL.

For an app Stacksync should connect to as a connector, read `building-connectors` instead.

## What EOS provides

| Building block | What the person gets |
| --- | --- |
| Applications | Web apps and APIs built and deployed from a folder, with a URL, deployment history, memory and scaling settings |
| Databases | Managed PostgreSQL with dedicated credentials for each app |
| Storage | Private file buckets with scoped API keys |
| AI inference | One API key for the available models, with a spending limit per key |
| Access | Sign in for app users managed by EOS; resources shared with people and groups |

## One source for the details

EOS publishes its own agent skill, kept current with the CLI. Save it into the project and follow
it for every command beyond the first deploy below:

```sh
eos skill save
```

It is also published at `https://enterprise-os.stacksync.ai/skill.md`. Run `eos --help` to see
the commands the installed version supports.

## Steps

Who runs the commands: a coding agent runs them on the person's computer and asks the person to
approve the browser sign in; a chat app without a terminal explains each command and waits for the
person to run it.

1. **Install the EOS CLI** (macOS, Linux, or Windows with WSL), then open a new terminal:

   ```sh
   curl -fsSL https://enterprise-os.stacksync.ai/downloads/install.sh | sh
   eos --version
   ```

2. **Sign in and choose the workspace** before creating anything:

   ```sh
   eos auth login
   eos workspace list
   eos workspace current
   ```

   Ask the person which workspace to use when there is more than 1, and switch with
   `eos workspace switch WORKSPACE_ID`.

3. **Deploy from the app folder.** Check the plan with a dry run, show it to the person, then
   deploy:

   ```sh
   eos deploy --dry-run --project=partner-portal
   eos deploy --project=partner-portal
   ```

   The app's web server must listen on `0.0.0.0` and on the `PORT` given at run time. EOS prints
   the app's URL when the deploy succeeds; use that URL, never one built by hand.

4. **Add a database, storage or AI** by following the saved EOS skill. Each app gets its own
   credentials, passed as deployment variables and read by the app's server code.

5. **Check access.** In an account workspace, a new app opens to all workspace members by default.
   Ask the person who should use it and set the app's access before sharing sensitive data.

## Connecting the app to Stacksync

An app can start a Stacksync workflow by sending an HTTP POST to the workflow's trigger URL.
Every new workflow starts with a **Receive Webhooks / HTTP Events** trigger, and its URL appears in
the trigger once the workflow is saved. Find the workflow with `workflows_list` and `workflows_get`,
and store the URL in the app's deployment variables.

Docs: [Enterprise OS](https://docs.stacksync.com/enterprise-os),
[Quick start](https://docs.stacksync.com/enterprise-os/quick-start) and
[CLI reference](https://docs.stacksync.com/enterprise-os/cli-reference).

## Rules

| Rule | Why |
| --- | --- |
| Choose the workspace explicitly before creating any resource | Resources created in the wrong workspace are visible to the wrong people |
| Run `eos deploy --dry-run` and show the result before every deploy | A dry run checks the package without uploading it |
| Keep database credentials and API keys in deployment variables read by the server, never in source code, frontend code or the chat | Credentials in code or chat leave the person's control |
| Credentials are shown once when created; capture them privately, never in shared logs | They cannot be shown again |
| Ask before deleting an app or a database; database deletion removes its data for good | It cannot be undone |
| Deploys without sign in create a guest workspace: its apps are public, and it is deleted 14 days after creation unless claimed with `eos auth login` | Sensitive data in a public guest app is open to anyone with the URL |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| Authentication required | The CLI sign in expired | `eos auth login` |
| A resource is missing | Another workspace is selected, or the person lacks access to it | `eos workspace current`, then switch or ask the resource owner to share it |
| A command is unknown | The CLI is out of date | `eos update`, then `eos --help` |
| The deploy fails | Build or start error | Read `eos deployment logs DEPLOYMENT_ID`; check the manifest, dependencies, start command and port |
