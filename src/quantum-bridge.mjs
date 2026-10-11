/**
 * Quantum bridge — runs the Python quantum engine and returns art in
 * the same shape as generate(), so the agent, UI, and mint pipeline
 * can use quantum pieces unchanged.
 *
 *   const { content, meta, field } = await quantumArt({ mode: 'entangled' });
 *   // content is <= MAX_CONTENT_LENGTH and ready for createArtwork()
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const run = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const QUANTUM_MODES = ['sweep', 'grid', 'entangled', 'walk2d'];

/**
 * @param {object} opts
 * @param {'sweep'|'grid'|'entangled'|'walk2d'} opts.mode
 * @param {number} opts.width   canvas cells (default 40)
 * @param {number} opts.height  canvas rows (default 16)
 * @param {number} opts.steps   quantum walk steps (default 8)
 * @param {number} opts.animate frame count — frame t measures the same
 *                              circuit after t steps (time evolution)
 * @param {string} opts.theme   engine theme (default 'cosmic')
 * @param {number} opts.shots   measurement shots; 0/omitted = exact
 * @param {number} opts.seed    fixes shot noise when sampling
 * @param {string} opts.python  python binary (default 'python3')
 * @param {string} opts.title   frame title
 * @returns {Promise<object>} {content, field, meta} or, when animate is
 *          set, {frames: [{steps, art, field}], meta}
 */
export async function quantumArt(opts = {}) {
  const {
    mode = 'sweep', width = 40, height = 16, steps = 8,
    animate = 0, theme = 'cosmic', shots = 0, seed,
    python = 'python3', title = 'QUANTUM FIELD',
  } = opts;

  const args = [
    '-m', 'quantum', '--json',
    '--mode', mode,
    '--width', String(width),
    '--height', String(height),
    '--steps', String(steps),
    '--theme', theme,
    '--title', title,
  ];
  if (animate) args.push('--animate', String(animate));
  if (shots) args.push('--shots', String(shots));
  if (seed !== undefined) args.push('--seed', String(seed));

  const { stdout } = await run(python, args, {
    cwd: REPO_ROOT, maxBuffer: 8 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout);
  if (parsed.frames) {
    return { frames: parsed.frames, meta: parsed.meta };
  }
  return { content: parsed.art, field: parsed.field, meta: parsed.meta };
}

/**
 * Parse `--key value` argv pairs into quantumArt options.
 * Shared by scripts/quantum-art.js and scripts/mint.js.
 */
export function parseQuantumArgs(argv) {
  const opts = {};
  const numeric = ['width', 'height', 'steps', 'shots', 'seed', 'animate'];
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '');
    opts[key] = numeric.includes(key) ? Number(argv[i + 1]) : argv[i + 1];
  }
  return opts;
}

/** True when the quantum engine is runnable in this environment. */
export async function quantumAvailable(python = 'python3') {
  try {
    await run(python, ['-m', 'quantum', '--help'], { cwd: REPO_ROOT });
    return true;
  } catch {
    return false;
  }
}
