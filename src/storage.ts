import { blankDraft, type InvitationData, type Ceremony, themeById, emptyCouple } from './data';
const KEY='vowvel:draft:v1';
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const text=(value:unknown,fallback:string,max=1800)=>typeof value==='string'?value.slice(0,max):fallback;
const validDate=(value:unknown):string=>{
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
 const parsed=new Date(value+'T12:00:00Z');
 return Number.isFinite(parsed.getTime())&&parsed.toISOString().slice(0,10)===value?value:'';
};
const validTime=(value:unknown):string=>typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value)?value:'';
/** Accept a versioned backup or stored draft; normalize every field before rendering. */
export function normalizeDraft(value:unknown):InvitationData|null {
 if(!record(value)||value.version!==1||!record(value.data))return null;
 const raw=value.data;const result=structuredClone(blankDraft);
 const stringFields=['name1','name2','welcome','family','story','scratchNote','dressCode','transport','accommodation','gifts','closing'] as const;
 for(const key of stringFields)result[key]=text(raw[key],result[key],key==='name1'||key==='name2'?45:1800);
 result.occasion=raw.occasion==='Engagement'?'Engagement':'Wedding';
 result.theme=themeById(typeof raw.theme==='string'?raw.theme:'').id;
 result.music=typeof raw.music==='boolean'?raw.music:result.music;
 result.scratch=typeof raw.scratch==='boolean'?raw.scratch:result.scratch;
 if(record(raw.sections))for(const key of Object.keys(result.sections) as (keyof InvitationData['sections'])[])if(typeof raw.sections[key]==='boolean')result.sections[key]=raw.sections[key];
 const used=new Set<string>();
 const events:Ceremony[]=[];
 if(Array.isArray(raw.events))for(const [index,event] of raw.events.slice(0,8).entries()){
  if(!record(event))continue;
  let id=text(event.id,'',100).replace(/[^a-zA-Z0-9_-]/g,'');
  if(!id||used.has(id))id=`event-${index+1}`;
  while(used.has(id))id+='-copy';
  used.add(id);
  events.push({id,name:text(event.name,'Your celebration',80),date:validDate(event.date),time:validTime(event.time),venue:text(event.venue,'',100),address:text(event.address,'',220),note:text(event.note,'',400)});
 }
 if(events.length)result.events=events;
 if(record(raw.couple)){
  const couple=emptyCouple();
  couple.enabled=raw.couple.enabled===true;couple.showFamily=raw.couple.showFamily===true;
  const rawProfiles=raw.couple.profiles;
  if(Array.isArray(rawProfiles))couple.profiles=couple.profiles.map((fallback,index)=>{
   const profile=rawProfiles[index];if(!record(profile))return fallback;
   const photo=typeof profile.photo==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(profile.photo)&&profile.photo.length<=2_000_000?profile.photo:'';
   return {role:text(profile.role,'',45),photo,intro:text(profile.intro,'',500),familyName:text(profile.familyName,'',100),guardians:text(profile.guardians,'',200)};
  }) as typeof couple.profiles;
  result.couple=couple;
 }
 if(record(raw.design)){
  const d=raw.design;
  const isHex=(c:unknown):c is string=>typeof c==='string'&&/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(c);
  const validFont=(f:unknown)=>['cormorant','dm-serif','space-grotesk','script'].includes(f as string)?(f as any):undefined;
  const validSeal=(s:unknown)=>['monogram','initials','heart','botanical','palace'].includes(s as string)?(s as any):undefined;
  const validAtmo=(a:unknown)=>['auto','flowers','petals','sparkles','fireflies','silk','none'].includes(a as string)?(a as any):undefined;

  const baseDesign = result.design ? { ...result.design } : {
   fontMood: 'cormorant' as const,
   sealEmblem: 'monogram' as const,
   atmosphere: 'auto' as const,
   countdown: true
  };

  if (isHex(d.accentColor)) baseDesign.accentColor = d.accentColor;
  if (isHex(d.paperColor)) baseDesign.paperColor = d.paperColor;
  if (validFont(d.fontMood)) baseDesign.fontMood = validFont(d.fontMood);
  if (validSeal(d.sealEmblem)) baseDesign.sealEmblem = validSeal(d.sealEmblem);
  if (isHex(d.sealColor)) baseDesign.sealColor = d.sealColor;
  if (typeof d.envelopeNote === 'string') baseDesign.envelopeNote = text(d.envelopeNote, '', 80);
  if (validAtmo(d.atmosphere)) baseDesign.atmosphere = validAtmo(d.atmosphere);
  if (typeof d.countdown === 'boolean') baseDesign.countdown = d.countdown;
  if (Array.isArray(d.sectionOrder)) {
   const order = d.sectionOrder.filter((s): s is string => typeof s === 'string' && ['welcome','couple','story','events','scratch','gallery','notes','rsvp'].includes(s));
   if (order.length) baseDesign.sectionOrder = order;
  }
  if (record(d.sectionTitles)) {
   const titles = Object.fromEntries(Object.entries(d.sectionTitles).filter(([k,v])=>typeof k==='string'&&typeof v==='string').map(([k,v])=>[k,text(v,'',60)]));
   if (Object.keys(titles).length) baseDesign.sectionTitles = titles;
  }

  result.design = baseDesign;
 }
 result.photos=Array.isArray(raw.photos)?raw.photos.filter((photo):photo is string=>typeof photo==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(photo)&&photo.length<=2_000_000).slice(0,6):[];
 return result;
}
export function loadDraft():InvitationData {
 try{return normalizeDraft(JSON.parse(localStorage.getItem(KEY)||'null'))||structuredClone(blankDraft)}catch{return structuredClone(blankDraft)}
}
export function saveDraft(data:InvitationData):boolean {try{localStorage.setItem(KEY,JSON.stringify({version:1,data}));return true}catch{return false}}
export function hasDraft(){try{return normalizeDraft(JSON.parse(localStorage.getItem(KEY)||'null'))!==null}catch{return false}}
export function downloadDraft(data:InvitationData){const blob=new Blob([JSON.stringify({version:1,data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='vowvel-invitation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
