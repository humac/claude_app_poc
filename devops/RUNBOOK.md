# KARS Deployment Runbook

This runbook provides step-by-step procedures for deploying and managing KARS (KeyData Asset Registration System) across all environments.

**Project:** ACS - Asset Compliance System  
**Code Name:** KARS  
**Repository:** humac/acs  
**Domain:** kars.keydatalab.ca

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Overview](#environment-overview)
3. [Local Development Deployment](#local-development-deployment)
4. [Staging Deployment (Portainer)](#staging-deployment-portainer)
5. [Production Deployment (Railway)](#production-deployment-railway)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)
8. [Database Operations](#database-operations)
9. [Configuration Management](#configuration-management)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Access
- [ ] GitHub repository access (read/write)
- [ ] GitHub Actions secrets management access
- [ ] Portainer admin access (staging)
- [ ] Railway admin access (production)
- [ ] Cloudflare account access (tunnel/DNS)
- [ ] SMTP credentials (for email notifications)

### Required Tools
- [ ] Git (version control)
- [ ] Node.js 22 LTS (local development)
- [ ] Docker & Docker Compose (local testing)
- [ ] curl or Postman (API testing)

### Required Knowledge
- [ ] Familiarity with GitHub Actions workflows
- [ ] Understanding of Docker containerization
- [ ] Basic PostgreSQL/SQLite administration
- [ ] JWT and environment variable configuration

---

## Environment Overview

### Environment Matrix

| Environment | Branch | Platform | Database | URL | Auto-Deploy |
|-------------|--------|----------|----------|-----|-------------|
| **Development** | kars-dev | Railway | PostgreSQL | kars-dev.keydatalab.ca | Yes (on push) |
| **Production** | kars-prod | Railway | PostgreSQL | kars.keydatalab.ca | Yes (on push) |
| **Local** | feature/* | Local | SQLite | localhost:3000 | No |

### Environment Variables

Each environment requires the following variables (see `.env.example`):

**Required:**
- `JWT_SECRET` - JWT signing key (64+ characters)
- `NODE_ENV` - Environment name (development/staging/production)

**Optional but Recommended:**
- `DB_CLIENT` - Database type (sqlite/postgres)
- `POSTGRES_URL` - PostgreSQL connection string
- `ADMIN_EMAIL` - Auto-promote email to admin role
- `PASSKEY_RP_ID` - WebAuthn relying party ID
- `PASSKEY_RP_NAME` - WebAuthn relying party name
- `PASSKEY_ORIGIN` - WebAuthn origin URL
- `OIDC_*` - OIDC/SSO configuration
- `ACS_MASTER_KEY` - Email encryption key
- `BASE_URL` - Application base URL
- `FRONTEND_URL` - Frontend URL for email links
- `RUN_ATTESTATION_SCHEDULER` - Enable attestation scheduler

---

## Local Development Deployment

### 1. Clone and Setup

```bash
# Clone repository
git clone https://github.com/humac/acs.git
cd acs

# Checkout development branch
git checkout kars-dev

# Install Node.js 22 LTS (if not installed)
nvm install 22
nvm use 22

# Verify Node version
node --version  # Should be v22.x.x
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies (ALWAYS use 'ci' not 'install')
npm ci

# Copy environment template
cp .env.example .env

# Edit .env file and set:
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - ADMIN_EMAIL (optional)

# Start backend in development mode
npm run dev

# Backend will start on http://localhost:3001
```

### 3. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm ci

# Start frontend development server
npm run dev

# Frontend will start on http://localhost:5173 (Vite default)
# Note: Vite proxies /api/* requests to backend at :3001
```

### 4. Verify Local Deployment

```bash
# Test backend health
curl http://localhost:3001/api/health

# Test frontend (open browser)
open http://localhost:5173

# Register first user (becomes admin automatically)
# Navigate to http://localhost:5173 and click "Register"
```

### 5. Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Frontend build verification
npm run build
```

---

## Staging Deployment (Portainer)

### Overview
Staging deploys automatically when changes are pushed to the `develop` branch via GitHub Actions.

### Pre-Deployment Checklist

- [ ] All tests passing on develop branch
- [ ] Code reviewed and approved
- [ ] Environment variables configured in Portainer
- [ ] Portainer webhook configured with `pullImage=true`
- [ ] Cloudflare tunnel active

### Deployment Steps

#### Option 1: Automatic Deployment (Recommended)

```bash
# 1. Merge feature branch to develop
git checkout develop
git pull origin develop
git merge feature/your-feature
git push origin develop

# 2. Monitor GitHub Actions
# Go to: https://github.com/humac/acs/actions
# Watch "Deploy (Staging)" workflow

# 3. Verify build completion
# - Frontend image builds (linux/amd64, linux/arm64)
# - Backend image builds (linux/amd64, linux/arm64)
# - Images pushed to ghcr.io
# - Portainer webhook triggered

# 4. Verify deployment in Portainer
# - Check stack status: Stacks → asset-registration
# - Verify containers running: Containers view
# - Check logs for errors
```

#### Option 2: Manual Deployment

```bash
# 1. Trigger GitHub Actions manually
# Go to: https://github.com/humac/acs/actions
# Click "Deploy (Staging)" → "Run workflow" → Select "develop"

# 2. Or trigger Portainer webhook directly
curl -X POST "$PORTAINER_WEBHOOK_URL"
```

### Portainer Stack Configuration

#### Initial Setup (One-Time)

1. **Create Stack in Portainer**
   - Navigate to: Stacks → Add stack
   - Name: `asset-registration`
   - Build method: Git repository or Web editor

2. **Configure Git Repository** (if using Git method)
   - Repository URL: `https://github.com/humac/acs`
   - Reference: `refs/heads/develop`
   - Compose path: `docker-compose.portainer.yml`

3. **Set Environment Variables**
   ```env
   GITHUB_REPOSITORY=humac/kars
   APP_PORT=8080
   JWT_SECRET=<generate-strong-secret>
   ADMIN_EMAIL=admin@jvhlabs.com
   DB_CLIENT=sqlite
   ```

4. **Create Webhook**
   - In stack settings → Webhooks → Create webhook
   - ✅ Enable "Pull latest image version"
   - Copy webhook URL
   - Add to GitHub Secrets as `PORTAINER_WEBHOOK_URL`

#### Stack Update

```bash
# Update stack with new environment variables
# 1. In Portainer: Stacks → asset-registration → Editor
# 2. Modify environment variables
# 3. Click "Update the stack"
# 4. Enable "Pull and redeploy"
```

### Post-Deployment Verification

```bash
# 1. Check container health
docker ps | grep asset-registration

# 2. Test backend health
curl https://staging.acs.jvhlabs.com/api/health

# 3. Test frontend
curl -I https://staging.acs.jvhlabs.com

# 4. Verify logs
docker logs asset-registration-backend
docker logs asset-registration-frontend

# 5. Test authentication
# - Navigate to staging URL
# - Try login/registration
# - Verify JWT token issuance
```

---

## Production Deployment (Railway)

### Overview
Production deployment uses Railway.app with managed PostgreSQL. Deployment is **automatic** when pushing to the `kars-prod` branch.

**Deployment Schedule:**
- **Day:** Monday
- **Time:** 10:00-11:00 AM EST
- **Process:** Merge kars-dev → kars-prod triggers automatic Railway deployment

### Pre-Deployment Checklist

- [ ] All tests passing on kars-dev branch
- [ ] Development deployment verified and tested (Friday QA)
- [ ] Code reviewed and approved
- [ ] Database migration plan prepared (if applicable)
- [ ] Rollback plan documented
- [ ] Environment variables configured in Railway
- [ ] Stakeholders notified via #kars-releases Teams channel
- [ ] Change window scheduled: Monday 10:00-11:00 AM EST

### Initial Railway Setup

See [railway/SETUP-GUIDE.md](railway/SETUP-GUIDE.md) for detailed first-time setup instructions.

**Quick Overview:**
- Two Railway projects: kars-backend-prod, kars-backend-dev
- Two databases: kars (prod), kars_dev (dev)
- Custom domains: kars.keydatalab.ca, kars-dev.keydatalab.ca
- Automatic deployment on push to kars-prod/kars-dev branches

### Deployment Steps

#### 1. Pre-Deployment Tasks (Monday 9:30 AM EST)

```bash
# Verify kars-dev branch is ready
git checkout kars-dev
git pull origin kars-dev

# Check CI status - all tests must pass
# https://github.com/humac/acs/actions

# Notify in Teams #kars-releases channel
# "🚀 Production deployment starting at 10:00 AM EST"

# Backup production database
railway link kars-backend-prod
railway run pg_dump > backup-pre-deploy-$(date +%Y%m%d).sql

# Verify backup created
ls -lh backup-pre-deploy-*.sql
```

#### 2. Deploy to Production (Monday 10:00 AM EST)

**Option 1: Merge via GitHub (Recommended)**
```bash
# Create PR from kars-dev to kars-prod
gh pr create --base kars-prod --head kars-dev \
  --title "Production Release - $(date +%Y-%m-%d)" \
  --body "Weekly production release after QA validation"

# After approval, merge PR
gh pr merge --merge

# Railway automatically deploys kars-prod branch
```

**Option 2: Direct Push (Emergency Only)**
```bash
# Merge kars-dev to kars-prod
git checkout kars-prod
git pull origin kars-prod
git merge kars-dev
git push origin kars-prod

# Railway automatically builds and deploys
```

**Option 3: Railway CLI**
```bash
railway link kars-backend-prod
railway up --service kars-backend-prod

railway link kars-frontend-prod
railway up --service kars-frontend-prod
```

#### 3. Monitor Deployment (10:05-10:15 AM EST)

```bash
# Watch Railway deployment logs
railway link kars-backend-prod
railway logs --follow

# Monitor deployment status
# Status should change: Building → Deploying → Active

# Watch for errors
railway logs | grep -i "error\|exception\|fatal"
```

#### 4. Database Migration (if required)

```bash
# If schema changes exist:
# 1. Backup database first (see railway/DATABASE.md)
# 2. Railway will auto-run migrations on deploy
# 3. Verify migration success in logs

# Manual verification:
railway run bash
# Inside container:
sqlite3 /app/data/assets.db ".tables"
# Or for PostgreSQL:
psql $DATABASE_URL -c "\dt"
```

### Post-Deployment Verification (10:15-10:30 AM EST)

```bash
# 1. Verify Railway deployment status
railway link kars-backend-prod
railway status

# 2. Check application health
curl https://kars.keydatalab.ca/api/health

# 3. Test critical paths
curl -X POST https://kars.keydatalab.ca/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# 4. Verify database connectivity
railway logs | grep -i "database"

# 5. Test frontend
# - Open https://kars.keydatalab.ca
# - Verify login works
# - Check asset registration
# - Verify audit logs
# - Test admin functions

# 6. Monitor error rates
railway logs --tail=100 | grep -i "error"

# 7. Verify email notifications (if configured)
# - Test password reset
# - Test attestation emails

# 8. Post success message in #kars-releases Teams channel
# "✅ Production deployment complete. All systems operational."
```

### Production Health Checks

```bash
# Automated health checks
# Backend: Every 30 seconds via Railway health check
# Railway: Built-in health check monitoring

# Manual verification
curl https://kars.keydatalab.ca/api/health

# Expected response:
# {"status":"ok","timestamp":"2025-01-05T10:30:00.000Z"}

# Development environment
curl https://kars-dev.keydatalab.ca/api/health
```

---

## Post-Deployment Verification

### Verification Checklist

Use this checklist after any deployment:

#### Backend Verification
- [ ] Health endpoint returns 200 OK
- [ ] Database connection established
- [ ] JWT authentication working
- [ ] API endpoints responding
- [ ] Audit logging functional
- [ ] Error logs clean (no critical errors)

#### Frontend Verification
- [ ] Application loads successfully
- [ ] Login/registration functional
- [ ] Asset CRUD operations work
- [ ] User management accessible (admin)
- [ ] Admin settings accessible (admin)
- [ ] Navigation routing works
- [ ] No console errors in browser

#### Security Verification
- [ ] HTTPS enabled and valid
- [ ] JWT tokens issued correctly
- [ ] RBAC enforcing permissions
- [ ] CORS configured properly
- [ ] Sensitive data not exposed
- [ ] Audit logs capturing events

#### Integration Verification
- [ ] Email notifications sending (if configured)
- [ ] OIDC/SSO working (if configured)
- [ ] MFA/TOTP functional (if enabled)
- [ ] Passkeys/WebAuthn working (if enabled)
- [ ] HubSpot sync functional (if configured)

### Automated Verification Script

```bash
#!/bin/bash
# verify-deployment.sh

BASE_URL="${1:-https://acs.jvhlabs.com}"

echo "Verifying deployment at $BASE_URL..."

# Health check
echo "1. Checking backend health..."
curl -f "$BASE_URL/api/health" || exit 1

# Frontend check
echo "2. Checking frontend..."
curl -f -I "$BASE_URL" || exit 1

# API response check
echo "3. Checking API response..."
curl -f "$BASE_URL/api/companies" || echo "API requires auth (expected)"

echo "✅ Deployment verification complete!"
```

---

## Rollback Procedures

### When to Rollback

Rollback immediately if:
- Critical functionality is broken
- Security vulnerability introduced
- Database corruption detected
- Severe performance degradation
- Data loss occurring

### Production Rollback (Railway)

#### Option 1: Railway One-Click Rollback (Fastest)

```bash
# 1. Navigate to Railway Dashboard
# Project: kars-backend-prod → Deployments
# 2. Find last known good deployment
# 3. Click "..." menu → "Redeploy"
# 4. Confirm deployment
# 5. Monitor logs for successful rollback

# Or via Railway CLI
railway link kars-backend-prod
railway rollback

# Verify rollback
curl https://kars.keydatalab.ca/api/health
```

#### Option 2: Git Revert (Recommended for Tracking)

```bash
# 1. Revert commit on kars-prod branch
git checkout kars-prod
git revert <commit-hash>
git push origin kars-prod

# 2. Railway auto-deploys the revert

# 3. Verify rollback
curl https://kars.keydatalab.ca/api/health

# 4. Post in #kars-incidents Teams channel
# "🔄 Rolled back production to previous version due to [reason]"
```

#### Option 3: Hotfix Forward (For Complex Issues)

```bash
# 1. Create hotfix branch from kars-prod
git checkout kars-prod
git pull origin kars-prod
git checkout -b hotfix/critical-fix

# 2. Apply fix
# Make minimal changes

# 3. Test locally
npm test

# 4. Push and create PR
git push origin hotfix/critical-fix
gh pr create --base kars-prod --head hotfix/critical-fix \
  --title "Hotfix: [Description]" \
  --body "Emergency fix for [issue]"

# 5. After approval, merge to kars-prod
gh pr merge --merge

# 6. Backport to kars-dev
git checkout kars-dev
git merge hotfix/critical-fix
git push origin kars-dev
```

### Database Rollback

```bash
# If database migration caused issues:

# 1. Stop application
railway link kars-backend-prod
railway scale web=0

# 2. Restore database from backup
railway run psql $DATABASE_URL < backup-pre-deploy-YYYYMMDD.sql

# 3. Restart application
railway scale web=1

# 4. Verify data integrity
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 5. Post in #kars-incidents Teams channel
# "✅ Database restored from backup. Service operational."
```

---

## Database Operations

### Backup Procedures

#### SQLite Backup (Portainer/Local)

```bash
# Manual backup
docker run --rm \
  -v asset-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/asset-data-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# Automated daily backup (add to crontab)
0 2 * * * /path/to/backup-script.sh
```

#### PostgreSQL Backup (Railway)

```bash
# Using Railway CLI for production
railway link kars-backend-prod
railway run pg_dump > backup-prod-$(date +%Y%m%d).sql

# Using Railway CLI for development
railway link kars-backend-dev
railway run pg_dump > backup-dev-$(date +%Y%m%d).sql

# Using direct connection
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Automated backup (Railway plugin)
# Railway offers automated daily backups
# Check: Project → PostgreSQL → Backups
```

### Restore Procedures

#### SQLite Restore

```bash
# 1. Stop application
docker-compose down

# 2. Restore volume
docker run --rm \
  -v asset-data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "rm -rf /data/* && tar xzf /backup/asset-data-YYYYMMDD-HHMMSS.tar.gz -C /data"

# 3. Restart application
docker-compose up -d

# 4. Verify data
docker exec -it asset-registration-backend sh
sqlite3 /app/data/assets.db "SELECT COUNT(*) FROM users;"
```

#### PostgreSQL Restore

```bash
# 1. Scale down application
railway link kars-backend-prod
railway scale web=0

# 2. Restore database
psql $DATABASE_URL < backup-YYYYMMDD.sql

# 3. Scale up application
railway scale web=1

# 4. Verify data
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Database Migration

See [railway/SETUP-GUIDE.md](railway/SETUP-GUIDE.md) for detailed migration procedures.

---

## Configuration Management

### Environment Variables

#### Adding New Environment Variables

1. **Add to `.env.example`** (documentation)
   ```bash
   # New feature configuration
   NEW_FEATURE_ENABLED=false
   NEW_FEATURE_API_KEY=your-api-key-here
   ```

2. **Update Backend Code** (if backend variable)
   ```javascript
   // backend/server.js or relevant file
   const NEW_FEATURE_ENABLED = process.env.NEW_FEATURE_ENABLED === 'true';
   ```

3. **Update Portainer Stack**
   - Stacks → asset-registration → Editor
   - Add environment variable
   - Update stack

4. **Update Railway Configuration**
   ```bash
   # Via Railway CLI
   railway variables set NEW_FEATURE_ENABLED=true

   # Or via Railway Dashboard:
   # Project → Variables → Add Variable
   ```

5. **Document in Runbook** (this file)

### Secret Rotation

#### JWT Secret Rotation

```bash
# 1. Generate new secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 2. Update in deployment platform
# Portainer: Stack environment variables
# Railway: railway variables set JWT_SECRET=new-secret

# 3. Restart application (invalidates all existing tokens)
# Users will need to log in again

# 4. Verify new secret is active
# Test login flow
```

#### Database Credential Rotation

```bash
# PostgreSQL (Railway)
# 1. Railway handles automatic credential rotation
# 2. Check: Project → PostgreSQL → Settings

# SQLite
# No credentials to rotate (file-based)
```

#### SMTP Password Rotation

```bash
# 1. Update SMTP password via Admin Settings UI
# 2. Password is automatically encrypted with ACS_MASTER_KEY
# 3. Test email functionality
```

---

## Troubleshooting

### Common Issues

#### Issue: Containers Won't Start

```bash
# Check logs
docker logs asset-registration-backend
docker logs asset-registration-frontend

# Check port conflicts
netstat -tlnp | grep 8080

# Verify environment variables
docker exec asset-registration-backend env | grep JWT_SECRET

# Solution: Fix configuration and restart
docker-compose restart
```

#### Issue: Database Connection Failed

```bash
# SQLite: Check file permissions
docker exec asset-registration-backend ls -la /app/data/

# PostgreSQL: Verify connection string
docker exec asset-registration-backend env | grep POSTGRES_URL

# Test connection
railway run psql $DATABASE_URL -c "SELECT 1;"

# Solution: Check DB_CLIENT and POSTGRES_URL settings
```

#### Issue: GitHub Actions Build Failure

```bash
# Check workflow logs
# Go to: https://github.com/humac/acs/actions

# Common causes:
# - npm audit failures (high/critical vulnerabilities)
# - Test failures
# - Node version mismatch (must be 22 LTS)
# - Build errors

# Solution: Fix issues locally first
npm ci && npm test && npm run build
```

#### Issue: Portainer Webhook Not Triggering

```bash
# Test webhook manually
curl -X POST "$PORTAINER_WEBHOOK_URL"

# Check webhook configuration
# Portainer → Stack → Webhooks
# Ensure "Pull latest image version" is enabled

# Verify GitHub secret
# Settings → Secrets → PORTAINER_WEBHOOK_URL

# Solution: Recreate webhook with pullImage=true
```

#### Issue: Railway Deployment Stuck

```bash
# Check deployment logs
railway logs

# Common causes:
# - Build errors
# - Start command failures
# - Port binding issues
# - Environment variable missing

# Solution: Check logs and fix issues
railway status
railway logs | grep -i error
```

### Debug Mode

#### Enable Verbose Logging (Development)

```bash
# Backend
DEBUG=* npm run dev

# Frontend
VITE_DEBUG=true npm run dev
```

#### Production Logging

```bash
# Railway: View logs
railway logs --tail=100

# Portainer: View container logs
docker logs asset-registration-backend --tail=100 --follow

# Filter errors only
railway logs | grep -i "error"
```

### Performance Issues

```bash
# Check container resource usage
docker stats asset-registration-backend asset-registration-frontend

# Check database size
# SQLite:
docker exec asset-registration-backend ls -lh /app/data/

# PostgreSQL:
railway run psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check slow queries (if using PostgreSQL)
railway run psql $DATABASE_URL -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## Additional Resources

- **Incident Response:** [INCIDENT-RESPONSE.md](INCIDENT-RESPONSE.md)
- **Release Checklist:** [RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md)
- **Railway Setup:** [railway/SETUP-GUIDE.md](railway/SETUP-GUIDE.md)
- **Main README:** [../README.md](../README.md)

---

**Last Updated:** January 2025  
**Maintained By:** DevOps Team  
**Next Review:** Q2 2025  
**Project:** KARS (KeyData Asset Registration System)  
**Repository:** https://github.com/humac/acs
