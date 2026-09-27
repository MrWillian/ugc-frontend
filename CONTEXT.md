# UGC Frontend

Authenticated dashboard for a multi-tenant UGC platform: clients run campaigns,
moderate posts, obtain creator consent, and embed approved content on their
sites via widgets.

## Language

**Widget**:
A named, configurable embed container owned by a Client. Has a layout and
optional filters. Posts appear in it automatically when creators grant consent
— not via manual curation in v1.
_Avoid_: Gallery, feed (when meaning the embed entity)

**Embed code**:
The HTML snippet a Client copies onto their own site: a mount `div` plus a
`<script>` tag pointing at the Nest public embed endpoint
(`GET /api/widget/:id.js`). Always targets Nest, never the Next BFF.
_Avoid_: Snippet (alone), embed script (when meaning the copyable HTML)

**Dashboard preview**:
The in-page post render on `/widgets/[id]`. Fetches public post JSON through
the Next BFF (`GET /api/widget/:id/posts`) and renders layouts with CSS. Does
not execute the Nest embed script. Each card shows thumbnail, caption (hidden
when `filters.showCaptions === false`), and author username. Layout rendering
may differ from the production embed until the Nest script catches up.
_Avoid_: Preview (alone), live preview

**Production embed**:
What runs on the Client's external site when they paste the embed code. Served
by Nest as JavaScript. Layout support may differ from the dashboard preview
until the embed script catches up.
_Avoid_: Real widget, customer embed

**Filters**:
Optional JSON object on a Widget (e.g. `maxPosts`, `showCaptions`, `theme`).
Edited as a raw textarea on create/edit in v1. Empty on create omits the field;
on edit, empty means unchanged. Clearing requires **Remover filtros**, which
PATCHes `{ "filters": null }`.
_Avoid_: Settings, config (when meaning widget filters)

**Default widget**:
A Widget whose name is `default` (case-insensitive). When a creator grants
consent, new posts auto-attach here first. If no default exists, the Client's
oldest Widget receives them.
_Avoid_: Primary widget, main widget

**Widget-eligible post**:
A Post that may appear in a Widget's dashboard preview or production embed.
Requires `displayStatus === VISIBLE` and `rightsStatus === GRANTED`.
_Avoid_: Approved post, visible post (approval alone is insufficient)

**Widget plan limit**:
Plan tiers cap how many Widgets a Client may create (403 from Nest on POST).
Editing and deleting existing Widgets remain allowed at the cap.
_Avoid_: Widget quota (when meaning the create-time limit)

**Widget explainer**:
Short copy on the widget detail page describing both widget-eligibility
(VISIBLE + GRANTED) and consent-driven membership (Default widget first,
else oldest widget). Shown near the dashboard preview section.
_Avoid_: Help text, tooltip (when meaning this standing paragraph)
