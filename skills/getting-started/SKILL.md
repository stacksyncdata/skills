---
name: getting-started
description: Connects the Stacksync MCP server to an AI app, picks the workspace and region, lists the skills and routes each request to the resource skill, blueprint or runbook that covers it. Use when someone is new to Stacksync, asks what Stacksync can do, wants to connect Stacksync to their AI app, or does not know where to start.
license: Apache-2.0
metadata:
  type: runbook
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "onboarding"
  tools: "workspaces_list workspaces_get skills_list skills_get connections_list"
---

## Use it when

Read this first in any conversation about Stacksync. It answers "what is Stacksync", "how do I
connect it to my AI app" and "where do I start", then hands over to the skill that does the work.

Stacksync connects the apps and databases a business runs on and automates the work between them.
In the words the web app uses: **connections** sign in to the person's apps; **syncs** keep
records equal between two apps, one way or both; **workflows** run steps when a record changes, a
webhook or email arrives, or a schedule fires; **queues** batch work for a workflow; **variables**
hold values and secrets workflows read; **Genies** are AI agents people talk to in Slack,
Microsoft Teams or email; **knowledge bases** hold documents a Genie answers from; **API proxies**
put a managed API in front of an app.

## Before you start

- The person has a Stacksync account and can sign in to the web app.
- Their AI app supports remote MCP servers over HTTP with OAuth sign in.

## Steps

1. **Connect the Stacksync MCP server.** Server URL: `https://mcp.stacksync.com/mcp`. Sign in
   happens on a Stacksync page (OAuth); no API key is pasted into the chat. The server acts as the
   person, with the same access they have in the web app.

   | AI app | How to add it |
   | --- | --- |
   | Claude and claude.ai | Settings > Connectors > Add custom connector, with the URL above |
   | Claude Code | `claude mcp add --transport http stacksync https://mcp.stacksync.com/mcp` |
   | Codex | `codex mcp add stacksync --url https://mcp.stacksync.com/mcp` |
   | Cursor | `"stacksync": { "url": "https://mcp.stacksync.com/mcp" }` under `mcpServers` in `.cursor/mcp.json` |
   | VS Code | `"stacksync": { "type": "http", "url": "https://mcp.stacksync.com/mcp" }` under `servers` in `.vscode/mcp.json` |

   Check: the AI app lists Stacksync tools such as `workspaces_list`.
2. **Pick the workspace and region.** Call `workspaces_list` (see `workspaces`). If the person has
   more than 1 workspace, ask which one and pass its `workspace_id` to every later call. Resources
   live in a region: `besg` (Europe) or `usnv` (United States). List tools take `region` `all`;
   pass the resource's own `region` to every call on it.
   Check: one `workspace_id` is chosen and the person recognises the workspace name.
3. **List the skills.** Call `skills_list` for every skill with its type and when to use it, and
   `skills_get` with a name to read one the AI app does not have installed.
   Check: `skills_list` returned the skills named in step 4.
4. **Route the request.** Discover before building: list what exists with the resource's `_list`
   tool and read the closest match with its `_get` tool, because a second copy of a sync or
   workflow writes the same records twice. Then hand over:
   - **One operation on one resource** (create, change, run, delete, read): the resource skill.

     | Resource | Skill |
     | --- | --- |
     | Workspaces, members, roles, access | `workspaces` |
     | Folders, finding a resource by name | `folders` |
     | Connections to apps and databases | `connections` |
     | The app catalog: apps, actions, triggers, running one app action now | `connectors` |
     | Syncs, sync issues, sync event triggers, sync webhooks | `syncs` |
     | Workflows, triggers, steps, code steps, runs, replay, deploy | `workflows` |
     | Genies, their tasks, access, approvals, asking a Genie | `genies` |
     | Queues | `queues` |
     | Variables and secrets | `variables` |
     | API proxies | `api-proxies` |
     | Knowledge bases | `knowledge-bases` |
     | Files in the workspace | `files` |
     | Hosted apps, databases, storage and internal APIs | `internal-apps` |

   - **Build something that combines resources**: the blueprint that matches.

     | The person wants | Blueprint |
     | --- | --- |
     | Act on every record change in an app | `react-to-each-record-change` |
     | Process sync changes in batches | `batch-sync-changes-through-a-queue` |
     | Enrich records after they sync | `enrich-records-after-a-sync` |
     | Turn incoming emails into records | `inbound-email-to-records` |
     | Turn incoming webhooks into records | `inbound-webhook-to-records` |
     | Run work on a schedule | `scheduled-workflow` |
     | Keep two apps equal both ways | `two-way-sync-between-apps` |
     | Stay under an app's write limits | `throttle-writes-with-a-queue` |
     | A Genie that answers email from documents | `knowledge-grounded-email-genie` |
     | A Genie that does a job on a schedule | `scheduled-genie-task` |
     | Call an app's API from their own code | `api-proxy-for-an-app` |
     | One workflow starting another | `chain-workflows` |
     | Send warehouse data to an app | `reverse-etl-from-a-warehouse` |
     | Keep a database copy of an app | `database-replica-of-an-app` |

   - **Something is wrong, or a procedure across resources**: the runbook.

     | The person says | Runbook |
     | --- | --- |
     | Records do not sync, a sync is paused, late or different | `troubleshooting-a-sync` |
     | A workflow failed or did not run | `troubleshooting-workflow-runs` |
     | A Genie failed, is stuck, or its task did not run | `troubleshooting-a-genie` |
     | Counts, logs, activity, log retention, alerts | `exploring-data-and-logs` |
     | Move integrations from another platform | `migrating-to-stacksync` |
     | The app has no Stacksync connector | `building-a-connector` |

   Check: the person agrees the named skill matches what they want, and you read it with
   `skills_get` if it is not installed.

## Rules

| Rule | Why |
| --- | --- |
| Build in order: connections, then syncs and variables, then workflows and queues, then Genies | Each part uses what the one before it made; a Genie's skills call the connections and workflows built earlier |
| Never ask for or accept a password, API key or token in the chat. Call `connections_create`: it returns a secure sign in link the person opens | A secret typed into a chat is stored in the chat history, outside the person's control |
| Writes run directly unless the workspace turned on "Ask before every change"; then the person accepts the change, and only then report it as done | The person approves changes to their live account; a declined change means nothing changed |
| Ask before deleting anything, and name what will be deleted | A deleted sync, workflow or connection cannot be restored from the chat |
| Use the names the web app shows (sync, workflow, connection, Genie) | The person checks the work in the web app and must recognise what they see |
| A tool that says the person has no access is final; a workspace owner changes the role | The MCP server never goes beyond the person's own access |

## When the MCP cannot do it

- **No Stacksync tools appear**: the server is not added or sign in did not finish. Add it with
  step 1 and finish the sign in page.
- **The expected workspaces are missing**: the person signed in with another Stacksync account.
  Sign out of the connector in the AI app and sign in again.
- **A setting exists only in the web app**: the resource skill names the screen; give the person
  that place.
- **No connector for the app**: check `connectors_list`, then follow `building-a-connector`.
