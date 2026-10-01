# SocialProof Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the SocialProof design system, authenticated shell, auth split
layouts, enriched dashboard, settings hub, and restyled feature pages per
[`docs/superpowers/specs/2026-09-27-socialproof-redesign-design.md`](../specs/2026-09-27-socialproof-redesign-design.md).

**Architecture:** Foundation-first — CSS tokens and layout shell, then auth
surfaces, then dashboard data composition (client-side aggregation from existing
BFF GETs), then route-by-route pattern adoption. Route groups `(auth)` and
`(authenticated)` wrap URLs without changing paths.

**Tech Stack:** Next.js 16.2.11, React 19, Tailwind CSS 4, Inter (`next/font`),
lucide-react, Recharts, React Query, Vitest, Testing Library.

## Global Constraints

- Spec: [`2026-09-27-socialproof-redesign-design.md`](../specs/2026-09-27-socialproof-redesign-design.md).
- Domain copy: `CONTEXT.md`.
- Auth API fields unchanged; signup adds Zod special-character rule only.
- JWT HTTP-only; no new Nest endpoints.
- Post list status query strings: `pending` | `approved` | `rejected`.
- Chart/feed post sample hard cap: **500** posts.
- Widget KPI subtext: em dash, no fake view counts.
- Top search: disabled “Em breve”; notifications badge → `/moderation`.
- Do not commit unless the user explicitly requests a commit.
- Run `npm run test` and `npm run build` before declaring done.

---

## File Structure

| File / area | Responsibility |
| --- | --- |
| `src/app/globals.css` | SocialProof HSL tokens, light + `.dark` |
| `src/app/layout.tsx` | Inter, metadata, ThemeProvider |
| `src/components/theme/ThemeProvider.tsx` | `localStorage` + `html.dark` |
| `src/components/brand/SocialProofLogo.tsx` | Brand mark |
| `src/components/layout/*` | AppShell, SidebarNav, TopBar, auth split |
| `src/components/patterns/*` | MetricCard, StatusBadge, PageHeader, FilterPanel, EmptyState |
| `src/app/(authenticated)/layout.tsx` | Wraps AppShell |
| `src/app/(auth)/layout.tsx` | AuthSplitLayout |
| `src/app/(authenticated)/settings/page.tsx` | Settings sections |
| `src/features/dashboard/*` | Aggregation helpers, chart, feed, extended summary |
| `src/features/auth/schemas.ts` | Password special-char rule |
| `src/proxy.ts` | Protect `/settings` |
| Move pages under route groups | Same URLs, shared layouts |

---

## Task 1: SocialProof tokens and Inter

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/layout.tsx` metadata title/description

**Interfaces:**
- Produces CSS variables matching spec hex mapping for `--primary`, `--background`, status colors, `--radius`.

- [ ] **Step 1: Replace `:root` and `.dark` token values** per spec table (brand-primary, surface-page, status pills).
- [ ] **Step 2: Swap Geist for Inter** via `next/font/google`; update `--font-sans` in `@theme inline`.
- [ ] **Step 3: Set metadata** to SocialProof.
- [ ] **Step 4: Run** `npm run build` — expect pass.

---

## Task 2: Theme provider

**Files:**
- Create: `src/components/theme/ThemeProvider.tsx`
- Create: `src/components/theme/theme.test.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces `ThemeProvider` with `theme: 'light' | 'dark' | 'system'` and `setTheme`.
- Storage key: `socialproof-theme`.

- [ ] **Step 1: Write test** — toggling theme adds/removes `dark` on documentElement (mock localStorage).
- [ ] **Step 2: Implement provider** + optional inline anti-flash script in layout.
- [ ] **Step 3: Run** `npm run test` for theme test.

---

## Task 3: Pattern and brand components

**Files:**
- Create: `src/components/brand/SocialProofLogo.tsx`
- Create: `src/components/patterns/MetricCard.tsx`
- Create: `src/components/patterns/StatusBadge.tsx`
- Create: `src/components/patterns/PageHeader.tsx`
- Create: `src/components/patterns/EmptyState.tsx`
- Create: `src/components/patterns/patterns.test.tsx`

**Interfaces:**
- `StatusBadge({ status: ModerationStatus })` → Pendente / Aprovado / Rejeitado variants.
- `MetricCard({ label, value, subtext?, icon?, href? })`.

- [ ] **Step 1: Test StatusBadge** maps APPROVED/PENDING/REJECTED to correct text.
- [ ] **Step 2: Implement components** using ui/button, ui/badge tokens.
- [ ] **Step 3: Run** `npm run test`.

---

## Task 4: App shell

**Files:**
- Create: `src/components/layout/SidebarNav.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/app-shell.test.tsx`
- Create: `src/lib/nav-items.ts` (shared nav config)

**Interfaces:**
- Nav order: dashboard, posts, campaigns, moderation, widgets, settings.
- `SidebarNav` highlights active path; footer link to `/settings#perfil`.

- [ ] **Step 1: Test** active href for `/posts` when pathname is `/posts`.
- [ ] **Step 2: Implement TopBar** with disabled search, notification link, user initials.
- [ ] **Step 3: Implement AppShell** responsive drawer for mobile.
- [ ] **Step 4: Run** `npm run test`.

---

## Task 5: Route groups and proxy

**Files:**
- Create: `src/app/(authenticated)/layout.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Move: authenticated pages into `(authenticated)/` (dashboard, posts, campaigns, moderation, widgets)
- Move: login, signup into `(auth)/`
- Modify: `src/proxy.ts`, `src/proxy.test.ts`

**Interfaces:**
- URLs unchanged (`/dashboard`, not `/authenticated/dashboard`).

- [ ] **Step 1: Add failing proxy test** for unauthenticated `/settings` → login.
- [ ] **Step 2: Add `/settings` to protectedPrefixes and matcher**.
- [ ] **Step 3: Move route files**; wire `(authenticated)/layout` → `AppShell`.
- [ ] **Step 4: Run** `npm run test` and `npm run build`.

---

## Task 6: Auth split layout and pages

**Files:**
- Create: `src/components/layout/AuthSplitLayout.tsx`
- Create: `src/components/layout/AuthMarketingPanel.tsx`
- Modify: `src/app/(auth)/login/page.tsx`, `signup/page.tsx`
- Modify: `src/features/auth/components/AuthForm.tsx`, `LoginForm.tsx`, `SignupForm.tsx` (styling + signup fields)

**Interfaces:**
- Signup labels: empresa → `subdomain`, seu nome → `name`; terms checkbox gates submit.

- [ ] **Step 1: Implement split layouts** per mock (gradient panel + card).
- [ ] **Step 2: Restyle forms** — icons in inputs, full-width primary, SSL footer.
- [ ] **Step 3: Update** `auth-forms.test.tsx` if labels/ids change; keep submit behavior.
- [ ] **Step 4: Run** `npm run test`.

---

## Task 7: Signup password validation

**Files:**
- Modify: `src/features/auth/schemas.ts`
- Modify: `src/features/auth/components/SignupForm.tsx`
- Modify: `src/features/auth/components/auth-forms.test.tsx`

**Interfaces:**
- `signupSchema` password: min 8 + `/[^A-Za-z0-9]/`.

- [ ] **Step 1: Add failing test** — password without special char rejected.
- [ ] **Step 2: Add Zod refine/regex** and strength UI checkmarks.
- [ ] **Step 3: Run** `npm run test`.

---

## Task 8: Dashboard aggregation helpers

**Files:**
- Create: `src/features/dashboard/post-sample.ts`
- Create: `src/features/dashboard/post-sample.test.ts`
- Create: `src/features/dashboard/bucket-posts-by-day.ts`
- Create: `src/features/dashboard/bucket-posts-by-day.test.ts`

**Interfaces:**
- `fetchPostSample(maxPosts?: number): Promise<CollectedPost[]>` paginates until cap.
- `bucketPostsByDay(posts, days: 7): { label: string; count: number }[]`.
- `countCreatedToday(posts, predicate?): number`.

- [ ] **Step 1: Unit tests** for bucketing across timezone boundaries (use fixed ISO fixtures).
- [ ] **Step 2: Implement pure helpers + fetch** using `fetchPosts`.
- [ ] **Step 3: Run** `npm run test`.

---

## Task 9: Dashboard UI composition

**Files:**
- Modify: `package.json` (add `recharts`)
- Create: `src/features/dashboard/DashboardChart.tsx`
- Create: `src/features/dashboard/DashboardActivityFeed.tsx`
- Create: `src/features/dashboard/DashboardPopularWidget.tsx`
- Create: `src/features/dashboard/DashboardFilterPanel.tsx`
- Modify: `src/features/dashboard/DashboardSummaryCards.tsx` → four MetricCards
- Modify: `src/features/dashboard/useDashboardSummary.ts` or new hook for totals
- Modify: `src/app/(authenticated)/dashboard/page.tsx`
- Modify: `src/features/dashboard/dashboard.test.tsx`

**Interfaces:**
- KPI totals via `meta.total` queries; today subtext from sample per spec.
- Popular widget: max 5 widgets, compare BFF preview post counts.

- [ ] **Step 1: Add recharts** dependency.
- [ ] **Step 2: Implement sections** with loading/error boundaries per section.
- [ ] **Step 3: Remove Instagram card** from dashboard page.
- [ ] **Step 4: Update dashboard tests**.
- [ ] **Step 5: Run** `npm run test`.

---

## Task 10: Settings page

**Files:**
- Create: `src/app/(authenticated)/settings/page.tsx`
- Create: `src/features/settings/SettingsSections.tsx` (optional)
- Modify: move usage of `InstagramConnectionCard` from dashboard to settings

**Interfaces:**
- Sections: perfil, plano, instagram, preferencias (theme), conta (subdomain).

- [ ] **Step 1: Implement anchored sections** and theme toggle wired to Task 2.
- [ ] **Step 2: Manual smoke** — Instagram connect still works from settings.
- [ ] **Step 3: Run** `npm run build`.

---

## Task 11: Restyle list and detail routes

**Files:**
- Modify: `src/app/(authenticated)/posts/page.tsx`, `PostsList.tsx`
- Modify: `src/app/(authenticated)/moderation/page.tsx`, `ModerationQueue.tsx`
- Modify: `src/app/(authenticated)/campaigns/page.tsx`, `CampaignsList.tsx`
- Modify: `src/app/(authenticated)/widgets/page.tsx`, `WidgetsList.tsx`
- Modify: `PostDetail.tsx`, widget/campaign forms and detail pages

**Interfaces:**
- Each page uses `PageHeader` + card wrapper; `StatusBadge` replaces ad hoc badges where moderation status shown.

- [ ] **Step 1: Posts + moderation** — visual queue alignment with activity feed.
- [ ] **Step 2: Campaigns + widgets lists** — table in card, primary CTA in header.
- [ ] **Step 3: Detail/form pages** — two-column post detail; widget detail hero block.
- [ ] **Step 4: Run** existing feature tests (`posts.test.tsx`, `widgets-list.test.tsx`, etc.).

---

## Task 12: TopBar notification count

**Files:**
- Modify: `src/components/layout/TopBar.tsx`
- Create or reuse query in `src/features/dashboard/api.ts`

**Interfaces:**
- Reuse React Query key `['posts', { status: 'pending' }]` for badge count.

- [ ] **Step 1: Wire badge** to pending meta.total.
- [ ] **Step 2: Click navigates to** `/moderation`.

---

## Task 13: Root redirect and favicon

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/icon.svg` or `public/favicon` per spec

- [ ] **Step 1: Home redirects** to dashboard (auth handled by proxy when visiting protected routes).
- [ ] **Step 2: Add chat-bubble favicon**.

---

## Task 14: Verification

- [ ] **Run** `npm run test` — full suite green.
- [ ] **Run** `npm run lint`.
- [ ] **Run** `npm run build`.
- [ ] **Manual checklist:** login/signup split, dashboard 4 KPIs + chart, settings theme + Instagram, light/dark on major routes, keyboard nav sidebar.

---

## Reference

- Spec: [`docs/superpowers/specs/2026-09-27-socialproof-redesign-design.md`](../specs/2026-09-27-socialproof-redesign-design.md)
- Mock assets under `.cursor/projects/.../assets/` (copy into `public/` if needed for auth panel)
