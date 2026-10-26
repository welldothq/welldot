---
title: MCP server
description: Connect an AI assistant to the welldot docs MCP server to search the documentation, read pages and validate .well files, with setup for Claude Code, Claude Desktop, Cursor, VS Code and Gemini CLI.
---

This site runs a [Model Context Protocol](https://modelcontextprotocol.io) server. An assistant connected to it can search these docs, read any page, including the specification, and validate `.well` files with the same check the libraries use.

```text
https://docs.welldot.org/mcp
```

The server uses the Streamable HTTP transport, is stateless and needs no account or key.

## Tools

| Tool            | Input                                                             | Returns                                                                                       |
| --------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `search_docs`   | `query`, optional `limit` (default 10, at most 50)                | The best matching sections, each with a path, URL and snippet.                                |
| `get_page`      | `path`, for example `/format/spec/v2/overview`                    | The page as Markdown. A trailing slash, `.md` suffix or `#anchor` is ignored.                 |
| `validate_well` | `content` (the file's text), optional `warnings` (default `true`) | `{ valid: true, version, warnings }` or `{ valid: false, errors }`, with the JSON Schema URL. |

The server also tells the assistant to validate every `.well` file it generates or edits.

### `validate_well` in detail

`validate_well` runs `parseWell` from [`@welldot/core`](/core/guides/parsing-and-validating), nothing more and nothing less. Errors come back with a path into the document:

```json
{
  "valid": false,
  "errors": [
    {
      "path": "well_screen[0].screen_slot",
      "code": "invalid_type",
      "message": "Required"
    },
    { "path": "fractures", "code": "invalid_type", "message": "Required" }
  ],
  "schema": "https://welldot.org/schema/v2/well.schema.json"
}
```

- Non-JSON text, an empty string, a JSON array or an unsupported version return `valid: false` with a readable message, never a server error.
- A version 1 file is valid: it is upgraded the same way `parseWell` upgrades it.
- Warnings (permit, meter, water sample and pump checks from [`@welldot/utils`](/utils)) are advisory and never make a file invalid ([Validating](/format/guides/validating#errors-and-warnings)).
- Files over 5 MB return the code `too_large`.

## Setup

The server works with CLI and desktop MCP clients that support remote (HTTP) servers. It sends no CORS headers, so MCP clients that run inside a web page may not be able to connect.

::tabs

:::tabs-item{label="Claude Code" icon="i-lucide-terminal"}

```bash
claude mcp add --transport http welldot https://docs.welldot.org/mcp
```

Add `--scope project` to share it with your team through `.mcp.json`.
:::

:::tabs-item{label="Claude Desktop" icon="i-lucide-monitor"}
Open **Settings → Connectors → Add custom connector**, name it `welldot` and enter `https://docs.welldot.org/mcp`.
:::

:::tabs-item{label="Cursor" icon="i-lucide-mouse-pointer-2"}
In `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "welldot": { "url": "https://docs.welldot.org/mcp" }
  }
}
```

:::

:::tabs-item{label="VS Code" icon="i-lucide-code"}
In `.vscode/mcp.json`:

```json
{
  "servers": {
    "welldot": { "type": "http", "url": "https://docs.welldot.org/mcp" }
  }
}
```

:::

:::tabs-item{label="Gemini CLI" icon="i-lucide-sparkle"}
In `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "welldot": { "httpUrl": "https://docs.welldot.org/mcp" }
  }
}
```

:::

::

Client settings change often; if one of these does not work, check your client's documentation for "remote MCP server" or "Streamable HTTP".

## Try it

Once connected, ask your assistant something like:

- "Using the welldot docs, what does `well_screen[].slot_type` accept?"
- "Read the welldot spec on level sign conventions and tell me how to record a flowing well."
- "Validate this .well file and fix every error." (paste or attach the file)

To test the endpoint without an assistant:

```bash
curl -s https://docs.welldot.org/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Privacy

The server does not store what you send. A file passed to `validate_well` is parsed in memory and discarded when the response is sent. Avoid sending files you are not allowed to share with your AI provider; that concern is between you and the provider, not this server.

## For contributors

`pnpm --filter docs dev` serves the same endpoint locally at `http://localhost:3001/mcp`. The implementation is in `apps/docs/server/mcp-lib`.
