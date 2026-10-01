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
  'checkout_error',
  'payment_method_changed',
] as const;
export type FunnelEventName=typeof FUNNEL_EVENTS[number];
export const FUNNEL_ALLOWLIST:Set<string>=new Set<string>(FUNNEL_EVENTS);
export function isFunnelEvent(value:unknown):value is FunnelEventName{
  return typeof value==='string'&&FUNNEL_ALLOWLIST.has(value);
}
const FORBIDDEN_PARAM_KEYS=new Set(['email','name','phone','address','message','token','password','secret','csrf','cookie','authorization','user_agent','useragent']);
function sanitizeParamKey(key:unknown):string{
  if(typeof key!=='string')return '';
  const cleaned=key.trim().toLowerCase().slice(0,40);
  if(!cleaned||FORBIDDEN_PARAM_KEYS.has(cleaned))return '';
  if(!/^[a-z0-9_]+$/i.test(cleaned))return '';
  return cleaned;
}
function sanitizeParamValue(value:unknown):unknown{
  if(value===null||value===undefined)return undefined;
  if(typeof value==='string')return value.slice(0,200);
  if(typeof value==='number')return Number.isFinite(value)?value:undefined;
  if(typeof value==='boolean')return value;
  return undefined;
}
export function sanitizeFunnelParams(params:unknown):Record<string,unknown>{
  const out:Record<string,unknown>={};
  if(!params||typeof params!=='object'||Array.isArray(params))return out;
  const source=params as Record<string,unknown>;
  for(const key of Object.keys(source).slice(0,30)){
    const safeKey=sanitizeParamKey(key);
    if(!safeKey)continue;
    const safeValue=sanitizeParamValue(source[key]);
    if(safeValue===undefined)continue;
    out[safeKey]=safeValue;
  }
  return out;
}
export function sanitizeFunnelPath(path:unknown):string{
  if(typeof path!=='string')return '';
  return path.slice(0,200);
}
export interface FunnelPayload{eventName:string;params:Record<string,unknown>;path:string;ts:number}
export function parseFunnelBody(body:unknown):FunnelPayload|null{
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const record=body as Record<string,unknown>;
  if(!isFunnelEvent(record.eventName))return null;
  const tsRaw=record.ts;
  const ts=typeof tsRaw==='number'?tsRaw:typeof tsRaw==='string'?Number(tsRaw)||Date.now():Date.now();
  return {
    eventName:record.eventName as FunnelEventName,
    params:sanitizeFunnelParams(record.params),
    path:sanitizeFunnelPath(record.path),
    ts,
  };
}
export function buildFunnelLogLine(payload:FunnelPayload):string{
  const entry={
    level:'info',
    event:'funnel',
    eventName:payload.eventName,
    params:payload.params,
    path:payload.path,
  };
  return JSON.stringify(entry);
}