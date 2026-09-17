import fs from 'node:fs/promises';
import sharp from 'sharp';
import {themes,sample} from '../src/data.ts';
import {sharingDetails,sharingTags,sharingSvg} from '../src/sharing.ts';
const origin=new URL(process.env.SITE_URL||'http://localhost:5173');
if(!['https:','http:'].includes(origin.protocol)||origin.pathname!=='/'||origin.hash||origin.search||origin.username||origin.password)throw new Error('SITE_URL must be a plain HTTP(S) origin.');
const template=await fs.readFile('dist/index.html','utf8');
const inject=(html,tags)=>html.replace(/<title>[^<]*<\/title>/,'').replace(/<meta\s+name="description"[^>]*\/>/,'').replace('</head>',tags+'</head>');
await fs.mkdir('dist/og',{recursive:true});
for(const theme of themes){
 const data={...structuredClone(sample),theme:theme.id};
 const art=await sharp('public/films/'+theme.id+'-poster.webp').resize(410,630,{fit:'cover'}).png().toBuffer();
 const svg=sharingSvg(data,theme,'data:image/png;base64,'+art.toString('base64'));
 await sharp(Buffer.from(svg)).png().toFile('dist/og/'+theme.id+'.png');
 const path='/invitation/'+theme.id+'/';await fs.mkdir('dist'+path,{recursive:true});
 const tags=sharingTags(sharingDetails(data),new URL(path,origin).href,new URL('/og/'+theme.id+'.png',origin).href);
 await fs.writeFile('dist'+path+'index.html',inject(template,tags));
}
// Brand card uses the same original artwork, with an editorial brand message.
const brandSvg=sharingSvg({...sample,name1:'Something worth',name2:'opening.',events:[{...sample.events[0],date:'',venue:'Wedding & engagement invitations'}]},themes[0],'data:image/png;base64,'+(await sharp('public/films/conservatory-poster.webp').resize(410,630,{fit:'cover'}).png().toBuffer()).toString('base64')).replace('YOU ARE LOVINGLY INVITED','MADE FOR YOUR KIND OF LOVE').replace('Date to be announced','Five artful worlds. One beautiful beginning.').replace('>WEDDING<','>VOWVEL<');
await sharp(Buffer.from(brandSvg)).png().toFile('dist/og/vowvel.png');
await fs.writeFile('dist/index.html',inject(template,sharingTags({title:'Vowvel | Something worth opening',description:'Wedding and engagement invitations worth opening. Discover five artful designs, make one yours, and invite your favourite people with Vowvel.',imageAlt:'Vowvel — wedding and engagement invitations worth opening'},origin.href,new URL('/og/vowvel.png',origin).href,false)));
console.log('Generated initial HTML sharing tags and six 1200 × 630 PNG cards for '+origin.origin);
if(!process.env.SITE_URL)console.log('Local preview URLs used. Set SITE_URL to the real HTTPS origin before deployment.');
