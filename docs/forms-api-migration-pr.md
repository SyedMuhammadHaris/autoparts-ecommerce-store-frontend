Migrates forms to React Hook Form/Zod and client server state to TanStack Query.
Adds reusable clientFetch/apiAction and server-only serverFetch with query/path
parameter encoding, CSRF, response decoding and typed errors. Admin forms are
split into focused components; catalog GET URLs and server rendering remain.
Authentication clears private query state, credentials stay out of mutation-cache
variables, and checkout retains explicit idempotent retry/recovery behavior.

The approved frontend follow-up adds react-toastify 11.2.0 (transitive clsx 2.1.1)
with one global host. Shared mutations display backend success messages or action
fallbacks and readable API errors; query errors notify after retries. Expected
anonymous account checks stay quiet. Toasts deduplicate, clear on authentication
changes, and preserve inline validation/recovery guidance.

Uses approved exact package pins and Docker-generated lockfile. Verification:
110 tests across 20 suites, lint, TypeScript, production build and compiler
server-only boundary. Live Phase 2/3 BFF and JWT refresh/logout smoke passed,
including real scheduled reservation expiry. No environment additions, real
email/payment/upload action or deployment.

Merge after the matching backend response-contract PR and update both services
together. Existing business payloads/permissions remain authoritative in Django.
Phase 4 remains outside this refactor. See docs/forms-api-migration.md.
