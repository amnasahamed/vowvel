import {validAddress, validQuote, type CheckoutSession, type PaymentState} from '../shared/checkout.ts';

export interface CheckoutEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  RAZORPAY_KEY_ID?: string;
  PAYPAL_CLIENT_ID?: string;
}
type Next = (request: Request) => Promise<Response>;
export interface OrderRow {
  id: string; user_id: string; invitation_id: string; state: string;
  invitation_state: string; custom_subdomain: string; provider: string | null;
  provider_order_id: string | null; provider_payment_id: string | null;
  subtotal_cents: number; discount_cents: number; tax_cents: number;
  total_cents: number; currency: string; price_snapshot_json: string;
  data_json: string;
}
export type StatusReader = (order: OrderRow) => Promise<PaymentState>;
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: {'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff'},
});
class CheckoutError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
function internalGet(request: Request, path: string): Request {
  const url = new URL(request.url); url.pathname = path; url.search = '';
  const headers = new Headers(request.headers);
  headers.delete('content-length'); headers.delete('content-type');
  return new Request(url, {method: 'GET', headers});
}
async function customer(request: Request, next: Next): Promise<{id: string; csrfToken: string}> {
  const response = await next(internalGet(request, '/api/auth/me'));
  if (!response.ok) throw new CheckoutError(503, 'Sign-in could not be checked. Please try again.');
  const {user} = await response.json() as {user?: {id: string; role: string; csrfToken: string} | null};
  if (!user) throw new CheckoutError(401, 'Sign in to continue your checkout.');
  if (user.role !== 'customer') throw new CheckoutError(403, 'Use your customer account to publish an invitation.');
  return user;
}
function sameToken(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
async function limitedBody(request: Request): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = []; let length = 0;
  if (reader) for (;;) {
    const {value, done} = await reader.read(); if (done) break;
    length += value.length;
    if (length > 15_000_000) { await reader.cancel(); throw new CheckoutError(413, 'Invitation is too large.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new CheckoutError(400, 'Invalid checkout request.'); }
}
async function ownedOrder(env: CheckoutEnv, address: string, userId: string) {
  const invitation = await env.DB.prepare('SELECT id,owner_id FROM invitations WHERE custom_subdomain=?')
    .bind(address).first<{id: string; owner_id: string}>();
  if (!invitation) return {available: true, order: null};
  if (invitation.owner_id !== userId) return {available: false, order: null};
  const order = await env.DB.prepare(`SELECT o.id,o.user_id,o.invitation_id,o.state,
    o.provider_order_id,o.provider_payment_id,o.subtotal_cents,o.discount_cents,o.tax_cents,
    o.total_cents,o.currency,o.price_snapshot_json,p.provider,i.state invitation_state,
    i.custom_subdomain,r.data_json FROM orders o
    JOIN invitations i ON i.id=o.invitation_id
    JOIN invitation_revisions r ON r.id=i.published_revision_id
    LEFT JOIN payments p ON p.order_id=o.id
    WHERE o.invitation_id=? AND o.user_id=? ORDER BY o.created_at DESC LIMIT 1`)
    .bind(invitation.id, userId).first<OrderRow>();
  return {available: false, order};
}
async function sessionFor(env: CheckoutEnv, order: OrderRow, resumed: boolean,
  readStatus?: StatusReader): Promise<CheckoutSession> {
  const snapshot = JSON.parse(order.price_snapshot_json) as {provider?: string};
  const method = order.provider || snapshot.provider;
  if (method !== 'razorpay' && method !== 'paypal') throw new CheckoutError(409, 'This checkout needs support before it can be resumed.');
  let paymentState: PaymentState = 'blocked';
  if (order.state === 'paid') paymentState = order.invitation_state === 'published' ? 'paid' : 'confirming';
  else if (order.state === 'awaiting_payment') {
    paymentState = order.provider_payment_id ? 'confirming' : order.provider_order_id ? 'ready' : 'unavailable';
    if (readStatus && order.provider_order_id && !order.provider_payment_id) {
      try { paymentState = await readStatus(order); } catch { paymentState = 'unavailable'; }
    }
  }
  const metadata = JSON.parse(order.data_json) as {r2Key?: string};
  const object = metadata.r2Key ? await env.MEDIA.get(metadata.r2Key) : null;
  if (!object) throw new CheckoutError(503, 'The saved invitation could not be loaded. Please contact support before paying.');
  const session: CheckoutSession = {
    id: order.id, invitationId: order.invitation_id, address: order.custom_subdomain,
    method, providerOrderId: order.provider_order_id,
    checkoutKey: method === 'razorpay' ? env.RAZORPAY_KEY_ID || null : null,
    paypalClientId: method === 'paypal' ? env.PAYPAL_CLIENT_ID || null : null,
    invitationUrl: `https://${order.custom_subdomain}.vowvel.com`,
    invitation: await object.json(), paymentState, resumed,
    subtotalCents: order.subtotal_cents, discountCents: order.discount_cents,
    taxCents: order.tax_cents, totalCents: order.total_cents, currency: order.currency,
  };
  if (!validQuote(session)) throw new CheckoutError(503, 'The order total could not be verified. Please contact support.');
  return session;
}
function orderResponse(checkout: CheckoutSession, status = 200): Response {
  // Keep legacy response fields for tabs running the previous frontend version.
  const {invitation, ...order} = checkout;
  return json({checkout, order,
    paymentConfigured: ['ready','approved'].includes(checkout.paymentState),
    complimentary: checkout.paymentState === 'paid',
    provider: checkout.method}, status);
}
async function limitStatusChecks(env: CheckoutEnv, userId: string): Promise<void> {
  const bucket = Math.floor(Date.now() / 60_000) * 60;
  const key = `checkout-status:${userId}`;
  await env.DB.prepare(`INSERT INTO rate_limits(key,bucket_start,request_count) VALUES(?,?,1)
    ON CONFLICT(key,bucket_start) DO UPDATE SET request_count=request_count+1`).bind(key, bucket).run();
  const row = await env.DB.prepare('SELECT request_count FROM rate_limits WHERE key=? AND bucket_start=?')
    .bind(key, bucket).first<{request_count: number}>();
  if ((row?.request_count || 0) > 30) throw new CheckoutError(429, 'Please wait a moment before checking payment again.');
}

/** Compatibility layer: delegates auth, initial order creation, capture and webhooks unchanged. */
export async function checkoutReliability(request: Request, env: CheckoutEnv, next: Next,
  readStatus?: StatusReader): Promise<Response> {
  const url = new URL(request.url);
  try {
    // Existing canonical IDs are 8+ characters; resolve only the previously rejected 3–7 aliases.
    const alias = url.pathname.match(/^\/api\/invitations\/([a-z0-9-]{3,7})(\/rsvp)?$/);
    if (alias && validAddress(alias[1]) &&
      ((!alias[2] && request.method === 'GET') || (alias[2] && request.method === 'POST'))) {
      const row = await env.DB.prepare("SELECT slug FROM invitations WHERE custom_subdomain=? AND state='published'")
        .bind(alias[1]).first<{slug: string}>();
      if (!row) return json({error: 'Invitation not found', code: 'not_found'}, 404);
      url.pathname = `/api/invitations/${encodeURIComponent(row.slug)}${alias[2] || ''}`;
      return next(new Request(url, request));
    }
    const lookup = url.pathname === '/api/checkout/lookup' && request.method === 'GET';
    const placing = url.pathname === '/api/orders' && request.method === 'POST';
    if (!lookup && !placing) return next(request);
    const user = await customer(request, next);
    if (placing) {
      const origin = request.headers.get('origin');
      if (origin && origin !== url.origin) throw new CheckoutError(403, 'Cross-origin request rejected.');
      if (!sameToken(request.headers.get('x-csrf-token') || '', user.csrfToken))
        throw new CheckoutError(403, 'Your sign-in has expired. Sign in again before paying.');
    }
    const body = placing ? await limitedBody(request.clone()) : null;
    const address = placing ? body?.subdomain : url.searchParams.get('address');
    if (typeof address !== 'string' || !validAddress(address))
      throw new CheckoutError(400, 'Choose 3–40 letters, numbers or hyphens, including a letter.');
    const existing = await ownedOrder(env, address, user.id);
    if (lookup) {
      if (!existing.order) return json({available: existing.available, checkout: null});
      const checkProvider = url.searchParams.get('check') === '1';
      if (checkProvider) await limitStatusChecks(env, user.id);
      return json({available: false, checkout: await sessionFor(env, existing.order, true, checkProvider ? readStatus : undefined)});
    }
    if (existing.order) {
      await limitStatusChecks(env, user.id);
      // Never overwrite a pending order's price, provider or invitation snapshot on retry.
      // The frontend explicitly reviews the recovered snapshot before resuming.
      return orderResponse(await sessionFor(env, existing.order, true, readStatus));
    }
    if (!existing.available) throw new CheckoutError(409, 'That invitation address is unavailable. Choose another address.');
    const response = await next(request);
    // Also recover a simultaneous first request that won the unique-address constraint.
    if (response.ok || response.status === 409 || response.status >= 500) {
      const saved = await ownedOrder(env, address, user.id);
      if (saved.order) return orderResponse(await sessionFor(env, saved.order, !response.ok, response.ok ? undefined : readStatus), response.ok ? response.status : 200);
    }
    return response;
  } catch (error) {
    const known = error instanceof CheckoutError;
    return json({code: 'checkout_unavailable', error: known ? error.message :
      'Checkout could not be checked. Please try again; do not repeat a payment already made.'}, known ? error.status : 503);
  }
}
