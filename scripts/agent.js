import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { generate, parsePrompt } from '../src/ascii-generator.mjs';
import { AIGenerator } from '../src/ai-generator.mjs';
import { X402Client } from '../src/x402.mjs';
import { SocialPoster } from '../src/social.mjs';
import { AgentMemory } from '../src/memory.mjs';

dotenv.config();

const RPC = process.env.RPC_URL || process.env.MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz/';
const CONTRACT = process.env.CONTRACT_ADDRESS || '0x3F40E0DB446a891271B9b21535081BD051B5Aa97';
const INTERVAL = parseInt(process.env.AGENT_INTERVAL_MS || '60000');
const PATTERNS = ['circles', 'waves', 'diamond', 'grid', 'noise', 'star', 'spiral', 'heart'];
const THEMES = ['simple', 'cyberpunk', 'retro', 'brutalist', 'cosmic', 'ocean', 'forest'];

const ABI = [
  'function createArtwork(string,string,string) external returns (uint256)',
  'function totalArtworks() external view returns (uint256)',
  'function getArtwork(uint256) external view returns (address,address,string,string,string,uint256,uint256,bool,uint256)',
  'function getRecentArtworks(uint256) external view returns (uint256[])',
  'function likeArtwork(uint256) external',
  'function setForSale(uint256,uint256) external',
  'function buyArtwork(uint256) external payable'
];

/**
 * GlyphGenesis Agent
 * Autonomous AI agent that generates glyphs and trades on-chain
 * 
 * Features:
 * - LLM-style prompt parsing
 * - Theme-based generation
 * - Persistent memory
 * - Adaptive strategy
 * - Social engagement
 */
class GlyphAgent {
  constructor() {
    if (!process.env.PRIVATE_KEY) {
      console.error('PRIVATE_KEY not set. Copy .env.example to .env and configure.');
      process.exit(1);
    }
    const provider = new ethers.JsonRpcProvider(RPC);
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    this.contract = new ethers.Contract(CONTRACT, ABI, this.wallet);
    this.address = this.wallet.address;

    // Initialize x402 payments
    this.x402 = new X402Client(this.wallet);
    
    // Initialize social poster
    this.social = new SocialPoster({
      farcaster: process.env.FARCASTER_MNEMONIC,
      moltbook: process.env.MOLTBOOK_API_KEY
    });

    // Initialize AI generator (real LLM or fallback)
    this.ai = new AIGenerator(process.env.OPENAI_API_KEY);
    this.log('AI', `AI generation ${this.ai.isEnabled() ? 'ENABLED' : 'disabled (using fallback)'}`);

    // Memory - persists across cycles but not restarts
    this.minted = [];
    this.liked = new Set();
    this.patternsUsed = {};
    this.totalMinted = 0;
    this.cycle = 0;
    this.lastSocialPost = 0;
    this.totalSpent = 0;
    this.lastPrompt = null;
    this.cliOverride = null;
    PATTERNS.forEach(p => this.patternsUsed[p] = 0);
  }

  log(action, msg) {
    console.log(`[${new Date().toISOString()}] [${action}] ${msg}`);
  }

  // OBSERVE: gather chain state + social state
  async observe() {
    const state = {};
    try {
      state.totalArtworks = Number(await this.contract.totalArtworks());
      const count = Math.min(state.totalArtworks, 10);
      state.recent = [];

      if (count > 0) {
        const ids = await this.contract.getRecentArtworks(count);
        for (const id of ids) {
          try {
            const [creator, owner, content, title, prompt, timestamp, price, forSale, likes] =
              await this.contract.getArtwork(id);
            state.recent.push({
              id: Number(id), creator, owner, title, 
              likes: Number(likes), forSale, 
              price: forSale ? ethers.formatEther(price) : '0',
              isMine: creator.toLowerCase() === this.address.toLowerCase()
            });
          } catch { /* skip */ }
        }
      }

      state.balance = ethers.formatEther(await this.wallet.provider.getBalance(this.address));
      state.paymentHistory = this.x402.getPaymentHistory();
      state.totalSpent = this.totalSpent;
    } catch (e) {
      this.log('OBSERVE', `Error: ${e.message}`);
      state.error = true;
    }

    return state;
  }

  // DECIDE: choose action based on state + memory + goals
  decide(state) {
    if (state.error) return { action: 'wait', reason: 'observation failed' };

    const myArt = state.recent.filter(a => a.isMine);
    const othersArt = state.recent.filter(a => !a.isMine);
    const unliked = othersArt.filter(a => !this.liked.has(a.id) && a.likes < 3);
    const balance = parseFloat(state.balance);

    // Critical low balance — emergency wait
    if (balance < 0.005) {
      return { action: 'wait', reason: 'critical low balance, need faucet' };
    }

    // Low balance — conserve, only social actions
    if (balance < 0.01) {
      if (unliked.length > 0) return { action: 'like', target: unliked[0], reason: 'low balance, engage socially' };
      return { action: 'wait', reason: 'low balance, conserving' };
    }

    // Haven't minted yet or gallery is empty — mint first
    if (this.totalMinted === 0 || state.totalArtworks === 0) {
      return { action: 'mint', reason: 'bootstrapping gallery' };
    }

    // Post to social media every 5 mints
    if (this.totalMinted > 0 && this.totalMinted % 5 === 0 && Date.now() - this.lastSocialPost > 300000) {
      return { action: 'social', reason: 'sharing recent work with community' };
    }

    // Like others' work before minting more (be social first)
    if (unliked.length > 0 && this.cycle % 2 === 0) {
      const best = unliked.reduce((a, b) => a.likes > b.likes ? a : b);
      return { action: 'like', target: best, reason: `engaging with "${best.title}" (${best.likes} likes)` };
    }

    // List unsold art for sale if we have some
    const myUnsold = myArt.filter(a => !a.forSale);
    if (myUnsold.length > 0 && this.totalMinted > 1 && this.cycle % 5 === 0) {
      return { action: 'list', target: myUnsold[0], reason: 'listing art for marketplace activity' };
    }

    // Buy affordable art from others
    const forSale = othersArt.filter(a => a.forSale && parseFloat(a.price) < balance * 0.1);
    if (forSale.length > 0 && this.cycle % 7 === 0) {
      const pick = forSale.reduce((a, b) => a.likes > b.likes ? a : b);
      return { action: 'buy', target: pick, reason: `buying popular art "${pick.title}" for ${pick.price} MON` };
    }

    // Make micropayment for API service (demonstrates x402)
    if (this.cycle % 10 === 0 && balance > 0.1) {
      return { action: 'pay', reason: 'x402 micropayment for agent service' };
    }

    // Mint with least-used pattern (explore diversity)
    return { action: 'mint', reason: 'expanding collection with underused pattern' };
  }

  // Pick pattern we've used least
  pickPattern() {
    const sorted = Object.entries(this.patternsUsed).sort((a, b) => a[1] - b[1]);
    return sorted[0][0];
  }

  // ACT: execute the decision
  async act(decision) {
    this.log('DECIDE', `${decision.action} — ${decision.reason}`);

    try {
      switch (decision.action) {
        case 'mint': {
          const pattern = this.pickPattern();
          const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
          let art, prompt;

          // Use AI if available, otherwise fallback
          if (this.ai.isEnabled()) {
            const aiPrompt = `Create a ${theme} style ASCII art of ${pattern} pattern`;
            const result = await this.ai.generate(aiPrompt, { width: 40, height: 15, theme });
            art = result.content;
            prompt = result.prompt;
          } else {
            // Fallback to pattern generator
            art = generate(pattern, { type: 'pattern', pattern, width: 40, height: 15, theme });
            prompt = `Autonomous agent — ${pattern} pattern`;
          }

          const title = `${pattern} #${this.totalMinted + 1}`;
          this.log('MINT', `Creating "${title}" with ${this.ai.isEnabled() ? 'AI-generated' : pattern} pattern...`);
          const tx = await this.contract.createArtwork(art, title, prompt);
          const receipt = await tx.wait();
          
          this.totalMinted++;
          this.patternsUsed[pattern]++;
          this.minted.push({ title, pattern, tx: tx.hash });
          this.log('MINT', `Success! TX: ${tx.hash}`);
          
          // Post to social about new mint
          try {
            await this.social.postMint({ title, pattern, txHash: tx.hash });
            this.log('SOCIAL', `Posted about mint to social channels`);
          } catch (e) {
            this.log('SOCIAL', `Post failed (non-critical): ${e.message}`);
          }
          
          break;
        }

        case 'like': {
          const { target } = decision;
          this.log('LIKE', `Liking #${target.id} "${target.title}"...`);
          const tx = await this.contract.likeArtwork(target.id);
          await tx.wait();
          this.liked.add(target.id);
          this.log('LIKE', `Liked #${target.id}`);
          break;
        }

        case 'list': {
          const { target } = decision;
          const price = ethers.parseEther('0.01');
          this.log('LIST', `Listing #${target.id} "${target.title}" for 0.01 MON...`);
          const tx = await this.contract.setForSale(target.id, price);
          await tx.wait();
          this.log('LIST', `Listed #${target.id}`);
          break;
        }

        case 'buy': {
          const { target } = decision;
          const price = ethers.parseEther(target.price);
          this.log('BUY', `Buying #${target.id} "${target.title}" for ${target.price} MON...`);
          const tx = await this.contract.buyArtwork(target.id, { value: price });
          await tx.wait();
          this.totalSpent += parseFloat(target.price);
          this.log('BUY', `Bought #${target.id}`);
          break;
        }

        case 'pay': {
          // Demonstrate x402 micropayment
          // In production, this would pay for an actual API service
          const paymentAmount = ethers.parseEther('0.001');
          this.log('PAY', `x402 micropayment: 0.001 MON for agent services...`);
          
          // For demo, we pay ourselves (or could pay a service address)
          const serviceAddress = process.env.SERVICE_ADDRESS || this.address;
          const payment = await this.x402.sendPayment(serviceAddress, paymentAmount, 'MON');
          
          this.totalSpent += 0.001;
          this.log('PAY', `x402 payment complete: ${payment.txHash}`);
          break;
        }

        case 'social': {
          this.log('SOCIAL', 'Posting agent status update...');
          try {
            const result = await this.social.postStatus({
              minted: this.totalMinted,
              liked: this.liked.size,
              balance: await this.wallet.provider.getBalance(this.address).then(b => ethers.formatEther(b))
            });
            this.lastSocialPost = Date.now();
            this.log('SOCIAL', `Posted status: ${result}`);
          } catch (e) {
            this.log('SOCIAL', `Post failed: ${e.message}`);
          }
          break;
        }

        case 'wait':
          this.log('WAIT', 'Skipping this cycle.');
          break;
      }
    } catch (e) {
      this.log('ERROR', `${decision.action} failed: ${e.message}`);
    }
  }

  // Print agent state summary
  printStatus(state) {
    console.log('\n--- Agent Status ---');
    console.log(`Address:  ${this.address}`);
    console.log(`Balance:  ${state.balance} MON`);
    console.log(`Cycle:    ${this.cycle}`);
    console.log(`Minted:   ${this.totalMinted}`);
    console.log(`Liked:    ${this.liked.size}`);
    console.log(`Spent:    ${this.totalSpent.toFixed(4)} MON`);
    console.log(`x402:     ${state.paymentHistory?.length || 0} payments`);
    console.log(`Patterns: ${JSON.stringify(this.patternsUsed)}`);
    console.log(`On-chain: ${state.totalArtworks} total artworks`);
    console.log('--------------------\n');
  }

  // Main loop: observe → decide → act
  async run() {
    this.log('START', `Agent starting (interval: ${INTERVAL / 1000}s)`);
    this.log('START', `Address: ${this.address}`);
    this.log('START', `x402 payments: enabled`);
    this.log('START', `Social posting: enabled`);

    // Parse CLI args for natural language commands
    this.parseCLIArgs();

    const tick = async () => {
      this.cycle++;
      
      // Check for CLI override command
      if (this.cliOverride) {
        const override = this.cliOverride;
        delete this.cliOverride; // Clear after use
        
        if (override.action === 'wait' && override.reason === 'help shown') {
          return; // Help was shown, don't do anything
        }
        
        // Execute CLI command immediately
        const state = await this.observe();
        this.printStatus(state);
        
        if (override.prompt) {
          // Use the prompt for generation
          this.lastPrompt = override.prompt;
        }
        
        await this.act(override);
        return;
      }
      
      const state = await this.observe();
      if (!state.error) this.printStatus(state);
      const decision = this.decide(state);
      await this.act(decision);
    };

    await tick();
    setInterval(tick, INTERVAL);
  }

  // Parse CLI arguments for natural language commands
  parseCLIArgs() {
    const args = process.argv.slice(2);
    if (args.length === 0) return;

    const command = args.join(' ').toLowerCase();
    this.log('CLI', `Received command: "${command}"`);

    // Command patterns
    if (command.includes('mint') || command.includes('generate') || command.includes('create')) {
      this.log('CLI', 'Command: MINT - Will generate and mint artwork');
      this.cliOverride = { action: 'mint', reason: 'CLI command' };
    }
    else if (command.includes('like')) {
      this.log('CLI', 'Command: LIKE - Will like recent artwork');
      this.cliOverride = { action: 'like', reason: 'CLI command' };
    }
    else if (command.includes('status') || command.includes('stats')) {
      this.log('CLI', 'Command: STATUS - Will display agent status');
      this.cliOverride = { action: 'status', reason: 'CLI command' };
    }
    else if (command.includes('social') || command.includes('post')) {
      this.log('CLI', 'Command: SOCIAL - Will post to social media');
      this.cliOverride = { action: 'social', reason: 'CLI command' };
    }
    else if (command.includes('balance') || command.includes('wallet')) {
      this.log('CLI', 'Command: BALANCE - Will check wallet balance');
      this.cliOverride = { action: 'balance', reason: 'CLI command' };
    }
    else if (command.includes('help')) {
      this.log('CLI', 'Available commands: mint, like, status, social, balance, help');
      console.log(`
🤖 GlyphGenesis Agent CLI Commands:

  npm run agent mint          - Generate and mint new artwork
  npm run agent like          - Like community artworks  
  npm run agent status        - Show agent status
  npm run agent social        - Post to social media
  npm run agent balance       - Check wallet balance
  npm run agent help          - Show this help

  Or with natural language:
  npm run agent "create something cool"
  npm run agent "post an update"
      `);
      this.cliOverride = { action: 'wait', reason: 'help shown' };
    }
    else {
      // Try to parse as a prompt for generation
      this.log('CLI', `Prompt detected: "${command}"`);
      this.cliOverride = { action: 'mint', prompt: command, reason: 'CLI prompt' };
    }
  }
}

const agent = new GlyphAgent();
agent.run().catch(console.error);
