---
title: The .well format
description: An open JSON format for the complete record of a water well, from construction and lithology to tests, operation, permits and water quality.
navigation:
  title: Introduction
---

A `.well` file is the record of one water well, written as a single JSON document. It holds what a drilling report, a well log and the well's later history hold today, in a form that software can read, check and draw: the borehole and its casing, the lithological column, pumping tests, water levels, permits, meters and water analyses.

The format is open (Apache 2.0) and defined by a written [specification](/format/spec). Any tool can read and write it. [welldot.org](https://welldot.org) is one editor among them, and the [`@welldot/*` packages](/core) are one implementation.

::well-preview{example="estrela-doeste-sp-bauru-serra-geral"}
::

## Where to start

::card-group

:::card{title="What is .well?" icon="i-lucide-file-braces" to="/format/getting-started/what-is-well"}
What a file holds, why it exists and how it relates to the spec and the packages.
:::

:::card{title="For geologists" icon="i-lucide-mountain" to="/format/getting-started/for-geologists"}
How a drilling report maps onto the file: lithology, construction, tests, operation, permits and water quality.
:::

:::card{title="For developers" icon="i-lucide-code" to="/format/getting-started/for-developers"}
Read, validate and write `.well` files from code, and what the schema guarantees.
:::

:::card{title="Your first .well file" icon="i-lucide-file-plus" to="/format/getting-started/first-well-file"}
Write a small, valid file by hand and see it drawn.
:::

::

## How this section is organized

- **Getting started** introduces the format for each kind of reader.
- **Concepts** explains the ideas the whole format rests on: depths, units, vocabularies, profiles, versions and extensions.
- **Guides** walk through tasks: writing a file, converting a report, validating, extending the format and building software on it.
- **Reference** lists every object and field (generated from the schema), links the JSON Schema and shows the example wells.
- **Specification** is the normative text, rendered as it is written in the repository. When a guide and the spec seem to differ, the spec is right.
- **Changelog** lists the revisions of the format.

::note
These pages explain the format and link to the rules. The rules themselves live only in the [specification](/format/spec), so there is a single source to cite.
::
