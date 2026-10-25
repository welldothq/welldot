---
title: Welldot documentation
description: Documentation for .well, the open JSON format for water well data, and the @welldot TypeScript packages that read, validate, analyze and draw it.
layout: landing
navigation: false
---

::u-page-hero{orientation="horizontal"}
#headline
:badge{label="Format v2.4 · Apache 2.0" variant="subtle" color="neutral"}

#title
The record of a water well, [as data]{.landing-em}.

#description
`.well` is an open JSON format for everything a well report holds: construction, lithology, pumping tests, permits and water quality. These docs cover the format, its specification and the libraries that read, validate, analyze and draw it.

#links
:u-button{to="/format" size="lg" trailing-icon="i-lucide-arrow-right" label="Read about the format"} :u-button{to="/format/spec" size="lg" color="neutral" variant="outline" icon="i-lucide-scale" label="Specification"}

#default
  :::well-preview{example="coluna-mg-cristalino-abastecimento"}
  :::
::

::u-page-section{headline="Start here" title="Two ways in"}
  :::u-page-grid{class="lg:grid-cols-2"}
    ::::u-page-card{title="I work with wells" icon="i-lucide-mountain" to="/format/getting-started/for-geologists" spotlight variant="subtle"}
    #description
    Geologists, hydrogeologists and drillers: how a drilling report maps onto a `.well` file, explained in field terms. Lithology, construction, tests and water quality, no code needed.
    ::::

    ::::u-page-card{title="I build software" icon="i-lucide-code" to="/format/getting-started/for-developers" spotlight variant="subtle"}
    #description
    Developers: read and validate files from TypeScript or any language with the JSON Schema, what the schema guarantees, and which parts of the spec matter for editors and databases.
    ::::
  :::
::

::u-page-section{headline="The format" title="One file, one well, every stage of its life"}
#description
A `.well` file starts as a drilling report and grows with the well: tests, permits, meters, analyses. Every field has one meaning and one unit, written down in a versioned specification.

  :::u-page-grid
    ::::u-page-card{title="Plain JSON" icon="i-lucide-braces" to="/format/getting-started/what-is-well" variant="ghost"}
    #description
    Opens in any editor, parses in any language, diffs in git. Full field names, so a file reads without the spec.
    ::::

    ::::u-page-card{title="One unit per quantity" icon="i-lucide-ruler" to="/format/concepts/units-and-precision" variant="ghost"}
    #description
    Meters, millimeters, m³/h. The file never declares units, so two files of the same well hold the same numbers.
    ::::

    ::::u-page-card{title="Incomplete is valid" icon="i-lucide-file-check" to="/format/concepts/depths-and-intervals" variant="ghost"}
    #description
    Unknown values are left out, never invented. A registry record with only its construction is a valid file.
    ::::

    ::::u-page-card{title="Open to extension" icon="i-lucide-puzzle" to="/format/concepts/extensibility" variant="ghost"}
    #description
    `x-` fields carry what the spec does not define, and every reader keeps them.
    ::::

    ::::u-page-card{title="Neutral by design" icon="i-lucide-globe" to="/format/concepts/profiles" variant="ghost"}
    #description
    No national rules inside the file. Regulators add theirs with profiles; limits are chosen when reading.
    ::::

    ::::u-page-card{title="19 example wells" icon="i-lucide-library" to="/format/reference/examples" variant="ghost"}
    #description
    Complete files built on real Brazilian wells: karst, crystalline, sedimentary, flowing, hand-dug, messy.
    ::::
  :::
::

::u-page-section{headline="Packages" title="TypeScript libraries, framework-free"}
#description
The reference implementation of the format, published on npm under Apache 2.0. No UI framework required.

  :::u-page-grid
    ::::u-page-card{title="@welldot/core" icon="i-lucide-box" to="/core" spotlight}
    #description
    Types, Zod validators, serialization, unit conversion, vocabularies with English and Portuguese labels, water quality limit sets.
    ::::

    ::::u-page-card{title="@welldot/utils" icon="i-lucide-ruler" to="/utils" spotlight}
    #description
    Gravel pack volumes, drawdown and specific capacity, permit status and deadlines, production totals, hydrochemistry.
    ::::

    ::::u-page-card{title="@welldot/render" icon="i-lucide-layers" to="/render" spotlight}
    #description
    A D3 renderer that draws the profile in SVG: FGDC lithology patterns, construction as built, zoom, tooltips, legends.
    ::::
  :::
::

::u-page-section{headline="AI and agents" title="Docs your assistant can check against" orientation="horizontal"}
#description
Connect Claude, Cursor, VS Code or Gemini CLI to the docs MCP server. Your assistant searches the spec instead of guessing, and validates every `.well` file it writes with the same `parseWell` the libraries use.

#links
:u-button{to="/ai/mcp" trailing-icon="i-lucide-arrow-right" label="Set up the MCP server"} :u-button{to="/ai/conversion-skill" color="neutral" variant="outline" label="Convert reports with an assistant"}

#default
```bash [Claude Code]
claude mcp add --transport http welldot https://docs.welldot.org/mcp

# Tools your assistant gets:
#   search_docs    search the spec, guides and API docs
#   get_page       read any page as Markdown
#   validate_well  check a .well file, errors with paths
```
::
