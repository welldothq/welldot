import { describe, expect, it } from 'vitest';
import { mergePrerenderHeader } from './prerender-header';

describe('mergePrerenderHeader', () => {
  it('keeps the payload route Nuxt already announced', () => {
    const merged = mergePrerenderHeader('/_payload.json', ['/raw/a.md']);
    expect(merged.split(',')).toEqual(['/_payload.json', '/raw/a.md']);
  });

  it('uses only the extra paths when there is no existing value', () => {
    expect(mergePrerenderHeader(undefined, ['/raw/a.md', '/raw/b.md'])).toBe(
      '/raw/a.md,/raw/b.md',
    );
  });

  it('accepts an array value, including comma-joined entries', () => {
    const merged = mergePrerenderHeader(
      ['/_payload.json', '/x,/y'],
      ['/raw/a.md'],
    );
    expect(merged.split(',')).toEqual([
      '/_payload.json',
      '/x',
      '/y',
      '/raw/a.md',
    ]);
  });

  it('dedupes and ignores empty entries and numbers', () => {
    expect(mergePrerenderHeader('/a, ,/b', ['/b', '/c'])).toBe('/a,/b,/c');
    expect(mergePrerenderHeader(5, ['/c'])).toBe('5,/c');
  });
});
