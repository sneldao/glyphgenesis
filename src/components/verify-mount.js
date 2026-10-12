import { QUANTUM_FIELDS, renderField } from '@/quantum-js.mjs';
import { CHARS } from '@/ascii-generator.mjs';
import { makeSampler, shotSchedule, fieldCorrelation } from '@/quantum-measure.mjs';
import { showToast } from './toast.js';

/**
 * Mount the verification dramatization into `container`: stored field on the
 * left, a live finite-shot re-measurement on the right, verdict stamp below.
 *
 * storedText — the artwork's field as stored (frame stripped by caller).
 * quantum    — parsed spec { mode, width, height, steps, seed, shots, theme }.
 * verifySeed — seed for the re-measurement sampler.
 *   Same seed → exact replay expected (simulator determinism).
 *   Different seed → statistical verification (finite-shot consistency).
 */
export function mountVerify(container, { storedText, quantum, verifySeed = null }) {
    const fn = QUANTUM_FIELDS[quantum.mode];
    const chars = CHARS[quantum.theme] || CHARS.simple;
    const shots = quantum.shots || 4096;
    const seed = verifySeed ?? quantum.seed ?? 1;
    const sameSeed = seed === (quantum.seed ?? seed);

    if (!fn) {
        container.innerHTML = '<div class="verify-verdict warn">≈ UNKNOWN CIRCUIT MODE — cannot re-measure</div>';
        return;
    }

    container.innerHTML = `
        <div class="verify-cols">
            <div class="verify-col">
                <div class="verify-col-label">${quantum.storedLabel || 'STORED ON-CHAIN'}</div>
                <pre class="verify-stored"></pre>
            </div>
            <div class="verify-col">
                <div class="verify-col-label" data-live-label>RE-MEASURING…</div>
                <pre class="verify-live"></pre>
            </div>
        </div>
        <div class="verify-verdict" style="display:none"></div>
    `;

    const storedPre = container.querySelector('.verify-stored');
    const livePre = container.querySelector('.verify-live');
    const liveLabel = container.querySelector('[data-live-label]');
    const verdict = container.querySelector('.verify-verdict');

    try {
        const { field } = fn({ width: quantum.width, height: quantum.height, steps: quantum.steps, seed });
        const sampler = makeSampler(field, seed);
        const schedule = shotSchedule(shots, 30);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        storedPre.textContent = storedText;
        livePre.textContent = '';
        verdict.style.display = 'none';

        let prev = 0, i = 0, replayText = '';
        const step = () => {
            sampler.draw(schedule[i] - prev);
            prev = schedule[i];
            replayText = renderField(sampler.field(), chars);
            livePre.textContent = replayText;
            liveLabel.innerHTML = prev < shots
                ? `RE-MEASURING — shots <b>${prev}</b>/${shots}`
                : `RE-MEASURED — ${shots} shots · seed ${seed}`;
            if (++i < schedule.length) return;
            clearInterval(timer);
            judge();
        };

        const judge = () => {
            const rt = replayText.replace(/[ \t]+$/gm, '');
            const rho = fieldCorrelation(storedText, rt, chars);
            const identical = storedText === rt;
            let cls, msg;
            if (identical) {
                cls = 'ok';
                msg = `✓ EXACT REPLAY — reproduces bit-for-bit from the circuit spec`;
            } else if (rho >= 0.9) {
                cls = 'ok';
                msg = `✓ VERIFIED — ρ=${rho.toFixed(2)} · consistent with a ${shots}-shot measurement (shot noise expected)`;
            } else if (rho >= 0.55) {
                cls = 'warn';
                msg = `≈ PARTIAL — ρ=${rho.toFixed(2)} · related but divergent (different sampler or post-mint edit)`;
            } else {
                cls = 'bad';
                msg = `⚠ DIVERGENT — ρ=${rho.toFixed(2)} · stored field does not match this spec`;
            }
            verdict.style.display = 'block';
            verdict.className = `verify-verdict ${cls}`;
            verdict.innerHTML = msg;
        };

        if (reduced) {
            sampler.draw(shots);
            replayText = renderField(sampler.field(), chars);
            livePre.textContent = replayText;
            liveLabel.innerHTML = `RE-MEASURED — ${shots} shots · seed ${seed}`;
            judge();
            return;
        }
        const timer = setInterval(step, 70);
    } catch (err) {
        showToast(`Verification failed: ${err.message}`, 'error');
    }
}
