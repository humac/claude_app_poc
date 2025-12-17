# KARS Code Review - December 2025

This document contains a comprehensive code review of the KARS codebase with suggestions for improvements across security, architecture, code quality, and testing.

---

## Executive Summary

| Category | Status | Critical Issues |
|----------|--------|-----------------|
| **Security** | ⚠️ Needs Attention | 6 critical, 4 high priority |
| **Backend Architecture** | ⚠️ Needs Refactoring | Monolithic server.js (5,936 lines) |
| **Frontend Architecture** | ⚠️ Needs Refactoring | Large components, code duplication |
| **Test Coverage** | ⚠️ Gaps Exist | Backend: good, Frontend: 14% |
| **Code Quality** | ✅ Solid Foundation | Good patterns, needs consistency |

---

## 1. Critical Security Issues

### 🔴 CRITICAL: Missing Authentication on Asset Endpoints

**Location:** `backend/server.js`

Several asset endpoints lack authentication middleware:

```javascript
// GET /api/assets/:id - Line ~3079
app.get('/api/assets/:id', async (req, res) => {  // ❌ Missing: authenticate
  const asset = await assetDb.getById(req.params.id);
  // Public access to any asset!
});

// GET /api/assets/search - Line ~3093
// PATCH /assets/:id/status - Line ~3542
```

**Impact:** Complete asset data exposure to unauthenticated users.

**Fix:**
```javascript
app.get('/api/assets/:id', authenticate, async (req, res) => { ... });
app.get('/api/assets/search', authenticate, async (req, res) => { ... });
app.patch('/api/assets/:id/status', authenticate, async (req, res) => { ... });
```

---

### 🔴 CRITICAL: Missing Authorization on CSV Import

**Location:** `backend/server.js:3111-3221`

```javascript
app.post('/api/assets/import', authenticate, upload.single('file'), async (req, res) => {
  // ❌ Missing: authorize('admin')
  // Any authenticated user (including employees) can bulk import
});
```

**Fix:**
```javascript
app.post('/api/assets/import',
  authenticate,
  authorize('admin'),  // Add this
  upload.single('file'),
  async (req, res) => { ... }
);
```

---

### 🔴 CRITICAL: Default JWT Secret in Production

**Location:** `backend/auth.js:10`

```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
```

**Issue:** Default secret exposed if environment variable not set.

**Fix:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

---

### 🔴 CRITICAL: Unsafe JSON Parsing (12 locations)

**Locations:** Lines 1388, 1607, 1722, 2455, 4802-4803, 4895-4898, 4940, 4966, 5255

```javascript
// Current (unsafe):
const companyIds = JSON.parse(campaign.target_company_ids);

// If malformed JSON in DB → uncaught error → 500 response
```

**Fix:** Create safe parse helper:
```javascript
// utils/json.js
export const safeJsonParse = (value, defaultValue = null) => {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.error('JSON parse error:', err);
    return defaultValue;
  }
};
```

---

### 🟠 HIGH: No Rate Limiting

**Impact:** Vulnerable to:
- Brute force attacks on login
- Password reset spam
- API abuse / DoS

**Fix:** Add express-rate-limit:
```javascript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many attempts, try again later' }
});

app.post('/api/auth/login', authLimiter, async (req, res) => { ... });
app.post('/api/auth/reset-password', authLimiter, async (req, res) => { ... });
```

---

### 🟠 HIGH: Open CORS Configuration

**Location:** `backend/server.js:111`

```javascript
app.use(cors());  // Accepts requests from any domain
```

**Fix:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
```

---

## 2. Backend Architecture Issues

### Monolithic server.js (5,936 lines, 108 endpoints)

**Problem:** Single file contains all routes, making it:
- Difficult to navigate and maintain
- Hard to test in isolation
- Prone to merge conflicts

**Recommended Structure:**
```
backend/
├── routes/
│   ├── auth.js          # Auth endpoints (~35 routes)
│   ├── assets.js        # Asset CRUD (~25 routes)
│   ├── companies.js     # Company management
│   ├── users.js         # User management
│   ├── attestation.js   # Attestation workflows (~30 routes)
│   ├── admin.js         # Admin settings
│   └── audit.js         # Audit logs
├── middleware/
│   ├── auth.js          # authenticate, authorize
│   ├── validation.js    # Input validators
│   └── errorHandler.js  # Centralized error handling
├── services/
│   └── (existing)
└── server.js            # Entry point, middleware setup
```

---

### Inconsistent Error Response Format

**Current state (4 different patterns):**
```javascript
// Style 1
res.status(500).json({ error: 'Message' });

// Style 2
res.status(500).json({ error: 'Message', details: '...' });

// Style 3
res.json({ success: false, error: 'Message' });

// Style 4
res.json({ message: 'Message', asset: newAsset });
```

**Fix:** Standardize response format:
```javascript
// utils/responses.js
export const successResponse = (res, data, message = null, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const errorResponse = (res, message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  res.status(statusCode).json({
    success: false,
    error: { message, code }
  });
};
```

---

### Code Duplication (30+ instances)

**Pattern 1: Repeated validation**
```javascript
// Appears ~30 times:
if (!email || !password) {
  return res.status(400).json({ error: 'Email and password are required' });
}
```

**Fix:** Create validation middleware:
```javascript
// middleware/validation.js
export const requireFields = (...fields) => (req, res, next) => {
  const missing = fields.filter(f => !req.body[f]);
  if (missing.length) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(', ')}`
    });
  }
  next();
};

// Usage:
app.post('/api/auth/login', requireFields('email', 'password'), async (req, res) => {
  // No validation code needed
});
```

**Pattern 2: Repeated asset authorization (15+ instances)**
```javascript
// Extract to middleware:
export const requireAssetOwnership = async (req, res, next) => {
  const asset = await assetDb.getById(req.params.id);
  if (!asset) return res.status(404).json({ error: 'Asset not found' });

  const isOwner = asset.owner_id === req.user.id ||
    asset.employee_email?.toLowerCase() === req.user.email.toLowerCase();

  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.asset = asset;
  next();
};
```

---

### Missing Structured Logging

**Current:** 180+ `console.log/console.error` statements

**Fix:** Use structured logging:
```javascript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info'
});

// Usage:
logger.info({ userId: req.user.id, action: 'asset_created' }, 'Asset created');
logger.error({ err: error, userId: req.user.id }, 'Failed to update asset');
```

---

## 3. Frontend Architecture Issues

### Monolithic Components

**AssetTable.jsx (838 lines)**
- 20+ state variables
- 8+ useMemo hooks
- Multiple responsibilities: filtering, selection, deletion, export, bulk updates

**UserManagement.jsx (815 lines)**
- Similar issues

**Recommendation:** Split into focused components:
```
AssetTable.jsx →
├── AssetTableFilters.jsx
├── AssetTableMobile.jsx
├── AssetTableDesktop.jsx
├── AssetTableRow.jsx (memoized)
└── BulkAssetActions.jsx
```

---

### Inconsistent API Error Handling (116 fetch calls)

**Problem patterns:**

```javascript
// Silent failure (no user feedback):
catch (err) {
  console.error('Failed to fetch:', err);
}

// Generic messages (no context):
catch (err) {
  toast({ title: "Error", description: 'Unable to delete asset.' });
}

// Lost HTTP status codes:
if (!response.ok) throw new Error(data.error || 'Failed');
// 401, 403, 500 all treated the same
```

**Fix:** Create custom fetch hook:
```javascript
// hooks/useFetch.js
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAuthHeaders, logout } = useAuth();

  const execute = async () => {
    try {
      setLoading(true);
      const response = await fetch(url, {
        ...options,
        headers: { ...getAuthHeaders(), ...options.headers }
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err) {
      setError(err.message);
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, execute };
};
```

---

### Code Duplication in Frontend

**Pattern 1: Manager name resolution (3+ locations)**
```javascript
// AssetTable.jsx, UserManagement.jsx, CompanyManagement.jsx
const name = `${first_name} ${last_name}`.trim();
```

**Fix:**
```javascript
// utils/user.js
export const formatFullName = (firstName, lastName) =>
  `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
```

**Pattern 2: Filter/pagination logic (4 occurrences)**

**Fix:** Create custom hook:
```javascript
// hooks/useTableFilters.js
export const useTableFilters = (items, searchFields, defaultPageSize = 10) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const filteredItems = useMemo(() =>
    items.filter(item =>
      searchFields.some(field =>
        String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [items, searchTerm, searchFields]
  );

  const paginatedItems = useMemo(() =>
    filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredItems, currentPage, pageSize]
  );

  return {
    searchTerm, setSearchTerm,
    currentPage, setCurrentPage,
    pageSize, setPageSize,
    filteredItems, paginatedItems,
    totalPages: Math.ceil(filteredItems.length / pageSize)
  };
};
```

**Pattern 3: Hex to HSL conversion (2 locations)**
- `App.jsx:72-96`
- `Login.jsx:100-121`

**Fix:** Extract to utility:
```javascript
// utils/color.js
export const hexToHSL = (hex) => {
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  // ... rest of calculation
  return { h, s, l };
};
```

---

### Performance Issues

**1. Unstable useCallback dependencies**
```javascript
// AssetTable.jsx
const getManagerDisplayName = useCallback((asset) => { ... }, [getFullName]);
// getFullName from context may not be stable
```

**2. Missing React.memo on list items**
```javascript
// Should be memoized:
const AssetTableRow = React.memo(({ asset, ...props }) => (
  <TableRow>...</TableRow>
));
```

**3. Fetching in unstable useEffect dependencies**
```javascript
// AssetsPage.jsx
useEffect(() => {
  loadAssets();
}, [getAuthHeaders]); // getAuthHeaders recreated on every render!
```

---

### Accessibility Issues

**1. Missing form labels**
```javascript
// CompanyManagement.jsx
<Input id="name" placeholder="Company" required />
// Missing: <Label htmlFor="name">Company Name</Label>
```

**2. Icon-only buttons without sr-only text**
```javascript
// Need to add:
<Button variant="ghost" size="icon">
  <Edit className="h-4 w-4" />
  <span className="sr-only">Edit asset</span>  {/* Add this */}
</Button>
```

**3. Color-only status indicators**
```javascript
// Status badges use color alone - add icons for colorblind users:
{status === 'lost' && <AlertTriangle className="inline w-4 h-4 mr-1" />}
{status}
```

---

## 4. Test Coverage Gaps

### Current State

| Area | Files | Coverage |
|------|-------|----------|
| Backend Test Files | 34 | ~100% of core modules |
| Frontend Test Files | 9 | 14% of components |
| Backend API Endpoints | 108 | ~30% tested |
| Frontend Components | 35 | ~20% tested |

### Critical Missing Tests

**Backend:**
- Bulk asset operations (status, manager, delete)
- CSV/file import workflows
- Report generation endpoints
- Attestation campaign lifecycle
- Rate limiting (once implemented)

**Frontend (28 untested components):**
- `AdminSettings.jsx` - Admin configuration
- `AssetBulkImportModal.jsx` - CSV import
- `AssetRegisterModal.jsx` - Asset creation
- `CompanyManagement.jsx` - Company CRUD
- `ForgotPassword.jsx` / `ResetPassword.jsx` - Password flow
- `MFASetupModal.jsx` - MFA enrollment
- `AuthContext.jsx` / `UsersContext.jsx` - State management

### Recommended Test Priority

1. **Immediate:** Security-critical paths (auth, authorization)
2. **High:** User-facing workflows (login, registration, asset CRUD)
3. **Medium:** Admin features and settings
4. **Low:** Charts and visualization components

---

## 5. Quick Wins

### Backend (< 1 hour each)

1. Add `authenticate` to unprotected asset endpoints
2. Add `authorize('admin')` to CSV import
3. Remove default JWT_SECRET fallback
4. Add CORS origin whitelist
5. Extract constants (VALID_STATUSES, VALID_TYPES, etc.)

### Frontend (< 1 hour each)

1. Extract `formatFullName` utility
2. Add sr-only text to icon buttons
3. Fix unstable useEffect dependencies
4. Add React.memo to table row components

---

## 6. Recommended Action Plan

### Phase 1: Security (1 week)
- [ ] Add authentication to all asset endpoints
- [ ] Add authorization to CSV import
- [ ] Remove default secrets
- [ ] Add rate limiting
- [ ] Configure CORS properly
- [ ] Fix JSON parse error handling

### Phase 2: Backend Refactoring (2-3 weeks)
- [ ] Split server.js into route modules
- [ ] Create validation middleware
- [ ] Standardize error responses
- [ ] Add structured logging
- [ ] Extract constants

### Phase 3: Frontend Refactoring (2-3 weeks)
- [ ] Create useFetch hook
- [ ] Extract shared utilities
- [ ] Split large components
- [ ] Fix performance issues
- [ ] Address accessibility gaps

### Phase 4: Testing (Ongoing)
- [ ] Add tests for security-critical paths
- [ ] Test remaining frontend components
- [ ] Add integration tests
- [ ] Set up coverage thresholds

---

## 7. Positive Aspects

The codebase has several strong points worth maintaining:

✅ **Solid database abstraction** - Dual SQLite/PostgreSQL support is well-engineered
✅ **Comprehensive audit logging** - Every mutation is tracked
✅ **Role-based access control** - Clear authorization logic
✅ **Good UI component library** - Excellent shadcn/ui integration
✅ **WebAuthn/Passkey support** - Modern security implementation
✅ **Responsive design** - Mobile-first approach with Tailwind
✅ **Well-documented** - CLAUDE.md is comprehensive
✅ **Good backend test coverage** - 34 test files for core modules

---

**Review completed:** December 17, 2025
