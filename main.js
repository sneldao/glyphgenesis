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

    main.appendChild(renderHero());
    main.appendChild(renderStatsBar());
    main.appendChild(renderHowItWorks());
    main.appendChild(createDivider());
    main.appendChild(renderGenerator());
    main.appendChild(createDivider());
    main.appendChild(renderGallery());
    main.appendChild(createDivider());
    main.appendChild(renderAgentPanel());
    main.appendChild(createDivider());
    main.appendChild(renderForAgents());
    main.appendChild(createDivider());
    main.appendChild(renderOnboarding());

    app.appendChild(main);
    app.appendChild(renderFooter());

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
