---
'@welldot/utils': patch
---

The SIAGAS importer maps hand-dug wells to the v2.4 recommended values: a manual or excavated drilling method becomes `manual`, and casing materials such as tijolo, alvenaria de pedra, manilha de concreto and concreto become `brick`, `stone_masonry`, `precast_concrete` and `cast_in_place_concrete`. Before, they were kept as free text with an `unmapped_value` warning.
