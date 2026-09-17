# Vowvel

A luxury wedding and engagement invitation experience, built with React, TypeScript and Vite for Cloudflare Workers Static Assets.

## Run locally

Node 24 recommended (the test harness uses Node's TypeScript stripping).

```sh
npm ci
npm run dev
npm test
npm run build
npm run deploy:check
```

`npm run deploy` builds and publishes to the Cloudflare account you authenticate with. Production is deployed to `https://vowvel.com` and `https://www.vowvel.com`. Social sharing tags default to `SITE_URL=https://vowvel.com` during deploy; override with `SITE_URL=https://preview.example.com npm run deploy` for preview origins. The current `wrangler.jsonc` runs the API Worker before `/api/*` requests and serves the built frontend with SPA fallback. Fonts and compressed artwork are hosted locally.

## What works now

- Editorial storefront and five signature invitation designs: Conservatory, Gulmohar, After Hours, Sunday Edit, Azure.
- Original artwork per theme, responsive layouts, differing envelope openings, optional scratch erasure and keyboard/tap reveal.
- Wedding and engagement editor with live preview, undo, optional sections, up to eight ceremonies and six photos.
- Versioned local drafts, recoverable storage failures, JSON download and validated backup restoration.
- Guest schedule, maps, calendar download, countdown, photos/keepsakes, family/welcome/story, dress code, transport, accommodation, gift note and closing.
- Local-only sample RSVP with event choices, party size and editable response in the current view.
- Account-aware checkout with server-authored pricing, coupon validation and optional Razorpay order creation.

## Production status

The Worker, static assets, D1 database, R2 bucket, production schema, custom domains, OTP secret and Cloudflare Email Sending are provisioned. Admin OTP delivery to `amnasahmd@gmail.com` has been verified in production. Transactional messages are sent from `notifications@vowvel.com` with replies directed to `support@vowvel.com`; Cloudflare Email Routing forwards that address to the verified admin inbox. Live Razorpay API credentials are installed and validated; payment completion automation remains disabled until the production `payment.captured` webhook and its separate signing secret are configured in Razorpay. Cloud draft synchronization, real guest reply delivery, automatic post-payment publishing, invitation hostnames and music uploads are not connected. Times currently use India Standard Time, explicitly labeled in the editor and guest calendar/event controls.

₹2,499 is the user-approved Signature Collection launch price. Migration 0008 updates only the previous ₹1,499 base price, retaining taxes and historical order amounts. Final taxes, hosting duration, refund and rescheduling policies require confirmation before production Razorpay secrets are configured. ₹5,000 was a perceived-quality design target; no fake price discount or testimonials were added.

## Remaining production integration

See [integration plan](docs/cloudflare-integration.md). Secrets must stay on a Worker, never in the Vite client. The frontend can be deployed independently for review, but real checkout must remain unavailable until server verification and publication are connected.

## Design and assets

- [Five experience directions](docs/experience-plan.md)
- [Acceptance checklist](docs/acceptance-checklist.md)
- [Verification results](docs/verification.md)
- [Original image prompts](docs/art-prompts.md)
- [Video frame pair and production prompt](docs/video-production.md)
- Original PNGs: `assets/art/`; compressed frontend copies: `public/art/`.
- Video frames: `assets/video-frames/conservatory-first.png` and `conservatory-last.png`.
- Logo: `assets/brand/`; optimized wordmark: `public/wordmark.webp`.

All newly generated images used the built-in image-generation tool. The video frame pair is an optional production reference; no video was generated.

## Routes

- `/#/`: storefront
- `/#/preview/conservatory` (or `gulmohar`, `afterhours`, `sunday`, `azure`): full guest demo
- `/#/create/conservatory`: editor
- `/#/preview/draft`: saved local draft preview
- `/#/checkout`: account, coupon and Razorpay-aware checkout
- `/#/admin`: email-OTP protected operations console
- `/#/influencer/apply`: influencer collaboration application
- `/#/partner`: approved influencer dashboard

## Commerce and admin setup

The repository now includes a Cloudflare Worker API, D1 migrations, R2 storage, secure sessions, email OTP, transactional email, role enforcement, coupons, orders, Razorpay webhook handling, influencer commissions, payouts, refunds and audit history.

The admin console includes Owner, Admin, Finance and Support views. Owners control account roles and status; Admins manage coupons, partners and settings; Finance controls refunds and payouts; Support has read access to users and orders. High-risk actions require a reason and are audited.

```sh
npm run db:migrate:local
cp .dev.vars.example .dev.vars
npm run dev:full
```

Fill `.dev.vars` with local test credentials. Admin and partner login have no password field: the user enters their email, receives a six-digit code, and verifies it. The configured primary Owner email is `amnasahmd@gmail.com`; its first successful OTP verification creates or promotes the Owner account automatically.

For production, create the D1 database and R2 bucket referenced by `wrangler.jsonc`, apply `npm run db:migrate:remote`, and enter `OTP_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` interactively with `npx wrangler secret put SECRET_NAME`. Never commit live credentials. Set `EMAIL_FROM` to an address on a domain onboarded in Cloudflare Email Sending, and set `PUBLIC_APP_URL` to the final HTTPS origin if the webhook origin differs from the public site. Register the Razorpay webhook URL as `/api/webhooks/razorpay` and enable `payment.captured` delivery.

## International checkout (PayPal, $40 USD)

Guests outside India pay a flat **$40 USD** via PayPal. INR Razorpay checkout is unchanged. Coupons are not supported for PayPal orders yet, and PayPal orders carry no influencer commission.

```sh
printf '%s' '<your-paypal-client-id>' | npx wrangler secret put PAYPAL_CLIENT_ID
printf '%s' '<your-paypal-client-secret>' | npx wrangler secret put PAYPAL_CLIENT_SECRET
```

For local testing, copy the same values into `.dev.vars` (never commit that file). The checkout page shows an India / Outside-India switch; PayPal approval is captured server-side at `POST /api/paypal/capture`, which publishes the invitation and queues the confirmation email. Optionally register the webhook URL `/api/webhooks/paypal` for `PAYMENT.CAPTURE.COMPLETED` in the PayPal dashboard, then store its webhook id with `npx wrangler secret put PAYPAL_WEBHOOK_ID` — the webhook is a backup confirmation path; approve-and-capture works without it. Admin refunds support PayPal captures as well as Razorpay payments.

Cloudflare Email Sending must be enabled for the sender domain before OTP or transactional messages can be delivered. Purchase confirmation includes the durable invitation link. A verified creator coupon redemption queues a privacy-safe creator notification and both message types retry automatically from the email outbox.

The local Vite-only command (`npm run dev`) does not run `/api/*`; use `npm run dev:full` when exercising accounts, checkout or admin features. Apply D1 migrations remotely before the first production deployment.

Drafts and sample replies live in the current browser only; clearing browser storage removes them. Use the draft backup/restore controls. Do not collect real guest responses on this prototype.
