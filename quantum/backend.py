"""Backend dispatch: run a gate spec, get outcome probabilities.

Backends
--------
exact   built-in statevector (sim.py) — zero dependencies, default
qiskit  Qiskit Statevector — exact probabilities via Qiskit
aer     qiskit_aer.AerSimulator — real finite-shot sampling
ionq    placeholder for Qollab/IonQ — pass a configured sampler

With `shots` set, the 'exact' backend samples from the exact
distribution with a seeded RNG — the right way to develop finite-shot
art locally before moving to real hardware.
"""

import importlib

from . import sim


def _to_qiskit(n_qubits, gates):
    """Transpile a gate spec to a Qiskit QuantumCircuit."""
    from qiskit import QuantumCircuit
    from qiskit.circuit.library import MCXGate

    qc = QuantumCircuit(n_qubits)
    for g in gates:
        op = g[0]
        if op == 'x':
            qc.x(g[1])
        elif op == 'h':
            qc.h(g[1])
        elif op == 'ry':
            qc.ry(g[1], g[2])
        elif op == 'p':
            qc.p(g[1], g[2])
        elif op == 'mcx':
            controls = [q for q, _ in g[1]]
            # ctrl_state is a bitstring over controls, MSB = first control
            ctrl_state = ''.join(str(v) for _, v in g[1])
            qc.append(MCXGate(len(controls), ctrl_state=ctrl_state),
                      controls + [g[2]])
        else:
            raise ValueError(f'unknown gate: {g!r}')
    return qc


def _aer_counts(n_qubits, gates, shots, seed):
    """Sample on qiskit_aer.AerSimulator. Returns {basis_int: count}."""
    from qiskit_aer import AerSimulator

    qc = _to_qiskit(n_qubits, gates)
    qc.measure_all()
    backend = AerSimulator(seed_simulator=seed)
    result = backend.run(qc, shots=shots).result()
    raw = result.get_counts()
    return {int(k.replace(' ', ''), 2): v for k, v in raw.items()}


def _qiskit_probs(n_qubits, gates):
    """Exact probabilities via Qiskit Statevector (no Aer needed)."""
    from qiskit.quantum_info import Statevector

    qc = _to_qiskit(n_qubits, gates)
    sv = Statevector(qc)
    return {i: p for i, p in enumerate(sv.probabilities()) if p > 0}


def run_probs(n_qubits, gates, backend='exact'):
    """Exact probability distribution {basis_int: p} for a gate spec."""
    if backend == 'exact':
        return sim.probabilities(sim.run(n_qubits, gates))
    if backend in ('qiskit', 'aer', 'ionq'):
        return _qiskit_probs(n_qubits, gates)
    raise ValueError(f'unknown backend: {backend}')


def run_counts(n_qubits, gates, shots, backend='exact', seed=None):
    """Finite-shot counts {basis_int: count}.

    'aer' uses real simulator sampling; everything else samples the
    exact distribution (seeded, deterministic).
    """
    if backend == 'aer' and importlib.util.find_spec('qiskit_aer'):
        return _aer_counts(n_qubits, gates, shots, seed)
    if backend == 'ionq':
        raise RuntimeError(
            'ionq backend is wired on Qollab — pass its sampler to '
            'run_counts_on_sampler() or run locally with aer/exact.')
    probs = run_probs(n_qubits, gates, backend)
    return sim.sample(probs, shots, seed)


def resolve(requested):
    """Pick the best available backend for a requested one.

    'auto' prefers aer (real sampling) then qiskit then exact.
    """
    if requested != 'auto':
        return requested
    if importlib.util.find_spec('qiskit_aer'):
        return 'aer'
    if importlib.util.find_spec('qiskit'):
        return 'qiskit'
    return 'exact'
