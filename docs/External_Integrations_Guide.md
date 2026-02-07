# External Enterprise Integrations Guide

**Version:** 1.0  
**Created:** February 3, 2026  
**Sprint:** 7 - Enterprise Finalization  
**Owner:** Multiple Departments

---

## Overview

This guide provides activation steps for external enterprise services. All configurations are documented in Sprint 6; this document provides the final activation checklist.

---

## 1. Cloudflare WAF Activation

**Owner:** Security Team  
**Reference:** `docs/Cloudflare_WAF_Setup.md`

### Activation Steps

1. **Create Cloudflare Account**
   - Go to https://dash.cloudflare.com/sign-up
   - Select Pro or Business plan
   - Estimated cost: $20-200/month

2. **Add Domain**
   ```
   Domain: luvrix.com
   Plan: Pro (recommended)
   ```

3. **Update DNS Records**
   - Log into domain registrar
   - Change nameservers to Cloudflare
   - Wait for propagation (up to 24h)

4. **Enable WAF**
   - Navigate to Security > WAF
   - Enable Cloudflare Managed Ruleset
   - Enable OWASP Core Ruleset

5. **Verify**
   - Check SSL/TLS is Full (strict)
   - Test site accessibility
   - Monitor Security Events

### Environment Variables
```env
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ZONE_ID=your-zone-id
```

### Status: 📋 READY FOR ACTIVATION

---

## 2. PagerDuty On-Call Setup

**Owner:** Operations Team  
**Reference:** `docs/Operations_Report.md`

### Activation Steps

1. **Create PagerDuty Account**
   - Go to https://www.pagerduty.com/sign-up
   - Select appropriate plan (Free tier available)

2. **Create Service**
   ```
   Service Name: Luvrix Production
   Integration: Events API v2
   Escalation Policy: Default
   ```

3. **Configure Escalation Policy**
   | Level | Timeout | Contact |
   |-------|---------|---------|
   | 1 | 5 min | On-call engineer |
   | 2 | 10 min | Engineering lead |
   | 3 | 15 min | CTO |

4. **Get Integration Key**
   - Go to Service > Integrations
   - Add Events API v2
   - Copy Routing Key

5. **Add to Environment**
   ```env
   PAGERDUTY_ROUTING_KEY=your-routing-key
   PAGERDUTY_SERVICE_ID=your-service-id
   ```

6. **Test Integration**
   - Send test alert
   - Verify notification received
   - Acknowledge and resolve

### Status: 📋 READY FOR ACTIVATION

---

## 3. Freshdesk Ticketing Integration

**Owner:** Customer Support Team  
**Reference:** `docs/Support_Ticketing_Setup.md`

### Activation Steps

1. **Create Freshdesk Account**
   - Go to https://freshdesk.com/signup
   - Use subdomain: `luvrix.freshdesk.com`

2. **Configure Support Email**
   - Add support email: support@luvrix.com
   - Configure email forwarding

3. **Get API Credentials**
   - Go to Profile Settings > View API Key
   - Copy API key

4. **Add to Environment**
   ```env
   FRESHDESK_DOMAIN=luvrix.freshdesk.com
   FRESHDESK_API_KEY=your-api-key
   ```

5. **Create Ticket Categories**
   - Account Issues (High priority)
   - Bug Reports (Medium priority)
   - Feature Requests (Low priority)
   - General Inquiry (Low priority)

6. **Set Up SLAs**
   - First response: 4 hours
   - Resolution: 48 hours

### Status: 📋 READY FOR ACTIVATION

---

## 4. Vercel Staging Environment

**Owner:** DevOps / PM Team  
**Reference:** `docs/Release_Process.md`

### Activation Steps

1. **Configure Preview Branch**
   - Go to Vercel Project Settings
   - Navigate to Git
   - Add `develop` as production branch for staging

2. **Set Up Staging Domain**
   - Add custom domain: `staging.luvrix.com`
   - Or use Vercel preview URL

3. **Configure Environment Variables**
   - Create staging-specific variables
   - Set `NEXT_PUBLIC_ENV=staging`

4. **Test Deployment**
   - Push to develop branch
   - Verify staging deployment
   - Test all features

### Environment Variables (Staging)
```env
NEXT_PUBLIC_ENV=staging
MONGODB_URI=mongodb+srv://staging-db/...
SENTRY_ENVIRONMENT=staging
```

### Status: 📋 READY FOR ACTIVATION

---

## 5. Datadog/Grafana Monitoring (Optional)

**Owner:** DevOps Team  
**Reference:** `docs/DevOps_Report.md`

### Activation Steps

1. **Create Datadog Account** (or Grafana Cloud)
   - Go to https://www.datadoghq.com
   - Select appropriate plan

2. **Install Agent/Integration**
   - For Vercel: Use Datadog integration
   - Configure log forwarding

3. **Create Dashboard**
   - Import metrics from `/api/metrics`
   - Set up alert rules

4. **Add to Environment**
   ```env
   DATADOG_API_KEY=your-api-key
   DATADOG_APP_KEY=your-app-key
   ```

### Status: 📋 OPTIONAL - POST-LAUNCH

---

## 6. Sprint 9 Internal Systems (Implemented)

**Owner:** Engineering / Architecture  
**Status:** ✅ IMPLEMENTED

The following internal enterprise systems were built in Sprint 9:

| System | File | Status |
|--------|------|--------|
| Audit Logging (SOC2) | `lib/auditLog.js` | ✅ Live |
| RBAC (Admin/Editor/User/Guest) | `lib/rbac.js` | ✅ Live |
| Compliance Automation (GDPR/CCPA) | `lib/compliance.js` | ✅ Live |
| Advanced Monitoring (SLA) | `lib/advancedMonitoring.js` | ✅ Live |
| Background Job Queue (BullMQ) | `lib/jobQueue.js` | ✅ Live |
| Data Export API | `pages/api/user/export-data.js` | ✅ Live |
| Account Deletion API | `pages/api/user/delete-account.js` | ✅ Live |
| Audit Logs API | `pages/api/admin/audit-logs.js` | ✅ Live |
| Dashboard Metrics API | `pages/api/admin/dashboard-metrics.js` | ✅ Live |
| Job Queue API | `pages/api/admin/job-queue.js` | ✅ Live |

### No External Activation Required
These systems are code-level implementations deployed with the application.

---

## Integration Priority Matrix

| Integration | Priority | Impact | Effort |
|-------------|----------|--------|--------|
| Cloudflare WAF | P0 | Security | Medium |
| Vercel Staging | P0 | Release safety | Low |
| PagerDuty | P1 | Operations | Low |
| Freshdesk | P1 | Support | Medium |
| Datadog | P2 | Monitoring | Medium |

---

## Post-Activation Verification

### Cloudflare
- [ ] DNS propagation complete
- [ ] WAF rules active
- [ ] SSL/TLS working
- [ ] No blocked legitimate traffic

### PagerDuty
- [ ] Test alert received
- [ ] Escalation tested
- [ ] Mobile app configured
- [ ] On-call schedule set

### Freshdesk
- [ ] Test ticket created
- [ ] Email integration working
- [ ] SLA timers active
- [ ] Agent accounts created

### Staging
- [ ] Deployment successful
- [ ] Environment variables set
- [ ] Database connection working
- [ ] All features functional

---

## Budget Summary

| Service | Monthly Cost | Annual Cost |
|---------|--------------|-------------|
| Cloudflare Pro | $20 | $240 |
| PagerDuty | $0-21 | $0-252 |
| Freshdesk Growth | $15/agent | $180/agent |
| Vercel Pro | $20 | $240 |
| **Total** | **$55-76+** | **$660-912+** |

---

## Timeline

| Week | Action |
|------|--------|
| Week 1 | Cloudflare + Staging activation |
| Week 2 | PagerDuty + Freshdesk setup |
| Week 3 | Testing and verification |
| Week 4 | Team training and handoff |

---

*Document Version: 1.0*  
*Last Updated: February 3, 2026*
