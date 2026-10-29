---
name: connectors
description: Finds apps and built-in modules in the Stacksync catalog through the Stacksync MCP, shows an app's actions, triggers and connections, fills an action's form, and runs an action on an app's records, files or messages on its own, without a workflow. Use when someone asks which apps or actions Stacksync offers, what an app can do, or wants to look up, find, create, update or delete a record in an app right now, query a connected database, or try an action before putting it in a workflow.
license: Apache-2.0
metadata:
  type: resource
  version: "1.2.0"
  owner: "@stacksyncdata/ai-team"
  areas: "connectors"
  resource: "connectors"
  tools: "connectors_list connectors_get connectors_module_form connectors_search_records connectors_get_records connectors_query_records connectors_read_files connectors_create_records connectors_update_records connectors_upsert_records connectors_delete_records connectors_run_query connectors_send_message connectors_enrich_records connectors_write_files connections_create connections_list connections_tables"
---

## What it is

Connectors are the catalog of outside systems Stacksync works with: CRMs, ERPs, databases, email
and more. Each one is Stacksync's own connector: it calls the app's API through the workspace's
connection, never through another MCP server. Each app has an `app_type` and a list of modules:
actions that read or change data in the app, and triggers that start a workflow. Each module has a
`module_id`, a `module_type` and a `module_version`, and most need a connection to the app (see
`connections`).

An action that works on the app's records, files or messages has an `operation`, and runs
directly, once, with the tool of that operation (see "Run one app action"). Every action also runs
as a workflow step or as a step a Genie runs; an action without an operation runs only there.

Stacksync's built-in modules need no connection. They enrich people and company records, find and
check email addresses and phone numbers, search, scrape, crawl and map websites, extract data, run
AI prompts and send, forward or reply to email.

## When to use it

- The person asks which apps or actions exist, or what an app can do.
- One read, search or change in an app, now: "find the contact with this email", "create a
  customer", "list today's orders".
- Filling a step's form for a workflow (see `workflows`).
- For repeated runs or a trigger, build a workflow; for records that stay equal between apps,
  use `syncs`.

## Connects to

| Resource | How they link | Tool |
| --- | --- | --- |
| `connections` | An app's actions run through one of the person's connections to that app | `connectors_get`, `connections_create` |
| `workflows` | Each workflow step and trigger is a catalog module filled from its form | `connectors_module_form` |
| `genies` | A Genie runs single catalog modules as its tools | `genies_save` |
| `syncs` | No native link: a sync uses its own connection to each app, not catalog modules | None |

## Operations

### List apps

Use when you need an app's `app_type`, or a module for a capability.

Tools: `connectors_list`

1. Call `connectors_list` with a `search` of one short word: the app name or the capability, such
   as `contacts`, `enrich`, `validate`, `scrape` or `email`.
2. The search matches text inside a module's name, module type or app name, with dashes and
   underscores read as spaces. It does not read descriptions, so try several single words.
3. Each app comes with its number of actions and triggers and whether it needs a connection.
   `is_truncated` means more apps exist: narrow the search.

### Show an app

Use when choosing an app's action or trigger and the connection it uses.

Tools: `connectors_get`, `connections_create`

1. Call `connectors_get` with the `app_type`.
2. The answer lists the actions and triggers (`module_id`, `module_type`, `module_version`, name,
   `is_read_action`, `operation`) and the person's connections for that app.
3. When several actions or connections fit, ask the person which one.
4. With no connection, call `connections_create` and give the person the sign in link it
   returns. Continue once they say they signed in.

### Fill a module form

Use when an action or trigger needs its fields, for a workflow step or a single run.

Tools: `connectors_module_form`

1. Call `connectors_module_form` with the `module_id`, `module_version` and `connection_id`. The
   answer holds the `input_schema`, the connection requirement and the dropdowns.
2. Pass `dropdown_ids` to load their options from the app, such as the list of objects or tables.
3. Call again after each choice with the `values` chosen so far: later fields often depend on
   earlier ones.
4. Ask the person for any required value you do not know.

### Run one app action

Use when the person wants records, files or messages of an app searched, read, created, changed,
deleted or sent now, without a workflow.

Tools: `connectors_list`, `connectors_get`, `connectors_module_form`, and the tool of the
action's operation

1. Find the app and the connection with `connectors_get`, and the action whose `operation` matches
   what the person asked.
2. Fill that action's form with `connectors_module_form` and its `module_id`.
3. Before an action that changes data, show the person the app, the account, the action and the
   values.
4. Call the tool of the operation with the `app_type`, the `connection_id` and the form's
   `values`. When `connectors_get` lists several actions with that operation, also pass the
   `module_type` of the one the person chose.

   | Operation | Tool | What it does |
   | --- | --- | --- |
   | `search` | `connectors_search_records` | Reads the records matching filters |
   | `get` | `connectors_get_records` | Reads records by their ID |
   | `query` | `connectors_query_records` | Runs a query in a language that only reads, such as SOQL or SuiteQL |
   | `read_files` | `connectors_read_files` | Reads files |
   | `create` | `connectors_create_records` | Creates records |
   | `update` | `connectors_update_records` | Changes records |
   | `upsert` | `connectors_upsert_records` | Creates records, or changes the ones that match |
   | `delete` | `connectors_delete_records` | Deletes records |
   | `run_query` | `connectors_run_query` | Runs free SQL, which can change data |
   | `send_message` | `connectors_send_message` | Sends an email or a message |
   | `enrich` | `connectors_enrich_records` | Adds people or company data to records |
   | `write_files` | `connectors_write_files` | Uploads or changes files |

   - The `search`, `get`, `query` and `read_files` tools only read: they run at once and return
     the data.
   - The other tools change data or reach people outside the workspace. They run directly, unless
     the workspace turned on "Ask before every change" or the app's guardrails ask the person:
     then the person accepts it first.
5. Report the result in the app's own terms: the records found, or the record changed with its ID.

A read is open to every workspace role; a change needs the editor or owner role. Every run, a read
included, is recorded in the workspace's audit log.

### Query a database

Use when the person wants to look something up in a connected database (Postgres, MySQL, SQL
Server, Oracle, Snowflake or BigQuery), or check a record a sync or a workflow wrote there.

Tools: `connections_list`, `connections_tables`, `connectors_get`, `connectors_module_form`,
`connectors_run_query`, `connectors_query_records`

1. Pick the connection: `connections_list` with the app type. When several match, ask the person
   which one, by name. Keep its `connection_id` for every call below: a query sent without it has
   no credentials and is refused.
2. Read the tables: `connections_tables` with the `connection_id` and no `table_names`.
3. Read the columns of the tables you need: `connections_tables` again with up to 10
   `table_names`. Never guess a column name: a guessed one fails with
   `column "<name>" does not exist`.
4. When a column's values are unclear (a status code, a date format, an id with a prefix), read a
   sample first: `SELECT <columns> FROM <table> LIMIT 5`.
5. Write the query with the table and column names exactly as returned, a `WHERE` on the value
   the person gave, and a `LIMIT` of at most 100 rows. Find the query action with
   `connectors_get` (its `operation` is `run_query`), fill it with `connectors_module_form`, and
   run it with `connectors_run_query` and the `connection_id`.
6. Report the rows in the person's words, and say when the result stopped at the `LIMIT`.

A free SQL query counts as a change, a `SELECT` included, because the text decides what it does:
it needs the editor or owner role, and when the workspace turned on "Ask before every change" the
person accepts it first. Write only `SELECT` unless the person asked for a change. A query
language that only reads (Salesforce SOQL, NetSuite SuiteQL) has the `query` operation instead:
run it with `connectors_query_records`, at once.

### Build a custom connector

Use when the app is not in the catalog.

Tools: none

1. Follow the runbook `building-a-connector`.

## Defaults and limits

- `connectors_list` and `connectors_get` read the workspace's default region unless a `region` is
  passed; `connectors_list` with `region` `all` lists each app once.
- A run's data over 1,000,000 characters of JSON comes back as its start, as text: narrow the
  search or use a workflow for large reads.

## Rules

| Rule | Why |
| --- | --- |
| Take every value from `connectors_module_form` or from the person; never guess a required value | The action runs against the live app with exactly these values |
| Search by capability with short single words and use a built-in module before any outside service | A built-in module needs no key and no extra account |
| Never create an API key variable for a service the catalog covers without asking | A key the person did not ask for is a secret to manage |
| Show the app, account, action and values before an action that changes data | The person owns changes to their live apps |
| Run each action with the tool of its operation | Each tool says what it does: a read never changes data, and a change asks the person when the workspace or a guardrail requires it |
| Never reuse a `confirmation_token` for other values | The token is valid only for the exact call it was issued for |
| Never ask for a password or key; use the link from `connections_create` | A secret typed into a chat stays in the chat history |
| For many records or repeated runs, build a workflow | One action runs once; a workflow keeps run history and can replay failed runs |

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| The search finds nothing | The word is not in any module name, type or app name | Try another single word: the app name or a verb such as `search` or `create` |
| `connectors_get` lists no connection | The person has not connected this app | `connections_create`, give the link, then `connectors_get` again |
| The run is refused for a missing or invalid value | A required field is empty or the app does not accept the value | `connectors_module_form` with the current `values`, load the dropdown, ask the person |
| The run is refused for the role | The action changes data and the person is a viewer | A workspace owner gives them the editor role (see `workspaces`) |
| The status is `failed` with the app's reason | The app rejected the action | Stop and show the reason; retry with other values only if the person asks |
| The status is `outcome_unknown` | The app did not confirm whether the change happened | Check the record with a read action before running the change again |
| The tool says the app has no action for the operation | The app's actions for this have another operation, or none | `connectors_get` lists each action's `operation`; an action without one runs as a workflow step |
| The tool lists several actions to choose from | The app has more than one action with that operation | Ask the person which one and pass its `module_type` |
| The dropdown options are empty | The connected account cannot see those objects | Check the account's permissions in the app, or use another connection |
