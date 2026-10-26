// https://nuxt.com/docs/api/configuration/nuxt-config
import json from '@shikijs/langs/json';
import { fileURLToPath } from 'node:url';
import { restoreGithubHeadingIds } from './content-hooks/github-heading-ids';
import rehypeGithubSlugs from './rehype/rehype-github-slugs';
import remarkSpecLinks from './remark/remark-spec-links';

const localPath = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

// Setting `langs` replaces @nuxtjs/mdc's defaults, so they are repeated here. A `well` fence is
// a complete .well document (validated in CI) and is highlighted with the JSON grammar.
const highlightLangs = [
  ...[
    'js',
    'jsx',
    'json',
    'ts',
    'tsx',
    'vue',
    'css',
    'html',
    'bash',
    'md',
    'mdc',
    'yaml',
  ],
  { ...json[0]!, name: 'well', aliases: [] },
];

export default defineNuxtConfig({
  srcDir: 'app/',
  ssr: true,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // @nuxt/ui must come before @nuxt/content
  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxt/content', 'nuxt-llms'],

  css: ['~/assets/css/main.css'],

  // Welldot uses `.dark-mode` / `.light-mode` instead of `.dark` / `.light`
  colorMode: { classSuffix: '-mode' },

  fonts: {
    families: [
      { name: 'Space Grotesk', weights: [400, 500, 700] },
      {
        name: 'IBM Plex Serif',
        weights: [400, 500],
        styles: ['normal', 'italic'],
      },
      { name: 'JetBrains Mono', weights: [400, 500] },
    ],
  },

  // Node's built-in sqlite (Node >= 22.5): avoids the better-sqlite3 native build
  content: {
    // Nuxt Content's own llms integration rebuilds Markdown from the parsed body and registers
    // /raw/**.md; this site serves the source (`rawbody`) from server/routes/raw and builds
    // llms.txt itself in server/plugins/llms.ts, so only nuxt-llms is used
    llms: false,
    experimental: { sqliteConnector: 'native' },
    build: {
      markdown: {
        highlight: { langs: highlightLangs },
        // Rewrite spec links and use GitHub-compatible heading ids (see ./remark, ./rehype).
        // `instance` is used by the content parser, `src` by the generated .nuxt/mdc-imports.mjs
        remarkPlugins: {
          'remark-spec-links': {
            instance: remarkSpecLinks,
            src: localPath('./remark/remark-spec-links.ts'),
            options: {},
          },
        },
        rehypePlugins: {
          'rehype-github-slugs': {
            instance: rehypeGithubSlugs,
            src: localPath('./rehype/rehype-github-slugs.ts'),
            options: {},
          },
        },
      },
    },
  },

  // `nuxt dev` and `nuxt build/generate` share one Nuxt Content local SQLite cache by default
  // (.data/content/contents.sqlite). Running generate while a dev server is up fails with
  // "database is locked", so each mode gets its own file.
  $development: {
    content: {
      _localDatabase: {
        type: 'sqlite',
        filename: '.data/content/contents.dev.sqlite',
      },
    },
  },
  $production: {
    content: {
      _localDatabase: {
        type: 'sqlite',
        filename: '.data/content/contents.build.sqlite',
      },
    },
  },

  // Cloudflare Worker with static assets (wrangler.json). The site is fully prerendered and the
  // Worker has no content database: the MCP server reads a prerendered JSON index instead
  // (server/utils/docs-index.ts), so there is no D1 binding.
  nitro: {
    preset: 'cloudflare-module',
    prerender: {
      crawlLinks: true,
      // The raw Markdown pages are announced by the response of `/` (server/plugins/llms.ts)
      routes: ['/', '/llms.txt', '/llms-full.txt', '/_mcp/index.json'],
      failOnError: true,
    },
  },

  hooks: {
    // MDC normalizes heading ids after our rehype plugin; put the GitHub ids back
    'content:file:afterParse': (ctx: { content: { body?: unknown } }) => {
      restoreGithubHeadingIds(ctx.content.body as never);
    },
  },

  // llms.txt and llms-full.txt are prerendered by nuxt-llms. The raw pages are discovered from
  // llms.txt (see server/plugins/llms.ts), since a `/raw/**` rule alone does not enumerate them.
  // The sections are filled from the content by that plugin
  llms: {
    domain: 'https://docs.welldot.org',
    title: 'Welldot',
    description:
      'Open-source ecosystem for geological water well log visualization and data management, built around the `.well` open file format: a JSON standard to digitally communicate, register and store water well data instead of raw scanned images, PDFs or closed formats. Everything is Apache 2.0 licensed and free. Welldot provides a web application for drawing well construction and lithology profiles, plus framework-agnostic TypeScript libraries to read, validate, analyze and render `.well` files.',
    full: {
      title: 'Complete documentation',
      description: 'Every hand-written and spec page in one file.',
    },
    sections: [],
  },

  icon: { mode: 'css', cssLayer: 'base' },
});
