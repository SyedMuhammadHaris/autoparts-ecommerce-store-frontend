# autoparts-ecommerce-store-frontend

Phase 1 frontend foundation: Next.js App Router, strict TypeScript, Tailwind
tokens, accessible base layout, error/loading/not-found states, and Jest with
React Testing Library. The page clearly communicates that the store is in
preparation. Catalog, authentication, checkout and live backend connectivity are
not implemented in this milestone.

## Environment

Manually populate `.env.local` using `.env.example`:

| Variable | Required | Purpose | Local example |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Public canonical site origin; used for metadata | `http://localhost:3000` |

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

The backend repository will own integrated Compose orchestration in a later
approved milestone. This branch does not modify the backend repository.

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
