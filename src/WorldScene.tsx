import type {CSSProperties} from 'react';
import {formatDate, themeById, type InvitationData} from './data';
import './world-scene.css';

/** The collection and the invitation render the same composition, at any size. */
export default function WorldScene({data, hero=false,dateRevealed=true}:{data:InvitationData;hero?:boolean;dateRevealed?:boolean}) {
 const theme=themeById(data.theme);
 const Heading=hero?'h1':'strong';
 const long=Math.max(data.name1.length,data.name2.length)>18;
 return <div className={`world-scene world-${data.theme} ${long?'world-long':''}`} style={{'--world-paper':theme.paper,'--world-ink':theme.color} as CSSProperties}>
  <img className="world-art" src={theme.art} alt="" width="1086" height="1448" loading={hero?'eager':'lazy'} fetchPriority={hero?'high':undefined}/>
  <div className="world-lettering">
   <span className="world-preface">{data.theme==='afterhours'?'An evening to remember':data.theme==='sunday'?'The best day ever':data.theme==='azure'?'Meet us by the sea':'You are lovingly invited'}</span>
   <Heading className="world-names" tabIndex={hero?-1:undefined}><span>{data.name1||'Your name'} <i>{data.theme==='sunday'?'+':'&'}</i></span><span>{data.name2||'Their name'}</span></Heading>
   <span className="world-date">{data.occasion==='Engagement'?'Our engagement · ':''}{dateRevealed?formatDate(data.events[0]?.date||''):'A date worth uncovering'}</span>
  </div>
 </div>
}
