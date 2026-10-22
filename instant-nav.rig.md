# instant-nav rig: ugc-frontend

- BUILD: `npm run e2e:build` (= `EXPOSE_TESTING_API=1 NEXT_PUBLIC_API_URL=http://127.0.0.1:4010 next build`),
  then Playwright's `webServer` starts `next start --port 3100` plus the stub
  backend on `127.0.0.1:4010`. Never `next dev` — it does not prefetch, so its
  `instant()` result is not a valid RED or GREEN.
- EXPOSE: `experimental.exposeTestingApiInProductionBuild: process.env.EXPOSE_TESTING_API === "1"`
  in `next.config.ts`. **Set it for both `next build` and `next start`.** The
  client-side lock is compiled into the bundle at build time, but the server
  re-reads the config on every request to decide whether to honor the lock
  cookie on a document request. With it set only at build time, soft navigations
  lock correctly while initial loads silently do not — the exact vacuous pass
  described in `reference/red-test-robustness.md`. `playwright.config.ts` sets it
  in the `webServer` env for this reason.
- RUN: `npm run e2e -- e2e/instant-dashboard.spec.ts`. `baseURL` defaults to
  `http://127.0.0.1:3100`; set `BASE_URL` to point at an already-running server,
  which also disables the managed `webServer`.
- TEST USER: `e2e@socialproof.test` / `e2e-password`, served by
  `e2e/stub-backend.mjs` (the real Nest API is not available locally). State:
  name `Acme Studio`, plan `PRO`, 24 posts across PENDING/APPROVED/REJECTED,
  2 widgets (`default` + `Depoimentos`), 0 campaigns. Session is established by
  `injectTestUserSession()` in `e2e/helpers.ts`, which logs in over an API
  request context and injects the `accessToken` cookie — it never navigates
  `page`, so an initial-load `instant()` measurement stays valid.
- DRIFT: the stub always returns a populated post list, so an empty-state
  regression would not show up here; the greeting depends on `client.name`, so
  changing `TEST_CLIENT.name` breaks the greeting assertion. Every backend
  endpoint sleeps `STUB_BACKEND_LATENCY_MS` (300ms default) so a blocking route
  cannot pass by being coincidentally fast. No feature flags, roles, or locales
  vary in this app.
- CONTRACTS:
  - soft navigation `/settings` → `/dashboard` (click the sidebar
    "Dashboard" link). Shell marker: `[data-testid="dashboard-shell-marker"]`
    on the page header frame. Deferred marker:
    `[data-testid="activity-feed-items"]`. Guarded with `instant()`,
    self-validating (shell present ∧ feed gated ∧ feed streams after release).
  - initial load `/dashboard`, asserted on the served document rather than the
    DOM: the locked document contains the shell marker and not the feed, the
    unlocked one contains both. In a browser the client resumes the postponed
    render as soon as the shell lands, so a DOM-level `toHaveCount(0)` races
    that resume; the served bytes are deterministic. Measured locally: locked
    16 KB in ~4ms, unlocked 53 KB in ~410ms.
  - mobile breakpoint (390×844) initial load, `instant()` + shell marker (D2).
- LOOP: edit → `npm run e2e:build` → `npm run e2e -- e2e/instant-dashboard.spec.ts`
  (Playwright owns server start/stop, `reuseExistingServer: false`) → repeat.
  Agent limits: none; no deploy, secrets, or approvals involved.
- LIVENESS: n/a; local build and start.
- WALLS:
  - On a fresh machine run `npx playwright install chromium` first. Browsers
    come from Playwright's default cache (`~/.cache/ms-playwright`); if
    `PLAYWRIGHT_BROWSERS_PATH` is exported in your shell, the install and the
    run must agree on it, or the run fails with "Executable doesn't exist".
  - `next start` forks a `next-server` child, so killing the launcher leaves the
    port held and the next run dies on "port already used". `npm run e2e` calls
    `e2e:ports` first to free 3100/4010; a stale server on the port is also how
    a run can silently measure the wrong artifact.
  - `.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:3000`, which
    collides with the Next server's own port. The e2e scripts override it to
    the stub on `4010`; shell env wins over `.env.local` in Next.js.
  - `NEXT_PUBLIC_*` is inlined at build time, so the override must be present
    on the `e2e:build` command, not only on `next start`.
  - The four `/[id]` routes carry `export const instant = false`: the shared
    sidebar reads `usePathname()`, which is request-time data on a fallback
    route. They are out of scope for this run; removing the opt-out is the
    follow-up.
