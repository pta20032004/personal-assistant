# Implementation Plan: Personal Assistant Web

## Overview

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

The plan is sequenced so that each task builds on the previous: foundational scaffolding → config/i18n/db → auth → middleware → services → route handlers → UI → property/integration/e2e tests → CI/deploy. Implementation language is **TypeScript** (Next.js App Router on Node.js runtime) as defined in the design document. Property-based tests use `fast-check` and are first-class deliverables, with one sub-task per correctness property from the design.

## Tasks

- [x] 1. Bootstrap Next.js + TypeScript project skeleton
  - [x] 1.1 Initialize Next.js App Router project with TypeScript, ESLint, Prettier
    - Create `package.json`, `tsconfig.json`, `next.config.mjs`, `.eslintrc.cjs`, `.prettierrc`, `.gitignore`
    - Add scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `e2e`, `i18n:check`, `vercel-build`
    - Create `app/layout.tsx`, `app/page.tsx` placeholders
    - _Requirements: 8.1_

  - [x] 1.2 Install and configure test tooling (vitest, fast-check, Playwright)
    - Add `vitest`, `@vitest/coverage-v8`, `fast-check`, `@playwright/test` as devDependencies
    - Create `vitest.config.ts` with `TZ=Asia/Ho_Chi_Minh` and `--run` mode for CI
    - Create `playwright.config.ts` with chromium project, baseURL, webServer config
    - Create `e2e/` and `lib/testing/` directory placeholders
    - _Requirements: 8.1_

  - [x] 1.3 Create directory layout for app, lib, prisma, scripts
    - Create `app/api/`, `app/(protected)/`, `app/login/`, `lib/services/`, `lib/integrations/`, `lib/db/`, `lib/i18n/`, `lib/bootstrap/`, `lib/auth/`, `lib/csrf/`, `lib/ratelimit/`, `prisma/`, `scripts/`
    - Add empty `index.ts` barrel files where appropriate
    - _Requirements: 8.1_

- [ ] 2. Configuration, env validation, and Prisma schema
  - [x] 2.1 Implement `lib/config.ts` with Zod env schema and `ConfigError`
    - Define `RequiredEnv` Zod schema (DATABASE_URL, SESSION_SECRET, OWNER_USERNAME, OWNER_PASSWORD, optional KV_*, optional GOOGLE_NEWS_*)
    - Throw `ConfigError` containing the list of missing variable names (no values) when parse fails
    - Export memoized `getConfig()` accessor for runtime modules
    - _Requirements: 8.3, 8.6_

  - [ ]* 2.2 Write property test for env validation
    - **Property 34: Missing env vars => 503**
    - **Validates: Requirements 8.6**
    - Generate random env subsets missing one or more required vars, assert `ConfigError` lists exactly the missing names and never echoes their values
    - _Requirements: 8.6_

  - [x] 2.3 Author `prisma/schema.prisma` with Owner, Todo, Meeting, Project, AuthEvent
    - Define enums `TodoStatus` and `ProjectStatus`
    - Add `@@index` declarations per design (ownerId+updatedAt, ownerId+startTime, etc.)
    - Configure datasource for Vercel Postgres
    - _Requirements: 2.1, 3.1, 4.1, 8.2_

  - [x] 2.4 Generate initial migration and add Meeting `endTime >= startTime` CHECK constraint
    - Run `prisma migrate dev --name init` to create baseline migration
    - Add a follow-up migration containing raw SQL `ALTER TABLE "Meeting" ADD CONSTRAINT meeting_end_after_start CHECK ("endTime" >= "startTime")`
    - _Requirements: 3.1, 3.2, 8.4_

  - [ ] 2.5 Implement `lib/db/prisma.ts` Prisma client singleton
    - Reuse client across hot reloads in dev, single instance per Lambda in production
    - Export typed helpers `withOwner(ownerId)` if useful
    - _Requirements: 8.2_

- [x] 3. i18n catalog and time formatting
  - [x] 3.1 Implement `lib/i18n/catalog.ts` with `vi` and `en` JSON dictionaries
    - Create `lib/i18n/messages.vi.json` and `lib/i18n/messages.en.json` with keys for nav, auth, todos, meetings, projects, hpg, news, errors, validation
    - Export `I18nCatalog` with `t`, `has`, `allKeys`, `isComplete`
    - On missing key, return key string and emit `WARN` log
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 3.2 Implement `formatDateTime(date, locale)` helper
    - Use `Intl.DateTimeFormat(locale, { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' })`
    - Export from `lib/i18n/catalog.ts`
    - _Requirements: 7.5_

  - [x] 3.3 Implement `scripts/check-i18n.ts` and wire `pnpm i18n:check`
    - Script imports catalog and exits non-zero if `isComplete()` is false
    - Print missing keys grouped by locale
    - _Requirements: 7.3_

  - [ ]* 3.4 Write property test for i18n key completeness
    - **Property 29: i18n key completeness**
    - **Validates: Requirements 7.3**
    - Iterate over `allKeys()`, assert `t(key, 'vi')` and `t(key, 'en')` are non-empty strings
    - _Requirements: 7.3_

  - [ ]* 3.5 Write property test for time formatting timezone consistency
    - **Property 31: Time formatting timezone**
    - **Validates: Requirements 7.5**
    - Generate random `Date` values, assert `formatDateTime` output equals an `Intl.DateTimeFormat` reference run in `Asia/Ho_Chi_Minh`, and equal-instant inputs produce identical output
    - _Requirements: 7.5_

- [ ] 4. Auth primitives, owner bootstrap, rate limiting
  - [ ] 4.1 Implement `lib/auth/password.ts` with bcrypt hashing
    - `hashPassword(plain)` uses `bcrypt.hash(plain, 12)`
    - `verifyPassword(plain, hash)` wraps `bcrypt.compare`
    - _Requirements: 1.4, 8.5_

  - [ ]* 4.2 Write property test for bcrypt password hashing
    - **Property 1: Bcrypt password hashing**
    - **Validates: Requirements 1.4, 8.5**
    - Generate plaintext strings (length 1..200), assert hash starts with `$2`, cost ≥ 10, `verifyPassword` returns true, hash !== plain
    - _Requirements: 1.4, 8.5_

  - [ ] 4.3 Implement `lib/auth/session.ts` using iron-session
    - Configure `pa_session` cookie HTTP-only, Secure, SameSite=Lax, max-age 8h
    - Export `getSession(req)`, `createSession(payload)`, `destroySession(req)`
    - Define `SessionPayload = { ownerId: string; issuedAt: number }`
    - _Requirements: 1.1, 1.5_

  - [ ] 4.4 Implement `lib/ratelimit/loginLimiter.ts` (Upstash KV + in-memory fallback)
    - Use `@upstash/ratelimit` sliding window 10 minutes when `KV_REST_API_URL` is set
    - Fallback to in-memory LRU map when KV is unavailable (dev/test)
    - Block 15 minutes after 5 failures within window; expose `recordFailure(ip)`, `isBlocked(ip)`, `clear(ip)`
    - _Requirements: 1.6_

  - [ ] 4.5 Implement `lib/bootstrap/seedOwner.ts`
    - On lazy first call, ensure `Owner` table contains exactly one row matching `OWNER_USERNAME` with bcrypt-hashed `OWNER_PASSWORD`
    - Idempotent: re-running with same env does not duplicate rows or rotate hash
    - _Requirements: 8.5_

  - [ ]* 4.6 Write property test for owner bootstrap idempotence
    - **Property 33: Owner bootstrap idempotence**
    - **Validates: Requirements 8.5**
    - Run `seedOwner()` n≥1 times against an in-memory Prisma test DB, assert exactly one Owner exists and password verifies
    - _Requirements: 8.5_

  - [ ] 4.7 Implement `AuthService` in `lib/services/AuthService.ts`
    - Methods: `login`, `logout`, `verifySession`, `hashPassword`, `recordLoginAttempt`, `isIpBlocked`
    - On `login`, check rate limiter first; on failure return `{ ok: false, reason: 'rate_limited' }`
    - On invalid creds return `{ ok: false, reason: 'invalid_credentials' }` for both wrong username and wrong password
    - Always write an `AuthEvent` row (login_success / login_failure / logout)
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 9.4_

  - [ ]* 4.8 Write property test for successful login round-trip
    - **Property 2: Successful login round-trip**
    - **Validates: Requirements 1.1**
    - With seeded Owner, assert `login` returns `ok: true` with correct `ownerId` and `verifySession(serialize(payload))` returns the same payload
    - _Requirements: 1.1_

  - [ ]* 4.9 Write property test for invalid credential rejection (no field leak)
    - **Property 3: Login rejects all non-matching credential pairs without leaking which field is wrong**
    - **Validates: Requirements 1.2**
    - Generate random `(u, p)` mismatching either field, assert single shared `reason: 'invalid_credentials'`
    - _Requirements: 1.2_

  - [ ]* 4.10 Write property test for logout invalidating sessions
    - **Property 4: Logout invalidates session**
    - **Validates: Requirements 1.5**
    - For any session payload from `login`, after `logout`, `verifySession` returns `null`
    - _Requirements: 1.5_

  - [ ]* 4.11 Write property test for failed-login rate limiting
    - **Property 5: Rate-limit on failed logins**
    - **Validates: Requirements 1.6**
    - Drive limiter via injected clock + counter; for n≥5 failures within 10 min, all subsequent logins from that IP for 15 min return `reason: 'rate_limited'` even with valid credentials
    - _Requirements: 1.6_

  - [ ]* 4.12 Write property test for AuthEvent logging
    - **Property 35: AuthEvent logging**
    - **Validates: Requirements 9.4**
    - For every `login` (success/failure) or `logout`, exactly one `AuthEvent` row is created with correct `type`, non-empty `ip`, valid `occurredAt`, and the log payload contains no substring of the plaintext password
    - _Requirements: 9.4_

- [ ] 5. CSRF and middleware
  - [ ] 5.1 Implement `lib/csrf/token.ts` double-submit token utilities
    - `issueToken()` returns a base64url 32-byte random token
    - `verify(cookieToken, headerToken)` performs constant-time comparison
    - _Requirements: 9.3_

  - [ ] 5.2 Implement `middleware.ts` (auth gate, CSRF, login rate limit, 503 on bad config)
    - Order: config check → public allow-list → session gate → CSRF check on mutating methods → login rate limit on `/api/auth/login`
    - Return 401 for `/api/*` without session, 302 to `/login?next=` for HTML
    - Return 503 with `{ error: { code: 'service_unavailable', missing: [...] } }` when `ConfigError` is detected
    - _Requirements: 1.3, 8.6, 9.1, 9.3_

  - [ ]* 5.3 Write property test for auth gate
    - **Property 6: Auth gate**
    - **Validates: Requirements 1.3, 9.1**
    - Generate random `(method, path)` outside the public allow-list with no session cookie, assert middleware returns 401 for `/api/*` and 302 for HTML, and no service handler is invoked
    - _Requirements: 1.3, 9.1_

  - [ ]* 5.4 Write property test for CSRF on mutating requests
    - **Property 32: CSRF protection trên mọi mutating request**
    - **Validates: Requirements 9.3**
    - Generate `(method, path)` with `method ∈ {POST, PUT, PATCH, DELETE}` plus missing/mismatched cookie/header combinations, assert 403 and handler not invoked
    - _Requirements: 9.3_

- [ ] 6. Checkpoint - Foundational layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Domain services: Todo, Meeting, Project
  - [ ] 7.1 Implement `lib/services/TodoService.ts`
    - `create`, `update`, `delete`, `listForDashboard`, `listByProject`
    - Zod schemas for `CreateTodoInput` (title trim 1..200, status enum, projectId optional) and `UpdateTodoInput`
    - Every query scopes by `ownerId`; missing record raises `NotFoundError`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [ ]* 7.2 Write property test for Todo title validation
    - **Property 9: Todo title validation**
    - **Validates: Requirements 2.1, 2.2**
    - Generate strings of varied lengths and whitespace, assert accept iff `s.trim().length ∈ [1, 200]`
    - _Requirements: 2.1, 2.2_

  - [ ]* 7.3 Write property test for Todo status enum invariant
    - **Property 10: Todo status enum invariant**
    - **Validates: Requirements 2.1, 2.3, 2.4**
    - Generate valid and invalid status strings, assert acceptance matches enum membership and `updatedAt` strictly increases on accepted updates
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ]* 7.4 Write property test for Todo dashboard listing
    - **Property 11: Todo dashboard listing**
    - **Validates: Requirements 2.5, 2.6**
    - Seed varying todo sets (some deleted), assert `listForDashboard` returns only non-deleted, sorted desc by `updatedAt`
    - _Requirements: 2.5, 2.6_

  - [ ]* 7.5 Write property test for Project linkage on todo creation
    - **Property 12: Project linkage on todo creation**
    - **Validates: Requirements 2.7, 4.7**
    - For project `P`, todo created with `projectId = P.id` keeps that link; with `undefined`/`null` it stores `null`
    - _Requirements: 2.7, 4.7_

  - [ ] 7.6 Implement `lib/services/MeetingService.ts`
    - `create`, `update`, `delete`, `listUpcoming`
    - Zod validation: `endTime >= startTime`, `attendees` length ≤ 50, each element trim ∈ [1, 100]
    - Update field allow-list: only `title`, `startTime`, `endTime`, `attendees`, `notes`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 7.7 Write property test for Meeting time validation
    - **Property 13: Meeting time validation**
    - **Validates: Requirements 3.1, 3.2**
    - Generate `(start, end)` pairs, assert accept iff `end >= start`
    - _Requirements: 3.1, 3.2_

  - [ ]* 7.8 Write property test for Meeting attendees validation
    - **Property 14: Meeting attendees validation**
    - **Validates: Requirements 3.6**
    - Generate attendee arrays of varied length and element length, assert accept iff length ≤ 50 and each element trim ∈ [1, 100]
    - _Requirements: 3.6_

  - [ ]* 7.9 Write property test for Meeting update field allow-list
    - **Property 15: Meeting update field allow-list**
    - **Validates: Requirements 3.3**
    - For arbitrary patch objects, assert fields outside the allow-list are unchanged and `updatedAt` strictly increases
    - _Requirements: 3.3_

  - [ ]* 7.10 Write property test for Meeting upcoming listing
    - **Property 16: Meeting upcoming listing**
    - **Validates: Requirements 3.4, 3.5**
    - Seed varied meetings + arbitrary `now`, assert `listUpcoming` returns exactly those with `endTime >= now` sorted asc by `startTime`
    - _Requirements: 3.4, 3.5_

  - [ ] 7.11 Implement `lib/services/ProjectService.ts`
    - `create`, `update`, `delete` (transactional detach), `getDetail`, `listInProgress`
    - Zod validation: `name.trim().length >= 1`, `status ∈ ProjectStatus`
    - `delete` runs `prisma.$transaction` to set `Todo.projectId = null` then delete project
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 7.12 Write property test for Project name and status validation
    - **Property 17: Project name and status validation**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Generate names + statuses, assert acceptance rules and default `planned` when status absent
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 7.13 Write property test for Project detail consistency
    - **Property 18: Project detail consistency**
    - **Validates: Requirements 4.4**
    - Seed projects + todos, assert `getDetail.todos` matches todos with that `projectId`, sorted desc by `updatedAt`
    - _Requirements: 4.4_

  - [ ]* 7.14 Write property test for Project deletion detaching todos
    - **Property 19: Project deletion detaches todos and preserves them**
    - **Validates: Requirements 4.5**
    - For project `P` and its todo set `T`, after `delete(ownerId, P.id)`: project is gone, todos preserved with `projectId = null`, total todo count unchanged
    - _Requirements: 4.5_

  - [ ]* 7.15 Write property test for Dashboard project listing
    - **Property 20: Dashboard project listing**
    - **Validates: Requirements 4.6**
    - Generate project sets, assert `listInProgress` returns exactly those with `status === 'in_progress'`, sorted desc by `updatedAt`
    - _Requirements: 4.6_

  - [ ]* 7.16 Write property test for ownership invariant across services
    - **Property 7: Ownership invariant cho mọi entity**
    - **Validates: Requirements 9.2**
    - Set up two owners A, B; seed records under A; for every Todo/Meeting/Project service method called with B, assert `NotFoundError` and DB state unchanged
    - _Requirements: 9.2_

  - [ ]* 7.17 Write property test for single-owner uniqueness
    - **Property 8: Single-owner uniqueness**
    - **Validates: Requirements 8.5, 9.2**
    - Apply random sequences of CRUD ops, assert `count(Owner) ≤ 1` and every Todo/Meeting/Project references the same `ownerId`
    - _Requirements: 8.5, 9.2_

- [ ] 8. External integrations: HPG quote and News
  - [ ] 8.1 Implement TCBS provider adapter in `lib/integrations/tcbsProvider.ts`
    - `fetch(): Promise<HpgQuote>` calls `https://apipubaws.tcbs.com.vn/stock-insight/v1/stock/bars-long-term` with `AbortController` 5s timeout
    - Map response into `HpgQuote` with `symbol: 'HPG'`, `source: 'VnStock'`
    - _Requirements: 5.1, 5.5_

  - [ ] 8.2 Implement `lib/services/HpgQuoteService.ts` with 60s cache and stale fallback
    - In-memory cache keyed singleton, TTL based on `quote.asOfTime`
    - On upstream error or timeout: return cached quote with `stale: true`, or `{ ok: false, reason: 'unavailable' }`
    - Provider injected via `HpgQuoteProvider` interface for testability
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 8.3 Write property test for HPG quote shape
    - **Property 21: HPG quote shape**
    - **Validates: Requirements 5.1**
    - Mock provider returns valid payloads, assert `quote.symbol === 'HPG'`, `source === 'VnStock'`, finite numeric fields, valid `asOfTime`
    - _Requirements: 5.1_

  - [ ]* 8.4 Write property test for HPG cache TTL
    - **Property 22: HPG cache TTL 60 giây**
    - **Validates: Requirements 5.2**
    - Inject `Clock` and counting provider; assert provider called 0 times within 60s window and exactly once after
    - _Requirements: 5.2_

  - [ ] 8.5 Implement `lib/integrations/newsKeywords.ts` and Google News RSS adapter
    - Static `News_Keyword_Set` for `(politics, vi)`, `(politics, en)`, `(policy, vi)`, `(policy, en)`
    - `fetchRss(query, lang, country)` parses XML via `fast-xml-parser`, maps to raw items annotated with category + language
    - _Requirements: 6.2, 6.3_

  - [ ] 8.6 Implement `lib/services/NewsService.ts` with dedupe, 24h window, sort, 10min cache
    - Fan out queries via `Promise.allSettled` with 8s total `AbortController`
    - Dedupe by `url` keeping max `publishedAt`, filter `publishedAt >= now - 24h`, sort desc, slice 20
    - Cache TTL 10 minutes; on full upstream failure return cached items with `stale: true` or `{ items: [], stale: false }` if no cache
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 8.7 Write property test for News cache TTL
    - **Property 23: News cache TTL 10 phút**
    - **Validates: Requirements 6.6**
    - Inject `Clock`; assert no upstream call within 10 min, exactly one after
    - _Requirements: 6.6_

  - [ ]* 8.8 Write property test for stale fallback on upstream failure
    - **Property 24: Stale fallback khi upstream lỗi**
    - **Validates: Requirements 5.3, 6.7**
    - Generate failure modes (timeout, 5xx, parse error, network); assert HPG returns cached `stale: true` or `unavailable`; News returns cached `stale: true` or `{ items: [], stale: false }`
    - _Requirements: 5.3, 6.7_

  - [ ]* 8.9 Write property test for News 24h window
    - **Property 25: News window 24h**
    - **Validates: Requirements 6.1**
    - Generate raw items with `publishedAt` inside/outside window, assert output retains only items `>= now - 24h`
    - _Requirements: 6.1_

  - [ ]* 8.10 Write property test for News deduplication
    - **Property 26: News deduplication**
    - **Validates: Requirements 6.4**
    - Generate input lists with duplicate URLs, assert distinct URLs in output and the kept item has the max `publishedAt` for that URL
    - _Requirements: 6.4_

  - [ ]* 8.11 Write property test for News ordering and limit
    - **Property 27: News ordering and limit**
    - **Validates: Requirements 6.5**
    - Generate large input lists, assert `items.length ≤ 20` and `publishedAt` sequence is non-increasing
    - _Requirements: 6.5_

  - [ ]* 8.12 Write property test for News category mapping
    - **Property 28: News category mapping**
    - **Validates: Requirements 6.2, 6.3**
    - With mocked fetch capturing issued queries, assert each output item's `category` matches its query group, and at least one query is issued per `(category, locale)` pair
    - _Requirements: 6.2, 6.3_

- [ ] 9. Checkpoint - Service layer
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Route Handlers under `app/api/`
  - [ ] 10.1 Implement `app/api/auth/login/route.ts` and `app/api/auth/logout/route.ts`
    - Login: parse body via Zod, call `AuthService.login`, set session + CSRF cookies on success
    - Logout: destroy session, write `AuthEvent`, clear cookies
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 9.4_

  - [ ] 10.2 Implement `app/api/todos/route.ts` and `app/api/todos/[id]/route.ts`
    - GET list (dashboard scope), POST create, PATCH update, DELETE
    - Map Zod errors to `{ ok: false, error: { code: 'validation', fields } }`
    - Map `NotFoundError` to 404
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1, 9.2_

  - [ ] 10.3 Implement `app/api/meetings/route.ts` and `app/api/meetings/[id]/route.ts`
    - GET upcoming, POST create, PATCH update (allow-list), DELETE
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.1, 9.2_

  - [ ] 10.4 Implement `app/api/projects/route.ts` and `app/api/projects/[id]/route.ts`
    - GET list in-progress, GET detail (project + todos), POST create, PATCH update, DELETE (detach todos in tx)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 9.1, 9.2_

  - [ ] 10.5 Implement `app/api/hpg/route.ts`
    - Calls `HpgQuoteService.getQuote(new Date())`, never invokes upstream from browser
    - Returns `{ quote, stale }` or `{ unavailable: true }`
    - _Requirements: 5.1, 5.5_

  - [ ] 10.6 Implement `app/api/news/route.ts`
    - Calls `NewsService.getRecentNews(now, locale)` based on locale cookie
    - Returns `{ items, stale }`
    - _Requirements: 6.1, 6.5, 6.7, 6.8_

- [ ] 11. UI: login, dashboard, project detail, locale switcher
  - [ ] 11.1 Implement `app/login/page.tsx` with login form
    - Client component posting to `/api/auth/login` with CSRF header
    - Localized error messages via `I18nCatalog.t`
    - _Requirements: 1.1, 1.2, 7.2, 7.3_

  - [ ] 11.2 Implement `app/(protected)/layout.tsx` with locale provider and locale switcher
    - Read locale from cookie, default `vi`; switcher updates cookie + reloads
    - _Requirements: 7.1, 7.2_

  - [ ] 11.3 Implement Dashboard `app/(protected)/page.tsx` widgets
    - Render Todos, Upcoming Meetings, In-progress Projects, HPG widget (with `as_of_time` + stale indicator), News widget (titles unchanged across locales, links open in new tab with `rel="noopener noreferrer"`)
    - Use Server Components to load via service layer; mutate via Route Handlers
    - _Requirements: 2.6, 3.5, 4.6, 5.4, 6.8, 7.4, 7.5_

  - [ ] 11.4 Implement Project detail page `app/(protected)/projects/[id]/page.tsx`
    - Show project info + linked todos (`getDetail`), with inline create-todo form auto-binding `projectId`
    - _Requirements: 4.4, 4.7_

  - [ ]* 11.5 Write component test for News passthrough (no auto-translation)
    - **Property 30: News passthrough (no auto-translation)**
    - **Validates: Requirements 7.4**
    - Render News component with arbitrary item across both locales, assert DOM contains byte-exact `title` and `source`
    - _Requirements: 7.4_

- [ ] 12. Integration tests for Route Handlers
  - [ ] 12.1 Set up Prisma test harness (SQLite in-memory or Postgres testcontainer)
    - Add `lib/testing/prismaTest.ts` to spin up DB, run `prisma migrate deploy`, seed Owner + CSRF token
    - Provide `makeRequest({ method, path, session, csrf, body })` helper using `next-test-api-route-handler`
    - _Requirements: 8.4_

  - [ ] 12.2 Write integration tests for `/api/auth/login`
    - Happy path, wrong password, IP blocked after 5 failures
    - _Requirements: 1.1, 1.2, 1.6, 9.4_

  - [ ] 12.3 Write integration tests for `/api/todos`
    - 403 without CSRF, 200 with CSRF + session, 404 with foreign owner, 400 on validation error
    - _Requirements: 2.1, 2.2, 9.1, 9.2, 9.3_

  - [ ] 12.4 Write integration tests for `/api/meetings`
    - 400 when `endTime < startTime`, attendee bounds, allow-list update
    - _Requirements: 3.1, 3.2, 3.3, 3.6_

  - [ ] 12.5 Write integration tests for `/api/projects`
    - DELETE detaches all linked todos to `projectId = null` (assert via direct Prisma query)
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ] 12.6 Write integration tests for `/api/hpg` and `/api/news`
    - Mock providers; assert cache reuse on 2nd request, stale flag on upstream failure, dedupe + 24h on news
    - _Requirements: 5.2, 5.3, 6.1, 6.4, 6.6, 6.7_

- [ ] 13. End-to-end smoke (Playwright)
  - [ ] 13.1 Implement `e2e/smoke.spec.ts` covering full user flow
    - Visit `/` unauthenticated → redirect `/login`
    - Login with test credentials, assert dashboard widgets render, default locale is `vi`
    - Create Todo, create Meeting, open Project detail, create Todo inside project, switch locale to `en` (verify labels change but news titles unchanged), logout → redirect `/login`
    - Use MSW or fixture HTTP interceptors for VnStock and Google News so smoke does not hit real upstreams
    - _Requirements: 1.1, 1.3, 1.5, 2.1, 3.1, 4.4, 4.7, 7.1, 7.2, 7.4_

- [ ] 14. CI pipeline and Vercel deployment config
  - [ ] 14.1 Add GitHub Actions workflow `.github/workflows/ci.yml`
    - Steps: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-empty --exit-code`, `pnpm i18n:check`, `pnpm test --run`, `pnpm exec playwright install --with-deps`, `pnpm e2e --project=chromium`
    - Set `TZ=Asia/Ho_Chi_Minh` for all jobs
    - _Requirements: 7.3, 7.5, 8.4_

  - [ ] 14.2 Configure Vercel build + runtime
    - Add `vercel.json` with `buildCommand` invoking `pnpm vercel-build`
    - Define `vercel-build` script as `prisma migrate deploy && next build`
    - Document required env vars (DATABASE_URL, SESSION_SECRET, OWNER_USERNAME, OWNER_PASSWORD, KV_*) in `README.md`
    - _Requirements: 8.1, 8.3, 8.4, 8.5, 8.6_

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP, but the property tests collectively cover all 35 correctness properties from `design.md` and are the primary mechanism for proving the requirements.
- Each task references the specific requirement IDs it advances and, where applicable, the property number from the design.
- Property tests are placed close to the implementation tasks they validate so failures are caught early.
- Integration tests run against a real Prisma-backed DB (SQLite in-memory or Postgres testcontainer) to validate Route Handler behavior including CSRF, ownership, and validation responses.
- Playwright smoke runs with mocked external HTTP so it is deterministic and never depends on VnStock or Google News uptime.
- `prisma migrate deploy` runs as part of `vercel-build` so production DB schema is updated before traffic is served.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.3", "3.1"] },
    { "id": 3, "tasks": ["2.2", "2.4", "3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["2.5", "3.5", "4.1", "4.3", "4.4"] },
    { "id": 5, "tasks": ["4.2", "4.5", "5.1", "8.1", "8.5"] },
    { "id": 6, "tasks": ["4.6", "4.7", "5.2", "8.2", "8.6"] },
    { "id": 7, "tasks": ["4.8", "4.9", "4.10", "4.11", "4.12", "5.3", "5.4", "7.1", "7.6", "7.11", "8.3", "8.4", "8.7", "8.8", "8.9", "8.10", "8.11", "8.12"] },
    { "id": 8, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.7", "7.8", "7.9", "7.10", "7.12", "7.13", "7.14", "7.15", "7.16", "7.17", "10.1", "10.2", "10.3", "10.4", "10.5", "10.6"] },
    { "id": 9, "tasks": ["11.1", "11.2", "12.1"] },
    { "id": 10, "tasks": ["11.3", "11.4", "12.2", "12.3", "12.4", "12.5", "12.6"] },
    { "id": 11, "tasks": ["11.5", "13.1"] },
    { "id": 12, "tasks": ["14.1", "14.2"] }
  ]
}
```
