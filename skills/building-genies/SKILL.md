---
name: building-genies
description: Builds and changes Stacksync Genies, the AI agents that work in a workspace's apps, from a business description; sets their skills (app actions), knowledge bases, interfaces (Slack, Microsoft Teams and email) and who may use them. Use when someone wants an AI agent, assistant or bot that answers in Slack, Teams or email, wants to create, change or share a Genie, add a skill or knowledge base to it, or change its instructions.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "genies"
  tools: "genies_list genies_get genies_draft genies_schema genies_save genies_access_save genies_ask genies_delete connections_list connections_create knowledge_bases_list variables_list workspaces_get"
---

## What it is for

A Genie is an AI agent in a Stacksync workspace. It has instructions that define its job,
**skills** (app actions such as "create a record" or "send a message", each using one of the
workspace's connections), optional **knowledge bases** it answers from, and **interfaces**: the
Slack, Microsoft Teams or email channels people use to talk to it. One Genie can have several
interfaces at once.

Use this guide to create a Genie, change it or share it. To ask a Genie something, decide on an
approval, check its activity and cost, or give it scheduled tasks, use `operating-genies`. To
create a knowledge base or add documents to one, use `managing-knowledge-bases`.

## Before you build

Ask the person business questions only, and wait for the answers:

1. What should the Genie do, for whom, and what do people ask it?
2. Where do people talk to it: Slack, Teams, email, or several?
3. Which apps does it read from or change?
4. Which actions must a person approve before they run, such as sending an email or updating a
   customer record?
5. Who should use it: only workspace members, chosen people or groups, or anyone in the channel?

Never ask the person for technical configuration: module ids, connection ids, JSON fields or the
model. Look those up with the tools below. The person describes the business; the tools build the
configuration.

## Tools, in order

1. `genies_list`: check whether a Genie for this job already exists. Change an existing Genie
   instead of creating a second one with the same job.
2. `genies_draft` with `description`: the person's answers in plain words (who asks what, which
   channel, which apps, which actions need approval). It returns a name, the instructions, the
   channels and the skills, and saves nothing. Show the person that configuration in plain words
   and wait for them to confirm it.
3. `genies_draft` with `alias` alone, when the Genie has an email interface: checks that the
   address `<alias>@stacksync.email` is free.
4. `genies_schema`: read it once before writing the save document. It holds the format and the
   rules for skills, channels, resources and knowledge bases.
5. Look up every id; never invent one:
   - `connections_list` for the connection of each skill's app. A missing app connection is made
     with `connections_create`, which returns a secure sign in link for the person. Never ask for
     a password or key in the chat.
   - `knowledge_bases_list` for each knowledge base the Genie answers from.
   - `variables_list` for each variable or secret the Genie uses.
   - `workspaces_get` for the user and group ids when sharing.
6. `genies_save` without `genie_id`, with `name` and the document from `genies_draft`: keep the
   drafted instructions, skills and channels unchanged, and fill in the connection ids and
   knowledge bases you looked up.
7. `genies_get`: read the Genie back and show the person its skills, channels, knowledge bases
   and status.
8. `genies_ask`: test it with one or two questions the person would ask, before telling people to
   use it (see `operating-genies`).
9. `genies_access_save`: give people or groups a role, once the test passes.

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
sees one preview card for the change and selects Accept before it runs.

## Changing a Genie

- **Instructions:** call `genies_draft` with `master_prompt` (the current instructions from
  `genies_get`) and `instruction` (the change, in the person's words). It returns
  `updated_prompt`, with the change marked, and `master_prompt`, with the change applied. Show
  the person the marked change, then pass `master_prompt` unchanged to `genies_save` with
  `genie_id`.
- **Anything else:** `genies_save` with `genie_id` and only the fields that change. A list you
  send, such as the skills or the interfaces, overwrites the whole stored list, so read the Genie
  with `genies_get` first and send the complete new list.
- **Status:** `status` set to `inactive` stops the Genie from handling new messages on every
  interface and pauses its scheduled tasks; `active` starts it again.

Details of the document: [references/genie-document.md](references/genie-document.md).

## Interfaces

| Interface | First, once, by the person | Then, with the MCP |
| --- | --- | --- |
| Slack | Connections > Create new connection > **Slack Genie**, then **Allow** in Slack. This adds the Genie app to the Slack workspace | Add a `slack` interface with that connection's id; people invite it with `/invite @Genie` and mention it |
| Microsoft Teams | A Teams administrator uploads the Genie app package in Teams; then Connections > Create new connection > **Microsoft Teams**, signed in with an account that can grant admin consent | Add a `teams` interface with that connection's id |
| Email | Nothing | Add an `email` interface with the address `<alias>@stacksync.email`, checked first with `genies_draft` `alias` |

Installing the Slack or Teams app needs the person's sign in to Slack or Teams, so the MCP has no
tool for it. Slack channel affinity (which channel gets which messages): do this in the web app,
in the Genie's **Interfaces** section; the MCP does not set it.

## Access

- By default a Genie answers only signed-in members of the Stacksync workspace.
- `public_access_rights` on `genies_save` sets who may use it: `allow_without_authorization` is
  "Public (authentication not required)", needed when people without a Stacksync account write to
  it in Slack, Teams or email. `allow_selected_users_and_groups` limits it to the people and
  groups given a role.
- `genies_access_save` gives a user or a group a role: `operator` uses it, `editor` changes it,
  `owner` also manages access; `remove` takes the role away.

## Rules

| Rule | Why |
| --- | --- |
| Ask business questions only; look up every id with the tools | The person knows the job, not the configuration; an invented id breaks the Genie |
| Never write or edit the Genie's instructions yourself; use `genies_draft` | `genies_save` accepts only instructions written by the Genie setup flow |
| Show the drafted configuration and wait for a yes before `genies_save` | The Genie acts in live apps with the workspace's connections |
| Check that every action the person named for approval has `approval_policy` set to `approval_required` | The Genie then pauses until a person approves that action |
| Test with `genies_ask` before sharing it or setting it to Public | People see its first answers; fix the instructions before they do |
| Set Public access only when the person asks for it | Anyone who can reach the channel or the email address can then use it |
| Never ask for a password or key; use the link from `connections_create` | Secrets in a chat leave the person's control |
| Delete with `genies_delete` only after the person confirms by name | Deleting removes the Genie and its scheduled tasks |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| `genies_save` refuses the instructions | They were not written by `genies_draft` | Call `genies_draft` (with `instruction` for a change) and pass its text unchanged |
| The Genie does not answer teammates | Access is limited to signed-in workspace members | Set `public_access_rights` to `allow_without_authorization` if the person agrees, or give roles with `genies_access_save` |
| No reply in Slack | The Slack interface has no connection, or the Genie app is not in the channel | Check the interface with `genies_get`; ask the person to `/invite @Genie` |
| `@Genie` is missing in a Teams channel | The app was not added to that team | In Teams: Apps > Built for your org > Genie > Add to a team |
| No reply to an email | No email interface, or the Genie is inactive | Check with `genies_get`; set `status` to `active` |
| A skill fails with a connection error | The skill has no connection, or the connection lost access | `connections_list`, set the skill's connection, or reconnect with `connections_create` |
| Skills or channels disappeared after a change | A list sent to `genies_save` overwrites the stored list | Read with `genies_get`, send the complete list again |
