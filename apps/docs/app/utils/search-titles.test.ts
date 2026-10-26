import { describe, expect, it } from 'vitest';
import { shortenSection } from './search-titles';

const LONG =
  '`.well` File Format Specification — Version 2.4: Format Reference';
const ref = '/format/spec/v2/format-reference';

describe('shortenSection', () => {
  it('replaces the long spec h1 with the sidebar label', () => {
    const out = shortenSection({
      id: `${ref}#bore_hole`,
      title: 'bore_hole[].drilling_method',
      titles: [LONG],
    });
    expect(out.titles).toEqual(['Format reference']);
    expect(out.title).toBe('bore_hole[].drilling_method');
  });

  it('shortens the title of the page section itself', () => {
    const out = shortenSection({ id: ref, title: LONG, titles: [] });
    expect(out.title).toBe('Format reference');
    expect(out.titles).toEqual([]);
  });

  it('keeps only the nearest parent of a nested heading', () => {
    const out = shortenSection({
      id: `${ref}#x`,
      title: 'Leaf',
      titles: [LONG, 'Grand parent', 'Parent'],
    });
    expect(out.titles).toEqual(['Format reference', 'Parent']);
  });

  it('drops a parent that repeats the page label', () => {
    const out = shortenSection({
      id: '/format/spec/v2/object-schemas#boreHole',
      title: 'BoreHole',
      titles: ['Long h1', 'Object Schemas'],
    });
    expect(out.titles).toEqual(['Object schemas']);
  });

  it('leaves docs pages unchanged', () => {
    const s = { id: '/core/intro#a', title: 'A', titles: ['Intro', 'B'] };
    expect(shortenSection(s)).toBe(s);
  });
});
