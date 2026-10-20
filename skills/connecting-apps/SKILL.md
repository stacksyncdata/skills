---
name: connecting-apps
description: Connects, reauthorizes, renames, shares and deletes Stacksync connections, lists the live tables and columns of a connected app, and explains network options (SSH tunnel, IP allowlist, private network setups) and app rate limits. Use when someone wants to connect an app or database to Stacksync, a connection needs reauthorization or has expired, a teammate cannot see a connection, a connection must be deleted, someone asks which tables or fields an app has, or a database sits behind a firewall or in a private network.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "connections"
  tools: "workspaces_list connections_list connections_get connections_create connections_update connections_delete connections_tables syncs_get syncs_save"
---

## When to use

Use this guide for anything about a connection: the signed in account of an app or database that
every sync, workflow, Genie and API proxy uses. It covers connecting, reauthorizing, renaming,
sharing, deleting, reading live tables, network access and rate limits.

Use `designing-two-way-syncs` to plan a sync on top of connections, and
`managing-workspace-access` for people and roles in the workspace.

## Why the person connects the app through a secure link

Every connection form asks for a secret: a password, an API key, a token, a client secret or an
OAuth sign in. `connections_create` never takes a secret. It returns a link to the **New
connection** form in the Stacksync web app, where the person enters it. The secret stays between
the person and Stacksync and never passes through the chat or the AI app. Never ask for a
password, key or token in the chat, even when the person offers one.

## Tools, in the order an agent uses them

1. `workspaces_list`: the workspace and its regions. A connection lives in one region,
   `besg` (Europe) or `usnv` (United States), and both connections of a sync must be in the same
   region.
2. `connections_list`: find an existing connection before creating one. Filter with `app_type`
   (such as HubSpot or postgres) or `search_query` (part of the name). Each result says
   `needs_reauthorization`.
3. `connections_create`: returns the link where the person connects the app. Pass `region` when
   the person wants their data processed in a region other than the workspace default. Give the
   link to the person, wait until they say they are done, then call `connections_list` to find
   the new connection.
4. `connections_get`: the connection, its sharing, and every sync, workflow, API proxy and task
   that uses it, with `can_delete`. Never returns credentials.
5. `connections_tables`: reads the app live. Without `table_names` it returns the tables; with 1
   to 10 `table_names` it returns their columns with type and whether each is read only. It also
   says `can_create_tables`. Use the exact names it returns in `syncs_save` and workflow steps.
6. `connections_update`: rename (`connection_name`, 3 to 63 letters, digits, spaces, `_` or `-`)
   or share (`is_shared_with_workspace`). It cannot change credentials.
7. `connections_delete`: deletes a connection nothing uses.

Writes run directly unless the workspace turned on "Ask before every change"; then the person
sees one preview card and selects **Accept**.

## Reauthorize a connection

A connection can expire after a period of inactivity, and some new app features need a new
authorization. When `connections_list` shows `needs_reauthorization`, or a sync or workflow fails
with an authentication error:

1. Call `connections_create` and give the person the link to the web app.
2. Tell them to open **Connections** in the sidebar, open the connection, and select
   **Reauthorize**, then follow the app's own sign in.
3. Call `connections_list` again and confirm `needs_reauthorization` is false.

Reauthorizing keeps the connection, so every sync and workflow using it keeps working. Creating a
second connection instead would leave them pointing at the expired one.

## Share a connection

A connection is private to the person who created it until it is shared with the workspace.
Teammates do not see a private connection in `connections_list` or in the web app. To let them
use it, call `connections_update` with `is_shared_with_workspace` set to true. Ask the person
first: sharing lets every workspace member with Editor or Owner role build on this account.

## Delete a connection

1. Call `connections_get`. When `can_delete` is false, show the person the list of syncs,
   workflows, API proxies and tasks that use it.
2. Stop there. Never delete or edit those resources to free the connection; the person decides
   what happens to each.
3. When nothing uses it and the person confirms, call `connections_delete`.

## Network options

Network access is set in the web app, on the connection form, never through the MCP. Explain the
options and send the person to the form from `connections_create`:

- **IP allowlist** (shown as **IP Whitelisting** on the connection form): the form lists one
  Stacksync IP address per region. Add it to the firewall before connecting, because Stacksync
  reads the app's schema while the connection is created.
- **SSH tunnel** through a jumpbox, for a database in a private subnet.
- **Private connections** (VPN tunneling, transit gateway, private link) and Zero-Trust Network
  Access: set up with Stacksync support at hello@stacksync.com.

Details and the order of work: [references/network-options.md](references/network-options.md).

## App rate limits

A rate limit is set per app inside a sync: the most API calls Stacksync makes to that app per
second, minute, hour or day. Read it with `syncs_get`, and change it with `syncs_save` in the
app's settings (`rate_limit` with `rate` and `frequency` in seconds: 1, 60, 3600 or 86400).

- Prefer a limit per second or per minute, such as 5 to 10 requests per second. An hourly or
  daily limit can leave changes waiting until the window resets.
- When the limit is reached, changes wait and sync once calls are available again; they do not
  fail.
- A changed limit takes up to 1 minute to apply.
- With no changes in either app, Stacksync makes almost no calls.

## Rules

| Rule | Why |
| --- | --- |
| Never ask for or accept a secret in the chat; use the link from `connections_create` | A secret in a chat leaves the person's control |
| Look for an existing connection with `connections_list` before creating one | Each extra connection to one account must be reauthorized and shared on its own |
| Reauthorize an expired connection; never replace it with a new one | Everything built on the old connection keeps pointing at it |
| Ask before sharing a connection with the workspace | Sharing lets teammates build on that account |
| Never delete or change resources to free a connection for deletion | Each of them belongs to a decision the person makes |
| Use table and column names exactly as `connections_tables` returns them | A guessed name fails at run time |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| A sync or workflow fails with an authentication error | The connection expired or lost its authorization | `connections_list`, then reauthorize (see above) |
| A teammate cannot find the connection | It is private to the person who created it | `connections_update` with `is_shared_with_workspace` true, after the owner agrees |
| The connection form cannot reach the database | The firewall blocks Stacksync, or the database is in a private subnet | Add the IP from the form before connecting, or use an SSH tunnel; see the reference |
| `connections_delete` is refused | A sync, workflow, API proxy or task still uses the connection | `connections_get`, show the list, and let the person decide |
| A table or column is missing from `connections_tables` | The account used for the connection cannot see it | Check that account's permissions in the app, then call `connections_tables` again |
| A sync cannot use two connections | A sync's connections must be in the same region | Create the connection in the sync's region with `connections_create` and `region` |
