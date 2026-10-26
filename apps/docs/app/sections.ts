import type { ContentNavigationItem } from '@nuxt/content';

export type DocCollection = 'docs_en' | 'spec' | 'changelogs';

export interface DocSection {
  id: 'format' | 'core' | 'utils' | 'render' | 'ai' | 'contributing';
  title: string;
  icon: string;
  root: string;
  collections: DocCollection[];
}

// pdf and vue join in a later release
export const SECTIONS: DocSection[] = [
  {
    id: 'format',
    title: '.well format',
    icon: 'i-lucide-file-braces',
    root: '/format',
    collections: ['docs_en', 'spec'],
  },
  {
    id: 'core',
    title: '@welldot/core',
    icon: 'i-lucide-box',
    root: '/core',
    collections: ['docs_en', 'changelogs'],
  },
  {
    id: 'utils',
    title: '@welldot/utils',
    icon: 'i-lucide-ruler',
    root: '/utils',
    collections: ['docs_en', 'changelogs'],
  },
  {
    id: 'render',
    title: '@welldot/render',
    icon: 'i-lucide-layers',
    root: '/render',
    collections: ['docs_en', 'changelogs'],
  },
  {
    id: 'ai',
    title: 'AI & agents',
    icon: 'i-lucide-sparkles',
    root: '/ai',
    collections: ['docs_en'],
  },
];

/** Sections with a sidebar but no place in the module switcher. */
export const EXTRA_SECTIONS: DocSection[] = [
  {
    id: 'contributing',
    title: 'Contributing',
    icon: 'i-lucide-git-pull-request',
    root: '/contributing',
    collections: ['docs_en'],
  },
];

const within = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

export function sectionForPath(path: string): DocSection | undefined {
  const clean = path.length > 1 ? path.replace(/\/+$/, '') : path;
  return [...SECTIONS, ...EXTRA_SECTIONS].find(s => within(clean, s.root));
}

/** Where the rendered spec lives; a native page here introduces it. */
const SPEC_ROOT = '/format/spec';

/** Spec pages in reading order, with short sidebar labels (their `#` headings are long). */
export const SPEC_PAGES: { path: string; title: string }[] = [
  { path: '/format/spec/v2/overview', title: 'Overview' },
  { path: '/format/spec/v2/format-reference', title: 'Format reference' },
  { path: '/format/spec/v2/object-schemas', title: 'Object schemas' },
  { path: '/format/spec/v2/water-quality', title: 'Water quality' },
  { path: '/format/spec/v2/interoperability', title: 'Interoperability' },
  { path: '/format/spec/reference/fgdc-textures', title: 'FGDC textures' },
  { path: '/format/spec/v1/well-format', title: 'v1 (archived)' },
];

/** Pages (leaves and directory index pages) in tree order. */
function flatten(items: ContentNavigationItem[]): ContentNavigationItem[] {
  return items.flatMap(item => [
    ...(item.page === false || item.children?.length ? [] : [item]),
    ...flatten(item.children ?? []),
  ]);
}

/** The items below `root`: the children of the node at `root`, or top-level items inside it. */
function subtree(
  items: ContentNavigationItem[],
  root: string,
): ContentNavigationItem[] {
  const found: ContentNavigationItem[] = [];
  for (const item of items) {
    if (item.path === root) return item.children ?? [];
    if (within(item.path, root)) found.push(item);
    else if (item.children && within(root, item.path)) {
      const inner = subtree(item.children, root);
      if (inner.length) return inner;
    }
  }
  return found;
}

/** The page of a chain of directories whose only content is one directory index page. */
function soleIndex(
  item: ContentNavigationItem,
): ContentNavigationItem | undefined {
  const [child, ...rest] = item.children ?? [];
  if (!child || rest.length) return undefined;
  if (child.children) return soleIndex(child);
  return child.path === item.path ? child : undefined;
}

/** `Getting Started` (Nuxt Content's title for a directory without an index page) -> `Getting started`. */
function sentenceCase(title: string): string {
  return title.charAt(0) + title.slice(1).toLowerCase();
}

/**
 * A directory that only holds its own index page shows as that page, not as a group with
 * one entry inside (`Reference > Object reference > Object reference`). A directory without
 * an index page gets a sentence-case title, as every other label on the site.
 */
function collapseIndexOnly(
  items: ContentNavigationItem[],
): ContentNavigationItem[] {
  return items.map(item => {
    const sole = soleIndex(item);
    if (sole) return sole;
    if (!item.children) return item;
    // A group's own index page would repeat the group title (`Reference > Reference`)
    const children = collapseIndexOnly(item.children).map(child =>
      child.path === item.path && child.title === item.title
        ? { ...child, title: 'Overview' }
        : child,
    );
    return {
      ...item,
      ...(item.page === false && { title: sentenceCase(item.title) }),
      children,
    };
  });
}

function specGroup(
  nav: ContentNavigationItem[],
  intro?: ContentNavigationItem,
): ContentNavigationItem[] {
  const pages = flatten(nav);
  if (!pages.length) return intro ? [intro] : [];
  const rank = (path: string) => {
    const i = SPEC_PAGES.findIndex(p => p.path === path);
    return i === -1 ? SPEC_PAGES.length : i;
  };
  const children = pages
    .map((page, i) => ({ page, i }))
    .sort((a, b) => rank(a.page.path) - rank(b.page.path) || a.i - b.i)
    .map(({ page }) => ({
      ...page,
      title: SPEC_PAGES.find(p => p.path === page.path)?.title ?? page.title,
    }));
  return [
    {
      title: 'Specification',
      path: SPEC_ROOT,
      children: intro ? [intro, ...children] : children,
    },
  ];
}

function changelogLinks(
  nav: ContentNavigationItem[],
  root: string,
): ContentNavigationItem[] {
  return flatten(subtree(nav, root)).map(page => ({
    ...page,
    title: 'Changelog',
  }));
}

/**
 * The sidebar of one section: its native pages first, then the pages read from outside
 * `apps/docs` (the spec for the format section, the changelog for a package). A native
 * `/format/spec` page opens the Specification group and puts the group in its place, so
 * native pages after it (the format changelog) stay after the spec.
 */
export function sectionNavigation(
  section: DocSection,
  navs: Partial<Record<DocCollection, ContentNavigationItem[]>>,
): ContentNavigationItem[] {
  const native = section.collections.includes('docs_en')
    ? collapseIndexOnly(subtree(navs.docs_en ?? [], section.root))
    : [];
  const items: ContentNavigationItem[] = [...native];

  if (section.collections.includes('spec')) {
    const at = native.findIndex(item => item.path === SPEC_ROOT);
    const intro = at === -1 ? undefined : native[at];
    const group = specGroup(subtree(navs.spec ?? [], section.root), intro);
    if (at === -1) items.push(...group);
    else items.splice(at, 1, ...group);
  }
  if (section.collections.includes('changelogs')) {
    items.push(...changelogLinks(navs.changelogs ?? [], section.root));
  }
  return items;
}

/** Previous and next page of `path` in sidebar order, for `UContentSurround`. */
export function surroundFor(
  nav: ContentNavigationItem[],
  path: string,
): [ContentNavigationItem | undefined, ContentNavigationItem | undefined] {
  const pages = flatten(nav);
  const i = pages.findIndex(p => p.path === path);
  if (i === -1) return [undefined, undefined];
  return [pages[i - 1], pages[i + 1]];
}

/** Where the switcher sends a section: its first sidebar page, or its root while it has none. */
export function sectionHome(
  section: DocSection,
  navs: Partial<Record<DocCollection, ContentNavigationItem[]>>,
): string {
  return flatten(sectionNavigation(section, navs))[0]?.path ?? section.root;
}
