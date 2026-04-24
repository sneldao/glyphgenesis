import { showToast } from './toast.js';

const COMMANDS = [
    { id: 'gen', label: 'Jump to Generator', icon: '🎨', action: () => scrollTo('generator') },
    { id: 'gal', label: 'Jump to Gallery', icon: '🖼️', action: () => scrollTo('gallery') },
    { id: 'agent', label: 'Jump to Agent Panel', icon: '🤖', action: () => scrollTo('agent') },
    { id: 'rand', label: 'Generate Random Art', icon: '✨', action: () => triggerRandomGen() },
    { id: 'connect', label: 'Connect Wallet', icon: '🔗', action: () => document.getElementById('walletBtn')?.click() },
    { id: 'theme', label: 'Toggle High Contrast', icon: '🌗', action: () => toggleContrast() },
];

let isOpen = false;
let activeIndex = 0;
let filteredCommands = [...COMMANDS];

export function initCommandPalette() {
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            togglePalette();
        }
        if (e.key === 'Escape' && isOpen) {
            closePalette();
        }
    });
}

function togglePalette() {
    if (isOpen) closePalette();
    else openPalette();
}

function openPalette() {
    isOpen = true;
    activeIndex = 0;
    filteredCommands = [...COMMANDS];
    
    const overlay = document.createElement('div');
    overlay.className = 'cmd-palette';
    overlay.id = 'cmdPalette';
    overlay.innerHTML = `
        <div class="cmd-box">
            <input type="text" class="cmd-input" id="cmdInput" placeholder="Type a command (e.g. 'gen', 'random')..." autocomplete="off">
            <div class="cmd-list" id="cmdList"></div>
            <div style="padding: .6rem 1.2rem; border-top: 1px solid var(--border); font-size: .62rem; color: var(--muted); display: flex; gap: 1rem;">
                <span><span class="cmd-key">↑↓</span> to navigate</span>
                <span><span class="cmd-key">Enter</span> to select</span>
                <span><span class="cmd-key">Esc</span> to close</span>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    const input = overlay.querySelector('#cmdInput');
    input.focus();

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filteredCommands = COMMANDS.filter(c => 
            c.label.toLowerCase().includes(query) || c.id.includes(query)
        );
        activeIndex = 0;
        renderList();
    });

    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % filteredCommands.length;
            renderList();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + filteredCommands.length) % filteredCommands.length;
            renderList();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[activeIndex]) {
                filteredCommands[activeIndex].action();
                closePalette();
            }
        }
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePalette();
    });

    renderList();
}

function closePalette() {
    const palette = document.getElementById('cmdPalette');
    if (palette) palette.remove();
    isOpen = false;
}

function renderList() {
    const list = document.getElementById('cmdList');
    if (!list) return;

    if (filteredCommands.length === 0) {
        list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--muted); font-size: .8rem;">No commands found.</div>';
        return;
    }

    list.innerHTML = filteredCommands.map((cmd, i) => `
        <div class="cmd-item ${i === activeIndex ? 'active' : ''}" data-index="${i}">
            <div style="display: flex; align-items: center; gap: .75rem;">
                <span>${cmd.icon}</span>
                <span>${cmd.label}</span>
            </div>
            <span class="cmd-key">${cmd.id}</span>
        </div>
    `).join('');

    list.querySelectorAll('.cmd-item').forEach(item => {
        item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.index);
            filteredCommands[idx].action();
            closePalette();
        });
    });
}

function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function triggerRandomGen() {
    scrollTo('generator');
    setTimeout(() => {
        document.getElementById('randomizeBtn')?.click();
    }, 500);
}

function toggleContrast() {
    document.body.classList.toggle('high-contrast');
    showToast('High contrast mode toggled', 'info');
}
