# Dashboard widget preview via BFF proxy

Nest serves the production embed as `GET /api/widget/:id.js`, but CORS is not
enabled on the API. Running that script inside the authenticated dashboard (via
iframe or `srcdoc`) would fail because the script's `fetch` calls hit a
cross-origin API.

We render the **dashboard preview** in-page instead: the Next BFF proxies
`GET /api/widget/:id/posts` same-origin, and React renders posts with CSS for
grid, carousel, and masonry layouts. The copyable embed snippet still points
at Nest so customers paste the real script on their own sites.

Layout rendering in the dashboard preview may differ from the production
embed until the Nest script implements carousel/masonry fully. That divergence
is intentional for v1 — the preview shows layout intent and widget-eligible
posts, not pixel-perfect parity with customer sites.
