import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const waitlist = /publishing opens soon|payments and live publishing will open|payments are coming|publishing is not yet available|will be confirmed before (payments )?launch|after publishing launches/i;

test('storefront and public marketing no longer advertise a waitlist',async()=>{
  const files=[
    'src/App.tsx',
    'src/Checkout.tsx',
    'src/Editor.tsx',
    'src/SharingPreview.tsx',
    'src/Invitation.tsx',
    'public/llms.txt',
    'public/.well-known/agent-skills/commerce-assistant/SKILL.md',
    'README.md',
  ];
  for(const file of files){
    const text=await fs.readFile(file,'utf8');
    assert.doesNotMatch(text,waitlist,`${file} still has waitlist copy`);
  }
});

test('checkout never tells buyers about missing payment secrets',async()=>{
  const checkout=await fs.readFile('src/Checkout.tsx','utf8');
  const worker=await fs.readFile('worker/index.ts','utf8');
  assert.doesNotMatch(checkout,/Razorpay secrets|not configured yet|OTP_SECRET/i);
  assert.match(checkout,/support@vowvel\.com/);
  assert.doesNotMatch(worker,/Add Razorpay secrets|Razorpay secrets are not configured|OTP_SECRET is not configured/i);
});

test('homepage pricing states a live India total and international PayPal price',async()=>{
  const landing=await fs.readFile('src/App.tsx','utf8');
  assert.match(landing,/₹2,499/);
  assert.match(landing,/\$40/);
  assert.match(landing,/PayPal/);
  assert.match(landing,/Digital wedding invitation/);
  assert.match(landing,/Start free/);
  assert.match(landing,/Start with Gulmohar/);
  assert.match(landing,/\/create\/gulmohar/);
  assert.match(landing,/No app for guests/);
  assert.match(landing,/Hosting through your celebration/);
  assert.match(landing,/BEST FOR INDIAN WEDDINGS/);
  assert.match(landing,/Haldi, sangeet, wedding & reception/);
  assert.match(landing,/Less than one box of printed cards/);
  assert.match(landing,/landing-sticky-cta/);
  assert.doesNotMatch(landing,/Most couples finish/i);
  assert.doesNotMatch(landing,/incl(?:uding|\.)?\s+GST/i);
});

test('preview, editor and checkout make the free-to-paid path obvious',async()=>{
  const invitation=await fs.readFile('src/Invitation.tsx','utf8');
  const editor=await fs.readFile('src/Editor.tsx','utf8');
  const checkout=await fs.readFile('src/Checkout.tsx','utf8');
  const success=await fs.readFile('src/PaymentSuccess.tsx','utf8');
  assert.match(invitation,/Free to design · ₹2,499 to publish/);
  assert.match(invitation,/Start free draft/);
  assert.match(editor,/Draft free · ₹2,499 or \$40 internationally — publish when you(?:’|')re ready\./);
  assert.match(editor,/Ready to publish/);
  assert.match(checkout,/Your guests will open/);
  assert.match(success,/Share on WhatsApp/);
});
