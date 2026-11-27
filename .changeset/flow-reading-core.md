---
'@welldot/core': minor
---

Implement `.well` format v2.6: the `flow_reading` production entry. Pump operators record instantaneous flow from telemetry, SCADA or portable meters, often with the wellhead gauge pressure. A flow reading requires a `datetime` and a non-negative `flow_rate` in m³/h, and may carry `flow_rate_precision`, a `discharge_head` in m of head (negative to record vacuum), `discharge_head_precision`, `meter_id` and `source` (`manual`, `telemetry` or an `x-` value). Flow readings never enter a volume derivation. Integrating them over time is an estimate and belongs in `estimated_volume` with `method: flow_time`.

- Adds the `FlowReading` type, `FlowReadingSchema`, the closed-vocabulary labels and the JSON Schema branch. `serializeWell` now writes `"version": "2.6"`.
- Adds `HeadUnits` (`m`, `mca`, `ft`, `kPa`, `bar`, `psi`, `kgf/cm2`), an optional `units.head`, and `headToCanonical` / `headFromCanonical`.

Every valid v2.5 file is still valid. Readers from 0.8 open v2.6 files and keep a flow reading as an unknown production entry, excluded from volumes.
