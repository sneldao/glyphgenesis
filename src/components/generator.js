import { generate, parsePrompt } from '@/ascii-generator.mjs';
import { isConnected, getContract, onWalletEvent } from '@/wallet.js';
import { EXPLORER_TX, parseContractError } from '@/contract.js';
import { showToast } from './toast.js';

let animationFrames = [];
let animationIndex = 0;
let animationInterval = null;
let isAnimating = false;
let currentArt = '';

export function renderGenerator() {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 'generator';
    section.setAttribute('aria-labelledby', 'generator-title');
    section.innerHTML = `
        <span class="section-label">// 03 \u2014 Interactive Generator</span>
        <h2 class="section-title" id="generator-title">Create <span>ASCII Art</span></h2>
        <div class="generator-wrap">
            <div class="generator-controls">
                <div>
                    <label class="field-label" for="prompt">Prompt / Text</label>
                    <input type="text" id="prompt" placeholder="MONAD or 'cyberpunk waves 40x15'" value="MONAD" aria-describedby="prompt-hint">
                    <small id="prompt-hint" style="color:var(--muted);font-size:.68rem;display:block;margin-top:5px;">Try: "cyber waves", "cosmic star animated", "diamond 50x20"</small>
                </div>
                <div>
                    <label class="field-label" for="pattern">Pattern</label>
                    <select id="pattern" aria-label="Pattern type">
                        <option value="circles">Circles \u2014 Concentric</option>
                        <option value="waves">Waves \u2014 Sine</option>
                        <option value="diamond">Diamond \u2014 Manhattan</option>
                        <option value="grid">Grid \u2014 Structured</option>
                        <option value="noise">Noise \u2014 Random</option>
                        <option value="star">Star \u2014 Twinkling</option>
                        <option value="spiral">Spiral \u2014 Logarithmic</option>
                        <option value="heart">Heart \u2014 Shape</option>
                    </select>
                </div>
                <div>
                    <label class="field-label" for="theme">Theme</label>
                    <select id="theme" aria-label="Visual theme">
                        <option value="simple">Simple</option>
                        <option value="cyberpunk">Cyberpunk</option>
                        <option value="retro">Retro 80s</option>
                        <option value="cosmic">Cosmic</option>
                        <option value="ocean">Ocean</option>
                        <option value="forest">Forest</option>
                        <option value="brutalist">Brutalist</option>
                    </select>
                </div>
                <div class="animate-row">
                    <label><input type="checkbox" id="animateToggle"> Animate</label>
                    <div class="playback-btns" id="playbackControls">
                        <button type="button" id="playBtn" aria-label="Play animation">\u25B6 Play</button>
                        <button type="button" id="pauseBtn" aria-label="Pause animation">\u23F8 Pause</button>
                        <span id="frameCounter">Frame: 1</span>
                    </div>
                </div>
                <button type="button" class="gen-btn" id="generateBtn">Generate</button>
                <button type="button" class="gen-btn outline" id="randomizeBtn">Randomize</button>
            </div>
            <div class="generator-output">
                <div class="output-label" aria-hidden="true">ASCII Output</div>
                <div id="output" role="img" aria-label="Generated ASCII art output">Click [ Generate ] to create your masterpiece...</div>
                <div class="output-actions">
                    <button type="button" class="btn btn-ghost" id="copyBtn" aria-label="Copy art to clipboard">\uD83D\uDCCB Copy</button>
                    <button type="button" class="btn btn-ghost" id="downloadBtn" aria-label="Download art as text file">\uD83D\uDCBE Download</button>
                    <button type="button" class="btn btn-ghost" id="shareBtn" aria-label="Share on Twitter">\uD83D\uDC26 Share</button>
                </div>
                <button type="button" class="btn btn-mint" id="mintBtn" disabled>Mint on Monad \u2014 Connect Wallet First</button>
                <div id="mintStatus"></div>
            </div>
        </div>
    `;

    section.querySelector('#generateBtn').addEventListener('click', generateArt);
    section.querySelector('#randomizeBtn').addEventListener('click', randomize);
    section.querySelector('#animateToggle').addEventListener('change', generateArt);
    section.querySelector('#playBtn').addEventListener('click', playAnimation);
    section.querySelector('#pauseBtn').addEventListener('click', pauseAnimation);
    section.querySelector('#copyBtn').addEventListener('click', copyToClipboard);
    section.querySelector('#downloadBtn').addEventListener('click', downloadArt);
    section.querySelector('#shareBtn').addEventListener('click', shareOnTwitter);
    section.querySelector('#mintBtn').addEventListener('click', mintArt);
    section.querySelector('#prompt').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') generateArt();
    });

    onWalletEvent((event) => {
        if (event === 'connect') updateMintButton(true);
        if (event === 'disconnect') updateMintButton(false);
    });

    return section;
}

function updateMintButton(connected) {
    const btn = document.getElementById('mintBtn');
    if (!btn) return;
    btn.disabled = !connected;
    btn.textContent = connected ? 'Mint This Art on Monad' : 'Mint on Monad \u2014 Connect Wallet First';
}

function generateArt() {
    const promptInput = document.getElementById('prompt')?.value || 'MONAD';
    const patternSelect = document.getElementById('pattern')?.value || 'circles';
    const themeSelect = document.getElementById('theme')?.value || 'simple';
    const animate = document.getElementById('animateToggle')?.checked || false;
    const output = document.getElementById('output');
    if (!output) return;

    pauseAnimation();

    const parsed = parsePrompt(promptInput);
    const pattern = parsed.pattern || patternSelect;
    const theme = parsed.theme || themeSelect;
    const animated = parsed.animated || animate;

    const detected = [];
    if (parsed.pattern) detected.push('pattern: ' + parsed.pattern);
    if (parsed.theme) detected.push('theme: ' + parsed.theme);
    if (parsed.animated) detected.push('animated');
    const detectionMsg = detected.length > 0 ? ` (detected: ${detected.join(', ')})` : '';

    try {
        if (animated) {
            const frameCount = 8;
            animationFrames = [];
            for (let i = 0; i < frameCount; i++) {
                animationFrames.push(
                    generate(promptInput, {
                        type: parsed.type || 'pattern',
                        pattern, theme,
                        width: parsed.width || 40,
                        height: parsed.height || 15,
                        framed: true,
                        time: i / frameCount,
                    })
                );
            }
            animationIndex = 0;
            currentArt = animationFrames[0];
            output.textContent = currentArt;
            const controls = document.getElementById('playbackControls');
            if (controls) controls.style.display = 'flex';
            const counter = document.getElementById('frameCounter');
            if (counter) counter.textContent = `Frame: 1/${frameCount}`;
            showToast(`Generated ${frameCount} animation frames!${detectionMsg}`, 'success');
        } else {
            currentArt = generate(promptInput, {
                type: parsed.type || 'pattern',
                pattern, theme,
                width: parsed.width || 40,
                height: parsed.height || 15,
                framed: true,
            });
            output.textContent = currentArt;
            const controls = document.getElementById('playbackControls');
            if (controls) controls.style.display = 'none';
            showToast(`Art generated with ${theme} theme!${detectionMsg}`, 'success');
        }
    } catch(error) {
        console.error(error);
        output.textContent = 'Failed to generate art. Please try again.';
        showToast(`Generation failed: ${error.message}`, 'error');
    }
}

function randomize() {
    const patterns = ['circles', 'waves', 'diamond', 'grid', 'noise', 'star', 'spiral', 'heart'];
    const themes = ['simple', 'cyberpunk', 'retro', 'cosmic', 'ocean', 'forest', 'brutalist'];
    const patternEl = document.getElementById('pattern');
    const themeEl = document.getElementById('theme');
    if (patternEl) patternEl.value = patterns[Math.floor(Math.random() * patterns.length)];
    if (themeEl) themeEl.value = themes[Math.floor(Math.random() * themes.length)];
    generateArt();
}

function playAnimation() {
    if (animationFrames.length === 0) { showToast('Generate animated art first!', 'error'); return; }
    if (isAnimating) return;
    isAnimating = true;
    animationInterval = setInterval(() => {
        animationIndex = (animationIndex + 1) % animationFrames.length;
        currentArt = animationFrames[animationIndex];
        const output = document.getElementById('output');
        if (output) output.textContent = currentArt;
        const counter = document.getElementById('frameCounter');
        if (counter) counter.textContent = `Frame: ${animationIndex + 1}/${animationFrames.length}`;
    }, 200);
    showToast('Animation started!', 'success');
}

function pauseAnimation() {
    if (animationInterval) { clearInterval(animationInterval); animationInterval = null; }
    isAnimating = false;
}

function copyToClipboard() {
    const text = currentArt || document.getElementById('output')?.textContent;
    if (!text) return;
    navigator.clipboard.writeText(text)
        .then(() => showToast('Copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy', 'error'));
}

function downloadArt() {
    const text = currentArt || document.getElementById('output')?.textContent;
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'glyphgenesis-art.txt';
    a.click();
    URL.revokeObjectURL(a.href);
    showToast('Downloaded!', 'success');
}

function shareOnTwitter() {
    const text = encodeURIComponent('I just created ASCII art on GlyphGenesis! \uD83C\uDFA8\n\nTry it: https://sneldao.github.io/glyphgenesis/\n\n#FourMemeAI #AIArt');
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
}

async function mintArt() {
    if (!isConnected()) { showToast('Please connect your wallet first', 'warning'); return; }
    const contract = getContract();
    if (!contract) { showToast('Wallet not connected', 'error'); return; }

    const prompt = document.getElementById('prompt')?.value || 'MONAD';
    const pattern = document.getElementById('pattern')?.value || 'circles';
    const art = currentArt || document.getElementById('output')?.textContent;
    const statusDiv = document.getElementById('mintStatus');
    const mintBtn = document.getElementById('mintBtn');

    if (!art || art.startsWith('Click')) { showToast('Generate some art first!', 'warning'); return; }

    try {
        if (mintBtn) { mintBtn.disabled = true; mintBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Processing...'; }
        if (statusDiv) statusDiv.innerHTML = '<div class="status-message loading"><span class="spinner" aria-hidden="true"></span>Sending transaction to contract...</div>';
        showToast('Initiating mint transaction...', 'info');

        const tx = await contract.createArtwork(art, `${prompt} - ${pattern}`, `Generated with ${pattern} pattern`);
        if (statusDiv) statusDiv.innerHTML = '<div class="status-message loading"><span class="spinner" aria-hidden="true"></span>Mining transaction...</div>';

        const receipt = await tx.wait();
        if (statusDiv) statusDiv.innerHTML = `<div class="status-message success">\u2713 Minted successfully! <a href="${EXPLORER_TX(receipt.hash)}" target="_blank" rel="noopener noreferrer" style="color:var(--accent2);margin-left:8px;">View TX \u2192</a></div>`;
        showToast('Artwork minted successfully!', 'success');
        window.dispatchEvent(new CustomEvent('gallery:refresh'));
    } catch(error) {
        console.error(error);
        const msg = parseContractError(error);
        if (statusDiv) statusDiv.innerHTML = `<div class="status-message error">\u2717 ${msg}</div>`;
        showToast(`Minting failed: ${msg}`, 'error');
    } finally {
        if (mintBtn) { mintBtn.disabled = false; mintBtn.textContent = 'Mint This Art on Monad'; }
    }
}
