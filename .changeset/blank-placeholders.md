---
'@welldot/core': patch
---

Read and write the placeholders of older editors as absent, as `.well` v2.5 requires. Up to v2.4 the pipe material was required, so files carry `type: ""` for an unknown material, and editors kept `cement_pad: { type: "", width: 0, thickness: 0, length: 0 }` to mean "no pad".

- `deserializeWell` and `parseWell` drop an empty or whitespace-only `type` on `well_case`, `well_screen` and `reduction` items, and a `cement_pad` whose members are all blank or zero, in files of every version (`1`, `2`, `"2.x"` and the unversioned legacy shapes, including a `constructive` sub-object).
- `serializeWell` never writes them, so a well read from an older file no longer produces a non-conforming v2.5 file.
- `deserializeWell` no longer adds an empty `cement_pad` to a file that has none. Check `cement_pad?.thickness` before drawing or showing a pad.

A v2 file still keeps its `version` as written (`2`, `"2.4"`, …); `serializeWell` always writes `WELL_FORMAT_VERSION`. These rules are now stated in the spec.
