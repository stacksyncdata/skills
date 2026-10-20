# Network options for connections

Every network option is set in the Stacksync web app on the connection form, or with Stacksync
support. The MCP has no tool for them: give the person the link from `connections_create` and
these steps.

## Which option to choose

| Where the app or database is | Option |
| --- | --- |
| Reachable from the internet, no firewall | None needed |
| Reachable from the internet, behind a firewall that filters IP addresses | IP allowlist |
| In a private subnet, with a jumpbox possible | SSH tunnel |
| In a private subnet, no jumpbox possible | Private connection, set up with support |
| Behind a Zero-Trust Network Access provider | Set up with support |

## IP allowlist

1. Open the connection form from the `connections_create` link and choose the app.
2. Find **Allowlist Stacksync IPs** on the form. It lists the Stacksync IP addresses of each
   region. Use every address of the region the connection is created in.
3. Add the addresses to the firewall of the app or database.
4. Then complete the connection form. Stacksync reads the app's schema while the connection is
   created, so the address must be allowed first.

The resource must sit in a public subnet. Allowing a public IP address on a resource in a private
subnet does not make it reachable. For regions other than Europe and United States, ask
hello@stacksync.com for the address.

## SSH tunnel

An SSH tunnel reaches a database in a private network through a jumpbox, a small server that is
reachable from the internet and can reach the database. Traffic is encrypted, and the database
itself is not exposed to the internet.

The Stacksync docs have step by step jumpbox guides for databases on AWS, Google Cloud and Azure,
and for Windows Server 2022 and 2025 jumpboxes, under **Setup options > SSH Tunneling**. Before
the person fills in the tunnel on the connection form, they can test it from a machine they
allowed:

```bash
ssh -L 5432:DB_HOST:5432 -N -f JUMPBOX_USER@JUMPBOX_HOST
psql -h localhost -p 5432 -U DB_USER -d DB_NAME
```

Hardening the docs recommend for the jumpbox: a dedicated system user without sudo, a firewall
that allows only the needed traffic, and an SSL certificate on the database connection.

## Private connections and Zero-Trust Network Access

When a jumpbox is not possible, Stacksync support can set up a private connection without
crossing the public internet: VPN tunneling, a transit gateway or a private link. Stacksync also
works with Zero-Trust Network Access providers. For either, the person emails
hello@stacksync.com.

## Data processing region

The region a connection is created in decides where its data is processed. Pass `region`,
`besg` (Europe) or `usnv` (United States), to `connections_create`; regions come from `workspaces_list`.
Choosing a region is available on the Pro and Enterprise plans.
