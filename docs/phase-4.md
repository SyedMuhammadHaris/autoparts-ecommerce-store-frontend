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

## Pending

Fulfillment/tracking, returns and refunds follow in separate commits. Private
proof uploads require the user's storage choice and remain pending; no public
proof-link workaround is introduced. No deployment or external courier integration.
