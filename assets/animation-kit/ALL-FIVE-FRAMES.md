# All five templates — six-second first/last frame kit

Each template has a first frame, a last frame and a copy-ready video prompt. Use the two separate PNGs in your generator’s first-frame and last-frame inputs. Set duration to **6 seconds**, aspect ratio to **9:16**, and audio off.

| Template | First frame (0 s) | Last frame (6 s) | Video prompt |
|---|---|---|---|
| The Conservatory | [First](frames/conservatory-first.png) | [Last](frames/conservatory-last.png) | [Prompt](prompts/conservatory.txt) |
| Gulmohar | [First](frames/gulmohar-first.png) | [Last](frames/gulmohar-last.png) | [Prompt](prompts/gulmohar.txt) |
| After Hours | [First](frames/afterhours-first.png) | [Last](frames/afterhours-last.png) | [Prompt](prompts/afterhours.txt) |
| The Sunday Edit | [First](frames/sunday-first.png) | [Last](frames/sunday-last.png) | [Prompt](prompts/sunday.txt) |
| Azure | [First](frames/azure-first.png) | [Last](frames/azure-last.png) | [Prompt](prompts/azure.txt) |

## Export

Silent H.264 MP4, 24–30 fps, 720 × 1280 or 1080 × 1920. A six-second clip is 144 frames at 24 fps or 180 frames at 30 fps. Frequent keyframes and fast-start metadata help browser seeking. The website controls playback position through scrolling, so the guest may take longer or shorter than six seconds to move through the clip. No fade at either endpoint. Names and event details remain live website text.

These are paired input images and prompts, not completed videos. The generator may introduce changes between frames; check the resulting clip before connecting it. Use a generator that supports both first and last frame inputs.

## Provenance

Prepared with the built-in image-generation tool. Conservatory and After Hours reuse the first frames generated in the earlier two-image kit. The other first frames adapt the existing website artwork to portrait 9:16. Each last frame is an edit of its own first frame. Original files are retained. Exact new image-edit prompts are recorded in generation-prompts.json.

## Website integration

This kit is for the inner scroll chapters, not the existing envelope-opening films. Save each generated clip in public/films/scroll and set the corresponding entry in src/scrollFilms.ts. Video rendering and seeking are already supported in src/ScrollFilm.ts. Match its poster to that template’s first frame when connecting the videos. Keep static artwork for reduced motion and the editor, and check actual browser seeking with the finished exports.
