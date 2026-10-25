import { isGeneratedPage, rawPath } from '#shared/utils/page-links';
import { queryCollection } from '@nuxt/content/server';
import type { PageCollection } from '../utils/find-page';
import { pageMarkdown } from '../utils/page-markdown';
import { pageSummary } from '../utils/page-summary';
import { mergePrerenderHeader } from '../utils/prerender-header';

const DOMAIN = 'https://docs.welldot.org';
const SCHEMA_URL = 'https://welldot.org/schema/v2/well.schema.json';
// The MCP server of Task 11
const MCP_URL = `${DOMAIN}/mcp`;

interface IndexedPage {
  collection: PageCollection;
  path: string;
  title: string;
  description?: string;
  rawbody: string;
  generated: boolean;
}

interface Link {
  title: string;
  href: string;
  description?: string;
}

const PACKAGES = ['core', 'utils', 'render'] as const;
const OTHER_ROOTS = ['/format', '/ai', ...PACKAGES.map(pkg => `/${pkg}`)];

// The one generated page listed outside an API index: the entry to every object page
const OBJECTS_INDEX = '/format/reference/objects';

const under = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

async function loadPages(event: Parameters<typeof queryCollection>[0]) {
  const pages: IndexedPage[] = [];
  for (const collection of ['docs_en', 'spec', 'changelogs'] as const) {
    const rows = await queryCollection(event, collection)
      .select('path', 'title', 'description', 'rawbody', 'meta')
      .all();
    for (const row of rows) {
      pages.push({
        collection,
        path: row.path,
        title: row.title,
        description: row.description,
        rawbody: (row as unknown as { rawbody: string }).rawbody,
        generated: isGeneratedPage(row as { meta?: Record<string, unknown> }),
      });
    }
  }
  return pages;
}

const toLink = (page: IndexedPage): Link => ({
  // A changelog's heading is only the package name
  title:
    page.collection === 'changelogs' ? `${page.title} changelog` : page.title,
  href: `${DOMAIN}${rawPath(page.path)}`,
  description:
    pageSummary({
      description: page.description,
      rawbody: page.rawbody,
      native: page.collection === 'docs_en',
    }) || undefined,
});

// v2 first, then v1, then reference; native pages before spec pages
function specOrder(page: IndexedPage) {
  if (page.path.endsWith('/spec/v2/overview')) return -1;
  if (page.path.includes('/spec/v2/')) return 0;
  if (page.path.includes('/spec/v1/')) return 1;
  return 2;
}

/** The pages listed in llms.txt, by section. Generated pages are left out except an API index. */
function buildSections(pages: IndexedPage[]) {
  const listed = pages.filter(page => !page.generated);
  const byPath = (a: IndexedPage, b: IndexedPage) =>
    a.path.localeCompare(b.path);

  const format = [
    ...pages
      .filter(
        page =>
          page.collection === 'docs_en' &&
          under(page.path, '/format') &&
          (!page.generated || page.path === OBJECTS_INDEX),
      )
      // The /format umbrella page introduces its children, so it comes first
      .sort(
        (a, b) => Number(b.path === '/format') - Number(a.path === '/format'),
      ),
    ...listed
      .filter(page => page.collection === 'spec')
      .sort((a, b) => specOrder(a) - specOrder(b) || byPath(a, b)),
  ].map(toLink);
  format.push({
    title: 'JSON Schema (v2)',
    href: SCHEMA_URL,
    description: 'Machine-readable schema, generated from the Zod validators.',
  });

  const guides = listed
    .filter(
      page =>
        page.collection === 'docs_en' &&
        page.path !== '/' &&
        !OTHER_ROOTS.some(root => under(page.path, root)),
    )
    .sort(byPath)
    .map(toLink);

  const packageSections = PACKAGES.map(pkg => {
    const root = `/${pkg}`;
    const links = listed
      .filter(page => under(page.path, root))
      .sort(byPath)
      .map(toLink);
    // The API pages are generated, so only their index is listed
    const apiIndex = pages.find(page => page.path === `${root}/api`);
    if (apiIndex) {
      links.push({
        title: 'API reference',
        href: `${DOMAIN}${rawPath(apiIndex.path)}`,
        description: apiIndex.description || undefined,
      });
    }
    return { title: `@welldot/${pkg}`, links };
  });

  const ai = listed
    .filter(page => page.collection === 'docs_en' && under(page.path, '/ai'))
    .sort(byPath)
    .map(toLink);
  ai.push({
    title: 'Welldot MCP server',
    href: MCP_URL,
    description:
      'Model Context Protocol endpoint: search the docs and validate .well files.',
  });

  return [
    { title: 'The .well format', links: format },
    { title: 'Guides', links: guides },
    ...packageSections,
    { title: 'AI tools', links: ai },
  ].filter(section => section.links.length > 0);
}

export default defineNitroPlugin(nitroApp => {
  nitroApp.hooks.hook('llms:generate', async (event, options) => {
    // Keep the module's own section (the llms-full.txt link); the rest comes from the content
    options.sections = [
      ...options.sections,
      ...buildSections(await loadPages(event)),
    ];
  });

  nitroApp.hooks.hook(
    'llms:generate:full',
    async (event, _options, contents) => {
      const pages = await loadPages(event);
      const order = buildSections(pages).flatMap(section => section.links);
      const rank = new Map(
        order.map((link, index) => [link.href, index] as const),
      );
      const listed = pages
        .filter(page => !page.generated)
        .sort(
          (a, b) =>
            (rank.get(`${DOMAIN}${rawPath(a.path)}`) ?? Infinity) -
            (rank.get(`${DOMAIN}${rawPath(b.path)}`) ?? Infinity),
        );
      for (const page of listed) contents.push(pageMarkdown(page).trim());
    },
  );

  // `nuxt generate` only prerenders routes it can discover, and the prerenderer reads the
  // x-nitro-prerender header only on HTML responses. Raw pages are not linked from any page, so
  // the response of `/` announces every one of them (generated pages too: they are cheap and
  // useful to agents).
  if (import.meta.preset === 'nitro-prerender') {
    nitroApp.hooks.hook('beforeResponse', async event => {
      if (event.path !== '/') return;
      const pages = await loadPages(event);
      // Merge: Nuxt already announces this page's own /_payload.json in the same header
      event.node.res.setHeader(
        'x-nitro-prerender',
        mergePrerenderHeader(
          event.node.res.getHeader('x-nitro-prerender'),
          pages.map(page => rawPath(page.path)),
        ),
      );
    });
  }
});
