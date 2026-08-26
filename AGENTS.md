# PRO FITNESS OS Agent Instructions

These instructions are durable guidance for future Codex tasks in this repository.

## Working Principles

- Understand the existing architecture before modifying it.
- Inspect relevant files, scripts, dependencies, database configuration, authentication, authorization, environment variables, and deployment settings before making changes.
- Preserve existing functionality unless the user explicitly approves a replacement.
- Avoid unnecessary dependencies. Prefer framework features, existing utilities, and small focused modules.
- Avoid premature abstractions. Add abstractions only when they reduce real complexity or match an established project pattern.
- Avoid giant monolithic components. Split UI, domain logic, validation, data access, and authorization into focused modules.
- Keep domain logic modular and testable.
- Use reusable UI components and shared design tokens where appropriate.
- Maintain accessibility in all user-facing interfaces.
- Document major architectural decisions in `docs/` when they affect database behavior, security, integrations, deployment, or long-term maintainability.

## TypeScript And Code Quality

- Use TypeScript strictly.
- Maintain strong typing from the database layer through server actions, route handlers, and UI props.
- Avoid `any` unless there is a documented reason and a safer type is impractical.
- Validate inputs server-side for all protected operations and external entry points.
- Keep client components small and interactive; prefer server components for data loading where practical.
- Run lint, typecheck, and tests after changes when scripts exist.
- Write tests for critical business logic, especially authentication flows, authorization decisions, billing calculations, attendance, membership state transitions, invoice generation, and audit logging.

## Security

- Never trust client-side authorization.
- Use server-side authorization for protected operations.
- Check role and permission requirements inside server actions, route handlers, and service functions before mutating or exposing protected data.
- Never expose secrets to the browser.
- Never hardcode API keys, tokens, passwords, webhook secrets, database URLs, or private credentials.
- Use environment variables for configuration and secrets.
- Only expose variables with a public prefix when they are intentionally safe for browser use.
- Sanitize and validate file uploads, webhook payloads, and rich text or CMS content.

## Database And Migrations

- Never silently change database behavior.
- Never perform destructive migrations without explicit approval.
- Avoid deleting or rewriting existing data unless the user has clearly approved the operation.
- Keep migrations reviewable and reversible where possible.
- Document data model changes that affect membership state, payments, invoices, audit logging, or authorization.
- Prefer explicit relations, indexes, constraints, and enums for core domain rules.

## Product Boundaries

- PRO FITNESS OS is a production-grade Gym Management and CRM platform, but it must be built in phases.
- Do not build the complete product unless the user explicitly asks for that phase.
- Align implementation with the current architecture docs:
  - `docs/ARCHITECTURE.md`
  - `docs/DATABASE.md`
  - `docs/INTEGRATIONS.md`
  - `docs/SECURITY.md`
  - `docs/ROADMAP.md`
- When requirements conflict with older planning docs, ask for clarification or follow the latest user-approved architecture.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
