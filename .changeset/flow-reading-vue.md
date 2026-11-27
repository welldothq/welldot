---
'@welldot/vue': minor
---

Add an optional `head` display unit to `WelldotUnits` (`m`, `mca`, `ft`, `kPa`, `bar`, `psi`, `kgf/cm2`). It defaults to the length unit when unset, so existing configurations keep their output. `useWellUnits`, `WellUnitInput` and grid columns accept the `head` unit type, for pump rated head and the discharge head of flow readings.
