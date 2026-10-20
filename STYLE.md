# Writing style

Skills are read by two readers at once: a person deciding whether to trust a change to a live
account, and an AI app that follows every sentence literally. Both are served by the same writing:
plain, concrete and short. `scripts/check-writing.mjs` enforces the banned list below on `skills/`
and reports each hit as `file:line`.

## Rules

| Rule | Why |
| --- | --- |
| Use plain verbs: create, connect, copy, check, switch on | The AI app maps each verb to a tool call; a vague verb gives it nothing to call |
| Give concrete numbers: "within 60 seconds", "2,000 orders per day" | A number can be checked on a live workspace; an adjective cannot |
| Use one term per concept, the one the web app shows | Two names for one thing read as two things, to a person and to a model |
| Give the reason behind every rule | A rule without a reason gets broken by the next editor who does not see the point |
| Write in customer words: the names people see in Stacksync and in their apps | The person types those words, and the AI app matches skills by them |
| Write descriptions in the third person: "Syncs orders …", not "I sync" or "You can" | The description is placed in the AI app's own instructions, where "I" and "you" point at the wrong reader |
| Make every sentence earn its place | Each line costs the reader's attention and the AI app's context |
| Say "type", never the word the validator rejects | One word for one concept across all skills |
| Write a region as `besg` (Europe) or `usnv` (United States) | The MCP tools take the code; the name in brackets is what the web app shows |

## Banned

| Category | Banned | Why |
| --- | --- | --- |
| Phrases | seamlessly, seamless, robust, leverage, unlock, streamline, powerful, effortless, cutting-edge, game-changer, "in today's", "This skill", delve, elevate, empower, supercharge | They claim quality without a fact a reader can check |
| Punctuation | em dash and en dash; exclamation marks | Dashes hide whether a clause is a list, an aside or a new sentence; exclamation marks add volume, not facts |
| Leftovers | `{{ }}` placeholders, `<your …>`, TODO, TBD, lorem, template comments (`<!-- -->`) | A leftover tells the AI app to invent a value |
| Hedging | "you may want to", "it is important to note" | Say what to do; if it matters, the sentence shows it |
| Claims | "real-time" without a number on the same line | Every sync has a delay; say how long it is |
| Promotion | Anything beyond the functional "Before you start" block: pricing amounts ("$49", "30 USD", "$/month", "per seat"), "best", or comparisons such as "faster than", "unlike", "versus", "alternative to" or "replaces" before a product name | Skill directories accept an external tool only when the task needs it, never as an advertisement |
| Other platforms | Any platform name outside the `references/<format>.md` file that declares it in its first line, `# <Format> exports from <Platform>` | A migration runbook needs the name to read an export; nothing else does |

Code in backticks or a fenced block is exempt from the phrase, punctuation and `{{ }}` rules,
because code has its own syntax (`!=`, template expressions). TODO, TBD, lorem and `<your …>` are
found in code too, since a leftover is a leftover wherever it sits. The `evals/` prompts are not
checked: they copy what people type, slop included.

## Slop and its fix

| Slop | Fix |
| --- | --- |
| This skill seamlessly syncs your orders in real-time! | Copies each new Shopify order to NetSuite as a sales order within 60 seconds. |
| Leverage the powerful workflow engine to streamline order entry. | Create a workflow that adds one NetSuite sales order per Shopify order. |
| It is important to note that you may want to check the mapping first. | Show the person the field mapping and wait for them to confirm it. |
| Stacksync is the best way to connect Shopify, unlike other tools. | Shopify sends each new order to the workflow as a webhook. |
| Set the subsidiary to {{ subsidiary }} (TODO: confirm). | Read the subsidiary from the variable `netsuite_subsidiary_id`. |
