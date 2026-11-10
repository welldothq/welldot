---
'@welldot/core': minor
---

Adds recommended vocabulary values for hand-dug wells (spec v2.4). `DRILLING_METHODS` gains `manual` (manual excavation), so the `DrillingMethod` type now includes it. `CONSTRUCTION_MATERIALS` gains the lining materials `brick`, `stone_masonry`, `precast_concrete` and `cast_in_place_concrete`, meant mainly for the `well_case` of a `hand_dug` well. Both vocabularies stay open, so existing files are unaffected. See [Changes in v2.4](https://github.com/welldothq/welldot/blob/main/spec/v2/overview.md).
