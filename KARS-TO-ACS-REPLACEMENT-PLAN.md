# ACS to ACS Replacement Plan

**Project**: Replace all references to "ACS" (Asset Compliance System) with "ACS" (Asset Compliance System)

**Total Scope**: 65 files, 121+ references

**Estimated Effort**: 3-4 hours for code changes + 1-2 hours for testing

---

## Executive Summary

This plan replaces all instances of "ACS" across the codebase with "ACS" in a phased approach, prioritizing:
1. **Critical Runtime Code** (database defaults, API responses, email templates)
2. **User-Facing UI** (branding, registration/login screens)
3. **Infrastructure Configuration** (environment files, Docker configs)
4. **Documentation** (README, deployment guides, runbooks)

### Replacement Strategy

| Old Value | New Value | Context |
|-----------|-----------|---------|
| `ACS` | `ACS` | Default site names, UI branding |
| `Asset Compliance System` | `Asset Compliance System` | Full product name |
| `ACS Notifications` | `ACS Notifications` | Email from names |
| `ACS - Asset Compliance System` | `ACS - Asset Compliance System` | Passkey RP names |
| `ACS API is running` | `ACS API is running` | Health check messages |
| `ACS team` | `ACS team` | Documentation references |
| `github.com/humac/acs` | `github.com/humac/acs` | Repository URLs |
| `acs.jvhlabs.com` | *(Keep as-is or update separately)* | Domain names |
| `kars-test-` | `acs-test-` | Test temp directories |
| `/home/user/acs/` | `/home/user/acs/` | File path references |

**Note on Domain Names**: The `acs.jvhlabs.com` domain references (93 instances) are marked as **DEFER** - these require DNS/infrastructure changes and should be handled separately after code deployment.

---

## Phase 1: Critical Runtime Code (Priority: 🔴 HIGHEST)

**Impact**: Affects all users immediately on deployment
**Files**: 8 backend files
**Testing Required**: Full backend test suite + manual API testing

### 1.1 Database Schema Defaults (File: `backend/database.js`)

**References**: 14 instances

| Line(s) | Current Value | New Value | Context |
|---------|---------------|-----------|---------|
| 768, 786 | `'KARS'` | `'ACS'` | DEFAULT site_name in branding_settings table |
| 804, 814 | `'ACS - Asset Compliance System'` | `'ACS - Asset Compliance System'` | DEFAULT rp_name in passkey_settings |
| 884, 900 | `'ACS Notifications'` | `'ACS Notifications'` | DEFAULT from_name in smtp_settings |
| 1369, 1378 | `'KARS'` | `'ACS'` | INSERT site_name initialization (SQLite) |
| 1554 | `'KARS'` | `'ACS'` | INSERT site_name initialization (PostgreSQL) |
| 3104, 3139, 3160 | `'ACS Notifications'` | `'ACS Notifications'` | UPDATE from_name fallback (SQLite) |
| 3178, 3372 | `'ACS Notifications'` | `'ACS Notifications'` | UPDATE from_name fallback (PostgreSQL) |

**Implementation Steps**:
1. Search for all `'KARS'` string literals in database.js
2. Replace DEFAULT values in CREATE TABLE statements
3. Replace INSERT/UPDATE fallback values
4. Verify schema migrations won't break existing databases

**Testing**:
- [ ] Run backend test suite: `npm test`
- [ ] Test fresh database initialization (SQLite)
- [ ] Test fresh database initialization (PostgreSQL)
- [ ] Verify existing databases don't break (upgrade path)
- [ ] Check branding settings API returns correct defaults

**Risk**: 🔴 **HIGH** - Affects all new installations and database migrations

---

### 1.2 Email Templates (File: `backend/services/smtpMailer.js`)

**References**: 11 instances

| Line(s) | Current Value | New Value | Context |
|---------|---------------|-----------|---------|
| 82, 130, 180, 313, 417, 507, 592, 690, 772, 937, 1071 | `'ACS Notifications'` | `'ACS Notifications'` | Default from_name in email functions |

**Email Functions Affected**:
- `sendPasswordResetEmail()`
- `sendAccountActivationEmail()`
- `sendWelcomeEmail()`
- `sendPasswordChangedNotification()`
- `sendMFAEnabledNotification()`
- `sendMFADisabledNotification()`
- `sendAccountDeletionNotification()`
- `sendRoleChangedNotification()`
- `sendAttestationEmail()`
- `sendAttestationReminderEmail()`
- `sendAttestationInviteEmail()`

**Implementation Steps**:
1. Search for `'ACS Notifications'` in smtpMailer.js
2. Replace all default from_name values
3. Test email sending with default and custom from_name

**Testing**:
- [ ] Send test emails for each email type
- [ ] Verify from_name defaults to "ACS Notifications"
- [ ] Verify custom from_name still works (admin override)
- [ ] Check email subject lines don't reference ACS
- [ ] Run email tests: `npm test -- smtpMailer.test.js`

**Risk**: 🟡 **MEDIUM** - Only affects new emails; existing sent emails unchanged

---

### 1.3 API Health Check (File: `backend/server.js`)

**References**: 1 instance

| Line | Current Value | New Value | Context |
|------|---------------|-----------|---------|
| 250 | `"ACS API is running"` | `"ACS API is running"` | Health check endpoint message |

**Implementation Steps**:
1. Update health check message in server.js
2. Test health check endpoint

**Testing**:
- [ ] GET `/api/health` returns "ACS API is running"
- [ ] Health check tests pass

**Risk**: 🟢 **LOW** - Only affects monitoring/debugging messages

---

### 1.4 Admin Routes (File: `backend/routes/admin.js`)

**References**: 3 instances

| Line(s) | Current Value | New Value | Context |
|---------|---------------|-----------|---------|
| 262, 753, 931 | References to ACS in error messages, variable names, defaults | Update to ACS | Error messages and fallback values |

**Implementation Steps**:
1. Review each reference for context
2. Update error messages that mention ACS
3. Update variable names if they use 'kars' prefix

**Testing**:
- [ ] Test admin endpoints
- [ ] Verify error messages display correctly
- [ ] Run admin route tests

**Risk**: 🟢 **LOW** - Only affects error messages

---

### 1.5 Package Metadata (File: `backend/package.json`)

**References**: 2 instances

| Line | Current Value | New Value | Context |
|------|---------------|-----------|---------|
| 4 | `"Backend API for ACS - Asset Compliance System"` | `"Backend API for ACS - Asset Compliance System"` | Description field |
| 24 | `"https://github.com/humac/acs.git"` | `"https://github.com/humac/acs.git"` | Repository URL |

**Implementation Steps**:
1. Update description field
2. Update repository.url field
3. Consider updating name field if needed

**Testing**:
- [ ] Run `npm install` to verify package.json is valid
- [ ] Check package metadata: `npm view . description`

**Risk**: 🟢 **LOW** - Metadata only

---

## Phase 2: User-Facing UI (Priority: 🔴 HIGH)

**Impact**: First impression for users
**Files**: 8 frontend files
**Testing Required**: Full frontend test suite + manual UI testing

### 2.1 Login Component (File: `frontend/src/components/Login.jsx`)

**References**: 1 instance

| Line | Current Value | New Value | Context |
|------|---------------|-----------|---------|
| 38 | `useState('KARS')` | `useState('ACS')` | Default siteName state |

**Implementation Steps**:
1. Update default state value
2. Verify branding API override still works

**Testing**:
- [ ] Load login page, verify "ACS" displays by default
- [ ] Test with custom branding, verify override works
- [ ] Run Login.test.jsx

**Risk**: 🟡 **MEDIUM** - Visible to all unauthenticated users

---

### 2.2 Registration Component (File: `frontend/src/components/Register.jsx`)

**References**: 1 instance

| Line | Current Value | New Value | Context |
|------|---------------|-----------|---------|
| 150 | `ACS` | `ACS` | Hardcoded site name in registration header |

**Implementation Steps**:
1. Replace hardcoded "ACS" with "ACS"
2. Consider fetching from branding API instead of hardcoding

**Testing**:
- [ ] Load registration page, verify "ACS" displays
- [ ] Complete registration flow
- [ ] Run Register.test.jsx

**Risk**: 🟡 **MEDIUM** - Visible to new users registering

---

### 2.3 Admin Settings (File: `frontend/src/components/AdminSettings.jsx`)

**References**: 3 instances

| Line(s) | Current Value | New Value | Context |
|---------|---------------|-----------|---------|
| 43, 94, 424 | `'KARS'` | `'ACS'` | Default siteName state and placeholder text |

**Implementation Steps**:
1. Update default state value for site name
2. Update placeholder text in branding form
3. Test branding update functionality

**Testing**:
- [ ] Open Admin Settings > Branding tab
- [ ] Verify default value is "ACS"
- [ ] Test updating site name
- [ ] Verify changes persist
- [ ] Run AdminSettings.test.jsx

**Risk**: 🟢 **LOW** - Only affects admin users

---

### 2.4 Security Settings (File: `frontend/src/components/SecuritySettings.jsx`)

**References**: 1 instance

| Line | Current Value | New Value | Context |
|------|---------------|-----------|---------|
| 203 | `https://github.com/humac/acs/blob/main/PASSKEY-TROUBLESHOOTING.md` | `https://github.com/humac/acs/blob/main/PASSKEY-TROUBLESHOOTING.md` | Documentation link |

**Implementation Steps**:
1. Update GitHub documentation URL
2. Verify link works after repository rename

**Testing**:
- [ ] Click troubleshooting link in Security Settings
- [ ] Verify it opens correct documentation

**Risk**: 🟢 **LOW** - Only affects users needing passkey help

---

### 2.5 Notification Settings (File: `frontend/src/components/NotificationSettings.jsx`)

**References**: 5 instances

| Line(s) | Current Value | New Value | Context |
|---------|---------------|-----------|---------|
| 26, 58, 228, 334, 389 | `'ACS Notifications'` | `'ACS Notifications'` | Default from_name, KARS_MASTER_KEY references |

**Implementation Steps**:
1. Update default from_name values
2. Update KARS_MASTER_KEY environment variable name references
3. Consider renaming to ACS_MASTER_KEY (breaking change)

**Testing**:
- [ ] Open Notification Settings
- [ ] Verify default from_name is "ACS Notifications"
- [ ] Test updating email settings
- [ ] Verify encryption key still works

**Risk**: 🟡 **MEDIUM** - KARS_MASTER_KEY may be breaking change if renamed

---

### 2.6 Frontend Package Metadata (File: `frontend/package.json`)

**References**: 1 instance

| Line | Current Value | New Value | Context |
|------|---------------|-----------|---------|
| 8 | `"https://github.com/humac/acs.git"` | `"https://github.com/humac/acs.git"` | Repository URL |

**Implementation Steps**:
1. Update repository URL
2. Validate package.json

**Testing**:
- [ ] Run `npm install` to verify package.json is valid

**Risk**: 🟢 **LOW** - Metadata only

---

### 2.7 Shared Constants (File: `frontend/src/lib/constants.js`)

**References**: 1 instance

| Line | Current Value | New Value | Context |
|------|---------------|-----------|---------|
| 2 | `"Shared constants for the ACS application"` | `"Shared constants for the ACS application"` | File comment |

**Implementation Steps**:
1. Update comment to reference ACS

**Testing**:
- [ ] No functional testing needed

**Risk**: 🟢 **LOW** - Comment only

---

## Phase 3: Test Files (Priority: 🟡 MEDIUM)

**Impact**: Test data and fixtures
**Files**: 5 test files
**Testing Required**: Run updated test suites

### 3.1 Backend Test Files

| File | References | Changes Needed |
|------|-----------|----------------|
| `backend/attestation-email.test.js` | 16 | Update test fixtures: `from_name: 'KARS'` → `'ACS'`, `site_name: 'ACS Test'` → `'ACS Test'` |
| `backend/footer-label-migration.test.js` | 1 | Update SQL DEFAULT: `site_name 'KARS'` → `'ACS'` |
| `backend/database-column-validation.test.js` | 1 | Update temp dir: `kars-test-` → `acs-test-` |

**Implementation Steps**:
1. Update all test fixtures to use 'ACS' instead of 'KARS'
2. Update temp directory naming
3. Run full backend test suite

**Testing**:
- [ ] Run: `cd backend && npm test`
- [ ] Verify all tests pass
- [ ] Check test output for any remaining ACS references

**Risk**: 🟢 **LOW** - Only affects tests

---

### 3.2 Frontend Test Files

| File | References | Changes Needed |
|------|-----------|----------------|
| `frontend/src/components/Register.test.jsx` | 4 | Update expectations: `'KARS'` → `'ACS'` |
| `frontend/src/components/Login.test.jsx` | 1 | Update fixture: `site_name: 'KARS'` → `'ACS'` |
| `frontend/src/components/AdminSettings.test.jsx` | 2 | Update expectations: `'KARS'` → `'ACS'` |

**Implementation Steps**:
1. Update all test expectations to match new 'ACS' branding
2. Run full frontend test suite

**Testing**:
- [ ] Run: `cd frontend && npm test`
- [ ] Verify all tests pass
- [ ] Check test output for any remaining ACS references

**Risk**: 🟢 **LOW** - Only affects tests

---

## Phase 4: Infrastructure Configuration (Priority: 🟡 MEDIUM)

**Impact**: Deployment and development environment
**Files**: 5 configuration files
**Testing Required**: Local and CI/CD deployment testing

### 4.1 Environment Configuration Files

| File | Line(s) | Current Value | New Value |
|------|---------|---------------|-----------|
| `.env.example` | 54 | `ALLOWED_ORIGINS=https://kars.example.com` | `ALLOWED_ORIGINS=https://acs.example.com` |
| `.env.portainer.example` | 3 | `GITHUB_REPOSITORY=humac/kars` | `GITHUB_REPOSITORY=humac/acs` |
| `.env.portainer-postgres.example` | 13 | `GITHUB_REPOSITORY=humac/kars` | `GITHUB_REPOSITORY=humac/acs` |

**Implementation Steps**:
1. Update all .env.example files
2. **IMPORTANT**: Update actual .env files on deployment servers
3. Update CI/CD secrets if needed

**Testing**:
- [ ] Verify .env files parse correctly
- [ ] Test Docker builds with updated GITHUB_REPOSITORY
- [ ] Verify container image pulls work

**Risk**: 🔴 **HIGH** - Breaking change for deployments if not coordinated

---

### 4.2 Docker Compose Files

| File | Line(s) | Current Value | New Value |
|------|---------|---------------|-----------|
| `docker-compose.portainer.yml` | 5, 28 | `${GITHUB_REPOSITORY:-your-username/kars}` | `${GITHUB_REPOSITORY:-your-username/acs}` |
| `docker-compose.portainer-postgres.yml` | 27, 58 | Same as above | Same as above |

**Implementation Steps**:
1. Update default GITHUB_REPOSITORY fallback values
2. Test Docker Compose builds
3. Update Portainer stack configurations

**Testing**:
- [ ] Run: `docker-compose -f docker-compose.portainer.yml config`
- [ ] Verify no syntax errors
- [ ] Test image pull: `docker-compose pull`
- [ ] Test deployment: `docker-compose up -d`

**Risk**: 🔴 **HIGH** - Will break deployments until images published to new repo

---

## Phase 5: Documentation (Priority: 🟢 LOW)

**Impact**: Developer experience and onboarding
**Files**: 40+ markdown files
**Testing Required**: Link validation, readability review

### 5.1 Main Documentation (Priority within Phase: HIGH)

| File | References | Key Changes |
|------|-----------|-------------|
| `README.md` | 6 | Update badges, git clone instructions, live demo URL |
| `CLAUDE.md` | 7 | Update repository paths, domain references, project name |
| `DEPLOYMENT.md` | 3 | Update deployment URLs and repository references |
| `QUICKSTART-PORTAINER.md` | 2 | Update git clone instructions |
| `ATTESTATION-FEATURE.md` | 1 | Update cron job path example |

**Implementation Steps**:
1. Replace all `github.com/humac/acs` → `github.com/humac/acs`
2. Replace all `Asset Compliance System` → `Asset Compliance System`
3. Replace file path `/home/user/acs/` → `/home/user/acs/`
4. **DEFER**: Domain name changes (`acs.jvhlabs.com` → TBD)

**Testing**:
- [ ] Validate all markdown links
- [ ] Test git clone instructions
- [ ] Verify code examples work
- [ ] Check documentation renders correctly in GitHub

**Risk**: 🟢 **LOW** - Documentation only

---

### 5.2 Wiki Documentation

| File | References | Key Changes |
|------|-----------|-------------|
| `wiki/README.md` | 8 | Update wiki clone instructions, repository references |
| `wiki/Quick-Start.md` | 2 | Update deployment URLs |
| `wiki/API-Reference.md` | 1 | Update API endpoint URLs (if domain changes) |
| `wiki/Deployment-Guide.md` | 3 | Update repository references |

**Implementation Steps**:
1. Update all repository URLs
2. Update wiki clone instructions
3. Sync to GitHub wiki after changes

**Testing**:
- [ ] Validate wiki links
- [ ] Test wiki clone command
- [ ] Verify wiki sync workflow still works

**Risk**: 🟢 **LOW** - Documentation only

---

### 5.3 DevOps Documentation (17 files)

| File Category | Count | Key Changes |
|--------------|-------|-------------|
| Main DevOps Files | 5 | Update runbooks, checklists, incident response procedures |
| Railway Platform Docs | 5 | Update Railway configuration references |
| Diagram Files | 13 | Update architecture diagrams with new repo/domain names |

**Files to Update**:
- `devops/README.md` - Project name and acronym
- `devops/RUNBOOK.md` - 30+ domain and repo references
- `devops/RELEASE-CHECKLIST.md` - 30+ references in weekly checklist
- `devops/INCIDENT-RESPONSE.md` - 15+ references in procedures
- `devops/railway/*.md` - Railway deployment docs (5 files)
- `diagrams/*.md` - All diagram files (13 files)

**Implementation Steps**:
1. Use find/replace for bulk updates
2. Review each file for context-specific changes
3. Update diagrams with new names
4. **DEFER**: Domain-specific references until DNS migration

**Testing**:
- [ ] Validate markdown formatting
- [ ] Check diagram rendering (if using Mermaid/PlantUML)
- [ ] Verify runbook commands still work

**Risk**: 🟢 **LOW** - Documentation only

---

### 5.4 GitHub Configuration

| File | References | Changes |
|------|-----------|---------|
| `.github/copilot-instructions.md` | 2+ | Update project name and acronym definition |

**Implementation Steps**:
1. Update Copilot instructions with new project name
2. Update acronym definition

**Testing**:
- [ ] Verify Copilot picks up new instructions
- [ ] Test Copilot suggestions reference ACS not ACS

**Risk**: 🟢 **LOW** - Developer tooling only

---

## Phase 6: DEFERRED - Infrastructure Changes

**These require coordination with infrastructure team and DNS changes**

### 6.1 Domain Name Changes (93 references)

**Current Domains**:
- Production: `acs.jvhlabs.com`
- Staging: `staging.acs.jvhlabs.com`
- PR Previews: `acs-pr-X.up.railway.app`
- Development: `acs-dev.up.railway.app`

**Proposed New Domains** (TBD):
- Production: `acs.jvhlabs.com` or similar
- Staging: `staging.acs.jvhlabs.com`
- PR Previews: `acs-pr-X.up.railway.app`
- Development: `acs-dev.up.railway.app`

**Files Affected**: All 40+ documentation files, plus configuration files

**Implementation Requirements**:
1. DNS zone updates
2. SSL certificate provisioning
3. Cloudflare Tunnel reconfiguration
4. Railway project settings updates
5. Redirect old domains to new (301 permanent redirects)
6. Update CORS allowed origins
7. Update OAuth redirect URLs (if using OIDC)
8. Update passkey RP_ID (breaking change for existing passkeys!)

**Risk**: 🔴 **CRITICAL** - Breaking change for:
- Existing user passkeys (requires re-registration)
- OAuth/OIDC configurations
- External integrations
- Bookmarks and saved links

**Recommendation**: Keep existing domains running with redirects for 6-12 months

---

### 6.2 Environment Variable Renames

**Potential Breaking Changes**:
- `ACS_MASTER_KEY` → `ACS_MASTER_KEY` (SMTP password encryption)

**Implementation Requirements**:
1. Add backward compatibility (check both old and new var names)
2. Update deployment secrets
3. Communicate change to operators
4. Deprecation notice for old variable name

**Risk**: 🔴 **HIGH** - Will break existing deployments if not handled carefully

---

## Implementation Checklist

### Pre-Implementation

- [ ] **Backup Production Database** - Full backup before any changes
- [ ] **Tag Current Release** - Create git tag `v-pre-acs-rename`
- [ ] **Create Feature Branch** - `git checkout -b feature/kars-to-acs-rename`
- [ ] **Notify Team** - Alert team members of upcoming changes
- [ ] **Schedule Maintenance Window** - If deploying to production

### Phase 1: Critical Runtime Code (Day 1)

- [ ] Update `backend/database.js` (14 references)
- [ ] Update `backend/services/smtpMailer.js` (11 references)
- [ ] Update `backend/server.js` (1 reference)
- [ ] Update `backend/routes/admin.js` (3 references)
- [ ] Update `backend/package.json` (2 references)
- [ ] Run backend tests: `cd backend && npm test`
- [ ] Fix any failing tests
- [ ] Manual API testing (health check, branding endpoints, email sending)
- [ ] Commit: `git commit -m "refactor: Replace ACS with ACS in backend code"`

### Phase 2: User-Facing UI (Day 1)

- [ ] Update `frontend/src/components/Login.jsx` (1 reference)
- [ ] Update `frontend/src/components/Register.jsx` (1 reference)
- [ ] Update `frontend/src/components/AdminSettings.jsx` (3 references)
- [ ] Update `frontend/src/components/SecuritySettings.jsx` (1 reference)
- [ ] Update `frontend/src/components/NotificationSettings.jsx` (5 references)
- [ ] Update `frontend/package.json` (1 reference)
- [ ] Update `frontend/src/lib/constants.js` (1 reference)
- [ ] Run frontend tests: `cd frontend && npm test`
- [ ] Fix any failing tests
- [ ] Manual UI testing (login, registration, admin settings)
- [ ] Commit: `git commit -m "refactor: Replace ACS with ACS in frontend UI"`

### Phase 3: Test Files (Day 1)

- [ ] Update `backend/attestation-email.test.js` (16 references)
- [ ] Update `backend/footer-label-migration.test.js` (1 reference)
- [ ] Update `backend/database-column-validation.test.js` (1 reference)
- [ ] Update `frontend/src/components/Register.test.jsx` (4 references)
- [ ] Update `frontend/src/components/Login.test.jsx` (1 reference)
- [ ] Update `frontend/src/components/AdminSettings.test.jsx` (2 references)
- [ ] Run all tests: `npm test` (both backend and frontend)
- [ ] Verify 100% pass rate
- [ ] Commit: `git commit -m "test: Update test fixtures for ACS branding"`

### Phase 4: Infrastructure Configuration (Day 2)

- [ ] Update `.env.example` (1 reference)
- [ ] Update `.env.portainer.example` (1 reference)
- [ ] Update `.env.portainer-postgres.example` (1 reference)
- [ ] Update `docker-compose.portainer.yml` (2 references)
- [ ] Update `docker-compose.portainer-postgres.yml` (2 references)
- [ ] Test Docker builds locally
- [ ] **BEFORE DEPLOYMENT**: Update actual .env files on servers
- [ ] **BEFORE DEPLOYMENT**: Publish Docker images to new ghcr.io/humac/acs repo
- [ ] Commit: `git commit -m "chore: Update infrastructure configs for ACS"`

### Phase 5: Documentation (Day 2-3)

#### Main Docs
- [ ] Update `README.md` (6 references)
- [ ] Update `CLAUDE.md` (7 references)
- [ ] Update `DEPLOYMENT.md` (3 references)
- [ ] Update `QUICKSTART-PORTAINER.md` (2 references)
- [ ] Update `ATTESTATION-FEATURE.md` (1 reference)
- [ ] Commit: `git commit -m "docs: Update main documentation for ACS"`

#### Wiki Docs
- [ ] Update `wiki/README.md` (8 references)
- [ ] Update `wiki/Quick-Start.md` (2 references)
- [ ] Update `wiki/API-Reference.md` (1 reference)
- [ ] Update `wiki/Deployment-Guide.md` (3 references)
- [ ] Commit: `git commit -m "docs: Update wiki documentation for ACS"`

#### DevOps Docs
- [ ] Update `devops/README.md`
- [ ] Update `devops/RUNBOOK.md` (30+ references)
- [ ] Update `devops/RELEASE-CHECKLIST.md` (30+ references)
- [ ] Update `devops/INCIDENT-RESPONSE.md` (15+ references)
- [ ] Update `devops/railway/*.md` (5 files)
- [ ] Update `diagrams/*.md` (13 files)
- [ ] Commit: `git commit -m "docs: Update DevOps documentation for ACS"`

#### GitHub Config
- [ ] Update `.github/copilot-instructions.md`
- [ ] Commit: `git commit -m "chore: Update GitHub Copilot instructions for ACS"`

### Post-Implementation

- [ ] **Full Test Suite** - Run all tests (backend + frontend)
- [ ] **Integration Testing** - Full user flow testing
- [ ] **Documentation Review** - Verify all links work
- [ ] **Create Pull Request** - Against develop branch
- [ ] **Code Review** - Get team approval
- [ ] **Merge to Develop** - Deploy to staging environment
- [ ] **Staging Validation** - Full QA on staging
- [ ] **Production Deployment** - Follow standard release process
- [ ] **Post-Deployment Verification**:
  - [ ] Health check returns "ACS API is running"
  - [ ] Login page shows "ACS"
  - [ ] Registration page shows "ACS"
  - [ ] Test email shows "From: ACS Notifications"
  - [ ] Admin branding settings default to "ACS"
  - [ ] No console errors related to branding
- [ ] **Monitor for Issues** - Watch logs and error tracking
- [ ] **Update This Document** - Mark as completed

---

## Rollback Plan

### If Issues Detected in Development

1. **Revert Changes**: `git revert <commit-hash>`
2. **Fix and Recommit**: Address issues and commit fixes
3. **Re-test**: Run full test suite again

### If Issues Detected in Staging

1. **Rollback Deployment**: Redeploy previous version tag
2. **Investigate Logs**: Review staging logs for errors
3. **Create Hotfix Branch**: `git checkout -b hotfix/acs-rename-issues`
4. **Fix Issues**: Address problems
5. **Re-deploy to Staging**: Test again

### If Issues Detected in Production

1. **IMMEDIATE**: Rollback to previous Docker image tag
2. **IMMEDIATE**: Restore database from backup if schema changed
3. **Investigate Root Cause**: Review production logs
4. **Create Incident Report**: Document what went wrong
5. **Fix in Develop**: Address issues in develop branch
6. **Re-test in Staging**: Full validation before retry
7. **Schedule New Deployment**: Don't rush - get it right

### Known Rollback Risks

- **Database Migrations**: If new databases were initialized with "ACS", rollback won't affect them
- **Sent Emails**: Already-sent emails with "ACS Notifications" can't be recalled
- **User Confusion**: Users may see both "ACS" and "ACS" during transition period

---

## Testing Strategy

### Automated Testing

**Backend** (`cd backend && npm test`):
- [ ] All database tests pass (SQLite)
- [ ] All database tests pass (PostgreSQL)
- [ ] Email template tests pass
- [ ] API integration tests pass
- [ ] Health check tests pass

**Frontend** (`cd frontend && npm test`):
- [ ] Component tests pass (Login, Register, AdminSettings)
- [ ] Branding tests verify "ACS" defaults
- [ ] No hardcoded "ACS" in test expectations

**Coverage Requirements**:
- Backend: >80% coverage maintained
- Frontend: >70% coverage maintained

### Manual Testing Checklist

**New User Experience**:
- [ ] Visit registration page → Shows "ACS"
- [ ] Complete registration → Receive "ACS Notifications" welcome email
- [ ] Login → See "ACS" branding
- [ ] First user becomes admin automatically

**Admin Experience**:
- [ ] Navigate to Admin Settings > Branding
- [ ] Verify default site name is "ACS"
- [ ] Change site name to custom value
- [ ] Verify custom name persists
- [ ] Reset to default → Shows "ACS" again

**Email Testing**:
- [ ] Trigger password reset email → From: "ACS Notifications"
- [ ] Trigger MFA enabled email → From: "ACS Notifications"
- [ ] Trigger attestation email → From: "ACS Notifications"
- [ ] Test with custom from_name → Uses custom value

**API Testing**:
- [ ] GET `/api/health` → Returns "ACS API is running"
- [ ] GET `/api/settings/branding` → Returns `site_name: "ACS"`
- [ ] GET `/api/settings/passkey` → Returns `rp_name: "ACS - Asset Compliance System"`
- [ ] GET `/api/settings/smtp` → Returns `from_name: "ACS Notifications"`

**Database Testing**:
- [ ] Fresh SQLite database → Initializes with "ACS" defaults
- [ ] Fresh PostgreSQL database → Initializes with "ACS" defaults
- [ ] Existing database upgrade → Doesn't break (keeps existing custom values)

**Cross-Browser Testing**:
- [ ] Chrome: Branding displays correctly
- [ ] Firefox: Branding displays correctly
- [ ] Safari: Branding displays correctly
- [ ] Edge: Branding displays correctly

### Performance Testing

- [ ] Page load times unchanged
- [ ] API response times unchanged
- [ ] Database query performance unchanged

### Security Testing

- [ ] Authentication still works
- [ ] Authorization checks still work
- [ ] Audit logs capture new "ACS" branding
- [ ] No new XSS vulnerabilities from branding changes
- [ ] Email headers properly escaped

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Database migration fails | Low | Critical | Test on fresh DB and existing DB; have backup |
| Existing deployments break | Medium | Critical | Update all .env files before deploying; publish images to new repo |
| Tests fail after rename | Medium | High | Run full test suite; fix before merging |
| Documentation links break | High | Low | Validate all links; update incrementally |
| User confusion | Medium | Low | Communicate change; ensure consistent branding |
| Email deliverability issues | Low | Medium | Test email sending; verify SPF/DKIM still valid |
| Passkey RP_ID mismatch | Low (code only) | Critical (if domain changes) | DEFER domain changes; keep RP_ID as-is for now |
| Docker image not found | Medium | Critical | Publish images to ghcr.io/humac/acs before deployment |

---

## Communication Plan

### Internal Team

**Before Changes**:
- [ ] Share this plan with team
- [ ] Get approval for timeline
- [ ] Assign responsibilities
- [ ] Schedule deployment window

**During Changes**:
- [ ] Daily standups with progress updates
- [ ] Notify team when each phase completes
- [ ] Alert team of any blockers

**After Changes**:
- [ ] Deployment notification
- [ ] Post-deployment status update
- [ ] Lessons learned retrospective

### External Users (if applicable)

**Before Changes**:
- [ ] Send email notification of rebranding
- [ ] Update homepage with announcement
- [ ] Post to status page (if available)

**After Changes**:
- [ ] Confirm deployment successful
- [ ] Update documentation site
- [ ] Respond to user questions

---

## Success Criteria

### Must Have (Go/No-Go)
- ✅ All automated tests pass (backend + frontend)
- ✅ Health check returns "ACS API is running"
- ✅ New user registration shows "ACS" branding
- ✅ Login page shows "ACS" branding
- ✅ Emails send with "ACS Notifications" from name
- ✅ No ACS references in user-facing UI
- ✅ Docker images published to new repository
- ✅ Staging environment validates successfully

### Should Have
- ✅ All documentation updated
- ✅ Wiki synchronized
- ✅ DevOps runbooks updated
- ✅ GitHub Copilot instructions updated
- ✅ No broken links in documentation

### Nice to Have
- ✅ Domain migration plan documented (for future)
- ✅ Environment variable migration plan (KARS_MASTER_KEY)
- ✅ Communication templates prepared

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Critical Runtime Code | 2-3 hours | None |
| Phase 2: User-Facing UI | 1-2 hours | None (can run parallel with Phase 1) |
| Phase 3: Test Files | 1 hour | Phases 1 & 2 complete |
| Phase 4: Infrastructure Config | 1 hour | Phase 3 complete (tests passing) |
| Phase 5: Documentation | 2-3 hours | None (can run parallel) |
| Testing & QA | 2-3 hours | Phases 1-4 complete |
| **Total Development Time** | **9-12 hours** | |
| Code Review | 1-2 hours | Development complete |
| Staging Deployment | 30 min | Code review approved |
| Staging Validation | 1 hour | Staging deployed |
| Production Deployment | 30 min | Staging validated |
| **Total Project Time** | **12-16 hours** | |

**Recommended Schedule**: Spread over 2-3 days with staging validation before production.

---

## Notes

### Why Keep Domain Names Separate

The domain names (`acs.jvhlabs.com`) are kept in Phase 6 (DEFERRED) because:

1. **DNS Propagation Time**: DNS changes take 24-48 hours to propagate globally
2. **SSL Certificate Provisioning**: New domains need new SSL certs
3. **Passkey Breaking Change**: Changing RP_ID breaks all existing user passkeys
4. **OAuth Redirect URLs**: OIDC/SSO configurations need updating with providers
5. **External Integrations**: Any external systems pointing to old domain break
6. **SEO Impact**: Search engines need time to re-index new domain
7. **User Bookmarks**: Users have old domain saved in bookmarks

**Recommendation**: Deploy code changes first, then plan domain migration separately with:
- 301 redirects from old to new domain
- 6-12 month transition period
- User communication campaign
- Passkey re-registration guidance

### Environment Variable Backward Compatibility

For `ACS_MASTER_KEY` → `ACS_MASTER_KEY`:

```javascript
// Suggested implementation in backend code
const masterKey = process.env.ACS_MASTER_KEY || process.env.KARS_MASTER_KEY;

if (!masterKey && process.env.KARS_MASTER_KEY) {
  console.warn('DEPRECATION WARNING: KARS_MASTER_KEY is deprecated. Please use ACS_MASTER_KEY instead.');
}
```

This allows gradual migration without breaking existing deployments.

---

## Appendix: Find/Replace Commands

### For Bulk Updates (Use with Caution)

**Backend Files**:
```bash
# Replace ACS with ACS in JavaScript files
find backend -name "*.js" -type f -exec sed -i "s/'KARS'/'ACS'/g" {} +
find backend -name "*.js" -type f -exec sed -i 's/"ACS"/"ACS"/g' {} +

# Replace ACS Notifications
find backend -name "*.js" -type f -exec sed -i "s/'ACS Notifications'/'ACS Notifications'/g" {} +
```

**Frontend Files**:
```bash
# Replace ACS with ACS in JSX files
find frontend/src -name "*.jsx" -type f -exec sed -i "s/'KARS'/'ACS'/g" {} +
find frontend/src -name "*.jsx" -type f -exec sed -i 's/"ACS"/"ACS"/g' {} +
```

**Documentation**:
```bash
# Replace in all markdown files
find . -name "*.md" -type f -exec sed -i 's/github.com\/humac\/kars/github.com\/humac\/acs/g' {} +
find . -name "*.md" -type f -exec sed -i 's/Asset Compliance System/Asset Compliance System/g' {} +
find . -name "*.md" -type f -exec sed -i 's/KARS/ACS/g' {} +
```

**⚠️ WARNING**: Review all changes carefully after bulk find/replace. Some context-specific replacements may need manual review.

---

**Document Version**: 1.0
**Created**: 2026-01-01
**Last Updated**: 2026-01-01
**Status**: Ready for Implementation
