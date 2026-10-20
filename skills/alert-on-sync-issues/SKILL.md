---
name: alert-on-sync-issues
description: Sends a team a message or email when a sync has failed records, through a sync webhook of type real_time_issue_notification that calls a workflow. Use when someone wants to be told about sync errors as they happen instead of checking the sync, or wants failed records routed to a channel, an inbox or a ticket.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs workflows"
  tools: "syncs_list syncs_get syncs_webhooks_save syncs_webhooks_delete syncs_issues connectors_list connectors_module_form workflows_save workflows_deploy workflows_runs"
  resources: "syncs workflows variables"
---

## Use it when

- A sync is live and a failed record must reach someone within minutes, not at the next check.
- 1 or more syncs feed business processes where a missing record costs money (orders, invoices).
- The team works in a chat channel, an inbox or a ticket tool the workflow can write to.

## Why this design

Advantages:
- The sync pushes each issue notification; nobody polls.
- A workflow formats the message and routes it, for example per table or per error.
- The sync webhook sends an API key with each call, so the workflow can check the sender.

Trade-offs:
- A burst of failures sends a burst of notifications; group them in the workflow or a queue.
- The key is never returned by any tool; changing the webhook means entering it again.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| A scheduled workflow that reads issues | Adds the interval as delay |
| Checking the sync's issues by hand | Depends on someone looking |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `workflows` | caller | Webhook trigger; its URL is copied from the web app |
| 2 | `variables` | `workflows` | The API key as a secret, checked against the incoming header |
| 3 | `syncs` | `workflows` | Sync webhook, type `real_time_issue_notification`, to the workflow URL |
| 4 | `workflows` | channel | Message, email or ticket step |

```
sync record fails -> sync webhook (real_time_issue_notification, api key)
  -> workflow webhook trigger -> check key -> message / email / ticket
```

## Build it

1. `workflows` "Create a workflow" with the webhook trigger, the key check and the message step;
   "Deploy a version". The person copies the URL from the trigger step.
2. `variables` "Create a secret" for the API key; the person enters the value in the web app.
3. `syncs` "Add, change or delete a sync webhook" with type `real_time_issue_notification`, the URL and the key.
4. Read a test failure: `syncs` "Read issues", then the run in `workflows` "Read runs".

## Variations

- Activity or backfill notices: the same pattern with `base_activity` or `backfill`.
- Many syncs: each sync gets its own webhook to the same workflow; include the sync name in the
  message.

## Check before going live

- Loops: the alert workflow must not write to an app in the same sync.
- Backfill: a first run with many bad records sends many notifications; switch the webhook on after
  the first run is clean.
- Rate limits: a chat tool limits messages per minute; group alerts above a few per minute.

## Rules

| Rule | Why |
| --- | --- |
| Use a public https URL that answers when the webhook is saved | The save is refused otherwise |
| Ask the person for the API key; never invent or repeat it | No tool returns it, and chat history is not a secret store |
| Resolve the cause with `troubleshooting-a-sync`, not by muting the alert | An alert that is ignored hides lost records |
