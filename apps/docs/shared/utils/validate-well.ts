import { parseWell } from '@welldot/core';
import {
  getOperationWarnings,
  getPermitWarnings,
  getPumpInstallationWarnings,
  getWaterSampleWarnings,
} from '@welldot/utils';

export interface WellIssue {
  path: string;
  message: string;
  code: string;
}

export type WellValidation =
  | { valid: true; version: string | number; warnings: WellIssue[] }
  | { valid: false; errors: WellIssue[] };

/** Maximum accepted input size, measured in UTF-8 bytes (not string length). */
export const MAX_WELL_BYTES = 5 * 1024 * 1024;

/** `['well_screen', 2, 'diameter']` → `well_screen[2].diameter`; `[]` → `''`. */
export function formatPath(path: (string | number)[]): string {
  let out = '';
  for (const seg of path) {
    if (typeof seg === 'number') out += `[${seg}]`;
    else out += out ? `.${seg}` : seg;
  }
  return out;
}

function fail(path: string, code: string, message: string): WellValidation {
  return { valid: false, errors: [{ path, code, message }] };
}

function byteLength(text: string): number {
  // UTF-8 uses between 1 and 3 bytes per UTF-16 unit, so most inputs are
  // decided without encoding the whole string.
  if (text.length > MAX_WELL_BYTES) return text.length;
  if (text.length * 3 <= MAX_WELL_BYTES) return text.length;
  return new TextEncoder().encode(text).length;
}

function isZodError(e: unknown): e is {
  issues: { path: (string | number)[]; message: string; code: string }[];
} {
  return (
    typeof e === 'object' &&
    e !== null &&
    (e as { name?: unknown }).name === 'ZodError' &&
    Array.isArray((e as { issues?: unknown }).issues)
  );
}

function warningIssues(
  path: string,
  list: { code: string; ids: string[] }[],
): WellIssue[] {
  return list.map(w => ({
    path,
    code: w.code,
    message: w.ids.length
      ? `${w.code.replace(/_/g, ' ')} (${w.ids.join(', ')})`
      : w.code.replace(/_/g, ' '),
  }));
}

/**
 * Warnings are advisory: a bug in a warnings function must never turn a file that
 * `parseWell` accepted into `valid: false`. On failure the file stays valid and the
 * result carries a single `warnings_failed` warning.
 */
function collectWarnings(
  well: Parameters<typeof getPermitWarnings>[0],
): WellIssue[] {
  try {
    return [
      ...warningIssues('permits', getPermitWarnings(well)),
      ...warningIssues('meters', getOperationWarnings(well)),
      ...warningIssues('water_samples', getWaterSampleWarnings(well)),
      ...warningIssues('pump_installations', getPumpInstallationWarnings(well)),
    ];
  } catch (e) {
    return [
      {
        path: '',
        code: 'warnings_failed',
        message: `Warnings could not be computed: ${e instanceof Error ? e.message : String(e)}`,
      },
    ];
  }
}

/**
 * Validates `.well` text with `parseWell` from `@welldot/core` and nothing
 * else. Never throws: every failure comes back as `{ valid: false, errors }`.
 */
export function validateWell(
  text: string,
  opts: { warnings?: boolean } = {},
): WellValidation {
  try {
    if (typeof text !== 'string') {
      return fail('', 'invalid_json', 'Input must be a string of JSON text.');
    }
    if (byteLength(text) > MAX_WELL_BYTES) {
      return fail(
        '',
        'too_large',
        `File is larger than ${MAX_WELL_BYTES / 1024 / 1024} MB.`,
      );
    }

    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (e) {
      return fail(
        '',
        'invalid_json',
        text.trim() === ''
          ? 'Input is empty. Expected a JSON object.'
          : `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return fail(
        '',
        'not_an_object',
        'A .well file must be a JSON object at the top level.',
      );
    }

    try {
      const well = parseWell(text);
      return {
        valid: true,
        version: well.version as string | number,
        warnings: opts.warnings ? collectWarnings(well) : [],
      };
    } catch (e) {
      if (isZodError(e)) {
        return {
          valid: false,
          errors: e.issues.map(i => ({
            path: formatPath(i.path),
            message: i.message,
            code: i.code,
          })),
        };
      }
      const message = e instanceof Error ? e.message : String(e);
      if (
        message.startsWith('Unsupported .well') ||
        message.startsWith('Malformed .well')
      ) {
        return fail('version', 'unsupported_version', message);
      }
      return fail('', 'invalid_well', message);
    }
  } catch (e) {
    return fail('', 'invalid_well', e instanceof Error ? e.message : String(e));
  }
}
