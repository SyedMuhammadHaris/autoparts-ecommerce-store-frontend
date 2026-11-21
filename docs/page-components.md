# Page and component separation

App Router `page.tsx` files render feature components and expose Next.js route
configuration and metadata. They contain no forms, API calls, state or handlers.
This convention is recorded in AGENTS.md.

| Route | Feature entry |
| --- | --- |
| `/` | `features/home/home-screen.tsx` |
| `/account` | `features/account/account-screen.tsx` |
| `/verify-email` | `features/auth/verify-email-form.tsx` |
| `/admin` | `features/admin/admin-workspace.tsx` |
| `/products` | `features/catalog/catalog-screen.tsx` |
| `/products/[slug]` | `features/catalog/product-screen.tsx` |
| `/orders/[reference]` | `features/checkout/order-screen.tsx` |

Login/signup reuse AuthForm. Cart, checkout and order history continue to render
their existing feature components. ProfileForm owns profile validation and its
update mutation. CheckoutForm renders delivery/payment fields using the checkout
controller's form instance and callbacks, preserving quote reset, locked retry
payloads and order recovery. Existing admin and catalog forms remain separate.

Catalog/product loading and order reference validation stay server-side. Product
metadata delegates to `features/catalog/product-metadata.ts`. Client boundaries,
API contracts, validation, query invalidation, toasts and route URLs are preserved.

No dependencies, lockfiles, private environment files or backend files changed.

Review checks: Docker lint, Jest (111 tests / 20 suites), production build,
TypeScript and the server-only boundary probe. No new native-browser visual QA.
