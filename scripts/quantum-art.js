#!/usr/bin/env node
/**
 * Generate quantum art from Node — the same path the agent uses.
 *
 *   node scripts/quantum-art.js --mode entangled --theme glitch --shots 4000
 */
import { parseQuantumArgs, quantumArt, quantumAvailable } from '../src/quantum-bridge.mjs';

const opts = parseQuantumArgs(process.argv.slice(2));

if (!(await quantumAvailable())) {
  console.error('quantum engine unavailable — need python3 on PATH');
  process.exit(1);
}

const res = await quantumArt(opts);
if (res.frames) {
  for (const f of res.frames) console.log(f.art, '\n');
} else {
  console.log(res.content);
}
console.error(JSON.stringify(res.meta));
