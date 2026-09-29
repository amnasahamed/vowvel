export type PaymentMethod = 'razorpay' | 'paypal';
export interface CheckoutQuote {
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
}
export type PaymentState = 'ready' | 'approved' | 'confirming' | 'paid' | 'blocked' | 'unavailable';
export interface CheckoutSession extends CheckoutQuote {
  id: string;
  invitationId: string;
  address: string;
  method: PaymentMethod;
  providerOrderId: string | null;
  checkoutKey: string | null;
  paypalClientId: string | null;
  invitationUrl: string;
  invitation: unknown;
  paymentState: PaymentState;
  resumed: boolean;
}
export interface CheckoutLookup { available: boolean; checkout: CheckoutSession | null }

export function cleanAddress(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '').slice(0, 40);
}
export function validAddress(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(value) && /[a-z]/.test(value);
}
export function sameQuote(a: CheckoutQuote | null, b: CheckoutQuote): boolean {
  return !!a && a.currency === b.currency &&
    a.subtotalCents === b.subtotalCents && a.discountCents === b.discountCents &&
    a.taxCents === b.taxCents && a.totalCents === b.totalCents;
}
export function validQuote(value: CheckoutQuote): boolean {
  return /^[A-Z]{3}$/.test(value.currency) &&
    [value.subtotalCents, value.discountCents, value.taxCents, value.totalCents]
      .every(amount => Number.isSafeInteger(amount) && amount >= 0) &&
    value.discountCents <= value.subtotalCents &&
    value.subtotalCents - value.discountCents + value.taxCents === value.totalCents;
}
