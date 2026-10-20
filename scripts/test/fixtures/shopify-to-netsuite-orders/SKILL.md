---
name: shopify-to-netsuite-orders
description: Syncs orders from Shopify to sales orders in NetSuite with Stacksync. Use when someone wants to connect Shopify to NetSuite, sync or integrate online orders with the ERP, or automate order entry.
license: Apache-2.0
metadata:
  type: usecase
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  source_app: shopify
  destination_app: netsuite
  objects: "orders → sales orders"
  direction: one-way
  resources: "workflow variable"
  trigger: webhook
  frequency: "within 60 seconds"
  volume_tested: "2,000 orders per day"
  verified_on: "2026-01-15"
---

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

| Source field | Destination field | Transform | Required |
| --- | --- | --- | --- |
| Order number | External ID | None | Yes |
| Customer email | Customer | Find the customer by email; create one if none matches | Yes |
| Line items | Items | Match each SKU to an item by its item name | Yes |
| Created at | Date | Convert to the subsidiary's time zone | Yes |

## Build steps

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

| What the person sees | Cause | Fix |
| --- | --- | --- |
| "Customer not found" on a run | The email matches no NetSuite customer | Check the step that creates a customer runs before the sales order step |
| The run fails with "Invalid item" | A Shopify SKU has no matching NetSuite item | Create the item in NetSuite, then replay the run with `workflows_replay` |

## Check it works

Place a test order in Shopify. Within 60 seconds, `workflows_runs` shows one successful run, and
NetSuite shows a sales order whose External ID equals the Shopify order number.

## Limits

- Refunds and cancellations do not reach NetSuite.
- Orders placed before the workflow was deployed are not copied.
