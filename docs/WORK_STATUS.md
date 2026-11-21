# Work status

- Current phase: Phase 3 implementation complete; PR review/merge pending.
- Current milestone: Storefront cart, shipping configuration, quoted checkout and private orders verified.
- Active branch: `phase-3`; user requested one branch per repository with feature commits.
- Verified baseline: Both authentication PRs confirmed merged; branch started from frontend main `f982767` and backend main `25a120d`.
- PR status: Nothing pushed; no PR created. Merge matching backend first. Wait for user confirmation before starting another phase.

## Completed work

- Product add-to-cart, guest/customer cart page, quantity/removal controls and navigation count; all prices/availability from Django.
- Atomic sign-in merging with visible failure handling. No discarded guest items on merge conflicts.
- Fixed BFF routes for cart/shipping/quotes/checkout/recovery/orders. Only encrypted-session-derived bearer credentials and the HttpOnly guest capability are sent upstream. Browser-supplied bearer/capability headers are ignored.
- Guest and authenticated mutations require exact Origin and signed NextAuth double-submit CSRF; no-store responses and fixed destinations retained.
- Pakistan delivery/contact form, city-dependent shipping options, enabled offline payment selection, signed quote review and backend-only final amounts.
- Random checkout idempotency key; ambiguous failures freeze/retry the same payload. Reload recovers an existing order before enabling another checkout. Session storage contains only the attempt key, no address or credentials.
- Private order confirmation with snapshot totals/address/items, payment status/history and pending cancellation; paginated account order list. Signing in keeps capability access to earlier guest links without silently claiming guest orders.
- Permission-aware shipping zone/city/method/rate and singleton checkout-policy admin. Explicit tax configuration; ordering disabled if required policy/delivery/payment configuration is absent.
- Noindex cart/checkout/orders and updated storefront copy. Responsive cart/checkout styles reuse existing design.
- Important files: src/features/cart/, src/features/checkout/, cart/checkout/orders pages and fixed API routes, admin page, auth/product/navigation components, server proxy/cart-cookie helper, globals.css and checkout/cart tests.

## Dependencies, environment and decisions

- No new packages, package versions, lockfile changes or environment variables. Existing approved pins retained.
- Neither private environment file was inspected or edited. Existing confirmed runtime configuration used through Compose/Next.js.
- User authorized a clearly named local test policy in Django: 0% tax, 30-minute reservation, COD enabled. Replace before real use and configure intended cities/rates in admin. Synthetic verification shipping/products/orders/accounts removed.
- Guest capability: HttpOnly, SameSite=Lax, Path=/, sliding 30-day max age; Secure/__Host on HTTPS. Django stores only its SHA-256 hash. Losing the cookie loses guest access; confirmation links alone do not grant access.
- Payment proof/instructions/verification/collection and fulfillment remain Phase 4. Image provider and uploads remain deferred. No production deployment.

## Verification

- 77 Jest tests across 15 suites passed; ESLint, production build, TypeScript and real Next compiler server-only boundary probe passed inside Docker.
- Checkout UI tests cover disabled configuration, server totals, placement, stable retry key/payload, reload recovery and cancellation. Route tests reject arbitrary checkout/order actions and guessed integer order URLs.
- Live NextAuth/BFF acceptance passed for guest/customer carts, merging, quote, checkout/replay, recovery, isolation and cancellation; actual scheduled expiry/outbox verified against the worker/Beat.
- Browser verified populated cart -> quote -> synthetic COD order -> confirmation -> cancellation. Desktop 1440px checkout and 390px mobile confirmation checked; mobile had no horizontal overflow. Screenshot saved outside repositories; synthetic records removed.
- Matching backend: 102 tests passed on disposable PostgreSQL; Ruff/format/Django/migration consistency and live service round trip passed.

## Limits and next work

- Order expiry is based on a pending confirmation state; confirmation and payment/fulfillment workflows are Phase 4. Polling/outages/backlog can delay release.
- Notifications currently use an internal durable audit consumer; no real customer email delivery or guest email recovery is claimed.
- Previously accepted NextAuth v4 maintenance mode, ESLint 9 EOL and single-process refresh coordination remain documented. Production proxy/replica/capacity work is deferred.
- Next: User pushes/reviews both phase-3 PRs, confirms merge/closure and explicitly approves Phase 4. See docs/phase-3.md and docs/phase-3-pr.md.
