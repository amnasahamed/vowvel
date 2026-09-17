export type DiscountType = 'percentage' | 'fixed';

export interface CouponRule {
  discountType: DiscountType;
  discountValue: number;
  maxDiscountCents: number | null;
  minSubtotalCents: number;
}

export interface PriceQuote {
  subtotalCents: number;
  discountCents: number;
  taxableCents: number;
  taxCents: number;
  totalCents: number;
}

export function calculateQuote(subtotalCents:number, taxBps:number, coupon:CouponRule|null):PriceQuote {
  if(!Number.isSafeInteger(subtotalCents)||subtotalCents<0)throw new Error('Invalid subtotal');
  if(!Number.isInteger(taxBps)||taxBps<0||taxBps>10000)throw new Error('Invalid tax rate');
  let discountCents=0;
  if(coupon&&subtotalCents>=coupon.minSubtotalCents){
    discountCents=coupon.discountType==='percentage'
      ?Math.round(subtotalCents*coupon.discountValue/10000)
      :coupon.discountValue;
    if(coupon.maxDiscountCents!==null)discountCents=Math.min(discountCents,coupon.maxDiscountCents);
    discountCents=Math.min(subtotalCents,Math.max(0,discountCents));
  }
  const taxableCents=subtotalCents-discountCents;
  const taxCents=Math.round(taxableCents*taxBps/10000);
  return {subtotalCents,discountCents,taxableCents,taxCents,totalCents:taxableCents+taxCents};
}

export function calculateCommission(basisCents:number,rateBps:number):number{
  if(!Number.isSafeInteger(basisCents)||basisCents<0)throw new Error('Invalid commission basis');
  if(!Number.isInteger(rateBps)||rateBps<0||rateBps>10000)throw new Error('Invalid commission rate');
  return Math.round(basisCents*rateBps/10000);
}

const CODE_ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateCouponCode(prefix='',length=10):string{
  const safePrefix=prefix.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12);
  if(!Number.isInteger(length)||length<6||length>24)throw new Error('Code length must be between 6 and 24');
  const bytes=new Uint8Array(length);crypto.getRandomValues(bytes);
  let random='';
  for(const byte of bytes)random+=CODE_ALPHABET[byte%CODE_ALPHABET.length];
  return safePrefix?`${safePrefix}-${random}`:random;
}

export function normalizeCouponCode(value:string):string{return value.trim().toUpperCase().replace(/\s+/g,'')}

export function csvCell(value:string):string{
  const safe=/^[=+\-@\t\r]/.test(value)?`'${value}`:value;
  return `"${safe.replace(/"/g,'""')}"`;
}

export interface RsvpInput {
  guestName:string;
  email:string;
  attendance:'yes'|'no';
  partySize:number;
  eventIds:string[];
  guestNames:string;
  dietaryNotes:string;
  message:string;
}

const rsvpText=(value:unknown,max:number):string=>typeof value==='string'?value.trim().slice(0,max):'';

/** Normalize untrusted guest input against the event IDs in the published invitation. */
export function normalizeRsvpInput(value:unknown,allowedEventIds:readonly string[]):RsvpInput{
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Reply details are required');
  const body=value as Record<string,unknown>;
  const guestName=rsvpText(body.guestName,100);
  if(!guestName)throw new Error('Please enter your name');
  const email=rsvpText(body.email,254).toLowerCase();
  if(email&&(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))throw new Error('Enter a valid email or leave it blank');
  const attendance=body.attendance==='no'?'no':body.attendance==='yes'?'yes':null;
  if(!attendance)throw new Error('Choose whether you can attend');
  const requested=Array.isArray(body.eventIds)?body.eventIds.filter((item):item is string=>typeof item==='string'):[];
  const allowed=new Set(allowedEventIds);
  if(requested.some(eventId=>!allowed.has(eventId)))throw new Error('Choose a valid event from this invitation');
  const eventIds=[...new Set(requested)].filter(eventId=>allowed.has(eventId));
  if(attendance==='yes'&&!eventIds.length)throw new Error('Choose at least one event you plan to attend');
  const rawPartySize=typeof body.partySize==='number'?body.partySize:Number(body.partySize);
  const partySize=attendance==='no'?0:rawPartySize;
  if(attendance==='yes'&&(!Number.isInteger(partySize)||partySize<1||partySize>20))throw new Error('Party size must be between 1 and 20');
  return {guestName,email,attendance,partySize,eventIds:attendance==='yes'?eventIds:[],guestNames:attendance==='yes'?rsvpText(body.guestNames,500):'',dietaryNotes:attendance==='yes'?rsvpText(body.dietaryNotes,800):'',message:rsvpText(body.message,1200)};
}
