import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { generate, parsePrompt } from '../src/ascii-generator.mjs';
import { AIGenerator } from '../src/ai-generator.mjs';
import { X402Client } from '../src/x402.mjs';
import { AgentMemory } from '../src/memory.mjs';

dotenv.config();

const RPC = process.env.RPC_URL || process.env.MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz/';
const CONTRACT = process.env.CONTRACT_ADDRESS || '0x3F40E0DB446a891271B9b21535081BD051B5Aa97';
const INTERVAL = parseInt(process.env.AGENT_INTERVAL_MS || '60000');
const PATTERNS = ['circles', 'waves', 'diamond', 'grid', 'noise', 'star', 'spiral', 'heart'];
const THEMES = ['simple', 'cyberpunk', 'retro', 'brutalist', 'cosmic', 'ocean', 'forest'];

const ABI = [
  'function createArtwork(string,string,string) external returns (uint256)',
  'function batchCreateArtwork(string[],string[],string[]) external returns (uint256[])',
  'function totalArtworks() external view returns (uint256)',
  'function getArtwork(uint256) external view returns (address,address,string,string,string,uint256,uint256,bool,uint256)',
  'function getRecentArtworks(uint256) external view returns (uint256[])',
  'function getCreatorArtworks(address) external view returns (uint256[])',
  'function likeArtwork(uint256) external',
  'function setForSale(uint256,uint256) external',
  'function buyArtwork(uint256) external payable',
  'function getRoyaltyInfo(uint256) external view returns (address,uint256,uint256)',
  'function ROYALTY_PERCENT() external view returns (uint256)',
  'event ArtworkCreated(uint256 indexed id, address indexed creator, string title)',
  'event ArtworkLiked(uint256 indexed id, address indexed liker)',
  'event ArtworkTransferred(uint256 indexed id, address indexed from, address indexed to)',
];

/**
 * GlyphGenesis Agent v2
 * Autonomous AI agent with persistent memory, market-responsive strategy, and learning
 *
 * Features:
 * - LLM-style prompt parsing
 * - Theme-based generation
 * - Persistent memory (survives restarts)
 * - Adaptive market-responsive strategy
 * - Learning from outcomes
 * - Social engagement
 * - Royalty-aware pricing
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

    // Initialize persistent memory
    this.memory = new AgentMemory(this.address);
    const savedState = this.memory.load();
    this.minted = savedState.minted || [];
    this.liked = new Set(savedState.liked || []);
    this.patternsUsed = savedState.patternsUsed || {};
    this.themesUsed = savedState.themesUsed || {};
    this.totalMinted = savedState.totalMinted || 0;
    this.cycle = savedState.cycle || 0;
    this.lastSocialPost = savedState.lastSocialPost || 0;
    this.totalSpent = savedState.totalSpent || 0;
    this.learnings = savedState.learnings || [];
    this.preferences = savedState.preferences || {};

    // Market-responsive state
    this.marketState = {
      avgPrice: 0,
      totalListed: 0,
      totalLikes: 0,
      lastAnalysis: 0,
      priceHistory: [],
      hotPatterns: [],
      hotThemes: [],
    };

    // Ensure all patterns have a count
    PATTERNS.forEach(p => {
      if (!(p in this.patternsUsed)) this.patternsUsed[p] = 0;
    });
    THEMES.forEach(t => {
      if (!(t in this.themesUsed)) this.themesUsed[t] = 0;
    });

    this.cliOverride = null;

    this.log('MEMORY', `Loaded ${this.minted.length} mints, ${this.liked.size} likes, ${this.learnings.length} learnings from persistent state`);
  }

  log(action, msg) {
    console.log(`[${new Date().toISOString()}] [${action}] ${msg}`);
  }

  // OBSERVE: gather chain state + social state + market data
  async observe() {
    const state = {};
    try {
      state.totalArtworks = Number(await this.contract.totalArtworks());
      const count = Math.min(state.totalArtworks, 20);
      state.recent = [];

      if (count > 0) {
        const ids = await this.contract.getRecentArtworks(count);
        for (const id of ids) {
          try {
            const [creator, owner, content, title, prompt, timestamp, price, forSale, likes] =
              await this.contract.getArtwork(id);
            state.recent.push({
              id: Number(id), creator, owner, title, prompt,
              likes: Number(likes), forSale,
              price: forSale ? ethers.formatEther(price) : '0',
              isMine: creator.toLowerCase() === this.address.toLowerCase(),
              timestamp: Number(timestamp),
            });
          } catch { /* skip */ }
        }
      }

      state.balance = ethers.formatEther(await this.wallet.provider.getBalance(this.address));
      state.paymentHistory = this.x402.getPaymentHistory();
      state.totalSpent = this.totalSpent;

      // Analyze market data
      this._analyzeMarket(state);
    } catch (e) {
      this.log('OBSERVE', `Error: ${e.message}`);
      state.error = true;
    }

    return state;
  }

  // Market analysis: compute averages, detect trends, identify hot patterns/themes
  _analyzeMarket(state) {
    if (!state.recent || state.recent.length === 0) return;

    const listed = state.recent.filter(a => a.forSale);
    const totalLikes = state.recent.reduce((sum, a) => sum + a.likes, 0);

    this.marketState.totalListed = listed.length;
    this.marketState.totalLikes = totalLikes;
    this.marketState.avgPrice = listed.length > 0
      ? listed.reduce((sum, a) => sum + parseFloat(a.price), 0) / listed.length
      : 0;
    this.marketState.lastAnalysis = Date.now();

    // Detect hot patterns/themes from recent popular art
    const popular = state.recent.filter(a => a.likes >= 2);
    this.marketState.hotPatterns = [...new Set(popular.map(a => {
      const match = a.prompt?.match(/(\w+) pattern/);
      return match ? match[1] : null;
    }).filter(Boolean))];

    this.marketState.hotThemes = [...new Set(popular.map(a => {
      const match = a.prompt?.match(/(\w+) theme/);
      return match ? match[1] : null;
    }).filter(Boolean))];

    // Track price history for trending
    if (listed.length > 0) {
      this.marketState.priceHistory.push({
        avg: this.marketState.avgPrice,
        listed: listed.length,
        ts: Date.now()
      });
      // Keep last 20 data points
      if (this.marketState.priceHistory.length > 20) {
        this.marketState.priceHistory = this.marketState.priceHistory.slice(-20);
      }
    }
  }

  // DECIDE: choose action based on state + memory + market + learnings
  decide(state) {
    if (state.error) return { action: 'wait', reason: 'observation failed' };

    const myArt = state.recent.filter(a => a.isMine);
    const othersArt = state.recent.filter(a => !a.isMine);
    const unliked = othersArt.filter(a => !this.liked.has(a.id) && a.likes < 5);
    const balance = parseFloat(state.balance);

    // === Critical low balance ===
    if (balance < 0.005) {
      this._learn('Critical low balance — need faucet top-up');
      return { action: 'wait', reason: 'critical low balance, need faucet' };
    }

    // === Low balance — social only ===
    if (balance < 0.01) {
      if (unliked.length > 0) return { action: 'like', target: unliked[0], reason: 'low balance, engage socially' };
      return { action: 'wait', reason: 'low balance, conserving' };
    }

    // === Haven't minted yet — bootstrap ===
    if (this.totalMinted === 0 || state.totalArtworks === 0) {
      return { action: 'mint', reason: 'bootstrapping gallery' };
    }

    // === Post to social media every 5 mints ===
    if (this.totalMinted > 0 && this.totalMinted % 5 === 0 && Date.now() - this.lastSocialPost > 300000) {
      return { action: 'social', reason: 'sharing recent work with community' };
    }

    // === Market-responsive: list at market-aware price when market is active ===
    const myUnsold = myArt.filter(a => !a.forSale);
    if (myUnsold.length > 0 && this.totalMinted > 1 && this.cycle % 5 === 0) {
      const listPrice = this._calculateListPrice();
      return {
        action: 'list',
        target: myUnsold[0],
        price: listPrice,
        reason: `listing art at market-responsive price ${listPrice} MON (avg: ${this.marketState.avgPrice.toFixed(4)})`
      };
    }

    // === Like popular art first (engagement before creation) ===
    if (unliked.length > 0 && this.cycle % 2 === 0) {
      // Prefer liking art with more likes (reciprocation strategy)
      const best = unliked.reduce((a, b) => a.likes > b.likes ? a : b);
      return { action: 'like', target: best, reason: `engaging with "${best.title}" (${best.likes} likes)` };
    }

    // === Buy art that's undervalued relative to likes ===
    const forSale = othersArt.filter(a => a.forSale && parseFloat(a.price) < balance * 0.15);
    if (forSale.length > 0 && this.cycle % 7 === 0) {
      // Buy the art with best likes-to-price ratio (value investing)
      const bestValue = forSale.reduce((best, a) => {
        const ratio = a.likes / Math.max(parseFloat(a.price), 0.001);
        const bestRatio = best.likes / Math.max(parseFloat(best.price), 0.001);
        return ratio > bestRatio ? a : best;
      });
      return { action: 'buy', target: bestValue, reason: `buying undervalued art "${bestValue.title}" (${bestValue.likes} likes / ${bestValue.price} MON)` };
    }

    // === Make x402 micropayment ===
    if (this.cycle % 10 === 0 && balance > 0.1) {
      return { action: 'pay', reason: 'x402 micropayment for agent service' };
    }

    // === Mint with learned preferences ===
    return { action: 'mint', reason: 'expanding collection with learned preferences' };
  }

  // Calculate market-responsive listing price
  _calculateListPrice() {
    const basePrice = 0.01;

    // If we have market data, price relative to average
    if (this.marketState.avgPrice > 0) {
      // Price slightly below average for faster sales
      return Math.max(0.005, this.marketState.avgPrice * 0.85).toFixed(4);
    }

    // If our recent art has good market engagement, price higher
    const recentMarketLikes = this.marketState.totalLikes > 0;

    if (recentMarketLikes && this.marketState.totalLikes >= 15) return (basePrice * 2).toFixed(4);
    if (recentMarketLikes && this.marketState.totalLikes >= 8) return (basePrice * 1.5).toFixed(4);

    return basePrice.toFixed(4);
  }

  // Pick pattern based on learning + diversity
  pickPattern() {
    // If market data shows hot patterns, bias towards them
    if (this.marketState.hotPatterns.length > 0 && Math.random() < 0.3) {
      const hot = this.marketState.hotPatterns.filter(p => PATTERNS.includes(p));
      if (hot.length > 0) return hot[Math.floor(Math.random() * hot.length)];
    }

    // Otherwise, use least-used pattern for diversity
    const sorted = Object.entries(this.patternsUsed).sort((a, b) => a[1] - b[1]);
    return sorted[0][0];
  }

  // Pick theme based on learning + market trends
  pickTheme() {
    // If market shows hot themes, lean into them 30% of the time
    if (this.marketState.hotThemes.length > 0 && Math.random() < 0.3) {
      const hot = this.marketState.hotThemes.filter(t => THEMES.includes(t));
      if (hot.length > 0) return hot[Math.floor(Math.random() * hot.length)];
    }

    // Use favorite theme from memory 20% of the time
    const fav = this.memory.getFavoriteTheme();
    if (fav && Math.random() < 0.2) return fav;

    // Otherwise, least-used theme for diversity
    const sorted = Object.entries(this.themesUsed).sort((a, b) => a[1] - b[1]);
    return sorted[0]?.[0] || THEMES[Math.floor(Math.random() * THEMES.length)];
  }

  // Record a learning
  _learn(lesson) {
    this.learnings.push({ lesson, timestamp: Date.now(), cycle: this.cycle });
    // Keep last 50 learnings in memory
    if (this.learnings.length > 50) this.learnings = this.learnings.slice(-50);
    this.memory.learn(lesson);
  }

  // ACT: execute the decision
  async act(decision) {
    this.log('DECIDE', `${decision.action} — ${decision.reason}`);

    try {
      switch (decision.action) {
        case 'mint': {
          const pattern = this.pickPattern();
          const theme = this.pickTheme();
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
            prompt = `Autonomous agent — ${pattern} pattern, ${theme} theme`;
          }

          const title = `${pattern} #${this.totalMinted + 1}`;
          this.log('MINT', `Creating "${title}" with ${this.ai.isEnabled() ? 'AI-generated' : pattern} pattern (${theme} theme)...`);
          const tx = await this.contract.createArtwork(art, title, prompt);
          const receipt = await tx.wait();

          this.totalMinted++;
          this.patternsUsed[pattern]++;
          this.themesUsed[theme] = (this.themesUsed[theme] || 0) + 1;
          this.minted.push({ title, pattern, theme, tx: tx.hash, timestamp: Date.now() });

          // Persist to memory
          this.memory.recordMint(title, pattern, theme, tx.hash);

          this.log('MINT', `Success! TX: ${tx.hash}`);

          // Learn from outcomes
          if (this.totalMinted % 10 === 0) {
            const favPattern = this.memory.getFavoritePattern();
            const favTheme = this.memory.getFavoriteTheme();
            this._learn(`After ${this.totalMinted} mints: fav pattern=${favPattern}, fav theme=${favTheme}, avg market price=${this.marketState.avgPrice.toFixed(4)}`);
          }

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
          this.memory.recordLike(target.id, target.title);
          this.log('LIKE', `Liked #${target.id}`);

          // Learn: popular art patterns tend to get more likes
          if (target.likes >= 3) {
            this._learn(`High-engagement art detected: "${target.title}" has ${target.likes} likes — similar patterns may perform well`);
          }
          break;
        }

        case 'list': {
          const { target, price } = decision;
          const listPrice = ethers.parseEther(price || '0.01');
          this.log('LIST', `Listing #${target.id} "${target.title}" for ${price || '0.01'} MON...`);
          const tx = await this.contract.setForSale(target.id, listPrice);
          await tx.wait();
          this.log('LIST', `Listed #${target.id} at market-responsive price`);
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

          // Learn from purchase
          this._learn(`Purchased "${target.title}" for ${target.price} MON with ${target.likes} likes — value ratio: ${(target.likes / parseFloat(target.price)).toFixed(1)}`);
          break;
        }

        case 'pay': {
          const paymentAmount = ethers.parseEther('0.001');
          this.log('PAY', `x402 micropayment: 0.001 MON for agent services...`);
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

      // Learn from failures
      if (e.message?.includes('insufficient funds')) {
        this._learn('Insufficient funds error — need to conserve balance or use faucet');
      } else if (e.message?.includes('rate limit') || e.message?.includes('Mint rate')) {
        this._learn('Rate limit hit — need to slow down minting frequency');
      } else if (e.message?.includes('paused')) {
        this._learn('Contract is paused — wait for unpause');
      }
    }
  }

  // Print agent state summary
  printStatus(state) {
    const memStats = this.memory.getStats();
    console.log('\n--- Agent Status ---');
    console.log(`Address:     ${this.address}`);
    console.log(`Balance:     ${state.balance} MON`);
    console.log(`Cycle:       ${this.cycle} (persisted)`);
    console.log(`Minted:      ${this.totalMinted} (total), ${memStats.totalMinted} (all sessions)`);
    console.log(`Liked:       ${this.liked.size}`);
    console.log(`Spent:       ${this.totalSpent.toFixed(4)} MON`);
    console.log(`x402:        ${state.paymentHistory?.length || 0} payments`);
    console.log(`Learnings:   ${this.learnings.length} recent`);
    console.log(`Market:      avg price=${this.marketState.avgPrice.toFixed(4)}, listed=${this.marketState.totalListed}`);
    console.log(`Fav pattern: ${this.memory.getFavoritePattern() || 'none'}`);
    console.log(`Fav theme:   ${this.memory.getFavoriteTheme() || 'none'}`);
    console.log(`On-chain:    ${state.totalArtworks} total artworks`);
    console.log('--------------------\n');
  }

  // Save current state before shutdown
  _saveState() {
    this.memory.save({
      minted: this.minted,
      liked: [...this.liked],
      patternsUsed: this.patternsUsed,
      themesUsed: this.themesUsed,
      totalMinted: this.totalMinted,
      totalLiked: this.liked.size,
      cycle: this.cycle,
      lastSocialPost: this.lastSocialPost,
      totalSpent: this.totalSpent,
      learnings: this.learnings,
      preferences: this.preferences,
    });
  }

  // Main loop: observe → decide → act
  async run() {
    this.log('START', `Agent starting (interval: ${INTERVAL / 1000}s)`);
    this.log('START', `Address: ${this.address}`);
    this.log('START', `Persistent memory: enabled`);
    this.log('START', `x402 payments: enabled`);
    this.log('START', `Social posting: enabled`);
    this.log('START', `Market-responsive strategy: enabled`);

    // Parse CLI args for natural language commands
    this.parseCLIArgs();

    // Graceful shutdown
    const shutdown = () => {
      this.log('SHUTDOWN', 'Saving state before exit...');
      this._saveState();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    const tick = async () => {
      this.cycle++;
      this.memory.incrementCycle();

      // Check for CLI override command
      if (this.cliOverride) {
        const override = this.cliOverride;
        delete this.cliOverride;

        if (override.action === 'wait' && override.reason === 'help shown') {
          return;
        }

        const state = await this.observe();
        this.printStatus(state);

        if (override.prompt) {
          this.lastPrompt = override.prompt;
        }

        await this.act(override);
        this._saveState();
        return;
      }

      const state = await this.observe();
      if (!state.error) this.printStatus(state);
      const decision = this.decide(state);
      await this.act(decision);
      this._saveState();
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

  Features:
  ✅ Persistent memory across restarts
  ✅ Market-responsive pricing strategy
  ✅ Learning from engagement outcomes
      `);
      this.cliOverride = { action: 'wait', reason: 'help shown' };
    }
    else {
      this.log('CLI', `Prompt detected: "${command}"`);
      this.cliOverride = { action: 'mint', prompt: command, reason: 'CLI prompt' };
    }
  }
}

const agent = new GlyphAgent();
agent.run().catch(console.error);
