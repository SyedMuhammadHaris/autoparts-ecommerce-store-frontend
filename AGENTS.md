
# AGENTS.md — E-Commerce Frontend

## 1. Project Overview

This repository contains the Next.js frontend for a custom, single-vendor e-commerce platform targeting Pakistan.

The application includes:
- Customer-facing storefront
- Customer authentication and account management
- Guest and registered checkout
- Shopping cart
- Order tracking and history
- Custom administration dashboard
- SEO-optimized product and category pages
- Content-managed homepage, banners, and informational pages

### Confirmed Business Requirements

- Store type: Single-vendor
- Products: Physical products only
- Initial market: Pakistan
- Currency: PKR
- Product variants: Size, color, and configurable attributes
- Checkout: Guest and registered customers
- Payments: Cash on Delivery and Direct Bank Transfer
- Bank transfer verification: Manual administrator verification
- Inventory: Reserved when an order is created
- Shipping: City/zone-based delivery charges
- Media storage: provider decision deferred by the user to a later phase
- Design: Modern, minimal, premium
- Branding: Fixed design with editable content
- Admin panel: Custom Next.js dashboard

The Django backend is the authoritative source of business rules.

---

## 2. Technology Stack

Required technologies:
- Next.js with App Router
- TypeScript in strict mode
- React
- Tailwind CSS
- Jest
- React Testing Library
- Docker and Docker Compose

Use stable, compatible dependency versions.

Do not introduce additional frameworks or libraries without explicit user approval.

---

## 3. Repository Architecture

This is one of two independent Git repositories.

Expected workspace:

ecommerce-workspace/
├── ecommerce-frontend/
│   └── AGENTS.md
└── ecommerce-backend/
    └── AGENTS.md

The sibling backend repository contains:
- Django
- Django REST Framework
- PostgreSQL
- Redis
- Celery
- Cloudflare R2 integration
- REST APIs

Do not merge the repositories or reinitialize Git.

Coordinate cross-repository changes through documented API contracts.

The backend repository owns the local Docker Compose configuration.

---

## 4. Recommended Frontend Structure

src/
├── app/
│   ├── (store)/
│   ├── (auth)/
│   ├── (customer)/
│   ├── admin/
│   ├── api/
│   ├── layout.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── components/
│   ├── ui/
│   ├── storefront/
│   ├── admin/
│   └── shared/
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   └── admin/
├── lib/
│   ├── api/
│   ├── auth/
│   ├── seo/
│   └── utils/
├── hooks/
├── types/
└── styles/

This structure is a guideline.

Do not create empty directories or unnecessary abstractions merely to match it.

Organize code by feature when that improves maintainability.

---

## 5. Development Principles

Follow:
- Clean code
- SOLID principles where appropriate
- DRY
- KISS
- Separation of concerns
- Accessibility best practices
- Type safety
- Reusable components
- Explicit error handling
- Maintainable, readable code

Avoid:
- Overengineering
- Unnecessary abstractions
- Premature optimization
- Large components with unrelated responsibilities
- Duplicated API logic
- Unnecessary client-side state
- Hardcoded business rules

Prefer simple solutions that meet actual requirements.

---

## 6. Next.js Best Practices

- Use App Router.
- Prefer Server Components by default.
- Use Client Components only when interactivity requires them.
- Keep secrets and server-only logic outside client bundles.
- Use server-side data fetching for SEO-critical content.
- Avoid unnecessary client-side waterfalls.
- Use loading, error, and not-found boundaries.
- Use Next.js image optimization where appropriate.
- Use typed request and response models.
- Use environment variables for configuration.
- Use caching intentionally.
- Never cache private customer information publicly.
- Revalidate catalog and content data when necessary.
- Follow current stable Next.js conventions.

Do not use deprecated patterns without a documented reason.

---

## 7. API Communication

The backend exposes versioned REST APIs:

/api/v1/

Create a centralized typed API client.

The frontend must not directly access PostgreSQL, Redis, or internal backend services.

The backend owns:
- Pricing
- Discounts
- Taxes
- Shipping calculations
- Inventory availability
- Stock reservations
- Order creation
- Payment verification
- Refund authorization
- Administrative permissions

Never trust prices, discounts, shipping fees, or payment status supplied by the browser.

Follow the backend OpenAPI contract.

Handle:
- Validation errors
- Authentication errors
- Authorization errors
- Network failures
- Rate limits
- Server errors
- Empty states
- Loading states

Do not silently swallow errors.

---

## 8. Authentication and Authorization

Use the approved Django-backed session architecture with a Next.js backend-for-frontend (BFF) layer.

Requirements:
- HttpOnly session cookies
- Secure cookies in production
- Appropriate SameSite settings
- CSRF protection
- Session rotation
- Server-side logout
- Backend-enforced authorization
- No tokens in localStorage
- No sensitive credentials in browser storage

The BFF must not act as an unrestricted proxy.

Do not forward arbitrary destinations or untrusted headers.

Prevent SSRF and open-proxy behavior.

Frontend route protection improves UX but is not a security boundary.

All sensitive permissions must be checked by Django.

Customer users must never access another customer's private data.

Admin routes must require authenticated staff with appropriate permissions.

---

## 9. Storefront Requirements

The future storefront includes:
- Homepage
- Product listings
- Category pages
- Product details
- Search
- Filters and sorting
- Product variants
- Vehicle make/model/year filtering and variant compatibility, with optional engine/trim
- Cart
- Checkout
- Guest checkout
- Customer accounts
- Order history
- Order tracking
- Bank transfer proof submission
- Reviews
- Informational pages

Use accessible, responsive UI patterns.

Display PKR prices consistently.

The backend is authoritative for final checkout totals.

---

## 10. Admin Dashboard

The admin panel lives in the same Next.js application under /admin.

It must support:
- Sales dashboard
- Products and variants
- Categories and brands
- Inventory
- Orders
- Payment verification
- COD collection
- Shipping and fulfillment
- Returns and refunds
- Customers
- Promotions and coupons
- Content management
- SEO management
- Reviews
- Reports
- Staff and permissions
- Audit logs
- Store settings

Implement features only in their assigned development phases.

Never expose sensitive admin operations through public frontend routes.

---

## 11. Design System

Design direction:
Modern, minimal, premium.

Build a consistent design system with:
- Typography
- Color tokens
- Spacing
- Responsive breakpoints
- Border radius
- Shadows
- Buttons
- Inputs
- Forms
- Cards
- Navigation
- Tables
- Dialogs
- Feedback states

Prioritize:
- Readability
- Clear hierarchy
- Consistent spacing
- Accessible contrast
- Mobile responsiveness
- Smooth but restrained interactions
- Fast loading

Branding is fixed initially.

Homepage banners, product collections, and informational content will be editable through future backend APIs.

Do not build a drag-and-drop page builder.

---

## 12. SEO Requirements

Technical SEO is a first-class requirement.

Implement as relevant:
- Server-rendered indexable content
- Unique page titles
- Meta descriptions
- Canonical URLs
- Open Graph metadata
- Structured data
- Product schema
- Breadcrumb schema
- Sitemap generation
- robots.txt
- Semantic HTML
- Descriptive image alt text
- SEO-friendly slugs
- Correct status codes
- Redirect handling
- Core Web Vitals optimization

Do not index:
- Admin routes
- Checkout
- Cart
- Private customer pages
- Authentication pages

Avoid duplicate product URLs and duplicate metadata.

---

## 13. Testing

Use:
- Jest
- React Testing Library

Test:
- Shared components
- Forms
- Navigation
- API client behavior
- Validation messages
- Error states
- Loading states
- Admin UI permissions
- Checkout UI flows
- Accessibility-sensitive interactions

Mock external dependencies where appropriate.

Do not introduce Playwright or other testing dependencies without approval.

Run relevant tests after changes.

Never claim tests passed without executing them.

---

## 14. Security Requirements

Follow OWASP security guidance.

Never:
- Expose secrets to the client
- Trust client-calculated totals
- Store sensitive authentication tokens in localStorage
- Render untrusted HTML without proper sanitization
- Expose private payment evidence publicly
- Disable CSRF protections to fix integration problems
- Bypass authorization checks
- Log sensitive credentials or customer payment evidence

Use secure browser and server-side boundaries.

Treat all external API responses as untrusted input.

---

## 15. Docker Development

Primary development environment:
- Windows
- Docker Desktop
- WSL2

All application dependencies must run inside Docker.

Do not require Node.js to be installed on the Windows host.

The backend repository owns compose.yaml.

The frontend Dockerfile must support development hot reloading.

Use environment variables for backend connectivity.

Do not hardcode host-specific absolute paths.

Prefer storing the workspace in the WSL2 filesystem for better performance.

---

## 16. Local Environment Variables

Use `.env.local` as the local development environment file for the Next.js frontend.

### Requirements

1. Create `.env.local` in the frontend repository root.
2. Create `.env.example` documenting all required environment variables with safe placeholder values.
3. Add `.env.local` to `.gitignore`.
4. Never commit `.env.local` or expose its contents.
5. Configure Next.js to read environment variables from `.env.local`.
6. Configure Docker Compose so the frontend container receives the required local environment variables.
7. Never hardcode backend API URLs or sensitive configuration.
8. Whenever a new environment variable is introduced, update `.env.example`.
9. Do not overwrite existing local environment files without approval.
10. Only use the `NEXT_PUBLIC_` prefix for values that are safe to expose in the browser.

### Expected Files

ecommerce-frontend/
├── .env.local
├── .env.example
├── .gitignore
└── next.config.ts

### Example Frontend Environment Variables

```dotenv
# Server-side Django API URL inside Docker
BACKEND_API_URL=http://backend:8000/api/v1

# Public storefront URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
BACKEND_API_TIMEOUT_MS=5000
```

### Important Rules

- `.env.local` is for local development only.
- `BACKEND_API_URL` must be used only in server-side code.
- Browser requests to authenticated backend endpoints should use the Next.js BFF rather than directly exposing internal Docker URLs.
- Never expose Django secrets, database credentials, Redis credentials, or Cloudflare R2 keys to the frontend.
- Never prefix secrets with `NEXT_PUBLIC_`.
- Next.js automatically loads `.env.local` when it is present in the application's working directory; ensure Docker bind mounts and configuration preserve this behavior.
- Keep public and server-only environment variables clearly separated.
- Do not duplicate backend credentials in the frontend environment.
- Let Next.js manage `NODE_ENV` through its startup commands rather than setting it manually in `.env.local`.

---

## 17. Dependency Approval Policy

IMPORTANT: Explicit user approval is required before:

- Installing dependencies
- Updating dependencies
- Removing dependencies
- Adding development tools
- Changing package versions
- Generating or modifying dependency lockfiles
- Introducing third-party services
- Building Docker images that install new dependencies

Before requesting approval, provide:
1. Package name
2. Proposed version
3. Purpose
4. Why it is necessary
5. Alternatives considered
6. Whether it is required or optional

Do not interpret approval for one package list as permission for future packages.

Never install unnecessary dependencies.

---

## 18. Git Rules

- Preserve existing Git history.
- Do not force-push.
- Do not rewrite history without approval.
- Do not push without permission.
- Do not commit secrets.
- Keep commits focused.
- Review changes before committing.
- Do not modify unrelated files.
- Keep frontend and backend changes in their respective repositories.

Use meaningful commit messages.

---

## 19. Development Phases

Follow this sequence:

### Phase 1: Foundation
- Next.js initialization
- TypeScript
- Tailwind CSS
- Docker development setup
- API client foundation
- Design tokens
- Jest
- Basic layouts
- SEO foundation
- Local environment configuration
- Documentation

### Phase 2: Authentication and Catalog
- Authentication UI
- Customer account
- Product listings
- Product details
- Categories
- Variants
- Initial admin catalog UI

### Phase 3: Cart and Checkout
- Guest cart
- Authenticated cart
- Cart merging
- Checkout UI
- Shipping selection
- Order confirmation

### Phase 4: Payments and Fulfillment
- COD
- Bank transfer submission
- Order tracking
- Fulfillment interfaces
- Returns and refunds

### Phase 5: Administration and Content
- Complete admin dashboard
- Promotions
- CMS
- Reviews
- Reports
- Staff management

### Phase 6: Quality and Launch Readiness
- SEO
- Accessibility
- Performance
- Security
- Regression testing
- Documentation

### Phase 7: Production Deployment
- Production infrastructure
- CI/CD
- HTTPS
- Monitoring
- Deployment verification

Do not skip phases without explicit approval.

Production deployment must remain in the final phase.

---

## 20. Work Status and Session Continuity

Maintain a file:

docs/WORK_STATUS.md

After each meaningful milestone, update:
- Current phase
- Completed tasks
- Pending tasks
- Decisions made
- Approved dependencies
- Important files changed
- Tests executed and results
- Known issues
- Next recommended task

At the beginning of a new Codex session:
1. Read AGENTS.md.
2. Read README.md.
3. Read docs/WORK_STATUS.md if it exists.
4. Inspect Git status.
5. Identify the current phase.
6. Continue from the last verified milestone.

Do not assume previous work succeeded without checking.

---

## 21. Definition of Done

A frontend task is complete only when:
- Requirements are satisfied
- Code is readable and maintainable
- TypeScript checks pass
- Relevant Jest tests pass
- Linting passes
- Accessibility is considered
- API contracts are respected
- No secrets are exposed
- Documentation is updated

Report any tests that were not run.

---

## 22. Initial Codex Instructions

The repositories initially contain only README files and these AGENTS.md instructions.

Begin with Phase 1.

First:
1. Inspect both repositories.
2. Read both AGENTS.md files.
3. Propose an implementation plan.
4. Propose dependencies and versions.
5. Explain Docker configuration.
6. Include local environment configuration.
7. Identify blockers.
8. Request approval.

Do not install packages, modify project files, or build images before approval.

After approval, implement incrementally.

Stop after Phase 1 and request approval before starting Phase 2.
