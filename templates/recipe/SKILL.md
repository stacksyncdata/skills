---
name: recipe
description: Template for a recipe, a whole integration proven on a real account. Replace this with the business outcome the recipe delivers and the systems it connects. Use when you write this sentence, describe the business situation it fits, for example "Use when online orders must reach the ERP within minutes."
license: Apache-2.0
metadata:
  version: "0.1.0"
  type: recipe
  systems: "The systems connected, separated by spaces, for example shopify netsuite"
  uses: "The skills this recipe builds with, separated by spaces"
  fits_when: "One sentence on the business need this recipe fits"
---

<!--
Copy this folder to recipes/<your-recipe-name>/ and set name to the same folder name.
Write for the person and their AI app: customer words only, no internal names.
-->

## The business problem

What the business needs, who feels the pain today, and how they will know it is solved.

## The design

The flows, which Stacksync resource carries each one (sync, workflow, queue, genie), and why.

## Build order

1. Each resource to create, in order, with the skill that builds it.
2. Test each one switched off on sample records before switching it on.

## Proven on

| Date | Workspace type | Result |
| --- | --- | --- |
| When it ran | The type of company and systems | What it delivered |
