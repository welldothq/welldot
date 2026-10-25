import { describe, expect, it } from 'vitest';
import { pageSummary } from './page-summary';

describe('pageSummary', () => {
  it('prefers a native frontmatter description', () => {
    expect(
      pageSummary({ description: 'Hand written.', rawbody: '# T\n\nBody.' }),
    ).toBe('Hand written.');
  });

  it('falls back to the first prose paragraph, skipping headings, metadata and links', () => {
    const rawbody = [
      '# `.well` File Format Specification',
      '',
      '**Version:** 2.4 **Extension:** `.well`',
      '',
      '**See also:** [a.md](./a.md)',
      '',
      '## Overview',
      '',
      'The `.well` v2 specification is split into [five](./x.md)',
      'documents.',
      '',
      '- list item',
    ].join('\n');
    expect(pageSummary({ rawbody })).toBe(
      'The .well v2 specification is split into five documents.',
    );
  });

  it('ignores the derived description of pages without frontmatter', () => {
    expect(
      pageSummary({
        description: 'See also: overview.md',
        rawbody: '# T\n\nReal text here.',
        native: false,
      }),
    ).toBe('Real text here.');
  });

  it('truncates long paragraphs and returns empty when there is no prose', () => {
    expect(
      pageSummary({ rawbody: `# T\n\n${'word '.repeat(80)}` }).length,
    ).toBeLessThanOrEqual(200);
    expect(pageSummary({ rawbody: '# T\n\n```ts\ncode\n```' })).toBe('');
  });
});

describe('pageSummary identifiers', () => {
  it('keeps underscores in snake_case identifiers', () => {
    expect(
      pageSummary({
        rawbody: '# T\n\nThe `water_samples` block and `bore_hole`.',
      }),
    ).toBe('The water_samples block and bore_hole.');
  });
});
