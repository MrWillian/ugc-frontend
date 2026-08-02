# Instagram OAuth Onboarding Design

## Goal

Let an authenticated client connect or reconnect its single Instagram Business
account through the documented Meta redirect flow.

## Constraints

- The frontend calls only `POST /platform/instagram/auth-url`,
  `POST /platform/instagram/callback`, and `GET /platform/instagram/status`.
- These backend endpoints require `Authorization: Bearer <accessToken>`.
- The browser never receives the backend JWT; Next route handlers add the
  Bearer header from the HTTP-only `accessToken` cookie.
- `POST /platform/instagram/auth-url` returns `{ authUrl, state }`.
- Meta redirects to `/auth/instagram/callback?code=&state=`.
- The callback submits both `code` and `state` to the backend.
- One Instagram account is supported per client.

## Architecture

Next BFF route handlers under `src/app/api/platform/instagram` proxy the three
backend endpoints. They read the existing HTTP-only cookie through the shared
server auth helper, return backend statuses and messages, and never expose the
token.

The dashboard owns a focused `InstagramConnectionCard`. It fetches its status
from the BFF, renders connected account details or a clear action state, then
requests `authUrl` and performs a full-page redirect with
`window.location.assign(authUrl)`.

## Routes and Data Flow

1. `/dashboard` loads the connection card, which fetches
   `GET /api/platform/instagram/status`.
2. A disconnected, expired, or revoked account shows “Conectar Instagram” or
   “Reconectar Instagram”.
3. Clicking the CTA posts to `/api/platform/instagram/auth-url` and redirects
   the browser to the returned URL.
4. Meta returns to `/auth/instagram/callback` with `code` and `state`.
5. The callback page rejects missing query values, otherwise posts them to the
   BFF callback route and redirects to `/dashboard?instagram=connected`.
6. The dashboard refreshes the status and shows the connected account name,
   username, and expiry information when available.

## Error Handling

- BFF routes preserve backend HTTP statuses and normalize Nest `message`
  strings or arrays.
- A missing `code` or `state` renders an accessible callback error and a link
  back to the dashboard; it does not call the backend.
- Callback failures render an accessible error and a dashboard retry link.
- Status-fetch and auth-url failures render a card-level error without losing
  the current dashboard session.

## Verification

Tests cover authenticated BFF forwarding, status rendering, the full-page
redirect request, missing callback parameters, callback success navigation,
and API failure states. The complete test suite, lint, and production build
run after implementation.
