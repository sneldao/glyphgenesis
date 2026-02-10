/**
 * ASCII Art Generator - Shared Module
 * Used by both Node.js scripts and browser frontend
 */

const CHARS = {
  detailed: ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' '],
  simple: ['█', '▓', '▒', '░', ' '],
  blocks: ['█', '▓', '▒', '░', ' '],
  minimal: ['#', '-', '.', ' ']
};

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
        ' ': ['     ', '     ', '     ', '     ', '     ']
      }
    }
  };

  const font = fonts[style];
  if (!font) return text;
  
  const lines = Array(font.height).fill('');
  
  for (const char of text.toUpperCase()) {
    const charLines = font.chars[char] || font.chars[' '];
    for (let i = 0; i < font.height; i++) {
      lines[i] += charLines[i] + ' ';
    }
  }
  
  return lines.join('\n');
}

function generatePattern(type, width = 40, height = 20) {
  const patterns = {
    waves: (x, y) => {
      const wave = Math.sin(x * 0.3) * 5 + Math.sin(y * 0.2) * 3;
      return wave > 0 ? '~' : '-';
    },
    
    circles: (x, y) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const normalized = dist / Math.min(width, height);
      if (normalized < 0.2) return '@';
      if (normalized < 0.4) return 'O';
      if (normalized < 0.6) return 'o';
      if (normalized < 0.8) return '.';
      return ' ';
    },
    
    diamond: (x, y) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const dist = Math.abs(x - centerX) + Math.abs(y - centerY);
      if (dist < 5) return '#';
      if (dist < 10) return '+';
      if (dist < 15) return '.';
      return ' ';
    },
    
    grid: (x, y) => {
      if (x % 5 === 0 || y % 3 === 0) return '+';
      return ' ';
    },
    
    noise: (x, y) => {
      const rand = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
      if (rand > 0.7) return '#';
      if (rand > 0.4) return '+';
      if (rand > 0.2) return '.';
      return ' ';
    }
  };

  const generator = patterns[type] || patterns.noise;
  let result = '';
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result += generator(x, y);
    }
    result += '\n';
  }
  
  return result;
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

function generateFramed(content, title = 'MONAD') {
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
  const {
    type = 'pattern',
    pattern = 'circles',
    width = 40,
    height = 20,
    style = 'simple',
    framed = true
  } = options;

  let art = '';

  if (type === 'banner') {
    art = generateBanner(prompt, style);
  } else if (type === 'pattern') {
    art = generatePattern(pattern, width, height);
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
  CHARS
};

// Default export
export default { generate, generateBanner, generatePattern, generateFramed, generateFromHash, CHARS };
