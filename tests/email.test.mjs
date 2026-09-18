import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHtml,otpEmail,purchaseEmail,redemptionEmail} from '../worker/email.ts';

test('transactional email content escapes user-controlled values',()=>{
  assert.equal(escapeHtml('<script>"x" & y</script>'),'&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;');
  const purchase=purchaseEmail('client@example.com','order_<unsafe>','₹1,499','https://example.com/#/invite/abc');
  assert.ok(!purchase.html.includes('order_<unsafe>'));
  assert.match(purchase.text,/https:\/\/example\.com\/#\/invite\/abc/);
  assert.ok(purchase.html.includes('Copy your link'));
  assert.ok(purchase.html.includes('https://example.com/#/invite/abc'));
  assert.match(purchase.text,/tap and hold/i);
});

test('OTP and creator redemption emails include required facts',()=>{
  const otp=otpEmail('admin@example.com','123456');
  assert.match(otp.text,/123456/);assert.match(otp.text,/10 minutes/);
  const redemption=redemptionEmail('creator@example.com','VOW123','₹202.35');
  assert.match(redemption.text,/VOW123/);assert.match(redemption.text,/₹202\.35/);assert.match(redemption.text,/holding period/);
});
