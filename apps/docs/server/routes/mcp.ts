// eslint-disable-next-line import-x/no-unresolved -- subpath export of the SDK
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from '../mcp-lib/server';
import { loadSections, resolvePage } from '../utils/docs-data';

// The SDK default is 4 MiB. validate_well accepts a .well of up to 5 MB, and the JSON-RPC
// envelope escapes quotes and newlines (up to ~2x for pretty-printed JSON), so the transport
// must accept well over 5 MB for validate_well to answer `too_large` itself.
const MAX_REQUEST_BODY_BYTES = 12 * 1024 * 1024;

const jsonRpcError = (status: number, message: string, headers?: HeadersInit) =>
  new Response(
    JSON.stringify({
      jsonrpc: '2.0',
      error: { code: -32000, message },
      id: null,
    }),
    { status, headers: { 'content-type': 'application/json', ...headers } },
  );

/**
 * MCP over Streamable HTTP at /mcp, stateless: one server and transport per request, JSON
 * responses (no SSE, no session id). Uses only Web APIs, so it runs on Cloudflare Workers.
 */
// `toWebRequest` and `defineEventHandler` are Nitro auto-imports (h3)
export default defineEventHandler(async event => {
  if (event.method !== 'POST') {
    return jsonRpcError(405, 'Method not allowed. Use POST for MCP requests.', {
      allow: 'POST',
    });
  }
  const server = createMcpServer({
    findPage: path => resolvePage(event, path),
    loadSections: () => loadSections(event),
  });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
    maxRequestBodySize: MAX_REQUEST_BODY_BYTES,
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(toWebRequest(event));
  } finally {
    // The response is fully built (JSON mode), so the pair can be released
    await transport.close();
    await server.close();
  }
});
