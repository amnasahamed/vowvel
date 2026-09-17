import type { InvitationData } from './data';
import './couple-section.css';
export default function CoupleSection({data}:{data:InvitationData}){
 const couple=data.couple;if(!couple?.enabled)return null;
 const profiles=couple.profiles.map((profile,index)=>({...profile,name:index===0?data.name1:data.name2})).filter(profile=>profile.photo||profile.intro.trim()||profile.role.trim()||(couple.showFamily&&(profile.familyName.trim()||profile.guardians.trim())));
 if(!profiles.length)return null;
 const photoCount=profiles.filter(profile=>profile.photo).length;
 return <section className={`couple-section couple-${data.theme} ${photoCount===1?'couple-single-photo':''}`} aria-label="Meet the couple"><span className="couple-eyebrow">THE PEOPLE BEHIND THE PROMISES</span><h2>Two lives.<br/><em>One lovely story.</em></h2><div className="couple-profiles">{profiles.map((profile,index)=><article className={`couple-profile ${profile.photo?'couple-with-photo':'couple-without-photo'}`} key={index}>{profile.photo&&<div className="couple-portrait"><img src={profile.photo} alt={`Portrait of ${profile.name||`person ${index+1}`}`} loading="lazy"/></div>}<div className="couple-profile-copy">{profile.role.trim()&&<span className="couple-role">{profile.role}</span>}{profile.name.trim()&&<h3>{profile.name}</h3>}{profile.intro.trim()&&<p>{profile.intro}</p>}{couple.showFamily&&(profile.familyName.trim()||profile.guardians.trim())&&<div className="couple-family">{profile.familyName.trim()&&<strong>{profile.familyName}</strong>}{profile.guardians.trim()&&<p>{profile.guardians}</p>}</div>}</div></article>)}</div></section>
}
