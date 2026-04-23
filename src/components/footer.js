import { getActiveChain, getActiveChainKey, getExplorerAddr } from '@/contract.js';

export function renderFooter() {
    const chain = getActiveChain();
    const chainKey = getActiveChainKey();

    const footer = document.createElement('footer');
    footer.innerHTML = `
        <span class=\"footer-logo\">GLYPH<span>GENESIS</span></span>
        <ul class=\"footer-links\">
            <li><a href=\"https://github.com/sneldao/glyphgenesis\" target=\"_blank\" rel=\"noopener noreferrer\">GitHub</a></li>
            <li><a href=\"${chain.explorerAddr(chain.contractAddress || '')}\" target=\"_blank\" rel=\"noopener noreferrer\">Contract</a></li>
            <li><a href=\"https://testnet.monad.xyz/\" target=\"_blank\" rel=\"noopener noreferrer\">Monad Faucet</a></li>
            <li><a href=\"https://testnet.bnbchain.org/faucet\" target=\"_blank\" rel=\"noopener noreferrer\">BNB Faucet</a></li>
            <li><a href=\"https://moltbook.com/u/moonynads\" target=\"_blank\" rel=\"noopener noreferrer\">Moltbook</a></li>
        </ul>
        <span class=\"footer-copy\">${chain.name} &middot; Chain ID ${chain.id}</span>
    `;
    return footer;
}