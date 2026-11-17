// Placeholders that writers before v2.5 used for "no value". Up to v2.4 the
// pipe material was required, so editors wrote `type: ""`; editors also kept
// an all-zero `cement_pad` to mean "no pad". Readers treat both as absent and
// `serializeWell` never writes them.

type RawJSON = Record<string, unknown>;

/** Arrays whose `type` (pipe material) is optional since v2.5. */
const PIPE_KEYS = ['well_case', 'well_screen', 'reduction'] as const;

const isPlainObject = (v: unknown): v is RawJSON =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isBlankString = (v: unknown): boolean =>
  typeof v === 'string' && v.trim() === '';

/** `true` for the editors' "no pad" value: a `cement_pad` whose members are all blank strings or zero. */
function isPlaceholderCementPad(pad: unknown): boolean {
  if (!isPlainObject(pad)) return false;
  const values = Object.values(pad);
  return values.length > 0 && values.every(v => v === 0 || isBlankString(v));
}

function withoutBlankType(items: unknown): unknown {
  if (!Array.isArray(items)) return items;
  if (!items.some(item => isPlainObject(item) && isBlankString(item.type))) {
    return items;
  }
  return items.map(item => {
    if (!isPlainObject(item) || !isBlankString(item.type)) return item;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, ...rest } = item;
    return rest;
  });
}

/**
 * Returns a shallow copy of `src` without the placeholders: a blank
 * (empty or whitespace-only) `type` on `well_case`, `well_screen` and
 * `reduction` items, and a `cement_pad` whose members are all blank or zero.
 * Also cleans a legacy `constructive` sub-object. Never mutates `src`.
 */
export function dropPlaceholders<T extends RawJSON>(src: T): T {
  const out: RawJSON = { ...src };
  for (const key of PIPE_KEYS) {
    if (key in out) out[key] = withoutBlankType(out[key]);
  }
  if (isPlaceholderCementPad(out.cement_pad)) delete out.cement_pad;
  if (isPlainObject(out.constructive)) {
    out.constructive = dropPlaceholders(out.constructive);
  }
  return out as T;
}
