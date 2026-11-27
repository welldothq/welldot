// ─── Unit display labels ─────────────────────────────────────────────────────
import type {
  DiameterUnits,
  FlowUnits,
  HeadUnits,
  LengthUnits,
  VolumeUnits,
} from '@welldot/core';

/**
 * Display suffix of a diameter unit. `mm` is locale-invariant; `inches`
 * reads `"` in Portuguese (Brazilian well reports) and `in.` otherwise.
 */
export function resolveDiameterUnitLabel(
  unit: DiameterUnits,
  locale: string,
): string {
  if (unit === 'mm') return 'mm';
  return locale === 'pt' ? '"' : 'in.';
}

/** Display suffix of a flow unit (`m3/h` is the storage token, `m³/h` the label). */
export function resolveFlowUnitLabel(unit: FlowUnits): string {
  return unit === 'm3/h' ? 'm³/h' : unit;
}

const VOLUME_UNIT_LABELS: Record<VolumeUnits, string> = {
  m3: 'm³',
  L: 'L',
  ft3: 'ft³',
  gal: 'gal',
};

/** Display suffix of a volume unit (`m3`/`ft3` are storage tokens, `m³`/`ft³` the labels). */
export function resolveVolumeUnitLabel(unit: VolumeUnits): string {
  return VOLUME_UNIT_LABELS[unit] ?? unit;
}

/**
 * Display unit of heads (`rated_head`, `discharge_head`): the explicit
 * `units.head` when set, else it follows the length unit (`m` → `m`,
 * `ft` → `ft`).
 */
export function resolveHeadUnit(units: {
  length: LengthUnits;
  head?: HeadUnits | null;
}): HeadUnits {
  return units.head ?? units.length;
}

/** Display suffix of a head unit (`kgf/cm2` is the storage token, `kgf/cm²` the label). */
export function resolveHeadUnitLabel(unit: HeadUnits): string {
  return unit === 'kgf/cm2' ? 'kgf/cm²' : unit;
}
