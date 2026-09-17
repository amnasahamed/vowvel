const encoder=new TextEncoder();

function bytesToHex(bytes:Uint8Array):string{return [...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
function bytesToBase64(bytes:Uint8Array):string{
  let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary);
}
function base64ToBytes(value:string):Uint8Array{
  const binary=atob(value);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;
}

export function randomToken(byteLength=32):string{
  const bytes=new Uint8Array(byteLength);crypto.getRandomValues(bytes);
  return bytesToBase64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

export async function sha256(value:string|ArrayBuffer):Promise<string>{
  const input=typeof value==='string'?encoder.encode(value):value;
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',input)));
}

export async function hashPassword(password:string,saltBase64?:string):Promise<{hash:string;salt:string}>{
  if(password.length<10||password.length>200)throw new Error('Password must be 10 to 200 characters');
  const salt=saltBase64?base64ToBytes(saltBase64):crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
  const saltBuffer=salt.buffer.slice(salt.byteOffset,salt.byteOffset+salt.byteLength) as ArrayBuffer;
  const result=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:saltBuffer,iterations:210000},key,256);
  return {hash:bytesToHex(new Uint8Array(result)),salt:bytesToBase64(salt)};
}

export function constantTimeEqual(left:string,right:string):boolean{
  const a=encoder.encode(left);const b=encoder.encode(right);let mismatch=a.length^b.length;
  const length=Math.max(a.length,b.length);
  for(let i=0;i<length;i++)mismatch|=(a[i%Math.max(a.length,1)]??0)^(b[i%Math.max(b.length,1)]??0);
  return mismatch===0;
}

export async function verifyPassword(password:string,salt:string,expected:string):Promise<boolean>{
  const actual=await hashPassword(password,salt);return constantTimeEqual(actual.hash,expected);
}

export async function hmacHex(secret:string,payload:ArrayBuffer|string):Promise<string>{
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return bytesToHex(new Uint8Array(await crypto.subtle.sign('HMAC',key,typeof payload==='string'?encoder.encode(payload):payload)));
}

export function parseCookie(request:Request,name:string):string|null{
  const cookie=request.headers.get('cookie')||'';
  for(const part of cookie.split(';')){const [key,...value]=part.trim().split('=');if(key===name)return decodeURIComponent(value.join('='));}
  return null;
}

export function sessionCookie(token:string,ttlSeconds:number,secure:boolean):string{
  return `vowvel_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ttlSeconds}${secure?'; Secure':''}`;
}

export function clearSessionCookie(secure:boolean):string{
  return `vowvel_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure?'; Secure':''}`;
}

export function isValidEmail(value:string):boolean{return value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)}
