# Stacksync CLI problems and fixes

| What the person sees | Why | What to do |
| --- | --- | --- |
| `stacksync: command not found` | The install did not finish, or the terminal has the old path | Open a new terminal and run `stacksync --version`; install again if needed |
| `stacksync login --check` exits with 1 | The CLI is not signed in | Run `stacksync login` |
| The new module is missing in the workflow builder | The local run stopped, or the builder was not refreshed | Start `stacksync workflow-connector run` again and refresh the workflow builder |
| The local run picked another port | Port 2323 was in use | Expected; the CLI picks the next free port. Pass the port the run printed to `replay` with `--port` |
| A module call fails | The request or the credentials are wrong | `stacksync workflow-connector replay last` against the local code, fix, save, try again |
| The deploy is not live yet | Each deploy waits for a Stacksync reviewer, which can take hours | Check it with `stacksync workflow-connector deploy-status` and the deployment id `deploy` printed |
