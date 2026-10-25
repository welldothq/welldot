import { describe, expect, it, vi } from 'vitest';

vi.mock('@nuxt/content/server', () => ({ queryCollection: vi.fn() }));

const { findPageIn } = await import('./find-page');

const p = (path: string, title: string, collection = 'docs_en' as const) => ({
  path,
  title,
  rawbody: `# ${title}`,
  collection,
});
const pages = [
  p('/', 'Home'),
  p('/core/api', 'API'),
  p('/format/spec/v2/overview', 'Overview', 'docs_en'),
  p('/format/spec/v2/overview', 'Spec overview', 'spec' as never),
];

describe('findPageIn', () => {
  it('returns the first page for the path (docs_en wins)', () => {
    expect(findPageIn(pages, '/format/spec/v2/overview')?.title).toBe(
      'Overview',
    );
  });

  it('normalizes a trailing slash, .md, missing slash and /index', () => {
    for (const input of [
      '/core/api/',
      '/core/api.md',
      'core/api',
      'core/api/index.md',
    ]) {
      expect(findPageIn(pages, input)?.title).toBe('API');
    }
    expect(findPageIn(pages, '')?.title).toBe('Home');
    expect(findPageIn(pages, '/index.md')?.title).toBe('Home');
  });

  it('returns null for an unknown path', () => {
    expect(findPageIn(pages, '/nope')).toBeNull();
  });
});
