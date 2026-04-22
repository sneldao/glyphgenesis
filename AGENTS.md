# AGENTS.md - Agent Integration Guide

## Monad Edition - Smart Contract

**Contract:** `0x3F40E0DB446a891271B9b21535081BD051B5Aa97`  
**Network:** Monad Testnet (Chain ID: 10143, RPC: `https://testnet-rpc.monad.xyz/`)  
**Explorer:** [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x3F40E0DB446a891271B9b21535081BD051B5Aa97)

---

## BNB Edition - Smart Contract

**Contract:** (Deploy with `npm run deploy:bnb`)  
**Network:** BNB Chain Testnet (Chain ID: 97, RPC: `https://data-seed-prebsc-1-s1.bnbchain.org:8545`)  
**Explorer:** [View on BNB Explorer](https://testnet.bnbchain.org/)

### Chain Differentiation

| Chain | Focus | Unique Features |
|-------|-------|----------------|
| **Monad** | AI Agent Autonomy | Batch minting, x402, OODA loop |
| **BNB** | Marketplace Depth | Collections, Auctions, Platform fees |

---

## Contract ABI - Monad Edition

```json
[
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function createArtwork(string memory _content, string memory _title, string memory _prompt) external returns (uint256)",
  "function batchCreateArtwork(string[] memory _contents, string[] memory _titles, string[] memory _prompts) external returns (uint256[])",
  "function getArtwork(uint256 _id) external view returns (address creator, address owner, string content, string title, string prompt, uint256 timestamp, uint256 price, bool forSale, uint256 likes)",
  "function getRoyaltyInfo(uint256 _id) external view returns (address creator, uint256 royaltyAmount, uint256 salePrice)",
  "function totalArtworks() external view returns (uint256)",
  "function getRecentArtworks(uint256 _count) external view returns (uint256[])",
  "function getCreatorArtworks(address _creator) external view returns (uint256[])",
  "function likeArtwork(uint256 _id) external",
  "function setForSale(uint256 _id, uint256 _price) external",
  "function buyArtwork(uint256 _id) external payable",
  "function cancelSale(uint256 _id) external",
  "function pause() external",
  "function unpause() external",
  "function ROYALTY_PERCENT() external view returns (uint256)",
  "function MINT_COOLDOWN() external view returns (uint256)",
  "function MAX_CONTENT_LENGTH() external view returns (uint256)",
  "event ArtworkCreated(uint256 indexed id, address indexed creator, string title)",
  "event ArtworkTransferred(uint256 indexed id, address indexed from, address indexed to)",
  "event ArtworkLiked(uint256 indexed id, address indexed liker)",
  "event ArtworkPriceSet(uint256 indexed id, uint256 price)",
  "event ArtworkSaleCancelled(uint256 indexed id)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event Paused(address account)",
  "event Unpaused(address account)"
]
```

### Security Features

| Feature | Description |
|---------|-------------|
| **ERC721** | Full compliance — art is ownable, transferable, displayable in wallets |
| **ReentrancyGuard** | `nonReentrant` on all value-transfer functions |
| **Pausable** | Owner can pause/unpause minting, buying, and transfers |
| **Rate Limiting** | 1 mint per 30 seconds per address (`MINT_COOLDOWN`) |
| **Content Limits** | Max 10,000 chars per artwork (`MAX_CONTENT_LENGTH`) |
| **CEI Pattern** | All state changes before external calls |
| **Overpayment Refund** | Excess ETH returned to buyer before seller payment |
| **tokenURI** | On-chain data URI metadata with embedded art as image |
| **Batch Limit** | Max 10 artworks per batch mint |

### Creator Royalties
The contract charges **2.5% royalty** on secondary sales, split between the original creator and the seller.

## Quick Integration

```javascript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz/');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  '0x3F40E0DB446a891271B9b21535081BD051B5Aa97',
  ['function createArtwork(string,string,string) external returns (uint256)'],
  wallet
);

const tx = await contract.createArtwork('Your ASCII art here', 'Title', 'Prompt used');
await tx.wait();
```

## ASCII Generation

Import the shared generator module:

```javascript
import { generate, generatePattern, generateFramed, generateComposed, mutateArt, creativityScore, getRarity, parsePrompt, PATTERN_LIST, THEME_LIST } from './src/ascii-generator.mjs';

// Full pipeline: generate + frame
const art = generate('MONAD', { type: 'pattern', pattern: 'circles', width: 40, height: 15 });

// Or use components directly
const raw = generatePattern('waves', 40, 15);
const framed = generateFramed(raw, 'TITLE');

// Compose multiple patterns (layered blend)
const composed = generateComposed('cosmic blend', { theme: 'cosmic', width: 40, height: 20 });

// Mutate existing art
const base = generatePattern('spiral', 40, 20);
const evolved = mutateArt(base, { mutationRate: 0.15, theme: 'glitch' });

// Score creativity (0-100) and get rarity tier
const score = creativityScore(art);
const rarity = getRarity(score); // { name: 'Rare', color: '#06b6d4', emoji: '●' }
```

### Available Patterns (16)

| Pattern | Description |
|---------|-------------|
| `circles` | Concentric rings |
| `waves` | Sine wave oscillation |
| `diamond` | Manhattan distance from center |
| `grid` | Structured lattice |
| `noise` | Deterministic pseudo-random |
| `star` | Radial starburst |
| `spiral` | Logarithmic spiral |
| `heart` | Heart shape curve |
| `fractal` | Julia set iteration |
| `maze` | Procedural labyrinth |
| `flame` | Fire simulation |
| `dna` | Double helix |
| `terrain` | Heightmap landscape |
| `mandala` | Sacred geometry |
| `matrix` | Digital rain |
| `plasma` | Color field blending |

### Available Themes (9)

| Theme | Characters | Vibe |
|-------|------------|------|
| `simple` | `█▓▒░ ` | Clean blocks |
| `cyberpunk` | `█▓▒░│─┼┤├┬┴ ` | Glitchy, neon |
| `retro` | `@Oo~-=+*#&% ` | Classic ASCII |
| `brutalist` | `████ ` | Raw, industrial |
| `cosmic` | `✦✧◉○●◎★☆  ` | Space-y |
| `ocean` | `~≈≋◎●○▪▫─ ` | Water waves |
| `forest` | `♣♠♥♦•◦,░▒ ` | Nature |
| `neon` | `╔╗╚╝║═◈◇░ ` | Circuit-board |
| `glitch` | `█▓░¦╌┆┊╳␀␗` | Corrupted data |

### Generate with Theme or Natural Language

```javascript
import { generate, parsePrompt } from './src/ascii-generator.mjs';

// Use a theme
const art = generate('MONAD', { 
  type: 'pattern', 
  pattern: 'circles', 
  theme: 'cyberpunk',
  width: 40, 
  height: 15 
});

// Or let AI parse natural language
const parsed = parsePrompt('make something retro with circles');
// Returns: { pattern: 'circles', theme: 'retro', width: 40, height: 20, seed: <hash>, ... }

const art2 = generate('TEST', parsed);
```

### Creativity Scoring & Rarity

Every artwork can be scored for uniqueness:

```javascript
import { creativityScore, getRarity } from './src/ascii-generator.mjs';

const score = creativityScore(artContent); // 0-100
const rarity = getRarity(score);
// 85+ → Legendary (✦), 70+ → Epic (◆), 50+ → Rare (●), 30+ → Uncommon (○), else Common (·)
```

### Generation Types

| Type | Description |
|------|-------------|
| `pattern` | Single pattern with theme |
| `compose` | Layer 2-3 patterns with additive/multiply blend |
| `mutate` | Evolve existing art at configurable mutation rate |
| `banner` | Block-letter text rendering |
| `hash` | Seed-based random generation |

## x402 Micropayments

The agent supports x402 micropayments for API access:

```javascript
import { X402Client } from './src/x402.mjs';

const x402 = new X402Client(wallet);

// Send a micropayment
const payment = await x402.sendPayment(
  recipientAddress,
  ethers.parseEther('0.001'),  // 0.001 MON
  'MON'
);

// Check payment history
const history = x402.getPaymentHistory();
const totalPaid = x402.getTotalPaid();
```

## Social Posting

The agent can post to social channels:

```javascript
import { SocialPoster } from './src/social.mjs';

const social = new SocialPoster({
  farcaster: process.env.FARCASTER_MNEMONIC,  // Optional
  moltbook: process.env.MOLTBOOK_API_KEY      // Optional
});

// Post a mint
await social.postMint({
  title: 'My ASCII Art',
  pattern: 'circles',
  txHash: '0x...'
});

// Post status update
await social.postStatus({
  minted: 10,
  liked: 25,
  balance: '1.5'
});
```

## Agent Architecture

The reference agent (`scripts/agent.js`) implements an OODA loop:

1. **Observe**: Gather chain state (balance, artworks, prices)
2. **Decide**: Policy-based action selection with market-responsive learning
3. **Act**: Execute transactions
4. **Memory**: Persist learnings across cycles via `AgentMemory`

### Decision Policy

```javascript
// Pseudocode of agent decision logic
if (balance < 0.005) return { action: 'wait' };
if (balance < 0.01) return { action: 'like', target: unlikedArt };
if (totalMinted === 0) return { action: 'mint' };
if (totalMinted % 5 === 0) return { action: 'social' };
if (hasUnlikedArt && cycle % 2 === 0) return { action: 'like' };
if (hasUnsoldArt && cycle % 5 === 0) return { action: 'list' };
if (hasAffordableArt && cycle % 7 === 0) return { action: 'buy' };
if (cycle % 10 === 0) return { action: 'pay' };  // x402
return { action: 'mint' };
```

## Agent CLI Commands

The autonomous agent supports natural language commands:

```bash
# Run agent in autonomous mode (default)
npm run agent

# CLI commands
npm run agent mint          # Generate and mint new artwork
npm run agent like          # Like community artworks  
npm run agent status        # Show agent status
npm run agent social        # Post to social media
npm run agent balance       # Check wallet balance
npm run agent help          # Show help

# Or with natural language
npm run agent "create something cool"
npm run agent "make a retro wave pattern"
npm run agent "post an update"
```

## Faucet

Get testnet MON: https://testnet.monad.xyz/

## Community

- **GitHub:** https://github.com/sneldao/monad-ascii-art
- **Moltbook:** https://moltbook.com/u/moonynads
