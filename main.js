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
    main.appendChild(renderAgentPanel());
    main.appendChild(createDivider());
    main.appendChild(renderGenerator());
    main.appendChild(createDivider());
    main.appendChild(renderGallery());
    main.appendChild(createDivider());
    main.appendChild(renderForAgents());

    app.appendChild(main);
    app.appendChild(renderFooter());

    setupListeners();

    const reconnected = await tryReconnect();
    if (reconnected) showToast('Wallet reconnected', 'info');

    loadGallery();

    setInterval(loadGallery, 60000);
    setInterval(fetchTotalArtworks, 60000);
    setInterval(refreshBalance, 30000);

    // Auto-generate art on first load
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) generateBtn.click();
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
