"""Exact statevector simulator — zero dependencies.

Simulates the gate-spec format produced by circuits.py so the engine runs
anywhere (local dev, CI, the browser-side fallback) without Qiskit. On
Qollab the same specs are transpiled to Qiskit and run on IonQ hardware.

Gate spec tuples:
    ('x',  q)                  Pauli-X
    ('h',  q)                  Hadamard
    ('ry', theta, q)           RY rotation
    ('p',  phi,   q)           Phase  diag(1, e^{i phi})
    ('mcx', controls, target)  controls = ((qubit, required_bit), ...)

Qubit indexing: qubit q is bit q of the basis-state integer (q0 = LSB).
Registers little-endian: pos register [base .. base+n-1] encodes the
position with `base` as least significant bit.
"""

import cmath
import math
import random

_SQ = 1 / math.sqrt(2)
_H = ((_SQ, _SQ), (_SQ, -_SQ))


def _apply_1q(state, q, m):
    step = 1 << q
    for base in range(0, len(state), step << 1):
        for i in range(base, base + step):
            j = i + step
            s0, s1 = state[i], state[j]
            state[i] = m[0][0] * s0 + m[0][1] * s1
            state[j] = m[1][0] * s0 + m[1][1] * s1


def _apply_mcx(state, controls, target):
    tmask = 1 << target
    for i in range(len(state)):
        if i & tmask:
            continue
        if all(((i >> q) & 1) == v for q, v in controls):
            j = i | tmask
            state[i], state[j] = state[j], state[i]


def run(n_qubits, gates):
    """Execute a gate spec, return the statevector as a list of complex."""
    state = [0j] * (1 << n_qubits)
    state[0] = 1 + 0j
    for g in gates:
        op = g[0]
        if op == 'x':
            _apply_1q(state, g[1], ((0, 1), (1, 0)))
        elif op == 'h':
            _apply_1q(state, g[1], _H)
        elif op == 'ry':
            c, s = math.cos(g[1] / 2), math.sin(g[1] / 2)
            _apply_1q(state, g[2], ((c, -s), (s, c)))
        elif op == 'p':
            _apply_1q(state, g[2], ((1, 0), (0, cmath.exp(1j * g[1]))))
        elif op == 'mcx':
            _apply_mcx(state, g[1], g[2])
        else:
            raise ValueError(f'unknown gate: {g!r}')
    return state


def probabilities(state):
    """Basis-state probabilities {int: float}."""
    return {i: (a * a.conjugate()).real for i, a in enumerate(state)}


def marginal(probs, keep_qubits):
    """Marginal distribution over the given qubits.

    Returns {value: p} where value packs kept qubits little-endian:
    keep_qubits[0] is the LSB of `value`.
    """
    out = {}
    for i, p in probs.items():
        v = 0
        for bit, q in enumerate(keep_qubits):
            v |= ((i >> q) & 1) << bit
        out[v] = out.get(v, 0.0) + p
    return out


def sample(probs, shots, seed=None):
    """Sample `shots` outcomes from a probability dict.

    Returns {outcome: count}. Deterministic for a fixed seed — used to
    emulate finite-shot hardware statistics when no sampler backend is
    available.
    """
    rng = random.Random(seed)
    keys = sorted(probs)
    cum, acc = [], 0.0
    for k in keys:
        acc += probs[k]
        cum.append(acc)
    counts = {}
    for _ in range(shots):
        r = rng.random()
        lo, hi = 0, len(cum) - 1
        while lo < hi:
            mid = (lo + hi) >> 1
            if r < cum[mid]:
                hi = mid
            else:
                lo = mid + 1
        k = keys[lo]
        counts[k] = counts.get(k, 0) + 1
    return counts
