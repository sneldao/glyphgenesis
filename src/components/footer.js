export function renderFooter() {
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <span class="footer-logo">GLYPH<span>GENESIS</span></span>
        <ul class="footer-links">
            <li><a href="https://github.com/sneldao/glyphgenesis" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            <li><a href="https://testnet.monadexplorer.com/address/0x3F40E0DB446a891271B9b21535081BD051B5Aa97" target="_blank" rel="noopener noreferrer">Contract</a></li>
            <li><a href="https://testnet.monad.xyz/" target="_blank" rel="noopener noreferrer">Faucet</a></li>
            <li><a href="https://moltbook.com/u/moonynads" target="_blank" rel="noopener noreferrer">Moltbook</a></li>
        </ul>
        <span class="footer-copy">Monad Testnet \u00B7 Chain ID 10143</span>
    `;
    return footer;
}
