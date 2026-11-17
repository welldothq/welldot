---
'@welldot/core': minor
---

Implement `.well` format v2.5: the material (`type`) of `well_case`, `well_screen` and `reduction` sections is optional. Absent means the material is unknown, the usual case for sections transcribed from old drilling reports. `WellCase.type`, `WellScreen.type` and `Reduction.type` become optional in the types, the Zod schemas and the JSON Schema, and `serializeWell` now writes `"version": "2.5"`.

Readers up to 0.7 reject a file that leaves the material out, so upgrade readers before writing such files. Every valid v2.4 file is still valid.
