"""Circuit builders — the quantum mechanics that IS the art medium.

Every builder returns (n_qubits, gates, registers) where `gates` is the
sim.py / qiskit_backend.py shared spec and `registers` maps names to the
qubits whose marginal distribution a field should measure.

Quantum walk
------------
A coin qubit is rotated each step, then the position register shifts
±1 conditioned on the coin. After `steps` iterations the position
distribution shows ballistic twin peaks and interference fringes —
spreading linearly in `steps`, where a classical random walk spreads as
sqrt(steps). That distribution is the raw material for the art.

Entangled pair
--------------
Two walkers share a Bell pair of coins (H on coin A, CNOT A->B), then
each walks independently. The joint position distribution P(x_A, x_B)
concentrates along the diagonal — the correlation is produced by
entanglement and cannot be factored into independent walkers.
"""

import math


def _shift(pos, coin, coin_val):
    """Cyclic ±1 shift of `pos` (list of qubits, LSB first) conditioned
    on `coin == coin_val`. Gates for +1 and -1 are concatenated by the
    caller; they never fire on the same basis state because the coin
    selects the branch. Within one direction, gates must run MSB->LSB
    so each multi-controlled flip sees the original lower bits.
    """
    n = len(pos)
    inc, dec = [], []
    for j in reversed(range(n)):
        target = pos[j]
        low = pos[:j]
        if j == 0:
            inc.append(('mcx', ((coin, 1),), target))
            dec.append(('mcx', ((coin, 0),), target))
        else:
            inc.append(('mcx', ((coin, 1),) + tuple((q, 1) for q in low), target))
            dec.append(('mcx', ((coin, 0),) + tuple((q, 0) for q in low), target))
    return (inc, dec)[coin_val] if coin_val in (0, 1) else None


def walk_spec(n_pos=6, steps=6, coin_angle=None, coin_phase=0.0,
              start=None, coin=0, pos_base=1):
    """Single discrete-time quantum walk on a 2**n_pos cycle.

    Coin: Hadamard by default (canonical walk, ballistic spread ~ steps).
    Pass coin_angle to use Ry(angle) instead; coin_phase applies a phase
    bias P(phi) before each toss — the knob sweep mode turns per row.

    Layout: `coin` qubit + position register pos_base..pos_base+n_pos-1.
    Returns (n_qubits, gates, {'pos': [...]}).
    """
    if start is None:
        start = 1 << (n_pos - 1)          # centre of the cycle
    pos = list(range(pos_base, pos_base + n_pos))
    n_qubits = pos_base + n_pos

    gates = []
    for j in range(n_pos):                # load |start> into the register
        if (start >> j) & 1:
            gates.append(('x', pos[j]))

    inc = _shift(pos, coin, 1)
    dec = _shift(pos, coin, 0)
    toss = ('h', coin) if coin_angle is None else ('ry', coin_angle, coin)
    for _ in range(steps):
        if coin_phase:
            gates.append(('p', coin_phase, coin))
        gates.append(toss)
        gates += inc
        gates += dec
    return n_qubits, gates, {'pos': pos}


def entangled_walk_spec(n_pos=5, steps=4, coin_angle=None,
                        start_a=None, start_b=None):
    """Two walkers whose coins share a Bell pair.

    Layout:
        coin_a = 0, coin_b = 1,
        pos_a  = 2 .. 2+n_pos-1           (LSB first)
        pos_b  = 2+n_pos .. 2+2*n_pos-1

    The Bell correlation between coins makes the walkers' positions
    correlated: P(x_a, x_b) peaks on the diagonal, unlike the product
    distribution of independent walks.
    """
    half = 1 << (n_pos - 1)
    if start_a is None:
        start_a = half - (half >> 1)      # slightly left of centre
    if start_b is None:
        start_b = half + (half >> 1)      # slightly right of centre

    coin_a, coin_b = 0, 1
    pos_a = list(range(2, 2 + n_pos))
    pos_b = list(range(2 + n_pos, 2 + 2 * n_pos))
    n_qubits = 2 + 2 * n_pos

    gates = [('h', coin_a), ('mcx', ((coin_a, 1),), coin_b)]   # Bell pair
    for reg, s in ((pos_a, start_a), (pos_b, start_b)):
        for j in range(n_pos):
            if (s >> j) & 1:
                gates.append(('x', reg[j]))

    inc_a, dec_a = _shift(pos_a, coin_a, 1), _shift(pos_a, coin_a, 0)
    inc_b, dec_b = _shift(pos_b, coin_b, 1), _shift(pos_b, coin_b, 0)
    toss_a = ('h', coin_a) if coin_angle is None else ('ry', coin_angle, coin_a)
    toss_b = ('h', coin_b) if coin_angle is None else ('ry', coin_angle, coin_b)
    for _ in range(steps):
        gates.append(toss_a)
        gates.append(toss_b)
        gates += inc_a + dec_a + inc_b + dec_b
    return n_qubits, gates, {'pos_a': pos_a, 'pos_b': pos_b}


def walk2d_spec(n_pos=5, steps=6, coin_angle=None, start=None):
    """Single-coin alternating 2-D walk (Di Franco et al.).

    Layout: coin = 0, pos_x = 1..n_pos, pos_y = n_pos+1..2*n_pos.

    One coin steers both axes: even steps move x, odd steps move y.
    The shared coin entangles the two position registers, so the joint
    distribution P(x, y) is NOT separable — the 2-D structure is real,
    not a product of two 1-D walks.
    """
    if start is None:
        start = 1 << (n_pos - 1)
    coin = 0
    pos_x = list(range(1, 1 + n_pos))
    pos_y = list(range(1 + n_pos, 1 + 2 * n_pos))
    n_qubits = 1 + 2 * n_pos

    gates = []
    for reg in (pos_x, pos_y):
        for j in range(n_pos):
            if (start >> j) & 1:
                gates.append(('x', reg[j]))

    toss = ('h', coin) if coin_angle is None else ('ry', coin_angle, coin)
    for t in range(steps):
        gates.append(toss)
        reg = pos_x if t % 2 == 0 else pos_y
        gates += _shift(reg, coin, 1) + _shift(reg, coin, 0)
    return n_qubits, gates, {'pos_x': pos_x, 'pos_y': pos_y}


def ghz_spec(n=6, tilt=0.0):
    """GHZ state with an optional per-qubit RY tilt before measurement.

    Used for correlation masks: the parity of the measured bitstring is
    globally correlated — an entanglement signature, not just noise.
    """
    gates = [('h', 0)]
    for q in range(1, n):
        gates.append(('mcx', ((q - 1, 1),), q))
    for q in range(n):
        gates.append(('ry', tilt * (q + 1) / n, q))
    return n, gates, {'qubits': list(range(n))}
