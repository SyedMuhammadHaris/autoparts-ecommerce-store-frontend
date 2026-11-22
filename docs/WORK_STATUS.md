# Work status

- Current phase: Phase 5; Phase 4 merge confirmed. Storage/private proof uploads deferred to final integration before deployment.
- Active branch: phase-5 in both repositories; feature-wise commits approved.
- Baseline: Frontend main 86a2aca; backend main 5b6050f; clean before branching.
- Current milestone: Reports 3a76be7, management 9731323 and CMS 3479eca committed; coupon promotions verified and ready for feature commit.
- Remaining approved sequence: Moderated verified-purchase reviews and notifications.
- Dependencies/environment: No additions for reporting; private environment files untouched.
- Business rules: One non-stacking merchandise coupon before tax/excluding shipping; explicit limits/dates/minimum; per-account limits require sign-in. One moderated review per product/account from delivered/completed purchase; email verification optional.
- Verification: 132 tests/26 suites passed; updated BFF suite 5 tests passed; lint, build, TypeScript and boundary checks passed. No new browser visual QA.
- PR status: Not pushed or PR-created by agent.
- Details: docs/phase-5.md.

## Previous work status (historical)


- Current phase: Phase 4. Previous page/component PR merged by user confirmation; local main baseline 857d1e2.
- Active branch: `phase-4` in both repositories; feature-wise commits authorized by user.
- Current milestone: Payments def7217, fulfillment d40455a and returns 74eb9a9 committed. Manual refund UI implemented/verified; feature commit authorized.
- Completed: Customer transfer instructions/reference form and review status, staff payment workspace, bank-account admin, separate forms and thin pages, allowlisted BFF routes.
- Dependencies/configuration: No new dependencies, lockfile changes or environment variables. Private environment files not opened or changed.
- Verification: 129 tests across 25 suites, lint, production build, TypeScript and server boundary checks passed. Backend 137 tests and configuration/migration/schema checks passed. Local page-shell/auth/ownership/CSRF HTTP smoke passed; services healthy. No new browser visual QA performed.
- Pending: User manually configures receiving bank details and explicit return policy. Private proof uploads await storage decision; Phase 4 not fully closed. Phase 5 not started.
- PR status: Phase 4 unpushed; user reviews and merges. Backend migrations/roles already applied locally. Merge backend before frontend, then confirm outcomes.
- Details: docs/phase-4.md.

## Historical work status


- Current phase: Phases 1–3 merged by user confirmation. Approved pre-Phase-4 forms/API/response refactor implemented and verified.
- Current milestone: Page/component separation implemented and verified; user approved the focused commit. Forms/API/toast PR merged by user confirmation.
- Active branch: Frontend `refactor/page-components`; backend unchanged.
- Current baseline: Frontend local main `f07da1b`, clean before creating the approved branch.
- Current scope: Thin route pages; feature components for account, optional verification, admin, home, catalog, product detail and order route handling; dedicated profile and checkout form components. Metadata and route configuration remain in pages. Existing auth/admin/filter forms reused. No dependency, lockfile, environment or backend changes.
- Current PR status: Page/component refactor verified and approved for commit on refactor/page-components. Awaiting user push, PR review and merge confirmation. No push or PR creation by agent.
- Current verification: Docker lint, 111 tests across 20 suites, production build, TypeScript and compiler server-only boundary probe passed. Added account/profile update coverage; existing checkout/admin/OTP/toast regressions pass. No new browser visual QA. See docs/page-components.md.
- Historical refactor baseline: Frontend main `8e9eaa9` (Phase 3 PR #6); backend main `bd17d12` (Phase 3 PR #8). Both were clean before that branch.
- Authorization: User approved branches, exact packages, lockfile updates, Docker installations/builds and migration scope.
- Previous Git/PR status: Core frontend/backend commits c462f3a / 26d3bd0 and frontend toast commit 676c48f merged by user confirmation. No push or PR creation by agent.
- Toast scope approved: react-toastify 11.2.0 and transitive clsx 2.1.1; Docker lockfile/install/build changes on the current branch. One root container, shared API success/error notifications, query-error deduplication and preserved inline validation/recovery. No backend/environment changes. See docs/toast-notifications.md.

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

- Toast follow-up: 110 tests across 20 suites passed in Docker, including real ToastContainer accessibility, deduplication, safe error text, authentication cleanup, mutation messages and query retry notifications. Lint, production build, TypeScript and server-only boundary checks passed. No new native-browser visual QA was performed.
- Toast installation added only react-toastify 11.2.0 and required transitive clsx 2.1.1. Local frontend dependency volume refreshed and preview service healthy at http://localhost:3000. Backend working tree unchanged; backend tests below are the prior core-refactor results.
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
