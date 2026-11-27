import type { VocabEntry } from '@welldot/core';
import {
  flowFromCanonical,
  formatVocabList,
  getVocabLabel,
  headFromCanonical,
  metersToFeet,
  mmToInches,
  powerFromCanonical,
  volumeFromCanonical,
} from '@welldot/core';
import {
  formatNumber,
  resolveDiameterUnitLabel,
  resolveFlowUnitLabel,
  resolveHeadUnitLabel,
  resolveVolumeUnitLabel,
} from '@welldot/utils';
import type { PdfContext } from './types/options.types';

export interface PdfFormatters {
  formatLength(
    _value: number | null | undefined,
    _fractionDigits?: number,
  ): string;
  /** Depth with only the decimals it needs (`12 m`, `12.5 m`). */
  formatDepth(_value: number | null | undefined): string;
  /** Depth interval with one unit suffix (`0–12 m`). */
  formatDepthRange(_from: number, _to: number): string;
  formatDiameter(
    _value: number | null | undefined,
    _fractionDigits?: number,
  ): string;
  formatVolume(
    _volumeM3: number | null | undefined,
    _fractionDigits?: number,
  ): string;
  /** With `trim`, `fractionDigits` is a maximum (`211 m³/h`) instead of a fixed count. */
  formatFlow(
    _value: number | null | undefined,
    _fractionDigits?: number,
    _trim?: boolean,
  ): string;
  /** Head (stored in m) in the display head unit, up to 2 decimals unless `fractionDigits` fixes them. */
  formatHead(
    _value: number | null | undefined,
    _fractionDigits?: number,
  ): string;
  formatPower(
    _value: number | null | undefined,
    _fractionDigits?: number,
  ): string;
  lengthUnit: PdfContext['units']['length'];
  diameterUnit: PdfContext['units']['diameter'];
  /** Display label of the resolved volume unit (`m³`, `L`, `ft³`, `gal`). */
  volumeUnitLabel: string;
  /** Export locale the labels resolve in. */
  locale: string;
  /** Label of a core/utils vocabulary value in the export locale. */
  vocab(_vocab: readonly VocabEntry[], _value: string): string;
  /** Comma-separated labels of a multi-valued vocabulary field. */
  vocabList(
    _vocab: readonly VocabEntry[],
    _values: readonly string[] | undefined,
  ): string;
}

/**
 * Unit/vocabulary formatters bound to the context's display units and locale.
 */
export function createPdfFormatters(
  ctx: Pick<PdfContext, 'units' | 'locale'>,
): PdfFormatters {
  const { locale } = ctx;
  const {
    length: lengthUnit,
    diameter: diameterUnit,
    flow: flowUnit,
    power: powerUnit,
    volume: volumeUnit,
    head: headUnit,
  } = ctx.units;
  const volumeUnitLabel = resolveVolumeUnitLabel(volumeUnit);

  function formatLength(
    value: number | null | undefined,
    fractionDigits = 2,
  ): string {
    if (value == null) return '—';
    const displayValue = lengthUnit === 'ft' ? metersToFeet(value) : value;
    return formatNumber(displayValue, { fractionDigits, suffix: lengthUnit });
  }

  function depthNumber(value: number): string {
    const displayValue = lengthUnit === 'ft' ? metersToFeet(value) : value;
    return formatNumber(displayValue, {
      maximumFractionDigits: lengthUnit === 'ft' ? 1 : 2,
    });
  }

  function formatDepth(value: number | null | undefined): string {
    if (value == null) return '—';
    return `${depthNumber(value)} ${lengthUnit}`;
  }

  function formatDepthRange(from: number, to: number): string {
    return `${depthNumber(from)}–${depthNumber(to)} ${lengthUnit}`;
  }

  function formatDiameter(
    value: number | null | undefined,
    fractionDigits = 1,
  ): string {
    if (value == null) return '—';
    const displayValue = diameterUnit === 'inches' ? mmToInches(value) : value;
    return formatNumber(displayValue, {
      fractionDigits,
      suffix: resolveDiameterUnitLabel(diameterUnit, locale),
    });
  }

  function formatVolume(
    volumeM3: number | null | undefined,
    fractionDigits = 2,
  ): string {
    if (volumeM3 == null) return '—';
    return formatNumber(volumeFromCanonical(volumeM3, volumeUnit), {
      fractionDigits,
      suffix: volumeUnitLabel,
    });
  }

  function formatFlow(
    value: number | null | undefined,
    fractionDigits = 1,
    trim = false,
  ): string {
    if (value == null) return '—';
    return formatNumber(flowFromCanonical(value, flowUnit), {
      ...(trim
        ? { maximumFractionDigits: fractionDigits }
        : { fractionDigits }),
      suffix: resolveFlowUnitLabel(flowUnit),
    });
  }

  function formatHead(
    value: number | null | undefined,
    fractionDigits?: number,
  ): string {
    if (value == null) return '—';
    return formatNumber(headFromCanonical(value, headUnit), {
      ...(fractionDigits === undefined
        ? { maximumFractionDigits: 2 }
        : { fractionDigits }),
      suffix: resolveHeadUnitLabel(headUnit),
    });
  }

  function formatPower(
    value: number | null | undefined,
    fractionDigits = 2,
  ): string {
    if (value == null) return '—';
    return formatNumber(powerFromCanonical(value, powerUnit), {
      maximumFractionDigits: fractionDigits,
      suffix: powerUnit,
    });
  }

  return {
    locale,
    vocab: (vocab, value) => getVocabLabel(vocab, value, locale),
    vocabList: (vocab, values) => formatVocabList(vocab, values, locale),
    formatLength,
    formatDepth,
    formatDepthRange,
    formatDiameter,
    formatVolume,
    formatFlow,
    formatHead,
    formatPower,
    lengthUnit,
    diameterUnit,
    volumeUnitLabel,
  };
}
