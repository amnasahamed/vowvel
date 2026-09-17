const raw=process.env.SITE_URL||'https://vowvel.com';
if(!process.env.SITE_URL)console.log('SITE_URL is not set. Defaulting to https://vowvel.com. Override with SITE_URL=https://example.com for previews.');
const url=new URL(raw);
if(url.protocol!=='https:'||url.hostname==='localhost'||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw new Error('SITE_URL must be a public HTTPS origin, without a path, query or fragment.');
