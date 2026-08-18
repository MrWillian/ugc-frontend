import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieSpies = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieSpies),
}));

import { GET as listPosts } from "@/app/api/posts/route";
import { POST as approvePost } from "@/app/api/posts/[id]/approve/route";
import { POST as rejectPost } from "@/app/api/posts/[id]/reject/route";

const approvedPost = {
  id: "post-1",
  status: "APPROVED",
  rightsStatus: "PENDING",
  consent_link: "https://api.test/consent?token=abc",
};

describe("Posts moderation BFF routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    cookieSpies.get.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards only page, limit and status to GET /posts", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const payload = { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    const response = await listPosts(
      new Request(
        "http://localhost/api/posts?page=2&limit=20&status=pending&campaignId=campaign-1&search=praia",
      ),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/posts?page=2&limit=20&status=pending",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(payload);
  });

  it("forwards approve to POST /posts/:id/approve", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(approvedPost));
    vi.stubGlobal("fetch", fetchMock);

    const response = await approvePost(
      new Request("http://localhost/api/posts/post-1/approve", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "post-1" }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/posts/post-1/approve",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(approvedPost);
  });

  it("forwards only rejection_reasons to POST /posts/:id/reject", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const rejectedPost = { ...approvedPost, status: "REJECTED", rightsStatus: "REJECTED" };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(rejectedPost));
    vi.stubGlobal("fetch", fetchMock);

    const response = await rejectPost(
      new Request("http://localhost/api/posts/post-1/reject", {
        method: "POST",
        body: JSON.stringify({
          rejection_reasons: "Fora do briefing",
          extra: "must-not-be-forwarded",
        }),
      }),
      { params: Promise.resolve({ id: "post-1" }) },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/posts/post-1/reject",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
        body: JSON.stringify({ rejection_reasons: "Fora do briefing" }),
      }),
    );
    expect(await response.json()).toEqual(rejectedPost);
  });

  it.each([
    [
      "approve",
      () =>
        approvePost(new Request("http://localhost/api/posts/post-1/approve", { method: "POST" }), {
          params: Promise.resolve({ id: "post-1" }),
        }),
    ],
    [
      "reject",
      () =>
        rejectPost(
          new Request("http://localhost/api/posts/post-1/reject", {
            method: "POST",
            body: JSON.stringify({ rejection_reasons: "motivo" }),
          }),
          { params: Promise.resolve({ id: "post-1" }) },
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

  it("preserves a backend error status and Nest message on reject", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({ message: "rejection_reasons should not be empty" }, { status: 400 }),
      ),
    );

    const response = await rejectPost(
      new Request("http://localhost/api/posts/post-1/reject", {
        method: "POST",
        body: JSON.stringify({ rejection_reasons: "" }),
      }),
      { params: Promise.resolve({ id: "post-1" }) },
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "rejection_reasons should not be empty",
    });
  });
});
