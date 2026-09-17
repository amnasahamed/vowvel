import test from 'node:test';
import assert from 'node:assert/strict';
import {PAYPAL_CURRENCY,PAYPAL_PRICE_CENTS,fromPayPalValue,parsePayPalCaptureEvent,paypalApiBase,requirePayPalCredentials,toPayPalValue} from '../worker/paypal.ts';

test('PayPal flat international price is $40 USD',()=>{
  assert.equal(PAYPAL_CURRENCY,'USD');
  assert.equal(PAYPAL_PRICE_CENTS,4000);
  assert.equal(toPayPalValue(PAYPAL_PRICE_CENTS),'40.00');
});

test('PayPal amount conversion round-trips and rejects bad values',()=>{
  assert.equal(fromPayPalValue('40.00'),4000);
  assert.equal(fromPayPalValue('1.00'),100);
  assert.throws(()=>toPayPalValue(0),/Invalid PayPal amount/);
  assert.throws(()=>toPayPalValue(-5),/Invalid PayPal amount/);
  assert.throws(()=>fromPayPalValue('40'),/Invalid PayPal amount value/);
  assert.throws(()=>fromPayPalValue('40.0'),/Invalid PayPal amount value/);
  assert.throws(()=>fromPayPalValue('0.00'),/Invalid PayPal amount value/);
  assert.throws(()=>fromPayPalValue('abc'),/Invalid PayPal amount value/);
});

test('PayPal credentials are required before any API call',()=>{
  assert.throws(()=>requirePayPalCredentials({}),/not configured/);
  assert.throws(()=>requirePayPalCredentials({PAYPAL_CLIENT_ID:'id'}),/not configured/);
  assert.deepEqual(requirePayPalCredentials({PAYPAL_CLIENT_ID:'id',PAYPAL_CLIENT_SECRET:'secret'}),{clientId:'id',clientSecret:'secret'});
});

test('PayPal API base defaults to live and rejects bad overrides',()=>{
  assert.equal(paypalApiBase({}),'https://api-m.paypal.com');
  assert.equal(paypalApiBase({PAYPAL_API_BASE:'https://api-m.sandbox.paypal.com/'}),'https://api-m.sandbox.paypal.com');
  assert.throws(()=>paypalApiBase({PAYPAL_API_BASE:'http://evil.example.com'}),/Invalid PayPal API base/);
});

test('PayPal capture events parse order, capture and amount',()=>{
  const parsed=parsePayPalCaptureEvent({
    id:'WH-8JU74231TN095931T-2C4181520W748221N',
    event_type:'PAYMENT.CAPTURE.COMPLETED',
    resource:{
      id:'3VL68365TA381250T',
      amount:{currency_code:'USD',value:'40.00'},
      supplementary_data:{related_ids:{order_id:'8RU61169RC123321B'}},
    },
  });
  assert.deepEqual(parsed,{eventId:'WH-8JU74231TN095931T-2C4181520W748221N',paypalOrderId:'8RU61169RC123321B',captureId:'3VL68365TA381250T',amountCents:4000});
});

test('PayPal capture events reject wrong currency or missing ids',()=>{
  assert.equal(parsePayPalCaptureEvent(null),null);
  assert.equal(parsePayPalCaptureEvent({}),null);
  assert.equal(parsePayPalCaptureEvent({
    id:'WH-1',resource:{id:'CAP-1',amount:{currency_code:'INR',value:'40.00'},supplementary_data:{related_ids:{order_id:'ORDER-1'}}},
  }),null);
  assert.equal(parsePayPalCaptureEvent({
    id:'WH-1',resource:{id:'',amount:{currency_code:'USD',value:'40.00'},supplementary_data:{related_ids:{order_id:'ORDER-1'}}},
  }),null);
});
