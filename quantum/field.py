"""Density fields from quantum measurement.

A field is a height x width matrix of floats in [0, 1] — the same
contract the classical PATTERN_FNS honour (they return 0-4 densities;
fields are normalised, render.py maps them onto a theme charset).

Modes
-----
sweep      one walk per row; the coin angle advances down the canvas so
           the interference fringe pattern shears vertically
grid       separable product of two independent walks — an
           interference lattice
entangled  joint position distribution of two walkers with entangled
           coins — correlation along the diagonal is the entanglement
           made visible
"""

import math

from . import backend, circuits, sim


def _resample(dist, n_positions, width, lo=None, hi=None):
    """Bin a distribution over positions [lo, hi) of the 2**n cycle down
    to `width` cells. Windowing zooms the render onto the region the
    walker can actually reach — the fringes fill the canvas."""
    n_side = 1 << n_positions
    if lo is None:
        lo, hi = 0, n_side
    span = max(hi - lo, 1)
    row = [0.0] * width
    for pos, p in dist.items():
        if pos < lo or pos >= hi:
            continue
        row[min((pos - lo) * width // span, width - 1)] += p
    return row


def _window(start, steps, n_positions, pad=2):
    n_side = 1 << n_positions
    return max(start - steps - pad, 0), min(start + steps + pad, n_side)


def _normalize(field, gamma=0.4):
    peak = max((v for row in field for v in row), default=0.0)
    if peak <= 0:
        return field
    return [[(v / peak) ** gamma for v in row] for row in field]


def _measure(n_qubits, gates, keep, shots, bkd, seed):
    """Distribution over `keep` qubits: exact or finite-shot sampled."""
    if shots:
        counts = backend.run_counts(n_qubits, gates, shots, bkd, seed)
        mc = sim.marginal(counts, keep)
        return {k: c / shots for k, c in mc.items()}, 'shots'
    probs = backend.run_probs(n_qubits, gates, bkd)
    return sim.marginal(probs, keep), 'exact'


def sweep_field(width, height, n_pos=6, steps=6,
                coin_angle=math.pi / 2, shots=None, bkd='exact',
                seed=None):
    """One walk per row, starting position sweeping left to right down
    the canvas — the twin ballistic peaks trace diagonal wavefronts."""
    field, meta = [], {'rows': []}
    centre = 1 << (n_pos - 1)
    n_side = 1 << n_pos
    # starts sweep from centre-steps to centre+steps; window covers the
    # full reachable range
    lo, hi = _window(centre, 2 * steps, n_pos)
    for y in range(height):
        start = centre - steps + round(
            (y / max(height - 1, 1)) * 2 * steps)
        start = min(max(start, 0), n_side - 1)
        n_q, gates, regs = circuits.walk_spec(
            n_pos, steps, coin_angle=coin_angle, start=start)
        dist, how = _measure(n_q, gates, regs['pos'], shots, bkd,
                             None if seed is None else seed + y)
        field.append(_resample(dist, n_pos, width, lo, hi))
        meta['rows'].append(start)
    meta['measurement'] = how
    return _normalize(field), meta


def grid_field(width, height, n_pos=6, steps=6, theta_x=math.pi / 2,
               theta_y=math.pi / 3, shots=None, bkd='exact', seed=None):
    """Separable lattice: independent walks on each axis."""
    start = 1 << (n_pos - 1)
    lo, hi = _window(start, steps, n_pos)
    n_q, gx, rx = circuits.walk_spec(n_pos, steps, coin_angle=theta_x)
    dx, how = _measure(n_q, gx, rx['pos'], shots, bkd, seed)
    _, gy, ry = circuits.walk_spec(n_pos, steps, coin_angle=theta_y)
    dy, _ = _measure(n_q, gy, ry['pos'], shots, bkd, seed)
    col = _resample(dx, n_pos, width, lo, hi)
    rowd = _resample(dy, n_pos, height, lo, hi)
    field = [[math.sqrt(col[x] * rowd[y]) for x in range(width)]
             for y in range(height)]
    return _normalize(field), {'measurement': how}


def entangled_field(width, height, n_pos=5, steps=4,
                    shots=None, bkd='exact', seed=None):
    """Joint position distribution of two coin-entangled walkers."""
    n_q, gates, regs = circuits.entangled_walk_spec(n_pos, steps)
    keep = regs['pos_a'] + regs['pos_b']
    dist, how = _measure(n_q, gates, keep, shots, bkd, seed)
    n_side = 1 << n_pos
    half = n_side >> 1
    lo_a, hi_a = _window(half - (half >> 1), steps, n_pos)
    lo_b, hi_b = _window(half + (half >> 1), steps, n_pos)
    span_x, span_y = max(hi_a - lo_a, 1), max(hi_b - lo_b, 1)
    field = [[0.0] * width for _ in range(height)]
    for joint, p in dist.items():
        xa, xb = joint & (n_side - 1), joint >> n_pos
        if not (lo_a <= xa < hi_a and lo_b <= xb < hi_b):
            continue
        x = min((xa - lo_a) * width // span_x, width - 1)
        y = min((xb - lo_b) * height // span_y, height - 1)
        field[y][x] += p
    return _normalize(field), {'measurement': how,
                               'n_qubits': n_q, 'gate_count': len(gates)}


def walk2d_field(width, height, n_pos=5, steps=6,
                 shots=None, bkd='exact', seed=None):
    """Joint distribution of the single-coin 2-D walk — one coin steers
    both axes alternately, so x and y end up correlated."""
    n_q, gates, regs = circuits.walk2d_spec(n_pos, steps)
    keep = regs['pos_x'] + regs['pos_y']
    dist, how = _measure(n_q, gates, keep, shots, bkd, seed)
    n_side = 1 << n_pos
    centre = n_side >> 1
    # each axis only moves on alternating steps -> spread ~ steps/2
    lo, hi = _window(centre, steps // 2 + 1, n_pos, pad=3)
    span = max(hi - lo, 1)
    field = [[0.0] * width for _ in range(height)]
    for joint, p in dist.items():
        xa, ya = joint & (n_side - 1), joint >> n_pos
        if not (lo <= xa < hi and lo <= ya < hi):
            continue
        x = min((xa - lo) * width // span, width - 1)
        y = min((ya - lo) * height // span, height - 1)
        field[y][x] += p
    return _normalize(field), {'measurement': how,
                               'n_qubits': n_q, 'gate_count': len(gates)}


FIELDS = {'sweep': sweep_field, 'grid': grid_field,
          'entangled': entangled_field, 'walk2d': walk2d_field}
