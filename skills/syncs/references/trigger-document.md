# The trigger document

`syncs_triggers_save` takes one document per trigger. `syncs_get` returns each trigger in the same
shape, with its `trigger_id` and `is_paused`, which are not written in the document.

## Placeholders

The action can use three placeholders:

| Placeholder | Replaced by |
| --- | --- |
| `<<record>>` | A JSON string with the fields of the changed record |
| `<<changes>>` | A JSON string with only the fields that changed |
| `<<change_type>>` | `created`, `updated` or `deleted` |

Read one property with a period, nested as deep as needed: `<<record>>.id`,
`<<record>>.address.postal_code`.

What `<<record>>` holds depends on the operation:

| Operation | Fields in `<<record>>` |
| --- | --- |
| `created` | The fields set when the record was created |
| `updated` | Every field that has a value, not only the changed ones |
| `deleted` | Only the primary key of the table, such as the Salesforce `Id`, or the database table's primary key |

`column_names_from` decides whose field names the JSON uses: a field called `first_name` in a CRM
can be `user_first_name` in the database it syncs with.

## Webhook (HTTP call)

`action.curl_command` is a full cURL command. Stacksync keeps its method, URL, headers and body;
other options, such as `-u`, are dropped, so send authentication as a header. Always give
`--request`: without it the call is a GET.

```bash
curl --request POST \
  --url https://example.com/stacksync-events \
  --header 'Content-Type: application/json' \
  --data '{ "record": "<<record>>", "record_id": "<<record>>.id", "source": "crm" }'
```

## Database query

`action.connection_id` is the database to run in, from `connections_list`, in the same region as
the sync. It does not have to be one of the synced apps. `action.query` runs as written, in that
database's SQL, with no check. Quote text values; leave numbers unquoted.

```sql
INSERT INTO user_table (user_name, postal_code)
VALUES ('<<record>>.name', <<record>>.address.postal_code);
```

## Queue

`action.queue_id` is a queue from `queues_list`. `action.queue_data` is the message added to the
queue on each matching change. A workflow that reads the queue then handles the messages.

## Filters

`filters` is a group of conditions. A group has `"type": "group"`, an `operator` (`and` or `or`)
and `conditions`, which are conditions or nested groups. A condition has `"type": "condition"`, a
`column`, an `operator` and a `value`.

```json
{
  "type": "group",
  "operator": "and",
  "conditions": [
    { "type": "condition", "column": "Status", "operator": "eq", "value": "Closed Won" },
    {
      "type": "group",
      "operator": "or",
      "conditions": [
        { "type": "condition", "column": "Amount", "operator": "nnu", "value": null },
        { "type": "condition", "column": "Stage", "operator": "has_ch", "value": null }
      ]
    }
  ]
}
```

Condition operators, with the label the web app trigger editor shows:

| Operator | Label |
| --- | --- |
| `eq` | equals |
| `neq` | does not equal |
| `lt` | is larger than |
| `leq` | is larger or equal than |
| `st` | is smaller than |
| `seq` | is smaller or equal than |
| `in` | is in |
| `nin` | is not in |
| `nu` | is null |
| `nnu` | is not null |
| `cont` | contains |
| `ncont` | does not contain |
| `has_ch` | is a field that changed |

`lt` means larger than, not less than: read the label, not the letters. The ordering operators
compare values as text, so `10` counts as smaller than `9`. Use them on values of equal length,
such as dates written `2026-10-20`.

Build a regular expression condition (**matches regex expression**) in the web app trigger
editor, never through the MCP: the MCP accepts `mregex` and `nmregex`, but a trigger saved with
them fails each time it is checked.

Nesting has no limit; keep it under 5 levels so people can read it.

## Example: call an API when a won deal changes

```json
{
  "name": "Won deals to billing",
  "trigger_type": "webhook",
  "table_name": "deal",
  "operations": ["created", "updated"],
  "changes_from": "app_1",
  "columns_to_ignore": ["hs_lastmodifieddate"],
  "filters": {
    "type": "group",
    "operator": "and",
    "conditions": [{ "type": "condition", "column": "dealstage", "operator": "eq", "value": "closedwon" }]
  },
  "action": {
    "curl_command": "curl --request POST --url https://example.com/won --header 'Content-Type: application/json' --data '{\"deal\": \"<<record>>\"}'"
  }
}
```

## Common problems

| What the person sees | Why | What to do |
| --- | --- | --- |
| The trigger never fires | Wrong `operations` or `changes_from`, a filter excludes the record, or only ignored fields changed | Compare the trigger from `syncs_get` with one real change |
| The trigger fires too often | A field that changes on its own fires it | Add it to `columns_to_ignore` |
| A database query fails | The query runs as written; a text value lacks quotes | Quote text placeholders, such as `'<<record>>.name'` |
| A trigger is refused for `changes_from` | That app only receives records in this sync | Choose the sending app, or `any` |
| A query or call gets almost no fields on delete | Deletes carry only the record's primary key | Use only the key on `deleted` triggers |
| `connection_id` is refused for a `db_query` | The connection is in another region than the sync | Use a connection of the sync's region from `connections_list` |
