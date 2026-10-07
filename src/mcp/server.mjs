/**
 * Stateless Streamable HTTP MCP server.
 * Public path: POST /mcp
 * Tool: generate_ascii (read-only, no mint, no payment)
 *
 * The process speaks HTTP. Put TLS in front (Caddy, nginx, or a host)
 * and give ChatGPT the https URL ending in /mcp.
 */
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { formatAsciiResult, generateAscii, PATTERN_IDS, THEME_IDS } from './generate-ascii.mjs';

export const MCP_PATH = '/mcp';
export const SERVER_NAME = 'glyphgenesis';
export const SERVER_VERSION = '2.0.0';

export const GENERATE_ASCII_DESCRIPTION = [
  'Generate free ASCII art from a short prompt.',
  'Use this when the user says "make ASCII art", "make ASCII art for X", or "turn this into ASCII", or clearly wants a text-art picture of a subject, pattern, or theme.',
  'Do not use this tool to mint, buy, sell, transfer, like, or list artwork.',
  'Do not use it to take payment, start x402, or open checkout.',
  'Do not use it for photographs, PNG, SVG, or any image that is not ASCII text.',
  'Generation does not change chain state and does not charge the user.',
].join(' ');

const patternEnum = z.enum(PATTERN_IDS);
const themeEnum = z.enum(THEME_IDS);

export function createGlyphMcpServer() {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    'generate_ascii',
    {
      title: 'Generate ASCII art',
      description: GENERATE_ASCII_DESCRIPTION,
      inputSchema: {
        prompt: z.string().min(1).max(500).describe(
          'What to turn into ASCII art, in the user\'s words. Examples: "make ASCII art for a cosmic spiral", "turn this into ASCII: a neon city".'
        ),
        pattern: patternEnum.optional().describe(
          `Optional pattern. Leave unset to infer from the prompt. One of: ${PATTERN_IDS.join(', ')}.`
        ),
        theme: themeEnum.optional().describe(
          `Optional theme. Leave unset to infer from the prompt. One of: ${THEME_IDS.join(', ')}.`
        ),
      },
      annotations: {
        title: 'Generate ASCII art',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ prompt, pattern, theme }) => {
      try {
        const result = generateAscii({ prompt, pattern, theme });
        return {
          content: [{ type: 'text', text: formatAsciiResult(result) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [{ type: 'text', text: error instanceof Error ? error.message : 'ASCII generation failed' }],
        };
      }
    }
  );

  return server;
}

function sendJson(res, status, body, extraHeaders = {}) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Mcp-Session-Id, MCP-Protocol-Version',
    ...extraHeaders,
  });
  res.end(payload);
}

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Last-Event-ID');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, MCP-Protocol-Version');
}

export function createMcpRequestListener() {
  return async function onRequest(req, res) {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    applyCors(res);

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      sendJson(res, 200, { ok: true, name: SERVER_NAME, tool: 'generate_ascii' });
      return;
    }

    if (url.pathname !== MCP_PATH) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, {
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Method not allowed. This stateless endpoint accepts POST only.' },
        id: null,
      }, { Allow: 'POST, OPTIONS' });
      return;
    }

    const server = createGlyphMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      if (!res.headersSent) {
        sendJson(res, 500, {
          jsonrpc: '2.0',
          error: { code: -32603, message: error instanceof Error ? error.message : 'Internal error' },
          id: null,
        });
      }
    }
  };
}

export function startMcpServer({ port = 8787, host = '0.0.0.0' } = {}) {
  const httpServer = createServer(createMcpRequestListener());
  return new Promise((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, () => {
      const address = httpServer.address();
      const boundPort = typeof address === 'object' && address ? address.port : port;
      resolve({ httpServer, port: boundPort, host });
    });
  });
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  const port = Number(process.env.PORT || 8787);
  const host = process.env.HOST || '0.0.0.0';
  startMcpServer({ port, host }).then(({ port: boundPort }) => {
    console.log(`GlyphGenesis MCP listening on http://${host}:${boundPort}${MCP_PATH}`);
    console.log('Tool: generate_ascii (read-only, free). Put TLS in front and use the https URL in ChatGPT.');
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
