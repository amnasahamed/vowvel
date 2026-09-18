import test from 'node:test';
import assert from 'node:assert/strict';
import {isLandingSection,parseLocationHash,readAppLocation} from '../src/hashRoute.ts';

test('known marketing hashes are landing sections, not app routes',()=>{
  assert.equal(isLandingSection('pricing'),true);
  assert.equal(isLandingSection('how-it-works'),true);
  assert.equal(isLandingSection('designs'),true);
  assert.equal(isLandingSection('blog'),false);
  assert.deepEqual(parseLocationHash('#pricing'),{route:'/',section:'pricing'});
  assert.deepEqual(parseLocationHash('#how-it-works'),{route:'/',section:'how-it-works'});
  assert.deepEqual(parseLocationHash('#designs'),{route:'/',section:'designs'});
  assert.deepEqual(parseLocationHash('#faq-refunds'),{route:'/',section:'faq-refunds'});
  assert.deepEqual(parseLocationHash('#/pricing'),{route:'/',section:'pricing'});
  assert.deepEqual(parseLocationHash('#/how-it-works'),{route:'/',section:'how-it-works'});
});

test('app routes that start with a slash stay routes',()=>{
  assert.deepEqual(parseLocationHash('#/blog'),{route:'/blog',section:null});
  assert.deepEqual(parseLocationHash('#/blog/gulmohar-palace-heritage-wedding-invitations'),{route:'/blog/gulmohar-palace-heritage-wedding-invitations',section:null});
  assert.deepEqual(parseLocationHash('#/create/gulmohar'),{route:'/create/gulmohar',section:null});
  assert.deepEqual(parseLocationHash('#/preview/conservatory?occasion=engagement'),{route:'/preview/conservatory?occasion=engagement',section:null});
  assert.deepEqual(parseLocationHash('#/checkout'),{route:'/checkout',section:null});
  assert.deepEqual(parseLocationHash('#/'),{route:'/',section:null});
  assert.deepEqual(parseLocationHash(''),{route:'/',section:null});
  assert.deepEqual(parseLocationHash('#'),{route:'/',section:null});
});

test('path equivalents /pricing and /how-it-works scroll when hash is empty',()=>{
  assert.deepEqual(readAppLocation('', '/pricing'),{route:'/',section:'pricing'});
  assert.deepEqual(readAppLocation('#', '/how-it-works'),{route:'/',section:'how-it-works'});
  assert.deepEqual(readAppLocation('#/blog', '/pricing'),{route:'/blog',section:null});
  assert.deepEqual(readAppLocation('#pricing', '/blog'),{route:'/',section:'pricing'});
});
