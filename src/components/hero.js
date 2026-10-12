import { getReadContract, AGENT_ADDRESS, getActiveChain, subscribeToEvents } from '@/contract.js';
import { showToast } from './toast.js';
import { walk2dField } from '@/quantum-js.mjs';

let tickerEvents = [];
let tickerIndex = 0;
let tickerInterval = null;

export function renderHero() {
    const section = document.createElement('section');
    section.className = 'hero';
    section.setAttribute('aria-label', 'Hero');
    section.innerHTML = `
        <canvas id="heroCanvas" aria-hidden="true"></canvas>
        <div class="field-caption" aria-label="Field encoding legend">
            <span class="fc-live"><i></i>LIVE STATEVECTOR</span>
            <span class="fc-key">hue&nbsp;=&nbsp;amplitude&nbsp;phase</span>
            <span class="fc-key">glyph&nbsp;weight&nbsp;=&nbsp;probability</span>
        </div>
        <div class="hero-content">
            <div class="hero-eyebrow">
                <span id="heroChainTag">Monad Testnet</span>
                <span class="eyebrow-sep" aria-hidden="true">·</span>
                <span>Quantum Observatory</span>
            </div>
            <h1 class="hero-title">
                <span class="line1">GLYPH</span>
                <span class="line2 glitch" data-text="GENESIS">GENESIS</span>
            </h1>
            <div class="hero-spectrum" aria-hidden="true"></div>
            <p class="hero-sub">Every piece begins as a quantum circuit — a discrete-time quantum walk, or two walkers sharing a Bell pair — measured to fix the field, then minted on Monad by an autonomous agent. The field behind this title is a real statevector evolving in your browser right now.</p>
            <div class="hero-cta">
                <button class="btn btn-primary" data-action="scroll-generator">Run an Experiment</button>
                <button class="btn btn-outline" data-action="scroll-gallery">Inspect Specimens</button>
            </div>
            <div class="hero-proof" id="heroProof" aria-label="Live stats">
                <div class="proof-stat">
                    <span class="proof-num" id="proofTotal">—</span>
                    <span class="proof-label">On-Chain</span>
                </div>
                <div class="proof-divider" aria-hidden="true"></div>
                <div class="proof-stat">
                    <span class="proof-num" id="proofToday">—</span>
                    <span class="proof-label">Minted Today</span>
                </div>
                <div class="proof-divider" aria-hidden="true"></div>
                <div class="proof-stat">
                    <span class="proof-num">16</span>
                    <span class="proof-label">Pattern Types</span>
                </div>
                <div class="proof-divider" aria-hidden="true"></div>
                <div class="proof-stat">
                    <a href="#" id="heroContractLink" class="proof-contract" target="_blank" rel="noopener noreferrer">View Contract ↗</a>
                </div>
            </div>
        </div>
        <!-- Live activity ticker -->
        <div id="heroTicker" class="hero-ticker" aria-live="polite" aria-label="Live activity feed">
            <div class="ticker-label">
                <span class="pulse-dot" aria-hidden="true"></span>
                LIVE
            </div>
            <div class="ticker-track" id="tickerTrack">
                <div class="ticker-message">Loading activity...</div>
            </div>
            <div class="ticker-counter" id="tickerCounter" aria-label="Total mints">0 mints</div>
        </div>
        <div class="hero-scroll" aria-hidden="true">Scroll</div>
    `;

    section.querySelector('[data-action="scroll-generator"]').addEventListener('click', () => {
        document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
    });
    section.querySelector('[data-action="scroll-gallery"]').addEventListener('click', () => {
        document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    initQuantumField(section.querySelector('#heroCanvas'), prefersReducedMotion);

    // Set chain-aware content after DOM is in place
    const chain = getActiveChain();
    const contractLink = document.getElementById('heroContractLink');
    const chainTag = document.getElementById('heroChainTag');
    if (contractLink && chain.contractAddress) {
        contractLink.href = chain.explorerAddr(chain.contractAddress);
    }
    if (chainTag) {
        chainTag.textContent = `${chain.name}`;
    }

    // Load live proof stats into hero
    loadHeroProofStats();

    // Seed ticker from contract only — global events handled by main.js
    initLiveTicker();
    subscribeHeroEvents();

    return section;
}

/* Live quantum field — a real 2-D quantum walk evolving in the browser.
   Each frame is the same circuit measured one step further along (exact
   statevector, src/quantum-js.mjs). Colour encodes amplitude *phase*;
   glyph weight encodes probability. */
function initQuantumField(canvas, reducedMotion) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const COLS = 64, ROWS = 32, STEPS = 9;
    const frames = [];
    for (let t = 1; t <= STEPS; t++) {
        frames.push(walk2dField({ width: COLS, height: ROWS, steps: t, phase: true }));
    }

    // phase (rad) → nearest spectral stop
    const STOPS = [[356, '#c82436'], [30, '#d97413'], [150, '#189a5a'],
                   [175, '#0c8f84'], [228, '#1f46b4'], [262, '#6b3fc0']];
    const phaseColor = (p) => {
        const deg = ((p * 180 / Math.PI) + 360) % 360;
        let best = STOPS[0][1], bd = 999;
        for (const [h, c] of STOPS) {
            const d = Math.min(Math.abs(deg - h), 360 - Math.abs(deg - h));
            if (d < bd) { bd = d; best = c; }
        }
        return best;
    };
    const GLYPHS = ['·', '░', '▒', '▓', '█'];

    let frame = 0;
    const draw = () => {
        const { field, phase } = frames[frame];
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const cw = W / COLS, ch = H / ROWS;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.floor(ch * .8)}px "IBM Plex Mono", monospace`;
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                const v = field[y]?.[x] ?? 0;
                if (v < 0.015) continue;
                ctx.fillStyle = phaseColor(phase[y][x]);
                ctx.globalAlpha = 0.22 + v * 0.78;
                ctx.fillText(GLYPHS[Math.min(GLYPHS.length - 1, Math.floor(v * GLYPHS.length))],
                    x * cw + cw / 2, y * ch + ch / 2);
            }
        }
        ctx.globalAlpha = 1;
    };

    const resize = () => {
        // run after the section is in the DOM — offsetWidth is 0 pre-append
        const w = canvas.offsetWidth || canvas.parentElement?.offsetWidth || window.innerWidth;
        const h = canvas.offsetHeight || canvas.parentElement?.offsetHeight || window.innerHeight;
        if (w === 0 || h === 0) return;
        canvas.width = w;
        canvas.height = h;
        draw();
    };
    requestAnimationFrame(resize);
    window.addEventListener('resize', resize);
    if (!reducedMotion) {
        const iv = setInterval(() => { frame = (frame + 1) % STEPS; draw(); }, 1000);
        window.addEventListener('pagehide', () => clearInterval(iv), { once: true });
    }
}

async function subscribeHeroEvents() {
    try {
        const unsubscribe = subscribeToEvents({
            onArtworkCreated: ({ id, creator, title }) => {
                const isAgent = creator.toLowerCase() === AGENT_ADDRESS?.toLowerCase();
                const label = isAgent ? '🤖 Agent minted' : '✏️ New mint';
                addTickerEvent({ label, text: title, id, isAgent, time: Date.now() });
                showToast(`New art minted: “${title}” (#${id})`, 'info');
                // Refresh gallery
                setTimeout(() => window.dispatchEvent(new CustomEvent('gallery:refresh')), 3000);
            },
            onArtworkLiked: ({ id }) => {
                addTickerEvent({ label: '❤️ Liked', text: `#${id}`, time: Date.now() });
            },
            onArtworkTransferred: ({ id }) => {
                addTickerEvent({ label: '🔄 Transferred', text: `#${id}`, time: Date.now() });
            },
        });
        window.__glyphGenesis = window.__glyphGenesis || {};
        window.__glyphGenesis.heroUnsubscribe = unsubscribe;
    } catch (e) {
        console.warn('[Ticker] Failed to subscribe to events:', e.message);
    }
}

function addTickerEvent(event) {
    tickerEvents.unshift(event);
    // Keep last 20 events
    if (tickerEvents.length > 20) tickerEvents = tickerEvents.slice(0, 20);
    updateTickerDisplay();
}

async function initLiveTicker() {
    // Load recent activity from contract
    try {
        const contract = getReadContract();
        const total = Number(await contract.totalArtworks());
        updateCounter(total);
        const count = Math.min(total, 5);
        if (count > 0) {
            const ids = await contract.getRecentArtworks(count);
            for (const id of [...ids].reverse()) {
                try {
                    const art = await contract.getArtwork(id);
                    const [, , , title, , timestamp, , , likes] = art;
                    const isAgent = art[0].toLowerCase() === AGENT_ADDRESS?.toLowerCase();
                    tickerEvents.push({
                        label: isAgent ? '🤖 Agent minted' : '✏️ Minted',
                        text: title,
                        id: Number(id),
                        likes: Number(likes),
                        time: Number(timestamp) * 1000,
                        isAgent,
                    });
                } catch { /* skip */ }
            }
            updateTickerDisplay();
        }
    } catch (e) {
        console.warn('[Ticker] Failed to load recent activity:', e.message);
    }

    // Scroll ticker every 3 seconds
    startTickerScroll();
}

function startTickerScroll() {
    if (tickerInterval) clearInterval(tickerInterval);
    tickerInterval = setInterval(() => {
        if (tickerEvents.length === 0) return;
        tickerIndex = (tickerIndex + 1) % tickerEvents.length;
        const event = tickerEvents[tickerIndex];
        const track = document.getElementById('tickerTrack');
        if (track) {
            track.innerHTML = `<div class="ticker-message"><span class="ticker-action">${event.label}</span> “${event.text}”</div>`;
        }
    }, 3000);
}

function updateTickerDisplay() {
    const track = document.getElementById('tickerTrack');
    if (!track || tickerEvents.length === 0) return;
    const event = tickerEvents[0];
    track.innerHTML = `<div class="ticker-message"><span class="ticker-action">${event.label}</span> “${event.text}”</div>`;
}

function updateCounter(total) {
    const counter = document.getElementById('tickerCounter');
    if (counter) counter.textContent = `${total} on-chain`;
}

// Load live stats into the hero proof strip
async function loadHeroProofStats() {
    const totalEl = document.getElementById('proofTotal');
    const todayEl = document.getElementById('proofToday');
    if (!totalEl && !todayEl) return;

    try {
        const contract = getReadContract();
        const total = Number(await contract.totalArtworks());
        if (totalEl) totalEl.textContent = total.toString();

        // Calculate today's mints from recent artworks
        if (todayEl && total > 0) {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const ids = await contract.getRecentArtworks(Math.min(total, 20));
            let todayCount = 0;
            for (const id of ids) {
                try {
                    const art = await contract.getArtwork(id);
                    const ts = Number(art[5]) * 1000;
                    if (ts >= todayStart.getTime()) todayCount++;
                } catch { break; }
            }
            todayEl.textContent = todayCount.toString();
        }
    } catch (e) {
        // Stats unavailable — leave placeholder dashes
        console.warn('[Hero] Failed to load proof stats:', e.message);
    }
}
