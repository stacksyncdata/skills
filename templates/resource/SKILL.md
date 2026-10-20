---
name: resource
description: Template for a resource skill, which covers one Stacksync resource and every operation on it. Replace this with what the skill does, in one sentence in the third person, then "Use when" with the requests that pick this skill and no other, for example "Use when someone wants to create, change, pause or delete a queue, or see what is waiting in it."
license: Apache-2.0
metadata:
  # Every value is one plain string. Replace each example value below.
  type: resource
  version: "1.0.0"
  # The GitHub team that keeps the skill current.
  owner: "@stacksyncdata/ai-team"
  # Optional: space separated areas.
  areas: "workflows"
  # The MCP tools the operations use, separated by spaces. Real tool names only.
  tools: "queues_list queues_get queues_save"
  # The one Stacksync resource this skill covers.
  resource: "queue"
---

<!--
Copy this folder to skills/<name>/ and set name to the same folder name: the resource in the
plural, for example queues.
Keep the seven sections below, exactly, in this order: CI checks them. Keep the body under about
250 lines; move detail into references/<topic>.md and link it.
Follow STYLE.md, and delete every comment like this one before you open the pull request.
-->

## What it is

What the resource is and what it does for the person, in two or three sentences.

## When to use it

The requests this skill answers, and for each nearby request the skill that answers it instead,
named in backticks.

## Connects to

One row per other resource this one links to, naming that resource's skill in backticks. Add a
row for each link people expect that does not exist, starting with "No native link:".

| Resource | How they link | Tool |
| --- | --- | --- |
| `workflows` | A queue hands each batch to one consumer workflow | `queues_save` |

## Operations

One "###" block per operation, with a verb-first title. Cover every MCP tool of the resource,
and every operation only the web app does.

### Create a queue

Use when the person wants records collected and handed to a workflow in batches.

Tools: `queues_list`, `queues_save`

1. One numbered step per tool call, naming the tool and what to pass to it.
2. For an operation only the web app does, say where in the web app and why the MCP cannot.

## Defaults and limits

The product defaults and limits the person must know, with numbers.

## Rules

What needs the person's confirmation, what must never be deleted, and limits to respect, each
with the reason.

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| The message or symptom, in the words on their screen | The cause | The fix, tool by tool |
