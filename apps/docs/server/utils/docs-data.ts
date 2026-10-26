import type { SearchSection } from '#shared/utils/search';
import {
  queryCollection,
  queryCollectionSearchSections,
} from '@nuxt/content/server';
import type { H3Event } from 'h3';
import {
  assembleDocsIndex,
  createIndexLoader,
  fetchIndexFromAssets,
  type AssetsBinding,
  type DocsIndex,
} from './docs-index';
import { findPage, findPageIn, type FoundPage } from './find-page';

const COLLECTIONS = ['spec', 'docs_en', 'changelogs'] as const;

/** Reads every section and page from the content database (dev server and prerender only). */
export async function buildDocsIndex(event: H3Event): Promise<DocsIndex> {
  const rows = await Promise.all(
    COLLECTIONS.map(async collection => {
      const [sections, pages] = await Promise.all([
        queryCollectionSearchSections(event, collection),
        queryCollection(event, collection)
          .select('path', 'title', 'description', 'rawbody')
          .all(),
      ]);
      return [
        collection,
        {
          sections: sections as SearchSection[],
          pages: pages.map(page => ({
            path: page.path,
            title: page.title,
            description: page.description,
            rawbody: (page as unknown as { rawbody: string }).rawbody,
          })),
        },
      ] as const;
    }),
  );
  return assembleDocsIndex(
    Object.fromEntries(rows) as Parameters<typeof assembleDocsIndex>[0],
  );
}

const assetsOf = (event: H3Event): AssetsBinding | undefined =>
  (event.context.cloudflare as { env?: { ASSETS?: AssetsBinding } } | undefined)
    ?.env?.ASSETS;

// Module scope: one fetch per Worker isolate; reset on failure (see createIndexLoader)
let loadFromAssets: ReturnType<typeof createIndexLoader> | undefined;

/**
 * On a Worker the index comes from the ASSETS binding (there is no content database);
 * anywhere else (dev server, prerender, Node) it is null and callers query the content.
 */
function indexFromAssets(event: H3Event): Promise<DocsIndex> | null {
  const assets = assetsOf(event);
  if (!assets) return null;
  const url = getRequestURL(event).href;
  loadFromAssets ??= createIndexLoader(() => fetchIndexFromAssets(assets, url));
  return loadFromAssets();
}

export async function loadSections(event: H3Event): Promise<SearchSection[]> {
  const index = indexFromAssets(event);
  return (index ? await index : await buildDocsIndex(event)).sections;
}

export async function resolvePage(
  event: H3Event,
  path: string,
): Promise<FoundPage | null> {
  const index = indexFromAssets(event);
  if (!index) return findPage(event, path);
  return findPageIn((await index).pages, path);
}
