---
name: usecase
description: Template for an integration use case. Replace this with one sentence in the third person that follows the pattern "Syncs orders from Shopify to sales orders in NetSuite with Stacksync." and then "Use when", naming the words a person would type, for example "Use when someone wants to connect Shopify to NetSuite, sync or integrate online orders with the ERP, or automate order entry."
license: Apache-2.0
metadata:
  # Every value is one plain string. Replace each example value below.
  type: usecase
  version: "1.0.0"
  # The GitHub team that keeps the use case current and runs it again each quarter.
  owner: "@stacksyncdata/ai-team"
  # Slugs from data/apps.json.
  source_app: shopify
  destination_app: netsuite
  objects: "orders → sales orders"
  # one-way or two-way
  direction: one-way
  # Any of: sync workflow queue genie variable knowledge_base api_proxy, separated by spaces.
  resources: "workflow variable"
  # One of: change detection, webhook, schedule, email
  trigger: webhook
  frequency: "within 60 seconds"
  volume_tested: "2,000 orders per day"
  # The day of the last end to end run on a live workspace, as YYYY-MM-DD.
  verified_on: "2026-01-15"
  # Optional: the playbooks this use case applies, separated by spaces.
  # playbooks: "high-volume-changes-through-a-queue"
---

<!--
Copy this folder to skills/<name>/ and set name to the same folder name:
<source>-to-<destination>-<object> for one-way, for example shopify-to-netsuite-orders, or
<a>-and-<b>-<object>-two-way-sync for two-way, for example hubspot-and-salesforce-contacts-two-way-sync.
Keep the seven sections below, in this order, and keep the body under 200 lines.
Copy "Before you start" exactly as it is: CI compares it with templates/usecase/before-you-start.md.
Follow STYLE.md, and delete every comment like this one before you open the pull request.
-->

## Before you start

Check whether a tool from the Stacksync MCP server, such as `connections_list`, is available in
this conversation. If it is, the Stacksync MCP is already connected: skip to the next section.

If it is not, set it up once:

1. Ask the person to add `https://mcp.stacksync.com/mcp` as a connector or MCP server in their
   AI app. The steps for each app are in the README of github.com/stacksyncdata/skills.
2. The person signs in with their Stacksync account when the AI app asks. Sign in uses OAuth, so
   nobody creates or copies an API key.
3. Call `connections_list` to confirm the tools respond.

Then connect in Stacksync each app the build uses; for a use case, that is the source app and the
destination app. Call `connections_create` once per app. It returns a secure sign in link; give
the link to the person and wait until they say they have signed in. Never ask the person to paste
a password, token or API key into the chat.

## What this builds

<!--
One row per line, with the values from the metadata above. A reader decides from this table
alone whether the use case fits, so give numbers, not adjectives.
-->

| | |
| --- | --- |
| Source | Shopify |
| Destination | NetSuite |
| Objects | Orders → sales orders |
| Direction | One-way |
| Stacksync resources | Workflow, variable |
| Trigger | Webhook: Shopify sends each new order |
| Frequency | Within 60 seconds of the order |
| Volume tested | 2,000 orders per day |

## Field mapping

<!--
One row per field. Use the field names the person sees in each app. "Transform" says what
changes on the way, or "None". "Required" says whether the destination rejects the record
without it.
-->

| Source field | Destination field | Transform | Required |
| --- | --- | --- | --- |
| Order number | External ID | None | Yes |
| Customer email | Customer | Find the customer by email; create one if none matches | Yes |
| Line items | Items | Match each SKU to an item by its item name | Yes |
| Created at | Date | Convert to the subsidiary's time zone | Yes |

## Build steps

<!--
One numbered step per tool call. Name the MCP tool in backticks and say what to pass.
Build in this order: connections, then syncs and variables, then workflows and queues, then
genies. Everything is created switched off; the last steps test it and switch it on only after
the person confirms.
-->

1. Call `connections_list` and note the Shopify and NetSuite connections from "Before you
   start".
2. Call `variables_create` with the name `netsuite_subsidiary_id` and the subsidiary the person
   names, so the workflow reads it instead of a fixed value.
3. Call `connectors_module_form` for the Shopify order trigger and the NetSuite create record
   step, and fill each form from the field mapping above.
4. Call `workflows_create` with the trigger and steps from step 3. The workflow is created
   switched off.
5. Show the person the workflow and the field mapping, and ask them to confirm both.
6. Call `workflows_deploy` only after the person confirms.

## When something goes wrong

<!--
One row per problem a person has actually seen while running this use case. Write the first
column in the words on their screen.
-->

| What the person sees | Cause | Fix |
| --- | --- | --- |
| "Customer not found" on a run | The email matches no NetSuite customer | Check the step that creates a customer runs before the sales order step |
| The run fails with "Invalid item" | A Shopify SKU has no matching NetSuite item | Create the item in NetSuite, then replay the run with `workflows_replay` |

## Check it works

<!--
One test the person can watch, with the exact result and how long it takes.
-->

Place a test order in Shopify. Within 60 seconds, `workflows_runs` shows one successful run, and
NetSuite shows a sales order whose External ID equals the Shopify order number.

## Limits

<!--
What the use case does not do, so nobody assumes it does.
-->

- Refunds and cancellations do not reach NetSuite.
- Orders placed before the workflow was deployed are not copied.
