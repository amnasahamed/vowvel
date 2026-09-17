# Vowvel animation kit

Two original portrait PNGs generated with the built-in image generation tool. Optimized WebP copies are already used on the website. The collection and invitation hero share `WorldScene.tsx` and the original theme artwork; these new scenes appear as deeper chapters within their matching themes.

## 1. Conservatory — conservatory-glasshouse.png

**Image-to-video prompt:** Use the supplied image as the exact first frame. One continuous slow forward dolly along the stone path inside this Tuscan wedding glasshouse. Preserve the painted watercolor texture, sage iron arches, ivory roses, chandelier geometry and golden afternoon light. Let a few leaves breathe subtly and candle flames flicker. Crystal highlights shift very gently with the camera. No people, text, new objects, cuts, morphing or abrupt lighting changes. End slightly closer to the open doorway, retaining the chandelier in the upper frame. Six seconds, portrait 9:16, restrained cinematic movement, constant camera speed, no fade in or out. This film will play forward and backward as the visitor scrolls.

## 2. After Hours — afterhours-chandelier.png

**Image-to-video prompt:** Use the supplied image as the exact first frame. A single slow dolly forward into this burgundy ballroom, beneath the antique crystal chandelier. Preserve the architectural perspective, crystal details, dark red velvet curtains, calla lilies, candles and champagne glasses. Candle flames flicker softly, velvet barely moves, warm highlights travel across crystal. Quiet, luxurious movement. No people, text, added objects, cuts, morphing, glitter effects or exposure jumps. End closer to the ballroom arch, keeping the chandelier visible overhead. Six seconds, portrait 9:16, constant camera speed, no fade in or out. The film will be scrubbed bidirectionally with scrolling.

## Delivery and integration

Export silent H.264 MP4 at 720 × 1280 or 1080 × 1920, 24–30 fps, preferably under 5 MB. Frequent keyframes (every 6–12 frames) and fast-start metadata improve scroll seeking. Keep the uploaded image as the first frame. The website renders names and headings as live text; do not bake text into the videos.

Put finished files at:

- `public/films/scroll/conservatory-glasshouse.mp4`
- `public/films/scroll/afterhours-chandelier.mp4`

Then set the matching entries in `src/scrollFilms.ts` to `/films/scroll/conservatory-glasshouse.mp4` and `/films/scroll/afterhours-chandelier.mp4`. The scroll component already supports timeline seeking, near-viewport loading, image fallback on video failure, and static artwork for reduced motion and the editor. Video playback needs final browser verification with the actual exported files. Until then, the artwork uses a scroll-driven camera move; no missing videos are requested.

## Original image-generation prompts

### After Hours

Create a portrait 9:16 cinematic wedding scene image for a premium website and image-to-video starting frame. A grand antique crystal chandelier hangs prominently at upper center in a high-ceilinged intimate European ballroom, wine burgundy velvet curtains on both sides, aged brass candle stands, candlelit dinner table with burgundy calla lilies and champagne coupes in lower foreground. Moody black cherry and warm antique gold palette. Elegant painterly editorial realism, tactile oil-painted textures, rich atmospheric depth, restrained luxury, no people, no words, no lettering, no watermark. Clear architectural perspective and stable symmetrical central aisle suitable for a slow forward camera dolly. Chandelier crystals distinctly resolved, warm candle glow, no excessive sparkles. Full bleed artwork, no borders. Save as an asset suitable for After Hours wedding template.

### Conservatory

Create a portrait 9:16 full bleed painterly editorial illustration as a starting frame for a slow image-to-video forward dolly inside a romantic Tuscan wedding glasshouse. Antique sage-green wrought iron glass conservatory with tall arched doors, huge delicately rendered antique crystal chandelier upper center, warm creamy golden afternoon sun through glass, white cosmos and ivory climbing roses, stone urns, small candlelit wedding supper tables along sides, central stone path open. Italian hills and cypress trees visible beyond. Highly detailed watercolor and gouache on aged cream paper, graceful botanical wedding invitation aesthetic. Muted sage olive ivory butter yellow, no bright greens. Rich foreground blooms lower corners framing quiet central depth. No people, no words, no monograms, no lettering, no watermark, no borders. Keep architecture stable and believable, beautifully grand yet intimate.
