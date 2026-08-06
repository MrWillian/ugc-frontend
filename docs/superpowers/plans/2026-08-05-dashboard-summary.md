# Dashboard Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a protected `/dashboard` client summary with header (name +
plan), three metric cards (active campaigns, pending moderation, widgets),
React Query as the app-wide fetch standard, and keep the Instagram card.

**Architecture:** Browser React Query calls Next BFF routes that forward the
HTTP-only cookie as Bearer to Nest. Three parallel queries derive card metrics;
plan comes from existing `AuthContext` hydration.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, `@tanstack/react-query`,
Vitest, Testing Library, existing BFF helpers (`backendRequest`,
`ACCESS_TOKEN_COOKIE`), Tailwind CSS, existing domain types in `@/types`.

## Global Constraints

- Call only `GET /campaigns`, `GET /posts?status=pending&limit=1`, and
  `GET /widgets` for summary metrics (via BFF).
- Use the HTTP-only `accessToken` cookie and server-side Bearer authorization.
- Never return the JWT to browser code.
- Plan label from `useAuth().user.plan` — do not call
  `GET /subscription/current` in this phase.
- Out of scope: total posts card, charts, campaign/widget CRUD.
- Preserve `InstagramConnectionCard` on `/dashboard`.
- Do not commit unless the user explicitly requests it.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/components/providers/QueryProvider.tsx` | Client `QueryClientProvider` wrapper |
| `src/app/layout.tsx` | Mount `QueryProvider` around `AuthProvider` children |
| `src/app/api/campaigns/route.ts` | BFF `GET /campaigns` |
| `src/app/api/posts/route.ts` | BFF `GET /posts` with query string forward |
| `src/app/api/widgets/route.ts` | BFF `GET /widgets` |
| `src/app/api/dashboard/routes.test.ts` | BFF auth, forwarding, errors |
| `src/features/dashboard/api.ts` | Browser fetch helpers for BFF endpoints |
| `src/features/dashboard/useDashboardSummary.ts` | Three React Query hooks + aggregates |
| `src/features/dashboard/DashboardHeader.tsx` | Client name + plan |
| `src/features/dashboard/DashboardSummaryCards.tsx` | Three metric cards + loading/error |
| `src/features/dashboard/dashboard.test.tsx` | Hook/UI behavior tests |
| `src/app/dashboard/page.tsx` | Compose header, cards, Instagram, logout |

---

### Task 1: Add React Query as app provider

**Files:**
- Create: `src/components/providers/QueryProvider.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/components/providers/QueryProvider.test.tsx`

**Interfaces:**
- Consumes: none
- Produces:

```ts
export function QueryProvider({ children }: { children: React.ReactNode }): JSX.Element;
```

- [ ] **Step 1: Install the dependency**

```bash
npm install @tanstack/react-query
```

Expected: `@tanstack/react-query` appears in `package.json` dependencies.

- [ ] **Step 2: Write a failing provider smoke test**

Create `src/components/providers/QueryProvider.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { useQueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { QueryProvider } from "@/components/providers/QueryProvider";

function Probe() {
  const client = useQueryClient();
  return <span>has-client:{String(Boolean(client))}</span>;
}

describe("QueryProvider", () => {
  it("exposes a QueryClient to descendants", () => {
    render(
      <QueryProvider>
        <Probe />
      </QueryProvider>,
    );
    expect(screen.getByText("has-client:true")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test -- src/components/providers/QueryProvider.test.tsx`

Expected: FAIL because `QueryProvider` does not exist.

- [ ] **Step 4: Implement QueryProvider and wire the root layout**

Create `src/components/providers/QueryProvider.tsx`:

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

Update `src/app/layout.tsx` body to:

```tsx
<body className="min-h-full flex flex-col">
  <QueryProvider>
    <AuthProvider>{children}</AuthProvider>
  </QueryProvider>
</body>
```

Import `QueryProvider` from `@/components/providers/QueryProvider`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/components/providers/QueryProvider.test.tsx`

Expected: PASS.

---

### Task 2: Add campaigns, posts, and widgets BFF routes

**Files:**
- Create: `src/app/api/campaigns/route.ts`
- Create: `src/app/api/posts/route.ts`
- Create: `src/app/api/widgets/route.ts`
- Create: `src/app/api/dashboard/routes.test.ts`

**Interfaces:**
- Consumes: `ACCESS_TOKEN_COOKIE`, `backendRequest`, `backendErrorMessage` from
  `@/lib/auth-server`
- Produces:

```ts
GET /api/campaigns -> Campaign[]
GET /api/posts?status=&page=&limit= -> PaginatedResponse<CollectedPost>
GET /api/widgets -> Widget[]
```

- [ ] **Step 1: Write failing BFF tests**

Create `src/app/api/dashboard/routes.test.ts` following the Instagram BFF test
pattern (`vi.mock("next/headers")`, stub `fetch`, set
`process.env.NEXT_PUBLIC_API_URL = "http://api.test"`).

Cover at least:

1. Campaigns: cookie present → forwards
   `http://api.test/campaigns` with `Authorization: Bearer jwt-value` and
   returns the backend array.
2. Posts: request to
   `new Request("http://localhost/api/posts?status=pending&limit=1")` →
   forwards `http://api.test/posts?status=pending&limit=1` with Bearer and
   returns `{ data, meta }`.
3. Widgets: cookie present → forwards `http://api.test/widgets` with Bearer.
4. Missing cookie on any route → `401` and
   `{ message: "Não autenticado." }`.
5. Backend `403` on campaigns → preserves status and Nest `message`.

Example posts assertion:

```ts
expect(fetchMock).toHaveBeenCalledWith(
  "http://api.test/posts?status=pending&limit=1",
  expect.objectContaining({
    method: "GET",
    headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
  }),
);
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/app/api/dashboard/routes.test.ts`

Expected: FAIL because the route modules do not exist.

- [ ] **Step 3: Implement the three GET handlers**

`src/app/api/campaigns/route.ts`:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";

export async function GET() {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const backendResponse = await backendRequest(
    "/campaigns",
    { method: "GET" },
    token,
  );
  const payload: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: backendErrorMessage(payload) },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(payload);
}
```

`src/app/api/widgets/route.ts` — same shape with path `"/widgets"`.

`src/app/api/posts/route.ts` — accept `Request`, forward search params:

```ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";

export async function GET(request: Request) {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  const { search } = new URL(request.url);
  const backendResponse = await backendRequest(
    `/posts${search}`,
    { method: "GET" },
    token,
  );
  const payload: unknown = await backendResponse.json();

  if (!backendResponse.ok) {
    return NextResponse.json(
      { message: backendErrorMessage(payload) },
      { status: backendResponse.status },
    );
  }

  return NextResponse.json(payload);
}
```

- [ ] **Step 4: Run BFF tests to verify they pass**

Run: `npm run test -- src/app/api/dashboard/routes.test.ts`

Expected: PASS for forwarding, query string, unauthorized, and error cases.

---

### Task 3: Build dashboard summary hook and UI

**Files:**
- Create: `src/features/dashboard/api.ts`
- Create: `src/features/dashboard/useDashboardSummary.ts`
- Create: `src/features/dashboard/DashboardHeader.tsx`
- Create: `src/features/dashboard/DashboardSummaryCards.tsx`
- Create: `src/features/dashboard/dashboard.test.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `Campaign`, `CollectedPost`, `PaginatedResponse`, `Widget`, `Plan`,
  `Client` from `@/types`; BFF routes from Task 2; `QueryProvider` from Task 1;
  `useAuth` from `@/contexts/AuthContext`
- Produces:

```ts
export async function fetchCampaigns(): Promise<Campaign[]>;
export async function fetchPendingPostsMeta(): Promise<PaginatedResponse<CollectedPost>>;
export async function fetchWidgets(): Promise<Widget[]>;

export interface DashboardSummary {
  activeCampaigns: number;
  pendingPosts: number;
  widgets: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch(): void;
}

export function useDashboardSummary(): DashboardSummary;

export function DashboardHeader({
  name,
  plan,
}: {
  name: string;
  plan: Plan;
}): JSX.Element;

export function DashboardSummaryCards(
  props: DashboardSummary,
): JSX.Element;
```

- [ ] **Step 1: Write failing feature tests**

Create `src/features/dashboard/dashboard.test.tsx`. Wrap renders with
`QueryProvider`. Mock `global.fetch`.

Cover:

1. **Derived counts** — mock:

```ts
// GET /api/campaigns
[{ id: "1", active: true }, { id: "2", active: false }]
// GET /api/posts?status=pending&limit=1
{ data: [], meta: { page: 1, limit: 1, total: 7, totalPages: 7 } }
// GET /api/widgets
[{ id: "w1" }, { id: "w2" }]
```

Render `DashboardSummaryCards` via a small harness that calls
`useDashboardSummary`, then assert visible texts for `1`, `7`, and `2`
(or labels “Campanhas ativas”, “Pendentes de moderação”, “Widgets”).

2. **Loading** — leave fetch pending; assert loading text/placeholder
   (e.g. “Carregando resumo…”).

3. **Error + retry** — reject campaigns fetch; assert `role="alert"`; click
   retry; assert fetch called again.

4. **Header** — render `<DashboardHeader name="Acme" plan="FREE" />`;
   assert “Acme” and “FREE” (or Portuguese plan label including FREE).

Also assert fetch URLs include:

```ts
"/api/campaigns"
"/api/posts?status=pending&limit=1"
"/api/widgets"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- src/features/dashboard/dashboard.test.tsx`

Expected: FAIL because dashboard feature modules do not exist.

- [ ] **Step 3: Implement API helpers and hook**

`src/features/dashboard/api.ts`:

```ts
import type { Campaign, CollectedPost, PaginatedResponse, Widget } from "@/types";

async function readError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body
  ) {
    const { message } = body as { message?: unknown };
    if (Array.isArray(message)) {
      return message.filter((item): item is string => typeof item === "string").join(" ");
    }
    if (typeof message === "string") return message;
  }
  return "Não foi possível carregar o resumo.";
}

export async function fetchCampaigns(): Promise<Campaign[]> {
  const response = await fetch("/api/campaigns", { credentials: "same-origin" });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<Campaign[]>;
}

export async function fetchPendingPostsMeta(): Promise<PaginatedResponse<CollectedPost>> {
  const response = await fetch("/api/posts?status=pending&limit=1", {
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<PaginatedResponse<CollectedPost>>;
}

export async function fetchWidgets(): Promise<Widget[]> {
  const response = await fetch("/api/widgets", { credentials: "same-origin" });
  if (!response.ok) throw new Error(await readError(response));
  return response.json() as Promise<Widget[]>;
}
```

`src/features/dashboard/useDashboardSummary.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchCampaigns,
  fetchPendingPostsMeta,
  fetchWidgets,
} from "@/features/dashboard/api";

export interface DashboardSummary {
  activeCampaigns: number;
  pendingPosts: number;
  widgets: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch(): void;
}

export function useDashboardSummary(): DashboardSummary {
  const campaignsQuery = useQuery({
    queryKey: ["campaigns"],
    queryFn: fetchCampaigns,
  });
  const pendingQuery = useQuery({
    queryKey: ["posts", { status: "pending" }],
    queryFn: fetchPendingPostsMeta,
  });
  const widgetsQuery = useQuery({
    queryKey: ["widgets"],
    queryFn: fetchWidgets,
  });

  const firstError =
    campaignsQuery.error ?? pendingQuery.error ?? widgetsQuery.error;

  return {
    activeCampaigns:
      campaignsQuery.data?.filter((campaign) => campaign.active).length ?? 0,
    pendingPosts: pendingQuery.data?.meta.total ?? 0,
    widgets: widgetsQuery.data?.length ?? 0,
    isLoading:
      campaignsQuery.isPending ||
      pendingQuery.isPending ||
      widgetsQuery.isPending,
    isError: Boolean(firstError),
    errorMessage:
      firstError instanceof Error
        ? firstError.message
        : firstError
          ? "Não foi possível carregar o resumo."
          : null,
    refetch() {
      void campaignsQuery.refetch();
      void pendingQuery.refetch();
      void widgetsQuery.refetch();
    },
  };
}
```

Do not create a separate `types.ts` for this feature; export
`DashboardSummary` from `useDashboardSummary.ts`.

- [ ] **Step 4: Implement header and summary cards**

`DashboardHeader`: show client `name` as title and `plan` as a clear secondary
label (plain text is fine; no new design system).

`DashboardSummaryCards`:

- If `isLoading`, show “Carregando resumo…”.
- If `isError`, show `role="alert"` with `errorMessage` and a button
  “Tentar novamente” calling `refetch`.
- Otherwise render three metrics with labels in Portuguese:
  - “Campanhas ativas”
  - “Pendentes de moderação”
  - “Widgets”
- Zero is valid; do not hide cards when counts are 0.

Keep styling consistent with the existing dashboard (`p-6`, simple Tailwind,
no new card library unless already present). Prefer a simple grid of three
metric blocks without decorative chrome beyond spacing/typography.

- [ ] **Step 5: Wire `/dashboard`**

Update `src/app/dashboard/page.tsx` (already `"use client"`) to:

1. Keep auth loading (`Carregando…`) and unauthenticated message.
2. Call `const summary = useDashboardSummary()` at the top of the component
   (hooks must run unconditionally; the summary UI can ignore values while
   auth is still loading).
3. When `user` exists:
   - Render `<DashboardHeader name={user.name} plan={user.plan} />`
   - Render `<DashboardSummaryCards {...summary} />`
   - Keep `<InstagramConnectionCard />`
   - Keep logout `Link` to `/logout`

- [ ] **Step 6: Run feature tests**

Run: `npm run test -- src/features/dashboard/dashboard.test.tsx`

Expected: PASS for loading, derived counts, error/retry, and header.

---

### Task 4: Verify the complete feature

**Files:**
- None new (verification only)

- [ ] **Step 1: Run all tests**

Run: `npm run test`

Expected: zero failed tests (including auth, Instagram, provider, BFF,
dashboard).

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint && npm run build`

Expected: both commands exit with code 0.

- [ ] **Step 3: Review feature diff**

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors; changes limited to React Query provider,
dashboard BFF routes, dashboard feature module, dashboard page, tests,
`package.json` / lockfile, and planning docs.

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| React Query provider in root layout | Task 1 |
| BFF `/api/campaigns`, `/api/posts`, `/api/widgets` | Task 2 |
| Parallel queries + derived metrics | Task 3 |
| Header name + plan from auth | Task 3 |
| Loading / error / retry / zeros | Task 3 |
| Keep Instagram card | Task 3 |
| No total-posts card / chart / subscription | Global Constraints |
| Tests + lint + build | Task 4 |
