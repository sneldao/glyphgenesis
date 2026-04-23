/**
 * GlyphGenesis Shared Utilities
 * Single source of truth for cross-component helpers
 * DRY principle: no duplicated logic across components
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Truncate address for display (0x1234...abcd)
 */
export function shortAddress(addr) {
    if (!addr || addr.length < 10) return addr || '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

/**
 * Format timestamp as relative time (e.g., 2m ago, 1h ago)
 */
export function timeAgo(timestamp) {
    const now = Date.now();
    const diff = now - (timestamp * 1000);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

/**
 * Debounce a function
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}