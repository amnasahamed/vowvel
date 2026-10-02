import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import worker from '../worker/index.ts';
import {FUNNEL_EVENTS,parseFunnelBody,sanitizeFunnelParams,sanitizeFunnelPath,buildFunnelLogLine} from '../worker/funnel.ts';

const analyticsSource=(await readFile(new URL('../src/analytics.ts',import.meta.url),'utf8'));
const {track,trackStep}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(analyticsSource)).toString('base64'));

function withStubbedBrowser(scenario,fn){
  const originalFetch=globalThis.fetch;
  const originalWindow=globalThis.window;
  const originalGtag=globalThis.window?.gtag;
  const originalLocation=globalThis.location;
  const calls=scenario.calls||{gtag:[],fetch:[]};
  const ctx={scenario,calls};
  globalThis.window={gtag:(...args)=>{calls.gtag.push(args);},location:{hash:scenario.hash||'#/'}};
  globalThis.location=globalThis.window.location;
  globalThis.fetch=(url,options)=>{calls.fetch.push({url,options:options?{...options}:null});return Promise.resolve(new Response(null,{status:204}))};
  try{return fn(ctx);}finally{
    globalThis.fetch=originalFetch;
    if(originalWindow!==undefined){globalThis.window=originalWindow;globalThis.window.gtag=originalGtag;}else{delete globalThis.window;}
    if(originalLocation!==undefined)globalThis.location=originalLocation;else delete globalThis.location;
  }
}

test('funnel allowlist matches the 21 canonical event names',()=>{
  assert.equal(FUNNEL_EVENTS.length,21);
  for(const name of [
    'design_card_view','design_card_click','preview_open','cover_sealed_broken','preview_use_clicked',
    'editor_open','editor_name_filled','editor_tab_advanced','editor_ready_to_publish_clicked','editor_review_continue_clicked',
    'checkout_open','otp_requested','otp_verified','subdomain_typed','subdomain_available',
    'coupon_applied','payment_initiated','payment_succeeded','invite_shared','checkout_cta_blocked_help_shown','checkout_error',
  ]){assert.ok(FUNNEL_EVENTS.includes(name),`${name} must be in the allowlist`);}
});

test('parseFunnelBody accepts allowlisted events and sanitizes params',()=>{
  const payload=parseFunnelBody({eventName:'design_card_click',params:{theme:'gulmohar',position:2,email:'leaky@example.com',name:'Ananya'},path:'#/preview/gulmhar',ts:1700000000000});
  assert.ok(payload);
  assert.equal(payload.eventName,'design_card_click');
  assert.equal(payload.params.theme,'gulmohar');
  assert.equal(payload.params.position,2);
  assert.equal('email' in payload.params,false,'email params are stripped');
  assert.equal('name' in payload.params,false,'name params are stripped');
  assert.equal(payload.ts,1700000000000);
});

test('parseFunnelBody rejects unknown event names',()=>{
  assert.equal(parseFunnelBody({eventName:'random_internal',params:{},path:'',ts:1}),null);
  assert.equal(parseFunnelBody({eventName:'',params:{},path:'',ts:1}),null);
  assert.equal(parseFunnelBody({params:{},path:'',ts:1}),null);
  assert.equal(parseFunnelBody(null),null);
});

test('sanitizeFunnelParams drops nested objects, arrays, and oversized strings',()=>{
  const clean=sanitizeFunnelParams({theme:'azure',note:'a'.repeat(500),nested:{a:1},list:[1,2,3],flag:true,missing:null});
  assert.equal(clean.theme,'azure');
  assert.equal(clean.note.length,200);
  assert.equal(clean.flag,true);
  assert.equal('nested' in clean,false);
  assert.equal('list' in clean,false);
  assert.equal('missing' in clean,false);
});

test('sanitizeFunnelPath truncates to a safe prefix',()=>{
  assert.equal(sanitizeFunnelPath('#/preview/gulmohar'),'#/preview/gulmohar');
  assert.equal(sanitizeFunnelPath('a'.repeat(500)).length,200);
  assert.equal(sanitizeFunnelPath(null),'');
});

test('buildFunnelLogLine emits the structured log entry',()=>{
  const line=buildFunnelLogLine({eventName:'payment_initiated',params:{method:'razorpay',totalCents:249900},path:'#/checkout',ts:1});
  const parsed=JSON.parse(line);
  assert.equal(parsed.level,'info');
  assert.equal(parsed.event,'funnel');
  assert.equal(parsed.eventName,'payment_initiated');
  assert.equal(parsed.path,'#/checkout');
  assert.equal(parsed.params.method,'razorpay');
  assert.equal(parsed.params.totalCents,249900);
});

test('trackStep never throws and routes through gtag and the funnel endpoint',()=>{
  withStubbedBrowser({hash:'#/preview/gulmohar'},({calls})=>{
    trackStep('design_card_view',{theme:'gulmohar',position:2});
    assert.equal(calls.gtag.length,1);
    assert.deepEqual(calls.gtag[0][0],'event');
    assert.equal(calls.gtag[0][1],'design_card_view');
    assert.equal(calls.gtag[0][2].theme,'gulmohar');
    assert.equal(calls.fetch.length,1);
    assert.equal(calls.fetch[0].url,'/api/funnel');
    assert.equal(calls.fetch[0].options.method,'POST');
    assert.equal(calls.fetch[0].options.keepalive,true);
    const body=JSON.parse(calls.fetch[0].options.body);
    assert.equal(body.eventName,'design_card_view');
    assert.equal(body.params.theme,'gulmohar');
    assert.equal(body.path,'#/preview/gulmohar');
    assert.equal(typeof body.ts,'number');
  });
});

test('track is a no-op when gtag is absent and never throws',()=>{
  withStubbedBrowser({hash:'#/',calls:{gtag:[],fetch:[]}},({calls})=>{
    delete globalThis.window.gtag;
    assert.doesNotThrow(()=>track('preview_open'));
    assert.equal(calls.fetch.length,1);
    assert.equal(calls.fetch[0].options.body.includes('preview_open'),true);
  });
});

test('track sanitizes oversized strings and unsupported param types',()=>{
  withStubbedBrowser({hash:'#/'},({calls})=>{
    track('coupon_applied',{discountCents:1500,note:'a'.repeat(1000),nested:{a:1}});
    const body=JSON.parse(calls.fetch[0].options.body);
    assert.equal(body.params.discountCents,1500);
    assert.equal(body.params.note.length,200);
    assert.equal('nested' in body.params,false);
  });
});

test('track swallows fetch errors and never throws',async()=>{
  withStubbedBrowser({hash:'#/'},()=>{
    globalThis.fetch=()=>Promise.reject(new Error('offline'));
    assert.doesNotThrow(()=>track('payment_succeeded',{orderId:'o_1'}));
  });
});

test('POST /api/funnel accepts an allowlisted event and returns 204',async()=>{
  const calls=[];
  const originalLog=console.log;
  console.log=(...args)=>{calls.push(args.map(String).join(' '))};
  try{
    const env={
      ENVIRONMENT:'test',
      DB:{prepare:()=>({bind:()=>({run:async()=>({meta:{changes:1}}),first:async()=>({request_count:1})})})},
    };
    const ctx={waitUntil:()=>{}};
    const req=new Request('https://vowvel.com/api/funnel',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({eventName:'design_card_view',params:{theme:'gulmohar'},path:'#/preview/gulmohar',ts:1700000000000})});
    const res=await worker.fetch(req,env,ctx);
    assert.equal(res.status,204);
    const funnel=calls.find(line=>line.includes('"event":"funnel"'));
    assert.ok(funnel,'funnel log line should be emitted');
    const parsed=JSON.parse(funnel);
    assert.equal(parsed.eventName,'design_card_view');
    assert.equal(parsed.params.theme,'gulmohar');
  }finally{console.log=originalLog}
});

test('POST /api/funnel rejects unknown event names with 400',async()=>{
  const env={ENVIRONMENT:'test',DB:{prepare:()=>({bind:()=>({run:async()=>({meta:{changes:1}}),first:async()=>({request_count:1})})})}};
  const ctx={waitUntil:()=>{}};
  const req=new Request('https://vowvel.com/api/funnel',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({eventName:'made_up_event',params:{},path:'',ts:Date.now()})});
  const res=await worker.fetch(req,env,ctx);
  assert.equal(res.status,400);
  const body=await res.json();
  assert.equal(body.code,'funnel_invalid');
});

test('POST /api/funnel strips PII keys before logging',async()=>{
  const calls=[];
  const originalLog=console.log;
  console.log=(...args)=>{calls.push(args.map(String).join(' '))};
  try{
    const env={ENVIRONMENT:'test',DB:{prepare:()=>({bind:()=>({run:async()=>({meta:{changes:1}}),first:async()=>({request_count:1})})})}};
    const ctx={waitUntil:()=>{}};
    const req=new Request('https://vowvel.com/api/funnel',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({eventName:'checkout_error',params:{code:'verify_failed',email:'leaky@example.com',name:'Ananya',note:'safe note'},path:'#/checkout',ts:Date.now()})});
    const res=await worker.fetch(req,env,ctx);
    assert.equal(res.status,204);
    const funnel=JSON.parse(calls.find(line=>line.includes('"event":"funnel"')));
    assert.equal(funnel.params.email,undefined);
    assert.equal(funnel.params.name,undefined);
    assert.equal(funnel.params.note,'safe note');
    assert.equal(funnel.params.code,'verify_failed');
  }finally{console.log=originalLog}
});

test('GET /api/funnel reports the endpoint contract',async()=>{
  const env={ENVIRONMENT:'test',DB:{prepare:()=>({bind:()=>({run:async()=>({meta:{changes:0}}),first:async()=>({request_count:0})})})}};
  const ctx={waitUntil:()=>{}};
  const res=await worker.fetch(new Request('https://vowvel.com/api/funnel'),env,ctx);
  assert.equal(res.status,200);
  const body=await res.json();
  assert.equal(body.ok,true);
  assert.equal(body.endpoint,'funnel');
});