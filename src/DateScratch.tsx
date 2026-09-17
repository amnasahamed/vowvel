import {useLayoutEffect,useRef} from 'react';
import {formatDate,type ThemeId} from './data';
import './date-scratch.css';

export const scratchTreatments = {
 conservatory:{eyebrow:'A SECRET IN THE GARDEN',heading:'A little love, just for you.',hint:'Brush away the botanical foil to find our note.',label:'Love, waiting to bloom',mark:'❧',paper:'#d1dcc4',light:'#edf1dc',ink:'#344d39'},
 gulmohar:{eyebrow:'WRAPPED IN A LITTLE TRADITION',heading:'A note, wrapped in gold.',hint:'Uncover a few words from our hearts.',label:'A golden beginning',mark:'✺',paper:'#c99045',light:'#f2d69a',ink:'#703725'},
 afterhours:{eyebrow:'YOUR EXCLUSIVE INVITATION',heading:'Something between us.',hint:'Scratch the silver to find your little note.',label:'Your night awaits',mark:'✦',paper:'#88939c',light:'#e3e7eb',ink:'#182129'},
 sunday:{eyebrow:'ONE VERY LUCKY DAY',heading:'A little scratch. A big smile.',hint:'Scratch your little lucky ticket. Everyone wins.',label:'Best day ever',mark:'✳',paper:'#e99873',light:'#f5c6a1',ink:'#284595'},
 azure:{eyebrow:'A POSTCARD FROM OUR FUTURE',heading:'Wish you were here.',hint:'Uncover the blue stamp to read our postcard.',label:'Meet us somewhere lovely',mark:'≈',paper:'#81b5c6',light:'#d3e9e8',ink:'#24576b'},
};
export default function DateScratch({theme,date,note,revealed,onReveal}:{theme:ThemeId;date:string;note:string;revealed:boolean;onReveal:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const previous=useRef<{x:number;y:number}|null>(null);
 const treatment=scratchTreatments[theme];
 useLayoutEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx||revealed)return;
  ctx.globalCompositeOperation='source-over';
  const foil=ctx.createLinearGradient(0,0,600,320);foil.addColorStop(0,treatment.paper);foil.addColorStop(.45,treatment.light);foil.addColorStop(1,treatment.paper);
  ctx.fillStyle=foil;ctx.fillRect(0,0,600,320);ctx.strokeStyle=treatment.ink+'33';ctx.fillStyle=treatment.ink+'33';
  for(let x=25;x<600;x+=50)for(let y=25;y<320;y+=50){
   ctx.beginPath();
   if(theme==='conservatory'){ctx.ellipse(x,y,7,15,-.6,0,Math.PI*2);ctx.stroke();}
   else if(theme==='gulmohar'){ctx.moveTo(x,y-12);ctx.lineTo(x+12,y);ctx.lineTo(x,y+12);ctx.lineTo(x-12,y);ctx.closePath();ctx.stroke();}
   else if(theme==='afterhours'){ctx.moveTo(x-15,y+15);ctx.lineTo(x+15,y-15);ctx.stroke();}
   else if(theme==='sunday'){ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}
   else {ctx.arc(x,y,16,0,Math.PI);ctx.stroke();}
  }
  ctx.fillStyle=treatment.ink;ctx.textAlign='center';ctx.font='36px Georgia';ctx.fillText(treatment.mark,300,106);ctx.font='25px Georgia';ctx.fillText(treatment.label,300,163);ctx.font='13px sans-serif';ctx.fillText('SCRATCH TO OPEN YOUR NOTE',300,205);
 },[theme,treatment,revealed]);
 const scratch=(event:React.PointerEvent<HTMLCanvasElement>)=>{
  if(!previous.current)return;const node=event.currentTarget;const ctx=node.getContext('2d');if(!ctx)return;
  const rect=node.getBoundingClientRect();const point={x:(event.clientX-rect.left)*600/rect.width,y:(event.clientY-rect.top)*320/rect.height};
  ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';ctx.lineWidth=48;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(previous.current.x,previous.current.y);ctx.lineTo(point.x,point.y);ctx.stroke();previous.current=point;
 };
 const finish=()=>{
  if(!previous.current)return;previous.current=null;const ctx=canvas.current?.getContext('2d');if(!ctx)return;
  const pixels=ctx.getImageData(0,0,600,320).data;let clear=0,total=0;for(let i=3;i<pixels.length;i+=64){total++;if(pixels[i]<40)clear++;}if(clear/total>.35)onReveal();
 };
 return <div className={`inv-scratch-wrap date-scratch-${theme} ${revealed?'fx-ripple':''}`}><div className="inv-scratch date-scratch-card"><div className="date-scratch-result" aria-hidden={!revealed}><span className="inv-eyebrow">WITH LOVE, FROM US</span><strong>{formatDate(date)}</strong>{note&&<p>{note}</p>}</div>{!revealed&&<canvas ref={canvas} width={600} height={320} aria-label="Scratch to uncover our personal note, or use the reveal button below" onPointerDown={event=>{event.currentTarget.setPointerCapture(event.pointerId);const rect=event.currentTarget.getBoundingClientRect();previous.current={x:(event.clientX-rect.left)*600/rect.width,y:(event.clientY-rect.top)*320/rect.height};scratch(event)}} onPointerMove={scratch} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}/>}</div><button className="inv-text-button" onClick={onReveal} disabled={revealed}>{revealed?'A little note to keep':'Or tap to read our note'}</button><span className="sr-only" role="status">{revealed?`Our note: ${note}. ${formatDate(date)}`:''}</span></div>;
}
