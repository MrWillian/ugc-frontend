# Dashboard Summary Design

## Goal

Deliver a protected `/dashboard` client summary page: header with client name
and plan, three summary cards (active campaigns, pending moderation posts,
widgets), and the existing Instagram connection card. Introduce React Query as
the app-wide data-fetching standard.

## Constraints

- Consume only documented Nest routes via the Next BFF (cookie → Bearer).
- Parallel fetches:
  - `GET /campaigns`
  - `GET /posts?status=pending&limit=1` (use `meta.total`)
  - `GET /widgets`
- Plan label comes from `AuthContext` / `GET /auth/me` (`user.plan`).
- Out of scope for this phase:
  - Total posts collected card (no suitable analytics/total contract yet)
  - Posts-per-day/week chart
  - `GET /subscription/current`
  - Campaign/widget CRUD screens

## Architecture

```text
Browser (React Query)
  → Next BFF (/api/campaigns, /api/posts, /api/widgets)
    → Nest API (Authorization: Bearer from httpOnly cookie)
```

- Install `@tanstack/react-query` and wrap the app with `QueryClientProvider`
  in the root layout alongside `AuthProvider`.
- BFF handlers mirror the Instagram pattern: read `accessToken` cookie, call
  `backendRequest`, preserve Nest status and normalize `message`.
- Feature module under `src/features/dashboard/`:
  - `useDashboardSummary` — three `useQuery` hooks + aggregated loading/error
  - `DashboardHeader` — client name + plan
  - `DashboardSummaryCards` — three metric cards
- Keep `InstagramConnectionCard` on `/dashboard`.

## Data derivation

| Source | UI metric |
|--------|-----------|
| `GET /campaigns` | `activeCount = campaigns.filter(c => c.active).length` |
| `GET /posts?status=pending&limit=1` | `pendingCount = meta.total` |
| `GET /widgets` | `widgetCount = widgets.length` |

Query keys:

- `['campaigns']`
- `['posts', { status: 'pending' }]`
- `['widgets']`

`GET /api/posts` forwards query string (`status`, `page`, `limit`).

## UI states

- Header uses auth hydration (`useAuth`); show a short loading state until
  `user` is ready.
- Summary cards show a shared loading placeholder while any of the three
  queries is pending.
- Zero is a valid empty state for all metrics.
- Partial failure: failed cards/sections show an accessible error and retry
  (`refetch`) without clearing the session or hiding successful cards.
- 401 from BFF means unauthenticated; do not invent token refresh.

## Error handling

- BFF preserves backend HTTP statuses and normalizes Nest `message` (string or
  string array), consistent with auth/Instagram routes.
- Client surfaces failures at card/section level with retry.

## Testing and verification

- BFF tests: authenticated forwarding for campaigns, posts (including query
  params), and widgets.
- Dashboard tests: loading, derived counts, error + retry.
- Smoke: React Query provider coexists with auth hydration.
- After implementation: `npm test`, `npm run lint`, `npm run build`.

## Future (explicitly deferred)

- Total collected posts metric and time-series chart once the backend exposes
  analytics (or a documented aggregation endpoint).
- `GET /subscription/current` for richer billing status on the header.
- Dedicated `/dashboard/instagram` page if the home dashboard becomes crowded.
