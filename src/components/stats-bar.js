import { getReadContract, AGENT_ADDRESS } from '@/contract.js';
import { PATTERN_LIST } from '@/ascii-generator.mjs';

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
            <span class="stat-number cyan" id="todayMints" aria-label="Mints today">...</span>
            <span class="stat-label">Mints Today</span>
        </div>
        <div class="stat-item">
            <span class="stat-number purple" id="totalLikes" aria-label="Total likes on chain">...</span>
            <span class="stat-label">Total Likes</span>
        </div>
        <div class="stat-item">
            <span class="stat-number amber" aria-label="${PATTERN_LIST.length} pattern types available">${PATTERN_LIST.length}</span>
            <span class="stat-label">Pattern Types</span>
        </div>
    `;

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    window.__glyphGenesis = window.__glyphGenesis || {};
    window.__glyphGenesis.statsInterval = interval;

    return bar;
}

export async function fetchTotalArtworks() {
    return fetchStats();
}

async function fetchStats() {
    const totalEl = document.getElementById('totalArtworks');
    const todayEl = document.getElementById('todayMints');
    const likesEl = document.getElementById('totalLikes');
    if (!totalEl) return;

    try {
        const contract = getReadContract();
        const total = Number(await contract.totalArtworks());
        totalEl.textContent = total.toString();

        if (todayEl) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const count = Math.min(total, 30);
            const ids = await contract.getRecentArtworks(count);
            let todayCount = 0;
            for (const id of ids) {
                try {
                    const art = await contract.getArtwork(id);
                    const ts = Number(art[5]);
                    if (ts * 1000 >= todayStart.getTime()) todayCount++;
                } catch { /* skip */ }
            }
            todayEl.textContent = todayCount.toString();
        }

        if (likesEl) {
            let totalLikes = 0;
            const count = Math.min(total, 20);
            if (count > 0) {
                const ids = await contract.getRecentArtworks(count);
                for (const id of ids) {
                    try {
                        const art = await contract.getArtwork(id);
                        totalLikes += Number(art[8]);
                    } catch { /* skip */ }
                }
            }
            likesEl.textContent = totalLikes.toString();
        }

        return total;
    } catch (e) {
        if (totalEl) totalEl.textContent = '?';
        if (todayEl) todayEl.textContent = '?';
        if (likesEl) likesEl.textContent = '?';
        return null;
    }
}
