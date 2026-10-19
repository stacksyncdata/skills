---
name: resource-skill
description: Template for a resource skill. Replace this with what the skill does for one Stacksync resource, in customer words. Use when you write this sentence, say which requests it answers, for example "Use when someone wants records kept equal between two apps, or a sync is failing."
license: Apache-2.0
metadata:
  version: "0.1.0"
  type: resource
  resource: "The one resource this skill covers, for example syncs"
  tools: "The MCP tools the steps use, separated by spaces"
  owner: "The team that owns the resource"
---

<!--
Copy this folder to skills/<your-skill-name>/ and set name to the same folder name.
Write for the person and their AI app: customer words only, no internal names.
Keep this file under 500 lines; put long material in references/ and examples/.
-->

## When to use

Which requests this skill answers, and which nearby requests belong to another skill.

## Before you build

What to read or check first: the connections the person needs, the access they need, and the
questions to ask them before changing anything.

## Steps

1. One numbered step per tool call, naming the tool and what to pass to it.
2. Create new things switched off, show the person the result, then switch them on.

## Rules

Rules for working on a live account: what needs the person's confirmation, what must never be
deleted, and limits to respect.

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| The message or symptom | The cause | The fix, tool by tool |

## Examples

Link each worked example kept in the examples/ folder next to this file, one file per example.
