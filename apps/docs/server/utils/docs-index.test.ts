import { describe, expect, it, vi } from 'vitest';
import {
  INDEX_PATH,
  assembleDocsIndex,
  createIndexLoader,
  fetchIndexFromAssets,
  type DocsIndex,
} from './docs-index';

const section = (id: string, title = id) => ({
  id,
  title,
  titles: [],
  content: `body of ${id}`,
  level: 1,
});
const page = (path: string, title = path) => ({
  path,
  title,
  description: '',
  rawbody: `# ${title}`,
});

describe('assembleDocsIndex', () => {
  const index = assembleDocsIndex({
    spec: { sections: [section('/s')], pages: [page('/s', 'Spec')] },
    docs_en: { sections: [section('/d')], pages: [page('/d', 'Docs')] },
    changelogs: { sections: [section('/c')], pages: [page('/c', 'Log')] },
  });

  it('lists sections spec first, tagged with their collection', () => {
    expect(index.sections.map(s => [s.id, s.collection])).toEqual([
      ['/s', 'spec'],
      ['/d', 'docs_en'],
      ['/c', 'changelogs'],
    ]);
  });

  it('lists pages docs_en first (native pages win), tagged and without empty descriptions', () => {
    expect(index.pages.map(p => [p.path, p.collection])).toEqual([
      ['/d', 'docs_en'],
      ['/s', 'spec'],
      ['/c', 'changelogs'],
    ]);
    expect(index.pages[0]).toEqual({
      path: '/d',
      title: 'Docs',
      rawbody: '# Docs',
      collection: 'docs_en',
    });
  });
});

describe('createIndexLoader', () => {
  const empty: DocsIndex = { sections: [], pages: [] };

  it('fetches once and caches the result', async () => {
    const fetchIndex = vi.fn(async () => empty);
    const load = createIndexLoader(fetchIndex);
    expect(await load()).toBe(empty);
    expect(await load()).toBe(empty);
    expect(fetchIndex).toHaveBeenCalledTimes(1);
  });

  it('shares one in-flight fetch between concurrent callers', async () => {
    const fetchIndex = vi.fn(async () => empty);
    const load = createIndexLoader(fetchIndex);
    await Promise.all([load(), load(), load()]);
    expect(fetchIndex).toHaveBeenCalledTimes(1);
  });

  it('resets the cache on failure so the next call retries', async () => {
    const fetchIndex = vi
      .fn<() => Promise<DocsIndex>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(empty);
    const load = createIndexLoader(fetchIndex);
    await expect(load()).rejects.toThrow('boom');
    expect(await load()).toBe(empty);
    expect(fetchIndex).toHaveBeenCalledTimes(2);
  });
});

describe('fetchIndexFromAssets', () => {
  const origin = 'https://docs.welldot.org';

  it('requests the index path on the request origin and parses it', async () => {
    const body: DocsIndex = { sections: [], pages: [] };
    const assets = {
      fetch: vi.fn(async (_req: Request) => Response.json(body)),
    };
    const result = await fetchIndexFromAssets(assets, `${origin}/mcp`);
    expect(result).toEqual(body);
    expect(assets.fetch.mock.calls[0]![0].url).toBe(`${origin}${INDEX_PATH}`);
  });

  it('throws on a non-OK response', async () => {
    const assets = { fetch: async () => new Response('no', { status: 404 }) };
    await expect(fetchIndexFromAssets(assets, origin)).rejects.toThrow(/404/);
  });
});
