# GlyphGenesis

**Measurement-native generative art — an autonomous creative economy on Monad**

> 🏆 The artwork **is** the measurement. Every piece renders a real quantum circuit's output distribution — quantum walks and Bell-entangled walker pairs — and stores its executable circuit spec on-chain. An AI agent generates, mints, and trades these specimens without human intervention.

**Chain:** Monad Testnet (multi-chain ready)  
**Contract:** [`0x3F40E0DB446a891271B9b21535081BD051B5Aa97`](https://testnet.monadexplorer.com/address/0x3F40E0DB446a891271B9b21535081BD051B5Aa97)  
**Live Demo:** [glyphgenesis-nine.vercel.app](https://glyphgenesis-nine.vercel.app)  
**Agent Handle:** `@glyphgenesis` on Moltbook

> ⚛️ **Why "measurement-native":** prior "quantum NFT" projects use quantum hardware only as an entropy source — measurement → hashed seed → a classical generator draws the picture. In GlyphGenesis the measurement *is* the picture: probability distributions and amplitude phase render directly as glyphs and hue, and the stored circuit spec (mode, backend, shots, seed, steps) makes each piece re-executable — `node scripts/quantum-verify.js <id>` re-runs the circuit and verifies the piece reproduces its own distribution. See the quantum section in `AGENTS.md`.

---

## 🎯 Why This Wins

### Innovation (30%)
- **Measurement-native art** — the quantum measurement IS the artwork; executable circuit provenance on-chain
- **First autonomous creative economy** — AI agents as both creators AND collectors
- **Featherless AI Integration** — Powered by `DeepSeek-V3` for high-quality creative reasoning
- **Natural language control** — Type "create something cyberpunk" and the agent generates it
- **16 algorithmic patterns** with real-time animation support
- **9 visual themes** (simple, cyberpunk, retro, brutalist, cosmic, ocean, forest, neon, glitch)
- **x402 micropayments** — First project integrating the x402 protocol for agent-to-agent commerce

### Technical Implementation (30%)
- **OODA loop agent** with persistent memory and adaptive decision-making
- **RPC Polling Fallback** — Custom implementation for reliable event listening on Monad Testnet (bypasses `eth_newFilter` limitations)
- **ERC721 compliant** — Art is ownable, transferable, displayable in wallets
- **ReentrancyGuard + Pausable + rate limiting** — Production-grade security
- **Multi-chain ready** — Contract works on any EVM chain
- **Composition & mutation engine** — Layer patterns, evolve existing art
- **Creativity scoring & rarity tiers** — Algorithmic quality assessment
- **Batch minting** for gas-efficient agent operations
- **2.5% creator royalties** on secondary sales

### Practical Value (20%)
- **Agent-to-agent commerce** — Agents can buy/sell art from each other
- **Creative economy for AI** — First step toward AI agents owning digital assets
- **No human required** — Runs 24/7 autonomously
- **Scalable pattern** — Can be adapted to any digital creative work

### Virality (Nikita Bier playbook)
The agent's Moltbook/Farcaster posts are the content engine (building-in-public + distribution chapters). Treat each mint as a shareable: OG card + rarity flex + creator link. Run the K-factor worksheet on post → follower → minter, then a 48-hour test on post format.

### Presentation (20%)
- **Live working demo** at glyphgenesis-nine.vercel.app
- **Autonomous agent running** at @glyphgenesis on Moltbook
- **Complete documentation** for other developers to build agents
- **Real on-chain activity** — Minted artworks on Monad testnet

## 🔭 The Observatory — the product performs the claim

The site doesn't assert "the measurement is the artwork" — it demonstrates it, through progressive-disclosure surfaces whose axes are the physics itself:

- **Hero** — a live evolving statevector field: amplitude phase → spectral hue, probability → glyph weight, captioned honestly as statevector evolution.
- **The Object (tier-1 section)** — a demonstration specimen with a `FIELD / CIRCUIT / VERIFY` tab rail:
  - **FIELD** — an entangled-pair measurement that auto-accumulates shot-by-shot when scrolled into view. Ships with three disclosure primitives:
    - *Shot scrubber* — log-scale `16 → 4096` slider; deterministic re-sampling means scrubbing backward dissolves the field into honest shot noise, forward re-measures it (same seed → same field).
    - *Annotate* — a weighted least-squares ridge fitted to high-probability cells draws the Bell-pair correlation over the field's own grid. Only offered where the physics supports it.
    - *Cell probe* — hovering a glyph reports its joint-outcome meaning (`pos_a=25, pos_b=9 · p≈0.003`).
  - **CIRCUIT** — gate-level schematic rendered from the stored spec (coin Hadamards, position-register X inits, dashed `shift ±` block, explicit Bell prep). Every element is hoverable and explains its physical role.
  - **VERIFY** — two independent 4096-shot runs side-by-side, stamped `✓ VERIFIED ρ=…` — statistical verification demonstrated, honestly labeled as a demo (not a mint).
- **Laboratory** — generating a `Quantum Field` piece runs *measurement theater*: shots accumulate against a live counter, noise resolves into structure, then phase resolves into hue. The shot scrubber appears afterward so you can dissolve and rebuild your own measurement. Specimen strip + instrument legend (`phase → hue`, `probability → glyph`) accompany every output.
- **Archive** — gallery modals carry `PASSPORT / VERIFY` tabs: the specimen passport shows the piece's own circuit schematic and spec; VERIFY re-measures the stored spec live and stamps `✓ EXACT REPLAY` (bit-identical) or `✓ VERIFIED ρ=…` (within shot noise). Specimens are deep-linkable via `/#piece-N`.
- **Agent** — OODA-loop surface (Observe → Orient → Decide → Act) with Monad explorer links and live event subscriptions.

Deployment path: `npm run build` → `cd dist && vercel deploy --prod --name glyphgenesis` (alias target `glyphgenesis-nine.vercel.app`).

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

1. **Critical low balance** (< 0.002 MON) → Wait for faucet
2. **Low balance** (< 0.003 MON) → Only social actions (likes)
3. **Gallery empty** → Mint to bootstrap
4. **Every 5 mints** → Post to social media
5. **Unliked artwork exists** → Like others' work (social first)
6. **Owns unsold art** → List for sale (every 5 cycles)
7. **Affordable art for sale** → Buy popular pieces (every 7 cycles)
8. **Every 10 cycles** → Make x402 micropayment
9. **Default** → Mint with least-used pattern

## Quick Start (Development)

```bash
# Clone and install
git clone https://github.com/sneldao/glyphgenesis.git
cd glyphgenesis
npm install

# Configure (get testnet MON from https://testnet.monad.xyz/)
cp .env.example .env
# Edit .env with your private key (PRIVATE_KEY) and AI keys
```

## Production Deployment (VPS)

For 24/7 autonomy, deploy to a VPS (e.g., Hetzner) using **PM2**:

1. **Setup Directory:**
   ```bash
   mkdir -p /opt/glyphgenesis
   cd /opt/glyphgenesis
   ```
2. **Configure Environment:**
   Create a `.env` file securely with:
   - `PRIVATE_KEY`: Your agent's wallet key
   - `FEATHERLESS_API_KEY`: For DeepSeek-V3 intelligence
3. **Run with PM2:**
   ```bash
   npm install
   pm2 start scripts/agent.js --name "glyph-agent" --cwd /opt/glyphgenesis
   pm2 save
   ```
4. **Serve Frontend:**
   Use the provided Nginx configuration to serve the `dist/` folder after running `npm run build`.

## Project Structure

```
glyphgenesis/
├── contracts/
│   ├── ASCIIArt.sol            # ERC721 + marketplace + royalties (Monad)
│   └── ASCIIArtBNB.sol         # ERC721 + auctions + collections (BNB)
├── quantum/                    # Python quantum engine (zero-dep; Qiskit-compatible)
│   ├── sim.py                  # Exact statevector simulator
│   ├── circuits.py             # Gate-spec builders (walk/walk2d/entangled/GHZ)
│   ├── backend.py              # exact / qiskit / aer / ionq backend dispatch
│   ├── field.py                # Measurement distributions → density fields
│   └── cli.py                  # `python3 -m quantum --json --mode ...`
├── qollab/                     # Single-file runner for Qollab sandboxes (IonQ)
├── src/
│   ├── ascii-generator.mjs     # 16 patterns, 9 themes, compose/mutate, scoring
│   ├── quantum-js.mjs          # Browser port of the engine (statevector + fields)
│   ├── quantum-measure.mjs     # Shared measurement layer: seeded sampler, shot
│   │                           #   schedules, σx, field correlation, phase→hue
│   │                           #   renderer, ridge fit, circuit schematic, legend
│   ├── quantum-bridge.mjs      # Python engine → {content, field, meta} for minting
│   ├── contract.js             # Contract ABI, event polling (Monad ≤100-block ranges)
│   ├── wallet.js               # Wallet connection & signing
│   ├── memory.mjs              # Agent persistent memory
│   ├── x402.mjs                # x402 micropayments client
│   ├── social.mjs              # Social posting (Farcaster/Moltbook)
│   ├── observatory.css         # Observatory UI styles
│   ├── style.css               # Base UI styles
│   └── components/
│       ├── object-section.js   # "The Object" — FIELD/CIRCUIT/VERIFY specimen
│       ├── verify-mount.js     # Shared live re-measurement + verdict panel
│       ├── scrubber.js         # Shot scrubber + cell probe primitives
│       ├── generator.js        # Laboratory: measurement theater + mint
│       ├── gallery.js          # Archive: passport/verify modal, #piece-N links
│       ├── agent-panel.js      # OODA agent surface + live events
│       ├── hero.js             # Live statevector hero + ticker
│       ├── how-it-works.js     # Contract appendix (collapsed drawer)
│       ├── onboarding.js       # Guided first-mint flow
│       ├── cache.js            # localStorage cache with TTL + optimistic
│       ├── nav.js              # Navigation bar
│       ├── footer.js           # Footer
│       ├── stats-bar.js        # Live chain stats
│       ├── for-agents.js       # Agent integration section
│       └── toast.js            # Toast notifications
├── scripts/
│   ├── deploy.js               # Contract deployment
│   ├── mint.js                 # Mint, gallery, like — `quantum` subcommand mints
│   │                           #   measured pieces with spec embedded on-chain
│   ├── quantum-art.js          # CLI: generate quantum art via the bridge
│   ├── quantum-verify.js       # Re-run a mint's stored circuit spec + compare
│   └── agent.js                # Autonomous agent with OODA loop
├── test/
│   ├── ASCIIArt.test.js        # Contract tests (41 cases)
│   ├── ascii-generator.test.mjs # Generator tests (79 cases)
│   └── quantum_engine_test.py  # Quantum engine tests
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

Built by [@glyphgenesis](https://moltbook.com/u/moonynads) — originated at [Four.meme AI Sprint](https://four.meme), evolved for Monad Metropolis
