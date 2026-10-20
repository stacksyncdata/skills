---
name: using-api-proxies
description: Creates, renames, shares, reconnects and deletes Stacksync managed API proxies, which give scripts and internal tools one HTTPS endpoint and one access token for the API of a connected Salesforce, HubSpot, Pipedrive, Attio or Airtable account. Use when someone wants to call one of those APIs from their own code without handling its sign in or tokens, needs an API proxy for a connection, or a script calling an API proxy stopped working.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "api-proxies"
  tools: "api_proxies_list api_proxies_get api_proxies_save api_proxies_delete connections_list connections_create"
---

## What it is for

An API proxy is a managed API over one connection. A script, backend service or internal tool
calls one Stacksync endpoint with one access token, and Stacksync forwards the request to the app
with the connection's sign in. The script never holds the app's credentials.

Supported apps and their operations, from the API proxy docs:

| App | Operations |
| --- | --- |
| Salesforce | Insert, upsert, update and delete records (up to 10,000 per request for insert), get records, SOQL query, describe the instance or an object, add a custom field, pass through, get the country list |
| HubSpot | Get records (up to 100 per request), add a custom field, pass through |
| Pipedrive | Pass through |
| Attio | Pass through |
| Airtable | Pass through |

Pass through sends any request to the app's API: the full app URL, the method and an optional
body.

An API proxy fits on-demand, low-volume reads and writes, such as admin actions or a button in an
internal tool. To keep large volumes of records equal between two apps, use a sync instead
(`designing-two-way-syncs`).

## Before you build

Ask the person:

1. Which app, and which account of it?
2. What will call the proxy: a script, a backend service or an internal tool?
3. Should the proxy be shared with the workspace or kept private?

Then look up what exists:

1. `api_proxies_list`: reuse an existing proxy for the same connection instead of creating a
   second one.
2. `connections_list`: the connection of the app, in the region where the proxy will live. When
   it is missing, call `connections_create`, which returns a secure sign in link for the person.
   Never ask for a password or key in the chat.

## Tools, in order

1. `api_proxies_save` without `api_proxy_id`, with:
   - `api_proxy_name`: 3 to 63 letters, digits, spaces, `_` or `-`, starting with a letter,
     unique in its region
   - `connection_id` from `connections_list`, in the same region
   - `region`: the region of the connection, `besg` (Europe) or `usnv` (United States)
   - `is_shared_with_workspace` (default `true`) and `parent_folder_id` (empty: the root)
2. `api_proxies_get` with `api_proxy_id` and `region`: show the person the proxy's app,
   connection and sharing.
3. **Creating the access token is done in the web app.** The MCP has no tool for it, so the token
   never appears in the chat. Ask the person to open the API proxy in the web app, create the
   token there and store it in their own secret store.
4. Give the person the endpoint for their region and the call format:
   - Europe: `https://eu.api-proxy.stacksync.com/`
   - United States: `https://us.api-proxy.stacksync.com/`

```bash
curl -X GET \
  "https://eu.api-proxy.stacksync.com/v1/proxy/https://api.pipedrive.com/api/v2/deals" \
  -H "Authorization: Bearer YOUR_PROXY_TOKEN"
```

5. Ask the person to run a read call first, such as the one above, before any write.

To change a proxy, `api_proxies_save` with `api_proxy_id`, `region` and `changes` holding only
what changes: `api_proxy_name`, `is_shared_with_workspace`, or `connection_id` for another
connection of the same app.

To delete a proxy, `api_proxies_delete` with `api_proxy_id` and `region`.

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
sees one preview card for the change and selects Accept before it runs.

## Rules

| Rule | Why |
| --- | --- |
| Never ask for, show or store the access token in the chat; it is created in the web app | Anyone holding the token can call the app's API as the connection |
| Never ask for the app's password or key; use the link from `connections_create` | Secrets in a chat leave the person's control |
| Use the endpoint of the proxy's region | Each region has its own endpoint |
| Run a read call before the first write | A read confirms the token and the connection without changing data |
| Before `api_proxies_delete`, confirm by name and say that every script using its token stops working | The delete cannot be undone from the MCP |
| Suggest a sync for large or continuous data movement | An API proxy is built for on-demand, low-volume calls |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| The app is not offered | API proxies cover Salesforce, HubSpot, Pipedrive, Attio and Airtable | Use a workflow or a sync for other apps |
| The name is refused | It breaks the name rule or is taken in the region | Use 3 to 63 letters, digits, spaces, `_` or `-`, starting with a letter, and a new name |
| The connection is refused on create | It is in another region, or it is for another app | `connections_list` in the proxy's region; create one with `connections_create` |
| Calls fail after the app account changed | The connection lost access | Reconnect with `connections_create`, then `api_proxies_save` with `changes.connection_id` |
| Calls fail with an authorization error | The token is wrong, was replaced, or the proxy was deleted | Check the proxy with `api_proxies_get`; ask the person to create a new token in the web app |
| A script stopped working after a delete | Deleting a proxy stops every call made with its token | Create a new proxy and token, and update the script |
