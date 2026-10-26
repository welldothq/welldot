---
title: The specification
description: The normative .well specification, how it is organized, how it relates to this site and to the packages, and how it changes.
navigation:
  title: About the spec
---

The specification is the standard that defines the `.well` format. It is written as plain Markdown in the [`spec/` folder](https://github.com/welldothq/welldot/tree/main/spec) of the repository and rendered on this site as it is, with heading anchors and links adapted for the web. Everything else on this site explains it; when a guide and the spec seem to disagree, the spec is right.

The current revision is **2.4**.

## The documents

| Document                                              | What it covers                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Overview](/format/spec/v2/overview)                  | The changes in each revision, the purpose of the format, its design principles and its known limitations.                                                                 |
| [Format reference](/format/spec/v2/format-reference)  | Top-level fields, versioning and deprecation, datetimes, recommended vocabularies, `well_id`, `location`, units, profiles, extensibility, cross-references and precision. |
| [Object schemas](/format/spec/v2/object-schemas)      | Every object: construction, geology, hydrodynamic events, aquifer analysis, history logs, pumps, permits, meters, production, operating regime, and a complete example.   |
| [Water quality](/format/spec/v2/water-quality)        | Water samples and results, their units, the parameter vocabulary and regulatory profiles.                                                                                 |
| [Interoperability](/format/spec/v2/interoperability)  | The reserved JSON-LD context, the mapping to GroundWater ML 2 and JSON Schema validation.                                                                                 |
| [FGDC textures](/format/spec/reference/fgdc-textures) | The 282 lithology pattern codes.                                                                                                                                          |
| [v1 (archived)](/format/spec/v1/well-format)          | The first version, kept for reference. v2 readers upgrade v1 files on read.                                                                                               |

## How to read it

The spec uses the keywords MUST, SHOULD and MAY in their usual standards sense: MUST is a requirement, SHOULD a strong recommendation, MAY an option. Sections marked _(since v2.x)_ were added in that revision.

If you are new to the format, start with [What is .well?](/format/getting-started/what-is-well) and the [concepts](/format/concepts/depths-and-intervals), then come back to the spec for the exact rules.

## How it relates to the code

- [`@welldot/core`](/core) implements the spec. Its tests compare the vocabulary tables in the spec with the published constants and parse the spec's complete example, so the two cannot drift apart silently.
- The [JSON Schema](/format/reference/json-schema) is generated from `@welldot/core` and published at `https://welldot.org/schema/v2/well.schema.json`.
- The [object reference](/format/reference/objects) is generated from the schema and links back to the spec sections.

## How it changes

Changes to the format start as an issue on [GitHub](https://github.com/welldothq/welldot/issues). The spec text is edited first, then the implementation and these docs, in the same change ([update rules](/contributing/update-rules)). Each revision adds a "Changes in v2.x" section to the overview; the [changelog](/format/changelog) links to them.

The spec files are licensed under Apache 2.0, like the rest of the project.
