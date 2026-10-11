"""Quantum generation engine for GlyphGenesis.

Quantum mechanics is the medium: measurement distributions from real
circuits (quantum walks, entangled walker pairs) form the density
fields that render as ASCII art. Runs dependency-free on the built-in
statevector simulator; the same gate specs run on Qiskit/Aer/IonQ when
available (Qollab-ready).
"""

from .field import FIELDS, entangled_field, grid_field, sweep_field
from .render import CHARS, THEMES, framed, render

__all__ = ['FIELDS', 'sweep_field', 'grid_field', 'entangled_field',
           'render', 'framed', 'CHARS', 'THEMES']
