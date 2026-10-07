import { generateAscii } from '../src/mcp/generate-ascii.mjs';
import { GENERATE_ASCII_DESCRIPTION, MCP_PATH, startMcpServer } from '../src/mcp/server.mjs';

let passed = 0;
let failed = 0;

function assertTrue(value, message) {
  if (!value) throw new Error(message || 'Expected true');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed += 1;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed += 1;
  }
}

const ACCEPT = 'application/json, text/event-stream';

async function rpc(base, body) {
  const response = await fetch(`${base}${MCP_PATH}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: ACCEPT,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json, text, headers: response.headers };
}

console.log('Running MCP server tests...\n');

await test('generateAscii returns framed art and does not mention a transaction', () => {
  const result = generateAscii({
    prompt: 'make ASCII art for a cosmic spiral',
    pattern: 'spiral',
    theme: 'cosmic',
  });
  assertTrue(result.art.includes('╔'), 'Art should be framed');
  assertEqual(result.pattern, 'spiral', 'Pattern should honor the override');
  assertEqual(result.theme, 'cosmic', 'Theme should honor the override');
  assertTrue(!/0x[a-fA-F0-9]{8,}/.test(result.art), 'Art should not include a transaction hash');
});

await test('generateAscii rejects an empty prompt', () => {
  let threw = false;
  try {
    generateAscii({ prompt: '   ' });
  } catch (error) {
    threw = true;
    assertTrue(error.message.includes('prompt'), 'Error should mention prompt');
  }
  assertTrue(threw, 'Empty prompt should throw');
});

const started = await startMcpServer({ port: 0, host: '127.0.0.1' });
const base = `http://127.0.0.1:${started.port}`;

try {
  await test('GET /health reports the free tool', async () => {
    const response = await fetch(`${base}/health`);
    const body = await response.json();
    assertEqual(response.status, 200, 'Health status');
    assertEqual(body.tool, 'generate_ascii', 'Health tool name');
    assertTrue(body.ok, 'Health should be ok');
  });

  await test('initialize succeeds on POST /mcp', async () => {
    const { status, json } = await rpc(base, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'glyphgenesis-test', version: '1.0.0' },
      },
    });
    assertEqual(status, 200, 'Initialize HTTP status');
    assertEqual(json.result.serverInfo.name, 'glyphgenesis', 'Server name');
    assertTrue(json.result.capabilities.tools, 'Tools capability should be advertised');
  });

  await test('tools/list exposes only generate_ascii as read-only', async () => {
    const { status, json } = await rpc(base, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });
    assertEqual(status, 200, 'tools/list HTTP status');
    const tools = json.result.tools;
    assertEqual(tools.length, 1, 'Only one tool');
    assertEqual(tools[0].name, 'generate_ascii', 'Tool name');
    assertEqual(tools[0].annotations.readOnlyHint, true, 'readOnlyHint');
    assertEqual(tools[0].annotations.destructiveHint, false, 'destructiveHint');
    assertEqual(tools[0].annotations.openWorldHint, false, 'openWorldHint');
    assertTrue(tools[0].description.includes('make ASCII art'), 'Description should include the trigger phrase');
    assertTrue(tools[0].description.includes('Do not use this tool to mint'), 'Description should exclude minting');
    assertTrue(tools[0].description.includes('not ASCII'), 'Description should exclude non-ASCII images');
    assertEqual(tools[0].description, GENERATE_ASCII_DESCRIPTION, 'Listed description should match the constant');
    assertTrue(tools[0].inputSchema.properties.prompt, 'prompt argument');
    assertTrue(tools[0].inputSchema.properties.pattern, 'pattern argument');
    assertTrue(tools[0].inputSchema.properties.theme, 'theme argument');
    const required = tools[0].inputSchema.required || [];
    assertTrue(required.includes('prompt'), 'prompt is required');
    assertTrue(!required.includes('pattern'), 'pattern is optional');
    assertTrue(!required.includes('theme'), 'theme is optional');
  });

  await test('tools/call generate_ascii returns ASCII and no checkout', async () => {
    const { status, json } = await rpc(base, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'generate_ascii',
        arguments: {
          prompt: 'turn this into ASCII: ocean waves',
          pattern: 'waves',
          theme: 'ocean',
        },
      },
    });
    assertEqual(status, 200, 'tools/call HTTP status');
    assertTrue(!json.result.isError, 'Call should succeed');
    const text = json.result.content[0].text;
    assertTrue(text.includes('╔'), 'Response should include framed ASCII');
    assertTrue(text.includes('pattern: waves'), 'Response should name the pattern');
    assertTrue(text.includes('theme: ocean'), 'Response should name the theme');
    assertTrue(text.includes('not an in-plugin checkout'), 'Response should keep commerce off the plugin');
    assertTrue(text.includes('glyph.thisyearnofear.com'), 'Response should point at the product URL');
    assertTrue(!/minted|txHash|transaction/i.test(text), 'Response should not claim a mint');
  });

  await test('tools/call infers pattern from a natural-language prompt', async () => {
    const { json } = await rpc(base, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'generate_ascii',
        arguments: { prompt: 'make ASCII art for a heart' },
      },
    });
    const text = json.result.content[0].text;
    assertTrue(text.includes('pattern: heart'), 'Heart should be inferred');
  });

  await test('unknown pattern is rejected by the tool schema', async () => {
    const { json } = await rpc(base, {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'generate_ascii',
        arguments: { prompt: 'make ASCII art', pattern: 'photorealistic' },
      },
    });
    assertTrue(json.result.isError, 'Invalid pattern should be a tool error');
  });

  await test('GET /mcp is method-not-allowed for the stateless endpoint', async () => {
    const response = await fetch(`${base}${MCP_PATH}`, { method: 'GET' });
    assertEqual(response.status, 405, 'GET /mcp should be 405');
  });
} finally {
  await new Promise((resolve, reject) => {
    started.httpServer.close((error) => (error ? reject(error) : resolve()));
  });
}

console.log(`\n========================================`);
console.log(`MCP tests: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exitCode = 1;
}
