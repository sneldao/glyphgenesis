import { ethers } from 'ethers';
import { AGENT_ADDRESS, getReadContract, EXPLORER_TX, parseContractError, getCurrencyLabel, getActiveChainKey, subscribeToEvents } from '@/contract.js';
import { isConnected, getContract, getUserAddress, onWalletEvent } from '@/wallet.js';
import { showToast } from './toast.js';
import { artworkCache, statsCache } from './cache.js';
import { creativityScore, getRarity } from '@/ascii-generator.mjs';
import { escapeHtml, shortAddress, timeAgo } from '@/utils.js';

const PAGE_SIZE = 12;
let loadedCount = 0;
let totalAvailable = 0;
let allArtworks = [];
let currentFilter = 'all';
let currentSort = 'recent';
let searchQuery = '';

export function renderGallery() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'gallery';
    section.setAttribute('aria-labelledby', 'gallery-title');
    section.innerHTML = `
        <span class=\"section-label\">// 04 — On-Chain Gallery</span>
        <h2 class=\"section-title\" id=\"gallery-title\">Live from the <span>Blockchain</span></h2>
        <p class=\"section-intro gallery-intro\">Browse the newest on-chain pieces, filter by creator or market state, and open any artwork to inspect the full mint.</p>

        <div class=\"gallery-live-bar\" id=\"galleryLiveBar\">
            <div class=\"live-indicator\">
                <span class=\"pulse-dot\" aria-hidden=\"true\"></span>
                <span class=\"live-text\">LIVE</span>
                <span class=\"live-sub\" id=\"liveCounter\">Loading...</span>
            </div>
            <div class=\"live-ticker\" id=\"liveTicker\" aria-live=\"polite\"></div>
        </div>

        <div id=\"featuredArt\" class=\"featured-art\" style=\"display:none;\" role=\"article\" aria-label=\"Featured artwork\"></div>

        <div class=\"gallery-toolbar\">
            <div class=\"gallery-search\">
                <input type=\"text\" id=\"gallerySearch\" placeholder=\"Search art by title, creator, pattern...\" aria-label=\"Search artworks\">
            </div>
            <div class=\"gallery-filters\">
                <button class=\"filter-btn active\" data-filter=\"all\">All</button>
                <button class=\"filter-btn\" data-filter=\"for-sale\">For Sale</button>
                <button class=\"filter-btn\" data-filter=\"agent\">🤖 Agent</button>
                <button class=\"filter-btn\" data-filter=\"owned\">My Art</button>
            </div>
            <div class=\"gallery-sort\">
                <select id=\"gallerySort\" aria-label=\"Sort artworks\">
                    <option value=\"recent\">Most Recent</option>
                    <option value=\"likes\">Most Liked</option>
                    <option value=\"rarity\">Rarity Score</option>
                    <option value=\"price\">Price (Low→High)</option>
                </select>
            </div>
        </div>
        <div id=\"galleryContent\" class=\"loading\" role=\"region\" aria-label=\"Artwork gallery\">
            <span class=\"spinner\" aria-hidden=\"true\"></span>Loading from blockchain...
        </div>
    `;

    section.querySelector('#gallerySearch')?.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderFilteredArtworks();
    });

    section.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            section.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderFilteredArtworks();
        });
    });

    section.querySelector('#gallerySort')?.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderFilteredArtworks();
    });

    window.addEventListener('gallery:refresh', () => {
        loadedCount = 0;
        allArtworks = [];
        artworkCache.invalidateAll();
        loadGallery();
    });

    onWalletEvent((event) => {
        if (event === 'connect' || event === 'disconnect') {
            if (allArtworks.length > 0) renderFilteredArtworks();
        }
        if (event === 'chainSwitch') {
            loadedCount = 0;
            allArtworks = [];
            artworkCache.invalidateAll();
            statsCache.invalidateAll();
            loadGallery();
        }
    });

    // Subscribe to live events using the imported function from contract.js
    try {
        subscribeToEvents({
            onArtworkCreated: ({ id, creator, title }) => {
                const isAgent = creator.toLowerCase() === AGENT_ADDRESS?.toLowerCase();
                updateLiveTicker(isAgent ? `🤖 Minted: ${title}` : `✏️ Minted: ${title}`);
                setTimeout(() => window.dispatchEvent(new CustomEvent('gallery:refresh')), 2000);
            },
            onArtworkLiked: () => updateLiveCounter(totalAvailable),
        });
    } catch { /* non-critical — RPC or contract may be unavailable */ }

    return section;
}

function updateLiveTicker(msg) {
    const el = document.getElementById('liveTicker');
    if (!el) return;
    el.textContent = msg;
    el.style.opacity = '1';
    setTimeout(() => { el.style.opacity = '0.6'; }, 2000);
}

function updateLiveCounter(total) {
    const el = document.getElementById('liveCounter');
    if (el) el.textContent = `${total} artworks on-chain`;
}

function renderFeaturedArt(artworks) {
    const container = document.getElementById('featuredArt');
    if (!container || artworks.length === 0) return;

    const featured = [...artworks].sort((a, b) => b.rarity - a.rarity)[0];
    if (!featured) { container.style.display = 'none'; return; }

    const priceEth = featured.forSale && featured.price ? ethers.formatEther(featured.price) : null;
    const rarity = getRarity(featured.rarity);

    container.style.display = 'block';
    container.innerHTML = `
        <div class=\"featured-label\">
            <span class=\"featured-star\" aria-hidden=\"true\">★</span>
            Featured Artwork
        </div>
        <div class=\"featured-content\">
            <pre class=\"featured-art-preview\">${escapeHtml(featured.content.slice(0, 700))}${featured.content.length > 700 ? '...' : ''}</pre>
            <div class=\"featured-meta\">
                <div class=\"featured-title\">${escapeHtml(featured.title)}</div>
                <span class=\"rarity-badge\" style=\"color:${rarity.color};border-color:${rarity.color}\">${rarity.emoji} ${rarity.name} (${featured.rarity})</span>
                <div class=\"featured-details\">
                    ${featured.isAgent ? '<span class=\"agent-badge-sm\">🤖 AGENT</span>' : ''}
                    ${featured.forSale ? `<span class=\"for-sale-badge\">💰 For Sale: ${priceEth} ${getCurrencyLabel()}</span>` : ''}
                    <span class=\"featured-time\">${timeAgo(featured.timestamp)}</span>
                </div>
            </div>
        </div>
        <div class=\"featured-actions\">
            <button class=\"btn btn-ghost btn-sm\" data-action=\"expand-featured\" aria-label=\"View full featured artwork\">View Full</button>
            ${featured.forSale ? `<button class=\"btn btn-outline btn-sm\" data-action=\"buy-featured\" data-price=\"${featured.price}\">Buy ${priceEth} ${getCurrencyLabel()}</button>` : ''}
        </div>
    `;

    container.querySelector('[data-action=\"expand-featured\"]')?.addEventListener('click', () => showArtModal(featured));
    container.querySelector('[data-action=\"buy-featured\"]')?.addEventListener('click', (e) => {
        buyArtwork(featured.id, e.target.dataset.price, e.target);
    });
}

export async function loadGallery() {
    const container = document.getElementById('galleryContent');
    if (!container) return;

    container.innerHTML = '<div class=\"loading\"><span class=\"spinner\" aria-hidden=\"true\"></span>Loading from blockchain...</div>';

    try {
        const total = await statsCache.fetchWithRetry('totalArtworks', async () => {
            const contract = getReadContract();
            return Number(await contract.totalArtworks());
        }, 30000);

        totalAvailable = total;
        updateLiveCounter(total);

        if (totalAvailable === 0) {
            container.innerHTML = '<div class=\"empty\">No artworks yet. Be the first to mint!</div>';
            return;
        }

        const fetchCount = Math.min(PAGE_SIZE, totalAvailable);
        const contract = getReadContract();
        const recentIds = await contract.getRecentArtworks(fetchCount);

        allArtworks = [];
        for (const id of recentIds) {
            try {
                const cached = artworkCache.get(`art_${id}`);
                if (cached) { allArtworks.push(cached); continue; }
                const art = await contract.getArtwork(id);
                const [creator, owner, content, title, prompt, timestamp, price, forSale, likes] = art;
                const artworkData = {
                    id: Number(id), creator, owner, content, title, prompt,
                    timestamp: Number(timestamp), price, forSale,
                    likes: Number(likes),
                    isAgent: creator.toLowerCase() === AGENT_ADDRESS?.toLowerCase(),
                    rarity: creativityScore(content),
                };
                artworkCache.set(`art_${id}`, artworkData, 120000);
                allArtworks.push(artworkData);
            } catch (e) { console.warn(`Failed to load artwork ${id}:`, e); }
        }

        loadedCount = allArtworks.length;
        renderFeaturedArt(allArtworks);
        renderFilteredArtworks();
    } catch (error) {
        console.error('Gallery load failed:', error);
        container.innerHTML = `
            <div class=\"error-box\">
                Failed to load gallery from blockchain.<br>
                <small style=\"color:var(--muted)\">The RPC may be temporarily unavailable.</small><br>
                <button class=\"btn btn-ghost btn-sm\" style=\"margin-top:.8rem;color:var(--red);border-color:var(--red);\" onclick=\"window.dispatchEvent(new CustomEvent('gallery:refresh'))\">Retry</button>
            </div>
        `;
    }
}

function getFilteredArtworks() {
    const connected = isConnected();
    const userAddr = getUserAddress()?.toLowerCase();
    let filtered = allArtworks;

    if (searchQuery) {
        filtered = filtered.filter(art =>
            art.title.toLowerCase().includes(searchQuery) ||
            art.prompt.toLowerCase().includes(searchQuery) ||
            art.creator.toLowerCase().includes(searchQuery) ||
            art.id.toString().includes(searchQuery)
        );
    }

    switch (currentFilter) {
        case 'for-sale': filtered = filtered.filter(a => a.forSale); break;
        case 'agent': filtered = filtered.filter(a => a.isAgent); break;
        case 'owned':
            filtered = connected && userAddr
                ? filtered.filter(a => a.owner.toLowerCase() === userAddr)
                : [];
            break;
    }

    switch (currentSort) {
        case 'likes': filtered = [...filtered].sort((a, b) => b.likes - a.likes); break;
        case 'rarity': filtered = [...filtered].sort((a, b) => b.rarity - a.rarity); break;
        case 'price':
            filtered = [...filtered].sort((a, b) => {
                const pa = a.forSale ? Number(ethers.formatEther(a.price)) : Infinity;
                const pb = b.forSale ? Number(ethers.formatEther(b.price)) : Infinity;
                return pa - pb;
            });
            break;
    }

    return filtered;
}

function renderFilteredArtworks() {
    renderGalleryItems(getFilteredArtworks());
}

function renderGalleryItems(artworks) {
    const container = document.getElementById('galleryContent');
    if (!container) return;

    const connected = isConnected();
    const userAddr = getUserAddress()?.toLowerCase();

    if (artworks.length === 0) {
        container.innerHTML = '<div class=\"empty\">No artworks match your search or filter.</div>';
        return;
    }

    const resultCount = document.createElement('div');
    resultCount.className = 'gallery-result-count';
    resultCount.textContent = `${artworks.length} result${artworks.length !== 1 ? 's' : ''}`;

    const html = artworks.map(art => {
        const isOwner = art.owner.toLowerCase() === userAddr;
        const priceEth = art.forSale && art.price ? ethers.formatEther(art.price) : null;
        const rarity = getRarity(art.rarity);

        return `
            <div class=\"gallery-item\" data-id=\"${art.id}\" tabindex=\"0\" role=\"article\" aria-label=\"Artwork: ${escapeHtml(art.title)}\">
                <pre>${escapeHtml(art.content.slice(0, 500))}${art.content.length > 500 ? '...' : ''}</pre>
                <div class=\"gallery-meta\">
                    <strong>${escapeHtml(art.title)}</strong>
                    <span class=\"rarity-badge\" style=\"color:${rarity.color};border-color:${rarity.color}\">${rarity.emoji} ${rarity.name} (${art.rarity})</span>
                    <div class=\"gallery-meta-details\">
                        ID: #${art.id} · ${shortAddress(art.creator)} · ${timeAgo(art.timestamp)}
                        ${art.isAgent ? '<br><span class=\"agent-badge-sm\">🤖 AGENT</span>' : ''}
                        ${art.forSale ? `<br><span class=\"for-sale-badge\">💰 For Sale: ${priceEth} ${getCurrencyLabel()}</span>` : ''}
                        ${art.likes > 0 ? `<br><small style=\"color:var(--muted)\">❤ ${art.likes} like${art.likes !== 1 ? 's' : ''}</small>` : ''}
                    </div>
                </div>
                <div class=\"gallery-actions\">
                    <button class=\"btn btn-ghost btn-sm\" data-action=\"expand\" aria-label=\"View full artwork\">Expand</button>
                    ${connected ? `<button class=\"btn btn-ghost btn-sm\" data-action=\"like\" data-id=\"${art.id}\" aria-label=\"Like this artwork\">❤ Like</button>` : ''}
                    ${connected && art.forSale && !isOwner ? `<button class=\"btn btn-ghost btn-sm\" data-action=\"buy\" data-id=\"${art.id}\" data-price=\"${art.price}\" style=\"color:var(--accent3);border-color:var(--accent3);\" aria-label=\"Buy this artwork for ${priceEth} ${getCurrencyLabel()}\">💰 Buy ${priceEth} ${getCurrencyLabel()}</button>` : ''}
                </div>
            </div>
        `;
    }).join('');

    let loadMoreHtml = '';
    if (loadedCount < totalAvailable) {
        loadMoreHtml = `<div class=\"load-more-wrap\"><button class=\"btn btn-outline btn-sm\" id=\"loadMoreBtn\">Load More (${totalAvailable - loadedCount} remaining)</button></div>`;
    }

    container.innerHTML = '';
    container.appendChild(resultCount);
    container.insertAdjacentHTML('beforeend', `<div class=\"gallery-grid\">${html}</div>${loadMoreHtml}`);

    container.querySelectorAll('[data-action=\"expand\"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const art = allArtworks.find(a => a.id === Number(btn.closest('.gallery-item').dataset.id));
            if (art) showArtModal(art);
        });
    });

    container.querySelectorAll('[data-action=\"like\"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            likeArtwork(Number(btn.dataset.id), btn);
        });
    });

    container.querySelectorAll('[data-action=\"buy\"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            buyArtwork(Number(btn.dataset.id), btn.dataset.price, btn);
        });
    });

    container.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const art = allArtworks.find(a => a.id === Number(item.dataset.id));
            if (art) showArtModal(art);
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const art = allArtworks.find(a => a.id === Number(item.dataset.id));
                if (art) showArtModal(art);
            }
        });
    });

    const loadMoreBtn = container.querySelector('#loadMoreBtn');
    if (loadMoreBtn) loadMoreBtn.addEventListener('click', loadMore);
}

async function loadMore() {
    const btn = document.getElementById('loadMoreBtn');
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<span class=\"spinner\" aria-hidden=\"true\"></span>Loading...';

    try {
        const contract = getReadContract();
        const fetchCount = Math.min(PAGE_SIZE, totalAvailable - loadedCount);
        const allIds = await contract.getRecentArtworks(loadedCount + fetchCount);
        const newIds = allIds.slice(loadedCount, loadedCount + fetchCount);

        for (const id of newIds) {
            try {
                const cached = artworkCache.get(`art_${id}`);
                if (cached) { allArtworks.push(cached); continue; }
                const art = await contract.getArtwork(id);
                const [creator, owner, content, title, prompt, timestamp, price, forSale, likes] = art;
                const artworkData = {
                    id: Number(id), creator, owner, content, title, prompt,
                    timestamp: Number(timestamp), price, forSale,
                    likes: Number(likes),
                    isAgent: creator.toLowerCase() === AGENT_ADDRESS?.toLowerCase(),
                    rarity: creativityScore(content),
                };
                artworkCache.set(`art_${id}`, artworkData, 120000);
                allArtworks.push(artworkData);
            } catch (e) { console.warn(`Failed to load artwork ${id}:`, e); }
        }

        loadedCount += newIds.length;
        renderFeaturedArt(allArtworks);
        renderFilteredArtworks();
    } catch (error) {
        console.error('Load more failed:', error);
        showToast('Failed to load more artworks', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Retry'; }
    }
}

function showArtModal(art) {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const bodyOverflow = document.body.style.overflow;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    const modalTitleId = `modal-title-${art.id}`;
    overlay.setAttribute('aria-labelledby', modalTitleId);

    const connected = isConnected();
    const userAddr = getUserAddress()?.toLowerCase();
    const isOwner = art.owner.toLowerCase() === userAddr;
    const priceEth = art.forSale && art.price ? ethers.formatEther(art.price) : null;
    const rarity = getRarity(art.rarity);

    overlay.innerHTML = `
        <div class=\"modal\">
            <button class=\"modal-close\" aria-label=\"Close\">&times;</button>
            <div class=\"modal-header\">
                <div>
                    <div class=\"modal-kicker\">Artwork Details</div>
                    <strong id=\"${modalTitleId}\">${escapeHtml(art.title)}</strong>
                </div>
                <span class=\"rarity-badge modal-rarity\" style=\"color:${rarity.color};border-color:${rarity.color}\">${rarity.emoji} ${rarity.name} (${art.rarity})</span>
            </div>
            <pre>${escapeHtml(art.content)}</pre>
            <div class=\"modal-meta\">
                <div class=\"modal-chips\">
                    <span>ID: #${art.id}</span>
                    <span>Creator: ${shortAddress(art.creator)}</span>
                    <span>Likes: ${art.likes}</span>
                    <span>Created: ${new Date(art.timestamp * 1000).toLocaleString()}</span>
                    ${art.isAgent ? '<span class=\"agent-badge-sm\">🤖 AGENT</span>' : ''}
                    ${art.forSale ? `<span class=\"for-sale-badge\">💰 ${priceEth} ${getCurrencyLabel()}</span>` : ''}
                </div>
            </div>
            <div class=\"modal-actions\">
                ${connected && art.forSale && !isOwner ? `<button class=\"btn btn-primary btn-sm\" data-action=\"buy\" data-id=\"${art.id}\" data-price=\"${art.price}\">Buy for ${priceEth} ${getCurrencyLabel()}</button>` : ''}
                ${connected && isOwner && !art.forSale ? `<button class=\"btn btn-primary btn-sm\" data-action=\"list\" data-id=\"${art.id}\">List for Sale</button>` : ''}
                <button class=\"btn btn-ghost btn-sm\" data-action=\"copy\" aria-label=\"Copy art\">Copy</button>
                ${connected ? `<button class=\"btn btn-ghost btn-sm\" data-action=\"like\" data-id=\"${art.id}\" aria-label=\"Like\">❤ Like</button>` : ''}
            </div>
        </div>
    `;

    const closeModal = () => {
        document.removeEventListener('keydown', escHandler);
        document.body.style.overflow = bodyOverflow;
        overlay.remove();
        previouslyFocused?.focus?.();
    };

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    overlay.querySelector('.modal-close').addEventListener('click', closeModal);

    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            return;
        }
        if (e.key === 'Tab') {
            const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const items = Array.from(focusable).filter(el => !el.hasAttribute('disabled'));
            if (items.length === 0) return;
            const first = items[0];
            const last = items[items.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', escHandler);
    setTimeout(() => overlay.querySelector('.modal-close')?.focus(), 50);

    overlay.querySelector('[data-action=\"copy\"]')?.addEventListener('click', () => {
        navigator.clipboard.writeText(art.content)
            .then(() => showToast('Copied to clipboard!', 'success'))
            .catch(() => showToast('Failed to copy', 'error'));
    });

    overlay.querySelector('[data-action=\"like\"]')?.addEventListener('click', (e) => {
        likeArtwork(Number(e.target.dataset.id), e.target);
    });

    overlay.querySelector('[data-action=\"buy\"]')?.addEventListener('click', (e) => {
        buyArtwork(Number(e.target.dataset.id), e.target.dataset.price, e.target, closeModal);
    });

    overlay.querySelector('[data-action=\"list\"]')?.addEventListener('click', async (e) => {
        const contract = getContract();
        if (!contract) return;
        try {
            const price = ethers.parseEther('0.01');
            const tx = await contract.setForSale(Number(e.target.dataset.id), price);
            showToast(`Listing for 0.01 ${getCurrencyLabel()}...`, 'info');
            await tx.wait();
            showToast('Listed for sale!', 'success');
            closeModal();
            window.dispatchEvent(new CustomEvent('gallery:refresh'));
        } catch (error) {
            showToast(parseContractError(error), 'error');
        }
    });

    document.body.appendChild(overlay);
}

async function likeArtwork(id, btn) {
    const contract = getContract();
    if (!contract) { showToast('Connect your wallet to like artwork', 'warning'); return; }

    const origText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class=\"spinner\" aria-hidden=\"true\"></span>';

    try {
        const tx = await contract.likeArtwork(id);
        showToast('Liking artwork...', 'info');
        await tx.wait();
        showToast('Artwork liked!', 'success');
        btn.textContent = '❤ Liked!';
        btn.style.color = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
        const art = allArtworks.find(a => a.id === id);
        if (art) { art.likes++; renderFilteredArtworks(); }
    } catch (error) {
        showToast(parseContractError(error), 'error');
        btn.textContent = origText;
        btn.disabled = false;
    }
}

async function buyArtwork(id, price, btn, onSuccess) {
    const contract = getContract();
    if (!contract) { showToast('Connect your wallet to buy artwork', 'warning'); return; }

    const origText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class=\"spinner\" aria-hidden=\"true\"></span>';

    try {
        const tx = await contract.buyArtwork(id, { value: price });
        showToast('Processing purchase...', 'info');
        await tx.wait();
        showToast('Artwork purchased!', 'success');
        btn.textContent = '✓ Purchased!';
        btn.style.color = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
        artworkCache.invalidateAll();
        if (typeof onSuccess === 'function') onSuccess();
        setTimeout(() => window.dispatchEvent(new CustomEvent('gallery:refresh')), 2000);
    } catch (error) {
        showToast(parseContractError(error), 'error');
        btn.textContent = origText;
        btn.disabled = false;
    }
}
