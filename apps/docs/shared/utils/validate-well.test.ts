import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { formatPath, MAX_WELL_BYTES, validateWell } from './validate-well';

// vitest runs with cwd = apps/docs
const EXAMPLES = join(process.cwd(), '../../packages/core/examples');
const files = readdirSync(EXAMPLES).filter(f => f.endsWith('.well'));

const EMPTY = {
  bore_hole: [],
  well_case: [],
  reduction: [],
  well_screen: [],
  surface_case: [],
  hole_fill: [],
  lithology: [],
  fractures: [],
  caves: [],
};

function firstError(text: string) {
  const r = validateWell(text);
  if (r.valid) throw new Error('expected invalid');
  return r.errors;
}

describe('validateWell', () => {
  it('finds the examples', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('example %s is valid', f => {
    const r = validateWell(readFileSync(join(EXAMPLES, f), 'utf8'), {
      warnings: true,
    });
    expect(r.valid ? [] : r.errors).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it('rejects an empty string as invalid_json', () => {
    const e = firstError('');
    expect(e).toHaveLength(1);
    expect(e[0]).toMatchObject({ code: 'invalid_json', path: '' });
    expect(e[0]!.message).toBeTruthy();
  });

  it('rejects non-JSON', () => {
    expect(firstError('{nope')[0]!.code).toBe('invalid_json');
  });

  it.each(['[]', 'null', '42', '"x"', 'true'])('%s is not_an_object', t => {
    expect(firstError(t)[0]!.code).toBe('not_an_object');
  });

  it('rejects an unsupported version', () => {
    const e = firstError('{"version":"3.0"}');
    expect(e[0]!.code).toBe('unsupported_version');
    expect(e[0]!.message).toContain('3.0');
  });

  it('rejects a malformed version', () => {
    expect(firstError('{"version":"abc"}')[0]!.code).toBe(
      'unsupported_version',
    );
  });

  it('accepts a v1 file', () => {
    const r = validateWell(JSON.stringify({ version: 1, ...EMPTY }));
    expect(r.valid).toBe(true);
  });

  it('reports the exact path of a schema failure', () => {
    const text = readFileSync(join(EXAMPLES, files[0]!), 'utf8');
    const well = JSON.parse(text);
    const idx = well.well_screen?.length ? 0 : -1;
    expect(idx).toBe(0);
    well.well_screen[0].diameter = 'x';
    const e = firstError(JSON.stringify(well));
    expect(e.map(i => i.path)).toContain('well_screen[0].diameter');
  });

  it('rejects an oversized payload without parsing', () => {
    const e = firstError('x'.repeat(MAX_WELL_BYTES + 1));
    expect(e).toHaveLength(1);
    expect(e[0]!.code).toBe('too_large');
    expect(e[0]!.message).toMatch(/MB/);
  });

  it('measures bytes, not characters', () => {
    // 3 bytes per char: under the limit in length, over it in bytes
    const e = firstError('€'.repeat(Math.ceil(MAX_WELL_BYTES / 3) + 1));
    expect(e[0]!.code).toBe('too_large');
  });

  it('returns warnings only when asked', () => {
    const text = JSON.stringify({
      version: 2,
      ...EMPTY,
      meters: [
        {
          id: 'hm-01',
          type: 'mechanical',
          installed_at: '2025-04-02T09:00:00-03:00',
          removed_at: '2025-01-01T00:00:00-03:00',
        },
      ],
    });
    const off = validateWell(text);
    expect(off).toMatchObject({ valid: true, warnings: [] });
    const on = validateWell(text, { warnings: true });
    expect(on).toMatchObject({ valid: true });
    expect(on.valid && on.warnings.map(w => w.code)).toContain(
      'meter_removed_before_installed',
    );
  });

  it('does not call an unrelated error that mentions "version" unsupported_version', async () => {
    vi.resetModules();
    vi.doMock('@welldot/core', async importOriginal => ({
      ...(await importOriginal<typeof import('@welldot/core')>()),
      parseWell: () => {
        throw new Error('cannot read property of version-less thing');
      },
    }));
    const mod = await import('./validate-well');
    const r = mod.validateWell('{"version":2}');
    vi.doUnmock('@welldot/core');
    expect(r.valid).toBe(false);
    expect(!r.valid && r.errors[0]!.code).toBe('invalid_well');
  });

  it('stays valid when the warnings step throws', async () => {
    vi.resetModules();
    vi.doMock('@welldot/utils', () => ({
      getPermitWarnings: () => {
        throw new Error('boom');
      },
      getOperationWarnings: () => [],
      getWaterSampleWarnings: () => [],
      getPumpInstallationWarnings: () => [],
    }));
    const mod = await import('./validate-well');
    const r = mod.validateWell(JSON.stringify({ version: 2, ...EMPTY }), {
      warnings: true,
    });
    vi.doUnmock('@welldot/utils');
    expect(r.valid).toBe(true);
    expect(r.valid && r.warnings).toEqual([
      {
        path: '',
        code: 'warnings_failed',
        message: expect.stringContaining('boom'),
      },
    ]);
  });
});

describe('formatPath', () => {
  it('formats indexes and keys', () => {
    expect(formatPath(['well_screen', 2, 'diameter'])).toBe(
      'well_screen[2].diameter',
    );
  });
  it('returns an empty string for the root', () => {
    expect(formatPath([])).toBe('');
  });
  it('handles a leading index', () => {
    expect(formatPath([0, 'a'])).toBe('[0].a');
  });
});
