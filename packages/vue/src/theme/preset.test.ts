/* eslint-disable @typescript-eslint/no-explicit-any -- deep reads into untyped token maps */
import { describe, expect, it } from 'vitest';
import { readThemeCss, ruleDeclarations } from '../test/tokens';
import { WelldotPreset } from './preset';

const preset = WelldotPreset.preset as Record<string, any>;
const NEUTRAL = '0 50 100 200 300 400 500 600 700 800 900 950'.split(' ');
const ACCENT = NEUTRAL.slice(1);

function expectTokenScale(
  scale: Record<string, string>,
  name: string,
  steps: string[],
) {
  // Aura adds named tokens (`content.background`, …) next to the steps.
  const numeric = Object.keys(scale).filter(key => /^\d+$/.test(key));
  expect(numeric.sort()).toEqual([...steps].sort());
  for (const step of steps)
    expect(scale[step]).toBe(`var(--w-${name}-${step})`);
}

describe('WelldotPreset', () => {
  it('uses the p prefix', () => {
    expect(WelldotPreset.options.prefix).toBe('p');
  });

  it('points every palette at the tokens', () => {
    const { primitive, semantic } = preset;
    for (const name of ['surface', 'content']) {
      expectTokenScale(primitive[name], name, NEUTRAL);
      expectTokenScale(semantic.colorScheme.light[name], name, NEUTRAL);
      expectTokenScale(semantic.colorScheme.dark[name], name, NEUTRAL);
    }
    for (const name of ['primary', 'error', 'warning', 'success', 'info']) {
      expectTokenScale(semantic[name], name, ACCENT);
    }
  });

  it('declares every referenced token', () => {
    const declared = ruleDeclarations(readThemeCss('tokens.css'), ':root');
    const referenced = JSON.stringify(WelldotPreset).match(/--w-[\w-]+/g) ?? [];
    expect(referenced.length).toBeGreaterThan(0);
    for (const name of referenced) expect(declared.has(name), name).toBe(true);
  });
});
