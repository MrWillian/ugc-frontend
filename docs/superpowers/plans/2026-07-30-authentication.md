# Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add BFF-backed JWT authentication with HTTP-only cookies, protected
routes, and validated login, signup, and logout screens.

**Architecture:** Next route handlers proxy the documented Nest auth endpoints
and keep the access token exclusively in an HTTP-only cookie. `AuthProvider`
holds the authenticated `Client`, restores it through an internal `/me`
endpoint, and drives the client forms. `proxy.ts` applies navigation redirects
based on cookie presence while backend requests remain the authority for JWT
validity.

**Tech Stack:** Next.js 16.2.11 App Router, React 19, TypeScript strict,
react-hook-form, Zod, Vitest, Testing Library, Tailwind CSS 4, shadcn Button.

## Global Constraints

- Consume only `POST /auth/login`, `POST /auth/signup`, `POST /auth/logout`,
  and `GET /auth/me` from the documented backend contract.
- Send exactly `email` and `password` to login; send exactly `name`, `email`,
  `password`, and `subdomain` to signup.
- Backend-authenticated requests use `Authorization: Bearer <accessToken>`.
- The browser must never receive, persist, or read `accessToken`.
- Cookie options are `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` only
  when `NODE_ENV === "production"`.
- Use `src/proxy.ts`; Next.js 16 deprecates `src/middleware.ts`.
- Do not commit unless the user explicitly requests a commit.
- Run `npm run build` after implementation.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `package.json`, `vitest.config.ts`, `src/test/setup.ts`, `src/test/smoke.test.ts` | Unit/component-test runtime and commands |
| `src/lib/auth-server.ts` | Cookie settings, backend URL construction, Bearer forwarding, Nest error normalization |
| `src/lib/auth-server.test.ts` | Pure auth-server helper behavior |
| `src/app/api/auth/login/route.ts` | Login BFF endpoint and token-cookie creation |
| `src/app/api/auth/signup/route.ts` | Signup BFF endpoint and token-cookie creation |
| `src/app/api/auth/me/route.ts` | Current-client BFF endpoint |
| `src/app/api/auth/logout/route.ts` | Stateless backend logout and cookie deletion |
| `src/app/api/auth/routes.test.ts` | BFF success, backend-error, and cookie behavior |
| `src/contexts/AuthContext.tsx` | Session hydration and login/signup/logout interface |
| `src/contexts/AuthContext.test.tsx` | Provider state and failure behavior |
| `src/features/auth/schemas.ts` | Shared Zod schemas and inferred form values |
| `src/features/auth/components/AuthForm.tsx` | Reusable labeled controls, pending UI, form alert |
| `src/features/auth/components/LoginForm.tsx` | Login form submission and field errors |
| `src/features/auth/components/SignupForm.tsx` | Signup form submission and field errors |
| `src/features/auth/components/auth-forms.test.tsx` | Client validation and submission behavior |
| `src/app/login/page.tsx`, `src/app/signup/page.tsx` | Public auth routes |
| `src/app/logout/page.tsx` | Logout action route |
| `src/app/dashboard/page.tsx` | Minimal valid redirect target and session confirmation |
| `src/app/layout.tsx` | Root `AuthProvider` registration |
| `src/proxy.ts`, `src/proxy.test.ts` | Auth redirect behavior and matcher configuration |
| `src/lib/api.ts` | Remove browser-readable JWT persistence and stale client interceptor |

## Task 1: Add a test runtime

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/smoke.test.ts`

**Interfaces:**
- Produces `npm run test` for one-shot Vitest execution.
- Produces `npm run test:watch` for local development.

- [ ] **Step 1: Add the failing test command and test dependencies**

Add `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`,
and `@testing-library/jest-dom` as dev dependencies, and scripts:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 2: Configure the test environment**

```ts
// vitest.config.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": path.join(rootDir, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: Add and run a smoke test**

```ts
// src/test/smoke.test.ts
import { expect, it } from "vitest";

it("runs the test environment", () => {
  expect(true).toBe(true);
});
```

Run: `npm run test`

Expected: Vitest exits successfully with one passing test.

## Task 2: Build and test server auth primitives

**Files:**
- Create: `src/lib/auth-server.ts`
- Create: `src/lib/auth-server.test.ts`

**Interfaces:**
- Produces `ACCESS_TOKEN_COOKIE: "accessToken"`.
- Produces `accessTokenCookieOptions()` returning Next-compatible cookie options.
- Produces `backendRequest(path, init, token?)` that calls
  `${NEXT_PUBLIC_API_URL}${path}` and injects Bearer authorization.
- Produces `backendErrorMessage(body)` returning a string from Nest error
  bodies.

- [ ] **Step 1: Write failing unit tests**

```ts
import { describe, expect, it, vi } from "vitest";
import {
  ACCESS_TOKEN_COOKIE,
  accessTokenCookieOptions,
  backendErrorMessage,
  backendRequest,
} from "@/lib/auth-server";

describe("accessTokenCookieOptions", () => {
  it("creates an HTTP-only same-site cookie", () => {
    expect(accessTokenCookieOptions()).toMatchObject({
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  });
});

describe("backendErrorMessage", () => {
  it("joins Nest validation messages", () => {
    expect(backendErrorMessage({ message: ["email must be an email", "password is too short"] }))
      .toBe("email must be an email password is too short");
  });
});

describe("backendRequest", () => {
  it("forwards the token as a Bearer header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";

    await backendRequest("/auth/me", { method: "GET" }, "jwt-value");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    vi.unstubAllGlobals();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- src/lib/auth-server.test.ts`

Expected: FAIL because `@/lib/auth-server` does not exist.

- [ ] **Step 3: Implement the narrow server helper**

```ts
export const ACCESS_TOKEN_COOKIE = "accessToken";

export function accessTokenCookieOptions() {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function backendErrorMessage(body: unknown): string {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message: unknown }).message;
    return Array.isArray(message) ? message.join(" ") : String(message);
  }
  return "Não foi possível concluir a solicitação.";
}

export async function backendRequest(path: string, init: RequestInit, token?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL não está configurada.");

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${baseUrl}${path}`, { ...init, headers, cache: "no-store" });
}
```

- [ ] **Step 4: Run the helper tests**

Run: `npm run test -- src/lib/auth-server.test.ts`

Expected: PASS with all helper cases green.

## Task 3: Implement and test BFF auth route handlers

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/signup/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/routes.test.ts`

**Interfaces:**
- `POST /api/auth/login` and `POST /api/auth/signup` return `{ client }`.
- `GET /api/auth/me` returns `{ client }`.
- `POST /api/auth/logout` returns `{ ok: true }`.
- The login and signup handlers set `ACCESS_TOKEN_COOKIE`; logout and an
  unauthorized `/me` delete it.

- [ ] **Step 1: Write failing BFF tests**

```ts
it("returns the client and sets an HTTP-only cookie after login", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({ accessToken: "jwt-value", client }, { status: 201 }),
  );

  const response = await loginPost(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "password123" }),
    }),
  );

  expect(await response.json()).toEqual({ client });
  expect(response.headers.get("set-cookie")).toContain("accessToken=jwt-value");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
});

it("preserves the Nest status and message on signup failure", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({ message: "Email já cadastrado" }, { status: 409 }),
  );

  const response = await signupPost(new Request("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(validSignup),
  }));

  expect(response.status).toBe(409);
  expect(await response.json()).toEqual({ message: "Email já cadastrado" });
});
```

Mock `next/headers` in the `/me` and `/logout` tests so its `cookies()` call
returns `get`, `set`, and `delete` spies. Test that `/me` forwards the cookie
as a Bearer header and deletes it on a backend 401.

- [ ] **Step 2: Run the route tests to verify failure**

Run: `npm run test -- src/app/api/auth/routes.test.ts`

Expected: FAIL because the auth route modules do not exist.

- [ ] **Step 3: Implement login and signup handlers**

Each handler must parse its JSON request, call `backendRequest` with the
matching documented endpoint and body, map backend failures to
`NextResponse.json({ message }, { status })`, then set the cookie only after a
successful `{ accessToken, client }` response:

```ts
const response = NextResponse.json({ client: payload.client });
response.cookies.set(ACCESS_TOKEN_COOKIE, payload.accessToken, accessTokenCookieOptions());
return response;
```

- [ ] **Step 4: Implement `/me` and `/logout` handlers**

```ts
const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
if (!token) return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
```

`/me` calls `backendRequest("/auth/me", { method: "GET" }, token)` and deletes
the cookie if the backend rejects it. `/logout` calls the backend with the
token when present, returns `{ ok: true }` even though backend logout is
stateless, and always deletes the cookie.

- [ ] **Step 5: Run BFF tests**

Run: `npm run test -- src/app/api/auth/routes.test.ts`

Expected: PASS for success, error, forwarding, and deletion cases.

## Task 4: Add the session provider and replace insecure browser token storage

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Create: `src/contexts/AuthContext.test.tsx`
- Modify: `src/lib/api.ts`
- Modify: `src/app/layout.tsx`

**Interfaces:**

```ts
export interface AuthContextValue {
  user: Client | null;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  signup(name: string, email: string, password: string, subdomain: string): Promise<void>;
  logout(): Promise<void>;
}
export function useAuth(): AuthContextValue;
```

- [ ] **Step 1: Write the failing provider tests**

```tsx
it("hydrates the client from the internal me route", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ client }));
  render(
    <AuthProvider>
      <SessionProbe />
    </AuthProvider>,
  );

  expect(await screen.findByText(client.email)).toBeInTheDocument();
});

it("stores the returned client after login without exposing the token", async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json({ message: "Não autenticado." }, { status: 401 }))
    .mockResolvedValueOnce(Response.json({ client }));

  render(<AuthProvider><SessionProbe /></AuthProvider>);
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

  expect(await screen.findByText(client.name)).toBeInTheDocument();
});
```

`SessionProbe` consumes `useAuth`, shows the user, and invokes `login`; include
a test that a non-OK login rejects with the returned `message`.

- [ ] **Step 2: Run the provider tests to verify failure**

Run: `npm run test -- src/contexts/AuthContext.test.tsx`

Expected: FAIL because `AuthProvider` and `useAuth` do not exist.

- [ ] **Step 3: Implement `AuthProvider`**

On mount, `fetch("/api/auth/me", { credentials: "same-origin" })`; assign
`user` when it returns `{ client }`, otherwise leave it `null`; finish by
setting `isLoading` false. Each mutation calls its matching internal endpoint,
uses the returned `{ client }`, and throws a normalized request message on a
non-OK response. `logout` posts to `/api/auth/logout` and clears `user` in a
`finally` block.

- [ ] **Step 4: Register the provider and remove browser JWT access**

Wrap root `children` in `<AuthProvider>`. Replace `src/lib/api.ts` with a
browser client that has no `getAccessToken`, `setAccessToken`,
`clearAccessToken`, `document.cookie`, `localStorage`, or Bearer interceptor.
Future browser API calls must use internal BFF routes.

- [ ] **Step 5: Run the provider tests**

Run: `npm run test -- src/contexts/AuthContext.test.tsx`

Expected: PASS with hydration, login, error, and logout behavior green.

## Task 5: Build and test validated auth screens

**Files:**
- Create: `src/features/auth/schemas.ts`
- Create: `src/features/auth/components/AuthForm.tsx`
- Create: `src/features/auth/components/LoginForm.tsx`
- Create: `src/features/auth/components/SignupForm.tsx`
- Create: `src/features/auth/components/auth-forms.test.tsx`
- Create: `src/app/login/page.tsx`
- Create: `src/app/signup/page.tsx`
- Create: `src/app/logout/page.tsx`
- Create: `src/app/dashboard/page.tsx`

**Interfaces:**
- `loginSchema` validates a non-empty email and password.
- `signupSchema` validates name, email, password of at least 8 characters, and
  a lowercase hostname-style subdomain.
- `LoginForm` and `SignupForm` call the matching `useAuth` action then
  `router.replace("/dashboard")`.

- [ ] **Step 1: Write failing schema and form tests**

```tsx
it("blocks login submission until email and password are valid", async () => {
  render(<LoginForm />);
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

  expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
  expect(auth.login).not.toHaveBeenCalled();
});

it("sends exactly the documented signup fields and navigates on success", async () => {
  render(<SignupForm />);
  await userEvent.type(screen.getByLabelText("Nome"), "Acme");
  await userEvent.type(screen.getByLabelText("E-mail"), "a@b.com");
  await userEvent.type(screen.getByLabelText("Senha"), "password123");
  await userEvent.type(screen.getByLabelText("Subdomínio"), "acme");
  await userEvent.click(screen.getByRole("button", { name: "Criar conta" }));

  expect(auth.signup).toHaveBeenCalledWith("Acme", "a@b.com", "password123", "acme");
  expect(replace).toHaveBeenCalledWith("/dashboard");
});
```

Mock `useAuth` and `next/navigation`, then test an action rejection renders a
`role="alert"` error.

- [ ] **Step 2: Run the form tests to verify failure**

Run: `npm run test -- src/features/auth/components/auth-forms.test.tsx`

Expected: FAIL because schemas and forms do not exist.

- [ ] **Step 3: Implement schemas and forms**

```ts
export const signupSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome."),
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres."),
  subdomain: z
    .string()
    .trim()
    .regex(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, "Informe um subdomínio válido."),
});
```

Use `zodResolver`, visible labels, field-level errors, a disabled `Button`
while submitting, and a form-level `role="alert"` for failed requests.

- [ ] **Step 4: Implement pages and the redirect target**

`/login` and `/signup` render their form in a centered card and link to each
other. `/logout` uses `useEffect` to await `logout()` and calls
`router.replace("/login")`. `/dashboard` reads `user` with `useAuth`, renders
its name after hydration, and links to `/logout`, ensuring login/signup
redirects resolve to a real route.

- [ ] **Step 5: Run the form tests**

Run: `npm run test -- src/features/auth/components/auth-forms.test.tsx`

Expected: PASS for validation, request arguments, error display, and redirect.

## Task 6: Add route protection with Next 16 proxy

**Files:**
- Create: `src/proxy.ts`
- Create: `src/proxy.test.ts`

**Interfaces:**

```ts
export function proxy(request: NextRequest): NextResponse;
export const config = {
  matcher: ["/dashboard/:path*", "/campaigns/:path*", "/widgets/:path*", "/login", "/signup"],
};
```

- [ ] **Step 1: Write failing redirect tests**

```ts
it("redirects a missing-cookie dashboard request to login", () => {
  const response = proxy(new NextRequest("http://localhost/dashboard"));

  expect(response.headers.get("location")).toBe("http://localhost/login");
});

it("redirects an authenticated login request to dashboard", () => {
  const request = new NextRequest("http://localhost/login");
  request.cookies.set("accessToken", "jwt-value");

  const response = proxy(request);

  expect(response.headers.get("location")).toBe("http://localhost/dashboard");
});
```

- [ ] **Step 2: Run the proxy test to verify failure**

Run: `npm run test -- src/proxy.test.ts`

Expected: FAIL because `@/proxy` does not exist.

- [ ] **Step 3: Implement the proxy**

```ts
const protectedPrefixes = ["/dashboard", "/campaigns", "/widgets"];
const publicPaths = new Set(["/login", "/signup"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authenticated = Boolean(request.cookies.get(ACCESS_TOKEN_COOKIE)?.value);
  const protectedPath = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (protectedPath && !authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (publicPaths.has(pathname) && authenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}
```

- [ ] **Step 4: Run proxy tests**

Run: `npm run test -- src/proxy.test.ts`

Expected: PASS for protected, public, and unchanged requests.

## Task 7: Run complete verification

**Files:**
- Modify: only files needed to resolve failures from this verification.

- [ ] **Step 1: Run the complete unit and component suite**

Run: `npm run test`

Expected: PASS with zero failed tests.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: ESLint exits with code 0.

- [ ] **Step 3: Build the production app**

Run: `npm run build`

Expected: Next.js completes type checking and production build with exit code 0.

- [ ] **Step 4: Review the complete diff against the design**

Run: `git diff --check && git diff --stat && git status --short`

Expected: no whitespace errors; changes limited to the authentication BFF,
provider, pages, tests, and planning documentation.
