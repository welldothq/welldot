import { describe, expect, it } from 'vitest';
import {
  readThemeCss,
  referencedTokens,
  ruleDeclarations,
} from '../test/tokens';

const tokens = readThemeCss('tokens.css');
const theme = readThemeCss('theme.css');
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const light = ruleDeclarations(tokens, ':root');
const dark = ruleDeclarations(tokens, '.dark-mode');

describe('tokens.css', () => {
  it('defines every --w-* variable theme.css reads in :root', () => {
    const read = referencedTokens(theme);
    expect(read.size).toBe(12 + 12 + 5 * 11);
    for (const name of read) expect(light.has(name), name).toBe(true);
  });

  it('redefines only surface and content in .dark-mode', () => {
    const expected = [...light.keys()].filter(name =>
      /^--w-(surface|content)-/.test(name),
    );
    expect(expected).toHaveLength(24);
    expect([...dark.keys()].sort()).toEqual(expected.sort());
  });

  it('declares .dark-mode after :root', () => {
    expect(tokens.indexOf('.dark-mode {')).toBeGreaterThan(
      tokens.indexOf(':root {'),
    );
  });

  it('keeps the current palette values', () => {
    expect(light.get('--w-surface-0')).toBe('#ffffff');
    expect(light.get('--w-surface-950')).toBe('#0d1218');
    expect(light.get('--w-content-0')).toBe('#0d1218');
    expect(dark.get('--w-surface-0')).toBe('#0d1218');
    expect(dark.get('--w-content-0')).toBe('#ffffff');
    expect(light.get('--w-primary-600')).toBe('#29539b');
    expect(light.get('--w-error-500')).toBe('oklch(50% 0.20 25)');
    expect(light.get('--w-info-950')).toBe('oklch(17% 0.08 235)');
  });

  it('keeps theme.css free of imports and sources', () => {
    expect(stripComments(theme)).not.toContain('@import');
    expect(stripComments(theme)).not.toContain('@source');
  });

  it('keeps tokens.css plain CSS', () => {
    expect(stripComments(tokens)).not.toMatch(/@[a-z]/);
  });
});
