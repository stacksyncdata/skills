---
name: solution
description: Template for a solution, a real build between named apps, proven on a live workspace. Replace this with what the build does, in one sentence in the third person, for example "Creates a NetSuite sales order for each new Shopify order." Then add "Use when" with the requests that pick this skill and no other, for example "Use when someone wants Shopify orders entered in NetSuite automatically."
license: Apache-2.0
metadata:
  # Every value is one plain string. Replace each example value below.
  type: solution
  version: "1.0.0"
  # The GitHub team that keeps the solution current and runs it again each quarter.
  owner: "@stacksyncdata/ai-team"
  # The MCP tools the build used, separated by spaces. Real tool names only.
  tools: "connections_create workflows_save workflows_run workflows_deploy"
  # The published blueprints this build follows, separated by spaces.
  blueprints: "inbound-webhook-to-records"
  # The apps, as slugs from data/apps.json, separated by spaces. At least two.
  apps: "shopify netsuite"
  # The day of the last end to end run on a live workspace, as YYYY-MM-DD.
  verified_on: "2026-01-15"
---

<!--
Copy this folder, with evals/, to skills/<name>/ and set name to the same folder name, for
example shopify-orders-to-netsuite.
Keep the six sections below, exactly, in this order: CI checks them. Keep the body under 250
lines. evals/evals.json holds at least 3 test prompts with expected outcomes.
Follow STYLE.md, and delete every comment like this one before you open the pull request.
-->

## Outcome

What the person gets, with numbers: objects, direction, delay, volume tested.

## Blueprint

The published blueprint this build follows, named in backticks, such as
`inbound-webhook-to-records`, and where this build departs from it.

## What was built

Each resource that was created, with its settings, and the field mapping between the apps.

## Build log

1. One numbered step per tool call made on the live workspace, naming the tool and what was
   passed.

## Proof

The live run that proved it: the date, the workspace type (no customer name), the records sent,
and what each app showed.

## Adapt it

What to change for other apps, objects or volumes, and which blueprint steps that touches.
