# Genie interfaces

Each interface needs a first step by the person, once, before the MCP can add it to the Genie.

| Interface | First, once, by the person in the web app or the chat app | Then, with the MCP |
| --- | --- | --- |
| Slack | Open the Genie, then **Interfaces**, add **Slack** and create the connection there (or use a Slack connection made with **Also enable Genies on this Slack** ticked), then **Allow** in Slack | Add a `slack` interface with that connection's id; people invite it with `/invite @Genie` and mention it |
| Microsoft Teams | A Teams administrator uploads the Genie app package in Teams; then **Connections** > **Create new connection** > **Microsoft Teams**, signed in with an account that can grant admin consent | Add a `teams` interface with that connection's id |
| Email | Nothing | Check the alias with `genies_draft` `alias`, then add an `email` interface with `details` `<alias>@stacksync.email` |

Installing the Slack or Teams app needs the person's own sign in to Slack or Teams, so the MCP has
no tool for it. Which channel gets which messages is the interface's `details`, written in plain
words.
