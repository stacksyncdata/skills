---
name: organizing-resources
description: Finds any Stacksync resource by name across syncs, workflows, Genies, connections, variables, queues and API proxies, and organizes them in folders by creating, renaming, moving and deleting folders. Use when someone asks where a sync, workflow or Genie is, cannot find a resource, wants to tidy the workspace, group resources by team or project, move resources into a folder or back to the root, or delete a folder.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "folders"
  tools: "workspaces_list folders_list folders_save folders_move folders_delete"
---

## When to use

Use this guide to find a resource by name when the person does not know its type or ID, and to
keep the workspace in folders: create, rename, move into and out of, and delete.

A folder holds syncs, workflows, Genies, connections, variables, queues, API proxies and other
folders. Moving a resource into a folder changes only where it is listed; it keeps running as
before.

To change what a resource does, use the guide for that resource, such as
`designing-two-way-syncs` or `connecting-apps`.

## Find a resource by name

`folders_list` with `search_query` searches the names of every resource type at once, in
sub-folders too. It is the fastest way to answer "where is my Orders workflow".

1. Call `folders_list` with `search_query` set to part of the name, for example `orders`.
2. Each result gives the type, ID, name, status, region and the folder it is in.
3. To narrow the search, pass `resource_types`, for example `["workflow", "sync"]`. The values
   are `sync`, `workflow`, `genie`, `connection`, `workspace_variable`, `app_queue`,
   `api_proxy` and `folder`.
4. With no `region`, the search covers the workspace's default region. Pass `region` as `all` to
   search Europe and United States together.
5. Results come in pages of `limit` per type (50 by default). When `next_offset` is set, call
   again with `offset` set to it.

Then use the type's own tool (`syncs_get`, `workflows_get`, `genies_get` and so on) with the ID.

## Tools, in the order an agent uses them

1. `workspaces_list`: the workspace and its regions, when more than one workspace fits.
2. `folders_list`: with no `folder_id`, the folder tree and the root; with `folder_id`, that
   folder and what it holds.
3. `folders_save`: create a folder (`folder_name`, and `parent_folder_id` to nest it), or rename
   one (`folder_id`, `region`, new `folder_name`). `folder_resource_id` is an optional stable ID
   of lowercase letters, digits and `_`.
4. `folders_move`: move a list of resources, each with `resource_type`, `resource_id` and
   `region` from `folders_list`, into `folder_id`, or to the root when `folder_id` is empty.
5. `folders_delete`: delete an empty folder.

Writes run directly unless the workspace turned on "Ask before every change"; then the person
sees one preview card and selects **Accept**.

## Steps to organize a workspace

1. Call `folders_list` with no `folder_id` to read the current tree and what sits at the root.
2. Propose the folders and which resources go in each, as a table: folder, resource, type. Wait
   for the person to confirm.
3. Create each folder with `folders_save`. A folder lives in one region: it is created in its
   parent's region, or the workspace default at the root. Pass `region`,
   `besg` (Europe) or `usnv` (United States), to create it elsewhere.
4. Move the resources with `folders_move`, one call per destination folder.
5. Read the result: `folders_move` lists what moved and what did not, with the reason. Show both
   lists to the person.
6. Call `folders_list` on each new folder to confirm its contents.

To move a folder itself, pass it to `folders_move` with `resource_type` `folder`. A rename with
`folders_save` changes only the name.

In the web app, a folder is created from **All Resources > Create Resource > Folder**.

## Delete a folder

Only an empty folder can be deleted.

1. Call `folders_list` with the `folder_id` to see what it holds.
2. If it holds anything, ask the person where each resource goes: another folder or the root.
3. Move them with `folders_move`, then call `folders_delete`.

Deleting a folder never deletes the resources that were in it, because they must be moved out
first.

## Rules

| Rule | Why |
| --- | --- |
| Search with `folders_list` before saying a resource does not exist | It searches every type and sub-folder at once |
| Show the folder plan and wait for confirmation before moving anything | Teammates find resources by where they are listed |
| Ask where the contents go before emptying a folder | The person decides the new place of each resource |
| Keep a folder and its resources in the same region | A resource from another region is not moved into it |
| Use IDs and regions exactly as `folders_list` returns them | A guessed ID or region fails the move |

## Common problems and fixes

| What the person sees | Why it happens | What to do |
| --- | --- | --- |
| A resource is not found by name | It is in the other region, or the name is spelled differently | `folders_list` with `region` `all` and a shorter `search_query` |
| A resource did not move | It is in a different region from the folder, or already in that folder | Read the reason `folders_move` returns; create a folder in the resource's region |
| `folders_delete` is refused | The folder still holds resources or sub-folders | Move them out with `folders_move` after the person says where |
| A rename is refused | Another folder in the region has that name, or the name is too long | Choose another name |
| The list ends early | Results come in pages per type | Call `folders_list` again with `offset` set to `next_offset` |
