# API Rate Limiting Implementation Plan

**Feature**: Comprehensive API Rate Limiting for ACS
**Status**: Planning
**Date**: 2026-01-02
**Branch**: `claude/plan-api-rate-limiting-qV10u`

---

## Executive Summary

This plan outlines the implementation of comprehensive API rate limiting for the ACS (Asset Compliance System) backend. The codebase already has foundational infrastructure in place (~60% complete), including `express-rate-limit` dependency, basic auth limiters, dynamic configuration loading, and admin settings endpoints.

**Remaining work focuses on:**
1. Creating dynamic rate limiter middleware using stored configuration
2. Implementing tiered rate limits by endpoint category
3. Applying limiters consistently across all routes
4. Adding monitoring and response headers

---

## Current State Analysis

### Already Implemented ✅

| Component | Status | Location |
|-----------|--------|----------|
| `express-rate-limit` package | Installed | `backend/package.json` |
| Auth rate limiter (10/15min) | Working | `backend/server.js:193-201` |
| Password reset limiter (5/hour) | Working | `backend/server.js:203-211` |
| Cloudflare-aware IP detection | Working | `backend/server.js:176-182` |
| System settings table | Complete | `backend/database.js` |
| `systemSettingsDb` object | Complete | `backend/database.js` |
| Admin settings API | Complete | `backend/routes/admin.js` |
| Environment variable defaults | Complete | `.env.example` |
| Dynamic config loading | Complete | `backend/server.js:getSystemConfig()` |
| Trust proxy configuration | Complete | `backend/server.js` |

### Missing Components ❌

| Component | Priority | Description |
|-----------|----------|-------------|
| Dynamic global limiter | High | Middleware using database configuration |
| Category-based limiters | High | Different limits for auth/admin/general |
| Route application | High | Apply limiters to all routes consistently |
| Rate limit headers | Medium | `RateLimit-*` headers in responses |
| Burst protection | Medium | Short-term spike protection |
| Monitoring/analytics | Low | Track rate limit events |
| Frontend admin UI | Low | Visual configuration panel |

---

## Proposed Rate Limit Tiers

### Tier 1: Authentication Endpoints (Strictest)
- **Endpoints**: `/api/auth/login`, `/api/auth/register`, `/api/auth/mfa/*`
- **Limit**: 10 requests per 15 minutes per IP
- **Rationale**: Prevent brute-force and credential stuffing attacks
- **Status**: Already implemented

### Tier 2: Password Reset Endpoints
- **Endpoints**: `/api/auth/forgot-password`, `/api/auth/reset-password`
- **Limit**: 5 requests per hour per IP
- **Rationale**: Prevent email enumeration and abuse
- **Status**: Already implemented

### Tier 3: Admin/Settings Endpoints (Moderate)
- **Endpoints**: `/api/admin/*`, `/api/settings/*`
- **Limit**: 50 requests per 15 minutes per IP
- **Rationale**: Lower limit for sensitive operations while allowing admin work
- **Status**: Not implemented

### Tier 4: Standard API Endpoints (Baseline)
- **Endpoints**: `/api/assets/*`, `/api/companies/*`, `/api/users/*`, `/api/audit/*`
- **Limit**: 100 requests per 15 minutes per IP (configurable via admin)
- **Rationale**: Standard protection against abuse while supporting normal usage
- **Status**: Not implemented

### Tier 5: Health/Status Endpoints (Relaxed)
- **Endpoints**: `/api/health`
- **Limit**: 1000 requests per 15 minutes per IP (or exempt)
- **Rationale**: Allow monitoring systems to poll frequently
- **Status**: Not implemented

---

## Implementation Steps

### Phase 1: Core Rate Limiting Middleware

**Step 1.1: Create Rate Limiter Factory Module**

Create a new file `backend/rate-limiter.js` that:
- Exports factory functions for creating rate limiters
- Supports dynamic configuration from database/environment
- Provides consistent error responses
- Includes rate limit headers in responses

```javascript
// backend/rate-limiter.js
import rateLimit from 'express-rate-limit';

export const createRateLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    keyGenerator: options.keyGenerator,
    standardHeaders: true,  // Return rate limit info in headers
    legacyHeaders: false,   // Disable X-RateLimit-* headers
    message: {
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    skip: options.skip || (() => false),
    ...options
  });
};

export const createDynamicLimiter = (getConfig, keyGenerator) => {
  // Creates limiter that reads config on each request
  // For truly dynamic limits without restart
};
```

**Step 1.2: Create Rate Limit Configuration Loader**

Enhance the existing `getSystemConfig()` function to provide complete rate limit configuration:

```javascript
// In backend/server.js or separate config module
const getRateLimitConfig = async () => {
  const dbSettings = await systemSettingsDb.get();
  return {
    global: {
      enabled: dbSettings?.rate_limit_enabled ?? true,
      windowMs: dbSettings?.rate_limit_window_ms ?? 900000,
      maxRequests: dbSettings?.rate_limit_max_requests ?? 100
    },
    // Hardcoded tier settings (can be made configurable later)
    tiers: {
      auth: { windowMs: 15 * 60 * 1000, max: 10 },
      passwordReset: { windowMs: 60 * 60 * 1000, max: 5 },
      admin: { windowMs: 15 * 60 * 1000, max: 50 },
      api: { windowMs: 15 * 60 * 1000, max: 100 },  // Uses global config
      health: { windowMs: 15 * 60 * 1000, max: 1000 }
    }
  };
};
```

### Phase 2: Apply Rate Limiters to Routes

**Step 2.1: Create Tiered Rate Limiters in server.js**

Update `backend/server.js` to create all rate limiter instances:

```javascript
// Existing (keep as-is)
const authRateLimiter = rateLimit({ ... });
const passwordResetRateLimiter = rateLimit({ ... });

// New: Add tiered limiters
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: getClientIp,
  standardHeaders: true,
  message: { success: false, error: 'Too many admin requests' }
});

const apiRateLimiter = rateLimit({
  windowMs: config.rateLimiting.windowMs,
  max: config.rateLimiting.maxRequests,
  keyGenerator: getClientIp,
  standardHeaders: true,
  skip: (req) => !config.rateLimiting.enabled,
  message: { success: false, error: 'Too many requests' }
});

const healthRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: getClientIp
});
```

**Step 2.2: Pass Rate Limiters to Route Modules**

Update the `mountRoutes()` call to include new limiters:

```javascript
// In backend/server.js
mountRoutes(app, {
  // ... existing dependencies
  authRateLimiter,
  passwordResetRateLimiter,
  adminRateLimiter,      // New
  apiRateLimiter,        // New
  healthRateLimiter      // New
});
```

**Step 2.3: Apply Limiters in Route Modules**

Update each route file to use appropriate limiters:

```javascript
// backend/routes/admin.js
export default function createRouter(deps) {
  const { adminRateLimiter, authenticate, authorize } = deps;
  const router = Router();

  // Apply admin limiter to all admin routes
  router.use(adminRateLimiter);

  // Routes...
  return router;
}

// backend/routes/assets.js
export default function createRouter(deps) {
  const { apiRateLimiter, authenticate, authorize } = deps;
  const router = Router();

  // Apply API limiter to all asset routes
  router.use(apiRateLimiter);

  // Routes...
  return router;
}
```

### Phase 3: Dynamic Configuration Support

**Step 3.1: Implement Configuration Reload**

Allow rate limit configuration to update without restart:

```javascript
// Option A: Periodic reload (simpler)
let cachedConfig = null;
let lastConfigLoad = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute

const getConfig = async () => {
  if (cachedConfig && Date.now() - lastConfigLoad < CONFIG_CACHE_TTL) {
    return cachedConfig;
  }
  cachedConfig = await getRateLimitConfig();
  lastConfigLoad = Date.now();
  return cachedConfig;
};

// Option B: Event-based reload (more responsive)
// Emit event when admin updates settings, rebuild limiters
```

**Step 3.2: Create Dynamic Skip Function**

Allow enabling/disabling rate limiting at runtime:

```javascript
const createDynamicApiLimiter = (getConfig, keyGenerator) => {
  return async (req, res, next) => {
    const config = await getConfig();
    if (!config.global.enabled) {
      return next(); // Skip if disabled
    }
    // Apply limiter logic
  };
};
```

### Phase 4: Response Headers and Error Handling

**Step 4.1: Enable Standard Rate Limit Headers**

Configure `express-rate-limit` to include standard headers:

```javascript
const limiter = rateLimit({
  // ...
  standardHeaders: true,   // RateLimit-* headers (draft-6)
  legacyHeaders: false,    // Disable X-RateLimit-* headers
});
```

Response headers included:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in window
- `RateLimit-Reset`: Seconds until window resets

**Step 4.2: Consistent Error Response Format**

Ensure rate limit errors follow ACS API conventions:

```javascript
message: {
  success: false,
  error: 'Too many requests',
  message: 'Rate limit exceeded. Please try again later.',
  retryAfter: Math.ceil(windowMs / 1000)
}
```

### Phase 5: Monitoring and Analytics (Optional)

**Step 5.1: Rate Limit Event Logging**

Add handler to log rate limit events:

```javascript
const limiter = rateLimit({
  // ...
  handler: (req, res, next, options) => {
    console.warn('Rate limit exceeded:', {
      ip: getClientIp(req),
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    res.status(options.statusCode).json(options.message);
  }
});
```

**Step 5.2: Rate Limit Metrics Table (Future Enhancement)**

Consider adding a database table to track rate limit events:

```sql
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  tier TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Phase 6: Frontend Admin Panel (Optional)

**Step 6.1: Add Rate Limiting Section to AdminSettings**

Enhance `frontend/src/components/AdminSettings.jsx` to include:
- Enable/disable rate limiting toggle
- Global limit configuration (window, max requests)
- View current limits by tier
- View recent rate limit events (if logging enabled)

---

## File Changes Summary

### Files to Modify

| File | Changes |
|------|---------|
| `backend/server.js` | Add tiered rate limiters, pass to routes |
| `backend/routes/admin.js` | Apply adminRateLimiter |
| `backend/routes/assets.js` | Apply apiRateLimiter |
| `backend/routes/companies.js` | Apply apiRateLimiter |
| `backend/routes/users.js` | Apply apiRateLimiter |
| `backend/routes/audit.js` | Apply apiRateLimiter |
| `backend/routes/index.js` | Receive and distribute limiters |

### New Files to Create

| File | Purpose |
|------|---------|
| `backend/rate-limiter.js` | Rate limiter factory functions (optional - can inline in server.js) |

### No Changes Needed

| File | Reason |
|------|--------|
| `backend/database.js` | systemSettingsDb already complete |
| `backend/routes/auth.js` | Already has authRateLimiter applied |
| `.env.example` | Rate limit env vars already documented |

---

## Testing Strategy

### Unit Tests

1. **Rate Limiter Factory Tests**
   - Test limiter creation with various options
   - Test dynamic configuration loading
   - Test skip function behavior

### Integration Tests

2. **Rate Limit Enforcement Tests**
   - Test each tier hits its limit at expected count
   - Test window reset behavior
   - Test IP detection with and without Cloudflare headers

3. **Admin Configuration Tests**
   - Test enabling/disabling rate limiting
   - Test updating window and max values
   - Test configuration persistence across restarts

### Manual Testing

4. **Load Testing**
   - Use `ab` or `wrk` to verify limits are enforced
   - Test with multiple IPs to verify per-IP limiting
   - Test behind reverse proxy (nginx, Cloudflare)

---

## Configuration Reference

### Environment Variables

```bash
# Enable/disable global rate limiting (default: true)
RATE_LIMIT_ENABLED=true

# Window duration in milliseconds (default: 900000 = 15 minutes)
RATE_LIMIT_WINDOW_MS=900000

# Maximum requests per window (default: 100)
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Settings (Override Environment)

```json
{
  "rate_limit_enabled": true,
  "rate_limit_window_ms": 900000,
  "rate_limit_max_requests": 100
}
```

### Admin API

**GET /api/admin/system-settings**
Returns current rate limiting configuration with source indicators.

**PUT /api/admin/system-settings**
```json
{
  "rateLimiting": {
    "enabled": true,
    "windowMs": 900000,
    "maxRequests": 100
  }
}
```

---

## Rollout Plan

### Stage 1: Development
1. Implement core rate limiters
2. Apply to all routes
3. Test locally with curl/Postman

### Stage 2: Staging
1. Deploy to staging environment
2. Monitor for false positives
3. Tune limits based on real usage patterns

### Stage 3: Production
1. Deploy with conservative limits
2. Monitor for issues
3. Gradually tighten limits as needed

### Rollback Plan
- Set `RATE_LIMIT_ENABLED=false` in environment
- Or update via admin API: `PUT /api/admin/system-settings { "rateLimiting": { "enabled": false } }`

---

## Security Considerations

1. **IP Spoofing Protection**
   - Use Cloudflare-aware IP detection
   - Configure trust proxy appropriately for deployment environment

2. **Bypass Prevention**
   - Do not allow client-provided IP headers without trusted proxy
   - Rate limit before authentication to prevent auth bypass

3. **Denial of Service Protection**
   - Rate limits help but are not complete DoS protection
   - Consider WAF (Cloudflare, AWS WAF) for additional protection

4. **Configuration Security**
   - Admin-only access to rate limit configuration
   - Audit log all configuration changes

---

## Dependencies

No new dependencies required. Using existing:
- `express-rate-limit` ^8.2.1 (already installed)

---

## Timeline Estimate

| Phase | Effort | Description |
|-------|--------|-------------|
| Phase 1 | 2-3 hours | Core middleware and configuration |
| Phase 2 | 1-2 hours | Apply to all routes |
| Phase 3 | 1-2 hours | Dynamic configuration support |
| Phase 4 | 30 min | Headers and error handling |
| Phase 5 | 2-3 hours | Monitoring (optional) |
| Phase 6 | 3-4 hours | Frontend admin panel (optional) |

**Total Core Implementation: ~5-7 hours**
**With Optional Features: ~10-14 hours**

---

## Approval Checklist

- [ ] Plan reviewed by team lead
- [ ] Security review completed
- [ ] Rate limit values approved
- [ ] Rollback plan verified
- [ ] Test strategy approved

---

## Appendix A: Rate Limit Tier Summary

| Tier | Endpoints | Window | Max | Rationale |
|------|-----------|--------|-----|-----------|
| Auth | `/api/auth/login`, `/register`, `/mfa/*` | 15 min | 10 | Brute-force protection |
| Password | `/api/auth/forgot-password`, `/reset` | 1 hour | 5 | Email enumeration prevention |
| Admin | `/api/admin/*` | 15 min | 50 | Sensitive operations |
| API | `/api/assets/*`, `/companies/*`, `/users/*` | 15 min | 100 | Standard protection |
| Health | `/api/health` | 15 min | 1000 | Monitoring systems |

---

## Appendix B: Express Rate Limit Options

```javascript
{
  // Time window in milliseconds
  windowMs: 15 * 60 * 1000,

  // Max requests per window
  max: 100,

  // Function to identify client (IP address)
  keyGenerator: (req) => req.ip,

  // Return rate limit headers
  standardHeaders: true,
  legacyHeaders: false,

  // Custom error response
  message: { success: false, error: 'Too many requests' },

  // Skip certain requests
  skip: (req) => req.path === '/health',

  // Custom handler for rate limit exceeded
  handler: (req, res, next, options) => {
    // Log, respond, etc.
  }
}
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-02
