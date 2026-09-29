import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutReliability} from '../worker/checkout-reliability.ts';
import {validAddress,validQuote,sameQuote} from '../shared/checkout.ts';
import {editIdFromRoute,preserveEditRoute} from '../src/editRoute.ts';
import {readFileSync} from 'node:fs';

const asJson=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
const sample={version:1,data:{theme:'azure',name1:'Amy',name2:'Joe'}};
function setup(options={}){
  const state={row:null,payload:structuredClone(sample),created:0,rate:0,providerChecks:0,
    user:{id:'customer_a',role:'customer',csrfToken:'csrf-test-token'},status:'ready',...options};
  const seed=(overrides={})=>{state.row={id:'order_1',user_id:'customer_a',invitation_id:'invitation_a',
    state:'awaiting_payment',invitation_state:'draft',custom_subdomain:'amy-joe',provider:'razorpay',
    provider_order_id:'provider_1',provider_payment_id:null,subtotal_cents:249900,discount_cents:0,
    tax_cents:0,total_cents:249900,currency:'INR',price_snapshot_json:'{"provider":"razorpay"}',
    data_json:'{"r2Key":"saved.json"}',...overrides};return state.row};
  const env={RAZORPAY_KEY_ID:'test_public_key',PAYPAL_CLIENT_ID:'test_paypal_client',
    MEDIA:{async get(){return state.missingMedia?null:{async json(){return structuredClone(state.payload)}}}},
    DB:{prepare(sql){let args=[];return {
      bind(...values){args=values;return this},
      async first(){
        if(sql.startsWith('SELECT slug'))return args[0]===state.row?.custom_subdomain&&state.row.invitation_state==='published'?{slug:'canonical_token_123'}:null;
        if(sql.startsWith('SELECT id,owner_id'))return args[0]===state.row?.custom_subdomain?{id:state.row.invitation_id,owner_id:state.row.user_id}:null;
        if(sql.includes('FROM orders o'))return args[0]===state.row?.invitation_id&&args[1]===state.row?.user_id?structuredClone(state.row):null;
        if(sql.startsWith('SELECT request_count'))return {request_count:state.rate};
        throw new Error(`Unexpected test query: ${sql}`);
      },
      async run(){assert.match(sql,/INSERT INTO rate_limits/);state.rate++;return {success:true}},
    }}},
  };
  const next=async request=>{
    const path=new URL(request.url).pathname;
    if(path==='/api/auth/me')return asJson({user:state.user});
    if(path==='/api/orders'){
      const body=await request.json();
      if(state.row)return asJson({error:'Address was just taken'},409);
      seed({custom_subdomain:body.subdomain});state.payload=body.invitation;state.created++;
      if(state.failAfterReserve){state.row.provider_order_id=null;return asJson({error:'Provider unavailable'},503)}
      return asJson({order:{id:'order_1'},paymentConfigured:true},201);
    }
    return asJson({path,method:request.method,body:request.method==='POST'?await request.json():null,
      cookie:request.headers.get('cookie'),origin:request.headers.get('origin')});
  };
  const status=async()=>{state.providerChecks++;if(state.providerFailure)throw new Error('Offline');return state.status};
  const request=(path='/api/orders',body={},headers={})=>new Request(`https://vowvel.com${path}`,{
    method:path==='/api/orders'?'POST':'GET',headers:{cookie:'test-session',origin:'https://vowvel.com',
      'x-csrf-token':'csrf-test-token','content-type':'application/json',...headers},
    ...(path==='/api/orders'?{body:JSON.stringify({subdomain:'amy-joe',invitation:sample,...body})}:{}),
  });
  const run=(req)=>checkoutReliability(req,env,next,status);
  return {state,env,seed,request,run};
}

for(const length of [3,7])test(`published ${length}-character aliases resolve to canonical IDs`,async()=>{
  const app=setup();const address='a'.repeat(length);app.seed({custom_subdomain:address,invitation_state:'published'});
  const result=await (await app.run(app.request(`/api/invitations/${address}`))).json();
  assert.equal(result.path,'/api/invitations/canonical_token_123');
});
for(const address of ['abcdefgh','a'.repeat(40),'canonical_token_123'])test(`existing address/identifier ${address.length} remains unchanged`,async()=>{
  const app=setup();const result=await (await app.run(app.request(`/api/invitations/${address}`))).json();
  assert.equal(result.path,`/api/invitations/${address}`);
});
test('short alias RSVP forwards body and security headers intact',async()=>{
  const app=setup();app.seed({invitation_state:'published'});
  const request=new Request('https://vowvel.com/api/invitations/amy-joe/rsvp',{method:'POST',
    headers:{cookie:'guest-cookie',origin:'https://vowvel.com','content-type':'application/json'},body:JSON.stringify({guestName:'Guest',partySize:2})});
  const result=await (await app.run(request)).json();
  assert.equal(result.path,'/api/invitations/canonical_token_123/rsvp');
  assert.deepEqual(result.body,{guestName:'Guest',partySize:2});assert.equal(result.cookie,'guest-cookie');
  assert.equal(result.origin,'https://vowvel.com');
});
test('missing or unpublished short aliases return 404',async()=>{
  const app=setup();assert.equal((await app.run(app.request('/api/invitations/amy-joe'))).status,404);
  app.seed();assert.equal((await app.run(app.request('/api/invitations/amy-joe'))).status,404);
});
test('initial order delegates creation once and returns authoritative total',async()=>{
  const app=setup();const response=await app.run(app.request());const result=await response.json();
  assert.equal(response.status,201);assert.equal(app.state.created,1);assert.equal(result.checkout.totalCents,249900);
  assert.equal(result.checkout.resumed,false);assert.equal(result.checkout.invitationUrl,'https://amy-joe.vowvel.com');
});
test('cancel then retry resumes same order, provider ID, price and snapshot',async()=>{
  const app=setup();const first=await (await app.run(app.request())).json();
  const second=await (await app.run(app.request('/api/orders',{method:'paypal',invitation:{different:true},code:'NEW'}))).json();
  assert.equal(app.state.created,1);assert.equal(second.checkout.id,first.checkout.id);
  assert.equal(second.checkout.providerOrderId,first.checkout.providerOrderId);assert.equal(second.checkout.method,'razorpay');
  assert.deepEqual(second.checkout.invitation,sample);assert.equal(second.checkout.totalCents,first.checkout.totalCents);
  assert.equal(second.checkout.resumed,true);assert.equal(app.state.providerChecks,1);
});
test('browser refresh can recover checkout from authenticated address lookup',async()=>{
  const app=setup();app.seed();const result=await (await app.run(app.request('/api/checkout/lookup?address=amy-joe'))).json();
  assert.equal(result.available,false);assert.equal(result.checkout.id,'order_1');
  assert.deepEqual(result.checkout.invitation,sample);
});
test('simultaneous first requests recover the unique existing order',async()=>{
  const app=setup();const results=await Promise.all([app.run(app.request()),app.run(app.request())]);
  const bodies=await Promise.all(results.map(r=>r.json()));assert.equal(app.state.created,1);
  assert.equal(bodies[0].checkout.id,bodies[1].checkout.id);
});
test('paid order returns its link without querying provider or creating another order',async()=>{
  const app=setup();app.seed({state:'paid',invitation_state:'published'});
  const result=await (await app.run(app.request())).json();assert.equal(result.checkout.paymentState,'paid');
  assert.equal(result.complimentary,true);assert.equal(app.state.providerChecks,0);assert.equal(app.state.created,0);
});
test('captured provider payment awaiting webhook blocks another payment',async()=>{
  const app=setup({status:'confirming'});app.seed();
  const result=await (await app.run(app.request())).json();assert.equal(result.checkout.paymentState,'confirming');
  assert.equal(result.paymentConfigured,false);assert.equal(result.complimentary,false);assert.equal(app.state.created,0);
});
test('a payment already linked locally cannot reopen the gateway',async()=>{
  const app=setup();app.seed({provider_payment_id:'payment_already_linked'});
  const result=await (await app.run(app.request())).json();assert.equal(result.checkout.paymentState,'confirming');
  assert.equal(app.state.providerChecks,0);assert.equal(result.paymentConfigured,false);
});
test('provider outage fails closed and retains the pending order',async()=>{
  const app=setup({providerFailure:true});app.seed();const result=await (await app.run(app.request())).json();
  assert.equal(result.checkout.paymentState,'unavailable');assert.equal(result.paymentConfigured,false);assert.equal(app.state.row.id,'order_1');
});
test('approved PayPal checkout is preserved for explicit capture',async()=>{
  const app=setup({status:'approved'});app.seed({provider:'paypal',currency:'USD',subtotal_cents:4000,total_cents:4000});
  const result=await (await app.run(app.request())).json();assert.equal(result.checkout.paymentState,'approved');
  assert.equal(result.checkout.method,'paypal');assert.equal(result.checkout.paypalClientId,'test_paypal_client');
});
for(const state of ['refunded','cancelled','failed'])test(`${state} orders cannot accept another payment`,async()=>{
  const app=setup();app.seed({state});const result=await (await app.run(app.request())).json();
  assert.equal(result.checkout.paymentState,'blocked');assert.equal(result.paymentConfigured,false);assert.equal(app.state.created,0);
});
test('invalid stored totals fail closed',async()=>{
  const app=setup();app.seed({total_cents:1});const response=await app.run(app.request());
  assert.equal(response.status,503);assert.match((await response.json()).error,/total could not be verified/);
});
test('missing saved artwork/payload blocks payment rather than losing customer data',async()=>{
  const app=setup({missingMedia:true});app.seed();assert.equal((await app.run(app.request())).status,503);
});
test('provider initialization failure preserves recoverable order identity',async()=>{
  const app=setup({failAfterReserve:true});const result=await (await app.run(app.request())).json();
  assert.equal(result.checkout.id,'order_1');assert.equal(result.checkout.paymentState,'unavailable');
  await app.run(app.request());assert.equal(app.state.created,1);
});
test('unavailable foreign-owned addresses do not reveal private data',async()=>{
  const app=setup();app.seed({user_id:'someone_else'});
  const lookup=await (await app.run(app.request('/api/checkout/lookup?address=amy-joe'))).json();
  assert.deepEqual(lookup,{available:false,checkout:null});assert.equal((await app.run(app.request())).status,409);
});
test('new address lookup returns available without personal data',async()=>{
  const app=setup();assert.deepEqual(await (await app.run(app.request('/api/checkout/lookup?address=amy-joe'))).json(),{available:true,checkout:null});
});
test('unauthenticated requests cannot read or resume orders',async()=>{
  const app=setup({user:null});app.seed();assert.equal((await app.run(app.request())).status,401);
  assert.equal((await app.run(app.request('/api/checkout/lookup?address=amy-joe'))).status,401);
});
test('non-customer role cannot purchase through the compatibility layer',async()=>{
  const app=setup({user:{id:'admin',role:'admin',csrfToken:'csrf-test-token'}});
  assert.equal((await app.run(app.request())).status,403);
});
test('resume endpoint enforces origin and CSRF before returning payment fields',async()=>{
  const app=setup();app.seed();assert.equal((await app.run(app.request('/api/orders',{}, {'x-csrf-token':''}))).status,403);
  assert.equal((await app.run(app.request('/api/orders',{}, {origin:'https://other.example'}))).status,403);
});
test('status polling is rate limited',async()=>{
  const app=setup({rate:30});app.seed();assert.equal((await app.run(app.request('/api/checkout/lookup?address=amy-joe&check=1'))).status,429);
});
test('unrelated endpoints are delegated unchanged',async()=>{
  const app=setup();const result=await (await app.run(app.request('/api/health'))).json();assert.equal(result.path,'/api/health');
});
test('address boundaries agree with the supported 3–40 range',()=>{
  for(const length of [3,7,8,40])assert.equal(validAddress('a'.repeat(length)),true);
  for(const bad of ['aa','a'.repeat(41),'123','-amy','amy-','amy_joe','amy/joe'])assert.equal(validAddress(bad),false);
});
test('quote equality detects all price components and currency changes',()=>{
  const price={subtotalCents:249900,discountCents:10000,taxCents:0,totalCents:239900,currency:'INR'};
  assert.equal(validQuote(price),true);assert.equal(sameQuote(price,{...price}),true);
  for(const key of ['subtotalCents','discountCents','taxCents','totalCents'])assert.equal(sameQuote(price,{...price,[key]:price[key]+1}),false);
  assert.equal(sameQuote(price,{...price,currency:'USD'}),false);assert.equal(sameQuote(null,price),false);
  assert.equal(validQuote({...price,totalCents:1}),false);assert.equal(validQuote({...price,totalCents:NaN}),false);
  assert.equal(validQuote({...price,discountCents:-1}),false);
});
test('zero-price complimentary quote is valid',()=>assert.equal(validQuote({subtotalCents:100,discountCents:100,taxCents:0,totalCents:0,currency:'INR'}),true));
test('paid edit context survives theme change, preview, back, undo and refresh',()=>{
  let route='#/create/azure?update=invitation_a';
  for(const target of ['/create/gulmohar','/preview/draft','/create/gulmohar','/create/azure']){
    route=preserveEditRoute(target,route);assert.equal(editIdFromRoute(route),'invitation_a');
  }
  assert.equal(editIdFromRoute('#'+route),'invitation_a');
});
test('occasion remains on the edit path, explicit new IDs win',()=>{
  assert.equal(preserveEditRoute('/create/azure?occasion=engagement','#/preview/draft?update=invitation_a'),'/create/azure?occasion=engagement&update=invitation_a');
  assert.equal(preserveEditRoute('/create/azure?update=invitation_b','#/preview/draft?update=invitation_a'),'/create/azure?update=invitation_b');
});
test('editing identity never leaks into checkout, public demos or landing navigation',()=>{
  for(const target of ['/','/checkout','/replies','/preview/azure'])assert.equal(preserveEditRoute(target,'#/create/azure?update=invitation_a'),target);
  assert.equal(preserveEditRoute('/create/azure','#/'),'/create/azure');assert.equal(editIdFromRoute('#/create/azure?update=../bad'),null);
});
test('frontend wiring uses server quotes and edit-safe navigation',()=>{
  const checkout=readFileSync(new URL('../src/Checkout.tsx',import.meta.url),'utf8');
  assert.match(checkout,/api\/coupons\/quote/);assert.match(checkout,/sameQuote\(expected,order\)/);
  assert.doesNotMatch(checkout,/249900|subtotalCents:4000/);assert.doesNotMatch(checkout,/You have not been charged/);
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
  const editor=readFileSync(new URL('../src/Editor.tsx',import.meta.url),'utf8');
  assert.match(app,/window\.location\.hash=preserveEditRoute/);assert.match(editor,/preserveEditRoute\('\/create\/'\+partial.theme/);
  assert.match(editor,/preserveEditRoute\('\/create\/'\+previous.theme/);assert.match(editor,/Save changes/);
});
