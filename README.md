# GatePass

**Visitor & Gate Pass Management SaaS for Indian corporate offices.**

GatePass is a full-stack, multi-tenant platform that digitises visitor registration, gate pass issuance, and office access tracking across multiple locations. Built as a pnpm workspace monorepo with TypeScript throughout.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 |
| API | Express 5 |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Clerk (email/OTP) |
| Validation | Zod v4, drizzle-zod |
| API Codegen | Orval (from OpenAPI spec) |
| Frontend State | TanStack Query v5 |
| Build | esbuild (API), Vite (frontend) |
| UI | React + Tailwind CSS v4 + wouter + sonner |

---

## Repository Structure

```
gatepass/
├── artifacts/
│   ├── gatepass/          # React frontend (Vite, port via $PORT → 22484)
│   └── api-server/        # Express 5 API (port via $PORT → 8080)
├── lib/
│   ├── db/                # Drizzle schema & migrations
│   ├── api-spec/          # OpenAPI specification
│   └── api-client-react/  # Orval-generated TanStack Query hooks
└── scripts/               # Dev utilities
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `companies` | Tenant accounts with CRM, contract, and license fields |
| `users` | Clerk-linked users with role and office assignment |
| `offices` | Physical office locations per company |
| `visitors` | Visitor records scoped to company + office |
| `visitor_logs` | Check-in / check-out audit trail |
| `gate_passes` | Material, asset, food, and contractor pass records |
| `gp_logs` | Gate pass open/close events |
| `audit_logs` | Platform-wide activity log |

### User Roles

`super_admin` · `admin` · `security` · `viewer`

---

## Key Features

### Visitor Management
- Register visitors with a live camera capture
- Nine dynamic visitor type field sets: Vendor/Contractor, Interview Candidate, Delivery, Government Official, Leadership Visit, Employee (Forgot ID), Guest, and more
- Check-in / check-out flow with break tracking

### Gate Pass Module
- Issue passes for materials, assets, food, and contractor supplies
- Full open/close lifecycle with audit logging

### Multi-location Support
- Office selector scopes all data by location
- Admins manage offices and team members per location

### Badge & Pass Printing
- Built-in template customiser (colours, font size, field toggles)
- Full canvas-style badge creator: size picker (CR80 / A6 / A5 / A4), 15 element types, drag-and-drop layer management, typography and colour controls
- Custom templates saved per workspace

### Settings (9 tabs)
Profile · Customisation · Locations · Badge Templates · Team & Users · Notifications · Integrations · Appearance · Activity

### Super Admin Portal
7-tab platform dashboard accessible at `/admin`:
1. **Overview** — platform metrics, license/plan breakdown, expiring contracts
2. **Companies** — full CRM with multi-contact editor, "Enter as Admin" impersonation, suspend
3. **Licenses** — per-company product assignment, seat usage bars, inline editing
4. **Users** — cross-tenant user management with inline role editing
5. **Platform Admins** — invite super admins, security callout
6. **Activity** — real-time sign-up and company creation feed
7. **Integrations** — per-company SSO (Google/Microsoft), Slack, Teams, SMTP, Webhooks

### Public Landing Page
Marketing page with hero stats, feature cards, how-it-works steps, and INR-denominated pricing tiers (Starter ₹2,999/mo · Growth ₹7,999/mo · Enterprise custom).

---

## Authentication Flow

```
Unauthenticated         → Landing Page (/)
Signed in, no company   → Onboarding (self-serve POST /api/onboard)
super_admin, no company → Admin Panel (/admin)
super_admin, has company→ Main app + /admin route
admin / security / viewer → Main app
```

---

## API Routes

### Public / User
| Method | Route | Description |
|---|---|---|
| GET | `/api/me` | Fetch or upsert current user from Clerk JWT |
| POST | `/api/onboard` | Self-serve company creation |
| GET/POST | `/api/visitors` | Visitor records (scoped to company + office) |
| GET/POST | `/api/gate-passes` | Gate pass records (scoped to company + office) |
| GET/POST/PATCH | `/api/company-settings` | Workspace settings |
| GET/POST/DELETE | `/api/audit-logs` | Audit log (admins: own company; super_admin: all) |

### Super Admin
| Method | Route | Description |
|---|---|---|
| GET/POST/PATCH/DELETE | `/api/admin/companies` | Company CRUD |
| GET | `/api/admin/stats` | Platform-wide metrics |
| GET | `/api/admin/activity` | Recent events feed |
| GET/PATCH | `/api/admin/users` | User management across all companies |

---

## Getting Started

### Prerequisites
- Node.js 24
- pnpm
- PostgreSQL

### Install

```bash
pnpm install
```

### Environment Variables

```env
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
SESSION_SECRET=...
```

### Development

```bash
# Start API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Start frontend (port 22484)
pnpm --filter @workspace/gatepass run dev
```

### Database

```bash
# Push schema to database
pnpm --filter @workspace/db run push
```

### Codegen

```bash
# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen
```

### Type Check

```bash
# Full typecheck across all packages
pnpm run typecheck

# Rebuild composite lib types (run after schema changes)
pnpm run typecheck:libs
```

---

## Design

- **Theme:** Neutral white (`hsl(0 0% 98.5%)`), cool-gray borders, burnt orange primary (`#c06b2c`)
- **Fonts:** Inter (UI) · Plus Jakarta Sans (headings) · JetBrains Mono (IDs / mono values)
- **Branding:** Per-workspace accent colour, font family, and logo via `BrandingContext`

---

## Roadmap

- Role-based access control (RBAC) — the current role model is designed as a precursor to a full RBAC system
- LDAP integration (in settings, marked "coming soon")
- Full API codegen coverage for all admin fields

---

## License

Internal / proprietary — iCIMS OpsEngine.
