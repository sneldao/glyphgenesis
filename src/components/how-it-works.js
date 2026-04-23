import { getActiveChain, getExplorerAddr, getCurrencyLabel } from '@/contract.js';

export function renderHowItWorks() {
    const chain = getActiveChain();
    const shortContract = chain.contractAddress
        ? chain.contractAddress.slice(0, 8) + '\u2026' + chain.contractAddress.slice(-4)
        : 'TBD';

    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'how-it-works';
    section.setAttribute('aria-labelledby', 'how-it-works-title');
    section.innerHTML = `
        <span class="section-label">// 01 — Protocol</span>
        <h2 class="section-title" id="how-it-works-title">How Users Interact with the <span>Smart Contract</span></h2>
        <div class="steps-grid">
            <div class="step-card">
                <div class="step-num">01</div>
                <span class="step-icon" aria-hidden="true">🎨</span>
                <div class="step-title">Generate</div>
                <div class="step-desc">Create ASCII art locally using JavaScript pattern algorithms — 16 patterns, 9 themes.</div>
            </div>
            <div class="step-card">
                <div class="step-num">02</div>
                <span class="step-icon" aria-hidden="true">🔗</span>
                <div class="step-title">Connect Wallet</div>
                <div class="step-desc">MetaMask connects to ${chain.name} (Chain ID: ${chain.id}) — ultra-fast, ultra-cheap transactions.</div>
            </div>
            <div class="step-card">
                <div class="step-num">03</div>
                <span class="step-icon" aria-hidden="true">⛏️</span>
                <div class="step-title">Mint</div>
                <div class="step-desc">Call <code>createArtwork()</code> on contract ${shortContract} — your art lives on-chain forever.</div>
            </div>
            <div class="step-card">
                <div class="step-num">04</div>
                <span class="step-icon" aria-hidden="true">🖼️</span>
                <div class="step-title">View Gallery</div>
                <div class="step-desc">Read <code>getRecentArtworks()</code> &amp; <code>getArtwork()</code> directly from the blockchain.</div>
            </div>
            <div class="step-card">
                <div class="step-num">05</div>
                <span class="step-icon" aria-hidden="true">❤️</span>
                <div class="step-title">Like</div>
                <div class="step-desc">Call <code>likeArtwork(id)</code> to record on-chain appreciation for any piece.</div>
            </div>
            <div class="step-card">
                <div class="step-num">06</div>
                <span class="step-icon" aria-hidden="true">💰</span>
                <div class="step-title">Trade</div>
                <div class="step-desc">Buy and sell via <code>setForSale()</code> &amp; <code>buyArtwork()</code> — 2.5% royalty to creators.</div>
            </div>
        </div>
    `;
    return section;
}
