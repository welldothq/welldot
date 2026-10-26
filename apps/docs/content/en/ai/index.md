---
title: AI and agents
description: How AI assistants can read these docs, validate .well files and convert well reports, through the MCP server, llms.txt and the welldot-converter skill.
navigation:
  title: Introduction
---

AI assistants are often the fastest way to turn a scanned drilling report into data, or to write code against a file format. They are also confident when they are wrong. These tools give an assistant the real specification and the real validator, so its answers and its `.well` files can be checked instead of trusted.

::card-group

:::card{title="MCP server" icon="i-lucide-plug" to="/ai/mcp"}
Connect Claude, Cursor, VS Code or another MCP client to search these docs, read any page and validate `.well` files.
:::

:::card{title="llms.txt and Markdown" icon="i-lucide-file-text" to="/ai/llms"}
Every page as plain Markdown, an index for assistants, and the whole site in one file.
:::

:::card{title="Converting reports" icon="i-lucide-wand-sparkles" to="/ai/conversion-skill"}
The `welldot-converter` skill turns a well report into a `.well` file, and checks it with the validator.
:::

::

## Two common cases

**A geologist converting reports.** The assistant reads a PDF or a photo of a drilling report, follows the [`welldot-converter` skill](/ai/conversion-skill) to extract every section, writes the file, and runs `validate_well` on the [MCP server](/ai/mcp) until it passes. The geologist then reviews the result against the report.

**A developer writing code.** The assistant looks up fields and rules with `search_docs` and `get_page` instead of guessing, and validates the test files it writes. Without MCP, give it [`/llms.txt`](/ai/llms) or the Markdown of the pages you are working from.

## What the tools guarantee

- **The same validator.** `validate_well` runs `parseWell` from `@welldot/core`, exactly as the welldot.org editor and the libraries do. It adds no rules of its own ([Validating](/format/guides/validating)).
- **The real spec.** `search_docs` and `get_page` read the same pages you are reading now, including the full [specification](/format/spec).
- **Nothing stored.** The MCP server is stateless and read-only. It does not keep the files you validate.

::caution
A valid file can still be wrong. Validation checks the shape of the data, not whether the numbers match the report. Always review a converted file against its source ([Converting a report](/format/guides/converting-a-report#review-checklist)).
::
