import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findPage } from './find-page';

// Each collection returns the page registered under its name for a path, else null
const store: Record<string, Record<string, unknown>> = {};
const queried: string[] = [];

vi.mock('@nuxt/content/server', () => ({
  queryCollection: (_event: unknown, collection: string) => ({
    path: (path: string) => ({
      first: async () => {
        queried.push(`${collection}:${path}`);
        return store[collection]?.[path] ?? null;
      },
    }),
  }),
}));

const event = {} as never;
const page = (title: string, rawbody = `# ${title}`) => ({
  title,
  description: '',
  rawbody,
  path: '/x',
});

describe('findPage', () => {
  beforeEach(() => {
    for (const key of Object.keys(store)) delete store[key];
    queried.length = 0;
  });

  it('returns the docs_en hit when docs_en and spec both match', async () => {
    store.docs_en = { '/format/spec/v2/overview': page('From docs') };
    store.spec = { '/format/spec/v2/overview': page('From spec') };
    const found = await findPage(event, '/format/spec/v2/overview');
    expect(found?.title).toBe('From docs');
    expect(found?.collection).toBe('docs_en');
  });

  it('falls through to spec, then changelogs', async () => {
    store.spec = { '/a': page('Spec') };
    store.changelogs = { '/core/changelog': page('Changelog') };
    expect((await findPage(event, '/a'))?.collection).toBe('spec');
    expect((await findPage(event, '/core/changelog'))?.collection).toBe(
      'changelogs',
    );
    expect(queried.slice(0, 2)).toEqual(['docs_en:/a', 'spec:/a']);
  });

  it('returns null when nothing matches', async () => {
    expect(await findPage(event, '/nope')).toBeNull();
    expect(queried).toEqual([
      'docs_en:/nope',
      'spec:/nope',
      'changelogs:/nope',
    ]);
  });

  it('normalizes a trailing slash, a .md suffix and a missing leading slash', async () => {
    store.spec = { '/format/spec/v2/overview': page('Overview') };
    for (const input of [
      '/format/spec/v2/overview/',
      '/format/spec/v2/overview.md',
      'format/spec/v2/overview',
      '/format/spec/v2/overview.md/',
    ]) {
      expect((await findPage(event, input))?.title).toBe('Overview');
    }
  });

  it('maps an /index suffix and the empty path to the folder page', async () => {
    store.docs_en = { '/': page('Home'), '/core/api': page('API') };
    expect((await findPage(event, '/index.md'))?.title).toBe('Home');
    expect((await findPage(event, ''))?.title).toBe('Home');
    expect((await findPage(event, 'core/api/index'))?.title).toBe('API');
  });
});
