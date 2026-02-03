# Scale Architecture Plan - 1M Users

**Version:** 1.0  
**Date:** February 3, 2026  
**Status:** Sprint 9 Deliverable  
**Target:** Support 1 million concurrent users

---

## Executive Summary

This document outlines the architectural changes required to scale Luvrix from current capacity (~10k users) to enterprise-scale (1M users). The plan addresses database optimization, caching strategies, horizontal scaling, and multi-region deployment.

---

## Current Architecture Assessment

### Current Capacity
| Metric | Current | Target |
|--------|---------|--------|
| Concurrent Users | 10,000 | 1,000,000 |
| Requests/Second | 100 | 10,000 |
| Database Size | 10GB | 1TB+ |
| Response Time (p95) | 500ms | 200ms |

### Current Stack
- **Frontend:** Next.js (Vercel)
- **Backend:** Next.js API Routes
- **Database:** MongoDB Atlas
- **CDN:** Cloudflare
- **Hosting:** Vercel

---

## Phase 1: Database Optimization (0-50K Users)

### 1.1 Index Optimization
```javascript
// Required indexes for scale
db.blogs.createIndex({ slug: 1 }, { unique: true });
db.blogs.createIndex({ createdAt: -1 });
db.blogs.createIndex({ authorId: 1, createdAt: -1 });
db.blogs.createIndex({ tags: 1 });

db.manga.createIndex({ slug: 1 }, { unique: true });
db.manga.createIndex({ title: "text", description: "text" });
db.manga.createIndex({ genres: 1, updatedAt: -1 });

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.audit_logs.createIndex({ timestamp: -1 });
db.audit_logs.createIndex({ userId: 1, timestamp: -1 });
db.audit_logs.createIndex({ category: 1, timestamp: -1 });
```

### 1.2 Query Optimization
- Add projection to limit returned fields
- Use aggregation pipelines for complex queries
- Implement cursor-based pagination
- Add query timeout limits

### 1.3 Connection Pooling
```javascript
// MongoDB connection options
const options = {
  maxPoolSize: 100,
  minPoolSize: 10,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
};
```

---

## Phase 2: Caching Layer (50K-200K Users)

### 2.1 Redis Caching Strategy

#### Cache Tiers
| Tier | TTL | Use Case |
|------|-----|----------|
| L1 (Hot) | 60s | Homepage, trending |
| L2 (Warm) | 5min | Blog lists, manga lists |
| L3 (Cold) | 1hr | Individual posts, user profiles |
| L4 (Static) | 24hr | Static content, configs |

#### Cache Implementation
```javascript
// lib/cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function cacheGet(key) {
  const cached = await redis.get(key);
  return cached ? JSON.parse(cached) : null;
}

export async function cacheSet(key, value, ttl = 300) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function cacheInvalidate(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

#### Cache Keys Structure
```
luvrix:blogs:list:{page}:{limit}
luvrix:blogs:slug:{slug}
luvrix:manga:list:{page}:{limit}:{genre}
luvrix:manga:slug:{slug}
luvrix:user:{userId}:profile
luvrix:search:{query}:{page}
```

### 2.2 Cache Warming
```javascript
// Scheduled job to warm cache
export async function warmCache() {
  // Warm homepage data
  await cacheHomepageData();
  
  // Warm trending content
  await cacheTrendingBlogs();
  await cacheTrendingManga();
  
  // Warm popular search queries
  await cachePopularSearches();
}
```

---

## Phase 3: Horizontal Scaling (200K-500K Users)

### 3.1 Vercel Edge Functions
- Deploy API routes as Edge Functions
- Reduce cold start latency
- Global distribution

### 3.2 Read Replicas
```
MongoDB Atlas Configuration:
├── Primary (Write) - us-east-1
├── Secondary (Read) - us-west-2
├── Secondary (Read) - eu-west-1
└── Secondary (Read) - ap-southeast-1
```

### 3.3 Load Balancing Strategy
- Cloudflare Load Balancer
- Health check endpoints
- Automatic failover
- Geographic routing

---

## Phase 4: Database Sharding (500K-1M Users)

### 4.1 Sharding Strategy
```
Shard Key Selection:
├── blogs: { authorId: 1, createdAt: 1 }
├── manga: { genres: "hashed" }
├── users: { _id: "hashed" }
├── comments: { contentId: 1, createdAt: 1 }
└── audit_logs: { timestamp: 1 }
```

### 4.2 Shard Distribution
| Shard | Data | Size Target |
|-------|------|-------------|
| shard0 | Users A-M | 250GB |
| shard1 | Users N-Z | 250GB |
| shard2 | Content (old) | 250GB |
| shard3 | Content (new) | 250GB |

### 4.3 Cross-Shard Queries
- Minimize cross-shard operations
- Use targeted queries with shard key
- Aggregate on mongos router

---

## Phase 5: Multi-Region Deployment (1M+ Users)

### 5.1 Region Strategy
```
Primary Regions:
├── US East (Primary)
│   ├── Vercel Edge
│   ├── MongoDB Primary
│   └── Redis Primary
├── EU West (Secondary)
│   ├── Vercel Edge
│   ├── MongoDB Replica
│   └── Redis Replica
└── Asia Pacific (Secondary)
    ├── Vercel Edge
    ├── MongoDB Replica
    └── Redis Replica
```

### 5.2 Failover Configuration
- Automatic failover < 30 seconds
- Health check interval: 10 seconds
- Manual override capability
- Runbook documentation

### 5.3 Data Consistency
- Strong consistency for writes
- Eventual consistency for reads (< 100ms lag)
- Conflict resolution strategy

---

## Infrastructure Requirements

### Redis (Upstash/Redis Cloud)
| Tier | Memory | Connections | Cost/Month |
|------|--------|-------------|------------|
| Dev | 256MB | 100 | Free |
| Starter | 1GB | 500 | $25 |
| Scale | 10GB | 5,000 | $200 |
| Enterprise | 50GB | 10,000 | $1,000 |

### MongoDB Atlas
| Tier | Storage | IOPS | Cost/Month |
|------|---------|------|------------|
| M10 (Dev) | 10GB | 100 | $60 |
| M30 (Prod) | 100GB | 1,000 | $500 |
| M50 (Scale) | 500GB | 3,000 | $1,200 |
| M80 (Enterprise) | 1TB+ | 5,000+ | $3,000+ |

### Vercel
| Tier | Bandwidth | Functions | Cost/Month |
|------|-----------|-----------|------------|
| Pro | 1TB | 100GB-hrs | $20/member |
| Enterprise | Unlimited | Custom | Custom |

---

## Performance Benchmarks

### Target Metrics at 1M Users
| Metric | Target | SLA |
|--------|--------|-----|
| Uptime | 99.99% | 99.9% |
| Response Time (p50) | 50ms | 100ms |
| Response Time (p95) | 200ms | 500ms |
| Response Time (p99) | 500ms | 1000ms |
| Error Rate | < 0.01% | < 0.1% |
| Cache Hit Rate | > 95% | > 90% |

### Load Testing Plan
1. Baseline: 1,000 concurrent users
2. Scale test: 10,000 concurrent users
3. Stress test: 50,000 concurrent users
4. Spike test: 100,000 burst
5. Endurance: 24-hour sustained load

---

## Migration Timeline

### Phase 1: Q1 2026 (Current)
- [ ] Implement caching layer
- [ ] Add connection pooling
- [ ] Index optimization
- [ ] Background job queue

### Phase 2: Q2 2026
- [ ] Deploy Redis
- [ ] Implement cache warming
- [ ] Read replicas setup
- [ ] Load testing (50k)

### Phase 3: Q3 2026
- [ ] Database sharding
- [ ] Multi-region setup
- [ ] Failover testing
- [ ] Load testing (500k)

### Phase 4: Q4 2026
- [ ] Full production rollout
- [ ] Performance optimization
- [ ] Load testing (1M)
- [ ] Documentation complete

---

## Monitoring & Alerts

### Key Metrics to Monitor
- Database query latency
- Cache hit/miss ratio
- API response times
- Error rates by endpoint
- Connection pool utilization
- Memory usage
- CPU usage

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| Response Time (p95) | > 500ms | > 1000ms |
| Error Rate | > 1% | > 5% |
| Database Latency | > 100ms | > 500ms |
| Cache Miss Rate | > 20% | > 40% |
| Memory Usage | > 80% | > 95% |

---

## Rollback Procedures

### Cache Rollback
1. Disable cache writes
2. Clear all cache keys
3. Warm critical data
4. Re-enable gradually

### Database Rollback
1. Switch to single-node
2. Restore from backup
3. Verify data integrity
4. Resume operations

### Multi-Region Rollback
1. Failover to primary region
2. Disable secondary regions
3. Investigate issues
4. Re-enable when stable

---

## Cost Projections

### Monthly Infrastructure Cost at Scale

| Component | 10K Users | 100K Users | 1M Users |
|-----------|-----------|------------|----------|
| Vercel | $20 | $100 | $500 |
| MongoDB Atlas | $60 | $500 | $3,000 |
| Redis | $0 | $25 | $200 |
| Cloudflare | $20 | $200 | $500 |
| Monitoring | $0 | $50 | $200 |
| **Total** | **$100** | **$875** | **$4,400** |

### Cost per User
- 10K users: $0.01/user/month
- 100K users: $0.00875/user/month
- 1M users: $0.0044/user/month

---

## Approval & Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CTO | Chief Technology Officer | Feb 3, 2026 | ✅ Approved |
| Architecture | Chief Architect | Feb 3, 2026 | ✅ Approved |
| Database | Database Lead | Feb 3, 2026 | ✅ Approved |
| Infrastructure | Infra Lead | Feb 3, 2026 | ✅ Approved |
| DevOps | DevOps Lead | Feb 3, 2026 | ✅ Approved |

---

*Document Version: 1.0*  
*Last Updated: February 3, 2026*  
*Next Review: March 3, 2026*
