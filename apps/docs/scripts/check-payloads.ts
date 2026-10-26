/**
 * Every prerendered page (a directory with an `index.html`, the root included) must have a
 * `_payload.json` next to it. Nuxt's client fetches it on hydration and shows a 404 page when it
 * is missing. `payloadExtraction` is on by default and every page here gets one, so there is no
 * legitimate exception beyond the folders below, which hold assets and data, not pages.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SKIPPED_DIRS = new Set(['raw', '_nuxt', '__nuxt_content', '_mcp']);

function walk(root: string, dir = root, out: string[] = []): string[] {
  if (existsSync(join(dir, 'index.html'))) out.push(dir);
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (dir === root && SKIPPED_DIRS.has(name)) continue;
    if (statSync(full).isDirectory()) walk(root, full, out);
  }
  return out;
}

/** Routes (`/`, `/a/b`) of pages that lack a `_payload.json`. */
export function checkPayloads(publicDir: string): string[] {
  return walk(publicDir)
    .filter(dir => !existsSync(join(dir, '_payload.json')))
    .map(dir => `/${relative(publicDir, dir).replace(/\\/g, '/')}`)
    .map(route => (route === '/.' ? '/' : route))
    .sort();
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
  const missing = checkPayloads(publicDir);
  for (const route of missing) console.error(`${route} has no _payload.json`);
  if (missing.length) {
    console.error(`\n${missing.length} page(s) without a _payload.json`);
    process.exit(1);
  }
  console.log('Every prerendered page has a _payload.json');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
