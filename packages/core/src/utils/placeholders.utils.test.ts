import { describe, expect, it } from 'vitest';
import type { Well } from '../types/well.types';
import { parseWell } from '../validators/well.validators';
import { dropPlaceholders } from './placeholders.utils';
import { deserializeWell, serializeWell } from './well.utils';

const PAD_PLACEHOLDER = { type: '', width: 0, thickness: 0, length: 0 };
const PAD = { type: 'concrete', width: 1, thickness: 0.15, length: 1 };

// Construction with the placeholders older writers used: `type: ""` and
// `type: " "` on every pipe array, and the all-zero cement pad.
function construction(diameterKey: 'diameter' | 'diam_pol' = 'diameter') {
  const d = diameterKey === 'diameter' ? 150 : 6;
  return {
    bore_hole: [{ from: 0, to: 30, [diameterKey]: d * 1.5 }],
    well_case: [
      { from: 0, to: 10, [diameterKey]: d, type: '' },
      { from: 10, to: 20, [diameterKey]: d, type: ' ' },
    ],
    reduction: [{ from: 20, to: 20, diam_from: 150, diam_to: 100, type: '\t' }],
    well_screen: [
      { from: 20, to: 30, [diameterKey]: d, type: '', screen_slot: 0.5 },
      { from: 30, to: 40, [diameterKey]: d, type: 'pvc', screen_slot: 0.5 },
    ],
    surface_case: [],
    hole_fill: [],
    cement_pad: PAD_PLACEHOLDER,
  };
}

const geology = { lithology: [], fractures: [], caves: [] };

function expectNoPlaceholders(well: Well) {
  expect(well.well_case.map(i => 'type' in i)).toEqual([false, false]);
  expect('type' in well.reduction[0]!).toBe(false);
  expect(well.well_screen[0]).not.toHaveProperty('type');
  expect(well.well_screen[1]!.type).toBe('pvc');
  expect(well).not.toHaveProperty('cement_pad');
}

// Every version a reader accepts, plus the legacy unversioned shapes.
const FILES: [string, Record<string, unknown>][] = [
  ['"2.5"', { version: '2.5', ...construction(), ...geology }],
  ['"2.4"', { version: '2.4', ...construction(), ...geology }],
  ['integer 2', { version: 2, ...construction(), ...geology }],
  ['integer 1', { version: 1, ...construction(), ...geology }],
  ['v1 with diam_pol', { version: 1, ...construction('diam_pol'), ...geology }],
  ['unversioned flat', { ...construction(), ...geology }],
  ['unversioned with diam_pol', { ...construction('diam_pol'), ...geology }],
];

describe('placeholders: blank pipe material and empty cement pad', () => {
  describe.each(FILES)('a %s file', (_, file) => {
    const json = JSON.stringify(file);

    it('deserializeWell drops them', () => {
      expectNoPlaceholders(deserializeWell(json)!);
    });

    it('serializeWell does not write them back', () => {
      const out = serializeWell(deserializeWell(json)!);
      expect(out).not.toMatch(/"type":"\s*"/);
      expect(JSON.parse(out)).not.toHaveProperty('cement_pad');
      expect(JSON.parse(out).version).toBe('2.6');
    });
  });

  // parseWell does not read the unversioned legacy shapes or diam_pol in v2.
  it.each(FILES.slice(0, 5))(
    'parseWell drops them from a %s file',
    (_, file) => {
      expectNoPlaceholders(parseWell(JSON.stringify(file)));
    },
  );

  it('deserializeWell drops them inside a legacy constructive sub-object', () => {
    const { bore_hole, well_case, reduction, well_screen, cement_pad } =
      construction('diam_pol');
    const json = JSON.stringify({
      constructive: {
        bole_hole: bore_hole,
        well_case,
        reduction,
        well_screen,
        cement_pad,
      },
      geologic: [],
    });
    expectNoPlaceholders(deserializeWell(json)!);
  });

  it('serializeWell drops them from an in-memory well', () => {
    const well = {
      version: '2.4',
      ...construction(),
      ...geology,
    } as unknown as Well;
    const out = JSON.parse(serializeWell(well));
    expect(out.well_case).toEqual([
      { from: 0, to: 10, diameter: 150 },
      { from: 10, to: 20, diameter: 150 },
    ]);
    expect(out).not.toHaveProperty('cement_pad');
    // the input is not mutated
    expect(well.well_case[0]!.type).toBe('');
    expect(well.cement_pad).toEqual(PAD_PLACEHOLDER);
  });

  it('keeps a real cement pad, including one with a blank type', () => {
    const blankType = { ...PAD, type: '' };
    for (const pad of [PAD, blankType]) {
      const json = JSON.stringify({
        version: '2.5',
        ...construction(),
        cement_pad: pad,
        ...geology,
      });
      expect(deserializeWell(json)!.cement_pad).toEqual(pad);
      expect(parseWell(json).cement_pad).toEqual(pad);
    }
  });

  it('keeps a cement pad with an x- member', () => {
    const pad = { ...PAD_PLACEHOLDER, 'x-note': 'planned' };
    expect(dropPlaceholders({ cement_pad: pad }).cement_pad).toEqual(pad);
  });

  it('keeps non-blank materials as written, x- values included', () => {
    const items = [{ from: 0, to: 1, diameter: 1, type: 'x-unspecified' }];
    expect(dropPlaceholders({ well_case: items }).well_case).toBe(items);
  });

  it('deserializeWell keeps the version as written', () => {
    for (const version of [2, '2.4', '2.5']) {
      const json = JSON.stringify({ version, ...construction(), ...geology });
      expect(deserializeWell(json)!.version).toBe(version);
    }
  });
});
