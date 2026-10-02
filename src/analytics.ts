export const FUNNEL_EVENTS=[
  'design_card_view',
  'design_card_click',
  'preview_open',
  'cover_sealed_broken',
  'preview_use_clicked',
  'editor_open',
  'editor_name_filled',
  'editor_tab_advanced',
  'editor_ready_to_publish_clicked',
  'editor_review_continue_clicked',
  'checkout_open',
  'otp_requested',
  'otp_verified',
  'subdomain_typed',
  'subdomain_available',
  'coupon_applied',
  'payment_initiated',
  'payment_succeeded',
  'invite_shared',
  'checkout_cta_blocked_help_shown',
  'checkout_error',
] as const;
export type FunnelEvent=typeof FUNNEL_EVENTS[number];
export type FunnelParams=Record<string,unknown>;
declare global{
  interface Window{
    gtag?:(...args:unknown[])=>void;
  }
}
function safePayload(eventName:string,params?:FunnelParams):{eventName:string;params:Record<string,unknown>;path:string;ts:number}{
  const safeParams:Record<string,unknown>={};
  if(params&&typeof params==='object'&&!Array.isArray(params)){
    for(const key of Object.keys(params).slice(0,30)){
      if(!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(key))continue;
      const value=(params as Record<string,unknown>)[key];
      if(value===undefined||value===null)continue;
      if(typeof value==='string')safeParams[key]=value.slice(0,200);
      else if(typeof value==='number'&&Number.isFinite(value))safeParams[key]=value;
      else if(typeof value==='boolean')safeParams[key]=value;
    }
  }
  let path='';
  try{path=typeof window!=='undefined'?(window.location?.hash||''):'';}catch{path='';}
  return {eventName,params:safeParams,path,ts:Date.now()};
}
export function track(eventName:string,params?:FunnelParams):void{
  try{
    const payload=safePayload(eventName,params);
    try{
      if(typeof window!=='undefined'&&typeof window.gtag==='function'){
        try{window.gtag('event',payload.eventName,payload.params);}catch{/* gtag may throw on bad params; swallow. */}
      }
    }catch{/* window access can throw in tests */}
    try{
      if(typeof fetch==='function'){
        void fetch('/api/funnel',{method:'POST',keepalive:true,headers:{'content-type':'application/json'},body:JSON.stringify(payload)}).catch(()=>undefined);
      }
    }catch{/* fetch can throw if globals are unavailable */}
  }catch{/* never block UI; never throw */}
}
export function trackStep(eventName:FunnelEvent,params?:FunnelParams):void{
  track(eventName,params);
}
export function __funnelInternal(eventName:string,params?:FunnelParams):void{
  track(eventName,params);
}