# NetSuite

Notes for syncing NetSuite, from the public NetSuite connector pages at
docs.stacksync.com/two-way-sync/connectors/netsuite.

## Connecting

An admin role is needed. In NetSuite, **Setup > Company > Enable Features** must have **REST WEB
SERVICES** and **TOKEN-BASED AUTHENTICATION** checked, and an integration record with
token-based authentication must exist. Call `connections_create` and give the person the link; the
sign in page asks for the account ID and tokens there, never in the chat.

## Objects

Customers, vendors, contacts, employees, projects, most transactions (sales orders, invoices,
purchase orders, journal entries, item fulfillments, vendor bills and more) read and write.
Custom objects read; writing them is on request. Accounts, accounting periods, departments,
classes and locations read only for now. Saved searches read only. Read the live list with
`connections_tables`.

## Transaction line items

A transaction syncs as one record. Its lines are a JSON array in one field: `itemList` for most
transaction types, `lineList` for journal entries and intercompany journal entries.

```json
[
  { "item": { "internalId": "38704" }, "quantity": 2, "rate": 10.0, "line": 1 },
  { "item": { "internalId": "38705" }, "quantity": 1, "rate": 25.0, "line": 2 }
]
```

- Lines cannot sync as a separate table: NetSuite accepts line changes only through the whole
  transaction, header and all lines.
- To add, change or remove a line, write the complete updated array to `itemList` or `lineList`.
  Stacksync sends the whole transaction to NetSuite.
- A database or workflow can split the array into rows for reading, but changes meant for NetSuite
  go back into the array field.

## Saved search column names

A saved search that returns no records may not show its columns, so the sync cannot map them. A
NetSuite RESTlet that loads the search definition returns the columns either way. Set it up in
NetSuite as the public guide shows: upload `get_saved_search_columns_restlet.js` to
**Documents > Files > SuiteScripts**, create the script record with ID `_get_search_columns`,
deploy it with status **Released**, and add the user or role Stacksync uses to the deployment's
audience. Guide: docs.stacksync.com/two-way-sync/connectors/netsuite/retrieve-saved-search-column-names-from-netsuite.

If the RESTlet answers with an authorization error, check the deployment is **Released** and
**Deployed**, and the role may run RESTlets and read the saved search.

## Concurrency

NetSuite caps how many requests run at once for the whole account; REST and SOAP share it. The cap
depends on the service tier: Shared 5, Tier 1 15, Tier 2 or Ultimate 20, plus 10 per SuiteCloud
Plus license. Stacksync never sends more than 3 at once, but other integrations draw on the same
pool, and when they fill it every integration gets errors.

To stop that, in NetSuite open **Setup > Integration > Manage Integrations**, open the Stacksync
integration and set **Concurrency Limit** to 3. Size each other integration the same way and leave
the rest free. **Setup > Integration > Integration Governance** shows the slots in use.

When a NetSuite sync shows many concurrency errors as issues, fix the limits first, then ask the
person about `retry` (see `fixing-sync-issues`).
