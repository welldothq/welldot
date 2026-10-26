---
title: Contributing
description: How to contribute to welldot, from reporting a problem with the docs to proposing a change to the .well format, and where each kind of change lives.
navigation:
  title: Introduction
---

Welldot is open source (Apache 2.0) and developed in the open on [GitHub](https://github.com/welldothq/welldot). Contributions of every size help: a typo fix, a clearer example, a missing vocabulary value, a converter for another registry.

## Where things live

| You want to change                               | Where                                                | Start with                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A rule of the `.well` format                     | `spec/` (plain Markdown)                             | An issue describing the need ([Extending the format](/format/guides/extending#propose-a-change-to-the-format)) |
| A package's behavior or API                      | `packages/core`, `packages/utils`, `packages/render` | An issue or a pull request with tests and a changeset                                                          |
| A docs page (guides, concepts, getting started)  | `apps/docs/content/en/`                              | A pull request; use **Edit this page** at the side of any page                                                 |
| The site itself (layout, components, MCP server) | `apps/docs/`                                         | An issue first for anything large                                                                              |
| The conversion skill                             | `.agents/skills/welldot-converter/`                  | A pull request                                                                                                 |

The repository's [CONTRIBUTING.md](https://github.com/welldothq/welldot/blob/main/CONTRIBUTING.md) covers setup, branches, commits and releases.

## Changes that touch the docs

A change to the spec or to a package's public API usually needs a docs change in the same pull request. [Update rules](/contributing/update-rules) says exactly what, and CI checks the parts that can be checked: examples must validate, links and spec anchors must resolve, and the site must build.

## Writing docs

- [Writing docs](/contributing/writing-docs): the writing rules, how to add a page and how to run the site locally.
- [Content components](/contributing/components): callouts, Do/Don't blocks, code groups, diagrams and live well previews, with their Markdown.

## Reporting a problem

Found a page that is wrong, unclear or out of date? Open an [issue](https://github.com/welldothq/welldot/issues) with the page address and what you expected. For a mistake in the specification itself, say which section and quote the text.
