---
title: '@welldot/utils'
description: Pure functions that analyze a parsed .well file, from volumes and drawdown to permit status, production totals and water quality indicators, following the spec's derivation rules.
navigation:
  title: Introduction
---

`@welldot/utils` computes what a `.well` file deliberately does not store. The spec forbids storing derived values ([design principles](/format/spec/v2/overview#design-principles)): drawdown, specific capacity, production volumes, permit status and exceedances are calculated from the data whenever they are needed. This package is where those calculations live, so every tool gets the same answers.

All functions are pure: they take a `Well` from [`@welldot/core`](/core) and return values, with no DOM, no network and no side effects. The one exception is the SIAGAS importer, a separate entry point that fetches registry pages.

```ts
import { parseWell } from '@welldot/core';
import {
  calculateHoleFillVolume,
  formatNumber,
  getLatestStaticLevel,
} from '@welldot/utils';

const well = parseWell(text);

formatNumber(calculateHoleFillVolume('gravel_pack', well), {
  fractionDigits: 2,
  suffix: 'm³',
}); // '1.88 m³'
getLatestStaticLevel(well); // 3.94 (m below ground)
```

## What it covers

| Area                 | Examples                                                                                | Guide                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Geometry and volumes | Annular volumes, gravel pack and seal estimates, depths and diameters                   | [Geometry and volumes](/utils/guides/geometry-and-volumes)                                 |
| Hydraulics           | Static and dynamic levels, drawdown, specific capacity, Jacob losses, test chart series | [Water levels and pumping tests](/utils/guides/pumping-tests)                              |
| Permits              | Permit status, condition deadlines and their fulfillment, permit warnings               | [Permits](/utils/guides/permits)                                                           |
| Operation            | Meter volumes, production by period, operating regime, well status, pumps               | [Operation and production](/utils/guides/operation)                                        |
| Water quality        | Exceedances, ion balance, facies, Piper and Stiff values, QA/QC                         | [Water quality](/utils/guides/water-quality)                                               |
| Import               | Data logger exports, the SIAGAS registry                                                | [Logger import](/utils/guides/logger-import), [SIAGAS import](/utils/guides/siagas-import) |
| Display              | Number, date and coordinate formatting                                                  | [Formatting](/utils/guides/formatting)                                                     |

## Units

The package follows the format's units: depths in meters, diameters in millimeters, flow in m³/h ([Units](/format/spec/v2/format-reference#units)). Volumes come out in m³, specific capacity in m²/h (m³/h per meter) and unit drawdown in h/m².

## Next

- [Installation](/utils/getting-started/installation)
- [First use](/utils/getting-started/first-use)
- [API reference](/utils/api)
- [Changelog](/utils/changelog)
