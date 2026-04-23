import { getActiveChain, getReadContract } from './contract.js';

function withTimeout(promise, timeoutMs, label) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);

        Promise.resolve(promise)
            .then((value) => {
                clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                clearTimeout(timer);
                reject(error);
            });
    });
}

export async function probeWallet({ ethereum = globalThis.window?.ethereum, timeoutMs = 4000 } = {}) {
    if (!ethereum?.request) {
        return { ok: false, available: false, error: 'Wallet provider unavailable' };
    }

    try {
        const [chainId, accounts] = await Promise.all([
            withTimeout(Promise.resolve().then(() => ethereum.request({ method: 'eth_chainId' })), timeoutMs, 'Wallet chain lookup'),
            withTimeout(Promise.resolve().then(() => ethereum.request({ method: 'eth_accounts' })), timeoutMs, 'Wallet account lookup'),
        ]);

        return {
            ok: true,
            available: true,
            chainId,
            accounts,
            connected: Array.isArray(accounts) && accounts.length > 0,
        };
    } catch (error) {
        return { ok: false, available: true, error: error.message || 'Wallet probe failed' };
    }
}

export async function probeRpc({ chain = getActiveChain(), fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
    if (typeof fetchImpl !== 'function') {
        return { ok: false, error: 'Fetch unavailable', rpc: chain.rpc };
    }

    const postJsonRpc = async (method) => {
        const response = await withTimeout(
            fetchImpl(chain.rpc, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', id: method, method, params: [] }),
            }),
            timeoutMs,
            `RPC ${method}`
        );

        if (!response?.ok && response?.status) {
            throw new Error(`RPC ${method} failed with HTTP ${response.status}`);
        }

        return response.json();
    };

    try {
        const [chainIdResponse, blockNumberResponse] = await Promise.all([
            postJsonRpc('eth_chainId'),
            postJsonRpc('eth_blockNumber'),
        ]);

        return {
            ok: true,
            rpc: chain.rpc,
            chainId: chainIdResponse?.result,
            blockNumber: blockNumberResponse?.result,
        };
    } catch (error) {
        return { ok: false, rpc: chain.rpc, error: error.message || 'RPC probe failed' };
    }
}

export async function probeContract({ contract = null, timeoutMs = 5000 } = {}) {
    try {
        const target = contract || getReadContract();
        const [name, symbol, totalArtworks] = await Promise.all([
            withTimeout(Promise.resolve().then(() => target.name()), timeoutMs, 'Contract name lookup'),
            withTimeout(Promise.resolve().then(() => target.symbol()), timeoutMs, 'Contract symbol lookup'),
            withTimeout(Promise.resolve().then(() => target.totalArtworks()), timeoutMs, 'Contract artwork count lookup'),
        ]);

        return {
            ok: true,
            name,
            symbol,
            totalArtworks: totalArtworks?.toString?.() ?? String(totalArtworks),
        };
    } catch (error) {
        return { ok: false, error: error.message || 'Contract probe failed' };
    }
}

export async function runRuntimeSmokeChecks({
    chain = getActiveChain(),
    ethereum = globalThis.window?.ethereum,
    fetchImpl = globalThis.fetch,
    contract = null,
    timeoutMs = 5000,
} = {}) {
    const [wallet, rpc, contractReport] = await Promise.all([
        probeWallet({ ethereum, timeoutMs }),
        probeRpc({ chain, fetchImpl, timeoutMs }),
        probeContract({ contract, timeoutMs }),
    ]);

    return {
        ok: wallet.ok && rpc.ok && contractReport.ok,
        chain: chain.name,
        timestamp: new Date().toISOString(),
        wallet,
        rpc,
        contract: contractReport,
    };
}

export function formatRuntimeSmokeReport(report) {
    if (!report) return 'Smoke report unavailable';

    const parts = [
        `wallet=${report.wallet?.ok ? 'ok' : 'fail'}`,
        `rpc=${report.rpc?.ok ? 'ok' : 'fail'}`,
        `contract=${report.contract?.ok ? 'ok' : 'fail'}`,
    ];

    return `${report.chain || 'unknown'} | ${parts.join(' | ')}`;
}
