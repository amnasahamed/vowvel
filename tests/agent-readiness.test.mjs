import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import worker from '../worker/index.ts';

test('Level 1: robots.txt contains RFC 9309 rules, explicit AI bot blocks, and Content Signals', async () => {
  const content = await fs.readFile('dist/robots.txt', 'utf8');
  assert.ok(content.includes('User-agent: *'));
  
  const expectedBots = [
    'GPTBot',
    'OAI-SearchBot',
    'Claude-Web',
    'Google-Extended',
    'Amazonbot',
    'anthropic-ai',
    'Bytespider',
    'CCBot',
    'Applebot-Extended'
  ];
  for (const bot of expectedBots) {
    assert.ok(content.includes(`User-agent: ${bot}`), `Missing User-agent block for ${bot}`);
  }

  assert.ok(content.includes('Content-Signal: ai-train=no, search=yes, ai-input=yes'));
  assert.ok(content.includes('Sitemap: https://vowvel.com/sitemap.xml'));
  assert.ok(content.includes('Agentmap: https://vowvel.com/.well-known/ai-catalog.json'));
});

test('Level 1: sitemap.xml is valid XML and contains all canonical routes', async () => {
  const content = await fs.readFile('dist/sitemap.xml', 'utf8');
  assert.ok(content.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
  assert.ok(content.includes('<loc>https://vowvel.com/</loc>'));
  assert.ok(content.includes('<loc>https://vowvel.com/#/preview/conservatory</loc>'));
  assert.ok(content.includes('<loc>https://vowvel.com/#/preview/gulmohar</loc>'));
  assert.ok(content.includes('<loc>https://vowvel.com/#/preview/afterhours</loc>'));
  assert.ok(content.includes('<loc>https://vowvel.com/#/preview/sunday</loc>'));
  assert.ok(content.includes('<loc>https://vowvel.com/#/preview/azure</loc>'));
  assert.ok(content.includes('<loc>https://vowvel.com/#/checkout</loc>'));
});

test('Level 1: llms.txt and llms-full.txt follow llmstxt.org structure', async () => {
  const llms = await fs.readFile('dist/llms.txt', 'utf8');
  assert.ok(llms.startsWith('# Vowvel'));
  assert.ok(llms.includes('Conservatory'));
  assert.ok(llms.includes('2,499'));
  assert.ok(llms.includes('llms-full.txt'));

  const llmsFull = await fs.readFile('dist/llms-full.txt', 'utf8');
  assert.ok(llmsFull.startsWith('# Vowvel'));
  assert.ok(llmsFull.includes('Cloudflare Workers'));
});

test('Level 2: api-catalog conforms to RFC 9727 linkset JSON', async () => {
  const raw = await fs.readFile('dist/.well-known/api-catalog', 'utf8');
  const parsed = JSON.parse(raw);
  assert.ok(Array.isArray(parsed.linkset));
  assert.equal(parsed.linkset.length, 1);
  const entry = parsed.linkset[0];
  assert.equal(entry.anchor, 'https://vowvel.com/api');
  assert.ok(Array.isArray(entry['service-desc']));
  assert.equal(entry['service-desc'][0].href, 'https://vowvel.com/openapi.json');
  assert.ok(Array.isArray(entry['service-doc']));
  assert.ok(Array.isArray(entry['status']));
});

test('Level 2: auth.md meets WorkOS specification with H1 heading', async () => {
  const auth = await fs.readFile('dist/auth.md', 'utf8');
  assert.ok(auth.includes('# Vowvel auth.md'));
  assert.ok(auth.includes('Agent Registration'));
  assert.ok(auth.includes('/.well-known/oauth-protected-resource'));
  assert.ok(auth.includes('anonymous'));
  assert.ok(auth.includes('identity_assertion'));
});

test('Level 3: OAuth discovery and protected resource metadata conform to RFC 8414 & RFC 9728', async () => {
  const authServer = JSON.parse(await fs.readFile('dist/.well-known/oauth-authorization-server', 'utf8'));
  assert.equal(authServer.issuer, 'https://vowvel.com');
  assert.equal(authServer.authorization_endpoint, 'https://vowvel.com/oauth/authorize');
  assert.equal(authServer.token_endpoint, 'https://vowvel.com/api/auth/token');
  assert.equal(authServer.jwks_uri, 'https://vowvel.com/.well-known/jwks.json');
  assert.ok(authServer.agent_auth);
  assert.equal(authServer.agent_auth.register_uri, 'https://vowvel.com/api/auth/agent/register');

  const oidc = JSON.parse(await fs.readFile('dist/.well-known/openid-configuration', 'utf8'));
  assert.equal(oidc.issuer, 'https://vowvel.com');

  const prm = JSON.parse(await fs.readFile('dist/.well-known/oauth-protected-resource', 'utf8'));
  assert.equal(prm.resource, 'https://vowvel.com');
  assert.deepEqual(prm.authorization_servers, ['https://vowvel.com']);
  assert.ok(prm.scopes_supported.includes('invitations:read'));
  assert.deepEqual(prm.bearer_methods_supported, ['header']);
});

test('Level 3: A2A Agent Card complies with A2A Protocol schema', async () => {
  const card = JSON.parse(await fs.readFile('dist/.well-known/agent-card.json', 'utf8'));
  assert.equal(card.name, 'Vowvel Concierge Agent');
  assert.equal(card.version, '1.0.0');
  assert.ok(Array.isArray(card.supportedInterfaces));
  assert.equal(card.supportedInterfaces[0].url, 'https://vowvel.com/api/agent/a2a');
  assert.ok(Array.isArray(card.skills));
  assert.ok(card.skills.some(s => s.id === 'curate_themes'));
});

test('Level 3: Agent skills index matches actual SKILL.md SHA-256 digests', async () => {
  const index = JSON.parse(await fs.readFile('dist/.well-known/agent-skills/index.json', 'utf8'));
  assert.equal(index.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json');
  assert.ok(Array.isArray(index.skills));
  assert.equal(index.skills.length, 3);

  for (const skill of index.skills) {
    const filePath = 'dist' + skill.url;
    const fileBytes = await fs.readFile(filePath);
    const computedDigest = 'sha256:' + crypto.createHash('sha256').update(fileBytes).digest('hex');
    assert.equal(skill.digest, computedDigest, `Digest mismatch for skill ${skill.name}`);
  }
});

test('Level 3: MCP Server Card conforms to SEP-1649 specification', async () => {
  const mcp = JSON.parse(await fs.readFile('dist/.well-known/mcp/server-card.json', 'utf8'));
  assert.equal(mcp.serverInfo.name, 'vowvel-mcp');
  assert.equal(mcp.serverInfo.version, '1.0.0');
  assert.equal(mcp.endpoint, 'https://vowvel.com/api/mcp');
  assert.ok(mcp.capabilities.tools);
  assert.ok(Array.isArray(mcp.tools));
  assert.ok(mcp.tools.some(t => t.name === 'list_themes'));
});

test('Level 3: Web Bot Auth directory serves valid JWKS', async () => {
  const jwks = JSON.parse(await fs.readFile('dist/.well-known/http-message-signatures-directory', 'utf8'));
  assert.ok(Array.isArray(jwks.keys));
  assert.ok(jwks.keys.length >= 1);
  assert.equal(jwks.keys[0].kty, 'OKP');
  assert.equal(jwks.keys[0].crv, 'Ed25519');
});

test('Level 3: ARD ai-catalog.json manifest contains valid urn:air identifiers and queries', async () => {
  const ard = JSON.parse(await fs.readFile('dist/.well-known/ai-catalog.json', 'utf8'));
  assert.equal(ard.specVersion, '1.0');
  assert.equal(ard.host.displayName, 'Vowvel');
  assert.equal(ard.host.identifier, 'did:web:vowvel.com');
  assert.ok(Array.isArray(ard.entries));
  assert.ok(ard.entries.length >= 3);

  for (const entry of ard.entries) {
    assert.ok(entry.identifier.startsWith('urn:air:vowvel.com:'));
    assert.ok(entry.displayName);
    assert.ok(entry.type);
    assert.ok(entry.url || entry.data);
    assert.ok(Array.isArray(entry.representativeQueries));
    assert.ok(entry.representativeQueries.length >= 2 && entry.representativeQueries.length <= 5);
  }
});

test('Commerce: ACP, AP2, UCP, x402, and MPP openapi.json discovery documents are valid', async () => {
  const acp = JSON.parse(await fs.readFile('dist/.well-known/acp.json', 'utf8'));
  assert.equal(acp.protocol.name, 'acp');
  assert.equal(acp.api_base_url, 'https://vowvel.com/api');
  assert.ok(acp.capabilities.services.includes('checkout'));

  const ap2 = JSON.parse(await fs.readFile('dist/.well-known/ap2.json', 'utf8'));
  assert.equal(ap2.protocol.name, 'ap2');
  assert.ok(ap2.endpoints.checkout);

  const ucp = JSON.parse(await fs.readFile('dist/.well-known/ucp', 'utf8'));
  assert.equal(ucp.protocol_version, '1.0.0');
  assert.ok(ucp.services.includes('checkout'));
  assert.ok(ucp.endpoints.catalog);

  const x402 = JSON.parse(await fs.readFile('dist/.well-known/x402.json', 'utf8'));
  assert.equal(x402.protocol, 'x402');
  assert.ok(x402.facilitator);

  const openapi = JSON.parse(await fs.readFile('dist/openapi.json', 'utf8'));
  assert.equal(openapi.openapi, '3.1.0');
  assert.ok(openapi['x-service-info']);
  assert.ok(openapi['x-service-info'].categories.includes('weddings'));
  const checkoutOp = openapi.paths['/api/orders'].post;
  assert.ok(checkoutOp['x-payment-info'], 'Missing x-payment-info on /api/orders');
  assert.equal(checkoutOp['x-payment-info'].intent, 'charge');
  assert.equal(checkoutOp['x-payment-info'].amount, 249900);
  assert.equal(checkoutOp['x-payment-info'].currency, 'INR');
});

test('Worker: Markdown Content Negotiation returns markdown with x-markdown-tokens', async () => {
  const req = new Request('https://vowvel.com/', {
    headers: { 'accept': 'text/markdown, text/html;q=0.9' }
  });
  const dummyEnv = {
    ENVIRONMENT: 'test',
    DB: { prepare: () => ({ run: async () => ({}), bind: () => ({ run: async () => ({}) }) }) },
    ASSETS: { fetch: async () => new Response('<html><body>Fallback</body></html>', { headers: { 'content-type': 'text/html' } }) }
  };
  const ctx = { waitUntil: () => {} };

  const res = await worker.fetch(req, dummyEnv, ctx);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('content-type')?.includes('text/markdown'));
  assert.ok(res.headers.get('x-markdown-tokens'));
  assert.ok(res.headers.get('link')?.includes('api-catalog'));
  const body = await res.text();
  assert.ok(body.includes('# Vowvel'));
  assert.ok(body.includes('Conservatory'));
});

test('Worker: API health, MCP, and A2A endpoints return machine-readable responses', async () => {
  const dummyEnv = {
    ENVIRONMENT: 'test',
    DB: { prepare: () => ({ run: async () => ({}), bind: () => ({ run: async () => ({}) }) }) },
    ASSETS: { fetch: async () => new Response('') }
  };
  const ctx = { waitUntil: () => {} };

  const healthRes = await worker.fetch(new Request('https://vowvel.com/api/health'), dummyEnv, ctx);
  assert.equal(healthRes.status, 200);
  const healthJson = await healthRes.json();
  assert.equal(healthJson.ok, true);

  const mcpOptions = await worker.fetch(new Request('https://vowvel.com/api/mcp', { method: 'OPTIONS' }), dummyEnv, ctx);
  assert.equal(mcpOptions.status, 204);

  const mcpRes = await worker.fetch(new Request('https://vowvel.com/api/mcp'), dummyEnv, ctx);
  assert.equal(mcpRes.status, 200);
  const mcpJson = await mcpRes.json();
  assert.equal(mcpJson.jsonrpc, '2.0');

  const a2aRes = await worker.fetch(new Request('https://vowvel.com/api/agent/a2a'), dummyEnv, ctx);
  assert.equal(a2aRes.status, 200);
  const a2aJson = await a2aRes.json();
  assert.equal(a2aJson.protocol, 'a2a');
});

test('index.html contains Google Analytics tag, agent discovery links, and WebMCP script', async () => {
  const html = await fs.readFile('dist/index.html', 'utf8');
  assert.ok(html.includes('gtag/js?id=G-7NGG7740CQ'));
  assert.ok(html.includes("gtag('config', 'G-7NGG7740CQ')"));
  assert.ok(html.includes('rel="api-catalog"'));
  assert.ok(html.includes('rel="ai-catalog"'));
  assert.ok(html.includes('navigator.modelContext.registerTool'));
  assert.ok(html.includes('browse_invitations'));
});

test('Favicons, Google SERP icons, and web manifest exist and are properly linked', async () => {
  const html = await fs.readFile('dist/index.html', 'utf8');
  assert.ok(html.includes('href="/favicon.svg"'));
  assert.ok(html.includes('href="/favicon-48x48.png"'));
  assert.ok(html.includes('href="/favicon.ico"'));
  assert.ok(html.includes('href="/apple-touch-icon.png"'));
  assert.ok(html.includes('href="/site.webmanifest"'));

  const serpIcon = await fs.readFile('dist/favicon-48x48.png');
  assert.ok(serpIcon.length > 0);

  const ico = await fs.readFile('dist/favicon.ico');
  assert.ok(ico.length > 0);

  const appleTouch = await fs.readFile('dist/apple-touch-icon.png');
  assert.ok(appleTouch.length > 0);

  const manifest = JSON.parse(await fs.readFile('dist/site.webmanifest', 'utf8'));
  assert.equal(manifest.name, 'Vowvel');
  assert.ok(manifest.icons.some(i => i.sizes === '48x48'));
});

