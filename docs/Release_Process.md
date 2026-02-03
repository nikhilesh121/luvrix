# Enterprise Release Process

**Version:** 1.0  
**Created:** February 3, 2026  
**Sprint:** 6 - Enterprise Ops & Compliance  
**Owner:** Project Management / DevOps

---

## 1. Overview

This document defines the release process for enterprise-grade deployments with staging environments, version tagging, and rollback procedures.

---

## 2. Environment Strategy

### 2.1 Environments

| Environment | Purpose | URL | Branch |
|-------------|---------|-----|--------|
| **Development** | Local development | localhost:3000 | feature/* |
| **Staging** | Pre-production testing | staging.luvrix.com | develop |
| **Production** | Live environment | luvrix.com | main |

### 2.2 Vercel Environment Configuration

```json
// vercel.json additions
{
  "env": {
    "ENVIRONMENT": "production"
  },
  "build": {
    "env": {
      "ENVIRONMENT": "production"
    }
  }
}
```

---

## 3. Version Tagging

### 3.1 Semantic Versioning

Format: `vMAJOR.MINOR.PATCH`

| Type | When to Increment | Example |
|------|-------------------|---------|
| MAJOR | Breaking changes | v2.0.0 |
| MINOR | New features | v1.5.0 |
| PATCH | Bug fixes | v1.4.3 |

### 3.2 Tag Creation

```bash
# Create annotated tag
git tag -a v1.5.0 -m "Release v1.5.0 - Sprint 6 Enterprise Features"

# Push tag to remote
git push origin v1.5.0

# List all tags
git tag -l "v*"
```

### 3.3 Release Notes Template

```markdown
## Release v1.5.0 - February 3, 2026

### New Features
- Rate limiting on all API endpoints
- Cookie consent banner
- Privacy and Terms pages

### Improvements
- Multi-region edge deployment
- Structured logging

### Bug Fixes
- Fixed login redirect issue

### Breaking Changes
- None

### Dependencies Updated
- lru-cache: 10.x
- next-intl: 3.x
```

---

## 4. Release Workflow

### 4.1 Pre-Release Checklist

- [ ] All tests passing (`npm test`)
- [ ] No critical security vulnerabilities (`npm audit`)
- [ ] Code review approved
- [ ] Staging deployment successful
- [ ] QA sign-off received
- [ ] Release notes drafted
- [ ] Rollback plan confirmed

### 4.2 Release Process

```
1. Feature Development
   └── feature/* branches
   
2. Code Review
   └── Pull Request to develop
   
3. Staging Deployment
   └── Auto-deploy from develop
   
4. QA Testing
   └── Manual + automated tests
   
5. Release Preparation
   └── Create release branch (release/v1.5.0)
   
6. Final Review
   └── Last checks and approvals
   
7. Production Deployment
   └── Merge to main, create tag
   
8. Post-Release
   └── Monitoring, documentation
```

### 4.3 GitHub Actions Workflow

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          draft: false
          prerelease: false
```

---

## 5. Rollback Procedures

### 5.1 Immediate Rollback (Vercel)

```bash
# Via Vercel CLI
vercel rollback

# Or via Vercel Dashboard:
# 1. Go to Deployments
# 2. Find previous stable deployment
# 3. Click "..." > "Promote to Production"
```

### 5.2 Git Rollback

```bash
# Revert to previous release
git checkout main
git revert HEAD
git push origin main

# Or reset to specific tag
git reset --hard v1.4.3
git push --force origin main  # Use with caution!
```

### 5.3 Rollback Decision Matrix

| Severity | Symptoms | Action | Timeline |
|----------|----------|--------|----------|
| Critical | Site down, data loss | Immediate rollback | 5 min |
| High | Major feature broken | Rollback or hotfix | 30 min |
| Medium | Minor feature broken | Hotfix preferred | 2 hours |
| Low | Cosmetic issues | Fix in next release | Next sprint |

---

## 6. Staging Environment

### 6.1 Vercel Staging Setup

```bash
# Create staging environment in Vercel
# 1. Go to Project Settings > Git
# 2. Add "develop" as preview branch
# 3. Configure staging domain
```

### 6.2 Environment Variables (Staging)

```env
NEXT_PUBLIC_ENV=staging
MONGODB_URI=mongodb+srv://staging-cluster/...
SENTRY_ENVIRONMENT=staging
```

### 6.3 Staging Access

- URL: `staging.luvrix.com` or Vercel preview URL
- Access: Development team + QA
- Data: Separate staging database

---

## 7. Change Management

### 7.1 Change Request Template

| Field | Description |
|-------|-------------|
| Title | Brief change description |
| Type | Feature / Bug fix / Hotfix |
| Priority | Critical / High / Medium / Low |
| Affected Areas | Components/pages affected |
| Testing | Test cases and results |
| Rollback Plan | Steps to revert if needed |
| Approvers | Required sign-offs |

### 7.2 Approval Requirements

| Change Type | Approvals Needed |
|-------------|------------------|
| Hotfix | 1 Senior Dev |
| Bug Fix | 1 Dev + QA |
| Feature | 2 Dev + QA + PM |
| Breaking Change | Team Lead + PM |

---

## 8. Post-Release Monitoring

### 8.1 Immediate (0-15 min)
- [ ] Deployment successful
- [ ] Health check passing
- [ ] No error spikes in Sentry
- [ ] Critical user flows working

### 8.2 Short-term (15 min - 2 hours)
- [ ] Error rate stable
- [ ] Response times normal
- [ ] User reports monitored
- [ ] Analytics tracking

### 8.3 Long-term (24-48 hours)
- [ ] No regression issues
- [ ] Feature adoption metrics
- [ ] User feedback reviewed
- [ ] Documentation updated

---

## 9. Hotfix Process

### 9.1 When to Hotfix

- Critical bug in production
- Security vulnerability
- Data integrity issue

### 9.2 Hotfix Workflow

```
1. Create hotfix branch from main
   └── hotfix/critical-bug-fix
   
2. Implement fix with minimal changes
   
3. Test locally and on staging
   
4. Fast-track code review
   
5. Merge to main AND develop
   
6. Tag with patch version (v1.4.4)
   
7. Deploy and monitor
```

---

## 10. Implementation Checklist

- [ ] Staging environment configured
- [ ] Develop branch created
- [ ] Preview deployments enabled
- [ ] Release workflow documented
- [ ] Rollback procedure tested
- [ ] Version tagging convention adopted
- [ ] Change management process defined
- [ ] Team trained on process

---

*Document Version: 1.0*  
*Last Updated: February 3, 2026*

---

## Sprint 8 – Staging Environment Configuration

### Vercel Project Settings

```
Project: luvrix-webapp
Framework: Next.js
Root Directory: ./

Branch Configuration:
├── main → Production (luvrix.com)
├── develop → Staging (staging.luvrix.com)
└── * → Preview (auto-generated URLs)
```

### Environment Variables by Environment

#### Production (main)
```env
NEXT_PUBLIC_ENV=production
MONGODB_URI=mongodb+srv://prod-cluster/...
NEXT_PUBLIC_BASE_URL=https://luvrix.com
SENTRY_ENVIRONMENT=production
```

#### Staging (develop)
```env
NEXT_PUBLIC_ENV=staging
MONGODB_URI=mongodb+srv://staging-cluster/...
NEXT_PUBLIC_BASE_URL=https://staging.luvrix.com
SENTRY_ENVIRONMENT=staging
```

### Domain Configuration

| Environment | Domain | SSL | CDN |
|-------------|--------|-----|-----|
| Production | luvrix.com | ✅ Auto | ✅ Cloudflare |
| Staging | staging.luvrix.com | ✅ Auto | ✅ Vercel Edge |
| Preview | *.vercel.app | ✅ Auto | ✅ Vercel Edge |

### GitHub Actions Workflow Update

```yaml
# .github/workflows/staging-deploy.yml
name: Staging Deployment

on:
  push:
    branches: [develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npx playwright install --with-deps
      - run: npx playwright test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Staging Activation Checklist

| Step | Action | Status |
|------|--------|--------|
| 1 | Create develop branch | 📋 Ready |
| 2 | Configure Vercel staging domain | 📋 Ready |
| 3 | Set staging env variables | 📋 Ready |
| 4 | Test staging deployment | 📋 Pending |
| 5 | Add GitHub Actions workflow | 📋 Ready |

---

*Sprint 8 Staging Configuration: February 3, 2026*
