"""Original, procedurally synthesised soundtracks for the three AJ GROUPS reels (no samples, no third-party music).
Each score is timed to its reel's real events. Output: 48 kHz stereo 16-bit WAV + a spectrogram/level plot for checking."""
import numpy as np, wave, os, sys
from scipy import signal

SR = 48000
OUT = os.path.dirname(os.path.abspath(__file__))
rng0 = 7

def hz(name):
    n = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
    k, o = name[:-1], int(name[-1]); return 440.0 * 2 ** ((n[k] + 12 * (o + 1) - 69) / 12)

# ------------------------------------------------------------------ building blocks
def T(d): return np.arange(int(d * SR)) / SR

def env(n, a, r, curve=2.0):
    e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = (np.arange(na) / na) ** curve
    if nr: e[-nr:] *= (np.linspace(1, 0, nr)) ** curve
    return e

def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f / (SR / 2), 'low', output='sos'), x)

def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f / (SR / 2), 'high', output='sos'), x)

def bp(x, f0, f1, order=2):
    return signal.sosfilt(signal.butter(order, [f0 / (SR / 2), min(f1, SR / 2 * .98) / (SR / 2)], 'band', output='sos'), x)

class Mix:
    def __init__(self, dur):
        self.n = int(dur * SR); self.dry = np.zeros((2, self.n)); self.wet = np.zeros((2, self.n)); self.dur = dur
    def add(self, x, t0, gain=1.0, pan=0.0, send=0.3):
        i = int(t0 * SR)
        if i >= self.n or len(x) == 0: return
        x = x[: self.n - i] if i + len(x) > self.n else x
        a = (pan + 1) * np.pi / 4; l, r = np.cos(a) * gain, np.sin(a) * gain
        self.dry[0, i:i + len(x)] += x * l; self.dry[1, i:i + len(x)] += x * r
        self.wet[0, i:i + len(x)] += x * l * send; self.wet[1, i:i + len(x)] += x * r * send

def impulse(tau=1.1, length=3.2, seed=3):
    r = np.random.default_rng(seed); t = T(length)
    ir = np.stack([r.standard_normal(len(t)), r.standard_normal(len(t))]) * np.exp(-t / tau)
    ir[:, :int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))
    ir = np.stack([lp(hp(ir[0], 180), 6500), lp(hp(ir[1], 180), 6500)])
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True)).max()

# ------------------------------------------------------------------ instruments
def pad(freqs, dur, a=1.2, r=1.6, bright=1500, detune=(0.0, 0.07, -0.06)):
    t = T(dur); x = np.zeros(len(t))
    for f in freqs:
        for d in detune:
            ff = f * 2 ** (d / 12)
            x += signal.sawtooth(2 * np.pi * ff * t + d * 3) * .5 + np.sin(2 * np.pi * ff * t) * .6
    x = lp(x, bright, 2) * env(len(t), a, r, 1.5)
    return x / (len(freqs) * len(detune))

def pluck(f, dur=1.6, bright=3.0, decay=3.2):
    t = T(dur); idx = bright * np.exp(-t * 9)
    x = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 2.0 * t)) * np.exp(-t * decay)
    x += .35 * np.sin(2 * np.pi * f * 4.0 * t) * np.exp(-t * decay * 3)
    return x * env(len(t), .004, .05)

def bell(f, dur=3.0, decay=1.6):
    t = T(dur); x = np.zeros(len(t))
    for p, a, d in [(1, 1, 1), (2.0, .55, 1.4), (2.76, .35, 2.0), (5.4, .2, 3.0), (8.93, .1, 4.0)]:
        x += a * np.sin(2 * np.pi * f * p * t) * np.exp(-t * decay * d)
    return x * env(len(t), .002, .08)

def marimba(f, dur=1.2):
    t = T(dur)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 5.0) + .45 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22) + .2 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40)
    return x * env(len(t), .002, .03)

def sub(f, dur, a=.5, r=.8):
    t = T(dur); return (np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2 * t)) * env(len(t), a, r, 1.4)

def thump(f0=95, f1=42, dur=.55, click=True):
    t = T(dur); ph = 2 * np.pi * (f1 * t + (f0 - f1) * (1 - np.exp(-t * 14)) / 14)
    x = np.sin(ph) * np.exp(-t * 7)
    if click: x += lp(np.random.default_rng(11).standard_normal(len(t)), 900) * np.exp(-t * 120) * .5
    return x

def whoosh(dur, f0, f1, seed=5, q=2.2, k=26):
    """noise through a band-pass whose centre glides from f0 to f1 (exponential)."""
    n = int(dur * SR); noise = np.random.default_rng(seed).standard_normal(n)
    cs = np.geomspace(min(f0, f1), max(f0, f1), k); fil = [bp(noise, c / 1.5, c * 1.5, 2) for c in cs]
    pos = np.linspace(0, 1, n) if f1 > f0 else np.linspace(1, 0, n)
    idx = pos * (k - 1); out = np.zeros(n)
    for j in range(k):
        w = np.clip(1 - np.abs(idx - j), 0, 1); out += fil[j] * w
    return out * np.hanning(n) ** 1.2

def tick(dur=.05, f=2500, seed=9):
    n = int(dur * SR); x = hp(np.random.default_rng(seed).standard_normal(n), f) * np.exp(-np.arange(n) / (n * .18)); return x

def shimmer(dur, f0, f1, seed=2):
    t = T(dur); x = np.zeros(len(t)); r = np.random.default_rng(seed)
    for h in range(7):
        f = np.geomspace(f0, f1, len(t)) * (1 + h * .5) ; ph = 2 * np.pi * np.cumsum(f) / SR
        x += np.sin(ph + r.random() * 6) * (.9 ** h) * (.5 + .5 * np.sin(2 * np.pi * (3 + h) * t + r.random() * 6))
    return x * np.hanning(len(t)) ** 2

def chord(names): return [hz(n) for n in names]

# harmony: B minor (moody) -> G (lift) -> D (arrival) -> B minor 11 -> G -> A (dominant) -> D (resolve)
BM  = ['B2', 'F#3', 'D4', 'E4', 'A4']
GM  = ['G2', 'D3', 'B3', 'D4', 'F#4']
DM  = ['D3', 'A3', 'C#4', 'E4', 'F#4']
BM11 = ['B2', 'F#3', 'A3', 'D4', 'E4']
AM  = ['A2', 'E3', 'A3', 'C#4', 'E4']
DM2 = ['D3', 'A3', 'D4', 'F#4', 'A4', 'E5']
ROOT = {'B': hz('B1'), 'G': hz('G1'), 'D': hz('D2'), 'A': hz('A1')}
ARP_NOTES = {  # high-register arpeggio tones per chord (all diatonic to D major)
    'D': ['F#5', 'A5', 'C#6', 'E6', 'F#6', 'A5', 'E6', 'C#6'], 'B': ['D5', 'F#5', 'A5', 'B5', 'D6', 'F#5', 'B5', 'A5'],
    'G': ['B4', 'D5', 'F#5', 'G5', 'B5', 'D5', 'F#5', 'D6'], 'A': ['A4', 'C#5', 'E5', 'A5', 'C#6', 'E5', 'A5', 'C#6']}

def master(mix, target_rms_db=-17.0, fade_in=.35, fade_out=1.3):
    ir = impulse()
    wl = signal.fftconvolve(mix.wet[0], ir[0])[: mix.n] + signal.fftconvolve(mix.wet[1], ir[1])[: mix.n] * 0
    wr = signal.fftconvolve(mix.wet[1], ir[1])[: mix.n] + signal.fftconvolve(mix.wet[0], ir[1][::-1])[: mix.n] * .0
    wet = np.stack([signal.fftconvolve(mix.wet[0], ir[0])[: mix.n] * .85 + signal.fftconvolve(mix.wet[1], ir[1])[: mix.n] * .15,
                    signal.fftconvolve(mix.wet[1], ir[1])[: mix.n] * .85 + signal.fftconvolve(mix.wet[0], ir[0])[: mix.n] * .15])
    y = mix.dry * .82 + wet * .9
    y = np.stack([hp(y[0], 28, 2), hp(y[1], 28, 2)])
    n = y.shape[1]; fi, fo = int(fade_in * SR), int(fade_out * SR)
    y[:, :fi] *= np.linspace(0, 1, fi) ** 2; y[:, -fo:] *= np.linspace(1, 0, fo) ** 2
    rms = np.sqrt(np.mean(y ** 2)); y *= 10 ** (target_rms_db / 20) / max(rms, 1e-9)
    y = np.tanh(y * 1.15) / np.tanh(1.15)                         # gentle limiter
    peak = np.abs(y).max()
    if peak > .89: y *= .89 / peak
    return y

def write_wav(path, y):
    pcm = (np.clip(y, -1, 1).T * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

# ------------------------------------------------------------------ the music bed shared by the device reels
def device_bed(m, dur, lid):
    segs = [(0.0, 5.0, BM, 'B'), (5.0, 8.0, GM, 'G'), (8.0, 12.0, DM, 'D'), (12.0, 14.0, BM11, 'B'), (14.0, 16.0, GM, 'G'), (16.0, 17.2, AM, 'A'), (17.2, dur, DM2, 'D')]
    for t0, t1, ch, key in segs:
        d = t1 - t0 + 1.4
        lvl = .30 if t0 < 5 else .38 if t0 < 8 else .42
        m.add(pad(chord(ch), d, a=1.6, r=1.8, bright=1300 if t0 < 8 else 1800), t0 - .2 if t0 > 0 else 0, gain=lvl, send=.55)
        if t0 >= 5.0:  # sub bass follows the root once the lid / orbit is under way
            m.add(sub(ROOT[key], t1 - t0 + .4, a=.5, r=.7), t0, gain=.30 if t0 < 8 else .36, send=.05)
    # arpeggio: 8th notes at 72 bpm from the screen waking until the caption
    step = 60 / 72 / 2; t = 8.0; k = 0
    while t < 17.0:
        key = next(s[3] for s in segs if s[0] <= t < s[1]); note = ARP_NOTES[key][k % 8]
        m.add(pluck(hz(note), 1.7), t, gain=.15 + .035 * ((k % 4) == 0), pan=(-.55 if k % 2 else .55) * (1 - .3 * (k % 3 == 0)), send=.7)
        t += step; k += 1
    # soft pulse: kick every two beats, shaker on the off-beats
    t = 8.0
    while t < 16.8:
        m.add(thump(70, 40, .5, click=False), t, gain=.34, send=.1)
        m.add(hp(tick(.09, 5200, 3 + int(t * 10)), 4000), t + 60 / 72 / 2 * 1.0, gain=.08, pan=.4, send=.25)
        t += 120 / 72
    # a few sparkles that read as the drifting dust
    r = np.random.default_rng(21)
    for _ in range(14):
        m.add(bell(hz(r.choice(['A5', 'C#6', 'E6', 'F#6', 'A6'])), 2.6, 2.0), r.uniform(1.5, 18.5), gain=.04 + .03 * r.random(), pan=r.uniform(-.9, .9), send=.9)
    # closing resolve: warm swell and a soft hit under the caption
    m.add(pad(chord(DM2), 3.6, a=.5, r=1.5, bright=2200), 17.0, gain=.34, send=.6)
    m.add(thump(80, 36, 1.1), 17.2, gain=.7, send=.5)
    m.add(bell(hz('D5'), 4.0, 1.0), 17.2, gain=.18, pan=-.2, send=.9); m.add(bell(hz('A5'), 4.0, 1.1), 17.28, gain=.12, pan=.3, send=.9)

def device_effects(m, lid):
    # opening: breathing air under the macro, rack focus, then the crane reveal
    m.add(lp(whoosh(2.8, 200, 900, seed=3), 1800), 0.0, gain=.30, send=.5)
    m.add(sub(hz('B1'), 4.8, a=1.2, r=1.2), 0.0, gain=.34, send=.05)
    m.add(whoosh(2.8, 300, 3800, seed=8), 2.2, gain=.38, send=.55)
    m.add(whoosh(1.2, 2500, 700, seed=12), 4.7, gain=.16, pan=.3, send=.5)
    if lid:
        m.add(lp(whoosh(1.5, 500, 1300, seed=15, q=3), 2400), 5.4, gain=.17, pan=-.1, send=.35)   # hinge swing
        m.add(thump(110, 55, .4), 7.0, gain=.55, send=.3)                                        # lid settles
        m.add(hp(tick(.06, 3200, 31), 2500), 7.03, gain=.20, send=.3)
    else:
        m.add(shimmer(2.2, 800, 2600, seed=4), 5.0, gain=.07, pan=-.2, send=.8)                  # glass resonance as the camera settles
    # screen wakes at 8.0: chime chord, a soft boom and the lens-flare shimmer
    for f, g, p in [('D5', .22, -.2), ('A5', .16, .25), ('F#6', .12, .1), ('D6', .13, -.35)]:
        m.add(bell(hz(f), 4.2, 1.2), 7.98, gain=g, pan=p, send=.85)
    m.add(thump(90, 34, 1.3), 8.0, gain=.78, send=.5)
    m.add(shimmer(2.0, 2200, 7000, seed=6), 7.8, gain=.09, send=.9)
    m.add(whoosh(1.4, 200, 2500, seed=17), 7.0, gain=.20, send=.5)
    # chapter changes at 12 s, 14 s, 16 s: a soft swoosh and a tick
    for i, tt in enumerate([12.0, 14.0, 16.0]):
        m.add(whoosh(.9, 700, 3200 if i % 2 == 0 else 1800, seed=30 + i), tt - .25, gain=.20, pan=(-.4, .4, -.2)[i], send=.55)
        m.add(tick(.05, 2800, 40 + i), tt + .12, gain=.12, send=.4)
    # the final pull-back
    m.add(whoosh(1.6, 1800, 400, seed=51), 16.6, gain=.18, send=.6)

def build_device(lid):
    m = Mix(20.0); device_bed(m, 20.0, lid); device_effects(m, lid); return master(m)

# ------------------------------------------------------------------ the ventures reel (25 s)
def build_ventures():
    dur = 25.0; m = Mix(dur)
    segs = [(0.0, 5.0, BM, 'B'), (5.0, 9.8, GM, 'G'), (9.8, 14.6, DM, 'D'), (14.6, 17.8, BM11, 'B'), (17.8, 20.0, AM, 'A'), (20.0, dur, DM2, 'D')]
    for t0, t1, ch, key in segs:
        d = t1 - t0 + 1.6; m.add(pad(chord(ch), d, a=1.5, r=1.9, bright=1500 if t0 < 5 else 1900), max(0, t0 - .2), gain=.34 if t0 < 5 else .40, send=.55)
        if t0 >= 4.9: m.add(sub(ROOT[key], t1 - t0 + .5, a=.5, r=.8), t0, gain=.30, send=.05)
    # scene A: bubbles pop in with rising pentatonic plucks
    notes = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6', 'F#6']
    for k, n in enumerate(notes):
        t0 = .6 + .11 * k
        m.add(pluck(hz(n), 1.8, bright=2.4, decay=2.6), t0, gain=.20, pan=-.7 + .2 * k, send=.7)
        m.add(bp(tick(.08, 1200, 60 + k), 900, 3000), t0, gain=.10, pan=-.7 + .2 * k, send=.4)
    m.add(whoosh(.9, 300, 2000, seed=71), 1.5, gain=.10, send=.5)
    m.add(tick(.04, 3500, 80), 2.55, gain=.20, send=.3)                                   # "Food" chosen
    m.add(whoosh(.9, 300, 3200, seed=72), 2.5, gain=.28, send=.55)                        # Bun Bun grows
    m.add(thump(100, 46, .8), 2.95, gain=.5, send=.45)
    m.add(whoosh(1.6, 400, 4200, seed=73), 3.4, gain=.30, send=.55)                       # iris opens
    m.add(thump(120, 40, 1.4), 4.9, gain=.72, send=.5)
    for f, g, p in [('D5', .16, -.2), ('A5', .12, .25), ('F#6', .09, .1)]:
        m.add(bell(hz(f), 4.0, 1.2), 4.9, gain=g, pan=p, send=.85)
    # roll: every venture lands on a marimba note, ascending then settling
    seq = ['D5', 'E5', 'F#5', 'A5', 'B5', 'A5', 'F#5', 'D6']
    for i, n in enumerate(seq):
        s = 5.0 + 1.6 * i
        if i > 0:
            m.add(whoosh(.5, 700, 3000 if i % 2 else 1800, seed=80 + i), s - .5, gain=.17, pan=(-.35 if i % 2 else .35), send=.5)
        m.add(marimba(hz(n), 1.4), s, gain=.34, pan=(.15 if i % 2 else -.15), send=.6)
        m.add(marimba(hz(n) / 2, 1.2), s, gain=.18, pan=0, send=.4)
        m.add(tick(.045, 2600, 90 + i), s + .02, gain=.10, send=.3)
    # a soft pulse under the roll
    t = 5.0
    while t < 17.6:
        m.add(thump(70, 40, .5, click=False), t, gain=.30, send=.1); t += 60 / 72 * 2
    # hand-over to the poster: ink circle, stretch into the arch, blur
    m.add(thump(130, 32, 1.9), 18.2, gain=.9, send=.55)
    m.add(whoosh(1.6, 4000, 250, seed=95), 18.1, gain=.26, send=.6)
    m.add(whoosh(1.6, 200, 2200, seed=96), 18.4, gain=.18, send=.6)
    # the poster type arrives line by line
    for tt, g in [(20.0, .16), (20.8, .13), (21.5, .11), (22.0, .10)]:
        m.add(tick(.07, 2200, int(tt * 7)), tt, gain=g, send=.5)
        m.add(bell(hz('A5' if tt < 21 else 'F#5'), 3.0, 1.4), tt, gain=.05, pan=(-.3 if tt < 21 else .3), send=.9)
    m.add(pad(chord(DM2), 5.2, a=.7, r=2.2, bright=2400), 19.8, gain=.36, send=.65)
    m.add(bell(hz('D5'), 5.0, .9), 20.0, gain=.16, send=.9); m.add(bell(hz('F#5'), 5.0, 1.0), 20.1, gain=.10, pan=.3, send=.9); m.add(bell(hz('A5'), 5.0, 1.1), 20.2, gain=.10, pan=-.3, send=.9)
    r = np.random.default_rng(33)
    for _ in range(16):
        m.add(bell(hz(r.choice(['A5', 'C#6', 'E6', 'F#6', 'A6'])), 2.6, 2.0), r.uniform(1.0, 23.0), gain=.035 + .03 * r.random(), pan=r.uniform(-.9, .9), send=.9)
    return master(m, fade_out=2.0)

def analyse(name, y):
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    mono = y.mean(axis=0); fig, ax = plt.subplots(2, 1, figsize=(12, 6), gridspec_kw={'height_ratios': [2, 1]})
    f, t, S = signal.spectrogram(mono, SR, nperseg=2048, noverlap=1536); ax[0].pcolormesh(t, f, 10 * np.log10(S + 1e-12), shading='auto', vmin=-110, vmax=-40)
    ax[0].set_ylim(0, 9000); ax[0].set_ylabel('Hz'); ax[0].set_title(name)
    win = int(.25 * SR); rms = [20 * np.log10(np.sqrt(np.mean(mono[i:i + win] ** 2)) + 1e-9) for i in range(0, len(mono) - win, win)]
    ax[1].plot(np.arange(len(rms)) * .25, rms); ax[1].set_ylabel('RMS dBFS'); ax[1].set_xlabel('seconds'); ax[1].set_ylim(-60, -5); ax[1].grid(alpha=.3)
    plt.tight_layout(); plt.savefig(os.path.join(OUT, name + '.png'), dpi=80); plt.close()
    peak = np.abs(y).max(); print(f"{name}: dur {y.shape[1]/SR:.1f}s  peak {20*np.log10(peak):.1f} dBFS  rms {20*np.log10(np.sqrt(np.mean(y**2))):.1f} dBFS  L/R corr {np.corrcoef(y[0], y[1])[0,1]:.2f}")

if __name__ == '__main__':
    for name, fn in [('laptop', lambda: build_device(True)), ('ipad', lambda: build_device(False)), ('ventures', build_ventures)]:
        y = fn(); write_wav(os.path.join(OUT, name + '.wav'), y); analyse(name, y)
