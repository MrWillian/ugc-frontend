# Instagram OAuth Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable an authenticated client to connect or reconnect one Instagram
Business account through the documented Meta redirect flow.

**Architecture:** Next BFF handlers read the HTTP-only access-token cookie and
forward the three documented Instagram requests with a server-side Bearer
header. A dashboard connection card starts the redirect flow; a callback page
submits Meta query parameters and returns the client to the dashboard.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest, Testing
Library, existing BFF helpers, Tailwind CSS, shadcn Button.

## Global Constraints

- Call only `POST /platform/instagram/auth-url`,
  `POST /platform/instagram/callback`, and `GET /platform/instagram/status`.
- Use the HTTP-only `accessToken` cookie and server-side Bearer authorization.
- Never return the JWT to browser code.
- Submit callback body exactly as `{ code, state }`.
- Use a full-page redirect via `window.location.assign(authUrl)`.
- Support one account per client; use `reconnectRequired`, `EXPIRED`, and
  `REVOKED` to present reconnection.
- Do not commit unless the user explicitly requests it.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `src/app/api/platform/instagram/status/route.ts` | BFF status forwarding |
| `src/app/api/platform/instagram/auth-url/route.ts` | BFF OAuth URL forwarding |
| `src/app/api/platform/instagram/callback/route.ts` | BFF callback forwarding |
| `src/app/api/platform/instagram/routes.test.ts` | BFF request, auth, and errors |
| `src/features/instagram/InstagramConnectionCard.tsx` | Status, connect/reconnect CTA, redirect |
| `src/features/instagram/InstagramCallback.tsx` | Callback validation, submission, navigation |
| `src/features/instagram/instagram.test.tsx` | Card and callback behavior |
| `src/app/dashboard/page.tsx` | Render connection card |
| `src/app/auth/instagram/callback/page.tsx` | Render callback client component |

## Task 1: Add and test Instagram BFF handlers

**Files:**
- Create: `src/app/api/platform/instagram/status/route.ts`
- Create: `src/app/api/platform/instagram/auth-url/route.ts`
- Create: `src/app/api/platform/instagram/callback/route.ts`
- Create: `src/app/api/platform/instagram/routes.test.ts`

**Interfaces:**

```ts
GET /api/platform/instagram/status -> InstagramStatus
POST /api/platform/instagram/auth-url -> InstagramAuthUrlResponse
POST /api/platform/instagram/callback { code, state } -> backend response
```

- [ ] **Step 1: Write failing route tests**

Mock `next/headers` and `fetch`. Test that a cookie token produces:

```ts
expect(fetch).toHaveBeenCalledWith(
  "http://api.test/platform/instagram/status",
  expect.objectContaining({
    headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
  }),
);
```

Test that callback forwarding contains exactly:

```ts
body: JSON.stringify({ code: "meta-code", state: "client-id" })
```

Test missing cookie returns `401`, backend `400` preserves its Nest
`message`, and `auth-url` returns the backend `{ authUrl, state }`.

- [ ] **Step 2: Verify the tests fail**

Run: `npm run test -- src/app/api/platform/instagram/routes.test.ts`

Expected: FAIL because the BFF handler modules do not exist.

- [ ] **Step 3: Implement the handlers**

Each handler reads:

```ts
const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
if (!token) {
  return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
}
```

Then call `backendRequest` with the documented backend path and token. For
errors, parse the backend JSON, call `backendErrorMessage`, and return:

```ts
return NextResponse.json({ message }, { status: backendResponse.status });
```

The callback handler projects its parsed request body to `{ code, state }`.

- [ ] **Step 4: Verify the BFF**

Run: `npm run test -- src/app/api/platform/instagram/routes.test.ts`

Expected: PASS for status, OAuth URL, callback, unauthorized, and error cases.

## Task 2: Implement and test the dashboard connection card

**Files:**
- Create: `src/features/instagram/InstagramConnectionCard.tsx`
- Create: `src/features/instagram/instagram.test.tsx`
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**

```ts
export function InstagramConnectionCard(): JSX.Element;
```

- [ ] **Step 1: Write failing component tests**

Mock `/api/platform/instagram/status` to return:

```ts
{
  connected: false, status: null, accountId: null, accountUsername: null,
  pageName: null, expiresAt: null, daysUntilExpiry: null,
  reconnectRequired: false
}
```

Assert “Conectar Instagram” is visible. Click it after mocking
`POST /api/platform/instagram/auth-url` with `{ authUrl, state }`; assert:

```ts
expect(window.location.assign).toHaveBeenCalledWith(authUrl);
```

Add tests for `ACTIVE` showing account username and for `REVOKED` or
`reconnectRequired` showing “Reconectar Instagram”. Test an API failure is
rendered with `role="alert"`.

- [ ] **Step 2: Verify the tests fail**

Run: `npm run test -- src/features/instagram/instagram.test.tsx`

Expected: FAIL because `InstagramConnectionCard` does not exist.

- [ ] **Step 3: Implement the card**

Fetch the BFF status on mount, render a loading state, and retain a
card-level error. Define reconnection as:

```ts
const needsReconnect =
  status.reconnectRequired ||
  status.status === "EXPIRED" ||
  status.status === "REVOKED";
```

On click, post to the auth-url BFF, reject non-OK responses with its
`message`, then call `window.location.assign(payload.authUrl)`.

- [ ] **Step 4: Render the card on the dashboard**

Place `<InstagramConnectionCard />` beneath the authenticated greeting, without
changing the logout link or session-loading behavior.

- [ ] **Step 5: Verify dashboard behavior**

Run: `npm run test -- src/features/instagram/instagram.test.tsx`

Expected: PASS for connect, reconnect, status, redirect, and failure states.

## Task 3: Implement and test the Meta callback page

**Files:**
- Create: `src/features/instagram/InstagramCallback.tsx`
- Modify: `src/features/instagram/instagram.test.tsx`
- Create: `src/app/auth/instagram/callback/page.tsx`

**Interfaces:**

```ts
export function InstagramCallback(): JSX.Element;
```

- [ ] **Step 1: Write failing callback tests**

Mock `useSearchParams` and `useRouter`. With no `code`, assert a
`role="alert"` and no callback fetch. With both values, assert:

```ts
expect(fetch).toHaveBeenCalledWith("/api/platform/instagram/callback", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ code: "meta-code", state: "client-id" }),
});
expect(router.replace).toHaveBeenCalledWith("/dashboard?instagram=connected");
```

Mock a failed callback and assert an accessible error plus a dashboard retry
link.

- [ ] **Step 2: Verify the tests fail**

Run: `npm run test -- src/features/instagram/instagram.test.tsx`

Expected: FAIL because `InstagramCallback` does not exist.

- [ ] **Step 3: Implement callback processing**

Read `code` and `state` with `useSearchParams`. If either is absent, render
the error directly. Otherwise use `useEffect` guarded by a ref to issue one
callback request, redirect after success, and show a failure state after an
error.

- [ ] **Step 4: Add the route**

Render `<InstagramCallback />` from
`src/app/auth/instagram/callback/page.tsx`.

- [ ] **Step 5: Verify the callback**

Run: `npm run test -- src/features/instagram/instagram.test.tsx`

Expected: PASS for missing query, valid callback, navigation, and failure.

## Task 4: Verify the complete feature

- [ ] **Step 1: Run all tests**

Run: `npm run test`

Expected: zero failed tests.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint && npm run build`

Expected: both commands exit with code 0.

- [ ] **Step 3: Review feature diff**

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors; changes limited to Instagram OAuth BFF, UI,
tests, and the planning documents.
