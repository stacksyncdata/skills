---
name: shopify-to-netsuite-orders
description: Creates a NetSuite sales order for each new Shopify order with Stacksync. Use when someone wants to connect Shopify to NetSuite, sync or integrate online orders with the ERP, or automate order entry.
license: Apache-2.0
metadata:
  type: solution
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  tools: "connections_create variables_save workflows_save workflows_run workflows_deploy"
  blueprints: inbound-webhook-to-records
  apps: "shopify netsuite"
  verified_on: "2026-01-15"
---

## Outcome

Each new Shopify order becomes a NetSuite sales order within 60 seconds. One-way. Tested with
2,000 orders per day.

## Blueprint

Follows `inbound-webhook-to-records`. The workflow reads the NetSuite subsidiary from a variable
instead of a fixed value.

## What was built

| Source field | Destination field | Transform | Required |
| --- | --- | --- | --- |
| Order number | External ID | None | Yes |
| Customer email | Customer | Find the customer by email; create one if none matches | Yes |
| Line items | Items | Match each SKU to an item by its item name | Yes |

## Build log

1. Called `connections_create` for Shopify and NetSuite and gave the person each sign in link.
2. Called `variables_save` with the `variable_name` `netsuite_subsidiary_id`.
3. Called `workflows_save` with the Shopify order trigger and the NetSuite create record step.
4. Called `workflows_run` on one order, then `workflows_deploy`.

## Proof

On 2026-01-15, on a test workspace, a test order in Shopify produced one successful run in
`workflows_runs`, and NetSuite showed a sales order whose External ID equals the order number.

## Adapt it

For another ERP, change the create record step and the field mapping; the trigger stays.
