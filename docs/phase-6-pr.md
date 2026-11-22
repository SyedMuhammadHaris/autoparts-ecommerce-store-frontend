## Changes

Prepare canonical metadata, escaped product structured data and a bounded sitemap
behind an explicit indexing gate. Keep private routes excluded from indexing, add
browser security headers, deduplicate server reads per request and associate form
errors with their fields and keyboard focus actions.
Preserve existing authentication, stock, checkout, payment and refund workflows.

The frontend security overrides glob 14.0.6 and minimatch 11.0.9 were explicitly
approved with necessary transitives, lockfile changes and Docker re-verification.
Unaffected minimatch 3.x and all direct package pins are retained.

## Validation

- Backend: 179 tests passed on PostgreSQL; Ruff/format and Django/migration/schema
  checks passed. Execution evidence is in docs/phase-6.md.
- Frontend: 162 tests/36 suites, lint, clean production build, TypeScript and compiler
  boundary checks passed with the approved overrides in isolated Docker verification.
- OSV: 33 Python and 698 npm locked versions checked, no advisories returned after
  remediation on 2026-11-22. npm audit service unavailable; no npm-audit pass claim.
- Local HTTP metadata/security/CSRF/auth/404/400 smoke passed. No real transactions,
  mail, private environment inspection, uploads or production operations.

## Rollout and remaining review

Merge backend before frontend. Apply additive orders 0005 and payments 0004 index
migrations; production locking/table sizes need a separate rollout review.
Optional frontend SITE_INDEXING_ENABLED defaults to false; no local env edit is
required. Leave it off until an approved public HTTPS launch. No backend env additions.

Manual responsive/keyboard/screen-reader browser QA and real Core Web Vitals/load
measurements remain open. Computer Use stopped because it could not confidently
identify the browser URL; no visual review is claimed. Known ESLint 9 support
limitations remain. Storage/private proof integration is deferred by user decision.
Production settings, HTTPS/proxy/CSP/HSTS, edge rate protection, backups/monitoring,
CI/CD and deployment require separate Phase 7 approval. See docs/phase-6.md.