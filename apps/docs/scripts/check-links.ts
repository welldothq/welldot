/**
 * Scans the generated site (`.output/public/**\/*.html`) for same-site links and checks that
 * the target page exists and, for `#anchor` links, that it contains `id="<anchor>"`.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export interface LinkProblem {
  from: string;
  href: string;
  reason: 'missing-page' | 'missing-anchor';
}

/** Server routes that are not prerendered. */
const SKIPPED_PATHS = new Set(['/mcp']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.html')) out.push(full);
  }
  return out;
}

function decode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function unescapeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** `/a/b` -> the file that serves it, or undefined. */
function resolvePage(publicDir: string, path: string): string | undefined {
  const rel = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const candidates = rel
    ? [join(publicDir, `${rel}/index.html`), join(publicDir, `${rel}.html`)]
    : [join(publicDir, 'index.html')];
  const exact = rel ? join(publicDir, rel) : undefined;
  // A file with an extension (raw/x.md, llms.txt) is served as is
  if (exact && existsSync(exact) && statSync(exact).isFile()) return exact;
  return candidates.find(c => existsSync(c));
}

const idCache = new Map<string, Set<string>>();

function idsOf(file: string): Set<string> {
  let ids = idCache.get(file);
  if (!ids) {
    ids = new Set();
    const html = readFileSync(file, 'utf8');
    for (const m of html.matchAll(/\sid=(?:"([^"]*)"|'([^']*)')/g)) {
      ids.add(unescapeHtml(m[1] ?? m[2]));
    }
    idCache.set(file, ids);
  }
  return ids;
}

export function checkLinks(publicDir: string): LinkProblem[] {
  idCache.clear();
  const problems: LinkProblem[] = [];
  const seen = new Set<string>();

  for (const file of walk(publicDir).sort()) {
    const relPath = relative(publicDir, file).replace(/\\/g, '/');
    const from = `/${relPath
      .replace(/(^|\/)index\.html$/, '')
      .replace(/\.html$/, '')}`;
    const html = readFileSync(file, 'utf8');

    for (const m of html.matchAll(
      /<a\s[^>]*?\bhref=(?:"([^"]*)"|'([^']*)')/g,
    )) {
      const href = unescapeHtml(m[1] ?? m[2]);
      if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')) continue;
      if (!href.startsWith('/') && !href.startsWith('#')) continue;

      const key = `${from}\0${href}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const [beforeHash, ...hashParts] = href.split('#');
      const anchor = hashParts.length ? decode(hashParts.join('#')) : '';
      const path = decode(beforeHash.split('?')[0]);
      if (SKIPPED_PATHS.has(path.replace(/\/$/, ''))) continue;

      const target = path === '' ? file : resolvePage(publicDir, path);
      if (!target) {
        problems.push({ from, href, reason: 'missing-page' });
        continue;
      }
      if (anchor && target.endsWith('.html') && !idsOf(target).has(anchor)) {
        problems.push({ from, href, reason: 'missing-anchor' });
      }
    }
  }
  return problems;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const publicDir = process.argv[2] ?? join(here, '../.output/public');
  if (!existsSync(publicDir)) {
    console.error(
      `${publicDir} not found: run \`pnpm --filter docs generate\` first`,
    );
    process.exit(1);
  }
  const problems = checkLinks(publicDir);
  for (const p of problems) {
    console.error(`${p.from} -> ${p.href} (${p.reason})`);
  }
  if (problems.length) {
    console.error(`\n${problems.length} broken link(s)`);
    process.exit(1);
  }
  console.log('All same-site links resolve');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
