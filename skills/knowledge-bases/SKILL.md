---
name: knowledge-bases
description: Creates, renames, shares and deletes Stacksync knowledge bases, the document collections Genies answer from, and adds or removes their documents from workspace files (PDF, Word .docx, Excel .xlsx, CSV, JSON, Markdown and plain text). Use when someone wants a Genie to answer from their own policies, catalogs or manuals, wants to add or remove a knowledge base document, or asks why a document failed to process.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "genies knowledge-bases"
  tools: "knowledge_bases_list knowledge_bases_get knowledge_bases_save knowledge_bases_delete knowledge_bases_documents_add knowledge_bases_documents_remove files_list genies_list genies_get genies_save folders_move"
  resource: "knowledge-bases"
---

## What it is

A knowledge base is a collection of documents that Genies answer from, such as a return policy,
a product catalog or a manual. Each document is made from one file of the workspace. Stacksync
reads the file, splits it into chunks and indexes them; a document is ready once its processing
status says so.

A knowledge base lives in one region, `besg` (Europe) or `usnv` (United States). Its files are
in the same region, and only Genies of that region can use it. It is shared with the workspace
or private to the person who created it.

When a Genie handles a message, it searches its knowledge bases for the passages that match the
request and answers from them, following the instructions its `knowledge_bases` entry gives for
each knowledge base.

## When to use it

- A Genie must answer from the company's own documents: policies, price lists, product
  manuals, FAQs.
- A document changed and the Genie must answer from the new version: remove the old document
  and add the new file.
- For records that change every minute, such as orders or stock levels, give the Genie a skill
  that reads the app (`genies`) instead: a document holds the text of one moment.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `genies` | A Genie's `knowledge_bases` entry names the knowledge base and when to use it; same region | `genies_save` |
| `files` | Each document is made from one workspace file of the same region | `knowledge_bases_documents_add` |
| `folders` | A knowledge base can sit in a folder | `folders_move` |

## Operations

### Find a knowledge base

Use when looking for an existing knowledge base or its `knowledge_base_id` and `region`.

Tools: `knowledge_bases_list`

1. Call `knowledge_bases_list` with `region` `all` and an optional `search_query` (part of the
   name).
2. Each result gives `knowledge_base_id`, name, region, sharing and folder. Add documents to an
   existing knowledge base with the same purpose instead of creating a second one.

### Show a knowledge base and its documents

Use when checking which documents a knowledge base holds and whether they are ready.

Tools: `knowledge_bases_get`

1. Call `knowledge_bases_get` with `knowledge_base_id` and `region`.
2. Each document gives `document_id`, title, `file_id`, processing status, the reason when it
   failed, and its chunk count. Tell the person which documents are ready and which failed.

### Create a knowledge base

Use when the person wants a Genie to answer from documents and no fitting knowledge base exists.

Tools: `genies_list`, `knowledge_bases_list`, `knowledge_bases_save`

1. Ask which Genie will use it, which documents, and whether the whole workspace may use it.
2. Call `genies_list` with `region` `all` for that Genie's region.
3. Call `knowledge_bases_list` with `region` `all` to check that none already has this purpose.
4. Call `knowledge_bases_save` without `knowledge_base_id`, with `name` (unique in its region),
   the Genie's `region`, `is_shared_with_workspace` (default `true`) and an optional
   `folder_id`. It creates an empty knowledge base.
5. Follow **Add a document**, then connect it to the Genie with **Use a knowledge base in a
   Genie**.

### Add a document

Use when a file should become part of a knowledge base.

Tools: `files_list`, `knowledge_bases_documents_add`, `knowledge_bases_get`

1. Call `files_list` with `search_query` and the knowledge base's `region` for the `file_id`.
2. When the file is not listed, it was never uploaded or is in the other region. Ask the person
   to upload it on the knowledge base's page in the web app, which also adds it as a document;
   the MCP has no upload tool. Then skip to step 4.
3. Call `knowledge_bases_documents_add` with `knowledge_base_id`, `region` and `file_id`, once
   per file. It returns the document and its processing status.
4. Call `knowledge_bases_get` and report each document's status.

Refused files: a type other than PDF, Word (.docx), Excel (.xlsx), CSV, JSON, Markdown or plain
text; a file Stacksync made while processing another document; a file that is already a
document of this knowledge base; any file for a knowledge base filled from a connected source.

### Remove a document

Use when a document is outdated or wrong.

Tools: `genies_list`, `genies_get`, `knowledge_bases_get`, `knowledge_bases_documents_remove`

1. Take the `document_id` from `knowledge_bases_get`.
2. Check the Genies that use the knowledge base with `genies_get` and name them: their answers
   change at once.
3. After the person's yes, call `knowledge_bases_documents_remove` with `knowledge_base_id`,
   `region` and `document_id`. The file stays in the workspace.

### Rename or share a knowledge base

Use when changing the name or who may use it.

Tools: `knowledge_bases_save`

1. Call `knowledge_bases_save` with `knowledge_base_id`, `region` and only what changes: `name`
   or `is_shared_with_workspace`.

### Move a knowledge base to a folder

Use when organizing knowledge bases.

Tools: `folders_move`

1. Follow `folders`, **Move resources**. The `folder_id` on `knowledge_bases_save` applies only
   to a new knowledge base.

### Use a knowledge base in a Genie

Use when a Genie should answer from a knowledge base, or stop using one.

Tools: `genies_get`, `genies_save`

1. Call `genies_get` for the Genie's current `knowledge_bases` list.
2. Call `genies_save` with `genie_id` and the complete new `knowledge_bases` list: each entry has
   `knowledge_base_id` and `instructions` in plain words, such as "Use for questions about
   returns and refunds". The list you send replaces the stored list. See `genies`.

### Delete a knowledge base

Use when the knowledge base is no longer needed.

Tools: `knowledge_bases_get`, `knowledge_bases_delete`

1. Call `knowledge_bases_get` and name it and its documents to the person, with the Genies that
   use it.
2. After the person confirms by name, call `knowledge_bases_delete` with `knowledge_base_id` and
   `region`. Every document is deleted and Genies using it lose that knowledge; it cannot be
   undone.

## Defaults and limits

- A new knowledge base is shared with the workspace unless `is_shared_with_workspace` is
  `false`, and is created in the workspace's default region unless `region` is set.
- Names are unique per region.
- Document types: PDF, Word (.docx), Excel (.xlsx), CSV, JSON, Markdown and plain text.
- Files are uploaded only in the web app.
- Writes run directly, unless the workspace turned on "Ask before every change". Then the person
  accepts the change and only then is it done.

## Rules

| Rule | Why |
| --- | --- |
| Create the knowledge base in the region of the Genies that use it, with files from that region | Knowledge bases, files and Genies belong to one region |
| Use a `file_id` from `files_list`; never guess one | A guessed id adds the wrong document or fails |
| Check every document's status with `knowledge_bases_get` after adding it | A failed document gives the Genie nothing to answer from |
| Give each knowledge base clear `instructions` in the Genie | The Genie decides when to use it from those words |
| Name the Genies that use a knowledge base before removing a document or deleting it | Their answers change at once |
| Confirm by name before `knowledge_bases_delete` | It deletes every document and cannot be undone |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| The file is not in `files_list` | It was never uploaded, or it is in the other region | Ask the person to upload it on the knowledge base's page in the web app; then `knowledge_bases_get` |
| A document's status is failed | The file could not be processed; the status says why | Report the reason; ask for the file in a listed type |
| "Unsupported File Type" | The file is not one of the listed types | Ask for a PDF, Word, Excel, CSV, JSON, Markdown or text version |
| "Already Added" | The file is already a document of this knowledge base | Nothing to add; to refresh it, remove the document and upload the new version |
| The knowledge base takes no files | It is filled from a connected source | Add the file to another knowledge base |
| The Genie does not use the documents | The knowledge base is not in the Genie's list, or its instructions do not say when to use it | Follow **Use a knowledge base in a Genie** |
| The name is refused | Another knowledge base in the region has it | Choose another name |
| A knowledge base cannot be found by id | It is in the other region | `knowledge_bases_list` with `region` `all`, then use the region it returns |
