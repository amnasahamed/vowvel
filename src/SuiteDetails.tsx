import { AirplaneTilt, MapPin, Gift, CoatHanger, Buildings } from '@phosphor-icons/react';
import { formatDate, formatTime, themeById, type InvitationData } from './data';
import { suites } from './suites';

export function SuiteMonogram({ data }: { data: InvitationData }) {
  return <span className="suite-monogram" aria-hidden="true"><span>{Array.from(data.name1 || 'Y')[0]}</span><i>&</i><span>{Array.from(data.name2 || 'T')[0]}</span></span>;
}

export function SuiteEssentials({ data, onDetails }: { data: InvitationData; onDetails: (event: React.MouseEvent<HTMLAnchorElement>) => void }) {
  const event = data.events[0];
  if (!event) return null;
  return <div className="suite-essentials"><span className="suite-essentials-date">{formatDate(event.date)}</span><span>{event.time ? `${formatTime(event.time)} IST` : 'Time to be confirmed'}{event.venue ? ` · ${event.venue}` : ''}</span><div><a href="#inv-events" onClick={onDetails}>The celebrations <MapPin size={15}/></a>{data.sections.rsvp && <a href="#inv-rsvp" onClick={onDetails}>Send your reply <span aria-hidden="true">↗</span></a>}</div></div>;
}

export function SuiteDetails({ data }: { data: InvitationData }) {
  const suite = suites[data.theme];
  const details = [
    ...(data.dressCode ? [{ title: 'The dress code', text: data.dressCode, Icon: CoatHanger }] : []),
    ...(data.sections.travel ? [{ title: 'Getting here', text: data.transport || 'Travel details will be shared soon.', Icon: AirplaneTilt }, { title: 'Stay a little longer', text: data.accommodation || 'Accommodation details will be shared soon.', Icon: Buildings }] : []),
    ...(data.sections.gifts && data.gifts ? [{ title: 'Your presence is everything', text: data.gifts, Icon: Gift }] : []),
  ];
  if (!details.length) return null;
  return <section className="inv-section inv-details"><div className="suite-travel-art"><img src={suite.scene} alt="" loading="lazy" width={720} height={1280}/><span>{data.theme === 'azure' ? 'A LITTLE FIELD GUIDE' : 'FOR OUR FAVOURITE PEOPLE'}</span></div><div className="suite-detail-heading"><span className="inv-eyebrow">THE GUEST NOTES</span><h2>{suite.details}</h2></div><div className="inv-detail-grid">{details.map(({ title, text, Icon }, index) => <div key={title}><div className="suite-detail-index"><span>{String(index + 1).padStart(2, '0')}</span><Icon size={25} weight="thin" aria-hidden="true"/></div><h3>{title}</h3><p>{text}</p></div>)}</div></section>;
}

export function SuiteSignoff({ data }: { data: InvitationData }) {
  return <div className="suite-signoff-art" aria-hidden="true"><img src={themeById(data.theme).art} alt="" loading="lazy" width={1086} height={1448}/></div>;
}
