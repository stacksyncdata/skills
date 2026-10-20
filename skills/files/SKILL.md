---
name: files
description: Lists and reads the details of files stored in a Stacksync workspace (name, type, size, tags, region and what each file belongs to), such as knowledge base uploads, email attachments and files workflows or Genies wrote. Use when someone needs a file_id, looks for a file in the workspace, or asks where a file came from or how large it is.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "files knowledge-bases"
  tools: "files_list files_get knowledge_bases_get knowledge_bases_documents_add"
  resource: "files"
---

## What it is

A file is a document stored in a Stacksync workspace, in one region, `besg` (Europe) or `usnv`
(United States). Files come from:

- uploads on a knowledge base's page in the web app;
- attachments of emails sent to a workflow's email trigger;
- workflow steps that write files;
- attachments people send a Genie in email, Slack or Teams, and files a Genie makes while it
  works;
- Stacksync itself, while processing a knowledge base document (its parsed text and chunks).

Each file has a `file_id`, a name, a type, a size, tags, a region and what it belongs to (for a
knowledge base document, the knowledge base). The web app has no page that lists all files; a
file is shown where it is used, such as a knowledge base's page.

## When to use it

- Find the `file_id` to add a file to a knowledge base.
- Check a file's type, size or origin before using it.
- Answer where a file came from.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `knowledge-bases` | A document is made from one file of the knowledge base's region | `knowledge_bases_documents_add` |
| `workflows` | An email trigger stores each attachment as a file; file steps write files | `files_list` |
| `genies` | Attachments people send a Genie and files it makes are stored as files | `files_list` |

## Operations

### Find a file

Use when looking for a file or its `file_id`.

Tools: `files_list`

1. Call `files_list` with an optional `search_query` (part of the name) and `region` (`all` for
   both regions; without it the workspace's default region).
2. Files come newest first, up to 100 per region per page. When `next_cursor` is set, call again
   with `cursor` set to it and the same `region` and `search_query`.

### Show a file's details

Use when the person asks about one file: its type, size, tags or origin.

Tools: `files_get`

1. Call `files_get` with `file_id` and `region`, both from `files_list`, or the `file_id` of a
   document from `knowledge_bases_get` with the knowledge base's region.
2. It returns the file's details, never its content.

### Upload a file

Use when a document the person needs is not in `files_list`.

Tools: `knowledge_bases_get`

1. Uploading is done in the web app: open the knowledge base, upload the file on its page. The
   upload also adds it as a document. The MCP has no upload tool, because a file's bytes do not
   travel through a chat tool call.
2. Call `knowledge_bases_get` to check the new document's status.

### Read or download a file's content

Use when the person wants what is inside a file.

Tools: none; this is done in the web app.

1. The MCP cannot read or download a file's content: `files_get` returns details only.
2. The web app shows each file where it is used, such as a knowledge base's page. To have a
   Genie answer from a document's content, add it to a knowledge base (`knowledge-bases`).

## Defaults and limits

- Lists cover the workspace's default region unless `region` is set; `all` reads both.
- Up to 100 files per region per page, newest first.
- A cursor continues only the list it came from: same `region` and `search_query`.
- Read only: no upload, rename, tag, delete or content download through the MCP.

## Rules

| Rule | Why |
| --- | --- |
| Use a `file_id` from `files_list` or `knowledge_bases_get`; never guess one | A guessed id reads nothing or the wrong file |
| Look in the region of the knowledge base or workflow that uses the file | Each file belongs to one region |
| Send the person to the web app for uploads and content | The MCP has no tool for either |
| Do not add a file Stacksync made while processing a document to a knowledge base | It is refused; add the original file instead |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| The file is not listed | It was never uploaded, it is in the other region, or it is on a later page | Call `files_list` with `region` `all` and follow `next_cursor`; otherwise ask the person to upload it in the web app |
| A file is not found by id | Wrong region, or another workspace's file | Call `files_list` with `region` `all` and use the region it returns |
| The cursor is refused | It was passed with a different `region` than the list it came from | Pass the same `region`, or repeat the first call |
| The person asks for the text of a file | The MCP returns details only | Point the person to where the file is used in the web app, or add it to a knowledge base for a Genie |
