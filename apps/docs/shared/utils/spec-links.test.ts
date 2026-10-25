import { describe, expect, it } from 'vitest';
import { rewriteSpecLink } from './spec-links';

const GH = 'https://github.com/welldothq/welldot/blob/main/';

describe('rewriteSpecLink', () => {
  it('resolves a sibling file', () => {
    expect(rewriteSpecLink('format-reference.md', 'v2/overview.md')).toBe(
      '/format/spec/v2/format-reference',
    );
  });
  it('keeps the anchor', () => {
    expect(
      rewriteSpecLink(
        './object-schemas.md#hydrodynamic-events',
        'v2/overview.md',
      ),
    ).toBe('/format/spec/v2/object-schemas#hydrodynamic-events');
  });
  it('resolves across versions', () => {
    expect(rewriteSpecLink('../v2/overview.md', 'v1/well-format.md')).toBe(
      '/format/spec/v2/overview',
    );
  });
  it('maps schema files to welldot.org', () => {
    expect(
      rewriteSpecLink(
        '../schema/v2/well.schema.json',
        'v2/interoperability.md',
      ),
    ).toBe('https://welldot.org/schema/v2/well.schema.json');
  });
  it('maps repo files outside spec/ to GitHub', () => {
    expect(rewriteSpecLink('../packages/core/CLAUDE.md', 'README.md')).toBe(
      `${GH}packages/core/CLAUDE.md`,
    );
    expect(rewriteSpecLink('../CONTRIBUTING.md', 'README.md')).toBe(
      `${GH}CONTRIBUTING.md`,
    );
  });
  it('resolves repo files from nested spec files', () => {
    expect(rewriteSpecLink('../../CONTRIBUTING.md#x', 'v2/overview.md')).toBe(
      `${GH}CONTRIBUTING.md#x`,
    );
  });
  it('sends non-site spec files to GitHub', () => {
    expect(rewriteSpecLink('v2/overview.md', 'README.md')).toBe(
      '/format/spec/v2/overview',
    );
    expect(rewriteSpecLink('../README.md', 'v2/overview.md')).toBe(
      `${GH}spec/README.md`,
    );
  });
  it('leaves in-page anchors and absolute URLs alone', () => {
    expect(rewriteSpecLink('#units', 'v2/format-reference.md')).toBe('#units');
    expect(rewriteSpecLink('https://x.org/a', 'v2/overview.md')).toBe(
      'https://x.org/a',
    );
  });
});
