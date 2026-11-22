# Template content for the Stacksync Marketplace

What `marketplace_templates_save` takes, and how to write each part so another workspace can
deploy the template from its page alone.

## Page fields

| Field | Required to create | What to write |
| --- | --- | --- |
| `title` | Yes | What it does, with the apps: "HubSpot deals to NetSuite invoices". At most 120 characters |
| `description` | Yes | One or two sentences for cards and search, at most 300 characters: the outcome, then how |
| `types` | Yes | The resource types it deploys, from the list below |
| `connectors` | Yes | The apps it connects, from the list below |
| `industries` | No | Up to 4, from the list below; leave empty for a template that fits every industry |
| `resources` | No | What it deploys, as a count: "1 workflow · 1 sync". Built from `types` when left out |
| `tagline` | No | The lead paragraph of the template's page |
| `overview` | No | Up to 6 paragraphs: the problem, what each resource does, what the person sees once it runs |
| `deployed_resources` | No | One entry per resource deployed: `name`, `type` (such as Two-Way Sync, Workflow, Genie) and `description` |
| `help_text` | No | One line on where to get help, such as the partner's contact page |
| `version` | No | `1.0.0` for a new template; raise it when the instructions change |
| `instructions` | To publish | The Markdown an AI agent follows, below |

`types`: `workflow`, `sync`, `genie`, `queue`, `playbook`.

`connectors`: `shopify`, `netsuite`, `slack`, `salesforce`, `hubspot`, `postgresql` (shown as
Postgres), `snowflake`, `bigquery`, `stripe`. A template with another app keeps that app in its
title, overview and instructions, and lists only the apps from this set here.

`industries`: `construction-services`, `cpg`, `healthcare`, `technology`.

A value outside these lists is refused with the list of valid values.

## Instructions

The instructions are a prompt for an AI agent connected to the Stacksync MCP in the deploying
person's workspace. That agent has never seen the source workspace, so the instructions name every
choice.

Write them in this order:

1. **Outcome**: one paragraph saying what runs once the template is deployed.
2. **Before you start**: the apps to connect, and the questions to ask the person, such as which
   NetSuite subsidiary or which Slack channel.
3. **Steps**: one numbered step per resource, in the order to create them, each naming the MCP
   tool and the settings: objects, field mappings, filters, schedule, the workflow trigger and each
   step. End each step with a check, such as "the sync shows both tables".
4. **Deploy paused**: create syncs switched off and workflows undeployed, then ask the person to
   review before switching on, because the template writes to their live apps.
5. **Check it works**: one test the person runs, such as "close a test deal and see the invoice in
   NetSuite within 2 minutes".

Use placeholders the deploying agent asks for, such as `the person's NetSuite subsidiary`, never a
value from the source workspace: IDs, emails, names and record values differ in every workspace
and are private.
