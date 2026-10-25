import { resolvePage } from '../../utils/docs-data';
import { pageMarkdown } from '../../utils/page-markdown';

// GET /raw/<path>.md -> the page's Markdown source. At generate time every page is also
// prerendered to .output/public/raw/<path>.md (see server/plugins/llms.ts), so this handler
// serves the dev server and any Node deployment; a static host serves the file by extension.
export default defineEventHandler(async event => {
  const { pathname } = getRequestURL(event);
  const slug = decodeURIComponent(pathname.replace(/^\/raw\/?/, ''));

  if (!slug.endsWith('.md')) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' });
  }

  const page = await resolvePage(event, slug);
  if (!page) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' });
  }

  setHeader(event, 'content-type', 'text/markdown; charset=utf-8');
  return pageMarkdown(page);
});
