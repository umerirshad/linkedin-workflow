# LinkedIn Workflow

A single-user, human-in-the-loop workspace for organizing approved profile exports, lists, workflow runs, schedules, and authorized LinkedIn integrations.

## Guardrails

- Profile collection supports CSV/user-provided exports and an adapter contract for authorized providers.
- There is no unauthorized LinkedIn scraping, session-cookie extraction, browser automation, or detection evasion.
- An unsupported LinkedIn action is represented as a manual task for the user to complete.
- Provider credentials belong only in server-side environment variables.

## Stack

- Next.js `16.4.2` App Router with TypeScript and Tailwind CSS 4.
- React `19.3.0`; Next 16 is configured for the App Router and its current server/client component model.
- PostgreSQL with Prisma `7.10.1`, `@prisma/adapter-pg`, and `pg`.
- Zod `4.6.7` for input validation.
- PapaParse `5.7.0` for CSV parsing.
- `@xyflow/react` `^12.8.6` (lockfile resolves `12.12.0`) for the future workflow editor; it is intentionally not wired into the first screen.

The versions are pinned or range-constrained to stay on the installed major lines. Prisma CLI and client are kept on the same 7.10.1 line because the repository initially contained a mismatched extraneous Prisma 8 release candidate.

## Local setup

```bash
cp .env.example .env
# Set DATABASE_URL in .env
npm install
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000. `npm run lint` and `npm run build` are the available checks.

## Structure

```text
src/app/                    App Router UI shell
src/lib/                    Prisma singleton and Zod schemas
src/modules/profile-imports CSV adapter and provider source contract
src/modules/lists/           List domain types
src/modules/workflows/       Workflow definition types
src/modules/scheduling/      Scheduling types
src/modules/linkedin/        Authorized-provider contract and manual fallback
prisma/schema.prisma         PostgreSQL persistence model
```

## Phased implementation plan

### Phase 1 — foundation (current)

- Establish the single-user dashboard shell and independent module boundaries.
- Add the PostgreSQL/Prisma schema for profiles, imports, lists, workflows, executions, and manual tasks.
- Add Zod input contracts, CSV parsing, and an authorized-provider adapter interface.
- Document security boundaries and environment configuration.

### Phase 2 — profile imports and lists

- Add a server-side CSV upload flow with preview, row-level validation errors, deduplication, and import history.
- Persist profiles and source provenance; add list creation, filtering, membership, and archive flows.
- Add tests for malformed rows, duplicate profile URLs, and user-provided exports.

### Phase 3 — workflow editor and execution

- Build the React Flow editor for delay, condition, note, and manual-task nodes.
- Validate and version workflow definitions before saving.
- Add resumable execution records with idempotency and clear failure states.

### Phase 4 — scheduling and manual task inbox

- Add timezone-aware scheduling windows and a task inbox with due, snoozed, skipped, and complete states.
- Keep all unsupported provider actions as explicit manual tasks.

### Phase 5 — authorized integrations

- Implement only approved provider APIs behind the adapter contract, with least-privilege scopes and encrypted credential storage.
- Add consent, token rotation, rate-limit handling, audit logs, and provider-specific capability checks.
- Keep unsupported capabilities disabled and mapped to manual tasks.

### Phase 6 — hardening

- Add authentication before any multi-user or remote deployment work.
- Add database migrations in CI, unit/integration tests, browser coverage, backups, observability, and production security review.

## Current scope

This repository contains Phase 1 only. The dashboard is intentionally static while the persistence and execution flows are designed for the next phases; no phase-2+ automation has been implemented.
