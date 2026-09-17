import type {InvitationData} from './data';
export const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function sharingDetails(data:InvitationData){
 const clean=(s:string)=>s.replace(/\s+/g,' ').trim();
 const names=`${clean(data.name1)||'Your name'} & ${clean(data.name2)||'Their name'}`;
 const event=data.events[0];let date='Date to be announced';
 if(event?.date&&/^\d{4}-\d{2}-\d{2}$/.test(event.date)){
  const parsed=new Date(event.date+'T12:00:00Z');
  if(Number.isFinite(+parsed)&&parsed.toISOString().slice(0,10)===event.date)date=new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(parsed);
 }
 const venue=clean(event?.venue||'');
 if(data.scratch&&date!=='Date to be announced')date='Scratch to reveal our date';
 return {names,date,venue,title:`${names} | ${data.occasion} invitation`,description:`You're invited to celebrate ${names}'s ${data.occasion.toLowerCase()}. ${date}${venue?' · '+venue:''}. Open the invitation for the celebration details.`,imageAlt:`${names} — ${data.occasion}, ${date}${venue?', '+venue:''}`};
}
export function sharingTags(meta:{title:string;description:string;imageAlt:string},url:string,image:string,noindex=true){
 const page=new URL(url),picture=new URL(image,page);
 if(!['https:','http:'].includes(page.protocol)||!['https:','http:'].includes(picture.protocol)||page.hash)throw new Error('Sharing requires a full HTTP(S) URL without a hash route.');
 const tag=(key:string,value:string,property=false)=>`<meta ${property?'property':'name'}="${key}" content="${escapeHtml(value)}"/>`;
 return `<title>${escapeHtml(meta.title)}</title>`+tag('description',meta.description)+`<link rel="canonical" href="${escapeHtml(page.href)}"/>`+
 tag('robots',noindex?'noindex, nofollow':'index, follow')+
 Object.entries({'og:type':'website','og:site_name':'Vowvel','og:title':meta.title,'og:description':meta.description,'og:url':page.href,'og:image':picture.href,'og:image:type':'image/png','og:image:width':'1200','og:image:height':'630','og:image:alt':meta.imageAlt}).map(([k,v])=>tag(k,v,true)).join('')+
 Object.entries({'twitter:card':'summary_large_image','twitter:title':meta.title,'twitter:description':meta.description,'twitter:image':picture.href,'twitter:image:alt':meta.imageAlt}).map(([k,v])=>tag(k,v)).join('');
}
export function sharingSvg(data:InvitationData,palette:{paper:string;color:string},artDataUrl:string){
 const m=sharingDetails(data),e=escapeHtml;
 const fit=(value:string,max:number)=>value.length>max?value.slice(0,max-1)+'…':value;
 const name1=fit(data.name1.trim()||'Your name',45),name2=fit(data.name2.trim()||'Their name',45);
 const size=Math.min(72,Math.floor(960/Math.max(name1.length,name2.length,14)));
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${e(palette.paper)}"/><image href="${e(artDataUrl)}" x="0" y="0" width="410" height="630" preserveAspectRatio="xMidYMid slice"/><rect x="434" y="24" width="742" height="582" fill="none" stroke="${e(palette.color)}" stroke-opacity=".3"/><g fill="${e(palette.color)}" text-anchor="middle"><text x="805" y="104" font-family="sans-serif" font-size="15" letter-spacing="4">YOU ARE LOVINGLY INVITED</text><text x="805" y="223" font-family="Georgia,serif" font-size="${size}">${e(name1)}</text><text x="805" y="276" font-family="Georgia,serif" font-size="36" font-style="italic">&amp;</text><text x="805" y="351" font-family="Georgia,serif" font-size="${size}">${e(name2)}</text><text x="805" y="414" font-family="sans-serif" font-size="17" letter-spacing="3">${e(data.occasion.toUpperCase())}</text><text x="805" y="463" font-family="Georgia,serif" font-size="25">${e(m.date)}</text><text x="805" y="503" font-family="sans-serif" font-size="18">${e(fit(m.venue,52))}</text><text x="805" y="563" font-family="Georgia,serif" font-size="22" letter-spacing="5">vowvel</text></g></svg>`;
}
