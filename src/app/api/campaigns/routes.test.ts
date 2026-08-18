import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieSpies = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieSpies),
}));

import { GET as listGet, POST as createPost } from "@/app/api/campaigns/route";
import { GET as getById, PATCH as patchById } from "@/app/api/campaigns/[id]/route";
import { GET as listCampaignPosts } from "@/app/api/campaigns/[id]/posts/route";

const campaign = {
  id: "campaign-1",
  clientId: "client-1",
  name: "Campanha verão",
  hashtag: "Verao_2026",
  termsText: "Termos da campanha",
  active: true,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
};

describe("Campaigns BFF routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    cookieSpies.get.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the cookie token and returns the campaigns list", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json([campaign]));
    vi.stubGlobal("fetch", fetchMock);

    const response = await listGet();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/campaigns",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual([campaign]);
  });

  it("forwards only documented create fields to POST /campaigns", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(campaign, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await createPost(
      new Request("http://localhost/api/campaigns", {
        method: "POST",
        body: JSON.stringify({
          name: "Campanha verão",
          hashtag: "Verao_2026",
          terms_text: "Termos da campanha",
          extra: "must-not-be-forwarded",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/campaigns",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
        body: JSON.stringify({
          name: "Campanha verão",
          hashtag: "Verao_2026",
          terms_text: "Termos da campanha",
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(campaign);
  });

  it("forwards GET /campaigns/:id/posts with only page, limit and status", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const payload = { data: [], meta: { page: 2, limit: 20, total: 0, totalPages: 0 } };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    const response = await listCampaignPosts(
      new Request(
        "http://localhost/api/campaigns/campaign-1/posts?page=2&limit=20&status=pending&search=praia",
      ),
      { params: Promise.resolve({ id: "campaign-1" }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/campaigns/campaign-1/posts?page=2&limit=20&status=pending",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(payload);
  });

  it("forwards GET /campaigns/:id with the route id", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(campaign));
    vi.stubGlobal("fetch", fetchMock);

    const response = await getById(
      new Request("http://localhost/api/campaigns/campaign-1"),
      { params: Promise.resolve({ id: "campaign-1" }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/campaigns/campaign-1",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(campaign);
  });

  it("forwards only documented patch fields to PATCH /campaigns/:id", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ ...campaign, active: false }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await patchById(
      new Request("http://localhost/api/campaigns/campaign-1", {
        method: "PATCH",
        body: JSON.stringify({
          name: "Campanha verão",
          hashtag: "Verao_2026",
          terms_text: "Termos da campanha",
          active: false,
          extra: "must-not-be-forwarded",
        }),
      }),
      { params: Promise.resolve({ id: "campaign-1" }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/campaigns/campaign-1",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
        body: JSON.stringify({
          name: "Campanha verão",
          hashtag: "Verao_2026",
          terms_text: "Termos da campanha",
          active: false,
        }),
      }),
    );
    expect(await response.json()).toEqual({ ...campaign, active: false });
  });

  it.each([
    ["list", () => listGet()],
    [
      "create",
      () =>
        createPost(
          new Request("http://localhost/api/campaigns", {
            method: "POST",
            body: JSON.stringify({ name: "Campanha", hashtag: "ugc" }),
          }),
        ),
    ],
    [
      "get by id",
      () =>
        getById(new Request("http://localhost/api/campaigns/campaign-1"), {
          params: Promise.resolve({ id: "campaign-1" }),
        }),
    ],
    [
      "patch",
      () =>
        patchById(
          new Request("http://localhost/api/campaigns/campaign-1", {
            method: "PATCH",
            body: JSON.stringify({ active: false }),
          }),
          { params: Promise.resolve({ id: "campaign-1" }) },
        ),
    ],
    [
      "list posts",
      () =>
        listCampaignPosts(
          new Request("http://localhost/api/campaigns/campaign-1/posts"),
          { params: Promise.resolve({ id: "campaign-1" }) },
        ),
    ],
  ])("rejects %s without an access-token cookie", async (_route, requestRoute) => {
    cookieSpies.get.mockReturnValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await requestRoute();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Não autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves a backend 403 status and Nest message", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json(
          { message: "Limite de campanhas ativas do plano atingido." },
          { status: 403 },
        ),
      ),
    );

    const response = await createPost(
      new Request("http://localhost/api/campaigns", {
        method: "POST",
        body: JSON.stringify({ name: "Campanha", hashtag: "ugc" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      message: "Limite de campanhas ativas do plano atingido.",
    });
  });
});
