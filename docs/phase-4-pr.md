Adds customer bank-transfer reference submission/status, staff payment and
fulfillment workspaces, owned shipment tracking, policy-gated return forms,
inspection/restocking and manual refund authorization/resolution UI.

Pages remain thin; forms use React Hook Form/Zod; queries/mutations use existing
TanStack Query/shared transport and API toasts. BFF allowlists preserve guest
cookies, JWT, CSRF and backend authorization. Refund authorization never sends
money; completion requires an actual offline receipt and staff acknowledgement.

Validation: 129 tests across 25 suites; lint, production build, TypeScript and
compiler boundary checks passed. Local HTTP access/CSRF smoke passed. No native
browser visual QA, real payment/upload or deployment. No new dependencies/env.

Merge matching backend first; migrations/bootstrap_roles required. Configure
receiving bank and explicit return policy manually. Private proof uploads remain
deferred pending storage choice; full Phase 4 closure and Phase 5 need user review.
