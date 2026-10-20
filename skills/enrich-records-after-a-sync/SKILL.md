---
name: enrich-records-after-a-sync
description: Adds missing company and contact data, such as industry, size, email or phone, to records that a sync creates or changes, using the built-in enrichment and validation steps, and writes the result back to the app. Use when someone wants new leads, contacts or accounts filled in or checked automatically after they reach an app or database.
license: Apache-2.0
metadata:
  type: blueprint
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "syncs queues workflows"
  tools: "syncs_get syncs_triggers_save queues_save connectors_list connectors_get connectors_module_form workflows_save workflows_deploy workflows_runs"
  resources: "syncs queues workflows connectors"
---

## Use it when

- New or changed records lack fields that public data can fill: company details, a work email, a
  phone number, or a check that an email or phone is valid.
- Records arrive at more than about 100 per hour, or in imports of 1,000 or more; below that, a
  per-record run (`react-to-each-record-change`) is enough.
- A delay of a few minutes before the fields appear is acceptable.

## Why this design

Advantages:
- Built-in steps need no connection or account: enrich a company or person, find an email or a
  phone, validate an email, validate a phone.
- The queue batches changes, so a 2,000-record import starts 2 runs at a batch size of 1,000.
- The write back goes through the app's own step, so the sync carries it to the other side.

Trade-offs:
- Each enrichment call is billed per record; an import of old records costs as many calls as it
  holds records.
- Not every record finds a match; empty results must not erase existing values.

Alternatives and why they lose:

| Alternative | Why it loses |
| --- | --- |
| Enrich inside the app with its own add-on | Needs a separate account per app and does not reach the synced database |
| A scheduled workflow over the whole table | Re-enriches records that did not change and pays for them again |
| One run per record | Fine below 100 per hour; above it the 20 concurrent runs per workflow fill up |

## Shape

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `syncs` | the app | The sync that reads the table of leads, contacts or accounts |
| 2 | `queues` | `syncs` | Sync event trigger type `queue`, operation `created` (and `updated` on the key fields) |
| 3 | `workflows` | `queues` | Queue trigger: one run per batch |
| 4 | `workflows` | `connectors` | Built-in enrichment and validation steps, one per record in a loop |
| 5 | `workflows` | the app | The app's update step writes only the enriched fields |

```
sync -> trigger (queue, created) -> queue -> workflow run [records]
  -> loop: enrich / validate -> update the record in the app
```

## Build it

1. `syncs` "Add, change, pause or delete a sync event trigger" with type `queue`, the table, `created`, and filters that
   skip records already filled (for example the industry field is empty).
2. `queues` "Create a queue" in the sync's region; a batch size of 100 to 1,000 suits most apps.
3. `connectors` "Show an app" to pick the enrichment and validation steps by what they do.
4. `workflows` "Create a workflow" with the queue trigger, "Add a step" for the loop, the
   enrichment step and the app's update step, then "Deploy a version".
5. Create one test record and read the run with `workflows` "Read runs".

## Variations

- Research beyond public company data: use the built-in AI steps (search the web, read a page,
  extract data) inside the loop.
- Enrich into a database instead: the update step writes to the synced database table and the
  sync carries it to the app.
- Validate only: use the validation steps and write a status field.

## Check before going live

- Loops: the write back changes the record, which fires the trigger again. Add every field the
  workflow writes to `columns_to_ignore`, and keep the "field is empty" filter.
- Backfill: a new sync copies all existing records and fires `created` for each. Add the trigger
  after the first copy, or confirm the enrichment cost of the whole table with the person.
- Rate limits: set the queue's flushes per time window under the app's write limit.

## Rules

| Rule | Why |
| --- | --- |
| Write only fields that came back with a value | An empty result must not erase data a person entered |
| Ask before enriching existing records in bulk | Each record is a billed call |
| Keep enriched fields separate from fields people edit | A person's edit and the enrichment then never overwrite each other |
