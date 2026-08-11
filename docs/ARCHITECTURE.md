# PRO FITNESS OS Architecture

## Status

This repository is currently in architecture and project-initialization mode. It does not yet contain a Next.js application scaffold, package manifest, database schema, authentication implementation, deployment configuration, or runtime environment files.

Do not build the full product in this phase. The next implementation step should create the foundation deliberately and keep the scope small.

## A. Repository Audit

### Current Repository Shape

- Git repository exists with no commits on `master`.
- Existing content is documentation only.
- Existing docs:
  - `docs/product-vision.md`
  - `docs/product-technical-framework.md`
  - `docs/web-app-development-path.md`

### Current Framework And Dependencies

- No `package.json` found.
- No Next.js, React, TypeScript, Tailwind, Prisma, Auth.js, or test dependencies are currently installed.
- No lockfile found.

### Current Database Setup

- No Prisma schema found.
- No migrations found.
- No database connection configuration found.
- Existing planning docs mention Supabase/Drizzle in places, but the target architecture for this project is PostgreSQL with Prisma ORM.

### Current Authentication

- No authentication implementation exists.
- Existing planning docs mention Supabase Auth as an option, but the target authentication architecture is Auth.js/NextAuth with email/password, email verification, password reset, and secure sessions.

### Current UI Components

- No app source tree exists.
- No component library exists.
- No shadcn/ui setup exists.
- No Tailwind configuration exists.

### Current Environment Variables

- No `.env`, `.env.local`, or `.env.example` found.
- Future environment variables must be introduced through a safe `.env.example` without secrets.

### Current Scripts

- No package scripts exist because there is no package manifest.

### Current Deployment Configuration

- No Vercel, Docker, CI, or deployment configuration found.

### Preserve

- Preserve existing product strategy docs.
- Preserve the ProFitness product concepts:
  - Arena
  - ProScore
  - Streak Rings
  - Journey
  - Tribe
  - Challenges
  - Fuel
  - Coach
  - Confidence Mode
  - Gold Drop
- Preserve the premium, inclusive, black-gold fitness identity unless the brand direction changes.

### Remove Or Refactor Later

- Reconcile older Supabase/Drizzle recommendations with the new PostgreSQL + Prisma + Auth.js target.
- Refactor planning docs over time so there is a single authoritative implementation direction.
- Avoid adding product modules before the foundation is stable.

## B. Recommended Architecture

### Frontend

- Next.js App Router.
- TypeScript with strict mode.
- Tailwind CSS for design tokens and utility styling.
- shadcn/ui on top of Radix primitives.
- Lucide icons.
- Responsive design from the first implementation.
- Accessibility-conscious forms, dialogs, navigation, keyboard states, contrast, focus management, and semantic structure.

### Backend

- Next.js App Router as the backend boundary.
- Server Components for protected data loading.
- Server Actions for form submissions and authenticated mutations when they are same-origin app operations.
- Route Handlers for external integrations, webhooks, uploads, receipts, and machine-to-machine APIs.
- Centralized service modules for domain operations.
- Explicit server-side authorization checks before every protected read or mutation.

### Database

- PostgreSQL as the primary relational store.
- Prisma ORM for schema, migrations, generated types, and query access.
- Database constraints for domain invariants where practical.
- Explicit indexes for member search, attendance, memberships, payments, invoices, leads, follow-ups, and audit logs.

### Authentication

- Auth.js/NextAuth.
- Secure session strategy using either database sessions or JWT sessions depending on deployment and invalidation needs.
- Email/password login.
- Email verification.
- Password reset.
- Password hashing handled by a proven library.
- Account lockout or throttling supported through Redis-backed rate limits.

### Infrastructure

- Redis for rate limiting, queues, short-lived caches, idempotency locks, and background job coordination.
- BullMQ for jobs such as emails, receipt generation, invoice dispatch, media processing, notifications, membership expiry reminders, and future automation.
- Object storage for media and documents.
- Vercel or equivalent Node-compatible hosting for the web app.
- Separate worker runtime for BullMQ where the deployment platform supports persistent workers.

## C. Folder Structure

Recommended foundation:

```text
profitness/
  app/
    (public)/
    (auth)/
    (member)/
    (staff)/
    (admin)/
    api/
      webhooks/
      receipts/
      uploads/
  components/
    ui/
    layout/
    forms/
    website/
    member/
    admin/
    staff/
  config/
    navigation.ts
    roles.ts
    site.ts
  db/
    prisma.ts
    seed/
  docs/
  lib/
    auth/
    authorization/
    billing/
    cms/
    env/
    jobs/
    mail/
    media/
    receipts/
    security/
    validation/
  prisma/
    schema.prisma
    migrations/
  public/
    brand/
    images/
  tests/
    unit/
    integration/
    e2e/
```

Notes:

- Keep route groups aligned to user surfaces: public, auth, member, staff, admin.
- Keep business rules in `lib/` or domain modules, not embedded directly in React components.
- Keep Prisma client creation in one module.
- Keep environment parsing in one validated module.

## D. Database And Domain Architecture

Start with a minimal foundation, not the full future schema.

Initial foundation models should likely include:

- `User`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `Member`
- `Staff`
- `MembershipPlan`
- `Membership`
- `Attendance`
- `Payment`
- `Invoice`
- `InvoiceItem`
- `Lead`
- `FollowUp`
- `AuditLog`
- `Settings`

Do not create all future models until the relevant product phase begins.

Domain boundaries:

- Identity: users, credentials, sessions, verification tokens.
- Authorization: roles, permissions, grants, policy helpers.
- CRM: leads, follow-ups, member profile notes, lifecycle status.
- Memberships: plans, active memberships, renewals, freezes, cancellations.
- Attendance: check-ins, source, staff attribution, deduplication rules.
- Billing: payments, invoices, invoice items, receipts, refunds, payment provider records.
- Staff and trainers: staff records, trainer assignments, trainer-visible member data.
- CMS: website, pages, sections, media, testimonials, FAQs.
- Audit: append-only record of protected changes.

## E. Authentication Strategy

- Use Auth.js/NextAuth as the authentication boundary.
- Use Prisma adapter if database sessions and account records are required.
- Support credentials-based email/password login.
- Store password hashes only, never plaintext passwords.
- Require email verification before privileged access.
- Implement password reset through signed, expiring tokens.
- Rate limit login, registration, verification, and reset flows.
- Keep session callback payload minimal: user id, role summaries, and display metadata only.
- Do not rely on client-visible role data for protected operations.

## F. Authorization Strategy

Roles:

- Super Admin
- Admin
- Manager
- Trainer
- Receptionist
- Member

RBAC approach:

- Store roles and permissions in the database.
- Seed baseline roles and permissions in a repeatable seed script.
- Use permission checks in server actions, route handlers, and service functions.
- Use ownership checks for member-specific resources.
- Keep trainer access scoped to assigned members unless elevated by explicit permission.
- Keep receptionist access focused on attendance, leads, memberships, payments, and receipt workflows.
- Record sensitive mutations in `AuditLog`.

Authorization must happen server-side. Client navigation guards are user experience helpers, not security controls.

## G. CMS Architecture

CMS scope:

- Public website pages.
- Website sections.
- Testimonials.
- FAQs.
- Media library.
- Announcements.

Recommended model:

- Keep page and section records structured rather than arbitrary executable content.
- Use versioning or draft/published states before allowing live edits.
- Sanitize rich text and user-provided HTML.
- Store media in object storage and metadata in PostgreSQL.
- Use signed upload URLs for private media operations.
- Use public object storage only for approved website assets.
- Revalidate public pages after CMS publish actions.

Do not fabricate external CMS integrations. Start with internal CMS models and admin UI when the CMS phase begins.

## H. Billing Architecture

Core concepts:

- Membership plans define pricing, duration, terms, tax behavior, and active status.
- Memberships represent a member's purchased access period and state.
- Payments record money movement and provider references.
- Invoices record the legal/commercial bill.
- Invoice items record line-level pricing and tax details.
- Digital receipts are generated from successful payment records.

Rules:

- Invoice numbers must be unique and generated server-side.
- Payment webhooks must be idempotent.
- Payment status transitions must be explicit.
- Receipt generation should be reproducible from stored invoice/payment data.
- Never mutate historical invoice totals silently.
- Refunds and voids should be modeled as explicit records or state transitions.

Payment providers should be chosen later with explicit approval. Razorpay may be a likely India-focused option, but it is not integrated yet.

## I. Printer Integration Architecture

Thermal printing should be isolated from billing logic.

Recommended approach:

- Generate a normalized receipt payload from invoice/payment data.
- Render digital receipts for email/download separately from thermal receipt output.
- Add a printer adapter layer for ESC/POS or browser-based printing when the hardware is known.
- Support printer profiles for paper width, character set, logo support, cutter support, and cash drawer behavior.
- Queue print jobs and track status when printing from a staff station.
- Never let a printer failure change payment or invoice state.

Implementation depends on printer model and connection method:

- USB local printer.
- Network ESC/POS printer.
- Bluetooth printer.
- Browser print dialog.
- Local bridge application.

No printer integration should be built until hardware details are confirmed.

## J. Testing Strategy

Use layered testing:

- Unit tests for pure business rules.
- Integration tests for Prisma repositories, service functions, authorization checks, billing state transitions, and webhook idempotency.
- Component tests for complex forms and shared UI where useful.
- End-to-end tests for critical flows:
  - signup
  - login
  - password reset
  - member creation
  - membership purchase/renewal
  - attendance check-in
  - payment receipt
  - admin authorization boundaries

Recommended tools when the app is initialized:

- Vitest for unit and integration tests.
- React Testing Library for component behavior.
- Playwright for end-to-end smoke tests.
- Prisma test database setup for integration tests.

## K. Security Strategy

Security baseline:

- Strict TypeScript.
- Server-side input validation.
- Server-side authorization.
- Secure session cookies.
- CSRF protections where applicable.
- Rate limiting for auth, lead forms, uploads, AI, and webhooks.
- Webhook signature verification.
- Audit logging for sensitive actions.
- No secrets in source control.
- Principle of least privilege for database, storage, and service tokens.
- Dependency review before adding packages.
- Safe upload handling with file type, size, and access controls.
- Privacy controls for member progress photos, measurements, and health-adjacent data.

See `docs/SECURITY.md` for the detailed plan.

## L. Deployment Strategy

Recommended production path:

- GitHub repository with protected main branch.
- Vercel for Next.js web deployment.
- Managed PostgreSQL provider.
- Managed Redis provider.
- Object storage provider.
- Separate worker deployment for BullMQ if background jobs require long-running workers.
- Preview deployments for pull requests.
- Environment variables managed per environment.
- CI checks for lint, typecheck, tests, and Prisma migration validation.

Environments:

- Local.
- Preview/staging.
- Production.

Production releases should include:

- Database migration review.
- Backup/rollback plan.
- Smoke test checklist.
- Security-sensitive environment variable verification.

## M. Development Phases

1. Foundation initialization.
   - Create Next.js TypeScript app.
   - Add Tailwind and shadcn/ui.
   - Add strict linting/typechecking.
   - Add Prisma and PostgreSQL connection.
   - Add environment validation.
   - Add initial CI-ready scripts.

2. Authentication and RBAC.
   - Auth.js setup.
   - Email/password.
   - Email verification.
   - Password reset.
   - Seed roles and permissions.
   - Server-side authorization helpers.

3. Public website and lead capture.
   - Home, memberships, transformations, contact.
   - Lead form.
   - Admin lead notification job.

4. Admin CRM foundation.
   - Member directory.
   - Lead management.
   - Staff management.
   - Membership plan management.
   - Audit logging.

5. Membership, attendance, and billing.
   - Membership lifecycle.
   - Check-ins.
   - Payments.
   - Invoices.
   - Digital receipts.

6. Member dashboard.
   - Member profile.
   - Club pass.
   - Attendance history.
   - Basic progress tracking.

7. Trainer and staff dashboards.
   - Assigned members.
   - Attendance and membership workflows.
   - Trainer notes and plan assignment.

8. CMS and media.
   - Website editor.
   - Media management.
   - Testimonials and FAQs.

9. Background jobs and integrations.
   - Redis.
   - BullMQ.
   - Email jobs.
   - Payment webhooks.
   - Printer adapter once hardware is confirmed.

10. Advanced retention platform.
    - Analytics.
    - Notifications.
    - Automation.
    - WhatsApp/SMS/email workflows after providers are chosen.
