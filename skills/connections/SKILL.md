---
name: connections
description: Lists, creates, reads, renames, shares, reauthorizes and deletes Stacksync connections, reads the live tables and columns of a connected app, and explains network options and app rate limits. Use when someone wants to connect an app or database, a connection expired or needs reauthorization, a teammate cannot see a connection, a connection must be deleted, someone asks which tables or fields an app has, or a database sits behind a firewall or in a private network.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "connections"
  tools: "workspaces_list connections_list connections_get connections_create connections_update connections_delete connections_tables syncs_get syncs_save"
  resource: "connections"
---

## What it is

A connection is the signed in account of one app or database. Every sync, workflow step, Genie
and API proxy that touches the app uses a connection. A connection lives in one region, `besg`
(Europe) or `usnv` (United States), and is either shared with the workspace or private to the
person who created it.

Every connection form asks for a secret: a password, an API key, a token or an OAuth sign in.
`connections_create` never takes a secret. It returns a link to the **New connection** form in
the web app, where the person enters it, so the secret never passes through the chat.

## When to use it

- Connect an app or database before building a sync, workflow, Genie or API proxy on it.
- Read the tables and columns an app exposes, with their exact names.
- Fix an expired connection, share it, rename it or delete it.
- Plan network access for a database behind a firewall or in a private network.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `syncs` | A sync uses two connections, both in the same region; its rate limit per app is set on the sync | `syncs_save` |
| `workflows` | An app step uses a connection of its app | `workflows_save` |
| `genies` | A Genie runs app actions with the workspace's connections | `genies_save` |
| `api-proxies` | An API proxy is bound to one connection, in the same region | `api_proxies_save` |
| `connectors` | The catalog says which apps exist and which connection each action needs | `connectors_get` |
| `folders` | A connection can sit in a folder | `folders_move` |
| `variables` | No native link: sign in to an app with a connection, never a secret variable, whenever the app has a connector | |

## Operations

### List connections

Use when looking for an existing connection before creating one, or checking which need
reauthorization.

Tools: `workspaces_list`, `connections_list`

1. Call `workspaces_list` when more than one workspace fits; ask which one.
2. Call `connections_list`. Filter with `app_type` (such as `hubspot` or `postgres`) or
   `search_query` (part of the name), and `region`.
3. Each result says `needs_reauthorization`. Reuse an existing connection to the same account.

### Show a connection

Use when the person needs a connection's page, its sharing, or what uses it.

Tools: `connections_get`

1. Call `connections_get` with the `connection_id` and its `region` from `connections_list`.
2. It returns the connection, its link in the web app, its sharing, and every sync, workflow,
   API proxy and task that uses it, with `can_delete`. It never returns credentials.

### Connect an app

Use when no connection to the account exists yet.

Tools: `connections_list`, `connections_create`, `connections_list`

1. Call `connections_list` first; reuse a match.
2. Call `connections_create`. Pass `region` when the data must live in a region other than the
   workspace default. Use the region of the sync or proxy that will use it.
3. Give the link to the person. They choose the app and sign in on the form.
4. Wait until they say they are done, then call `connections_list` to find the new connection.

Never ask for a password, key or token in the chat, even when the person offers one.

### Read tables and columns

Use when building a sync or a workflow step and the exact table or column names are needed.

Tools: `connections_tables`

1. Call `connections_tables` with the `connection_id` and no `table_names`: it returns the tables
   and says `can_create_tables`.
2. Call it again with 1 to 10 `table_names`: it returns their columns, each with its type and
   whether it is read only.
3. Use the names exactly as returned in `syncs_save` and in workflow steps.

It reads the app live, so it shows what the connection's account can see now.

### Rename or share a connection

Use when the person wants a new name, or a teammate cannot see a connection.

Tools: `connections_get`, `connections_update`

1. Call `connections_get` to read the current name and sharing.
2. Call `connections_update` with `connection_id`, `region`, and `connection_name` (3 to 63
   letters, digits, spaces, `_` or `-`) and/or `is_shared_with_workspace`.

A private connection is seen only by its creator: teammates do not see it in `connections_list`
or in the web app. Ask before sharing: sharing lets every workspace Editor and Owner build on that
account. `connections_update` cannot change credentials.

### Reauthorize a connection

Use when `connections_list` shows `needs_reauthorization`, or a sync or workflow fails with an
authentication error. A connection can expire after a period of inactivity, and some new app
features need a new authorization.

Tools: `connections_get`, `connections_list`

1. Call `connections_get` and give the person the link to the connection page.
2. Ask them to select **Reauthorize** there and follow the app's own sign in. This is done in the
   web app because it needs the app's sign in, which never passes through the MCP.
3. Call `connections_list` again and confirm `needs_reauthorization` is false.

Reauthorizing keeps the connection, so everything built on it keeps working. A second connection
would leave those resources pointing at the expired one.

### Set network access

Use when a database is behind a firewall or in a private subnet.

Tools: `connections_create`

Network access is set in the web app, on the connection form; the MCP has no tool for it.

1. Explain the options:
   - IP allowlist: a database's connection form lists the Stacksync IP addresses of each region.
     Add every address of the connection's region to the firewall before connecting, because
     Stacksync reads the schema while the connection is created.
   - SSH tunnel through a jumpbox, for a database in a private subnet.
   - Private connections (VPN tunneling, transit gateway, private link) and Zero-Trust Network
     Access: set up with Stacksync support at hello@stacksync.com.
2. Give the person the form link from `connections_create`.

Details and the order of work: [references/network-options.md](references/network-options.md).

### Set an app's rate limit

Use when an app reports too many requests from a sync.

Tools: `syncs_get`, `syncs_save`

A rate limit is set per app inside a sync: the most API calls Stacksync makes to that app per
second, minute, hour or day.

1. Read it with `syncs_get`.
2. Change it with `syncs_save` in the app's settings: `rate_limit` with `rate` and `frequency` in
   seconds (1, 60, 3600 or 86400).
3. Prefer a limit per second or per minute, such as 5 to 10 requests per second. An hourly or
   daily limit can leave changes waiting until the window resets.

When the limit is reached, changes wait and sync once calls are available again; they do not
fail. A changed limit takes up to 1 minute to apply.

### Delete a connection

Use when nothing uses a connection any more and the person wants it gone.

Tools: `connections_get`, `connections_delete`

1. Call `connections_get`. When `can_delete` is false, show the syncs, workflows, API proxies
   and tasks that use it. If the lists are empty, a workflow may still use the connection by its
   name; ask the person to check their workflows.
2. Stop there when anything uses it. Never delete or change those resources to free the
   connection; the person decides what happens to each.
3. When nothing uses it and the person confirms, call `connections_delete` with
   `connection_id` and `region`.

## Defaults and limits

- A connection created in the web app is shared with the workspace unless the person turns
  sharing off on the form.
- Name: 3 to 63 letters, digits, spaces, `_` or `-`.
- `connections_tables` reads columns of at most 10 tables per call.
- Both connections of a sync must be in the same region.
- Writes run directly unless the workspace turned on "Ask before every change"; then the person
  accepts the change, and only then is it done.

## Rules

| Rule | Why |
| --- | --- |
| Never ask for or accept a secret in the chat; use the link from `connections_create` | A secret in a chat leaves the person's control |
| Look for an existing connection with `connections_list` before creating one | Each extra connection to one account must be reauthorized and shared on its own |
| Reauthorize an expired connection; never replace it with a new one | Everything built on the old connection keeps pointing at it |
| Ask before sharing a connection with the workspace | Sharing lets teammates build on that account |
| Never delete or change resources to free a connection for deletion | Each of them belongs to a decision the person makes |
| Use table and column names exactly as `connections_tables` returns them | A guessed name fails at run time |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| A sync or workflow fails with an authentication error | The connection expired or lost its authorization | `connections_list`, then follow "Reauthorize a connection" |
| A teammate cannot find the connection | Its creator made it private | `connections_update` with `is_shared_with_workspace` true, after the creator agrees |
| The connection form cannot reach the database | The firewall blocks Stacksync, or the database is in a private subnet | Add the IP addresses from the form before connecting, or use an SSH tunnel |
| `connections_delete` is refused | A sync, workflow, API proxy or task still uses the connection | `connections_get`, show the list, and let the person decide |
| A table or column is missing from `connections_tables` | The connection's account cannot see it | Check that account's permissions in the app, then call `connections_tables` again |
| A sync cannot use two connections | They are in different regions | Create the connection in the sync's region with `connections_create` and `region` |
