import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check} from '@phosphor-icons/react';
import {api,formatMoney,loadSession,type SessionUser} from './api';
import {buyerSafePaymentMessage} from './checkoutCopy';
import {Brand,navigate} from './App';
import {themeById} from './data';
import {loadDraft,normalizeDraft} from './storage';
import CustomerOtpAuth from './CustomerOtpAuth';
import PaymentSuccess from './PaymentSuccess';
import {cleanAddress,validAddress,validQuote,sameQuote,type CheckoutQuote,type CheckoutSession,type CheckoutLookup,type PaymentMethod} from '../shared/checkout';
import './checkout-commerce.css';
import './checkout-otp.css';

const sdkLoads = new Map<string,Promise<void>>();
function loadSdk(src:string,ready:()=>boolean):Promise<void>{
  if(ready())return Promise.resolve();
  const existing=sdkLoads.get(src);if(existing)return existing;
  const promise=new Promise<void>((resolve,reject)=>{
    const script=document.createElement('script');script.src=src;script.async=true;
    const timer=setTimeout(()=>{script.remove();reject(new Error('The payment window timed out. Please try again.'))},20_000);
    script.onload=()=>{clearTimeout(timer);ready()?resolve():reject(new Error('The payment window could not be loaded.'))};
    script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('The payment window could not be loaded. Please try again.'))};
    document.head.appendChild(script);
  });
  sdkLoads.set(src,promise);void promise.catch(()=>sdkLoads.delete(src));return promise;
}
const readableError=(reason:unknown)=>buyerSafePaymentMessage(reason instanceof Error?reason.message:'Checkout could not be completed. Please try again.');
const PAYMENT_UNCONFIRMED='Payment has not been confirmed yet. Check its status before trying again.';

export default function Checkout(){
  const [draft]=useState(loadDraft);
  const addressKey=`vowvel:checkout-address:${JSON.stringify([draft.name1,draft.name2,draft.events[0]?.date])}`;
  const [subdomain,setSubdomain]=useState(()=>{
    try{const stored=sessionStorage.getItem(addressKey);if(stored&&validAddress(stored))return stored}catch{/* Storage is optional. */}
    return cleanAddress(`${draft.name1}-${draft.name2}`);
  });
  const [user,setUser]=useState<SessionUser|null>(null);
  const [authChecked,setAuthChecked]=useState(false);
  const [method,setMethod]=useState<PaymentMethod>('razorpay');
  const [code,setCode]=useState('');const [appliedCode,setAppliedCode]=useState('');
  const [quote,setQuote]=useState<CheckoutQuote|null>(null);const [quoteBusy,setQuoteBusy]=useState(true);
  const [quoteRetry,setQuoteRetry]=useState(0);
  const [checkout,setCheckout]=useState<CheckoutSession|null>(null);
  const [availability,setAvailability]=useState<'idle'|'checking'|'available'|'taken'>('idle');
  const [lookupRetry,setLookupRetry]=useState(0);
  const [message,setMessage]=useState('');const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);const [invitationUrl,setInvitationUrl]=useState('');
  const [approval,setApproval]=useState<CheckoutSession|null>(null);
  const paypalRef=useRef<HTMLDivElement|null>(null);
  const inFlight=useRef(false);const methodChosen=useRef(false);
  const alive=useRef(true);const addressRef=useRef(subdomain);addressRef.current=subdomain;
  const checkoutRef=useRef(checkout);checkoutRef.current=checkout;
  const currentDraft=checkout?normalizeDraft(checkout.invitation)||draft:draft;
  const theme=themeById(currentDraft.theme);
  const shown:CheckoutQuote|null=checkout||quote;
  const activeMethod=checkout?.method||method;

  useEffect(()=>{
    alive.current=true;document.title='Checkout | Vowvel';
    void loadSession().then(value=>{if(alive.current)setUser(value)}).catch(()=>undefined).finally(()=>{if(alive.current)setAuthChecked(true)});
    const controller=new AbortController();
    void fetch('https://ipapi.co/json/',{signal:controller.signal}).then(r=>r.ok?r.json():null).then((value:{country_code?:string}|null)=>{
      if(alive.current&&!methodChosen.current&&!checkoutRef.current&&value?.country_code&&/^[A-Z]{2}$/.test(value.country_code))
        setMethod(value.country_code==='IN'?'razorpay':'paypal');
    }).catch(()=>undefined);
    return()=>{alive.current=false;controller.abort()};
  },[]);
  useEffect(()=>{try{sessionStorage.setItem(addressKey,subdomain)}catch{/* Server lookup still recovers by address. */}},[addressKey,subdomain]);

  // Never invent a checkout total. An unapplied/invalid coupon must not leave a stale quote payable.
  useEffect(()=>{
    if(checkout)return;
    let cancelled=false;setQuote(null);setQuoteBusy(true);
    void api<{quote:Omit<CheckoutQuote,'currency'>;currency:string;method:PaymentMethod}>('/api/coupons/quote',{
      method:'POST',body:JSON.stringify({code:method==='razorpay'?appliedCode:'',method}),
    }).then(result=>{
      const nextQuote={...result.quote,currency:result.currency};
      if(result.method!==method||!validQuote(nextQuote))throw new Error('The total could not be verified. Please refresh the price.');
      if(!cancelled)setQuote(nextQuote);
    }).catch(reason=>{if(!cancelled)setError(readableError(reason))}).finally(()=>{if(!cancelled)setQuoteBusy(false)});
    return()=>{cancelled=true};
  },[method,appliedCode,user?.id,quoteRetry,checkout?.id]);

  // Ownership is checked server-side. Other customers never receive order or invitation details.
  useEffect(()=>{
    let cancelled=false;setCheckout(null);
    if(!user||!validAddress(subdomain)){setAvailability('idle');return}
    setAvailability('checking');
    const timer=setTimeout(()=>{
      void api<CheckoutLookup>(`/api/checkout/lookup?address=${encodeURIComponent(subdomain)}`).then(result=>{
        if(cancelled)return;
        setCheckout(result.checkout);setAvailability(result.available?'available':'taken');
        if(result.checkout){methodChosen.current=true;setMethod(result.checkout.method)}
      }).catch(reason=>{if(!cancelled){setAvailability('idle');setError(readableError(reason))}});
    },350);
    return()=>{cancelled=true;clearTimeout(timer)};
  },[subdomain,user?.id,lookupRetry]);

  async function checkStatus(address=subdomain):Promise<CheckoutSession|null>{
    const result=await api<CheckoutLookup>(`/api/checkout/lookup?address=${encodeURIComponent(address)}&check=1`);
    if(alive.current&&addressRef.current===address){setCheckout(result.checkout);setAvailability(result.available?'available':'taken')}
    return result.checkout;
  }
  useEffect(()=>{
    if(checkout?.paymentState!=='confirming')return;
    let stopped=false,running=false,count=0;
    const address=checkout.address;
    const timer=setInterval(()=>{
      if(stopped||running)return;
      if(++count>12){clearInterval(timer);setMessage('Confirmation is taking longer than usual. Please contact support with your order number; do not pay again.');return}
      running=true;
      void checkStatus(address).catch(()=>undefined).finally(()=>{running=false});
    },5000);
    return()=>{stopped=true;clearInterval(timer)};
  },[checkout?.id,checkout?.paymentState]);

  async function capturePayPal(order:CheckoutSession){
    const result=await api<{invitationUrl?:string;alreadyPaid?:boolean}>('/api/paypal/capture',{
      method:'POST',body:JSON.stringify({orderId:order.id}),
    });
    if(alive.current)setInvitationUrl(result.invitationUrl||order.invitationUrl);
  }
  useEffect(()=>{
    if(!approval||!paypalRef.current||!window.paypal)return;
    let cancelled=false;const container=paypalRef.current;container.innerHTML='';
    const fail=(reason:unknown)=>{if(!cancelled)setError(readableError(reason))};
    try{
      const rendered=window.paypal.Buttons({style:{layout:'vertical',label:'paypal'},
        createOrder:()=>approval.providerOrderId!,
        onApprove:async()=>{
          if(cancelled)return;inFlight.current=true;setBusy(true);setError('');
          try{await capturePayPal(approval)}catch(reason){fail(reason);try{await checkStatus(approval.address)}catch{/* Keep the original error. */}}
          finally{inFlight.current=false;if(alive.current){setBusy(false);setApproval(null)}}
        },
        onCancel:()=>{if(!cancelled){setApproval(null);setMessage(PAYMENT_UNCONFIRMED);void checkStatus(approval.address).catch(fail)}},
        onError:()=>{if(!cancelled){setApproval(null);setError('PayPal could not complete this attempt. Check payment status before retrying.')}},
      }).render(container);
      void Promise.resolve(rendered).catch(fail);
    }catch(reason){fail(reason)}
    return()=>{cancelled=true;container.innerHTML=''};
  },[approval]);

  async function openRazorpay(order:CheckoutSession){
    const customer=user;if(!customer)throw new Error('Sign in before opening payment.');
    if(!order.checkoutKey||!order.providerOrderId)throw new Error('Payment is temporarily unavailable. Please contact support.');
    await loadSdk('https://checkout.razorpay.com/v1/checkout.js',()=>!!window.Razorpay);
    if(!alive.current)return;
    await new Promise<void>(resolve=>{
      let completed=false;
      const payment=new window.Razorpay!({key:order.checkoutKey!,amount:order.totalCents,currency:order.currency,
        name:'Vowvel',description:`${themeById((normalizeDraft(order.invitation)||draft).theme).name} invitation`,
        order_id:order.providerOrderId!,prefill:{name:customer.name,email:customer.email},theme:{color:'#43523c'},
        handler:async response=>{
          completed=true;
          try{
            const result=await api<{invitationUrl:string}>('/api/verify-payment',{method:'POST',body:JSON.stringify({orderId:order.id,...response})});
            if(alive.current)setInvitationUrl(result.invitationUrl);
          }catch(reason){if(alive.current)setError(readableError(reason));try{await checkStatus(order.address)}catch{/* Preserve verification error. */}}
          finally{resolve()}
        },
        modal:{ondismiss:()=>{
          if(completed)return;
          if(alive.current)setMessage(PAYMENT_UNCONFIRMED);
          void checkStatus(order.address).catch(reason=>{if(alive.current)setError(readableError(reason))}).finally(resolve);
        }},
      });
      payment.on('payment.failed',response=>{if(alive.current)setError(response.error?.description||'Payment was not completed. Check the status before retrying.')});
      payment.open();
    });
  }
  async function continuePayment(){
    if(inFlight.current||!user||!shown||(!checkout&&availability!=='available'))return;
    inFlight.current=true;setBusy(true);setError('');setMessage('');
    const expected=shown;const previousDraft=JSON.stringify(currentDraft);
    try{
      const result=await api<{checkout:CheckoutSession}>('/api/orders',{method:'POST',body:JSON.stringify({
        code:activeMethod==='razorpay'?appliedCode:'',method:activeMethod,subdomain,
        invitation:checkout?.invitation||{version:1,data:draft},
      })});
      const order=result.checkout;
      if(!order||!validQuote(order))throw new Error('The checkout response could not be verified. Check payment status before retrying.');
      if(!alive.current)return;
      setCheckout(order);methodChosen.current=true;setMethod(order.method);
      if(order.paymentState==='paid'){setInvitationUrl(order.invitationUrl);return}
      if(order.paymentState==='confirming'){setMessage('Your payment is being confirmed. Do not pay again; this page will check for your published link.');return}
      if(order.paymentState==='blocked')throw new Error('This order cannot accept another payment. Please contact support with the order number.');
      if(order.paymentState==='unavailable')throw new Error('The payment status could not be verified. Please check again shortly rather than starting another payment.');
      // A changed price or recovered invitation is shown for explicit review before opening the provider.
      if(!sameQuote(expected,order)||JSON.stringify(normalizeDraft(order.invitation)||draft)!==previousDraft||order.method!==activeMethod){
        setMessage('Your saved checkout or price has changed. Review the invitation and total below, then continue to the payment shown.');return;
      }
      if(order.method==='razorpay')await openRazorpay(order);
      else if(order.paymentState==='approved')await capturePayPal(order);
      else{
        if(!order.paypalClientId||!order.providerOrderId)throw new Error('PayPal is temporarily unavailable. Please contact support.');
        await loadSdk(`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(order.paypalClientId)}&currency=${encodeURIComponent(order.currency)}&intent=capture`,()=>!!window.paypal);
        if(alive.current)setApproval(order);
      }
    }catch(reason){if(alive.current)setError(readableError(reason))}
    finally{inFlight.current=false;if(alive.current)setBusy(false)}
  }
  async function refreshStatus(){
    if(inFlight.current||!user)return;
    inFlight.current=true;setBusy(true);setError('');
    try{await checkStatus()}catch(reason){setError(readableError(reason))}
    finally{inFlight.current=false;if(alive.current)setBusy(false)}
  }
  const liveUrl=invitationUrl||(checkout?.paymentState==='paid'?checkout.invitationUrl:'');
  if(liveUrl)return <PaymentSuccess themeId={currentDraft.theme} draft={currentDraft} invitationUrl={liveUrl}/>;
  const controlsLocked=busy||!!approval;
  const payable=!!shown&&!!user&&(!!checkout||availability==='available')&&
    (!checkout||['ready','approved','unavailable'].includes(checkout.paymentState));
  return <div className="checkout-page">
    <header className="editor-header"><Brand/><button className="text-button" disabled={controlsLocked} onClick={()=>navigate('/create/'+draft.theme)}><ArrowLeft/> Back to your invitation</button></header>
    <main className="checkout-layout wrap"><div>
      <span className="eyebrow">THE FINAL LITTLE STEP</span><h1>Ready for<br/><em>your people.</em></h1>
      <p>{checkout?'Review the invitation saved with this checkout. You can edit it after publishing.':'Your invitation is saved on this device. Take one more look before the big hello.'}</p>
      <div className={`checkout-preview ${currentDraft.theme}`} style={{background:theme.paper,color:theme.color}}>
        <img src={theme.art} alt="Your selected design" width="1086" height="1448"/>
        <div><span>{currentDraft.occasion.toUpperCase()}</span><h2>{currentDraft.name1||'Your name'} <i>&</i><br/>{currentDraft.name2||'Their name'}</h2><p>{theme.name}</p></div>
      </div>
      {!checkout&&<button className="text-link" disabled={controlsLocked} onClick={()=>navigate('/preview/draft')}>Preview the live design <ArrowUpRight size={18}/></button>}
    </div><section className="checkout-summary" aria-busy={busy}>
      <span className="eyebrow">SECURE CHECKOUT</span><h2>One lovely invitation.</h2>
      <label>Payment region <select aria-label="Payment region" value={activeMethod} disabled={controlsLocked||!!checkout} onChange={event=>{
        methodChosen.current=true;setMethod(event.target.value as PaymentMethod);setQuote(null);setError('');
      }}><option value="razorpay">India · Razorpay</option><option value="paypal">Outside India · PayPal</option></select></label>
      {!authChecked?<p role="status">Checking sign-in…</p>:!user?<CustomerOtpAuth compact onAuthenticated={setUser}/>:<p className="checkout-signed-in"><Check size={16}/> Signed in as {user.email}</p>}
      <label className="subdomain-field"><span>Your invitation address</span><div>
        <input maxLength={40} value={subdomain} disabled={controlsLocked} aria-describedby="subdomain-status" onChange={event=>{setSubdomain(cleanAddress(event.target.value));setCheckout(null);setAvailability('checking');setError('');setMessage('')}}/>
        <strong>.vowvel.com</strong></div><small>Your guests will open: {(subdomain||'your-names')}.vowvel.com</small>
        <small id="subdomain-status" className={availability}>{!user?'Sign in to check your address.':checkout?'Your saved checkout is available below.':availability==='checking'?'Checking…':availability==='available'?'Available':availability==='taken'?'Already taken. Try another.':'Use 3–40 letters, numbers or hyphens, including a letter.'}</small>
      </label>
      {user&&availability==='idle'&&validAddress(subdomain)&&<button className="text-button" disabled={controlsLocked} onClick={()=>setLookupRetry(value=>value+1)}>Check address again</button>}
      {checkout&&<div className="notice" role="status"><strong>Saved checkout · {checkout.id}</strong><p>Your original invitation, payment method and price are retained. This does not create another order or change your draft in the editor.</p><button className="text-button" disabled={controlsLocked} onClick={()=>void refreshStatus()}>Check payment status</button></div>}
      {activeMethod==='razorpay'&&!checkout&&<div className="coupon-entry"><label>Coupon code<input value={code} disabled={controlsLocked} onChange={event=>setCode(event.target.value.toUpperCase())}/></label><button disabled={controlsLocked||quoteBusy} onClick={()=>{setError('');setQuote(null);setAppliedCode(code.trim());setQuoteRetry(value=>value+1)}}>{code.trim()?'Apply':'Clear'}</button></div>}
      {shown?<><div className="order-line"><span>{theme.name}<small>{currentDraft.occasion} invitation</small></span><strong>{formatMoney(shown.subtotalCents,shown.currency)}</strong></div>
        <div className="price-breakdown">{shown.discountCents>0&&<span>Coupon discount <strong>-{formatMoney(shown.discountCents,shown.currency)}</strong></span>}{shown.taxCents>0&&<span>Tax <strong>{formatMoney(shown.taxCents,shown.currency)}</strong></span>}</div>
        <div className="order-total"><span>Total</span><strong>{formatMoney(shown.totalCents,shown.currency)}</strong></div></>:<p role="status">{quoteBusy?'Loading your verified total…':'The price could not be loaded.'}</p>}
      {!shown&&!quoteBusy&&<button className="text-button" disabled={controlsLocked} onClick={()=>{setError('');setQuoteRetry(value=>value+1)}}>Refresh price</button>}
      {approval&&<div className="paypal-approval"><div ref={paypalRef}/><button className="text-link" disabled={busy} onClick={()=>{setApproval(null);setMessage(PAYMENT_UNCONFIRMED)}}>Close PayPal</button></div>}
      {error&&<p className="notice checkout-error" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
      {checkout?.paymentState==='confirming'&&<p className="notice" role="status">Confirmation is pending. Do not pay again. Your published link will appear when confirmation reaches Vowvel.</p>}
      {checkout?.paymentState==='blocked'&&<p className="notice" role="alert">This order cannot be paid again. Contact support with the order number above.</p>}
      <button className="button full" disabled={controlsLocked||!payable} onClick={()=>void continuePayment()}>{busy?'Please wait':approval?'Complete with PayPal above':checkout?.paymentState==='unavailable'?'Check and resume checkout':shown?.totalCents===0?'Publish invitation':checkout?'Resume saved payment':'Continue to payment'} <ArrowRight/></button>
      <p className="checkout-legal">By paying you publish a digital invitation. For privacy, refunds or terms, email <a href="mailto:support@vowvel.com">support@vowvel.com</a>.</p>
    </section></main>
  </div>;
}
