import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  DOCS_URL,
  getPageHandler,
  SCHEMA_URL,
  searchDocsHandler,
  validateWellHandler,
} from './handlers';

const EXAMPLE = join(
  process.cwd(),
  '../../packages/core/examples/sao-gabriel-rs-cacimba.well',
);

describe('validateWellHandler', () => {
  it('accepts an example and reports the schema', () => {
    const r = validateWellHandler({ content: readFileSync(EXAMPLE, 'utf8') });
    expect(r).toMatchObject({ valid: true, schema: SCHEMA_URL });
    expect(SCHEMA_URL).toBe('https://welldot.org/schema/v2/well.schema.json');
  });

  it('returns invalid_json for non-JSON without throwing', () => {
    const r = validateWellHandler({ content: 'not json' });
    expect(r.valid).toBe(false);
    expect(!r.valid && r.errors[0]!.code).toBe('invalid_json');
    expect(r.schema).toBe(SCHEMA_URL);
  });

  it('defaults warnings to true and honors false', () => {
    const validate = vi.fn(() => ({
      valid: true as const,
      version: 2,
      warnings: [],
    }));
    validateWellHandler({ content: '{}' }, { validateWell: validate });
    validateWellHandler(
      { content: '{}', warnings: false },
      { validateWell: validate },
    );
    expect(validate.mock.calls).toEqual([
      ['{}', { warnings: true }],
      ['{}', { warnings: false }],
    ]);
  });
});

describe('getPageHandler', () => {
  it('returns markdown and the absolute url', async () => {
    const findPage = vi.fn(async () => ({
      title: 'Overview',
      rawbody: '# Overview',
      path: '/format/spec/v2/overview',
    }));
    const r = await getPageHandler(
      { path: '/format/spec/v2/overview' },
      { findPage },
    );
    expect(r).toEqual({
      ok: true,
      page: {
        title: 'Overview',
        url: `${DOCS_URL}/format/spec/v2/overview`,
        markdown: '# Overview',
      },
    });
  });

  it('returns a not-found error', async () => {
    const r = await getPageHandler(
      { path: '/nope' },
      { findPage: async () => null },
    );
    expect(r).toEqual({ ok: false, error: 'Page not found: /nope' });
  });
});

describe('searchDocsHandler', () => {
  const sections = [
    {
      id: '/a#x',
      title: 'drilling_method',
      titles: ['Reference'],
      content: 'The drilling_method field.',
      level: 2,
      collection: 'spec',
    },
    {
      id: '/b',
      title: 'Other',
      titles: [],
      content: 'nothing',
      level: 1,
      collection: 'docs_en',
    },
  ];
  const loadSections = async () => sections;

  it('returns no results for an empty query without loading', async () => {
    const load = vi.fn(loadSections);
    expect(
      await searchDocsHandler({ query: '' }, { loadSections: load }),
    ).toEqual({ results: [] });
    expect(load).not.toHaveBeenCalled();
  });

  it('ranks, builds urls with anchors and snippets', async () => {
    const r = await searchDocsHandler(
      { query: 'drilling_method' },
      { loadSections },
    );
    expect(r.results).toHaveLength(1);
    expect(r.results[0]).toEqual({
      title: 'drilling_method',
      path: '/a#x',
      url: `${DOCS_URL}/a#x`,
      snippet: 'The drilling_method field.',
    });
  });

  it('clamps the limit and trims long snippets', async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      id: `/p${i}`,
      title: 'term',
      titles: [],
      content: `term ${'x'.repeat(1000)}`,
      level: 1,
    }));
    const r = await searchDocsHandler(
      { query: 'term', limit: 500 },
      { loadSections: async () => many },
    );
    expect(r.results.length).toBe(50);
    expect(r.results[0]!.snippet.length).toBeLessThanOrEqual(301);
    const r2 = await searchDocsHandler(
      { query: 'term', limit: 3 },
      { loadSections: async () => many },
    );
    expect(r2.results).toHaveLength(3);
  });
});
