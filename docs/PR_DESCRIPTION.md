Completes frontend Phase 1 connectivity with a typed server-only backend client
and fixed-purpose GET /api/health BFF route. Requests use bounded timeouts, no
caching or redirects, safe correlation IDs and sanitized failure responses.
Adds robots.txt for local noindex behavior. No new npm dependency was added.

Validation: 31 Jest tests, lint, TypeScript and clean production compilation
passed. The actual Next compiler rejected a Client Component import of the
backend client without an installed server-only package. Live BFF/readiness and
backend/Redis outage recovery checks passed; see WORK_STATUS.md.

Requires BACKEND_API_URL in the manually managed .env.local. No backend secrets
or private environment files are committed. Image storage, authentication,
catalog and deployment remain outside this PR.

Merge the backend phase-1-completion PR first. Known limits remain documented:
ESLint 9 EOL was explicitly accepted; browser visual inspection was unavailable.
