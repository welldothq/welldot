export type UnitsTypes = 'metric' | 'imperial';
export type LengthUnits = 'm' | 'ft';
export type DiameterUnits = 'mm' | 'inches';
/** Display/input units for volumetric flow. Canonical storage is always `m3/h`. */
export type FlowUnits = 'm3/h' | 'L/s' | 'gpm';
/** Display/input units for power. Canonical storage is always `kW`. */
export type PowerUnits = 'kW' | 'cv' | 'hp';
/** Display/input units for volume. Canonical storage is always `m3`. `gal` is the US gallon. */
export type VolumeUnits = 'm3' | 'L' | 'ft3' | 'gal';
/**
 * Display/input units for pressure head. Canonical storage is always metres of water (`m`).
 * `mca` (metro de coluna d'agua) is metres of water, same as `m`.
 */
export type HeadUnits = 'm' | 'mca' | 'ft' | 'kPa' | 'bar' | 'psi' | 'kgf/cm2';

export type Units = {
  length: LengthUnits;
  diameter: DiameterUnits;
  /** Defaults to `m3/h` when absent. */
  flow?: FlowUnits;
  /** Defaults to `kW` when absent. */
  power?: PowerUnits;
  /** Defaults to `m3` when absent. */
  volume?: VolumeUnits;
  /** Defaults to the length unit when absent. */
  head?: HeadUnits;
};
