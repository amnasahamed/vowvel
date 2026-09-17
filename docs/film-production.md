# Optional invitation films

No movie is enabled by default. Existing CSS openings remain the fallback. `src/films.ts` is the manifest; every entry starts as `null`, so the app does not request nonexistent films.

## Prepare and enable

1. Generate an original silent portrait movie for the chosen design. Recommended: **720 × 1280, approximately five seconds, H.264 MP4**, web optimized with metadata at the beginning (fast start).
2. Use a locked camera and matching first/last frames: begin with the closed invitation object and end with the opened scene that leads into the invitation. Preserve composition, lighting, colors, and objects across endpoints. Keep motion restrained and deliberate.
3. Do not bake couple names, event dates, buttons, or other editable text into the film. Those remain accessible HTML. Do not include an audio track; the opening never enables sound.
4. Save the file as `public/films/{theme}.mp4`, where theme is `conservatory`, `gulmohar`, `afterhours`, `sunday`, or `azure`.
5. Set only that theme's entry in `src/films.ts` to `/films/{theme}.mp4`. Leave other entries `null`. Build and test the enabled theme before deployment.

## Component integration

`InvitationFilm` accepts `theme` and `onComplete`. Mount it only after the guest activates the opening control and only when `configuredFilm(theme)` returns a path. Use `key={theme}` and unmount it in `onComplete`; reveal the regular HTML invitation and move focus to its heading. Do not leave interactive page content underneath the film keyboard-accessible while it is mounted.

The component uses muted inline playback with `preload="none"`. It completes on video end, media error, rejected playback, skip/Escape, a change to reduced motion, or a 15-second safety timeout. It initially shows the matching generated first frame from public/films/{theme}-poster.webp. Guests requesting reduced motion bypass the film without a video request. Cleanup pauses playback and clears listeners/timers.

## Verification before enabling a film

- Check first/last-frame alignment on a phone and desktop, and ensure the last frame transitions naturally to the HTML cover.
- Test slow loading, unavailable media, rejected playback, the skip button, keyboard Escape, and reduced motion.
- Keep essential date/venue/RSVP access available through the normal invitation; opening playback is optional.
- Film delivery does not enable payment or publishing. Those production integrations remain separate.

## V3 matched film endpoint frames

Generated with built-in image generation. Each last frame was edited from its inspected first frame, preserving the locked overhead scene. Original tool output dimensions are retained without cropping or stretching. These are source images for video generation, not rendered movies. Central blank space is reserved for live HTML names and details.

All originals are 941 × 1672 pixels (approximately 9:16). Standardized **720 × 1280 PNG** copies are in `assets/video-frames/v3/ready/`; the negligible aspect difference is resized without cropping. The ready images plus exact image prompts and a per-theme video prompt are packaged in `assets/video-frames/v3/vowvel-five-film-frame-pairs.zip`.

### conservatory

- First: `assets/video-frames/v3/conservatory-first.png`
- Last: `assets/video-frames/v3/conservatory-last.png`

**First-frame prompt**

Use case: product-mockup. Asset type: FIRST FRAME of a luxury invitation opening movie. Exact portrait aspect ratio 9:16, 720x1280 composition. A closed sage-green cotton-paper envelope centered on warm ivory handmade paper, tied with an exquisite soft sage silk bow, pressed white cosmos and delicate foliage framing the perimeter. Fine deckled edges, tactile paper fibers and embossed botanical detail, subtle warm shadows. Locked perfectly overhead orthographic camera, symmetrical centered composition, entire closed physical invitation fully inside frame with generous outer margin. Real tactile handcrafted materials, refined editorial still-life lighting, exceptional craft. This will later open to expose a large blank center. No people, hands, text, names, letters, numbers, monograms, logos, watermark or UI. One single finished image, not a contact sheet.

**Last-frame edit prompt**

Use case: precise-object-edit. Input image: the supplied image is the exact FIRST FRAME edit target. Create the matched LAST FRAME of the same opening movie. Untie the sage bow so its two loose tails settle outside the central area; open the envelope fully, folded sage flaps resting toward outer edges, revealing a tall blank warm ivory cotton-paper insert. Maintain the identical locked overhead camera, exact 9:16 portrait framing and output dimensions, lighting, backdrop, material textures, palette, and stationary outside props. Change only the invitation opening state; preserve object identity and physical continuity. The central 50% of the overall frame must be a clear uninterrupted blank text-safe area, no decoration crossing it. Preserve all decorations around the outer edges only. Do not add objects, hands, people, names, text, letters, numbers, symbols, logos, UI or watermark. A beautiful physically plausible final open state, not a new design or different scene.

### gulmohar

- First: `assets/video-frames/v3/gulmohar-first.png`
- Last: `assets/video-frames/v3/gulmohar-last.png`

**First-frame prompt**

Use case: product-mockup. Asset type: FIRST FRAME of a luxury invitation opening movie. Exact portrait aspect ratio 9:16, 720x1280 composition. A closed exquisite rose-gold and blush Indian palace gatefold invitation, two symmetrical miniature-painted scalloped door panels meeting centrally on parchment, delicate gold borders, vermilion gulmohar blossoms and restrained peacock-feather details at the outer edges. Tactile handpainted gouache and gilded paper craftsmanship. Locked perfectly overhead orthographic camera, symmetrical centered composition, entire closed physical invitation fully inside frame with generous outer margin. Real tactile handcrafted materials, refined editorial still-life lighting, exceptional craft. This will later open to expose a large blank center. No people, hands, text, names, letters, numbers, monograms, logos, watermark or UI. One single finished image, not a contact sheet.

**Last-frame edit prompt**

Use case: precise-object-edit. Input image: the supplied image is the exact FIRST FRAME edit target. Create the matched LAST FRAME of the same opening movie. Swing the two decorated palace gatefold panels outward toward the far left and right edges, revealing a tall blank parchment insert; retain ornate scalloped gold border only around its perimeter. Maintain the identical locked overhead camera, exact 9:16 portrait framing and output dimensions, lighting, backdrop, material textures, palette, and stationary outside props. Change only the invitation opening state; preserve object identity and physical continuity. The central 50% of the overall frame must be a clear uninterrupted blank text-safe area, no decoration crossing it. Preserve all decorations around the outer edges only. Do not add objects, hands, people, names, text, letters, numbers, symbols, logos, UI or watermark. A beautiful physically plausible final open state, not a new design or different scene.

### afterhours

- First: `assets/video-frames/v3/afterhours-first.png`
- Last: `assets/video-frames/v3/afterhours-last.png`

**First-frame prompt**

Use case: product-mockup. Asset type: FIRST FRAME of a luxury invitation opening movie. Exact portrait aspect ratio 9:16, 720x1280 composition. A closed burgundy velvet ceremonial invitation with symmetrical gold-trimmed double doors meeting centrally, refined geometric brass filigree, deep black-cherry velvet fabric gathered at the perimeter, warm dramatic gold highlights. Ultra-luxury fine bookbinding and art-deco evening glamour. Locked perfectly overhead orthographic camera, symmetrical centered composition, entire closed physical invitation fully inside frame with generous outer margin. Real tactile handcrafted materials, refined editorial still-life lighting, exceptional craft. This will later open to expose a large blank center. No people, hands, text, names, letters, numbers, monograms, logos, watermark or UI. One single finished image, not a contact sheet.

**Last-frame edit prompt**

Use case: precise-object-edit. Input image: the supplied image is the exact FIRST FRAME edit target. Create the matched LAST FRAME of the same opening movie. Swing the two burgundy gold doors fully outward toward the far left and right edges, revealing a tall completely blank dark black-cherry velvet-paper interior, with fine gold trim confined to its perimeter. Maintain the identical locked overhead camera, exact 9:16 portrait framing and output dimensions, lighting, backdrop, material textures, palette, and stationary outside props. Change only the invitation opening state; preserve object identity and physical continuity. The central 50% of the overall frame must be a clear uninterrupted blank text-safe area, no decoration crossing it. Preserve all decorations around the outer edges only. Do not add objects, hands, people, names, text, letters, numbers, symbols, logos, UI or watermark. A beautiful physically plausible final open state, not a new design or different scene.

### sunday

- First: `assets/video-frames/v3/sunday-first.png`
- Last: `assets/video-frames/v3/sunday-last.png`

**First-frame prompt**

Use case: product-mockup. Asset type: FIRST FRAME of a luxury invitation opening movie. Exact portrait aspect ratio 9:16, 720x1280 composition. A closed butter-yellow folded handmade paper party keepsake invitation with a large playful cobalt silk ribbon bow, tiny cut-paper cherries and cream daisies gathered around the outer edges, tactile scissors-cut shapes and warm butter paper backdrop. Sophisticated art-school editorial papercraft. Locked perfectly overhead orthographic camera, symmetrical centered composition, entire closed physical invitation fully inside frame with generous outer margin. Real tactile handcrafted materials, refined editorial still-life lighting, exceptional craft. This will later open to expose a large blank center. No people, hands, text, names, letters, numbers, monograms, logos, watermark or UI. One single finished image, not a contact sheet.

**Last-frame edit prompt**

Use case: precise-object-edit. Input image: the supplied image is the exact FIRST FRAME edit target. Create the matched LAST FRAME of the same opening movie. Untie the cobalt bow and let the ribbon ends curl along outer edges; unfold the two butter-paper panels outward toward left and right, revealing a tall blank butter-yellow paper insert. Maintain the identical locked overhead camera, exact 9:16 portrait framing and output dimensions, lighting, backdrop, material textures, palette, and stationary outside props. Change only the invitation opening state; preserve object identity and physical continuity. The central 50% of the overall frame must be a clear uninterrupted blank text-safe area, no decoration crossing it. Preserve all decorations around the outer edges only. Do not add objects, hands, people, names, text, letters, numbers, symbols, logos, UI or watermark. A beautiful physically plausible final open state, not a new design or different scene.

### azure

- First: `assets/video-frames/v3/azure-first.png`
- Last: `assets/video-frames/v3/azure-last.png`

**First-frame prompt**

Use case: product-mockup. Asset type: FIRST FRAME of a luxury invitation opening movie. Exact portrait aspect ratio 9:16, 720x1280 composition. A closed pair of powder-blue coastal shutters made as an exquisite illustrated folded-paper invitation, two panels meeting centrally, tiny handpainted lemon branches framing outer corners, ivory watercolor paper background, delicate cobalt coastal details. Mediterranean artisanal stationery with soft sunwashed texture. Locked perfectly overhead orthographic camera, symmetrical centered composition, entire closed physical invitation fully inside frame with generous outer margin. Real tactile handcrafted materials, refined editorial still-life lighting, exceptional craft. This will later open to expose a large blank center. No people, hands, text, names, letters, numbers, monograms, logos, watermark or UI. One single finished image, not a contact sheet.

**Last-frame edit prompt**

Use case: precise-object-edit. Input image: the supplied image is the exact FIRST FRAME edit target. Create the matched LAST FRAME of the same opening movie. Untie the central cord and swing both powder-blue shutter panels outward toward the far left and right, revealing a tall completely blank ivory watercolor-paper insert; lemon branches remain near outer corners. Maintain the identical locked overhead camera, exact 9:16 portrait framing and output dimensions, lighting, backdrop, material textures, palette, and stationary outside props. Change only the invitation opening state; preserve object identity and physical continuity. The central 50% of the overall frame must be a clear uninterrupted blank text-safe area, no decoration crossing it. Preserve all decorations around the outer edges only. Do not add objects, hands, people, names, text, letters, numbers, symbols, logos, UI or watermark. A beautiful physically plausible final open state, not a new design or different scene.

## Supplied films connected — 15 September 2026

All five user-supplied videos from `assets/video-frames/v3/generatedvideos/` are enabled in `src/films.ts`. The source spelling `afterhoours.mp4` maps to the After Hours design and public `afterhours.mp4`.

Each source is a six-second, 720 × 1280 H.264 film at 24 fps with an AAC audio track. Public copies use the original encoded video stream (no re-encoding), remove audio and relocate MP4 metadata for fast playback startup. Originals are unchanged. Website file sizes range from 1.73 to 2.92 MiB. Each static poster is extracted from its actual supplied clip, avoiding mismatches with the earlier generated frame exports.

Guest flow: static first-frame poster; tap starts a muted inline video once; natural completion reveals the live invitation and focuses its heading. Skip and Escape bypass playback. Reduced-motion preference opens the invitation directly. No video element is mounted before activation. There is a load/error timeout fallback.

These replace the earlier pending-film state. Opening videos are now enabled; the separate scroll-film manifest remains optional and unchanged.
