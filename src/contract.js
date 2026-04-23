import { ethers } from 'ethers';

// ─── Chain Configurations ───

export const CHAINS = {
    monad: {
        id: 10143,
        idHex: '0x279f',
        name: 'Monad Testnet',
        rpc: 'https://testnet-rpc.monad.xyz/',
        nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
        explorerTx: (hash) => `https://testnet.monadexplorer.com/tx/${hash}`,
        explorerAddr: (addr) => `https://testnet.monadexplorer.com/address/${addr}`,
        blockExplorerUrls: ['https://testnet.monadexplorer.com/'],
        contractAddress: '0x3F40E0DB446a891271B9b21535081BD051B5Aa97',
        agentAddress: '0x3780b1f1a9936ee6FB2195a3fe39127bA7330A42',
        currencyLabel: 'MON',
    },
    bnb: {
        id: 97,
        idHex: '0x61',
        name: 'BNB Chain Testnet',
        rpc: 'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
        nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
        explorerTx: (hash) => `https://testnet.bnbchain.org/tx/${hash}`,
        explorerAddr: (addr) => `https://testnet.bnbchain.org/address/${addr}`,
        blockExplorerUrls: ['https://testnet.bnbchain.org/'],
        contractAddress: '0x095897d189aAA1EA872b061ea82506E7b0d64B5B',
        agentAddress: null,
        currencyLabel: 'tBNB',
    },
};

// ─── Active Chain (defaults to Monad) ───

let activeChainKey = 'monad';

export function getActiveChainKey() { return activeChainKey; }
export function getActiveChain() { return CHAINS[activeChainKey]; }

export function setActiveChain(key) {
    if (!CHAINS[key]) throw new Error(`Unknown chain: ${key}`);
    activeChainKey = key;
}

// ─── Legacy exports (backwards compat — Monad) ───

export const CONTRACT_ADDRESS = CHAINS.monad.contractAddress;
export const AGENT_ADDRESS = CHAINS.monad.agentAddress;
export const MONAD_TESTNET_RPC = CHAINS.monad.rpc;
export const CHAIN_ID = CHAINS.monad.id;
export const CHAIN_ID_HEX = CHAINS.monad.idHex;
export const MONAD_NETWORK = {
    chainId: CHAINS.monad.idHex,
    chainName: CHAINS.monad.name,
    nativeCurrency: CHAINS.monad.nativeCurrency,
    rpcUrls: [CHAINS.monad.rpc],
    blockExplorerUrls: CHAINS.monad.blockExplorerUrls,
};

export const BNB_NETWORK = {
    chainId: CHAINS.bnb.idHex,
    chainName: CHAINS.bnb.name,
    nativeCurrency: CHAINS.bnb.nativeCurrency,
    rpcUrls: [CHAINS.bnb.rpc],
    blockExplorerUrls: CHAINS.bnb.blockExplorerUrls,
};

// ─── Dynamic helpers ───

export function getContractAddress() { return getActiveChain().contractAddress; }
export function getExplorerTx(hash) { return getActiveChain().explorerTx(hash); }
export function getExplorerAddr(addr) { return getActiveChain().explorerAddr(addr); }
export function getCurrencyLabel() { return getActiveChain().currencyLabel; }

// Legacy aliases
export const EXPLORER_TX = (hash) => getExplorerTx(hash);
export const EXPLORER_ADDR = (addr) => getExplorerAddr(addr);

// ─── ABIs ───

export const MONAD_ABI = [
    // ERC721 standard
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function balanceOf(address owner) external view returns (uint256)',
    'function transferFrom(address from, address to, uint256 tokenId) external',
    'function approve(address to, uint256 tokenId) external',
    'function getApproved(uint256 tokenId) external view returns (address)',
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) external view returns (bool)',
    'function safeTransferFrom(address from, address to, uint256 tokenId) external',
    'function tokenURI(uint256 tokenId) external view returns (string)',
    // ERC721 metadata
    'function name() external view returns (string)',
    'function symbol() external view returns (string)',
    // GlyphGenesis custom
    'function createArtwork(string memory _content, string memory _title, string memory _prompt) external returns (uint256)',
    'function batchCreateArtwork(string[] memory _contents, string[] memory _titles, string[] memory _prompts) external returns (uint256[])',
    'function totalArtworks() external view returns (uint256)',
    'function getArtwork(uint256 _id) external view returns (address creator, address owner, string content, string title, string prompt, uint256 timestamp, uint256 price, bool forSale, uint256 likes)',
    'function getRecentArtworks(uint256 _count) external view returns (uint256[])',
    'function getCreatorArtworks(address _creator) external view returns (uint256[])',
    'function getRoyaltyInfo(uint256 _id) external view returns (address creator, uint256 royaltyAmount, uint256 salePrice)',
    'function likeArtwork(uint256 _id) external',
    'function setForSale(uint256 _id, uint256 _price) external',
    'function buyArtwork(uint256 _id) external payable',
    'function cancelSale(uint256 _id) external',
    'function lastMintTime(address) external view returns (uint256)',
    // Constants
    'function ROYALTY_PERCENT() external view returns (uint256)',
    'function MINT_COOLDOWN() external view returns (uint256)',
    // Admin
    'function pause() external',
    'function unpause() external',
    'function owner() external view returns (address)',
    // Events
    'event ArtworkCreated(uint256 indexed id, address indexed creator, string title)',
    'event ArtworkLiked(uint256 indexed id, address indexed liker)',
    'event ArtworkTransferred(uint256 indexed id, address indexed from, address indexed to)',
    'event ArtworkPriceSet(uint256 indexed id, uint256 price)',
    'event ArtworkSaleCancelled(uint256 indexed id)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event Paused(address account)',
    'event Unpaused(address account)',
];

export const BNB_ABI = [
    // ERC721 standard
    'function ownerOf(uint256 tokenId) external view returns (address)',
    'function balanceOf(address owner) external view returns (uint256)',
    'function transferFrom(address from, address to, uint256 tokenId) external',
    'function approve(address to, uint256 tokenId) external',
    'function getApproved(uint256 tokenId) external view returns (address)',
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address owner, address operator) external view returns (bool)',
    'function safeTransferFrom(address from, address to, uint256 tokenId) external',
    'function tokenURI(uint256 tokenId) external view returns (string)',
    // ERC721 metadata
    'function name() external view returns (string)',
    'function symbol() external view returns (string)',
    // GlyphGenesisBNB custom
    'function createArtwork(string memory _content, string memory _title, string memory _prompt, uint256 _collectionId) external returns (uint256)',
    'function createCollection(string memory _name, string memory _description) external returns (uint256)',
    'function totalArtworks() external view returns (uint256)',
    'function getArtwork(uint256 _id) external view returns (address creator, address owner, string content, string title, string prompt, uint256 timestamp, uint256 price, bool forSale, uint256 likes, uint256 collectionId)',
    'function getRecentArtworks(uint256 _count) external view returns (uint256[])',
    'function getCreatorArtworks(address _creator) external view returns (uint256[])',
    'function likeArtwork(uint256 _id) external',
    'function setForSale(uint256 _id, uint256 _price) external',
    'function buyArtwork(uint256 _id) external payable',
    'function cancelSale(uint256 _id) external',
    'function transferArtwork(uint256 _id, address _to) external',
    // Auctions
    'function startAuction(uint256 _artworkId, uint256 _startingPrice) external',
    'function bid(uint256 _artworkId) external payable',
    'function endAuction(uint256 _artworkId) external',
    // Collections
    'function getCollection(uint256 _id) external view returns (string name, string description, address creator, uint256 artworkCount)',
    'function getCollectionArtworks(uint256 _collectionId) external view returns (uint256[])',
    // Admin
    'function pause() external',
    'function unpause() external',
    'function owner() external view returns (address)',
    'function claimFees() external',
    'function platformFees() external view returns (uint256)',
    // Constants
    'function ROYALTY_PERCENT() external view returns (uint256)',
    'function MINT_COOLDOWN() external view returns (uint256)',
    'function AUCTION_DURATION() external view returns (uint256)',
    'function AUCTION_FEE_PERCENT() external view returns (uint256)',
    'function lastMintTime(address) external view returns (uint256)',
    // Events
    'event ArtworkCreated(uint256 indexed id, address indexed creator, string title)',
    'event ArtworkLiked(uint256 indexed id, address indexed liker)',
    'event ArtworkTransferred(uint256 indexed id, address indexed from, address indexed to)',
    'event ArtworkPriceSet(uint256 indexed id, uint256 price)',
    'event ArtworkSaleCancelled(uint256 indexed id)',
    'event CollectionCreated(uint256 indexed id, address indexed creator, string name)',
    'event AuctionStarted(uint256 indexed id, address indexed seller, uint256 startingPrice)',
    'event AuctionEnded(uint256 indexed id, address indexed winner, uint256 finalPrice)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
    'event Paused(address account)',
    'event Unpaused(address account)',
];

// Backwards compat: CONTRACT_ABI = Monad ABI
export const CONTRACT_ABI = MONAD_ABI;

/** Get the ABI for the currently active chain */
export function getActiveABI() {
    return activeChainKey === 'bnb' ? BNB_ABI : MONAD_ABI;
}

// ─── Read Contract ───

/** Create a read-only provider + contract for the active chain */
export function getReadContract() {
    const chain = getActiveChain();
    if (!chain.contractAddress) {
        throw new Error(`No contract deployed on ${chain.name} yet`);
    }
    const provider = new ethers.JsonRpcProvider(chain.rpc);
    return new ethers.Contract(chain.contractAddress, getActiveABI(), provider);
}

// ─── Event Subscriptions ───

/**
 * Subscribe to contract events.
 * Returns an unsubscribe function.
 */
export function subscribeToEvents(eventHandlers) {
    const contract = getReadContract();

    // Store handler references so off() can remove the same function
    const listeners = [];

    function addListener(filter, handler) {
        contract.on(filter, handler);
        listeners.push({ filter, handler });
    }

    if (eventHandlers.onArtworkCreated) {
        const filter = contract.filters.ArtworkCreated();
        addListener(filter, (id, creator, title) => {
            eventHandlers.onArtworkCreated({ id: Number(id), creator, title });
        });
    }

    if (eventHandlers.onArtworkLiked) {
        const filter = contract.filters.ArtworkLiked();
        addListener(filter, (id, liker) => {
            eventHandlers.onArtworkLiked({ id: Number(id), liker });
        });
    }

    if (eventHandlers.onArtworkTransferred) {
        const filter = contract.filters.ArtworkTransferred();
        addListener(filter, (id, from, to) => {
            eventHandlers.onArtworkTransferred({ id: Number(id), from, to });
        });
    }

    if (eventHandlers.onArtworkPriceSet) {
        const filter = contract.filters.ArtworkPriceSet();
        addListener(filter, (id, price) => {
            eventHandlers.onArtworkPriceSet({ id: Number(id), price: price.toString() });
        });
    }

    if (eventHandlers.onTransfer) {
        const filter = contract.filters.Transfer();
        addListener(filter, (from, to, tokenId) => {
            eventHandlers.onTransfer({ from, to, tokenId: Number(tokenId) });
        });
    }

    if (eventHandlers.onPaused) {
        addListener('Paused', (account) => eventHandlers.onPaused({ account }));
    }

    if (eventHandlers.onUnpaused) {
        addListener('Unpaused', (account) => eventHandlers.onUnpaused({ account }));
    }

    // BNB-only events
    if (eventHandlers.onCollectionCreated && contract.filters.CollectionCreated) {
        const filter = contract.filters.CollectionCreated();
        addListener(filter, (id, creator, name) => {
            eventHandlers.onCollectionCreated({ id: Number(id), creator, name });
        });
    }

    if (eventHandlers.onAuctionStarted && contract.filters.AuctionStarted) {
        const filter = contract.filters.AuctionStarted();
        addListener(filter, (id, seller, startingPrice) => {
            eventHandlers.onAuctionStarted({ id: Number(id), seller, startingPrice: startingPrice.toString() });
        });
    }

    if (eventHandlers.onAuctionEnded && contract.filters.AuctionEnded) {
        const filter = contract.filters.AuctionEnded();
        addListener(filter, (id, winner, finalPrice) => {
            eventHandlers.onAuctionEnded({ id: Number(id), winner, finalPrice: finalPrice.toString() });
        });
    }

    // Return unsubscribe function that removes the exact same handler references
    return () => {
        listeners.forEach(({ filter, handler }) => {
            contract.off(filter, handler);
        });
        listeners.length = 0;
    };
}

/**
 * Query past events for a specific range of blocks.
 */
export async function queryPastEvents(eventName, fromBlock = -1000, toBlock = 'latest') {
    const contract = getReadContract();

    try {
        const filter = contract.filters[eventName]?.();
        if (!filter) return [];

        const events = await contract.queryFilter(filter, fromBlock, toBlock);
        return events.map(e => ({
            blockNumber: e.blockNumber,
            transactionHash: e.transactionHash,
            args: e.args,
        }));
    } catch (e) {
        console.warn(`Failed to query past events for ${eventName}:`, e.message);
        return [];
    }
}

/** Parse common ethers errors into user-friendly messages */
export function parseContractError(error) {
    const msg = error?.message || error?.toString() || 'Unknown error';

    if (msg.includes('user rejected') || msg.includes('ACTION_REJECTED'))
        return 'Transaction rejected by user.';
    if (msg.includes('insufficient funds'))
        return 'Insufficient balance for this transaction.';
    if (msg.includes('Already liked'))
        return 'You already liked this artwork.';
    if (msg.includes('Not the owner'))
        return 'You are not the owner of this artwork.';
    if (msg.includes('Not for sale'))
        return 'This artwork is not for sale.';
    if (msg.includes('Insufficient payment'))
        return 'Insufficient payment amount.';
    if (msg.includes('Already owner'))
        return 'You already own this artwork.';
    if (msg.includes('Artwork does not exist'))
        return 'This artwork no longer exists.';
    if (msg.includes('Content cannot be empty'))
        return 'Artwork content cannot be empty.';
    if (msg.includes('Content too large'))
        return 'Artwork content exceeds maximum size.';
    if (msg.includes('Mint cooldown'))
        return 'Please wait before minting again (30s cooldown).';
    if (msg.includes('enforced to pause'))
        return 'Contract is currently paused. Try again later.';

    return msg.length > 120 ? msg.slice(0, 120) + '...' : msg;
}
