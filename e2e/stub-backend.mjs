// Stand-in for the Nest API during e2e runs, so the instant() suite does not
// depend on a live backend. Serves only the endpoints the BFF calls.
import { createServer } from "node:http";

const PORT = Number(process.env.STUB_BACKEND_PORT ?? 4010);
const ACCESS_TOKEN = "e2e-access-token";

// Every endpoint sleeps, so a route that waits on data cannot pass instant()
// by being coincidentally fast.
const LATENCY_MS = Number(process.env.STUB_BACKEND_LATENCY_MS ?? 300);

export const TEST_CLIENT = {
  id: "client-e2e",
  email: "e2e@socialproof.test",
  name: "Acme Studio",
  subdomain: "acme",
  plan: "PRO",
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: "active",
  currentPeriodEnd: null,
  companyName: "Acme Studio LTDA",
  createdAt: "2026-01-05T00:00:00.000Z",
  updatedAt: "2026-01-05T00:00:00.000Z",
};

const STATUSES = ["PENDING", "APPROVED", "APPROVED", "REJECTED"];

const POSTS = Array.from({ length: 24 }, (_, index) => {
  const createdAt = new Date(Date.UTC(2026, 8, 20 + (index % 10), 9, index))
    .toISOString();
  return {
    id: `post-${index + 1}`,
    campaignId: "campaign-1",
    platform: "INSTAGRAM",
    externalId: `ig-${index + 1}`,
    contentType: "IMAGE",
    contentUrl: `https://cdn.test/post-${index + 1}.jpg`,
    thumbnailUrl: null,
    caption: `Post de exemplo ${index + 1}`,
    authorData: { username: `creator_${index + 1}` },
    metrics: null,
    postedAt: createdAt,
    status: STATUSES[index % STATUSES.length],
    rightsStatus: "GRANTED",
    displayStatus: "VISIBLE",
    createdAt,
    updatedAt: createdAt,
  };
});

const WIDGETS = [
  {
    id: "widget-1",
    clientId: TEST_CLIENT.id,
    name: "default",
    layout: "GRID",
    filters: null,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "widget-2",
    clientId: TEST_CLIENT.id,
    name: "Depoimentos",
    layout: "CAROUSEL",
    filters: null,
    createdAt: "2026-03-01T00:00:00.000Z",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
];

function paginate(url) {
  const status = url.searchParams.get("status");
  const limit = Number(url.searchParams.get("limit") ?? 50);
  const matching = status
    ? POSTS.filter((post) => post.status === status.toUpperCase())
    : POSTS;

  return {
    data: matching.slice(0, limit),
    meta: { total: matching.length, page: 1, limit, totalPages: 1 },
  };
}

function authorized(request) {
  return request.headers.authorization === `Bearer ${ACCESS_TOKEN}`;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${PORT}`);

  function send(status, body) {
    const payload = JSON.stringify(body);
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    });
    response.end(payload);
  }

  if (url.pathname === "/health") {
    send(200, { ok: true });
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

  if (url.pathname === "/auth/login" && request.method === "POST") {
    send(201, { accessToken: ACCESS_TOKEN, client: TEST_CLIENT });
    return;
  }

  // The public embed endpoint carries no Authorization header.
  if (/^\/api\/widget\/[^/]+\/posts$/.test(url.pathname)) {
    send(200, { items: POSTS.slice(0, 5) });
    return;
  }

  if (!authorized(request)) {
    send(401, { statusCode: 401, message: "Unauthorized" });
    return;
  }

  if (url.pathname === "/auth/me") {
    send(200, TEST_CLIENT);
    return;
  }

  if (url.pathname === "/posts") {
    send(200, paginate(url));
    return;
  }

  if (url.pathname === "/widgets") {
    send(200, WIDGETS);
    return;
  }

  if (url.pathname === "/campaigns") {
    send(200, []);
    return;
  }

  send(404, { statusCode: 404, message: `No stub for ${url.pathname}` });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`stub backend listening on http://127.0.0.1:${PORT}`);
});
