---
name: managing-workspace-access
description: Shows the person's workspaces and role, lists workspace members and groups, shares a Genie with people or groups, and sends the person to the one place where users, roles, MFA, SSO and SCIM are set. Use when someone asks which workspace or role they have, who is in the workspace, wants to invite a colleague or change a role, wants to give or remove access to a Genie, a teammate cannot use a Genie, or asks about MFA, single sign on or user provisioning.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workspaces"
  tools: "workspaces_list workspaces_get genies_list genies_get genies_access_save"
---

## When to use

Use this guide for who can do what: the person's workspaces and role, the members and groups of
a workspace, access to a Genie, and the security settings of a workspace.

To share a connection with the workspace, use `connecting-apps`.

## Workspace roles

| Role | What it allows |
| --- | --- |
| Owner | Create and use every workspace resource except private resources of other users, and manage billing |
| Editor | Create and use every workspace resource except private resources of other users, and invite users |
| Viewer | View resources that are not private; cannot create, change or delete anything |

A Viewer's writes through the MCP are refused, the same as in the web app. Check the role before
planning a change.

## Tools, in the order an agent uses them

1. `workspaces_list`: every workspace the person can act in, with their role and default region,
   and its regions, `besg` (Europe) or `usnv` (United States). When several workspaces fit, ask which
   one.
2. `workspaces_get`: one workspace with the person's role, its users (`user_id`, name, email,
   role) and its groups (`group_id`, name, members). These IDs are the ones
   `genies_access_save` takes.
3. `genies_list`, then `genies_get`: find the Genie and read it.
4. `genies_access_save`: give, change or remove one user's or group's role on a Genie.

Writes run directly unless the workspace turned on "Ask before every change"; then the person
sees one preview card and selects **Accept**.

## Share a Genie

Each Genie has its own roles, separate from the workspace role:

| Genie role | What it allows |
| --- | --- |
| `operator` | Uses the Genie |
| `editor` | Changes the Genie |
| `owner` | Manages who has access |

1. Call `workspaces_get` and find the person (`user_id`) or the group (`group_id`). Match by the
   name or email the person gave; when two match, ask.
2. Call `genies_access_save` with `genie_id`, `principal_type` (`user` or `group`),
   `principal_id` and `role`. To remove access, pass `role` `remove`.
3. Tell the person what changed: who, which Genie, which role.

Sharing with a group gives the role to everyone in that group, now and later. Prefer a group when
the person names a team.

Who can talk to a Genie in Slack, Microsoft Teams or email is a separate setting. By default a
Genie answers only signed in members of the workspace. To let everyone in a connected channel use
it, set `public_access_rights` to `allow_without_authorization` with `genies_save`, after the
person confirms. `status` set to `inactive` on the same tool stops the Genie handling new
messages and suspends its scheduled tasks. Details are in `building-genies`.

## When the MCP cannot do it

The MCP has no tool for workspace users, groups or security settings: these are settings the
person sets themselves. Send them to the one place:

- Invite a user: do this in the web app: **Workspace Settings > Users**, enter the email, choose
  the role, select **Send invite**. The invitee joins through the link in the email.
- Change a role, remove a user or revoke an invitation: **Workspace Settings > Users**.
- Create a group or change its members: **Workspace Settings > Groups**.
- Require MFA for every member: **Workspace Settings > Security & API keys** (Pro and Enterprise).
  Every member is signed out and sets up MFA at the next sign in.
- Single sign on (SSO) and user provisioning (SCIM): **Workspace Settings > SCIM & SSO**
  (Enterprise).
- The workspace API key: **Workspace Settings > Security & API keys**; a personal API key is in
  **User Settings**.
- See or change the plan: **Workspace Settings > General**, under **Pricing**.
- Turn on "Ask before every change", or turn off log access or Genie creation for AI apps: the
  **MCP** page in the sidebar, under **Settings**; workspace owners only.

## Rules

| Rule | Why |
| --- | --- |
| Confirm the workspace with `workspaces_list` before any change when the person has several | A change in the wrong workspace reaches the wrong team |
| Take user and group IDs only from `workspaces_get` | A guessed ID gives access to the wrong person or fails |
| Ask before giving `owner` on a Genie | An owner manages everyone's access to the Genie |
| Ask before removing anyone's access | The person loses the Genie at once |
| Never invite users, change roles or switch on MFA through a workaround; send the person to Workspace Settings | These are workspace security settings the person sets themselves |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| A write is refused for permission | The person is a Viewer in this workspace | `workspaces_get` to show the role; an Owner or Editor changes it in Workspace settings |
| A teammate does not get answers from a Genie in Slack | The teammate is not a workspace member, and the Genie answers members only | Invite them, or set **Who can use the Genie** to Public in **Access rights** |
| A colleague cannot change a Genie | They have no role on it, or only `operator` | `genies_access_save` with `editor`, after the person confirms |
| A colleague is missing from `workspaces_get` | They have not accepted the invitation | Ask them to open the invitation email, or invite them again in Workspace settings |
| All members were signed out | MFA was switched on for the workspace | Each member sets up MFA at the next sign in |
