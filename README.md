# autoparts-ecommerce-store-frontend

Phase 2 storefront: Next.js App Router, strict TypeScript, Tailwind
tokens, accessible base layout, error/loading/not-found states, and Jest with
React Testing Library. The page clearly communicates that the store is in
preparation for ordering. NextAuth/Simple JWT, optional email OTP, customer accounts, catalog
listings/details/variants and a permission-aware catalog admin are implemented.
Phase 3 adds carts, merging, quoted checkout, shipping configuration, private
order confirmations and pending-order cancellation. See [Phase 3 review](docs/phase-3.md)
and [Phase 2 review](docs/phase-2.md). Payment verification/fulfillment remain Phase 4.
See [forms/API migration](docs/forms-api-migration.md) for React Hook Form, Zod,
TanStack Query, shared client/server fetchers and the current response contract.
See [toast notifications](docs/toast-notifications.md) for shared API success/error
messages, action-specific fallbacks and notification lifecycle.
See [authentication migration](docs/authentication-migration.md) for current routes,
required secrets and cookie/CSRF behavior, replacing the old Django-session flow.

## Environment

Manually populate `.env.local` using `.env.example`:

| Variable | Required | Purpose | Local example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public canonical site origin; used for metadata | `http://localhost:3000` |
| `NEXTAUTH_URL` | Yes | Public authentication origin; must match site origin | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Yes | Server-only cookie encryption secret | Generate at least 32 cryptographically random bytes, independently of backend signing key |
| `BACKEND_API_URL` | Yes for BFF | Server-only Django base URL inside Compose | `http://backend:8000/api/v1` |
| `BACKEND_API_TIMEOUT_MS` | Optional | Bounded request timeout, 100–15000 ms; default 5000 | `5000` |

Use an HTTP/HTTPS origin without credentials, paths, query parameters or fragments.
This value is public. Never put backend, database, Redis, session or R2 secrets
in the frontend environment. Next.js manages `NODE_ENV`; do not set it manually.
Private environment files are ignored by Git and excluded from Docker builds.
The agent does not inspect or modify them. Confirm configuration before starting
the development service.

The verification image uses the safe public example origin and does not load
your private environment. Local pages are marked `noindex` while the store is
being prepared; indexing must be deliberately reviewed before launch.

## Docker development

All application dependencies are installed and executed inside Docker. Host
Node.js is not required. From this repository, build the development image:

```powershell
docker build --target development -t autoparts-frontend:development .
```

After configuring `.env.local` and confirming readiness:

```powershell
docker run --rm --name autoparts-frontend-dev -p 127.0.0.1:3000:3000 --env-file .env.local --mount "type=bind,source=$($PWD.Path),target=/app" --mount type=volume,source=autoparts_frontend_node_modules,target=/app/node_modules --mount type=volume,source=autoparts_frontend_next,target=/app/.next autoparts-frontend:development
```

Open `http://localhost:3000`. Source files are bind-mounted for hot reload;
dependencies and Next.js cache stay in Linux named volumes. Stop with Ctrl+C or
`docker stop autoparts-frontend-dev` in another terminal. Named volumes persist.
Development uses Webpack with polling because the default Turbopack watcher did
not observe Windows bind-mount edits in verification. Production compilation
retains Next.js's default compiler. No extra watcher package is installed.
After approved dependency updates, refresh the dependency volume intentionally;
an existing volume may still contain the old dependency versions.

The backend repository owns integrated Compose orchestration. For the full stack,
run `docker compose --env-file .local.env up -d --wait --wait-timeout 120` there.
The shared Docker network resolves `backend`; a standalone frontend container
must join that network or use a deliberately configured host-accessible backend
address. Do not expose the Docker-only URL through NEXT_PUBLIC variables.

## Server boundary and BFF contract

`GET /api/health` calls only Django `/api/v1/health/ready/` on the server. It
returns `{ "status": "ok" }` when PostgreSQL and Redis are ready and a sanitized
503 envelope otherwise. It never forwards backend error bodies, cookies,
arbitrary destinations or untrusted request headers. Safe request IDs propagate
through `X-Request-ID`; response/request caching and redirects are disabled.
Timeouts and invalid upstream content are covered by tests. Phase 2 adds fixed
auth/admin BFF routes. NextAuth now manages encrypted session cookies; the BFF
sends bearer credentials to Django, with exact-origin checks and CSRF protection.

The backend client imports `server-only`, handled internally by Next.js without
an added npm package. `npm run verify:boundary` creates a temporary Client
Component inside the verification container and asserts that the Next compiler
rejects its import, then removes it. Jest uses a marker mock because it does not
run the Next compiler. The normal clean production build runs after this probe.
Missing configuration reports variable names through configuration validation;
the public BFF response remains generic and never exposes configuration values.

`robots.txt` disallows indexing during foundation development, alongside metadata
noindex. Image storage provider selection and SDKs are deferred by the user.

## Verification

Run lint, Jest, a production compilation, and TypeScript checks without private
environment files or a running backend:

```powershell
docker build --target verification -t autoparts-frontend:verified .
```

The image uses Node `24.22.3`, exact direct package pins, and `npm ci` against the
committed lockfile. Build-time configuration must only contain public values.
Individual checks can also be executed in the development image with `npm run
lint`, `npm run test`, `npm run build`, and `npm run typecheck`; the build needs
the public site origin. A Next.js build generates `next-env.d.ts` and route types.

Tests cover public origin validation, accessible page/header links, the
preparation notice, loading announcements and error recovery without diagnostic
leaks. Browser layout and development hot reload require separate live checks.

## Dependencies and changes

Only approved dependency versions may be changed. After explicit approval,
regenerate the lockfile inside Docker:

```powershell
docker build --target lockfile --output type=local,dest=. .
```

Review the manifest and lockfile diff, then rebuild. No global host installs,
unapproved packages or automatic dependency upgrades are part of this workflow.
No external fonts, image service, payment SDK or browser test framework is used.

Known tooling limitation: ESLint `9.39.5` is out of upstream support. The user
explicitly approved retaining it for this milestone because Next's current
import/React/accessibility plugins do not declare ESLint 10 compatibility.
Moving to a fully supported lint toolchain needs a separate dependency proposal.

Read [docs/WORK_STATUS.md](docs/WORK_STATUS.md) for the current milestone,
verification results and user-confirmed PR state.
