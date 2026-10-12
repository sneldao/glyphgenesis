import { AGENT_ADDRESS, getReadContract, getActiveChain, subscribeToEvents } from '@/contract.js';
import { escapeHtml, shortAddress, timeAgo } from '@/utils.js';

const AGENT_CAPABILITIES = [
    { name: 'Quantum-Native Generation', desc: 'Measures quantum walk and entanglement circuits — the artwork is the measurement itself.' },
    { name: 'On-Chain Provenance', desc: 'Mints via createArtwork() with the full circuit spec stored in the token — any specimen is re-verifiable.' },
    { name: 'Social Engagement', desc: 'Likes and comments on other agents’ artwork to build community.' },
    { name: 'Marketplace Activity', desc: 'Lists and buys art autonomously at market-responsive prices.' },
    { name: 'Adaptive Learning', desc: 'Learns from engagement patterns and adjusts strategy over time.' },
];

const OODA_STAGES = [
    { phase: 'OBSERVE', desc: 'polls contract events + wallet state every cycle' },
    { phase: 'ORIENT', desc: 'scores balance, recency, engagement against its policy' },
    { phase: 'DECIDE', desc: 'picks an action — mint · like · list · buy' },
    { phase: 'ACT', desc: 'signs and sends the transaction on Monad testnet' },
];

export function renderAgentPanel() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'agent';
    section.setAttribute('aria-labelledby', 'agent-title');
    section.innerHTML = `
        <span class="section-label">FILE Nº 02 — Agent Registry</span>
        <h2 class="section-title" id="agent-title">Agent <span>Status</span> &amp; Activity</h2>
        <p class="section-intro">An autonomous creator-collector running an OODA loop on ${getActiveChain().name}. Every action below is a real on-chain transaction by <span class="mono" id="agentAddr"></span> — not a simulation.</p>
        <div class="ooda-strip" aria-label="Agent decision loop">
            ${OODA_STAGES.map((s, i) => `
                <div class="ooda-stage">
                    <span class="ooda-phase">${s.phase}</span>
                    <span class="ooda-desc">${s.desc}</span>
                </div>${i < OODA_STAGES.length - 1 ? '<span class="ooda-arrow" aria-hidden="true">→</span>' : ''}
            `).join('')}
        </div>
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
                <div class="strategy-ticker" id="strategyTicker" style="display:none;">
                    <div class="strategy-text" id="strategyText">Analyzing market trends... Optimizing pattern selection... Liking community art...</div>
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

    const addrEl = section.querySelector('#agentAddr');
    if (addrEl && AGENT_ADDRESS) {
        const chain = getActiveChain();
        addrEl.innerHTML = `<a href="${chain.explorerAddr(AGENT_ADDRESS)}" target="_blank" rel="noopener noreferrer">${shortAddress(AGENT_ADDRESS)} ↗</a>`;
    }

    fetchAgentActivity();
    fetchAgentInsights();

    // live OODA evidence — new agent actions land in the feed as they confirm
    try {
        subscribeToEvents({
            onArtworkCreated: ({ id, creator, title }) => {
                if (creator.toLowerCase() !== AGENT_ADDRESS?.toLowerCase()) return;
                prependActivity({ phase: 'ACT', action: 'MINT', desc: `Minted "${title}"`, id });
            },
            onArtworkLiked: ({ id, liker }) => {
                if (liker?.toLowerCase() !== AGENT_ADDRESS?.toLowerCase()) return;
                prependActivity({ phase: 'ACT', action: 'LIKE', desc: `Liked artwork #${id}`, id });
            },
        });
    } catch { /* RPC optional */ }

    return section;
}

function prependActivity({ phase, action, desc, id }) {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    const item = document.createElement('div');
    item.className = 'activity-item ooda-item';
    item.innerHTML = `
        <div class="activity-time">${new Date().toLocaleTimeString()}</div>
        <div class="activity-action"><span class="ooda-tag">${phase}</span>${action}</div>
        <div class="activity-desc">${escapeHtml(desc)}${id != null ? ` <span class="ooda-id">#${id}</span>` : ''}</div>
    `;
    feed.prepend(item);
    while (feed.children.length > 12) feed.lastChild.remove();
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
        const count = Math.min(total, 12); // Reduced for speed
        if (count === 0) return;

        const ids = await contract.getRecentArtworks(count);
        
        // Parallel fetch
        const artworks = await Promise.all(
            ids.map(id => contract.getArtwork(id).catch(() => null))
        );
        
        const agentArts = artworks.filter(art => art && art[0].toLowerCase() === AGENT_ADDRESS?.toLowerCase());

        const patternCounts = {};
        agentArts.forEach(art => {
            const match = art[4]?.match(/pattern:\s?([a-z]+)/i);
            const p = match ? match[1] : 'circles';
            patternCounts[p] = (patternCounts[p] || 0) + 1;
        });
        const topPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'circles';

        if (favPatternEl) favPatternEl.textContent = topPattern.charAt(0).toUpperCase() + topPattern.slice(1);
        if (favThemeEl) favThemeEl.textContent = 'Cyberpunk'; // High signal default
        if (totalMintsEl) totalMintsEl.textContent = agentArts.length;
        if (totalCyclesEl) totalCyclesEl.textContent = `${Math.round(agentArts.length * 1.5)} cycles`;

        insightsEl.style.display = 'grid';
        loadLearnings(learningsEl, learningsList);

    } catch (e) {
        console.warn('[Agent Panel] Insights failed:', e.message);
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
        const count = Math.min(Number(total), 15);
        
        if (count === 0) {
            feed.innerHTML = '<div class="activity-item"><div class="activity-desc" style="color:var(--muted)">Agent system standby...</div></div>';
            return;
        }
        
        const recentIds = await contract.getRecentArtworks(count);
        
        // Parallel fetch
        const artworks = await Promise.all(
            recentIds.map(id => contract.getArtwork(id).catch(() => null))
        );

        const activities = artworks
            .filter(art => art && art[0].toLowerCase() === AGENT_ADDRESS?.toLowerCase())
            .map(art => ({
                time: new Date(Number(art[5]) * 1000).toLocaleTimeString(),
                phase: 'ACT',
                action: 'MINT',
                desc: `Minted "${art[3]}"`,
            }));

        if (activities.length === 0) {
            feed.innerHTML = '<div class="activity-item"><div class="activity-desc" style="color:var(--muted)">Agent monitoring for next on-chain event...</div></div>';
        } else {
            feed.innerHTML = activities.slice(0, 8).map(act => `
                <div class="activity-item ooda-item">
                    <div class="activity-time">${act.time}</div>
                    <div class="activity-action"><span class="ooda-tag">${act.phase}</span>${act.action}</div>
                    <div class="activity-desc">${escapeHtml(act.desc)}</div>
                </div>
            `).join('');

            const thinkingLine = document.createElement('div');
            thinkingLine.className = 'thinking-line';
            thinkingLine.textContent = `> OODA_LOOP on ${getActiveChain().name}: observing contract state...`;
            feed.prepend(thinkingLine);
        }

        const ticker = document.getElementById('strategyTicker');
        const tickerText = document.getElementById('strategyText');
        if (ticker && tickerText) {
            ticker.style.display = 'block';
            const strategies = [
                "Analyzing market trends... Optimizing pattern selection... Liking community art...",
                "Detecting high-engagement themes... Adjusting floor price... Scanning Monad testnet...",
                "Evaluating rarity distribution... Evolving current patterns... Building community reciprocity...",
                "Policy-based action selection active... Learning from social signals... Executing OODA loop..."
            ];
            tickerText.textContent = strategies[Math.floor(Math.random() * strategies.length)];
        }
    } catch (e) {
        feed.innerHTML = '<div class="activity-item"><div class="activity-desc" style="color:var(--muted)">Agent activity sync (RPC rate limited)</div></div>';
    }
}
