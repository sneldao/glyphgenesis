"""CLI: `python3 -m quantum [options]`

Prints quantum-generated ASCII art, or emits JSON (--json) for the
Node.js bridge. Same code runs on Qollab with --backend aer/ionq once
Qiskit is available.
"""

import argparse
import json
import sys

from . import backend, field
from .render import THEMES, framed, render as render_field


def build_parser():
    p = argparse.ArgumentParser(
        prog='quantum',
        description='Quantum-circuit-driven ASCII art for GlyphGenesis')
    p.add_argument('--mode', choices=sorted(field.FIELDS), default='sweep',
                   help='field generation mode')
    p.add_argument('--width', type=int, default=40)
    p.add_argument('--height', type=int, default=16)
    p.add_argument('--steps', type=int, default=8,
                   help='quantum walk steps (ballistic spread ~ steps)')
    p.add_argument('--theme', choices=THEMES, default='cosmic')
    p.add_argument('--title', default='QUANTUM FIELD')
    p.add_argument('--shots', type=int, default=0,
                   help='measurement shots (0 = exact probabilities)')
    p.add_argument('--backend', default='auto',
                   choices=['auto', 'exact', 'qiskit', 'aer', 'ionq'])
    p.add_argument('--seed', type=int, default=None,
                   help='sampling seed — fixes shot noise')
    p.add_argument('--invert', action='store_true')
    p.add_argument('--bare', action='store_true', help='no frame')
    p.add_argument('--animate', type=int, default=0, metavar='N',
                   help='emit N frames — frame t measures the same '
                        'circuit after t steps (real time evolution)')
    p.add_argument('--json', action='store_true', dest='as_json',
                   help='emit {art, field, meta} as JSON')
    return p


def _frame(mode, width, height, steps, shots, bkd, seed, theme,
           invert, bare, title):
    fld, fmeta = field.FIELDS[mode](width=width, height=height,
                                    steps=steps, shots=shots,
                                    bkd=bkd, seed=seed)
    body = render_field(fld, theme=theme, invert=invert)
    art = body if bare else framed(body, title)
    rounded = [[round(v, 4) for v in row] for row in fld]
    return art, rounded, fmeta


def main(argv=None):
    args = build_parser().parse_args(argv)
    bkd = backend.resolve(args.backend)

    meta = {'mode': args.mode, 'backend': bkd,
            'shots': args.shots or 'exact', 'seed': args.seed,
            'theme': args.theme, 'size': [args.width, args.height]}

    if args.animate:
        # frame t = the same circuit measured after t steps — the state
        # genuinely evolves; wavefronts spread ballistically in time
        n_frames = min(args.animate, 8 if args.mode in
                       ('entangled', 'walk2d') else 24)
        frames = []
        for t in range(1, n_frames + 1):
            art, fld, fm = _frame(args.mode, args.width, args.height,
                                  t, args.shots or None, bkd, args.seed,
                                  args.theme, args.invert, args.bare,
                                  f'{args.title} t={t}')
            frames.append({'steps': t, 'art': art, 'field': fld})
        meta.update(animated=True, frames=n_frames)
        if args.as_json:
            json.dump({'frames': frames, 'meta': meta}, sys.stdout)
            sys.stdout.write('\n')
        else:
            for f in frames:
                print(f['art'], '\n')
            print(f'# mode={args.mode} backend={bkd} '
                  f'frames={n_frames}', file=sys.stderr)
        return 0

    steps = args.steps
    if args.mode in ('entangled', 'walk2d') and steps > 8:
        steps = 8                  # 11-12 qubit sim stays fast
    art, fld, fmeta = _frame(args.mode, args.width, args.height, steps,
                             args.shots or None, bkd, args.seed,
                             args.theme, args.invert, args.bare,
                             args.title)
    meta.update(steps=steps, **fmeta)

    if args.as_json:
        json.dump({'art': art, 'field': fld, 'meta': meta}, sys.stdout)
        sys.stdout.write('\n')
    else:
        print(art)
        print(f'# mode={args.mode} backend={bkd} '
              f'measurement={fmeta["measurement"]}', file=sys.stderr)
    return 0
