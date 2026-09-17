import {calculateCommission,calculateQuote,csvCell,generateCouponCode,normalizeCouponCode,normalizeRsvpInput,type CouponRule} from './domain.ts';
import {clearSessionCookie,constantTimeEqual,hashPassword,hmacHex,isValidEmail,parseCookie,randomToken,sessionCookie,sha256} from './security.ts';
import {flushEmailOutbox,otpEmail,purchaseEmail,redemptionEmail,sendTransactional,type EmailContent} from './email.ts';
import {PAYPAL_CURRENCY,PAYPAL_PRICE_CENTS,capturePayPalOrder,createPayPalOrder,parsePayPalCaptureEvent,paypalAccessToken,refundPayPalCapture,requirePayPalCredentials,verifyPayPalWebhook} from './paypal.ts';


type Role='owner'|'admin'|'finance'|'support'|'content'|'influencer'|'customer';
type UserStatus='active'|'pending'|'suspended'|'disabled';
type RuntimeEnv=Omit<CloudflareEnv,'ENVIRONMENT'>&{
  ENVIRONMENT:string;
  ADMIN_EMAIL?:string;
  OTP_SECRET?:string;
  PUBLIC_APP_URL?:string;
  EMAIL_FROM?:string;
  RAZORPAY_KEY_ID?:string;
  RAZORPAY_KEY_SECRET?:string;
  RAZORPAY_WEBHOOK_SECRET?:string;
  PAYPAL_CLIENT_ID?:string;
  PAYPAL_CLIENT_SECRET?:string;
  PAYPAL_WEBHOOK_ID?:string;
  PAYPAL_API_BASE?:string;
};
interface AuthUser{id:string;email:string;name:string;role:Role;status:UserStatus;csrfToken:string}
interface SessionRow{id:string;user_id:string;email:string;name:string;role:Role;status:UserStatus;csrf_token:string}
interface CommerceSettings{basePriceCents:number;currency:string;taxBps:number;commissionHoldDays:number;minimumPayoutCents:number}
interface CouponRow{id:string;campaign_id:string;code:string;influencer_id:string|null;status:string;max_redemptions:number|null;reserved_count:number;redeemed_count:number;campaign_status:string;discount_type:'percentage'|'fixed';discount_value:number;max_discount_cents:number|null;min_subtotal_cents:number;starts_at:string|null;ends_at:string|null;global_limit:number|null;per_customer_limit:number;first_purchase_only:number;commission_bps:number}
interface PublishedInvitationRow{id:string;owner_id:string;slug:string;state:string;data_json:string}

class ApiError extends Error{
  status:number;
  code:string;
  constructor(status:number,message:string,code='bad_request'){
    super(message);
    this.status=status;
    this.code=code;
  }
}

const jsonHeaders={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'same-origin'};
function json(data:unknown,status=200,headers:HeadersInit={}):Response{return new Response(JSON.stringify(data),{status,headers:{...jsonHeaders,...headers}})}
function cleanText(value:unknown,max:number):string{return typeof value==='string'?value.trim().slice(0,max):''}
function integer(value:unknown,min:number,max:number,fallback?:number):number{
  const number=typeof value==='number'?value:Number(value);
  if(!Number.isInteger(number)||number<min||number>max){if(fallback!==undefined)return fallback;throw new ApiError(400,`Expected an integer between ${min} and ${max}`);}
  return number;
}
function id(prefix:string):string{return `${prefix}_${crypto.randomUUID()}`}
function nowIso():string{return new Date().toISOString()}
function money(cents:number,currency='INR'):string{return new Intl.NumberFormat('en-IN',{style:'currency',currency}).format(cents/100)}
function emailStatement(env:RuntimeEnv,eventKey:string,message:EmailContent):D1PreparedStatement{return env.DB.prepare(`INSERT OR IGNORE INTO email_outbox(id,recipient,subject,text_body,html_body,event_key) VALUES(?,?,?,?,?,?)`).bind(id('email'),message.to,message.subject,message.text,message.html,eventKey)}

async function readBody(request:Request,limit=64_000):Promise<ArrayBuffer>{
  const declared=Number(request.headers.get('content-length')||0);if(declared>limit)throw new ApiError(413,'Request is too large');
  const reader=request.body?.getReader();if(!reader)return new ArrayBuffer(0);
  const chunks:Uint8Array[]=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();throw new ApiError(413,'Request is too large');}chunks.push(value);}
  const joined=new Uint8Array(total);let offset=0;for(const chunk of chunks){joined.set(chunk,offset);offset+=chunk.byteLength;}return joined.buffer;
}
async function readJson(request:Request,limit=64_000):Promise<Record<string,unknown>>{
  const raw=await readBody(request,limit);if(!raw.byteLength)return {};
  try{const value:unknown=JSON.parse(new TextDecoder().decode(raw));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();return value as Record<string,unknown>;}catch{throw new ApiError(400,'Invalid JSON body');}
}
async function responseJson(response:Response,limit=64_000):Promise<Record<string,unknown>>{
  const raw=await response.arrayBuffer();if(raw.byteLength>limit)throw new Error('Provider response exceeded limit');
  const value:unknown=JSON.parse(new TextDecoder().decode(raw));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid provider response');return value as Record<string,unknown>;
}
function requireSameOrigin(request:Request):void{
  if(!['POST','PATCH','PUT','DELETE'].includes(request.method))return;
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new ApiError(403,'Cross-origin request rejected','origin_rejected');
}
async function getSession(request:Request,env:RuntimeEnv):Promise<AuthUser|null>{
  const token=parseCookie(request,'vowvel_session');if(!token)return null;const tokenHash=await sha256(token);
  const row=await env.DB.prepare(`SELECT s.id,s.user_id,u.email,u.name,u.role,u.status,s.csrf_token FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP`).bind(tokenHash).first<SessionRow>();
  if(!row||row.status!=='active')return null;
  return {id:row.user_id,email:row.email,name:row.name,role:row.role,status:row.status,csrfToken:row.csrf_token};
}
function requireRole(user:AuthUser|null,roles:Role[]):AuthUser{if(!user)throw new ApiError(401,'Sign in required','unauthorized');if(!roles.includes(user.role))throw new ApiError(403,'You do not have permission for this action','forbidden');return user;}
function requireCsrf(request:Request,user:AuthUser):void{if(!constantTimeEqual(request.headers.get('x-csrf-token')||'',user.csrfToken))throw new ApiError(403,'Security token is missing or expired','csrf_failed');}
async function audit(env:RuntimeEnv,request:Request,actorId:string|null,action:string,targetType:string,targetId:string|null,before:unknown,after:unknown,reason=''):Promise<void>{
  const ip=request.headers.get('cf-connecting-ip');const ipHash=ip?await sha256(ip):null;
  await env.DB.prepare(`INSERT INTO audit_logs(id,actor_id,action,target_type,target_id,before_json,after_json,reason,ip_hash) VALUES(?,?,?,?,?,?,?,?,?)`).bind(id('audit'),actorId,action,targetType,targetId,before===null?null:JSON.stringify(before),after===null?null:JSON.stringify(after),reason||null,ipHash).run();
}
async function settings(env:RuntimeEnv):Promise<CommerceSettings>{
  const row=await env.DB.prepare(`SELECT value_json FROM app_settings WHERE key='commerce'`).first<{value_json:string}>();
  if(!row)throw new ApiError(503,'Commerce settings are unavailable');return JSON.parse(row.value_json) as CommerceSettings;
}
async function createSession(env:RuntimeEnv,request:Request,userId:string):Promise<{token:string;csrf:string;ttl:number}>{
  const token=randomToken();const csrf=randomToken(24);const ttl=Math.max(1,Math.min(30,Number(env.SESSION_TTL_DAYS)||14))*86400;
  const expires=new Date(Date.now()+ttl*1000).toISOString();const ip=request.headers.get('cf-connecting-ip');
  await env.DB.prepare(`INSERT INTO sessions(id,user_id,token_hash,csrf_token,expires_at,ip_hash,user_agent) VALUES(?,?,?,?,?,?,?)`).bind(id('session'),userId,await sha256(token),csrf,expires,ip?await sha256(ip):null,cleanText(request.headers.get('user-agent'),500)).run();
  return {token,csrf,ttl};
}
async function enforceRateLimit(env:RuntimeEnv,request:Request,action:string,limit:number,windowSeconds:number):Promise<void>{
  const bucketStart=Math.floor(Date.now()/1000/windowSeconds)*windowSeconds;const source=request.headers.get('cf-connecting-ip')||'local';const key=await sha256(`${action}:${source}`);
  await env.DB.prepare(`INSERT INTO rate_limits(key,bucket_start,request_count) VALUES(?,?,1) ON CONFLICT(key,bucket_start) DO UPDATE SET request_count=request_count+1`).bind(key,bucketStart).run();const row=await env.DB.prepare(`SELECT request_count FROM rate_limits WHERE key=? AND bucket_start=?`).bind(key,bucketStart).first<{request_count:number}>();if((row?.request_count||0)>limit)throw new ApiError(429,'Too many attempts. Please try again later.','rate_limited');
}
function publicUser(user:{id:string;email:string;name:string;role:Role;status:UserStatus},csrfToken?:string){return {id:user.id,email:user.email,name:user.name,role:user.role,status:user.status,...(csrfToken?{csrfToken}:{})}}
const reservedSubdomains=new Set(['www','api','admin','app','mail','email','support','help','status','cdn','assets','static','billing','checkout','login','signin','account','dashboard','partner','partners']);
function subdomain(value:unknown):string{const label=cleanText(value,40).toLowerCase().replace(/[^a-z0-9-]/g,'').replace(/^-+|-+$/g,'');if(label.length<3||label.length>40||reservedSubdomains.has(label)||!/[a-z]/.test(label))throw new ApiError(400,'Choose 3 to 40 letters, numbers or hyphens','invalid_subdomain');return label}

async function authRoutes(request:Request,env:RuntimeEnv,path:string):Promise<Response|null>{
  if((path==='/api/auth/login'||path==='/api/auth/register')&&request.method==='POST')throw new ApiError(410,'Password sign-in has been replaced by an email code.','password_auth_retired');
  if(path==='/api/auth/otp/request'&&request.method==='POST'){
    const body=await readJson(request);const email=cleanText(body.email,254).toLowerCase();const purpose=body.purpose==='partner'?'partner':body.purpose==='admin'?'admin':body.purpose==='customer'?'customer':'';
    if(!isValidEmail(email)||!purpose)throw new ApiError(400,'A valid email and sign-in area are required');if(!env.OTP_SECRET)throw new ApiError(503,'OTP_SECRET is not configured');
    await enforceRateLimit(env,request,`otp_request:${purpose}`,5,900);await enforceRateLimit(env,request,`otp_email:${purpose}:${email}`,5,900);
    let eligible=email===cleanText(env.ADMIN_EMAIL,254).toLowerCase()&&purpose==='admin';
    if(purpose==='admin'&&!eligible){const staff=await env.DB.prepare(`SELECT id FROM users WHERE email=? AND role IN ('owner','admin','finance','support','content') AND status='active'`).bind(email).first();eligible=Boolean(staff);}
    if(purpose==='partner'){const partner=await env.DB.prepare(`SELECT id FROM users WHERE email=? AND role='influencer' AND status='active'`).bind(email).first();eligible=Boolean(partner);}
    if(purpose==='customer')eligible=true;
    if(eligible){const challengeId=id('otp');const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1_000_000).padStart(6,'0');const codeHash=await hmacHex(env.OTP_SECRET,`${challengeId}:${purpose}:${email}:${code}`);const expiresAt=new Date(Date.now()+10*60_000).toISOString();const ip=request.headers.get('cf-connecting-ip');await env.DB.batch([env.DB.prepare(`UPDATE otp_challenges SET consumed_at=CURRENT_TIMESTAMP WHERE email=? AND purpose=? AND consumed_at IS NULL`).bind(email,purpose),env.DB.prepare(`INSERT INTO otp_challenges(id,email,purpose,code_hash,expires_at,ip_hash) VALUES(?,?,?,?,?,?)`).bind(challengeId,email,purpose,codeHash,expiresAt,ip?await sha256(ip):null)]);try{await sendTransactional(env,otpEmail(email,code));}catch(error){await env.DB.prepare(`DELETE FROM otp_challenges WHERE id=?`).bind(challengeId).run();console.error(JSON.stringify({level:'error',task:'otp_email',message:String(error)}));throw new ApiError(503,'The sign-in email could not be sent. Try again shortly.','email_unavailable');}}
    return json({ok:true,message:'If this email has access, a six-digit code has been sent.'});
  }
  if(path==='/api/auth/otp/verify'&&request.method==='POST'){
    const body=await readJson(request);const email=cleanText(body.email,254).toLowerCase();const purpose=body.purpose==='partner'?'partner':body.purpose==='admin'?'admin':body.purpose==='customer'?'customer':'';const code=cleanText(body.code,6);
    if(!isValidEmail(email)||!purpose||!/^\d{6}$/.test(code))throw new ApiError(400,'Enter the six-digit code');if(!env.OTP_SECRET)throw new ApiError(503,'OTP_SECRET is not configured');await enforceRateLimit(env,request,`otp_verify:${purpose}`,10,900);
    const challenge=await env.DB.prepare(`SELECT id,code_hash,attempts,expires_at FROM otp_challenges WHERE email=? AND purpose=? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1`).bind(email,purpose).first<{id:string;code_hash:string;attempts:number;expires_at:string}>();if(!challenge||challenge.attempts>=5||new Date(challenge.expires_at).getTime()<=Date.now())throw new ApiError(401,'The code is invalid or expired','otp_invalid');await env.DB.prepare(`UPDATE otp_challenges SET attempts=attempts+1 WHERE id=?`).bind(challenge.id).run();const expected=await hmacHex(env.OTP_SECRET,`${challenge.id}:${purpose}:${email}:${code}`);if(!constantTimeEqual(expected,challenge.code_hash))throw new ApiError(401,'The code is invalid or expired','otp_invalid');
    let user=await env.DB.prepare(`SELECT id,email,name,role,status FROM users WHERE email=?`).bind(email).first<{id:string;email:string;name:string;role:Role;status:UserStatus}>();
    if(purpose==='admin'){const primaryAdmin=email===cleanText(env.ADMIN_EMAIL,254).toLowerCase();if(primaryAdmin&&!user){const userId=id('user');const disabledPasswordHash=await sha256(randomToken());await env.DB.batch([env.DB.prepare(`INSERT OR IGNORE INTO setup_state(key) VALUES('owner_bootstrap')`),env.DB.prepare(`INSERT INTO users(id,email,password_hash,password_salt,name,role,status,email_verified_at) VALUES(?,?,?,?,?,'owner','active',CURRENT_TIMESTAMP)`).bind(userId,email,disabledPasswordHash,randomToken(16),'Vowvel Owner')]);user={id:userId,email,name:'Vowvel Owner',role:'owner',status:'active'};}else if(primaryAdmin&&user&&(user.role!=='owner'||user.status!=='active')){await env.DB.prepare(`UPDATE users SET role='owner',status='active',email_verified_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(user.id).run();user={...user,role:'owner',status:'active'};}else if(!user||!['owner','admin','finance','support','content'].includes(user.role)||user.status!=='active')throw new ApiError(403,'This email does not have admin access');}
    if(purpose==='customer'){if(!user){const name=cleanText(body.name,100);if(!name)throw new ApiError(400,'Enter your name to create your account','name_required');const userId=id('user');await env.DB.prepare(`INSERT INTO users(id,email,password_hash,password_salt,name,role,status,email_verified_at) VALUES(?,?,?,?,?,'customer','active',CURRENT_TIMESTAMP)`).bind(userId,email,await sha256(randomToken()),randomToken(16),name).run();user={id:userId,email,name,role:'customer',status:'active'};}else if(user.role!=='customer'||user.status!=='active')throw new ApiError(403,'This email belongs to a different account area');}
    if(purpose==='partner'&&(!user||user.role!=='influencer'||user.status!=='active'))throw new ApiError(403,'This partner account is not active');if(!user)throw new ApiError(403,'Account access is unavailable');const consumed=await env.DB.prepare(`UPDATE otp_challenges SET consumed_at=CURRENT_TIMESTAMP WHERE id=? AND consumed_at IS NULL`).bind(challenge.id).run();if((consumed.meta.changes||0)!==1)throw new ApiError(401,'The code was already used','otp_used');const session=await createSession(env,request,user.id);await audit(env,request,user.id,'auth.otp_login','user',user.id,null,{purpose});return json({user:publicUser(user,session.csrf)},200,{'set-cookie':sessionCookie(session.token,session.ttl,env.ENVIRONMENT==='production')});
  }
  if(path==='/api/auth/me'&&request.method==='GET'){
    const user=await getSession(request,env);return json({user:user?publicUser(user,user.csrfToken):null});
  }
  if(path==='/api/auth/logout'&&request.method==='POST'){
    const user=await getSession(request,env);if(user)requireCsrf(request,user);const token=parseCookie(request,'vowvel_session');if(token)await env.DB.prepare(`DELETE FROM sessions WHERE token_hash=?`).bind(await sha256(token)).run();
    return json({ok:true},200,{'set-cookie':clearSessionCookie(env.ENVIRONMENT==='production')});
  }
  return null;
}

async function influencerApply(request:Request,env:RuntimeEnv):Promise<Response>{
  await enforceRateLimit(env,request,'influencer_apply',5,3600);
  const body=await readJson(request);const email=cleanText(body.email,254).toLowerCase();const name=cleanText(body.name,100);const bio=cleanText(body.bio,1200);const channel=cleanText(body.channel,300);const audienceSize=integer(body.audienceSize,0,100000000,0);
  if(!isValidEmail(email)||!name||!channel)throw new ApiError(400,'Name, valid email and primary channel are required');const passwordData=await hashPassword(randomToken());const userId=id('user');
  try{await env.DB.batch([
    env.DB.prepare(`INSERT INTO users(id,email,password_hash,password_salt,name,role,status) VALUES(?,?,?,?,?,'influencer','pending')`).bind(userId,email,passwordData.hash,passwordData.salt,name),
    env.DB.prepare(`INSERT INTO influencer_profiles(user_id,bio,channels_json,audience_size) VALUES(?,?,?,?)`).bind(userId,bio,JSON.stringify([channel]),audienceSize),
  ]);}catch{throw new ApiError(409,'An account with this email already exists');}
  await audit(env,request,userId,'influencer.apply','influencer',userId,null,{email,channel,audienceSize});return json({ok:true,message:'Application received. You can sign in after approval.'},201);
}

async function findCoupon(env:RuntimeEnv,code:string):Promise<CouponRow|null>{
  return env.DB.prepare(`SELECT cc.*,c.status campaign_status,c.discount_type,c.discount_value,c.max_discount_cents,c.min_subtotal_cents,c.starts_at,c.ends_at,c.global_limit,c.per_customer_limit,c.first_purchase_only,c.commission_bps FROM coupon_codes cc JOIN coupon_campaigns c ON c.id=cc.campaign_id WHERE cc.code=?`).bind(normalizeCouponCode(code)).first<CouponRow>();
}
async function releaseExpiredReservations(env:RuntimeEnv):Promise<void>{
  const expired=await env.DB.prepare(`SELECT coupon_code_id,COUNT(*) count FROM coupon_redemptions WHERE status='reserved' AND reserved_until<=CURRENT_TIMESTAMP GROUP BY coupon_code_id`).all<{coupon_code_id:string;count:number}>();
  for(const row of expired.results){await env.DB.batch([env.DB.prepare(`UPDATE coupon_codes SET reserved_count=MAX(0,reserved_count-?) WHERE id=?`).bind(row.count,row.coupon_code_id),env.DB.prepare(`UPDATE coupon_redemptions SET status='released' WHERE coupon_code_id=? AND status='reserved' AND reserved_until<=CURRENT_TIMESTAMP`).bind(row.coupon_code_id)]);}
}
async function validateCoupon(env:RuntimeEnv,userId:string|null,code:string,subtotalCents:number):Promise<{row:CouponRow;rule:CouponRule}>{
  const row=await findCoupon(env,code);if(!row||row.status!=='active'||row.campaign_status!=='active')throw new ApiError(422,'Coupon is not active','coupon_inactive');const now=Date.now();
  if(row.starts_at&&new Date(row.starts_at).getTime()>now)throw new ApiError(422,'Coupon has not started','coupon_not_started');if(row.ends_at&&new Date(row.ends_at).getTime()<now)throw new ApiError(422,'Coupon has expired','coupon_expired');
  if(subtotalCents<row.min_subtotal_cents)throw new ApiError(422,'Order does not meet the coupon minimum','coupon_minimum');
  if(row.max_redemptions!==null&&row.reserved_count+row.redeemed_count>=row.max_redemptions)throw new ApiError(422,'Coupon usage limit reached','coupon_exhausted');
  if(row.global_limit!==null){const total=await env.DB.prepare(`SELECT COUNT(*) count FROM coupon_redemptions WHERE campaign_id=? AND status IN ('reserved','used')`).bind(row.campaign_id).first<{count:number}>();if((total?.count||0)>=row.global_limit)throw new ApiError(422,'Campaign usage limit reached','campaign_exhausted');}
  if(userId){const used=await env.DB.prepare(`SELECT COUNT(*) count FROM coupon_redemptions WHERE campaign_id=? AND user_id=? AND status IN ('reserved','used')`).bind(row.campaign_id,userId).first<{count:number}>();if((used?.count||0)>=row.per_customer_limit)throw new ApiError(422,'You have already used this offer','customer_limit');if(row.first_purchase_only){const orders=await env.DB.prepare(`SELECT COUNT(*) count FROM orders WHERE user_id=? AND state='paid'`).bind(userId).first<{count:number}>();if((orders?.count||0)>0)throw new ApiError(422,'Coupon is for first purchases only','first_purchase_only');}}
  return {row,rule:{discountType:row.discount_type,discountValue:row.discount_value,maxDiscountCents:row.max_discount_cents,minSubtotalCents:row.min_subtotal_cents}};
}

async function publishedInvitation(env:RuntimeEnv,slug:string):Promise<{row:PublishedInvitationRow;payload:Record<string,unknown>}>
{
  const row=await env.DB.prepare(`SELECT i.id,i.owner_id,i.slug,i.state,r.data_json FROM invitations i JOIN invitation_revisions r ON r.id=i.published_revision_id WHERE i.slug=? OR i.custom_subdomain=?`).bind(slug,slug).first<PublishedInvitationRow>();
  if(!row||row.state!=='published')throw new ApiError(404,'Invitation not found');
  const metadata=JSON.parse(row.data_json) as {r2Key?:string};
  if(!metadata.r2Key)throw new ApiError(503,'Invitation content is unavailable');
  const object=await env.MEDIA.get(metadata.r2Key);
  if(!object)throw new ApiError(404,'Invitation not found');
  const value:unknown=await object.json();
  if(!value||typeof value!=='object'||Array.isArray(value))throw new ApiError(503,'Invitation content is unavailable');
  return {row,payload:value as Record<string,unknown>};
}

function publishedEvents(payload:Record<string,unknown>):Array<{id:string;name:string}>{
  const data=payload.data&&typeof payload.data==='object'&&!Array.isArray(payload.data)?payload.data as Record<string,unknown>:payload;
  if(!Array.isArray(data.events))return [];
  return data.events.flatMap(event=>{
    if(!event||typeof event!=='object'||Array.isArray(event))return [];
    const record=event as Record<string,unknown>;const idValue=cleanText(record.id,100).replace(/[^A-Za-z0-9_-]/g,'');
    return idValue?[{id:idValue,name:cleanText(record.name,80)||'Celebration'}]:[];
  }).slice(0,8);
}

async function commerceRoutes(request:Request,env:RuntimeEnv,path:string,user:AuthUser|null,ctx:ExecutionContext):Promise<Response|null>{
  const subdomainMatch=path.match(/^\/api\/subdomains\/([A-Za-z0-9-]{1,50})$/);
  if(subdomainMatch&&request.method==='GET'){const label=subdomain(subdomainMatch[1]);const existing=await env.DB.prepare(`SELECT id FROM invitations WHERE custom_subdomain=?`).bind(label).first();return json({label,available:!existing,url:`https://${label}.vowvel.com`});}
  const rsvpMatch=path.match(/^\/api\/invitations\/([A-Za-z0-9_-]{8,80})\/rsvp$/);
  if(rsvpMatch&&request.method==='POST'){
    await enforceRateLimit(env,request,`rsvp:${rsvpMatch[1]}`,30,3600);
    const body=await readJson(request,8_000);
    if(cleanText(body.website,200))return json({ok:true},201);
    const invitation=await publishedInvitation(env,rsvpMatch[1]);const events=publishedEvents(invitation.payload);let response:ReturnType<typeof normalizeRsvpInput>;
    try{response=normalizeRsvpInput(body,events.map(event=>event.id));}catch(error){throw new ApiError(400,error instanceof Error?error.message:'Check your reply details','invalid_rsvp');}
    const eventNames=new Map(events.map(event=>[event.id,event.name]));const editToken=cleanText(body.editToken,200);let rsvpId:string;let token:string;let created=false;
    if(editToken){
      const existing=await env.DB.prepare(`SELECT id FROM rsvp_submissions WHERE invitation_id=? AND edit_token_hash=?`).bind(invitation.row.id,await sha256(editToken)).first<{id:string}>();
      if(!existing)throw new ApiError(403,'This saved reply can no longer be edited. Submit a new reply instead.','rsvp_edit_invalid');
      rsvpId=existing.id;token=editToken;
      await env.DB.batch([
        env.DB.prepare(`UPDATE rsvp_submissions SET guest_name=?,email=?,attendance=?,party_size=?,guest_names=?,dietary_notes=?,message=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(response.guestName,response.email||null,response.attendance,response.partySize,response.guestNames,response.dietaryNotes,response.message,rsvpId),
        env.DB.prepare(`DELETE FROM rsvp_event_selections WHERE rsvp_id=?`).bind(rsvpId),
        ...response.eventIds.map(eventId=>env.DB.prepare(`INSERT INTO rsvp_event_selections(rsvp_id,event_id,event_name) VALUES(?,?,?)`).bind(rsvpId,eventId,eventNames.get(eventId)||'Celebration')),
      ]);
    }else{
      rsvpId=id('rsvp');token=randomToken(32);created=true;
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO rsvp_submissions(id,invitation_id,edit_token_hash,guest_name,email,attendance,party_size,guest_names,dietary_notes,message) VALUES(?,?,?,?,?,?,?,?,?,?)`).bind(rsvpId,invitation.row.id,await sha256(token),response.guestName,response.email||null,response.attendance,response.partySize,response.guestNames,response.dietaryNotes,response.message),
        ...response.eventIds.map(eventId=>env.DB.prepare(`INSERT INTO rsvp_event_selections(rsvp_id,event_id,event_name) VALUES(?,?,?)`).bind(rsvpId,eventId,eventNames.get(eventId)||'Celebration')),
      ]);
    }
    console.log(JSON.stringify({level:'info',event:'rsvp_saved',invitationId:invitation.row.id,rsvpId,created,attendance:response.attendance,partySize:response.partySize}));
    return json({ok:true,id:rsvpId,editToken:token,created,updatedAt:nowIso()},created?201:200);
  }
  const invitationMatch=path.match(/^\/api\/invitations\/([A-Za-z0-9_-]{8,80})$/);
  if(invitationMatch&&request.method==='GET'){
    const invitation=await publishedInvitation(env,invitationMatch[1]);return json(invitation.payload,200,{'cache-control':'public, max-age=300'});
  }
  if(path==='/api/coupons/quote'&&request.method==='POST'){
    await releaseExpiredReservations(env);
    const body=await readJson(request);const method=body.method==='paypal'?'paypal':'razorpay';
    if(method==='paypal'){
      if(cleanText(body.code,64))throw new ApiError(422,'Coupons are not supported for PayPal orders yet','coupon_unsupported');
      return json({quote:{subtotalCents:PAYPAL_PRICE_CENTS,discountCents:0,taxableCents:PAYPAL_PRICE_CENTS,taxCents:0,totalCents:PAYPAL_PRICE_CENTS},currency:PAYPAL_CURRENCY,method:'paypal',coupon:null});
    }
    const code=cleanText(body.code,64);const config=await settings(env);const coupon=code?await validateCoupon(env,user?.id||null,code,config.basePriceCents):null;const quote=calculateQuote(config.basePriceCents,config.taxBps,coupon?.rule||null);
    return json({quote,currency:config.currency,method:'razorpay',coupon:coupon?{code:coupon.row.code,campaignId:coupon.row.campaign_id}:null});
  }
  if(path==='/api/orders'&&request.method==='POST'){
    await releaseExpiredReservations(env);
    const customer=requireRole(user,['customer']);requireCsrf(request,customer);const body=await readJson(request,15_000_000);const code=cleanText(body.code,64);const chosenSubdomain=subdomain(body.subdomain);const taken=await env.DB.prepare(`SELECT id FROM invitations WHERE custom_subdomain=?`).bind(chosenSubdomain).first();if(taken)throw new ApiError(409,'That invitation address was just taken. Choose another.','subdomain_taken');const invitationPayload=body.invitation;if(!invitationPayload||typeof invitationPayload!=='object'||Array.isArray(invitationPayload))throw new ApiError(400,'Invitation details are required');const serializedInvitation=JSON.stringify(invitationPayload);if(serializedInvitation.length>14_000_000)throw new ApiError(413,'Invitation is too large');const invitationId=id('invitation');const revisionId=id('revision');const slug=randomToken(12);const r2Key=`invitations/${invitationId}/${revisionId}.json`;await env.MEDIA.put(r2Key,serializedInvitation,{httpMetadata:{contentType:'application/json'}});const method=body.method==='paypal'?'paypal':'razorpay';if(method==='paypal'&&code)throw new ApiError(422,'Coupons are not supported for PayPal orders yet','coupon_unsupported');const config=await settings(env);const coupon=method==='paypal'?null:(code?await validateCoupon(env,customer.id,code,config.basePriceCents):null);const quote=method==='paypal'?{subtotalCents:PAYPAL_PRICE_CENTS,discountCents:0,taxableCents:PAYPAL_PRICE_CENTS,taxCents:0,totalCents:PAYPAL_PRICE_CENTS}:calculateQuote(config.basePriceCents,config.taxBps,coupon?.rule||null);const orderId=id('order');const invitationUrl=`https://${chosenSubdomain}.vowvel.com`;const snapshot={...quote,currency:method==='paypal'?PAYPAL_CURRENCY:config.currency,couponCode:coupon?.row.code||null,provider:method,invitationUrl,quotedAt:nowIso()};
    if(quote.totalCents>0&&quote.totalCents<100){await env.MEDIA.delete(r2Key);throw new ApiError(400,'Payment amount must be at least 100 paise','amount_too_small');}
    if(coupon){const reserved=await env.DB.prepare(`UPDATE coupon_codes SET reserved_count=reserved_count+1 WHERE id=? AND status='active' AND (max_redemptions IS NULL OR reserved_count+redeemed_count<max_redemptions)`).bind(coupon.row.id).run();if((reserved.meta.changes||0)!==1)throw new ApiError(409,'Coupon was just exhausted','coupon_exhausted');}
    try{await env.DB.batch([
      env.DB.prepare(`INSERT INTO invitations(id,owner_id,slug,state,published_revision_id,custom_subdomain) VALUES(?,?,?,'draft',?,?)`).bind(invitationId,customer.id,slug,revisionId,chosenSubdomain),
      env.DB.prepare(`INSERT INTO invitation_revisions(id,invitation_id,revision_number,data_json,created_by) VALUES(?,?,1,?,?)`).bind(revisionId,invitationId,JSON.stringify({r2Key}),customer.id),
      env.DB.prepare(`INSERT INTO orders(id,user_id,invitation_id,state,currency,subtotal_cents,discount_cents,tax_cents,total_cents,coupon_code_id,influencer_id,commission_bps,price_snapshot_json) VALUES(?,?,?,'awaiting_payment',?,?,?,?,?,?,?,?,?)`).bind(orderId,customer.id,invitationId,method==='paypal'?PAYPAL_CURRENCY:config.currency,quote.subtotalCents,quote.discountCents,quote.taxCents,quote.totalCents,coupon?.row.id||null,coupon?.row.influencer_id||null,coupon?.row.commission_bps||0,JSON.stringify(snapshot)),
      ...(coupon?[env.DB.prepare(`INSERT INTO coupon_redemptions(id,coupon_code_id,campaign_id,order_id,user_id,discount_cents,reserved_until) VALUES(?,?,?,?,?,?,?)`).bind(id('redemption'),coupon.row.id,coupon.row.campaign_id,orderId,customer.id,quote.discountCents,new Date(Date.now()+30*60_000).toISOString())]:[]),
    ]);}catch(error){await env.MEDIA.delete(r2Key);if(coupon)await env.DB.prepare(`UPDATE coupon_codes SET reserved_count=MAX(0,reserved_count-1) WHERE id=?`).bind(coupon.row.id).run();throw error;}
    if(quote.totalCents===0){
      const statements=[env.DB.prepare(`UPDATE orders SET state='paid',paid_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(orderId),env.DB.prepare(`UPDATE invitations SET state='published',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(invitationId),emailStatement(env,`purchase:${orderId}`,purchaseEmail(customer.email,orderId,money(0,config.currency),invitationUrl))];
      if(coupon)statements.push(env.DB.prepare(`UPDATE coupon_redemptions SET status='used',used_at=CURRENT_TIMESTAMP WHERE order_id=? AND status='reserved'`).bind(orderId),env.DB.prepare(`UPDATE coupon_codes SET reserved_count=MAX(0,reserved_count-1),redeemed_count=redeemed_count+1 WHERE id=?`).bind(coupon.row.id));
      await env.DB.batch(statements);await audit(env,request,customer.id,'order.complimentary','order',orderId,null,snapshot);return json({order:{id:orderId,...snapshot,providerOrderId:null,checkoutKey:null},paymentConfigured:false,complimentary:true},201);
    }
    let providerOrderId:string|null=null;let checkoutKey:string|null=null;
    if(method==='paypal'){
      if(!env.PAYPAL_CLIENT_ID||!env.PAYPAL_CLIENT_SECRET){await audit(env,request,customer.id,'order.create','order',orderId,null,snapshot);return json({order:{id:orderId,...snapshot,providerOrderId:null,paypalClientId:null},paymentConfigured:false,provider:'paypal',complimentary:false},201);}
      let paypalOrderId:string;
      try{
        const created=await createPayPalOrder(env,orderId,quote.totalCents);paypalOrderId=created.id;
        await env.DB.batch([env.DB.prepare(`UPDATE orders SET provider_order_id=? WHERE id=?`).bind(paypalOrderId,orderId),env.DB.prepare(`INSERT INTO payments(id,order_id,provider,provider_order_id,amount_cents) VALUES(?,?,?,?,?)`).bind(id('payment'),orderId,'paypal',paypalOrderId,quote.totalCents)]);
      }catch(error){
        console.error(JSON.stringify({level:'error',event:'payment_provider_order_failed',orderId,provider:'paypal',error:error instanceof Error?error.message:String(error)}));
        await env.DB.batch([env.DB.prepare(`DELETE FROM payments WHERE order_id=?`).bind(orderId),env.DB.prepare(`DELETE FROM orders WHERE id=?`).bind(orderId),env.DB.prepare(`DELETE FROM invitation_revisions WHERE id=?`).bind(revisionId),env.DB.prepare(`DELETE FROM invitations WHERE id=?`).bind(invitationId)]);
        await env.MEDIA.delete(r2Key);
        throw new ApiError(500,'Payment provider could not create the order','provider_error');
      }
      await audit(env,request,customer.id,'order.create','order',orderId,null,snapshot);return json({order:{id:orderId,...snapshot,providerOrderId:paypalOrderId,paypalClientId:env.PAYPAL_CLIENT_ID},paymentConfigured:true,provider:'paypal',complimentary:false},201);
    }
    if(env.RAZORPAY_KEY_ID&&env.RAZORPAY_KEY_SECRET){
      let providerStatus=0;
      try{const providerResponse=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{authorization:`Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`,'content-type':'application/json'},body:JSON.stringify({amount:quote.totalCents,currency:config.currency,receipt:orderId,notes:{vowvel_order_id:orderId}})});providerStatus=providerResponse.status;
        const provider=await responseJson(providerResponse) as any;if(!providerResponse.ok||typeof provider.id!=='string')throw new Error(`Provider rejected order (${providerResponse.status}): ${cleanText(provider.error?.description||provider.error?.reason||'',300)}`);providerOrderId=provider.id;checkoutKey=env.RAZORPAY_KEY_ID;
        await env.DB.batch([env.DB.prepare(`UPDATE orders SET provider_order_id=? WHERE id=?`).bind(providerOrderId,orderId),env.DB.prepare(`INSERT INTO payments(id,order_id,provider_order_id,amount_cents) VALUES(?,?,?,?)`).bind(id('payment'),orderId,providerOrderId,quote.totalCents)]);
      }catch(error){
        console.error(JSON.stringify({level:'error',event:'payment_provider_order_failed',orderId,error:error instanceof Error?error.message:String(error)}));
        const statements=[
          env.DB.prepare(`DELETE FROM coupon_redemptions WHERE order_id=? AND status='reserved'`).bind(orderId),
          env.DB.prepare(`DELETE FROM payments WHERE order_id=?`).bind(orderId),
          env.DB.prepare(`DELETE FROM orders WHERE id=?`).bind(orderId),
          env.DB.prepare(`DELETE FROM invitation_revisions WHERE id=?`).bind(revisionId),
          env.DB.prepare(`DELETE FROM invitations WHERE id=?`).bind(invitationId),
        ];
        if(coupon)statements.push(env.DB.prepare(`UPDATE coupon_codes SET reserved_count=MAX(0,reserved_count-1) WHERE id=?`).bind(coupon.row.id));
        await env.DB.batch(statements);await env.MEDIA.delete(r2Key);
        if(providerStatus===401)throw new ApiError(401,'Razorpay authentication failed','provider_auth_failed');
        throw new ApiError(500,'Payment provider could not create the order','provider_error');
      }
    }
    await audit(env,request,customer.id,'order.create','order',orderId,null,snapshot);return json({order:{id:orderId,...snapshot,providerOrderId,checkoutKey},paymentConfigured:Boolean(providerOrderId),provider:'razorpay',complimentary:false},201);
  }
  if(path==='/api/verify-payment'&&request.method==='POST'){
    const customer=requireRole(user,['customer']);requireCsrf(request,customer);if(!env.RAZORPAY_KEY_SECRET)throw new ApiError(503,'Razorpay secret is not configured');
    const body=await readJson(request);const orderId=cleanText(body.orderId,100);const paymentId=cleanText(body.razorpay_payment_id,120);const providerOrderId=cleanText(body.razorpay_order_id,120);const signature=cleanText(body.razorpay_signature,256);
    if(!orderId||!paymentId||!providerOrderId||!signature)throw new ApiError(400,'Payment verification fields are required','payment_fields_missing');
    const order=await env.DB.prepare(`SELECT id,state,provider_order_id,provider_payment_id FROM orders WHERE id=? AND user_id=?`).bind(orderId,customer.id).first<{id:string;state:string;provider_order_id:string|null;provider_payment_id:string|null}>();
    if(!order||!order.provider_order_id)throw new ApiError(404,'Order not found','order_not_found');
    if(!constantTimeEqual(order.provider_order_id,providerOrderId))throw new ApiError(400,'Payment signature verification failed','signature_mismatch');
    const expected=await hmacHex(env.RAZORPAY_KEY_SECRET,`${order.provider_order_id}|${paymentId}`);
    if(!constantTimeEqual(expected,signature))throw new ApiError(400,'Payment signature verification failed','signature_mismatch');
    if(order.provider_payment_id&&order.provider_payment_id!==paymentId)throw new ApiError(409,'A different payment is already linked to this order','payment_conflict');
    await env.DB.batch([env.DB.prepare(`UPDATE orders SET provider_payment_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(paymentId,order.id),env.DB.prepare(`UPDATE payments SET provider_payment_id=?,status=CASE WHEN status='created' THEN 'authorized' ELSE status END,raw_status=CASE WHEN raw_status IS NULL THEN 'signature_verified' ELSE raw_status END,updated_at=CURRENT_TIMESTAMP WHERE order_id=?`).bind(paymentId,order.id)]);
    await audit(env,request,customer.id,'payment.signature_verified','order',order.id,null,{providerOrderId:order.provider_order_id,paymentId});return json({success:true,orderId:order.id,paymentId});
  }
  if(path==='/api/paypal/capture'&&request.method==='POST'){
    const customer=requireRole(user,['customer']);requireCsrf(request,customer);
    const body=await readJson(request);const orderId=cleanText(body.orderId,100);
    if(!orderId)throw new ApiError(400,'Order id is required','order_required');
    const order=await env.DB.prepare(`SELECT o.id,o.state,o.currency,o.total_cents,o.provider_order_id,o.provider_payment_id,o.invitation_id,p.provider,i.slug,i.custom_subdomain,customer.email customer_email FROM orders o JOIN users customer ON customer.id=o.user_id LEFT JOIN payments p ON p.order_id=o.id LEFT JOIN invitations i ON i.id=o.invitation_id WHERE o.id=? AND o.user_id=?`).bind(orderId,customer.id).first<{id:string;state:string;currency:string;total_cents:number;provider_order_id:string|null;provider_payment_id:string|null;invitation_id:string|null;provider:string|null;slug:string|null;custom_subdomain:string|null;customer_email:string}>();
    if(!order||!order.provider_order_id)throw new ApiError(404,'Order not found','order_not_found');
    if(order.provider&&order.provider!=='paypal')throw new ApiError(409,'This order uses a different payment provider','provider_mismatch');
    if(order.currency!==PAYPAL_CURRENCY)throw new ApiError(409,'This order is not a PayPal order','provider_mismatch');
    if(order.state==='paid')return json({success:true,orderId:order.id,alreadyPaid:true});
    if(order.provider_payment_id)throw new ApiError(409,'A payment is already linked to this order','payment_conflict');
    let capture;
    try{capture=await capturePayPalOrder(env,order.provider_order_id);}
    catch(error){console.error(JSON.stringify({level:'error',event:'paypal_capture_failed',orderId,error:error instanceof Error?error.message:String(error)}));throw new ApiError(502,'PayPal could not capture the payment','provider_error');}
    if(capture.amountCents!==order.total_cents)throw new ApiError(409,'Payment amount does not match order','amount_mismatch');
    if(capture.status!=='COMPLETED')throw new ApiError(502,'PayPal payment was not completed','payment_incomplete');
    const inviteUrl=order.custom_subdomain?`https://${order.custom_subdomain}.vowvel.com`:order.slug?`${(env.PUBLIC_APP_URL||new URL(request.url).origin).replace(/\/$/,'')}/#/invite/${order.slug}`:(env.PUBLIC_APP_URL||new URL(request.url).origin);
    const statements=[env.DB.prepare(`UPDATE orders SET state='paid',provider_payment_id=?,paid_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND state!='paid'`).bind(capture.captureId,order.id),env.DB.prepare(`UPDATE payments SET provider_payment_id=?,status='captured',raw_status='capture_completed',updated_at=CURRENT_TIMESTAMP WHERE order_id=?`).bind(capture.captureId,order.id)];
    if(order.invitation_id)statements.push(env.DB.prepare(`UPDATE invitations SET state='published',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(order.invitation_id));
    statements.push(emailStatement(env,`purchase:${order.id}`,purchaseEmail(order.customer_email,order.id,money(order.total_cents,order.currency),inviteUrl)));
    await env.DB.batch(statements);ctx.waitUntil(flushEmailOutbox(env));
    await audit(env,request,customer.id,'payment.captured','order',order.id,null,{provider:'paypal',captureId:capture.captureId});return json({success:true,orderId:order.id,captureId:capture.captureId,invitationUrl:inviteUrl});
  }
  return null;
}

async function customerRoutes(request:Request,env:RuntimeEnv,path:string,user:AuthUser|null):Promise<Response|null>{
  if(!path.startsWith('/api/customer/'))return null;const customer=requireRole(user,['customer']);
  if(request.method!=='GET')requireCsrf(request,customer);
  if(path==='/api/customer/invitations'&&request.method==='GET'){
    const result=await env.DB.prepare(`SELECT i.id,COALESCE(i.custom_subdomain,i.slug) slug,i.custom_subdomain,i.state,i.created_at,i.updated_at,COUNT(r.id) response_count,COALESCE(SUM(CASE WHEN r.attendance='yes' THEN r.party_size ELSE 0 END),0) attending_count,COALESCE(SUM(CASE WHEN r.attendance='no' THEN 1 ELSE 0 END),0) declined_count FROM invitations i LEFT JOIN rsvp_submissions r ON r.invitation_id=i.id WHERE i.owner_id=? GROUP BY i.id ORDER BY i.updated_at DESC`).bind(customer.id).all();
    return json({invitations:result.results});
  }
  const invitationDetailMatch=path.match(/^\/api\/customer\/invitations\/([^/]+)$/);
  if(invitationDetailMatch&&(request.method==='GET'||request.method==='PUT')){
    const invitation=await env.DB.prepare(`SELECT i.id,i.slug,i.state,i.published_revision_id,r.data_json FROM invitations i LEFT JOIN invitation_revisions r ON r.id=i.published_revision_id WHERE i.id=? AND i.owner_id=?`).bind(invitationDetailMatch[1],customer.id).first<{id:string;slug:string;state:string;published_revision_id:string|null;data_json:string|null}>();
    if(!invitation||!invitation.data_json)throw new ApiError(404,'Invitation not found');const metadata=JSON.parse(invitation.data_json) as {r2Key?:string};if(!metadata.r2Key)throw new ApiError(503,'Invitation content is unavailable');const currentObject=await env.MEDIA.get(metadata.r2Key);if(!currentObject)throw new ApiError(404,'Invitation content is unavailable');const currentPayload=await currentObject.json<Record<string,unknown>>();
    const data=currentPayload.data&&typeof currentPayload.data==='object'&&!Array.isArray(currentPayload.data)?currentPayload.data as Record<string,unknown>:currentPayload;const dates=Array.isArray(data.events)?data.events.flatMap(event=>event&&typeof event==='object'&&!Array.isArray(event)&&typeof (event as Record<string,unknown>).date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test((event as Record<string,unknown>).date as string)?[(event as Record<string,unknown>).date as string]:[]):[];const editableUntil=dates.sort().at(-1)||null;const todayInIndia=new Date(Date.now()+19_800_000).toISOString().slice(0,10);const editable=!editableUntil||todayInIndia<=editableUntil;
    if(request.method==='GET')return json({invitation:{id:invitation.id,slug:invitation.slug,state:invitation.state,editable,editableUntil},payload:currentPayload});
    if(!editable)throw new ApiError(409,'This celebration has passed, so the published invitation is now read-only.','invitation_edit_closed');
    const body=await readJson(request,15_000_000);const nextPayload=body.invitation;if(!nextPayload||typeof nextPayload!=='object'||Array.isArray(nextPayload))throw new ApiError(400,'Invitation details are required');const serialized=JSON.stringify(nextPayload);if(serialized.length>14_000_000)throw new ApiError(413,'Invitation is too large');const revisionNumber=await env.DB.prepare(`SELECT COALESCE(MAX(revision_number),0)+1 next_number FROM invitation_revisions WHERE invitation_id=?`).bind(invitation.id).first<{next_number:number}>();const revisionId=id('revision');const r2Key=`invitations/${invitation.id}/${revisionId}.json`;await env.MEDIA.put(r2Key,serialized,{httpMetadata:{contentType:'application/json'}});
    try{await env.DB.batch([env.DB.prepare(`INSERT INTO invitation_revisions(id,invitation_id,revision_number,data_json,created_by) VALUES(?,?,?,?,?)`).bind(revisionId,invitation.id,revisionNumber?.next_number||1,JSON.stringify({r2Key}),customer.id),env.DB.prepare(`UPDATE invitations SET published_revision_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=?`).bind(revisionId,invitation.id,customer.id)]);}catch(error){await env.MEDIA.delete(r2Key);throw error;}await audit(env,request,customer.id,'invitation.update','invitation',invitation.id,{revisionId:invitation.published_revision_id},{revisionId,revisionNumber:revisionNumber?.next_number||1});return json({ok:true,slug:invitation.slug,revisionId});
  }
  const responsesMatch=path.match(/^\/api\/customer\/invitations\/([^/]+)\/rsvps$/);
  if(responsesMatch&&request.method==='GET'){
    const invitation=await env.DB.prepare(`SELECT id,slug,state FROM invitations WHERE id=? AND owner_id=?`).bind(responsesMatch[1],customer.id).first<{id:string;slug:string;state:string}>();
    if(!invitation)throw new ApiError(404,'Invitation not found');
    const [responses,selections]=await Promise.all([
      env.DB.prepare(`SELECT id,guest_name,email,attendance,party_size,guest_names,dietary_notes,message,created_at,updated_at FROM rsvp_submissions WHERE invitation_id=? ORDER BY updated_at DESC`).bind(invitation.id).all(),
      env.DB.prepare(`SELECT s.rsvp_id,s.event_id,s.event_name FROM rsvp_event_selections s JOIN rsvp_submissions r ON r.id=s.rsvp_id WHERE r.invitation_id=? ORDER BY s.event_name`).bind(invitation.id).all<{rsvp_id:string;event_id:string;event_name:string}>(),
    ]);
    const byResponse=new Map<string,Array<{id:string;name:string}>>();for(const selection of selections.results){const list=byResponse.get(selection.rsvp_id)||[];list.push({id:selection.event_id,name:selection.event_name});byResponse.set(selection.rsvp_id,list);}
    return json({invitation,responses:responses.results.map(row=>({...row,events:byResponse.get(String(row.id))||[]}))});
  }
  return null;
}

async function ensurePartnerCampaign(env:RuntimeEnv,actorId:string):Promise<string>{
  const existing=await env.DB.prepare(`SELECT id FROM coupon_campaigns WHERE name='Influencer Programme' ORDER BY created_at LIMIT 1`).first<{id:string}>();if(existing)return existing.id;const campaignId=id('campaign');
  await env.DB.prepare(`INSERT INTO coupon_campaigns(id,name,description,status,discount_type,discount_value,per_customer_limit,commission_bps,created_by) VALUES(?,'Influencer Programme','10% customer discount and 15% partner commission','active','percentage',1000,1,1500,?)`).bind(campaignId,actorId).run();return campaignId;
}

async function adminRoutes(request:Request,env:RuntimeEnv,path:string,user:AuthUser|null):Promise<Response|null>{
  if(!path.startsWith('/api/admin/'))return null;const actor=requireRole(user,['owner','admin','finance','support','content']);if(request.method!=='GET')requireCsrf(request,actor);
  if(path==='/api/admin/dashboard'&&request.method==='GET'){
    if(!['owner','admin','finance'].includes(actor.role))throw new ApiError(403,'Dashboard permission required');
    const [users,orders,revenue,discounts,liability,pendingInfluencers]=await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) value FROM users`).first<{value:number}>(),env.DB.prepare(`SELECT COUNT(*) value FROM orders`).first<{value:number}>(),env.DB.prepare(`SELECT COALESCE(SUM(total_cents),0) value FROM orders WHERE state='paid'`).first<{value:number}>(),env.DB.prepare(`SELECT COALESCE(SUM(discount_cents),0) value FROM orders WHERE state='paid'`).first<{value:number}>(),env.DB.prepare(`SELECT COALESCE(SUM(amount_cents),0) value FROM commission_ledger WHERE status IN ('pending','available','approved')`).first<{value:number}>(),env.DB.prepare(`SELECT COUNT(*) value FROM influencer_profiles WHERE status='pending'`).first<{value:number}>(),
    ]);return json({metrics:{users:Number(users?.value||0),orders:Number(orders?.value||0),revenueCents:Number(revenue?.value||0),discountCents:Number(discounts?.value||0),commissionLiabilityCents:Number(liability?.value||0),pendingInfluencers:Number(pendingInfluencers?.value||0)}});
  }
  if(path==='/api/admin/users'&&request.method==='GET'){if(!['owner','admin','support'].includes(actor.role))throw new ApiError(403,'User directory permission required');const result=await env.DB.prepare(`SELECT id,email,name,role,status,created_at FROM users ORDER BY created_at DESC LIMIT 200`).all();return json({users:result.results});}
  const userMatch=path.match(/^\/api\/admin\/users\/([^/]+)$/);
  if(userMatch&&request.method==='PATCH'){
    if(actor.role!=='owner')throw new ApiError(403,'Only an Owner can change account access');const targetId=userMatch[1];const body=await readJson(request);const before=await env.DB.prepare(`SELECT id,email,name,role,status FROM users WHERE id=?`).bind(targetId).first<{id:string;email:string;name:string;role:Role;status:UserStatus}>();if(!before)throw new ApiError(404,'User not found');const role=cleanText(body.role,30) as Role;const status=cleanText(body.status,30) as UserStatus;const roles:Role[]=['owner','admin','finance','support','content','influencer','customer'];const statuses:UserStatus[]=['active','pending','suspended','disabled'];if(!roles.includes(role)||!statuses.includes(status))throw new ApiError(400,'Invalid role or status');
    if(before.role==='owner'&&(role!=='owner'||status!=='active')){const owners=await env.DB.prepare(`SELECT COUNT(*) count FROM users WHERE role='owner' AND status='active'`).first<{count:number}>();if((owners?.count||0)<=1)throw new ApiError(409,'The last active Owner cannot be removed');}
    await env.DB.prepare(`UPDATE users SET role=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(role,status,targetId).run();await audit(env,request,actor.id,'user.access_change','user',targetId,before,{role,status},cleanText(body.reason,500));return json({ok:true});
  }
  if(path==='/api/admin/orders'&&request.method==='GET'){if(!['owner','admin','finance','support'].includes(actor.role))throw new ApiError(403,'Order permission required');const result=await env.DB.prepare(`SELECT o.id,o.state,o.currency,o.subtotal_cents,o.discount_cents,o.tax_cents,o.total_cents,o.created_at,u.email,cc.code FROM orders o JOIN users u ON u.id=o.user_id LEFT JOIN coupon_codes cc ON cc.id=o.coupon_code_id ORDER BY o.created_at DESC LIMIT 200`).all();return json({orders:result.results});}
  if(path==='/api/admin/coupons'&&request.method==='GET'){if(!['owner','admin'].includes(actor.role))throw new ApiError(403,'Coupon permission required');const result=await env.DB.prepare(`SELECT c.*,COUNT(cc.id) code_count,COALESCE(SUM(cc.redeemed_count),0) redemption_count FROM coupon_campaigns c LEFT JOIN coupon_codes cc ON cc.campaign_id=c.id GROUP BY c.id ORDER BY c.created_at DESC`).all();return json({campaigns:result.results});}
  if(path==='/api/admin/coupons'&&request.method==='POST'){
    if(!['owner','admin'].includes(actor.role))throw new ApiError(403,'Admin permission required');const body=await readJson(request);const name=cleanText(body.name,120);const description=cleanText(body.description,500);const discountType=body.discountType==='fixed'?'fixed':'percentage';const discountValue=discountType==='percentage'?integer(body.discountValue,1,10000):integer(body.discountValue,1,100000000);const campaignId=id('campaign');if(!name)throw new ApiError(400,'Campaign name is required');
    const status=['draft','active','paused'].includes(String(body.status))?String(body.status):'draft';const maxDiscount=body.maxDiscountCents===null||body.maxDiscountCents===''?null:integer(body.maxDiscountCents,1,100000000);const globalLimit=body.globalLimit===null||body.globalLimit===''?null:integer(body.globalLimit,1,10000000);const perCustomer=integer(body.perCustomerLimit,1,1000,1);const commissionBps=integer(body.commissionBps,0,10000,0);
    await env.DB.prepare(`INSERT INTO coupon_campaigns(id,name,description,status,discount_type,discount_value,max_discount_cents,min_subtotal_cents,starts_at,ends_at,global_limit,per_customer_limit,first_purchase_only,commission_bps,created_by) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(campaignId,name,description,status,discountType,discountValue,maxDiscount,integer(body.minSubtotalCents,0,100000000,0),cleanText(body.startsAt,40)||null,cleanText(body.endsAt,40)||null,globalLimit,perCustomer,body.firstPurchaseOnly===true?1:0,commissionBps,actor.id).run();
    await audit(env,request,actor.id,'coupon.create','coupon_campaign',campaignId,null,{name,status,discountType,discountValue});return json({id:campaignId},201);
  }
  const couponMatch=path.match(/^\/api\/admin\/coupons\/([^/]+)$/);
  if(couponMatch&&request.method==='PATCH'){
    if(!['owner','admin'].includes(actor.role))throw new ApiError(403,'Admin permission required');const campaignId=couponMatch[1];const body=await readJson(request);const status=cleanText(body.status,20);if(!['draft','active','paused','expired'].includes(status))throw new ApiError(400,'Invalid campaign status');const before=await env.DB.prepare(`SELECT id,name,status FROM coupon_campaigns WHERE id=?`).bind(campaignId).first();if(!before)throw new ApiError(404,'Campaign not found');await env.DB.prepare(`UPDATE coupon_campaigns SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,campaignId).run();await audit(env,request,actor.id,'coupon.status_change','coupon_campaign',campaignId,before,{status},cleanText(body.reason,500));return json({ok:true});
  }
  const batchMatch=path.match(/^\/api\/admin\/coupons\/([^/]+)\/batch$/);
  if(batchMatch&&request.method==='POST'){
    if(!['owner','admin'].includes(actor.role))throw new ApiError(403,'Admin permission required');const campaignId=batchMatch[1];const exists=await env.DB.prepare(`SELECT id FROM coupon_campaigns WHERE id=?`).bind(campaignId).first();if(!exists)throw new ApiError(404,'Campaign not found');const body=await readJson(request);const count=integer(body.count,1,500);const length=integer(body.length,6,24,10);const prefix=cleanText(body.prefix,12);const maxRedemptions=body.maxRedemptions===null||body.maxRedemptions===''?null:integer(body.maxRedemptions,1,1000000);const batchId=id('batch');const codes:string[]=[];
    for(let i=0;i<count;i++){let created=false;for(let attempt=0;attempt<5&&!created;attempt++){const code=generateCouponCode(prefix,length);try{await env.DB.prepare(`INSERT INTO coupon_codes(id,campaign_id,code,batch_id,max_redemptions) VALUES(?,?,?,?,?)`).bind(id('code'),campaignId,code,batchId,maxRedemptions).run();codes.push(code);created=true;}catch{if(attempt===4)throw new ApiError(503,'Could not generate a unique code batch');}}}
    await audit(env,request,actor.id,'coupon.batch_create','coupon_batch',batchId,null,{campaignId,count,prefix});return json({batchId,codes,csv:['code',...codes].map(csvCell).join('\n')},201);
  }
  if(path==='/api/admin/influencers'&&request.method==='GET'){if(!['owner','admin','finance'].includes(actor.role))throw new ApiError(403,'Influencer permission required');const result=await env.DB.prepare(`SELECT u.id,u.name,u.email,u.status account_status,p.status,p.bio,p.channels_json,p.audience_size,p.payout_hold,cc.code,COALESCE(SUM(CASE WHEN cl.status IN ('pending','available','approved') THEN cl.amount_cents ELSE 0 END),0) balance_cents FROM influencer_profiles p JOIN users u ON u.id=p.user_id LEFT JOIN coupon_codes cc ON cc.influencer_id=u.id AND cc.status='active' LEFT JOIN commission_ledger cl ON cl.influencer_id=u.id GROUP BY u.id ORDER BY p.created_at DESC`).all();return json({influencers:result.results});}
  const influencerMatch=path.match(/^\/api\/admin\/influencers\/([^/]+)$/);
  if(influencerMatch&&request.method==='PATCH'){
    if(!['owner','admin'].includes(actor.role))throw new ApiError(403,'Admin permission required');const influencerId=influencerMatch[1];const body=await readJson(request);const status=String(body.status);if(!['approved','rejected','suspended'].includes(status))throw new ApiError(400,'Invalid influencer status');const before=await env.DB.prepare(`SELECT status FROM influencer_profiles WHERE user_id=?`).bind(influencerId).first();if(!before)throw new ApiError(404,'Influencer not found');
    await env.DB.batch([env.DB.prepare(`UPDATE influencer_profiles SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).bind(status,actor.id,influencerId),env.DB.prepare(`UPDATE users SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status==='approved'?'active':status==='suspended'?'suspended':'disabled',influencerId)]);
    let code:string|null=null;if(status==='approved'){const campaignId=await ensurePartnerCampaign(env,actor.id);const current=await env.DB.prepare(`SELECT code FROM coupon_codes WHERE influencer_id=? AND status='active'`).bind(influencerId).first<{code:string}>();if(current)code=current.code;else{code=generateCouponCode(cleanText(body.codePrefix,12)||'VOW',8);await env.DB.prepare(`INSERT INTO coupon_codes(id,campaign_id,code,influencer_id) VALUES(?,?,?,?)`).bind(id('code'),campaignId,code,influencerId).run();}}
    await audit(env,request,actor.id,'influencer.review','influencer',influencerId,before,{status,code},cleanText(body.reason,500));return json({ok:true,code});
  }
  if(path==='/api/admin/audit'&&request.method==='GET'){if(!['owner','admin'].includes(actor.role))throw new ApiError(403,'Admin permission required');const result=await env.DB.prepare(`SELECT a.*,u.email actor_email FROM audit_logs a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.created_at DESC LIMIT 200`).all();return json({events:result.results});}
  if(path==='/api/admin/settings'&&request.method==='GET'){return json({commerce:await settings(env)});}
  if(path==='/api/admin/settings'&&request.method==='PATCH'){
    if(!['owner','admin'].includes(actor.role))throw new ApiError(403,'Admin permission required');const before=await settings(env);const body=await readJson(request);const next:CommerceSettings={basePriceCents:integer(body.basePriceCents,1,100000000,before.basePriceCents),currency:cleanText(body.currency,3).toUpperCase()||before.currency,taxBps:integer(body.taxBps,0,10000,before.taxBps),commissionHoldDays:integer(body.commissionHoldDays,0,365,before.commissionHoldDays),minimumPayoutCents:integer(body.minimumPayoutCents,1,100000000,before.minimumPayoutCents)};await env.DB.prepare(`UPDATE app_settings SET value_json=?,updated_by=?,updated_at=CURRENT_TIMESTAMP WHERE key='commerce'`).bind(JSON.stringify(next),actor.id).run();await audit(env,request,actor.id,'settings.update','app_settings','commerce',before,next,cleanText(body.reason,500));return json({commerce:next});
  }
  if(path==='/api/admin/payouts'&&request.method==='GET'){if(!['owner','admin','finance'].includes(actor.role))throw new ApiError(403,'Finance permission required');await env.DB.prepare(`UPDATE commission_ledger SET status='available' WHERE status='pending' AND available_at<=CURRENT_TIMESTAMP`).run();const result=await env.DB.prepare(`SELECT p.*,u.name,u.email FROM payouts p JOIN users u ON u.id=p.influencer_id ORDER BY p.created_at DESC LIMIT 200`).all();return json({payouts:result.results});}
  if(path==='/api/admin/payouts'&&request.method==='POST'){
    if(!['owner','finance'].includes(actor.role))throw new ApiError(403,'Owner or Finance permission required');const body=await readJson(request);const influencerId=cleanText(body.influencerId,80);const config=await settings(env);await env.DB.prepare(`UPDATE commission_ledger SET status='available' WHERE influencer_id=? AND status='pending' AND available_at<=CURRENT_TIMESTAMP`).bind(influencerId).run();const entries=await env.DB.prepare(`SELECT id,amount_cents FROM commission_ledger WHERE influencer_id=? AND status='available' ORDER BY available_at`).bind(influencerId).all<{id:string;amount_cents:number}>();const amount=entries.results.reduce((sum,row)=>sum+row.amount_cents,0);if(amount<config.minimumPayoutCents)throw new ApiError(422,`Available balance is below ${config.minimumPayoutCents} cents`);const payoutId=id('payout');const statements=[env.DB.prepare(`INSERT INTO payouts(id,influencer_id,amount_cents,status,period_end,approved_by) VALUES(?,?,?,'approved',CURRENT_TIMESTAMP,?)`).bind(payoutId,influencerId,amount,actor.id),...entries.results.map(row=>env.DB.prepare(`INSERT INTO payout_items(payout_id,ledger_id,amount_cents) VALUES(?,?,?)`).bind(payoutId,row.id,row.amount_cents)),...entries.results.map(row=>env.DB.prepare(`UPDATE commission_ledger SET status='approved' WHERE id=? AND status='available'`).bind(row.id))];await env.DB.batch(statements);await audit(env,request,actor.id,'payout.create','payout',payoutId,null,{influencerId,amount});return json({id:payoutId,amountCents:amount},201);
  }
  const payoutMatch=path.match(/^\/api\/admin\/payouts\/([^/]+)$/);
  if(payoutMatch&&request.method==='PATCH'){
    if(!['owner','finance'].includes(actor.role))throw new ApiError(403,'Owner or Finance permission required');const payoutId=payoutMatch[1];const body=await readJson(request);const status=cleanText(body.status,20);if(!['processing','paid','failed','cancelled'].includes(status))throw new ApiError(400,'Invalid payout status');const before=await env.DB.prepare(`SELECT * FROM payouts WHERE id=?`).bind(payoutId).first<{id:string;status:string}>();if(!before)throw new ApiError(404,'Payout not found');const reference=cleanText(body.reference,150)||null;await env.DB.batch([env.DB.prepare(`UPDATE payouts SET status=?,provider_reference=?,paid_at=CASE WHEN ?='paid' THEN CURRENT_TIMESTAMP ELSE paid_at END,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(status,reference,status,payoutId),env.DB.prepare(`UPDATE commission_ledger SET status=CASE WHEN ?='paid' THEN 'paid' WHEN ? IN ('failed','cancelled') THEN 'available' ELSE status END WHERE id IN (SELECT ledger_id FROM payout_items WHERE payout_id=?)`).bind(status,status,payoutId)]);await audit(env,request,actor.id,'payout.status_change','payout',payoutId,before,{status,reference},cleanText(body.reason,500));return json({ok:true});
  }
  const refundMatch=path.match(/^\/api\/admin\/orders\/([^/]+)\/refund$/);
  if(refundMatch&&request.method==='POST'){
    if(!['owner','finance'].includes(actor.role))throw new ApiError(403,'Owner or Finance permission required');const orderId=refundMatch[1];const body=await readJson(request);const reason=cleanText(body.reason,500);if(!reason)throw new ApiError(400,'A refund reason is required');const order=await env.DB.prepare(`SELECT o.id,o.state,o.total_cents,o.provider_payment_id,p.id payment_id,p.provider payment_provider FROM orders o LEFT JOIN payments p ON p.order_id=o.id WHERE o.id=?`).bind(orderId).first<{id:string;state:string;total_cents:number;provider_payment_id:string|null;payment_id:string|null;payment_provider:string|null}>();if(!order||!order.provider_payment_id||!order.payment_id)throw new ApiError(404,'Paid order not found');const already=await env.DB.prepare(`SELECT COALESCE(SUM(amount_cents),0) amount FROM refunds WHERE order_id=? AND status='processed'`).bind(orderId).first<{amount:number}>();const remaining=order.total_cents-(already?.amount||0);const amount=integer(body.amountCents,1,remaining,remaining);const refundId=id('refund');await env.DB.prepare(`INSERT INTO refunds(id,order_id,payment_id,amount_cents,reason,created_by) VALUES(?,?,?,?,?,?)`).bind(refundId,orderId,order.payment_id,amount,reason,actor.id).run();let providerRefundId:string;if(order.payment_provider==='paypal'){try{const refund=await refundPayPalCapture(env,order.provider_payment_id as string,amount);providerRefundId=refund.id;}catch{await env.DB.prepare(`UPDATE refunds SET status='failed' WHERE id=?`).bind(refundId).run();throw new ApiError(502,'Payment provider could not process the refund');}}else{if(!env.RAZORPAY_KEY_ID||!env.RAZORPAY_KEY_SECRET)throw new ApiError(503,'Razorpay secrets are not configured');const response=await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(order.provider_payment_id as string)}/refund`,{method:'POST',headers:{authorization:`Basic ${btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`)}`,'content-type':'application/json'},body:JSON.stringify({amount,notes:{vowvel_refund_id:refundId,reason}})});const provider=await responseJson(response);if(!response.ok||typeof provider.id!=='string'){await env.DB.prepare(`UPDATE refunds SET status='failed' WHERE id=?`).bind(refundId).run();throw new ApiError(502,'Payment provider could not process the refund');}providerRefundId=provider.id as string;}const full=amount===remaining;const statements=[env.DB.prepare(`UPDATE refunds SET status='processed',provider_refund_id=?,processed_at=CURRENT_TIMESTAMP WHERE id=?`).bind(providerRefundId,refundId),env.DB.prepare(`UPDATE orders SET state=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(full?'refunded':'partially_refunded',orderId),env.DB.prepare(`UPDATE payments SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(full?'refunded':'partially_refunded',order.payment_id)];const earned=await env.DB.prepare(`SELECT influencer_id,basis_cents,rate_bps,amount_cents FROM commission_ledger WHERE order_id=? AND entry_type='earned'`).bind(orderId).first<{influencer_id:string;basis_cents:number;rate_bps:number;amount_cents:number}>();if(earned){const reversal=Math.min(earned.amount_cents,Math.round(earned.amount_cents*amount/order.total_cents));statements.push(env.DB.prepare(`INSERT INTO commission_ledger(id,influencer_id,order_id,entry_type,basis_cents,rate_bps,amount_cents,status,available_at,note,created_by) VALUES(?,?,?,'reversal',?,?,?,'reversed',CURRENT_TIMESTAMP,?,?)`).bind(id('commission'),earned.influencer_id,orderId,earned.basis_cents,earned.rate_bps,-reversal,`Refund ${refundId}`,actor.id));}if(full)statements.push(env.DB.prepare(`UPDATE coupon_redemptions SET status='reversed' WHERE order_id=? AND status='used'`).bind(orderId));await env.DB.batch(statements);await audit(env,request,actor.id,'order.refund','order',orderId,{state:order.state},{amount,full,providerRefundId},reason);return json({ok:true,refundId,amountCents:amount});
  }
  return null;
}

async function partnerRoutes(request:Request,env:RuntimeEnv,path:string,user:AuthUser|null):Promise<Response|null>{
  if(path!=='/api/partner/dashboard'||request.method!=='GET')return null;const partner=requireRole(user,['influencer']);const profile=await env.DB.prepare(`SELECT p.status,p.bio,p.channels_json,p.audience_size,p.payout_hold,cc.code FROM influencer_profiles p LEFT JOIN coupon_codes cc ON cc.influencer_id=p.user_id AND cc.status='active' WHERE p.user_id=?`).bind(partner.id).first();
  const metrics=await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM orders WHERE influencer_id=? AND state='paid') conversions,(SELECT COALESCE(SUM(total_cents),0) FROM orders WHERE influencer_id=? AND state='paid') sales_cents,(SELECT COALESCE(SUM(amount_cents),0) FROM commission_ledger WHERE influencer_id=? AND status='pending') pending_cents,(SELECT COALESCE(SUM(amount_cents),0) FROM commission_ledger WHERE influencer_id=? AND status='available') available_cents,(SELECT COALESCE(SUM(amount_cents),0) FROM commission_ledger WHERE influencer_id=? AND status='paid') paid_cents`).bind(partner.id,partner.id,partner.id,partner.id,partner.id).first();
  const ledger=await env.DB.prepare(`SELECT id,entry_type,basis_cents,rate_bps,amount_cents,status,available_at,created_at FROM commission_ledger WHERE influencer_id=? ORDER BY created_at DESC LIMIT 100`).bind(partner.id).all();return json({profile,metrics:metrics||{},ledger:ledger.results});
}

async function razorpayWebhook(request:Request,env:RuntimeEnv,ctx:ExecutionContext):Promise<Response>{
  if(!env.RAZORPAY_WEBHOOK_SECRET)throw new ApiError(503,'Webhook secret is not configured');const raw=await readBody(request,256_000);const signature=request.headers.get('x-razorpay-signature')||'';const expected=await hmacHex(env.RAZORPAY_WEBHOOK_SECRET,raw);if(!constantTimeEqual(signature,expected))throw new ApiError(401,'Invalid webhook signature');
  const payload=JSON.parse(new TextDecoder().decode(raw)) as {event?:string;payload?:{payment?:{entity?:{id?:string;order_id?:string;status?:string;amount?:number}}}};const payment=payload.payload?.payment?.entity;const providerOrderId=cleanText(payment?.order_id,120);const paymentId=cleanText(payment?.id,120);const eventType=cleanText(payload.event,120);if(!providerOrderId||!paymentId)throw new ApiError(400,'Payment identifiers missing');const eventId=request.headers.get('x-razorpay-event-id')||await sha256(raw);const payloadHash=await sha256(raw);
  const duplicate=await env.DB.prepare(`SELECT id FROM webhook_events WHERE provider='razorpay' AND provider_event_id=?`).bind(eventId).first();if(duplicate)return json({ok:true,duplicate:true});
  const order=await env.DB.prepare(`SELECT o.id,o.state,o.currency,o.total_cents,o.coupon_code_id,o.influencer_id,o.commission_bps,o.subtotal_cents,o.discount_cents,o.invitation_id,customer.email customer_email,i.slug,i.custom_subdomain,cc.code,influencer.email influencer_email FROM orders o JOIN users customer ON customer.id=o.user_id LEFT JOIN invitations i ON i.id=o.invitation_id LEFT JOIN coupon_codes cc ON cc.id=o.coupon_code_id LEFT JOIN users influencer ON influencer.id=o.influencer_id WHERE o.provider_order_id=?`).bind(providerOrderId).first<{id:string;state:string;currency:string;total_cents:number;coupon_code_id:string|null;influencer_id:string|null;commission_bps:number;subtotal_cents:number;discount_cents:number;invitation_id:string|null;customer_email:string;slug:string|null;custom_subdomain:string|null;code:string|null;influencer_email:string|null}>();if(!order)throw new ApiError(404,'Order not found');if(Number(payment?.amount)!==order.total_cents)throw new ApiError(409,'Payment amount does not match order');
  const eventStatement=env.DB.prepare(`INSERT INTO webhook_events(id,provider,provider_event_id,event_type,payload_hash) VALUES(?,'razorpay',?,?,?)`).bind(id('webhook'),eventId,eventType,payloadHash);
  if(eventType==='payment.captured'&&order.state!=='paid'){
    const statements=[eventStatement,env.DB.prepare(`UPDATE orders SET state='paid',provider_payment_id=?,paid_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND state!='paid'`).bind(paymentId,order.id),env.DB.prepare(`UPDATE payments SET provider_payment_id=?,status='captured',raw_status=?,updated_at=CURRENT_TIMESTAMP WHERE order_id=?`).bind(paymentId,cleanText(payment?.status,40),order.id)];
    if(order.coupon_code_id){statements.push(env.DB.prepare(`UPDATE coupon_redemptions SET status='used',used_at=CURRENT_TIMESTAMP WHERE order_id=? AND status='reserved'`).bind(order.id),env.DB.prepare(`UPDATE coupon_codes SET reserved_count=MAX(0,reserved_count-1),redeemed_count=redeemed_count+1 WHERE id=?`).bind(order.coupon_code_id));}
    if(order.invitation_id)statements.push(env.DB.prepare(`UPDATE invitations SET state='published',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(order.invitation_id));
    const inviteUrl=order.custom_subdomain?`https://${order.custom_subdomain}.vowvel.com`:order.slug?`${(env.PUBLIC_APP_URL||new URL(request.url).origin).replace(/\/$/,'')}/#/invite/${order.slug}`:(env.PUBLIC_APP_URL||new URL(request.url).origin);statements.push(emailStatement(env,`purchase:${order.id}`,purchaseEmail(order.customer_email,order.id,money(order.total_cents,order.currency),inviteUrl)));
    if(order.influencer_id&&order.commission_bps>0){const config=await settings(env);const basis=order.subtotal_cents-order.discount_cents;const amount=calculateCommission(basis,order.commission_bps);const availableAt=new Date(Date.now()+config.commissionHoldDays*86400000).toISOString();statements.push(env.DB.prepare(`INSERT OR IGNORE INTO commission_ledger(id,influencer_id,order_id,entry_type,basis_cents,rate_bps,amount_cents,status,available_at,note) VALUES(?,?,?,'earned',?,?,?,'pending',?,'Verified paid order')`).bind(id('commission'),order.influencer_id,order.id,basis,order.commission_bps,amount,availableAt));if(order.influencer_email&&order.code)statements.push(emailStatement(env,`redemption:${order.id}`,redemptionEmail(order.influencer_email,order.code,money(amount,order.currency))));}
    await env.DB.batch(statements);ctx.waitUntil(flushEmailOutbox(env));
  }else await env.DB.batch([eventStatement]);
  return json({ok:true});
}

async function paypalWebhook(request:Request,env:RuntimeEnv,ctx:ExecutionContext):Promise<Response>{
  const raw=await readBody(request,256_000);
  let payload:unknown;
  try{payload=JSON.parse(new TextDecoder().decode(raw));}catch{throw new ApiError(400,'Invalid webhook payload');}
  const body=payload as Record<string,unknown>;
  const eventType=cleanText(body.event_type,120);
  const verified=await verifyPayPalWebhook(env,{
    transmissionId:request.headers.get('paypal-transmission-id')||'',
    transmissionTime:request.headers.get('paypal-transmission-time')||'',
    certUrl:request.headers.get('paypal-cert-url')||'',
    authAlgo:request.headers.get('paypal-auth-algo')||'',
    transmissionSig:request.headers.get('paypal-transmission-sig')||'',
  },payload).catch(error=>{
    if(error instanceof Error&&error.message==='PayPal webhook id is not configured')throw new ApiError(503,'PayPal webhook id is not configured');
    throw new ApiError(502,'PayPal webhook verification failed');
  });
  if(!verified)throw new ApiError(401,'Invalid webhook signature');
  if(eventType!=='PAYMENT.CAPTURE.COMPLETED')return json({ok:true,ignored:true});
  const parsed=parsePayPalCaptureEvent(payload);
  if(!parsed)throw new ApiError(400,'Payment identifiers missing');
  const payloadHash=await sha256(raw);
  const duplicate=await env.DB.prepare(`SELECT id FROM webhook_events WHERE provider='paypal' AND provider_event_id=?`).bind(parsed.eventId).first();
  if(duplicate)return json({ok:true,duplicate:true});
  const order=await env.DB.prepare(`SELECT o.id,o.state,o.currency,o.total_cents,o.invitation_id,customer.email customer_email,i.slug,i.custom_subdomain FROM orders o JOIN users customer ON customer.id=o.user_id LEFT JOIN invitations i ON i.id=o.invitation_id WHERE o.provider_order_id=?`).bind(parsed.paypalOrderId).first<{id:string;state:string;currency:string;total_cents:number;invitation_id:string|null;customer_email:string;slug:string|null;custom_subdomain:string|null}>();
  if(!order)throw new ApiError(404,'Order not found');
  if(order.currency!==PAYPAL_CURRENCY||parsed.amountCents!==order.total_cents)throw new ApiError(409,'Payment amount does not match order');
  const eventStatement=env.DB.prepare(`INSERT INTO webhook_events(id,provider,provider_event_id,event_type,payload_hash) VALUES(?,'paypal',?,?,?)`).bind(id('webhook'),parsed.eventId,eventType,payloadHash);
  if(order.state!=='paid'){
    const inviteUrl=order.custom_subdomain?`https://${order.custom_subdomain}.vowvel.com`:order.slug?`${(env.PUBLIC_APP_URL||new URL(request.url).origin).replace(/\/$/,'')}/#/invite/${order.slug}`:(env.PUBLIC_APP_URL||new URL(request.url).origin);
    const statements=[eventStatement,env.DB.prepare(`UPDATE orders SET state='paid',provider_payment_id=?,paid_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND state!='paid'`).bind(parsed.captureId,order.id),env.DB.prepare(`UPDATE payments SET provider_payment_id=?,status='captured',raw_status='webhook_completed',updated_at=CURRENT_TIMESTAMP WHERE order_id=?`).bind(parsed.captureId,order.id)];
    if(order.invitation_id)statements.push(env.DB.prepare(`UPDATE invitations SET state='published',updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(order.invitation_id));
    statements.push(emailStatement(env,`purchase:${order.id}`,purchaseEmail(order.customer_email,order.id,money(order.total_cents,order.currency),inviteUrl)));
    await env.DB.batch(statements);ctx.waitUntil(flushEmailOutbox(env));
  }else await env.DB.batch([eventStatement]);
  return json({ok:true});
}

async function handleApi(request:Request,env:RuntimeEnv,ctx:ExecutionContext):Promise<Response>{
  const path=new URL(request.url).pathname;
  if(path==='/api/health'&&request.method==='GET')return json({ok:true,version:'1.0.0',status:'operational',timestamp:nowIso()},200,{'access-control-allow-origin':'*'});
  if(path==='/api/mcp'){
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization'}});
    return json({jsonrpc:'2.0',result:{serverInfo:{name:'vowvel-mcp',version:'1.0.0'},capabilities:{tools:{listChanged:false},resources:{subscribe:false},prompts:{listChanged:false}}}},200,{'access-control-allow-origin':'*'});
  }
  if(path==='/api/agent/a2a'){
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization'}});
    return json({protocol:'a2a',agent:{name:'Vowvel Concierge Agent',version:'1.0.0',description:'Luxury wedding and engagement invitation curation agent'},status:'ready'},200,{'access-control-allow-origin':'*'});
  }
  if(path==='/api/commerce/catalog'&&request.method==='GET'){
    return json({currency:'INR',basePriceCents:249900,internationalPriceUSD:40,items:[{id:'conservatory',name:'Conservatory',aesthetic:'Botanical glasshouse, ivory, gold foil, organic romanticism'},{id:'gulmohar',name:'Gulmohar',aesthetic:'Royal crimson, marigold, architectural arches, warm festivities'},{id:'afterhours',name:'After Hours',aesthetic:'Noir editorial, chandeliers, jazz club, modern champagne gala'},{id:'sunday',name:'Sunday Edit',aesthetic:'Warm editorial linen, minimalist typography, intimate weekend'},{id:'azure',name:'Azure',aesthetic:'Coastal cliffside, Mediterranean tiles, ocean romance'}]},200,{'access-control-allow-origin':'*'});
  }
  requireSameOrigin(request);
  if(path==='/api/webhooks/razorpay'&&request.method==='POST')return razorpayWebhook(request,env,ctx);
  if(path==='/api/webhooks/paypal'&&request.method==='POST')return paypalWebhook(request,env,ctx);
  const auth=await authRoutes(request,env,path);if(auth)return auth;if(path==='/api/influencers/apply'&&request.method==='POST')return influencerApply(request,env);const user=await getSession(request,env);
  const commerce=await commerceRoutes(request,env,path,user,ctx);if(commerce)return commerce;const customer=await customerRoutes(request,env,path,user);if(customer)return customer;const admin=await adminRoutes(request,env,path,user);if(admin)return admin;const partner=await partnerRoutes(request,env,path,user);if(partner)return partner;throw new ApiError(404,'API route not found','not_found');
}

const DISCOVERY_LINK_HEADER='</.well-known/api-catalog>; rel="api-catalog", </openapi.json>; rel="service-desc"; type="application/openapi+json", </auth.md>; rel="describedby", </.well-known/ai-catalog.json>; rel="ai-catalog"';

const VOWVEL_MARKDOWN=`# Vowvel — Luxury Wedding & Engagement Invitations

> Something worth opening. Five signature design worlds, bespoke digital typography, real guest RSVP collection, and transparent pricing.

Vowvel provides an editorial storefront and five signature invitation design worlds: Conservatory, Gulmohar, After Hours, Sunday Edit, and Azure. Each experience features original thematic artwork, differing envelope openings, interactive reveal animations, guest schedules, calendar sync, keepsakes, maps, RSVP response management, and transparent pricing.

## Signature Invitation Themes
- **Conservatory**: Botanical glasshouse, warm ivory, hand-pressed gold foil, organic romanticism. Live demo: https://vowvel.com/#/preview/conservatory
- **Gulmohar**: Royal crimson, marigold arches, grand heritage festivities, Indian palace architecture. Live demo: https://vowvel.com/#/preview/gulmohar
- **After Hours**: Noir editorial, chandeliers, jazz salon, black-tie midnight elegance. Live demo: https://vowvel.com/#/preview/afterhours
- **Sunday Edit**: Warm editorial linen, relaxed typography, intimate daytime weekend gathering. Live demo: https://vowvel.com/#/preview/sunday
- **Azure**: Mediterranean cliffside, cobalt tiles, sea breeze romance. Live demo: https://vowvel.com/#/preview/azure

## Pricing & Commerce
- **Base Invitation License**: ₹2,499 INR domestic, or $40 USD international via PayPal (one-time purchase, lifetime hosting, guest RSVP dashboard, custom subdomain).
- **Supported Commerce Protocols**: ACP (Agentic Commerce Protocol), UCP (Universal Commerce Protocol), MPP (Machine Payment Protocol), x402 HTTP payments, and AP2.
- **Quote Calculation**: POST /api/coupons/quote
- **Checkout**: POST /api/orders

## AI Agent & Machine Discovery
- **API Catalog**: https://vowvel.com/.well-known/api-catalog (RFC 9727)
- **OpenAPI 3.1 Spec**: https://vowvel.com/openapi.json
- **Agent Skills**: https://vowvel.com/.well-known/agent-skills/index.json
- **SEP-1649 MCP Server**: https://vowvel.com/.well-known/mcp/server-card.json
- **A2A Protocol**: https://vowvel.com/.well-known/agent-card.json
- **Auth Guidelines**: https://vowvel.com/auth.md
- **AR Discovery Manifest**: https://vowvel.com/.well-known/ai-catalog.json
`;

export default {
  async fetch(request:Request,env:RuntimeEnv,ctx:ExecutionContext):Promise<Response>{
    const url=new URL(request.url);
    if(url.pathname.startsWith('/api/')){
      try{return await handleApi(request,env,ctx);}catch(error){const known=error instanceof ApiError;console.error(JSON.stringify({level:'error',path:url.pathname,method:request.method,code:known?error.code:'internal_error',message:error instanceof Error?error.message:'Unknown error'}));return json({error:known?error.message:'Something went wrong',code:known?error.code:'internal_error'},known?error.status:500);}
    }

    const accept=request.headers.get('accept')||'';
    if(accept.includes('text/markdown')&&!url.pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|woff|woff2|css|js|map)$/)){
      const tokens=Math.ceil(VOWVEL_MARKDOWN.length/4);
      return new Response(VOWVEL_MARKDOWN,{
        status:200,
        headers:{
          'content-type':'text/markdown; charset=utf-8',
          'vary':'Accept',
          'x-markdown-tokens':String(tokens),
          'cache-control':'public, max-age=3600',
          'link':DISCOVERY_LINK_HEADER,
          'access-control-allow-origin':'*'
        }
      });
    }

    if(url.pathname==='/.well-known/api-catalog'){
      const asset=await env.ASSETS.fetch(request);
      const headers=new Headers(asset.headers);
      headers.set('content-type','application/linkset+json; charset=utf-8');
      headers.set('access-control-allow-origin','*');
      headers.set('link',DISCOVERY_LINK_HEADER);
      return new Response(asset.body,{status:asset.status,statusText:asset.statusText,headers});
    }

    if(url.pathname.startsWith('/api/auth/')){
      ctx.waitUntil(env.DB.prepare(`DELETE FROM sessions WHERE expires_at<=CURRENT_TIMESTAMP`).run().catch(error=>console.error(JSON.stringify({level:'error',task:'session_cleanup',message:String(error)}))));
    }

    const assetRes=await env.ASSETS.fetch(request);
    const contentType=assetRes.headers.get('content-type')||'';
    if(contentType.includes('text/html')||url.pathname==='/'||url.pathname.startsWith('/preview/')){
      const headers=new Headers(assetRes.headers);
      headers.set('link',DISCOVERY_LINK_HEADER);
      headers.set('vary','Accept');
      return new Response(assetRes.body,{status:assetRes.status,statusText:assetRes.statusText,headers});
    }
    return assetRes;
  },
  async scheduled(_controller:ScheduledController,env:RuntimeEnv,ctx:ExecutionContext):Promise<void>{
    ctx.waitUntil(Promise.all([env.DB.prepare(`DELETE FROM sessions WHERE expires_at<=CURRENT_TIMESTAMP`).run(),env.DB.prepare(`DELETE FROM otp_challenges WHERE expires_at<datetime('now','-1 day')`).run(),env.DB.prepare(`DELETE FROM rate_limits WHERE bucket_start<?`).bind(Math.floor(Date.now()/1000)-86400).run(),releaseExpiredReservations(env),env.DB.prepare(`UPDATE commission_ledger SET status='available' WHERE status='pending' AND available_at<=CURRENT_TIMESTAMP`).run(),flushEmailOutbox(env)]).then(()=>undefined).catch(error=>console.error(JSON.stringify({level:'error',task:'scheduled_maintenance',message:String(error)}))));
  },
} satisfies ExportedHandler<RuntimeEnv>;
