/**
 * ASCII Generator Unit Tests
 * Standalone tests that don't require Hardhat
 */

import { generate, generatePattern, generateFramed, generateBanner, CHARS } from '../src/ascii-generator.mjs';

// Simple test runner
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

console.log('Running ASCII Generator Tests...\n');

// Pattern generation tests
test('generatePattern creates circles pattern', () => {
  const art = generatePattern('circles', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
  assertTrue(art.includes('@') || art.includes('O'), 'Should contain circle characters');
});

test('generatePattern creates waves pattern', () => {
  const art = generatePattern('waves', 40, 10);
  assertTrue(art.length > 0, 'Should generate non-empty art');
  assertTrue(art.includes('~') || art.includes('-'), 'Should contain wave characters');
});

test('generatePattern creates diamond pattern', () => {
  const art = generatePattern('diamond', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
  assertTrue(art.includes('#') || art.includes('+'), 'Should contain diamond characters');
});

test('generatePattern creates grid pattern', () => {
  const art = generatePattern('grid', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
  assertTrue(art.includes('+'), 'Should contain grid characters');
});

test('generatePattern creates noise pattern', () => {
  const art = generatePattern('noise', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

test('generatePattern defaults to noise for unknown pattern', () => {
  const art = generatePattern('unknown', 40, 15);
  assertTrue(art.length > 0, 'Should generate non-empty art');
});

// Framing tests
test('generateFramed adds border and title', () => {
  const content = 'TEST\nART';
  const framed = generateFramed(content, 'TITLE');
  assertContains(framed, '╔', 'Should have top-left corner');
  assertContains(framed, '╗', 'Should have top-right corner');
  assertContains(framed, '╚', 'Should have bottom-left corner');
  assertContains(framed, '╝', 'Should have bottom-right corner');
  assertContains(framed, 'TITLE', 'Should contain title');
});

// Banner tests
test('generateBanner creates text banner', () => {
  const banner = generateBanner('MONAD', 'simple');
  assertTrue(banner.length > 0, 'Should generate non-empty banner');
  assertContains(banner, 'M', 'Should contain letter M');
});

test('generateBanner handles spaces', () => {
  const banner = generateBanner('A B', 'simple');
  assertTrue(banner.length > 0, 'Should generate non-empty banner');
});

// Full generation tests
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

// Dimension tests
test('generatePattern respects dimensions', () => {
  const width = 20;
  const height = 10;
  const art = generatePattern('grid', width, height);
  const lines = art.split('\n').filter(l => l.length > 0);
  assertEqual(lines.length, height, 'Should have correct height');
  assertEqual(lines[0].length, width, 'Should have correct width');
});

// Character set tests
test('CHARS object has expected character sets', () => {
  assertTrue(CHARS.detailed.length > 0, 'Should have detailed chars');
  assertTrue(CHARS.simple.length > 0, 'Should have simple chars');
  assertTrue(CHARS.blocks.length > 0, 'Should have blocks chars');
  assertTrue(CHARS.minimal.length > 0, 'Should have minimal chars');
});

console.log(`\n${'='.repeat(40)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(40)}`);

process.exit(failed > 0 ? 1 : 0);
