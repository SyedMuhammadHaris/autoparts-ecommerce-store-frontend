# NextAuth migration before Phase 3

The user confirmed Phase 2 PR #4 merged. Current branch:
`refactor/authentication-migration`. Phase 3 has not started.

NextAuth 4.24.15 Credentials signs in against Django Simple JWT. The backend owns
users, passwords, permissions, signup and optional email OTP. NextAuth v4 is the
approved stable release, with its maintenance-mode limitation acknowledged; no
beta, provider SDK or ORM adapter was added. Existing dependency pins are retained
and the frozen lock adds the authentication dependency tree only.

## Routes and security

- `/api/auth/*`: NextAuth CSRF, Credentials callback, session and sign-out.
- `/api/account/register`: signup, then the client signs in through NextAuth.
- `/api/account/me`: authenticated own account/name editing.
- `/api/account/verification/{send,confirm}`: optional email OTP.
- Existing fixed admin/catalog BFF endpoints retain their allowlists.

An encrypted HttpOnly NextAuth cookie carries protected bearer state. Raw access
and refresh tokens never enter localStorage, client session responses or user
logs. The BFF decodes only the NextAuth cookie, ignores browser-supplied bearer
headers/legacy Django cookies, and sends an Authorization header to Django.
Mutations require the exact configured Origin and signed NextAuth CSRF cookie plus
X-CSRFToken header. NextAuth callbacks also enforce origin and bounded request
bodies. Private responses are no-store. Cookies are Secure on HTTPS origins.

Backend access credentials last five minutes; refresh is rotating with a fixed
one-day deadline. The current one-process frontend coalesces parallel refreshes;
multiple replicas require distributed coordination before production. Successful
NextAuth sign-out revokes the Django session immediately, then clears the browser
cookie. A backend outage can prevent revocation; local cookie removal still occurs,
with a sanitized warning. Existing users keep their accounts/passwords and sign in
again after migration. Email verification remains optional, SMTP disabled locally.

## Manual environment configuration

| Variable | Required | Safe example / instruction |
| --- | --- | --- |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000`, matching NEXT_PUBLIC_SITE_URL |
| `NEXTAUTH_SECRET` | Yes | Cryptographic random secret of at least 32 bytes, independent of backend signing key |

The backend additionally needs its independent `JWT_SIGNING_KEY`. These variables
were manually saved and confirmed by the user. No private environment file was
inspected or changed. Never prefix either secret with NEXT_PUBLIC_. Safe examples
are maintained in `.env.example`. Applications/Compose load values at runtime.

The backend guide `docs/authentication-migration.md` describes forward migrations,
blacklisting/session records, cleanup and Docker startup. Both packages and lockfile
updates were approved. Run `npm ci` inside Docker to refresh an existing dependency
volume after stopping frontend. Run all lint/tests/build/typecheck inside Docker.

The two PRs must be rolled out together, backend first; the old Django-session
frontend cannot use the new bearer-only backend. User owns pushes/PR creation and
merge confirmation. Both AGENTS files now prioritize human-readable code using the
requested Martin Fowler principle. No deployment or Phase 3 work occurred.
