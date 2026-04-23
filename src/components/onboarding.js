import { isConnected, connect, onWalletEvent } from '@/wallet.js';
import { showToast } from './toast.js';

const ONBOARDING_KEY = 'glyph_onboarding_done';
const STEP_KEY = 'glyph_onboarding_step';

export function hasCompletedOnboarding() {
    try { return localStorage.getItem(ONBOARDING_KEY) === 'true'; } catch { return false; }
}

export function getOnboardingStep() {
    try { return parseInt(localStorage.getItem(STEP_KEY) || '0'); } catch { return 0; }
}

function setOnboardingStep(step) {
    try { localStorage.setItem(STEP_KEY, String(step)); } catch {}
}

function completeOnboarding() {
    try {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        localStorage.removeItem(STEP_KEY);
    } catch {}
}

// Note: apostrophes use double-quoted strings to avoid JS escape issues
const STEPS = [
    {
        title: 'Welcome to GlyphGenesis',
        desc: 'Create, mint, and trade unique ASCII art on the blockchain. Let us get you started!',
        icon: '🎨',
        action: 'Next'
    },
    {
        title: 'Get Testnet Tokens',
        desc: 'You will need testnet tokens to pay for transactions. Visit the faucet to get free tokens.',
        icon: '💧',
        action: 'Open Faucet',
        link: 'https://testnet.monad.xyz/'
    },
    {
        title: 'Connect Your Wallet',
        desc: 'Connect MetaMask or another wallet to interact with the blockchain.',
        icon: '🔗',
        action: 'Connect Wallet',
        wallet: true
    },
    {
        title: 'Generate Your First Art',
        desc: 'Choose a pattern, pick a theme, and watch your unique ASCII art come to life.',
        icon: '✨',
        action: 'Go to Generator',
        scroll: 'generator'
    },
    {
        title: 'Mint It On-Chain',
        desc: 'Click Mint to permanently record your art on the blockchain. It is yours forever!',
        icon: '⛏️',
        action: 'Got it!'
    },
    {
        title: 'You are All Set!',
        desc: 'Explore the gallery, like art from others, and trade on the marketplace.',
        icon: '🚀',
        action: 'Start Creating'
    }
];

export function renderOnboarding() {
    if (hasCompletedOnboarding()) {
        const section = document.createElement('section');
        section.className = 'section';
        section.id = 'onboarding';
        section.style.display = 'none';
        return section;
    }

    const section = document.createElement('section');
    section.className = 'section onboarding-section';
    section.id = 'onboarding';
    section.setAttribute('aria-labelledby', 'onboarding-title');

    const currentStep = getOnboardingStep();
    const step = STEPS[currentStep];
    const hasMM = typeof window !== 'undefined' && !!window.ethereum;
    const alreadyConnected = isConnected();

    section.innerHTML = `
        <div class=\"onboarding-flow\">
            <div class=\"onboarding-progress\">
                ${STEPS.map((_, i) => `<div class=\"progress-dot ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}\" data-step=\"${i}\"></div>`).join('<div class=\"progress-line\"></div>')}
            </div>
            <div class=\"onboarding-card-lg\">
                <span class=\"onboarding-icon\" aria-hidden=\"true\">${step.icon}</span>
                <h2 class=\"onboarding-title\" id=\"onboarding-title\">${step.title}</h2>
                <p class=\"onboarding-desc\">${step.desc}</p>
                <div class=\"onboarding-actions\">
                    ${currentStep > 0 ? `<button class=\"btn btn-ghost btn-sm\" id=\"backOnboarding\">Back</button>` : ''}
                    <button class=\"btn btn-ghost btn-sm\" id=\"skipOnboarding\">Skip</button>
                    ${step.wallet && alreadyConnected
                        ? `<button class=\"btn btn-primary\" id=\"onboardingAction\">✓ Wallet Connected</button>`
                        : step.wallet && !hasMM
                        ? `<button class=\"btn btn-primary\" id=\"onboardingAction\">Install MetaMask</button>`
                        : `<button class=\"btn btn-primary\" id=\"onboardingAction\">${step.action}</button>`
                    }
                </div>
                ${step.wallet && hasMM && alreadyConnected ? '<div class=\"onboarding-connected\"><span>✓</span> MetaMask connected</div>' : ''}
                ${step.wallet && !hasMM ? '<div style=\"font-size:.75rem;color:var(--muted);margin-top:.5rem;\">MetaMask not detected. <a href=\"https://metamask.io/download/\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"color:var(--accent2);\">Install MetaMask</a> to connect.</div>' : ''}
                <div class=\"onboarding-step-counter\">Step ${currentStep + 1} of ${STEPS.length}</div>
                <div class=\"onboarding-restart\">
                    <button class=\"btn btn-ghost btn-sm\" id=\"restartOnboarding\" style=\"font-size:.68rem;color:var(--muted);\">Restart tour</button>
                </div>
            </div>
        </div>
    `;

    section.querySelector('#skipOnboarding')?.addEventListener('click', () => {
        completeOnboarding();
        section.style.display = 'none';
        showToast('You can always find help in the Protocol section!', 'info');
    });

    section.querySelector('#backOnboarding')?.addEventListener('click', () => {
        const prev = getOnboardingStep() - 1;
        if (prev >= 0) {
            setOnboardingStep(prev);
            rerenderOnboarding(section);
        }
    });

    section.querySelector('#restartOnboarding')?.addEventListener('click', () => {
        resetOnboarding();
        rerenderOnboarding(section);
        showToast('Onboarding restarted!', 'info');
    });

    section.querySelector('#onboardingAction')?.addEventListener('click', async () => {
        const stepData = STEPS[getOnboardingStep()];

        if (stepData.wallet && !hasMM) {
            window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer');
            return;
        }

        if (stepData.link) {
            window.open(stepData.link, '_blank', 'noopener,noreferrer');
        }

        if (stepData.wallet && !isConnected()) {
            try {
                await connect();
                showToast('Wallet connected!', 'success');
            } catch (e) {
                showToast(e.message || 'Connection failed', 'error');
                return;
            }
        }

        if (stepData.scroll) {
            document.getElementById(stepData.scroll)?.scrollIntoView({ behavior: 'smooth' });
        }

        const nextStep = getOnboardingStep() + 1;
        if (nextStep >= STEPS.length) {
            completeOnboarding();
            section.style.display = 'none';
            showToast('Welcome to GlyphGenesis! 🎉', 'success');
        } else {
            setOnboardingStep(nextStep);
            rerenderOnboarding(section);
        }
    });

    // Auto-advance if wallet is already connected (step 2 = connect wallet)
    if (getOnboardingStep() === 2 && isConnected()) {
        setTimeout(() => {
            section.querySelector('#onboardingAction')?.click();
        }, 500);
    }

    return section;
}

function rerenderOnboarding(section) {
    const parent = section.parentNode;
    if (parent) {
        const newSection = renderOnboarding();
        parent.replaceChild(newSection, section);
    }
}

export function resetOnboarding() {
    try {
        localStorage.removeItem(ONBOARDING_KEY);
        localStorage.removeItem(STEP_KEY);
    } catch {}
}