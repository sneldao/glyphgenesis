import { ethers } from 'ethers';
import { CHAINS, getActiveChain, getActiveChainKey, setActiveChain, getActiveABI, getContractAddress, BNB_NETWORK } from './contract.js';

// Re-export legacy constants for backwards compat
export { CHAIN_ID_HEX, MONAD_NETWORK } from './contract.js';

let provider = null;
let signer = null;
let contract = null;
let userAddress = null;
let balance = null;

const listeners = new Set();

function notify(event, data) {
    listeners.forEach(fn => { try { fn(event, data); } catch(e) { console.error('Wallet listener error:', e); } });
}

export function onWalletEvent(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function getUserAddress() { return userAddress; }
export function getContract() { return contract; }
export function getBalance() { return balance; }
export function isConnected() { return !!userAddress; }

export function hasProvider() {
    return typeof window !== 'undefined' && !!window.ethereum;
}

export async function tryReconnect() {
    if (!hasProvider()) return false;
    try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
            await connectInternal(accounts[0]);
            return true;
        }
    } catch(e) {
        console.warn('Reconnect failed:', e);
    }
    return false;
}

export async function connect() {
    if (!hasProvider()) throw new Error('Please install MetaMask to continue');
    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        await connectInternal(accounts[0]);
        return userAddress;
    } catch(error) {
        if (error.code === 4001) throw new Error('Connection rejected by user');
        throw error;
    }
}

export function disconnect() {
    provider = null;
    signer = null;
    contract = null;
    userAddress = null;
    balance = null;
    notify('disconnect', null);
}

/** Switch to a different chain and reconnect if wallet is connected */
export async function switchChain(chainKey) {
    if (!CHAINS[chainKey]) throw new Error(`Unknown chain: ${chainKey}`);

    // Switch wallet FIRST — only update state on success
    const chain = CHAINS[chainKey];
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chain.idHex }],
        });
    } catch(switchError) {
        if (switchError.code === 4902) {
            const networkParams = chainKey === 'bnb' ? BNB_NETWORK : {
                chainId: chain.idHex,
                chainName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: [chain.rpc],
                blockExplorerUrls: chain.blockExplorerUrls,
            };
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [networkParams],
            });
        } else {
            throw switchError;
        }
    }

    // Wallet switched — now update JS state
    setActiveChain(chainKey);
    if (isConnected()) {
        await connectInternal(userAddress);
    }
    notify('chainSwitch', { chain: chainKey });
}

async function connectInternal(address) {
    const chain = getActiveChain();

    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chain.idHex }],
        });
    } catch(switchError) {
        if (switchError.code === 4001) throw switchError; // user rejected
        if (switchError.code !== 4902) throw switchError; // unexpected error
        // Chain not added — add it
        const networkParams = chain === CHAINS.bnb ? BNB_NETWORK : {
            chainId: chain.idHex,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: [chain.rpc],
            blockExplorerUrls: chain.blockExplorerUrls,
        };
        await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkParams],
        });
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    // Build contract with active chain's address + ABI
    const contractAddr = getContractAddress();
    if (contractAddr) {
        contract = new ethers.Contract(contractAddr, getActiveABI(), signer);
    } else {
        contract = null;
        console.warn(`No contract deployed on ${chain.name}`);
    }

    userAddress = address;

    try {
        const rawBalance = await provider.getBalance(address);
        balance = ethers.formatEther(rawBalance);
    } catch(e) {
        balance = null;
    }

    notify('connect', { address: userAddress, balance, chain: getActiveChainKey() });
}

export async function refreshBalance() {
    if (!provider || !userAddress) return;
    try {
        const rawBalance = await provider.getBalance(userAddress);
        balance = ethers.formatEther(rawBalance);
        notify('balance', balance);
    } catch(e) {
        console.warn('Balance refresh failed:', e);
    }
}

export function setupListeners() {
    if (!hasProvider()) return;

    window.ethereum.on('accountsChanged', async (accounts) => {
        if (accounts.length === 0) {
            disconnect();
        } else {
            await connectInternal(accounts[0]);
        }
    });

    window.ethereum.on('chainChanged', async (chainIdHex) => {
        // Determine which chain the wallet actually switched to
        let newChainKey = null;
        for (const [key, cfg] of Object.entries(CHAINS)) {
            if (cfg.idHex === chainIdHex) {
                newChainKey = key;
                break;
            }
        }

        if (!newChainKey) {
            // Unknown chain — notify as wrongChain
            notify('wrongChain', chainIdHex);
            return;
        }

        const currentChainKey = getActiveChainKey();
        if (newChainKey !== currentChainKey) {
            // Wallet switched to a different chain — update state.
            // Note: if the switch was triggered by switchChain() UI button,
            // chainSwitch was already fired there. Here we only sync state
            // for direct MetaMask chain switches (bypassing our UI).
            setActiveChain(newChainKey);
            if (userAddress) {
                await connectInternal(userAddress);
            }
            notify('chainSwitch', { chain: newChainKey });
        } else {
            // Same chain — just refresh provider state (e.g. after MetaMask lock/unlock)
            if (userAddress) {
                await connectInternal(userAddress);
            }
        }

        notify('chainChanged', chainIdHex);
    });
}
