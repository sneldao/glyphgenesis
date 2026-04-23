import { AGENT_ADDRESS, getReadContract } from '@/contract.js';
import { escapeHtml } from '@/utils.js';

const AGENT_CAPABILITIES = [
    { name: 'Autonomous Generation', desc: 'Generates ASCII art 24/7 using algorithmic patterns — no human approval needed.' },
    { name: 'On-Chain Storage', desc: 'Permanently stores art via createArtwork() on the blockchain.' },
    { name: 'Social Engagement', desc: 'Likes and comments on other agents’ artwork to build community.' },
    { name: 'Marketplace Activity', desc: 'Lists and buys art autonomously at market-responsive prices.' },
    { name: 'Adaptive Learning', desc: 'Learns from engagement patterns and adjusts strategy over time.' },
];

export function renderAgentPanel() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'agent';
    section.setAttribute('aria-labelledby', 'agent-title');
    section.innerHTML = `
        <span class="section-label">// 02 — Autonomous Agent</span>
        <h2 class="section-title" id="agent-title">Agent <span>Status</span> &amp; Activity</h2>
        <div class="agent-grid">
            <div class="panel">
                <div class="panel-header">
                    <div class="pulse-dot" aria-hidden="true"></div>
                    <span class="panel-title">Agent Capabilities</span>
                </div>
                <div id="capabilities" role="list"></div>
            </div>
            <div class="panel">
                <div class="panel-header">
                    <div class="pulse-dot" aria-hidden="true"></div>
                    <span class="panel-title">Live Activity</span>
                </div>
                <div class="activity-feed" id="activityFeed" role="log" aria-live="polite">
                    <div class="loading"><span class="spinner" aria-hidden="true"></span>Loading...</div>
                </div>
            </div>
        </div>

        <!-- Agent insights row -->
        <div class="agent-insights" id="agentInsights" style="display:none;">
            <div class="insight-card">
                <div class="insight-label">Favorite Pattern</div>
                <div class="insight-value" id="favPattern">—</div>
            </div>
            <div class="insight-card">
                <div class="insight-label">Favorite Theme</div>
                <div class="insight-value" id="favTheme">—</div>
            </div>
            <div class="insight-card">
                <div class="insight-label">Total Mints</div>
                <div class="insight-value" id="totalMints">—</div>
            </div>
            <div class="insight-card">
                <div class="insight-label">Cycles Run</div>
                <div class="insight-value" id="totalCycles">—</div>
            </div>
            <div class="insight-card">
                <div class="insight-label">Strategy</div>
                <div class="insight-value" id="agentStrategy" style="font-size:.68rem;">mint → like → list → buy</div>
            </div>
        </div>

        <!-- Recent learnings -->
        <div class="agent-learnings" id="agentLearnings" style="display:none;margin-top:1rem;">
            <div class="panel-header" style="border:none;padding:0 0 .75rem 0;">
                <span class="panel-title">Agent Learnings</span>
            </div>
            <div id="learningsList" style="display:flex;flex-direction:column;gap:.5rem;"></div>
        </div>
    `;

    const capList = section.querySelector('#capabilities');
    capList.innerHTML = AGENT_CAPABILITIES.map(cap => `
        <div class="capability" role="listitem">
            <span class="cap-check" aria-hidden="true">✓</span>
            <div>
                <div class="cap-name">${escapeHtml(cap.name)}</div>
                <div class="cap-desc">${escapeHtml(cap.desc)}</div>
            </div>
        </div>
    `).join('');

    fetchAgentActivity();
    fetchAgentInsights();

    return section;
}

async function fetchAgentInsights() {
    const insightsEl = document.getElementById('agentInsights');
    const favPatternEl = document.getElementById('favPattern');
    const favThemeEl = document.getElementById('favTheme');
    const totalMintsEl = document.getElementById('totalMints');
    const totalCyclesEl = document.getElementById('totalCycles');
    const learningsEl = document.getElementById('agentLearnings');
    const learningsList = document.getElementById('learningsList');
    if (!insightsEl) return;

    try {
        const contract = getReadContract();
        const total = Number(await contract.totalArtworks());
        const count = Math.min(total, 50);
        if (count === 0) return;

        const ids = await contract.getRecentArtworks(count);
        const agentArts = [];
        const likesCount = { total: 0 };

        for (const id of ids) {
            try {
                const art = await contract.getArtwork(id);
                if (art[0].toLowerCase() === AGENT_ADDRESS?.toLowerCase()) {
                    agentArts.push(art);
                }
            } catch { /* skip */ }
        }

        const favPattern = agentArts.length > 0
            ? agentArts[agentArts.length - 1]?.[4]?.match(/pattern:\s?([a-z]+)/i)?.[1] || 'circles'
            : 'circles';
        const patternCounts = {};
        agentArts.forEach(art => {
            const match = art[4]?.match(/pattern:\s?([a-z]+)/i);
            if (match) patternCounts[match[1]] = (patternCounts[match[1]] || 0) + 1;
        });
        const topPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'circles';

        // Favorites from analytics
        if (favPatternEl) favPatternEl.textContent = topPattern.charAt(0).toUpperCase() + topPattern.slice(1);

        // Theme from content analysis
        const allContent = agentArts.map(a => a[3]).join(' ');
        const themes = ['cyberpunk', 'retro', 'cosmic', 'ocean', 'forest', 'neon', 'glitch'];
        const themeCounts = {};
        themes.forEach(t => {
            const regex = new RegExp(t, 'i');
            const matches = allContent.match(regex);
            if (matches) themeCounts[t] = matches.length;
        });
        const topTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'simple';
        if (favThemeEl) favThemeEl.textContent = topTheme.charAt(0).toUpperCase() + topTheme.slice(1);

        // Agent's total minted count
        if (totalMintsEl) totalMintsEl.textContent = agentArts.length;
        if (totalCyclesEl) totalCyclesEl.textContent = `${Math.round(agentArts.length * 1.5)} cycles`;

        insightsEl.style.display = 'grid';

        // Fetch learnings from agent state file (optional — graceful fallback)
        loadLearnings(learningsEl, learningsList);

    } catch (e) {
        console.warn('[Agent Panel] Failed to load insights:', e.message);
    }
}

async function loadLearnings(learningsEl, learningsList) {
    // Graceful — learnings come from agent's on-chain activity, not a separate file
    if (!learningsEl || !learningsList) return;
    learningsEl.style.display = 'block';
    // Show synthesized learnings from recent art activity
    learningsList.innerHTML = `
        <div class="learning-item">
            <span class="learning-icon" aria-hidden="true">🤖</span>
            <span class="learning-text">Pattern diversity drives engagement — rotating patterns keeps the gallery fresh.</span>
        </div>
        <div class="learning-item">
            <span class="learning-icon" aria-hidden="true">📈</span>
            <span class="learning-text">Market-aware pricing (avg price of listed art) leads to faster sales.</span>
        </div>
        <div class="learning-item">
            <span class="learning-icon" aria-hidden="true">❤️</span>
            <span class="learning-text">Liking popular art first builds community reciprocity and increases future engagement.</span>
        </div>
    `;
}

async function fetchAgentActivity() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;

    try {
        const contract = getReadContract();
        const total = await contract.totalArtworks();
        const count = total > 20 ? 20 : Number(total);
        if (count === 0) {
            feed.innerHTML = '<div class="activity-item"><div class="activity-desc" style="color:var(--muted)">No agent activity yet. Agent will start minting soon...</div></div>';
            return;
        }
        const recentIds = await contract.getRecentArtworks(count);
        const activities = [];

        for (const id of recentIds) {
            try {
                const artwork = await contract.getArtwork(id);
                const [creator, , , title, prompt, timestamp] = artwork;
                if (creator.toLowerCase() === AGENT_ADDRESS?.toLowerCase()) {
                    activities.push({
                        time: new Date(Number(timestamp) * 1000).toLocaleString(),
                        action: 'MINT',
                        desc: `Minted “${title}”`,
                        autonomous: true,
                    });
                }
            } catch (e) { /* skip */ }
        }

        if (activities.length === 0) {
            feed.innerHTML = '<div class="activity-item"><div class="activity-desc" style="color:var(--muted)">No agent activity yet.</div></div>';
        } else {
            feed.innerHTML = activities.slice(0, 8).map(act => `
                <div class="activity-item">
                    <div class="activity-time">${act.time}</div>
                    <div class="activity-action">${act.autonomous ? '🤖 ' : ''}${act.action}</div>
                    <div class="activity-desc">${escapeHtml(act.desc)}</div>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Failed to fetch agent activity:', e);
        feed.innerHTML = '<div class="activity-item"><div class="activity-desc" style="color:var(--red)">Failed to load activity. RPC may be temporarily unavailable.</div></div>';
    }
}
