import {useContext,useEffect,useRef,useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {Pause,Play} from '@phosphor-icons/react';
import type {ThemeId} from './data';
import {OpeningFilmActive} from './films';
import {worldPosters} from './scrollFilms';

/** The still is immediate. Motion is optional and only runs while visible. */
export default function AmbientFilm({theme,embedded=false}:{theme:ThemeId;embedded?:boolean}){
 const opening=useContext(OpeningFilmActive);
 const reduced=useReducedMotion();const root=useRef<HTMLDivElement>(null);const video=useRef<HTMLVideoElement>(null);
 const [source,setSource]=useState<string>();const [allowed,setAllowed]=useState(false);const [near,setNear]=useState(false);const [paused,setPaused]=useState(false);const [failed,setFailed]=useState(false);const [ready,setReady]=useState(false);
 useEffect(()=>{setSource(window.matchMedia('(min-width: 701px)').matches?`/films/scroll/${theme}-moving.mp4`:`/films/mobile/${theme}-v1.mp4`);const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;setAllowed(!embedded&&!reduced&&!connection?.saveData&&!['slow-2g','2g'].includes(connection?.effectiveType||''));},[embedded,reduced,theme]);
 useEffect(()=>{if(!allowed||!root.current)return;const observer=new IntersectionObserver(([entry])=>setNear(entry.isIntersecting));observer.observe(root.current);return()=>observer.disconnect();},[allowed]);
 useEffect(()=>{const node=video.current;if(!node)return;let current=true;const sync=()=>{if(near&&!paused&&!opening&&!document.hidden){void node.play().catch(()=>{if(current)setPaused(true);});}else node.pause();};sync();document.addEventListener('visibilitychange',sync);return()=>{current=false;node.pause();document.removeEventListener('visibilitychange',sync);};},[near,paused,allowed,failed,opening,source]);
 return <div ref={root} className={`ambient-film ${ready?'ambient-ready':''}`}>
  <img src={worldPosters[theme]} alt="" width="720" height="1280" fetchPriority="high"/>
  {allowed&&!failed&&<video ref={video} src={source} muted loop playsInline preload={opening?'auto':'none'} aria-hidden="true" onLoadedData={()=>setReady(true)} onPlaying={()=>setReady(true)} onError={()=>setFailed(true)}/>}
  {allowed&&!failed&&<button className="ambient-toggle" aria-label={paused?'Play background film':'Pause background film'} onClick={()=>setPaused(value=>!value)}>{paused?<Play size={16}/>:<Pause size={16}/>}</button>}
 </div>;
}
