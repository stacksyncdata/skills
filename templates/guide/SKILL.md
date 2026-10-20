---
name: guide
description: Template for a guide, which covers one Stacksync resource, such as syncs, or one method, such as getting started. Replace this with what the guide does, in customer words, then "Use when" with the requests it answers, for example "Use when someone wants records kept equal between two apps, or a sync is failing."
license: Apache-2.0
metadata:
  # Every value is one plain string. Replace each example value below.
  type: guide
  version: "1.0.0"
  # The GitHub team that keeps the guide current.
  owner: "@stacksyncdata/ai-team"
  # Optional: the MCP tools the steps use, separated by spaces.
  tools: "syncs_list syncs_get"
---

<!--
Copy this folder to skills/<name>/ and set name to the same folder name.
Write for the person and their AI app: customer words only, no internal names.
Keep this file under 500 lines; put long material in references/ and helper files in scripts/.
Follow STYLE.md, and delete every comment like this one before you open the pull request.
-->

## When to use

Which requests this guide answers, and which nearby requests belong to another skill.

## Before you build

What to read or check first: the connections the person needs, the access they need, and the
questions to ask them before changing anything.

## Steps

1. One numbered step per tool call, naming the tool and what to pass to it.

## Rules

Rules for working on a live account: what needs the person's confirmation, what must never be
deleted, and limits to respect.

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| The message or symptom | The cause | The fix, tool by tool |
