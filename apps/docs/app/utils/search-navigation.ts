import type { ContentNavigationItem } from '@nuxt/content';
import {
  type DocCollection,
  EXTRA_SECTIONS,
  SECTIONS,
  sectionNavigation,
} from '~/sections';

interface SearchFile {
  id: string;
  title: string;
}

const within = (path: string, root: string) =>
  path === root || path.startsWith(`${root}/`);

function leafPaths(items: ContentNavigationItem[]): string[] {
  return items.flatMap(item =>
    item.children?.length ? leafPaths(item.children) : [item.path],
  );
}

/**
 * The navigation the command palette resolves search sections against. UContentSearch
 * keeps a section only when its page path is a leaf here, but generated pages (API,
 * object reference) have `navigation: false` and never reach the sidebar tree. So each
 * group is the sidebar of a section plus a leaf for every indexed page below its root
 * that the sidebar lacks. The sidebar itself is unchanged.
 */
export function searchNavigation(
  navs: Partial<Record<DocCollection, ContentNavigationItem[]>>,
  files: SearchFile[],
): ContentNavigationItem[] {
  const pages = files.filter(file => !file.id.includes('#'));
  return [...SECTIONS, ...EXTRA_SECTIONS]
    .map(section => {
      const children = sectionNavigation(section, navs);
      const known = new Set(leafPaths(children));
      const extra: ContentNavigationItem[] = [];
      for (const page of pages) {
        if (!within(page.id, section.root) || known.has(page.id)) continue;
        known.add(page.id);
        extra.push({ title: page.title, path: page.id });
      }
      return {
        title: section.title,
        path: section.root,
        icon: section.icon,
        children: [...children, ...extra],
      };
    })
    .filter(group => group.children.length);
}
