# Salesforce

Notes for syncing Salesforce, from the public Salesforce connector pages at
docs.stacksync.com/two-way-sync/connectors/salesforce.

## Connecting

Call `connections_create` and give the person the sign in link. For production, connect a Salesforce
user made for Stacksync, with only the permissions below.

### API access

The Salesforce org must include the API: Enterprise, Unlimited, Developer and Performance editions
do; Professional edition needs the API add-on; Group and Essentials editions cannot connect. The
error "The REST API is not enabled for this Organization" means the edition lacks it.

The connecting user needs **API Enabled**, set either way:

- **By profile**: Setup, Quick Find **Profiles**, **Edit** the profile, **Administrative
  Permissions**, check **API Enabled**, **Save**.
- **By permission set**: Setup, Quick Find **Permission Sets**, open or create one, **System
  Permissions**, **Edit**, check **API Enabled**, **Save**, then **Manage Assignments > Add
  Assignments** for the user.

When the sync includes ContentDocumentLink (Salesforce Files), also enable **Query All Files** in
the permission set (App Permissions, Content), or **Query all data** on a custom profile.

### Change capture

Stacksync picks one of two ways to see changes, automatically:

| Method | Permissions | How it works |
| --- | --- | --- |
| Regular polling (used in most cases) | API Enabled | Reads only the changes since the last read, more often while data is active |
| Apex triggers | API Enabled, Author Apex, and Customize Application or Modify All Data | Salesforce notifies Stacksync of each change |

With polling, a table needs a last modified date that Salesforce maintains; with triggers, the
object must allow triggers. Objects that cannot be written through the API do not sync.

### Bulk API

Turning on the bulk API for a sync (`bulk_api_access` in `syncs_save`) needs **View All Data** on the user's profile: Setup, Users, Profiles, the profile, Edit,
**View All Data**.

### OAuth error on first sign in

The Stacksync app must be installed in the org once. A user with **Approve Uninstalled Connected
Apps** on their profile signs in first and approves it. After that, other users can sign in; if
one still gets the error, go to **Setup > Connected Apps OAuth Usage**, find Stacksync and click
**Install**, or assign access.

If the sign in page keeps loading, an ad blocker or a pop up blocker is stopping it.

## Formula fields

Formula fields are read-only and computed, so they sync one way, out of Salesforce, and a change of
the inputs does not always count as a change of the formula. Stacksync finds formula fields during
setup. A full table scan of the tables that hold them, at a chosen frequency such as every 24
hours, keeps their values current. The MCP does not set it: do this in the web app.

## Custom field visibility

Stacksync makes custom fields visible to the System Administrator and Standard User profiles.
Other profiles do not see a new custom field until it is made visible. In Salesforce: Setup,
**Object Manager**, the object, **Fields & Relationships**, the field, **Field-Level Security**,
and make it visible to the connected user's profile. To show it on a page, edit the object's page
layout. Then read the fields again with `connections_tables` and add the field to the sync (see
`managing-syncs`).

## Things to keep in mind

- A table missing from `connections_tables` can often still be added; ask Stacksync support.
- Try a new sync on a Salesforce sandbox or developer org before production.
