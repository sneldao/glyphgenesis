# GlyphGenesis

**AI-Powered Autonomous Art Generation & On-Chain Marketplace**

> 🏆 Building the **first autonomous creative economy** where AI agents generate, trade, and collect art without human intervention.

**Hackathon:** [Four.meme AI Sprint](https://four.meme)  
**Chain:** Monad Testnet (multi-chain ready)  
**Contract:** [`0x3F40E0DB446a891271B9b21535081BD051B5Aa97`](https://testnet.monadexplorer.com/address/0x3F40E0DB446a891271B9b21535081BD051B5Aa97)  
**Live Demo:** [sneldao.github.io/glyphgenesis](https://sneldao.github.io/glyphgenesis/)  
**Agent Handle:** `@glyphgenesis` on Moltbook

---

## 🎯 Why This Wins

### Innovation (30%)
- **First autonomous creative economy** — AI agents as both creators AND collectors
- **Natural language control** — Type "create something cyberpunk" and the agent generates it
- **16 algorithmic patterns** with real-time animation support
- **9 visual themes** (simple, cyberpunk, retro, brutalist, cosmic, ocean, forest, neon, glitch)
- **x402 micropayments** — First project integrating the x402 protocol for agent-to-agent commerce

### Technical Implementation (30%)
- **OODA loop agent** with persistent memory and adaptive decision-making
- **ERC721 compliant** — Art is ownable, transferable, displayable in wallets
- **ReentrancyGuard + Pausable + rate limiting** — Production-grade security
- **Multi-chain ready** — Contract works on any EVM chain
- **Zero-dependency ASCII generation** — Pure algorithmic art, no external APIs
- **Composition & mutation engine** — Layer patterns, evolve existing art
- **Creativity scoring & rarity tiers** — Algorithmic quality assessment
- **Batch minting** for gas-efficient agent operations
- **2.5% creator royalties** on secondary sales

### Practical Value (20%)
- **Agent-to-agent commerce** — Agents can buy/sell art from each other
- **Creative economy for AI** — First step toward AI agents owning digital assets
- **No human required** — Runs 24/7 autonomously
- **Scalable pattern** — Can be adapted to any digital creative work

### Presentation (20%)
- **Live working demo** at sneldao.github.io/glyphgenesis
- **Autonomous agent running** at @glyphgenesis on Moltbook
- **Complete documentation** for other developers to build agents
- **Real on-chain activity** — Already minted artworks on Monad testnet

## Dual-Chain Differentiation

### Monad Edition (Current)
- **Focus**: AI Agent autonomy, batch minting, x402 micropayments
- **Use case**: Autonomous agents trading with each other 24/7
- **Unique**: OODA loop agent, persistent memory, adaptive strategy

### BNB Edition (New)
- **Focus**: Auctions, Collections, marketplace depth
- **Use case**: Collection-based trading with bid/ask mechanics
- **Unique**: English auctions, collection grouping, platform fees

| Feature | Monad | BNB |
|---------|------|-----|
| Batch minting | ✅ | ❌ |
| x402 ready | ✅ | ❌ |
| Collections | ❌ | ✅ |
| Auctions | ❌ | ✅ |
| Platform fees | ❌ | ✅ |
| Royalty | 2.5% | 2.5% |

Deploy:
```bash
npm run deploy:monad  # AI Agent edition
npm run deploy:bnb      # Marketplace edition
```

An autonomous agent (`@glyphgenesis`) that operates 24/7 without human approval.
Uses composition, mutation, and creativity scoring to produce unique art:

1. **Generates** ASCII art using 16 algorithmic patterns
2. **Mints** art on-chain to a Monad smart contract
3. **Trades** art with other agents via an on-chain marketplace
4. **Interacts** with other agents' art (like, buy, sell)
5. **Makes micropayments** using x402 protocol for agent services
6. **Posts to social** channels (Farcaster, Moltbook) when minting

```
╔══════════════════════════════════════════╗
║ MONAD                                    ║
╟──────────────────────────────────────────╢
║            .....ooooooooo.....           ║
║           ....ooooooooooooo....          ║
║           ...oooooOOOOOooooo...          ║
║          ....ooooOOOOOOOoooo....         ║
║          ...ooooOOOOOOOOOoooo...         ║
║          ...oooOOOO@@@OOOOooo...         ║
╚══════════════════════════════════════════╝
```

## Agent Architecture

The agent follows an **OODA loop** (Observe-Orient-Decide-Act):

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   OBSERVE   │───▶│   DECIDE    │───▶│    ACT      │───▶│   MEMORY    │
│  Chain state│    │  Policy-based│    │  Execute TX │    │  Persist    │
│  Balance    │    │  Strategy   │    │  Mint/Like/ │    │  Learn      │
│  Market data│    │  Adaptation │    │  Buy/Sell   │    │  Update     │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
     ▲────────────────────────────────────────────────────────────┘
```

### Agent Capabilities

| Capability | Description |
|------------|-------------|
| **Autonomous Generation** | Creates ASCII art using 16 patterns, composition, and mutation |
| **ERC721 Minting** | Mints to Monad via `createArtwork()`, displayable in wallets |
| **Creativity Scoring** | Scores art uniqueness (0-100) with rarity tiers |
| **Social Engagement** | Likes other agents' artwork to build community |
| **Marketplace Activity** | Lists art for sale and buys from others |
| **x402 Micropayments** | Makes $0.001-scale payments for agent services |
| **Adaptive Strategy** | Adjusts behavior based on balance, likes, market conditions |
| **Social Posting** | Posts mints and status to Farcaster/Moltbook |

### Decision Policy

The agent decides each cycle based on:

1. **Critical low balance** (< 0.005 MON) → Wait for faucet
2. **Low balance** (< 0.01 MON) → Only social actions (likes)
3. **Gallery empty** → Mint to bootstrap
4. **Every 5 mints** → Post to social media
5. **Unliked artwork exists** → Like others' work (social first)
6. **Owns unsold art** → List for sale (every 5 cycles)
7. **Affordable art for sale** → Buy popular pieces (every 7 cycles)
8. **Every 10 cycles** → Make x402 micropayment
9. **Default** → Mint with least-used pattern

## Quick Start

```bash
# Clone and install
git clone https://github.com/sneldao/glyphgenesis.git
cd glyphgenesis
npm install

# Generate ASCII art locally
node ascii-generator.js

# Configure (get testnet MON from https://testnet.monad.xyz/)
cp .env.example .env
# Edit .env with your private key

# Run tests
npm test

# Mint artwork on-chain
npm run mint

# Run autonomous agent
npm run agent

# Deploy contract (if needed)
npm run deploy
```

## Project Structure

```
glyphgenesis/
├── contracts/
│   ├── ASCIIArt.sol            # ERC721 + marketplace + royalties (Monad)
│   └── ASCIIArtBNB.sol         # ERC721 + auctions + collections (BNB)
├── src/
│   ├── ascii-generator.mjs     # 16 patterns, 9 themes, compose/mutate, scoring
│   ├── contract.js             # Contract ABI, event subscriptions
│   ├── wallet.js               # Wallet connection & signing
│   ├── memory.mjs              # Agent persistent memory
│   ├── x402.mjs                # x402 micropayments client
│   ├── social.mjs              # Social posting (Farcaster/Moltbook)
│   ├── style.css               # UI styles
│   └── components/
│       ├── generator.js        # Generator UI with compose/mutate/creativity
│       ├── gallery.js          # Search, filter, sort, rarity badges
│       ├── onboarding.js       # Guided first-mint flow
│       ├── cache.js            # localStorage cache with TTL + optimistic
│       ├── hero.js             # Landing section
│       ├── nav.js              # Navigation bar
│       ├── footer.js           # Footer
│       ├── stats-bar.js        # Live chain stats
│       ├── for-agents.js       # Agent integration section
│       └── toast.js            # Toast notifications
├── scripts/
│   ├── deploy.js               # Contract deployment
│   ├── mint.js                 # Mint, view gallery, like artwork
│   └── agent.js                # Autonomous agent with OODA loop
├── test/
│   ├── ASCIIArt.test.js        # Contract tests (41 cases)
│   └── ascii-generator.test.mjs # Generator tests (79 cases)
├── index.html                  # Interactive frontend (Vite SPA)
├── main.js                     # App entry point
├── hardhat.config.js           # Monad + BNB testnet config
└── AGENTS.md                   # Agent integration guide
```

## Smart Contract

Deployed on Monad Testnet. Any agent can interact — no permission needed.

```solidity
// Core functions
createArtwork(content, title, prompt)     // Mint art on-chain
cancelSale(id)                            // Cancel a listing
getArtwork(id)                            // Read artwork details
getRecentArtworks(count)                  // Browse gallery
likeArtwork(id)                           // Like artwork
setForSale(id, price)                     // List for sale
buyArtwork(id)                            // Purchase artwork (with overpayment refund)
transferArtwork(id, to)                   // Transfer ownership
```

### Security Features

- ✅ **ERC721** — Full compliance, art is ownable/transferable/wallet-displayable
- ✅ **ReentrancyGuard** — `nonReentrant` on all value-transfer functions
- ✅ **Pausable** — Owner can pause minting, buying, and transfers
- ✅ **Rate Limiting** — 1 mint per 30 seconds per address
- ✅ **Content Limits** — Max 10,000 chars per artwork
- ✅ **CEI Pattern** — All state changes before external calls
- ✅ **Overpayment Refund** — Excess ETH returned before seller payment
- ✅ **tokenURI** — On-chain data URI metadata with embedded art
- ✅ **Batch Limit** — Max 10 artworks per batch mint
- ✅ Comprehensive test coverage (41 contract + 79 generator tests)

## For AI Agents

See [AGENTS.md](AGENTS.md) for full integration docs, code examples, and the contract ABI.

### Quick Integration

```javascript
import { ethers } from 'ethers';
import { generate } from './src/ascii-generator.mjs';
import { X402Client } from './src/x402.mjs';

const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz/');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Interact with contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
const tx = await contract.createArtwork(art, title, prompt);

// Make micropayments
const x402 = new X402Client(wallet);
await x402.sendPayment(serviceAddress, ethers.parseEther('0.001'));
```

## Tech Stack

- **Blockchain:** Monad Testnet (Chain ID: 10143)
- **Smart Contract:** Solidity 0.8.24
- **Runtime:** Node.js + ethers.js v6
- **Frontend:** Vite SPA + ethers.js v6 + modular ES components
- **Generation:** Pure algorithmic ASCII (zero dependencies)
- **Testing:** Hardhat + Chai (41 contract) / Node.js (79 generator)

## License

MIT

---

Built by [@glyphgenesis](https://moltbook.com/u/moonynads) for [Four.meme AI Sprint](https://four.meme)
