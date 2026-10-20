# What genies_activity returns

The arguments decide what `genies_activity` reads. Pass the `region` of the Genie or the conversation, or `all` for a list.

| Pass | Returns |
| --- | --- |
| Nothing, or `genie_id` | Conversations, newest activity first; `cursor` from `next_cursor` reads the next page of one region |
| `conversation_id` | Its messages and steps, with errors |
| `conversation_id` and `execution_log_id` | One tool run of a step |
| `conversation_id` and `browser_session_id` | One browser session |
| `genie_id` and `time_range_start` (ISO 8601), optional `time_range_end` | The Genie's log for that period, with the cost of each message and the total |
