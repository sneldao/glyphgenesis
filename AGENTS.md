# AGENTS.md - Agent Integration Guide

## Smart Contract

**Contract:** `0x3F40E0DB446a891271B9b21535081BD051B5Aa97`  
**Network:** Monad Testnet (Chain ID: 10143, RPC: `https://testnet-rpc.monad.xyz/`)  
**Explorer:** [View on Monad Explorer](https://testnet.monadexplorer.com/address/0x3F40E0DB446a891271B9b21535081BD051B5Aa97)

## Contract ABI

```json
[
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
  "function transferArtwork(uint256 _id, address _to) external",
  "function ROYALTY_PERCENT() external view returns (uint256)",
  "event ArtworkCreated(uint256 indexed id, address indexed creator, string title)",
  "event ArtworkTransferred(uint256 indexed id, address indexed from, address indexed to)",
  "event ArtworkLiked(uint256 indexed id, address indexed liker)",
  "event ArtworkPriceSet(uint256 indexed id, uint256 price)",
  "event ArtworkSaleCancelled(uint256 indexed id)"
]
```

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
import { generate, generatePattern, generateFramed } from './src/ascii-generator.mjs';

// Full pipeline: generate + frame
const art = generate('MONAD', { type: 'pattern', pattern: 'circles', width: 40, height: 15 });

// Or use components directly
const raw = generatePattern('waves', 40, 15);
const framed = generateFramed(raw, 'TITLE');
```

### Available Patterns

| Pattern | Function | Description |
|---------|----------|-------------|
| `circles` | Concentric rings | `@`, `O`, `o`, `.` density |
| `waves` | Sine waves | `~` and `-` alternation |
| `diamond` | Manhattan distance | `#`, `+`, `.` from center |
| `grid` | Structured lines | `+` at intervals |
| `noise` | Pseudo-random | Deterministic hash-based |
| `star` | Twinkling stars | Animated with time parameter |
| `spiral` | Logarithmic spiral | Curved pattern generation |
| `heart` | Heart shape | Valentine's/love themed |

### Available Themes

| Theme | Characters | Vibe |
|-------|------------|------|
| `simple` | `.oO@#` | Minimal |
| `cyberpunk` | `░▒▓█` | Glitchy, neon |
| `retro` | `.:-=+*#%@` | Classic ASCII |
| `brutalist` | `█▓▒░ ░▒▓█` | Raw, industrial |
| `cosmic` | `✦✧✪◎◈◇` | Space-y |
| `ocean` | `~≈≋≈~` | Water waves |
| `forest` | `♣♠♥♦ tree` | Nature |

### Generate with Theme

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
// Returns: { pattern: 'circles', theme: 'retro', width: 40, height: 15 }

const art2 = generate('TEST', parsed);
```

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
2. **Decide**: Policy-based action selection
3. **Act**: Execute transactions
4. **Memory**: Persist learnings across cycles

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
