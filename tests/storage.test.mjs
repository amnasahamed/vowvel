import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { blankDraft, sample, formatDate, formatTime } from '../src/data.ts';
// Load the real browser module while resolving its bundler-style extensionless import.
const source = (await readFile(new URL('../src/storage.ts',import.meta.url),'utf8')).replace("'./data'",JSON.stringify(new URL('../src/data.ts',import.meta.url).href));
const {normalizeDraft,loadDraft,saveDraft,hasDraft}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
let stored=null;
globalThis.localStorage={getItem:()=>stored,setItem:(_key,value)=>{stored=value}};

test('a real personalized backup round-trips without dropping user data',()=>{
 const draft=structuredClone(sample);draft.name1='A very personal name';draft.theme='azure';draft.occasion='Engagement';draft.sections.travel=false;draft.photos=['data:image/png;base64,aGVsbG8='];
 assert.equal(saveDraft(draft),true);assert.equal(hasDraft(),true);assert.deepEqual(loadDraft(),draft);
});
test('invalid JSON, incompatible versions and wrong payload shapes recover safely',()=>{
 for(const value of ['{broken','null','[]','{"version":2,"data":{}}','{"version":1,"data":[]}']){stored=value;assert.equal(hasDraft(),false);assert.deepEqual(loadDraft(),blankDraft)}
});
test('corrupt fields cannot crash trim/date formatting or event rendering',()=>{
 const result=normalizeDraft({version:1,data:{name1:{bad:true},name2:17,theme:[],occasion:'Housewarming',sections:{story:'false',gallery:null},events:[null,5,{id:'x',date:'2027-02-30',time:'29:90',name:{},venue:[]},{id:'x',date:'2028-02-29',time:'23:59'}],photos:[null,'https://foreign.example/image.jpg','data:image/svg+xml;base64,PHN2Zz4=']}});
 assert.equal(result.name1.trim(),'');assert.equal(result.name2,'');assert.equal(result.occasion,'Wedding');assert.equal(result.theme,'conservatory');assert.equal(result.sections.story,true);assert.equal(result.events[0].date,'');assert.equal(result.events[0].time,'');assert.equal(result.events[1].date,'2028-02-29');assert.equal(new Set(result.events.map(e=>e.id)).size,2);assert.deepEqual(result.photos,[]);
 for(const event of result.events){assert.doesNotThrow(()=>formatDate(event.date));assert.doesNotThrow(()=>formatTime(event.time))}
});
test('missing or invalid event arrays always leave an editable first ceremony',()=>{
 for(const events of [[],null,'oops',[null,3]])assert.equal(normalizeDraft({version:1,data:{events}}).events.length,1);
});
test('storage denial is reported and does not prevent a fresh draft',()=>{
 const old=globalThis.localStorage;globalThis.localStorage={getItem(){throw Error('denied')},setItem(){throw Error('quota')}};
 try{assert.equal(saveDraft(sample),false);assert.equal(hasDraft(),false);assert.deepEqual(loadDraft(),blankDraft)}finally{globalThis.localStorage=old}
});
test('loaded and default drafts do not share mutable event/section state',()=>{
 stored=null;const a=loadDraft();a.events[0].venue='Changed';a.sections.story=false;const b=loadDraft();assert.equal(b.events[0].venue,'');assert.equal(b.sections.story,true);
});
test('optional couple profiles survive saving, including custom family wording and portraits',()=>{
 const draft=structuredClone(sample);draft.couple={enabled:true,showFamily:true,profiles:[{role:'The bride',photo:'data:image/jpeg;base64,aGVsbG8=',intro:'A little about me',familyName:'Our family',guardians:'With love from my guardians'},{role:'',photo:'',intro:'A different story',familyName:'',guardians:''}]};
 assert.equal(saveDraft(draft),true);assert.deepEqual(loadDraft().couple,draft.couple);
});
test('older drafts without couple details remain valid and do not gain sample personal data',()=>{
 const result=normalizeDraft({version:1,data:sample});assert.equal(result.couple,undefined);
});
test('malformed couple profiles are normalized without unsafe photos or invalid text',()=>{
 const result=normalizeDraft({version:1,data:{couple:{enabled:'true',showFamily:true,profiles:[{role:42,intro:{},photo:'data:image/svg+xml;base64,PHN2Zz4=',familyName:'x'.repeat(200),guardians:[]},null,{intro:'extra'}]}}});
 assert.equal(result.couple.enabled,false);assert.equal(result.couple.showFamily,true);assert.equal(result.couple.profiles.length,2);assert.equal(result.couple.profiles[0].photo,'');assert.equal(result.couple.profiles[0].role,'');assert.equal(result.couple.profiles[0].intro,'');assert.equal(result.couple.profiles[0].familyName.length,100);assert.equal(result.couple.profiles[1].guardians,'');
 for(const malformed of [null,[],5,'text'])assert.equal(normalizeDraft({version:1,data:{couple:malformed}}).couple,undefined);
});
test('design customizations round-trip cleanly and normalize invalid or dangerous inputs',()=>{
 const draft=structuredClone(sample);
 draft.design={
   fontMood:'dm-serif',
   accentColor:'#42573f',
   paperColor:'#f1efdf',
   sealEmblem:'botanical',
   sealColor:'#963e2d',
   envelopeNote:'With love and blessings',
   atmosphere:'sparkles',
   countdown:true,
   sectionOrder:['story','welcome','events','couple','gallery','scratch','notes','rsvp'],
   sectionTitles:{story:'Our Journey',events:'Celebrations'}
 };
 assert.equal(saveDraft(draft),true);
 assert.deepEqual(loadDraft().design,draft.design);

 const normalized=normalizeDraft({
   version:1,
   data:{
     design:{
       fontMood:'non-existent',
       accentColor:'javascript:alert(1)',
       paperColor:'#123456',
       sealEmblem:'unknown',
       sealColor:'#abc',
       envelopeNote:'a'.repeat(200),
       atmosphere:'fireflies',
       countdown:false,
       sectionOrder:['story','story','events',123,'hack'],
       sectionTitles:{story:'a'.repeat(100)}
     }
   }
 });
 assert.equal(normalized.design.fontMood,'cormorant');
 assert.equal(normalized.design.accentColor,undefined);
 assert.equal(normalized.design.paperColor,'#123456');
 assert.equal(normalized.design.sealEmblem,'monogram');
 assert.equal(normalized.design.sealColor,'#abc');
 assert.equal(normalized.design.envelopeNote.length,80);
 assert.equal(normalized.design.atmosphere,'fireflies');
 assert.equal(normalized.design.countdown,false);
 assert.ok(normalized.design.sectionOrder.includes('story'));
 assert.ok(normalized.design.sectionOrder.includes('events'));
 assert.equal(normalized.design.sectionTitles.story.length,60);
});
