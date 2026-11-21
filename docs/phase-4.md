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

Returns and refunds follow in separate commits. Private
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
seeded. Refund ledger is the next feature commit.
