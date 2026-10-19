# Stacksync skills

Skills teach your AI app how to work in Stacksync: how to build and fix syncs, workflows,
genies and the rest, which questions to ask first, and the rules that keep a live account safe.
They follow the open [Agent Skills](https://agentskills.io) standard, so the same skills work in
Claude, ChatGPT, Codex, Cursor, Gemini CLI, Copilot, VS Code and other AI apps.

Your AI app reads only each skill's name and description until a request needs it, so having
every Stacksync skill installed costs little.

## Skill types

Every skill states its type in `metadata.type`:

| Type | What it is | Where it lives |
| --- | --- | --- |
| `resource` | How to create, change and fix one Stacksync resource, tool by tool | `skills/` |
| `recipe` | A whole integration from a real business need, proven on a real account | `recipes/` |
| `playbook` | A way of working across many resources, such as the Enterprise Architect | `skills/` |
| `guide` | Getting started, and building what Stacksync does not have yet | `skills/` |

## Install

| Where you work | How to install |
| --- | --- |
| Claude and claude.ai | The Stacksync plugin from the Claude directory (coming soon), or download the skills ZIP and upload it under Customize > Skills |
| Claude Code | `/plugin marketplace add stacksyncdata/skills`, then `/plugin install stacksync@stacksync` |
| Codex and ChatGPT | The Stacksync plugin (coming soon) |
| Cursor, Gemini CLI, Copilot, VS Code and others | `npx skills add stacksyncdata/skills` |
| Your whole company | Your admin provisions the skills for the workspace, so every member has them |

## Skills and the Stacksync MCP server

The skills know how to work; the [Stacksync MCP server](https://docs.stacksync.com/mcp) does
the work in your account, as you, with your access. Connect your AI app to:

```
https://mcp.stacksync.com/mcp
```

The Claude Code plugin connects it for you. Together:

1. You ask for something in your own words, for example "keep HubSpot contacts and Salesforce
   leads in step".
2. Your AI app picks the matching skill by its description and follows its steps.
3. Each step calls a Stacksync MCP tool, which works in your account with the same access you
   have in the web app.
4. The MCP server also serves these skills to AI apps that have not installed them, so the
   guidance is the same everywhere.

Full documentation: [docs.stacksync.com/mcp](https://docs.stacksync.com/mcp).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Skills are licensed under [Apache 2.0](LICENSE).
