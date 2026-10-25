/**
 * Object reference: which schema block each page documents, and where the spec defines it.
 *
 * The JSON Schema inlines every object (no `$defs`), so the object pages are keyed by the
 * top-level block of a `.well` file, named after the spec's own object names.
 * `SPEC_ANCHORS` values are routes with the heading id the site renders (github-slugger);
 * `reference-map.test`-style checks in `generate-reference.test.ts` verify each against the spec.
 */

const OBJ = '/format/spec/v2/object-schemas';
const REF = '/format/spec/v2/format-reference';
const WQ = '/format/spec/v2/water-quality';

/** Object name -> top-level property of the schema that holds it. `Well` is the root. */
export const OBJECT_PROPERTIES: Record<string, string> = {
  WellId: 'well_id',
  Location: 'location',
  BoreHole: 'bore_hole',
  WellCase: 'well_case',
  Reduction: 'reduction',
  WellScreen: 'well_screen',
  SurfaceCase: 'surface_case',
  HoleFill: 'hole_fill',
  Centralizer: 'centralizers',
  CementPad: 'cement_pad',
  Lithology: 'lithology',
  Fracture: 'fractures',
  Cave: 'caves',
  HydrodynamicEvent: 'hydrodynamic_events',
  AquiferAnalysis: 'aquifer_analysis',
  HistoryLogEntry: 'history_logs',
  Attachment: 'attachments',
  PumpInstallation: 'pump_installations',
  Permit: 'permits',
  Meter: 'meters',
  Production: 'production',
  OperatingRegime: 'operating_regime',
  WaterSample: 'water_samples',
};

export const SPEC_ANCHORS: Record<string, string> = {
  Well: `${REF}#top-level-structure`,
  WellId: `${REF}#well_id`,
  Location: `${REF}#location`,
  BoreHole: `${OBJ}#borehole--bore_hole`,
  WellCase: `${OBJ}#wellcase--well_case`,
  Reduction: `${OBJ}#reduction--reduction`,
  WellScreen: `${OBJ}#wellscreen--well_screen`,
  SurfaceCase: `${OBJ}#surfacecase--surface_case`,
  HoleFill: `${OBJ}#holefill--hole_fill`,
  Centralizer: `${OBJ}#centralizer--centralizers-since-v21`,
  CementPad: `${OBJ}#cementpad--cement_pad`,
  Lithology: `${OBJ}#lithology--lithology`,
  Fracture: `${OBJ}#fracture--fractures`,
  Cave: `${OBJ}#cave--caves`,
  HydrodynamicEvent: `${OBJ}#hydrodynamic_events`,
  AquiferAnalysis: `${OBJ}#aquifer_analysis`,
  HistoryLogEntry: `${OBJ}#historylogentry`,
  Attachment: `${OBJ}#attachment`,
  PumpInstallation: `${OBJ}#pumpinstallation`,
  Permit: `${OBJ}#permit`,
  Meter: `${OBJ}#meter`,
  Production: `${OBJ}#production-since-v23`,
  OperatingRegime: `${OBJ}#operatingregime`,
  WaterSample: `${WQ}#watersample`,
};
