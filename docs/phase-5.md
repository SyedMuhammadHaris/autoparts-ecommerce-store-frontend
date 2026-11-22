# Phase 5: administration and content

Both repositories use phase-5, with feature-wise commits. Phase 4 merge confirmed.
Storage/private proof uploads deferred to final integration before deployment.

## Dashboard and reports

Thin `/admin/dashboard` page renders ReportWorkspace, with separate filter form,
summary and CSV export components. React Hook Form/Zod validates dates/threshold;
TanStack Query/shared transport preserves private cache/auth/error behavior.
The BFF allows only dashboard/orders-export GET routes and bounded filter values.
Explicit view/export permissions enforced by Django and reflected in the UI.

Inclusive UTC dates, at most 366 days. Low stock is current stock rather than
historical stock for the selected date range. Order creation/value metrics are
separate from payment/refund event totals; labels explain these distinctions.
CSV exports exclude customer contact/address/receipt data and cap at 1000 rows.
Files download in the browser; no new storage/provider or package is introduced.

## Remaining approved milestones

Staff/customer/audit management; fixed-layout CMS; one-coupon promotions;
moderated verified-purchase reviews; durable optional-SMTP notifications.
Existing thin pages, separate forms, API toasts, CSRF, RBAC, backend authority,
optional email verification and checkout recovery remain requirements.

## Staff/customer/audit management

`/admin/customers` separates search, pagination, account detail/registered orders
and account status form. View/manage permissions differ; staff/superusers are
excluded. Guest orders are never claimed by matching email. The existing staff
editor searches users, protects superuser controls, manages allowlisted roles and
enables/disables non-superusers. Disabling revokes sessions. Audit tab adds exact
validated filters. BFF customer reads and status actions have separate method lists.

136 frontend tests/27 suites, updated BFF suite 6, lint/build/TypeScript passed.
Backend account/catalog/auth suite 33 and updated account suite 4 passed. Local
customer permissions migrated; no real accounts modified by verification.

## Fixed-layout CMS

Content pages, active banners/homepage sections and public store contact settings
use existing audited admin forms, with length metadata and explicit draft defaults.
HomeContent/ContentFooter load published content server-side with the same no-store
transport. HomeScreen remains a pure presentation component with its original
fallback. Body text is escaped and banner links are allowlisted; no raw HTML or
page builder. `/pages/[slug]` has a thin server route/metadata delegate and preflight
for real 404/503 responses. No uploads or storage dependency.

Content Editor role is isolated from payments/staff controls. Public home displays
up to 5 active banners, 8 sections and 50 page links. Dynamic root footer loading
means routes render dynamically; Phase 6 will address cache/performance strategy.
142 frontend tests/29 suites and 21 backend content/catalog/account tests passed;
lint/build/TypeScript passed. No live content/contact details seeded.

## Coupon promotions

Coupon code is an optional field in the existing checkout form. It stays outside
the address payload and is omitted when empty, preserving existing replay bodies.
Review/placement use backend-calculated discount/tax; shipping is excluded and
tax labels identify discounted merchandise. Order confirmations show the snapshot
code. Admin coupon configuration requires explicit dates/minimum/usage limits;
guest-compatible codes leave per-account limit blank. Store Manager controls offers.

Pending usage slots release only on unpaid cancellation/expiry; confirmed orders
and refunds retain usage. Checkout recovery and exact retry payloads remain intact.
144 frontend tests/30 suites and 26 backend promotion/checkout tests passed, including
concurrent final-use claims. Lint/build/TypeScript passed; no coupons seeded locally.

## Reviews

ProductReviews separates anonymous published reads from authenticated owner APIs;
ReviewForm submits only public display name/rating/title/body and explains moderation.
One review per verified purchaser/product; email verification remains optional.
Editing returns content to pending. Staff review filters and ReviewModerationForm
send the displayed revision, so stale decisions cannot approve newer unseen content.
Generic admin editor rendering moved into AdminResourceEditor to keep form selection
readable as more resource-specific workflows are added.

148 frontend tests/32 suites and 14 backend review/content/promotion tests passed;
lint/build/TypeScript passed. Public API and private owner BFF methods are separate.

## Durable notifications and final verification

Transactional outbox consumption creates one immutable notification per event.
Registered inboxes and guest-owned order notices enforce ownership; read updates
are idempotent. Admin template editing and failed/disabled delivery retry require
explicit permissions. Templates are plain text and accept only order_reference
and event_label placeholders. Delivery metadata never exposes recipient addresses.

Optional backend ORDER_EMAIL_ENABLED defaults to false. Leave it disabled for
local testing. Before enabling, manually configure existing SMTP variables in
.local.env (EMAIL_HOST, DEFAULT_FROM_EMAIL, provider credentials/port/TLS as needed).
No frontend environment additions. Private environment files were not inspected.
Celery polls durable pending deliveries with leases, bounded attempts and backoff;
SMTP happens outside database locks. SMTP is at least once: a crash after provider
acceptance can cause a duplicate. Disabled historical deliveries require explicit
staff retry after enabling SMTP. Inactive-account delivery is suppressed.

Final regression: backend 169 tests passed, including concurrency, ownership,
moderation, coupon release/retention and notification lease/retry cases. Ruff,
format, Django and migration checks passed. Frontend 151 tests in 34 suites,
lint, production build, TypeScript and server boundary checks passed.
No new dependencies, lockfile changes, real email, payment, courier or cloud calls.
No browser visual QA performed. Phase 6 should assess performance/cache strategy,
accessibility, security and SEO. CSV exports remain capped at 1,000 rows; reporting
uses explicit date/current-state semantics. Storage and private proof uploads remain
deferred until final integration before production deployment in Phase 7.

Local HTTP smoke passed: health/content and home/admin-dashboard/account-notifications page shells returned 200; anonymous private notification/report APIs returned 401; cross-origin BFF notification mutation returned 403. Initial backend requests preceded startup readiness; repeated checks passed after readiness. Local migrations and role bootstrap completed; ORDER_EMAIL_ENABLED verified false.
