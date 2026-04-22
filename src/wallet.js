import { ethers } from 'ethers';
import { CHAIN_ID_HEX, MONAD_NETWORK, CONTRACT_ADDRESS, CONTRACT_ABI } from './contract.js';

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

async function connectInternal(address) {
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CHAIN_ID_HEX }],
        });
    } catch(switchError) {
        if (switchError.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [MONAD_NETWORK],
            });
        } else {
            throw switchError;
        }
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    userAddress = address;

    try {
        const rawBalance = await provider.getBalance(address);
        balance = ethers.formatEther(rawBalance);
    } catch(e) {
        balance = null;
    }

    notify('connect', { address: userAddress, balance });
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

    window.ethereum.on('chainChanged', async (chainId) => {
        if (chainId !== CHAIN_ID_HEX) {
            notify('wrongChain', chainId);
        } else {
            if (userAddress) {
                await connectInternal(userAddress);
            }
            notify('chainChanged', chainId);
        }
    });
}
