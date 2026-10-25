---
title: Reference
description: 'Lookup material for the .well format, generated from the schema and the spec: objects and fields, the JSON Schema, vocabularies and example files.'
navigation:
  title: Overview
---

These pages are for looking things up. The object reference and the JSON Schema are generated from the reference implementation, so they always match it. The meaning of each field, and the rules around it, are in the [specification](/format/spec), and every object page links to its section there.

::card-group

:::card{title="Object reference" icon="i-lucide-table-properties" to="/format/reference/objects"}
Every block and object of a `.well` file, with its fields, types, constraints and spec section.
:::

:::card{title="JSON Schema" icon="i-lucide-file-json" to="/format/reference/json-schema"}
The published schema, how it is generated and how to validate with it in any language.
:::

:::card{title="Example wells" icon="i-lucide-library" to="/format/reference/examples"}
Nineteen complete files with live previews, for learning and testing.
:::

:::card{title="FGDC textures" icon="i-lucide-grid-3x3" to="/format/spec/reference/fgdc-textures"}
All 282 lithology pattern codes used by `texture`.
:::

::

## Vocabularies

The recommended and allowed values of each field are listed in the specification:

- [Recommended vocabularies](/format/spec/v2/format-reference#recommended-vocabularies): construction methods, uses, materials, event types, log categories, permit types and more.
- [Water quality recommended values](/format/spec/v2/water-quality#recommended-values) and the [parameter vocabulary](/format/spec/v2/water-quality#parameter-vocabulary).
- [Texture vocabularies](/format/spec/v2/object-schemas#vocabulary-values) for lithology patterns.

The same lists, with English and Portuguese labels, are exported by `@welldot/core` as data ([Vocabularies and textures](/core/guides/vocabularies-and-textures)). [Vocabularies](/format/concepts/vocabularies) explains open and closed lists.

## Units

Every field's unit is in the spec's [field-to-unit binding](/format/spec/v2/format-reference#field-to-unit-binding-normative). [Units and precision](/format/concepts/units-and-precision) summarizes it.
