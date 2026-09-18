import test from 'node:test';
import assert from 'node:assert/strict';
import {PAYMENT_UNAVAILABLE,buyerSafePaymentMessage} from '../src/checkoutCopy.ts';

test('buyer payment copy never mentions secrets or provider config',()=>{
  assert.match(PAYMENT_UNAVAILABLE,/support@vowvel\.com/);
  assert.doesNotMatch(PAYMENT_UNAVAILABLE,/Razorpay|PayPal|secret|configured/i);
  assert.equal(buyerSafePaymentMessage('Add Razorpay secrets to enable payment.'),PAYMENT_UNAVAILABLE);
  assert.equal(buyerSafePaymentMessage('PayPal is not configured yet.'),PAYMENT_UNAVAILABLE);
  assert.equal(buyerSafePaymentMessage('Razorpay secret is not configured'),PAYMENT_UNAVAILABLE);
  assert.equal(buyerSafePaymentMessage('OTP_SECRET is not configured'),PAYMENT_UNAVAILABLE);
  assert.equal(buyerSafePaymentMessage('Payment was cancelled. You have not been charged.'),'Payment was cancelled. You have not been charged.');
});
