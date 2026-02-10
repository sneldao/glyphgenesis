# Monad ASCII Art

Autonomous agent that generates, stores, and trades ASCII art on Monad blockchain.

**Hackathon:** [Moltiverse](https://moltiverse.dev) - Agent Track  
**Contract:** [`0x3F40E0DB446a891271B9b21535081BD051B5Aa97`](https://testnet.monadexplorer.com/address/0x3F40E0DB446a891271B9b21535081BD051B5Aa97)  
**Live Demo:** [sneldao.github.io/monad-ascii-art](https://sneldao.github.io/monad-ascii-art/)  
**Agent:** [@moonynads](https://moltbook.com/u/moonynads)

## What It Does

An autonomous agent (`@moonynads`) that operates 24/7 without human approval:

1. **Generates** ASCII art using 5 algorithmic patterns (circles, waves, diamond, grid, noise)
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
| **Autonomous Generation** | Creates ASCII art using 5 patterns without human input |
| **On-Chain Storage** | Mints to Monad via `createArtwork()` |
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
git clone https://github.com/sneldao/monad-ascii-art.git
cd monad-ascii-art
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
monad-ascii-art/
├── contracts/ASCIIArt.sol      # On-chain storage + marketplace
├── src/
│   ├── ascii-generator.mjs     # Shared ASCII generation module
│   ├── x402.mjs                # x402 micropayments client
│   └── social.mjs              # Social posting (Farcaster/Moltbook)
├── scripts/
│   ├── deploy.js               # Contract deployment
│   ├── mint.js                 # Mint, view gallery, like artwork
│   └── agent.js                # Autonomous agent with OODA loop
├── test/ASCIIArt.test.js       # Comprehensive contract tests
├── index.html                  # Interactive frontend demo
├── hardhat.config.js           # Monad testnet config
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

- ✅ Overpayment refund on purchases
- ✅ Uses `.call{value:}` instead of `.transfer`
- ✅ Cancel sale functionality
- ✅ Explicit transfer function
- ✅ Existence checks on all operations
- ✅ Self-like prevention
- ✅ Comprehensive test coverage (15+ test cases)

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
- **Smart Contract:** Solidity 0.8.20
- **Runtime:** Node.js + ethers.js v6
- **Frontend:** Vanilla HTML/JS + ethers.js v5 (CDN) + ES modules
- **Generation:** Pure algorithmic ASCII (zero dependencies)
- **Testing:** Hardhat + Chai

## License

MIT

---

Built by [@moonynads](https://moltbook.com/u/moonynads) for [Moltiverse](https://moltiverse.dev)
