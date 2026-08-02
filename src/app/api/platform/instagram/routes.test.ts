import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieSpies = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieSpies),
}));

import { POST as authUrlPost } from "@/app/api/platform/instagram/auth-url/route";
import { POST as callbackPost } from "@/app/api/platform/instagram/callback/route";
import { GET as statusGet } from "@/app/api/platform/instagram/status/route";

describe("Instagram BFF routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    cookieSpies.get.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards the cookie token and returns the Instagram status", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const status = {
      connected: true,
      status: "ACTIVE",
      accountId: "instagram-account-id",
      accountUsername: "acme",
      pageName: "Acme",
      expiresAt: "2026-09-01T00:00:00.000Z",
      daysUntilExpiry: 30,
      reconnectRequired: false,
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(status));
    vi.stubGlobal("fetch", fetchMock);

    const response = await statusGet();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/platform/instagram/status",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(status);
  });

  it("returns the backend OAuth URL and state", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const payload = {
      authUrl: "https://www.facebook.com/dialog/oauth",
      state: "client-id",
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    const response = await authUrlPost();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/platform/instagram/auth-url",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
      }),
    );
    expect(await response.json()).toEqual(payload);
  });

  it("forwards exactly code and state to the callback backend", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const payload = { connected: true };
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(payload));
    vi.stubGlobal("fetch", fetchMock);

    const response = await callbackPost(
      new Request("http://localhost/api/platform/instagram/callback", {
        method: "POST",
        body: JSON.stringify({
          code: "meta-code",
          state: "client-id",
          accessToken: "must-not-be-forwarded",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/platform/instagram/callback",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer jwt-value" }),
        body: JSON.stringify({ code: "meta-code", state: "client-id" }),
      }),
    );
    expect(await response.json()).toEqual(payload);
  });

  it.each([
    ["status", () => statusGet()],
    ["auth-url", () => authUrlPost()],
    [
      "callback",
      () =>
        callbackPost(
          new Request("http://localhost/api/platform/instagram/callback", {
            method: "POST",
            body: JSON.stringify({ code: "meta-code", state: "client-id" }),
          }),
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

  it("preserves a backend error status and Nest message", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({ message: "Código OAuth inválido" }, { status: 400 }),
      ),
    );

    const response = await callbackPost(
      new Request("http://localhost/api/platform/instagram/callback", {
        method: "POST",
        body: JSON.stringify({ code: "invalid-code", state: "client-id" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Código OAuth inválido" });
  });
});
