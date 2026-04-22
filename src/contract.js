import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = '0x3F40E0DB446a891271B9b21535081BD051B5Aa97';
export const AGENT_ADDRESS = '0x3780b1f1a9936ee6FB2195a3fe39127bA7330A42';
export const MONAD_TESTNET_RPC = 'https://testnet-rpc.monad.xyz/';
export const CHAIN_ID = 10143;
export const CHAIN_ID_HEX = '0x' + CHAIN_ID.toString(16);

export const CONTRACT_ABI = [
    'function createArtwork(string memory _content, string memory _title, string memory _prompt) external returns (uint256)',
    'function totalArtworks() external view returns (uint256)',
    'function getArtwork(uint256 _id) external view returns (address creator, address owner, string content, string title, string prompt, uint256 timestamp, uint256 price, bool forSale, uint256 likes)',
    'function getRecentArtworks(uint256 _count) external view returns (uint256[])',
    'function likeArtwork(uint256 _id) external',
    'function setForSale(uint256 _id, uint256 _price) external',
    'function buyArtwork(uint256 _id) external payable',
    'function cancelSale(uint256 _id) external',
    'function transferArtwork(uint256 _id, address _to) external',
    'function getCreatorArtworks(address _creator) external view returns (uint256[])',
    'function getRoyaltyInfo(uint256 _id) external view returns (address creator, uint256 royaltyAmount, uint256 salePrice)',
    'event ArtworkCreated(uint256 indexed id, address indexed creator, string title)',
    'event ArtworkLiked(uint256 indexed id, address indexed liker)',
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
    if (msg.includes('network') || msg.includes('chain'))
        return 'Please switch to Monad Testnet in your wallet.';

    return msg.length > 120 ? msg.slice(0, 120) + '...' : msg;
}
