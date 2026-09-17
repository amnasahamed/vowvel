# Vowvel auth.md

Instructions for autonomous AI agents, machine actors, and automated integration tools interacting with Vowvel services.

## Audience

This guide is for autonomous AI assistants, shopping agents, and agent-to-agent clients seeking programmatic access to Vowvel APIs, bespoke invitation creation, quote calculation, and guest RSVP management.

## Authentication Overview

Vowvel supports multiple authentication paradigms for human and machine actors:

1. **Anonymous / Public Access**: Browse catalog, calculate pricing quotes, preview themes, and submit guest RSVPs without authentication.
2. **Agent Bearer Tokens**: Scoped access tokens issued for machine-to-machine tasks.
3. **Identity Assertions**: Verifiable agent credentials, OIDC tokens, and ID-JAG assertions.
4. **Email OTP**: One-time code verification for administrative, finance, and partner accounts.

## Metadata & Discovery

- **OAuth Protected Resource Metadata**: `https://vowvel.com/.well-known/oauth-protected-resource`
- **OAuth Authorization Server Metadata**: `https://vowvel.com/.well-known/oauth-authorization-server`
- **OpenID Configuration**: `https://vowvel.com/.well-known/openid-configuration`
- **API Catalog**: `https://vowvel.com/.well-known/api-catalog`
- **MCP Server Card**: `https://vowvel.com/.well-known/mcp/server-card.json`

## Agent Registration

Agents can register or provision access via the registration endpoint:

- **Registration Endpoint**: `POST https://vowvel.com/api/auth/agent/register`
- **Content-Type**: `application/json`

### Supported Identity Types
- `anonymous`: Ephemeral agent sessions using temporary bearer tokens.
- `identity_assertion`: Assertion-based identity using `verified_email` or `urn:ietf:params:oauth:token-type:id-jag`.

### Supported Scopes
- `invitations:read`: Read invitation themes, public layouts, and preview assets.
- `invitations:write`: Create or modify draft wedding and engagement invitations.
- `orders:read`: Query order statuses and receipts.
- `orders:create`: Initiate checkout and quote calculation.
- `rsvp:write`: Submit guest attendance and dietary requirements.

## Credential Usage & Revocation

- Supply your access token in HTTP requests via standard Bearer authorization:
  ```http
  Authorization: Bearer <token>
  ```
- To revoke an active machine session or credential:
  ```http
  POST https://vowvel.com/api/auth/token/revoke
  Content-Type: application/json

  {"token": "<token>"}
  ```
