# Phase 3: cart and checkout

All Phase 3 changes use `phase-3`, with focused feature commits.

## Cart

The product option panel adds to the cart; `/cart` supports quantity changes
and removal. Prices and availability are backend-authoritative. Stock is only
reserved when an order is placed. Signing in merges the guest cart atomically.
Merge failure is displayed; no guest items are silently discarded.

`/api/cart` allows GET/PUT and `/api/cart/merge` allows POST. The fixed BFF
passes only an encrypted-session-derived bearer credential or its private
`autoparts-cart` cookie capability. Browser Authorization and X-Cart-Token
headers are ignored. Guest mutations require the same exact Origin and signed
NextAuth double-submit CSRF check as customer mutations. Cookie: HttpOnly,
SameSite=Lax, Path=/, 30 days; Secure + __Host prefix on HTTPS. Only a hash is
stored in PostgreSQL. Responses are no-store and vary by Cookie.

No new dependencies or environment variables. Cart and checkout remain noindex.

## Shipping administration

The existing permission-aware admin adds shipping zones, cities, methods, rates
and a singleton checkout policy. Create zones/methods before dependent records.
Configure the tax percentage explicitly; a blank policy blocks checkout. The
30-minute reservation default is editable. No real business rates are invented.
`GET /api/shipping` proxies only the fixed public shipping-options endpoint.

## Checkout and confirmations

`/checkout` collects Pakistan delivery details, city, shipping and payment method,
then requests a signed quote. Only backend amounts are displayed; the browser
never submits calculated totals. Editing details invalidates the review. Quote
and order mutations use the existing signed CSRF/exact-origin protection.

Each checkout uses a random idempotency key. An ambiguous network/5xx failure
freezes the payload and retries the exact same request. Session storage contains
only that attempt key (no address, payment credentials or authentication token).
Reload checks the private recovery endpoint before allowing another order.
The backend waits behind any in-flight checkout on the same cart.

`/orders/<reference>` shows immutable items, amounts, delivery snapshot, pending
payment and status history; owners can cancel a pending order. `/orders` lists
only the signed-in customer's orders. Guest links require the original browser
capability cookie and are not shareable access links. Losing/clearing that cookie
loses guest access; no email recovery or email notification is claimed in Phase 3.
All private responses are no-store; cart/checkout/order pages are noindex.
