import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { generateApi, sortSections } from './generate-api';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

describe('generateApi(core)', () => {
  let out: string;
  beforeAll(async () => {
    out = mkdtempSync(join(tmpdir(), 'api-'));
    await generateApi('core', out);
  }, 120_000);
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it('writes one page per export with frontmatter', () => {
    const page = readFileSync(join(out, 'functions/parseWell.md'), 'utf8');
    expect(page).toMatch(
      /^---\npath: "\/core\/api\/functions\/parseWell"\ntitle: parseWell\n/,
    );
    expect(page).toContain('generated: true');
  });

  it('rewrites links to site routes (no .md, prefixed)', () => {
    for (const file of walk(out)) {
      const text = readFileSync(file, 'utf8');
      const links = [...text.matchAll(/\]\(([^)\s]+)\)/g)].map(m => m[1]!);
      for (const link of links) {
        expect(link, `${file}: ${link}`).not.toMatch(/\.md(#|$)/);
        if (!/^(https?:|#)/.test(link)) expect(link).toMatch(/^\/core\/api\//);
      }
    }
  });

  it('lists the exports in index.md', () => {
    const index = readFileSync(join(out, 'index.md'), 'utf8');
    expect(index).toContain('parseWell');
  });
});

describe('sortSections', () => {
  it('separates sections with a blank line, even when the last one is trimmed', () => {
    const body = '## Variables\n\n- [A](/a)\n\n## Functions\n\n- [f](/f)';
    expect(sortSections(body)).toBe(
      '## Functions\n\n- [f](/f)\n\n## Variables\n\n- [A](/a)',
    );
  });
});

describe('generateApi(utils) index', () => {
  let out: string;
  beforeAll(async () => {
    out = mkdtempSync(join(tmpdir(), 'api-utils-'));
    await generateApi('utils', out);
  }, 120_000);
  afterAll(() => rmSync(out, { recursive: true, force: true }));

  it('puts every ## heading on its own line after a blank line', () => {
    const body = readFileSync(join(out, 'index.md'), 'utf8')
      .split('\n---\n')[1]!
      .trim();
    expect(body).not.toMatch(/[^\n]## /);
    for (const m of body.matchAll(/^## /gm)) {
      if (m.index! > 0) expect(body.slice(m.index! - 2, m.index!)).toBe('\n\n');
    }
  }, 120_000);
});
