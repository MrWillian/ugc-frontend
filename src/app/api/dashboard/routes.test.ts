import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieSpies = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieSpies),
}));

import { GET as campaignsGet } from "@/app/api/campaigns/route";
import { GET as postsGet } from "@/app/api/posts/route";
import { GET as widgetsGet } from "@/app/api/widgets/route";

describe("Dashboard BFF routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    cookieSpies.get.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the cookie token and returns campaigns", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const campaigns = [{ id: "campaign-1", name: "Summer Sale" }];
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(campaigns));
    vi.stubGlobal("fetch", fetchMock);

    const response = await campaignsGet();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/campaigns",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(campaigns);
  });

  it("forwards query params and returns paginated posts", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const payload = {
      data: [{ id: "post-1", status: "pending" }],
      meta: { page: 1, limit: 1, total: 1 },
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    const response = await postsGet(
      new Request("http://localhost/api/posts?status=pending&limit=1"),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/posts?status=pending&limit=1",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(payload);
  });

  it("forwards the cookie token and returns widgets", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const widgets = [{ id: "widget-1", name: "Gallery" }];
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(widgets));
    vi.stubGlobal("fetch", fetchMock);

    const response = await widgetsGet();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/widgets",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(widgets);
  });

  it.each([
    ["campaigns", () => campaignsGet()],
    [
      "posts",
      () =>
        postsGet(new Request("http://localhost/api/posts?status=pending&limit=1")),
    ],
    ["widgets", () => widgetsGet()],
  ])("rejects %s without an access-token cookie", async (_route, requestRoute) => {
    cookieSpies.get.mockReturnValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await requestRoute();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Não autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves a backend error status and Nest message on campaigns", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({ message: "Forbidden resource" }, { status: 403 }),
      ),
    );

    const response = await campaignsGet();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Forbidden resource" });
  });
});
