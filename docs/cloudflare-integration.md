# Cloudflare integration handoff

## Current build

A static React/Vite app, prepared with `wrangler.jsonc` for Workers Static Assets. `npm run deploy:check` validates the built assets without publishing. No Cloudflare account, domain ownership or service bindings were assumed. Vowvel's domain purchase remains pending.

## Next service layer

1. Authenticated sessions: email code or OAuth; preserve local draft and selected theme through sign-in. Rate limit auth and bind drafts to an owner.
2. D1: invitations, working revisions, published revisions, ceremonies, orders, verified payment events, RSVP submissions, and hosting/visibility state. Unique constraints on provider order/payment/webhook IDs enforce idempotency.
3. R2: original uploads and optimized media. Validate MIME/size server-side, strip unnecessary metadata, use scoped upload grants. Store object keys rather than user-supplied arbitrary HTML.
4. Worker API: owner-authorized create/read/update, revision publication, guest RSVP validation, order creation and payment verification. No private draft content in public responses.
5. Razorpay: create the order and final amount server-side; open provider checkout only after an order exists. Verify callback signatures and webhook signatures on the Worker using the original payload. Confirm captured/paid state before publishing. A redirect is not payment proof. Duplicate delivery must not republish or charge twice.
6. Recovery: pending payment gets a status check, failed/cancelled checkout preserves the draft, paid-but-unpublished retries publication without another charge. Return a live URL only after public fetch resolves to the published revision.

## Invitation subdomains

After the chosen domain is owned and connected, use a wildcard DNS record plus a Worker route/custom-domain arrangement supported by the account. Confirm certificate coverage for the actual hostname depth. Reserve product names (`www`, `app`, `api`, `admin`, `support`) and bind each available couple slug to one published invitation ID. Resolve Host against the configured base domain, validate the slug, and fetch only a published, active revision. Pause/expiry must return a neutral unavailable page without leaking details.

Wildcard routing and certificate setup must be validated against the actual zone. No per-couple Cloudflare API call is needed in the intended database-driven host routing design once wildcard infrastructure exists. This is an architecture proposal, not a configured service.

The current hash routes are preview navigation. Production invitation links should use normal HTTPS host/path URLs with server-rendered title, description and social image so WhatsApp previews work without executing React. Do not ship a hash-only URL as the final customer share link.

## Before enabling payments

Confirm currency, exact payable total/taxes, hosting period, refunds, edits/rescheduling, support address, data retention and consent wording. Add authenticated guest management, CSV export, privacy pause/resume, actual QR and WhatsApp sharing, and transactional notifications. Validate payment failure, pending, duplicate webhook, expired session and publication retry scenarios.

## References checked

- https://developers.cloudflare.com/workers/static-assets/get-started/
- https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- Installed Wrangler configuration schema and successful local dry run.

Fetch current Razorpay integration documentation when real credentials and checkout scope are provided; no unverified provider API code has been shipped in this frontend.

## Sharing preview implementation

See `docs/social-sharing.md`. The build now emits initial HTML social tags and PNG images for five demo invitation paths, plus brand metadata. The editor generates personalized previews and image downloads locally. Production must connect the shared generator to the validated published revision and revisioned R2 media. Set SITE_URL to the real HTTPS origin before deployment; npm deploy guards against a missing origin.
