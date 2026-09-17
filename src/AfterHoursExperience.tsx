import {type ReactNode} from 'react';
import {ArrowDown,ArrowUpRight} from '@phosphor-icons/react';
import {formatDate,formatTime,type InvitationData,type Ceremony} from './data';
import CoupleSection from './CoupleSection';
import AmbientFilm from './AmbientFilm';
import {EffectLifecycle,Atmosphere} from './InvitationEffects';
import './afterhours-experience.css';

type Props={data:InvitationData;embedded:boolean;reply:ReactNode;surprise:ReactNode;countdown:ReactNode;onCalendar:(event:Ceremony)=>void;onDetails:(event:React.MouseEvent<HTMLAnchorElement>)=>void;onReopen:()=>void};
const scene='/art/scenes/afterhours-chandelier.webp';

function Entrance({data,embedded,onDetails}:Pick<Props,'data'|'embedded'|'onDetails'>){
 const first=data.events[0];
 const atmoKind = data.design?.atmosphere;
 const heroAtmo = atmoKind === 'none' ? undefined : (atmoKind && atmoKind !== 'auto' ? atmoKind : 'sparkles');
 return <header className="opening-hero nocturne-entrance">
  <div className="nocturne-scene">
   <AmbientFilm theme="afterhours" embedded={embedded}/>
  </div>
  {heroAtmo&&<Atmosphere kind={heroAtmo as any}/>}
  <div className="nocturne-entrance-copy">
   <p className="nocturne-kicker">With love, you are invited</p>
   <h1 tabIndex={-1} className={Math.max(data.name1.length,data.name2.length)>14?'nocturne-long-names':''}><span>{data.name1||'Your name'}</span><i>&</i><span>{data.name2||'Their name'}</span></h1>
   <p className="nocturne-occasion">{data.occasion==='Engagement'?'Are getting engaged.':'Are getting married.'}<br/><em>You’re part of the story.</em></p>
   <div className="nocturne-arrival"><span>{formatDate(first?.date||'')}</span><span>{first?.venue||'Venue to be announced'}</span></div>
  </div>
  <a className="nocturne-enter" href="#inv-welcome" onClick={onDetails}>The evening awaits <ArrowDown size={18}/></a>
 </header>;
}

export default function AfterHoursExperience({data,embedded,reply,surprise,countdown,onCalendar,onDetails,onReopen}:Props){
 const notes=[['Dress for the occasion',data.dressCode],...(data.sections.travel?[['Getting here',data.transport],['Stay a little longer',data.accommodation]]:[]),...(data.sections.gifts?[['Your presence is everything',data.gifts]]:[])].filter(([,text])=>text.trim());
 const photos=data.photos.filter(Boolean).slice(0,6);const images=photos.length?photos:['/art/keepsake-letters.webp','/art/keepsake-table.webp','/art/keepsake-hands.webp'];
 
 const customTitles = data.design?.sectionTitles;
 const defaultOrder = ['welcome','couple','story','events','scratch','gallery','notes','rsvp'];
 const sectionOrder = data.design?.sectionOrder?.length ? data.design.sectionOrder : defaultOrder;

 const sectionComponents: Record<string, ReactNode> = {
  welcome: <section id="inv-welcome" key="welcome" className="inv-section nocturne-letter">
   <div className="nocturne-letter-heading"><span className="nocturne-kicker">{customTitles?.welcome||'A note from us'}</span><h2>Some nights<br/>become <em>stories.</em></h2><span className="nocturne-written">This one is ours.</span></div>
   <div className="nocturne-letter-body">{data.family.trim()&&<p className="nocturne-family">{data.family}</p>}<p>{data.welcome}</p><span className="nocturne-signature">{data.name1||'Your name'} & {data.name2||'Their name'}</span><a href="#inv-events" onClick={onDetails}>Be there for our beginning <ArrowUpRight size={18}/></a></div>
  </section>,
  couple: <CoupleSection key="couple" data={data}/>,
  story: data.sections.story&&data.story.trim()?<section key="story" className="inv-section nocturne-story"><Atmosphere kind="silk"/><figure><img src={photos[0]||'/art/keepsake-hands.webp'} alt={photos.length?'A memory of the couple':'Illustrative wedding photograph of a couple holding hands'} loading="lazy"/><figcaption>{photos.length?'A moment, forever.':'A little glimpse of forever · illustrative photograph'}</figcaption></figure><div><span className="nocturne-kicker">{customTitles?.story||'Of all the people in the world'}</span><h2>It was<br/><em>always you.</em></h2><p>{data.story}</p><span className="nocturne-story-mark" aria-hidden="true">{Array.from(data.name1||'Y')[0]}<i>&</i>{Array.from(data.name2||'T')[0]}</span></div></section>:null,
  events: <section id="inv-events" key="events" className="inv-section nocturne-programme"><div className="nocturne-programme-intro"><span className="nocturne-kicker">{customTitles?.events||'Your invitation to a beautiful night'}</span><h2>The evening’s<br/><em>programme.</em></h2><p>A place for you in every moment.</p></div><div className="nocturne-events">{data.events.map((event,index)=><div className="nocturne-event" key={event.id}><span className="nocturne-event-index" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div className="nocturne-event-title"><p>{formatDate(event.date)}</p><h3>{event.name}</h3><span>{formatTime(event.time)}{event.time?' IST':''}</span></div><div className="nocturne-event-details"><p>{event.note}</p><strong>{event.venue||'Venue to be announced'}</strong><p>{event.address}</p><div>{(event.venue||event.address)&&<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue,event.address].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer">Directions <ArrowUpRight size={16}/></a>}{event.date&&event.time&&<button onClick={()=>onCalendar(event)}>Add to calendar ＋</button>}</div></div></div>)}</div></section>,
  scratch: <div key="scratch" className="nocturne-anticipation">{countdown}{data.scratch&&<div className="nocturne-surprise">{surprise}</div>}</div>,
  gallery: data.sections.gallery?<section key="gallery" className="inv-section nocturne-memories"><div><span className="nocturne-kicker">{customTitles?.gallery||'The little things. The whole world.'}</span><h2>For the <em>memory books.</em></h2></div><div className="nocturne-filmstrip" tabIndex={0} role="region" aria-label="Couple’s photographs; scroll horizontally to see more">{images.map((src,index)=><figure key={`${src}-${index}`}><span aria-hidden="true">{String(index+1).padStart(2,'0')} / {String(images.length).padStart(2,'0')}</span><img src={src} alt={photos.length?`Couple’s photograph ${index+1}`:['Illustrative wedding letter and keepsakes','Illustrative celebration table','Illustrative photograph of a couple holding hands'][index]} loading="lazy"/><figcaption>{photos.length?'A moment we keep.':'Illustrative photograph · replace with your memories'}</figcaption></figure>)}</div><p className="nocturne-gallery-hint">Scroll through our little collection →</p></section>:null,
  notes: notes.length>0?<section key="notes" className="inv-section nocturne-notes"><div className="nocturne-notes-heading"><span className="nocturne-kicker">{customTitles?.notes||'Make yourself at home'}</span><h2>A few<br/><em>little details.</em></h2><img src="/art/afterhours.webp" alt="Champagne and dark florals" loading="lazy"/></div><div className="nocturne-notes-list">{notes.map(([title,text],index)=><div key={title}><span>{String(index+1).padStart(2,'0')}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>:null,
  rsvp: data.sections.rsvp?<div key="rsvp" className="nocturne-rsvp-wrap"><div className="nocturne-rsvp-art" aria-hidden="true"><img src={scene} alt="" loading="lazy"/><span>We saved<br/>you a <em>place.</em></span></div>{reply}</div>:null
 };

 return <div className="inv-page nocturne"><EffectLifecycle embedded={embedded}/>
  <Entrance data={data} embedded={embedded} onDetails={onDetails}/>
  {sectionOrder.map(secId => sectionComponents[secId] || null)}
  <footer className="nocturne-footer"><p>{data.closing}</p><span className="nocturne-kicker">Until the very last dance</span><h2><span>{data.name1||'Your name'}</span><i>&</i><span>{data.name2||'Their name'}</span></h2><div><span>With love, with Vowvel</span>{!embedded&&<button onClick={onReopen}>Open the envelope again ↻</button>}</div></footer>
 </div>;
}
