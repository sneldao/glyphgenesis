import { getReadContract } from '@/contract.js';

export function renderStatsBar() {
    const bar = document.createElement('div');
    bar.className = 'stats-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Platform statistics');
    bar.innerHTML = `
        <div class="stat-item">
            <span class="stat-number green" id="totalArtworks" aria-label="Total artworks on-chain">...</span>
            <span class="stat-label">Artworks On-Chain</span>
        </div>
        <div class="stat-item">
            <span class="stat-number cyan" aria-label="8 pattern types available">8</span>
            <span class="stat-label">Pattern Types</span>
        </div>
        <div class="stat-item">
            <span class="stat-number purple" aria-label="Approximate transaction cost">~$0.001</span>
            <span class="stat-label">Tx Cost</span>
        </div>
        <div class="stat-item">
            <span class="stat-number amber" aria-label="Agent runs 24/7">24/7</span>
            <span class="stat-label">Agent Uptime</span>
        </div>
    `;

    fetchTotalArtworks();
    return bar;
}

export async function fetchTotalArtworks() {
    const el = document.getElementById('totalArtworks');
    if (!el) return;
    try {
        const contract = getReadContract();
        const total = await contract.totalArtworks();
        el.textContent = total.toString();
    } catch(e) {
        el.textContent = '?';
    }
}
