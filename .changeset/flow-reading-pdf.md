---
'@welldot/pdf': minor
---

Render flow readings (`.well` v2.6) and add a head display unit. The production ledger lists each flow reading with its flow rate, discharge head, meter and source, and keeps readings out of the volume totals. Adds `units.head` and `formatHead`; pump rated head is now formatted as a head instead of a length, and defaults to the length unit when `units.head` is unset. `formatFlow` gains a `trim` option so readings print as `211 m³/h`.
