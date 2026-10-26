---
title: '@welldot/core'
description: The TypeScript reference implementation of the .well format, with types, Zod validators, serialization, unit conversion, vocabularies and water quality data.
navigation:
  title: Introduction
---

`@welldot/core` is the reference implementation of the [`.well` format](/format). It gives TypeScript and JavaScript programs everything needed to read, check and write `.well` files, with no DOM and no network access.

::code-group

```bash [pnpm]
pnpm add @welldot/core
```

```bash [npm]
npm install @welldot/core
```

```bash [yarn]
yarn add @welldot/core
```

::

```ts
import { parseWell, serializeWell } from '@welldot/core';

const well = parseWell(text); // validated and typed; v1 files are upgraded
well.name = 'PT-01';
const out = serializeWell(well); // "version": "2.4", unknown members kept
```

## What it contains

| Area          | Exports                                                                                                 | Guide                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Types         | `Well` and every object type (`BoreHole`, `Lithology`, `HydrodynamicEvent`, `Permit`, `WaterSample`, …) | [API reference](/core/api)                                          |
| Validation    | `parseWell`, `WellSchema` and one Zod schema per object                                                 | [Parsing and validating](/core/guides/parsing-and-validating)       |
| Serialization | `serializeWell`, `deserializeWell`, `redactWell`, `isWellEmpty`, `hasWellData`                          | [Serializing and sharing](/core/guides/serializing-and-sharing)     |
| Units         | Conversions between the canonical SI units and display units                                            | [Unit conversion](/core/guides/unit-conversion)                     |
| Vocabularies  | Every recommended and closed vocabulary with English and Portuguese labels, and the FGDC textures       | [Vocabularies and textures](/core/guides/vocabularies-and-textures) |
| Water quality | The 98-parameter vocabulary and the WHO, EU and Brazilian limit sets                                    | [Water quality vocabulary](/core/guides/water-quality-vocabulary)   |
| Versions      | `WELL_FORMAT_VERSION`, version parsing and comparison, time zone checks                                 | [Versions and time zones](/core/guides/versions-and-time-zones)     |
| Data          | The JSON Schema (`@welldot/core/well.schema.json`) and 19 example wells (`@welldot/core/examples/*`)    | [Example wells](/format/reference/examples)                         |

## Relationship to the spec

The package follows the [specification](/format/spec) and is tested against it: the vocabulary constants are compared with the spec's tables, and the spec's complete example must parse. The [JSON Schema](/format/reference/json-schema) is generated from its Zod validators. The current release, 0.5.0, implements format revision 2.4.

## Next

- [Installation](/core/getting-started/installation)
- [First use](/core/getting-started/first-use): read, inspect, change and save a well.
- [API reference](/core/api), generated from the source.
- [Changelog](/core/changelog)
