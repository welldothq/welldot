import { describe, expect, it } from 'vitest';
import { restoreGithubHeadingIds, type ParsedBody } from './github-heading-ids';

describe('restoreGithubHeadingIds', () => {
  it('restores double dashes and leading digits in headings and TOC', () => {
    const body: ParsedBody = {
      value: [
        ['h1', { id: 'title' }, 'Title'],
        ['h2', { id: 'a-b' }, ['code', {}, 'a[].b'], ' — Values'],
        ['h2', { id: '_050' }, '0.5.0'],
        ['h2', { id: 'dup' }, 'Dup'],
        ['h2', { id: 'dup-1' }, 'Dup'],
      ],
      toc: {
        links: [
          { id: 'a-b', depth: 2, text: 'x' },
          { id: '_050', depth: 2, text: 'y' },
        ],
      },
    };
    restoreGithubHeadingIds(body);
    const ids = body.value!.map(n => (n as [string, { id: string }])[1].id);
    expect(ids).toEqual(['title', 'ab--values', '050', 'dup', 'dup-1']);
    expect(body.toc!.links!.map(l => l.id)).toEqual(['ab--values', '050']);
  });
});
