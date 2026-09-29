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

## Product funnel analytics (VOW-5)

`src/analytics.ts` ships a fire-and-forget emitter used by every step in the conversion funnel. Each `trackStep` call forwards the event to GA4 (`window.gtag('event', …)` when available) and to the Worker's `/api/funnel` endpoint so a redundant stream survives ad-blockers and CSP noise. The emitter is wrapped in try/catch and never throws, never blocks UI, and never awaits the network.

### Funnel map (20 canonical events)

| # | Event | Source screen |
|---|---|---|
| 1 | `design_card_view` | `Landing` design grid (IntersectionObserver on each `Reveal`) |
| 2 | `design_card_click` | `Landing` design card button |
| 3 | `preview_open` | Preview route render |
| 4 | `cover_sealed_broken` | `Envelope` first click (fires before the envelope animation) |
| 5 | `preview_use_clicked` | `Invitation` topbar “Make this yours” / “Start free draft” |
| 6 | `editor_open` | Editor route render |
| 7 | `editor_name_filled` | Editor Essentials tab, 500 ms debounce after both names are non-empty |
| 8 | `editor_tab_advanced` | Editor tab change (params `from`, `to`) |
| 9 | `editor_ready_to_publish_clicked` | Editor header/publish-banner button entry |
| 10 | `editor_review_continue_clicked` | Editor review-screen confirmation step |
| 11 | `checkout_open` | Checkout route render |
| 12 | `otp_requested` | `CustomerOtpAuth` after successful `request()` |
| 13 | `otp_verified` | `CustomerOtpAuth` after successful `verify()` |
| 14 | `subdomain_typed` | Checkout first valid (≥ 3 chars, has letter) subdomain commit, once per session |
| 15 | `subdomain_available` | Checkout, once per subdomain the first time the availability probe returns `available` |
| 16 | `coupon_applied` | Checkout `applyCoupon()` success (param `discountCents`) |
| 17 | `payment_initiated` | Checkout `placeOrder()` for non-complimentary orders (params `method`, `totalCents`) |
| 18 | `payment_succeeded` | `PaymentSuccess` render |
| 19 | `invite_shared` | `PaymentSuccess` share buttons (param `channel: 'whatsapp' \| 'telegram' \| 'twitter' \| 'email' \| 'copy'`) |
| 21 | `checkout_error` | Checkout whenever an error string is set (param `code` derived from `buyerSafePaymentMessage`; never the raw secret-bearing message) |

The Worker allowlist in `worker/funnel.ts` matches this 20-event set. Unknown names return HTTP 400 with `code: funnel_invalid` and never reach the log.

### Worker endpoint

`POST /api/funnel` is wired in `worker/index.ts` under `run_worker_first` (the `/api/*` glob already routes to the Worker). It:

- Validates the JSON body and rejects unknown event names with HTTP 400 (`code: funnel_invalid`).
- Strips PII keys (`email`, `name`, `phone`, `address`, `message`, `token`, `password`, `secret`, `csrf`, `cookie`, `authorization`, `user_agent`) and any nested objects / arrays.
- Truncates strings to 200 chars and numeric keys to `[a-z0-9_]{1,40}` before logging.
- Soft rate-limits 120 events per IP per minute using the existing `rate_limits` table (no new migration). Over-quota events still return 204; only the log line is suppressed (a `warn` line is emitted once).
- Returns `204` with no body.

The handler logs `console.log(JSON.stringify({level:'info',event:'funnel',eventName,params,path}))` for every accepted event. The log line is identical in shape to the existing `rsvp_saved` and `meta_event` lines so the same observability tail catches all of them.

### Querying the data

**GA4 (browser-only, blocked by ad-blockers)**

1. Reports → Engagement → Events. Every custom event above appears under “Event name”.
2. To break down by entry path, add the built-in `page_location` dimension or a custom `path` parameter via GA4 tag config (the emitter already attaches `path` from `location.hash`).
3. Funnel exploration: free-form exploration with steps ordered by the table above, scoped to `page_location` containing `vowvel.com`.

**Worker observability tail**

```bash
npx wrangler tail --format=pretty | jq 'select(.event=="funnel")'
```

The same query works in the Cloudflare dashboard → Logs. Filter on `event:"funnel"` for the funnel stream, `event:"rsvp_saved"` for guest replies, and `event:"meta_event"` for the CAPI mirror. Rate-limited drops appear as `level:"warn"` `event:"funnel_rate_limited"`.

### Tests

`tests/funnel.test.mjs` adds 14 assertions covering:

- Allowlist shape (`FUNNEL_EVENTS.length === 20`, every required name present).
- `parseFunnelBody` rejecting unknown names, missing fields, and non-objects.
- `sanitizeFunnelParams` stripping nested objects, arrays, oversized strings, and forbidden PII keys.
- `sanitizeFunnelPath` truncation and null handling.
- `buildFunnelLogLine` producing the expected structured line.
- `trackStep` routing through both `gtag` and `fetch('/api/funnel', …)` with `keepalive`, including the `path`/`ts` envelope.
- `track` being a no-op when `gtag` is absent, swallowing `fetch` rejections, and stripping oversized/nested values.
- `POST /api/funnel` accepting an allowlisted event (204 + structured log), rejecting unknown names (400 `funnel_invalid`), and stripping PII keys before logging.
- `GET /api/funnel` describing the endpoint contract.

Total suite: 74 tests (60 original + 14 funnel), all passing.

## Limits of this verification

Not a real-device Safari/Android test. No Lighthouse or automated contrast report was run; performance scores and universal accessibility conformance are not claimed. Photo selection and backup file chooser flows require a further device-based round trip before production. Canvas pointer erasure is implemented and reviewed; the tap reveal is the keyboard fallback. API integrations cannot be verified until connected.

Live auth, cloud storage, delivery of guest replies, payments, webhook recovery, public subdomains, privacy controls, hosting expiry and social sharing are not implemented in this frontend preview. They remain explicit production integration work, documented in cloudflare-integration.md.
