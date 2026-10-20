---
name: operating-genies
description: Runs and watches Stacksync Genies: asks a Genie to do or answer something, passes the person's decision on an action the Genie paused on for approval, reads conversations, steps, errors and cost, and creates, pauses or deletes scheduled and one-time Genie tasks. Use when someone wants to ask or test a Genie, approve or reject a Genie action, see what a Genie did or what it cost, have a Genie do something every morning, every week or once at a set time, or find out why a Genie or its task failed.
license: Apache-2.0
metadata:
  type: guide
  version: "1.0.0"
  owner: "@stacksyncdata/ai-team"
  areas: "genies"
  tools: "genies_list genies_get genies_ask genies_approve genies_activity genies_tasks_list genies_tasks_save genies_tasks_delete connections_list connections_create"
---

## What it is for

Use this guide to work with a Genie that already exists: ask it something, decide on an action it
paused on, check what it did and what it cost, and give it tasks that run on a schedule or once.

To create a Genie or change its instructions, skills, interfaces or access, use
`building-genies`.

## Tools, in order

1. `genies_list`: find the Genie and its `genie_id` by name with `search_query`.
2. `genies_get`: check its skills, channels and status before asking it to act.

Then, depending on the request:

### Ask a Genie

1. `genies_ask` with `genie_id` and `message`, the request in plain words. The Genie may act in
   its apps. The call waits about 40 seconds.
2. Read `status`:
   - `completed`: show the person the answer.
   - `processing`: the Genie is still working. Open the conversation later with
     `genies_activity` and `conversation_id`.
   - `needs_input`: the Genie asks a question. Ask the person, then call `genies_ask` again with
     the same `conversation_id`.
   - `failed`: open the conversation with `genies_activity` to see the step that failed.
3. To continue the same conversation, pass its `conversation_id`. Without it, a new conversation
   starts.

### Decide on an approval

When `genies_ask` or `genies_activity` returns a `pending_approval`, the Genie is paused before an
action that needs a person's approval.

1. Show the person the action and its details from the approval, and ask them to approve or
   reject it. Never decide for them.
2. `genies_approve` with `approval_id`, the `region` given with the approval, and `decision`:
   `approve_once` runs the action, `reject` cancels it.
3. `genies_activity` with the `conversation_id` to follow what the Genie did next.

### Check activity and cost

`genies_activity` reads, step by step:

| Pass | Returns |
| --- | --- |
| Nothing, or `genie_id` | The conversations; `cursor` from `next_cursor` for the next page |
| `conversation_id` | Its messages and steps, with errors |
| `conversation_id` and `execution_log_id` | One tool run of a step |
| `conversation_id` and `browser_session_id` | One browser session |
| `genie_id` and `time_range_start` (ISO 8601), optional `time_range_end` | The Genie's log for that time, with the cost of each message and the total |

Give the person numbers: how many conversations, how many failed, and the total cost for the
period they asked about.

### Scheduled and one-time tasks

A task is an instruction the Genie runs by itself, once or on a schedule.

1. `genies_tasks_list` with `genie_id`: existing tasks, their schedule, next run and whether they
   are paused. Change an existing task instead of creating a second one with the same job.
2. Ask the person what the Genie should do each run, and when, in their own time zone.
3. Convert the time to UTC and state the conversion to the person, for example "8:00 in New York
   is 12:00 UTC in summer". Schedules are in UTC.
4. `genies_tasks_save` with `genie_id`, `name`, `instruction` and either:
   - `cron_expression` for a schedule, such as `0 8 * * 1-5` (08:00 UTC, Monday to Friday),
     with an optional `start_time`, or
   - `run_at` for one run at a future time, ISO 8601.
5. Show the person the saved task, including its next run.

To change a task, pass its `task_id` with only the fields that change. `is_paused` set to `true`
pauses it and `false` resumes it. To remove a task, `genies_tasks_delete` with `genie_id` and
`task_id`.

Writes run directly, unless the workspace turned on "Ask before every change". Then the person
sees one preview card for the change and selects Accept before it runs.

## Rules

| Rule | Why |
| --- | --- |
| Never approve or reject an action for the person | The action changes data in a live app; the person owns that decision |
| Show the instruction and the schedule in the person's time zone and in UTC before `genies_tasks_save` | Schedules are in UTC; a wrong offset runs the task at the wrong hour |
| Pause a task with `is_paused` when the person wants it stopped for a while; delete only on request | A paused task keeps its instruction and schedule |
| Tell the person when a message to `genies_ask` will change data in an app | The Genie acts in its apps with the workspace's connections |
| Report cost and failures as numbers from `genies_activity` | A number can be checked; a summary like "it went well" cannot |

## When a Genie failed: the process

Read the error text yourself: it names the cause, and new messages appear all the time. Follow
the steps in order. Steps 1 to 4 only read; nothing changes until step 6.

1. **Find the conversation.** `genies_list`, then `genies_activity` with `genie_id`. The
   conversation list has no failed or time filter: read each conversation's `status` and
   `last_activity_time`, and page with `cursor`. For a period, pass `time_range_start` (and
   `time_range_end`) with `genie_id` to read the log of that time. A scheduled task shows no last
   run result in `genies_tasks_list`: take its schedule from there and look for the conversation
   at that time.
2. **Open the logs.** `genies_activity` with the `conversation_id` gives its messages and steps,
   with errors. Add `execution_log_id` for one tool run's input and output, or
   `browser_session_id` for one browser session.
3. **Explain** the cause to the person in plain words: the failing step, what it was asked to do
   and what the app answered. Check the product rules below first.
4. **Suggest** the fix: a reworded request, a decision on a paused approval, a connection to sign
   in again, a task schedule to correct, or a change to the Genie's instructions or skills.
5. **Check before fixing.** Asking again runs the Genie's actions again, and an approval runs the
   action at once. Say which records the Genie already changed in the failed conversation, so it
   does not write them twice, and wait for the person's yes. Deleting a task or a Genie cannot be
   undone.
6. **Apply** the fix through a tool:
   - Ask again: `genies_ask`, with the same `conversation_id` to continue it.
   - A paused approval: `genies_approve` with the person's decision.
   - Lost access: `connections_list` shows `needs_reauthorization`; `connections_create` gives
     the sign in link for the person.
   - A task: `genies_tasks_save` with its `task_id`.
   - Instructions, skills or status: `building-genies`.
7. **Confirm** the fix worked: `genies_activity` with the new or continued `conversation_id`,
   and `genies_tasks_list` for the next run of a task.
8. **Contact Stacksync support** when the cause is on Stacksync's side, or a limit only
   Stacksync can change: a step that fails again with no cause in the request or the app. Stop
   asking again, and send the person to **Workspace Settings > General > Support Channels** with
   the Genie and `conversation_id`.

## Product rules the error text does not show

- **A Genie that seems stuck is often paused on an approval**; it waits for `genies_approve`.
- **Schedules run in UTC.** A task at the wrong hour was saved in local time.
- **An Inactive Genie** handles no new messages and its scheduled tasks are suspended; check the
  status with `genies_get`, and `is_paused` with `genies_tasks_list`.
- **A decided approval cannot be decided again**; `genies_activity` shows its status.
- **`genies_activity` is refused when "Allow log access" is off.** A workspace owner switches it
  on in the **MCP** page, under **Settings**.
- In the web app, **Genie conversations** in the sidebar shows the same conversations.
