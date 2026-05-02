# GatePass — Visitor & Gate Pass Management SaaS

## Overview

Full SaaS platform for Indian corporate offices. pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (email/OTP, super_admin & admin roles)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec`)
- **Frontend state**: TanStack Query v5 (no localStorage)
- **Build**: esbuild (API server), Vite (frontend)

## Artifacts

### GatePass Web App (`artifacts/gatepass`)
- **Route**: `/` (preview path root)
- **Port**: 22484 (via `$PORT`)
- **Stack**: React + Vite + Tailwind CSS v4 + wouter + sonner + Clerk
- **Key Files**:
  - `src/types.ts` — all TypeScript interfaces and constants (Company, CompanyContact, CONTACT_ROLES, UserProfile, Visitor, GatePass, ProductKey, etc.)
  - `src/App.tsx` — ClerkProvider, wouter Router, MainApp, all routes (incl. /settings)
  - `src/contexts/AppContext.tsx` — central API state with TanStack Query
  - `src/pages/LandingPage.tsx` — full public marketing page (hero, features, how-it-works, pricing, CTA, footer)
  - `src/pages/AdminPanel.tsx` — 7-tab Super Admin dashboard (Overview, Companies, Licenses, Users, Platform Admins, Activity, Integrations)
  - `src/pages/Settings.tsx` — 9-tab workspace settings page (profile/customization/badge-templates/team/locations/notifications/integrations/appearance/activity)
  - `src/pages/OnboardingPage.tsx` — company self-setup for new admins
  - `src/pages/Dashboard.tsx` — VM Dashboard with "Register Visitor" button
  - `src/pages/GpDashboard.tsx` — GP Dashboard with "New Gate Pass" button
  - `src/components/modals/RegisterVisitorModal.tsx` — full visitor registration with camera + 9 dynamic visitor type field sets
  - `src/components/layout/Sidebar.tsx` — nav with Settings item + gear icon; Admin only for super_admin
  - `src/components/layout/AppLayout.tsx` — title/module map includes settings module

- **Auth flow**:
  - Unauthenticated → LandingPage (route `/` or any protected path)
  - Signed in, no company → OnboardingPage (self-serve `POST /api/onboard`)
  - super_admin, no company → AdminPanel directly
  - super_admin, has company → main app + `/admin` route
  - admin/security/viewer → main app

- **Theme**: Neutral white (`hsl(0 0% 98.5%)`), cool gray borders, burnt orange primary (`#c06b2c`)
- **Fonts**: Inter (UI), Plus Jakarta Sans (headings), JetBrains Mono (IDs)

### API Server (`artifacts/api-server`)
- **Route**: `/api`
- **Port**: 8080 (via `$PORT`)
- **Key routes**:
  - `GET /api/me` — fetch/upsert current user from Clerk JWT
  - `POST /api/onboard` — self-serve company creation
  - `GET/POST/PATCH/DELETE /api/admin/companies` — company CRUD (super_admin only)
  - `GET /api/admin/stats` — platform-wide metrics
  - `GET /api/admin/activity` — recent events feed
  - `GET/PATCH /api/admin/users` — user management across all companies
  - `GET/POST /api/visitors`, `GET/POST /api/gate-passes` — scoped to user's company+office
- **Middlewares**: `requireAuth` (Clerk JWT verification), `requireSuperAdmin`
- **Auth note**: Uses direct Clerk REST API (`https://api.clerk.com/v1/users/{id}`) to fetch real emails/names

## Database Schema (`lib/db`)

Tables: `companies`, `users`, `offices`, `visitors`, `visitor_logs`, `gate_passes`, `gp_logs`, `audit_logs`

### `companies` — enhanced with CRM & license fields
- Basic: `id`, `name`, `slug`, `logoUrl`, `plan` (starter/growth/enterprise), `isActive`
- CRM: `contactName`, `contactEmail`, `contactPhone`
- Multi-contacts: `contacts` TEXT DEFAULT '[]' — JSON array of `CompanyContact[]`
- Contract: `contractStart`, `contractEnd`, `contractValue`
- License: `products` (JSON string: ProductKey[]), `licenseStatus` (trial/active/expired/suspended)
- `notes`

### `users`
- `clerkId`, `companyId`, `officeId`, `name`, `email`
- `role`: super_admin | admin | security | viewer

## Super Admin Portal (AdminPanel)

7-tab dashboard accessible at `/admin` (super_admin only):

1. **Overview** — metric cards (companies, users, visitors, active licenses), license/plan breakdowns, recently added companies, expiring contracts. Graceful "access required" fallback if stats unavailable.
2. **Companies** — full CRM table with contact/contract/license info, Edit modal with all fields + multi-contact editor (add/remove contacts with roles), "Enter as Admin" impersonation, Suspend
3. **Licenses** — per-company product assignment + license status + seat allocation. Summary bar (total/active/trial/seats). Per-company seat usage bar (green→amber→red at 70/90%), inline maxSeats editing, contract dates with expiry warnings. Inactive products hidden (no strikethrough); empty state "No products assigned — click Edit" shown.
4. **Users** — all users across platform, filter by company, inline role & company editing
5. **Platform Admins** — lists all super_admin users from `/api/admin/users`, invite-by-email modal, security callout ("never elevate company users"), DB assignment instructions
6. **Activity** — timeline of recent sign-ups and company creations
7. **Integrations** — per-company integration config (left: company list, right: SSO Google/Microsoft, Slack, Teams, SMTP, Webhooks). Each integration has a toggle + inline config panel with appropriate fields. Changes audit-logged to `/api/audit-logs`.

### CompanyFormModal — multi-contact section
- Primary Contact (legacy single contact fields)
- Additional Contacts: dynamic list of `CompanyContact` cards, each with name/email/phone/role (Primary, Technical, Billing, Operations, Other)
- Stored as JSON in `companies.contacts` column

### "Enter as Admin" impersonation
- Clicking "Enter as Admin" sets `localStorage.gp_impersonate = {companyId, companyName}`
- Navigates to `/` — AppContext scopes API calls for that company

## Settings Page (`/settings`)

9-tab workspace settings page (all users):
1. **Profile** — name, email (read-only from Clerk), role, company
2. **Customization** — visitor & GP types, form field configuration (modernized AccordionSection with icon box + smooth chevron, cleaner hover states):
   - Built-in field rows: inline editable label (stored in `gp_vfield_labels_v1` / `gp_gpfield_labels_v1`), TEXT data type badge
   - Custom field rows: coloured `DataTypeBadge` (10 types: text/number/date/email/phone/boolean/select/file/url/textarea), editable label, enable/require toggles, delete
   - Add field row: type selector dropdown + label input + Add button
3. **Locations** — office management (live API), edit office details, active/inactive toggle
4. **Badge Templates** — 4-up grid of templates with "Open Editor" button launching `BadgeTemplateEditorModal`:
   - **Full-screen editor**: left sidebar (template list with active badge), center (2.4× scaled live preview with label/desc), right panel (primary color + accent color pickers with hex input, font size S/M/L, show photo/logo/QR toggles, 6 quick color presets). Config persisted to `gp_badge_cfg_v1` / `gp_gp_cfg_v1`.
5. **Team & Users** — invite by email, role reference table
6. **Notifications** — per-event toggle switches (in-app), email config placeholder
7. **Integrations** — Microsoft 365 / Google Workspace toggles, LDAP coming soon
8. **Appearance** — accent color swatches + custom color picker, font family select, theme picker
9. **Activity** — audit log timeline with entity filter dropdown, relative timestamps ("5m ago"), color-coded action badges (created/updated/deleted/invited/enabled/disabled/checkin/checkout), entity emoji icons, actor name+email, JSON details grid. Auto-refreshes every 30s. Refresh button. Reads from `GET /api/audit-logs`.

### localStorage keys
- `gp_branding_v1` — branding (logo, color, font)
- `gp_vt_v1`, `gp_gpt_v1` — visitor & gate pass types
- `gp_vfields_v1`, `gp_gpfields_v1` — built-in field enable/require config
- `gp_custom_vfields_v1`, `gp_custom_gpfields_v1` — custom field definitions (include `dataType`)
- `gp_vfield_labels_v1`, `gp_gpfield_labels_v1` — built-in field label overrides
- `gp_badge_cfg_v1`, `gp_gp_cfg_v1` — template customizer config (colors, toggles, font size)
- `gp_webhooks_v1`, `gp_apikeys_v1` — integrations config

## RegisterVisitorModal — dynamic visitor type fields

Camera: `getUserMedia` → stream assigned via `useEffect` after `setCamActive(true)` to ensure `<video>` is mounted.

Dynamic extra fields per visitor type:
- **Vendor / Contractor** → Contract Ref + Service Type
- **Interview Candidate** → Job ID + Interview Round
- **Delivery** → Vehicle/Courier Number
- **Government Official** → ID Type (Aadhaar/PAN/Passport/etc.) + ID Number
- **Leadership Visit** → Home Office + Visit Agenda
- **Employee (Forgot ID)** → Employee ID + Department
- **Guest** → Relationship to Host

## Public Landing Page

Full marketing page with sections:
- Sticky header with nav links (Features, How it Works, Pricing)
- Hero with stats (10k+ visitors, 50+ companies, 99.9% SLA)
- Feature cards (6 features with Core/Growth badges)
- How it works (3 steps)
- Pricing (Starter ₹2,999/mo, Growth ₹7,999/mo, Enterprise custom)
- CTA banner
- Footer with links

## API Codegen

Regenerate after OpenAPI spec changes:
```
pnpm --filter @workspace/api-spec run codegen
```

Generated hooks are in `lib/api-client-react/src/generated/api.ts`.
New admin fields (contactName, contacts etc.) not yet in codegen — use `as never` cast until next codegen run.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild composite lib types (run after schema changes)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push Drizzle schema to DB (dev only)

## Audit Log API (`/api/audit-logs`)

- `GET /api/audit-logs` — company admins see their own company's logs; super_admin sees all (or filters by `?companyId=`)
- `POST /api/audit-logs` — create a log entry (`action`, `entity`, `entityId`, `entityLabel`, `details` JSON)
- `DELETE /api/audit-logs` — super_admin only, optionally scoped by `?companyId=`
- Schema: `audit_logs` table with `companyId`, `userId`, `actorName`, `actorEmail`, `action`, `entity`, `entityId`, `entityLabel`, `details`, `createdAt`

## Express 5 Params Typing

Express 5 types `req.params` values as `string | string[]`. All route files use `req.params["paramName"] as string` pattern instead of destructuring, to satisfy Drizzle ORM's `eq()` which requires `string | SQLWrapper`.

## Notes

- `CLERK_SECRET_KEY` env var used for Clerk REST API calls in `auth.ts`
- `SESSION_SECRET` available as env var
- Both super_admin users: nagababu1403c4@gmail.com & basanagababu1998@gmail.com
- `/settings` route accessible to all authenticated users; `/admin` is super_admin only
- All 4 workspace packages typecheck cleanly (zero TS errors)
