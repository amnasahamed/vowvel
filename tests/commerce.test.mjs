import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateCommission,calculateQuote,csvCell,normalizeCouponCode} from '../worker/domain.ts';

test('10% partner coupon and 15% commission use discounted subtotal',()=>{
  const quote=calculateQuote(149900,0,{discountType:'percentage',discountValue:1000,maxDiscountCents:null,minSubtotalCents:0});
  assert.deepEqual(quote,{subtotalCents:149900,discountCents:14990,taxableCents:134910,taxCents:0,totalCents:134910});
  assert.equal(calculateCommission(quote.taxableCents,1500),20237);
});

test('fixed discounts never make a negative total',()=>{
  const quote=calculateQuote(10000,1800,{discountType:'fixed',discountValue:25000,maxDiscountCents:null,minSubtotalCents:0});
  assert.equal(quote.discountCents,10000);
  assert.equal(quote.totalCents,0);
});

test('percentage maximum and minimum subtotal are enforced',()=>{
  const below=calculateQuote(40000,0,{discountType:'percentage',discountValue:5000,maxDiscountCents:10000,minSubtotalCents:50000});
  assert.equal(below.discountCents,0);
  const capped=calculateQuote(60000,0,{discountType:'percentage',discountValue:5000,maxDiscountCents:10000,minSubtotalCents:50000});
  assert.equal(capped.discountCents,10000);
});

test('coupon normalization and CSV export are safe',()=>{
  assert.equal(normalizeCouponCode('  vow 10 '),'VOW10');
  assert.equal(csvCell('=IMPORTXML("bad")'),'"\'=IMPORTXML(""bad"")"');
});
