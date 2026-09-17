import type { MouseEvent } from 'react';
import type { InvitationData } from './data';
import { formatDate, themeById } from './data';
import './cinematic-scene.css';

type Props = { data: InvitationData; onDetails: (event: MouseEvent<HTMLAnchorElement>) => void };
export default function CinematicScene({ data, onDetails }: Props) {
  const event = data.events[0];
  const theme = themeById(data.theme);
  const longNames = Math.max(data.name1.length, data.name2.length) > 13;
  const details = <div className="cine-details"><span className="cine-date">{event ? formatDate(event.date) : 'Date to be announced'}</span><span className="cine-venue">{event?.venue || 'Venue to be announced'}</span><a href="#inv-events" onClick={onDetails}>Celebration details <span aria-hidden="true">↗</span></a></div>;
  const names = <h1 tabIndex={-1} className={longNames ? 'cine-names cine-long-names' : 'cine-names'}><span>{data.name1 || 'Your name'}</span><i>&</i><span>{data.name2 || 'Their name'}</span></h1>;
  const family = <p className="cine-family">{data.family || 'Together with our families'}</p>;
  const occasion = <p className="cine-occasion">{data.occasion === 'Wedding' ? 'joyfully invite you to their wedding' : 'invite you to celebrate their engagement'}</p>;
  return <header className={`cinematic-scene cine-${data.theme}`} aria-label={`${theme.name} invitation`}>
    <div className="cine-base" data-layer="paper-base" />
    {data.theme === 'gulmohar' && <>
      <div className="cine-palace-sky" data-layer="courtyard-window"><img src="/art/gulmohar.webp" alt="" /></div>
      <img className="cine-palace-arch" data-layer="painted-arch" src="/art/layers/palace-arch.png" alt="" />
      <div className="cine-palace-page" data-layer="letter-paper"><span className="cine-miniature" aria-hidden="true">❧</span>{family}{names}{occasion}{details}</div>
      <img className="cine-palace-flowers" data-layer="foreground-blooms" src="/art/layers/flowers.png" alt="" />
    </>}
    {data.theme === 'afterhours' && <>
      <img className="cine-velvet cine-velvet-left" data-layer="left-velvet" src="/art/layers/velvet.png" alt="" />
      <img className="cine-velvet cine-velvet-right" data-layer="right-velvet" src="/art/layers/velvet.png" alt="" />
      <div className="cine-evening-card" data-layer="engraved-stationery"><span className="cine-deco-top" aria-hidden="true">✦</span>{family}<span className="cine-evening-preface">An evening for</span>{names}{occasion}{details}<span className="cine-deco-bottom" aria-hidden="true">◆</span></div>
    </>}
    {data.theme === 'sunday' && <>
      <span className="cine-cobalt-sheet" data-layer="cobalt-paper" />
      <div className="cine-sunday-paper" data-layer="butter-paper"><img src="/art/layers/paper.png" alt="" /></div>
      <span className="cine-tape" data-layer="cloth-tape" />
      <div className="cine-sunday-copy" data-layer="lettering">{family}<span className="cine-pencil-note">We’re doing this!</span>{names}{occasion}{details}</div>
      <span className="cine-cut-flower" data-layer="cut-paper-flower" aria-hidden="true">✳</span>
      <span className="cine-sunday-ticket" data-layer="keepsake-ticket">KEEP THIS<br/>LITTLE MOMENT</span>
      <img className="cine-sunday-ribbon" data-layer="loose-ribbon" src="/art/layers/ribbon.png" alt="" />
    </>}
    {data.theme === 'azure' && <>
      <div className="cine-airmail-edge" data-layer="airmail-border" />
      <div className="cine-azure-paper" data-layer="postcard-paper" />
      <div className="cine-azure-copy" data-layer="postcard-lettering">{family}{names}{occasion}{details}</div>
      <div className="cine-coastal-window" data-layer="coastal-inset"><img src="/art/azure.webp" alt="" /></div>
      <span className="cine-postmark" data-layer="postmark" aria-hidden="true">WITH LOVE<br/>BY THE SEA</span>
      <img className="cine-lemons" data-layer="foreground-lemons" src="/art/layers/lemons.png" alt="" />
    </>}
  </header>;
}
