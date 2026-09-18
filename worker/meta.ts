export interface MetaRuntime {
  META_ACCESS_TOKEN?: string;
  META_DATASET_ID?: string;
  PUBLIC_APP_URL?: string;
}

export interface MetaEventInput {
  eventName: 'Purchase' | 'InitiateCheckout';
  /** Stable deduplication id, e.g. `order:<id>:purchase`. */
  eventId: string;
  email: string;
  name: string;
  userAgent: string;
  eventSourceUrl: string;
  valueCents: number;
  currency: string;
  contentIds: string[];
  orderId: string;
}

const encoder = new TextEncoder();

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value.trim().toLowerCase()));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Split "First Middle Last" into Meta fn/ln fields. */
export function splitName(name: string): { fn: string; ln: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { fn: parts[0] || '', ln: parts.slice(1).join(' ') };
}

/** Convert integer minor units to Meta decimal value, e.g. 249900 INR -> 2499. */
export function toMetaValue(cents: number): number {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new Error('Invalid Meta event value');
  return Math.round(cents) / 100;
}

export function metaConfigured(env: MetaRuntime): boolean {
  return Boolean(env.META_ACCESS_TOKEN?.trim() && env.META_DATASET_ID?.trim());
}

export async function buildMetaPayload(input: MetaEventInput): Promise<Record<string, unknown>> {
  if (!input.eventId || !input.orderId) throw new Error('Meta event requires event and order ids');
  if (!input.contentIds.length) throw new Error('Meta event requires content ids');
  const userData: Record<string, unknown> = { client_user_agent: input.userAgent || undefined };
  if (input.email.trim()) userData.em = [await sha256Hex(input.email)];
  const { fn, ln } = splitName(input.name);
  if (fn) userData.fn = [await sha256Hex(fn)];
  if (ln) userData.ln = [await sha256Hex(ln)];
  return {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: 'website',
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        custom_data: {
          value: toMetaValue(input.valueCents),
          currency: input.currency,
          content_ids: input.contentIds,
          content_type: 'product',
          order_id: input.orderId,
        },
      },
    ],
  };
}

/**
 * Send one Conversions API event. Never throws: tracking must not break
 * checkout, so failures are logged and swallowed by the caller via waitUntil.
 */
export async function sendMetaEvent(env: MetaRuntime, input: MetaEventInput): Promise<boolean> {
  if (!metaConfigured(env)) return false;
  const datasetId = env.META_DATASET_ID!.trim();
  if (!/^\d+$/.test(datasetId)) {
    console.error(JSON.stringify({ level: 'error', task: 'meta_event', message: 'Invalid Meta dataset id' }));
    return false;
  }
  const payload = await buildMetaPayload(input);
  const response = await fetch(
    `https://graph.facebook.com/v19.0/${datasetId}/events?access_token=${encodeURIComponent(env.META_ACCESS_TOKEN!.trim())}`,
    { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) },
  );
  const raw = await response.arrayBuffer();
  if (!response.ok) {
    console.error(
      JSON.stringify({
        level: 'error',
        task: 'meta_event',
        event: input.eventName,
        status: response.status,
        message: new TextDecoder().decode(raw).slice(0, 300),
      }),
    );
    return false;
  }
  return true;
}
