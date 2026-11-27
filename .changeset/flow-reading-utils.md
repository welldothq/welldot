---
'@welldot/utils': minor
---

Support flow readings (`.well` v2.6). Adds `getFlowReadings`, which returns the flow readings of a well in time order, and `resolveHeadUnit` / `resolveHeadUnitLabel`, which resolve the display unit for heads: `units.head` when set, otherwise the length unit (`m` or `ft`). The meter warnings now also cover flow readings that carry a `meter_id`. Flow readings are never added to volume totals.
