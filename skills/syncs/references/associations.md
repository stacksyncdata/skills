# Associations

An association fills a child record's link to its parent when the parent's ID in the other app is
not known yet. Example: a new `opportunity` row in Postgres holds an account number, but Salesforce
needs the account's Salesforce `Id` on the opportunity. The association looks up the parent account
and writes its Salesforce `Id` into the opportunity once that account exists in Salesforce.

## Where to set them

In the web app: open the sync, then the **Associations** tab. The MCP tools do not set
associations today, so give the person the link to the sync and the values below.

Each association connects one child table to one parent table on the database side of the sync:

| Part | Table | What it is |
| --- | --- | --- |
| Reference key | Child | A column holding the parent's key, such as an account number. It is not synced; it only identifies the parent |
| Primary key | Parent | The parent column the reference key matches. Filled in automatically |
| Backfill source | Parent | The parent's record ID in the other app, such as the Salesforce `Id`. Filled in automatically |
| Backfilled column | Child | A synced column on the child that receives the parent's record ID |

To add one: click **Add your first Association** or **Edit**, fill the child table, its reference
key and the backfilled column, choose the parent table, click **Add**, then **Save associations**.
Saving pauses the sync for a short time and then resumes it.

- The order records arrive in does not matter. A child that arrives before its parent waits, and
  the link is filled in once the parent's ID exists.
- The tab offers only pairings that can work, and suggests columns that look like parent links,
  such as `parent_account_key`.
- If a reference key column is renamed or deleted, the association is marked **stale**. Delete it
  and add it again with the current column.
- Deleting an association stops future links only. It deletes no column and no data.

## HubSpot associations

HubSpot links records through associations, which Stacksync syncs two-way as association tables:
one table per pair of object types, for example `associations_company_and_contact` with the
columns `contact_id`, `company_id` and `association_label`.

- Associations have no direction: if a contact is associated with a company, the company is
  associated with the contact. Each pair of object types has one table, never a second one in the
  opposite order.
- One pair of records can have several rows with different association labels, such as
  `finance_department` and `marketing_department`.
- Associations cannot be updated. To change a label, delete the row and add a new one.
- Custom objects get association tables too, for example `associations_pets_and_shelters`.
- Leave the `stacksync_record_id_` column of an association table unchanged.

## NetSuite transaction line items

A NetSuite transaction, such as a sales order, invoice or journal entry, syncs as one record. Its
lines are a JSON array in one field on that record: `itemList` for most transaction types and
`lineList` for journal entries.

- Lines cannot be synced as a separate table, because NetSuite only accepts line changes through
  the whole transaction.
- To add, change or remove a line, write the complete updated array to the transaction's
  `itemList` or `lineList` field. Stacksync then sends the whole transaction to NetSuite.
- A workflow or database query can split the array into rows for reading or reporting, but changes
  meant for NetSuite go back into the array field.
