---
name: inbound-webhook-to-records
description: Receives HTTP calls from another system on a workflow's webhook URL and turns each call's body into records in an app. Use when a system can send webhooks or POST requests, such as form submissions, payment events or partner notifications, and each one should create or update records.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workflows"
  tools: "connectors_list connectors_get connectors_module_form workflows_save workflows_get workflows_deploy workflows_runs workflows_replay"
  resources: "workflows connectors queues"
---

## Use it when

- A system sends an HTTP call for each event: a form, a payment, a shipment update.
- Up to a few hundred calls per hour; each call starts one run.
- Each call's body is under 20 MB, the size the webhook accepts.

Above a few hundred per hour or into a rate limited app, add a queue (see Variations).

## Why this design

Advantages:
- The sender pushes the event the moment it happens; no polling delay.
- The run receives `body`, `headers` and `query_parameters`, so one workflow can check a signature
  header and route by event type.

Trade-offs:
- Runs only for events the sender sends; a missed call is not seen again unless the sender
  retries it.
- One run per call; at most 20 run at the same time per workflow, the rest wait.
- The webhook URL is shown only on the trigger step in the web app.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| A scheduled workflow that polls the system's API | Adds the interval as delay and spends calls when nothing changed |
| A sync of the system's tables | Needs a connector for the system; webhooks work for any sender that can POST |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `workflows` | the sender | Receive Webhook/HTTP events trigger, with its URL given to the sender |
| 2 | `workflows` | `variables` | A shared secret kept as a secret variable, checked against a header |
| 3 | `workflows` | the target app | Look up and create or update the record |

```
sender POST -> workflow webhook URL -> check header -> map body -> create or update in the app
```

## Build it

1. `workflows` "Create a workflow" with the webhook trigger; declare the expected body fields.
2. `variables` "Create a secret" for the shared key, if the sender signs or sends a key.
3. `connectors` "Show an app" for the target app; `workflows` "Add a step".
4. `workflows` "Deploy a version". The person copies the URL from the trigger step in the web app and adds it
   in the sender.
5. Send one test call and read the run with `workflows` "Read runs".

## Variations

- Bursts or a rate limited target: the workflow adds the body to a queue with the queue insert
  step, and a consumer workflow writes batches (`throttle-writes-with-a-queue`).
- Several event types on one URL: branch on a body field.

## Check before going live

- Loops: if the target app sends its own webhook to this URL on each write, filter out events the
  workflow caused.
- Backfill: only new events arrive; load existing data once with a sync or a one-time run.
- Rate limits: estimate calls per minute against the target app's limit.

## Rules

| Rule | Why |
| --- | --- |
| Check a shared key or signature before writing | The URL is reachable by anyone who has it |
| Upsert by the event's own id | Senders retry, and the same event can arrive twice |
| Never paste the key in the chat; keep it as a secret variable | Chat history is not a secret store |
