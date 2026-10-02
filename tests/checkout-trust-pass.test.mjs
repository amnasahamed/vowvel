import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const checkoutSource = await readFile(new URL('../src/Checkout.tsx', import.meta.url), 'utf8');
const analyticsSource = await readFile(new URL('../src/analytics.ts', import.meta.url), 'utf8');
const workerFunnelSource = await readFile(new URL('../worker/funnel.ts', import.meta.url), 'utf8');
const trustCssSource = await readFile(new URL('../src/checkout-trust-pass.css', import.meta.url), 'utf8');

test('Checkout.tsx splits the CTA disabled prop to busy and PayPal approval only', () => {
  assert.doesNotMatch(
    checkoutSource,
    /disabled=\{busy\|\!user\|\|\s*availability!=='available'\|\|paypalApproval!==null\}/,
    'the combined disabled expression must be removed',
  );
  assert.match(
    checkoutSource,
    /disabled=\{busy\|\|paypalApproval!==null\}/,
    'the new disabled expression must be busy||paypalApproval!==null',
  );
});

test('Checkout.tsx renders the trust strip with Secure payment, 30-day draft, and a Refundable link to #faq-refunds', () => {
  assert.match(checkoutSource, /data-testid="checkout-trust-strip"/);
  assert.match(checkoutSource, /Secure payment/i);
  assert.match(checkoutSource, /30-day draft/i);
  assert.match(checkoutSource, /Refundable/i);
  assert.match(checkoutSource, /href="#faq-refunds"/);
});

test('Checkout.tsx renders the postpay preview with three steps mentioning vowvel.com, email, and Share', () => {
  assert.match(checkoutSource, /data-testid="checkout-postpay-preview"/);
  const previewBlock = checkoutSource.match(/data-testid="checkout-postpay-preview"[\s\S]*?<\/ol>/);
  assert.ok(previewBlock, 'postpay preview <ol> block should be present');
  const block = previewBlock[0];
  const lineItems = block.match(/<li>[\s\S]*?<\/li>/g) || [];
  assert.equal(lineItems.length, 3, 'preview should have three <li> items');
  const text = lineItems.map(item => item.replace(/<[^>]+>/g, ' ')).join(' ').replace(/\s+/g, ' ');
  assert.match(text, /vowvel\.com/, 'line 1 should mention vowvel.com');
  assert.match(text, /email/i, 'line 2 should mention email');
  assert.match(text, /Share/i, 'line 3 should mention Share');
  assert.match(
    checkoutSource,
    /\{\(subdomain\|\|'your-names'\)\}\.vowvel\.com/,
    'subdomain should be interpolated with the empty-state fallback',
  );
});

test('placeOrder guards the CTA tap and tracks checkout_cta_blocked_help_shown without calling /api/orders', () => {
  const placeOrderStart = checkoutSource.indexOf('async function placeOrder()');
  assert.ok(placeOrderStart >= 0, 'placeOrder should exist');
  const guardEnd = checkoutSource.indexOf('setCtaHelp(null);', placeOrderStart);
  assert.ok(guardEnd > placeOrderStart, 'setCtaHelp(null) should follow the guard');
  const guardedSlice = checkoutSource.slice(placeOrderStart, guardEnd);
  assert.match(guardedSlice, /if\(!user\|\|availability!=='available'\)/, 'placeOrder must guard against both blocked states');
  assert.doesNotMatch(guardedSlice, /\/api\/orders/, 'the blocked-state branch must not POST /api/orders');
  assert.match(guardedSlice, /checkout_cta_blocked_help_shown/);
  assert.match(guardedSlice, /reason:'no_email'/);
  assert.match(guardedSlice, /reason:'subdomain_unavailable'/);
});

test('Checkout.tsx renders the no_email help message with "email first"', () => {
  assert.match(checkoutSource, /Enter your email first/);
  assert.match(checkoutSource, /sign-in code/);
  assert.match(checkoutSource, /data-testid="checkout-cta-help"/);
});

test('Checkout.tsx renders the subdomain_unavailable help message with "available invitation address"', () => {
  assert.match(checkoutSource, /Pick an available invitation address first/);
  assert.match(checkoutSource, /your guests will open it there/);
});

test('checkout_cta_blocked_help_shown is in FUNNEL_EVENTS in both client and server lists', () => {
  assert.match(analyticsSource, /'checkout_cta_blocked_help_shown'/);
  assert.match(workerFunnelSource, /'checkout_cta_blocked_help_shown'/);
});

test('checkout-trust-pass.css contains the trust strip, help, and shake classes', () => {
  assert.match(trustCssSource, /\.checkout-trust-strip/);
  assert.match(trustCssSource, /\.checkout-trust-chip/);
  assert.match(trustCssSource, /\.checkout-trust-link/);
  assert.match(trustCssSource, /\.checkout-cta-help/);
  assert.match(trustCssSource, /\.checkout-postpay-preview/);
  assert.match(trustCssSource, /\.checkout-postpay-num/);
  assert.match(trustCssSource, /\.shake/);
  assert.match(trustCssSource, /@keyframes checkout-shake/);
});

test('checkout-trust-pass wraps CustomerOtpAuth in a ref so the email input can be scrolled into view', () => {
  const block = checkoutSource.match(/<div ref=\{otpRef\}>[\s\S]*?<CustomerOtpAuth[\s\S]*?<\/div>/);
  assert.ok(block, 'CustomerOtpAuth must be wrapped in <div ref={otpRef}>');
});

test('checkout-trust-pass wraps the subdomain field in a ref so the subdomain input can be scrolled into view', () => {
  const block = checkoutSource.match(/<div ref=\{subdomainRef\}>[\s\S]*?subdomain-field[\s\S]*?<\/div>/);
  assert.ok(block, 'subdomain-field must be wrapped in <div ref={subdomainRef}>');
});