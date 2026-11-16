# Phase 2 review

The backend Phase 2 PR must merge first. Use the backend-owned Compose stack and
apply its migrations/bootstrap command as described in backend `docs/phase-2.md`.
No frontend environment variables or package versions changed. Private `.env.local`
is not read or modified by the agent; Next/Compose load it at runtime.

## Routes

- `/signup`, `/login`: name/email/password signup and Django session login.
- `/account`: own name, email/verification status and server-side logout.
- `/verify-email`: optional six-digit email OTP, with a persistent Skip link.
- `/products`: server-rendered search, category/brand filters, sorting and pagination.
- `/products/{slug}`: product detail, image gallery and variant/stock selection.
- `/admin`: permission-aware product, category, brand, variant, attribute and image
  management; stock adjustments; superuser-only role assignment; read-only audit.

Create an administrator yourself using the backend interactive createsuperuser
command. There are no default credentials. Sign up other staff normally and use
the superuser role screen to assign seeded roles. Backend permissions are always
authoritative; hidden frontend controls are only a usability aid.

Creating a product makes a standard variant with zero stock. Add stock through
Inventory, and publish via Active. Manage standard/specific variant prices in the
variant editor; base-price changes update the standard variant. Image links can be
saved directly on products and in a separate gallery. A primary gallery image
takes precedence. Image uploads/storage provider selection are deferred. Images
load in the browser without forwarding a referrer; use trusted public image hosts.

Product detail requests check existence before streaming so missing/unpublished
slugs return an actual 404 and backend outages return a sanitized 503. This adds
an extra bounded catalog lookup per detail request; optimize deliberately later.
See the [Next.js streaming guidance](https://nextjs.org/docs/app/api-reference/file-conventions/loading).

## Security and configuration

Only fixed auth/admin endpoints are proxied. Internal backend addresses remain
server-only. Unsafe requests must have the exact configured public Origin and a
masked CSRF token; the typed client fetches a fresh token before each mutation.
Only HttpOnly `sessionid`/`csrftoken` cookies are forwarded, with separate response
Set-Cookie headers and no backend Domain. No authentication tokens enter browser
storage. Proxy responses use no-store, bounded timeouts, no redirects and sanitized
upstream server errors. Bodies are JSON and limited to 64 KiB.

SMTP is disabled until the user manually configures it in backend `.local.env`.
No SMTP credentials belong in the frontend. Email verification is optional and
never blocks account access. Delivery is requested through Celery; users can
resend after cooldown if mail does not arrive. Automated tests never send email.

## Scope and limitations

Ordering, checkout, vehicle fitment matching and storage uploads are not implemented.
The initial management view loads up to 10,000 records per resource and fails
visibly above that limit; larger catalogs need paginated management/search.
Storefront category/brand dropdowns initially show the first 100 entries. Public
product lists paginate at the backend. Local noindex remains enabled until launch.
ESLint 9's previously accepted end-of-support limitation remains unchanged.

Run lint, Jest, typecheck, the compiler server-boundary probe and production build
inside Docker. Review desktop/mobile rendering separately; HTTP/component tests
are not a substitute for actual browser visual QA.

Push `feat/phase-2` and open the PR yourself after review. Merge the backend PR
first. Phase 3 requires explicit approval after both Phase 2 PR outcomes are known.
