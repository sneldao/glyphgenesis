import { connect, disconnect, isConnected, getUserAddress, onWalletEvent, switchChain } from '@/wallet.js';
import { CHAINS, getActiveChainKey, getActiveChain, getCurrencyLabel } from '@/contract.js';
import { showToast } from './toast.js';

export function renderNav() {
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Main navigation');
    nav.innerHTML = `
        <span class="nav-logo">GLYPH<span>GENESIS</span></span>
        <button class="nav-toggle" aria-label="Toggle menu" aria-expanded="false">\u2630</button>
        <ul class="nav-links" role="menubar">
            <li role="none"><a href="#how-it-works" role="menuitem">Protocol</a></li>
            <li role="none"><a href="#agent" role="menuitem">Agent</a></li>
            <li role="none"><a href="#generator" role="menuitem">Generate</a></li>
            <li role="none"><a href="#gallery" role="menuitem">Gallery</a></li>
            <li role="none"><a href="#for-agents" role="menuitem">For Agents</a></li>
        </ul>
        <div class="nav-right">
            <div class="chain-selector" id="chainSelector" role="radiogroup" aria-label="Select chain">
                <button class="chain-btn active" data-chain="monad" role="radio" aria-checked="true">Monad</button>
                <button class="chain-btn" data-chain="bnb" role="radio" aria-checked="false">BNB</button>
            </div>
            <span class="nav-balance" id="navBalance" aria-live="polite"></span>
            <span class="connection-status" id="connectionStatus">
                <span class="connection-dot" id="connectionDot"></span>
                <span id="connectionLabel">Disconnected</span>
            </span>
            <button class="nav-wallet" id="walletBtn" aria-label="Connect wallet">Connect Wallet</button>
        </div>
    `;

    const toggle = nav.querySelector('.nav-toggle');
    const links = nav.querySelector('.nav-links');
    toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
    });

    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            links.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
        });
    });

    const walletBtn = nav.querySelector('#walletBtn');
    walletBtn.addEventListener('click', handleWalletClick);

    // Chain selector buttons
    const chainBtns = nav.querySelectorAll('.chain-btn');
    chainBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const chainKey = btn.dataset.chain;
            if (chainKey === getActiveChainKey()) return;
            try {
                await switchChain(chainKey);
                chainBtns.forEach(b => {
                    b.classList.toggle('active', b.dataset.chain === chainKey);
                    b.setAttribute('aria-checked', b.dataset.chain === chainKey);
                });
            } catch(e) {
                showToast(`Failed to switch to ${CHAINS[chainKey].name}`, 'error');
            }
        });
    });

    onWalletEvent((event, data) => {
        if (event === 'connect') updateConnectedState(data.address, data.balance);
        if (event === 'disconnect') updateDisconnectedState();
        if (event === 'balance') updateBalanceDisplay(data);
        if (event === 'chainSwitch') updateChainUI(data.chain);
        if (event === 'wrongChain') {
            const chain = getActiveChain();
            showToast(`Please switch to ${chain.name}`, 'warning');
            updateDisconnectedState();
        }
    });

    return nav;
}

async function handleWalletClick() {
    const btn = document.getElementById('walletBtn');
    if (isConnected()) {
        disconnect();
        updateDisconnectedState();
        showToast('Wallet disconnected', 'info');
        return;
    }

    try {
        btn.textContent = 'Connecting...';
        btn.disabled = true;
        await connect();
        showToast('Wallet connected!', 'success');
    } catch(error) {
        showToast(error.message || 'Connection failed', 'error');
        updateDisconnectedState();
    } finally {
        btn.disabled = false;
    }
}

function updateConnectedState(address, bal) {
    const btn = document.getElementById('walletBtn');
    if (!btn) return;
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    btn.textContent = short;
    btn.classList.add('connected');
    btn.setAttribute('aria-label', `Disconnect wallet ${short}`);

    const dot = document.getElementById('connectionDot');
    const label = document.getElementById('connectionLabel');
    const chain = getActiveChain();
    if (dot) dot.classList.add('connected');
    if (label) label.textContent = chain.nativeCurrency.symbol;

    updateChainUI(getActiveChainKey());
    updateBalanceDisplay(bal);
}

function updateChainUI(chainKey) {
    const chain = CHAINS[chainKey];
    const chainBtns = document.querySelectorAll('.chain-btn');
    chainBtns.forEach(b => {
        b.classList.toggle('active', b.dataset.chain === chainKey);
        b.setAttribute('aria-checked', b.dataset.chain === chainKey);
    });
    const label = document.getElementById('connectionLabel');
    if (label && isConnected()) label.textContent = chain.nativeCurrency.symbol;
}

function updateDisconnectedState() {
    const btn = document.getElementById('walletBtn');
    if (btn) {
        btn.textContent = 'Connect Wallet';
        btn.classList.remove('connected');
        btn.setAttribute('aria-label', 'Connect wallet');
    }
    const dot = document.getElementById('connectionDot');
    const label = document.getElementById('connectionLabel');
    const balEl = document.getElementById('navBalance');
    if (dot) dot.classList.remove('connected');
    if (label) label.textContent = 'Disconnected';
    if (balEl) balEl.textContent = '';
}

function updateBalanceDisplay(bal) {
    const balEl = document.getElementById('navBalance');
    if (balEl && bal) {
        const label = getCurrencyLabel();
        balEl.textContent = `${parseFloat(bal).toFixed(4)} ${label}`;
    }
}
