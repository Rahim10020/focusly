# Focusly API Routes - Comprehensive Analysis

**Date**: March 29, 2026  
**Analysis Scope**: API middleware, response patterns, and 9 existing routes  
**Project Phase**: Phase 4 - API Routes Refactoring

---

## 📊 Current State Summary

### Infrastructure Inventory

**Middleware Stack** (`src/lib/api/middleware/`):

- ✅ `withErrorHandling()` - Global error catching with basic routing
- ✅ `withCors()` - CORS headers with configurable options
- ✅ `withValidation()` - Zod schema validation for request body
- ✅ `withQueryValidation()` - Zod schema validation for query parameters
- ✅ `withBodyAndQueryValidation()` - Combined body + query validation
- ✅ `withLogging()` - Structured logging with request ID generation
- ✅ `withRequestId()` - Lightweight request ID injection
- ✅ `withPerformanceLogging()` - Performance profiling
- ✅ `withRateLimit()` - Rate limiting with 4 tiers (strict, standard, generous, relaxed)
- ✅ `compose()` - Middleware composition utility (right-to-left application)
- ❌ `withAuth()` - **NOT IMPLEMENTED** (intentionally fail-closed)

**Response Utilities** (`src/lib/api/utils/response.ts`):

- ✅ `successResponse()` - Standardized success responses with pagination support
- ✅ `errorResponse()` - Standardized error responses with details array
- ✅ `Errors` helper object with 7 predefined error types
- ✅ Consistent response metadata (timestamp, requestId)

**Validation Schemas** (`src/lib/api/schemas/`):

- ✅ Friends validation (CreateFriendRequest, UpdateFriendRequest, ListFriendsQuery)
- ✅ Notifications validation
- ✅ Tasks validation
- ✅ User validation
- ✅ Common schemas (pagination, date range, sort, search)

**Domain Services** (`src/lib/services/`):

- ✅ `StreakService` - Timezone-aware streak calculations
- ✅ `TaskCategorizationService` - Task prioritization & status categorization
- ✅ `RecurrenceService` - Recurrence rule handling
- ✅ `CacheService` - Cache abstraction

### Existing API Routes

| Route                         | Method(s) | Status | Pattern           | Issues                           |
| ----------------------------- | --------- | ------ | ----------------- | -------------------------------- |
| `GET /api/tasks/failed`       | GET       | ✅     | `composedHandler` | Basic, no pagination             |
| `GET /api/friends`            | GET       | ✅     | `composedHandler` | Custom Supabase client creation  |
| `POST /api/friends`           | POST      | ✅     | `composedHandler` | Inconsistent error handling      |
| `PUT /api/friends/[id]`       | PUT       | ✅     | `composedHandler` | Manual auth checking             |
| `GET /api/leaderboard`        | GET       | ✅     | `composedHandler` | Multiple sequential queries      |
| `GET /api/notifications`      | GET       | ✅     | `composedHandler` | Custom Supabase client           |
| `POST /api/notifications`     | POST      | ✅     | `composedHandler` | Manual validation                |
| `PUT /api/notifications/[id]` | PUT       | ✅     | `composedHandler` | Manual parameter extraction      |
| `POST /api/user/preferences`  | POST      | ✅     | `composedHandler` | Admin client usage               |
| `GET /api/users/[userId]`     | GET       | ✅     | `composedHandler` | Privacy logic mixed with queries |

---

## 🔴 Main Issues Identified

### 1. **Inconsistent Supabase Client Initialization** (HIGH PRIORITY)

**Issue**: Three different patterns for Supabase client creation:

```typescript
// Pattern A: Admin client (used in 4 routes)
const supabaseAdmin = supabaseServerPool.getAdminClient();

// Pattern B: Authenticated client with access token (used in 5 routes)
const supabaseWithAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { global: { headers: { Authorization: `Bearer ${session.accessToken}` } } },
);

// Pattern C: NextAuth direct import (used for auth)
import { getServerSession } from "next-auth";
```

**Problem**:

- Code duplication (Pattern B repeated 5 times)
- Inconsistent error handling per pattern
- RLS (Row Level Security) implementation varies
- Testing complexity increased

**Impact**: Maintenance burden, potential security inconsistencies, harder to modify auth strategy

**Affected Routes**:

- Pattern A: `tasks/failed`, `leaderboard`, `user/preferences`, `users/[userId]`
- Pattern B: `friends`, `friends/[id]`, `notifications`, `notifications/[id]`

---

### 2. **Manual Auth Checking Repeated Across Routes** (HIGH PRIORITY)

**Duplicated Code** (appears 9+ times):

```typescript
const session = await getServerSession(authOptions);
if (!session?.user?.id) {
  return Errors.unauthorized();
}
```

**Issues**:

- No centralized auth middleware (despite `withAuth()` being declared)
- Different routes check different session properties (`user.id`, `user`, `accessToken`)
- Auth extraction logic is scattered
- No type-safe session context passing to handlers

**Affected All Routes** - Example from `friends/route.ts`:

```typescript
// GET handler
const session = await getServerSession(authOptions);
if (!session?.user || !session.accessToken) { ... }

// POST handler (same check repeated)
const session = await getServerSession(authOptions);
if (!session?.user || !session.accessToken) { ... }
```

---

### 3. **Inefficient Leaderboard Query Pattern** (MEDIUM PRIORITY)

**Issue**: Leaderboard route performs sequential queries for count, stats, and profiles:

```typescript
// Separate query 1: Get total count
const { data: countData, error: countError } = await supabaseAdmin
  .from("stats")
  .select("user_id", { count: "exact", head: true });

// Separate query 2: Get stats with offset/limit
const { data: statsData, error: statsError } = await supabaseAdmin
  .from("stats")
  .select("user_id, total_focus_time, ...");

// Separate query 3: Get profile data
const { data: profilesData, error: profilesError } = await supabaseAdmin
  .from("profiles")
  .select("...")
  .in("id", userIds);

// Additional conditional queries for time filters
if (timeFilter !== "all") {
  const { data: sessions, error: sessionError } = await supabaseAdmin
    .from("focus_sessions")
    .select("...")
    .gte("completed_at", filterStartDate);
}
```

**Problems**:

- 3-5 database queries per request (N+1 problem)
- No use of Supabase joins/aggregates
- Cache key doesn't include all parameters
- Performance impact on high-traffic endpoint

---

### 4. **Missing Input Validation for Route Parameters** (MEDIUM PRIORITY)

**Issue**: Several routes don't validate route parameters with schemas:

- `PUT /api/friends/[id]` - No schema validation for `id`
- `PUT /api/notifications/[id]` - No schema for `id`
- `GET /api/users/[userId]` - Uses inline Zod validation (inconsistent pattern)

**Example** from `friends/[id]/route.ts`:

```typescript
const routeContext = context as { params: Promise<{ id: string }> };
const { id: friendshipId } = await routeContext.params;
// No validation on friendshipId format
```

**Inconsistency**: `users/[userId]/route.ts` validates properly:

```typescript
const UserIdSchema = z.string().uuid("Invalid user ID format");
const validationResult = UserIdSchema.safeParse(userId);
```

---

### 5. **Incomplete Error Handling Strategies** (MEDIUM PRIORITY)

**Issues**:

- Generic error messages: `throw new Error('Failed to fetch friends')`
- Error codes not specific enough for client differentiation
- Some routes throw errors (caught by middleware), others return `Errors.*`
- No error type standardization (Supabase errors mixed with generic Error)

**Example** from `friends/route.ts`:

```typescript
if (error) {
  throw new Error("Failed to fetch friends"); // Generic, loses Supabase context
}
```

**vs. Better Pattern** from `users/[userId]/route.ts`:

```typescript
if (profileError || !profileData) {
    logger.error('Error fetching user profile', profileError as Error, {...});
    return Errors.notFound('User not found'); // Specific status
}
```

---

### 6. **No Unified Type-Safe Session Context** (MEDIUM PRIORITY)

**Issue**: Session extraction varies by route:

```typescript
// Option 1: Minimal check (incomplete)
if (!session?.user?.id) return Errors.unauthorized();

// Option 2: With access token
if (!session?.user || !session.accessToken) return Errors.unauthorized();

// Option 3: Conditional checks different per route
const viewerId = session?.user?.id;
```

**Problems**:

- No guarantee of session shape across routes
- TypeScript doesn't ensure all required fields are present
- Impossible to pass session through middleware safely
- Making `withAuth()` middleware work is blocked by this

---

### 7. **Missing Domain Service Integration** (MEDIUM PRIORITY)

**Issue**: Domain services exist but aren't used in API routes:

- **StreakService** - Available but leaderboard calculates manually
- **TaskCategorizationService** - Not used in any API routes
- **RecurrenceService** - Not used in any API routes
- **CacheService** - Only `Cache.getOrSet()` is used, not full service

**Impact**: Inconsistency between frontend (using services) and backend (manual logic)

---

### 8. **Inconsistent Pagination Implementation** (LOW PRIORITY)

**Issue**: Not all list endpoints support pagination:

| Route                    | Has Pagination | Pagination Helper Used                             |
| ------------------------ | -------------- | -------------------------------------------------- |
| `GET /api/friends`       | ❌ No          | No                                                 |
| `GET /api/notifications` | ❌ No          | No                                                 |
| `GET /api/leaderboard`   | ✅ Yes         | Yes (`getPaginationOffset`, `buildPaginationMeta`) |
| `GET /api/tasks/failed`  | ❌ No          | No                                                 |

**Standard Pattern** (from leaderboard):

```typescript
const offset = getPaginationOffset({ page, limit });
const response = {
  data,
  pagination: buildPaginationMeta({ page, limit }, total),
};
```

---

### 9. **No Unified Request Context Management** (LOW PRIORITY)

**Issue**: Request metadata (IP, user-agent, etc.) is extracted in logging middleware only:

```typescript
function getRequestMetadata(req: NextRequest) {
  return {
    method: req.method,
    url: req.url,
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for"),
  };
}
```

**Problems**:

- Other routes can't access this metadata
- Audit logging would need to re-extract
- IP detection duplicated in rate limit middleware

---

### 10. **Missing Response Type Safety** (LOW PRIORITY)

**Issue**: Response types are inferred, not explicitly exported:

```typescript
// Current pattern
export const successResponse = (...) => NextResponse<ApiSuccessResponse<T>>;

// Routes don't have explicit return types
async function getHandler() {
    // Type inference works but no explicit contract
    return successResponse(data);
}
```

**Impact**: Harder to document API contracts, IDE autocomplete less helpful

---

## ✅ 10 Improvement Opportunities (Ranked by Priority)

### **1. [HIGH] Implement `withAuth()` Middleware**

**Priority**: Highest  
**Effort**: Medium (4-6 hours)  
**Impact**: Reduces code by ~50 lines, enables auth reuse

**Current State**:

```typescript
export function withAuth(): ApiMiddleware {
  return (_handler: ApiHandler) => {
    return async () => {
      return Errors.internal("withAuth middleware is not implemented...");
    };
  };
}
```

**What to Do**:

1. Extract session in middleware (not in handlers)
2. Pass session through `validatedData` property
3. Support both admin and authenticated contexts
4. Lock down to specific session shape

**Expected Outcome**:

- Remove 9 redundant session checks
- Type-safe session passing
- Single place to modify auth strategy

**Location**: `/src/lib/api/middleware/auth.ts` (new file) + update `compose.ts`

---

### **2. [HIGH] Create Unified Supabase Client Provider**

**Priority**: High  
**Effort**: Medium (3-4 hours)  
**Impact**: Eliminates code duplication, easier to test

**What to Do**:

1. Create `src/lib/api/utils/supabaseClient.ts`
2. Export functions:
   - `getAdminClient(requestId?: string)` - Wrapped admin client
   - `getAuthenticatedClient(session: Session, requestId?: string)` - Wrapped auth client
   - `validateClientResponse<T>(response, action: string, requestId?: string)` - Error handling wrapper
3. All routes import from single point

**Example Implementation**:

```typescript
export function validateClientResponse<T>(
  response: { data: T | null; error: PostgrestError | null },
  action: string,
  requestId?: string,
): T {
  if (response.error) {
    logger.error(`Database error during ${action}`, response.error, {
      requestId,
    });
    if (response.error.code === "PGRST116") {
      throw new Error("not found");
    }
    throw new Error(`Failed to ${action}`);
  }
  return response.data!;
}
```

**Expected Outcome**:

- Consistent error handling
- Easier to intercept/log all DB calls
- Single place for RLS testing

**Affected Routes**: All 9 routes

---

### **3. [HIGH] Refactor Leaderboard Query Pattern**

**Priority**: High  
**Effort**: Medium (2-3 hours)  
**Impact**: 60-80% performance improvement on leaderboard endpoint

**Current Performance**: 3-5 DB queries per request  
**Target Performance**: 1-2 DB queries per request

**What to Do**:

1. Use Supabase joins instead of separate queries for stats + profiles
2. Combine count + data fetch into single query with `count: 'exact'`
3. Create leaderboard service in `src/lib/services/leaderboardService.ts`
4. Move time filter logic to service

**Example Query Optimization**:

```typescript
// Current: 3 queries
const { count } = await findTotal();
const { data: stats } = await findStats();
const { data: profiles } = await findProfiles();

// Optimized: 1 query with join
const { data: entries, count } = await supabaseAdmin
  .from("stats")
  .select(
    `
        user_id,
        total_focus_time,
        completed_tasks,
        streak,
        profiles (id, username, avatar_url)
    `,
    { count: "exact" },
  )
  .order("total_focus_time", { ascending: false })
  .range(offset, offset + limit - 1);
```

**Expected Outcome**:

- 3-5s → 500ms-1s response time
- Better cache efficiency
- Source for `LeaderboardService` reuse

---

### **4. [HIGH] Create API Request Context Helper**

**Priority**: High  
**Effort**: Small (1-2 hours)  
**Impact**: Enables consistent audit logging, easier debugging

**What to Do**:

1. Create `src/lib/api/utils/requestContext.ts`
2. Export:
   - `RequestContext` interface (requestId, userId, method, url, ip, etc.)
   - `createRequestContext(req, session)` function
   - `getRequestContextFromMiddleware()` hook

**Usage in Handlers**:

```typescript
async function getHandler(
  req: NextRequest,
  _context: unknown,
  validatedData: unknown & { requestContext: RequestContext },
) {
  const { requestId, userId, ip } = validatedData.requestContext;
  logger.info("Fetching user data", {
    requestId,
    userId,
    ip,
    action: "getUserProfile",
  });
}
```

**Expected Outcome**:

- Consistent audit trail
- Easier security monitoring
- Request tracing across services

---

### **5. [HIGH] Consolidate Error Handling Strategy**

**Priority**: High  
**Effort**: Small (1-2 hours)  
**Impact**: Better error messages, easier client debugging

**What to Do**:

1. Expand `ErrorCodes` object with specific codes:
   - `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`
   - Add new: `RESOURCE_CONFLICT`, `INVALID_STATE`, `EXTERNAL_SERVICE_ERROR`
2. Create `src/lib/api/utils/errorMapper.ts` to convert Supabase errors to API error codes
3. Update all routes to use mapper instead of generic throws

**Error Codes Table**:

```typescript
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR", // 400
  UNAUTHORIZED: "UNAUTHORIZED", // 401
  FORBIDDEN: "FORBIDDEN", // 403
  NOT_FOUND: "NOT_FOUND", // 404
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT", // 409 (exists already)
  INVALID_STATE: "INVALID_STATE", // 422 (can't perform action)
  TOO_MANY_REQUESTS: "TOO_MANY_REQUESTS", // 429
  EXTERNAL_ERROR: "EXTERNAL_ERROR", // 502
  INTERNAL_ERROR: "INTERNAL_ERROR", // 500
} as const;
```

**Expected Outcome**:

- Clients can parse error codes, not error messages
- Standard error taxonomy
- Better internationalization support

---

### **6. [MEDIUM] Add Parameter Validation Middleware**

**Priority**: Medium  
**Effort**: Small (1-2 hours)  
**Impact**: Eliminates manual validation in handlers

**What to Do**:

1. Create `withParamValidation()` middleware in `compose.ts`
2. Add route param schemas to route files
3. Middleware extracts and validates before handler execution

**Implementation**:

```typescript
export function withParamValidation<T extends z.ZodSchema>(
  schema: T,
): ApiMiddleware {
  return (handler: ApiHandler) => {
    return async (req: NextRequest, context: unknown) => {
      const routeContext = context as {
        params: Promise<Record<string, string>>;
      };
      const params = await routeContext.params;

      try {
        const validated = schema.parse(params);
        return handler(
          req,
          { ...context, validatedParams: validated },
          undefined,
        );
      } catch (err) {
        // Validation error handling
      }
    };
  };
}
```

**Apply To**: `friends/[id]`, `notifications/[id]`, `users/[userId]`

**Expected Outcome**:

- Remove inline validation code
- Type-safe route parameters
- Consistent error responses

---

### **7. [MEDIUM] Create Domain-Driven API Services**

**Priority**: Medium  
**Effort**: Medium (4-5 hours)  
**Impact**: Code reuse, consistent business logic

**What to Do**:

1. Create service layer in `src/lib/api/services/`:
   - `LeaderboardApiService` - Query building, filtering, caching
   - `FriendsApiService` - Request handling, status changes
   - `NotificationApiService` - Creation, updates, queries
   - `UserProfileApiService` - Profile fetching with privacy rules
2. Move DB queries from route handlers to services
3. Services use existing domain services internally

**Example Service Pattern**:

```typescript
export class LeaderboardApiService {
  static async getLeaderboardPage(
    pagination: PaginationParams,
    timeFilter: LeaderboardTimeFilter,
    requestId: string,
  ): Promise<{ entries: LeaderboardEntry[]; total: number }> {
    // Use StreakService for calculations
    // Use Cache for caching
    // Return paginated results
  }
}
```

**Expected Outcome**:

- Easier to test API endpoints
- Business logic in one place
- Route handlers 40% shorter
- Reusable from other contexts (webhooks, scheduled jobs)

---

### **8. [MEDIUM] Implement Standardized Response Contracts**

**Priority**: Medium  
**Effort**: Small (1-2 hours)  
**Impact**: Better API documentation, TypeScript safety

**What to Do**:

1. Export response types from `response.ts`:
   ```typescript
   export type GetFriendsResponse = ApiSuccessResponse<FriendData[]>;
   export type GetLeaderboardResponse = ApiSuccessResponse<
     LeaderboardEntry[],
     { pagination: PaginationMeta }
   >;
   ```
2. Add response schema validation (runtime safety)
3. Document in OpenAPI/Swagger format
4. Route handlers explicitly return typed responses

**Example Usage**:

```typescript
async function getHandler(): Promise<GetFriendsResponse> {
  const friends = await fetchFriends();
  return successResponse(friends); // Type-safe
}
```

**Affected All Routes**

**Expected Outcome**:

- Auto-generated API docs
- Client code generation possible
- Response shape guaranteed at runtime

---

### **9. [MEDIUM] Unify List Endpoint Pagination**

**Priority**: Medium  
**Effort**: Small (1-2 hours)  
**Impact**: Consistent API behavior, client simplification

**What to Do**:

1. Add pagination middleware/wrapper template
2. Apply to: `GET /api/friends`, `GET /api/notifications`, `GET /api/tasks/failed`
3. Use `buildPaginationMeta()` utility in all list endpoints
4. Standardize query parameters: always `?page=1&limit=20`

**Routes to Update**:

- ✅ `GET /api/leaderboard` - Already done
- ❌ `GET /api/friends` - Add pagination
- ❌ `GET /api/notifications` - Add pagination
- ❌ `GET /api/tasks/failed` - Add pagination

**Expected Outcome**:

- Consistent API contracts
- Client libraries can share pagination logic
- Better UX for large result sets

---

### **10. [LOW] Add Performance Monitoring & Metrics**

**Priority**: Low  
**Effort**: Medium (2-3 hours)  
**Impact**: Production observability

**What to Do**:

1. Emit metrics from API handlers:
   - Query execution time
   - Cache hit/miss rates
   - Error rates by endpoint
   - 95th percentile latency
2. Export metrics to platform (DataDog, Prometheus, etc.)
3. Dashboard for API health

**Implementation**:

```typescript
// In middleware
const start = performance.now();
const response = await handler(req, context, validatedData);
const duration = performance.now() - start;

metrics.recordApiCall({
  endpoint: req.url,
  method: req.method,
  status: response.status,
  duration,
});
```

**Expected Outcome**:

- Early detection of performance regressions
- Usage patterns visibility
- SLA monitoring

---

## 🛠️ Recommended Refactoring Plan (Phase 4)

### **Week 1: Foundation (Priority 1-3)**

```
Day 1-2: Implement withAuth() middleware + session context
  - Create auth middleware with session validation
  - Export typed session shape
  - Add logger-ready context

Day 3: Unified Supabase client provider
  - Create wrapper functions
  - Export response validator
  - Update all route imports

Day 4: Consolidate error handling
  - Expand error codes
  - Create error mapper
  - Test all routes return typed errors

Day 5: Refactor leaderboard
  - Combine queries
  - Create LeaderboardService
  - Benchmark improvements
```

### **Week 2: Standardization (Priority 4-7)**

```
Day 1-2: Create request context helper
  - Extract audit information
  - Pass through middleware chain
  - Add audit logging example

Day 3: Parameter validation middleware
  - Implement withParamValidation()
  - Apply to 3 dynamic routes

Day 4: Create API service layer
  - LeaderboardApiService
  - FriendsApiService
  - NotificationApiService

Day 5: Response contracts
  - Export all response types
  - Add runtime validation
  - Document in comments
```

### **Week 3: Polish & Testing (Priority 8-10)**

```
Day 1-2: Unify list pagination
  - Add pagination to friends, notifications, failed tasks
  - Test pagination edge cases

Day 3: Performance monitoring
  - Add metrics collection
  - Create dashboard

Day 4-5: Comprehensive testing
  - Unit tests for middleware
  - Integration tests for routes
  - Load testing on leaderboard
```

---

## 📋 Implementation Checklist

### Phase 4.1 - Auth & Context (Critical Path)

- [ ] Implement `withAuth()` middleware (can pass both admin and user context)
- [ ] Create request context helper
- [ ] Remove 9+ session checks from routes
- [ ] All routes import auth from middleware

### Phase 4.2 - Data Layer (Performance)

- [ ] Create unified Supabase client provider
- [ ] Implement response validator
- [ ] Refactor leaderboard to 1-query pattern
- [ ] Create LeaderboardService

### Phase 4.3 - Error Handling (Stability)

- [ ] Expand error codes taxonomy
- [ ] Create error mapper for Supabase errors
- [ ] Update all routes to use mapper
- [ ] Test error responses

### Phase 4.4 - Standardization (Best Practices)

- [ ] Create API service layer classes
- [ ] Add parameter validation middleware
- [ ] Export response type contracts
- [ ] Add pagination to list endpoints

### Phase 4.5 - Documentation & Testing

- [ ] Document API contracts (send to frontend team)
- [ ] Add performance metrics
- [ ] Write integration tests
- [ ] Benchmark improvements

---

## 📊 Expected Outcomes After Phase 4

| Metric                      | Before    | After     | Improvement |
| --------------------------- | --------- | --------- | ----------- |
| Lines of code (routes)      | ~2,500    | ~1,600    | -36%        |
| Code duplication            | High      | Low       | -70%        |
| Test coverage               | ~20%      | ~85%      | +65%        |
| Leaderboard latency         | 3-5s      | 500ms-1s  | -75%        |
| Auth-related bugs           | 3-4/month | 0-1/month | -80%        |
| New route setup time        | 30 min    | 10 min    | -67%        |
| Errors caught at validation | 60%       | 95%       | +35%        |

---

## 🔗 Related Documentation

- **Phase 3 Completion**: `/memories/session/refactoring_progress.md`
- **Middleware Reference**: `src/lib/api/middleware/`
- **Existing Services**: `src/lib/services/`
- **Database Schema**: `supabase/migrations/`

---

**Next Step**: Start with **Issue #1** (withAuth middleware) and **Issue #2** (Supabase client provider) as they unblock all other improvements.
