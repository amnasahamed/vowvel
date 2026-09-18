interface EmailRuntime {
  DB:D1Database;
  EMAIL:SendEmail;
  EMAIL_FROM?:string;
  EMAIL_REPLY_TO?:string;
  APP_NAME?:string;
}

export interface EmailContent {to:string;subject:string;text:string;html:string}

function sender(env:EmailRuntime){
  if(!env.EMAIL_FROM)throw new Error('EMAIL_FROM is not configured');
  return {email:env.EMAIL_FROM,name:env.APP_NAME||'Vowvel'};
}

export function escapeHtml(value:string):string{return value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]||character))}

export async function sendTransactional(env:EmailRuntime,message:EmailContent):Promise<void>{
  const replyTo=env.EMAIL_REPLY_TO?.trim();
  await env.EMAIL.send({to:message.to,from:sender(env),...(replyTo?{replyTo}:{}),subject:message.subject,text:message.text,html:message.html});
}

export async function queueEmail(env:EmailRuntime,eventKey:string,message:EmailContent):Promise<void>{
  await env.DB.prepare(`INSERT OR IGNORE INTO email_outbox(id,recipient,subject,text_body,html_body,event_key) VALUES(?,?,?,?,?,?)`).bind(`email_${crypto.randomUUID()}`,message.to,message.subject,message.text,message.html,eventKey).run();
}

export async function flushEmailOutbox(env:EmailRuntime,limit=20):Promise<void>{
  await env.DB.prepare(`UPDATE email_outbox SET status='retry',next_attempt_at=CURRENT_TIMESTAMP,last_error='Recovered interrupted delivery',updated_at=CURRENT_TIMESTAMP WHERE status='sending' AND updated_at<datetime('now','-5 minutes')`).run();
  const queued=await env.DB.prepare(`SELECT id,recipient,subject,text_body,html_body,attempt_count FROM email_outbox WHERE status IN ('queued','retry') AND next_attempt_at<=CURRENT_TIMESTAMP ORDER BY created_at LIMIT ?`).bind(limit).all<{id:string;recipient:string;subject:string;text_body:string;html_body:string;attempt_count:number}>();
  for(const item of queued.results){
    const claimed=await env.DB.prepare(`UPDATE email_outbox SET status='sending',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('queued','retry')`).bind(item.id).run();
    if((claimed.meta.changes||0)!==1)continue;
    try{
      await sendTransactional(env,{to:item.recipient,subject:item.subject,text:item.text_body,html:item.html_body});
      await env.DB.prepare(`UPDATE email_outbox SET status='sent',attempt_count=attempt_count+1,sent_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,last_error=NULL WHERE id=?`).bind(item.id).run();
    }catch(error){
      const attempts=item.attempt_count+1;const terminal=attempts>=5;const minutes=Math.min(60,2**attempts);
      await env.DB.prepare(`UPDATE email_outbox SET status=?,attempt_count=?,next_attempt_at=datetime('now',?),last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`).bind(terminal?'failed':'retry',attempts,`+${minutes} minutes`,String(error).slice(0,500),item.id).run();
    }
  }
}

export function otpEmail(to:string,code:string):EmailContent{
  const safeCode=escapeHtml(code);return {to,subject:'Your Vowvel sign-in code',text:`Your Vowvel sign-in code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,html:`<div style="font-family:Arial,sans-serif;color:#302923;max-width:560px;margin:auto"><p style="letter-spacing:.12em;text-transform:uppercase;font-size:12px">Vowvel secure access</p><h1 style="font-family:Georgia,serif;font-weight:400">Your sign-in code</h1><p style="font-size:30px;letter-spacing:.22em;font-weight:700">${safeCode}</p><p>This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p></div>`};
}

export function purchaseEmail(to:string,orderId:string,total:string,inviteUrl:string):EmailContent{
  const safeUrl=escapeHtml(inviteUrl);
  const text=`Your Vowvel invitation is live.\n\nWe received ${total} for order ${orderId}.\n\nOpen your invitation:\n${inviteUrl}\n\nTo share it, copy the link above (tap and hold the link, then choose Copy) and send it to your guests on WhatsApp, SMS or email.\n\nKeep this email so you can always find your invitation link again. Questions? Write to support@vowvel.com.`;
  const html=`<div style="background:#f8f6ef;padding:32px 16px;font-family:Georgia,'Times New Roman',serif"><div style="max-width:560px;margin:auto;background:#fffdf8;border:1px solid #e7dfd0;border-radius:10px;overflow:hidden"><div style="background:#24141e;color:#f1efdf;text-align:center;padding:28px 24px"><p style="margin:0;font-family:Arial,sans-serif;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#d8c690">Vowvel &middot; Something worth opening</p><h1 style="margin:12px 0 0;font-weight:400;font-size:30px;line-height:1.25">Your invitation<br/>is live.</h1></div><div style="padding:28px 28px 8px;color:#302923"><p style="margin:0 0 6px;font-size:16px;line-height:1.6">We received <strong>${escapeHtml(total)}</strong> for order ${escapeHtml(orderId)}.</p><p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#5c534b">Your invitation is published and ready to share with your favourite people.</p><p style="text-align:center;margin:0 0 24px"><a href="${safeUrl}" style="display:inline-block;background:#43523c;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;letter-spacing:.04em;padding:14px 30px;text-decoration:none;border-radius:6px">Open your invitation</a></p><p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8a7f74;margin:0 0 8px">Copy your link</p><p style="margin:0 0 6px;background:#f8f6ef;border:1px dashed #c9bfa9;border-radius:6px;padding:12px 14px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;word-break:break-all"><a href="${safeUrl}" style="color:#43523c;text-decoration:none">${safeUrl}</a></p><p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#71685f">Tap and hold the link above, choose Copy, then paste it into WhatsApp, SMS or email for your guests.</p></div><div style="border-top:1px solid #e7dfd0;padding:18px 28px;font-family:Arial,sans-serif;font-size:12px;line-height:1.7;color:#8a7f74">Keep this email so you can always find your invitation link again.<br/>Questions? Write to <a href="mailto:support@vowvel.com" style="color:#43523c">support@vowvel.com</a>.</div></div></div>`;
  return {to,subject:'Your Vowvel invitation is live',text,html};
}

export function redemptionEmail(to:string,code:string,commission:string):EmailContent{
  return {to,subject:`Your coupon ${code} was redeemed`,text:`Good news: coupon ${code} was used in a verified Vowvel purchase. Your commission for this order is ${commission} and will become available after the holding period.`,html:`<div style="font-family:Arial,sans-serif;color:#302923;max-width:560px;margin:auto"><p style="letter-spacing:.12em;text-transform:uppercase;font-size:12px">Partner notification</p><h1 style="font-family:Georgia,serif;font-weight:400">Your recommendation converted.</h1><p>Coupon <strong>${escapeHtml(code)}</strong> was used in a verified purchase.</p><p>Your commission: <strong>${escapeHtml(commission)}</strong></p><p style="font-size:13px;color:#71685f">It will become available after the configured holding period. Customer details are kept private.</p></div>`};
}
