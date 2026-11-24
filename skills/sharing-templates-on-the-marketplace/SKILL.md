---
name: sharing-templates-on-the-marketplace
description: Creates the workspace's partner profile on the Stacksync Marketplace (marketplace.stacksync.com) and shares the workspace's syncs, workflows and Genies there as templates other workspaces deploy, with a page, instructions an AI agent follows, and publishing. Use when someone wants to share or publish a template on the Stacksync Marketplace, create or edit their partner profile or its logo, or hide, update or delete a marketplace template.
license: Apache-2.0
metadata:
  type: runbook
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "marketplace"
  tools: "marketplace_profile_get marketplace_profile_save marketplace_profile_set_image marketplace_profile_publish marketplace_profile_delete marketplace_templates_list marketplace_templates_get marketplace_templates_save marketplace_templates_publish marketplace_templates_delete syncs_list syncs_get workflows_list workflows_get genies_list genies_get queues_list queues_get"
---

## Use it when

The person wants to share a sync, workflow, Genie or queue setup with other Stacksync users, to
create or change their partner profile on the Stacksync Marketplace, or to publish, hide, update
or delete a marketplace template. To build the resources themselves, use `syncs`, `workflows` or
`genies` first, then come back here to share them.

## Before you start

- One workspace has one partner profile, and every template belongs to it. Check the workspace
  with the person first: the profile shows under that workspace's name for good.
- Editors and owners change the profile and templates; only an owner deletes the profile. A
  viewer is refused, so say so instead of retrying.
- Nothing is public until published: a new profile is unlisted and a new template is a draft.
- Ask the person for: the company name, one sentence describing what they do, their website, and
  a public `https://` link to their logo (PNG, JPEG, WebP or SVG, at most 8 MB). The MCP copies
  images from a link; it cannot take a file from the chat.

## Steps

1. **Find the profile.** `marketplace_profile_get`. With a profile, show its name and whether it
   is listed, and skip to step 3 unless the person wants changes.
   Check: you know whether the workspace has a profile.
2. **Create the profile.** `marketplace_profile_save` with `document.name` and
   `document.description` (one or two sentences, at most 300 characters), and the fields the
   person gave: `website_url`, `category` (one of Implementation, Managed services, Referral,
   Resellers, Solution providers, Technology solutions), `connectors`, `industries`, `about`
   paragraphs. Pass `slug` only when the person asks for a specific address. Then
   `marketplace_profile_set_image` with `image_kind` `logo` (mark and wordmark) and `icon` (square mark).
   Check: `marketplace_profile_get` shows the name, description and logo.
3. **Pick what to share.** List the workspace's resources (`syncs_list`, `workflows_list`,
   `genies_list`, `queues_list`) and agree with the person which ones make one template. Read
   each with its `_get` tool: the apps, objects, field mappings, steps and settings are what the
   instructions describe.
   Check: the person confirmed the resources and the template's title.
4. **Write the page and the instructions.** Follow `references/template-content.md`: the page
   fields with their valid values, and the instructions an AI agent follows to rebuild the setup
   in another workspace. Show the person the description, the overview and the instructions, and
   remove anything they name as private.
   For a page with an architecture diagram, a chart, a table or an image, write a `body` as
   `references/rich-content.md` describes; it is checked before the person confirms.
   Check: the person approved the text, and it holds no credential, customer name or record value.
5. **Save the draft.** `marketplace_templates_save` without `template_slug`, with `document`
   holding `title`, `description`, `types`, `connectors`, and `instructions`, plus `industries`,
   `overview`, `body` and `deployed_resources` when written. A later change passes `template_slug` and only
   the fields that change. A 422 answer names the field and its valid values: fix that field and
   save again.
   Check: `marketplace_templates_get` with `include_instructions` true returns the template with
   `has_instructions` true.
6. **Publish.** `marketplace_templates_publish` with `is_published` true, then, when the profile is
   not listed, `marketplace_profile_publish` with `is_listed` true. Both run only when the person
   says to publish.
   Check: `marketplace_templates_list` shows the template as published at its public URL; give the
   person that link and the profile's `public_url`.

## Rules

- Publish only on the person's request: publishing shows the profile and template to everyone
  on marketplace.stacksync.com.
- Never put a password, API key, token, connection ID, workspace ID, customer name, email address
  or record value in a template: the page and the instructions are public. The person deploying
  connects their own apps.
- Change one field at a time when the person asks for one change: every save keeps the fields it
  does not send, so resending the whole profile risks overwriting a change made since.
- To take a template offline, unpublish it (`marketplace_templates_publish` with `is_published`
  false) rather than delete it: deleting cannot be undone. Deletes always ask the person first.
- Describe only what the template's resources do, with numbers the person can check, such as
  "every 5 minutes" or "one invoice per closed deal". The page is a listing, not an advertisement.

## When the MCP cannot do it

- Uploading a logo from the person's computer: the MCP copies images from a public `https://`
  link only; ask the person for a link to the file on their website.
- Joining the Stacksync partner program: the person applies at
  https://www.stacksync.com/partners/become-a-partner, because the program is not part of a workspace.
