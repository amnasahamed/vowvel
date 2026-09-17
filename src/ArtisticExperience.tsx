import {type ReactNode} from 'react';
import {ArrowDown,ArrowUpRight} from '@phosphor-icons/react';
import {formatDate,formatTime,themeById,type InvitationData,type Ceremony} from './data';
import {suites} from './suites';
import CoupleSection from './CoupleSection';
import AmbientFilm from './AmbientFilm';
import KeepsakeGallery from './KeepsakeGallery';
import {EffectLifecycle,Atmosphere,BotanicalBorder,TearNote,Postcard} from './InvitationEffects';
import './artistic-experience.css';

type Props={data:InvitationData;embedded:boolean;reply:ReactNode;surprise:ReactNode;countdown:ReactNode;onCalendar:(event:Ceremony)=>void;onDetails:(event:React.MouseEvent<HTMLAnchorElement>)=>void;onReopen:()=>void};
const captions={conservatory:['A love letter in bloom.','A place at our table.','The little things, together.'],gulmohar:['Words we will keep.','Gathered with love.','Two lives, one beginning.'],sunday:['Love notes, obviously.','Our favourite kind of table.','You + me. That’s the plan.'],azure:['Postcards from us.','Somewhere we’ll remember.','Our favourite travelling companion.'],afterhours:[]};
const interiorArt=(theme:string)=>`/art/interiors/${theme}-v1.webp`;
const photographs=['/art/keepsake-letters.webp','/art/keepsake-table.webp','/art/keepsake-hands.webp'];
function Names({data}:{data:InvitationData}){return <><span>{data.name1||'Your name'}</span><i>{data.theme==='sunday'?'+':'&'}</i><span>{data.name2||'Their name'}</span></>}
function Mark({data}:{data:InvitationData}){return <span className="art-monogram" aria-hidden="true">{Array.from(data.name1||'Y')[0]}<i>&</i>{Array.from(data.name2||'T')[0]}</span>}
function Art({src,className=''}:{src:string;className?:string}){return <img className={className} src={src} alt="" loading="lazy" aria-hidden="true"/>}
function Hero({data,embedded,onDetails}:Pick<Props,'data'|'embedded'|'onDetails'>){
 const atmoKind = data.design?.atmosphere;
 const heroAtmo = atmoKind === 'none' ? undefined : (atmoKind && atmoKind !== 'auto' ? atmoKind : (data.theme==='conservatory'?'flowers':data.theme==='gulmohar'?'petals':undefined));
 return <header className={`opening-hero art-hero ${Math.max(data.name1.length,data.name2.length)>14?'art-long-names':''}`}>
 <div className="art-hero-landscape"><AmbientFilm key={data.theme} theme={data.theme} embedded={embedded}/></div>
 {heroAtmo&&<Atmosphere kind={heroAtmo as any}/>}
 <div className="art-hero-copy"><span className="art-kicker">{data.theme==='sunday'?'The best day edition':data.theme==='azure'?'A postcard for our favourite people':data.theme==='gulmohar'?'With our families, with all our love':'An invitation, in bloom'}</span><h1 tabIndex={-1}><Names data={data}/></h1><p className="art-occasion">{data.occasion==='Engagement'?'Invite you to their engagement':'Invite you to celebrate their wedding'}</p><div className="art-hero-date"><span>{formatDate(data.events[0]?.date||'')}</span><span>{data.events[0]?.venue||'Venue to be announced'}</span></div></div>
 {data.theme==='sunday'&&<span className="art-hero-scribble" aria-hidden="true">a very<br/>big yes!</span>}
 <a className="art-hero-enter" href="#inv-welcome" onClick={onDetails}>{data.theme==='azure'?'Come away with us':data.theme==='sunday'?'You’re on the list':'Open our invitation'} <ArrowDown size={18}/></a>
 </header>
}
function Welcome({data,onDetails}:Pick<Props,'data'|'onDetails'>){
 const customTitle = data.design?.sectionTitles?.welcome;
 const suite=suites[data.theme];const body=<><p className="art-family">{data.family}</p><p className="art-prose">{data.welcome}</p><span className="art-signature">{data.name1||'Your name'} & {data.name2||'Their name'}</span><a className="art-link" href="#inv-events" onClick={onDetails}>The celebrations <ArrowUpRight size={18}/></a></>;
 if(data.theme==='conservatory')return <section id="inv-welcome" className="inv-section art-welcome garden-letter"><div className="garden-specimen"><Art src={interiorArt(data.theme)}/><span>With love,<br/><i>from our little garden.</i></span></div><div className="garden-letter-copy"><BotanicalBorder/><span className="art-kicker">{customTitle||'A letter to the people we love'}</span><h2>Love, in<br/><em>full bloom.</em></h2>{body}</div></section>;
 if(data.theme==='gulmohar')return <section id="inv-welcome" className="inv-section art-welcome palace-blessing"><Art src={suite.detail} className="palace-blessing-frame"/><div><span className="art-kicker">{customTitle||'A union of hearts & families'}</span><Mark data={data}/><h2>One beautiful<br/><em>beginning.</em></h2>{body}</div></section>;
 if(data.theme==='sunday')return <section id="inv-welcome" className="inv-section art-welcome sunday-hello"><div className="sunday-note"><span className="art-kicker">{customTitle||'A note for you'}</span><h2>We said yes.<br/><em>Now, you?</em></h2><TearNote>{body}</TearNote></div><div className="sunday-memento"><Art src={suite.detail}/><span>happy tears.<br/>very good cake.<br/><i>you, please.</i></span><img src={interiorArt('sunday')} alt="An original still-life image of a cherry-topped cake and a cobalt bow" loading="lazy"/></div></section>;
 return <section id="inv-welcome" className="inv-section art-welcome coast-postcard"><div className="coast-message"><span className="art-kicker">{customTitle||'Sent with love'}</span><h2>Somewhere<br/>lovely.<br/><em>Together.</em></h2><p className="art-prose">A little postcard, with a place for you.</p></div><Postcard front={<div className="coast-address"><Art src={suite.detail}/><span className="coast-postmark">WITH LOVE<br/>♡<br/>{data.events[0]?.date?formatDate(data.events[0].date):'A date to come'}</span><p>To our favourite people,</p><p>{data.events[0]?.venue||'Somewhere lovely'}</p><p>{data.events[0]?.address||'Details to follow'}</p><span className="coast-written">Wish you were here.</span></div>} back={<div className="coast-personal-note">{body}</div>}/></section>;
}
function Story({data}:{data:InvitationData}){
 if(!data.sections.story||!data.story.trim())return null;
 const customTitle = data.design?.sectionTitles?.story;
 return <section className="inv-section art-story"><div className="art-story-photo"><img src={data.photos[0]||(data.theme==='gulmohar'||data.theme==='azure'?interiorArt(data.theme):photographs[2])} alt={data.photos[0]?'A memory of the couple':data.theme==='gulmohar'?'An original palace garden illustration with peacocks':data.theme==='azure'?'An original watercolor of a coastal terrace':'Illustrative photograph of a couple holding hands'} loading="lazy"/><span>{data.photos[0]?'A moment from our story':'An illustration of togetherness'}</span></div><div className="art-story-copy"><span className="art-kicker">{customTitle||(data.theme==='azure'?'Every road, to you':data.theme==='sunday'?'Our favourite plot twist':'The story of us')}</span><h2>{data.theme==='conservatory'?<>Always<br/><em>growing closer.</em></>:data.theme==='gulmohar'?<>Two lives.<br/><em>A thousand blessings.</em></>:data.theme==='sunday'?<>Turns out,<br/><em>it was you.</em></>:<>And then,<br/><em>we found us.</em></>}</h2><p className="art-prose">{data.story}</p><Mark data={data}/></div></section>;
}
function EventDetails({event,onCalendar}: {event:Ceremony;onCalendar:Props['onCalendar']}){
 return <><p className="art-event-note">{event.note}</p><strong className="art-event-venue">{event.venue||'Venue to be announced'}</strong><p className="art-event-address">{event.address}</p><div className="art-event-actions">{(event.venue||event.address)&&<a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([event.venue,event.address].filter(Boolean).join(', '))}`} target="_blank" rel="noreferrer">Directions <ArrowUpRight size={16}/></a>}{event.date&&event.time&&<button onClick={()=>onCalendar(event)}>Save the date ＋</button>}</div></>;
}
function Events({data,onCalendar}:Pick<Props,'data'|'onCalendar'>){
 const customTitle = data.design?.sectionTitles?.events;
 const heading=<div className="art-events-heading"><span className="art-kicker">{customTitle||(data.theme==='sunday'?'Your day, delightfully planned':data.theme==='azure'?'A little itinerary':'The celebrations')}</span><h2>{data.theme==='conservatory'?<>An afternoon<br/><em>into forever.</em></>:data.theme==='gulmohar'?<>Colour. Music.<br/><em>Beautiful beginnings.</em></>:data.theme==='sunday'?<>First, the vows.<br/><em>Then, the good stuff.</em></>:<>A few days.<br/><em>A lifetime of memories.</em></>}</h2></div>;
 if(data.theme==='gulmohar')return <section id="inv-events" className="inv-section art-events palace-programme"><div className="palace-programme-intro">{heading}<span className="palace-programme-signoff" aria-hidden="true">With love, with our families.</span></div><ol className="palace-programme-list">{data.events.map((event,index)=><li className="palace-programme-entry" key={event.id}><div className="palace-programme-date"><span className="palace-programme-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><span>{formatDate(event.date)}</span>{event.time&&<span className="palace-programme-time">{formatTime(event.time)} IST</span>}</div><div className="palace-programme-content"><h3>{event.name}</h3><EventDetails event={event} onCalendar={onCalendar}/></div></li>)}</ol></section>;
 return <section id="inv-events" className="inv-section art-events">{heading}{data.theme==='conservatory'&&<div className="garden-event-view"><Art src={suites.conservatory.scene}/><span>Beneath the glass,<br/><i>among the flowers.</i></span></div>}<div className="art-event-list">{data.events.map((event,index)=><article className="art-event" key={event.id}>
 <div className="art-event-stub"><span className="art-event-number">{String(index+1).padStart(2,'0')}</span><span className="art-event-day">{formatDate(event.date)}</span><span className="art-event-time">{formatTime(event.time)}{event.time?' IST':''}</span></div>
 <div className="art-event-content"><h3>{event.name}</h3><EventDetails event={event} onCalendar={onCalendar}/></div>
 {data.theme==='sunday'&&<span className="sunday-ticket-end" aria-hidden="true">YOU’RE INVITED ♡</span>}
 </article>)}</div></section>;
}
function Gallery({data}:{data:InvitationData}){
 if(!data.sections.gallery)return null;const supplied=data.photos.filter(Boolean).slice(0,6);const images=supplied.length?supplied:[interiorArt(data.theme),photographs[1],photographs[2]];
 const customTitle = data.design?.sectionTitles?.gallery;
 return <section className="inv-section art-gallery"><div className="art-gallery-heading"><span className="art-kicker">{customTitle||(data.theme==='sunday'?'Evidence of a very good thing':data.theme==='azure'?'The postcards we keep':'Collected with love')}</span><h2>{data.theme==='conservatory'?<>Pressed between<br/><em>the pages.</em></>:data.theme==='gulmohar'?<>Our little<br/><em>book of memories.</em></>:data.theme==='sunday'?<>The camera roll<br/><em>of our hearts.</em></>:<>From us,<br/><em>with love.</em></>}</h2></div>{data.theme==='sunday'?<KeepsakeGallery photos={data.photos} theme={data.theme}/>:<div className="art-photo-collection">{images.map((src,index)=><figure key={src+index}><img src={src} alt={supplied.length?`A memory of the couple, photograph ${index+1}`:['Original artwork for this invitation','Illustrative celebration table','Illustrative photograph of a couple holding hands'][index]} loading="lazy"/><figcaption><span>{String(index+1).padStart(2,'0')}</span>{captions[data.theme][index%3]}</figcaption></figure>)}</div>}{!supplied.length&&data.theme!=='sunday'&&<p className="art-sample-label">Sample artwork & photographs · add your own memories</p>}</section>;
}
function Notes({data}:{data:InvitationData}){
 const notes=[['Dress for the day',data.dressCode],...(data.sections.travel?[['Getting here',data.transport],['Stay a little longer',data.accommodation]]:[]),...(data.sections.gifts?[['Your presence is everything',data.gifts]]:[])].filter(([,text])=>text.trim());
 if(!notes.length)return null;
 const customTitle = data.design?.sectionTitles?.notes;
 return <section className="inv-section art-notes"><div className="art-notes-heading"><span className="art-kicker">{customTitle||(data.theme==='azure'?'Your little field guide':data.theme==='sunday'?'A few friendly reminders':'For our dearest guests')}</span><h2>{data.theme==='conservatory'?<>Notes from<br/><em>the garden.</em></>:data.theme==='gulmohar'?<>Be our<br/><em>treasured guest.</em></>:data.theme==='sunday'?<>The little<br/><em>need-to-knows.</em></>:<>Pack a little.<br/><em>Stay a while.</em></>}</h2>{data.theme==='azure'&&<Art src={suites.azure.scene}/>}</div><div className="art-notes-list">{notes.map(([title,text],index)=><div key={title}><span className="art-note-number">{String(index+1).padStart(2,'0')}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>;
}
export default function ArtisticExperience({data,embedded,reply,surprise,countdown,onCalendar,onDetails,onReopen}:Props){
 const defaultOrder = ['welcome','couple','story','events','scratch','gallery','notes','rsvp'];
 const sectionOrder = data.design?.sectionOrder?.length ? data.design.sectionOrder : defaultOrder;

 const sectionComponents: Record<string, ReactNode> = {
  welcome: <Welcome key="welcome" data={data} onDetails={onDetails}/>,
  couple: <CoupleSection key="couple" data={data}/>,
  story: <Story key="story" data={data}/>,
  events: <Events key="events" data={data} onCalendar={onCalendar}/>,
  scratch: <div key="scratch" className="art-interlude">{countdown}{data.scratch&&<div className="art-surprise-wrap"><Art src={suites[data.theme].detail}/>{surprise}</div>}</div>,
  gallery: <Gallery key="gallery" data={data}/>,
  notes: <Notes key="notes" data={data}/>,
  rsvp: data.sections.rsvp ? <div key="rsvp" className="art-reply-stage"><div className="art-reply-art" aria-hidden="true"><Art src={data.theme==='gulmohar'?suites.gulmohar.scene:data.theme==='sunday'?'/art/sunday.webp':suites[data.theme].detail}/><span>{data.theme==='conservatory'?<>A place<br/>in our <i>garden.</i></>:data.theme==='gulmohar'?<>With love.<br/>With <i>blessings.</i></>:data.theme==='sunday'?<>Save you<br/>a <i>slice?</i></>:<>See you<br/>by the <i>sea.</i></>}</span></div>{reply}</div> : null
 };

 const atmoKind = data.design?.atmosphere;
 const footerAtmo = atmoKind === 'none' ? undefined : (atmoKind === 'fireflies' || (data.theme === 'conservatory' && (!atmoKind || atmoKind === 'auto')) ? 'fireflies' : undefined);

 return <div className={`inv-page art-experience art-${data.theme}`}>
  <EffectLifecycle embedded={embedded}/>
  <Hero data={data} embedded={embedded} onDetails={onDetails}/>
  {sectionOrder.map(secId => sectionComponents[secId] || null)}
  <footer className="art-footer">
   {footerAtmo&&<Atmosphere kind="fireflies"/>}
   <Art src={themeById(data.theme).art} className="art-footer-landscape"/>
   <div>
    <span className="art-kicker">{suites[data.theme].closing}</span>
    <h2><Names data={data}/></h2>
    <p>{data.closing}</p>
    <span className="art-footer-brand">With love, with Vowvel</span>
    {!embedded&&<button onClick={onReopen}>Open the envelope again ↻</button>}
   </div>
  </footer>
 </div>;
}

