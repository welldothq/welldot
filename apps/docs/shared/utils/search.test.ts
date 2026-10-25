import { describe, expect, it } from 'vitest';
import { rankSections, type SearchSection } from './search';

const section = (over: Partial<SearchSection>): SearchSection => ({
  id: '/x',
  title: '',
  titles: [],
  content: '',
  level: 2,
  collection: 'docs_en',
  ...over,
});

describe('rankSections', () => {
  it('ranks a title match above a body-only match', () => {
    const body = section({
      id: '/body',
      title: 'Intro',
      content: 'about casing',
    });
    const title = section({ id: '/title', title: 'Casing', content: 'text' });
    expect(rankSections([body, title], 'casing').map(s => s.id)).toEqual([
      '/title',
      '/body',
    ]);
  });

  it('ranks parent titles above body', () => {
    const body = section({ id: '/body', content: 'casing' });
    const parent = section({ id: '/parent', titles: ['Casing'] });
    expect(rankSections([body, parent], 'casing')[0]!.id).toBe('/parent');
  });

  it('treats underscores and spaces as equal', () => {
    const s = section({ id: '/screen', title: '`well_screen`' });
    const other = section({ id: '/other', title: 'Casing' });
    expect(rankSections([other, s], 'well screen').map(r => r.id)).toEqual([
      '/screen',
    ]);
    expect(rankSections([s], 'well_screen')).toHaveLength(1);
  });

  it('is case-insensitive and requires every token', () => {
    const s = section({ title: 'Drilling Method' });
    expect(rankSections([s], 'DRILLING method')).toHaveLength(1);
    expect(rankSections([s], 'drilling casing')).toHaveLength(0);
  });

  it('returns [] for an empty query', () => {
    expect(rankSections([section({ title: 'a' })], '')).toEqual([]);
    expect(rankSections([section({ title: 'a' })], '   ')).toEqual([]);
  });

  it('honors limit', () => {
    const list = Array.from({ length: 30 }, (_, i) =>
      section({ id: `/${i}`, title: 'well' }),
    );
    expect(rankSections(list, 'well')).toHaveLength(20);
    expect(rankSections(list, 'well', 5)).toHaveLength(5);
  });
});
