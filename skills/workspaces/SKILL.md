---
name: workspaces
description: Shows the person's workspaces, role and data regions, lists workspace members and groups, and sends the person to the web app for invitations, roles, groups, MFA, SSO, API keys and the workspace's AI settings. Use when someone asks which workspace or role they have, who is in the workspace, wants to invite a colleague or change a role, asks about MFA, single sign on or user provisioning, or wants to turn on "Ask before every change" or limit what AI apps may do in the workspace.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workspaces"
  tools: "workspaces_list workspaces_get genies_access_save"
  resource: "workspaces"
---

## What it is

A workspace holds a team's resources: connections, syncs, workflows, Genies, queues, variables,
API proxies, knowledge bases and folders. Each person has one role in each workspace they belong
to. Each resource lives in one data region, `besg` (Europe) or `usnv` (United States), and the
workspace has a default region.

| Role | What it allows |
| --- | --- |
| Owner | Create and use every workspace resource except private resources of other users, and manage billing |
| Editor | Create and use every workspace resource except private resources of other users, and invite users |
| Viewer | View resources that are not private; cannot create, change or delete anything |

A Viewer's writes through the MCP are refused, the same as in the web app.

## When to use it

- Choose the workspace before any change when the person has several.
- Check the person's role before planning a change.
- Find a colleague's or group's ID to share a Genie.
- Answer where users, roles, security and AI settings are changed.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `genies` | A Genie has its own roles per user and group, taken from the workspace's members and groups | `genies_access_save` |
| `connections` | A connection is shared with the workspace or private to its creator | `connections_update` |
| `folders` | Every resource of the workspace sits in a folder or at the root of its region | `folders_list` |
| `syncs`, `workflows`, `queues`, `variables`, `api-proxies`, `knowledge-bases` | Each lives in one region of the workspace | their own tools |

## Operations

### List workspaces

Use when the person has not named a workspace, or a region must be chosen.

Tools: `workspaces_list`

1. Call `workspaces_list`: every workspace the person can act in, with their role and the
   default region, and the regions a resource can live in.
2. When several workspaces fit, ask which one. Pass its `workspace_id` to later tools.

### Show a workspace, its members and groups

Use when the person asks who is in the workspace, which role someone has, or before sharing a
Genie.

Tools: `workspaces_get`

1. Call `workspaces_get` with the `workspace_id`.
2. It returns the person's role, the users (`user_id`, name, email, role) and the groups
   (`group_id`, name, members). Match people by the name or email the person gave; when two
   match, ask.

These are the IDs `genies_access_save` takes. Follow `genies` to share a Genie.

### Invite a user or change a role

Use when the person wants a colleague in the workspace, a different role, or someone removed.

Tools: none; done in the web app.

1. Invite: **Workspace Settings > Users**, enter the email, choose the role, select
   **Send invite**. The invitee joins through the link in the email.
2. Change a role, remove a user or revoke an invitation: **Workspace Settings > Users**.

The MCP reads members but cannot change them: membership is a security setting the person sets
themselves.

### Manage groups

Use when the person wants a team to share access as one unit.

Tools: none; done in the web app.

1. Create a group or change its members in **Workspace Settings > Groups**.
2. Read the result with `workspaces_get`.

### Set workspace security

Use when the person asks about MFA, single sign on, user provisioning, API keys or the plan.

Tools: none; done in the web app.

1. Require MFA for every member: **Workspace Settings > Security & API keys**; workspace owners
   only. Every member is signed out and sets up MFA at the next sign in.
2. Single sign on (SSO) and user provisioning (SCIM): **Workspace Settings > SCIM & SSO**
   (Enterprise).
3. The workspace API key: **Workspace Settings > Security & API keys**. A personal API key is in
   **User Settings**.
4. The plan: **Workspace Settings > General**, under **Pricing**.

### Set what AI apps may do

Use when the person wants to review each change an AI app makes, or limit what AI apps can do in
the workspace.

Tools: none; done in the web app.

1. Open the **MCP** page in the sidebar, under **Settings**; workspace owners only.
2. Turn on "Ask before every change" to make every write wait until the person accepts it.
3. Turn off **Allow log access** to stop AI apps reading run logs and payloads.
4. Turn off **Allow AI Genie creation** to stop AI apps creating and publishing Genies.

An AI app cannot change these settings, so it cannot lift a limit set on it.

## Defaults and limits

- With "Ask before every change" off, writes run directly. With it on, the person accepts each
  change (card, question or in the chat), and only then is it done.
- Each resource lives in one region; resources that work together must share a region.
- SSO and SCIM are on the Enterprise plan.

## Rules

| Rule | Why |
| --- | --- |
| Confirm the workspace with `workspaces_list` before any change when the person has several | A change in the wrong workspace reaches the wrong team |
| Check the role before planning a change | A Viewer's writes are refused |
| Take user and group IDs only from `workspaces_get` | A guessed ID gives access to the wrong person or fails |
| Never change users, roles, MFA or AI settings through a workaround; send the person to the web app | These are security settings the person sets themselves |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| A write is refused for permission | The person is a Viewer in this workspace | `workspaces_get` to show the role; an Owner changes it in **Workspace Settings > Users** |
| A colleague is missing from `workspaces_get` | They have not accepted the invitation | Ask them to open the invitation email, or invite them again |
| All members were signed out | MFA was switched on for the workspace | Each member sets up MFA at the next sign in |
| Every change waits for the person | "Ask before every change" is on | Expected; the person accepts each change, or an owner turns it off on the **MCP** page |
| A resource cannot be found | It is in another workspace or region | `workspaces_list`, then search with `folders_list` and `region` `all` |
