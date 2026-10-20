# Running and replaying runs

Each `workflows_run` call queues one run and returns its `run_id`. `workflows_replay` replays many
runs in one call.

| The person wants | Call | `mode` |
| --- | --- | --- |
| Run the workflow now with the Input step's test data | `workflows_run` | `run` |
| Run one step on its own | `workflows_run` with `step_id` | `step_only` |
| One run again from the start, with its trigger data | `workflows_run` with `from_run_id` | `replay_all` |
| Only the failed steps of one run | `workflows_run` with `from_run_id` | `replay_failed` |
| The failed steps and the steps after them | `workflows_run` with `from_run_id` | `replay_failed_and_dependents` |
| One run up to, or from, a step | `workflows_run` with `from_run_id` and `step_id` | `until_step` or `from_step` |
| Many runs | `workflows_replay` with `run_ids`, or a `query` and a time range | `replay_all`, `replay_failed` or `replay_failed_and_dependents` |

`replay_failed` and `replay_failed_and_dependents` work only on a run that failed. A replay is
at-least-once with no de-duplication: with `replay_all`, steps that already succeeded run again.
