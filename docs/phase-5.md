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
