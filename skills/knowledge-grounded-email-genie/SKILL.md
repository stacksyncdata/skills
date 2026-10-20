---
name: knowledge-grounded-email-genie
description: Sets up a genie with its own Stacksync email address that answers incoming emails from documents in a knowledge base and can look up or act on records through app actions, with approval on actions that change data. Use when someone wants an AI assistant that replies to customer, supplier or internal emails using company documents and app data.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "genies knowledge-bases files"
  tools: "knowledge_bases_list knowledge_bases_save knowledge_bases_documents_add files_list connections_list genies_draft genies_save genies_get genies_ask genies_activity genies_approve"
  resources: "genies knowledge-bases files connections"
---

## Use it when

- Emails ask questions that documents answer: policies, product sheets, price lists, procedures.
- Replies need judgement or wording, not fixed fields; for fixed records use
  `inbound-email-to-records`.
- Volume is 10 to 500 emails per day, and a reply within 5 minutes is fine.

## Why this design

Advantages:
- The knowledge base grounds answers in the company's own documents.
- App actions (skills) let the genie look records up, such as an order status, and act.
- `approval_required` on a skill pauses the genie until a person approves that action.

Trade-offs:
- Each email costs AI usage; long threads and large documents cost more.
- Answers depend on the documents: missing or outdated documents give wrong answers.
- A genie runs single app actions, never a whole workflow, and no workflow step calls a genie.

Alternatives and why they lose:

| Alternative | Why it loses for open questions |
| --- | --- |
| A workflow with an AI prompt step on each email | No knowledge base or conversation memory; every case must be built as a branch |
| A workflow on the Gmail trigger with fixed replies | Covers only the questions someone wrote replies for |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `files` | `knowledge-bases` | The documents, uploaded as files |
| 2 | `knowledge-bases` | `genies` | A knowledge base with the documents, attached with "when to use it" |
| 3 | `connections` | `genies` | Connections for each app action the genie may run |
| 4 | `genies` | email | The email channel: `<alias>@stacksync.email` |

```
sender -> <alias>@stacksync.email -> genie
  -> reads knowledge base, runs app actions (approval where set) -> reply
```

## Build it

1. `knowledge-bases` "Create a knowledge base" and "Add a document" from `files`.
2. `connections` "List connections" for each app the genie reads or writes.
3. `genies` "Create a Genie": draft it from a business description, check the alias is free, then
   save it with the drafted instructions, the email channel, the knowledge base and the skills; set `approval_required` on every skill that changes data.
4. Test with `genies` "Ask a Genie", then send a real test email; read `genies` "Check activity and cost".

## Variations

- Slack or Teams instead of email: add that channel with the workspace's connection.
- Several teams: one genie per team with its own knowledge base and alias.

## Check before going live

- Loops: replies to automated senders (no-reply, other bots) can bounce back and forth; tell the
  genie in its instructions to ignore automated mail.
- Backfill: the genie answers new emails only.
- Rate limits: app actions run per email; a busy inbox multiplies calls to the app.

## Rules

| Rule | Why |
| --- | --- |
| Set `approval_required` on actions that create, change or delete data | A wrong answer is fixable; a wrong write reaches a live app |
| Keep documents current and remove outdated ones | The genie answers from what the knowledge base holds |
| Pass the drafted instructions unchanged; change them with "Change a Genie's instructions" | The wizard keeps channels and skills consistent with the instructions |
