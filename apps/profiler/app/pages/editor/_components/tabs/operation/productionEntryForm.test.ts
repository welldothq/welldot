import {
  headToCanonical,
  ProductionEntrySchema,
  type EstimatedVolume,
  type FlowReading,
  type MeterReading,
} from '@welldot/core';
import { describe, expect, it } from 'vitest';
import {
  fromProductionForm,
  isProductionFormValid,
  toProductionForm,
} from './productionEntryForm';

const ID = '00000000-0000-4000-8000-000000000001';

const METER_READING: MeterReading = {
  id: 'a1',
  type: 'meter_reading',
  datetime: '2026-03-01T08:00:00-03:00',
  meter_id: 'm1',
  reading: 1234.5,
  source: 'manual',
  sequence: 2,
};

const FLOW_READING: FlowReading = {
  id: 'f1',
  type: 'flow_reading',
  datetime: '2026-03-02T10:00:00-03:00',
  flow_rate: 211,
  flow_rate_precision: 0.5,
  discharge_head: 16.75,
  discharge_head_precision: 0.1,
  meter_id: 'm1',
  source: 'telemetry',
};

describe('productionEntryForm', () => {
  it('strips meter_reading fields when the type switches to flow_reading', () => {
    const form = toProductionForm(METER_READING, null);
    form.type = 'flow_reading';
    form.flowRate = 211;
    const entry = fromProductionForm(form, METER_READING, ID);
    expect(entry).not.toHaveProperty('reading');
    expect(entry).toMatchObject({
      id: ID,
      type: 'flow_reading',
      corrects: 'a1',
      flow_rate: 211,
      meter_id: 'm1',
      source: 'manual',
      sequence: 2,
    });
    expect(ProductionEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('strips flow_reading fields when the type switches to meter_reading', () => {
    const form = toProductionForm(FLOW_READING, null);
    form.type = 'meter_reading';
    form.reading = 10;
    const entry = fromProductionForm(form, FLOW_READING, ID);
    for (const key of [
      'flow_rate',
      'flow_rate_precision',
      'discharge_head',
      'discharge_head_precision',
    ])
      expect(entry).not.toHaveProperty(key);
    expect(entry).toMatchObject({ type: 'meter_reading', reading: 10 });
  });

  it('strips flow_reading fields when the type switches to estimated_volume', () => {
    const form = toProductionForm(FLOW_READING, null);
    form.type = 'estimated_volume';
    form.periodStart = new Date('2026-03-01T00:00:00Z');
    form.periodEnd = new Date('2026-03-31T00:00:00Z');
    form.volume = 500;
    const entry = fromProductionForm(form, FLOW_READING, ID);
    for (const key of [
      'datetime',
      'flow_rate',
      'flow_rate_precision',
      'discharge_head',
      'discharge_head_precision',
      'meter_id',
      'source',
    ])
      expect(entry).not.toHaveProperty(key);
    expect(ProductionEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('stores a discharge head entered in mca as the same value in m', () => {
    const form = toProductionForm(null, null);
    form.type = 'flow_reading';
    form.flowRate = 211;
    // WellUnitInput unit-type="head" hands the form the canonical value.
    form.dischargeHead = headToCanonical(16.75, 'mca');
    const entry = fromProductionForm(form, null, ID) as FlowReading;
    expect(entry.discharge_head).toBe(16.75);
  });

  it('stores a discharge head entered in kPa converted to m', () => {
    const form = toProductionForm(null, null);
    form.type = 'flow_reading';
    form.flowRate = 211;
    form.dischargeHead = headToCanonical(98.0665, 'kPa');
    const entry = fromProductionForm(form, null, ID) as FlowReading;
    expect(entry.discharge_head).toBeCloseTo(10, 9);
  });

  it('keeps a negative discharge head (vacuum)', () => {
    const form = toProductionForm(null, null);
    form.type = 'flow_reading';
    form.flowRate = 0;
    form.dischargeHead = -2.5;
    expect(isProductionFormValid(form)).toBe(true);
    const entry = fromProductionForm(form, null, ID) as FlowReading;
    expect(entry.discharge_head).toBe(-2.5);
  });

  it('a flow reading does not need a meter', () => {
    const form = toProductionForm(null, null);
    form.type = 'flow_reading';
    form.flowRate = 120;
    expect(isProductionFormValid(form)).toBe(true);
    const entry = fromProductionForm(form, null, ID);
    expect(entry).not.toHaveProperty('meter_id');
    expect(entry).not.toHaveProperty('discharge_head');
    expect(entry).not.toHaveProperty('corrects');
    expect(ProductionEntrySchema.safeParse(entry).success).toBe(true);
  });

  it('a flow reading needs a flow rate and a datetime', () => {
    const form = toProductionForm(null, null);
    form.type = 'flow_reading';
    expect(isProductionFormValid(form)).toBe(false);
    form.flowRate = 1;
    form.datetime = null;
    expect(isProductionFormValid(form)).toBe(false);
  });

  it('a meter reading still needs a meter', () => {
    const form = toProductionForm(null, null);
    form.reading = 5;
    expect(isProductionFormValid(form)).toBe(false);
    form.meterId = 'm1';
    expect(isProductionFormValid(form)).toBe(true);
  });

  it('seeds a new entry with the default meter', () => {
    expect(toProductionForm(null, 'm9').meterId).toBe('m9');
  });

  it('round-trips a flow reading correction', () => {
    const form = toProductionForm(FLOW_READING, null);
    expect(form).toMatchObject({
      type: 'flow_reading',
      flowRate: 211,
      dischargeHead: 16.75,
      meterId: 'm1',
      source: 'telemetry',
    });
    const entry = fromProductionForm(form, FLOW_READING, ID);
    expect(entry).toStrictEqual({
      ...FLOW_READING,
      datetime: entry.type === 'flow_reading' ? entry.datetime : '',
      id: ID,
      corrects: 'f1',
    });
    expect(new Date((entry as FlowReading).datetime).getTime()).toBe(
      new Date(FLOW_READING.datetime).getTime(),
    );
  });

  it('drops the head precision when the discharge head is cleared', () => {
    const form = toProductionForm(FLOW_READING, null);
    form.dischargeHead = null;
    const entry = fromProductionForm(form, FLOW_READING, ID);
    expect(entry).not.toHaveProperty('discharge_head');
    expect(entry).not.toHaveProperty('discharge_head_precision');
    expect(entry).toHaveProperty('flow_rate_precision', 0.5);
  });

  it('drops a cleared meter and source from a flow reading correction', () => {
    const form = toProductionForm(FLOW_READING, null);
    form.meterId = null;
    form.source = null;
    const entry = fromProductionForm(form, FLOW_READING, ID);
    expect(entry).not.toHaveProperty('meter_id');
    expect(entry).not.toHaveProperty('source');
  });

  it('keeps estimated volumes as before', () => {
    const original: EstimatedVolume = {
      id: 'e1',
      type: 'estimated_volume',
      period_start: '2026-01-01T00:00:00-03:00',
      period_end: '2026-02-01T00:00:00-03:00',
      volume: 300,
      method: 'flow_time',
    };
    const entry = fromProductionForm(
      toProductionForm(original, null),
      original,
      ID,
    );
    expect(entry).toMatchObject({
      type: 'estimated_volume',
      volume: 300,
      method: 'flow_time',
      corrects: 'e1',
    });
  });
});
