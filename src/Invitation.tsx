import DateScratch, { scratchTreatments } from './DateScratch';
import { useEffect, useRef, useState } from 'react';
import type { InvitationData, Ceremony } from './data';
import InvitationCover from './InvitationCover';
import InvitationFilm from './InvitationFilm';
import {OpeningFilmActive} from './films';
import {RsvpConfetti} from './InvitationEffects';
import {api} from './api';
import {trackStep} from './analytics';
import '@fontsource/great-vibes/400.css';
import './invitation.css';
import './opening-hero.css';
import './scene-motion.css';
import { suites } from './suites';
import { SuiteMonogram } from './SuiteDetails';
import './invitation-suite.css';
import AfterHoursExperience from './AfterHoursExperience';
import ArtisticExperience from './ArtisticExperience';

function calendar(event: Ceremony) {
  if (!event.date || !event.time) return;
  const start = new Date(`${event.date}T${event.time}:00+05:30`);
  if (!Number.isFinite(start.getTime())) return;
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/[,;]/g, '\\$&');
  const body = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Vowvel//Invitation//EN','BEGIN:VEVENT',`UID:${event.id}-${stamp(start)}@vowvel.local`,`DTSTAMP:${stamp(new Date())}`,`DTSTART:${stamp(start)}`,`DTEND:${stamp(new Date(start.getTime()+7200000))}`,`SUMMARY:${escape(event.name)}`,`LOCATION:${escape(event.venue+', '+event.address)}`,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  const anchor = document.createElement('a'); anchor.href=url; anchor.download='save-the-date.ics'; anchor.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function Scratch({ data, revealed, onReveal }: { data: InvitationData; revealed: boolean; onReveal: () => void }) {
  return <DateScratch theme={data.theme} date={data.events[0]?.date || ''} note={data.scratchNote} revealed={revealed} onReveal={onReveal}/>;
}

interface SavedRsvp {version:1;editToken:string;response:{guestName:string;email:string;attendance:'yes'|'no';partySize:number;eventIds:string[];guestNames:string;dietaryNotes:string;message:string}}
function Reply({data,slug}:{data:InvitationData;slug?:string}){
  const storageKey=slug?`vowvel:rsvp:${slug}`:'vowvel-demo-rsvp';
  const [sent,setSent]=useState(false);const [celebration,setCelebration]=useState(0);const [savedOnDevice,setSavedOnDevice]=useState(false);const [editToken,setEditToken]=useState('');const [busy,setBusy]=useState(false);
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [answer,setAnswer]=useState<'yes'|'no'>('yes');const [selected,setSelected]=useState(data.events.map(event=>event.id));const [message,setMessage]=useState('');const [partySize,setPartySize]=useState(1);const [guestNames,setGuestNames]=useState('');const [dietaryNotes,setDietaryNotes]=useState('');const [error,setError]=useState('');
  const eventIds=data.events.map(event=>event.id).join('|');
  useEffect(()=>{setSelected(current=>current.filter(id=>data.events.some(event=>event.id===id)));},[eventIds,data.events]);
  useEffect(()=>{if(!slug)return;try{const parsed=JSON.parse(localStorage.getItem(storageKey)||'null') as SavedRsvp|null;if(!parsed||parsed.version!==1||!parsed.editToken)return;const response=parsed.response;setEditToken(parsed.editToken);setName(response.guestName);setEmail(response.email);setAnswer(response.attendance);setPartySize(response.partySize||1);setSelected(response.eventIds);setGuestNames(response.guestNames);setDietaryNotes(response.dietaryNotes);setMessage(response.message);setSavedOnDevice(true);setSent(true);}catch{/* Local storage is optional. */}},[slug,storageKey]);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();if(!name.trim()){setError('Please enter your name.');return}if(answer==='yes'&&!selected.some(id=>data.events.some(item=>item.id===id))){setError('Choose at least one event you plan to attend.');return}
    const form=new FormData(event.currentTarget);const response={guestName:name.trim(),email:email.trim(),attendance:answer,partySize:answer==='yes'?partySize:0,eventIds:answer==='yes'?selected:[],guestNames:answer==='yes'?guestNames.trim():'',dietaryNotes:answer==='yes'?dietaryNotes.trim():'',message:message.trim()};setBusy(true);setError('');
    try{let token=editToken;if(slug){const result=await api<{editToken:string}>(`/api/invitations/${encodeURIComponent(slug)}/rsvp`,{method:'POST',body:JSON.stringify({...response,editToken,website:form.get('website')})});token=result.editToken;setEditToken(token)}const saved:SavedRsvp={version:1,editToken:token,response};try{localStorage.setItem(storageKey,JSON.stringify(saved));setSavedOnDevice(true)}catch{setSavedOnDevice(false)}setSent(true);setCelebration(value=>answer==='yes'?value+1:0);}catch(reason){setError(reason instanceof Error?reason.message:'Your reply could not be saved. Please try again.')}finally{setBusy(false)}
  }
  return <section id="inv-rsvp" className="inv-reply inv-section"><div className="suite-reply-heading"><SuiteMonogram data={data}/><span className="inv-eyebrow">THE REPLY CARD</span><h2>{suites[data.theme].reply}</h2></div><p>A celebration is only as lovely as the people in it.</p>{sent?<div className="inv-reply-success" role="status">{celebration>0&&<RsvpConfetti key={celebration} theme={data.theme}/>}<span>♡</span><h3>Thank you, {name}.</h3><p>{slug?`Your reply has reached ${data.name1} and ${data.name2}.`:'This is a preview; no reply was sent.'} {savedOnDevice?'You can return on this device to update it.':''}</p><button className="inv-button" onClick={()=>setSent(false)}>{slug?'Update your reply':'Edit sample reply'}</button></div>:<form onSubmit={submit}><label>Your name<input required maxLength={100} value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="First and last name"/></label><label>Email <span>(optional)</span><input type="email" maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="For any RSVP follow-up"/></label><fieldset><legend>Can you make it?</legend><div className="inv-attendance"><label><input type="radio" name="attendance" checked={answer==='yes'} onChange={()=>setAnswer('yes')}/>Joyfully accept</label><label><input type="radio" name="attendance" checked={answer==='no'} onChange={()=>setAnswer('no')}/>Regretfully decline</label></div></fieldset>{answer==='yes'&&<fieldset><legend>We’ll see you at</legend>{data.events.map(item=><label className="inv-checkbox" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={e=>setSelected(current=>e.target.checked?[...current,item.id]:current.filter(id=>id!==item.id))} name="events" value={item.id}/>{item.name}</label>)}</fieldset>}{answer==='yes'&&<><label>People in your party <span>(including you)</span><input type="number" min="1" max="20" required value={partySize} onChange={e=>setPartySize(Number(e.target.value))}/></label><label>Additional guest names <span>(optional)</span><textarea value={guestNames} maxLength={500} onChange={e=>setGuestNames(e.target.value)} placeholder="Who will be joining you?" rows={2}/></label><label>Dietary or accessibility needs <span>(optional)</span><textarea value={dietaryNotes} maxLength={800} onChange={e=>setDietaryNotes(e.target.value)} placeholder="Anything the hosts should plan for" rows={2}/></label></>}<label>A little note <span>(optional)</span><textarea value={message} maxLength={1200} onChange={e=>setMessage(e.target.value)} placeholder="Leave the couple a little love…" rows={2}/></label><label className="sr-only" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><p className="inv-form-error" role="alert">{error}</p><button className="inv-button" type="submit" disabled={busy}>{busy?'Saving your reply…':editToken?'Update reply':slug?'Send RSVP':'Save sample reply'} <span>↗</span></button><small>{slug?'Your response is private and only visible to the invitation owner.':'Preview only · No message will be sent.'}</small></form>}</section>;
}
function Countdown({event}:{event:Ceremony|undefined}){
 const [now,setNow]=useState(Date.now());useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer)},[]);
 if(!event?.date)return null;const seconds=Math.max(0,Math.floor((new Date(event.date+'T'+(event.time||'00:00')+':00+05:30').getTime()-now)/1000));
 const values=[Math.floor(seconds/86400),Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60];
 return <section className="inv-section inv-countdown-section"><span className="inv-eyebrow">{seconds?'EVERY SECOND, A LITTLE CLOSER':'OUR BEAUTIFUL DAY HAS ARRIVED'}</span><div className="inv-countdown" aria-label="Countdown to celebration">{values.map((n,i)=><div key={i}><strong>{String(n).padStart(2,'0')}</strong><span>{['Days','Hours','Minutes','Seconds'][i]}</span></div>)}</div><span className="inv-countdown-caption">until we make a forever kind of memory.</span></section>;
}
export default function Invitation({
  data,
  slug,
  embedded=false,
  initiallyOpen=false,
  showCover=false,
  skipIntroFilm=false,
  onClose,
  onUse
}:{
  data: InvitationData;
  slug?: string;
  embedded?: boolean;
  initiallyOpen?: boolean;
  showCover?: boolean;
  skipIntroFilm?: boolean;
  onClose?: () => void;
  onUse?: () => void;
}){
  const revealKey=JSON.stringify([data.theme,data.events.map(event=>event.date),data.scratch]);
  const [revealedKey,setRevealedKey]=useState<string|null>(null);
  const dateRevealed=!data.scratch||revealedKey===revealKey;
  const treatment=scratchTreatments[data.theme];
  const articleRef=useRef<HTMLElement>(null);const [pastHero,setPastHero]=useState(false);
  const [open,setOpen]=useState(showCover ? false : (embedded||initiallyOpen));
  const [film,setFilm]=useState(false);
  const first=data.events[0];const wasOpen=useRef(open);
  useEffect(()=>{if(open&&!film&&!wasOpen.current&&!embedded){window.scrollTo({top:0,behavior:'instant'});articleRef.current?.querySelector<HTMLElement>('.opening-hero h1')?.focus({preventScroll:true});}wasOpen.current=open&&!film;},[open,film,embedded]);
  useEffect(()=>{setOpen(showCover ? false : (embedded||initiallyOpen));setFilm(false);},[data.theme,embedded,initiallyOpen,showCover]);
  useEffect(()=>{if(embedded||open&&!film)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;};},[embedded,open,film]);
  useEffect(()=>{if(!open||embedded||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const sections=articleRef.current?.querySelectorAll('.inv-section');if(!sections||!('IntersectionObserver' in window))return;const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('inv-section-visible');observer.unobserve(entry.target);}});},{threshold:0.06});sections.forEach(section=>{section.classList.add('inv-section-reveal');observer.observe(section);});return()=>{observer.disconnect();sections.forEach(section=>section.classList.remove('inv-section-reveal','inv-section-visible'));};},[open,embedded,data.theme]);
  useEffect(()=>{setPastHero(false);if(!open||embedded||!('IntersectionObserver' in window))return;const hero=articleRef.current?.querySelector('.opening-hero');if(!hero)return;const observer=new IntersectionObserver(([entry])=>setPastHero(!entry.isIntersecting&&entry.boundingClientRect.bottom<=0));observer.observe(hero);return()=>observer.disconnect()},[open,embedded]);
  const scrollLocal=(e:React.MouseEvent<HTMLAnchorElement>)=>{e.preventDefault();const section=e.currentTarget.getAttribute('href');if(section)e.currentTarget.closest('article')?.querySelector(section)?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};

  const fontMoodClass = data.design?.fontMood ? `font-mood-${data.design.fontMood}` : '';
  const customStyles: Record<string, string> = {};
  if (data.design?.accentColor) customStyles['--ink'] = data.design.accentColor;
  if (data.design?.paperColor) customStyles['--paper'] = data.design.paperColor;
  const showCountdown = data.design?.countdown !== false;

  const handleOpenCover = () => {
    setOpen(true);
    if (!skipIntroFilm && !embedded && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFilm(true);
    } else {
      setFilm(false);
    }
  };

  return <article ref={articleRef} style={customStyles as any} className={`invitation inv-continuous inv-${data.theme} ${fontMoodClass} ${embedded?'inv-embedded':''} ${open?'inv-is-open':''}`}>
    {!embedded&&!slug&&<div className="inv-topbar" inert={!open||film}><button onClick={onClose} className="inv-text-button">← Back</button><span className="inv-price-chip">Free to design · ₹2,499 to publish</span>{onUse&&<div className="inv-topbar-actions"><button className="inv-text-button" onClick={()=>{trackStep('preview_use_clicked',{theme:data.theme,intent:'make_yours'});onUse();}}>Make this yours</button><button className="inv-text-button inv-start-draft" onClick={()=>{trackStep('preview_use_clicked',{theme:data.theme,intent:'start_draft'});onUse();}}>Start free draft ↗</button></div>}</div>}
    {!open&&!film&&<InvitationCover key={data.theme} theme={data.theme} name1={data.name1} name2={data.name2} design={data.design} onSkip={()=>setOpen(true)} onOpen={handleOpenCover}/> }
    {film&&<InvitationFilm key={data.theme} theme={data.theme} onComplete={()=>{setFilm(false);setOpen(true)}}/>}
    <OpeningFilmActive value={film}><div inert={film} aria-hidden={film||undefined}>
    {open&&data.theme==='afterhours'?<><AfterHoursExperience data={data} embedded={embedded} reply={<Reply data={data} slug={slug}/>} surprise={<section id="inv-date-reveal" className="inv-section inv-surprise"><h2>{treatment.heading}</h2><p>{treatment.hint}</p><Scratch key={revealKey} data={data} revealed={dateRevealed} onReveal={()=>setRevealedKey(revealKey)}/></section>} countdown={showCountdown?<Countdown event={first}/>:null} onCalendar={calendar} onDetails={scrollLocal} onReopen={()=>{setRevealedKey(null);setOpen(false);articleRef.current?.scrollIntoView({behavior:'instant'});requestAnimationFrame(()=>articleRef.current?.querySelector<HTMLElement>('.cover-seal')?.focus({preventScroll:true}));}}/>{!embedded&&pastHero&&<nav className="inv-guest-nav" aria-label="Guest quick actions">{data.sections.rsvp&&<a href="#inv-rsvp" onClick={scrollLocal}>RSVP ♡</a>}<a href="#inv-events" onClick={scrollLocal}>Event details ↗</a>{first?.date&&first.time&&<button onClick={()=>calendar(first)}>Save date ＋</button>}</nav>}</>:open&&<><ArtisticExperience data={data} embedded={embedded} reply={<Reply data={data} slug={slug}/>} surprise={<section id="inv-date-reveal" className="inv-section inv-surprise"><span className="inv-eyebrow">{treatment.eyebrow}</span><h2>{treatment.heading}</h2><p>{treatment.hint}</p><Scratch key={revealKey} data={data} revealed={dateRevealed} onReveal={()=>setRevealedKey(revealKey)}/></section>} countdown={showCountdown?<Countdown event={first}/>:null} onCalendar={calendar} onDetails={scrollLocal} onReopen={()=>{setRevealedKey(null);setOpen(false);articleRef.current?.scrollIntoView({behavior:'instant'});requestAnimationFrame(()=>articleRef.current?.querySelector<HTMLElement>('.cover-seal')?.focus({preventScroll:true}));}}/>{!embedded&&pastHero&&<nav className="inv-guest-nav" aria-label="Guest quick actions">{data.sections.rsvp&&<a href="#inv-rsvp" onClick={scrollLocal}>RSVP ♡</a>}<a href="#inv-events" onClick={scrollLocal}>Event details ↗</a>{first?.date&&first.time&&<button onClick={()=>calendar(first)}>Save date ＋</button>}</nav>}</>}
    </div></OpeningFilmActive>
  </article>;
}
