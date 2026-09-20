import json
import subprocess
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "music" / "lenticular-ross-lara.mp4"
OUTPUT = ROOT / "assets" / "music" / "lenticular-beat-map.json"
SR = 22050
HOP = 512
FRAME = 2048


raw = subprocess.check_output(
    [
        "ffmpeg",
        "-v",
        "error",
        "-i",
        str(SOURCE),
        "-ac",
        "1",
        "-ar",
        str(SR),
        "-f",
        "f32le",
        "-",
    ]
)
audio = np.frombuffer(raw, dtype="<f4")
frame_count = 1 + max(0, (len(audio) - FRAME) // HOP)
frames = np.lib.stride_tricks.as_strided(
    audio,
    shape=(frame_count, FRAME),
    strides=(audio.strides[0] * HOP, audio.strides[0]),
).copy()
frames *= np.hanning(FRAME)

magnitude = np.abs(np.fft.rfft(frames, axis=1))
flux = np.maximum(0, np.diff(magnitude, axis=0)).sum(axis=1)
flux = np.concatenate(([0.0], flux))
flux = np.convolve(flux, np.ones(3) / 3, mode="same")
flux /= max(float(flux.max()), 1e-9)

rms = np.sqrt(np.mean(frames * frames, axis=1))
rms /= max(float(rms.max()), 1e-9)
times = np.arange(frame_count) * HOP / SR

fps = SR / HOP
min_lag = int(round(fps * 60 / 180))
max_lag = int(round(fps * 60 / 60))
centered = flux - flux.mean()
corr = np.correlate(centered, centered, mode="full")[len(centered) - 1 :]
lag = min_lag + int(np.argmax(corr[min_lag : max_lag + 1]))
bpm = 60 * fps / lag
period = lag / fps

candidate_offsets = np.linspace(0, period, 200, endpoint=False)
best_offset = 0.0
best_score = -1.0
for offset in candidate_offsets:
    grid = np.arange(offset, times[-1], period)
    indexes = np.clip(np.round(grid * fps).astype(int), 0, len(flux) - 1)
    score = float(np.sum(flux[indexes]))
    if score > best_score:
        best_score = score
        best_offset = float(offset)

beats = np.arange(best_offset, times[-1], period)
beats_30 = [round(float(t), 3) for t in beats if 0 <= t <= 30]

local_max = (flux[1:-1] >= flux[:-2]) & (flux[1:-1] > flux[2:])
peak_indexes = np.where(local_max)[0] + 1
strong = peak_indexes[flux[peak_indexes] >= np.quantile(flux[peak_indexes], 0.88)]
strong_30 = sorted(
    [
        {"time": round(float(times[i]), 3), "strength": round(float(flux[i]), 3)}
        for i in strong
        if times[i] <= 30
    ],
    key=lambda item: item["time"],
)

report = {
    "source": SOURCE.name,
    "duration_seconds": round(float(len(audio) / SR), 3),
    "estimated_bpm": round(float(bpm), 2),
    "beat_period_seconds": round(float(period), 4),
    "beat_phase_seconds": round(best_offset, 4),
    "beats_first_30_seconds": beats_30,
    "strong_onsets_first_30_seconds": strong_30,
}
OUTPUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2))
