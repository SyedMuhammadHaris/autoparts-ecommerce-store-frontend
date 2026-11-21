# Work status

- Current phase: Phases 1–3 merged by user confirmation. Approved pre-Phase-4 forms/API/response refactor implemented and verified.
- Current milestone: RHF/Zod forms, TanStack Query and coordinated response transport complete; user approved commits in both repositories.
- Active branch: `refactor/forms-api-responses` in both repositories.
- Baseline: Frontend main `8e9eaa9` (Phase 3 PR #6); backend main `bd17d12` (Phase 3 PR #8). Both were clean before branching.
- Authorization: User approved branches, exact packages, lockfile updates, Docker installations/builds and migration scope.
- Git/PR status: User explicitly approved commits; this change records the verified implementation and handoff. Nothing pushed and no PR created. Prior Phase 3 merges confirmed; wait for confirmation of this refactor's outcomes.

## Completed refactor

- React Hook Form/useForm plus Zod/resolvers for login/signup, profile, OTP, checkout, admin records/roles/stock and catalog filters. Shared schemas and accessible error announcements; contact text trims, passwords do not.
- Admin resource metadata, schema generation and focused form components separated. Editors wait for dependent choices. Immutable update fields omitted; optional foreign keys become null; explicit zero tax remains zero and blank tax remains unconfigured.
- TanStack Query replaces component API-fetch effects: account/nav, cart/count, vehicle lookups, admin records/choices, checkout/recovery and private orders. Abort signals, related-query invalidation and error/loading states retained.
- Query provider isolated per tree/request; no module-global SSR cache or persistent private cache. Authentication changes clear/remount caches. Sign-in resets active queries before merge; authorization failures hide stale private data. Passwords are not cached as mutation variables.
- Shared clientFetch/apiAction supports allowed HTTP verbs, encoded dynamic segments and query parameters. Fixed same-origin BFF routes/CSRF remain. Shared serverFetch retains fixed backend destinations, no-store, redirect rejection, timeout and server-only credentials.
- API response decoding centralized. HTTP status, machine error code, normalized field errors and request ID retained. NextAuth keeps its native SDK protocol; 204 remains bodyless. BFF-generated errors use the same application envelope.
- Server catalog/health and NextAuth login/refresh/logout migrated. All client business payloads and Django ownership/permission/pricing decisions unchanged.
- Checkout mutations never auto-retry. Ambiguous failures retain exact body/key; reload resolves the prior attempt before another checkout. Only the attempt key is stored in sessionStorage.
- Stock adjustment keys stable for identical normalized retries. Catalog URL submission retains GET navigation and server-rendered products. Vehicle queries are dependent/keyed/cancellable.
- AGENTS, README, migration/review docs and smoke scripts updated. Legacy apiRequest is only a forwarding facade; components use new helpers/hooks.

## Approved dependencies and configuration

- react-hook-form 7.92.0, zod 4.6.7, @hookform/resolvers 7.0.8, @tanstack/react-query 5.108.2.
- Required transitives: @tanstack/query-core 5.108.2 and @standard-schema/utils 0.3.0. Zod was already transitive and is now direct. npm relocated existing ESLint Ajv/json-schema-traverse without version changes.
- No Axios, other validator, devtools or extra service. Existing unrelated pins retained. Lockfile generated and dependencies installed only inside Docker; existing frontend dependency volume refreshed deliberately.
- No environment additions. Private .env.local and backend .local.env never opened or modified; runtime services load existing confirmed configuration.
- Existing local test tax/reservation/COD policy unchanged. Payment verification/fulfillment and image-provider selection remain future work.

## Verification

- 100 frontend tests across 18 suites passed in 8.371s; lint, production build, TypeScript and actual compiler server-only boundary probe passed in Docker.
- Tests cover transport verbs/query/path encoding/CSRF/error parsing, form schemas, explicit zero tax, year ranges, auth cache reset/access denial, optional OTP, RBAC, vehicle selection, checkout stable retry/recovery and order cancellation.
- Matching backend: 113 tests passed on disposable PostgreSQL; Ruff/format/Django/migration consistency passed with no schema changes.
- Live Phase 2/3 BFF smoke passed: signup/profile, RBAC, catalog/vehicle detail/statuses, stock adjustment replay, guest/customer merge, quote/checkout replay/recovery, privacy/cancellation and actual scheduled expiry/outbox.
- Live JWT acceptance passed: concurrent refresh, old-refresh replay rejection, no token disclosure in browser session and immediate logout revocation.
- Actual PostgreSQL/Redis/Celery diagnostic round trip passed. Synthetic accounts/records/tokens cleaned up. No real email/payment/upload/deployment actions.
- This refactor has no new native-browser visual QA claim; component/accessibility-sensitive interactions are covered by RTL. Prior Phase 3 visual evidence remains historical only.

## Review and next step

- Important files: src/lib/api/, src/lib/server/fetch.ts and configuration/response helpers, src/lib/query/, src/lib/forms/, focused admin/catalog forms, existing account/cart/checkout/order components, BFF routes, package manifests/lock and tests.
- Details: docs/forms-api-migration.md; draft PR body: docs/forms-api-migration-pr.md.
- Merge backend first, then frontend; update both runtime services together for the envelope contract. No DB migration or new env required.
- Next: User pushes and reviews both branches/PRs, then confirms outcomes before Phase 4 approval.
- Accepted existing limits remain: NextAuth v4 maintenance mode, ESLint 9 EOL, local shared-IP throttling and single-process refresh coordination before deployment/replicas.
