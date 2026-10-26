import type { SearchSection } from '#shared/utils/search';
// eslint-disable-next-line import-x/no-unresolved -- subpath export of the SDK
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  getPageHandler,
  searchDocsHandler,
  validateWellHandler,
  type GetPageDeps,
  type SearchDocsDeps,
} from './handlers';

export interface McpDeps extends SearchDocsDeps, GetPageDeps {}

const json = (value: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(value, null, 2) }],
  structuredContent: value as Record<string, unknown>,
});

/** A fresh server per request: the endpoint is stateless. */
export function createMcpServer(deps: McpDeps): McpServer {
  const server = new McpServer(
    { name: 'welldot-docs', version: '1.0.0' },
    {
      instructions:
        'Use search_docs to find documentation, get_page to read a page, and validate_well on every .well file you generate or edit.',
    },
  );
  const readOnly = { readOnlyHint: true, openWorldHint: false };

  server.registerTool(
    'search_docs',
    {
      description:
        'Full-text search over the Welldot documentation: the .well format specification (including every field of the format reference), the @welldot/core, @welldot/utils and @welldot/render API docs, guides and changelogs. Use it first when you need to know what a .well field means, which values it allows, or which function does something. Returns the best matching sections, each with a path, URL and snippet; pass the path (without #anchor) to get_page to read the whole page.',
      inputSchema: {
        query: z
          .string()
          .describe(
            'Words to search for, for example "drilling_method" or "well screen slot".',
          ),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe('Maximum number of results (default 10).'),
      },
      annotations: readOnly,
    },
    async input => json(await searchDocsHandler(input, deps)),
  );

  server.registerTool(
    'get_page',
    {
      description:
        'Read one documentation page as Markdown. Use it after search_docs to read the full page behind a result, or when you already know the path, for example /format/spec/v2/overview. A trailing slash, a .md suffix and an #anchor are ignored.',
      inputSchema: {
        path: z
          .string()
          .describe(
            'Page path, for example "/format/spec/v2/overview" or a "path" from search_docs.',
          ),
      },
      annotations: readOnly,
    },
    async ({ path }): Promise<CallToolResult> => {
      const result = await getPageHandler(
        { path: path.split('#')[0] ?? path },
        deps,
      );
      if (!result.ok) {
        return {
          isError: true,
          content: [{ type: 'text', text: result.error }],
        };
      }
      return {
        content: [{ type: 'text', text: result.page.markdown }],
        structuredContent: result.page,
      };
    },
  );

  server.registerTool(
    'validate_well',
    {
      description:
        'Validate the text of a .well file against the Welldot schema (@welldot/core parseWell, the same check the welldot.org app runs). Run validate_well on every .well file you generate or edit, including output of the welldot-converter skill, and fix every reported error before handing the file to a user. Returns { valid, version, warnings } or { valid: false, errors: [{ path, code, message }] }, plus the JSON Schema URL. Warnings are advisory and never make a file invalid. Content over 5 MB is rejected with code too_large.',
      inputSchema: {
        content: z.string().describe('The full text of the .well file (JSON).'),
        warnings: z
          .boolean()
          .optional()
          .describe(
            'Also return advisory warnings about permits, meters, water samples and pump installations (default true).',
          ),
      },
      annotations: readOnly,
    },
    async input => json(validateWellHandler(input)),
  );

  return server;
}

export type { SearchSection };
