# Invitation preview redesign — verification record

## Reference and scope

- Root inspected contact sheets from all three reference reels and the rendered Dolce Vita reference.
- Three public reference HTML pages were saved under `docs/references/webgency/`; source findings and links are recorded in `reference.md` there.
- The redesign preserves the existing landing files and focuses on invitation previews.
- Five full portrait covers, a live four-unit countdown, scratch reveal, and gallery are implemented.
- Four original generated images were added: `afterhours-frame-v2`, `keepsake-hands`, `keepsake-letters`, and `keepsake-table`. Original PNGs are in `assets/art/`; optimized WebP derivatives are in `public/art/`.

## Verification reported by the team

- Verifying agent reports seven tests passed and production build passed.
- Root verified that tapping the botanical opening works.
- Root inspected the After Hours mobile screenshot and found the text readable.
- Browser QA for the remaining themes is ongoing. This record does not claim all themes, devices, or interactions have passed rendered verification.

## Implementation boundaries

- New animation is CSS motion; no newly rendered video has been integrated.
- Live payments and public publishing backend remain unwired. Local previews and draft behavior must not be represented as verified payment or live publication.
- Reference artwork remains research material; production additions are original generated assets.

This record distinguishes reported checks from outstanding browser verification. It is not a production launch certification.

## Final browser pass

- Tested at 390 × 844 and default desktop width. Portrait composition is capped at 500px; tested Sunday viewport had document width 390px with no horizontal page overflow.
- Botanical wax seal opened successfully; dark evening hero visually inspected after transition.
- Sunday: inspected hero and scratch/countdown flow, scratched foil with pointer, used accessible reveal button, confirmed disabled revealed state.
- Keepsake next button advanced counter from 01 to 02 of 03.
- RSVP quick link retained invitation route; submitted fictional `Preview Guest`, confirmed local-only sample reply message. No host message sent.
- Azure: inspected shutter cover and activated opening.
- Rebuilt after final gallery and hero changes; production build passes. Seven tests pass.
- Original landing component and storefront stylesheet were left unchanged. Reference HTML remains documentation only.

CSS animated covers are implemented; no new rendered video has been produced. Original four generated images were optimized to local WebP. Sample photographs are labeled as samples in the gallery.
