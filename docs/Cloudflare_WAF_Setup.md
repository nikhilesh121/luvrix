# Cloudflare WAF Setup Guide

**Version:** 1.0  
**Created:** February 3, 2026  
**Sprint:** 6 - Enterprise Ops & Compliance  
**Owner:** Security Team

---

## 1. Overview

This document outlines the Cloudflare WAF (Web Application Firewall) configuration for enterprise-level security protection.

---

## 2. Cloudflare Setup Steps

### 2.1 Account Setup

1. Create Cloudflare account at https://dash.cloudflare.com
2. Select Pro or Business plan for WAF features
3. Add domain and configure DNS

### 2.2 DNS Configuration

```
Type    Name    Content              Proxy Status
A       @       <vercel-ip>          Proxied (Orange cloud)
CNAME   www     cname.vercel-dns.com Proxied (Orange cloud)
```

### 2.3 SSL/TLS Settings

| Setting | Value |
|---------|-------|
| SSL Mode | Full (strict) |
| Always Use HTTPS | On |
| HSTS | Enabled |
| Min TLS Version | 1.2 |

---

## 3. WAF Rules Configuration

### 3.1 Managed Rulesets (Enable)

| Ruleset | Status | Notes |
|---------|--------|-------|
| Cloudflare Managed Ruleset | ✅ Enabled | Core protection |
| OWASP Core Ruleset | ✅ Enabled | Industry standard |
| Cloudflare Exposed Credentials Check | ✅ Enabled | Breach detection |
| Cloudflare Free Managed Ruleset | ✅ Enabled | Basic protection |

### 3.2 Custom WAF Rules

#### Rule 1: Block Known Bad Bots
```
Expression: (cf.client.bot) and not (cf.bot_management.verified_bot)
Action: Block
```

#### Rule 2: Rate Limit Login Attempts
```
Expression: (http.request.uri.path eq "/api/auth/login")
Action: Rate Limit (10 requests per minute)
```

#### Rule 3: Block SQL Injection Attempts
```
Expression: (http.request.uri.query contains "UNION SELECT" or 
             http.request.uri.query contains "1=1" or
             http.request.uri.query contains "DROP TABLE")
Action: Block
```

#### Rule 4: Block XSS Attempts
```
Expression: (http.request.uri.query contains "<script" or 
             http.request.uri.query contains "javascript:")
Action: Block
```

#### Rule 5: Geographic Restrictions (Optional)
```
Expression: (ip.geoip.country in {"RU" "CN" "KP"})
Action: Challenge
```

---

## 4. Bot Management

### 4.1 Bot Fight Mode
- **Status:** Enabled
- **Challenge:** JavaScript challenges for suspected bots

### 4.2 Super Bot Fight Mode (Business+)
- Block AI scrapers
- Block known botnets
- Allow verified bots (Google, Bing)

---

## 5. DDoS Protection

### 5.1 Automatic DDoS Mitigation
- **HTTP DDoS:** Enabled (automatic)
- **L3/L4 DDoS:** Enabled (automatic)
- **Sensitivity:** High

### 5.2 Rate Limiting Rules

| Endpoint | Limit | Window | Action |
|----------|-------|--------|--------|
| /api/auth/* | 10 req | 1 min | Block |
| /api/blogs | 100 req | 1 min | Challenge |
| /api/manga | 100 req | 1 min | Challenge |
| /api/contact | 5 req | 1 hour | Block |

---

## 6. Security Headers

Cloudflare adds these headers (configured in Transform Rules):

| Header | Value |
|--------|-------|
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

---

## 7. Page Rules

### 7.1 API Caching
```
URL: *luvrix.com/api/*
Settings:
  - Cache Level: Bypass
  - Browser Cache TTL: Respect Existing Headers
```

### 7.2 Static Asset Caching
```
URL: *luvrix.com/_next/static/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
```

---

## 8. Monitoring & Alerts

### 8.1 Security Events Dashboard
- Monitor blocked requests
- Review threat intelligence
- Track attack patterns

### 8.2 Notifications
- Email alerts for DDoS attacks
- Webhook to Slack for WAF blocks
- PagerDuty integration for critical events

---

## 9. Environment Variables

Add to Vercel environment:

```env
CLOUDFLARE_API_TOKEN=<your-api-token>
CLOUDFLARE_ZONE_ID=<your-zone-id>
CLOUDFLARE_ACCOUNT_ID=<your-account-id>
```

---

## 10. Verification Checklist

- [ ] Cloudflare account activated
- [ ] Domain DNS configured
- [ ] SSL/TLS set to Full (strict)
- [ ] Managed WAF rulesets enabled
- [ ] Custom rules configured
- [ ] Bot Fight Mode enabled
- [ ] DDoS protection verified
- [ ] Rate limiting active
- [ ] Monitoring dashboard reviewed
- [ ] Alert notifications configured

---

## 11. Rollback Procedure

If WAF causes issues:

1. Go to Security > WAF
2. Toggle "Off" for problematic ruleset
3. Review Security Events for false positives
4. Adjust sensitivity or add exceptions
5. Re-enable with modifications

---

*Document Version: 1.0*  
*Last Updated: February 3, 2026*

---

## Sprint 8 – WAF Live Activation Checklist

### Bot Fight Mode Configuration

```
Location: Security > Bots > Bot Fight Mode
Status: ENABLE
```

**Settings:**
- Bot Fight Mode: ON
- JavaScript Detections: Enabled
- Static Resource Protection: Enabled

---

### Firewall Rules for API Protection

#### Rule 1: API Rate Limiting Challenge
```
Name: API Challenge Rule
Expression: (http.request.uri.path contains "/api/")
Action: Managed Challenge
Priority: 1
```

#### Rule 2: Admin Route Protection
```
Name: Admin Protection
Expression: (http.request.uri.path contains "/admin")
Action: Block (unless from allowed IPs)
Priority: 2
```

#### Rule 3: Authentication Endpoint Protection
```
Name: Auth Rate Limit
Expression: (http.request.uri.path contains "/api/auth")
Action: Rate Limit (10 requests/minute)
Priority: 3
```

---

### HTTPS Strict Mode

```
Location: SSL/TLS > Edge Certificates
Settings:
- Always Use HTTPS: ON
- Minimum TLS Version: TLS 1.2
- TLS 1.3: ON
- Automatic HTTPS Rewrites: ON
- HSTS: Enabled (max-age=31536000)
```

---

### Security Headers Configuration

Add via Transform Rules or Workers:

```javascript
// Recommended Security Headers
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
}
```

---

### Activation Verification Checklist

| Step | Action | Status |
|------|--------|--------|
| 1 | Enable Bot Fight Mode | 📋 Ready |
| 2 | Add API challenge rule | 📋 Ready |
| 3 | Add admin protection rule | 📋 Ready |
| 4 | Enable HTTPS strict | 📋 Ready |
| 5 | Configure security headers | 📋 Ready |
| 6 | Test all endpoints | 📋 Pending |
| 7 | Verify no false positives | 📋 Pending |

---

### Post-Activation Monitoring

1. Check Security Events in Cloudflare dashboard
2. Monitor for blocked legitimate traffic
3. Adjust rules if false positives detected
4. Review weekly security reports

---

*Sprint 8 WAF Activation: February 3, 2026*
