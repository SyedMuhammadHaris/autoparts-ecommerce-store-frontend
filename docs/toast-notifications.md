# API toast notifications

Approved frontend follow-up on `refactor/forms-api-responses`:
`react-toastify` 11.2.0 with its required transitive `clsx` 2.1.1. clsx is not a
direct dependency and application code does not import it. No backend changes
or environment variables are required.

`ToastHost` is mounted once in the root layout, outside the query provider's
authentication reset boundary. Toasts survive navigation. Authentication changes
dismiss active notifications and clear the waiting queue; login/logout success
messages are emitted afterward. Successes close after five seconds; errors stay
until dismissed. At most three are visible, repeated messages use stable IDs,
hover/focus-loss pauses are enabled, and reduced-motion styling is supported.

## Shared API behavior

`apiAction` and non-GET `clientFetch` requests display one success toast after a
valid successful response. A nonempty backend `success.message` takes priority;
otherwise a caller fallback is used. The generic fallback is "Changes saved."
("Deleted successfully." for DELETE). This does not enable new DELETE endpoints.

```ts
await apiAction({
  method: "PATCH",
  path: "/api/admin/products/{id}",
  pathParams: { id },
  payload: values,
  notifications: { success: "Product updated." },
});
```

Use `notifications: { success: false }` for quiet intermediate steps such as
quote review or signup/cart merge before the overall sign-in workflow completes.
Errors still notify. `error: false` is available when a caller intentionally owns
its complete failure presentation. These options are client-only metadata and
are never included in request bodies, queries or headers.

API failures display readable normalized field errors or the safe API message,
then rethrow the same failure so forms, cache invalidation and checkout recovery
continue to work. Arbitrary exception messages, request payloads and credentials
are never displayed. Aborted requests are silent. Existing inline validation and
critical checkout retry/status guidance remain available after a toast is closed.

The QueryCache reports GET failures once after retries finish; successful
background reads do not create toasts. Expected initial anonymous account 401s
stay quiet. Losing authorization after cached private data is present still
notifies and the query hook hides that data. Server-only fetching has no toast
side effects. NextAuth SDK failures/successes are handled explicitly by its UI.

Action fallbacks cover account updates, OTP, cart changes, admin saves, stock,
staff roles, order submission and cancellation. An order toast never claims that
an offline payment was collected or verified. No automatic mutation retries or
checkout idempotency changes were introduced.
