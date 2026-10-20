## Before you start

Check whether a tool from the Stacksync MCP server, such as `connections_list`, is available in
this conversation. If it is, the Stacksync MCP is already connected: skip to the next section.

If it is not, set it up once:

1. Ask the person to add `https://mcp.stacksync.com/mcp` as a connector or MCP server in their
   AI app. The steps for each app are in the README of github.com/stacksyncdata/skills.
2. The person signs in with their Stacksync account when the AI app asks. Sign in uses OAuth, so
   nobody creates or copies an API key.
3. Call `connections_list` to confirm the tools respond.

Then connect in Stacksync each app the build uses; for a use case, that is the source app and the
destination app. Call `connections_create` once per app. It returns a secure sign in link; give
the link to the person and wait until they say they have signed in. Never ask the person to paste
a password, token or API key into the chat.
