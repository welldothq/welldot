import type { ContentNavigationItem } from '@nuxt/content';
import { describe, expect, it } from 'vitest';
import {
  SECTIONS,
  sectionForPath,
  sectionHome,
  sectionNavigation,
  surroundFor,
} from './sections';

describe('sectionForPath', () => {
  it('matches a section by its root', () => {
    expect(sectionForPath('/format/spec/v2/overview')?.id).toBe('format');
    expect(sectionForPath('/core/api/functions/parseWell')?.id).toBe('core');
    expect(sectionForPath('/render/changelog')?.id).toBe('render');
    expect(sectionForPath('/ai')?.id).toBe('ai');
  });

  it('matches on a segment boundary only', () => {
    expect(sectionForPath('/core-ideas')).toBeUndefined();
  });

  it('leaves pages outside the sections unassigned', () => {
    expect(sectionForPath('/')).toBeUndefined();
    expect(sectionForPath('/elsewhere')).toBeUndefined();
  });

  it('gives contributing a sidebar section outside the switcher', () => {
    expect(sectionForPath('/contributing/rules')?.id).toBe('contributing');
    expect(SECTIONS.some(s => s.id === 'contributing')).toBe(false);
  });

  it('ignores a trailing slash', () => {
    expect(sectionForPath('/utils/')?.id).toBe('utils');
  });

  it('lists the first-release sections only', () => {
    expect(SECTIONS.map(s => s.id)).toEqual([
      'format',
      'core',
      'utils',
      'render',
      'ai',
    ]);
  });
});

const section = (id: string) => SECTIONS.find(s => s.id === id)!;

// Shape produced by queryCollectionNavigation('spec'): directories become nodes,
// files become leaves; order is alphabetical.
const specNav: ContentNavigationItem[] = [
  {
    title: 'Format',
    path: '/format',
    children: [
      {
        title: 'Spec',
        path: '/format/spec',
        children: [
          {
            title: 'Reference',
            path: '/format/spec/reference',
            children: [
              {
                title: 'FGDC Texture Patterns Reference',
                path: '/format/spec/reference/fgdc-textures',
              },
            ],
          },
          {
            title: 'V1',
            path: '/format/spec/v1',
            children: [
              {
                title: '.well File Format Specification',
                path: '/format/spec/v1/well-format',
              },
            ],
          },
          {
            title: 'V2',
            path: '/format/spec/v2',
            children: [
              'format-reference',
              'interoperability',
              'object-schemas',
              'overview',
              'water-quality',
            ].map(name => ({
              title: `Spec 2.4: ${name}`,
              path: `/format/spec/v2/${name}`,
            })),
          },
        ],
      },
    ],
  },
];

const changelogNav: ContentNavigationItem[] = ['core', 'utils', 'render'].map(
  pkg => ({
    title: pkg,
    path: `/${pkg}`,
    children: [{ title: `@welldot/${pkg}`, path: `/${pkg}/changelog` }],
  }),
);

const docsNav: ContentNavigationItem[] = [
  { title: 'Welldot documentation', path: '/' },
  {
    title: 'Core',
    path: '/core',
    children: [
      {
        title: 'Getting started',
        path: '/core/getting-started',
        children: [{ title: 'Install', path: '/core/getting-started/install' }],
      },
    ],
  },
  {
    title: 'Contributing',
    path: '/contributing',
    children: [{ title: 'Rules', path: '/contributing/rules' }],
  },
];

describe('sectionNavigation', () => {
  it('orders the spec pages and labels v1 as archived', () => {
    const nav = sectionNavigation(section('format'), { spec: specNav });
    expect(nav).toHaveLength(1);
    expect(nav[0]!.title).toBe('Specification');
    expect(nav[0]!.children!.map(c => [c.title, c.path])).toEqual([
      ['Overview', '/format/spec/v2/overview'],
      ['Format reference', '/format/spec/v2/format-reference'],
      ['Object schemas', '/format/spec/v2/object-schemas'],
      ['Water quality', '/format/spec/v2/water-quality'],
      ['Interoperability', '/format/spec/v2/interoperability'],
      ['FGDC textures', '/format/spec/reference/fgdc-textures'],
      ['v1 (archived)', '/format/spec/v1/well-format'],
    ]);
  });

  it('keeps a spec page it does not know, after the known ones', () => {
    const extra = structuredClone(specNav);
    extra[0]!.children![0]!.children![2]!.children!.push({
      title: 'Spec 2.4: Profiles',
      path: '/format/spec/v2/profiles',
    });
    const paths = sectionNavigation(section('format'), {
      spec: extra,
    })[0]!.children!.map(c => c.path);
    expect(paths.at(-1)).toBe('/format/spec/v2/profiles');
    expect(paths).toHaveLength(8);
  });

  it('shows only the current section', () => {
    const nav = sectionNavigation(section('core'), {
      docs_en: docsNav,
      changelogs: changelogNav,
      spec: specNav,
    });
    expect(nav.map(n => n.title)).toEqual(['Getting started', 'Changelog']);
    expect(nav[1]!.path).toBe('/core/changelog');
  });

  it('shows a directory that only holds its index page as that page', () => {
    const generated: ContentNavigationItem[] = [
      {
        title: 'Format',
        path: '/format',
        children: [
          {
            title: 'Reference',
            path: '/format/reference',
            children: [
              {
                title: 'Objects',
                path: '/format/reference/objects',
                children: [
                  {
                    title: 'Object reference',
                    path: '/format/reference/objects',
                  },
                ],
              },
            ],
          },
          {
            title: 'Guides',
            path: '/format/guides',
            children: [{ title: 'Start', path: '/format/guides/start' }],
          },
        ],
      },
    ];
    const nav = sectionNavigation(section('format'), { docs_en: generated });
    expect(nav.map(n => [n.title, n.path, n.children?.length])).toEqual([
      ['Object reference', '/format/reference/objects', undefined],
      ['Guides', '/format/guides', 1],
    ]);
  });

  it('opens the Specification group with the native spec page, in its place', () => {
    const native: ContentNavigationItem[] = [
      {
        title: 'Format',
        path: '/format',
        children: [
          { title: 'The .well format', path: '/format' },
          {
            title: 'Guides',
            path: '/format/guides',
            page: false,
            children: [{ title: 'Start', path: '/format/guides/start' }],
          },
          {
            title: 'Spec',
            path: '/format/spec',
            children: [{ title: 'About the spec', path: '/format/spec' }],
          },
          { title: 'Changelog', path: '/format/changelog' },
        ],
      },
    ];
    const nav = sectionNavigation(section('format'), {
      docs_en: native,
      spec: specNav,
    });
    expect(nav.map(n => n.title)).toEqual([
      'The .well format',
      'Guides',
      'Specification',
      'Changelog',
    ]);
    expect(nav[2]!.children!.map(c => c.path).slice(0, 2)).toEqual([
      '/format/spec',
      '/format/spec/v2/overview',
    ]);
    expect(nav[2]!.children).toHaveLength(8);
  });

  it('gives a directory without an index page a sentence-case title', () => {
    const native: ContentNavigationItem[] = [
      {
        title: 'Core',
        path: '/core',
        children: [
          {
            title: 'Getting Started',
            path: '/core/getting-started',
            page: false,
            children: [
              { title: 'Install', path: '/core/getting-started/install' },
            ],
          },
        ],
      },
    ];
    expect(
      sectionNavigation(section('core'), { docs_en: native })[0]!.title,
    ).toBe('Getting started');
  });

  it('labels a group index page that repeats the group title as Overview', () => {
    const native: ContentNavigationItem[] = [
      {
        title: 'Format',
        path: '/format',
        children: [
          {
            title: 'Reference',
            path: '/format/reference',
            children: [
              { title: 'Reference', path: '/format/reference' },
              { title: 'JSON Schema', path: '/format/reference/json-schema' },
            ],
          },
        ],
      },
    ];
    const nav = sectionNavigation(section('format'), { docs_en: native });
    expect(nav[0]!.children!.map(c => c.title)).toEqual([
      'Overview',
      'JSON Schema',
    ]);
  });

  it('returns an empty list for a section without pages', () => {
    expect(sectionNavigation(section('ai'), { docs_en: docsNav })).toEqual([]);
    expect(sectionNavigation(section('utils'), {})).toEqual([]);
  });
});

describe('surroundFor', () => {
  const nav = sectionNavigation(section('format'), { spec: specNav });

  it('returns the previous and next page in sidebar order', () => {
    const [prev, next] = surroundFor(nav, '/format/spec/v2/object-schemas');
    expect(prev?.path).toBe('/format/spec/v2/format-reference');
    expect(next?.path).toBe('/format/spec/v2/water-quality');
  });

  it('has no previous page at the start and no next page at the end', () => {
    expect(surroundFor(nav, '/format/spec/v2/overview')[0]).toBeUndefined();
    expect(surroundFor(nav, '/format/spec/v1/well-format')[1]).toBeUndefined();
  });

  it('returns nothing for a page outside the navigation', () => {
    expect(surroundFor(nav, '/elsewhere')).toEqual([undefined, undefined]);
  });
});

describe('sectionHome', () => {
  it('is the first page of the section sidebar', () => {
    expect(sectionHome(section('format'), { spec: specNav })).toBe(
      '/format/spec/v2/overview',
    );
    expect(
      sectionHome(section('core'), {
        docs_en: docsNav,
        changelogs: changelogNav,
      }),
    ).toBe('/core/getting-started/install');
  });

  it('is the section index page once it exists', () => {
    const native: ContentNavigationItem[] = [
      {
        title: 'Utils',
        path: '/utils',
        children: [
          { title: '@welldot/utils', path: '/utils' },
          {
            title: 'Guides',
            path: '/utils/guides',
            page: false,
            children: [{ title: 'Volumes', path: '/utils/guides/volumes' }],
          },
        ],
      },
    ];
    expect(sectionHome(section('utils'), { docs_en: native })).toBe('/utils');
  });

  it('falls back to the section root when the section has no pages', () => {
    expect(sectionHome(section('ai'), {})).toBe('/ai');
  });
});
