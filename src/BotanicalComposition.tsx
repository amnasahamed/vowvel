import type {InvitationData} from './data';
import {formatDate} from './data';
import './botanical-composition.css';
export default function BotanicalComposition({data,onDetails}:{data:InvitationData;onDetails:(event:React.MouseEvent<HTMLAnchorElement>)=>void}){
 const first=data.events[0];
 return <header className="inv-hero botanical-composition">
  <div className="botanical-linen" aria-hidden="true"/>
  <div className="botanical-underleaf" data-layer="sage-paper" aria-hidden="true"/>
  <img className="botanical-flower botanical-flower-back" data-layer="pressed-botanical-behind" src="/art/layers/flowers.png" alt=""/>
  <img className="botanical-paper" data-layer="torn-cotton-paper" src="/art/layers/paper.png" alt=""/>
  <div className="botanical-type" data-layer="live-letterpress-type">
   <span className="botanical-small">{data.family||'Together with our families'}</span>
   <span className="botanical-intro">joyfully invite you to celebrate</span>
   <h1 tabIndex={-1}>{data.name1||'Your name'}<i>&</i>{data.name2||'Their name'}</h1>
   <p className="botanical-occasion">{data.occasion==='Wedding'?'Our wedding day':'Our engagement'}</p>
   <div className="botanical-date"><span>{first?.date?formatDate(first.date):'Date to be announced'}</span><p>{first?.venue||'Somewhere lovely, to be announced'}</p></div>
   <a href="#inv-events" onClick={onDetails}>The celebration details ↗</a>
  </div>
  <img className="botanical-flower botanical-flower-front" data-layer="foreground-botanical" src="/art/layers/flowers.png" alt=""/>
  <div className="botanical-vellum" data-layer="translucent-vellum" aria-hidden="true"/>
  <img className="botanical-ribbon" data-layer="silk-bow" src="/art/layers/ribbon.png" alt=""/>
 </header>;
}
