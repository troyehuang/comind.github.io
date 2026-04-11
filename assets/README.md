# Assets

Place your real media here. The site references the following paths — replace
the placeholders with your own files:

## Videos (dual-view player)

| Path | Purpose |
|---|---|
| `videos/ego_a.mp4`   | Session 01 — Ego stream A |
| `videos/ego_b.mp4`   | Session 01 — Ego stream B |
| `videos/ego_a_2.mp4` | Session 02 — Ego stream A |
| `videos/ego_b_2.mp4` | Session 02 — Ego stream B |
| `videos/ego_a_3.mp4` | Session 03 — Ego stream A |
| `videos/ego_b_3.mp4` | Session 03 — Ego stream B |
| `videos/ego_a_4.mp4` | Session 04 — Ego stream A |
| `videos/ego_b_4.mp4` | Session 04 — Ego stream B |

Encoding tips for web:
```
ffmpeg -i input.mov -vf "scale=1280:-2" -c:v libx264 -crf 23 \
  -preset slow -movflags +faststart -an ego_a.mp4
```
- `+faststart` is important for streaming (moov atom at the front).
- Keep both streams at the same framerate/duration so the synced player drifts as little as possible.

## Images

| Path | Purpose |
|---|---|
| `images/ego_a_poster.jpg` | Poster frame shown before ego A loads |
| `images/ego_b_poster.jpg` | Poster frame shown before ego B loads |
| `images/scene_scan.jpg`   | Scene scan card thumbnail (16:10) |
| `images/object_scan.jpg`  | Object scan card thumbnail (16:10) |
