export function renderHero() {
    const section = document.createElement('section');
    section.className = 'hero';
    section.setAttribute('aria-label', 'Hero');
    section.innerHTML = `
        <canvas id="heroCanvas" aria-hidden="true"></canvas>
        <div class="hero-content">
            <div class="hero-eyebrow">Autonomous Art on Monad</div>
            <h1 class="hero-title">
                <span class="line1">GLYPH</span>
                <span class="line2 glitch" data-text="GENESIS">GENESIS</span>
            </h1>
            <p class="hero-sub">An autonomous AI agent that generates ASCII art and mints it on-chain \u2014 24/7, no human required.</p>
            <div class="hero-cta">
                <button class="btn btn-primary" data-action="scroll-generator">Generate Art</button>
                <button class="btn btn-outline" data-action="scroll-gallery">View Gallery</button>
                <a href="https://testnet.monadexplorer.com/address/0x3F40E0DB446a891271B9b21535081BD051B5Aa97" target="_blank" rel="noopener noreferrer" class="btn btn-outline">Contract \u2197</a>
            </div>
            <div class="hero-tags">
                <span class="tag">#FourMemeAI</span>
                <span class="tag">#AgenticCommerce</span>
                <span class="tag">#AIArt</span>
                <span class="tag">Monad Testnet</span>
            </div>
        </div>
        <div class="hero-scroll" aria-hidden="true">Scroll</div>
    `;

    section.querySelector('[data-action="scroll-generator"]').addEventListener('click', () => {
        document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
    });
    section.querySelector('[data-action="scroll-gallery"]').addEventListener('click', () => {
        document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
    });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        initMatrixRain(section.querySelector('#heroCanvas'));
    }

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
