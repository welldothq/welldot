/**
 * Warns (never fails) when a PR adds a changeset but touches neither `apps/docs/` nor `spec/`.
 * Usage: `git diff --name-only <base>...HEAD | tsx scripts/check-docs-touched.ts`
 * (file names are also accepted as arguments).
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function docsTouched(changedFiles: string[]): {
  warn: boolean;
  message: string;
} {
  const hasChangeset = changedFiles.some(
    f => /^\.changeset\/[^/]+\.md$/.test(f) && f !== '.changeset/README.md',
  );
  const hasDocs = changedFiles.some(
    f => f.startsWith('apps/docs/') || f.startsWith('spec/'),
  );
  if (hasChangeset && !hasDocs) {
    return {
      warn: true,
      message:
        'This PR adds a changeset but changes nothing under apps/docs/ or spec/. Check whether the docs need an update.',
    };
  }
  return { warn: false, message: '' };
}

function main() {
  const args = process.argv.slice(2);
  const input = args.length ? args.join('\n') : readFileSync(0, 'utf8');
  const files = input
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
  const result = docsTouched(files);
  if (result.warn) console.log(`::warning::${result.message}`);
  else console.log('Docs check: nothing to flag');
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
