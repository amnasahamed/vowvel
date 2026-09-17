import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {sample,themes} from '../src/data.ts';
import {sharingDetails,sharingTags,sharingSvg} from '../src/sharing.ts';
test('metadata handles engagement, missing dates and special characters without injecting markup',()=>{
 const data={...sample,name1:'A </title><script>alert(1)</script>',name2:'B & C',occasion:'Engagement',events:[{...sample.events[0],date:'2027-02-30'}]};
 const meta=sharingDetails(data);assert.ok(meta.title.endsWith('Engagement invitation'));assert.equal(meta.date,'Date to be announced');
 const html=sharingTags(meta,'https://example.test/invitation/a/','https://example.test/og/a.png');
 assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));assert.ok(html.includes('property="og:image:width" content="1200"'));assert.ok(html.includes('noindex, nofollow'));
 assert.throws(()=>sharingTags(meta,'https://example.test/#/preview/a','/og/a.png'));
 assert.throws(()=>sharingTags(meta,'javascript:alert(1)','/og/a.png'));
 const svg=sharingSvg(data,themes[0],'data:image/png;base64,AA');assert.ok(!svg.includes('<script>'));assert.ok(svg.includes('B &amp; C'));
});
test('build emits crawler-readable tags and real PNGs for all five designs',async()=>{
 for(const theme of themes){const html=await fs.readFile(`dist/invitation/${theme.id}/index.html`,'utf8');assert.equal((html.match(/<title>/g)||[]).length,1);assert.equal((html.match(/name="description"/g)||[]).length,1);assert.ok(html.includes('Ishaan &amp; Ananya | Wedding invitation'));assert.ok(html.includes(`og/${theme.id}.png`));assert.ok(html.includes('rel="canonical"'));const m=await sharp(`dist/og/${theme.id}.png`).metadata();assert.equal(m.width,1200);assert.equal(m.height,630);assert.equal(m.format,'png')}
});
test('scratch invitations keep the date out of sharing text and images',()=>{
 const hidden=sharingDetails(sample);
 assert.equal(hidden.date,'Scratch to reveal our date');
 assert.ok(!hidden.description.includes('14 February 2027'));
 assert.ok(!sharingSvg(sample,themes[0],'').includes('14 February 2027'));
 assert.equal(sharingDetails({...sample,scratch:false}).date,'14 February 2027');
});
