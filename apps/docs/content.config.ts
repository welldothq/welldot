import { defineCollection, defineContentConfig, z } from '@nuxt/content';
import { fileURLToPath } from 'node:url';

const repoPath = (path: string) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url));

// The title comes from the first `#` heading; spec files and changelogs have no frontmatter
const schema = z.object({ rawbody: z.string() });

const changelog = (pkg: string) => ({
  cwd: repoPath(`packages/${pkg}`),
  include: 'CHANGELOG.md',
  // The dev watcher watches everything under `cwd` that isn't excluded. Without this it
  // follows node_modules symlinks into ~25k files, and esbuild fails with `spawn EBADF`
  exclude: ['*/**'],
  prefix: `/${pkg}`,
});

export default defineContentConfig({
  collections: {
    docs_en: defineCollection({
      type: 'page',
      source: { include: 'en/**/*.md', prefix: '/' },
      schema,
    }),
    spec: defineCollection({
      type: 'page',
      source: {
        cwd: repoPath('spec'),
        // README.md is the GitHub landing page of the folder, not a site page
        include: '**/*.md',
        exclude: ['README.md', 'profiles/**'],
        prefix: '/format/spec',
      },
      schema,
    }),
    changelogs: defineCollection({
      type: 'page',
      source: [changelog('core'), changelog('utils'), changelog('render')],
      schema,
    }),
  },
});
