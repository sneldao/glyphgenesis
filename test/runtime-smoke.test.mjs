import { probeWallet, probeRpc, probeContract, runRuntimeSmokeChecks, formatRuntimeSmokeReport } from '../src/health.js';

let passed = 0;
let failed = 0;

function assertTrue(value, message) {
    if (!value) throw new Error(message || 'Expected true');
}

function assertEqual(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message || 'Assertion failed'}: expected ${expected}, got ${actual}`);
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

console.log('Running runtime smoke tests...\n');

const fakeChain = {
    name: 'Smoke Chain',
    rpc: 'https://example.invalid',
    contractAddress: '0x0000000000000000000000000000000000000001',
};

const fakeWallet = {
    request: async ({ method }) => {
        if (method === 'eth_chainId') return '0x279f';
        if (method === 'eth_accounts') return ['wallet-account-1'];
        throw new Error(`Unexpected wallet method: ${method}`);
    },
};

const fakeFetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    if (body.method === 'eth_chainId') {
        return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x279f' }) };
    }
    if (body.method === 'eth_blockNumber') {
        return { ok: true, json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1234' }) };
    }
    throw new Error(`Unexpected RPC method: ${body.method}`);
};

const fakeContract = {
    name: async () => 'GlyphGenesis',
    symbol: async () => 'GLYPH',
    totalArtworks: async () => 42,
};

await test('probeWallet reports a healthy provider', async () => {
    const report = await probeWallet({ ethereum: fakeWallet, timeoutMs: 100 });
    assertTrue(report.ok, 'Wallet should be healthy');
    assertTrue(report.connected, 'Wallet should be connected');
    assertEqual(report.chainId, '0x279f', 'Wallet chain id should match');
});

await test('probeRpc reports a healthy RPC', async () => {
    const report = await probeRpc({ chain: fakeChain, fetchImpl: fakeFetch, timeoutMs: 100 });
    assertTrue(report.ok, 'RPC should be healthy');
    assertEqual(report.chainId, '0x279f', 'RPC chain id should match');
    assertEqual(report.blockNumber, '0x1234', 'RPC block number should match');
});

await test('probeContract reports a healthy contract', async () => {
    const report = await probeContract({ contract: fakeContract, timeoutMs: 100 });
    assertTrue(report.ok, 'Contract should be healthy');
    assertEqual(report.name, 'GlyphGenesis', 'Contract name should match');
    assertEqual(report.symbol, 'GLYPH', 'Contract symbol should match');
    assertEqual(report.totalArtworks, '42', 'Contract count should stringify');
});

await test('runRuntimeSmokeChecks summarizes all checks', async () => {
    const report = await runRuntimeSmokeChecks({
        chain: fakeChain,
        ethereum: fakeWallet,
        fetchImpl: fakeFetch,
        contract: fakeContract,
        timeoutMs: 100,
    });

    assertTrue(report.ok, 'Smoke report should pass');
    assertContains(formatRuntimeSmokeReport(report), 'wallet=ok', 'Summary should mention wallet health');
    assertContains(formatRuntimeSmokeReport(report), 'rpc=ok', 'Summary should mention RPC health');
    assertContains(formatRuntimeSmokeReport(report), 'contract=ok', 'Summary should mention contract health');
});

await test('probeWallet handles missing provider', async () => {
    const report = await probeWallet({ ethereum: null, timeoutMs: 100 });
    assertTrue(!report.ok, 'Missing wallet should fail');
    assertTrue(!report.available, 'Missing wallet should be marked unavailable');
});

function assertContains(haystack, needle, message) {
    if (!haystack.includes(needle)) {
        throw new Error(message || `Expected to find ${needle}`);
    }
}

console.log(`\n========================================`);
console.log(`Smoke tests: ${passed} passed, ${failed} failed`);
console.log(`========================================`);

if (failed > 0) {
    process.exitCode = 1;
}
