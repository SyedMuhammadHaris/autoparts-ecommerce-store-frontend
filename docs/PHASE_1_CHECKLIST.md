# Frontend Phase 1 acceptance

- Next.js App Router, strict TypeScript and Tailwind tokens are initialized.
- Shared layout, preparation page, loading/error/not-found states are implemented.
- Metadata and robots.txt deliberately prevent indexing before launch.
- A typed server-only client calls only the configured Django readiness endpoint.
- GET /api/health validates upstream status, bounds timeouts, disables caching
  and redirects, propagates safe request IDs and returns generic 503 failures.
- No backend credentials, internal URLs or diagnostics are exposed through the
  response. Backend secrets are never put in NEXT_PUBLIC variables.
- No new npm package is required for the server-only marker. The real Next.js
  compiler rejects a temporary Client Component import during verification.
- 31 Jest tests, lint, TypeScript and clean production compilation passed.
- Live host HTTP through BFF to PostgreSQL/Redis passed. Backend/Redis outage and
  recovery checks are recorded in WORK_STATUS.md.
- Integrated Docker startup, bind mounts, worker health and retained volumes are
  owned by the backend repository. Windows hot reload uses Webpack polling.
- Image storage is deferred to the user's later provider decision. Authentication,
  catalog, checkout and production deployment are not part of this phase.

## Reproduce checks

```powershell
docker build --target verification -t autoparts-frontend:phase1 .
```

This image does not load private environment files. It runs lint, tests, a
negative import-boundary build probe, a clean production build and TypeScript.
For live checks, manually populate .env.local using .env.example, confirm
readiness, and start the shared Compose stack from the backend repository.
Then check http://localhost:3000/api/health and the backend readiness endpoint.

Known limits: browser visual inspection was unavailable and is not claimed.
ESLint 9's end-of-support limitation was explicitly accepted by the user because
the current Next lint plugins do not declare ESLint 10 compatibility. No security
audit or production readiness certification is claimed.

User pushes and opens both Phase 1 PRs. Merge the backend PR first. Phase 2
requires explicit user approval after Phase 1 review/merge.
