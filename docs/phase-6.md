# Phase 6: quality and launch readiness

Phase 5 merge confirmed by the user. Backend main baseline: 2cabcdf; frontend main
baseline: f44e77d. Both phase-6 branches were created from clean local main.
One branch per repository, focused commits, no pushes/PR creation or deployment.

## Milestones and scope

1. Security: safe default API throttles, existing commerce limits fail closed on
   cache failure, untrusted forwarding headers ignored, no-store API responses,
   frontend browser security headers and permanent private-route noindex policy.
2. Performance: report timestamp/composite indexes and a catalog query-growth
   regression; React request-local catalog/CMS deduplication without cross-request
   price, stock or customer caching.
3. SEO: compact backend published-URL endpoint, bounded keyset sitemap reads,
   canonical pagination/product/CMS URLs, filtered-listing noindex, escaped Product
   and Breadcrumb JSON-LD using real variant prices/stock and no invented ratings.
4. Accessibility: descriptive error associations on authentication, OTP, profile,
   checkout and generic admin forms; shared error summaries allow focus return to
   the invalid field. Existing labels, focus styles, skip link and reduced-motion
   behavior retained. This is not a WCAG conformance certification.
5. Regression/operations: existing PostgreSQL concurrency and lifecycle suites,
   isolated frontend verification build, dependency advisories, local HTTP smoke,
   rollout notes and explicit remaining launch gates.

## Environment and dependency policy

No backend environment additions. New optional frontend SITE_INDEXING_ENABLED=false
is server-only; no local change is required. Leave false locally and on previews.
The true setting requires a public HTTPS NEXT_PUBLIC_SITE_URL and a deliberate
launch review. Private routes remain noindex regardless of this flag. robots.txt
and sitemap.xml are dynamic so a build does not silently enable indexing later.
No private environment files were inspected or modified; applications load their
existing configuration through Docker/Next.js. SMTP remains off; no real mail,
payment, shipment, refund, cloud or production actions were performed.

The user explicitly approved scoped security overrides and their necessary
transitives, lockfile changes, Docker dependency refresh and full re-verification:

| Package | Exact target | Reason |
| --- | --- | --- |
| glob (affected 9–14.0.1 only) | 14.0.6 | Resolve cancellation-bypass advisory in Jest dependencies |
| minimatch (affected 7–10 only) | 11.0.9 | Resolve pattern amplification advisory in ESLint/Jest dependencies |
| path-scurry | 3.0.0 | Required by glob 14 |
| @isaacs/nonrecursive-glob-match | 1.1.0 | Required by minimatch 11 |

Existing minimatch 3.x users are not overridden. Existing brace-expansion 5.0.13
and minipass 7.1.3 satisfy the new requirements. No unrelated direct package pins
changed. These are major transitive overrides outside parent ranges; full lint,
tests and builds are required before acceptance and after future parent updates.
ESLint 9.39.5's previously accepted support limitation remains documented; security
overrides do not resolve its upstream support status.

## API and data integrity

GET /api/v1/catalog/sitemap/?kind=products|pages&after=0 returns only published
slug/updated_at entries (up to 1,000), plus next_after or null. Product visibility
uses the same active category/ancestor/brand/variant rules as the catalog.
The frontend never follows arbitrary upstream next URLs. The sitemap fails rather
than silently truncating or publishing duplicate/invalid entries; partitioning is
required beyond 50,000 URLs. Existing public response envelopes remain unchanged.

Backend API default: 3,000 requests/hour per authenticated account or anonymous
network identity; existing commerce scope remains 600/hour. Auth-specific atomic
limits are retained. Liveness/readiness/schema do not require the throttle cache.
All API responses, including errors, remain no-store. Cache failure returns safe
503 instead of bypassing limits or revealing connection diagnostics.

DRF application throttles are non-atomic and not DDoS protection. Anonymous traffic
from the BFF shares a backend network bucket; deployment must define trusted proxy
boundaries and edge/client limits. Do not trust browser-supplied forwarding headers.
No stock/financial authority was moved into caches or frontend code.

New additive migrations: orders 0005 and payments 0004. They index order creation,
COD receipt creation, bank decision/date and refund state/resolution date. Existing
migrations were not rewritten. Local indexes were applied successfully. Production
index rollout/locking must be reviewed against real table sizes in Phase 7.

## Verification evidence

- Backend: 179 tests passed on disposable host PostgreSQL, including existing
  simultaneous checkout, idempotency, payment, refund, ownership and notification
  lease/retry coverage. New tests cover throttle bypass/failure behavior, published
  sitemap privacy/filter validation and fixed catalog query growth from 1 to 6 products. A 1,001-page fixture verifies
  cursor progression without omissions or duplicates.
- Ruff lint/format, Django checks, migration drift and OpenAPI route/reference tests
  passed. No production configuration/security certification is implied.
- Frontend baseline with Phase 6 code: 162 tests/36 suites passed, lint, build,
  TypeScript and compiler boundary checks passed. Dependency-override re-verification
  is recorded below after execution.
- OSV scan initially checked 33 Python packages (no advisories returned) and 712 npm
  packages (glob/minimatch findings). npm audit did not return a usable response,
  including a bounded retry against the public registry. Do not claim npm audit passed.
- Browser visual/keyboard review was attempted with Computer Use. The helper stopped
  because it could not confidently identify the current browser URL for policy
  enforcement; no browser review was completed. No further UI automation attempted.

## Remaining gates before launch

- Manual responsive, keyboard and screen-reader browser walkthrough; measure Core
  Web Vitals and realistic load/query plans against representative staging data.
  Development HTTP timings and query-count budgets are not production benchmarks.
- Choose and approve storage, product uploads and private payment-proof integration
  after feature phases, before deployment (user's explicit deferral).
- Review configured tax, shipping, returns, bank details, content, SMTP and sender
  domain with real store policy. Automated fixtures are test-only; no invented live
  rates, legal policy, delivery guarantee or financial settlement was introduced.
- Phase 7 requires separate approval: production settings, HTTPS/proxy trust,
  HSTS/CSP tested against Next.js behavior, external rate protection, secret
  management, private caching policy, backups/restore drill, monitoring, CI/CD,
  storage access controls and final deployment checks. Indexing stays disabled
  until these launch decisions are reviewed. No infrastructure was deployed.

## Primary references

- https://www.django-rest-framework.org/api-guide/throttling/
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata
- https://nextjs.org/docs/app/api-reference/functions/generate-metadata
- https://github.com/advisories/GHSA-g3hv-75wg-m249
- https://github.com/advisories/GHSA-3g3m-2fjr-6pw4
## Final dependency and runtime verification

The approved override tree passed lint, all 162 Jest tests across 36 suites,
compiler server-only boundary verification, clean production build and strict
TypeScript checking inside the isolated Docker verification image. A subsequent
OSV scan checked 698 unique locked npm package versions and returned no advisories
on 2026-11-22. The 33-package Python scan also returned no advisories. These are
point-in-time advisory results, not a guarantee of absence of vulnerabilities.
The npm audit endpoint remained unavailable and is not reported as passed.

The local HTTP smoke passed after dependency refresh: public home/robots/sitemap
200; local noindex and canonical metadata; empty local sitemap; private page shells
with noindex headers/metadata; notification/report anonymous API 401; cross-origin
notification POST 403; unpublished product/page 404; invalid vehicle filter 400.
The script prints response timings only as development observations. It creates
no accounts, orders, payments or mail. Run inside the frontend container with
node scripts/phase6-smoke.mjs while local indexing remains disabled.

Initial smoke attempts encountered startup/dependency-refresh interruption and a
trailing-slash-only canonical assertion mismatch. The assertion now normalizes
URLs, and the complete repeat passed. No failed run is counted as a passing check.
