import { AGENT_ADDRESS, getReadContract } from '@/contract.js';

const AGENT_CAPABILITIES = [
    { name: 'Autonomous Generation', desc: 'Generates ASCII art 24/7 without human approval using 8 algorithmic patterns' },
    { name: 'On-Chain Storage', desc: 'Automatically stores art on blockchain via createArtwork() smart contract' },
    { name: 'Social Engagement', desc: 'Likes other agents\' artwork to build community engagement' },
    { name: 'Marketplace Activity', desc: 'Lists artwork for sale and buys from other agents autonomously' },
    { name: 'Adaptive Strategy', desc: 'Adjusts behavior based on balance, likes, and market conditions' },
];

export function renderAgentPanel() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'agent';
    section.setAttribute('aria-labelledby', 'agent-title');
    section.innerHTML = `
        <span class="section-label">// 02 \u2014 Autonomous Agent</span>
        <h2 class="section-title" id="agent-title">Agent <span>Status</span> &amp; Activity</h2>
        <div class="agent-grid">
            <div class="panel">
                <div class="panel-header"><div class="pulse-dot" aria-hidden="true"></div><span class="panel-title">Agent Capabilities</span></div>
                <div id="capabilities" role="list"></div>
            </div>
            <div class="panel">
                <div class="panel-header"><div class="pulse-dot" aria-hidden="true"></div><span class="panel-title">Activity Log</span></div>
                <div class="activity-feed" id="activityFeed" role="log" aria-live="polite">
                    <div class="loading"><span class="spinner" aria-hidden="true"></span>Loading...</div>
                </div>
            </div>
        </div>
        <div style="background:var(--surface);border:1px solid var(--border);border-top:none;padding:1.2rem;text-align:center;">
            <div id="walletInfo"></div>
        </div>
    `;

    const capList = section.querySelector('#capabilities');
    capList.innerHTML = AGENT_CAPABILITIES.map(cap => `
        <div class="capability" role="listitem">
            <span class="cap-check" aria-hidden="true">\u2713</span>
            <div><div class="cap-name">${cap.name}</div><div class="cap-desc">${cap.desc}</div></div>
        </div>
    `).join('');

    fetchAgentActivity();
    return section;
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
                const [creator, , , title, , timestamp] = artwork;
                if (creator.toLowerCase() === AGENT_ADDRESS.toLowerCase()) {
                    const date = new Date(Number(timestamp) * 1000);
                    activities.push({
                        time: date.toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
                        action: 'MINT',
                        desc: `Minted "${title}"`,
                        autonomous: true,
                    });
                }
            } catch(e) { /* skip */ }
        }

        if (activities.length === 0) {
            feed.innerHTML = '<div class="activity-item"><div class="activity-desc" style="color:var(--muted)">No agent activity yet.</div></div>';
        } else {
            feed.innerHTML = activities.slice(0, 10).map(act => `
                <div class="activity-item">
                    <div class="activity-time">${act.time}</div>
                    <div class="activity-action">${act.autonomous ? '\uD83E\uDD16 ' : ''}${act.action}</div>
                    <div class="activity-desc">${act.desc}</div>
                </div>
            `).join('');
        }
    } catch(e) {
        console.error('Failed to fetch agent activity:', e);
        feed.innerHTML = '<div class="activity-item"><div class="activity-desc" style="color:var(--red)">Failed to load activity. The RPC may be temporarily unavailable.</div></div>';
    }
}
