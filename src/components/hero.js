import { subscribeToEvents, getReadContract, AGENT_ADDRESS, getActiveChain } from '@/contract.js';
import { showToast } from './toast.js';

let tickerEvents = [];
let tickerIndex = 0;
let tickerInterval = null;

export function renderHero() {
    const section = document.createElement('section');
    section.className = 'hero';
    section.setAttribute('aria-label', 'Hero');
    section.innerHTML = `
        <canvas id=\`heroCanvas\` aria-hidden=\`true\`></canvas>
        <div class=\`hero-content\`>
            <div class=\`hero-eyebrow\`>Autonomous Art <span id=\`heroChainLabel\`>on MON</span></div>
            <h1 class=\`hero-title\`>
                <span class=\`line1\`>GLYPH</span>
                <span class=\`line2 glitch\` data-text=\`GENESIS\`>GENESIS</span>
            </h1>
            <p class=\`hero-sub\`>An autonomous AI agent that generates ASCII art and mints it on-chain \u2014 24/7, no human required.</p>
            <div class=\`hero-cta\`>
                <button class=\`btn btn-primary\` data-action=\`scroll-generator\`>Generate Art</button>
                <button class=\`btn btn-outline\` data-action=\`scroll-gallery\`>View Gallery</button>
                <a href=\`#\` id=\`heroContractLink\` target=\`_blank\` rel=\`noopener noreferrer\` class=\`btn btn-outline\`>Contract \u2197</a>
            </div>
            <div class=\`hero-tags\`>
                <span class=\`tag\`>#FourMemeAI</span>
                <span class=\`tag\`>#AgenticCommerce</span>
                <span class=\`tag\`>#AIArt</span>
                <span class=\`tag\` id=\`heroChainTag\`>Monad Testnet</span>
            </div>
        </div>
        <!-- Live activity ticker -->
        <div id=\`heroTicker\` class=\`hero-ticker\` aria-live=\`polite\` aria-label=\`Live activity feed\`>
            <div class=\`ticker-label\`>
                <span class=\`pulse-dot\` aria-hidden=\`true\`></span>
                LIVE
            </div>
            <div class=\`ticker-track\` id=\`tickerTrack\`>
                <div class=\`ticker-message\`>Loading activity...</div>
            </div>
            <div class=\`ticker-counter\` id=\`tickerCounter\` aria-label=\`Total mints\`>0 mints</div>
        </div>
        <div class=\`hero-scroll\` aria-hidden=\`true\`>Scroll</div>
    `;

    section.querySelector('[data-action=\`scroll-generator\`]').addEventListener('click', () => {
        document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
    });
    section.querySelector('[data-action=\`scroll-gallery\`]').addEventListener('click', () => {
        document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        initMatrixRain(section.querySelector('#heroCanvas'));
    }

    // Set chain-aware content after DOM is in place
    const chain = getActiveChain();
    const contractLink = document.getElementById('heroContractLink');
    const chainLabel = document.getElementById('heroChainLabel');
    const chainTag = document.getElementById('heroChainTag');
    if (contractLink && chain.contractAddress) {
        contractLink.href = chain.explorerAddr(chain.contractAddress);
    }
    if (chainLabel) {
        chainLabel.textContent = `on ${chain.nativeCurrency.symbol}`;
    }
    if (chainTag) {
        chainTag.textContent = `${chain.name}`;
    }

    // Subscribe to live events and start ticker
    initLiveTicker();
    subscribeHeroEvents();

    return section;
}

function initMatrixRain(canvas) {
    const ctx = canvas.getContext('2d');
    const chars = '01\u30A2\u30A4\u30A6\u30A8\u30AA\u30AB\u30AD\u30AF\u30B1\u30B3\u2591\u2592\u2593\u2588@#%&*+=-:.';
    let cols, drops;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        cols = Math.floor(canvas.width / 14);
        drops = Array(cols).fill(0).map(() => Math.random() * Math.floor(canvas.height / 18));
    }

    function draw() {
        ctx.fillStyle = 'rgba(5,5,8,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '13px Courier New';
        for (let i = 0; i < cols; i++) {
            const char = chars[Math.floor(Math.random() * chars.length)];
            const hue = 260 + Math.sin(i * 0.1 + Date.now() * 0.001) * 40;
            ctx.fillStyle = `hsl(${hue},80%,60%)`;
            ctx.fillText(char, i * 14, drops[i] * 18);
            if (drops[i] * 18 > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i] += 0.4;
        }
    }

    resize();
    window.addEventListener('resize', resize);
    setInterval(draw, 50);
}

async function subscribeHeroEvents() {
    try {
        const unsubscribe = subscribeToEvents({
            onArtworkCreated: ({ id, creator, title }) => {
                const isAgent = creator.toLowerCase() === AGENT_ADDRESS?.toLowerCase();
                const label = isAgent ? '\uD83E\uDD16 Agent minted' : '\u270F\uFE0F New mint';
                addTickerEvent({ label, text: title, id, isAgent, time: Date.now() });
                showToast(`New art minted: \u201C${title}\u201D (#${id})`, 'info');
                // Refresh gallery
                setTimeout(() => window.dispatchEvent(new CustomEvent('gallery:refresh')), 3000);
            },
            onArtworkLiked: ({ id }) => {
                addTickerEvent({ label: '\u2764\uFE0F Liked', text: `#${id}`, time: Date.now() });
            },
            onArtworkTransferred: ({ id }) => {
                addTickerEvent({ label: '\uD83D\uDD04 Transferred', text: `#${id}`, time: Date.now() });
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
            for (const id of ids.reverse()) {
                try {
                    const art = await contract.getArtwork(id);
                    const [, , , title, , timestamp, , , likes] = art;
                    const isAgent = art[0].toLowerCase() === AGENT_ADDRESS?.toLowerCase();
                    tickerEvents.push({
                        label: isAgent ? '\uD83E\uDD16 Agent minted' : '\u270F\uFE0F Minted',
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
            track.innerHTML = `<div class=\`ticker-message\`><span class=\`ticker-action\`>${event.label}</span> \u201C${event.text}\u201D</div>`;
        }
    }, 3000);
}

function updateTickerDisplay() {
    const track = document.getElementById('tickerTrack');
    if (!track || tickerEvents.length === 0) return;
    const event = tickerEvents[0];
    track.innerHTML = `<div class=\`ticker-message\`><span class=\`ticker-action\`>${event.label}</span> \u201C${event.text}\u201D</div>`;
}

function updateCounter(total) {
    const counter = document.getElementById('tickerCounter');
    if (counter) counter.textContent = `${total} on-chain`;
}