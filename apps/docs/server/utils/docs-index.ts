import type { SearchSection } from '#shared/utils/search';
import type { PageCollection } from './find-page';

/**
 * The build-time index behind the MCP server. A Worker has no content database (the site is
 * prerendered), so `search_docs` and `get_page` read this JSON, prerendered by
 * server/routes/_mcp/index.json.get.ts and served as a static asset.
 */
export interface IndexedDocsPage {
  path: string;
  title: string;
  description?: string;
  rawbody: string;
  collection: PageCollection;
}

export interface DocsIndex {
  sections: SearchSection[];
  pages: IndexedDocsPage[];
}

export interface CollectionRows {
  sections: SearchSection[];
  pages: Omit<IndexedDocsPage, 'collection'>[];
}

export const INDEX_PATH = '/_mcp/index.json';

// rankSections breaks score ties by input order, so the canonical spec comes first: a
// `drilling_method` query lists the format reference before the generated API pages
const SECTION_ORDER: PageCollection[] = ['spec', 'docs_en', 'changelogs'];
// Native pages win over a spec or changelog page at the same route (as in findPage)
const PAGE_ORDER: PageCollection[] = ['docs_en', 'spec', 'changelogs'];

export function assembleDocsIndex(
  rows: Record<PageCollection, CollectionRows>,
): DocsIndex {
  return {
    sections: SECTION_ORDER.flatMap(collection =>
      rows[collection].sections.map(s => ({ ...s, collection })),
    ),
    pages: PAGE_ORDER.flatMap(collection =>
      rows[collection].pages.map(p => ({
        path: p.path,
        title: p.title,
        ...(p.description ? { description: p.description } : {}),
        rawbody: p.rawbody,
        collection,
      })),
    ),
  };
}

/** Memoizes the index; a rejected fetch is not cached, so the next call retries. */
export function createIndexLoader(fetchIndex: () => Promise<DocsIndex>) {
  let cached: Promise<DocsIndex> | null = null;
  return () => {
    cached ??= fetchIndex().catch(error => {
      cached = null;
      throw error;
    });
    return cached;
  };
}

/** The Workers `ASSETS` binding (or anything with a compatible `fetch`). */
export interface AssetsBinding {
  fetch: (_request: Request) => Promise<Response>;
}

export async function fetchIndexFromAssets(
  assets: AssetsBinding,
  requestUrl: string,
): Promise<DocsIndex> {
  const url = new URL(INDEX_PATH, requestUrl);
  const response = await assets.fetch(new Request(url));
  if (!response.ok) {
    throw new Error(`Docs index unavailable: ${url} -> ${response.status}`);
  }
  return (await response.json()) as DocsIndex;
}
