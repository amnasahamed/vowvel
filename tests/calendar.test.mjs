import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const source=await readFile(new URL('../src/Invitation.tsx',import.meta.url),'utf8');
// Exercise the actual download function without loading React or browser CSS.
const calendarSource=source.slice(source.indexOf('function calendar('),source.indexOf('\nfunction Scratch('));
const {calendar}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes('export '+calendarSource)).toString('base64'));

test('calendar download converts IST to UTC and escapes multiline user text',async()=>{
 const originals={document:globalThis.document,create:URL.createObjectURL,revoke:URL.revokeObjectURL,timer:globalThis.setTimeout};let blob;let clicked=false;
 URL.createObjectURL=value=>{blob=value;return 'blob:test'};URL.revokeObjectURL=()=>{};globalThis.setTimeout=()=>0;globalThis.document={createElement:()=>({click:()=>{clicked=true}})};
 try{
  calendar({id:'ceremony',name:'Wedding, dinner; joy\r\nA second line',date:'2027-02-14',time:'16:00',venue:'Hall',address:'City',note:''});
  assert.equal(clicked,true);const body=await blob.text();assert.match(body,/DTSTART:20270214T103000Z\r\n/);assert.match(body,/DTEND:20270214T123000Z\r\n/);assert.ok(body.includes('SUMMARY:Wedding\\, dinner\\; joy\\nA second line\r\n'));assert.ok(body.endsWith('END:VCALENDAR\r\n'));
  blob=undefined;calendar({id:'pending',name:'Pending',date:'',time:'',venue:'',address:'',note:''});assert.equal(blob,undefined);
  calendar({id:'invalid',name:'Invalid',date:'not-a-date',time:'16:00',venue:'',address:'',note:''});assert.equal(blob,undefined);
 }finally{globalThis.document=originals.document;URL.createObjectURL=originals.create;URL.revokeObjectURL=originals.revoke;globalThis.setTimeout=originals.timer}
});
