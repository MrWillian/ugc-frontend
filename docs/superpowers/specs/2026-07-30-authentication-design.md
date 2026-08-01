# Authentication Design

## Goal

Provide login, signup, logout, protected-route redirects, and authenticated
backend access without exposing the backend JWT to browser JavaScript.

## Constraints

- The backend contract is `POST /auth/login`, `POST /auth/signup`,
  `POST /auth/logout`, and `GET /auth/me`.
- Login accepts exactly `email` and `password`.
- Signup accepts exactly `name`, `email`, `password`, and `subdomain`.
- Authenticated backend calls require `Authorization: Bearer <accessToken>`.
- The backend JWT is stateless; logout clears client-side session state.
- The frontend uses Next.js 16.2.11, React 19, TypeScript strict,
  `react-hook-form`, and Zod.
- The token cookie is `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in
  production.
- Next.js 16 uses `proxy.ts`; `middleware.ts` is deprecated.

## Architecture

Route handlers under `src/app/api/auth` form a backend-for-frontend boundary.
They call the Nest API using `NEXT_PUBLIC_API_URL`, set or clear the
`accessToken` cookie, and never return the JWT to the browser. A server-side
authenticated fetch helper reads the cookie and adds the Bearer header for
future authenticated API handlers.

`AuthProvider` stores the authenticated `Client` and a loading state. On
mount, it calls the internal `/api/auth/me` route to restore the session. Its
login, signup, and logout actions call internal routes, update or clear
`user`, and contain no JWT state because the token remains HTTP-only.

## Routes and UI

- `/login` renders a client form validated by Zod, submits to
  `AuthProvider.login`, displays Nest API errors, and redirects to
  `/dashboard` after success.
- `/signup` validates name, email, password, and hostname-style subdomain,
  calls `AuthProvider.signup`, displays API errors, and redirects to
  `/dashboard`.
- `/logout` invokes `AuthProvider.logout` when mounted, then redirects to
  `/login`.
- `src/proxy.ts` redirects unauthenticated requests for `/dashboard`,
  `/campaigns`, `/widgets`, and each nested route to `/login`. It redirects
  cookie-authenticated visitors from `/login` and `/signup` to `/dashboard`.

## Error Handling

- The BFF preserves the Nest response status and returns a JSON `message`.
- Array messages from Nest are converted to a single visible message.
- Form validation errors appear next to their fields; request errors appear in
  an accessible form-level alert.
- A failed `/api/auth/me` response represents an anonymous session and clears
  the stale token cookie.

## Security Model

The browser cannot read or write the JWT because it is HTTP-only. The BFF
adds the Bearer token only in server-side route handlers. `proxy.ts` checks
cookie presence for fast navigation control; backend calls remain the
authority for token validity and tenant isolation. `Secure` is enabled only
in production so local HTTP development remains usable.

## Verification

Tests cover cookie option construction, backend-response normalization, BFF
success and error behavior, and proxy redirect decisions. The complete suite,
lint, and `npm run build` are run after implementation.
