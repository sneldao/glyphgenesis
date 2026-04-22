/**
 * GlyphGenesis ASCII Art Generator - ENHANCED
 * Features: Themes, Animation, LLM-style Prompt Parsing
 * Used by both Node.js scripts and browser frontend
 */

const CHARS = {
  detailed: ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '],
  simple: ['█', '▓', '▒', '░', ' '],
  blocks: ['█', '▓', '▒', '░', ' '],
  minimal: ['#', '-', '.', ' '],
  // Theme-specific character sets
  cyberpunk: ['█', '▓', '▒', '░', '│', '─', '┼', '┤', '├', '┬', '┴', ' '],
  retro: ['@', 'O', 'o', '~', '-', '=', '+', '*', '#', '&', '%', ' '],
  brutalist: ['█', '█', '█', '█', ' '],
  cosmic: ['✦', '✧', '◉', '○', '●', '◎', '★', '☆', ' ', ' '],
  ocean: ['~', '≈', '≋', '◎', '●', '○', '▪', '▫', '─', ' '],
  forest: ['🌲', '🌳', '🌴', '🌿', '☘', '🍃', '•', '◦', ',', ' ']
};

// Parse natural language prompts
function parsePrompt(prompt) {
  const options = {
    type: 'pattern',
    pattern: null,
    theme: null,
    width: 40,
    height: 20,
    style: 'simple',
    framed: true,
    animated: false
  };

  const lower = prompt.toLowerCase();

  // Pattern detection
  if (lower.includes('circle')) options.pattern = 'circles';
  else if (lower.includes('wave')) options.pattern = 'waves';
  else if (lower.includes('diamond')) options.pattern = 'diamond';
  else if (lower.includes('grid')) options.pattern = 'grid';
  else if (lower.includes('noise') || lower.includes('random')) options.pattern = 'noise';
  else if (lower.includes('spiral')) options.pattern = 'spiral';
  else if (lower.includes('heart')) options.pattern = 'heart';
  else if (lower.includes('star')) options.pattern = 'star';
  else options.pattern = 'circles'; // default

  // Theme detection
  if (lower.includes('cyber')) options.theme = 'cyberpunk';
  else if (lower.includes('retro') || lower.includes('80s')) options.theme = 'retro';
  else if (lower.includes('brutal')) options.theme = 'brutalist';
  else if (lower.includes('cosmic') || lower.includes('space')) options.theme = 'cosmic';
  else if (lower.includes('ocean') || lower.includes('sea')) options.theme = 'ocean';
  else if (lower.includes('forest') || lower.includes('nature')) options.theme = 'forest';

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

  return options;
}

// Banner generator with configurable style
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

// Pattern generators
function generatePattern(type, width = 40, height = 20, time = 0) {
  const patterns = {
    waves: (x, y, t) => {
      const wave = Math.sin(x * 0.3 + t) * 5 + Math.sin(y * 0.2) * 3;
      return wave > 0 ? '~' : '-';
    },
    
    circles: (x, y, t) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      // Animate the circles
      const animatedDist = dist - (t * 2) % 10;
      const normalized = Math.abs(animatedDist) / Math.min(width, height);
      if (normalized < 0.2) return '@';
      if (normalized < 0.4) return 'O';
      if (normalized < 0.6) return 'o';
      if (normalized < 0.8) return '.';
      return ' ';
    },
    
    diamond: (x, y, t) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const dist = Math.abs(x - centerX) + Math.abs(y - centerY);
      // Pulsing effect
      const pulse = Math.sin(t * 0.5) * 3;
      const adjusted = dist - pulse;
      if (adjusted < 5) return '#';
      if (adjusted < 10) return '+';
      if (adjusted < 15) return '.';
      return ' ';
    },
    
    grid: (x, y, t) => {
      if (x % 5 === 0 || y % 3 === 0) return '+';
      return ' ';
    },
    
    noise: (x, y, t) => {
      const seed = x * 12.9898 + y * 78.233 + t * 0.1;
      const rand = (Math.sin(seed) * 43758.5453) % 1;
      if (rand > 0.7) return '#';
      if (rand > 0.4) return '+';
      if (rand > 0.2) return '.';
      return ' ';
    },
    
    spiral: (x, y, t) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);
      const spiral = Math.sin(dist * 0.3 - angle * 2 + t * 0.5);
      if (spiral > 0.5) return '●';
      if (spiral > 0) return '○';
      if (spiral > -0.5) return '◌';
      return ' ';
    },
    
    heart: (x, y, t) => {
      const centerX = width / 2;
      const centerY = height / 2;
      // Heart shape
      const dx = (x - centerX) / (width * 0.15);
      const dy = (y - centerY) / (height * 0.2) + 0.5;
      const heart = Math.pow(dx*dx + dy*dy - 1, 3) - dx*dx*dy*dy*dy;
      const pulse = Math.sin(t) * 0.1;
      if (heart < pulse) return '♥';
      if (heart < 0.1) return '❤';
      if (heart < 0.3) return '♡';
      return ' ';
    },
    
    star: (x, y, t) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx);
      // Star burst pattern
      const star = Math.abs(Math.sin(angle * 5 + t * 0.5)) * (20 - dist * 0.5);
      if (dist < 2) return '★';
      if (star > 8) return '✦';
      if (star > 5) return '✧';
      if (star > 2) return '·';
      return ' ';
    }
  };

  const generator = patterns[type] || patterns.noise;
  let result = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result += generator(x, y, time);
    }
    result += '\n';
  }
  
  return result;
}

// Generate animated frames
function generateAnimated(prompt, options = {}) {
  const { frames = 10, interval = 0.5 } = options;
  const parsed = parsePrompt(prompt);
  const frameData = [];
  
  for (let i = 0; i < frames; i++) {
    const time = i * interval;
    const art = generatePattern(parsed.pattern, parsed.width, parsed.height, time);
    const title = prompt.toUpperCase().slice(0, 30);
    frameData.push(generateFramed(art, title));
  }
  
  return frameData;
}

function generateFromHash(hash, width = 40, height = 20) {
  let result = '';
  const chars = CHARS.simple;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = ((x * 7) + (y * 13) + hash) % chars.length;
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
    animated = false
  } = options;

  let art = '';

  if (type === 'banner') {
    art = generateBanner(prompt, style);
  } else if (type === 'pattern') {
    const time = options.time || 0;
    art = generatePattern(pattern, width, height, time);
  } else if (type === 'hash') {
    const hash = prompt.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    art = generateFromHash(hash, width, height);
  }

  if (framed) {
    art = generateFramed(art, prompt.toUpperCase().slice(0, 30));
  }

  return art;
}

// Export for ES modules
export {
  generate,
  generateBanner,
  generatePattern,
  generateFramed,
  generateFromHash,
  generateAnimated,
  parsePrompt,
  CHARS
};

// Default export
export default { 
  generate, 
  generateBanner, 
  generatePattern, 
  generateFramed, 
  generateFromHash,
  generateAnimated,
  parsePrompt,
  CHARS 
};