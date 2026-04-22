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

const STEPS = [
  {
    title: 'Welcome to GlyphGenesis',
    desc: 'Create, mint, and trade unique ASCII art on the Monad blockchain. Let\'s get you started!',
    icon: '🎨',
    action: 'Next'
  },
  {
    title: 'Get Testnet MON',
    desc: 'You\'ll need MON to pay for transactions. Visit the Monad faucet to get free testnet tokens.',
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
    desc: 'Choose a pattern, pick a theme, and watch your unique ASCII art come to life. Each piece is one-of-a-kind!',
    icon: '✨',
    action: 'Go to Generator',
    scroll: 'generator'
  },
  {
    title: 'Mint It On-Chain',
    desc: 'Click "Mint on Monad" to permanently record your art on the blockchain. It\'s yours forever!',
    icon: '⛏️',
    action: 'Got it!'
  },
  {
    title: 'You\'re All Set!',
    desc: 'Explore the gallery, like art from others, and trade on the marketplace. Welcome to the GlyphGenesis community!',
    icon: '🚀',
    action: 'Start Creating'
  }
];

export function renderOnboarding() {
  // Don't show if already completed
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

  section.innerHTML = `
    <div class="onboarding-flow">
      <div class="onboarding-progress">
        ${STEPS.map((_, i) => `<div class="progress-dot ${i <= currentStep ? 'active' : ''} ${i === currentStep ? 'current' : ''}" data-step="${i}"></div>`).join('<div class="progress-line"></div>')}
      </div>
      <div class="onboarding-card-lg">
        <span class="onboarding-icon" aria-hidden="true">${STEPS[currentStep].icon}</span>
        <h2 class="onboarding-title" id="onboarding-title">${STEPS[currentStep].title}</h2>
        <p class="onboarding-desc">${STEPS[currentStep].desc}</p>
        <div class="onboarding-actions">
          <button class="btn btn-ghost btn-sm" id="skipOnboarding">Skip</button>
          <button class="btn btn-primary" id="onboardingAction">${STEPS[currentStep].action}</button>
        </div>
        <div class="onboarding-step-counter">Step ${currentStep + 1} of ${STEPS.length}</div>
      </div>
    </div>
  `;

  // Wire up buttons
  section.querySelector('#skipOnboarding')?.addEventListener('click', () => {
    completeOnboarding();
    section.style.display = 'none';
    showToast('You can always find help in the Protocol section!', 'info');
  });

  section.querySelector('#onboardingAction')?.addEventListener('click', async () => {
    const step = STEPS[getOnboardingStep()];

    // Handle special actions
    if (step.link) {
      window.open(step.link, '_blank', 'noopener,noreferrer');
    }

    if (step.wallet && !isConnected()) {
      try {
        await connect();
        showToast('Wallet connected!', 'success');
      } catch (e) {
        showToast(e.message || 'Connection failed', 'error');
        return; // Don't advance on failure
      }
    }

    if (step.scroll) {
      document.getElementById(step.scroll)?.scrollIntoView({ behavior: 'smooth' });
    }

    // Advance step
    const nextStep = getOnboardingStep() + 1;
    if (nextStep >= STEPS.length) {
      completeOnboarding();
      section.style.display = 'none';
      showToast('Welcome to GlyphGenesis! 🎉', 'success');
    } else {
      setOnboardingStep(nextStep);
      // Re-render this section
      const parent = section.parentNode;
      if (parent) {
        const newSection = renderOnboarding();
        parent.replaceChild(newSection, section);
      }
    }
  });

  // Listen for wallet connect to auto-advance step 2
  onWalletEvent((event) => {
    if (event === 'connect' && getOnboardingStep() === 2) {
      const actionBtn = section.querySelector('#onboardingAction');
      if (actionBtn) actionBtn.click();
    }
  });

  return section;
}

export function resetOnboarding() {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
    localStorage.removeItem(STEP_KEY);
  } catch {}
}
