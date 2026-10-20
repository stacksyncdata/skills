---
name: managing-knowledge-bases
description: Creates, renames, shares and deletes Stacksync knowledge bases, the document collections Genies answer from, and adds or removes documents using files already in the workspace (PDF, Word, Excel, CSV, JSON, Markdown and text). Use when someone wants a Genie to answer from their own documents, policies, product catalogs or manuals, wants to add or remove a document, asks why a document failed to process, or looks for a file in the workspace.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "genies knowledge-bases"
  tools: "knowledge_bases_list knowledge_bases_get knowledge_bases_save knowledge_bases_delete knowledge_bases_documents_add knowledge_bases_documents_remove files_list files_get genies_list"
---

## What it is for

A knowledge base is a collection of documents that Genies answer from, such as a return policy,
a product catalog or a product manual. Each document comes from a file in the workspace. A knowledge
base belongs to one region, `besg` (Europe) or `usnv` (United States), and its files must be in the same
region.

Use this guide to create a knowledge base, add or remove documents, and find workspace files. To
connect a knowledge base to a Genie and say when the Genie uses it, use `building-genies`.

## Before you build

Ask the person:

1. Which Genie will answer from these documents? Its region is the region of the knowledge base.
2. Which documents, by name?
3. Should the knowledge base be shared with the whole workspace or kept private?

Then look up what exists:

1. `knowledge_bases_list`: add documents to an existing knowledge base with the same purpose
   instead of creating a second one.
2. `genies_list`: the region of the Genie that will use it.
3. `files_list` with `search_query`: the `file_id` of each document. Files are listed newest
   first, up to 100 per region; pass `cursor` from `next_cursor` for more.

**Uploading files is done in the web app.** The MCP has no upload tool. When a document is not
in `files_list`, ask the person to upload it to the workspace in the web app, in the region of
the knowledge base, then search again.

## Tools, in order

1. `knowledge_bases_save` without `knowledge_base_id`, with `name` (unique in its region), the
   `region` of the Genies that will use it, and `is_shared_with_workspace` (default `true`). It
   creates an empty knowledge base.
2. `knowledge_bases_documents_add` once per file, with `knowledge_base_id`, `region` and
   `file_id`. The answer gives the document and its processing status.
3. `knowledge_bases_get` with `knowledge_base_id` and `region`: each document's `document_id`,
   title, `file_id`, status and chunk count. A document whose status is failed shows why. Report
   to the person which documents are ready and which failed.
4. Connect it to the Genie with `building-genies`: the Genie's `knowledge_bases` entry takes the
   `knowledge_base_id` and instructions on when to use it.

To change a knowledge base, `knowledge_bases_save` with `knowledge_base_id`, `region` and only
what changes: `name` or `is_shared_with_workspace`.

To remove a document, `knowledge_bases_documents_remove` with `knowledge_base_id`, `region` and the
`document_id` from `knowledge_bases_get`. The file stays in the workspace.

To delete a knowledge base and all its documents, `knowledge_bases_delete` with
`knowledge_base_id` and `region`.

`files_get` with `file_id` and `region` gives one file's name, type, size, tags and what it
belongs to. It does not return the file's content.

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
sees one preview card for the change and selects Accept before it runs.

## Rules

| Rule | Why |
| --- | --- |
| Create the knowledge base in the region of the Genies that use it, and use files from that region | Knowledge bases and files belong to one region |
| Use a `file_id` from `files_list`; never guess one | A guessed id adds the wrong document or fails |
| Check each document's status with `knowledge_bases_get` after adding it | A failed document gives the Genie nothing to answer from |
| Confirm by name before `knowledge_bases_delete` | It deletes every document in the knowledge base; Genies using it lose those answers |
| Before removing a document, name the Genies that use the knowledge base | Their answers change at once |
| Ask the person to upload missing files in the web app | The MCP has no upload tool |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| The document is not in `files_list` | It was never uploaded, or it is in the other region | Ask the person to upload it in the web app, in the knowledge base's region; then `files_list` again |
| A document's status is failed | The file could not be processed; the status says why | Report the reason; ask for the file in a listed format (PDF, Word, Excel, CSV, JSON, Markdown, text) |
| The Genie does not use the documents | The knowledge base is not connected to the Genie, or its instructions do not say when to use it | Check the Genie with `building-genies`; add the knowledge base with clear instructions |
| The name is refused | Another knowledge base in the region has it | Choose another name |
| A knowledge base cannot be found by id | It is in another region | `knowledge_bases_list` without `region`, then use the region it returns |
