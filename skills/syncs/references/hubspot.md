# HubSpot

Notes for syncing HubSpot, from the public HubSpot connector pages at
docs.stacksync.com/two-way-sync/connectors/hubspot.

## Connecting

- Only a HubSpot **Super Admin** can grant Stacksync access, because only Super Admins hold the
  OAuth scope needed. Call `connections_create` and give the link to a Super Admin.
- **Grant access to sensitive fields** is an option on the sign in page. Without it, sensitive and
  highly sensitive fields are not read. For an existing connection, sign in again with the option
  checked, then edit the sync so the fields can be mapped.
- Custom objects need a HubSpot Enterprise account. The free account does not offer the Audit
  object.

## Objects

Contacts, companies, deals, line items, products, tickets, quotes, engagements (calls, emails,
meetings, notes, tasks), invoices, attachments, associations, all custom objects, HubDB and more
sync. Campaigns are coming; feedback submissions do not sync. Read the live list with
`connections_tables`.

## Associations

HubSpot links records through associations, which sync two-way as association tables: one table
per pair of object types, such as `associations_company_and_contact` with `contact_id`,
`company_id` and `association_label`.

- Associations have no direction, so each pair of object types has one table only.
- One pair of records can have several rows with different labels.
- An association cannot be updated: delete the row and add a new one with the new label.
- Every association has the default unlabeled type; a labeled one (Primary or a custom label) is
  added next to it.
- Leave the `stacksync_record_id_` column of an association table unchanged.
- Choose which associations sync when creating or editing the sync.

More in [associations.md](associations.md).

## Associations change detection boost

HubSpot offers no way to read only the associations that changed, so Stacksync reads the whole
association table to find changes: under 1 minute for fewer than 10,000 associations, under 10
minutes for 100,000, over 1 hour for 1,000,000.

The boost finds changes within seconds by watching rollup properties in HubSpot. It does not work on
Free and Starter HubSpot accounts, needs a HubSpot Admin or Super Admin to set up, and is meant for
association tables with more than 10,000 rows.

1. In the web app, open the sync, the **Schema** tab, the HubSpot app, then **Show associations
   CDC configuration**. It lists each association table, its status and the exact properties to
   create.
2. In HubSpot, under **Settings > Data Management > Properties**, on the object the panel names
   (the first object of the table name), create a **Calculation property > Rollup**, type **Sum**,
   **Record ID** of the other object, for **All association labels**, labeled
   `sync_associations_{object1}_{object2}_label_none` with lowercase plural object names, such as
   `sync_associations_contacts_tickets_label_none`. This one property is required.
3. Optional: one more rollup per association label you use, such as `..._label_primary`, limited to
   that label.
4. Pause the sync with `syncs_switch` and start it again. The boost turns on for every table whose
   `_label_none` rollup exists; the panel then shows **CDC boosted**.

If a rollup is deleted or changed later, Stacksync goes back to reading the whole table for it and
sends an email; no data is lost.

## Associations through database ids

When a database creates records and their association together, before HubSpot has assigned ids:

1. Insert the two records and their association row in one database transaction, keyed by the
   database's own ids.
2. When Stacksync writes the HubSpot ids back to the two record tables, copy them into the
   association table with an `UPDATE` that joins on the database ids.
3. Run that update from a database trigger (lowest delay) or a job every 1 minute (up to 60 seconds
   of delay). Stacksync then creates the association in HubSpot.

## Attachments

Attachments belong to an engagement, such as a call or note. Sync at least one engagement object
with the Attachments object, such as Calls and Attachments for call attachments.

## Things to keep in mind

- A custom field named `id` conflicts with HubSpot's record `id` and is not synced.
- A field with constraints, such as text limited to numbers, rejects values that do not fit and
  shows an issue. Change the constraint in HubSpot or the value.
- Syncing a published HubDB table publishes its draft changes.
- HubSpot has no built in backup; with two-way sync, keep a backup of the HubSpot account.
