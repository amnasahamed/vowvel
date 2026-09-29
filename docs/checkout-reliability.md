# Checkout reliability patch

Scope: the four repository-backed purchase issues reviewed on 29 September 2026.
No price changes, migrations, secret changes, refunds, or production payments are part of this patch.

## Changes

- Resolve published 3–7 character custom addresses to their existing canonical invitation ID before delegating invitation loading and RSVP submission. Existing longer addresses and canonical IDs keep their original routes.
- Add an authenticated checkout lookup and an order-resumption compatibility layer. An owner can recover the same order, provider order ID, invitation snapshot and amount after closing payment or refreshing. Another customer's reservation never exposes private data.
- Preserve `update` identity through theme changes, Undo, full-screen preview and return navigation. Paid editing says “Save changes” and retains the existing update endpoint.
- Fetch checkout prices from the server with no hard-coded amount fallback. Recovered orders use their stored quote. If the returned order price or invitation differs from the displayed one, show it for review before opening a payment provider.
- Provide an explicit India/international payment selector for new checkouts. A pending order keeps its original provider and price.
- Check provider state read-only before retrying. Pending/authorised/captured payments block another payment while publishing confirmation is pending. Unknown provider state fails closed. PayPal approval is captured only after the customer's explicit resume action through the existing capture route.
- Remove unverified “you have not been charged” cancellation messages. Keep a check-status action and bounded confirmation polling.

## Architecture

`worker/entry.ts` composes the existing application with `checkout-reliability.ts` and the read-only provider checker. Wrangler points at this entry. The original `worker/index.ts`, payment capture/signature verification, webhooks, refunds, email delivery and scheduled maintenance are unchanged. No dependency was added.

The compatibility layer delegates authentication to the existing `/api/auth/me` implementation. Resume writes require the existing session's CSRF token and same-origin check. Status checks are rate limited. Legacy response fields are retained for older browser tabs.

A pending checkout's content and price are deliberately immutable here. The UI identifies the recovered snapshot; it does not overwrite a newer local draft. A paid invitation can subsequently be edited through the existing editor. Reservations are not deleted merely because a payment window closes.

## Tests

Run with Node supporting TypeScript stripping:

```sh
node --experimental-strip-types --test tests/checkout-reliability.test.mjs tests/payment-status.test.mjs
npm test
npm run build
npm run deploy:check
```

The two new test files contain 52 targeted tests. They cover short-address loading and RSVP forwarding, retries and simultaneous requests, paid/refunded/pending orders, owner isolation, origin/CSRF checks, immutable quotes and snapshots, provider status classification, and paid-edit navigation. D1, R2 and provider HTTP responses are mocked; no real transaction is made by the tests.

Local verification for this patch: 52 targeted tests passed and changed TS/TSX files passed TypeScript syntax/transpilation checks. A complete dependency-installed application build and live browser/provider sandbox smoke test were not run in the editing environment. Run the complete commands above before merging/deploying.

## Required staging checks

1. Publish addresses with 3, 7, 8 and 40 characters. Open each custom-domain invitation and submit an RSVP.
2. Create a Razorpay test order, close payment, retry and refresh. Confirm that the address, local order ID and provider order ID stay the same.
3. Repeat with PayPal sandbox, including an already-approved order and delayed capture confirmation.
4. Complete payment, refresh, and verify that the existing link is returned without another payment.
5. Change server pricing while checkout is open. Verify that the new amount is displayed and requires another confirmation before the gateway opens.
6. Reopen a paid invitation; switch design, Undo, preview, return, refresh, save. Confirm the same invitation ID/link and no checkout step.
7. Check short links and checkout on mobile Safari and an in-app browser. Confirm production provider/webhook settings independently.

## Deliberate boundaries

This patch does not change timezone handling, typography, template galleries, marketing claims, hosting policies or the rest of the visual audit. It also does not redesign existing capture/refund logic or automatically reconcile captured provider money into database records. If provider payment is complete but publishing confirmation never reaches Vowvel, the UI blocks another payment and directs the customer to support. Expired/voided or incompletely configured provider orders remain blocked for support rather than being silently replaced.

## Rollback

Revert the patch as one commit, including `wrangler.jsonc`. There are no schema or data migrations to reverse. Do not independently revert only the frontend or entrypoint because the new checkout UI expects the lookup/resumption contract.
