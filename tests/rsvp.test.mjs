import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRsvpInput} from '../worker/domain.ts';

const events=['ceremony','reception'];

test('RSVP accepts a complete attending response',()=>{
  assert.deepEqual(normalizeRsvpInput({guestName:'  Asha Rao ',email:'ASHA@example.com',attendance:'yes',partySize:2,eventIds:['ceremony','reception','ceremony'],guestNames:' Ravi Rao ',dietaryNotes:' Jain ',message:' See you! '},events),{guestName:'Asha Rao',email:'asha@example.com',attendance:'yes',partySize:2,eventIds:['ceremony','reception'],guestNames:'Ravi Rao',dietaryNotes:'Jain',message:'See you!'});
});

test('RSVP decline removes attendance-only details',()=>{
  assert.deepEqual(normalizeRsvpInput({guestName:'Mina',attendance:'no',partySize:19,eventIds:[],guestNames:'Someone',dietaryNotes:'None'},events),{guestName:'Mina',email:'',attendance:'no',partySize:0,eventIds:[],guestNames:'',dietaryNotes:'',message:''});
});

test('RSVP rejects unknown or missing event selections',()=>{
  assert.throws(()=>normalizeRsvpInput({guestName:'Asha',attendance:'yes',partySize:1,eventIds:[]},events),/at least one event/i);
  assert.throws(()=>normalizeRsvpInput({guestName:'Asha',attendance:'yes',partySize:1,eventIds:['private-event']},events),/valid event/i);
});

test('RSVP rejects malformed contact and party values',()=>{
  assert.throws(()=>normalizeRsvpInput({guestName:'Asha',email:'not-an-email',attendance:'yes',partySize:1,eventIds:['ceremony']},events),/valid email/i);
  assert.throws(()=>normalizeRsvpInput({guestName:'Asha',attendance:'yes',partySize:21,eventIds:['ceremony']},events),/party size/i);
});
