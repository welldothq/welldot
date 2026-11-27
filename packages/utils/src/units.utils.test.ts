import { describe, expect, it } from 'vitest';
import {
  resolveDiameterUnitLabel,
  resolveFlowUnitLabel,
  resolveHeadUnit,
  resolveHeadUnitLabel,
  resolveVolumeUnitLabel,
} from './units.utils';

describe('resolveDiameterUnitLabel', () => {
  it('returns mm regardless of locale', () => {
    expect(resolveDiameterUnitLabel('mm', 'en')).toBe('mm');
    expect(resolveDiameterUnitLabel('mm', 'pt')).toBe('mm');
  });

  it('returns in. for inches in English', () => {
    expect(resolveDiameterUnitLabel('inches', 'en')).toBe('in.');
  });

  it('returns the double-quote symbol for inches in Portuguese', () => {
    expect(resolveDiameterUnitLabel('inches', 'pt')).toBe('"');
  });
});

describe('resolveFlowUnitLabel / resolveVolumeUnitLabel', () => {
  it('turns storage tokens into display symbols', () => {
    expect(resolveFlowUnitLabel('m3/h')).toBe('m³/h');
    expect(resolveFlowUnitLabel('L/s')).toBe('L/s');
    expect(resolveVolumeUnitLabel('m3')).toBe('m³');
    expect(resolveVolumeUnitLabel('ft3')).toBe('ft³');
    expect(resolveVolumeUnitLabel('gal')).toBe('gal');
  });
});

describe('resolveHeadUnit / resolveHeadUnitLabel', () => {
  it('follows the length unit when no head unit is set', () => {
    expect(resolveHeadUnit({ length: 'ft' })).toBe('ft');
    expect(resolveHeadUnit({ length: 'm' })).toBe('m');
    expect(resolveHeadUnit({ length: 'ft', head: null })).toBe('ft');
  });

  it('prefers an explicit head unit', () => {
    expect(resolveHeadUnit({ length: 'ft', head: 'mca' })).toBe('mca');
  });

  it('labels head units', () => {
    expect(resolveHeadUnitLabel('kgf/cm2')).toBe('kgf/cm²');
    expect(resolveHeadUnitLabel('mca')).toBe('mca');
  });
});
