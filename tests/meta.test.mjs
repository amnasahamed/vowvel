import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMetaPayload,metaConfigured,splitName,toMetaValue} from '../worker/meta.ts';

test('names split into Meta fn/ln fields',()=>{
  assert.deepEqual(splitName('Ananya Sharma'),{fn:'Ananya',ln:'Sharma'});
  assert.deepEqual(splitName('  Ishaan  '),{fn:'Ishaan',ln:''});
  assert.deepEqual(splitName('Mary Jane Watson'),{fn:'Mary',ln:'Jane Watson'});
  assert.deepEqual(splitName(''),{fn:'',ln:''});
});

test('minor units convert to Meta decimal values',()=>{
  assert.equal(toMetaValue(249900),2499);
  assert.equal(toMetaValue(4000),40);
  assert.equal(toMetaValue(0),0);
  assert.throws(()=>toMetaValue(-1),/Invalid Meta event value/);
});

test('Meta is only configured with token and dataset',()=>{
  assert.equal(metaConfigured({}),false);
  assert.equal(metaConfigured({META_ACCESS_TOKEN:'t'}),false);
  assert.equal(metaConfigured({META_DATASET_ID:'1'}),false);
  assert.equal(metaConfigured({META_ACCESS_TOKEN:'t',META_DATASET_ID:'1'}),true);
});

test('Meta payload hashes customer data and carries revenue',async ()=>{
  const payload=await buildMetaPayload({
    eventName:'Purchase',
    eventId:'order_1:purchase',
    email:'Client@Example.com',
    name:'Ananya Sharma',
    userAgent:'Mozilla/5.0',
    eventSourceUrl:'https://vowvel.com/#/checkout',
    valueCents:249900,
    currency:'INR',
    contentIds:['conservatory'],
    orderId:'order_1',
  });
  const event=payload.data[0];
  assert.equal(event.event_name,'Purchase');
  assert.equal(event.action_source,'website');
  assert.equal(event.event_id,'order_1:purchase');
  assert.ok(typeof event.event_time==='number');
  assert.equal(event.custom_data.value,2499);
  assert.equal(event.custom_data.currency,'INR');
  assert.deepEqual(event.custom_data.content_ids,['conservatory']);
  assert.equal(event.custom_data.order_id,'order_1');
  // SHA-256 of normalized values (Meta hashes server-side fields the same way).
  const {createHash}=await import('node:crypto');
  const hex=(value)=>createHash('sha256').update(value).digest('hex');
  assert.deepEqual(event.user_data.em,[hex('client@example.com')]);
  assert.deepEqual(event.user_data.fn,[hex('ananya')]);
  assert.deepEqual(event.user_data.ln,[hex('sharma')]);
  assert.equal(event.user_data.client_user_agent,'Mozilla/5.0');
});

test('Meta payload requires ids and content',async ()=>{
  const base={eventName:'Purchase',eventId:'e',email:'a@b.c',name:'N',userAgent:'',eventSourceUrl:'https://vowvel.com/',valueCents:100,currency:'INR',contentIds:['x'],orderId:'o'};
  await assert.rejects(buildMetaPayload({...base,eventId:''}),/event and order ids/);
  await assert.rejects(buildMetaPayload({...base,contentIds:[]}),/content ids/);
});
