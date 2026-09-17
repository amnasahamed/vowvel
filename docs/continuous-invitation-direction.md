# Continuous opening and inclusive invitation update

Implemented 15 September 2026.

## Opening handoff

The supplied opening films finish on the same artwork used by the live hero. `public/films/*-ending.webp` is extracted from the actual final decoded video frame. The film and hero share 9:16 framing, contain sizing, viewport height, surrounding colour and horizontal alignment. The final image is requested while the film plays. On natural completion, live hero content mounts beneath a 1.05-second dissolve; names and occasion/date fade in on the blank stationery. The overlay unmounts after the dissolve and focus moves to the hero heading. Skip, reduced-motion and playback failure remain direct routes into the invitation. No generated text is baked into the films. The guest quick-action bar appears only after leaving the hero, keeping the opening artwork clear.

The previous separate botanical/cinematic heroes remain as source assets/components but are no longer the active guest hero. The approved storefront layout is unchanged.

## Optional couple and family section

Editor: Your words → Introduce the couple. Optional fields per person: custom role, portrait, introduction, family name/heading, and parents/guardians/loved ones. Existing name fields supply names; swapping names swaps the profiles. Family details can be independently hidden. Blank sections/fields disappear, and one supplied portrait remains a deliberate asymmetric arrangement. Uploads accept JPG/PNG/WebP, validate size, downsize to a maximum 800px edge, and save optimized images with the local draft. Old backups remain valid. No portraits or family names are included in social preview metadata automatically.

## Universal motion and materials

The old empty album/palace/coast scroll panels have been replaced with compact, reusable layered craft interludes across all five designs. Paper, flowers, ribbons, velvet and foliage move gently as they pass through view; there is no forced waiting, pinned viewport or video dependency. Reduced-motion and embedded editor previews remain static. Default copy does not prescribe religious ceremonies, blessings, gender labels, dancing or an evening celebration.

Body sections now use theme-specific cotton/laid paper, floral margins, botanical/block-print borders, stitching, engraved lines and postcard patterns. Decorations stay outside control hit areas and behind content. Existing source artwork and original uploaded video files are preserved.

## Validation

Production build and 12 automated tests pass, including old-draft compatibility and malformed/optional profile persistence. Browser checks: all five final-frame heroes inspected; Conservatory natural film completion reached live text at scroll position zero with heading focus; Azure mobile text fits without horizontal overflow; isolated couple editor test confirmed one portrait plus a text-only partner and optional family/section removal without changing the real saved draft. Temporary QA fixture removed.

Final review fixes: pending portrait decodes are invalidated on unmount/profile changes and use the latest callback; only the film media layer fades so Skip and modal keyboard focus remain available throughout the dissolve.

## Name timing and richness refinement

Names now appear during the final two seconds of the film (duration minus two, driven by media time updates). Film and hero render the same OpeningLetter component; the hero does not replay its letter animation when the video dissolves. Browser measured visible names at 4.54 seconds of a six-second After Hours clip. Conservatory uses calligraphic names; the other themes use distinct serif treatments, with restrained botanical flourishes and letterpress rules.

After Hours body text is larger and fully opaque, headings use sentence case, and the RSVP card has a cream surface with explicit dark labels/inputs. Floral-richness styles add visible pressed stems, ribbon/tape and correspondence motifs to the other four designs without changing opening footage or placing decoration over controls. Build and 12 tests pass.
