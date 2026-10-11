"""Field -> ASCII rendering. Theme charsets mirror src/ascii-generator.mjs
so quantum pieces sit inside the same visual system."""

CHARS = {
    'detailed': list('@#S%?*+;:,. '),
    'simple':   list('█▓▒░ '),
    'blocks':   list('█▓▒░ '),
    'minimal':  list('#-. '),
    'cyberpunk': list('█▓▒░│─┼┤├┬┴ '),
    'retro':    list('@Oo~-=+*#&% '),
    'brutalist': list('████ '),
    'cosmic':   list('✦✧◉○●◎★☆  '),
    'ocean':    list('~≈≋◎●○▪▫─ '),
    'forest':   list('♣♠♥♦•◦,░▒ '),
    'neon':     list('╔╗╚╝║═◈◇░ '),
    'glitch':   list('█▓░¦╌┆┊╳␀␗'),
}
THEMES = sorted(CHARS)


def render(field, theme='cosmic', invert=False):
    # charsets are ordered dense -> sparse (same convention as the JS
    # engine): field peak should land on index 0
    chars = CHARS.get(theme, CHARS['simple'])
    last = len(chars) - 1
    lines = []
    for row in field:
        line = ''
        for v in row:
            d = v if invert else 1.0 - v
            line += chars[min(max(int(round(d * last)), 0), last)]
        lines.append(line)
    return '\n'.join(lines)


def framed(content, title='QUANTUM'):
    lines = content.split('\n')
    width = max([len(l) for l in lines] + [len(title) + 4])
    top = '╔' + '═' * (width + 2) + '╗'
    sep = '╟' + '─' * (width + 2) + '╢'
    bot = '╚' + '═' * (width + 2) + '╝'
    body = '\n'.join('║ ' + l.ljust(width) + ' ║' for l in lines)
    return f'{top}\n║ {title.ljust(width)} ║\n{sep}\n{body}\n{bot}'
