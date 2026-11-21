# Forms and API migration before Phase 4

The approved same-branch [toast follow-up](toast-notifications.md) adds centralized
React Toastify notifications for API success and error messages.

Phases 1–3 retain their authentication, catalog, vehicle fitment, RBAC, inventory,
cart and checkout workflows. The matching backend PR changes application JSON to
a success/error envelope; the shared transport unwraps it once and returns the
existing business types to components.

## Approved exact dependencies

| Package | Version | Purpose |
| --- | --- | --- |
| react-hook-form | 7.92.0 | Form state and submission |
| zod | 4.6.7 | Typed form schemas and runtime validation |
| @hookform/resolvers | 7.0.8 | Zod integration with useForm |
| @tanstack/react-query | 5.108.2 | Queries, mutations and invalidation |
| @tanstack/query-core | 5.108.2 | Required transitive query core |
| @standard-schema/utils | 0.3.0 | Required resolver utility |
| react-toastify | 11.2.0 | Approved API toast follow-up |
| clsx (transitive) | 2.1.1 | Required by React Toastify; not directly imported |

Zod was already pinned transitively and is now a direct dependency. npm relocated
existing ESLint Ajv/json-schema-traverse packages without changing their versions.
No other validator, Axios, devtools, backend package or service was added. All
lock generation, npm installation and checks run inside Docker. No new variables
are required and neither private environment file was inspected or edited.

## Client and server transport

Use `clientFetch` for reads and `apiAction` for mutations in client code:

```ts
const products = await clientFetch<Page<Product>>({
  path: "/api/catalog/products", query: { page: 1, category: "brakes" },
});
await apiAction({
  method: "PATCH", path: "/api/admin/products/{id}",
  pathParams: { id: productId }, payload: values,
});
```

Actions support POST/PUT/PATCH/DELETE, query parameters and encoded dynamic
segments. Supporting a verb in the helper does not enable new backend deletion
APIs. Existing BFF resource/method allowlists remain authoritative. Paths are
same-origin API paths; absolute destinations, traversal and malformed placeholders
are rejected. Query arrays repeat keys; zero and false are preserved. GET uses
query parameters, never a body.

Client mutations obtain NextAuth's native CSRF token and use same-origin cookies.
They never read HttpOnly authentication/guest cookies. `ApiError` retains the HTTP
status, machine error code, normalized field errors and correlation ID. Native
NextAuth endpoints are called through its SDK, not the application-envelope decoder.
The old `apiRequest` export is only a forwarding compatibility facade; application
components use the new transport/hooks.

Use `serverFetch` from `src/lib/server/fetch.ts` in server-only code:

```ts
const product = await serverFetch<Product>({
  path: "/catalog/products/{slug}/", pathParams: { slug },
});
```

It uses the fixed backend base, allowlisted API roots, bounded timeout, no-store
and redirect rejection. Optional bearer/guest credentials are supplied explicitly
by trusted server code; browser headers/cookies are not forwarded wholesale.
Catalog, health and NextAuth login/refresh/logout share it. Do not import it from
client components; the compiler-enforced server-only boundary remains tested.

## Forms and server state

`ApiProvider` creates a separate QueryClient per mounted tree/request. There is
no module-global SSR QueryClient or persisted browser cache. `useApiQuery` supplies
abort signals; `useApiMutation` runs the reusable action and invalidates related
queries. Login/logout replace private cache state; failed authorization hides stale
private data. Sign-in also resets active observers before merging carts. Passwords
are not stored in mutation-cache variables.

Queries retry at most one server error; authorization/client errors do not retry.
Mutations never retry automatically. Focus refetch is disabled. Checkout review,
placement and recovery keep their explicit state machine: ambiguous failures retain
the exact payload/key, reload checks the previous attempt, and no new order is
enabled until recovery establishes the prior outcome. Session storage still holds
only the attempt key, not an address or credentials.

Authentication, profile, OTP, checkout, admin record/role/stock forms and catalog
filters use `useForm` with `zodResolver`. Shared schemas trim contact text but never
passwords. Invalid fields are announced through role=alert and aria-invalid; RHF
focuses the first registered invalid field. Django remains authoritative.

Admin metadata, schema generation and form types live in `src/features/admin/`.
Immutable fields are omitted from PATCH validation/payloads, empty optional foreign
keys become null, explicit zero tax stays zero, blank tax stays unconfigured, and
stock adjustment retries retain their operation key for the same normalized values.
Editors wait for dependent choices before mounting. Vehicle lookups use keyed,
abortable queries, and catalog submission retains shareable GET URL semantics and
server-rendered products.

## Review and rollout

The two PRs must move together: merge backend first, then frontend, and update both
running services together. No database migration or environment additions are
required. The dependency volume must be refreshed with npm ci after this approved
lockfile update. Production deployment and Phase 4 remain outside this refactor.
