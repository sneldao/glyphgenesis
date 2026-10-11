# GlyphGenesis — Qollab Submission Video SSOT

Status: DRAFT

## Spec (hard numbers)

- Resolution: 1920×1080 · fps: 30 · duration: ~120s (3600 frames target; final duration locked to VO master + 2s tail)
- Deliverable: `video/out/glyphgenesis-qollab.mp4` (H.264)
- Audio: ElevenLabs VO master + generated ambient score (-22 LUFS under VO)

## Style bible = Quantum Observatory (repo design system)

- Palette: paper #f4f0e6 · surface #fdfaf2 · ink #171a21 · spectral blue #1f46b4 · teal #0c8f84 · amber #d97413 · hα red #c82436 · violet #6b3fc0
- Type: Fraunces display · Spectral body · IBM Plex Mono instrument data (ratio ×1.618, ≤3 levels/frame)
- Dark measurement-display insets carry the live fields; light paper carries editorial type.
- Finish: clean-flat + subtle ruled grid / faint grain. One corner-radius system: 16px cards.
- Pacing dial: 3 (measured); local 4 during specimen montage.
- Camera dial C0: 1 — locked editorial. No camera moves; motion is element-level.
- Signature transition motif: MEASUREMENT COLLAPSE — outgoing scene mass converges to a point; incoming expands from the same origin. Used at every scene boundary (varied in scale/speed per A14).
- Density: one idea per beat; montage scene layers specimen cards.

## Copy inventory (A8 — user's words only)

All on-screen copy traces to: published Qollab project description, repo README/site copy, engine output metadata. No invented labels. Specimen metadata (mode · qubits · steps · shots · backend) is real engine output data.

## Narration script (~230 words, ElevenLabs)

> What you're looking at isn't a drawing. It's a probability field — the
> measurement statistics of a quantum walk, rendered as light.
>
> GlyphGenesis is a generative art instrument where the artwork *is* the
> quantum measurement.
>
> Here's the pipeline. A circuit spec — a coin-steered walker on a grid —
> compiles to a Qiskit circuit. It runs on a real backend with finite shots.
> The counts collapse into a density field. Probability becomes glyph weight;
> amplitude phase becomes colour.
>
> Three specimens. A two-dimensional walk, where a single shared coin
> entangles the spatial axes — the interference you see can't come from
> independent walkers. An entangled pair: two walkers sharing a Bell state.
> That diagonal ridge *is* the entanglement. And a wave sweep — twin
> ballistic peaks frozen mid-spread.
>
> Then the physics check. Measure the spread at four, eight, sixteen steps —
> it doubles, then doubles again. Linear. Ballistic. A classical random walk
> grows by the square root. Quantum mechanics you can verify with a ruler.
>
> Every specimen carries its full circuit spec on-chain — mode, backend,
> shots, seed. Anyone can re-run the circuit and verify the art is what it
> claims. On real hardware, each mint is literally unrepeatable — the NFT is
> the only record of that measurement.
>
> The observatory runs live in the browser — an exact statevector, evolving
> in your tab.
>
> GlyphGenesis. Art, measured.

Word count ≈ 240 → ~110s @ ~130wpm + tail = ~120s.

## Storyboard (frame budget @30fps, anchored to VO)

| # | Scene | Frames | Content |
|---|-------|--------|---------|
| 1 | COLD OPEN | 0–240 | Dark measurement display fills frame; real walk2d field evolves (phase→hue glyphs). Title fades in late: GLYPHGENESIS |
| 2 | THESIS | 240–470 | Paper ground. Line 1: "the artwork is the quantum measurement" (from script). |
| 3 | PIPELINE | 470–950 | 4-stage morph: gate spec chips → Qiskit circuit lines → histogram counts → ASCII field. Arrows drawn. |
| 4 | SPECIMENS | 950–1740 | Three specimen cards in sequence: №01 walk2d · №02 entangled pair (diagonal ridge emphasized) · №03 wave sweep. Each: live field + spec strip + one label. |
| 5 | PHYSICS | 1740–2160 | σ bar chart 4/8/16 steps doubling vs classical √ curve line. "verified with a ruler" |
| 6 | PROVENANCE | 2160–2760 | Spec JSON → chain link → verify checkmark. mint/verify loop. |
| 7 | OBSERVATORY | 2760–3180 | Embedded site screen capture in browser chrome; "runs in your tab" |
| 8 | CLOSE | 3180–3600 | Field returns beneath title + repo/qollab URL. Spectrum rule. |

## Beat/feasibility check (A12)

On-screen lines are few (VO carries narrative). Longest standalone line
"the artwork is the quantum measurement" = 7 words → comprehension target
0.3×7+1.5 = 3.6s — held ~6s. ✓ Feasible within budget.

## Asset log

- VO: ElevenLabs TTS (see PROGRESS.md for model/voice)
- Site capture: Playwright recordVideo of localhost observatory
- Fields: real `src/quantum-js.mjs` engine — walk2d/entangled/sweep
- Music: generated ambient pad (ffmpeg), spectral shimmer
- No third-party footage, no watermarks.
