import {useContext, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {useReducedMotion} from 'motion/react';
import {OpeningFilmActive} from './films';
import type {ThemeId} from './data';
import './invitation-effects.css';

/** Animate only visible sections, after the opener, and never in the editor. */
export function EffectLifecycle({embedded}:{embedded:boolean}) {
 const marker=useRef<HTMLSpanElement>(null);
 const opening=useContext(OpeningFilmActive);
 const reduced=useReducedMotion();
 useEffect(()=>{
  const root=marker.current?.parentElement;
  if(!root||embedded||reduced||opening)return;
  root.classList.add('fx-enabled');
  const nodes=root.querySelectorAll<HTMLElement>('.opening-hero,.inv-section,.art-footer,.nocturne-footer');
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   entry.target.classList.toggle('fx-visible',entry.isIntersecting);
   if(entry.isIntersecting)entry.target.classList.add('fx-seen');
  }),{threshold:.08});
  nodes.forEach(node=>observer.observe(node));
  const hero=root.querySelector<HTMLElement>('.art-azure .art-hero');
  let frame=0;
  const update=()=>{frame=0;if(!hero)return;const rect=hero.getBoundingClientRect();if(rect.bottom>0&&rect.top<innerHeight)hero.style.setProperty('--coast-shift',`${Math.max(-24,Math.min(24,-rect.top*.045))}px`);};
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
  if(hero){window.addEventListener('scroll',scroll,{passive:true});update();}
  const visibility=()=>root.classList.toggle('fx-suspended',document.hidden);
  document.addEventListener('visibilitychange',visibility);visibility();
  return()=>{observer.disconnect();window.removeEventListener('scroll',scroll);document.removeEventListener('visibilitychange',visibility);cancelAnimationFrame(frame);root.classList.remove('fx-enabled','fx-suspended');nodes.forEach(node=>node.classList.remove('fx-visible','fx-seen'));hero?.style.removeProperty('--coast-shift');};
 },[embedded,reduced,opening]);
 return <span ref={marker} hidden/>;
}

export function Atmosphere({kind}:{kind:'flowers'|'petals'|'sparkles'|'fireflies'|'silk'}) {
 return <div className={`fx-atmosphere fx-${kind}`} aria-hidden="true">{Array.from({length:kind==='silk'?2:kind==='petals'?12:8},(_,i)=><span key={i} style={{'--i':i,'--x':`${5+(i*37)%91}%`,'--y':`${9+(i*23)%78}%`,'--delay':`${-(i*1.7)}s`} as CSSProperties}>{kind==='flowers'?<svg viewBox="0 0 32 32"><g fill="#fff7df">{[0,60,120,180,240,300].map(angle=><ellipse key={angle} cx="16" cy="8" rx="4" ry="7" transform={`rotate(${angle} 16 16)`}/>)}</g><circle cx="16" cy="16" r="3" fill="#c9a65d"/></svg>:null}</span>)}</div>;
}

export function BotanicalBorder(){return <svg className="fx-botanical" viewBox="0 0 300 180" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M8 175 Q18 140 9 100 Q0 60 22 10 M12 130 Q42 119 35 98 Q11 103 12 130 M10 85 Q35 72 30 53 Q9 58 10 85 M290 175 Q280 130 292 80 Q300 40 275 8 M288 130 Q260 118 266 98 Q290 105 288 130 M290 73 Q260 58 269 38 Q290 47 290 73"/></svg>}

export function TearNote({children}:{children:ReactNode}) {
 const [opened,setOpened]=useState(false);const id=useId();
 return <div className={`fx-tear ${opened?'fx-torn':''}`}><button type="button" className="fx-tear-tab" aria-expanded={opened} aria-controls={id} onClick={()=>setOpened(value=>!value)}>{opened?'Fold our note back up':'Pull here for a little note'} <span aria-hidden="true">↗</span></button><div id={id} hidden={!opened} className="fx-note-content">{children}</div>{!opened&&<div className="fx-paper-cover" aria-hidden="true"><span>Just for you.</span><span>♡</span></div>}</div>;
}

export function Postcard({front,back}:{front:ReactNode;back:ReactNode}) {
 const [flipped,setFlipped]=useState(false);const id=useId();
 return <div className={`fx-postcard ${flipped?'fx-flipped':''}`}><button type="button" className="fx-postcard-toggle" aria-expanded={flipped} aria-controls={id} onClick={()=>setFlipped(value=>!value)}>{flipped?'Turn back to the address':'Turn over our postcard'} <span aria-hidden="true">↻</span></button><div className="fx-postcard-turn" key={String(flipped)}><div hidden={flipped}>{front}</div><div id={id} hidden={!flipped}>{back}</div></div></div>;
}

/** Render only following a successful submission, never from a saved RSVP. */
export function RsvpConfetti({theme}:{theme:ThemeId}) {
 return theme==='sunday'?<div className="fx-confetti" aria-hidden="true">{Array.from({length:24},(_,i)=><i key={i} style={{'--i':i,'--dx':`${Math.round(Math.sin(i*2.4)*170)}px`,'--dy':`${-70-(i%5)*23}px`,'--spin':`${i%2?360:-300}deg`,'--delay':`${(i%6)*.035}s`} as CSSProperties}/>)}</div>:null;
}
