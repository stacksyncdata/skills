---
name: troubleshooting-a-genie
description: "Finds why a Stacksync Genie or its scheduled task failed or seems stuck and fixes it in order: locate the conversation, read its steps and errors, explain the cause, suggest a fix, apply it after the person's yes, and confirm. Use when a Genie answered wrongly, failed, stopped responding, or a Genie task did not run or ran at the wrong time."
license: Apache-2.0
metadata:
  type: runbook
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "genies"
  tools: "genies_list genies_get genies_activity genies_ask genies_approve genies_tasks_list genies_tasks_save connections_list connections_get"
---

## Use it when

A Genie failed, gave a wrong answer, seems stuck, or a scheduled or one-time task did not run or
ran at the wrong hour. To ask a Genie, decide on an approval or schedule a task without a failure
to fix, use `genies`.

Read the error text yourself: it names the cause. This runbook gives the order;
[the product rules](references/product-rules.md) cover what the error text does not show.

## Before you start

- The Stacksync MCP is connected and the workspace is chosen (`getting-started`).
- "Allow log access" is on: `genies_activity` is refused otherwise. A workspace owner switches it
  on in the **MCP** page, under **Settings**.
- Steps 1 to 3 only read. Nothing changes before step 5, and only after the person says yes.

## Steps

1. **Locate the conversation.** Follow `genies` "Find a Genie" and "Check activity and cost":
   `genies_list` with `search_query` and `region` `all` gives the `genie_id` and `region`; pass
   that `region` to every later call. Then `genies_activity` with `genie_id`. The conversation list
   has no failed or time filter: read each conversation's `status` and `last_activity_time`, and
   page with `cursor`. For a period, pass `time_range_start` (and `time_range_end`) with
   `genie_id` to read the log of that time. A task shows no last run result in
   `genies_tasks_list`: take its schedule from there and look for the conversation at that time.
   Check: you hold one `conversation_id`, or you found no conversation at the task's run time.
2. **Read the logs.** `genies_activity` with the `conversation_id` gives its messages and steps,
   with errors. Add `execution_log_id` for one tool run's input and output, or
   `browser_session_id` for one browser session. Call `genies_get` for the Genie's status, skills
   and channels.
   Check: you know the failing step, what it was asked to do and what the app answered.
3. **Explain** the cause in plain words: the failing step, its request and the app's answer.
   Check [the product rules](references/product-rules.md) first.
   Check: the person agrees the cause matches what they see.
4. **Suggest** the fix: a reworded request, a decision on a paused approval, a connection to sign
   in again, a task schedule to correct, or a change to the Genie's instructions or skills. Asking
   again runs the Genie's actions again, and an approval runs the action at once: say which
   records the Genie already changed in the failed conversation, so it does not write them twice.
   Check: the person said yes to this fix.
5. **Apply** the fix:
   - Ask again: `genies` "Ask a Genie": `genies_ask`, with the same `conversation_id` to continue
     it.
   - A paused approval: `genies` "Decide on an approval": `genies_approve` with `approval_id`, the
     `region` given with the approval, and the person's `decision` (`approve_once` or `reject`).
     Never decide for the person.
   - Lost access: `connections` "Reauthorize a connection". `connections_list` shows
     `needs_reauthorization`; `connections_get` gives the link to that connection in the web app,
     where the person selects **Reauthorize**.
   - A task: `genies` "Schedule a task": `genies_tasks_save` with its `task_id` and only the
     fields that change. Schedules are in UTC: state the conversion from the person's time zone.
   - Instructions, skills or status: `genies` "Change skills, interfaces, knowledge bases, tools or status".

   Writes run directly unless the workspace turned on "Ask before every change"; then the person
   accepts the change first, and only then report it as done.
   Check: each call returned success, or the person accepted it.
6. **Confirm** the fix worked: `genies_activity` with the new or continued `conversation_id`, and
   `genies_tasks_list` for the next run of a task.
   Check: the conversation shows `completed` with the expected answer, or the task shows the
   right next run.
7. **Escalate** when the cause is on Stacksync's side or a limit only Stacksync can change: a step
   that fails again with no cause in the request or the app. Stop asking again and send the person
   to **Workspace Settings > General > Support Channels** with the Genie and `conversation_id`.
   Check: the person has the Genie name and `conversation_id` to send.

## Rules

| Rule | Why |
| --- | --- |
| Never approve or reject an action for the person | The action changes data in a live app; the person owns that decision |
| Read the conversation's steps before proposing a fix | The error names the cause; asking again blindly repeats the failure and its writes |
| Wait for the person's yes before every write in step 5 | Asking again and approving both act in live apps |
| Report failures and cost as numbers from `genies_activity` | A number can be checked; a summary cannot |

## When the MCP cannot do it

The person can read the same conversations in the web app: **Genie conversations** in the
sidebar. Deleting a task or a Genie cannot be undone; do it only on the person's request, through
`genies`.
