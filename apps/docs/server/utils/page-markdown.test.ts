import { describe, expect, it } from 'vitest';
import { pageMarkdown } from './page-markdown';

describe('pageMarkdown', () => {
  it('returns a body that starts with a heading as is', () => {
    expect(pageMarkdown({ title: 'T', rawbody: '# T\n\nBody.\n' })).toBe(
      '# T\n\nBody.\n',
    );
  });

  it('strips the frontmatter block', () => {
    expect(
      pageMarkdown({
        title: 'Components',
        rawbody: '---\ntitle: Components\n---\n\n# Components\n\nText.',
      }),
    ).toBe('# Components\n\nText.');
  });

  it('prepends the title when the body has no h1', () => {
    expect(
      pageMarkdown({
        title: 'API reference',
        description: 'Functions.',
        rawbody: '---\ntitle: x\n---\n\n## Functions\n',
      }),
    ).toBe('# API reference\n\n> Functions.\n\n## Functions\n');
  });

  it('keeps a spec body untouched (no frontmatter)', () => {
    const raw = '# `.well` File Format Specification\n\nText.';
    expect(pageMarkdown({ title: 'x', rawbody: raw })).toBe(raw);
  });
});
