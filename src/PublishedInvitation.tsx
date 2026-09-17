import {useEffect,useState} from 'react';
import {api} from './api';
import {normalizeDraft} from './storage';
import type {InvitationData} from './data';
import Invitation from './Invitation';

export default function PublishedInvitation({slug}:{slug:string}){
  const [data,setData]=useState<InvitationData|null>(null);const [error,setError]=useState('');
  useEffect(()=>{api<unknown>(`/api/invitations/${encodeURIComponent(slug)}`).then(payload=>{const normalized=normalizeDraft(payload);if(!normalized)throw new Error('This invitation could not be opened.');setData(normalized)}).catch(reason=>setError(reason instanceof Error?reason.message:'This invitation could not be opened.'))},[slug]);
  if(error)return <main className="loading-screen"><p>{error}</p></main>;
  if(!data)return <main className="loading-screen"><p>Opening your invitation...</p></main>;
  return <Invitation key={slug} data={data} slug={slug}/>;
}
