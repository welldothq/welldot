import { describe, expect, it } from 'vitest';
import { editUrl, GITHUB_BASE, isGeneratedPage, rawPath } from './page-links';

describe('rawPath', () => {
  it('maps a route to its raw Markdown route', () => {
    expect(rawPath('/format/spec/v2/overview')).toBe(
      '/raw/format/spec/v2/overview.md',
    );
    expect(rawPath('/core/api/')).toBe('/raw/core/api.md');
    expect(rawPath('/')).toBe('/raw/index.md');
  });
});

describe('editUrl', () => {
  it('points native pages at apps/docs/content/en', () => {
    expect(editUrl({ id: 'docs_en/contributing/components.md' })).toBe(
      `${GITHUB_BASE}apps/docs/content/en/contributing/components.md`,
    );
    expect(editUrl({ id: 'docs_en/core/api/index.md' })).toBe(
      `${GITHUB_BASE}apps/docs/content/en/core/api/index.md`,
    );
  });

  it('points spec pages at spec/', () => {
    expect(editUrl({ id: 'spec/format/spec/v2/overview.md' })).toBe(
      `${GITHUB_BASE}spec/v2/overview.md`,
    );
    expect(editUrl({ id: 'spec/format/spec/reference/fgdc-textures.md' })).toBe(
      `${GITHUB_BASE}spec/reference/fgdc-textures.md`,
    );
  });

  it('points changelogs at the package CHANGELOG', () => {
    expect(editUrl({ id: 'changelogs/core/CHANGELOG.md' })).toBe(
      `${GITHUB_BASE}packages/core/CHANGELOG.md`,
    );
  });

  it('returns null for generated pages and unknown ids', () => {
    expect(
      editUrl({ id: 'docs_en/core/api/index.md', meta: { generated: true } }),
    ).toBeNull();
    expect(editUrl({ id: 'other/x.md' })).toBeNull();
    expect(editUrl({})).toBeNull();
  });
});

describe('isGeneratedPage', () => {
  it('reads the generated frontmatter flag', () => {
    expect(isGeneratedPage({ meta: { generated: true } })).toBe(true);
    expect(isGeneratedPage({ meta: {} })).toBe(false);
    expect(isGeneratedPage({})).toBe(false);
  });
});
