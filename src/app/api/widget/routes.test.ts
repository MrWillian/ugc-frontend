import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as publicPostsGet } from "@/app/api/widget/[id]/posts/route";

const posts = [
  {
    id: "post-1",
    content_url: "https://cdn.example/photo.jpg",
    thumbnail_url: null,
    caption: "Verão",
    author_data: { username: "ana" },
    posted_at: "2026-05-30T12:00:00.000Z",
  },
];

describe("Public widget posts BFF", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("proxies Nest public posts without an Authorization header", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(posts));
    vi.stubGlobal("fetch", fetchMock);

    const response = await publicPostsGet(
      new Request(
        "http://localhost/api/widget/11111111-1111-4111-8111-111111111111/posts",
      ),
      {
        params: Promise.resolve({
          id: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/widget/11111111-1111-4111-8111-111111111111/posts",
      expect.objectContaining({ method: "GET" }),
    );
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(posts);
  });

  it("preserves a backend 404 status and Nest message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({ message: "Widget not found" }, { status: 404 }),
      ),
    );

    const response = await publicPostsGet(
      new Request("http://localhost/api/widget/missing/posts"),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Widget not found" });
  });
});
