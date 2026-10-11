"""Backend dispatch: run a gate spec, get outcome probabilities.

Backends
--------
qollab  the `backend` object Qollab injects (IonQ simulator/hardware)
exact   built-in statevector (sim.py) — zero dependencies, fallback
qiskit  Qiskit Statevector — exact probabilities via Qiskit
aer     qiskit_aer.AerSimulator — real finite-shot sampling

With `shots` set, the 'exact' backend samples from the exact
distribution with a seeded RNG — the right way to develop finite-shot
art locally before moving to real hardware.
"""

import importlib

from . import sim

# Set by main.py from the sandbox-injected `backend` variable.
_QOLLAB = None


def set_qollab_backend(sampler):
    """Register the backend object the Qollab runtime provides."""
    global _QOLLAB
    _QOLLAB = sampler


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


def _basis_int(key):
    """Normalise a counts key ('0b101', ' 101 ', hex, int) to int."""
    if isinstance(key, int):
        return key
    k = str(key).strip().replace(' ', '')
    if k.startswith('0x'):
        return int(k, 16)
    return int(k, 2)


def _extract_counts(result):
    """Pull {basis_int: count} out of a Qiskit-style result object."""
    res = result.result() if hasattr(result, 'result') else result
    counts = res.get_counts() if hasattr(res, 'get_counts') else None
    if isinstance(counts, list):
        counts = counts[0]
    if counts is None:
        # last resort: results(0).data.counts style payloads
        try:
            counts = res.results[0].data.counts
        except Exception as exc:
            raise RuntimeError(f'could not read counts from backend: {exc}')
    return {_basis_int(k): v for k, v in dict(counts).items()}


def _qollab_counts(n_qubits, gates, shots):
    """Sample on the Qollab-injected backend (IonQ simulator/hardware)."""
    if _QOLLAB is None:
        raise RuntimeError('no Qollab backend registered')
    qc = _to_qiskit(n_qubits, gates)
    qc.measure_all()
    try:
        from qiskit import transpile
        qc = transpile(qc, backend=_QOLLAB)
    except Exception:
        pass  # sandbox may transpile server-side; ship the circuit as-is
    try:
        job = _QOLLAB.run(qc, shots=shots)
    except TypeError:
        job = _QOLLAB.run(qc)  # some wrappers fix the shot count
    return _extract_counts(job)


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
    if backend == 'qollab' and _QOLLAB is not None:
        return _qollab_counts(n_qubits, gates, shots)
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

    'auto' prefers the Qollab backend (real sampling on IonQ), then
    aer, then qiskit, then the built-in exact simulator.
    """
    if requested != 'auto':
        return requested
    if _QOLLAB is not None:
        return 'qollab'
    if importlib.util.find_spec('qiskit_aer'):
        return 'aer'
    if importlib.util.find_spec('qiskit'):
        return 'qiskit'
    return 'exact'
