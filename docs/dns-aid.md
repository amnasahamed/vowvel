# DNS for AI Discovery (DNS-AID) Setup Guide

This guide documents the DNS-AID (DNS-based Agent Identification and Discovery) records to configure in the Cloudflare DNS dashboard for `vowvel.com`.

## Overview

[DNS-AID](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/) uses DNS `SVCB` (Service Binding) or `HTTPS` records under the reserved `_agents` namespace to enable zero-configuration, decentralized agent discovery.

## Required DNS Records

Add the following DNS records in the Cloudflare Dashboard under **DNS -> Records** for `vowvel.com`:

### 1. A2A Agent Interface
- **Type**: `HTTPS` (or `SVCB`)
- **Name**: `_a2a._agents`
- **Target**: `vowvel.com`
- **Priority**: `1`
- **Value / Parameters**: `alpn="a2a,h2,http/1.1" port=443 mandatory=alpn,port`

### 2. General Agent Index / ARD Catalog
- **Type**: `HTTPS` (or `SVCB`)
- **Name**: `_index._agents`
- **Target**: `vowvel.com`
- **Priority**: `1`
- **Value / Parameters**: `alpn="h2,http/1.1" port=443 path="/.well-known/ai-catalog.json"`

### 3. MCP Server Transport
- **Type**: `HTTPS` (or `SVCB`)
- **Name**: `_mcp._agents`
- **Target**: `vowvel.com`
- **Priority**: `1`
- **Value / Parameters**: `alpn="h2,http/1.1" port=443 path="/api/mcp"`

### 4. ARD Manifest TXT Record
- **Type**: `TXT`
- **Name**: `_catalog._agents`
- **Content**: `url=https://vowvel.com/.well-known/ai-catalog.json`

## DNSSEC Requirement

Ensure **DNSSEC** is enabled in the Cloudflare Dashboard (**DNS -> Settings -> Enable DNSSEC**) so validating DNS-over-HTTPS resolvers (like Cloudflare `1.1.1.1` and Google `8.8.8.8`) return cryptographically authenticated `AD=1` answers to AI agent scanners.
