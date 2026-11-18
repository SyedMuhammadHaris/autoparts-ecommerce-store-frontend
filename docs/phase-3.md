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
