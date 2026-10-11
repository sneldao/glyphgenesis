#!/usr/bin/env python3
"""Smoke tests for the quantum engine — run: python3 test/quantum_engine_test.py

The interesting assertions are the quantum ones:
  * walk spreads ballistically (~steps), not like a classical RW (~sqrt steps)
  * entangled-walker joint distribution does not factorise
"""

import json
import math
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from quantum import backend, circuits, field, sim
from quantum.render import framed, render


def check(name, cond, detail=''):
    status = 'PASS' if cond else 'FAIL'
    print(f'{status} {name} {detail}')
    if not cond:
        FAILURES.append(name)


FAILURES = []


def std(dist):
    mean = sum(x * p for x, p in dist.items())
    return math.sqrt(sum((x - mean) ** 2 * p for x, p in dist.items()))


# ── simulator sanity ──
n, gates, regs = circuits.walk_spec(n_pos=5, steps=4)
probs = backend.run_probs(n, gates, 'exact')
check('probabilities normalise', abs(sum(probs.values()) - 1.0) < 1e-9)

# ── ballistic spread: the walk's signature ──
# std grows linearly in steps; a classical RW grows as sqrt(steps).
def walk_std(steps):
    n, gates, regs = circuits.walk_spec(n_pos=7, steps=steps)
    return std(sim.marginal(backend.run_probs(n, gates, 'exact'), regs['pos']))

s4, s16 = walk_std(4), walk_std(16)
check('walk spreads ballistically', s16 / s4 > 2.5,
      f'std(16)/std(4)={s16/s4:.2f} (classical would be 2.0)')

# ── deterministic shot sampling ──
c1 = backend.run_counts(n, gates, 500, 'exact', seed=42)
c2 = backend.run_counts(n, gates, 500, 'exact', seed=42)
check('shot sampling is seed-deterministic', c1 == c2)
check('shot totals', sum(c1.values()) == 500)

# ── entanglement: joint distribution does not factorise ──
nq, g, r = circuits.entangled_walk_spec(n_pos=4, steps=3)
joint = sim.marginal(backend.run_probs(nq, g, 'exact'),
                     r['pos_a'] + r['pos_b'])
side = 1 << 4
pa, pb = {}, {}
for jv, p in joint.items():
    pa[jv & (side - 1)] = pa.get(jv & (side - 1), 0) + p
    pb[jv >> 4] = pb.get(jv >> 4, 0) + p
worst = max(abs(p - pa.get(jv & (side - 1), 0) * pb.get(jv >> 4, 0))
            for jv, p in joint.items())
check('entangled joint is not a product distribution', worst > 0.01,
      f'max deviation={worst:.3f}')

# ── 2-D walk: shared coin correlates the axes ──
nq, g, r = circuits.walk2d_spec(n_pos=4, steps=5)
joint = sim.marginal(backend.run_probs(nq, g, 'exact'),
                     r['pos_x'] + r['pos_y'])
side = 1 << 4
px, py = {}, {}
for jv, p in joint.items():
    px[jv & (side - 1)] = px.get(jv & (side - 1), 0) + p
    py[jv >> 4] = py.get(jv >> 4, 0) + p
worst = max(abs(p - px.get(jv & (side - 1), 0) * py.get(jv >> 4, 0))
            for jv, p in joint.items())
check('walk2d axes are correlated', worst > 0.01,
      f'max deviation={worst:.3f}')

# ── fields + render ──
for mode in field.FIELDS:
    fld, meta = field.FIELDS[mode](width=24, height=10, steps=3)
    ok = len(fld) == 10 and all(len(r_) == 24 for r_ in fld)
    check(f'{mode} field dims', ok)
    art = render(fld, theme='cosmic')
    check(f'{mode} renders', len(art) > 0)

fld, _ = field.sweep_field(width=30, height=8, steps=4)
check('framed output', '╔' in framed(render(fld)))

# ── animation: time evolution via the CLI ──
out = subprocess.run(
    [sys.executable, '-m', 'quantum', '--mode', 'walk2d',
     '--width', '20', '--height', '10', '--animate', '4',
     '--json', '--bare'],
    capture_output=True, text=True,
    cwd=os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
res = json.loads(out.stdout)
check('animate emits frames',
      res['meta'].get('animated') and len(res['frames']) == 4)
check('frames increase in steps',
      [f['steps'] for f in res['frames']] == [1, 2, 3, 4])
# frame t must be a strict prefix-evolution: t=1 has less spread than t=4
f1, f4 = res['frames'][0]['field'], res['frames'][3]['field']
nz = lambda f: sum(1 for row in f for v in row if v > 0)
check('wavefront expands over time', nz(f4) > nz(f1),
      f'{nz(f1)} -> {nz(f4)} nonzero cells')

print()
if FAILURES:
    print(f'{len(FAILURES)} FAILED: {FAILURES}')
    sys.exit(1)
print('all quantum engine checks passed')
