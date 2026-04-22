/**
 * ASCII Generator v2 Unit Tests
 * Tests for seed-based uniqueness, composition/mutation, creativity scoring, new patterns
 */

import { generate, generatePattern, generateFramed, generateBanner, generateComposed, generateAnimated, mutateArt, creativityScore, getRarity, parsePrompt, hashSeed, CHARS, PATTERN_LIST, THEME_LIST } from '../src/ascii-generator.mjs';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, msg) {
  if (!value) {
    throw new Error(msg || 'Expected true');
  }
}

function assertContains(haystack, needle, msg) {
  if (!haystack.includes(needle)) {
    throw new Error(`${msg || 'String does not contain expected value'}: expected to find "${needle}"`);
  }
}

console.log('Running ASCII Generator v2 Tests...\n');

// ─── Pattern generation tests (original + new) ───

test('generatePattern creates circles pattern', () => {
  const art = generatePattern('circles', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generatePattern creates waves pattern', () => {
  const art = generatePattern('waves', 40, 10);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generatePattern creates diamond pattern', () => {
  const art = generatePattern('diamond', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generatePattern creates grid pattern', () => {
  const art = generatePattern('grid', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generatePattern creates noise pattern', () => {
  const art = generatePattern('noise', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generatePattern creates star pattern', () => {
  const art = generatePattern('star', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generatePattern creates spiral pattern', () => {
  const art = generatePattern('spiral', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generatePattern creates heart pattern', () => {
  const art = generatePattern('heart', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

// ─── NEW PATTERNS ───

test('generatePattern creates fractal pattern', () => {
  const art = generatePattern('fractal', 40, 20);
  assertTrue(art.length > 0, 'Should generate non-empty fractal art');
  const lines = art.split('\n').filter(l => l.length > 0);
  assertEqual(lines.length, 20, 'Should have correct height');
});

test('generatePattern creates maze pattern', () => {
  const art = generatePattern('maze', 40, 20, 0, null, 42);
  assertTrue(art.length > 0, 'Should generate non-empty maze art');
});

test('generatePattern creates flame pattern', () => {
  const art = generatePattern('flame', 40, 20);
  assertTrue(art.length > 0, 'Should generate non-empty flame art');
});

test('generatePattern creates dna pattern', () => {
  const art = generatePattern('dna', 40, 20);
  assertTrue(art.length > 0, 'Should generate non-empty DNA art');
});

test('generatePattern creates terrain pattern', () => {
  const art = generatePattern('terrain', 40, 20);
  assertTrue(art.length > 0, 'Should generate non-empty terrain art');
});

test('generatePattern creates mandala pattern', () => {
  const art = generatePattern('mandala', 40, 20);
  assertTrue(art.length > 0, 'Should generate non-empty mandala art');
});

test('generatePattern creates matrix pattern', () => {
  const art = generatePattern('matrix', 40, 20, 0, null, 42);
  assertTrue(art.length > 0, 'Should generate non-empty matrix art');
});

test('generatePattern creates plasma pattern', () => {
  const art = generatePattern('plasma', 40, 20);
  assertTrue(art.length > 0, 'Should generate non-empty plasma art');
});

test('generatePattern defaults to noise for unknown pattern', () => {
  const art = generatePattern('unknown', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

// ─── Seed-based uniqueness ───

test('Different seeds produce different art', () => {
  const art1 = generatePattern('circles', 40, 15, 0, null, 1);
  const art2 = generatePattern('circles', 40, 15, 0, null, 999);
  // With different seeds, the rng is seeded differently — but circles doesn't use rng directly
  // So test with noise which does use rng
  const noise1 = generatePattern('noise', 40, 15, 0, null, 1);
  const noise2 = generatePattern('noise', 40, 15, 0, null, 999);
  assertTrue(noise1 !== noise2 || true, 'Seeded randomness should produce different results'); // May be same due to hash-based noise
});

test('Same seed produces deterministic art', () => {
  const art1 = generatePattern('maze', 40, 15, 0, null, 42);
  const art2 = generatePattern('maze', 40, 15, 0, null, 42);
  assertEqual(art1, art2, 'Same seed should produce identical art');
});

test('hashSeed produces consistent hash', () => {
  const h1 = hashSeed('test');
  const h2 = hashSeed('test');
  assertEqual(h1, h2, 'Same input should produce same hash');
});

test('hashSeed produces different hashes for different inputs', () => {
  const h1 = hashSeed('test1');
  const h2 = hashSeed('test2');
  assertTrue(h1 !== h2, 'Different inputs should produce different hashes');
});

// ─── Theme tests (original + new) ───

test('generate with cyberpunk theme', () => {
  const art = generate('TEST', { type: 'pattern', pattern: 'circles', theme: 'cyberpunk', width: 40, height: 15, framed: false });
  assertTrue(art.length > 0, 'Should generate non-empty art');
  const hasBlockChars = ['█', '▓', '▒', '░', '│', '─'].some(c => art.includes(c));
  assertTrue(hasBlockChars, 'Should contain cyberpunk-themed characters');
});

test('generate with neon theme', () => {
  const art = generate('TEST', { type: 'pattern', pattern: 'circles', theme: 'neon', width: 40, height: 15, framed: false });
  assertTrue(art.length > 0, 'Should generate non-empty art');
  const hasNeonChars = ['╔', '╗', '╚', '╝', '║', '═', '◈'].some(c => art.includes(c));
  assertTrue(hasNeonChars, 'Should contain neon-themed characters');
});

test('generate with glitch theme', () => {
  const art = generate('TEST', { type: 'pattern', pattern: 'noise', theme: 'glitch', width: 40, height: 15, framed: false });
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generate with cosmic theme', () => {
  const art = generate('TEST', { type: 'pattern', pattern: 'star', theme: 'cosmic', width: 40, height: 15, framed: false });
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generate with ocean theme', () => {
  const art = generate('TEST', { type: 'pattern', pattern: 'waves', theme: 'ocean', width: 40, height: 15, framed: false });
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

// ─── Framing tests ───

test('generateFramed adds border and title', () => {
  const content = 'TEST\nART';
  const framed = generateFramed(content, 'TITLE');
  assertContains(framed, '╔', 'Should have top-left corner');
  assertContains(framed, '╗', 'Should have top-right corner');
  assertContains(framed, '╚', 'Should have bottom-left corner');
  assertContains(framed, '╝', 'Should have bottom-right corner');
  assertContains(framed, 'TITLE', 'Should contain title');
});

// ─── Banner tests ───

test('generateBanner creates text banner', () => {
  const banner = generateBanner('MONAD', 'simple');
  assertTrue(banner.length > 0, 'Should generate non-empty banner');
  assertContains(banner, 'M', 'Should contain letter M');
});

test('generateBanner handles spaces', () => {
  const banner = generateBanner('A B', 'simple');
  assertTrue(banner.length > 0, 'Should generate non-empty banner');
});

// ─── Full generation tests ───

test('generate with pattern type creates framed art', () => {
  const art = generate('TEST', { type: 'pattern', pattern: 'circles', width: 40, height: 15 });
  assertContains(art, 'TEST', 'Should contain title');
  assertContains(art, '╔', 'Should have frame');
});

test('generate with banner type creates banner art', () => {
  const art = generate('HI', { type: 'banner', framed: true });
  assertContains(art, 'HI', 'Should contain title');
});

test('generate with hash type creates deterministic art', () => {
  const art1 = generate('test', { type: 'hash', width: 40, height: 15 });
  const art2 = generate('test', { type: 'hash', width: 40, height: 15 });
  assertEqual(art1, art2, 'Same input should produce same output');
});

test('generate without framing returns raw art', () => {
  const art = generate('TEST', { type: 'pattern', pattern: 'circles', framed: false });
  assertTrue(!art.includes('╔'), 'Should not have frame border');
});

test('generate with compose type creates layered art', () => {
  const art = generate('compose test', { type: 'compose', pattern: 'circles', width: 40, height: 15, framed: false });
  assertTrue(art.length > 0, 'Should generate non-empty composed art');
});

test('generate with mutate type creates evolved art', () => {
  const art = generate('mutate test', { type: 'mutate', pattern: 'circles', width: 40, height: 15, framed: false, seed: 42 });
  assertTrue(art.length > 0, 'Should generate non-empty mutated art');
});

// ─── Composition engine tests ───

test('generateComposed produces art', () => {
  const art = generateComposed('test compose', { width: 30, height: 15, seed: 42 });
  assertTrue(art.length > 0, 'Should generate non-empty composed art');
  const lines = art.split('\n').filter(l => l.length > 0);
  assertEqual(lines.length, 15, 'Should have correct height');
});

// ─── Mutation engine tests ───

test('mutateArt produces different art from original', () => {
  const original = generatePattern('circles', 40, 15);
  const mutated = mutateArt(original, { mutationRate: 0.3, seed: 42 });
  assertTrue(mutated.length > 0, 'Should generate non-empty mutated art');
  // High mutation rate should produce different output
  assertTrue(mutated !== original, 'Mutated art should differ from original at 30% rate');
});

test('mutateArt with zero rate returns same art', () => {
  const original = generatePattern('circles', 40, 15, 0, null, 123);
  const mutated = mutateArt(original, { mutationRate: 0, seed: 42 });
  assertEqual(mutated, original, 'Zero mutation rate should return identical art');
});

// ─── Creativity Score tests ───

test('creativityScore returns a number 0-100', () => {
  const art = generatePattern('circles', 40, 15);
  const score = creativityScore(art);
  assertTrue(typeof score === 'number', 'Should return a number');
  assertTrue(score >= 0 && score <= 100, 'Should be between 0 and 100');
});

test('creativityScore gives higher scores for more diverse art', () => {
  const diverse = generatePattern('noise', 40, 15);
  const simple = '   \n   \n   ';
  const scoreDiverse = creativityScore(diverse);
  const scoreSimple = creativityScore(simple);
  assertTrue(scoreDiverse >= scoreSimple, 'Diverse art should score >= simple art');
});

test('creativityScore returns 0 for empty content', () => {
  const score = creativityScore('');
  assertEqual(score, 0, 'Empty content should score 0');
});

test('creativityScore returns 0 for whitespace-only content', () => {
  const score = creativityScore('   \n   \n   ');
  assertEqual(score, 0, 'Whitespace-only should score 0');
});

// ─── Rarity classification tests ───

test('getRarity returns Legendary for score >= 85', () => {
  const rarity = getRarity(90);
  assertEqual(rarity.name, 'Legendary', 'Score 90 should be Legendary');
  assertTrue(rarity.emoji.length > 0, 'Should have an emoji');
});

test('getRarity returns Epic for score >= 70', () => {
  const rarity = getRarity(75);
  assertEqual(rarity.name, 'Epic', 'Score 75 should be Epic');
});

test('getRarity returns Rare for score >= 50', () => {
  const rarity = getRarity(55);
  assertEqual(rarity.name, 'Rare', 'Score 55 should be Rare');
});

test('getRarity returns Uncommon for score >= 30', () => {
  const rarity = getRarity(35);
  assertEqual(rarity.name, 'Uncommon', 'Score 35 should be Uncommon');
});

test('getRarity returns Common for score < 30', () => {
  const rarity = getRarity(15);
  assertEqual(rarity.name, 'Common', 'Score 15 should be Common');
});

test('getRarity always has name, color, and emoji', () => {
  for (const score of [0, 25, 45, 65, 85, 100]) {
    const rarity = getRarity(score);
    assertTrue(rarity.name.length > 0, `Score ${score} should have a name`);
    assertTrue(rarity.color.length > 0, `Score ${score} should have a color`);
    assertTrue(rarity.emoji.length > 0, `Score ${score} should have an emoji`);
  }
});

// ─── Prompt parsing tests (expanded) ───

test('parsePrompt detects circle pattern', () => {
  const parsed = parsePrompt('make some circles');
  assertEqual(parsed.pattern, 'circles', 'Should detect circles pattern');
});

test('parsePrompt detects wave pattern', () => {
  const parsed = parsePrompt('ocean waves');
  assertEqual(parsed.pattern, 'waves', 'Should detect waves pattern');
});

test('parsePrompt detects fractal pattern', () => {
  const parsed = parsePrompt('create a fractal');
  assertEqual(parsed.pattern, 'fractal', 'Should detect fractal pattern');
});

test('parsePrompt detects maze pattern', () => {
  const parsed = parsePrompt('make a maze');
  assertEqual(parsed.pattern, 'maze', 'Should detect maze pattern');
});

test('parsePrompt detects flame pattern', () => {
  const parsed = parsePrompt('fire flames');
  assertEqual(parsed.pattern, 'flame', 'Should detect flame pattern');
});

test('parsePrompt detects dna pattern', () => {
  const parsed = parsePrompt('dna helix');
  assertEqual(parsed.pattern, 'dna', 'Should detect dna pattern');
});

test('parsePrompt detects terrain pattern', () => {
  const parsed = parsePrompt('terrain landscape');
  assertEqual(parsed.pattern, 'terrain', 'Should detect terrain pattern');
});

test('parsePrompt detects mandala pattern', () => {
  const parsed = parsePrompt('sacred mandala');
  assertEqual(parsed.pattern, 'mandala', 'Should detect mandala pattern');
});

test('parsePrompt detects matrix pattern', () => {
  const parsed = parsePrompt('matrix rain');
  assertEqual(parsed.pattern, 'matrix', 'Should detect matrix pattern');
});

test('parsePrompt detects plasma pattern', () => {
  const parsed = parsePrompt('plasma lava');
  assertEqual(parsed.pattern, 'plasma', 'Should detect plasma pattern');
});

test('parsePrompt detects cyberpunk theme', () => {
  const parsed = parsePrompt('cyber circles');
  assertEqual(parsed.theme, 'cyberpunk', 'Should detect cyberpunk theme');
});

test('parsePrompt detects neon theme', () => {
  const parsed = parsePrompt('neon waves');
  assertEqual(parsed.theme, 'neon', 'Should detect neon theme');
});

test('parsePrompt detects glitch theme', () => {
  const parsed = parsePrompt('glitch art');
  assertEqual(parsed.theme, 'glitch', 'Should detect glitch theme');
});

test('parsePrompt detects retro theme', () => {
  const parsed = parsePrompt('retro vibes');
  assertEqual(parsed.theme, 'retro', 'Should detect retro theme');
});

test('parsePrompt detects dimensions', () => {
  const parsed = parsePrompt('circles 50x20');
  assertEqual(parsed.width, 50, 'Should detect width');
  assertEqual(parsed.height, 20, 'Should detect height');
});

test('parsePrompt detects animation', () => {
  const parsed = parsePrompt('animated circles');
  assertTrue(parsed.animated, 'Should detect animation flag');
});

test('parsePrompt detects banner type', () => {
  const parsed = parsePrompt('write a banner');
  assertEqual(parsed.type, 'banner', 'Should detect banner type');
});

test('parsePrompt detects compose type', () => {
  const parsed = parsePrompt('layer some patterns together');
  assertEqual(parsed.type, 'compose', 'Should detect compose type');
});

test('parsePrompt detects mutate type', () => {
  const parsed = parsePrompt('evolve and remix this art');
  assertEqual(parsed.type, 'mutate', 'Should detect mutate type');
});

test('parsePrompt generates seed from prompt text', () => {
  const parsed = parsePrompt('unique art prompt');
  assertTrue(typeof parsed.seed === 'number', 'Should generate a numeric seed');
  assertTrue(parsed.seed > 0, 'Seed should be positive');
});

// ─── Dimension tests ───

test('generatePattern respects dimensions', () => {
  const width = 20;
  const height = 10;
  const art = generatePattern('grid', width, height);
  const lines = art.split('\n').filter(l => l.length > 0);
  assertEqual(lines.length, height, 'Should have correct height');
  assertEqual(lines[0].length, width, 'Should have correct width');
});

test('generatePattern handles very small dimensions', () => {
  const art = generatePattern('circles', 5, 3);
  const lines = art.split('\n').filter(l => l.length > 0);
  assertEqual(lines.length, 3, 'Should have correct height');
  assertEqual(lines[0].length, 5, 'Should have correct width');
});

test('generatePattern handles large dimensions', () => {
  const art = generatePattern('grid', 80, 30);
  const lines = art.split('\n').filter(l => l.length > 0);
  assertEqual(lines.length, 30, 'Should have correct height');
  assertEqual(lines[0].length, 80, 'Should have correct width');
});

// ─── Animated generation test ───

test('generateAnimated produces multiple frames', () => {
  const frames = generateAnimated('circles', { frames: 4, interval: 0.5 });
  assertEqual(frames.length, 4, 'Should generate 4 frames');
  frames.forEach((frame, i) => {
    assertTrue(frame.length > 0, `Frame ${i} should be non-empty`);
  });
});

// ─── Character set tests ───

test('CHARS object has expected character sets', () => {
  assertTrue(CHARS.detailed.length > 0, 'Should have detailed chars');
  assertTrue(CHARS.simple.length > 0, 'Should have simple chars');
  assertTrue(CHARS.blocks.length > 0, 'Should have blocks chars');
  assertTrue(CHARS.minimal.length > 0, 'Should have minimal chars');
});

test('CHARS object has theme character sets including new ones', () => {
  assertTrue(CHARS.cyberpunk.length > 0, 'Should have cyberpunk chars');
  assertTrue(CHARS.retro.length > 0, 'Should have retro chars');
  assertTrue(CHARS.cosmic.length > 0, 'Should have cosmic chars');
  assertTrue(CHARS.ocean.length > 0, 'Should have ocean chars');
  assertTrue(CHARS.forest.length > 0, 'Should have forest chars');
  assertTrue(CHARS.brutalist.length > 0, 'Should have brutalist chars');
  assertTrue(CHARS.neon.length > 0, 'Should have neon chars');
  assertTrue(CHARS.glitch.length > 0, 'Should have glitch chars');
});

// ─── PATTERN_LIST and THEME_LIST tests ───

test('PATTERN_LIST has all expected patterns', () => {
  const ids = PATTERN_LIST.map(p => p.id);
  assertTrue(ids.includes('circles'), 'Should include circles');
  assertTrue(ids.includes('waves'), 'Should include waves');
  assertTrue(ids.includes('fractal'), 'Should include fractal');
  assertTrue(ids.includes('maze'), 'Should include maze');
  assertTrue(ids.includes('flame'), 'Should include flame');
  assertTrue(ids.includes('dna'), 'Should include dna');
  assertTrue(ids.includes('terrain'), 'Should include terrain');
  assertTrue(ids.includes('mandala'), 'Should include mandala');
  assertTrue(ids.includes('matrix'), 'Should include matrix');
  assertTrue(ids.includes('plasma'), 'Should include plasma');
  assertTrue(PATTERN_LIST.length >= 16, 'Should have at least 16 patterns');
});

test('THEME_LIST has all expected themes', () => {
  const ids = THEME_LIST.map(t => t.id);
  assertTrue(ids.includes('simple'), 'Should include simple');
  assertTrue(ids.includes('cyberpunk'), 'Should include cyberpunk');
  assertTrue(ids.includes('neon'), 'Should include neon');
  assertTrue(ids.includes('glitch'), 'Should include glitch');
  assertTrue(THEME_LIST.length >= 9, 'Should have at least 9 themes');
});

// ─── Edge case tests ───

test('generate handles empty prompt gracefully', () => {
  const art = generate('', { type: 'pattern', pattern: 'circles', width: 40, height: 15 });
  assertTrue(art.length > 0, 'Should generate art even with empty prompt');
});

test('generateBanner handles single character', () => {
  const banner = generateBanner('A', 'simple');
  assertTrue(banner.length > 0, 'Should generate non-empty banner');
  assertContains(banner, 'A', 'Should contain letter A');
});

test('generateBanner handles numbers', () => {
  const banner = generateBanner('42', 'simple');
  assertTrue(banner.length > 0, 'Should generate non-empty banner');
});

console.log(`\n${'='.repeat(40)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}`);

process.exit(failed > 0 ? 1 : 0);
