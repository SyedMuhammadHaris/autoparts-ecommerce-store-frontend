## Changes

Complete Phase 5 administration and content workflows: date-bounded dashboard and
safe CSV export, audited customer/staff controls, draft-first CMS, one merchandise
coupon per checkout, moderated verified-purchase reviews, and private durable order
notifications with optional SMTP delivery. Preserve checkout idempotency, stock
locking, authorization and existing payment/return/refund workflows.

Pending coupon slots release on unpaid cancellation/expiry; confirmed orders and
later refunds retain usage. Review edits require fresh moderation of the displayed
revision. Guest order notices remain restricted to their existing ownership cookie.

## Validation

- Backend: 169 tests passed; Ruff/format, Django and migration checks passed.
- Frontend: 151 tests/34 suites passed; lint, production build, TypeScript and server boundary checks passed.
- Phase 5 migrations applied locally. No browser visual QA performed.
- No new dependencies or lockfile changes; no real email/payment/cloud operations.

## Configuration and rollout

Merge the backend PR before the frontend PR. Apply backend migrations and run
bootstrap_roles. Configure store content, coupons and templates through authorized
admin workflows; drafts and custom templates are inactive by default.
ORDER_EMAIL_ENABLED defaults to false. Enable only after manually configuring SMTP
in backend .local.env. No frontend environment additions; private files untouched.

SMTP delivery is at least once after ambiguous provider acceptance; retries are
bounded and auditable. CSV exports are capped at 1,000 rows. Reporting date semantics
and operational setup are documented in docs/phase-5.md. Storage/private payment
proof uploads remain deferred to final integration before deployment. Phase 6 and
production deployment are outside this PR.
Local HTTP smoke passed for public pages, private API anonymous denials and cross-origin mutation rejection. Role bootstrap completed without creating users/passwords; SMTP flag verified disabled.
