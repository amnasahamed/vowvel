import {useRef} from 'react';
import {motion,useReducedMotion,useScroll,useTransform} from 'motion/react';
import WorldScene from './WorldScene';
import type {InvitationData} from './data';
import {formatDate,themeById} from './data';
import './opening-hero.css';
export function OpeningLetter({data,film=false}:{data:InvitationData;film?:boolean}){
 const Heading=film?'div':'h1';const first=data.events[0];
 return <div className={`opening-hero-letter ${film?'opening-letter-in-film':''}`}>
  <span className="opening-letter-flourish" aria-hidden="true">❧</span>
  <p className="opening-hero-preface">You are warmly invited</p>
  <Heading className="opening-names" tabIndex={film?undefined:-1}><span>{data.name1||'Your name'}</span><i>&</i><span>{data.name2||'Their name'}</span></Heading>
  <p className="opening-hero-occasion">{data.occasion==='Engagement'?'Our engagement':'Our wedding'}</p>
  <span className="opening-letter-rule" aria-hidden="true"/>
  <p className="opening-hero-date">{first?.date?formatDate(first.date):'Date to be announced'}</p>
 </div>
}
export default function OpeningHero({data,embedded=false,dateRevealed=true,onDetails}:{data:InvitationData;embedded?:boolean;dateRevealed?:boolean;onDetails:(event:React.MouseEvent<HTMLAnchorElement>)=>void}){
 const theme=themeById(data.theme);const hero=useRef<HTMLElement>(null);const reduced=useReducedMotion();
 const {scrollYProgress}=useScroll({target:hero,offset:['start start','end start']});
 const y=useTransform(scrollYProgress,[0,1],['0%','12%']);
 const scale=useTransform(scrollYProgress,[0,1],[1,1.07]);
 return <header ref={hero} className={`opening-hero world-opening opening-hero-${data.theme} ${embedded?'opening-hero-embedded':''}`} style={{backgroundColor:theme.paper}}>
  <motion.div className="world-opening-frame" style={embedded||reduced?undefined:{y,scale}}><WorldScene data={data} hero dateRevealed={dateRevealed}/></motion.div>
  <a className="opening-hero-continue" href="#inv-welcome" onClick={onDetails} aria-label="Scroll to the invitation">
   <span aria-hidden="true">↓</span>
  </a>
 </header>
}
