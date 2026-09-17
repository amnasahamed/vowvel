export type AppRole='owner'|'admin'|'finance'|'support'|'content'|'influencer'|'customer';
export interface SessionUser{id:string;email:string;name:string;role:AppRole;status:string;csrfToken:string}

let csrfToken='';
export function setCsrf(value:string){csrfToken=value}

export class ApiRequestError extends Error{
  constructor(message:string,public status:number,public code:string){super(message)}
}

export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
  const headers=new Headers(options.headers);if(options.body&&!headers.has('content-type'))headers.set('content-type','application/json');if(csrfToken&&!['GET','HEAD'].includes(options.method||'GET'))headers.set('x-csrf-token',csrfToken);
  const response=await fetch(path,{...options,headers,credentials:'same-origin'});let data:unknown=null;try{data=await response.json()}catch{data=null}
  if(!response.ok){const record=data&&typeof data==='object'?data as Record<string,unknown>:{};throw new ApiRequestError(typeof record.error==='string'?record.error:'Request failed',response.status,typeof record.code==='string'?record.code:'request_failed');}
  return data as T;
}

export async function loadSession():Promise<SessionUser|null>{
  const result=await api<{user:SessionUser|null}>('/api/auth/me');if(result.user)setCsrf(result.user.csrfToken);return result.user;
}

export function formatMoney(cents:unknown,currency='INR'):string{
  const amount=typeof cents==='number'?cents:Number(cents)||0;return new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:2}).format(amount/100);
}

