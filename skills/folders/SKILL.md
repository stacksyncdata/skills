---
name: folders
description: Finds any Stacksync resource by name across every type, and creates, renames, moves and deletes folders. Use when someone asks where a sync, workflow or Genie is, cannot find a resource, wants to tidy the workspace, group resources by team or project, move resources into a folder or back to the root, or delete a folder.
license: Apache-2.0
metadata:
  type: resource
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "folders"
  tools: "workspaces_list folders_list folders_save folders_move folders_delete"
  resource: "folders"
---

## What it is

A folder groups resources in a workspace: syncs, workflows, Genies, connections, variables,
queues, API proxies, knowledge bases and other folders. A folder lives in one region, `besg`
(Europe) or `usnv` (United States). Moving a resource into a folder changes only where it is
listed; it keeps running as before.

`folders_list` is also the search across every resource type.

## When to use it

- Find a resource by name when the person does not know its type or ID.
- Group resources by team, project or client.
- Move resources into a folder or back to the root.
- Rename or delete a folder.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `syncs`, `workflows`, `genies`, `connections`, `variables`, `queues`, `api-proxies`, `knowledge-bases` | Each can sit in a folder of its region; most create tools take `parent_folder_id` | `folders_move` |
| `workspaces` | Folders belong to one workspace and one of its regions | `workspaces_list` |

## Operations

### Find a resource by name

Use when the person asks "where is my Orders workflow" or says a resource is missing.

Tools: `folders_list`

1. Call `folders_list` with `search_query` set to part of the name, for example `orders`. It
   searches every type, in sub-folders too.
2. Narrow with `resource_types`: `sync`, `workflow`, `genie`, `connection`,
   `workspace_variable`, `app_queue`, `api_proxy`, `knowledge_base`, `folder`.
3. With no `region`, the search covers the workspace's default region. Pass `region` `all` to
   search both regions.
4. Each result gives the type, ID, name, status, region and folder. Results come in pages of
   `limit` per type (50 by default); when `next_offset` is set, call again with `offset`.
5. Read the resource with its own tool (`syncs_get`, `workflows_get`, `genies_get` and so on).

### Show the folder tree or a folder

Use when planning a reorganization, or the person asks what a folder holds.

Tools: `folders_list`

1. Call `folders_list` with no `folder_id`: the folder tree and what sits at the root.
2. Call it with `folder_id`: that folder and what it holds.

### Create or rename a folder

Use when the person wants a new folder or a new name.

Tools: `folders_save`

1. Create: `folder_name`, and `parent_folder_id` to nest it. A folder is created in its parent's
   region, or the workspace default at the root; pass `region` to create it elsewhere.
   `folder_resource_id` is an optional stable ID of lowercase letters, digits and `_`.
2. Rename: `folder_id`, `region` and the new `folder_name`. A rename changes only the name.

### Move resources

Use when the person wants resources in a folder, a folder inside another, or resources back at
the root.

Tools: `folders_list`, `folders_move`, `folders_list`

1. Call `folders_list` to read the current tree.
2. Propose the plan as a table (folder, resource, type) and wait for the person's yes.
3. Call `folders_move` with `resources` (each with `resource_type`, `resource_id` and `region`
   from `folders_list`) and `folder_id`, or no `folder_id` for the root. One call per
   destination, at most 200 resources per call. Pass a folder with `resource_type` `folder` to
   move the folder itself.
4. Read the answer: it lists what moved and what did not, with the reason. Show both lists.
5. Call `folders_list` on each destination to confirm.

### Delete a folder

Use when a folder is no longer needed.

Tools: `folders_list`, `folders_move`, `folders_delete`

Only an empty folder can be deleted.

1. Call `folders_list` with the `folder_id` to see what it holds.
2. If it holds anything, ask where each resource goes: another folder or the root.
3. Move them with `folders_move`, then call `folders_delete` with `folder_id` and `region`.

Deleting a folder never deletes resources, because they must be moved out first.

## Defaults and limits

- `limit` per type: 50 by default.
- `folders_move`: at most 200 resources per call.
- A resource moves only into a folder of its own region.
- Writes run directly unless the workspace turned on "Ask before every change"; then the person
  accepts the change, and only then is it done.

## Rules

| Rule | Why |
| --- | --- |
| Search with `folders_list` before saying a resource does not exist | It searches every type and sub-folder at once |
| Show the folder plan and wait for confirmation before moving anything | Teammates find resources by where they are listed |
| Ask where the contents go before emptying a folder | The person decides the new place of each resource |
| Keep a folder and its resources in the same region | A resource from another region is not moved into it |
| Use IDs and regions exactly as `folders_list` returns them | A guessed ID or region fails the move |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| A resource is not found by name | It is in the other region, or the name is spelled differently | `folders_list` with `region` `all` and a shorter `search_query` |
| A resource did not move | It is in a different region from the folder, or already in that folder | Read the reason `folders_move` returns; create a folder in the resource's region |
| `folders_delete` is refused | The folder still holds resources or sub-folders | Move them out with `folders_move` after the person says where |
| A rename is refused | Another folder in the region has that name, or the name is too long | Choose another name |
| The list ends early | Results come in pages per type | Call `folders_list` again with `offset` set to `next_offset` |
