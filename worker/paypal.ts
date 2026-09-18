export const PAYPAL_LIVE_API_BASE = 'https://api-m.paypal.com';
export const PAYPAL_CURRENCY = 'USD';
/** Flat international invitation price: $40.00, expressed in cents. */
export const PAYPAL_PRICE_CENTS = 4000;

export interface PayPalRuntime {
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_WEBHOOK_ID?: string;
  PAYPAL_API_BASE?: string;
}

export function paypalApiBase(env: PayPalRuntime): string {
  const base = (env.PAYPAL_API_BASE || PAYPAL_LIVE_API_BASE).trim().replace(/\/$/, '');
  if (!/^https:\/\/[A-Za-z0-9.-]+$/.test(base)) throw new Error('Invalid PayPal API base');
  return base;
}

export function requirePayPalCredentials(env: PayPalRuntime): { clientId: string; clientSecret: string } {
  const clientId = env.PAYPAL_CLIENT_ID?.trim() || '';
  const clientSecret = env.PAYPAL_CLIENT_SECRET?.trim() || '';
  if (!clientId || !clientSecret) throw new Error('PayPal credentials are not configured');
  return { clientId, clientSecret };
}

/** Convert integer minor units to a PayPal decimal string, e.g. 4000 -> "40.00". */
export function toPayPalValue(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Invalid PayPal amount');
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}

/** Parse a PayPal decimal string back to integer minor units, e.g. "40.00" -> 4000. */
export function fromPayPalValue(value: string): number {
  if (!/^\d+\.\d{2}$/.test(value)) throw new Error('Invalid PayPal amount value');
  const [whole, fraction] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction);
  if (!Number.isSafeInteger(cents) || cents <= 0) throw new Error('Invalid PayPal amount value');
  return cents;
}

async function readPayPalJson(response: Response, limit = 256_000): Promise<Record<string, unknown>> {
  const raw = await response.arrayBuffer();
  if (raw.byteLength > limit) throw new Error('PayPal response exceeded limit');
  const value: unknown = JSON.parse(new TextDecoder().decode(raw));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid PayPal response');
  return value as Record<string, unknown>;
}

function payPalError(response: Response, body: Record<string, unknown>): Error {
  const details = body.details;
  const first = Array.isArray(details) && details.length > 0 ? (details[0] as Record<string, unknown>) : null;
  const message =
    (typeof body.message === 'string' && body.message) ||
    (first && typeof first.description === 'string' ? first.description : '') ||
    `PayPal request failed (${response.status})`;
  return new Error(message.slice(0, 300));
}

let cachedToken = '';
let cachedTokenExpiresAt = 0;

export async function paypalAccessToken(env: PayPalRuntime): Promise<string> {
  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) return cachedToken;
  const { clientId, clientSecret } = requirePayPalCredentials(env);
  const response = await fetch(`${paypalApiBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const body = await readPayPalJson(response);
  if (!response.ok || typeof body.access_token !== 'string' || !body.access_token) throw payPalError(response, body);
  cachedToken = body.access_token;
  const ttl = typeof body.expires_in === 'number' ? body.expires_in : 3600;
  cachedTokenExpiresAt = Date.now() + Math.max(60, ttl) * 1000;
  return cachedToken;
}

export interface PayPalOrder {
  id: string;
  status: string;
}

export async function createPayPalOrder(
  env: PayPalRuntime,
  orderRef: string,
  amountCents: number,
): Promise<PayPalOrder> {
  const token = await paypalAccessToken(env);
  const response = await fetch(`${paypalApiBase(env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderRef,
          description: 'Vowvel Bespoke Invitation License',
          amount: { currency_code: PAYPAL_CURRENCY, value: toPayPalValue(amountCents) },
        },
      ],
    }),
  });
  const body = await readPayPalJson(response);
  if (!response.ok || typeof body.id !== 'string' || !body.id) throw payPalError(response, body);
  return { id: body.id, status: typeof body.status === 'string' ? body.status : '' };
}

export interface PayPalCapture {
  orderId: string;
  captureId: string;
  status: string;
  amountCents: number;
  currency: string;
}

function firstCapture(payload: Record<string, unknown>): Record<string, unknown> | null {
  const units = payload.purchase_units;
  if (!Array.isArray(units) || units.length === 0) return null;
  const payments = (units[0] as Record<string, unknown>).payments as Record<string, unknown> | undefined;
  const captures = payments?.captures;
  if (!Array.isArray(captures) || captures.length === 0) return null;
  const capture = captures[0];
  return capture && typeof capture === 'object' && !Array.isArray(capture)
    ? (capture as Record<string, unknown>)
    : null;
}

export async function capturePayPalOrder(env: PayPalRuntime, paypalOrderId: string): Promise<PayPalCapture> {
  if (!paypalOrderId || paypalOrderId.length > 120) throw new Error('Invalid PayPal order id');
  const token = await paypalAccessToken(env);
  const response = await fetch(
    `${paypalApiBase(env)}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: '{}' },
  );
  const body = await readPayPalJson(response);
  if (!response.ok) throw payPalError(response, body);
  const capture = firstCapture(body);
  const amount = capture?.amount as Record<string, unknown> | undefined;
  if (
    !capture ||
    typeof capture.id !== 'string' ||
    typeof amount?.value !== 'string' ||
    amount.currency_code !== PAYPAL_CURRENCY
  ) {
    throw new Error('PayPal capture is missing payment details');
  }
  return {
    orderId: typeof body.id === 'string' ? body.id : paypalOrderId,
    captureId: capture.id,
    status: typeof capture.status === 'string' ? capture.status : '',
    amountCents: fromPayPalValue(amount.value),
    currency: PAYPAL_CURRENCY,
  };
}

export interface PayPalWebhookVerification {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
}

export async function verifyPayPalWebhook(
  env: PayPalRuntime,
  verification: PayPalWebhookVerification,
  eventBody: unknown,
): Promise<boolean> {
  const webhookId = env.PAYPAL_WEBHOOK_ID?.trim() || '';
  if (!webhookId) return false;
  if (
    !verification.transmissionId ||
    !verification.transmissionTime ||
    !verification.certUrl ||
    !verification.authAlgo ||
    !verification.transmissionSig
  ) {
    return false;
  }
  const token = await paypalAccessToken(env);
  const response = await fetch(`${paypalApiBase(env)}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      transmission_id: verification.transmissionId,
      transmission_time: verification.transmissionTime,
      cert_url: verification.certUrl,
      auth_algo: verification.authAlgo,
      transmission_sig: verification.transmissionSig,
      webhook_id: webhookId,
      webhook_event: eventBody,
    }),
  });
  const body = await readPayPalJson(response);
  if (!response.ok) throw payPalError(response, body);
  return body.verification_status === 'SUCCESS';
}

/** Extract the PayPal order id and capture details from a PAYMENT.CAPTURE.COMPLETED event. */
export function parsePayPalCaptureEvent(event: unknown): {
  eventId: string;
  paypalOrderId: string;
  captureId: string;
  amountCents: number;
} | null {
  if (!event || typeof event !== 'object' || Array.isArray(event)) return null;
  const body = event as Record<string, unknown>;
  const eventId = typeof body.id === 'string' ? body.id : '';
  const resource = body.resource;
  if (!eventId || !resource || typeof resource !== 'object' || Array.isArray(resource)) return null;
  const capture = resource as Record<string, unknown>;
  const captureId = typeof capture.id === 'string' ? capture.id : '';
  const supplementary = capture.supplementary_data as Record<string, unknown> | undefined;
  const related = supplementary?.related_ids as Record<string, unknown> | undefined;
  const paypalOrderId = typeof related?.order_id === 'string' ? (related.order_id as string) : '';
  const amount = capture.amount as Record<string, unknown> | undefined;
  if (!captureId || !paypalOrderId || typeof amount?.value !== 'string' || amount.currency_code !== PAYPAL_CURRENCY) {
    return null;
  }
  return { eventId, paypalOrderId, captureId, amountCents: fromPayPalValue(amount.value) };
}

export async function refundPayPalCapture(
  env: PayPalRuntime,
  captureId: string,
  amountCents: number,
): Promise<{ id: string; status: string }> {
  if (!captureId || captureId.length > 120) throw new Error('Invalid PayPal capture id');
  const token = await paypalAccessToken(env);
  const response = await fetch(`${paypalApiBase(env)}/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      amount: { value: toPayPalValue(amountCents), currency_code: PAYPAL_CURRENCY },
    }),
  });
  const body = await readPayPalJson(response);
  if (!response.ok || typeof body.id !== 'string' || !body.id) throw payPalError(response, body);
  return { id: body.id, status: typeof body.status === 'string' ? body.status : '' };
}
