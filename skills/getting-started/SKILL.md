---
name: getting-started
description: Explains what Stacksync does, connects the Stacksync MCP server to an AI app, and sets the order and the rules for building in a live Stacksync workspace. Use when someone is new to Stacksync, asks what Stacksync can do, wants to connect Stacksync to their AI app, or asks where to start with syncs, workflows, Genies, queues, variables, knowledge bases or API proxies.
license: Apache-2.0
metadata:
  type: guide
  version: "0.1.0"
  owner: "@stacksyncdata/ai-team"
  areas: "onboarding"
  tools: "workspaces_list workspaces_get connections_list connections_get connections_create connectors_list connectors_get syncs_list workflows_list genies_list queues_list variables_list knowledge_bases_list api_proxies_list skills_get"
---

## When to use

Read this guide first in any conversation about Stacksync. It answers "what is Stacksync", "how do
I connect it to my AI app" and "where do I start". For a specific build, it points to the guide
that covers it (see "Which guide to read").

## What Stacksync is

Stacksync connects the apps and databases a business runs on and automates the work between them.
The parts, in the words the web app uses:

| Part | What it does |
| --- | --- |
| Connections | Signed in accounts of the person's apps and databases, such as a CRM, an ERP or a Postgres database. Every other part uses them |
| Syncs | Keep records equal between two apps. A change on one side is copied to the other, in one direction or both (two-way sync) |
| Workflows | Run steps in order when something happens: a record changes, a webhook arrives, an email comes in or a schedule fires |
| Queues | Hold work items so a workflow can process a large number of changes at a steady pace |
| Variables | Named values, such as an account ID or a threshold, that workflows read at run time |
| Genies | AI agents in the workspace. Each has instructions and skills built on the workspace's connections, and people talk to it in Slack, Microsoft Teams or email |
| Knowledge bases | Documents a Genie reads to answer questions about the business |
| API proxies | A managed API in front of an app, so other software can read and write that app through Stacksync |

## Connect the Stacksync MCP server

The Stacksync MCP server does the work in the person's account, as them, with the same access
they have in the web app.

- Server URL: `https://mcp.stacksync.com/mcp`
- Sign in: the AI app opens a Stacksync sign in page (OAuth). No API key is needed, so none is
  ever pasted into the chat.
- Check it works: call `workspaces_list`. If the person has more than 1 workspace, ask which one to
  work in and use it for every later call.

| AI app | How to add it |
| --- | --- |
| Claude and claude.ai | Settings > Connectors > Add custom connector, with the URL above |
| Claude Code | `claude mcp add --transport http stacksync https://mcp.stacksync.com/mcp` |
| Codex | `codex mcp add stacksync --url https://mcp.stacksync.com/mcp` |
| Cursor | `"stacksync": { "url": "https://mcp.stacksync.com/mcp" }` under `mcpServers` in `.cursor/mcp.json` |
| VS Code | `"stacksync": { "type": "http", "url": "https://mcp.stacksync.com/mcp" }` under `servers` in `.vscode/mcp.json` |

## Build order

Build in this order, because each step uses what the step before it made.

1. **Connections.** Every sync, workflow step and Genie skill runs through a connection. Check
   `connections_list` first; create only what is missing.
2. **Syncs and variables.** Syncs keep the base data equal between apps; variables hold the values
   workflows will read.
3. **Workflows and queues.** Workflows act on synced data and on events; a queue goes in front of
   a workflow when changes arrive in bursts larger than it should process at once.
4. **Genies.** A Genie's skills call the connections and workflows built above, so it comes last.

## Rules

| Rule | Why |
| --- | --- |
| Discover before building: list what exists (`connections_list`, `syncs_list`, `workflows_list`, `genies_list`) and read the closest match with its `_get` tool | The workspace may already hold what the person asks for; a second copy of a sync or workflow writes the same records twice |
| Create everything switched off, show the person the result, then switch it on only after they confirm | A new sync or workflow starts changing records in live apps the moment it runs |
| Never ask for or accept a password, API key or token in the chat. Call `connections_create`: it returns a secure sign in link the person opens to connect the app | A secret typed into a chat is stored in the chat history, outside the person's control |
| Some changes show a preview card in the AI app. Wait for the person to accept it before saying the change is done | The card is where the person approves a change to their live account; a declined card means nothing changed |
| Ask before deleting anything, and name what will be deleted | Deleting a sync, workflow or connection cannot be undone from the chat |
| Use the names the web app shows (sync, workflow, connection, Genie), and give the person the web app link when a setting exists only there | The person checks the work in the web app and must recognise what they see |

## Which guide to read

| The person wants to | Read |
| --- | --- |
| Keep records equal between two apps, in one or both directions, or fix a failing sync | `designing-two-way-syncs` |
| Move integrations from another platform to Stacksync | `migrating-to-stacksync` |
| Connect an app Stacksync has no connector for | `building-connectors` |
| Host an app, a managed database, file storage or an internal API | `building-internal-apps` |

Call `skills_get` with a guide's name to read a guide that is not installed in the AI app.

## When Stacksync lacks something

- **No connector for the app.** Check `connectors_list` first. If the app is not there, read
  `building-connectors`: a workflow can often reach the app with an HTTP request step or a code
  step, and a new connector can be built with the Stacksync CLI.
- **A hosted database, file storage or a custom app.** Read `building-internal-apps`.

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| The AI app has no Stacksync tools | The MCP server is not added, or sign in did not finish | Add the server with the table above and finish the sign in page |
| `workspaces_list` returns nothing the person expects | They signed in with a different Stacksync account | Sign out of the connector in the AI app and sign in with the right account |
| A tool says the person has no access | Their role in the workspace does not allow the change | Ask a workspace admin to change the role; the MCP server never goes beyond the person's own access |
| An app is missing from `connections_list` | It was never connected in this workspace | Call `connections_create` and give the person the sign in link |
