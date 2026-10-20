# Stacksync skills

[![skills.sh](https://skills.sh/b/stacksyncdata/skills)](https://skills.sh/stacksyncdata/skills)

Skills teach your AI app how to work in Stacksync: how to build and fix syncs, workflows,
genies and the rest, which questions to ask first, and the rules that keep a live account safe.
They follow the open [Agent Skills](https://agentskills.io) standard, so the same skills work in
Claude, ChatGPT, Codex, Cursor, Gemini CLI, Copilot, VS Code and other AI apps.

Your AI app reads only each skill's name and description until a request needs it, so having
every Stacksync skill installed costs little.

## Skill types

Every skill lives in `skills/<name>/` and states its type in `metadata.type`:

| Type | What it is |
| --- | --- |
| `resource` | One Stacksync resource, such as syncs or queues: what it is, what it connects to, and every operation on it |
| `blueprint` | A reusable design that combines two or more resources, whatever the apps, such as a sync feeding a queue that a workflow works through |
| `solution` | A real build between named apps, such as Shopify orders to NetSuite, proven on a live workspace |
| `runbook` | An ordered procedure with a check at each step, such as getting started, fixing a sync or moving to Stacksync |

Start with `getting-started`. A solution follows a blueprint, a blueprint's steps point at resource
operations, and a runbook's steps do too.

[skills/README.md](skills/README.md) lists every published skill, and `catalog.json` holds the
same list for programs.

## Install

| Where you work | How to install |
| --- | --- |
| Claude and claude.ai | The Stacksync plugin from the Claude directory (coming soon), or download the skills ZIP and upload it under Customize > Skills |
| Claude Code | `/plugin marketplace add stacksyncdata/skills`, then `/plugin install stacksync@stacksync` |
| Codex and ChatGPT | The Stacksync plugin (coming soon) |
| Cursor, Gemini CLI, Copilot, VS Code and others | `npx skills add stacksyncdata/skills` |
| Your whole company | Your admin provisions the skills for the workspace, so every member has them |

## Connect the Stacksync MCP first

The skills describe the work; the [Stacksync MCP server](https://docs.stacksync.com/mcp) does it
in your account, as you, with your access. `getting-started` connects it, and every runbook checks
that it is connected before its first step. You sign in with your Stacksync account (OAuth); no API key is needed.

| AI app | How to add it |
| --- | --- |
| Claude and claude.ai | Settings > Connectors > Add custom connector, with the URL `https://mcp.stacksync.com/mcp` |
| Claude Code | `claude mcp add --transport http stacksync https://mcp.stacksync.com/mcp` |
| Codex | `codex mcp add stacksync --url https://mcp.stacksync.com/mcp` |
| Cursor | Add `"stacksync": { "url": "https://mcp.stacksync.com/mcp" }` under `mcpServers` in `.cursor/mcp.json` |
| VS Code | Add `"stacksync": { "type": "http", "url": "https://mcp.stacksync.com/mcp" }` under `servers` in `.vscode/mcp.json` |

The Claude Code plugin connects it for you. Then:

1. You ask for something in your own words, for example "keep HubSpot contacts and Salesforce
   leads in step".
2. Your AI app picks the matching skill by its description and follows its steps.
3. Each step calls a Stacksync MCP tool, which works in your account with the same access you
   have in the web app. Apps are connected through a sign in link, never by pasting a secret
   into the chat.
4. The MCP server also serves these skills to AI apps that have not installed them, as published
   on this repository's `prod` branch when the server was last deployed.

Full documentation: [docs.stacksync.com/mcp](https://docs.stacksync.com/mcp).

## Names

- Resources: the resource in the plural, for example `syncs` or `knowledge-bases`.
- Blueprints: what the design does, for example `batch-sync-changes-through-a-queue`.
- Runbooks: the procedure, for example `troubleshooting-a-sync` or `building-a-connector`.
- Solutions: the apps and the objects, for example `shopify-to-netsuite-orders`, with app names
  from the slugs in [data/apps.json](data/apps.json).
- Lowercase letters, digits and single hyphens, at most 64 characters.
- Never "claude" or "anthropic", which are reserved.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [STYLE.md](STYLE.md). Solutions can be requested without
code through the **Integration solution** issue form. Skills are licensed under [Apache 2.0](LICENSE).
