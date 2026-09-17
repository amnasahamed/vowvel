# Cinematic invitation QA

Scope: upgraded cover, layered invitation scene, and subtle scroll depth. No changes to landing-page behavior are required for this pass.

## Motion and composition

- Open each of five covers using seal, keyboard Enter/Space, and skip. After the 1.6-second opening, the hero heading receives focus without an unexpected scroll.
- Navigate away mid-opening. The old cover must not fire a late callback or change the new page.
- Repeat the opening. Keep focus on the new seal, and preserve invitation content.
- Botanical layer order remains: linen → underleaf → rear flowers → torn paper → live text → front flowers → vellum → silk. No decoration blocks a link or selection.
- With supported CSS scroll timelines, the scene stays at its base translation before the hero exits. During exit, rear flowers move at most +12px, front flowers −24px, paper +6px, vellum +4px, and bow −12px. Returning to the top restores zero translation.
- Existing flower sway, paper entrance, and bow rotation remain active; the new animation changes only individual `translate`. Hero text, dates, links, focus outlines, and page scrolling remain untouched.
- Test tall and short phone viewports, plus desktop. Hero clipping contains moving decorations; no sideways page overflow or visible blank strip appears.
- Toggle reduced motion before and during the scene. Covers skip their sequence; scroll depth and decorative movement stop. No content remains hidden.
- In a browser without scroll-timeline support, the invitation retains its existing static/entrance presentation and full functionality.
- Embedded editor previews receive no scroll parallax. Typing, design switching, and native preview scroll remain stable.

## Interaction regression

- Reveal a scratch note, then change its note/date in the editor: foil resets and can be scratched or revealed by button again.
- Confirm RSVP keyboard input, trimmed-name validation, at least one current event for acceptance, party size limits, decline, edit, and explicit local-demo confirmation.
- Remove a selected ceremony while previewing: stale event IDs cannot count as a valid RSVP selection.
- Guest quick actions scroll within the invitation without changing its hash route. Maps use the current venue/address; pending events expose no broken calendar download.
- Download a calendar file and verify IST conversion, current event text, and line escaping. A two-hour duration is currently assumed.
- Test long couple names, absent photos, missing dates/venue, media failure, and browser zoom at 200%.

## Verification status

The stylesheet uses feature and motion-preference gates, scopes motion to non-embedded invitation heroes, and composes with existing botanical animation tracks. Seven unit tests and the production build passed before this stylesheet was added. Root must import `src/scene-motion.css` and perform the visual/browser checks above; these are not claimed as completed by this document.

## Completed browser verification — 15 September 2026

- Four new scenes inspected at phone width; adjusted palace text clearance and velvet cutout placement after rendering.
- Tested real playback with a temporary silent three-second H.264 test clip: seal tap opened video dialog; playback completion removed video and focused the live invitation H1. Test file removed and all film entries restored to null.
- Film poster assets now match each generated first frame rather than the catalog art.
- Fixed a view-timeline issue: `overflow:hidden` on the invitation created a non-scrolling ancestor. `overflow:clip` now clips decorations without intercepting the scroll timeline in supported browsers.
- Coastal foreground translation measured at -8.99px at scrollY422 and -18px at scrollY844, confirming actual scroll-responsive movement. Text is excluded from this motion.
- Seven tests pass. Production build passes. User-generated finished movies remain pending.
- Ten original video endpoint PNGs delivered, plus normalized720×1280 copies and zipped per-theme prompts. These are frames, not rendered movies.

## Scroll-controlled film audit

Reviewed the scroll-film integration before the story section. Manifest entries remain optional; an unconfigured, embedded, reduced-motion, or failed film renders its final still without the extended scrolling section. No automatic playback is used. Video loading starts near the section, and a single animation-frame request applies the newest scroll time; seeks in flight resume from their latest target after `seeked`.

Concrete corrections made:

- Show video only after `loadeddata`, rather than metadata; reset readiness when the source or motion mode remounts it.
- Retain the first-frame still while loading; use the final still when animation is unavailable.
- Add an eight-second stalled-seek fallback alongside the twelve-second initial-load fallback. Cancel timers and pending animation frames on cleanup.
- Clamp finite scroll progress and preserve the latest request while seeking.
- Use viewport height plus 480px for the active section, avoiding a reversed progress range on very tall displays.
- Confirm the existing outer invitation `overflow:clip` override: this preserves clipping without intercepting sticky positioning and view timelines.
- Keep video outside keyboard focus, disable remote playback, and give Continue a visible focus ring and 44px target. Continue uses native scrolling and transfers focus beyond the sequence.

Root browser validation remains necessary: use the temporary five-second QA clip to check first/middle/final frames, reverse scrubbing, rapid scroll request coalescing, sticky position, reduced-motion switching, metadata-only loading, failed loads, and Continue via keyboard. Remove the temporary clip from final configuration; all production manifest entries must remain null until real video assets are supplied. The seven existing regression tests and production build pass; those tests do not claim browser video-seeking coverage.
