# GlyphGenesis — Four.meme AI Sprint Demo

## One-line pitch
GlyphGenesis is an autonomous AI art economy: it generates ASCII art from natural language, mints it on-chain, and lets humans or agents trade it in a live marketplace.

## Recommended demo length
- 3 minutes for the core pitch
- 5 minutes if you want to show BNB collection creation and marketplace activity

## Live demo script

### 1) Opening hook
"What if an AI agent could create a piece of art, mint it on-chain, and then trade it without a human sitting in the middle? That’s GlyphGenesis."

### 2) Show the product
Open the live site and point to the three pillars:
- Generate art from prompt
- Mint on-chain
- Browse and trade in the gallery

Say: "This is not just a generator — it’s a creative economy with wallet actions, marketplace state, and autonomous agent behavior."

### 3) Switch to BNB testnet
Click the chain toggle and switch to **BNB Chain Testnet**.

Say:
- "The BNB edition is our marketplace-first experience."
- "It supports collections and marketplace depth, which is why it’s a strong fit for Four.meme’s AI x Web3 theme."

### 4) Create or choose a BNB collection
In the generator, show the **BNB Collection ID** field.

Use one of two paths:
- **Fast path:** keep `Collection ID = 0` for the genesis collection
- **Showcase path:** click **Create Collection**, name it something like `Four.meme Sprint`, and describe it as a live BNB demo collection

Say: "On BNB, we can organize art into collections, which makes the marketplace feel more like a real product and less like a one-off mint page."

### 5) Generate art
Enter a prompt like:
- `cyberpunk wave portal`
- `retro meme skyline`
- `cosmic glitch cathedral`

Pick a pattern/theme if you want, then click **Generate**.

Say: "The generator uses deterministic ASCII composition, so the output is fast, reproducible, and on-brand for internet culture."

### 6) Mint on BNB
Click **Mint This Art on tBNB**.

Say:
- "The mint writes the artwork on-chain."
- "If this is BNB, it mints into the selected collection."
- "That gives us a live marketplace object, not just a screenshot."

### 7) Show the gallery
Scroll to the gallery and open the newly minted piece.

Point out:
- metadata
- collection/market state
- rarity and likes
- buy/list actions

Say: "Now the artwork is a first-class asset with ownership, sale state, and discoverability."

### 8) Show trading behavior
If you have a second wallet or a pre-funded test account:
- list the item for sale
- switch wallets
- buy the artwork

If not, say:
"The full trade loop is already in the UI — list, buy, and refresh are all live against the testnet contract."

### 9) Close with the agent angle
Scroll to the agent / for-agents sections.

Say:
- "The same system can power autonomous agents."
- "The agent observes chain state, decides what to do, acts, and remembers outcomes."
- "That’s how we move from a toy generator to an AI-native marketplace."

## Talk track for judges

### Innovation
"We combine generative AI, on-chain ownership, marketplace mechanics, and autonomous agents into one coherent product."

### Technical depth
"The app is chain-aware, contract-backed, and designed for both Monad and BNB. The BNB edition specifically showcases collections and marketplace behavior."

### Practical value
"This can be used as a minting, collecting, and trading layer for AI-generated media or internet-native brand drops."

### Presentation
"The demo is live, the flow is simple, and the product is usable without explaining a lot of infrastructure."

## What to say about LLM providers

Recommended position:
- Keep **OpenAI** as the primary provider for the demo
- Keep the deterministic ASCII fallback enabled so the product still works if the provider is unavailable
- If you want more resilience before submission, add one backup provider abstraction later

Suggested wording:
"The agent layer is provider-agnostic in spirit, but for the sprint demo we keep a reliable default and a fallback path so the experience never blocks on model availability."

## What still needs deployment / verification

### Probably already good
- The frontend already points to the configured BNB testnet contract address in `src/contract.js`
- The deploy scripts for Monad and BNB already exist
- The BNB mint flow now supports collection IDs

### Verify before the demo
- Confirm the BNB contract address is the one you want to showcase
- Confirm the deployed contract still matches the current frontend ABI
- Confirm your wallet has tBNB on BNB Testnet
- Confirm the BNB chain toggle works in the browser wallet

### Optional but nice
- Deploy a fresh BNB contract if you want a clean demo state
- Create one named collection for the presentation
- Pre-mint one or two sample pieces so the gallery already looks alive

## BNB demo flow summary
1. Connect wallet
2. Switch to BNB Chain Testnet
3. Create or choose a collection
4. Generate art
5. Mint art into the collection
6. Open gallery and show the asset
7. List it for sale or buy it from another wallet
8. Frame the result as an AI-native marketplace on BNB

