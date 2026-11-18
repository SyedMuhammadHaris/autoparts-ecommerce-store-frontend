Adds product add-to-cart, guest/customer cart editing and sign-in merging, a
shipping-aware checkout with server-signed quote review, interrupted-request
recovery, private order confirmations, account order lists and pending cancellation.
The permission-aware admin adds cities, shipping zones/methods/rates and checkout policy.

Verification: 77 tests across 15 suites; lint, production build, TypeScript and
compiler-enforced server-only boundary check passed in Docker. Guest/customer
BFF checkout smoke passed against the matching backend. No new dependencies,
lockfile changes or environment variables. Raw credentials remain server-only;
guest mutations use exact-origin/signed CSRF and private capability cookies.

Merge after the matching backend phase-3 PR and its migrations. Tax and delivery
configuration are explicit; no configured policy means ordering stays disabled.
The approved local policy is test data. Payment verification/fulfillment remain
Phase 4. See docs/phase-3.md for behavior and operational limitations.
