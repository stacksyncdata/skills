---
name: runbook
description: Template for a runbook, an ordered procedure with checks across Stacksync resources, such as troubleshooting, migrating, onboarding or building a connector. Replace this with what the procedure does, in one sentence in the third person, then "Use when" with the requests that pick this skill and no other, for example "Use when someone says records are not syncing or a sync shows errors."
license: Apache-2.0
metadata:
  # Every value is one plain string. Replace each example value below.
  type: runbook
  version: "1.0.0"
  # The GitHub team that keeps the runbook current.
  owner: "@stacksyncdata/ai-team"
  # Optional: space separated areas.
  areas: "syncs"
  # The MCP tools the steps use, separated by spaces. Real tool names only.
  tools: "syncs_list syncs_issues"
---

<!--
Copy this folder to skills/<name>/ and set name to the same folder name, for example
troubleshooting-a-sync.
Keep the five sections below, exactly, in this order: CI checks them. Keep the body under about
250 lines.
A troubleshooting runbook follows: locate, read logs, explain, suggest, apply after the person's
yes, confirm. It teaches that order, never a catalog of error messages.
Follow STYLE.md, and delete every comment like this one before you open the pull request.
-->

## Use it when

The requests that start this procedure, and the skill to read for each nearby request instead,
named in backticks.

## Before you start

What must be true first: the MCP connected, the connections, the access, and the questions to
ask the person.

## Steps

1. One numbered step, naming the resource skill and its operation, or the tool and what to pass.
   Check: what to confirm before the next step.

## Rules

What needs the person's confirmation and what must never happen, each with the reason.

## When the MCP cannot do it

Each step only the web app does, as one line: where in the web app, and why the MCP cannot.
