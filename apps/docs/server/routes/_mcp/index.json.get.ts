import { buildDocsIndex } from '../../utils/docs-data';

// GET /_mcp/index.json -> the search sections and page sources of the MCP server. Prerendered
// at build time (nuxt.config.ts), so a Worker serves it as a static asset.
export default defineEventHandler(event => buildDocsIndex(event));
