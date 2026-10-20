---
name: api-proxy-for-an-app
description: Gives a script, an internal tool or a partner access to one app's API through a Stacksync API proxy bound to a connection, so callers use a proxy token and never hold the app's own credentials. Use when someone's code needs to call an app's API directly, and the app login should stay in Stacksync.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "api-proxies connections"
  tools: "connections_list connections_create api_proxies_list api_proxies_get api_proxies_save api_proxies_delete"
  resources: "api-proxies connections"
---

## Use it when

- Code outside Stacksync (a script, a backend, an internal app) calls one app's API.
- At least 2 callers or 1 outside party need access, and none should hold the app's login.
- The calls are ad hoc or request by request; for a steady copy of tables use a sync.

## Why this design

Advantages:
- The app's credentials stay in the connection; callers hold only a proxy token.
- A proxy is bound to one connection: switching the connection moves every caller at once.
- Deleting the proxy stops all its tokens at once.

Trade-offs:
- The token is shown once, in the web app; a lost token means generating a new one.
- One proxy reaches one app through one connection; another app needs another proxy.
- The caller still writes the app's API calls and handles its limits.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| Sharing the app's API key with each caller | Every caller holds the real key; revoking one means rotating it for all |
| A workflow with a webhook trigger per operation | One workflow per call type; fits fixed operations, not open API access |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `connections` | the app | The connection holding the app's login |
| 2 | `api-proxies` | `connections` | The proxy, bound to that connection, in the same region |
| 3 | `api-proxies` | callers | A token generated in the web app, given to the caller |

```
caller (proxy token) -> API proxy -> connection credentials -> app API
```

## Build it

1. `connections` "List connections" for the app, or "Connect an app" and give the person the
   link.
2. `api-proxies` "Create an API proxy" with the connection, in the connection's region.
3. The person generates the token in the web app on the proxy's page; it is shown once.
4. The caller sends a test call through the proxy; check the answer with the person.

## Variations

- Per-caller control: one proxy per caller, so deleting one cuts off only that caller.
- Private proxy: keep it unshared so only its creator sees it in the workspace.

## Check before going live

- Loops: writes through the proxy to an app read by a sync are carried on by the sync and can fire
  its triggers.
- Backfill: not applicable; the proxy copies nothing.
- Rate limits: proxy calls count against the app's API limit, shared with syncs and workflows on
  the same connection.

## Rules

| Rule | Why |
| --- | --- |
| Never put the token in the chat or in code repositories | Anyone holding it can call the app as the connection |
| Ask before deleting a proxy and name its callers | Every token of the proxy stops working at once |
| Use a connection with only the permissions the callers need | The proxy acts with the connection's rights |
