---
name: inbound-email-to-records
description: Turns incoming emails, such as orders, invoices or requests, into records in an app, through a workflow started by a new email in the person's own Gmail mailbox or by an email sent to a Stacksync address. Use when someone wants emails or their attachments read and turned into records, tickets or rows automatically.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "workflows connections files"
  tools: "connections_list connections_create connectors_list connectors_get connectors_module_form workflows_save workflows_get workflows_deploy workflows_runs workflows_replay files_get"
  resources: "workflows connections connectors files"
---

## Use it when

- Records arrive as emails: purchase orders, invoices, leads, support requests.
- Volume is up to 300 emails per hour; each email starts one run, at most 20 at the same time.
- A record should exist within 1 minute of the email arriving.

## Why this design

Advantages:
- One run per email: the run holds the sender, subject, body and attachments, and a failed run
  names the email.
- The built-in AI steps read free text and attachments into fields, so no fixed email format is
  needed.

Trade-offs:
- Senders write in many formats; the extraction step needs clear field instructions and a check
  for empty values.
- A failed run is not retried on its own; replay it.

Two ways to receive the emails:

| Way | Use when | Note |
| --- | --- | --- |
| Gmail trigger | The emails arrive in the person's own Gmail mailbox | Needs a Gmail connection; starts on each new email in that mailbox |
| Receive emails | The emails can be sent or forwarded to a Stacksync address on `@stacksync.email` | No connection; each trigger step has its own address and an optional alias of at least 3 characters |

The catalog has no trigger for other mailboxes: forward those emails to a Stacksync address.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| A scheduled workflow that searches the mailbox | Adds the schedule interval as delay and needs its own "already handled" tracking |
| A genie with an email address (`knowledge-grounded-email-genie`) | Fits replies to people; for fixed records a workflow is predictable and cheaper per email |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `connections` | Gmail | Only for the Gmail trigger |
| 2 | `workflows` | email | Gmail trigger or Receive emails trigger |
| 3 | `workflows` | `connectors` | Built-in AI extract step turns text and attachments into fields |
| 4 | `files` | `workflows` | Attachments are stored as files, each with a `file_id` later steps read |
| 5 | `workflows` | the target app | Create or update step writes the record |

```
email -> Gmail trigger (own mailbox) | Receive emails (Stacksync address)
  -> extract fields -> look up existing record -> create or update in the app
  -> optional: reply or forward with the built-in email steps
```

## Build it

1. Gmail: `connections` "List connections" for Gmail, or "Connect an app" and give the person
   the link.
2. `workflows` "Create a workflow" and "Add a trigger": the Gmail trigger, or Receive emails with
   an alias the person chooses (check it is free first).
3. `connectors` "Show an app" for the extraction step and the target app's create or update
   step; `workflows` "Add a step" for each.
4. `workflows` "Deploy a version". Send one test email and read the run with `workflows` "Read runs".

## Variations

- Confirm to the sender: add the built-in reply step at the end.
- Many record types: add a branch on the subject or the extracted type.
- High volume: add the queue insert step after extraction and write in batches with
  `throttle-writes-with-a-queue`.

## Check before going live

- Loops: a reply sent to an address the trigger watches starts a new run. Filter out emails from
  the workflow's own address.
- Backfill: the Gmail trigger starts on new emails; older emails are not processed.
- Rate limits: an email storm starts one run per email, at most 20 at a time per workflow; queue
  the writes if the target app limits calls.

## Rules

| Rule | Why |
| --- | --- |
| Look up the record by a key (order number, invoice number) before creating it | The same email can arrive twice, or a run can be replayed |
| Check required extracted fields and stop the run when one is empty | A record built from a guess is worse than a failed run |
| Ask the person for the alias; never invent one | Senders must be told the address |
