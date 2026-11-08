import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cookieSpies = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieSpies),
}));

import { POST as cancelPost } from "@/app/api/subscription/cancel/route";
import { POST as checkoutPost } from "@/app/api/subscription/create-checkout/route";
import { GET as currentGet } from "@/app/api/subscription/current/route";

const subscription = {
  plan: "STARTER",
  subscriptionStatus: "active",
  currentPeriodEnd: "2026-12-01T00:00:00.000Z",
  stripeCustomerId: "cus_123",
  stripeSubscriptionId: "sub_123",
};

describe("Subscription BFF routes", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.test";
    cookieSpies.get.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("forwards GET /subscription/current with Bearer token", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(subscription));
    vi.stubGlobal("fetch", fetchMock);

    const response = await currentGet();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/subscription/current",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
        }),
      }),
    );
    expect(await response.json()).toEqual(subscription);
  });

  it("forwards only documented checkout fields", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          sessionId: "cs_123",
          url: "https://checkout.stripe.test/cs_123",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await checkoutPost(
      new Request("http://localhost/api/subscription/create-checkout", {
        method: "POST",
        body: JSON.stringify({
          plan: "PRO",
          extra: "drop-me",
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/subscription/create-checkout",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
        }),
        body: JSON.stringify({ plan: "PRO" }),
      }),
    );
    expect(response.status).toBe(200);
  });

  it("forwards POST /subscription/cancel", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ subscriptionStatus: "canceled" }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await cancelPost();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/subscription/cancel",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-value",
        }),
      }),
    );
    expect(await response.json()).toEqual({ subscriptionStatus: "canceled" });
  });

  it.each([
    ["current", () => currentGet()],
    [
      "checkout",
      () =>
        checkoutPost(
          new Request("http://localhost/api/subscription/create-checkout", {
            method: "POST",
            body: JSON.stringify({ plan: "PRO" }),
          }),
        ),
    ],
    ["cancel", () => cancelPost()],
  ])("rejects %s without cookie", async (_label, run) => {
    cookieSpies.get.mockReturnValue(undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await run();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Não autenticado." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("preserves backend error status on checkout", async () => {
    cookieSpies.get.mockReturnValue({ value: "jwt-value" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        Response.json({ message: "Plano inválido." }, { status: 400 }),
      ),
    );

    const response = await checkoutPost(
      new Request("http://localhost/api/subscription/create-checkout", {
        method: "POST",
        body: JSON.stringify({ plan: "PRO" }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Plano inválido." });
  });
});
