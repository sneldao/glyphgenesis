#!/usr/bin/env node
/**
 * Verify a quantum-minted artwork: reads the circuit spec stored in the
 * on-chain prompt field, re-runs the same circuit, and compares the
 * regenerated art to the minted content byte-for-byte.
 *
 *   node scripts/quantum-verify.js <tokenId>
 */
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { quantumArt } from '../src/quantum-bridge.mjs';

dotenv.config();

const RPC = process.env.MONAD_TESTNET_RPC || 'https://testnet-rpc.monad.xyz/';
const CONTRACT = process.env.CONTRACT_ADDRESS ||
  '0x3F40E0DB446a891271B9b21535081BD051B5Aa97';

const id = process.argv[2];
if (id === undefined) {
  console.error('Usage: node scripts/quantum-verify.js <tokenId>');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC);
const contract = new ethers.Contract(CONTRACT, [
  'function getArtwork(uint256) external view returns (address,address,string,string,string,uint256,uint256,bool,uint256)'
], provider);

const [, , content, title, prompt] = await contract.getArtwork(id);

let spec;
try {
  spec = JSON.parse(prompt).quantum;
} catch { /* not JSON */ }

if (!spec) {
  console.log(`#${id} "${title}" is not a quantum piece (no spec in prompt)`);
  process.exit(0);
}

const [w, h] = spec.size || [40, 16];
const { content: regen } = await quantumArt({
  mode: spec.mode, width: w, height: h, steps: spec.steps,
  theme: spec.theme, shots: spec.shots === 'exact' ? 0 : spec.shots,
  seed: spec.seed, title,
});

if (regen === content) {
  console.log(`✓ VERIFIED #${id} "${title}" — art reproduces exactly from ` +
    `the ${spec.mode} circuit (${spec.backend}, ${spec.measurement})`);
} else if (spec.backend === 'ionq') {
  // real hardware shot noise isn't seed-reproducible — byte match only
  // holds for simulator/exact backends
  console.log(`~ HARDWARE #${id} — byte-exact replay impossible by nature ` +
    'of real shot noise; verify statistically against the distribution');
} else {
  console.log(`✗ MISMATCH #${id} — regenerated art does not match on-chain content`);
  process.exit(1);
}
