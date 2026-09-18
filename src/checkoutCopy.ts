export const PAYMENT_UNAVAILABLE = 'Payment is temporarily unavailable. Email support@vowvel.com and we’ll help you publish.';

export function buyerSafePaymentMessage(message: string): string {
  if (/secret|not configured|KEY_ID|KEY_SECRET|OTP_SECRET|Razorpay/i.test(message)) {
    return PAYMENT_UNAVAILABLE;
  }
  return message;
}
