import { tryReconnect, setupListeners, refreshBalance } from './src/wallet.js';
import { showToast } from './src/components/toast.js';
import { renderNav } from './src/components/nav.js';
import { renderHero } from './src/components/hero.js';
import { renderStatsBar, fetchTotalArtworks } from './src/components/stats-bar.js';
import { renderHowItWorks } from './src/components/how-it-works.js';
import { renderAgentPanel } from './src/components/agent-panel.js';
import { renderForAgents } from './src/components/for-agents.js';
import { renderFooter } from './src/components/footer.js';
import { renderOnboarding, hasCompletedOnboarding, resetOnboarding } from './src/components/onboarding.js';
import { subscribeToEvents } from './src/contract.js';
import { runRuntimeSmokeChecks } from './src/health.js';
import { initCommandPalette } from './src/components/cmd-palette.js';

let galleryReady = false;
let galleryRefreshTimer = null;
let pendingGalleryRefresh = false;

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
    const generatorShell = renderLazySection('Generator', 'Interactive art tools load on demand.');
    main.appendChild(generatorShell);
    main.appendChild(createDivider());
    const galleryShell = renderLazySection('Gallery', 'Live market data loads after the page shell.');
    main.appendChild(galleryShell);
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
    initCommandPalette();

    void hydrateGeneratorSection(generatorShell);
    void hydrateGallerySection(galleryShell);

    const reconnected = await tryReconnect();
    if (reconnected) showToast('Wallet reconnected', 'info');

    // Subscribe to real-time contract events
    const unsubscribe = subscribeToEvents({
        onArtworkCreated: ({ id, creator, title }) => {
            showToast(`New art minted: "${title}" (#${id})`, 'info');
            scheduleGalleryRefresh(3000);
            fetchTotalArtworks();
        },
        onArtworkLiked: ({ id, liker }) => {
            scheduleGalleryRefresh(1500);
        },
        onArtworkTransferred: ({ id, from, to }) => {
            showToast(`Art #${id} transferred!`, 'info');
            scheduleGalleryRefresh(2000);
        },
        onArtworkPriceSet: ({ id, price }) => {
            scheduleGalleryRefresh(2000);
        },
        onTransfer: ({ from, to, tokenId }) => {
            scheduleGalleryRefresh(2000);
        },
    });

    // Auto-refresh intervals
    setInterval(fetchTotalArtworks, 60000);
    setInterval(refreshBalance, 30000);

    // Track onboarding step completions
    window.addEventListener('mint:success', () => {
        // Onboarding advancement is handled within onboarding.js via wallet events
    });

    // Expose cleanup for SPA navigation (if needed)
    window.__glyphGenesis = { unsubscribe, resetOnboarding, runSmokeChecks: runRuntimeSmokeChecks };
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

function renderLazySection(label, description) {
    const section = document.createElement('section');
    section.className = 'section section-loading';
    section.id = label.toLowerCase().replace(/\s+/g, '-');
    section.setAttribute('aria-labelledby', `${section.id}-title`);
    section.innerHTML = `
        <span class="section-label">// Loading ${label}</span>
        <h2 class="section-title" id="${section.id}-title">${label} <span>Loading</span></h2>
        <p class="section-intro">${description}</p>
        <div class="loading"><span class="spinner" aria-hidden="true"></span>Loading ${label.toLowerCase()}...</div>
    `;
    return section;
}

async function hydrateGeneratorSection(shell) {
    try {
        const { renderGenerator } = await import('./src/components/generator.js');
        const section = renderGenerator();
        shell.replaceWith(section);

        if (hasCompletedOnboarding()) {
            setTimeout(() => document.getElementById('generateBtn')?.click(), 0);
        }
    } catch (error) {
        console.error('Generator lazy load failed:', error);
        shell.replaceWith(renderSectionError('Generator'));
    }
}

async function hydrateGallerySection(shell) {
    try {
        const { renderGallery, loadGallery } = await import('./src/components/gallery.js');
        const section = renderGallery();
        shell.replaceWith(section);
        galleryReady = true;
        pendingGalleryRefresh = false;
        loadGallery();

        setInterval(loadGallery, 60000);
    } catch (error) {
        console.error('Gallery lazy load failed:', error);
        shell.replaceWith(renderSectionError('Gallery'));
    }
}

function scheduleGalleryRefresh(delay = 2000) {
    if (!galleryReady) {
        pendingGalleryRefresh = true;
        return;
    }

    if (galleryRefreshTimer) clearTimeout(galleryRefreshTimer);
    galleryRefreshTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('gallery:refresh'));
    }, delay);
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
