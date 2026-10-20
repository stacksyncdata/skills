# The Genie document

`genies_save` takes one document. `genies_schema` returns its full format; this page explains the
parts in customer words. On a new Genie, the document is the configuration `genies_draft`
returned, with the ids looked up and filled in.

The document has two keys: `genie_config`, which holds `master_prompt`, `description`, `model`,
`skills`, `interfaces`, `app_descriptions`, `resources`, `teams`, `contacts`, `tools` and
`api_key`, and `knowledge_bases`, which sits beside `genie_config`.

## Parts of the configuration

| Part | What it holds | Where the value comes from |
| --- | --- | --- |
| `master_prompt` | The Genie's instructions | `genies_draft` only, passed unchanged |
| `description` | A short summary | Leave it empty: Stacksync writes it |
| `model` | The AI model the Genie runs on | Leave it empty for Stacksync's default |
| `skills` | One entry per app action: `id` (the module id), `name`, `type` `Module`, `enabled`, `connection` and `approval_policy` | `genies_draft` drafts them; a new one takes `module_id` from `connectors_get`. Set `connection` to a connection id from `connections_list`. A skill that is not enabled is not offered to the Genie |
| `interfaces` | One entry per channel: `slack`, `teams` or `email` | Slack takes the id of a Slack connection with Genies enabled (or an older Slack Genie connection), Teams the id of a Microsoft Teams connection; for both, `details` holds the channel affinity. Email takes `details` set to `<alias>@stacksync.email` |
| `app_descriptions` | Per app of the skills: when and how the Genie uses that app | Optional, in plain words; copy the current ones from `genies_get` when changing them |
| `tools` | Built-in tools, each on or off: `web_search`, `execute_browser`, `api_call`, `code_execution`, `stacksync_ocr`, `modify_scheduled_task` | All on by default, as in the web app. On a change, send only the switches that change, such as `{"web_search": false}` |
| `teams`, `contacts` | Teams and people the Genie knows about, each with `id` and `name` (contacts also `email`) | Copy them from `genies_get`; leave them out when nothing changes |
| `resources` | Connections, variables and secrets the Genie may use | A `connection` takes a connection id; a `variable` or `secret` takes a variable id from `variables_list` |
| `knowledge_bases` | Each knowledge base and when to use it | `knowledge_base_id` from `knowledge_bases_list`, and `instructions` in plain words, such as "Use for questions about return policy" |
| `api_key` | The person's own API key for the model this Genie runs on, when they want one used | Never ask for it in the chat, because a secret in a chat leaves the person's control. It is never returned; `has_api_key` says whether one is set |

Stacksync fills each connection's `connection_resource_id` from the connection id.

## Approval policy

| Value | What happens |
| --- | --- |
| `always_allow` | The Genie runs the action when it decides to |
| `approval_required` | The Genie pauses before the action until a person approves or rejects it (see `genies`, **Decide on an approval**) |

## Fields outside the configuration

| Field | When it is set | Values |
| --- | --- | --- |
| `name` | On create, and on a change to rename | Unique among the workspace's Genies in its region |
| `status` | On an existing Genie only; ignored on a create | `active` or `inactive`. Inactive stops new messages on every interface; scheduled tasks stay unpaused, but each run is refused |
| `public_access_rights` | On an existing Genie only; ignored on a create | Not set: all workspace users, the default. `allow_without_authorization`: Public, authentication not required, by email. `allow_with_authorization`: Public, authentication required: any Stacksync user, by email. `allow_selected_users_and_groups`: only selected users and groups |

Who else may use or change the Genie is set with `genies_access_save`, outside the document.

## How a change is merged

- `genies_save` with `genie_id` keeps every key you leave out.
- A list you send (`skills`, `interfaces`, `resources`, `teams`, `contacts`, `knowledge_bases`)
  overwrites the stored list; `tools` merges switch by switch. Read the Genie with `genies_get` and send the complete new list.
- The document `genies_get` returns is the same format `genies_save` takes, so copy from it, but
  leave out `genie_config.master_prompt` unless it comes from `genies_draft`: `genies_save`
  refuses instructions `genies_draft` did not write in the last hour.
