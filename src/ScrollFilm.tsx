import {useCallback,useEffect,useId,useRef,useState} from 'react';
import {motion,useReducedMotion,useScroll,useTransform} from 'motion/react';
import {themeById,type ThemeId} from './data';
import {worldFilms,worldPosters} from './scrollFilms';
import './scroll-film.css';

const chapters:Record<ThemeId,{title:string;note:string;art?:string;alt:string}>={
 conservatory:{title:'Meet me beneath the glass.',note:'Where the garden ends, our evening begins.',art:'/art/scenes/conservatory-glasshouse.webp',alt:'A crystal chandelier inside a rose-filled Tuscan glasshouse'},
 gulmohar:{title:'Some beginnings feel timeless.',note:'Beneath the arches. Among our favourite people.',alt:'A painted palace courtyard framed by vermilion gulmohar blossoms'},
 afterhours:{title:'Stay for one more dance.',note:'The candles are lit. The night is ours.',art:'/art/scenes/afterhours-chandelier.webp',alt:'A grand crystal chandelier above a candlelit burgundy ballroom'},
 sunday:{title:'Our kind of forever.',note:'A little imperfect. A lot of love.',alt:'A playful collection of colourful paper wedding keepsakes'},
 azure:{title:'Take the scenic route.',note:'A sea breeze. A slow afternoon. You, beside us.',alt:'A painted Mediterranean coastline with lemon trees'},
};

export default function ScrollFilm({theme,embedded=false}:{theme:ThemeId;embedded?:boolean}) {
 const section=useRef<HTMLElement>(null);const video=useRef<HTMLVideoElement>(null);const title=useId();
 const reduced=useReducedMotion();const still=reduced||embedded;
 const [near,setNear]=useState(false);const [requested,setRequested]=useState(false);const [ready,setReady]=useState(false);const [failed,setFailed]=useState(false);
 const attachVideo=useCallback((node:HTMLVideoElement|null)=>{video.current=node;setReady(false);},[]);
 const {scrollYProgress}=useScroll({target:section,offset:['start start','end end']});
 const scale=useTransform(scrollYProgress,[0,1],[1,1.16]);const y=useTransform(scrollYProgress,[0,1],['0%','-4%']);
 const copyY=useTransform(scrollYProgress,[0,1],[20,-25]);
 const chapter=chapters[theme];const art=worldPosters[theme]||chapter.art||themeById(theme).art;const source=worldFilms[theme];
 useEffect(()=>{if(!source||still||!section.current)return;const observer=new IntersectionObserver(([entry])=>{setNear(entry.isIntersecting);if(entry.isIntersecting)setRequested(true);},{rootMargin:'500px'});observer.observe(section.current);return()=>observer.disconnect();},[source,still]);
 useEffect(()=>{
  if(!ready||still||!near)return;let frame=0;
  const seek=()=>{const node=video.current;if(node&&!node.seeking&&Number.isFinite(node.duration)&&node.duration>0){const target=Math.max(0,Math.min(node.duration-.04,scrollYProgress.get()*node.duration));if(Math.abs(node.currentTime-target)>.035)node.currentTime=target;}};
  const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(seek);};
  const unsubscribe=scrollYProgress.on('change',update);const node=video.current;node?.addEventListener('seeked',update);update();
  return()=>{unsubscribe();cancelAnimationFrame(frame);node?.removeEventListener('seeked',update);};
 },[ready,still,near,scrollYProgress]);
 return <section ref={section} className={`world-chapter chapter-${theme} ${still?'chapter-still':''}`} aria-labelledby={title}>
  <div className="world-chapter-sticky">
   <motion.div className="world-chapter-media" style={still||(source&&!failed)?undefined:{scale,y}}>
    <img src={art} alt={chapter.alt} loading="lazy" width="720" height="1280"/>
    {source&&requested&&!still&&!failed&&<video ref={attachVideo} src={source} poster={art} muted playsInline preload="auto" disablePictureInPicture aria-hidden="true" onLoadedData={()=>setReady(true)} onError={()=>{setFailed(true);setReady(false);}}/>}
   </motion.div>
   <div className="world-chapter-shade"/>
   <span className="world-chapter-label">{themeById(theme).name} <i>/</i> A moment to keep</span>
   <motion.div className="world-chapter-copy" style={still?undefined:{y:copyY}}><h2 id={title}>{chapter.title}</h2><p>{chapter.note}</p></motion.div>
   {!still&&<div className="world-chapter-progress" aria-hidden="true"><motion.span style={{scaleX:scrollYProgress}}/></div>}
  </div>
 </section>;
}
