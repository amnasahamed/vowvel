import WorldScene from './WorldScene';
import {sampleForTheme} from './suites';
import './collection-suite.css';
import {sharingDetails} from './sharing';
import {lazy,Suspense,useEffect,useRef,useState,type CSSProperties} from 'react';
import {ArrowUpRight,ArrowRight,Check,Plus,Flower,EnvelopeSimple,MouseSimple,UserCircle} from '@phosphor-icons/react';
import {themes,themeById,type ThemeId,type InvitationData} from './data';
import {loadDraft} from './storage';
import {loadSession,type SessionUser} from './api';
import {goToLandingSection,readAppLocation,type LandingSection} from './hashRoute';
import './account-nav.css';
const Invitation=lazy(()=>import('./Invitation'));
const Editor=lazy(()=>import('./Editor'));
const CommerceCheckout=lazy(()=>import('./Checkout'));
const AdminPortal=lazy(()=>import('./CommercePortals').then(module=>({default:module.AdminPortal})));
const PartnerPortal=lazy(()=>import('./CommercePortals').then(module=>({default:module.PartnerPortal})));
const InfluencerApplication=lazy(()=>import('./CommercePortals').then(module=>({default:module.InfluencerApplication})));
const PublishedInvitation=lazy(()=>import('./PublishedInvitation'));
const GuestReplies=lazy(()=>import('./GuestReplies'));
const Blog=lazy(()=>import('./Blog'));
export function navigate(path:string){window.location.hash=path;window.scrollTo({top:0,behavior:'instant'})}
export {goToLandingSection};
function collection(){goToLandingSection('designs')}
function previewPath(theme:ThemeId,occasion:string){return `/preview/${theme}${occasion==='Engagement'?'?occasion=engagement':''}`}
function ClientAccess(){const [user,setUser]=useState<SessionUser|null>(null);useEffect(()=>{loadSession().then(setUser).catch(()=>setUser(null))},[]);return <button className="client-access" onClick={()=>navigate('/replies')} aria-label={user?'Open your guest replies':'Sign in to your Vowvel account'}><UserCircle size={18}/><span>{user?'Guest replies':'Sign in'}</span></button>}
export function Brand(){return <a className="brand" href="#/" aria-label="Vowvel home"><img src="/wordmark.webp" alt="Vowvel" width="132" height="34"/></a>}
function SiteNav(){
  return <header className="site-nav"><Brand/><nav aria-label="Main navigation"><a href="#designs" onClick={event=>{event.preventDefault();goToLandingSection('designs')}}>The collection</a><a href="#/blog">Journal</a><a href="#how-it-works" onClick={event=>{event.preventDefault();goToLandingSection('how-it-works')}}>How it works</a><a href="#pricing" onClick={event=>{event.preventDefault();goToLandingSection('pricing')}}>Pricing</a></nav><div className="nav-actions"><ClientAccess/><button className="text-button resume" onClick={()=>navigate('/create/'+loadDraft().theme)}>My invitation</button><button className="button compact" onClick={()=>navigate('/create/gulmohar')}>Create yours <ArrowUpRight size={16}/></button></div></header>;
}
export function Envelope({theme='conservatory',onOpen,small=false}:{theme?:ThemeId;onOpen:()=>void;small?:boolean}){const t=themeById(theme);const [open,setOpen]=useState(false);useEffect(()=>{if(!open)return;const timer=setTimeout(onOpen,850);return()=>clearTimeout(timer)},[open,onOpen]);return <button className={`paper-envelope ${open?'is-open':''} ${small?'small':''} ${theme}`} style={{'--env-ink':t.color,'--env-paper':t.paper} as CSSProperties} onClick={()=>setOpen(true)} aria-label={`Open ${t.name} invitation`}><div className="envelope-shadow"/><div className="envelope-back"/><div className="envelope-letter"><img src={t.art} alt="" fetchPriority="high"/><span className="letter-copy"><small>TOGETHER WITH OUR FAMILIES</small><strong>Ishaan <i>&</i> Ananya</strong><span>14 FEBRUARY 2027</span></span></div><div className="envelope-front"/><div className="envelope-flap"/><span className="wax-seal">V</span><span className="envelope-address">For you, with love.</span></button>}
function Reveal({children,className=''}:{children:React.ReactNode;className?:string}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{const node=ref.current;if(!node||!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){node?.classList.add('is-visible');return}const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){node.classList.add('is-visible');observer.disconnect()}},{threshold:.12});observer.observe(node);return()=>observer.disconnect()},[]);return <div ref={ref} className={`reveal ${className}`}>{children}</div>}
const designCategories=['BOTANICAL ROMANCE','INDIAN WEDDINGS · MULTI-CEREMONY','MODERN GLAMOUR','PLAYFUL PAPERCRAFT','DESTINATION DAYDREAM'];
const faqs:[string,string][]=[
  ['Can I try it before paying?','Yes. Design is free. Add your names, events and photos, and explore the invitation on this device. You pay once — ₹2,499 in India, or $40 via PayPal internationally — only when you publish and start collecting RSVPs.'],
  ['When can I publish my invitation?','Now. When your draft feels ready, choose Ready to publish, pay once, and your invitation goes live on a vowvel.com address you choose.'],
  ['What does ₹2,499 include?','₹2,499 is the total charged in India for one invitation suite: your design, live hosting, guest replies and a shareable link. Outside India, pay $40 USD via PayPal. Checkout does not add a separate tax line today.'],
  ['Can I get a refund?','Drafting is free, so you can decide before you pay. After a successful publish this is a delivered digital product, so we don’t refund change-of-mind. If you paid and your invitation did not go live, email support@vowvel.com and we will publish it or refund you.'],
  ['How long does hosting last?','Your invitation stays live for the celebration and a reasonable time after — at least through your wedding date, and typically a year from the publish date, whichever is later. Need it longer? Write to support@vowvel.com.'],
  ['How do I reach support?','Email support@vowvel.com. We usually reply within one to two business days.'],
  ['Can I change the design later?','Yes. Your names, events, words and photos stay with you when you try another design. Each design gives the same story a different feeling.'],
  ['Is this for engagements too?','Yes. Every design works for weddings and engagements. You can also add a reception, welcome gathering or another celebration to your invitation.'],
  ['Will guests need to download an app?','No. The invitations are designed to open in a browser on a phone or computer. Opening animations can be skipped, and your guests can reach the essentials immediately.'],
  ['Can I add my own photos?','Yes. Add up to six photos in the editor, or leave them out. Every design is also made to look complete with its original artwork.'],
];
function Landing({section}:{section:LandingSection|null}){
  const [occasion,setOccasion]=useState('All celebrations');
  useEffect(()=>{
    if(!section)return;
    const timer=setTimeout(()=>document.getElementById(section)?.scrollIntoView({behavior:'smooth'}),80);
    return()=>clearTimeout(timer);
  },[section]);
  return <div className="landing-page">
    <SiteNav/>
    <main id="main">
      <section className="hero wrap">
        <div className="hero-copy">
          <span className="eyebrow"><Flower size={18} weight="thin"/> SMALL DETAILS. BIG FEELINGS.</span>
          <h1>Something<br/>worth <em>opening.</em></h1>
          <p className="hero-outcome">Digital wedding invitation · Free to design · ₹2,499 to publish & collect RSVPs on WhatsApp.</p>
          <p>An invitation they’ll open more than once.<br/>Personalise your wedding website. Share it on WhatsApp.</p>
          <div className="hero-actions">
            <a className="button" href="#designs" onClick={event=>{event.preventDefault();goToLandingSection('designs')}}>Find your invitation <ArrowUpRight size={18}/></a>
            <span>Free to make.<br/>Pay only when you publish.</span>
          </div>
          <div className="tiny-promise"><Check size={14}/> Weddings & engagements, beautifully personal.</div>
        </div>
        <div className="hero-art">
          <div className="hero-handwritten">a little preview of your forever</div>
          <Envelope theme="gulmohar" onOpen={()=>navigate(previewPath('gulmohar',occasion))}/>
          <span className="open-hint"><MouseSimple size={18} weight="thin"/> Go on, break the seal.</span>
          <div className="hero-flower" aria-hidden="true"><Flower size={75} weight="thin"/></div>
        </div>
      </section>
      <div className="promise-line"><span>A little paper magic.</span><span>A whole lot of heart.</span><span>One very good first impression.</span></div>
      <div className="trust-strip wrap" aria-label="Why couples choose Vowvel">
        <span>No app for guests</span>
        <span>Pay once</span>
        <span>Live for your celebration</span>
        <span>Built for Indian multi-ceremony weddings</span>
        <span>Share on WhatsApp</span>
        <span>Opens on any phone</span>
      </div>
      <section id="designs" className="collection wrap">
        <Reveal>
          <div className="section-heading">
            <span className="eyebrow">THE VOWVEL COLLECTION</span>
            <h2>Five worlds.<br/><em>One that feels like you.</em></h2>
            <p>Five complete invitation suites. From the first opening<br/>to the last little note, every detail belongs together.</p>
          </div>
          <div className="collection-toolbar">
            <div className="segmented" aria-label="Celebration type">{['All celebrations','Wedding','Engagement'].map(x=><button key={x} className={occasion===x?'selected':''} aria-pressed={occasion===x} onClick={()=>setOccasion(x)}>{x}</button>)}</div>
            <span>Every design works for both occasions</span>
          </div>
        </Reveal>
        <div className="design-grid">{themes.map((t,i)=>
          <Reveal key={t.id} className={`design-item design-${t.id}`}>
            <button className={`design-art ${t.id}`} onClick={()=>navigate(previewPath(t.id,occasion))} aria-label={`Preview ${t.name}`} style={{'--card-paper':t.paper,'--card-ink':t.color} as CSSProperties}>
              <div className="design-stage"><WorldScene data={sampleForTheme(t.id,occasion==='Engagement'?'Engagement':'Wedding')}/></div>
              <span className="preview-circle"><ArrowUpRight size={24}/></span>
            </button>
            <div className="design-caption">
              <div>
                <span className="design-category">{t.id==='gulmohar'?'BEST FOR INDIAN WEDDINGS':designCategories[i]}</span>
                <h3>{t.name}</h3>
                <p>{t.subtitle}</p>
                <span className="suite-inclusions">{t.id==='gulmohar'?'Haldi, sangeet, wedding & reception — one link.':'Animated opening · Personal story · Event suite'}</span>
              </div>
              <div className="design-card-actions">
                <button className="button compact" onClick={()=>navigate('/create/'+t.id+(occasion==='Engagement'?'?occasion=engagement':''))}>{t.id==='gulmohar'?'Start with Gulmohar':'Start free'} <ArrowUpRight size={17}/></button>
                <button className="text-button" onClick={()=>navigate(previewPath(t.id,occasion))}>Explore <ArrowUpRight size={17}/></button>
              </div>
            </div>
          </Reveal>
        )}</div>
      </section>
      <section className="craft-section">
        <div className="wrap craft-layout">
          <Reveal className="craft-art">
            <div className="craft-postcard"><img src="/art/azure.webp" alt="Hand-painted Mediterranean landscape" width="1086" height="1448" loading="lazy"/><span>Somewhere lovely.<br/>With everyone we love.</span></div>
            <div className="craft-note"><Flower weight="thin" size={32}/><span>A date to keep.<br/>A story to tell.<br/>A little joy to share.</span></div>
          </Reveal>
          <Reveal className="craft-copy">
            <span className="eyebrow">MORE THAN A LINK</span>
            <h2>Feels like paper.<br/><em>Works like magic.</em></h2>
            <p>A seal to open. A secret to scratch. A story that unfolds. All the feeling of a beautiful invitation, with everything your guests need in one place.</p>
            <div className="craft-features">
              <div><EnvelopeSimple size={22} weight="thin"/><span><strong>An opening to remember</strong><small>A little anticipation before the big reveal.</small></span></div>
              <div><MouseSimple size={22} weight="thin"/><span><strong>A surprise, just for them</strong><small>Scratch away a layer to find your personal note.</small></span></div>
              <div><Check size={22} weight="thin"/><span><strong>The practical bits, beautifully handled</strong><small>Events, directions, calendar dates and guest replies.</small></span></div>
            </div>
            <button className="text-link" onClick={()=>navigate(previewPath('sunday',occasion))}>Experience the little details <ArrowRight size={18}/></button>
          </Reveal>
        </div>
      </section>
      <section id="how-it-works" className="how-section wrap">
        <Reveal className="section-heading">
          <span className="eyebrow">FROM “YES” TO “YOU’RE INVITED”</span>
          <h2>A little choosing.<br/><em>A lot of you.</em></h2>
        </Reveal>
        <div className="how-layout">
          <div className="how-steps">
            {[['Find your feeling','Choose a world you love. Open it, explore it, make yourself at home.'],['Make it personal','Your names, your plans, your words. See it all come together as you go.'],['Send a little happiness','Preview every detail. When it’s ready, pay once and share your invitation.']].map(([a,b],i)=>
              <Reveal key={a}><div className="step"><span>{i+1}</span><div><h3>{a}</h3><p>{b}</p></div></div></Reveal>
            )}
            <button className="button" onClick={()=>navigate('/create/gulmohar')}>Let’s make yours <ArrowUpRight size={18}/></button>
          </div>
          <Reveal className="personal-preview">
            <div className="sample-field"><small>YOUR NAMES</small><span>Ishaan <i>&</i> Ananya</span><Check size={18}/></div>
            <div className="mini-invitation"><img src="/art/gulmohar.webp" alt="Gulmohar invitation illustration" width="1086" height="1448" loading="lazy"/><div><small>TOGETHER WITH OUR FAMILIES</small><strong>Ishaan<br/><i>&</i> Ananya</strong><span>14 FEBRUARY 2027</span></div></div>
            <span className="handwritten">your words, our little touch</span>
          </Reveal>
        </div>
      </section>
      <section id="pricing" className="pricing-section">
        <div className="wrap pricing-layout">
          <Reveal>
            <span className="eyebrow">BEAUTIFUL SHOULD FEEL EASY</span>
            <h2>All the little things.<br/><em>One simple price.</em></h2>
            <p>We’re making the kind of invitation you’d keep in a drawer. Only this one goes wherever your people are. One link for Haldi, sangeet, wedding and reception.</p>
            <span className="pricing-footnote">The Signature Collection · One payment. Publishing is available now.</span>
          </Reveal>
          <Reveal className="price-card">
            <span className="eyebrow">THE SIGNATURE INVITATION SUITE</span>
            <div className="price">₹2,499 <span>one time</span></div>
            <p>or $40 internationally via PayPal. Less than one box of printed cards.</p>
            <ul>{['Your choice of five fully coordinated design suites','Up to eight ceremonies in one invitation','Cinematic opening & a personal scratch-to-reveal note','Your story, six photographs, travel & dress code','Guest replies, venue directions & calendar dates'].map(x=><li key={x}><Check size={16}/>{x}</li>)}</ul>
            <button className="button" onClick={()=>navigate('/create/gulmohar')}>Start with Gulmohar <ArrowUpRight size={18}/></button>
            <button className="text-button price-secondary" onClick={()=>goToLandingSection('designs')}>Browse all designs</button>
            <small>₹2,499 is the amount charged for India. Hosting lasts through your celebration and a reasonable period after. Questions on refunds or privacy? Email support@vowvel.com.</small>
          </Reveal>
        </div>
      </section>
      <section className="faq wrap">
        <div>
          <span className="eyebrow">A FEW GOOD QUESTIONS</span>
          <h2>Before you<br/><em>say hello.</em></h2>
        </div>
        <div>{faqs.map(([q,a])=><details key={q} id={q==='Can I get a refund?'?'faq-refunds':undefined}><summary>{q}<Plus size={17}/></summary><p>{a}</p></details>)}</div>
      </section>
      <section className="final-cta">
        <Flower size={38} weight="thin"/>
        <h2>Your forever<br/>deserves <em>a lovely beginning.</em></h2>
        <a className="button" href="#designs" onClick={event=>{event.preventDefault();goToLandingSection('designs')}}>Find your invitation <ArrowUpRight size={18}/></a>
        <p>Something worth opening. Someone worth celebrating.</p>
      </section>
    </main>
    <footer className="site-footer wrap">
      <Brand/>
      <span>Made for your kind of love.</span>
      <a href="#/blog">Journal</a>
      <a href="#faq-refunds" onClick={event=>{event.preventDefault();goToLandingSection('faq-refunds')}}>Refunds</a>
      <a href="mailto:support@vowvel.com">Privacy, terms & support</a>
      <a href="#designs" onClick={event=>{event.preventDefault();goToLandingSection('designs')}}>Explore the collection <ArrowUpRight size={14}/></a>
    </footer>
    <div className="landing-sticky-cta">
      <button className="button compact" onClick={()=>navigate('/create/gulmohar')}>Start free</button>
      <button className="button secondary compact" onClick={()=>goToLandingSection('pricing')}>See pricing</button>
    </div>
  </div>;
}
export default function App(){
  const [{route,section},setLocation]=useState(()=>readAppLocation(location.hash,location.pathname));
  useEffect(()=>{
    const listener=()=>setLocation(readAppLocation(location.hash,location.pathname));
    addEventListener('hashchange',listener);
    return()=>removeEventListener('hashchange',listener);
  },[]);
  useEffect(()=>{
    if(section)return;
    if(route.startsWith('/'))window.scrollTo({top:0,behavior:'instant'});
    if(route==='/blog'||route.startsWith('/blog/'))return;
    document.title=route==='/replies'?'Guest replies | Vowvel':route.startsWith('/admin')?'Admin | Vowvel':route.startsWith('/partner')?'Partner | Vowvel':route.startsWith('/influencer')?'Partner application | Vowvel':route.startsWith('/invite/')||route.startsWith('/preview')?'An invitation for you | Vowvel':route.startsWith('/create')?'Make it yours | Vowvel':'Vowvel | Something worth opening';
  },[route,section]);
  const isPublished=route.startsWith('/invite/');
  const isPreview=route.startsWith('/preview/');
  const isEditor=route.startsWith('/create');
  const isBlog=route==='/blog'||route.startsWith('/blog/');
  const blogSlug=route.startsWith('/blog/')?route.replace('/blog/','').split('?')[0]:undefined;
  const id=route.split('/')[2]?.split('?')[0];
  const data:InvitationData=id==='draft'?loadDraft():sampleForTheme(themeById(id).id,route.includes('occasion=engagement')?'Engagement':'Wedding');
  useEffect(()=>{
    if(isPreview){
      const meta=sharingDetails(data);
      document.title=meta.title;
      document.querySelector('meta[name="description"]')?.setAttribute('content',meta.description);
    }
  },[route,isPreview]);
  return <>
    <a className="skip-link" href="#main" onClick={e=>{e.preventDefault();const main=document.getElementById('main')||document.querySelector('article');main?.setAttribute('tabindex','-1');(main as HTMLElement)?.focus();main?.scrollIntoView()}}>Skip to content</a>
    <Suspense fallback={<div className="loading-screen"><Flower size={36}/><p>Opening something lovely...</p></div>}>
      {route==='/admin'?<AdminPortal/>:route==='/partner'?<PartnerPortal/>:route==='/influencer/apply'?<InfluencerApplication/>:route==='/replies'?<GuestReplies/>:isPublished?<PublishedInvitation slug={id}/>:isPreview?<Invitation key={route} data={data} initiallyOpen={route.includes('open=1')} onClose={()=>id==='draft'?navigate('/create/'+data.theme):collection()} onUse={()=>navigate('/create/'+data.theme+(data.occasion==='Engagement'?'?occasion=engagement':''))}/>:isEditor?<Editor key={id} initialTheme={themeById(id).id} occasion={route.includes('occasion=engagement')?'Engagement':undefined}/>:isBlog?<Blog slug={blogSlug}/>:route==='/checkout'?<CommerceCheckout/>:<Landing section={section}/>}
    </Suspense>
  </>;
}
