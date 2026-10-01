# SocialProof Frontend Redesign Design

## Goal

Replace the default shadcn/Geist scaffold with the **SocialProof** visual identity
from the approved mockups (dashboard, login, signup). Introduce a shared
authenticated shell, a derived design system (light + dark), and consistent
patterns for routes that have no dedicated mock. Preserve all existing BFF and
Nest contracts; derive dashboard analytics in the browser from current APIs.

Visual references (session assets):

- Dashboard: `assets/dashboard-ea06681d-2832-4afd-a2a6-2bc8fc435abf.png`
- Login: `assets/tela_login-1957ca46-a9c8-4f13-a422-489ee43ff109.png`
- Signup: `assets/tela_cadastro-6a863fc3-547d-41ef-9aaa-2cc675726339.png`

Domain language remains in `CONTEXT.md` at the repo root.

## Product decisions (locked)

| Topic | Decision |
| --- | --- |
| Brand | **SocialProof** with chat-bubble logo as in mockups |
| Campanhas | First-class sidebar/top item between Posts and Moderação |
| Configurações | New **`/settings`** route: profile, plan, Instagram, preferences, theme |
| Dashboard data | Mock-faithful layout; KPIs, chart, activity feed from **existing** BFF only |
| Theme | Light + dark from the same palette; user toggle in Settings |

## Constraints

- Next.js 16.2.11 App Router, React 19, TypeScript strict, Tailwind CSS 4,
  React Query, existing shadcn-style primitives under `src/components/ui/`.
- Auth backend fields unchanged: login `email` + `password`; signup `name`,
  `email`, `password`, `subdomain` (`src/features/auth/schemas.ts`).
- JWT stays HTTP-only; no new auth endpoints.
- Posts list filters use `PostListStatusQuery`: `pending` | `approved` | `rejected`
  (lowercase query string to BFF). UI copy maps to **Pendente**, **Aprovado**,
  **Rejeitado** (`ModerationStatus` on entities is uppercase).
- Do not add Nest analytics endpoints or widget view counts in this phase.
- Portuguese (pt-BR) only.
- Use `src/proxy.ts` for route protection (not deprecated middleware).

## Out of scope

- Nest embed script (`GET /api/widget/:id.js`) visual redesign
- New backend analytics (totals beyond list `meta.total`, widget impressions)
- Global search across entities
- i18n
- Storybook
- Billing / subscription checkout UI

---

## Design system

### Color tokens

Map to CSS variables in `src/app/globals.css` (`:root` and `.dark`). shadcn
semantic names (`--primary`, `--background`, etc.) should resolve to these.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `brand-primary` | `#2563EB` | `#3B82F6` | Primary buttons, links, chart stroke, active nav |
| `brand-header` | `#1E3A8A` | `#1E293B` | Top bar background (dark: with subtle border) |
| `surface-page` | `#F3F4F6` | `#0F172A` | Authenticated main background |
| `surface-card` | `#FFFFFF` | `#1E293B` | Cards, tables, form panels |
| `status-warning` | `#F59E0B` on `#FFFBEB` | `#FBBF24` on `#422006` | Pendente pills |
| `status-success` | `#16A34A` on `#F0FDF4` | `#4ADE80` on `#14532D` | Aprovado pills |
| `status-destructive` | `#DC2626` on `#FEF2F2` | `#F87171` on `#450A0A` | Errors, Rejeitado |
| `accent-widgets` | `#7C3AED` | `#A78BFA` | Widget KPI icon accent only |

Borders: light `#E5E7EB`; dark `#334155`. Muted text: light `#6B7280`; dark
`#94A3B8`.

### Typography

- Replace Geist with **Inter** via `next/font/google` in root layout.
- Single family; weights 400 (body), 500 (labels), 600 (section titles), 700
  (page titles, KPI numbers optional).
- Scale: page title 24–28px semibold; KPI value 32px semibold; body 14–16px;
  form labels 14px medium.
- Avoid decorative eyebrows, ALL CAPS section labels, and single-word headline
  accents.

### Layout and elevation

- Card radius: `rounded-xl` (~12px); control radius: `rounded-lg` (~8px).
- Default card shadow: soft single layer (`shadow-sm`); no hover shadow on every
  row.
- Authenticated content: left-aligned; form pages max-width `42rem` centered in
  content area when appropriate.
- Spacing: generous padding inside cards (`p-6`); grid gap `gap-4` / `gap-6`.

### Motion

- Respect `prefers-reduced-motion`.
- No staggered fade-in on dashboard cards at load.
- Transitions only for user actions: drawer open, dropdown, button pending
  state.

### Icons

- `lucide-react`, stroke width consistent with mock (thin line).

### Theme toggle

- Settings → Preferências: Light / Dark / System.
- Persist choice in `localStorage` key `socialproof-theme`.
- Apply `class="dark"` on `<html>` when dark; inline script in layout optional
  to avoid flash (implementation detail in plan).

---

## Architecture

### Route groups

```text
src/app/
  (auth)/
    login/page.tsx
    signup/page.tsx
    layout.tsx          → AuthSplitLayout (no AppShell)
  (authenticated)/
    layout.tsx          → AppShell
    dashboard/page.tsx
    posts/...
    campaigns/...
    moderation/...
    widgets/...
    settings/page.tsx   → new
  auth/instagram/callback/   → unchanged, no shell
  logout/page.tsx            → unchanged, no shell
```

Move existing authenticated pages under `(authenticated)` without changing URL
paths (route groups do not affect URLs).

### Shell components

| Module | Responsibility |
| --- | --- |
| `src/components/brand/SocialProofLogo.tsx` | Icon + wordmark; links to `/dashboard` when authed |
| `src/components/layout/AppShell.tsx` | Grid: sidebar + column (top bar + main) |
| `src/components/layout/SidebarNav.tsx` | Primary nav + footer Perfil link |
| `src/components/layout/TopBar.tsx` | Optional mirrored links, search placeholder, notifications, user menu |
| `src/components/layout/AuthSplitLayout.tsx` | 45/55 split wrapper |
| `src/components/layout/AuthMarketingPanel.tsx` | Gradient panel, copy, static dashboard illustration |
| `src/components/patterns/MetricCard.tsx` | KPI card with icon, value, subtext |
| `src/components/patterns/StatusBadge.tsx` | Pendente / Aprovado / Rejeitado pills |
| `src/components/patterns/PageHeader.tsx` | Title, description, primary action slot |
| `src/components/patterns/FilterPanel.tsx` | Dashboard “Filtrar posts” + reusable filter card |
| `src/components/patterns/EmptyState.tsx` | Icon, message, CTA |

Extend `src/components/ui/*` via tokens; do not duplicate Button/Input logic.

### Navigation IA

Sidebar order (and mirrored top links):

1. Dashboard → `/dashboard`
2. Posts → `/posts`
3. Campanhas → `/campaigns`
4. Moderação → `/moderation`
5. Widgets → `/widgets`
6. Configurações → `/settings`

Sidebar footer: **Perfil** → `/settings#perfil`.

Active state: light blue background + left vertical bar (mock).

**Top bar search (v1):** disabled text field with tooltip “Em breve” — no
global search implementation.

**Notifications (v1):** bell icon; badge shows pending moderation count from
`GET /api/posts?status=pending&limit=1` → `meta.total` (shared React Query key
with dashboard). Click navigates to `/moderation`. No dropdown feed.

### Proxy

Add `/settings` to `protectedPrefixes` and `config.matcher` in
`src/proxy.ts`.

### Metadata

Root `metadata.title`: `SocialProof`; description aligned with UGC value prop.
Favicon: inline SVG chat bubble matching logo.

---

## Auth pages (mock-faithful)

### Shared split layout

- Left: `AuthMarketingPanel` — gradient `brand-primary` → `brand-header`, logo,
  headline/subcopy per route, static product preview image (exported from mock or
  simplified CSS composition), footer “Mais de 300 marcas…” as static marketing
  copy (not live data).
- Right: centered card on `#F9FAFB` / dark equivalent surface.

### Login (`/login`)

- Title **Entrar**; fields E-mail (envelope icon), Senha (lock + show/hide).
- Form-level alert for API errors (mock red box).
- Checkbox **Manter conectado**: **omitted in v1** (cookie policy is server-only;
  no fake persistence).
- Link **Esqueceu sua senha?** → `/login` hash `#` or disabled with “Em breve”
  (no backend reset flow).
- Primary button full width; pending label **Entrar…** with spinner.
- Footer lock icon + SSL copy.
- Link to signup below card.

Reuse `LoginForm` logic; restyle via `AuthForm` + ui primitives.

### Signup (`/signup`)

- Title **Criar sua conta**; subtitle trial copy as in mock.
- Field mapping (API names unchanged):
  - **Seu nome** → `name`
  - **Nome da empresa** → `subdomain` with helper: “Seu endereço:
    `{subdomain}`.socialproof.app” (adjust host copy if product domain differs)
  - **E-mail corporativo** → `email`
  - **Senha** → `password` with visibility toggle
- Password rules (Zod **updated** to match UI):
  - Minimum 8 characters (existing)
  - At least one special character: `/[^A-Za-z0-9]/`
  - UI: strength meter + checkmarks driven by same rules
- Checkbox **Li e aceito os Termos de Uso e Política de Privacidade** required
  before submit; links `#` until legal URLs exist.
- Submit **Criar conta grátis**; footer cancel anytime + lock copy.

---

## Dashboard (`/dashboard`)

### Layout (mock)

- Row of **4** `MetricCard`s.
- Main grid: left column (~2/3) — line chart **Evolução da coleta** + **Atividades
  recentes** list; right column (~1/3) — **Seu widget mais popular** +
  **Filtrar posts** (`FilterPanel`).
- Remove `InstagramConnectionCard` from dashboard (moves to Settings).

### KPI derivation

| Card (mock label) | Source | Subtext |
| --- | --- | --- |
| Posts coletados | `GET /api/posts?limit=1` (no status) → `meta.total` | “+N hoje” from shared capped post sample (see below) |
| Pendentes | `GET /api/posts?status=pending&limit=1` → `meta.total` | Same sample, count where `status === PENDING` and `createdAt` is today (local TZ) |
| Aprovados | `GET /api/posts?status=approved&limit=1` → `meta.total` | Same sample, count where `status === APPROVED` and `createdAt` is today |
| Widgets ativos | `GET /api/widgets` → array length | Subtext fixed: **“—”** (no view metric) |

Parallel React Query keys; reuse existing keys where possible (`widgets`,
pending posts).

**“+N hoje” rule:** reuse the same paginated fetch as the chart (cap 500 posts).
If the cap is reached before covering all of today’s posts, hide the subtext
for that card (show only the total from `meta.total`).

### Chart (7 days)

- Library: **Recharts** (add dependency).
- Fixed range label **Últimos 7 dias** (dropdown non-interactive in v1).
- Data: client aggregation bucketed by calendar day using `createdAt` (fallback
  `postedAt`) from posts fetched via paginated `GET /api/posts?limit=100&page=N`
  until either `page > meta.totalPages` or **500 posts** collected (hard cap for
  performance).
- Y axis: count per day; X axis: weekday labels pt-BR (seg–dom).
- Loading/error states per section; chart shows empty state if no posts.

### Atividades recentes

- Show latest **10** posts from the same capped fetch used for chart (sort desc
  by `createdAt`).
- Row: thumbnail, `@username` from `authorData`, relative time, caption clamp,
  `StatusBadge` from `status`.
- Row click → `/posts/[id]`.

### Widget mais popular

- Consider at most **5** widgets (by list order from `GET /widgets`).
- For each, fetch preview posts `GET /api/widget/:id/posts` (BFF); count items.
- Pick widget with highest count; tie → lexicographically first id.
- Card: preview thumbnails (first 3), handle placeholder if none, buttons
  **Ver widgets** → `/widgets`, **Gerar código** → `/widgets/[id]` (winning id).

### Filtrar posts

- UI mirrors mock: status toggles Pendente/Aprovado map to `?status=pending|approved`.
- Hashtag chips append tokens to `?search=` (posts list already filters caption
  client-side via `ModerationQuery.search`).
- Date picker: **omitted in v1** (no date query on BFF); add in a later phase.
- **Aplicar filtros** → `router.push('/posts?…')`.

### Header user block

- Top bar shows user name + avatar placeholder (initials from `user.name`).

---

## Settings (`/settings`)

Single scroll page with anchored sections:

| Section | id | Content |
| --- | --- | --- |
| Perfil | `perfil` | Name, email (read-only from `AuthContext`); link Sair → `/logout` |
| Plano | `plano` | Display `user.plan`; upgrade CTA disabled “Em breve” |
| Instagram | `instagram` | Move `InstagramConnectionCard` here unchanged in behavior |
| Preferências | `preferencias` | Theme toggle Light/Dark/System |
| Conta | `conta` | Subdomain and optional `companyName` from `Client` (`GET /auth/me`) |

---

## Pages without dedicated mock (derived patterns)

All use `AppShell`, `PageHeader`, white card on `surface-page`.

| Route | Pattern |
| --- | --- |
| `/posts` | Header + “Filtrar” inline + table/cards; `StatusBadge`; link rows to detail |
| `/posts/[id]` | Two-column: media left, metadata + moderation/consent actions right |
| `/moderation` | Queue layout like activity feed at full width; approve/reject controls |
| `/campaigns` | Table in card; primary “Nova campanha” |
| `/campaigns/new`, `/campaigns/[id]/edit` | Form card max-w-2xl |
| `/widgets` | Table + embed hints; “Novo widget” |
| `/widgets/new`, `/widgets/[id]/edit` | Form + optional preview on edit |
| `/widgets/[id]` | Popular-widget-style preview header + `WidgetPreview` + `CopyEmbedField` |
| `/` | Redirect to `/dashboard` if session else `/login` (via proxy or page) |

Empty states: use `EmptyState` with one primary action (create campaign, connect
Instagram in settings, etc.).

---

## Status and copy mapping

| API / query | UI pill |
| --- | --- |
| `pending` / `PENDING` | Pendente (warning) |
| `approved` / `APPROVED` | Aprovado (success) |
| `rejected` / `REJECTED` | Rejeitado (destructive) |

Rights/consent labels remain lowercase phrases on detail pages as today.

---

## Delivery strategy

**Foundation-first waves:**

1. Tokens, Inter, dark class + theme provider hook
2. AppShell, proxy `/settings`, route group migration
3. Auth split pages
4. Dashboard composition + Recharts + aggregation hooks
5. Settings + Instagram move
6. Remaining routes restyled via patterns
7. Dark pass and a11y checklist

---

## Error handling

- Section-level errors with retry (dashboard cards, chart, feed) consistent with
  existing `DashboardSummaryCards` pattern.
- Auth errors unchanged (field + form alert).
- 401 from BFF: rely on proxy/session; no token refresh fiction.

---

## Testing and verification

- Update/add tests: `SidebarNav` active href; theme class toggling; auth forms
  still pass (`auth-forms.test.tsx`); signup Zod special-char rule.
- Dashboard: unit tests for day-bucketing helper (pure function in
  `src/features/dashboard/`).
- Manual: every route in light and dark; keyboard focus visible on nav; reduced
  motion smoke.
- Run `npm run test` and `npm run build` after implementation.

---

## Dependencies

- Add `recharts` for dashboard line chart (React 19 compatible version per npm
  at implementation time).

---

## Related specs

- [`2026-07-30-authentication-design.md`](2026-07-30-authentication-design.md)
- [`2026-08-03-dashboard-summary-design.md`](2026-08-03-dashboard-summary-design.md)
- [`2026-08-30-widgets-design.md`](2026-08-30-widgets-design.md)

This redesign **supersedes** the minimal dashboard UI described in
2026-08-03 for layout and metric count (4 KPIs, chart, feed) but **does not**
change BFF contracts except additional client-side GET combinations already
supported by `/api/posts`.
