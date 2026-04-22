import { ethers } from 'ethers';
import { AGENT_ADDRESS, getReadContract, EXPLORER_TX, parseContractError } from '@/contract.js';
import { isConnected, getContract, getUserAddress, onWalletEvent } from '@/wallet.js';
import { showToast } from './toast.js';

const PAGE_SIZE = 12;
let loadedCount = 0;
let totalAvailable = 0;
let allArtworks = [];

export function renderGallery() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'gallery';
    section.setAttribute('aria-labelledby', 'gallery-title');
    section.innerHTML = `
        <span class="section-label">// 04 \u2014 On-Chain Gallery</span>
        <h2 class="section-title" id="gallery-title">Live from the <span>Blockchain</span></h2>
        <p style="color:var(--muted);font-size:.8rem;margin-bottom:2rem;">Fetched via <code style="color:var(--accent2)">getRecentArtworks()</code> &amp; <code style="color:var(--accent2)">getArtwork()</code> \u2014 stored permanently on Monad.</p>
        <div id="galleryContent" class="loading" role="region" aria-label="Artwork gallery">
            <span class="spinner" aria-hidden="true"></span>Loading from blockchain...
        </div>
    `;

    window.addEventListener('gallery:refresh', () => {
        loadedCount = 0;
        allArtworks = [];
        loadGallery();
    });

    onWalletEvent((event) => {
        if (event === 'connect' || event === 'disconnect') {
            if (allArtworks.length > 0) renderGalleryItems(allArtworks);
        }
    });

    return section;
}

export async function loadGallery() {
    const container = document.getElementById('galleryContent');
    if (!container) return;

    container.innerHTML = '<div class="loading"><span class="spinner" aria-hidden="true"></span>Loading from blockchain...</div>';

    try {
        const contract = getReadContract();
        totalAvailable = Number(await contract.totalArtworks());

        if (totalAvailable === 0) {
            container.innerHTML = '<div class="empty">No artworks yet. Be the first to mint!</div>';
            return;
        }

        const fetchCount = Math.min(PAGE_SIZE, totalAvailable);
        const recentIds = await contract.getRecentArtworks(fetchCount);

        allArtworks = [];
        for (const id of recentIds) {
            try {
                const art = await contract.getArtwork(id);
                const [creator, owner, content, title, prompt, timestamp, price, forSale, likes] = art;
                allArtworks.push({
                    id: Number(id), creator, owner, content, title, prompt,
                    timestamp: Number(timestamp), price, forSale,
                    likes: Number(likes),
                    isAgent: creator.toLowerCase() === AGENT_ADDRESS.toLowerCase(),
                });
            } catch(e) {
                console.warn(`Failed to load artwork ${id}:`, e);
            }
        }

        loadedCount = allArtworks.length;
        renderGalleryItems(allArtworks);
    } catch(error) {
        console.error('Gallery load failed:', error);
        container.innerHTML = `
            <div class="error-box">
                Failed to load gallery from blockchain.<br>
                <small style="color:var(--muted)">The RPC may be temporarily unavailable.</small><br>
                <button class="btn btn-ghost btn-sm" style="margin-top:.8rem;color:var(--red);border-color:var(--red);" onclick="window.dispatchEvent(new CustomEvent('gallery:refresh'))">Retry</button>
            </div>
        `;
    }
}

function renderGalleryItems(artworks) {
    const container = document.getElementById('galleryContent');
    if (!container) return;

    const connected = isConnected();
    const userAddr = getUserAddress()?.toLowerCase();

    const html = artworks.map(art => {
        const isOwner = art.owner.toLowerCase() === userAddr;
        const shortCreator = `${art.creator.slice(0, 6)}...${art.creator.slice(-4)}`;
        const priceEth = art.forSale && art.price ? ethers.formatEther(art.price) : null;
        const date = new Date(art.timestamp * 1000).toLocaleDateString();

        return `
            <div class="gallery-item" data-id="${art.id}" tabindex="0" role="article" aria-label="Artwork: ${escapeAttr(art.title)}">
                <pre>${escapeHtml(art.content.slice(0, 500))}${art.content.length > 500 ? '...' : ''}</pre>
                <div class="gallery-meta">
                    <strong>${escapeHtml(art.title)}</strong>
                    ID: #${art.id} &middot; ${shortCreator} &middot; ${date}
                    ${art.isAgent ? '<br><span class="agent-badge-sm">\uD83E\uDD16 AGENT</span>' : ''}
                    ${art.forSale ? `<br><span class="for-sale-badge">\uD83D\uDCB0 For Sale: ${priceEth} MON</span>` : ''}
                    ${art.likes > 0 ? `<br><small style="color:var(--muted)">\u2764 ${art.likes} like${art.likes !== 1 ? 's' : ''}</small>` : ''}
                </div>
                <div class="gallery-actions">
                    <button class="btn btn-ghost btn-sm" data-action="expand" aria-label="View full artwork">Expand</button>
                    ${connected ? `<button class="btn btn-ghost btn-sm" data-action="like" data-id="${art.id}" aria-label="Like this artwork">\u2764 Like</button>` : ''}
                    ${connected && art.forSale && !isOwner ? `<button class="btn btn-ghost btn-sm" data-action="buy" data-id="${art.id}" data-price="${art.price}" style="color:var(--accent3);border-color:var(--accent3);" aria-label="Buy this artwork for ${priceEth} MON">\uD83D\uDCB0 Buy ${priceEth} MON</button>` : ''}
                </div>
            </div>
        `;
    }).join('');

    let loadMoreHtml = '';
    if (loadedCount < totalAvailable) {
        loadMoreHtml = `<div class="load-more-wrap"><button class="btn btn-outline btn-sm" id="loadMoreBtn">Load More (${totalAvailable - loadedCount} remaining)</button></div>`;
    }

    container.innerHTML = `<div class="gallery-grid">${html}</div>${loadMoreHtml}`;

    container.querySelectorAll('[data-action="expand"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = Number(btn.closest('.gallery-item').dataset.id);
            const art = artworks.find(a => a.id === id);
            if (art) showArtModal(art);
        });
    });

    container.querySelectorAll('[data-action="like"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            likeArtwork(Number(btn.dataset.id), btn);
        });
    });

    container.querySelectorAll('[data-action="buy"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            buyArtwork(Number(btn.dataset.id), btn.dataset.price, btn);
        });
    });

    container.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = Number(item.dataset.id);
            const art = artworks.find(a => a.id === id);
            if (art) showArtModal(art);
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const id = Number(item.dataset.id);
                const art = artworks.find(a => a.id === id);
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
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Loading...';

    try {
        const contract = getReadContract();
        const fetchCount = Math.min(PAGE_SIZE, totalAvailable - loadedCount);
        const allIds = await contract.getRecentArtworks(loadedCount + fetchCount);
        const newIds = allIds.slice(loadedCount, loadedCount + fetchCount);

        for (const id of newIds) {
            try {
                const art = await contract.getArtwork(id);
                const [creator, owner, content, title, prompt, timestamp, price, forSale, likes] = art;
                allArtworks.push({
                    id: Number(id), creator, owner, content, title, prompt,
                    timestamp: Number(timestamp), price, forSale,
                    likes: Number(likes),
                    isAgent: creator.toLowerCase() === AGENT_ADDRESS.toLowerCase(),
                });
            } catch(e) {
                console.warn(`Failed to load artwork ${id}:`, e);
            }
        }

        loadedCount += newIds.length;
        renderGalleryItems(allArtworks);
    } catch(error) {
        console.error('Load more failed:', error);
        showToast('Failed to load more artworks', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Retry'; }
    }
}

function showArtModal(art) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', `Artwork: ${art.title}`);

    const connected = isConnected();
    const userAddr = getUserAddress()?.toLowerCase();
    const isOwner = art.owner.toLowerCase() === userAddr;
    const priceEth = art.forSale && art.price ? ethers.formatEther(art.price) : null;

    overlay.innerHTML = `
        <div class="modal">
            <button class="modal-close" aria-label="Close">&times;</button>
            <pre>${escapeHtml(art.content)}</pre>
            <div class="modal-meta">
                <strong>${escapeHtml(art.title)}</strong><br>
                ID: #${art.id}<br>
                Creator: ${art.creator.slice(0, 6)}...${art.creator.slice(-4)} ${art.isAgent ? '<span class="agent-badge-sm">\uD83E\uDD16 AGENT</span>' : ''}<br>
                ${art.forSale ? `Price: <span style="color:var(--accent3)">${priceEth} MON</span><br>` : ''}
                Likes: ${art.likes}<br>
                Created: ${new Date(art.timestamp * 1000).toLocaleString()}
            </div>
            <div class="modal-actions">
                <button class="btn btn-ghost btn-sm" data-action="copy" aria-label="Copy art">Copy</button>
                ${connected ? `<button class="btn btn-ghost btn-sm" data-action="like" data-id="${art.id}" aria-label="Like">\u2764 Like</button>` : ''}
                ${connected && art.forSale && !isOwner ? `<button class="btn btn-outline btn-sm" data-action="buy" data-id="${art.id}" data-price="${art.price}">Buy for ${priceEth} MON</button>` : ''}
            </div>
        </div>
    `;

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());

    const escHandler = (e) => {
        if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);
    setTimeout(() => overlay.querySelector('.modal-close')?.focus(), 50);

    overlay.querySelector('[data-action="copy"]')?.addEventListener('click', () => {
        navigator.clipboard.writeText(art.content)
            .then(() => showToast('Copied to clipboard!', 'success'))
            .catch(() => showToast('Failed to copy', 'error'));
    });

    overlay.querySelector('[data-action="like"]')?.addEventListener('click', (e) => {
        likeArtwork(Number(e.target.dataset.id), e.target);
    });

    overlay.querySelector('[data-action="buy"]')?.addEventListener('click', (e) => {
        buyArtwork(Number(e.target.dataset.id), e.target.dataset.price, e.target);
    });

    document.body.appendChild(overlay);
}

async function likeArtwork(id, btn) {
    const contract = getContract();
    if (!contract) { showToast('Connect your wallet to like artwork', 'warning'); return; }

    const origText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>';

    try {
        const tx = await contract.likeArtwork(id);
        showToast('Liking artwork...', 'info');
        await tx.wait();
        showToast('Artwork liked!', 'success');
        btn.textContent = '\u2764 Liked!';
        btn.style.color = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
    } catch(error) {
        const msg = parseContractError(error);
        showToast(msg, 'error');
        btn.textContent = origText;
        btn.disabled = false;
    }
}

async function buyArtwork(id, price, btn) {
    const contract = getContract();
    if (!contract) { showToast('Connect your wallet to buy artwork', 'warning'); return; }

    const origText = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>';

    try {
        const tx = await contract.buyArtwork(id, { value: price });
        showToast('Processing purchase...', 'info');
        await tx.wait();
        showToast('Artwork purchased!', 'success');
        btn.textContent = '\u2713 Purchased!';
        btn.style.color = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
        setTimeout(() => window.dispatchEvent(new CustomEvent('gallery:refresh')), 2000);
    } catch(error) {
        const msg = parseContractError(error);
        showToast(msg, 'error');
        btn.textContent = origText;
        btn.disabled = false;
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
