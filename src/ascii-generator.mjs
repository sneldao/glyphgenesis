/**
 * GlyphGenesis ASCII Art Generator - v2 ENHANCED
 * Features: Seed-based uniqueness, Composition/Mutation, Creativity scoring
 * New patterns: fractal, maze, flame, dna, terrain, mandala
 * Used by both Node.js scripts and browser frontend
 */

// ─── Character Sets ───
const CHARS = {
  detailed: ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '],
  simple: ['█', '▓', '▒', '░', ' '],
  blocks: ['█', '▓', '▒', '░', ' '],
  minimal: ['#', '-', '.', ' '],
  cyberpunk: ['█', '▓', '▒', '░', '│', '─', '┼', '┤', '├', '┬', '┴', ' '],
  retro: ['@', 'O', 'o', '~', '-', '=', '+', '*', '#', '&', '%', ' '],
  brutalist: ['█', '█', '█', '█', ' '],
  cosmic: ['✦', '✧', '◉', '○', '●', '◎', '★', '☆', ' ', ' '],
  ocean: ['~', '≈', '≋', '◎', '●', '○', '▪', '▫', '─', ' '],
  forest: ['♣', '♠', '♥', '♦', '•', '◦', ',', '░', '▒', ' '],
  neon: ['╔', '╗', '╚', '╝', '║', '═', '◈', '◇', '░', ' '],
  glitch: ['█', '▓', '░', '¦', '╌', '┆', '┊', '╳', '␀', '␗'],
};

// ─── Seed Hash for deterministic uniqueness ───
function hashSeed(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
    h = h >>> 0;
  }
  return h;
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    s = s >>> 0;
    return s / 4294967296;
  };
}

// ─── Parse natural language prompts ───
function parsePrompt(prompt) {
  const options = {
    type: 'pattern',
    pattern: null,
    theme: null,
    width: 40,
    height: 20,
    style: 'simple',
    framed: true,
    animated: false,
    seed: null
  };

  const lower = prompt.toLowerCase();

  // Pattern detection (expanded)
  const patternMap = {
    'circle': 'circles', 'wave': 'waves', 'diamond': 'diamond',
    'grid': 'grid', 'noise': 'noise', 'random': 'noise',
    'spiral': 'spiral', 'heart': 'heart', 'star': 'star',
    'fractal': 'fractal', 'maze': 'maze', 'flame': 'flame',
    'fire': 'flame', 'dna': 'dna', 'helix': 'dna',
    'terrain': 'terrain', 'landscape': 'terrain',
    'mandala': 'mandala', 'sacred': 'mandala',
    'matrix': 'matrix', 'rain': 'matrix',
    'plasma': 'plasma', 'lava': 'plasma',
  };
  for (const [key, val] of Object.entries(patternMap)) {
    if (lower.includes(key)) { options.pattern = val; break; }
  }
  if (!options.pattern) options.pattern = 'circles';

  // Theme detection (expanded)
  const themeMap = {
    'cyber': 'cyberpunk', 'neon': 'neon',
    'retro': 'retro', '80s': 'retro', 'vapor': 'retro',
    'brutal': 'brutalist', 'raw': 'brutalist',
    'cosmic': 'cosmic', 'space': 'cosmic', 'galaxy': 'cosmic',
    'ocean': 'ocean', 'sea': 'ocean', 'aqua': 'ocean',
    'forest': 'forest', 'nature': 'forest', 'green': 'forest',
    'glitch': 'glitch',
    'detail': 'detailed', 'block': 'blocks', 'minimal': 'minimal', 'simple': 'simple',
  };
  for (const [key, val] of Object.entries(themeMap)) {
    if (lower.includes(key)) { options.theme = val; break; }
  }

  // Size detection
  const sizeMatch = lower.match(/(\d+)\s*[xX]\s*(\d+)/);
  if (sizeMatch) {
    options.width = parseInt(sizeMatch[1]);
    options.height = parseInt(sizeMatch[2]);
  }

  // Animation detection
  if (lower.includes('animat') || lower.includes('motion') || lower.includes('moving')) {
    options.animated = true;
  }

  // Banner detection
  if (lower.includes('banner') || lower.includes('text') || lower.includes('write')) {
    options.type = 'banner';
  }

  // Composition/mutation detection
  if (lower.includes('compose') || lower.includes('layer') || lower.includes('combine')) {
    options.type = 'compose';
  }
  if (lower.includes('mutate') || lower.includes('evolve') || lower.includes('remix')) {
    options.type = 'mutate';
  }

  // Seed from prompt for uniqueness
  options.seed = hashSeed(prompt);

  return options;
}

// ─── Banner generator ───
function generateBanner(text, style = 'simple') {
  const fonts = {
    simple: {
      height: 5,
      chars: {
        'A': ['  A  ', ' A A ', 'AAAAA', 'A   A', 'A   A'],
        'B': ['BBBB ', 'B   B', 'BBBB ', 'B   B', 'BBBB '],
        'C': [' CCC ', 'C   C', 'C    ', 'C   C', ' CCC '],
        'D': ['DDD  ', 'D  D ', 'D   D', 'D  D ', 'DDD  '],
        'E': ['EEEEE', 'E    ', 'EEE  ', 'E    ', 'EEEEE'],
        'F': ['FFFFF', 'F    ', 'FFF  ', 'F    ', 'F    '],
        'G': [' GGG ', 'G   G', 'G GGG', 'G   G', ' GGG '],
        'H': ['H   H', 'H   H', 'HHHHH', 'H   H', 'H   H'],
        'I': ['IIIII', '  I  ', '  I  ', '  I  ', 'IIIII'],
        'J': ['JJJJJ', '   J ', '   J ', 'J  J ', ' JJ  '],
        'K': ['K   K', 'K  K ', 'KKK  ', 'K  K ', 'K   K'],
        'L': ['L    ', 'L    ', 'L    ', 'L    ', 'LLLLL'],
        'M': ['M   M', 'MM MM', 'M M M', 'M   M', 'M   M'],
        'N': ['N   N', 'NN  N', 'N N N', 'N  NN', 'N   N'],
        'O': [' OOO ', 'O   O', 'O   O', 'O   O', ' OOO '],
        'P': ['PPPP ', 'P   P', 'PPPP ', 'P    ', 'P    '],
        'Q': [' QQQ ', 'Q   Q', 'Q   Q', 'Q  Q ', ' QQ Q'],
        'R': ['RRRR ', 'R   R', 'RRRR ', 'R  R ', 'R   R'],
        'S': [' SSS ', 'S    ', ' SSS ', '    S', ' SSS '],
        'T': ['TTTTT', '  T  ', '  T  ', '  T  ', '  T  '],
        'U': ['U   U', 'U   U', 'U   U', 'U   U', ' UUU '],
        'V': ['V   V', 'V   V', 'V   V', ' V V ', '  V  '],
        'W': ['W   W', 'W   W', 'W W W', 'WW WW', 'W   W'],
        'X': ['X   X', ' X X ', '  X  ', ' X X ', 'X   X'],
        'Y': ['Y   Y', ' Y Y ', '  Y  ', '  Y  ', '  Y  '],
        'Z': ['ZZZZZ', '   Z ', '  Z  ', ' Z   ', 'ZZZZZ'],
        '0': [' OOO ', 'O   O', 'O   O', 'O   O', ' OOO '],
        '1': ['  1  ', ' 11  ', '  1  ', '  1  ', '11111'],
        '2': ['2222 ', '    2 ', ' 2222', '2    ', '22222'],
        '3': ['3333 ', '    3', ' 3333', '    3', '3333 '],
        '4': ['4   4', '4   4', '44444', '    4', '    4'],
        '5': ['55555', '5    ', '5555 ', '    5', '5555 '],
        '6': [' 6666', '6    ', '6666 ', '6   6', ' 666 '],
        '7': ['77777', '    7', '   7 ', '  7  ', '  7  '],
        '8': [' 888 ', '8   8', ' 888 ', '8   8', ' 888 '],
        '9': [' 9999', '9   9', ' 9999', '    9', ' 999 '],
        ' ': ['     ', '     ', '     ', '     ', '     ']
      }
    }
  };

  const font = fonts[style] || fonts.simple;
  const lines = Array(font.height).fill('');
  
  for (const char of text.toUpperCase()) {
    const charLines = font.chars[char] || font.chars[' '];
    for (let i = 0; i < font.height; i++) {
      lines[i] += charLines[i] + ' ';
    }
  }
  
  return lines.join('\n');
}

// ─── Shared pattern density functions ───
// Used by both generatePattern and generateComposed to avoid duplication
// Each function takes (x, y, t, rng, w, h, seed) and returns a density 0-4
const PATTERN_FNS = {
  waves: (x, y, t, _rng, w, h) => {
    const wave = Math.sin(x * 0.3 + t) * 5 + Math.sin(y * 0.2) * 3;
    return (wave + 10) / 5;
  },
  circles: (x, y, t, _rng, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    const animatedDist = dist - (t * 2) % 10;
    return Math.abs(animatedDist) / Math.min(w, h) * 5;
  },
  diamond: (x, y, t, _rng, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dist = Math.abs(x - cx) + Math.abs(y - cy);
    const pulse = Math.sin(t * 0.5) * 3;
    return (dist - pulse) / 5;
  },
  grid: (x, y) => {
    if (x % 5 === 0 && y % 3 === 0) return 4;
    if (x % 5 === 0 || y % 3 === 0) return 2;
    return 0;
  },
  star: (x, y, t, _rng, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    const burst = Math.abs(Math.sin(angle * 5 + t * 0.5)) * (20 - dist * 0.5);
    if (dist < 2) return 4;
    return burst / 4;
  },
  noise: (x, y, t) => {
    const s = x * 12.9898 + y * 78.233 + t * 0.1;
    const r = (Math.sin(s) * 43758.5453) % 1;
    if (r > 0.7) return 4;
    if (r > 0.4) return 3;
    if (r > 0.2) return 2;
    return 0;
  },
  spiral: (x, y, t, _rng, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    const s = Math.sin(dist * 0.3 - angle * 2 + t * 0.5);
    return s > 0.5 ? 4 : s > 0 ? 3 : s > -0.5 ? 2 : 0;
  },
  heart: (x, y, t, _rng, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dx = (x - cx) / (w * 0.15);
    const dy = (y - cy) / (h * 0.2) + 0.5;
    const h2 = Math.pow(dx*dx + dy*dy - 1, 3) - dx*dx*dy*dy*dy;
    const pulse = Math.sin(t) * 0.1;
    if (h2 < pulse) return 4;
    if (h2 < 0.1) return 3;
    if (h2 < 0.3) return 2;
    return 0;
  },
  fractal: (x, y, t, _rng, w, h) => {
    const cx = w / 2, cy = h / 2;
    const scale = 0.08;
    let zx = (x - cx) * scale, zy = (y - cy) * scale;
    let iter = 0;
    const maxIter = 12;
    while (zx*zx + zy*zy < 4 && iter < maxIter) {
      const tmp = zx*zx - zy*zy + (Math.sin(t * 0.3) * 0.3);
      zy = 2*zx*zy + (Math.cos(t * 0.2) * 0.3);
      zx = tmp;
      iter++;
    }
    return (iter / maxIter) * 4;
  },
  maze: (x, y, t, _rng) => {
    const wallX = ((x + Math.floor(t)) % 6) === 0;
    const wallY = ((y + Math.floor(t * 0.7)) % 4) === 0;
    const door = _rng() > 0.7;
    if (wallX && !door) return 4;
    if (wallY && !door) return 3;
    if (wallX || wallY) return 1;
    return 0;
  },
  flame: (x, y, t, _rng, w, h) => {
    const cx = w / 2;
    const dx = Math.abs(x - cx);
    const flameH = h * 0.8 * Math.exp(-dx * 0.1);
    const flicker = Math.sin(x * 0.5 + t * 3) * 2 + Math.cos(y * 0.3 + t * 2);
    const distFromTop = (h - y);
    const inFlame = distFromTop < flameH + flicker;
    if (!inFlame) return 0;
    const intensity = distFromTop / flameH;
    if (intensity > 0.7) return 4;
    if (intensity > 0.4) return 3;
    if (intensity > 0.15) return 2;
    return 1;
  },
  dna: (x, y, t, _rng, w) => {
    const cx = w / 2;
    const phase = y * 0.4 + t;
    const strand1 = cx + Math.sin(phase) * 8;
    const strand2 = cx + Math.sin(phase + Math.PI) * 8;
    const d1 = Math.abs(x - strand1);
    const d2 = Math.abs(x - strand2);
    const link = y % 4 === 0 && x > Math.min(strand1, strand2) && x < Math.max(strand1, strand2);
    if (d1 < 1.5) return 4;
    if (d2 < 1.5) return 3;
    if (link) return 2;
    return 0;
  },
  terrain: (x, y, t, _rng, w, h) => {
    const heightMap = Math.sin(x * 0.15) * 4 + Math.sin(x * 0.05 + t) * 6 + Math.cos(x * 0.08) * 3;
    const surfaceY = h / 2 - heightMap;
    if (y > surfaceY + 3) return 4;
    if (y > surfaceY + 1) return 3;
    if (y > surfaceY) return 2;
    if (y > surfaceY - 2) return 1;
    return 0;
  },
  mandala: (x, y, t, _rng, w, h) => {
    const cx = w / 2, cy = h / 2;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const angle = Math.atan2(dy, dx);
    const segments = 8;
    const symmetry = Math.cos(angle * segments) * 0.5 + 0.5;
    const rings = Math.sin(dist * 0.4 - t * 0.5);
    const pattern = symmetry * rings;
    if (pattern > 0.4) return 4;
    if (pattern > 0.1) return 3;
    if (pattern > -0.2) return 2;
    if (pattern > -0.5) return 1;
    return 0;
  },
  matrix: (x, y, t, _rng, w, h, seed) => {
    const drop = (x * 7 + seed) % 13;
    const headY = ((t * 3 + drop * 5) % (h + 10)) - 5;
    const trail = headY - y;
    if (trail >= 0 && trail < 1) return 4;
    if (trail >= 1 && trail < 4) return 3;
    if (trail >= 4 && trail < 7) return 2;
    if (trail >= 7 && trail < 10) return 1;
    return _rng() > 0.97 ? 2 : 0;
  },
  plasma: (x, y, t) => {
    const v1 = Math.sin(x * 0.1 + t);
    const v2 = Math.sin(y * 0.15 + t * 0.7);
    const v3 = Math.sin((x + y) * 0.08 + t * 0.5);
    const v4 = Math.sin(Math.sqrt(x*x + y*y) * 0.1 + t * 0.3);
    const v = (v1 + v2 + v3 + v4) / 4;
    return (v + 1) * 2;
  },
};

// ─── Pattern generator (v2 — seed-aware, uses shared PATTERN_FNS) ───
function generatePattern(type, width = 40, height = 20, time = 0, charSet = null, seed = 0) {
  const defaultChars = [' ', '.', 'o', 'O', '@'];
  const chars = charSet || defaultChars;
  const getChar = (density) => chars[Math.min(Math.max(0, Math.floor(density)), chars.length - 1)] || ' ';
  const rng = seededRandom(seed || 1);

  const fn = PATTERN_FNS[type] || PATTERN_FNS.noise;
  let result = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const density = fn(x, y, time, rng, width, height, seed);
      result += getChar(density);
    }
    result += '\n';
  }
  
  return result;
}

// ─── Composition Engine: layer multiple patterns (uses shared PATTERN_FNS) ───
function generateComposed(prompt, options = {}) {
  const parsed = parsePrompt(prompt);
  const { width = 40, height = 20, theme = null, seed = 0, time = 0 } = { ...parsed, ...options };
  const charSet = theme && CHARS[theme] ? CHARS[theme] : CHARS.detailed;
  const getChar = (density) => charSet[Math.min(Math.max(0, Math.floor(density)), charSet.length - 1)] || ' ';
  const rng = seededRandom(seed || 1);

  // Pick 2-3 random patterns to layer
  const composablePatterns = ['circles', 'waves', 'diamond', 'spiral', 'star', 'fractal', 'mandala', 'plasma'];
  const layerCount = 2 + (rng() > 0.6 ? 1 : 0);
  const chosen = [];
  for (let i = 0; i < layerCount; i++) {
    chosen.push(composablePatterns[Math.floor(rng() * composablePatterns.length)]);
  }

  // Blend modes
  const blend = rng() > 0.5 ? 'additive' : 'multiply';

  let result = '';
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let val = 0;
      for (const pat of chosen) {
        const fn = PATTERN_FNS[pat] || PATTERN_FNS.circles;
        const density = fn(x, y, time, rng, width, height, seed);
        if (blend === 'additive') {
          val = Math.max(val, density);
        } else {
          val = Math.max(val, density * 0.6);
        }
      }
      result += getChar(val);
    }
    result += '\n';
  }
  return result;
}

// ─── Mutation Engine: evolve existing art ───
function mutateArt(content, options = {}) {
  const { mutationRate = 0.1, theme = null, seed = 0 } = options;
  const charSet = theme && CHARS[theme] ? CHARS[theme] : CHARS.detailed;
  const rng = seededRandom(seed || Date.now());
  
  const lines = content.split('\n');
  const result = lines.map(line => {
    let mutated = '';
    for (let i = 0; i < line.length; i++) {
      if (rng() < mutationRate) {
        mutated += charSet[Math.floor(rng() * charSet.length)];
      } else {
        mutated += line[i];
      }
    }
    return mutated;
  });
  
  return result.join('\n');
}

// ─── Creativity Score: how unique/interesting is the art ───
function creativityScore(content) {
  const chars = content.replace(/\s/g, '');
  if (chars.length === 0) return 0;
  
  // Unique character ratio (more unique = more creative)
  const unique = new Set(chars).size;
  const charDiversity = unique / Math.min(chars.length, 50);
  
  // Density variance (good art has varying density)
  let prevDensity = 0;
  let variance = 0;
  const lines = content.split('\n').filter(l => l.length > 0);
  for (const line of lines) {
    const density = line.replace(/\s/g, '').length / line.length;
    variance += (density - prevDensity) ** 2;
    prevDensity = density;
  }
  const densityVariance = Math.sqrt(variance / Math.max(lines.length, 1));
  
  // Symmetry score
  let symmetry = 0;
  for (const line of lines) {
    const half = Math.floor(line.length / 2);
    for (let i = 0; i < half; i++) {
      if (line[i] === line[line.length - 1 - i]) symmetry++;
    }
  }
  const maxSymmetry = lines.reduce((s, l) => s + Math.floor(l.length / 2), 0);
  const symmetryScore = maxSymmetry > 0 ? symmetry / maxSymmetry : 0;
  
  // Combined score (0-100)
  const score = Math.round(
    (charDiversity * 30 + Math.min(densityVariance * 50, 30) + symmetryScore * 40)
  );
  
  return Math.min(100, Math.max(0, score));
}

// ─── Rarity classification ───
function getRarity(score) {
  if (score >= 85) return { name: 'Legendary', color: '#ff2d55', emoji: '✦' };
  if (score >= 70) return { name: 'Epic', color: '#a855f7', emoji: '◆' };
  if (score >= 50) return { name: 'Rare', color: '#06b6d4', emoji: '●' };
  if (score >= 30) return { name: 'Uncommon', color: '#22c55e', emoji: '○' };
  return { name: 'Common', color: '#8896ab', emoji: '·' };
}

// ─── Generate animated frames ───
function generateAnimated(prompt, options = {}) {
  const { frames = 10, interval = 0.5 } = options;
  const parsed = parsePrompt(prompt);
  const frameData = [];
  
  for (let i = 0; i < frames; i++) {
    const time = i * interval;
    const art = generatePattern(parsed.pattern, parsed.width, parsed.height, time, null, parsed.seed);
    const title = prompt.toUpperCase().slice(0, 30);
    frameData.push(generateFramed(art, title));
  }
  
  return frameData;
}

function generateFromHash(hash, width = 40, height = 20) {
  let result = '';
  const chars = CHARS.simple;
  const rng = seededRandom(hash);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = Math.floor(rng() * chars.length);
      result += chars[index];
    }
    result += '\n';
  }
  
  return result;
}

function generateFramed(content, title = 'GLYPH') {
  const lines = content.split('\n');
  const maxWidth = Math.max(...lines.map(l => l.length), title.length + 4);
  
  const topBorder = '╔' + '═'.repeat(maxWidth + 2) + '╗';
  const bottomBorder = '╚' + '═'.repeat(maxWidth + 2) + '╝';
  const titleLine = '║ ' + title.padEnd(maxWidth) + ' ║';
  const separator = '╟' + '─'.repeat(maxWidth + 2) + '╢';
  
  let framed = topBorder + '\n' + titleLine + '\n' + separator + '\n';
  
  for (const line of lines) {
    framed += '║ ' + line.padEnd(maxWidth) + ' ║\n';
  }
  
  framed += bottomBorder;
  return framed;
}

// ─── Main generate function ───
function generate(prompt, options = {}) {
  // Support natural language prompts
  if (typeof prompt === 'string' && !options.type && !options.pattern) {
    const parsed = parsePrompt(prompt);
    Object.assign(options, parsed);
  }

  const {
    type = 'pattern',
    pattern = 'circles',
    width = 40,
    height = 20,
    style = 'simple',
    framed = true,
    theme = null,
    animated = false,
    time = 0,
    seed = 0
  } = options;

  let art = '';

  if (type === 'banner') {
    art = generateBanner(prompt, style);
  } else if (type === 'compose') {
    art = generateComposed(prompt, options);
  } else if (type === 'mutate') {
    const base = generatePattern(pattern, width, height, time, null, seed);
    art = mutateArt(base, { mutationRate: 0.15, theme, seed });
  } else if (type === 'pattern') {
    const charSet = theme && CHARS[theme] ? CHARS[theme] : CHARS.detailed;
    art = generatePattern(pattern, width, height, time, charSet, seed);
  } else if (type === 'hash') {
    const hash = seed || hashSeed(prompt);
    art = generateFromHash(hash, width, height);
  }

  if (framed) {
    art = generateFramed(art, prompt.toUpperCase().slice(0, 30));
  }

  return art;
}

// ─── All available patterns and themes for UI ───
const PATTERN_LIST = [
  { id: 'circles', name: 'Circles', desc: 'Concentric rings' },
  { id: 'waves', name: 'Waves', desc: 'Sine wave oscillation' },
  { id: 'diamond', name: 'Diamond', desc: 'Manhattan distance' },
  { id: 'grid', name: 'Grid', desc: 'Structured lattice' },
  { id: 'noise', name: 'Noise', desc: 'Pseudo-random hash' },
  { id: 'star', name: 'Star', desc: 'Radial starburst' },
  { id: 'spiral', name: 'Spiral', desc: 'Logarithmic spiral' },
  { id: 'heart', name: 'Heart', desc: 'Heart shape' },
  { id: 'fractal', name: 'Fractal', desc: 'Julia set iteration' },
  { id: 'maze', name: 'Maze', desc: 'Procedural labyrinth' },
  { id: 'flame', name: 'Flame', desc: 'Fire simulation' },
  { id: 'dna', name: 'DNA', desc: 'Double helix' },
  { id: 'terrain', name: 'Terrain', desc: 'Heightmap landscape' },
  { id: 'mandala', name: 'Mandala', desc: 'Sacred geometry' },
  { id: 'matrix', name: 'Matrix', desc: 'Digital rain' },
  { id: 'plasma', name: 'Plasma', desc: 'Color field blending' },
];

const THEME_LIST = [
  { id: 'simple', name: 'Simple' },
  { id: 'cyberpunk', name: 'Cyberpunk' },
  { id: 'retro', name: 'Retro 80s' },
  { id: 'brutalist', name: 'Brutalist' },
  { id: 'cosmic', name: 'Cosmic' },
  { id: 'ocean', name: 'Ocean' },
  { id: 'forest', name: 'Forest' },
  { id: 'neon', name: 'Neon' },
  { id: 'glitch', name: 'Glitch' },
];

// Export for ES modules
export {
  generate,
  generateBanner,
  generatePattern,
  generateFramed,
  generateFromHash,
  generateAnimated,
  generateComposed,
  mutateArt,
  creativityScore,
  getRarity,
  parsePrompt,
  hashSeed,
  CHARS,
  PATTERN_LIST,
  THEME_LIST
};

export default { 
  generate, 
  generateBanner, 
  generatePattern, 
  generateFramed, 
  generateFromHash,
  generateAnimated,
  generateComposed,
  mutateArt,
  creativityScore,
  getRarity,
  parsePrompt,
  hashSeed,
  CHARS,
  PATTERN_LIST,
  THEME_LIST
};
