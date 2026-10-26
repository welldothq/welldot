---
title: llms.txt and Markdown pages
description: Give an AI assistant the welldot docs as plain text, with llms.txt, llms-full.txt, the raw Markdown of every page and the page actions.
---

Not every assistant supports MCP. Every page of this site is also available as plain Markdown, and two index files follow the [llms.txt](https://llmstxt.org) convention, so any assistant that can read a URL or a pasted file can use the docs.

## The files

| URL                                | Contents                                                                                                                           |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [`/llms.txt`](/llms.txt)           | A short description of welldot and a link to the Markdown of every page, grouped by section, with a one-line summary each.         |
| [`/llms-full.txt`](/llms-full.txt) | Every hand-written page and the whole specification in one file. Large; use it when the assistant can hold it.                     |
| `/raw/<path>.md`                   | The Markdown source of one page, for example [`/raw/format/spec/v2/format-reference.md`](/raw/format/spec/v2/format-reference.md). |

The generated API and object reference pages are listed in `llms.txt` only through their index pages, to keep it short; their raw Markdown is still available at `/raw/...`.

`welldot.org/llms.txt` points to these files.

## On every page

The links at the bottom of each page's table of contents (or at the side, on pages without one):

- **Copy page** copies the page's Markdown to the clipboard, ready to paste into a chat.
- **View as Markdown** opens the raw page.
- **Edit this page** opens its source on GitHub, for hand-written and spec pages.

## Which to use

| Situation                       | Use                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| The assistant supports MCP      | The [MCP server](/ai/mcp): it searches and reads only what it needs, and can validate files. |
| A question about a few pages    | **Copy page** on each and paste them.                                                        |
| A tool that indexes a docs site | `/llms.txt` as the entry point.                                                              |
| A long session on the format    | `/llms-full.txt`, if it fits the assistant's context.                                        |

::tip
When an assistant writes a `.well` file from the Markdown alone, it cannot check it. Paste the result into [welldot.org](https://welldot.org) or validate it in code before using it ([Validating](/format/guides/validating)).
::
