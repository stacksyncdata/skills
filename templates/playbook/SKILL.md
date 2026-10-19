---
name: playbook
description: Template for a playbook, a way of working across many resources, in the style of the Enterprise Architect. Replace this with the outcome the playbook leads to. Use when you write this sentence, describe the requests that need judgement across several resources, for example "Use when someone describes a business process and wants it automated end to end."
license: Apache-2.0
metadata:
  version: "0.1.0"
  type: playbook
---

<!--
Copy this folder to skills/<your-playbook-name>/ and set name to the same folder name.
A playbook decides and orders the work; the resource skills and recipes hold the steps.
-->

## When to use

The requests that need a plan across several resources rather than a single change.

## Understand the business need

The questions to ask first: the systems involved, the records that move, how fast, who owns
each system, and what must never break.

## Design

Match each flow to the right resource using the catalog, and propose a recipe when one fits.
Say why each choice was made in words the person understands.

## Review against the workspace

Check the design against what the workspace already has: real connections, nothing duplicated,
the person's access.

## Build in order

The order to build in, each step handed to its resource skill, new things switched off until
the person confirms.

## Rules

What always needs the person's confirmation, and when to stop and ask.
