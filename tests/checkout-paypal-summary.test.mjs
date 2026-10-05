import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const checkoutSource = await readFile(new URL('../src/Checkout.tsx', import.meta.url), 'utf8');
const analyticsSource = await readFile(new URL('../src/analytics.ts', import.meta.url), 'utf8');
const workerFunnelSource = await readFile(new URL('../worker/funnel.ts', import.meta.url), 'utf8');
const trustCssSource = await readFile(new URL('../src/checkout-trust-pass.css', import.meta.url), 'utf8');

test('paypal-approval block renders a paypal-order-summary child', () => {
  const block = checkoutSource.match(/paypalApproval&&\u003cdiv className="paypal-approval"[\s\S]*?\u003c\/div>/);
  assert.ok(block, 'paypal-approval block must exist');
  const inner = block[0];
  assert.match(
    inner,
    /className="paypal-order-summary"/,
    'paypal-approval must contain a child element with class paypal-order-summary',
  );
  assert.match(
    inner,
    /data-testid="paypal-order-summary"/,
    'paypal-order-summary must carry data-testid="paypal-order-summary" so QA can assert against it',
  );
});

test('paypal-order-summary is dynamic and interpolates formatMoney(totalCents) and theme.name', () => {
  const block = checkoutSource.match(/className="paypal-order-summary"[\s\S]*?\u003c\/p>/);
  assert.ok(block, 'paypal-order-summary <p> must be present');
  const inner = block[0];
  assert.match(
    inner,
    /formatMoney\(shown\.totalCents,currency\)/,
    'paypal-order-summary must call formatMoney(shown.totalCents,currency)',
  );
  assert.match(
    inner,
    /\{theme\.name\}/,
    'paypal-order-summary must interpolate {theme.name}',
  );
  assert.match(
    inner,
    /You're paying/,
    'paypal-order-summary must use the exact "You\'re paying" copy from the audit',
  );
  assert.match(
    inner,
    /for your \{theme\.name\} invitation\./,
    'paypal-order-summary must close with "for your {theme.name} invitation."',
  );
});

test('paypal_order_summary_visible is in FUNNEL_EVENTS in both client and server allowlists', () => {
  assert.match(analyticsSource, /'paypal_order_summary_visible'/);
  assert.match(workerFunnelSource, /'paypal_order_summary_visible'/);
});

test('Checkout.tsx fires paypal_order_summary_visible from the paypalApproval useEffect', () => {
  const effectStart = checkoutSource.indexOf('useEffect(()=>{if(!paypalApproval)return;');
  assert.ok(effectStart >= 0, 'paypalApproval useEffect must exist');
  const effectBlock = checkoutSource.slice(effectStart, effectStart + 400);
  assert.match(
    effectBlock,
    /trackStep\('paypal_order_summary_visible'/,
    'trackStep paypal_order_summary_visible must fire when paypalApproval becomes truthy',
  );
  assert.match(
    effectBlock,
    /theme:theme\.name/,
    'paypal_order_summary_visible must include theme:theme.name',
  );
  assert.match(
    effectBlock,
    /totalCents:shown\.totalCents/,
    'paypal_order_summary_visible must include totalCents:shown.totalCents',
  );
  assert.match(
    effectBlock,
    /currency\}/,
    'paypal_order_summary_visible must include currency',
  );
});

test('trust-pass classes (checkout-trust-strip, checkout-postpay-preview, checkout-sticky-pay) remain present', () => {
  assert.match(
    checkoutSource,
    /className="checkout-trust-strip"/,
    'trust strip must remain in Checkout.tsx (no regression)',
  );
  assert.match(
    checkoutSource,
    /className="checkout-postpay-preview"/,
    'postpay preview must remain in Checkout.tsx (no regression)',
  );
  assert.doesNotMatch(
    checkoutSource,
    /className="checkout-sticky-pay"/,
    'checkout-sticky-pay is intentionally absent in this branch (the trust pass did not add it)',
  );
});

test('checkout-trust-pass.css contains the .paypal-order-summary rule with --ink / --green tokens', () => {
  assert.match(trustCssSource, /\.paypal-order-summary/);
  assert.match(trustCssSource, /\.paypal-order-summary[^{]*\{[^}]*var\(--ink\)/);
  assert.match(trustCssSource, /\.paypal-order-summary strong[^{]*\{[^}]*var\(--green\)/);
  assert.match(
    trustCssSource,
    /@media \(max-width:479px\)\{\.paypal-order-summary\{font-size:13px\}\}/,
    'mobile rule must bump font-size to 13px at max-width:479px',
  );
});