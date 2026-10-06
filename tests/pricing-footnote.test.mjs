import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');

const PRICING_FOOTNOTE_NEW =
  'Hosting lasts at least through your wedding date and typically a year from publish, whichever is later.';
const PRICING_FOOTNOTE_OLD =
  'Hosting lasts through your celebration and a reasonable period after.';

test('pricing card footnote (VOW-46 #15) matches the FAQ hosting-duration copy', () => {
  const pricingFootnote = appSource.match(/<small>₹2,499 is the amount charged for India\.[\s\S]*?<\/small>/);
  assert.ok(pricingFootnote, 'pricing card footnote <small> must exist in src/App.tsx');
  assert.match(
    pricingFootnote[0],
    new RegExp(PRICING_FOOTNOTE_NEW.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    'pricing footnote must use the new copy that matches the FAQ',
  );
  assert.doesNotMatch(
    pricingFootnote[0],
    new RegExp(PRICING_FOOTNOTE_OLD.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    'pricing footnote must no longer carry the old vague "reasonable period" copy',
  );
});

test('FAQ and pricing footnote use the same hosting-duration phrase', () => {
  const faqMatches = appSource.match(/Hosting lasts at least through your wedding date and typically a year from publish/g) || [];
  assert.ok(
    faqMatches.length >= 2,
    'expected the "Hosting lasts at least through your wedding date and typically a year from publish" phrase to appear in both the FAQ and the pricing footnote',
  );
});