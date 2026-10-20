---
name: api-proxies
description: Lists, reads, creates, renames, shares, moves to another connection and deletes Stacksync managed API proxies, which give scripts and internal tools one HTTPS endpoint and one access token for the API of a connected Salesforce, HubSpot, Pipedrive, Attio or Airtable account. Use when someone wants to call one of those APIs from their own code without handling its sign in, needs an API proxy or its token, or a script calling an API proxy stopped working.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "api-proxies"
  tools: "api_proxies_list api_proxies_get api_proxies_save api_proxies_delete connections_list connections_create"
  resource: "api-proxies"
---

## What it is

An API proxy is a managed API over one connection. A script, backend service or internal tool
calls one Stacksync endpoint with one access token, and Stacksync forwards the request to the app
with the connection's sign in. The script never holds the app's credentials.

| App | Operations |
| --- | --- |
| Salesforce | Insert, upsert, update and delete records (up to 10,000 records per request for insert, update, delete and get), get records, SOQL query, describe the instance or an object, add a custom field, pass through, get the country list |
| HubSpot | Get records (up to 100 per request), add a custom field, pass through |
| Pipedrive | Pass through |
| Attio | Pass through |
| Airtable | Pass through |

Pass through sends any request to the app's API: the full app URL, the method and an optional
body.

## When to use it

- On-demand, low-volume reads and writes from the person's own code, such as admin actions or a
  button in an internal tool.
- Not for keeping large volumes of records equal between two apps: use `syncs`.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `connections` | An API proxy is bound to one connection of its app, in the same region | `api_proxies_save` |
| `internal-apps` | An internal app calls the proxy endpoint with the token kept in its deployment variables | |
| `folders` | An API proxy can sit in a folder | `folders_move` |
| `workflows` | No native link: a workflow uses the app's own steps with the connection, not the proxy | |

## Operations

### List API proxies

Use when looking for a proxy by name, or before creating one.

Tools: `api_proxies_list`

1. Call `api_proxies_list` with a `search_query` and `region` `all`.
2. Reuse an existing proxy for the same connection instead of creating a second one.

### Show an API proxy

Use when the person asks for a proxy's app, connection or sharing.

Tools: `api_proxies_get`

1. Call `api_proxies_get` with `api_proxy_id` and `region`.

### Create an API proxy

Use when the person's code needs one of the supported APIs.

Tools: `api_proxies_list`, `connections_list`, `connections_create`, `api_proxies_save`, `api_proxies_get`

1. Ask which app and account, what will call the proxy, and whether it is shared with the
   workspace or private.
2. Call `api_proxies_list`; reuse a match.
3. Call `connections_list` for the app's connection in the proxy's region. When it is missing,
   call `connections_create` and give the person the link. Never ask for a password or key in
   the chat.
4. Call `api_proxies_save` without `api_proxy_id`, with:
   - `api_proxy_name`: 3 to 63 letters, digits, spaces, `_` or `-`, starting with a letter,
     unique in its region
   - `connection_id` from `connections_list`
   - `region`: the connection's region, `besg` (Europe) or `usnv` (United States)
   - `is_shared_with_workspace` (default `true`) and `parent_folder_id` (empty: the root)
5. Call `api_proxies_get` and show the result.
6. Follow "Create the access token", then "Call the API proxy".

### Create the access token

Use when a new proxy needs its token, or a token is lost or exposed.

Tools: none; done in the web app.

1. Ask the person to open the API proxy in the web app and select **Regenerate Token**.
2. Ask them to store the token, which is shown once, in their own secret store.

The MCP has no tool for tokens, so a token never appears in the chat.

### Call the API proxy

Use when the person writes the code that calls the proxy.

Tools: none.

1. Give the endpoint of the proxy's region:
   - Europe: `https://eu.api-proxy.stacksync.com/`
   - United States: `https://us.api-proxy.stacksync.com/`
2. Give the call format:

```bash
curl -X GET \
  "https://eu.api-proxy.stacksync.com/v1/proxy/https://api.pipedrive.com/api/v2/deals" \
  -H "Authorization: Bearer YOUR_PROXY_TOKEN"
```

3. Ask the person to run a read call first, before any write.

### Change an API proxy

Use when the person wants a new name, other sharing, or another account of the same app.

Tools: `api_proxies_get`, `api_proxies_save`

1. Call `api_proxies_get` to read it.
2. Call `api_proxies_save` with `api_proxy_id`, `region` and `changes` holding only what changes:
   `api_proxy_name`, `is_shared_with_workspace`, or `connection_id` for another connection of
   the same app.

### Delete an API proxy

Use when no script needs the proxy.

Tools: `api_proxies_get`, `api_proxies_delete`

1. Call `api_proxies_get`, confirm the proxy by name, and say that every script using its token
   stops working.
2. After the person confirms, call `api_proxies_delete` with `api_proxy_id` and `region`.

## Defaults and limits

- Apps: Salesforce, HubSpot, Pipedrive, Attio and Airtable.
- `is_shared_with_workspace` defaults to `true`.
- The proxy and its connection are in the same region; each region has its own endpoint.
- Writes run directly unless the workspace turned on "Ask before every change"; then the person
  accepts the change, and only then is it done.

## Rules

| Rule | Why |
| --- | --- |
| Never ask for, show or store the access token in the chat; it is created in the web app | Anyone holding the token can call the app's API as the connection |
| Never ask for the app's password or key; use the link from `connections_create` | Secrets in a chat leave the person's control |
| Use the endpoint of the proxy's region | Each region has its own endpoint |
| Run a read call before the first write | A read confirms the token and the connection without changing data |
| Confirm by name before `api_proxies_delete` | Every script using its token stops working |
| Suggest a sync for large or continuous data movement | An API proxy is built for on-demand, low-volume calls |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| The app is not offered | API proxies cover Salesforce, HubSpot, Pipedrive, Attio and Airtable | Use a workflow or a sync for other apps |
| The name is refused | It breaks the name rule or is taken in the region | Use 3 to 63 letters, digits, spaces, `_` or `-`, starting with a letter, and a new name |
| The connection is refused | It is in another region, its app is not supported, or on a change it is for another app | `connections_list` in the proxy's region; create one with `connections_create` |
| Calls fail after the app account lost access | The connection needs reauthorization | Follow `connections`, "Reauthorize a connection" |
| Calls fail with an authorization error | The token is wrong, or the proxy was deleted | Check the proxy with `api_proxies_get`; ask the person to create a new token in the web app |
| A script stopped working after a delete | Deleting a proxy stops every call made with its token | Create a new proxy and token, and update the script |
