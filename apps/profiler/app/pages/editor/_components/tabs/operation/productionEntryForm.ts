import type {
  EstimatedVolume,
  FlowReading,
  MeterReading,
  ProductionEntry,
} from '@welldot/core';
import { formatISO } from 'date-fns';

/**
 * Form model of the production ledger editor (`ProductionEntryDialog.vue`)
 * and its conversion to and from the entry. Kept out of the component so the
 * type switch is testable. Numbers are canonical (m³, m³/h, m of head):
 * `WellUnitInput` converts from the display units.
 */

export type ProductionEntryType =
  | 'meter_reading'
  | 'estimated_volume'
  | 'flow_reading';

export const PRODUCTION_FORM_TYPES: readonly ProductionEntryType[] = [
  'meter_reading',
  'estimated_volume',
  'flow_reading',
];

export type ProductionForm = {
  type: ProductionEntryType;
  /** Instant of a meter or flow reading. */
  datetime: Date | null;
  meterId: string | null;
  reading: number | null;
  source: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  volume: number | null;
  method: string | null;
  /** m³/h. */
  flowRate: number | null;
  /** m of head; may be negative (vacuum). */
  dischargeHead: number | null;
  notes: string;
};

/**
 * Fields owned by each entry type. On save, the fields of the other types
 * that the chosen type does not own are stripped from the carried-over
 * original. The precisions belong to the flow reading too, so they go with it.
 */
export const TYPE_FIELDS: Record<ProductionEntryType, readonly string[]> = {
  meter_reading: ['datetime', 'meter_id', 'reading', 'source'],
  estimated_volume: ['period_start', 'period_end', 'volume', 'method'],
  flow_reading: [
    'datetime',
    'flow_rate',
    'flow_rate_precision',
    'discharge_head',
    'discharge_head_precision',
    'meter_id',
    'source',
  ],
};

function isFormType(type: string | undefined): type is ProductionEntryType {
  return PRODUCTION_FORM_TYPES.includes(type as ProductionEntryType);
}

/**
 * Seeds the form from an entry (`null`: a new meter reading at `now`, on
 * `defaultMeterId`).
 */
export function toProductionForm(
  e: ProductionEntry | null,
  defaultMeterId: string | null,
  now: Date = new Date(),
): ProductionForm {
  const reading = e?.type === 'meter_reading' ? (e as MeterReading) : null;
  const estimate =
    e?.type === 'estimated_volume' ? (e as EstimatedVolume) : null;
  const flow = e?.type === 'flow_reading' ? (e as FlowReading) : null;
  const instant = reading?.datetime ?? flow?.datetime;
  return {
    type: isFormType(e?.type) ? e.type : 'meter_reading',
    datetime: instant ? new Date(instant) : now,
    meterId:
      reading?.meter_id ?? (flow ? (flow.meter_id ?? null) : defaultMeterId),
    reading: reading?.reading ?? null,
    source: reading?.source ?? flow?.source ?? null,
    periodStart: estimate ? new Date(estimate.period_start) : null,
    periodEnd: estimate ? new Date(estimate.period_end) : null,
    volume: estimate?.volume ?? null,
    method: estimate?.method ?? null,
    flowRate: flow?.flow_rate ?? null,
    dischargeHead: flow?.discharge_head ?? null,
    notes: e?.notes ?? '',
  };
}

/** An estimate period that ends at or before its start. */
export function isPeriodInvalid(form: ProductionForm): boolean {
  return (
    !!form.periodStart &&
    !!form.periodEnd &&
    form.periodEnd.getTime() <= form.periodStart.getTime()
  );
}

export function isProductionFormValid(form: ProductionForm): boolean {
  switch (form.type) {
    case 'meter_reading':
      return !!form.datetime && !!form.meterId && form.reading != null;
    case 'flow_reading':
      // The meter is optional on a flow reading.
      return !!form.datetime && form.flowRate != null;
    case 'estimated_volume':
      return (
        !!form.periodStart &&
        !!form.periodEnd &&
        !isPeriodInvalid(form) &&
        form.volume != null
      );
  }
}

/** Drops `undefined` members so optional fields are absent, not `undefined`. */
function compact<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

const optionalText = (v: string | null) => v?.trim() || undefined;
const optional = <T>(v: T | null) => (v == null ? undefined : v);

/**
 * Builds a NEW ledger entry with id `id`. When correcting, `original` is
 * spread first so members the form does not cover (e.g. `x-` members,
 * `sequence`, precisions) carry over, and `corrects` points to it. Assumes
 * `isProductionFormValid(form)`.
 */
export function fromProductionForm(
  form: ProductionForm,
  original: ProductionEntry | null,
  id: string,
): ProductionEntry {
  const base: Record<string, unknown> = { ...original };
  const own = new Set(TYPE_FIELDS[form.type]);
  for (const type of PRODUCTION_FORM_TYPES) {
    if (type === form.type) continue;
    for (const key of TYPE_FIELDS[type]) if (!own.has(key)) delete base[key];
  }

  // Instants keep the local offset: daily/monthly buckets use the date part
  // of the instant as written.
  let typed: Record<string, unknown>;
  switch (form.type) {
    case 'meter_reading':
      typed = {
        type: 'meter_reading',
        datetime: formatISO(form.datetime!),
        meter_id: form.meterId!,
        reading: form.reading!,
        source: optionalText(form.source),
      };
      break;
    case 'flow_reading':
      typed = {
        type: 'flow_reading',
        datetime: formatISO(form.datetime!),
        flow_rate: form.flowRate!,
        discharge_head: optional(form.dischargeHead),
        // A precision without its value is meaningless.
        ...(form.dischargeHead == null && {
          discharge_head_precision: undefined,
        }),
        meter_id: optionalText(form.meterId),
        source: optionalText(form.source),
      };
      break;
    case 'estimated_volume':
      typed = {
        type: 'estimated_volume',
        period_start: formatISO(form.periodStart!),
        period_end: formatISO(form.periodEnd!),
        volume: form.volume!,
        method: optionalText(form.method),
      };
      break;
  }

  return compact({
    ...base,
    ...typed,
    id,
    corrects: original?.id,
    notes: optionalText(form.notes),
  }) as ProductionEntry;
}
