Implements Phase 2 signup/login, customer accounts, optional email OTP and a server-rendered automotive catalog with search, category/brand/price filters, sorting, pagination and variant availability. Users can skip verification and keep using their accounts.

Adds the initial permission-aware catalog management workspace for products, taxonomy, variants, attributes, image links, stock adjustments, superuser role assignment and audit history. Django remains authoritative for permissions, prices and inventory. Direct product image URLs and gallery links are supported; uploads/storage providers and checkout remain deferred.

Fixed auth/admin BFF routes forward only HttpOnly session/CSRF cookies, validate mutation Origin and CSRF tokens, bound JSON bodies and timeouts, disable caching/redirects and sanitize upstream failures. A pre-stream product existence check returns actual HTTP 404 for missing/unpublished products and 503 for backend outages. No tokens enter browser storage.

Validation:
- 53 Jest tests across nine suites passed, covering forms, verification skipping, permission-aware UI, variants, client CSRF, proxy cookies/allowlists/errors and product HTTP status handling.
- ESLint with no warnings, TypeScript, compiler server-only boundary probe and production build passed in Docker.
- Real BFF signup/profile/RBAC/catalog creation/detail/stock replay/login/logout smoke passed; disposable records were removed.
- Browser reviewed desktop catalog at 1440px, mobile signup at 390px and anonymous staff-access denial. Authenticated admin and populated product visual review remain for PR review.

No dependency versions, lockfiles or frontend variables changed. Private environment files were not inspected or modified. SMTP remains disabled until manually configured in the backend. Existing accepted ESLint 9 end-of-support limitation remains. Initial admin loads at most 10,000 records/resource and storefront taxonomy dropdowns show first 100. Local noindex remains; no deployment.

Depends on the backend Phase 2 PR: merge backend first. See docs/phase-2.md and the backend operations guide for migrations and interactive administrator creation. User owns pushing, PR creation and merge.
