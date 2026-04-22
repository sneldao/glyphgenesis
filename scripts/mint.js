import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { generate } from '../src/ascii-generator.mjs';

dotenv.config();

const RPC = process.env.MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz/';
const CONTRACT = process.env.CONTRACT_ADDRESS || '0x3F40E0DB446a891271B9b21535081BD051B5Aa97';

const ABI = [
  'function createArtwork(string,string,string) external returns (uint256)',
  'function totalArtworks() external view returns (uint256)',
  'function getArtwork(uint256) external view returns (address,address,string,string,string,uint256,uint256,bool,uint256)',
  'function getRecentArtworks(uint256) external view returns (uint256[])',
  'function likeArtwork(uint256) external',
  'function setForSale(uint256,uint256) external',
  'function buyArtwork(uint256) external payable'
];

function getContract(needsSigner = false) {
  const provider = new ethers.JsonRpcProvider(RPC);
  if (!needsSigner) return new ethers.Contract(CONTRACT, ABI, provider);

  if (!process.env.PRIVATE_KEY) {
    console.error('PRIVATE_KEY not set. Copy .env.example to .env and configure.');
    process.exit(1);
  }
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return new ethers.Contract(CONTRACT, ABI, wallet);
}

const commands = {
  async mint() {
    const pattern = process.argv[3] || 'circles';
    const title = process.argv[4] || `Glyph - ${pattern}`;
    const art = generate(title, { type: 'pattern', pattern, width: 40, height: 15 });

    const contract = getContract(true);
    console.log('Minting artwork...');
    const tx = await contract.createArtwork(art, title, `Generated with ${pattern} pattern`);
    console.log('TX:', tx.hash);
    await tx.wait();

    const total = await contract.totalArtworks();
    console.log(`Minted! Total artworks: ${total}`);
  },

  async gallery() {
    const contract = getContract();
    const total = await contract.totalArtworks();
    console.log(`Total artworks on-chain: ${total}\n`);

    if (total === 0n) return;
    const count = total > 5n ? 5 : Number(total);
    const ids = await contract.getRecentArtworks(count);

    for (const id of ids) {
      const [creator, , content, title] = await contract.getArtwork(id);
      console.log(`--- #${id}: ${title} ---`);
      console.log(`Creator: ${creator}`);
      console.log(content);
      console.log();
    }
  },

  async like() {
    const id = process.argv[3];
    if (!id) { console.error('Usage: node scripts/mint.js like <id>'); process.exit(1); }
    const contract = getContract(true);
    const tx = await contract.likeArtwork(id);
    await tx.wait();
    console.log(`Liked artwork #${id}`);
  }
};

const cmd = process.argv[2] || 'mint';
if (!commands[cmd]) {
  console.log('Usage: node scripts/mint.js <command>\n\nCommands: mint, gallery, like');
  process.exit(1);
}
commands[cmd]().catch(console.error);
