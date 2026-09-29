import test from 'node:test';
import assert from 'node:assert/strict';
import {readPaymentStatus} from '../worker/payment-status.ts';
const env={RAZORPAY_KEY_ID:'test-id',RAZORPAY_KEY_SECRET:'test-secret',PAYPAL_CLIENT_ID:'test-client',PAYPAL_CLIENT_SECRET:'test-secret',PAYPAL_API_BASE:'https://api-m.sandbox.paypal.com'};
const razorpay={provider:'razorpay',provider_order_id:'provider_1',total_cents:249900,currency:'INR',price_snapshot_json:'{"provider":"razorpay"}'};
const paypal={...razorpay,provider:'paypal',provider_order_id:'PAYPAL1',total_cents:4000,currency:'USD'};
function mockResponses(t,order,payments=[]){
  const calls=[];
  t.mock.method(globalThis,'fetch',async(url,options={})=>{
    const text=String(url);calls.push({url:text,method:options.method||'GET'});
    if(text.endsWith('/v1/oauth2/token'))return new Response(JSON.stringify({access_token:'test-token',expires_in:3600}));
    if(text.endsWith('/payments'))return new Response(JSON.stringify({items:payments}));
    return new Response(JSON.stringify(order));
  });return calls;
}
const rp=(status)=>({id:'provider_1',amount:249900,currency:'INR',status});
const pp=(status)=>({id:'PAYPAL1',status,purchase_units:[{amount:{value:'40.00',currency_code:'USD'}}]});
test('Razorpay created order with no payment is resumable',async t=>{
  mockResponses(t,rp('created'));assert.equal(await readPaymentStatus(env,razorpay),'ready');
});
test('Razorpay failed attempt reuses the same order',async t=>{
  mockResponses(t,rp('attempted'),[{order_id:'provider_1',status:'failed'}]);assert.equal(await readPaymentStatus(env,razorpay),'ready');
});
for(const status of ['created','authorized','captured','pending'])test(`Razorpay ${status} payment must not reopen payment`,async t=>{
  const calls=mockResponses(t,rp('attempted'),[{order_id:'provider_1',status}]);
  assert.equal(await readPaymentStatus(env,razorpay),'confirming');assert(calls.every(call=>call.method==='GET'));
});
test('Razorpay paid order waits for publishing confirmation',async t=>{
  const calls=mockResponses(t,rp('paid'));assert.equal(await readPaymentStatus(env,razorpay),'confirming');assert.equal(calls.length,1);
});
test('Razorpay total or order identity mismatch fails closed',async t=>{
  mockResponses(t,{...rp('created'),amount:1});assert.equal(await readPaymentStatus(env,razorpay),'unavailable');
});
test('Razorpay unrelated payment response fails closed',async t=>{
  mockResponses(t,rp('attempted'),[{order_id:'not-this-order',status:'failed'}]);assert.equal(await readPaymentStatus(env,razorpay),'unavailable');
});
for(const [status,expected] of [['CREATED','ready'],['APPROVED','approved'],['COMPLETED','confirming'],['VOIDED','blocked']])test(`PayPal ${status} is handled without new order creation or capture`,async t=>{
  const calls=mockResponses(t,pp(status));assert.equal(await readPaymentStatus(env,paypal),expected);
  assert(calls.filter(call=>call.url.includes('/v2/checkout/orders/')).every(call=>call.method==='GET'));
});
test('PayPal pending capture blocks a second capture attempt',async t=>{
  const value=pp('APPROVED');value.purchase_units[0].payments={captures:[{status:'PENDING'}]};mockResponses(t,value);
  assert.equal(await readPaymentStatus(env,paypal),'confirming');
});
test('PayPal mismatched amount fails closed',async t=>{
  const value=pp('APPROVED');value.purchase_units[0].amount.value='1.00';mockResponses(t,value);
  assert.equal(await readPaymentStatus(env,paypal),'unavailable');
});
test('missing provider credentials do not start a network request',async t=>{
  const calls=mockResponses(t,rp('created'));assert.equal(await readPaymentStatus({},razorpay),'unavailable');assert.equal(calls.length,0);
});
