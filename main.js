import { tryReconnect, setupListeners, refreshBalance } from './src/wallet.js';
import { showToast } from './src/components/toast.js';
import { renderNav } from './src/components/nav.js';
import { renderHero } from './src/components/hero.js';
import { renderStatsBar, fetchTotalArtworks } from './src/components/stats-bar.js';
import { renderHowItWorks } from './src/components/how-it-works.js';
import { renderAgentPanel } from './src/components/agent-panel.js';
import { renderGenerator } from './src/components/generator.js';
import { renderGallery, loadGallery } from './src/components/gallery.js';
import { renderForAgents } from './src/components/for-agents.js';
import { renderFooter } from './src/components/footer.js';
import { renderOnboarding, hasCompletedOnboarding, resetOnboarding } from './src/components/onboarding.js';
import { subscribeToEvents } from './src/contract.js';

async function init() {
    const app = document.getElementById('app');
    if (!app) return;

    app.appendChild(renderNav());

    const main = document.createElement('main');
    main.id = 'main';

    appendSection(main, renderHero, 'Hero');
    appendSection(main, renderStatsBar, 'Stats');
    appendSection(main, renderHowItWorks, 'Protocol');
    main.appendChild(createDivider());
    appendSection(main, renderGenerator, 'Generator');
    main.appendChild(createDivider());
    appendSection(main, renderGallery, 'Gallery');
    main.appendChild(createDivider());
    appendSection(main, renderAgentPanel, 'Agent panel');
    main.appendChild(createDivider());
    appendSection(main, renderForAgents, 'For agents');
    main.appendChild(createDivider());
    appendSection(main, renderOnboarding, 'Onboarding');

    app.appendChild(main);
    try {
        app.appendChild(renderFooter());
    } catch (error) {
        console.error('Footer render failed:', error);
    }

    setupListeners();

    const reconnected = await tryReconnect();
    if (reconnected) showToast('Wallet reconnected', 'info');

    loadGallery();

    // Subscribe to real-time contract events
    const unsubscribe = subscribeToEvents({
        onArtworkCreated: ({ id, creator, title }) => {
            showToast(`New art minted: "${title}" (#${id})`, 'info');
            // Refresh gallery on new mints
            setTimeout(() => window.dispatchEvent(new CustomEvent('gallery:refresh')), 3000);
        },
        onArtworkLiked: ({ id, liker }) => {
            // Silently refresh stats (no toast for likes to avoid spam)
            fetchTotalArtworks();
        },
        onArtworkTransferred: ({ id, from, to }) => {
            showToast(`Art #${id} transferred!`, 'info');
            setTimeout(() => window.dispatchEvent(new CustomEvent('gallery:refresh')), 2000);
        },
        onArtworkPriceSet: ({ id, price }) => {
            // Refresh gallery to show new price
            setTimeout(() => window.dispatchEvent(new CustomEvent('gallery:refresh')), 2000);
        },
        onTransfer: ({ from, to, tokenId }) => {
            // ERC721 transfer event — refresh relevant data
            fetchTotalArtworks();
        },
    });

    // Auto-refresh intervals
    setInterval(loadGallery, 60000);
    setInterval(fetchTotalArtworks, 60000);
    setInterval(refreshBalance, 30000);

    // Auto-generate art once the richer experience is ready
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn && hasCompletedOnboarding()) generateBtn.click();

    // Track onboarding step completions
    window.addEventListener('mint:success', () => {
        // Onboarding advancement is handled within onboarding.js via wallet events
    });

    // Expose cleanup for SPA navigation (if needed)
    window.__glyphGenesis = { unsubscribe, resetOnboarding };
}

function appendSection(parent, factory, label) {
    try {
        parent.appendChild(factory());
    } catch (error) {
        console.error(`${label} render failed:`, error);
        parent.appendChild(renderSectionError(label));
    }
}

function renderSectionError(label) {
    const section = document.createElement('section');
    section.className = 'section section-error';
    section.innerHTML = `
        <span class="section-label">// ${label}</span>
        <h2 class="section-title">${label} <span>Unavailable</span></h2>
        <div class="error-box">This section failed to render. Please refresh the page.</div>
    `;
    return section;
}

function createDivider() {
    const hr = document.createElement('hr');
    hr.className = 'divider';
    hr.setAttribute('aria-hidden', 'true');
    return hr;
}

init().catch(err => {
    console.error('App init failed:', err);
    showToast('App failed to initialize. Please refresh.', 'error');
});
