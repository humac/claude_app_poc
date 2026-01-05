# KARS Weekly Release Checklist

This checklist ensures consistent, safe, and high-quality releases of KARS to production.

**Project:** ACS - Asset Compliance System  
**Code Name:** KARS  
**Repository:** humac/acs  
**Domain:** kars.keydatalab.ca

## Release Overview

- **Frequency:** Weekly
- **QA Day:** Friday (full day testing on kars-dev)
- **Deployment Day:** Monday
- **Time Window:** 10:00 AM - 11:00 AM EST (low-traffic hours)
- **Duration:** ~30 minutes (excluding monitoring)
- **Rollback Window:** Prepared for immediate rollback if issues detected
- **Communication:** Microsoft Teams #kars-releases channel

---

## Pre-Release Phase (Thursday - Friday Morning)

### Code Freeze (Thursday 5:00 PM EST)

- [ ] **Announce Code Freeze**
  - Post in #kars-releases Teams channel: "Code freeze for weekly release active. No merges to `kars-dev` until release complete."
  - Update release notes draft

- [ ] **Verify kars-dev Branch Status**
  ```bash
  git checkout kars-dev
  git pull origin kars-dev
  git log kars-prod..kars-dev --oneline
  ```
  - [ ] Review commits since last release
  - [ ] Confirm all intended features merged
  - [ ] No work-in-progress commits

- [ ] **Check CI/CD Pipeline**
  - [ ] All tests passing on `kars-dev`: https://github.com/humac/acs/actions
  - [ ] Frontend build successful
  - [ ] Backend build successful
  - [ ] No security audit failures (npm audit)
  - [ ] Code coverage meets threshold (>80%)

### Testing Phase (Friday Morning)

- [ ] **Development Environment Verification**
  ```bash
  # Verify development deployment
  curl https://kars-dev.keydatalab.ca/api/health
  ```
  - [ ] Development deployed from latest `kars-dev`
  - [ ] Railway services running healthy
  - [ ] No error spikes in logs

- [ ] **Functional Testing on Development (kars-dev.keydatalab.ca)**
  - [ ] **Authentication**
    - [ ] User registration works
    - [ ] Login with email/password works
    - [ ] JWT token issued and validated
    - [ ] Logout works
  
  - [ ] **Asset Management**
    - [ ] Create new asset
    - [ ] View asset list
    - [ ] Edit asset
    - [ ] Delete asset
    - [ ] Search/filter assets
    - [ ] CSV export works
  
  - [ ] **User Management (Admin)**
    - [ ] View users list
    - [ ] Add new user
    - [ ] Edit user role
    - [ ] Delete user
  
  - [ ] **Company Management (Admin)**
    - [ ] View companies
    - [ ] Add new company
    - [ ] Edit company
    - [ ] Delete company
  
  - [ ] **MFA/Security Features**
    - [ ] MFA enrollment works
    - [ ] TOTP verification works
    - [ ] Passkey registration works
    - [ ] Passkey authentication works
  
  - [ ] **Admin Settings**
    - [ ] OIDC configuration
    - [ ] Email/SMTP settings
    - [ ] Branding customization
    - [ ] Passkey settings
  
  - [ ] **Audit Logging**
    - [ ] Audit logs capturing events
    - [ ] CSV export works
    - [ ] Role-based filtering works

- [ ] **Performance Testing**
  ```bash
  # Test response times on development
  time curl https://kars-dev.keydatalab.ca/api/assets
  time curl https://kars-dev.keydatalab.ca/api/users
  time curl https://kars-dev.keydatalab.ca/api/companies
  ```
  - [ ] API response times < 500ms
  - [ ] Page load times < 3 seconds
  - [ ] No memory leaks in services

- [ ] **Security Scan**
  ```bash
  # Run security audit
  cd backend && npm audit --audit-level=high
  cd frontend && npm audit --audit-level=high
  ```
  - [ ] No high or critical vulnerabilities
  - [ ] Dependencies up to date (or known safe versions)

- [ ] **Database Migration Testing (if applicable)**
  - [ ] Migration scripts tested on kars_dev database
  - [ ] Rollback scripts prepared
  - [ ] Data integrity verified post-migration
  - [ ] Backup taken before migration

- [ ] **Browser Compatibility**
  - [ ] Chrome (latest)
  - [ ] Firefox (latest)
  - [ ] Safari (latest)
  - [ ] Edge (latest)
  - [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Release Preparation (Friday 3:00 PM EST)

- [ ] **Create Release Notes**
  ```bash
  # Review commits
  git log kars-prod..kars-dev --oneline --no-merges
  
  # Create CHANGELOG.md entry
  # Format:
  ## [YYYY-MM-DD] - Monday Deployment
  ### Added
  - Feature A
  - Feature B
  
  ### Changed
  - Updated X
  
  ### Fixed
  - Bug Y
  - Issue Z
  
  ### Security
  - Security improvement W
  ```

- [ ] **Create Pull Request (Optional - for visibility)**
  ```bash
  # Create PR from kars-dev to kars-prod for Monday
  gh pr create --base kars-prod --head kars-dev \
    --title "Production Release - Monday $(date -d 'next monday' +%Y-%m-%d)" \
    --body "Weekly production release after Friday QA validation"
  
  # Mark as draft until Monday
  gh pr ready --undo
  ```

- [ ] **Notify Stakeholders in #kars-releases Teams channel**
  ```
  📢 RELEASE NOTIFICATION
  
  Release Date: Monday, [Date] at 10:00 AM EST
  Duration: ~30 minutes
  Expected Downtime: None (zero-downtime deployment)
  
  Testing Status: ✅ All QA tests passed on kars-dev
  
  Features:
  - [Feature 1]
  - [Feature 2]
  
  Bug Fixes:
  - [Fix 1]
  - [Fix 2]
  
  Please report any issues in #kars-support channel.
  ```

---

## Release Phase (Monday 10:00 AM EST)

### Pre-Deployment Checks (9:45 AM EST)

- [ ] **Verify Production Health**
  ```bash
  curl https://kars.keydatalab.ca/api/health
  railway link kars-backend-prod
  railway status
  ```
  - [ ] Production running stable
  - [ ] No ongoing incidents
  - [ ] Recent error rates normal

- [ ] **Backup Production Database**
  ```bash
  # PostgreSQL backup
  railway link kars-backend-prod
  railway run pg_dump > backup-pre-release-$(date +%Y%m%d-%H%M).sql
  
  # Verify backup
  ls -lh backup-pre-release-*.sql
  ```
  - [ ] Backup created successfully
  - [ ] Backup file size reasonable
  - [ ] Backup stored securely

- [ ] **Review Rollback Plan**
  - [ ] Previous deployment identified in Railway dashboard
  - [ ] Rollback procedure reviewed
  - [ ] Team on standby for monitoring

- [ ] **Post Pre-Flight in #kars-releases Teams channel**
  ```
  ✈️ PRE-FLIGHT CHECK - Monday Deployment
  Time: 9:45 AM EST
  
  ✅ Production health: OK
  ✅ Database backup: Complete
  ✅ Rollback plan: Ready
  ✅ Team: Standing by
  
  Deployment starting at 10:00 AM EST
  ```

### Deployment Execution (10:00 AM EST)

- [ ] **Merge to Production Branch**
  ```bash
  # Option 1: Merge via GitHub PR (Recommended)
  # If PR was created Friday, mark as ready and merge
  gh pr ready  # Mark draft PR as ready
  gh pr merge --merge  # Merge to kars-prod
  
  # Option 2: Direct merge (if no PR)
  git checkout kars-prod
  git pull origin kars-prod
  git merge kars-dev --no-ff -m "Production release - $(date +%Y-%m-%d)"
  git push origin kars-prod
  
  # Railway automatically deploys kars-prod branch
  ```

- [ ] **Monitor Railway Auto-Deployment**
  ```bash
  # Watch Railway deployment
  railway link kars-backend-prod
  railway logs --follow
  
  # Monitor both services
  railway link kars-frontend-prod
  railway logs --follow
  ```
  - [ ] Backend build started
  - [ ] Frontend build started
  - [ ] Both builds completed successfully
  - [ ] Deployments active

- [ ] **Post Deployment Start in #kars-releases Teams channel**
  ```
  🚀 DEPLOYMENT IN PROGRESS
  Time: 10:00 AM EST
  Status: Building and deploying to production
  
  Monitoring: Railway logs
  ETA: 10:15 AM EST
  ```

### Post-Deployment Verification (10:15 AM - 10:30 AM EST)

- [ ] **Verify Deployment Success**
  ```bash
  # Check health
  curl https://kars.keydatalab.ca/api/health
  
  # Check Railway status
  railway link kars-backend-prod
  railway status
  ```

- [ ] **Smoke Tests**
  ```bash
  # Test critical endpoints
  curl -I https://kars.keydatalab.ca
  curl https://kars.keydatalab.ca/api/health
  curl https://kars.keydatalab.ca/api/companies  # Should require auth
  ```
  - [ ] Frontend loads
  - [ ] Backend responds
  - [ ] Database connected

- [ ] **Critical Path Testing**
  - [ ] **Login Flow**
    - [ ] Navigate to https://kars.keydatalab.ca
    - [ ] Login with test account
    - [ ] JWT token received
    - [ ] Dashboard loads
  
  - [ ] **Asset Operations**
    - [ ] View asset list
    - [ ] Create test asset
    - [ ] Edit test asset
    - [ ] Delete test asset
  
  - [ ] **Admin Functions**
    - [ ] Access admin settings
    - [ ] View users list
    - [ ] View companies list
    - [ ] Check audit logs

- [ ] **Performance Check**
  ```bash
  # Response time verification
  time curl https://kars.keydatalab.ca/api/assets
  # Should be < 500ms
  ```

- [ ] **Error Monitoring**
  ```bash
  # Check logs for errors
  railway link kars-backend-prod
  railway logs --tail=500 | grep -i error
  railway logs --tail=500 | grep -i exception
  railway logs --tail=500 | grep -i fatal
  ```
  - [ ] No new error patterns
  - [ ] No critical errors
  - [ ] Error rate normal

- [ ] **Database Integrity**
  ```bash
  # Verify record counts
  railway run psql $DATABASE_URL -c "\
    SELECT 'users' as table, COUNT(*) FROM users \
    UNION ALL \
    SELECT 'assets', COUNT(*) FROM assets \
    UNION ALL \
    SELECT 'companies', COUNT(*) FROM companies;"
  
  # Check recent audit logs
  railway run psql $DATABASE_URL -c "\
    SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5;"
  ```

---

## Post-Release Phase (10:30 AM - 11:30 AM EST)

### Monitoring Period

- [ ] **Active Monitoring (First 30 Minutes)**
  ```bash
  # Continuous log monitoring
  railway link kars-backend-prod
  railway logs --follow | grep -i "error\|exception\|fatal"
  
  # Watch health endpoint
  watch -n 30 'curl -s https://kars.keydatalab.ca/api/health && echo OK'
  ```

- [ ] **User Feedback Monitoring**
  - [ ] Monitor #kars-support Teams channel for issues
  - [ ] Check error reporting system
  - [ ] Review user-reported issues

- [ ] **Metrics Review** (30 minutes post-deploy)
  ```bash
  # Check error rates
  railway logs --since=30m | grep -c error
  
  # Check response times via Railway dashboard
  ```
  - [ ] Error rate stable or decreased
  - [ ] Response times within normal range
  - [ ] No user complaints

### Release Completion

- [ ] **Update Documentation**
  - [ ] Update README.md if needed
  - [ ] Update CHANGELOG.md
  - [ ] Update wiki if major features
  - [ ] Update API documentation if endpoints changed

- [ ] **Create GitHub Release (Optional)**
  - [ ] Go to: https://github.com/humac/acs/releases
  - [ ] Click "Draft a new release"
  - [ ] Tag: Use date format: release-YYYY-MM-DD
  - [ ] Release title: "Production Release - $(date +%Y-%m-%d)"
  - [ ] Copy release notes from CHANGELOG.md
  - [ ] Publish release

- [ ] **Notify Stakeholders - Success in #kars-releases Teams channel**
  ```
  ✅ RELEASE COMPLETE - Monday $(date +%Y-%m-%d)
  
  Status: Successful
  Deployed: Monday at 10:00 AM EST
  Duration: 15 minutes
  Downtime: None (zero-downtime deployment)
  
  New Features:
  - [Feature 1]
  - [Feature 2]
  
  Bug Fixes:
  - [Fix 1]
  - [Fix 2]
  
  Monitoring: All systems normal
  Production: https://kars.keydatalab.ca
  
  Thank you for your patience during the release!
  ```

- [ ] **Lift Code Freeze**
  - Post in #kars-releases Teams channel: "Code freeze lifted. Normal development can resume on kars-dev."

---

## Rollback Procedure (If Needed)

### When to Rollback

Rollback immediately if:
- [ ] Critical functionality broken
- [ ] Data corruption detected
- [ ] Security vulnerability introduced
- [ ] Error rate spike (>5x normal)
- [ ] Performance degradation (>50% slower)
- [ ] Database migration failure

### Rollback Steps

1. **Announce Rollback in #kars-incidents Teams channel**
   ```
   🚨 ROLLBACK INITIATED
   
   Reason: [Brief description]
   Action: Rolling back kars-prod to previous deployment
   ETA: 5-10 minutes
   ```

2. **Execute Rollback**
   ```bash
   # Option 1: Railway One-Click Rollback (Fastest)
   railway link kars-backend-prod
   railway rollback
   
   # Option 2: Git revert
   git checkout kars-prod
   git revert HEAD
   git push origin kars-prod
   # Railway auto-deploys the revert
   
   # Option 3: Railway Dashboard
   # Go to Deployments → Find previous successful → Redeploy
   ```

3. **Rollback Database (if migration failed)**
   ```bash
   # Stop application
   railway link kars-backend-prod
   railway scale web=0
   
   # Restore backup
   railway run psql $DATABASE_URL < backup-pre-release-*.sql
   
   # Restart application
   railway scale web=1
   ```

4. **Verify Rollback**
   ```bash
   curl https://kars.keydatalab.ca/api/health
   railway logs --tail=100
   
   # Test critical paths
   # Verify functionality restored
   ```

5. **Notify Stakeholders in #kars-incidents Teams channel**
   ```
   ✅ ROLLBACK COMPLETE
   
   Status: Service restored
   Rollback: Completed successfully
   Impact: [Duration and scope]
   
   Next Steps:
   - Investigation underway
   - Fix in progress
   - New deployment to be scheduled
   ```

6. **Post-Rollback**
   - [ ] Incident report created
   - [ ] Root cause investigation started
   - [ ] Fix planned for next release
   - [ ] Post-mortem scheduled

---

## Emergency Release Procedure

### For Critical Hotfixes (Outside Regular Schedule)

When a critical bug is discovered in production that requires immediate fix:

1. **Create Hotfix Branch**
   ```bash
   git checkout kars-prod
   git pull origin kars-prod
   git checkout -b hotfix/critical-issue-description
   ```

2. **Apply Fix**
   ```bash
   # Make minimal fix
   # Add test for the fix
   # Verify fix locally
   npm test
   ```

3. **Fast-Track Testing**
   - [ ] Test fix locally
   - [ ] Deploy to kars-dev for quick verification
   - [ ] Test fix specifically
   - [ ] Verify no side effects

4. **Emergency Deployment**
   ```bash
   # Merge to kars-prod
   git checkout kars-prod
   git merge --no-ff hotfix/critical-issue-description
   git push origin kars-prod
   
   # Railway automatically deploys
   
   # Backport to kars-dev
   git checkout kars-dev
   git merge --no-ff hotfix/critical-issue-description
   git push origin kars-dev
   
   # Clean up hotfix branch
   git branch -d hotfix/critical-issue-description
   git push origin --delete hotfix/critical-issue-description
   ```

5. **Accelerated Verification**
   - [ ] Test fix in production
   - [ ] Monitor for 15 minutes
   - [ ] Notify stakeholders in #kars-incidents Teams channel

---

## Release Metrics

### Track After Each Release

```markdown
## Release v1.x.x Metrics

**Deployment:**
- Start Time: YYYY-MM-DD HH:MM:SS EST
- End Time: YYYY-MM-DD HH:MM:SS EST
- Duration: XX minutes
- Downtime: 0 minutes (rolling deployment)

**Testing:**
- Tests Passed: XXX/XXX (100%)
- Code Coverage: XX%
- Security Vulnerabilities: 0 high/critical

**Performance:**
- Build Time: X minutes
- Deployment Time: X minutes
- First Response Time: XXXms
- Error Rate: X.XX%

**Scope:**
- Commits: XX
- Files Changed: XX
- Lines Added: XXX
- Lines Removed: XXX

**Issues:**
- Rollbacks Required: 0
- Post-Deploy Bugs: 0
- User-Reported Issues: 0

**Team:**
- Release Manager: [Name]
- Deployer: [Name]
- Reviewers: [Names]
```

---

## Continuous Improvement

### Post-Release Retrospective

After each release, review:

- [ ] **What went well?**
  - Successful aspects
  - Smooth processes
  - Effective communication

- [ ] **What could be improved?**
  - Pain points
  - Delays encountered
  - Communication gaps

- [ ] **Action items**
  - Process improvements
  - Tool enhancements
  - Documentation updates

- [ ] **Update this checklist**
  - Add new steps as needed
  - Remove obsolete steps
  - Clarify ambiguous steps

---

## Quick Reference

### Key Commands

```bash
# Health check
curl https://kars.keydatalab.ca/api/health

# Deploy to Railway (automatic on push to kars-prod)
git push origin kars-prod

# Manual Railway deployment
railway link kars-backend-prod
railway up

# Rollback
railway rollback

# View logs
railway logs --follow

# Database backup
railway run pg_dump > backup-$(date +%Y%m%d).sql

# Check status
railway status
```

### Key URLs

- **Production:** https://kars.keydatalab.ca
- **Development:** https://kars-dev.keydatalab.ca
- **GitHub Actions:** https://github.com/humac/acs/actions
- **Railway Dashboard:** https://railway.app

### Teams Channels

- **#kars-releases** - Release coordination and announcements
- **#kars-support** - User support
- **#kars-incidents** - Incident response

---

**Last Updated:** January 2025  
**Release Schedule:** Weekly (Monday 10:00 AM EST)  
**Next Review:** Q2 2025  
**Project:** KARS (KeyData Asset Registration System)  
**Repository:** https://github.com/humac/acs
