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
