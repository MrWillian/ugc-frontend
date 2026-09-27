# Widgets CRUD and Embed Code Design

## Goal

Give an authenticated client a widgets module: list widgets with copyable
embed code, create a widget, inspect it with a live preview, edit it, and
delete it. After create, land on the widget detail page with the embed snippet
ready to copy.

Domain language lives in `CONTEXT.md` at the repo root.

## Constraints

- Consume only documented Nest routes via the Next BFF (cookie → Bearer).
  Never expose the JWT to browser JavaScript.
- Admin API: `GET /widgets`, `POST /widgets`, `GET /widgets/:id`,
  `PATCH /widgets/:id`, `DELETE /widgets/:id`.
- Preview data: public `GET /api/widget/:id/posts` (snake_case items).
- `layout` on the wire is the Prisma enum `GRID` | `CAROUSEL` | `MASONRY`.
  The select shows Grid / Carousel / Masonry and submits the enum.
- `filters` is an optional JSON object (e.g. `{ "maxPosts": 10 }`). Empty
  textarea omits the field on create. Invalid JSON is a client validation
  error. Arrays and primitives are rejected; only a JSON object is forwarded.
- `GET /widgets/:id` includes `embedCode`. List items may omit it; the UI
  falls back to a reconstructed snippet pointing at the Nest public script.
- `proxy.ts` already protects `/widgets` and nested routes. Keep that.
- App routes follow campaigns, not the older `/dashboard/widgets` sketch in
  `docs/frontend-agent-context.md`:
  - `/widgets` list
  - `/widgets/new` create
  - `/widgets/[id]` detail
  - `/widgets/[id]/edit` edit
- Out of scope:
  - `POST/DELETE /widgets/:id/posts/:postId` (manual post association)
  - Hosting or executing `GET /api/widget/:id.js` inside Next
  - Billing page / paywall UI (no `/billing` route yet)
  - Enabling CORS on Nest
  - Pre-submit disable of Novo Widget based on plan limits

## Domain: how posts enter a widget

v1 is **configuration + embed copy + preview**, not curation. Posts enter
widgets automatically when creators grant consent:

1. A widget named `default` (case-insensitive) receives new consented posts
   first.
2. If no default exists, the client's oldest widget receives them.

Only **widget-eligible posts** appear in preview or production embed:
`displayStatus === VISIBLE` and `rightsStatus === GRANTED`. Approval alone is
insufficient.

Duplicate widget names are allowed. Only `default` gets special UX (below).

## Architecture

```text
Browser (React Query)
  → Next BFF
      /api/widgets            GET, POST     (JWT cookie)
      /api/widgets/:id        GET, PATCH, DELETE
      /api/widget/:id/posts   GET           (no JWT; public Nest proxy)
    → Nest API
      /widgets…
      /api/widget/:id/posts
```

Reuse the campaigns BFF helpers (`requireAccessToken`, `jsonFromBackend`) so
status codes and Nest `message` (string or string[]) stay normalized.

Feature code lives under `src/features/widgets/`, pages under `src/app/widgets/`.
React Query is the fetch standard (same as dashboard and moderation). Query
keys:

- `["widgets"]` — list
- `["widgets", id]` — detail
- `["widget-preview", id]` — public posts for preview

Create / update / delete invalidate `["widgets"]` and the matching detail key.
Update also invalidates `["widget-preview", id]`.

## Dashboard preview (not production embed)

See ADR `docs/adr/0001-dashboard-widget-preview-via-bff.md`.

The Nest embed script fetches posts with `fetch` from the page origin. CORS is
not enabled on the API, so an iframe/`srcdoc` of the public `.js` would fail
in the dashboard.

Preview therefore:

1. Calls the public posts JSON through the Next BFF (same-origin, no CORS).
2. Renders posts in-page with CSS for the three layouts (grid, horizontal
   carousel, CSS columns for masonry).
3. Does not execute the public `.js` file.
4. **May differ from production embed layout** until the Nest script implements
   carousel/masonry fully. Call out this mismatch in preview helper text.

Preview is **detail-only** (`/widgets/[id]`). The edit page is form-only.

Preview honors the same filter semantics as production: render what the public
posts API returns (including `maxPosts` if the backend applies it). Do not
client-side override unless a backend mismatch is found during implementation.

Each preview card shows: thumbnail, caption, and `@username` from
`author_data`. Hide caption when `filters.showCaptions === false`.

If widget detail loads but preview fetch fails, show widget info and embed
normally; the preview section gets its own `role="alert"` error with the BFF
message. Do not fail the whole page.

## Embed snippet

Prefer `widget.embedCode` from the API when it is a non-empty string.
Otherwise reconstruct:

```html
<div id="ugc-widget-{id}"></div>
<script src="{NEXT_PUBLIC_API_URL}/api/widget/{id}.js" defer></script>
```

`NEXT_PUBLIC_API_URL` has no trailing slash. The snippet always points at
Nest, never at the Next BFF.

## Routes and UI

### `/widgets`

Table columns: Nome, Layout, Código de Embed.

- Nome links to `/widgets/[id]`.
- Layout shows Grid / Carousel / Masonry (not the raw enum).
- Embed is a read-only textarea plus a Copiar button (label becomes Copiado
  after a successful `navigator.clipboard.writeText`). Full snippet on every
  row — widget counts are plan-limited (1–15).
- Header button Novo Widget → `/widgets/new`.
- List order: backend order as returned by `GET /widgets` (no client re-sort).
- Empty state: “Nenhum widget cadastrado.”
- Loading: “Carregando widgets...”
- Request error: accessible `role="alert"` with the BFF message (campaigns
  list pattern). No separate retry button.

### `/widgets/new`

Form (react-hook-form + Zod):

| Field | Control | Rules |
|-------|---------|--------|
| `name` | text | required, trim, 1–100 chars |
| `layout` | native `<select>` | `GRID` (default), `CAROUSEL`, `MASONRY` |
| `filters` | textarea | optional JSON object |

Filters textarea: placeholder or helper text documents known keys
(`maxPosts`, `showCaptions`, `theme`). Raw JSON for v1 — no per-field controls.

When `name` matches `default` (case-insensitive), show a soft warning (not a
block): posts from new consents will auto-attach to this widget.

Submit `POST /widgets`. On success, `router.replace(`/widgets/${id}`)`.
On 403 (plan widget limit on **create only**), show the Nest message in a
form-level alert. Do not invent a billing link. Edit and delete remain
available at the cap.

### `/widgets/[id]`

- Name, layout label, filters summary (pretty-printed JSON or “Nenhum”).
- Prominent embed block (read-only textarea + Copiar).
- **Widget explainer** near the preview section: one short paragraph covering
  widget-eligibility (VISIBLE + GRANTED) and consent-driven membership (default
  widget first, else oldest widget).
- Preview section fed by public posts. Empty preview: eligible posts may still
  be absent because consent is pending — the explainer covers this.
- Editar → `/widgets/[id]/edit`.
- Excluir → `window.confirm`, then `DELETE`, then `router.replace("/widgets")`.
  Confirm extras (informational only, never block):
  - Name matches `default`: note that new consents will attach to the oldest
    widget instead.
  - Client has only one widget: note that consented posts will have nowhere to
    appear until a new widget is created.
- 404 from BFF: “Widget não encontrado.”

### `/widgets/[id]/edit`

Same form as create, hydrated from `GET /widgets/:id`. No preview on this
page. Same soft warning for `default` name.

Filters UX on edit:

- Empty textarea means **unchanged** — omit `filters` from PATCH.
- **Remover filtros** button sets explicit clear intent → PATCH
  `{ "filters": null }`. Verify Nest accepts null during implementation;
  fall back to `{}` only if rejected.
- When the user edits the textarea, include parsed `filters` in PATCH.

Submit sends `name` and `layout` always (full form, matching campaigns).
Include `filters` only when the textarea was edited or Remover filtros was
clicked. On success, `router.replace(`/widgets/${id}`)`.

## Dashboard

The Widgets summary card currently has no `href`. Point it at `/widgets`.

## Data mapping

| UI | Wire |
|----|------|
| Select Grid / Carousel / Masonry | `layout: "GRID" \| "CAROUSEL" \| "MASONRY"` |
| Empty filters textarea on create | omit `filters` |
| Empty filters textarea on edit | omit `filters` (unchanged) |
| Remover filtros on edit | `filters: null` |
| Edited filters textarea | `filters: { … }` |
| Valid `{ "maxPosts": 10 }` | `filters: { maxPosts: 10 }` |
| Public preview item | `content_url`, `thumbnail_url`, `caption`, `author_data`, `posted_at` |

BFF create/patch forward only `name`, `layout`, `filters`. Extra JSON keys
from the browser are stripped (`forbidNonWhitelisted` on Nest).

Public preview BFF does not read the auth cookie and does not send Bearer.
It is a same-origin proxy so the dashboard never calls Nest from the browser.

## Error handling

- BFF preserves Nest status and normalizes `message`.
- 401: existing proxy/session behavior; do not invent refresh.
- 403 on **create only** (plan widget limit): show Nest Portuguese limit
  message. Edit/delete are not blocked by the cap.
- 404 on detail/edit/delete: not-found copy; delete from a missing id still
  returns the user to the list if the mutation reports 404 after confirm.
- Preview fetch failure on detail: inline preview `role="alert"`; rest of page
  remains usable.
- Clipboard failure: keep the Copiar label and show a short alert; do not
  crash.

## Testing and verification

- BFF: auth forwarding for admin CRUD; unauthenticated 401; 403 message
  preserved on create; extra body fields stripped; public posts proxy has no
  Bearer and still works without a cookie.
- Helpers: embed fallback, JSON filters parse/reject.
- List: table columns, copy, Novo Widget, empty state, backend list order.
- Form: validation, create redirects to detail, edit hydrates and PATCHes
  (filters omit/ null / edited semantics), 403 on create surfaced, default
  name warning.
- Detail: embed + copy, preview posts (card fields, showCaptions), explainer
  copy, preview error partial success, delete confirm variants, edit link.
- Edit: no preview, Remover filtros.
- Dashboard card links to `/widgets`.
- After implementation: `npm test`, `npm run lint`, `npm run build`.

## Future (explicitly deferred)

- Associate/remove posts on a widget (`POST/DELETE /widgets/:id/posts/:postId`).
- Preview via the real Nest `.js` once CORS is enabled.
- Disable Novo Widget using plan limits before submit (needs a billing
  surface).
- Guided per-field filter controls once the backend contract is frozen.
- Dedicated `/dashboard/widgets` alias — not added; `/widgets` is canonical.
