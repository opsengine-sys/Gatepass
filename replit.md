# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### GatePass — Visitor & Gate Pass Management (`artifacts/gatepass`)
- **Route**: `/` (preview path root)
- **Port**: 22484
- **Stack**: React + Vite + Tailwind CSS v4 + wouter (routing) + sonner (toasts)
- **Storage**: 100% localStorage — no backend API calls
- **Key Files**:
  - `src/types.ts` — all TypeScript interfaces and constants
  - `src/hooks/useAppState.ts` — centralized state with localStorage persistence + seed data
  - `src/App.tsx` — router with all 8 routes
  - `src/pages/` — Dashboard, Visitors, ActivityLog, VisitorLink, GpDashboard, GatePasses, GpActivityLog, RegisterPage
  - `src/components/modals/` — RegisterVisitorModal, VisitorDetailModal, BadgeModal, NewGatePassModal, GpDetailModal, OfficePicker
- **Features**:
  - Visitor check-in/check-out/break management with unique Visitor IDs
  - Gate pass creation, tracking, and closure
  - Printable visitor badges and gate pass documents
  - Public visitor pre-registration page (`/register`)
  - Multi-office support (6 Indian corporate offices)
  - CSV export for visitors and gate passes
  - Activity logs for both visitor and gate pass events
- **Theme**: Warm parchment (`#f5f4f1`), burnt orange (`#c06b2c`) for visitors, teal (`#1a6e7a`) for gate passes
- **Fonts**: Instrument Sans (UI), Lora (headings), JetBrains Mono (IDs)
- **CSS Note**: Button utility classes defined in `@layer components {}` in `index.css`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
