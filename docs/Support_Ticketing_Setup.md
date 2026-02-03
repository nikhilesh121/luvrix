# Support Ticketing System Setup Guide

**Version:** 1.0  
**Created:** February 3, 2026  
**Sprint:** 6 - Enterprise Ops & Compliance  
**Owner:** Customer Support Team

---

## 1. Overview

This document outlines the support ticketing system integration for enterprise-level customer support operations.

---

## 2. Recommended Platforms

| Platform | Tier | Monthly Cost | Features |
|----------|------|--------------|----------|
| **Freshdesk** | Free/Growth | $0-15/agent | Email, knowledge base, automation |
| **Zendesk** | Suite Team | $55/agent | Multi-channel, analytics |
| **Jira Service Desk** | Free/Standard | $0-20/agent | Dev integration, SLA |
| **Intercom** | Start | $74/mo | Chat, bots, product tours |

**Recommendation:** Freshdesk Growth tier for cost-effectiveness

---

## 3. Freshdesk Integration

### 3.1 Account Setup

1. Create account at https://freshdesk.com
2. Configure subdomain: `luvrix.freshdesk.com`
3. Set up admin and agent accounts

### 3.2 API Configuration

```env
# Add to .env.local
FRESHDESK_DOMAIN=luvrix.freshdesk.com
FRESHDESK_API_KEY=your-api-key
FRESHDESK_EMAIL=support@luvrix.com
```

### 3.3 Ticket Categories

| Category | Priority | SLA Response | SLA Resolution |
|----------|----------|--------------|----------------|
| Account Issues | High | 2 hours | 24 hours |
| Bug Reports | Medium | 4 hours | 72 hours |
| Feature Requests | Low | 24 hours | N/A |
| General Inquiry | Low | 8 hours | 48 hours |
| Security Issue | Urgent | 1 hour | 4 hours |

---

## 4. API Integration

### 4.1 Create Ticket Endpoint

```javascript
// pages/api/support/ticket.js
import { withRateLimit } from '../../../lib/rateLimit';
import { withCSRFProtection } from '../../../lib/csrf';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, subject, description, category, priority } = req.body;

  // Validate input
  if (!email || !subject || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Create ticket in Freshdesk
    const response = await fetch(
      `https://${process.env.FRESHDESK_DOMAIN}/api/v2/tickets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(
            `${process.env.FRESHDESK_API_KEY}:X`
          ).toString('base64')}`,
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          description,
          type: category || 'Question',
          priority: priority || 1,
          status: 2, // Open
          source: 2, // Portal
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create ticket');
    }

    const ticket = await response.json();

    return res.status(201).json({
      success: true,
      ticketId: ticket.id,
      message: 'Support ticket created successfully',
    });
  } catch (error) {
    console.error('Ticket creation error:', error);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
}

export default withRateLimit(withCSRFProtection(handler), 'contact');
```

---

## 5. Escalation Workflow

### 5.1 Escalation Tiers

| Tier | Role | Response Time | Access |
|------|------|---------------|--------|
| L1 | Support Agent | 2-8 hours | Basic issues |
| L2 | Senior Support | 1-4 hours | Technical issues |
| L3 | Engineering | 1-2 hours | Bugs, critical issues |
| L4 | Management | 30 min | Security, legal |

### 5.2 Escalation Triggers

| Condition | Action |
|-----------|--------|
| No response in SLA time | Auto-escalate to L2 |
| Customer requests escalation | Manual escalate |
| Security keyword detected | Auto-escalate to L4 |
| VIP customer | Priority flag + L2 |

### 5.3 PagerDuty Integration

```javascript
// Escalate critical tickets to PagerDuty
const triggerPagerDuty = async (ticketId, severity, summary) => {
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      dedup_key: `ticket-${ticketId}`,
      payload: {
        summary,
        severity,
        source: 'luvrix-support',
        custom_details: { ticketId },
      },
    }),
  });
};
```

---

## 6. SLA Definitions

### 6.1 Response Time SLAs

| Priority | First Response | Resolution Target |
|----------|----------------|-------------------|
| Urgent | 1 hour | 4 hours |
| High | 2 hours | 24 hours |
| Medium | 4 hours | 72 hours |
| Low | 8 hours | 1 week |

### 6.2 SLA Monitoring

- Track SLA compliance in Freshdesk dashboard
- Weekly SLA report to management
- Alert on SLA breach risk

---

## 7. Knowledge Base

### 7.1 Article Categories

- Getting Started
- Account & Profile
- Reading & Library
- Troubleshooting
- Billing & Subscriptions
- Privacy & Security

### 7.2 Initial Articles to Create

1. How to create an account
2. How to reset your password
3. Managing your reading library
4. Privacy settings explained
5. Contact support guide
6. FAQ compilation

---

## 8. Implementation Checklist

- [ ] Freshdesk account created
- [ ] API keys configured
- [ ] Ticket categories set up
- [ ] SLA policies defined
- [ ] Escalation workflow configured
- [ ] API endpoint created
- [ ] Contact form updated
- [ ] PagerDuty integration (optional)
- [ ] Knowledge base started
- [ ] Team training completed

---

## 9. Metrics to Track

| Metric | Target | Frequency |
|--------|--------|-----------|
| First Response Time | < 4 hours | Daily |
| Resolution Time | < 48 hours | Daily |
| CSAT Score | > 4.0/5.0 | Weekly |
| Ticket Volume | N/A | Weekly |
| SLA Compliance | > 95% | Weekly |

---

*Document Version: 1.0*  
*Last Updated: February 3, 2026*
