import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {stripTypeScriptTypes} from 'node:module';
import * as esbuild from 'esbuild';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import worker from '../worker/index.ts';
import {FUNNEL_EVENTS} from '../worker/funnel.ts';

const env={
  ENVIRONMENT:'test',
  DB:{prepare:()=>({bind:()=>({run:async()=>({meta:{changes:0}}),first:async()=>null,all:async()=>({results:[]})})})},
};
const ctx={waitUntil:()=>{}};

async function buildCheckoutBundle(){
  const tmpDir=await fs.mkdtemp(path.join(process.cwd(),'.tmp-checkout-bundle-'));
  const outFile=path.join(tmpDir,'checkout.bundle.mjs');
  await esbuild.build({
    entryPoints:['src/Checkout.tsx'],
    bundle:true,
    format:'esm',
    outfile:outFile,
    loader:Object.fromEntries(['.css','.png','.webp','.svg','.jpg','.jpeg','.woff','.woff2'].map(ext=>[ext,'empty'])),
    platform:'neutral',
    external:['react','react-dom','react-dom/server','@phosphor-icons/react','react/jsx-runtime','react/jsx-dev-runtime'],
    jsx:'automatic',
    target:'es2022',
    legalComments:'none',
    mainFields:['module','main'],
  });
  return {outFile,tmpDir};
}

test('GET /api/checkout/geo uses cf-provided country code when no override is supplied',async()=>{
  for(const [country,expected] of [['IN',{method:'razorpay',currency:'INR',source:'cf'}],['US',{method:'paypal',currency:'USD',source:'cf'}],['DE',{method:'paypal',currency:'USD',source:'cf'}]]){
    const request=new Request('https://vowvel.com/api/checkout/geo');
    Object.defineProperty(request,'cf',{value:{country},configurable:true});
    const res=await worker.fetch(request,env,ctx);
    assert.equal(res.status,200,`country=${country}`);
    assert.equal(res.headers.get('access-control-allow-origin'),'*');
    assert.deepEqual(await res.json(),expected);
  }
});

test('GET /api/checkout/geo honours the ?country= override',async()=>{
  for(const [country,expected] of [['IN',{method:'razorpay',currency:'INR',source:'override'}],['US',{method:'paypal',currency:'USD',source:'override'}],['JP',{method:'paypal',currency:'USD',source:'override'}]]){
    const res=await worker.fetch(new Request(`https://vowvel.com/api/checkout/geo?country=${country}`),env,ctx);
    assert.equal(res.status,200);
    assert.deepEqual(await res.json(),expected);
  }
});

test('GET /api/checkout/geo falls back to Razorpay/INR when no country is available',async()=>{
  const res=await worker.fetch(new Request('https://vowvel.com/api/checkout/geo'),env,ctx);
  assert.equal(res.status,200);
  assert.deepEqual(await res.json(),{method:'razorpay',currency:'INR',source:'fallback'});
});

test('GET /api/checkout/geo rejects bad country codes with 400 and code geo_invalid',async()=>{
  for(const bad of ['1','%2A','AB3','%E2%98%83']){
    const res=await worker.fetch(new Request(`https://vowvel.com/api/checkout/geo?country=${bad}`),env,ctx);
    assert.equal(res.status,400,`bad country=${bad}`);
    const body=await res.json();
    assert.equal(body.code,'geo_invalid');
  }
});

test('GET /api/checkout/geo requires the GET method',async()=>{
  const res=await worker.fetch(new Request('https://vowvel.com/api/checkout/geo',{method:'POST'}),env,ctx);
  assert.notEqual(res.status,200);
});

test('Checkout component source no longer calls ipapi.co',async()=>{
  const source=await fs.readFile('src/Checkout.tsx','utf8');
  assert.doesNotMatch(source,/ipapi\.co/);
});

test('Checkout component renders a segmented control with exactly one clickable control per payment method',async()=>{
  const {outFile,tmpDir}=await buildCheckoutBundle();
  try{
    const fileUrl=pathToFileURL(outFile);
    const mod=await import(fileUrl);
    const Checkout=mod.default;
    assert.equal(typeof Checkout,'function','Checkout should be a React component');
    const html=renderToStaticMarkup(React.createElement(Checkout));
    const buttons=[...html.matchAll(/<button[^>]*data-method="(razorpay|paypal)"[^>]*>/g)];
    assert.equal(buttons.length,2,`expected 2 buttons, got ${buttons.length}`);
    const methods=new Set(buttons.map(match=>match[1]));
    assert.deepEqual([...methods].sort(),['paypal','razorpay']);
    assert.match(html,/Razorpay/);
    assert.match(html,/PayPal/);
    assert.match(html,/₹2,499/);
    assert.match(html,/\$40/);
  }finally{
    await fs.rm(tmpDir,{recursive:true,force:true});
  }
});

function pathToFileURL(value){return new URL('file://'+value).href;}

test('payment_method_changed is in the worker and client funnel allowlists',async()=>{
  assert.ok(FUNNEL_EVENTS.includes('payment_method_changed'),'worker allowlist must include payment_method_changed');
  const analyticsSource=await fs.readFile('src/analytics.ts','utf8');
  const cleaned=stripTypeScriptTypes(analyticsSource).toString();
  assert.match(cleaned,/payment_method_changed/);
});

test('Checkout choosePayMethod fires payment_method_changed and switches the displayed currency symbol',async()=>{
  const source=await fs.readFile('src/Checkout.tsx','utf8');
  assert.match(source,/function choosePayMethod\(method:PayMethod\)/);
  assert.match(source,setPayMethodRegex());
  assert.match(source,/setCurrency\(method==='paypal'\?'USD':'INR'\)/);
  assert.match(source,/trackStep\('payment_method_changed'/);
  assert.match(source,setCurrencyRegex());
  assert.match(source,currencySymbolRegex());
});

function setPayMethodRegex(){return new RegExp("setPayMethod\\(method\\)");}
function setCurrencyRegex(){return new RegExp("setCurrency\\(method==='paypal'\\?'USD':'INR'\\)");}
function currencySymbolRegex(){return new RegExp("formatMoney\\(shown\\.totalCents,currency\\)|formatMoney\\(shown\\.subtotalCents,currency\\)");}
