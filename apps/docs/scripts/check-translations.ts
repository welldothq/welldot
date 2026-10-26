/**
 * Lists PT pages that are older than their EN source. A PT page carries frontmatter
 * `translated_from: <sha256 of the EN page's raw file text>`. Warns, never fails.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function translatedFrom(text: string): string | undefined {
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!fm) return undefined;
  const m = /^translated_from:\s*["']?([^\s"']+)["']?\s*$/m.exec(fm[1]);
  return m?.[1];
}

/** PT paths (relative to `contentDir`, e.g. `pt/a.md`) whose hash differs from the EN page. */
export function staleTranslations(contentDir: string): string[] {
  const ptDir = join(contentDir, 'pt');
  if (!existsSync(ptDir)) return [];
  const stale: string[] = [];
  for (const file of walk(ptDir).sort()) {
    const rel = relative(contentDir, file).replace(/\\/g, '/');
    const en = join(contentDir, 'en', relative(ptDir, file));
    const recorded = translatedFrom(readFileSync(file, 'utf8'));
    const current = existsSync(en)
      ? createHash('sha256').update(readFileSync(en, 'utf8')).digest('hex')
      : undefined;
    if (!recorded || recorded !== current) stale.push(rel);
  }
  return stale;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const stale = staleTranslations(join(here, '../content'));
  if (!stale.length) {
    console.log('Translations: nothing stale');
    return;
  }
  for (const p of stale) {
    console.log(
      `::warning file=apps/docs/content/${p}::Translation is out of date with its English page`,
    );
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
