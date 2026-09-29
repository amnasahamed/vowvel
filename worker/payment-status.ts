import {paypalAccessToken, paypalApiBase, type PayPalRuntime} from './paypal.ts';
import type {OrderRow} from './checkout-reliability.ts';
import type {PaymentState} from '../shared/checkout.ts';

type Env = PayPalRuntime & {RAZORPAY_KEY_ID?: string; RAZORPAY_KEY_SECRET?: string};
/** Read-only checks. Only the existing authenticated capture/webhook routes publish orders. */
export async function readPaymentStatus(env: Env, order: OrderRow): Promise<PaymentState> {
  if (!order.provider_order_id) return 'unavailable';
  const method = order.provider || (JSON.parse(order.price_snapshot_json) as {provider?: string}).provider;
  if (method === 'razorpay') {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return 'unavailable';
    const response = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(order.provider_order_id)}`, {
      headers: {authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`},
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return 'unavailable';
    const value = await response.json() as {id?: string; amount?: number; currency?: string; status?: string};
    if (value.id !== order.provider_order_id || value.amount !== order.total_cents || value.currency !== order.currency)
      return 'unavailable';
    if (value.status === 'paid') return 'confirming';
    if (!['created','attempted'].includes(value.status || '')) return 'unavailable';
    // An attempted order can already contain an authorised or still-pending payment.
    const paymentsResponse = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(order.provider_order_id)}/payments`, {
      headers: {authorization: `Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`},
      signal: AbortSignal.timeout(10_000),
    });
    if (!paymentsResponse.ok) return 'unavailable';
    const payments = await paymentsResponse.json() as {items?: Array<{order_id?: string; status?: string}>};
    if (!Array.isArray(payments.items) || payments.items.some(item => item.order_id !== order.provider_order_id)) return 'unavailable';
    if (payments.items.some(item => ['created','pending','authorized','captured'].includes(item.status || ''))) return 'confirming';
    return payments.items.every(item => ['failed','refunded'].includes(item.status || '')) ? 'ready' : 'unavailable';
  }
  if (method === 'paypal') {
    const token = await paypalAccessToken(env);
    const response = await fetch(`${paypalApiBase(env)}/v2/checkout/orders/${encodeURIComponent(order.provider_order_id)}`, {
      headers: {authorization: `Bearer ${token}`}, signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return 'unavailable';
    const value = await response.json() as {id?: string; status?: string;
      purchase_units?: Array<{amount?: {value?: string; currency_code?: string}; payments?: {captures?: Array<{status?: string}>}}>};
    const units = value.purchase_units;
    if (value.id !== order.provider_order_id || !units || units.length !== 1 ||
      units[0].amount?.currency_code !== order.currency ||
      units[0].amount?.value !== (order.total_cents / 100).toFixed(2)) return 'unavailable';
    if (value.status === 'COMPLETED' || units[0].payments?.captures?.some(capture => ['COMPLETED','PENDING'].includes(capture.status || ''))) return 'confirming';
    if (value.status === 'APPROVED') return 'approved';
    if (value.status === 'VOIDED') return 'blocked';
    return ['CREATED','SAVED','PAYER_ACTION_REQUIRED'].includes(value.status || '') ? 'ready' : 'unavailable';
  }
  return 'unavailable';
}
