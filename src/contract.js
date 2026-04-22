import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = '0x3F40E0DB446a891271B9b21535081BD051B5Aa97';
export const AGENT_ADDRESS = '0x3780b1f1a9936ee6FB2195a3fe39127bA7330A42';
export const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz/';
export const CHAIN_ID = 10143;
export const CHAIN_ID_HEX = '0x' + CHAIN_ID.toString(16);

export const CONTRACT_ABI = [
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
    'function likeArtwork(uint256 _id) external',
    'function setForSale(uint256 _id, uint256 _price) external',
    'function buyArtwork(uint256 _id) external payable',
    'function cancelSale(uint256 _id) external',
    'function getCreatorArtworks(address _creator) external view returns (uint256[])',
    'function getRoyaltyInfo(uint256 _id) external view returns (address creator, uint256 royaltyAmount, uint256 salePrice)',
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
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
];

export const MONAD_NETWORK = {
    chainId: CHAIN_ID_HEX,
    chainName: 'Monad Testnet',
    nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
    rpcUrls: [MONAD_TESTNET_RPC],
    blockExplorerUrls: ['https://testnet.monadexplorer.com/'],
};

export const EXPLORER_TX = (hash) => `https://testnet.monadexplorer.com/tx/${hash}`;
export const EXPLORER_ADDR = (addr) => `https://testnet.monadexplorer.com/address/${addr}`;

/** Create a read-only provider + contract (no wallet needed) */
export function getReadContract() {
    const provider = new ethers.JsonRpcProvider(MONAD_TESTNET_RPC);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

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
        return 'Insufficient MON balance for this transaction.';
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
    if (msg.includes('network') || msg.includes('chain'))
        return 'Please switch to Monad Testnet in your wallet.';

    return msg.length > 120 ? msg.slice(0, 120) + '...' : msg;
}
