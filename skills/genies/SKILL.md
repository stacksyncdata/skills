---
name: genies
description: Creates, changes, shares, asks, monitors and deletes Stacksync Genies, the AI agents that act in a workspace's apps, with their skills (app actions), knowledge bases, Slack, Microsoft Teams and email interfaces, approvals and scheduled or one-time tasks. Use when someone wants an AI agent or assistant that answers in Slack, Teams or email, wants to build, change, share, test or delete a Genie, ask a Genie something, approve or reject a Genie action, see what a Genie did or cost, or have a Genie do something on a schedule or once at a set time.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "genies"
  tools: "genies_list genies_get genies_schema genies_draft genies_save genies_access_save genies_ask genies_activity genies_approve genies_tasks_list genies_tasks_save genies_tasks_delete genies_delete connections_list connections_create connections_get connectors_get knowledge_bases_list variables_list workspaces_get folders_move"
  resource: "genies"
---

## What it is

A Genie is an AI agent in a Stacksync workspace. It has:

- **Instructions** that define its job, written only by the Genie setup flow (`genies_draft`).
- **Skills**: app actions such as "create a record" or "send a message". Each skill is one
  module of the app catalog and runs with one of the workspace's connections.
- **Knowledge bases** it answers from.
- **Interfaces**: the Slack, Microsoft Teams or email channels people use to talk to it. One
  Genie can have several.
- **Tasks**: instructions it runs by itself, once or on a schedule.

A Genie lives in one region, `besg` (Europe) or `usnv` (United States). Its knowledge bases are
in the same region. Pass the Genie's `region` from `genies_list` to every later call; without it
the workspace's default region is used.

## When to use it

- Someone wants an assistant that answers questions or does work in their apps from Slack, Teams
  or email.
- A recurring job needs judgement, not a fixed sequence of steps: a daily summary, triage of
  incoming requests, answers from documents.
- For a fixed sequence of steps on every event, use `workflows` instead: a workflow runs the
  same steps each time, a Genie decides which actions to take.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `connections` | Each skill and each Slack or Teams interface uses a connection of the workspace | `genies_save` |
| `connectors` | A skill is one action module of the app catalog; its `id` is the `module_id` | `connectors_get` |
| `knowledge-bases` | The Genie's `knowledge_bases` list names each knowledge base and when to use it; same region | `genies_save` |
| `variables` | A variable or secret is given to the Genie as a `resources` entry | `genies_save` |
| `workspaces` | Users and groups get a role on the Genie | `genies_access_save` |
| `folders` | A Genie can sit in a folder | `folders_move` |
| `files` | Attachments people send a Genie and files it makes are stored as workspace files | `files_list` |
| `workflows` | No native link: a Genie runs single app action modules, never a whole workflow, and no workflow step calls a Genie | |

## Operations

### Find a Genie

Use when looking for an existing Genie or its `genie_id` and `region`.

Tools: `genies_list`

1. Call `genies_list` with `region` `all`, and `search_query` (part of the name) or `folder_id`.
2. Each result gives `genie_id`, name, status and region. Change an existing Genie with the same
   job instead of creating a second one.

### Show a Genie

Use when reading a Genie's configuration or access before changing, asking or sharing it.

Tools: `genies_get`

1. Call `genies_get` with `genie_id` and `region`.
2. It returns the Genie, its document (the same format `genies_save` takes) and its access: each
   user or group with its role. Show the person its skills, interfaces, knowledge bases and
   status in plain words.

### Create a Genie

Use when the person wants a new AI agent.

Tools: `genies_list`, `genies_draft`, `genies_schema`, `connections_list`, `connections_create`, `knowledge_bases_list`, `variables_list`, `genies_save`, `genies_get`

1. Ask business questions only, and wait for the answers: what the Genie does and for whom, what
   people ask it, which channel (Slack, Teams, email), which apps it reads or changes, which
   actions need a person's approval, and who may use it. Never ask for module ids, connection
   ids, JSON fields or the model.
2. Call `genies_list` with `region` `all` to check that no Genie already does this job.
3. Call `genies_draft` with `description`: the answers in plain words. It returns a name, the
   instructions, the interfaces and the skills, and saves nothing. Show this in plain words and
   wait for the person's yes.
4. For an email interface, call `genies_draft` with `alias` alone to check that
   `<alias>@stacksync.email` is free.
5. Call `genies_schema` once to read the document format and its rules.
6. Look up every id; never invent one: `connections_list` for each skill's app (a missing one is
   made with `connections_create`, which returns a link to the web app), `knowledge_bases_list`
   for each knowledge base, `variables_list` for each variable or secret.
7. Call `genies_save` without `genie_id`, with `name`, optional `folder_id` and `region`, and a
   document whose `genie_config` holds the drafted `master_prompt`, `skills` and `interfaces`
   unchanged, with the connection ids filled in, plus `knowledge_bases`.
8. Call `genies_get` and show the result. Then follow **Ask a Genie** with one or two real
   questions before telling people to use it.

The document format: [references/genie-document.md](references/genie-document.md).

### Change a Genie's instructions

Use when the person wants the Genie to behave differently.

Tools: `genies_get`, `genies_draft`, `genies_save`

1. Call `genies_get` for the current `genie_config.master_prompt`.
2. Call `genies_draft` with `master_prompt` and `instruction` (the change in the person's words).
   For a follow-up change in the same chat, pass the earlier turns as `conversation`. It returns
   `updated_prompt` with the change marked, and `master_prompt` with the change applied.
3. Show the marked change and wait for a yes.
4. Call `genies_save` with `genie_id` and `genie_config.master_prompt` set to that
   `master_prompt`, unchanged.

`genies_save` accepts only instructions `genies_draft` returned in the last hour, because the
setup flow checks them; drafting again is the fix for a refusal.

### Change skills, interfaces, knowledge bases, tools or status

Use when adding an app action, a channel or a knowledge base, switching a built-in tool, or
switching a Genie on or off.

Tools: `genies_get`, `connectors_get`, `connections_list`, `knowledge_bases_list`, `genies_save`

1. Call `genies_get`. A list you send (`skills`, `interfaces`, `resources`, `knowledge_bases`)
   replaces the stored list, so start from the current list and send it complete.
2. For a new skill, take its `id` from `module_id` in `connectors_get` and its connection from
   `connections_list`. Set `approval_policy` to `approval_required` for every action the person
   wants to approve first.
3. Call `genies_save` with `genie_id` and only the keys that change. `tools` merges switch by
   switch, for example `{"web_search": false}`.
4. `status` `inactive` stops the Genie on every interface. Its tasks stay scheduled and
   unpaused, but each run is refused until `status` is `active` again.

### Connect an interface

Use when people should reach the Genie in Slack, Teams or email.

Tools: `genies_draft`, `connections_list`, `genies_save`

1. Do the person's one-time step for the channel first; the steps per channel are in
   [references/interfaces.md](references/interfaces.md). Slack and Teams need the person's own
   sign in to Slack or Teams, so the MCP has no tool for it.
2. For email, call `genies_draft` with `alias` alone to check that `<alias>@stacksync.email` is
   free.
3. Call `genies_get`, then `genies_save` with `genie_id` and the complete `interfaces` list: a
   `slack` or `teams` entry with the connection id from `connections_list`, or an `email` entry
   with `details` `<alias>@stacksync.email`.

### Share a Genie

Use when setting who may use or change a Genie.

Tools: `workspaces_get`, `genies_access_save`, `genies_save`

1. By default every member of the workspace may use the Genie.
2. Call `workspaces_get` for the `user_id` or `group_id`.
3. Call `genies_access_save` with `genie_id`, `principal_type` (`user` or `group`),
   `principal_id` and `role`: `operator` uses it, `editor` changes it, `owner` also manages
   access, `remove` takes the role away. Only an owner of the Genie can do this.
4. `public_access_rights` on `genies_save` (existing Genie only) sets the wider rule; see
   [references/genie-document.md](references/genie-document.md). In Slack and Teams only
   workspace members can use a Genie, whatever this setting.

### Ask a Genie

Use when the person wants a Genie to answer or do something now, or to test it.

Tools: `genies_ask`, `genies_activity`

1. Tell the person when the request will change data: the Genie acts in its apps.
2. Call `genies_ask` with `genie_id`, `region` and `message` in plain words. It waits about
   40 seconds.
3. Read `status`: `completed` gives the answer (when it is a question, ask the person and call
   again with the same `conversation_id`); `processing` means still working, so open it later
   with `genies_activity`; `failed` means open the conversation with `genies_activity` to see
   the failing step. A `pending_approval` goes to **Decide on an approval**.

### Decide on an approval

Use when a Genie paused before an action whose `approval_policy` is `approval_required`.

Tools: `genies_approve`, `genies_activity`

1. The approval comes from `genies_ask` (`pending_approval`) or from `genies_activity` (a
   message whose `approval` status is `awaiting_approval`).
2. Show the action and its details, and ask the person to approve or reject. Never decide.
3. Call `genies_approve` with `approval_id`, the `region` given with the approval, and
   `decision`: `approve_once` runs the action, `reject` cancels it.
4. Call `genies_activity` with the `conversation_id` to follow what the Genie did next. A
   decided approval cannot be decided again.

### Check activity and cost

Use when the person asks what a Genie did, what failed or what it cost.

Tools: `genies_activity`

1. Call `genies_activity`: with `genie_id` for the Genie's conversations, with `conversation_id`
   for one conversation's messages and steps, and with `genie_id` and `time_range_start` for the
   log with the cost of each message. All argument combinations:
   [references/activity.md](references/activity.md).

Report numbers: conversations, failures and total cost for the period asked. The tool is refused
when "Allow log access" is off; a workspace owner switches it on in the **MCP** page under
**Settings**. In the web app, **Genie conversations** in the sidebar shows the same
conversations. For a failure, follow `troubleshooting-a-genie`.

### Schedule a task

Use when a Genie should do something every day, every week or once at a set time.

Tools: `genies_tasks_list`, `genies_tasks_save`

1. Call `genies_tasks_list` with `genie_id`. Change an existing task with the same job instead of
   adding a second one.
2. Ask what the Genie does each run and when, in the person's time zone.
3. Convert to UTC and say so, for example "8:00 in New York is 12:00 UTC in summer".
4. Call `genies_tasks_save` with `genie_id`, `name`, `instruction` and one of: `cron_expression`
   in UTC, such as `0 8 * * 1-5`, with optional `start_time`; or `run_at`, one future time in
   ISO 8601. Not both.
5. Show the saved task with its next run.

### Change, pause or delete a task

Use when a task should run differently, stop for a while, or stop for good.

Tools: `genies_tasks_list`, `genies_tasks_save`, `genies_tasks_delete`

1. Take the `task_id` from `genies_tasks_list`.
2. Call `genies_tasks_save` with `task_id` and only the fields that change. `is_paused` `true`
   pauses it, `false` resumes it.
3. To remove it for good, after the person confirms, call `genies_tasks_delete` with `genie_id`
   and `task_id`.

### Move a Genie to a folder

Use when organizing Genies.

Tools: `folders_move`

1. Follow `folders`, **Move resources**. The `folder_id` on `genies_save` applies only to a new
   Genie.

### Delete a Genie

Use when the person wants the Genie gone for good.

Tools: `genies_get`, `genies_delete`

1. Call `genies_get` and name the Genie, its interfaces and its tasks to the person.
2. After the person confirms by name, call `genies_delete` with `genie_id` and `region`. It
   deletes the Genie and its scheduled tasks; it cannot be undone. To stop it for a while, set
   `status` to `inactive` instead.

## Defaults and limits

- A new Genie is shared with every workspace member.
- Built-in `tools` are all on by default: `web_search`, `execute_browser`, `api_call`,
  `code_execution`, `stacksync_ocr`, `modify_scheduled_task`.
- A skill's `approval_policy` defaults to `always_allow`.
- Creating a Genie through the MCP is refused when the workspace turned off "Allow AI Genie
  creation" on the **MCP** page under **Settings**.
- `genies_draft` instructions are accepted by `genies_save` for one hour.
- `genies_ask` waits about 40 seconds before it answers `processing`.
- Task schedules are in UTC.
- Writes run directly, unless the workspace turned on "Ask before every change". Then the person
  accepts the change and only then is it done.

## Rules

| Rule | Why |
| --- | --- |
| Ask business questions only; look up every id with the tools | The person knows the job, not the configuration; an invented id breaks the Genie |
| Never write or edit instructions yourself; use `genies_draft` | `genies_save` accepts only instructions the setup flow wrote |
| Show the drafted configuration and wait for a yes before `genies_save` | The Genie acts in live apps with the workspace's connections |
| Set `approval_required` on every action the person named for approval | The Genie then pauses until a person decides |
| Test with `genies_ask` before sharing a Genie or making it public | People see its first answers; fix the instructions before they do |
| Never approve or reject for the person | The action changes data in a live app; the person owns that decision |
| Show a task's time in the person's time zone and in UTC before saving | Schedules are in UTC; a wrong offset runs the task at the wrong hour |
| Pause a task or set the Genie inactive when the person wants a break; delete only on request | Pausing keeps the instruction and schedule |
| Never ask for a password, key or `api_key` in the chat; use the link from `connections_create` | Secrets in a chat leave the person's control |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| `genies_save` refuses the instructions | They were not written by `genies_draft`, or were drafted more than an hour ago | Call `genies_draft` again and pass its text unchanged |
| Creating a Genie is refused | "Allow AI Genie creation" is off | Ask a workspace owner to switch it on in the **MCP** page under **Settings** |
| Skills or interfaces disappeared after a change | A list sent to `genies_save` replaces the stored list | Read with `genies_get` and send the complete list again |
| The Genie does not answer teammates | They are not workspace members, or access is limited to selected users and groups | Invite them (`workspaces`) or give them a role with `genies_access_save` |
| No reply in Slack | The Slack interface has no connection, or the Genie app is not in the channel | Check with `genies_get`; ask the person to `/invite @Genie` |
| `@Genie` is missing in a Teams channel | The app was not added to that team | In Teams: **Apps** > **Built for your org** > **Genie** > **Add to a team** |
| No reply to an email | No email interface, or the Genie is inactive | Check with `genies_get`; set `status` to `active` |
| The Genie seems stuck | It is paused on an approval | Find it with `genies_activity`; follow **Decide on an approval** |
| A task ran at the wrong hour | It was saved in local time, not UTC | Save it again with the UTC time |
| A skill fails with a connection error | No connection on the skill, or the connection lost access | `connections_list`; on `needs_reauthorization` follow `connections`, **Reauthorize a connection** |
| `genies_activity` is refused | "Allow log access" is off | Ask a workspace owner to switch it on in the **MCP** page under **Settings** |
