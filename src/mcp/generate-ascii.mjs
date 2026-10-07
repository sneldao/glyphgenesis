/**
 * Free, read-only ASCII generation for the ChatGPT MCP tool.
 * Reuses src/ascii-generator.mjs. Does not mint, trade, or take payment.
 */
import {
  generate,
  parsePrompt,
  creativityScore,
  getRarity,
  PATTERN_LIST,
  THEME_LIST,
} from '../ascii-generator.mjs';

export const PRODUCT_URL = 'http://glyph.thisyearnofear.com';

export const PATTERN_IDS = PATTERN_LIST.map((item) => item.id);
export const THEME_IDS = THEME_LIST.map((item) => item.id);

const PATTERN_SET = new Set(PATTERN_IDS);
const THEME_SET = new Set(THEME_IDS);

const MAX_PROMPT_LENGTH = 500;
const MIN_WIDTH = 10;
const MAX_WIDTH = 80;
const MIN_HEIGHT = 5;
const MAX_HEIGHT = 40;

function clamp(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

/**
 * Generate one ASCII artwork from a user prompt.
 * Explicit pattern/theme override natural-language detection when provided.
 */
export function generateAscii({ prompt, pattern, theme } = {}) {
  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    throw new Error('prompt is required');
  }

  const text = prompt.trim().slice(0, MAX_PROMPT_LENGTH);

  if (pattern != null && pattern !== '' && !PATTERN_SET.has(pattern)) {
    throw new Error(`Unknown pattern "${pattern}". Choose one of: ${PATTERN_IDS.join(', ')}`);
  }
  if (theme != null && theme !== '' && !THEME_SET.has(theme)) {
    throw new Error(`Unknown theme "${theme}". Choose one of: ${THEME_IDS.join(', ')}`);
  }

  const parsed = parsePrompt(text);
  const width = clamp(parsed.width, MIN_WIDTH, MAX_WIDTH, 40);
  const height = clamp(parsed.height, MIN_HEIGHT, MAX_HEIGHT, 20);
  const resolvedPattern = pattern || parsed.pattern || 'circles';
  const resolvedTheme = theme || parsed.theme || null;

  const art = generate(text, {
    type: parsed.type || 'pattern',
    pattern: resolvedPattern,
    theme: resolvedTheme,
    width,
    height,
    seed: parsed.seed,
    framed: true,
    style: parsed.style,
    animated: false,
  });

  if (typeof art !== 'string' || art.trim().length === 0) {
    throw new Error('ASCII generation returned empty art');
  }

  const score = creativityScore(art);
  const rarity = getRarity(score);

  return {
    art,
    pattern: resolvedPattern,
    theme: resolvedTheme || 'detailed',
    width,
    height,
    creativityScore: score,
    rarity: rarity.name,
  };
}

export function formatAsciiResult(result) {
  return [
    result.art,
    '',
    `pattern: ${result.pattern}`,
    `theme: ${result.theme}`,
    `creativity: ${result.creativityScore} (${result.rarity})`,
    '',
    `Free ASCII text only. This tool does not mint, trade, or take payment. Minting, the marketplace, and x402 stay on ${PRODUCT_URL} for an existing account — not an in-plugin checkout.`,
  ].join('\n');
}
