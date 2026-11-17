---
'@welldot/utils': patch
'@welldot/render': patch
'@welldot/pdf': patch
---

Handle pipe sections without a material (`.well` v2.5). The SIAGAS converter omits `type` when a casing or screen has no material, instead of writing an empty string. The renderer leaves the material out of construction labels and tooltips instead of printing "undefined". The PDF casing, reduction and screen tables show "—".
