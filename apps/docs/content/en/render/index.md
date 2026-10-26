---
title: '@welldot/render'
description: A D3 renderer that draws a .well file as a technical well profile in SVG, with lithology patterns, construction, fractures, caves, labels, zoom and tooltips.
navigation:
  title: Introduction
---

`@welldot/render` draws a `.well` file as a well profile: the lithological column with FGDC patterns, the borehole and its construction, the current pump, fractures, caves, depth labels and unit strips, at true depth scale. It renders into an `<svg>` element with D3 and works in any web framework or none.

::well-preview{example="belem-pa-pirabas-abastecimento"}
::

The profile above is drawn by this package from a 265 m example well. The same renderer draws the welldot.org editor and the PDF reports of `@welldot/pdf`.

```ts
import { INTERACTIVE_RENDER_CONFIG, WellRenderer } from '@welldot/render';

const renderer = new WellRenderer(
  [
    {
      selector: '#profile',
      width: 420,
      height: 640,
      margins: { top: 24, right: 16, bottom: 20, left: 48 },
    },
  ],
  { renderConfig: INTERACTIVE_RENDER_CONFIG },
);

await renderer.prepareSvg(); // once, after the <svg> is in the page
renderer.draw(well); // again whenever the data changes
```

## Features

- **Lithology** with FGDC texture patterns and layer colors, geologic and aquifer unit strips, and description annotations.
- **Construction** drawn as built: telescoping holes, casing and screens, reductions, gravel pack and seals in the annulus, centralizers, casing shoes, stick-up and the wellhead pad.
- **The current pump**, from `pump_installations`.
- **Fractures and caves**, with dip and water-intake markers.
- **Several panels** for long wells, with chosen depth windows and repeated bands for paged output.
- **Interaction**: zoom, pan, tooltips and highlights, driven by the mouse or by your own toolbar.
- **Themes, units and locale**: every color is configurable, lengths in meters or feet, diameters in millimeters or inches, labels in English or Portuguese.

## Next

- [Installation](/render/getting-started/installation)
- [First use](/render/getting-started/first-use)
- [API reference](/render/api)
- [Changelog](/render/changelog)
