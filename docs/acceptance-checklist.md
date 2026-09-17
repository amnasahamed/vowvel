# Vowvel acceptance checklist

Scope: premium wedding and engagement invitation website, five distinct art-directed invitation experiences, local working creation flow. Razorpay credentials and production APIs will follow. This checklist separates working prototype behavior from production launch obligations.

## P0 — Required in this implementation

- [ ] Public site has usable Designs, How it works, Pricing, and Create entry points; each main CTA leads somewhere useful.
- [ ] Five named designs differ in composition, materials, typography, palette, and opening/motion language—not just colors.
- [ ] Every design opens into a complete invitation rather than a decorative thumbnail or single hero.
- [ ] At least the principal experience includes a convincing envelope opening; content remains available through a visible skip/open action.
- [ ] Scratch-to-reveal supports actual pointer/touch scratching plus a keyboard/button alternative. Essential date and venue are also available without scratching.
- [ ] Names, event type, date, and venue can be customized with an immediate preview before account/payment requirements.
- [ ] Switching designs preserves entered invitation content.
- [ ] Draft saving accurately says when it is stored only on this device; refresh recovers it where storage is available.
- [ ] Wedding/engagement wording stays consistent through preview and creation.
- [ ] Complete invitation includes welcome/names, occasion/date, event schedule, venue/directions, reply form, and closing.
- [ ] Desktop and mobile experiences fit their viewport without horizontal overflow, clipped controls, or cramped desktop sidebars.
- [ ] Interactive controls use semantic buttons/links, visible focus states, usable labels, and keyboard operation.
- [ ] Reduced-motion mode bypasses lengthy openings and decorative animation; no essential information requires animation completion.
- [ ] No automatic audio; photographs/video are optional enhancement with static fallbacks.
- [ ] Forms retain values on validation errors; submitted RSVP and checkout states disclose whether they are local demo behavior.
- [ ] No real payment, verified publication, owned domain, customer review, or discount claim is fabricated.
- [ ] Payment handoff is clearly unavailable/demo until Razorpay/server verification exists. Demo confirmation never claims a real charge or public hosted URL.
- [ ] Working build, browser checks at mobile/desktop, and key interaction verification are recorded.

## P1 — Competitor sections, improved organization

- [ ] Ceremony schedule is a single source of truth for displayed events, RSVP selection, and calendar export.
- [ ] Optional photo/story section looks intentional without personal photos; sample assets are marked as demo when appropriate.
- [ ] Dress code, travel, accommodation, and gift note are grouped as guest information with sensible progressive disclosure.
- [ ] Save-the-date/calendar and directions work when details are valid; pending details have explanatory disabled states.
- [ ] Guest navigation exposes RSVP, Directions, and Save date without replaying the opening.
- [ ] Countdown handles dates in the past gracefully.
- [ ] Meaningful image alt text, decorative image handling, and media loading/error fallback are present.
- [ ] Heavy imagery is compressed/lazy-loaded below the fold; all five cinematic assets do not load at once unnecessarily.
- [ ] Design detail and purchase review describe exactly what a single purchase will cover; unconfirmed price/lifetime/refund policy remain clearly provisional.

## P2 — Production launch, explicitly deferred where APIs are missing

- [ ] Authentication and durable account drafts replace local-only persistence.
- [ ] Razorpay order creation, server signature validation, signed webhooks, idempotency, and order recovery are implemented before charging.
- [ ] Pending/failed/cancelled payments retain drafts; successful payment followed by publish failure retries publication without charging again.
- [ ] Public publication uses durable storage, stable invitation identifiers, host authorization, and validated content.
- [ ] Cloudflare hosting route/subdomain plan is documented; wildcard DNS/certificate setup requires an actually owned domain.
- [ ] Host-assigned subdomains are validated/reserved and resolve to the correct invitation without cross-customer data leakage.
- [ ] Guest replies are privately stored with rate limiting, validation, duplicate handling, and response-edit policy.
- [ ] Pause/resume public links is reversible and available before the event.
- [ ] Account privacy, hosting duration/expiry, taxes, refund terms, support, and data retention are finalized.
- [ ] Shared previews, copy link, WhatsApp sharing, and QR use verified live URLs only.
- [ ] Supported language claims require actual reviewed translations and matching layout/font support.

## Monitoring milestones

1. **Implementation review:** inspect design differentiation, user journey, media assets, and checkout honesty. Flag missing P0 items before final polishing.
2. **Completion review:** inspect verified behavior and remaining limitations. Ensure final handoff distinguishes working prototype, production dependencies, and deploy status.

## Initial risks and scope guidance

- ₹5,000 is the user's desired perceived value, not an approved selling price or legitimate crossed-out original price. Demonstrate value through craft; do not invent a sale.
- Envelope-led conversion is the user's observed preference, not a measured Vowvel conversion claim. Make envelopes compelling and skippable.
- The existing competitor review did not verify cinematic video playback, RSVP submission, or payments end-to-end; do not treat those uncertain behaviors as validated specifications.
- Prefer five exceptional invitation systems over five unrelated copies of the marketing website. A coherent Vowvel shell should let couples browse and personalize all five.
- Avoid claiming full platform completion with a polished landing page alone. The minimum useful build includes browsing, opening, editing, retained drafts, and an honest checkout boundary.
- Video generation is optional. Strong image/CSS motion must remain complete while first/last-frame video assets are a later enhancement.

Sources: `vowvel-ux-direction.md`, `zareqia-workflow.md`, and current user request. Checklist ownership: monitoring agent; no application code modified.
