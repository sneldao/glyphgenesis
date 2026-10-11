"""GlyphGenesis · Quantum Observatory — Qollab edition.

Generative art *measured* from real quantum circuits. Each specimen
below is a density field built from the measurement distribution of a
discrete-time quantum walk — rendered as ASCII. Nothing here is drawn
by a classical algorithm: the twin ballistic peaks, interference
fringes and diagonal correlations are the physics.

Runs on the sandbox-injected `backend` (IonQ simulator/hardware) with
real shots when Qollab provides one; falls back to the built-in exact
statevector simulator when run locally (`python main.py`).
"""

import math

from quantum import backend as qb
from quantum import circuits, field, sim
from quantum.render import render as render_field

SHOTS = 4096          # real measurement statistics on the backend
SEED = 7
WIDTH, HEIGHT = 48, 18

# ── backend wiring ─────────────────────────────────────────────────
try:
    qb.set_qollab_backend(backend)          # injected by the Qollab runtime
    BKD = 'qollab'
    BKD_LABEL = getattr(backend, 'name', None) or 'qollab (IonQ)'
except NameError:
    BKD = 'exact'
    BKD_LABEL = 'exact statevector (built-in, no shots — deterministic)'


def banner():
    print('═' * 60)
    print(' GLYPHGENESIS · QUANTUM OBSERVATORY')
    print(' generative specimens measured from real circuits')
    print('═' * 60)
    print(f' backend : {BKD_LABEL}')
    print(f' shots   : {SHOTS if BKD == "qollab" else "n/a (exact)"}')
    print()


def specimen(no, title, note, fld, meta):
    print(f' SPECIMEN №{no} — {title}')
    print(f' circuit : {note}')
    print(f' qubits  : {meta.get("n_qubits", "?")}'
          f'   gates: {meta.get("gate_count", "?")}'
          f'   measured: {meta.get("measurement", "?")}')
    print('─' * 60)
    print(render_field(fld, 'simple'))
    print('─' * 60)
    print()


def ballistic_check():
    """The signature of a quantum walk: position std grows ~linearly
    in steps vs sqrt(steps) for a classical random walk. Computed on
    the same backend the art was measured on."""
    print(' PHYSICS CHECK — ballistic spreading')
    print(' steps  quantum σ   classical σ   ratio')
    prev = None
    for steps in (4, 8, 16):
        n_q, gates, regs = circuits.walk_spec(6, steps)
        if BKD == 'qollab':
            counts = qb.run_counts(n_q, gates, SHOTS, BKD, SEED)
            dist = {k: c / SHOTS for k, c in sim.marginal(counts, regs['pos']).items()}
        else:
            dist = sim.marginal(qb.run_probs(n_q, gates, BKD), regs['pos'])
        mean = sum(x * p for x, p in dist.items())
        var = sum((x - mean) ** 2 * p for x, p in dist.items())
        std = math.sqrt(var)
        classical = math.sqrt(steps)
        ratio = f'{std / prev:.2f}' if prev else '  — '
        print(f'  {steps:>3}    {std:7.2f}      {classical:6.2f}      {ratio}×')
        prev = std
    print(' σ roughly doubles as steps double → ballistic, not diffusive.')
    print()


def main():
    banner()

    fld, meta = field.walk2d_field(WIDTH, HEIGHT, n_pos=5, steps=6,
                                   shots=SHOTS if BKD == 'qollab' else None,
                                   bkd=BKD, seed=SEED)
    specimen('01', 'QUANTUM WALK 2-D',
             'single coin steering x/y alternately — axes correlate',
             fld, meta)

    fld, meta = field.entangled_field(WIDTH, HEIGHT, n_pos=5, steps=4,
                                      shots=SHOTS if BKD == 'qollab' else None,
                                      bkd=BKD, seed=SEED)
    specimen('02', 'ENTANGLED PAIR',
             'two walkers sharing a Bell coin pair — diagonal = entanglement',
             fld, meta)

    fld, meta = field.sweep_field(WIDTH, HEIGHT, n_pos=6, steps=8,
                                  shots=SHOTS if BKD == 'qollab' else None,
                                  bkd=BKD, seed=SEED)
    specimen('03', 'WAVE SWEEP',
             'walk start position scanning down the canvas — wavefronts',
             fld, meta)

    ballistic_check()

    print('═' * 60)
    print(' Each specimen is reproducible from its circuit spec — the')
    print(' provenance model behind GlyphGenesis on-chain mints.')
    print(' github.com/sneldao/glyphgenesis · MIT')
    print('═' * 60)


main()
