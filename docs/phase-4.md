# Phase 4: payments and fulfillment

The approved branch in each repository is `phase-4`, with feature-wise commits.

## Payment management

- `/admin/payments`: permission-aware payment list and review workspace.
- `/admin`: audited receiving bank account configuration for authorized staff.
- Owned bank-transfer order pages: receiving instructions, reference submission,
  review status, customer-facing rejection notes and resubmission after rejection.
- Dedicated React Hook Form/Zod forms: TransferForm, VerificationForm and
  CollectionForm. Thin route pages render feature components.
- TanStack Query and shared API transport preserve CSRF, guest cookies, JWT,
  validation, toasts, private cache resets and no automatic mutation retries.
- BFF routes allow only explicit payment actions. Django enforces ownership,
  staff permissions, state transitions, expiry and exact collection amounts.

Submission never marks payment paid. Staff must check the bank statement before
approval. COD confirmation never means collection; collection is available only
after delivery. Pending transfer review does not extend the existing reservation
deadline. Expired transfers require contacting the store for reconciliation.

No dependency, lockfile or environment changes. Backend migration and role
bootstrap must precede frontend use. Configure receiving bank accounts manually;
bank transfer is unavailable when no active account is configured.

Production build, lint and TypeScript passed for the feature. All 117 tests passed, including payment UI and proxy-route checks. No native-browser
visual QA or live transfer/upload has been performed.

## Fulfillment and tracking

`/admin/fulfillment` has a paginated permission-aware list and focused review/form
components. Staff see only the next permitted transition; shipment requires carrier
and tracking reference. Completion is unavailable until payment is recorded.
Owned order pages show carrier, tracking reference and shipped/delivered events.
No public tracking endpoint, courier network call or customer data is introduced.

121 tests across 23 suites passed, including shipping field validation, completion
payment gating, customer access denial and strict BFF allowlists. Lint, production
build, TypeScript and server-only boundary checks passed. No visual browser QA.

## Remaining Phase 4 scope

Private
proof uploads require the user's storage choice and remain pending; no public
proof-link workaround is introduced. No deployment or external courier integration.

## Returns

Delivered/completed owned order pages show the explicit return policy, remaining
line quantities and request decisions. ReturnForm has per-line quantities/reason
and retains its idempotency key for identical retries. No policy/window/refund
rules are invented; returns stay unavailable until staff explicitly enables them.

`/admin/returns` separates listing, review and inspection components/forms.
Review approval does not restock; inspection requires an explicit sellable
quantity for every line, including 0 for damaged stock. Returns and monetary
refunds remain separate. Staff policy fields appear in the existing audited admin.
Nested form errors now render for quantity arrays as well as simple fields.

125 tests passed across 24 suites; lint, build, TypeScript and server boundary
checks passed. Backend migrations and roles applied, no policy or real returns
seeded. Refund ledger follows as a separate feature commit.

## Manual refund ledger

`/admin/refunds` has separate authorization, review and resolution components.
Staff enter an inspected return request number, positive amount and policy basis.
The backend caps pending plus completed refunds at the amount actually paid,
including under concurrent requests. Identical retries reuse the request key.

Authorization sends no money. Completion requires an offline receipt and explicit
confirmation that it was paid/checked. Cancellation applies to unpaid pending
authorizations only. Completed decisions are immutable. Customer return panels
show refund amounts/status without exposing offline receipt references or staff
resolution notes. No automatic tax/shipping allocation or bank payout is made.

129 tests across 25 suites, lint, production build, TypeScript and compiler boundary
checks passed. Backend 137 tests plus Ruff/format/Django/migration/schema checks
passed. Local services restarted and healthy. HTTP smoke: home/admin return/refund
page shells 200; unauthenticated refund API 401; unowned return 404; origin/CSRF-free
refund mutation 403. This is not native-browser visual QA or live payment evidence.

Receiving bank details and complete enabled return policy must be entered manually
in admin. No new dependencies/env, real financial records, seeded return policy,
external storage request or deployment. Private proof uploads remain deferred to
the user's storage decision; Phase 4 is not fully closed and Phase 5 has not started.
