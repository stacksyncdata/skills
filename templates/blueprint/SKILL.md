---
name: blueprint
description: Template for a blueprint, a reusable design that combines two or more Stacksync resources, whatever the apps. Replace this with what the design does, in one sentence in the third person, then "Use when" with the requests that pick this skill and no other, for example "Use when a sync changes more records than a workflow can process one by one."
license: Apache-2.0
metadata:
  # Every value is one plain string. Replace each example value below.
  type: blueprint
  version: "1.0.0"
  # The GitHub team that keeps the blueprint current.
  owner: "@stacksyncdata/ai-team"
  # Optional: space separated areas.
  areas: "syncs workflows"
  # The MCP tools the build uses, separated by spaces. Real tool names only.
  tools: "syncs_triggers_save queues_save workflows_save"
  # The published resource skills it combines, at least two, separated by spaces.
  resources: "syncs queues workflows"
---

<!--
Copy this folder to skills/<name>/ and set name to the same folder name: what the design does,
for example batch-sync-changes-through-a-queue. A blueprint names no apps.
Keep the seven sections below, exactly, in this order: CI checks them. Keep the body under about
250 lines.
Follow STYLE.md, and delete every comment like this one before you open the pull request.
-->

## Use it when

The situation that calls for this design, with at least one number, for example "a sync changes
more than 1,000 records per hour". CI checks for the number.

## Why this design

The advantages, the trade-offs, and each alternative with why it loses here.

## Shape

One row per step, naming each resource by its skill in backticks, then the same shape as a text
diagram.

| Step | Resource | Links to | How |
| --- | --- | --- | --- |
| 1 | `syncs` | `queues` | A sync event trigger of type queue adds one row per changed record |
| 2 | `queues` | `workflows` | The queue flushes each batch to its consumer workflow |
| 3 | `workflows` | | The workflow processes the whole batch in one run |

```
sync -> queue -> workflow
```

## Build it

1. Name the resource skill and the "###" operation to follow, for example: follow `queues`,
   "Create a queue". Do not copy the operation's steps.

## Variations

The common changes to the design and what each changes in the build.

## Check before going live

What to confirm, with the tool that shows it, before the person relies on the build.

## Rules

What the design must never do, and the limits to respect, each with the reason.
