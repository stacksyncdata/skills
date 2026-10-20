# The Genie document

`genies_save` takes one document. `genies_schema` returns its full format; this page explains the
parts in customer words. On a new Genie, the document is the configuration `genies_draft`
returned, with the ids looked up and filled in.

## Parts of the configuration

| Part | What it holds | Where the value comes from |
| --- | --- | --- |
| `master_prompt` | The Genie's instructions | `genies_draft` only, passed unchanged |
| `description` | A short summary | Leave it empty: Stacksync writes it |
| `skills` | One entry per app action: the module id, `type` `Module`, `enabled`, `connection` and `approval_policy` | `genies_draft` drafts them; set `connection` to a connection id from `connections_list` |
| `interfaces` | One entry per channel: `slack`, `teams` or `email` | Slack and Teams take the id of the workspace's Slack Genie or Microsoft Teams connection; email takes `details` set to `<alias>@stacksync.email` |
| `resources` | Connections, variables and secrets the Genie may use | A `connection` takes a connection id; a `variable` or `secret` takes a variable id from `variables_list` |
| `knowledge_bases` | Each knowledge base and when to use it | `knowledge_base_id` from `knowledge_bases_list`, and `instructions` in plain words, such as "Use for questions about return policy" |
| `api_key` | The workspace's own model API key, when the person wants one used | Never ask for it in the chat, because a secret in a chat leaves the person's control. It is never returned; `has_api_key` says whether one is set |

Stacksync fills each connection's `connection_resource_id` from the connection id.

## Approval policy

| Value | What happens |
| --- | --- |
| `always_allow` | The Genie runs the action when it decides to |
| `approval_required` | The Genie pauses before the action until a person approves or rejects it (see `operating-genies`) |

## Fields outside the configuration

| Field | When it is set | Values |
| --- | --- | --- |
| `name` | On create, and on a change to rename | Unique among the workspace's Genies in its region |
| `status` | On an existing Genie only | `active` or `inactive`. Inactive stops new messages on every interface and pauses scheduled tasks |
| `public_access_rights` | On an existing Genie only | `allow_without_authorization` (Public, authentication not required), `allow_with_authorization`, `allow_selected_users_and_groups` |

Who else may use or change the Genie is set with `genies_access_save`, outside the document.

## How a change is merged

- `genies_save` with `genie_id` keeps every key you leave out.
- A list you send (`skills`, `interfaces`, `resources`, `knowledge_bases`) overwrites the stored
  list. Read the Genie with `genies_get` and send the complete new list.
- The document `genies_get` returns is the same format `genies_save` takes, so copy from it.
