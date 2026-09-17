# Scroll videos

All five user-supplied clips from `assets/video-frames/v3/videosscroll` are now mapped by theme in `src/scrollFilms.ts`.

| Supplied name | Website file |
|---|---|
| Conservatory_moving.mp4 | public/films/scroll/conservatory-moving.mp4 |
| Gulmohar_moving.mp4 | public/films/scroll/gulmohar-moving.mp4 |
| After Hours_moving.mp4 | public/films/scroll/afterhours-moving.mp4 |
| Sunday Edit_moving.mp4 | public/films/scroll/sunday-moving.mp4 |
| Azure_moving.mp4 | public/films/scroll/azure-moving.mp4 |

Originals retained. Website copies are six-second 720×1280 H.264 at 24 fps, with audio removed, a keyframe every six frames, no B-frames and fast-start metadata. More frequent keyframes make files larger but improve random seeking. Each poster is extracted from the actual supplied video's first frame.

The inner chapter pins while scroll progress sets video time. Scrolling backward reverses the timeline. Video requests begin within 500px of the chapter; the loaded node is retained to avoid flashing/reloading when revisiting it. Editor previews and reduced-motion mode display the poster only. Video errors fall back to the poster. The video has its own camera movement, so the image-only CSS zoom is disabled while video is available.

Verification: production build and 12 existing tests pass. Browser checks confirmed all five sources load with six-second durations and seek to intermediate times. Conservatory explicitly checked forward (0.85 → 3.85 seconds) and backward (1.54 seconds).
