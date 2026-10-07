# ChatGPT MCP — `generate_ascii`

Free, read-only ASCII generation for the ChatGPT plugin slot. One tool, Streamable HTTP, no wallet and no checkout.

Trigger phrases: **"make ASCII art"**, **"make ASCII art for X"**, **"turn this into ASCII"**.

Minting, the marketplace, and x402 stay on the product site ([glyph.thisyearnofear.com](http://glyph.thisyearnofear.com)) or on an account the user already has. OpenAI plugin commerce allows physical goods only, so this server does not take payment.

Shipping rules: [CHATGPT_PLUGIN_PLAYBOOK.md](./CHATGPT_PLUGIN_PLAYBOOK.md).

## Run locally

```bash
npm install
npm run mcp
```

The process listens on `0.0.0.0:8787` (override with `HOST` and `PORT`).

| URL | Purpose |
| --- | --- |
| `http://127.0.0.1:8787/mcp` | Streamable HTTP MCP endpoint (`POST`) |
| `http://127.0.0.1:8787/health` | Process check |

`generate_ascii` arguments:

| Argument | Required | Notes |
| --- | --- | --- |
| `prompt` | yes | User words, up to 500 characters |
| `pattern` | no | One of the 16 generator patterns. Omitted prompts are parsed for a pattern. |
| `theme` | no | One of the 9 themes. Omitted prompts are parsed for a theme. |

The tool is annotated `readOnlyHint: true`. It does not mint, sign, or charge. Same prompt and options produce the same art.

Check it without ChatGPT:

```bash
curl -s http://127.0.0.1:8787/health

curl -s http://127.0.0.1:8787/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"generate_ascii","arguments":{"prompt":"make ASCII art for a cosmic spiral"}}}'
```

Tests: `node test/mcp-server.test.mjs`

## Connect in ChatGPT Plugins

ChatGPT's cloud cannot reach `127.0.0.1`. Put TLS in front of this process (Caddy, nginx, or your host) and use the public HTTPS URL. The app itself speaks plain HTTP.

1. Deploy so `https://<your-host>/mcp` answers `POST` (Streamable HTTP, JSON responses).
2. Open [chatgpt.com/plugins](https://chatgpt.com/plugins) and add a custom MCP server.
3. Set the server URL to `https://<your-host>/mcp`.
4. Leave auth empty. There is no API key and no OAuth. The only tool is `generate_ascii`.
5. Listing description, in user words: make ASCII art, or turn a subject into ASCII. Do not mention prices, trials, or checkout.
6. Add the starter prompts below as the listing's example prompts.

## Starter prompts

- make ASCII art
- make ASCII art for a cosmic spiral
- turn this into ASCII: a neon city at night
- make a retro wave pattern in ASCII

## Intent eval set

Use these to see whether ChatGPT recommends `generate_ascii`. Record pass/fail for selection, then double down on the queries that get recommended.

| Kind | Prompt | Expect `generate_ascii` |
| --- | --- | --- |
| Direct | make ASCII art | yes |
| Direct | make ASCII art for a heart | yes |
| Direct | turn this into ASCII | yes |
| Indirect | draw a spiral using only text characters | yes |
| Indirect | I want a cyberpunk city made of letters and symbols | yes |
| Indirect | show an ocean wave picture I can paste into chat | yes |
| Negative | mint this artwork on Monad | no |
| Negative | buy the cheapest listing in the marketplace | no |
| Negative | send an x402 payment of 0.001 MON | no |
| Negative | generate a PNG of a cat | no |

Negative prompts belong on the product site or another tool. This server has no mint, buy, or payment tool to call.
