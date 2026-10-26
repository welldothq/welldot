import type { ContentNavigationItem } from '@nuxt/content';
import { describe, expect, it } from 'vitest';
import { searchNavigation } from './search-navigation';

// docs_en navigation: generated pages have `navigation: false`, so they are absent here
const docs: ContentNavigationItem[] = [
  {
    title: 'Core',
    path: '/core',
    children: [{ title: 'Install', path: '/core/install' }],
  },
  {
    title: 'Contributing',
    path: '/contributing',
    children: [{ title: 'Rules', path: '/contributing/update-rules' }],
  },
];

const files = [
  { id: '/core/install', title: 'Install' },
  { id: '/core/install#setup', title: 'Setup' },
  { id: '/core/api/classes/WellRenderer', title: 'WellRenderer' },
  { id: '/core/api/classes/WellRenderer#methods', title: 'Methods' },
  { id: '/format/reference/objects/well-screen', title: 'Well screen' },
  { id: '/contributing/update-rules', title: 'Update rules' },
  { id: '/contributing/hidden', title: 'Hidden' },
  { id: '/elsewhere', title: 'Elsewhere' },
];

function leaves(items: ContentNavigationItem[]): string[] {
  return items.flatMap(i =>
    i.children?.length ? leaves(i.children) : [i.path],
  );
}

describe('searchNavigation', () => {
  const nav = searchNavigation({ docs_en: docs }, files);
  const paths = leaves(nav);

  it('keeps the sidebar leaves', () => {
    expect(paths).toContain('/core/install');
  });

  it('adds generated API pages, resolved by their case-preserving path', () => {
    expect(paths).toContain('/core/api/classes/WellRenderer');
    expect(
      paths.filter(p => p === '/core/api/classes/WellRenderer'),
    ).toHaveLength(1);
  });

  it('adds object reference pages to the format section', () => {
    expect(paths).toContain('/format/reference/objects/well-screen');
  });

  it('includes contributing, which is outside the switcher', () => {
    expect(paths).toContain('/contributing/update-rules');
    expect(paths).toContain('/contributing/hidden');
    expect(nav.some(g => g.path === '/contributing')).toBe(true);
  });

  it('skips heading sections and pages outside every section', () => {
    expect(paths.some(p => p.includes('#'))).toBe(false);
    expect(paths).not.toContain('/elsewhere');
  });
});
