# Vowvel verification

## Completed

- TypeScript and Vite production build pass.
- Six Node tests pass: draft round-trip, invalid JSON/version/payload recovery, corrupt field/date sanitization, usable event fallback, blocked storage handling, and mutable-state isolation.
- Wrangler static-asset deployment dry run passes. No deployment or payment was performed.
- Browser inspection at 1280 × 720 desktop and 390 × 844 mobile.
- Storefront envelope enters a guest invitation; removed the redundant second envelope gate for that path.
- Five separate invitation routes load and use their intended artwork/typographic direction.
- Guest RSVP/details navigation stays on the invitation route. Sample RSVP displays its local-only confirmation and permits editing.
- Scratch tap reveal verified in the mobile browser; the coating canvas disappears and the note remains visible.
- Mobile storefront and Azure: no horizontal overflow at 390px and no broken loaded images.
- Mobile editor: names, engagement selection, venue/address, design changes and live preview work. Date/time input verified in guest preview as 15 February 2027 / 4:30 PM IST.
- Checkout retains the chosen theme/names/occasion, explains that publishing is unavailable, and never claims payment or a live URL.
- Mobile Sunday text/art overlap fixed by sequential layout; Azure and Conservatory use separate text/art regions for legibility. Embedded desktop phone previews use their own compact layout.
- Original artwork compressed to local WebP; original PNGs retained; no remote font dependency.

## Source-reviewed behavior

- Native envelope bypass and scratch reveal button; pointer scratch uses canvas erasure.
- Reduced-motion rules disable animations; guest reveal observer skips reduced-motion mode.
- Maps encode the shared ceremony location; calendar generation converts IST to UTC and escapes event text.
- Blank personal drafts do not inherit sample shuttle/venue commitments.
- Design switching/undo synchronizes the route for reload recovery; engagement default titles are normalized without overwriting custom event names.
- Backup restoration uses the same tested input validator, checks file size and offers undo.
- Photo upload validates format/size and compresses locally; gallery accepts all six photos.

## Limits of this verification

Not a real-device Safari/Android test. No Lighthouse or automated contrast report was run; performance scores and universal accessibility conformance are not claimed. Photo selection and backup file chooser flows require a further device-based round trip before production. Canvas pointer erasure is implemented and reviewed; the tap reveal is the keyboard fallback. API integrations cannot be verified until connected.

Live auth, cloud storage, delivery of guest replies, payments, webhook recovery, public subdomains, privacy controls, hosting expiry and social sharing are not implemented in this frontend preview. They remain explicit production integration work, documented in cloudflare-integration.md.
